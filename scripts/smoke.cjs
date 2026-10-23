const http = require('http');
const { spawn } = require('child_process');

console.log('[SmokeTest] Launching Vertex Forge server in test mode...');

const PORT = 3987;
const env = {
  ...process.env,
  PORT: String(PORT),
  NODE_ENV: 'production',
  GEMINI_API_KEY: process.env.GEMINI_API_KEY || 'test-mock-key-12345',
};

const serverProc = spawn('npx', ['tsx', 'server.ts'], {
  env,
  shell: true,
  stdio: ['ignore', 'pipe', 'pipe'],
});

serverProc.stdout.on('data', d => {
  const line = d.toString();
  if (line.includes('running') || line.includes('ready') || line.includes('http')) {
    console.log('[ServerOutput]', line.trim());
  }
});

serverProc.stderr.on('data', d => {
  console.error('[ServerStderr]', d.toString().trim());
});

let attempts = 0;
const maxAttempts = 20;

function checkHealth() {
  attempts++;
  console.log(`[SmokeTest] Probing http://localhost:${PORT}/api/health (attempt ${attempts}/${maxAttempts})...`);

  const req = http.get(`http://localhost:${PORT}/api/health`, res => {
    let body = '';
    res.on('data', chunk => { body += chunk; });
    res.on('end', () => {
      try {
        const data = JSON.parse(body);
        if (data.status === 'ok') {
          console.log('[SmokeTest] SUCCESS: Healthcheck responded with 200 OK:', data);
          cleanup(0);
        } else {
          console.error('[SmokeTest] Unexpected response payload:', data);
          cleanup(1);
        }
      } catch (e) {
        console.error('[SmokeTest] Failed to parse healthcheck JSON:', body);
        cleanup(1);
      }
    });
  });

  req.on('error', err => {
    if (attempts < maxAttempts) {
      setTimeout(checkHealth, 800);
    } else {
      console.error('[SmokeTest] Healthcheck failed after max attempts:', err.message);
      cleanup(1);
    }
  });

  req.setTimeout(2000, () => {
    req.destroy();
  });
}

function cleanup(exitCode) {
  try {
    serverProc.kill('SIGTERM');
  } catch {}
  setTimeout(() => {
    try {
      serverProc.kill('SIGKILL');
    } catch {}
    process.exit(exitCode);
  }, 500);
}

setTimeout(checkHealth, 1500);
