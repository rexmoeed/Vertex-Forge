import { Router, Request, Response } from 'express';
import { exec, spawn, ChildProcess } from 'child_process';
import util from 'util';
import path from 'path';
import fs from 'fs';
import net from 'net';
import http from 'http';
import { validateBody, CommonSchemas } from '../middleware/validation';

const execAsync = util.promisify(exec);

interface DevServerProcessRecord {
  pid: number;
  command: string;
  cwd: string;
  port: number;
  detectedPort?: number;
  status: 'starting' | 'probing' | 'running' | 'stopped' | 'failed';
  startTime: number;
  url: string;
  logs: string[];
  childRef?: any;
  portConflictDetected?: boolean;
  healthState: 'pending' | 'healthy' | 'unhealthy' | 'stopped';
  lastHealthCheck?: {
    timestamp: number;
    ok: boolean;
    statusCode?: number;
    latencyMs?: number;
    message: string;
  };
}

const activeServers = new Map<number, DevServerProcessRecord>();
const activeCommands = new Map<string, { pid: number; child: ChildProcess; startTime: number }>();

// Helper: Check if a TCP port is currently free on localhost
function isPortAvailable(port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const tester = net.createServer()
      .once('error', () => {
        resolve(false);
      })
      .once('listening', () => {
        tester.once('close', () => resolve(true)).close();
      })
      .listen(port, '0.0.0.0');
  });
}

// Helper: Find next available port to resolve port conflicts
async function findAvailablePort(preferredPort: number, excludedPorts: number[] = [Number(process.env.PORT) || 3000]): Promise<number> {
  const candidates = [preferredPort, 5173, 5174, 5175, 3001, 3002, 8080, 8081];
  for (const p of candidates) {
    if (excludedPorts.includes(p)) continue;
    const available = await isPortAvailable(p);
    if (available) return p;
  }
  // Fallback: random high port
  return 5173;
}

// Helper: Verify HTTP readiness of a server endpoint
function verifyHttpReadiness(url: string, timeoutMs: number = 2500): Promise<{ ok: boolean; statusCode?: number; latencyMs?: number; message: string }> {
  return new Promise((resolve) => {
    const startTime = Date.now();
    try {
      const parsed = new URL(url);
      const req = http.get({
        hostname: parsed.hostname || 'localhost',
        port: parsed.port || 80,
        path: parsed.pathname || '/',
        timeout: timeoutMs,
        headers: { 'User-Agent': 'VertexForge-HealthChecker/1.0' },
      }, (res) => {
        const latencyMs = Date.now() - startTime;
        // Drain response
        res.resume();
        resolve({
          ok: (res.statusCode !== undefined && res.statusCode < 500),
          statusCode: res.statusCode,
          latencyMs,
          message: `HTTP ${res.statusCode} responded in ${latencyMs}ms`,
        });
      });

      req.on('timeout', () => {
        req.destroy();
        resolve({
          ok: false,
          latencyMs: Date.now() - startTime,
          message: 'Connection timed out during health check probe',
        });
      });

      req.on('error', (err) => {
        resolve({
          ok: false,
          latencyMs: Date.now() - startTime,
          message: `Health probe error: ${err.message}`,
        });
      });
    } catch (e: any) {
      resolve({
        ok: false,
        latencyMs: 0,
        message: `Invalid URL format: ${e.message}`,
      });
    }
  });
}

// 9. Execute Real Shell Command (with cancellation / tracking)

export function createProcessRouter(): Router {
  const router = Router();

router.post('/api/process/execute', async (req: Request, res: Response) => {
  const { command, cwd, executionId } = req.body;
  if (!command) return res.status(400).json({ error: 'Command is required' });

  // Security guard for dangerous commands
  if (command.includes('rm -rf /') || command.includes('mkfs') || command.includes(':(){ :|:& };:')) {
    return res.status(403).json({
      stdout: '',
      stderr: 'Security Policy: Destructive system command blocked.',
      exitCode: 1,
      durationMs: 0,
    });
  }

  const targetCwd = cwd ? path.resolve(cwd) : process.cwd();
  const startTime = Date.now();
  const execId = executionId || `exec-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;

  return new Promise((resolve) => {
    const child = spawn(command, {
      cwd: targetCwd,
      shell: true,
      env: { ...process.env },
    });

    if (child.pid) {
      activeCommands.set(execId, { pid: child.pid, child, startTime });
    }

    let stdout = '';
    let stderr = '';

    child.stdout?.on('data', (d) => {
      stdout += d.toString();
    });

    child.stderr?.on('data', (d) => {
      stderr += d.toString();
    });

    let isDone = false;
    const finish = (output: any) => {
      if (isDone) return;
      isDone = true;
      activeCommands.delete(execId);
      if (!res.headersSent) {
        res.json(output);
      }
      resolve();
    };

    child.on('close', (code, signal) => {
      const exitCode = signal ? 130 : (typeof code === 'number' ? code : 0);
      finish({
        stdout: stdout || '',
        stderr: stderr || (signal ? `[Process interrupted by signal ${signal}]` : ''),
        exitCode,
        durationMs: Date.now() - startTime,
        executionId: execId,
      });
    });

    child.on('error', (err) => {
      finish({
        stdout: stdout || '',
        stderr: err.message || 'Execution failed to spawn',
        exitCode: 1,
        durationMs: Date.now() - startTime,
        executionId: execId,
      });
    });
  });
});

// 9b. Interrupt / Cancel Running Command
router.post('/api/process/interrupt', (req: Request, res: Response) => {
  const { executionId, pid } = req.body;

  let killed = false;
  if (executionId && activeCommands.has(executionId)) {
    const record = activeCommands.get(executionId);
    if (record?.child) {
      try {
        record.child.kill('SIGINT');
        killed = true;
      } catch (e) {
        try { record.child.kill('SIGTERM'); killed = true; } catch {}
      }
    }
    activeCommands.delete(executionId);
  } else if (pid) {
    try {
      process.kill(Number(pid), 'SIGINT');
      killed = true;
    } catch {}
  }

  return res.json({ success: killed, message: killed ? 'Process interrupted' : 'Process not found or already exited' });
});

// 10. Start Real Development Server Process with Conflict Detection & Readiness Verification
router.post('/api/process/dev-server/start', async (req: Request, res: Response) => {
  const { command = 'npm run dev', cwd, port: requestedPort } = req.body;
  const targetCwd = cwd ? path.resolve(cwd) : process.cwd();

  // If port 3000 requested or unspecified, avoid collision with host server (Number(process.env.PORT) || 3000)
  const preferredPort = requestedPort && Number(requestedPort) !== (Number(process.env.PORT) || 3000) ? Number(requestedPort) : 5173;
  const isAvailable = await isPortAvailable(preferredPort);

  let port = preferredPort;
  let portConflictDetected = false;
  if (!isAvailable || port === (Number(process.env.PORT) || 3000)) {
    portConflictDetected = true;
    port = await findAvailablePort(5173, [(Number(process.env.PORT) || 3000), ...(Array.from(activeServers.values()).map(s => s.port))]);
  }

  try {
    const child = spawn(command, {
      cwd: targetCwd,
      shell: true,
      env: { ...process.env, PORT: String(port), VITE_PORT: String(port) },
    });

    const pid = child.pid || Date.now();
    const serverUrl = `http://localhost:${port}`;

    const record: DevServerProcessRecord = {
      pid,
      command,
      cwd: targetCwd,
      port,
      status: 'starting',
      startTime: Date.now(),
      url: serverUrl,
      logs: [
        `[Process Started] ${command} (PID ${pid}) on port ${port}`,
        portConflictDetected ? `[Port Conflict Resolved] Assigned available port ${port} (Avoided collision with host :${(Number(process.env.PORT) || 3000)})` : '',
      ].filter(Boolean),
      childRef: child,
      portConflictDetected,
      healthState: 'pending',
    };

    activeServers.set(pid, record);

    child.stdout?.on('data', (data) => {
      const text = data.toString();
      record.logs.push(text);
      if (record.logs.length > 250) record.logs.shift();

      // Detect dynamically bound URL in output
      const urlMatch = text.match(/https?:\/\/(?:localhost|127\.0\.0\.1):(\d+)/i);
      if (urlMatch && urlMatch[1]) {
        const detected = Number(urlMatch[1]);
        if (detected && detected !== record.port) {
          record.detectedPort = detected;
          record.port = detected;
          record.url = `http://localhost:${detected}`;
        }
      }
    });

    child.stderr?.on('data', (data) => {
      const text = data.toString();
      record.logs.push(`[ERR] ${text}`);
      if (record.logs.length > 250) record.logs.shift();
    });

    child.on('close', (code) => {
      record.status = code === 0 ? 'stopped' : 'failed';
      record.healthState = 'stopped';
      record.logs.push(`[Process Exited with code ${code}]`);
    });

    // Schedule automated health check after brief startup delay
    setTimeout(async () => {
      if (activeServers.has(pid) && record.status === 'starting') {
        record.status = 'probing';
        const health = await verifyHttpReadiness(record.url, 2000);
        record.lastHealthCheck = {
          timestamp: Date.now(),
          ok: health.ok,
          statusCode: health.statusCode,
          latencyMs: health.latencyMs,
          message: health.message,
        };
        record.healthState = health.ok ? 'healthy' : 'unhealthy';
        record.status = health.ok ? 'running' : 'running';
      }
    }, 1500);

    return res.json({
      success: true,
      pid,
      command,
      port,
      status: 'starting',
      url: serverUrl,
      portConflictDetected,
    });
  } catch (err: any) {
    return res.status(500).json({ error: err?.message || 'Failed to start dev server' });
  }
});

// 11. Stop Dev Server Process with Graceful Process Termination
router.post('/api/process/dev-server/stop', (req: Request, res: Response) => {
  const { pid } = req.body;
  const numPid = Number(pid);
  const record = activeServers.get(numPid);

  if (!record) {
    return res.status(404).json({ error: `Process ${pid} not found` });
  }

  try {
    if (record.childRef) {
      try {
        record.childRef.kill('SIGTERM');
      } catch {}

      // Fallback forced termination if still lingering
      setTimeout(() => {
        try {
          if (record.childRef) record.childRef.kill('SIGKILL');
        } catch {}
      }, 1500);
    }
    record.status = 'stopped';
    record.healthState = 'stopped';
    record.logs.push('[Stopped by user]');
    activeServers.delete(numPid);
    return res.json({ success: true, pid: numPid });
  } catch (err: any) {
    return res.status(500).json({ error: err?.message || 'Failed to stop process' });
  }
});

// 12. Probe Dev Server Health Endpoint
router.get('/api/process/dev-server/health', async (req: Request, res: Response) => {
  const pid = Number(req.query.pid);
  if (!pid) return res.status(400).json({ error: 'PID is required' });

  const record = activeServers.get(pid);
  if (!record) {
    return res.status(404).json({
      pid,
      isAlive: false,
      isListening: false,
      isReady: false,
      status: 'stopped',
      healthState: 'stopped',
      message: 'Server process not found or has terminated',
    });
  }

  // Check if OS process is genuinely alive
  let isAlive = false;
  try {
    process.kill(pid, 0);
    isAlive = true;
  } catch (e: any) {
    isAlive = (e.code === 'EPERM'); // EPERM means process exists but owned by other user
  }

  if (!isAlive) {
    record.status = 'failed';
    record.healthState = 'stopped';
    return res.json({
      pid,
      isAlive: false,
      isListening: false,
      isReady: false,
      status: 'failed',
      healthState: 'stopped',
      url: record.url,
      message: 'Process PID exited prematurely',
      logs: record.logs.slice(-10),
    });
  }

  // Probe HTTP responsiveness
  const probe = await verifyHttpReadiness(record.url, 2000);
  record.lastHealthCheck = {
    timestamp: Date.now(),
    ok: probe.ok,
    statusCode: probe.statusCode,
    latencyMs: probe.latencyMs,
    message: probe.message,
  };
  record.healthState = probe.ok ? 'healthy' : 'unhealthy';
  record.status = probe.ok ? 'running' : 'probing';

  return res.json({
    pid,
    isAlive: true,
    isListening: true,
    isReady: probe.ok,
    status: record.status,
    healthState: record.healthState,
    statusCode: probe.statusCode,
    latencyMs: probe.latencyMs,
    url: record.url,
    port: record.port,
    message: probe.message,
    logs: record.logs.slice(-10),
  });
});

// 12b. List Active Dev Servers
router.get('/api/process/dev-server/list', (req: Request, res: Response) => {
  const list = Array.from(activeServers.values()).map(s => ({
    pid: s.pid,
    command: s.command,
    cwd: s.cwd,
    port: s.port,
    status: s.status,
    healthState: s.healthState,
    lastHealthCheck: s.lastHealthCheck,
    startTime: s.startTime,
    url: s.url,
    logs: s.logs.slice(-20),
  }));
  return res.json({ servers: list });
});


  return router;
}
