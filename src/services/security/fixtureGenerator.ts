/**
 * Security Test Fixture Generator
 * Creates deliberately vulnerable sample projects for auditor verification.
 */
import path from 'path';
import fsPromises from 'fs/promises';

export async function createVulnerableFixture(baseDir: string = process.cwd()): Promise<string> {
    const fixtureDir = path.join(baseDir, 'sample-projects', 'security-fixtures');
    await fsPromises.mkdir(fixtureDir, { recursive: true });

    // 1. package.json with real vulnerable packages
    const fixturePkg = {
      name: 'vulnerable-fixture-app',
      version: '1.0.0',
      description: 'Deliberately vulnerable test fixture for Vertex Forge Security Auditor',
      scripts: {
        start: 'node server.js',
      },
      dependencies: {
        'source-map-js': '1.0.0',
        lodash: '4.17.15',
        axios: '0.21.1',
        express: '4.18.2',
      },
    };
    await fsPromises.writeFile(
      path.join(fixtureDir, 'package.json'),
      JSON.stringify(fixturePkg, null, 2),
      'utf-8'
    );

    // 2. server.js containing deliberate vulnerabilities
    const serverJsContent = `// Deliberately Vulnerable Server Fixture for Security Auditor Verification
const express = require('express');
const cors = require('cors');
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(express.json());

// 1. COMMITTED SECRETS (AWS, OpenAI, Google)
const AWS_KEY = '${['AKIA', '1234', '5678', '90AB', 'CDEF'].join('')}';
const OPENAI_KEY = '${['sk-proj', 'deliberate-vulnerable-key-token-1234567890abcdef1234567890'].join('-')}';
const GOOGLE_KEY = '${['AIzaSyD', 'DeliberatelyVulnerableKey123456'].join('-')}';

// 2. INSECURE CORS WITH CREDENTIALS
app.use(cors({ origin: '*', credentials: true }));

// 3. DANGEROUS SHELL EXECUTION (COMMAND INJECTION)
app.post('/api/run-diagnostic', (req, res) => {
  const host = req.body.host;
  exec(\`ping -c 1 \${host}\`, (err, stdout) => {
    res.json({ output: stdout });
  });
});

// 4. PATH TRAVERSAL RISK
app.get('/api/view-report', (req, res) => {
  const file = req.query.filename;
  const filePath = path.join(__dirname, 'reports', file);
  fs.readFile(filePath, 'utf-8', (err, data) => {
    res.send(data);
  });
});

// 5. CODE INJECTION (eval)
app.post('/api/calculate', (req, res) => {
  const expr = req.body.expression;
  const result = eval(expr);
  res.json({ result });
});

// 6. SQL INJECTION CONCATENATION
app.get('/api/users/search', (req, res) => {
  const query = \`SELECT * FROM users WHERE username = '\${req.query.user}'\`;
  res.json({ sql: query });
});

// 7. UNPROTECTED ADMINISTRATIVE ROUTE
app.post('/api/admin/purge-database', async (req, res) => {
  res.json({ status: 'database purged' });
});

// 8. HARDCODED CREDENTIAL CHECK
app.post('/api/login', (req, res) => {
  if (req.body.password === 'supersecretadmin123') {
    res.json({ auth: true });
  } else {
    res.status(401).json({ auth: false });
  }
});

// 9. DISABLED TLS VERIFICATION
const httpsAgent = {
  rejectUnauthorized: false
};

// 10. UNRESTRICTED PROCESS.ENV LOGGING
console.log(process.env);

app.listen(8080);
`;
    await fsPromises.writeFile(path.join(fixtureDir, 'server.js'), serverJsContent, 'utf-8');

    // 3. client.tsx with XSS and client-side secret exposure
    const clientTsxContent = `import React from 'react';

export const VulnerableClient: React.FC = () => {
  // Sensitive secret with VITE_ prefix exposed to public client bundle
  const clientSecret = import.meta.env.VITE_API_SECRET || 'secret-token';
  const rawHtml = '<img src=x onerror=alert(1)>';

  return (
    <div>
      <h1>Fixture Client</h1>
      {/* UNSANITIZED DANGEROUSLY SET INNER HTML */}
      <div dangerouslySetInnerHTML={{ __html: rawHtml }} />
    </div>
  );
};
`;
    await fsPromises.writeFile(path.join(fixtureDir, 'client.tsx'), clientTsxContent, 'utf-8');

    // 4. electron-main.js with insecure Electron BrowserWindow settings
    const electronContent = `const { app, BrowserWindow, ipcMain } = require('electron');
const { exec } = require('child_process');

function createWindow() {
  const win = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      webSecurity: false
    }
  });

  win.loadURL('http://localhost:3000');
}

// Insecure IPC bridge executing arbitrary commands
ipcMain.on('execute-shell', (event, cmd) => {
  exec(cmd);
});

app.whenReady().then(createWindow);
`;
    await fsPromises.writeFile(path.join(fixtureDir, 'electron-main.js'), electronContent, 'utf-8');

    return fixtureDir;
  }

  // ==========================================
