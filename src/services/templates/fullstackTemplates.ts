import { TemplateDefinition, ScaffoldingContext, PlannedFileItem } from '../../types/scaffolding';
import { generateReadme } from './shared';

// 1. Next.js + Database
export const fullstackNextDb: TemplateDefinition = {
  id: 'fullstack-next-db',
  name: 'Next.js + Database',
  category: 'fullstack',
  description: 'Next.js 15 App Router with Prisma/Drizzle ORM, SQLite/PostgreSQL, and React Server Actions.',
  icon: '⚡',
  badge: 'All-in-One',
  languages: ['TypeScript', 'SQL', 'CSS'],
  frameworks: ['Next.js 15', 'Prisma', 'Tailwind CSS'],
  defaultPackageManager: 'npm',
  supportedPackageManagers: ['npm', 'pnpm', 'yarn', 'bun'],
  defaultArchitecture: 'modular',
  supportedArchitectures: ['modular', 'feature-based'],
  defaultPorts: { dev: 3000 },
  commands: { dev: 'npm run dev', build: 'npm run build', test: 'npm test' },
  envVariables: [{ key: 'DATABASE_URL', description: 'Database Connection', defaultValue: 'file:./dev.db' }],
  compatibleLibraries: [],
  generateManifest: (ctx: ScaffoldingContext): PlannedFileItem[] => [
    {
      id: 'pkg',
      path: 'package.json',
      description: 'Next.js with Database',
      category: 'config',
      content: JSON.stringify({
        name: ctx.projectName.toLowerCase().replace(/[^a-z0-9-]/g, '-'),
        scripts: { dev: 'next dev', build: 'next build', test: 'vitest run' },
        dependencies: { next: '^15.1.0', react: '^19.0.0', 'react-dom': '^19.0.0', '@prisma/client': '^6.0.0' },
        devDependencies: { prisma: '^6.0.0', typescript: '^5.7.0' },
      }, null, 2),
    },
    {
      id: 'schema',
      path: 'prisma/schema.prisma',
      description: 'Prisma database schema',
      category: 'config',
      content: `datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

model Task {
  id        String   @id @default(uuid())
  title     String
  completed Boolean  @default(false)
  createdAt DateTime @default(now())
}
`,
    },
    {
      id: 'page',
      path: 'src/app/page.tsx',
      description: 'Next.js Server Component querying database',
      category: 'source',
      content: `import React from 'react';

export default async function Page() {
  return (
    <div style={{ background: '#090d16', color: '#fff', minHeight: '100vh', padding: '2rem' }}>
      <h1>${ctx.projectName} (Next.js + Prisma)</h1>
      <p>Server Action and Database Ready</p>
    </div>
  );
}
`,
    },
  ],
};

// 2. React + Node.js API
export const fullstackReactExpress: TemplateDefinition = {
  id: 'fullstack-react-express',
  name: 'React + Node.js API',
  category: 'fullstack',
  description: 'Cohesive full-stack application featuring a React 19 Vite client and an Express TypeScript backend.',
  icon: '⚡',
  badge: 'Popular',
  languages: ['TypeScript', 'CSS', 'HTML'],
  frameworks: ['React 19', 'Express', 'Vite', 'Tailwind CSS'],
  defaultPackageManager: 'npm',
  supportedPackageManagers: ['npm', 'pnpm', 'yarn', 'bun'],
  defaultArchitecture: 'modular',
  supportedArchitectures: ['modular', 'feature-based'],
  defaultPorts: { dev: 5173 },
  commands: { dev: 'npm run dev', build: 'npm run build', test: 'npm test' },
  envVariables: [
    { key: 'PORT', description: 'Backend API port', defaultValue: '3001' },
    { key: 'VITE_API_URL', description: 'Client backend URL', defaultValue: 'http://localhost:3001/api' },
  ],
  compatibleLibraries: [],
  generateManifest: (ctx: ScaffoldingContext): PlannedFileItem[] => [
    {
      id: 'pkg',
      path: 'package.json',
      description: 'Fullstack unified manifest',
      category: 'config',
      content: JSON.stringify({
        name: ctx.projectName.toLowerCase().replace(/[^a-z0-9-]/g, '-'),
        scripts: {
          'dev:client': 'vite',
          'dev:server': 'tsx watch server/index.ts',
          dev: 'concurrently "npm:dev:server" "npm:dev:client"',
          build: 'tsc && vite build',
          test: 'vitest run',
        },
        dependencies: { react: '^19.0.0', 'react-dom': '^19.0.0', express: '^4.21.2', cors: '^2.8.5' },
        devDependencies: { concurrently: '^9.1.2', tsx: '^4.19.2', typescript: '^5.7.0', vite: '^6.1.0' },
      }, null, 2),
    },
    {
      id: 'server',
      path: 'server/index.ts',
      description: 'Express server',
      category: 'source',
      content: `import express from 'express';
import cors from 'cors';

const app = express();
app.use(cors());
app.use(express.json());

app.get('/api/health', (req, res) => res.json({ status: 'healthy', service: '${ctx.projectName}' }));

app.listen(3001, () => console.log('[Server] Ready on port 3001'));
`,
    },
    {
      id: 'client',
      path: 'src/App.tsx',
      description: 'React client',
      category: 'source',
      content: `import React from 'react';

export default function App() {
  return (
    <div style={{ background: '#090d16', color: '#fff', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <h1>${ctx.projectName} (Fullstack Client + Server)</h1>
    </div>
  );
}
`,
    },
  ],
};

// 3. React + FastAPI
export const fullstackReactFastAPI: TemplateDefinition = {
  id: 'fullstack-react-fastapi',
  name: 'React + FastAPI',
  category: 'fullstack',
  description: 'Modern decoupled architecture pairing a fast React 19 Vite frontend with a Python 3.12 FastAPI backend.',
  icon: '⚡',
  languages: ['TypeScript', 'Python'],
  frameworks: ['React 19', 'FastAPI', 'Vite'],
  defaultPackageManager: 'npm',
  supportedPackageManagers: ['npm'],
  defaultArchitecture: 'modular',
  supportedArchitectures: ['modular'],
  defaultPorts: { dev: 5173 },
  commands: { dev: 'npm run dev', build: 'npm run build', test: 'npm test' },
  envVariables: [],
  compatibleLibraries: [],
  generateManifest: (ctx: ScaffoldingContext): PlannedFileItem[] => [
    {
      id: 'pkg',
      path: 'package.json',
      description: 'Client manifest',
      category: 'config',
      content: JSON.stringify({
        name: `${ctx.projectName.toLowerCase()}-client`,
        scripts: { dev: 'vite', build: 'vite build' },
        dependencies: { react: '^19.0.0', 'react-dom': '^19.0.0' },
      }, null, 2),
    },
    {
      id: 'backend-main',
      path: 'backend/main.py',
      description: 'Python FastAPI server',
      category: 'source',
      content: `from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="${ctx.projectName} Backend")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

@app.get("/api/health")
def health():
    return {"status": "healthy", "service": "${ctx.projectName}"}
`,
    },
  ],
};

// 4. React + Supabase
export const fullstackReactSupabase: TemplateDefinition = {
  id: 'fullstack-react-supabase',
  name: 'React + Supabase',
  category: 'fullstack',
  description: 'React 19 single-page app integrated with Supabase client for authentication, realtime database, and storage.',
  icon: '⚡',
  languages: ['TypeScript'],
  frameworks: ['React 19', 'Supabase JS', 'Vite'],
  defaultPackageManager: 'npm',
  supportedPackageManagers: ['npm', 'pnpm', 'yarn'],
  defaultArchitecture: 'feature-based',
  supportedArchitectures: ['feature-based'],
  defaultPorts: { dev: 5173 },
  commands: { dev: 'npm run dev', build: 'npm run build', test: 'npm test' },
  envVariables: [
    { key: 'VITE_SUPABASE_URL', description: 'Supabase project URL', defaultValue: 'https://xyzcompany.supabase.co' },
    { key: 'VITE_SUPABASE_ANON_KEY', description: 'Supabase anonymous public key', defaultValue: 'eyJhbGciOi...' },
  ],
  compatibleLibraries: [],
  generateManifest: (ctx: ScaffoldingContext): PlannedFileItem[] => [
    {
      id: 'pkg',
      path: 'package.json',
      description: 'Supabase app manifest',
      category: 'config',
      content: JSON.stringify({
        name: ctx.projectName.toLowerCase(),
        scripts: { dev: 'vite', build: 'vite build' },
        dependencies: { react: '^19.0.0', 'react-dom': '^19.0.0', '@supabase/supabase-js': '^2.47.0' },
      }, null, 2),
    },
    {
      id: 'supabase-client',
      path: 'src/lib/supabase.ts',
      description: 'Configured Supabase client singleton',
      category: 'source',
      content: `import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
`,
    },
  ],
};

// 5. React Native + Firebase
export const fullstackRnFirebase: TemplateDefinition = {
  id: 'fullstack-rn-firebase',
  name: 'React Native + Firebase',
  category: 'fullstack',
  description: 'Expo React Native mobile application wired to Firebase Authentication and Cloud Firestore.',
  icon: '📱',
  languages: ['TypeScript'],
  frameworks: ['React Native', 'Expo', 'Firebase'],
  defaultPackageManager: 'npm',
  supportedPackageManagers: ['npm'],
  defaultArchitecture: 'feature-based',
  supportedArchitectures: ['feature-based'],
  defaultPorts: { dev: 8081 },
  commands: { dev: 'npx expo start', build: 'npx expo export', test: 'npm test' },
  envVariables: [],
  compatibleLibraries: [],
  generateManifest: (ctx: ScaffoldingContext): PlannedFileItem[] => [
    {
      id: 'pkg',
      path: 'package.json',
      description: 'Mobile Firebase manifest',
      category: 'config',
      content: JSON.stringify({
        name: ctx.projectName.toLowerCase(),
        dependencies: { expo: '~52.0.0', react: '18.3.1', 'react-native': '0.76.6', firebase: '^11.1.0' },
      }, null, 2),
    },
    {
      id: 'firebase-config',
      path: 'src/lib/firebase.ts',
      description: 'Firebase SDK initialization',
      category: 'source',
      content: `import { initializeApp } from 'firebase/app';

const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY || "demo-firebase-client-key",
  authDomain: "sample.firebaseapp.com",
  projectId: "sample-project",
};

export const app = initializeApp(firebaseConfig);
`,
    },
  ],
};

// 6. Flutter + REST API
export const fullstackFlutterApi: TemplateDefinition = {
  id: 'fullstack-flutter-api',
  name: 'Flutter + REST API',
  category: 'fullstack',
  description: 'Full-stack mobile workflow with Flutter Dart client communicating via clean Repository pattern to backend API.',
  icon: '💙',
  languages: ['Dart'],
  frameworks: ['Flutter', 'Dart HTTP'],
  defaultPackageManager: 'go',
  supportedPackageManagers: ['go'],
  defaultArchitecture: 'clean',
  supportedArchitectures: ['clean', 'feature-based'],
  defaultPorts: { dev: 0 },
  commands: { dev: 'flutter run', build: 'flutter build apk', test: 'flutter test' },
  envVariables: [],
  compatibleLibraries: [],
  generateManifest: (ctx: ScaffoldingContext): PlannedFileItem[] => [
    {
      id: 'pubspec',
      path: 'pubspec.yaml',
      description: 'Flutter pubspec',
      category: 'config',
      content: `name: ${ctx.projectName.toLowerCase().replace(/[^a-z0-9_]/g, '_')}\n\ndependencies:\n  flutter:\n    sdk: flutter\n  http: ^1.2.0\n`,
    },
    {
      id: 'api-service',
      path: 'lib/core/network/api_client.dart',
      description: 'HTTP API client abstraction',
      category: 'source',
      content: `import 'dart:convert';
import 'package:http/http.dart' as http;

class ApiClient {
  final String baseUrl;
  ApiClient({required this.baseUrl});

  Future<Map<String, dynamic>> getHealth() async {
    final res = await http.get(Uri.parse('$baseUrl/health'));
    return jsonDecode(res.body);
  }
}
`,
    },
  ],
};

export const allFullstackTemplates = [
  fullstackNextDb,
  fullstackReactExpress,
  fullstackReactFastAPI,
  fullstackReactSupabase,
  fullstackRnFirebase,
  fullstackFlutterApi,
];
