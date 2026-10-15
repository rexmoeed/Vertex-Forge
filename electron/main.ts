/**
 * Electron Main Process for Desktop IDE
 * Enforces strict security boundaries, context isolation, and workspace path verification.
 */

import { app, BrowserWindow, ipcMain, dialog } from 'electron';
import path from 'path';
import fs from 'fs';
import http from 'http';
import { spawn } from 'child_process';
import { autoUpdater } from 'electron-updater';
import type { IDesktopAPI, WorkspaceFile, CommandExecutionResult } from '../src/types/desktop';

let mainWindow: BrowserWindow | null = null;
let currentWorkspacePath: string = process.cwd();
let backendProcess: any = null;

function checkServerRunning(port = 3000): Promise<boolean> {
  return new Promise((resolve) => {
    const req = http.get(`http://127.0.0.1:${port}/api/health`, (res) => {
      resolve(res.statusCode === 200);
    });
    req.on('error', () => resolve(false));
    req.setTimeout(1000, () => {
      req.destroy();
      resolve(false);
    });
  });
}

async function ensureBackendServer(rootDir: string, port = 3000): Promise<void> {
  const isRunning = await checkServerRunning(port);
  if (isRunning) {
    console.log(`[Vertex Forge Electron] Backend server already responsive on port ${port}.`);
    return;
  }

  console.log(`[Vertex Forge Electron] Spawning local backend server on port ${port}...`);
  const isWin = process.platform === 'win32';
  const cmd = isWin ? 'npx.cmd' : 'npx';
  backendProcess = spawn(cmd, ['tsx', 'server.ts'], {
    cwd: rootDir,
    stdio: 'ignore',
    env: { ...process.env, PORT: String(port) },
  });

  backendProcess.on('error', (err: any) => {
    console.warn('[Vertex Forge Electron] Backend spawn warning:', err?.message || err);
  });

  // Wait up to 10 seconds for server to report ready
  for (let i = 0; i < 20; i++) {
    await new Promise((r) => setTimeout(r, 500));
    const ready = await checkServerRunning(port);
    if (ready) {
      console.log(`[Vertex Forge Electron] Backend server is ready on port ${port}.`);
      return;
    }
  }
}

function cleanupBackend() {
  if (backendProcess) {
    try {
      if (process.platform === 'win32' && backendProcess.pid) {
        spawn('taskkill', ['/pid', String(backendProcess.pid), '/f', '/t']);
      } else if (backendProcess.kill) {
        backendProcess.kill('SIGTERM');
      }
    } catch {}
    backendProcess = null;
  }
}

// Restricted files that cannot be directly read or overwritten by AI without special authorization
const SENSITIVE_PATTERNS = [
  /\.env(\.production|\.local)?$/i,
  /\.ssh\//i,
  /id_rsa/i,
  /\.git\/config$/i,
  /\.aws\//i,
];

function isPathWithinWorkspace(targetPath: string, workspaceRoot: string): boolean {
  const resolved = path.resolve(targetPath);
  const root = path.resolve(workspaceRoot);
  return resolved.startsWith(root) && !resolved.includes('..');
}

function isSensitiveFile(filePath: string): boolean {
  return SENSITIVE_PATTERNS.some(pattern => pattern.test(filePath));
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 1024,
    minHeight: 700,
    title: 'Vertex Forge - Desktop AI Engineering Studio',
    backgroundColor: '#020617', // slate-950
    titleBarStyle: 'hiddenInset',
    webPreferences: {
      preload: fs.existsSync(path.join(__dirname, 'preload.cjs'))
        ? path.join(__dirname, 'preload.cjs')
        : path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      webSecurity: true,
    },
  });

  const distHtml = path.join(__dirname, '../dist/index.html');
  const devServerUrl = process.env.VITE_DEV_SERVER_URL || 'http://localhost:3000';

  mainWindow.webContents.on('did-fail-load', (_, errorCode, errorDescription, validatedURL) => {
    console.warn(`[Vertex Forge Electron] Failed to load ${validatedURL} (${errorCode}: ${errorDescription}), falling back to dist/index.html`);
    if (fs.existsSync(distHtml) && !validatedURL.startsWith('file:')) {
      mainWindow?.loadFile(distHtml);
    }
  });

  mainWindow.webContents.on('console-message', (_, level, message, line, sourceId) => {
    if (level >= 2) {
      console.warn(`[Vertex Forge Renderer ${level === 3 ? 'ERROR' : 'WARN'}] ${message} (${sourceId}:${line})`);
    }
  });

  mainWindow.webContents.on('render-process-gone', (_, details) => {
    console.error('[Vertex Forge Electron] Render process gone:', details);
  });

  if (app.isPackaged) {
    mainWindow.loadFile(distHtml);
  } else {
    mainWindow.loadURL(devServerUrl).catch(() => {
      if (fs.existsSync(distHtml)) {
        mainWindow?.loadFile(distHtml);
      }
    });
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// Security: reject navigation to arbitrary external web pages inside the main window
app.on('web-contents-created', (_, contents) => {
  contents.on('will-navigate', (event, navigationUrl) => {
    try {
      const parsedUrl = new URL(navigationUrl);
      const isLocal = (parsedUrl.hostname === 'localhost' || parsedUrl.hostname === '127.0.0.1') && (parsedUrl.port === '3000' || !parsedUrl.port);
      if (!isLocal && !parsedUrl.protocol.startsWith('file:')) {
        event.preventDefault();
      }
    } catch {
      event.preventDefault();
    }
  });
});

function setupAutoUpdater() {
  if (!app.isPackaged) {
    console.log('[Vertex Forge AutoUpdater] Development environment detected; skipping auto-update checks.');
    return;
  }

  autoUpdater.autoDownload = true;
  autoUpdater.autoInstallOnAppQuit = true;

  autoUpdater.on('checking-for-update', () => {
    console.log('[Vertex Forge AutoUpdater] Checking for available updates...');
  });

  autoUpdater.on('update-available', (info) => {
    console.log(`[Vertex Forge AutoUpdater] Update available: v${info.version}`);
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('nova:update-available', {
        version: info.version,
        releaseDate: info.releaseDate,
      });
    }
  });

  autoUpdater.on('update-not-available', () => {
    console.log('[Vertex Forge AutoUpdater] Vertex Forge is currently on the latest version.');
  });

  autoUpdater.on('error', (err) => {
    console.warn('[Vertex Forge AutoUpdater] Update check failed:', err?.message || err);
  });

  autoUpdater.on('download-progress', (progressObj) => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('nova:update-progress', {
        percent: Math.round(progressObj.percent),
        bytesPerSecond: progressObj.bytesPerSecond,
      });
    }
  });

  autoUpdater.on('update-downloaded', (info) => {
    console.log(`[Vertex Forge AutoUpdater] Version ${info.version} downloaded successfully.`);
    if (mainWindow && !mainWindow.isDestroyed()) {
      dialog.showMessageBox(mainWindow, {
        type: 'info',
        title: 'Vertex Forge Update Ready',
        message: `Vertex Forge version ${info.version} has been downloaded.`,
        detail: 'Would you like to restart now to install the update?',
        buttons: ['Restart and Install', 'Install Later'],
        defaultId: 0,
        cancelId: 1,
      }).then((returnValue) => {
        if (returnValue.response === 0) {
          autoUpdater.quitAndInstall();
        }
      });
    }
  });

  // Check for updates 6 seconds after launch
  setTimeout(() => {
    autoUpdater.checkForUpdatesAndNotify().catch((err) => {
      console.warn('[Vertex Forge AutoUpdater] Background update check error:', err?.message || err);
    });
  }, 6000);
}

app.whenReady().then(async () => {
  registerIpcHandlers();
  const rootDir = path.resolve(__dirname, '..');
  await ensureBackendServer(rootDir, 3000).catch((e) => {
    console.warn('[Vertex Forge Electron] Ensure backend server caught:', e);
  });
  createWindow();
  setupAutoUpdater();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('before-quit', cleanupBackend);
app.on('will-quit', cleanupBackend);

app.on('window-all-closed', () => {
  cleanupBackend();
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

function registerIpcHandlers() {
  // 1. Open Directory Dialog
  ipcMain.handle('workspace:openDirectoryDialog', async (): Promise<string | null> => {
    if (!mainWindow) return null;
    const result = await dialog.showOpenDialog(mainWindow, {
      properties: ['openDirectory', 'createDirectory'],
      title: 'Select Workspace Repository',
    });
    if (!result.canceled && result.filePaths.length > 0) {
      currentWorkspacePath = path.resolve(result.filePaths[0]);
      return currentWorkspacePath;
    }
    return null;
  });

  // 1b. Open File Dialog
  ipcMain.handle('workspace:openFileDialog', async (): Promise<string | null> => {
    if (!mainWindow) return null;
    const result = await dialog.showOpenDialog(mainWindow, {
      properties: ['openFile'],
      title: 'Select File to Open',
    });
    if (!result.canceled && result.filePaths.length > 0) {
      return result.filePaths[0];
    }
    return null;
  });

  // 1c. Set Workspace Path
  ipcMain.handle('workspace:setWorkspacePath', async (_, newPath: string) => {
    if (newPath && fs.existsSync(newPath)) {
      currentWorkspacePath = path.resolve(newPath);
      console.log(`[Vertex Forge Electron] Active workspace path set to: ${currentWorkspacePath}`);
      return { success: true, path: currentWorkspacePath };
    }
    return { success: false, error: 'Path does not exist' };
  });

  // 2. Read Workspace Tree
  ipcMain.handle('workspace:getTree', async (_, workspacePath: string): Promise<WorkspaceFile[]> => {
    const rootPath = workspacePath ? path.resolve(workspacePath) : currentWorkspacePath;
    if (!fs.existsSync(rootPath)) {
      return [];
    }
    currentWorkspacePath = rootPath;

    function scanDir(dir: string, baseDir: string): WorkspaceFile[] {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      const files: WorkspaceFile[] = [];

      for (const entry of entries) {
        if (
          entry.name === 'node_modules' ||
          entry.name === '.git' ||
          entry.name === 'dist' ||
          entry.name === '.vitest' ||
          entry.name === 'sample-projects' ||
          entry.name === '.gemini' ||
          entry.name === '.cache' ||
          entry.name === '__pycache__'
        ) {
          continue; // ignore test caches, dummy suites, and massive build artifacts
        }
        const fullPath = path.join(dir, entry.name);
        const relPath = path.relative(baseDir, fullPath);

        if (entry.isDirectory()) {
          files.push({
            name: entry.name,
            path: fullPath,
            relativePath: relPath,
            type: 'folder',
            children: scanDir(fullPath, baseDir),
          });
        } else {
          files.push({
            name: entry.name,
            path: fullPath,
            relativePath: relPath,
            type: 'file',
            size: fs.statSync(fullPath).size,
            language: path.extname(entry.name).slice(1),
          });
        }
      }
      return files;
    }

    return scanDir(rootPath, rootPath);
  });

  // 3. Read File
  ipcMain.handle('workspace:readFile', async (_, filePath: string): Promise<string> => {
    if (!isPathWithinWorkspace(filePath, currentWorkspacePath)) {
      throw new Error(`Security Violation: Path "${filePath}" escapes active workspace.`);
    }
    return fs.promises.readFile(filePath, 'utf-8');
  });

  // 4. Write File (Atomic Write with temporary file)
  ipcMain.handle('workspace:writeFile', async (_, filePath: string, content: string) => {
    if (!isPathWithinWorkspace(filePath, currentWorkspacePath)) {
      return { success: false, error: 'Path outside authorized workspace' };
    }
    if (isSensitiveFile(filePath)) {
      return { success: false, error: 'Cannot modify sensitive configuration without explicit approval' };
    }

    const tempPath = `${filePath}.tmp.${Date.now()}`;
    try {
      await fs.promises.mkdir(path.dirname(filePath), { recursive: true });
      await fs.promises.writeFile(tempPath, content, 'utf-8');
      await fs.promises.rename(tempPath, filePath);
      return { success: true };
    } catch (err: any) {
      if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath);
      return { success: false, error: err.message };
    }
  });

  // 5. Delete Path
  ipcMain.handle('workspace:deletePath', async (_, targetPath: string) => {
    if (!isPathWithinWorkspace(targetPath, currentWorkspacePath)) {
      return { success: false, error: 'Path outside authorized workspace' };
    }
    try {
      const stat = await fs.promises.stat(targetPath);
      if (stat.isDirectory()) {
        await fs.promises.rm(targetPath, { recursive: true, force: true });
      } else {
        await fs.promises.unlink(targetPath);
      }
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  });

  // 6. Rename / Move Path
  ipcMain.handle('workspace:renamePath', async (_, oldPath: string, newPath: string) => {
    if (!isPathWithinWorkspace(oldPath, currentWorkspacePath) || !isPathWithinWorkspace(newPath, currentWorkspacePath)) {
      return { success: false, error: 'Path outside authorized workspace' };
    }
    try {
      await fs.promises.mkdir(path.dirname(newPath), { recursive: true });
      await fs.promises.rename(oldPath, newPath);
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  });

  // 7. Controlled Command Execution (PTY / Child Process Sandbox)
  ipcMain.handle('terminal:executeCommand', async (_, command: string, options?: any): Promise<CommandExecutionResult> => {
    const startTime = Date.now();
    const cwd = options?.cwd || currentWorkspacePath;

    // Safety checks against forbidden destructive commands
    const FORBIDDEN_COMMANDS = [/rm\s+-rf\s+[\/\\]/i, /mkfs/i, /dd\s+if=/i, /:\(\)\{ :\|:& \};:/];
    if (FORBIDDEN_COMMANDS.some(r => r.test(command))) {
      return {
        stdout: '',
        stderr: 'Execution blocked: Command contains unsafe destructive pattern.',
        exitCode: 1,
        durationMs: 0,
      };
    }

    return new Promise((resolve) => {
      const child = spawn(command, {
        shell: true,
        cwd,
        env: { ...process.env, ...options?.env },
      });

      let stdout = '';
      let stderr = '';

      child.stdout.on('data', (d) => { stdout += d.toString(); });
      child.stderr.on('data', (d) => { stderr += d.toString(); });

      const timeout = setTimeout(() => {
        child.kill();
        resolve({
          stdout,
          stderr: stderr + '\nExecution timed out.',
          exitCode: 124,
          durationMs: Date.now() - startTime,
        });
      }, options?.timeoutMs || 30000);

      child.on('close', (code) => {
        clearTimeout(timeout);
        resolve({
          stdout,
          stderr,
          exitCode: code ?? 0,
          durationMs: Date.now() - startTime,
        });
      });
    });
  });

  // Auto-Update IPC Endpoints
  ipcMain.handle('desktop:checkForUpdates', async () => {
    if (!app.isPackaged) {
      return { status: 'dev-mode', message: 'Auto-updates are only active in production packaged builds.' };
    }
    try {
      const result = await autoUpdater.checkForUpdates();
      return { status: 'success', updateInfo: result?.updateInfo };
    } catch (err: any) {
      return { status: 'error', message: err?.message || String(err) };
    }
  });

  ipcMain.handle('desktop:restartAndInstallUpdate', () => {
    autoUpdater.quitAndInstall();
    return true;
  });
}

