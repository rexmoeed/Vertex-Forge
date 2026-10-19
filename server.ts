/**
 * Vertex Forge Backend Server Entry Point
 * Layered Architecture: Transport, Modular Routes & Vite Development Server
 */

import http from 'http';
import path from 'path';
import fsPromises from 'fs/promises';
import { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import { createApp } from './server/app';

const PORT = Number(process.env.PORT) || 3000;
const { app } = createApp();

async function startServer() {
  const server = http.createServer(app);

  if (process.env.NODE_ENV === 'production') {
    const express = (await import('express')).default;
    app.use(express.static('dist'));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.resolve('dist', 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);

    // Resilient SPA fallback: Ensure any HTML navigation route renders index.html transformed by Vite
    app.use('*', async (req: Request, res: Response, next) => {
      const url = req.originalUrl;
      try {
        let template = await fsPromises.readFile(path.resolve('index.html'), 'utf-8');
        template = await vite.transformIndexHtml(url, template);
        res.status(200).set({ 'Content-Type': 'text/html' }).end(template);
      } catch (e: any) {
        if (vite && (vite as any).ssrFixStacktrace) {
          (vite as any).ssrFixStacktrace(e);
        }
        next(e);
      }
    });
  }

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`[VertexForge] Server listening on http://0.0.0.0:${PORT}`);
    console.log(`[VertexForge] Local access: http://localhost:${PORT}`);
  });

  server.on('error', (err: any) => {
    if (err.code === 'EADDRINUSE') {
      console.error(`\n⚠️  [VertexForge] Port ${PORT} is already in use by another running process!`);
      console.error(`   A previous instance of Vertex Forge is still active.`);
      console.error(`   To free port ${PORT} on Windows, run this in PowerShell:`);
      console.error(`   Get-Process -Id (Get-NetTCPConnection -LocalPort ${PORT}).OwningProcess | Stop-Process -Force\n`);
      process.exit(1);
    } else {
      console.error('[VertexForge] Server error:', err);
      process.exit(1);
    }
  });
}

startServer();
