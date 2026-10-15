import { FileNode } from '../types/ide';

export interface ProjectArchetype {
  id: string;
  name: string;
  category: 'web' | 'mobile' | 'backend' | 'fullstack';
  description: string;
  icon: string;
  languages: string[];
  framework: string;
  packageManager: 'pnpm' | 'npm' | 'yarn' | 'bun' | 'poetry' | 'cargo' | 'go';
  scaffold: (projectName: string) => FileNode[];
}

export const ARCHETYPES: ProjectArchetype[] = [
  // 1. Web: React 19 + Vite + TypeScript + Tailwind
  {
    id: 'react-vite-tailwind',
    name: 'React 19 + Vite + Tailwind CSS',
    category: 'web',
    description: 'Production frontend with React 19, TypeScript, Vite, Tailwind CSS, Lucide Icons, and Vitest suite.',
    icon: '⚡',
    languages: ['TypeScript', 'HTML', 'CSS'],
    framework: 'React 19 + Vite',
    packageManager: 'pnpm',
    scaffold: (projectName: string) => [
      {
        id: 'pkg-json',
        name: 'package.json',
        path: 'package.json',
        type: 'file',
        content: JSON.stringify(
          {
            name: projectName.toLowerCase().replace(/\s+/g, '-'),
            private: true,
            version: '0.1.0',
            type: 'module',
            scripts: {
              dev: 'vite',
              build: 'tsc -b && vite build',
              preview: 'vite preview',
              test: 'vitest run',
              lint: 'eslint .',
            },
            dependencies: {
              react: '^19.0.0',
              'react-dom': '^19.0.0',
              'lucide-react': '^1.16.0',
              zustand: '^5.0.0',
            },
            devDependencies: {
              '@types/react': '^19.0.0',
              '@types/react-dom': '^19.0.0',
              '@vitejs/plugin-react': '^5.0.0',
              typescript: '^5.7.0',
              vite: '^6.0.0',
              vitest: '^3.0.0',
              tailwindcss: '^4.0.0',
            },
          },
          null,
          2
        ),
      },
      {
        id: 'tsconfig-json',
        name: 'tsconfig.json',
        path: 'tsconfig.json',
        type: 'file',
        content: JSON.stringify(
          {
            compilerOptions: {
              target: 'ES2022',
              useDefineForClassFields: true,
              lib: ['ES2022', 'DOM', 'DOM.Iterable'],
              module: 'ESNext',
              skipLibCheck: true,
              moduleResolution: 'bundler',
              jsx: 'react-jsx',
              strict: true,
            },
            include: ['src'],
          },
          null,
          2
        ),
      },
      {
        id: 'vite-config',
        name: 'vite.config.ts',
        path: 'vite.config.ts',
        type: 'file',
        content: `import { defineConfig } from 'vite';\nimport react from '@vitejs/plugin-react';\n\nexport default defineConfig({\n  plugins: [react()],\n  server: { port: 5173 },\n});\n`,
      },
      {
        id: 'src-folder',
        name: 'src',
        path: 'src',
        type: 'folder',
        children: [
          {
            id: 'main-tsx',
            name: 'main.tsx',
            path: 'src/main.tsx',
            type: 'file',
            content: `import React from 'react';\nimport ReactDOM from 'react-dom/client';\nimport App from './App';\nimport './index.css';\n\nReactDOM.createRoot(document.getElementById('root')!).render(\n  <React.StrictMode>\n    <App />\n  </React.StrictMode>\n);\n`,
          },
          {
            id: 'app-tsx',
            name: 'App.tsx',
            path: 'src/App.tsx',
            type: 'file',
            content: `import React, { useState } from 'react';\nimport { Sparkles, Layers, ArrowRight } from 'lucide-react';\n\nexport default function App() {\n  const [count, setCount] = useState(0);\n\n  return (\n    <main className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-6">\n      <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl flex flex-col gap-4 text-center">\n        <div className="w-12 h-12 rounded-xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center mx-auto">\n          <Sparkles className="w-6 h-6" />\n        </div>\n        <h1 className="text-xl font-bold tracking-tight">${projectName}</h1>\n        <p className="text-xs text-slate-400">Scaffolded with React 19, TypeScript & Tailwind CSS in Vertex Forge.</p>\n        <button\n          onClick={() => setCount(c => c + 1)}\n          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg shadow transition-colors"\n        >\n          Clicked: {count} times\n        </button>\n      </div>\n    </main>\n  );\n}\n`,
          },
          {
            id: 'index-css',
            name: 'index.css',
            path: 'src/index.css',
            type: 'file',
            content: `@import "tailwindcss";\n`,
          },
          {
            id: 'test-file',
            name: 'App.test.tsx',
            path: 'src/App.test.tsx',
            type: 'file',
            content: `import { describe, it, expect } from 'vitest';\n\ndescribe('${projectName} Test Suite', () => {\n  it('should initialize successfully', () => {\n    expect(true).toBe(true);\n  });\n});\n`,
          },
        ],
      },
      {
        id: 'readme-md',
        name: 'README.md',
        path: 'README.md',
        type: 'file',
        content: `# ${projectName}\n\nBuilt with Vertex Forge Desktop.\n\n## Getting Started\n\`\`\`bash\npnpm install\npnpm dev\n\`\`\`\n`,
      },
    ],
  },

  // 2. Full-Stack: Next.js + Prisma + SQLite/PostgreSQL
  {
    id: 'nextjs-prisma-fullstack',
    name: 'Next.js App Router + Prisma ORM',
    category: 'fullstack',
    description: 'Full-stack enterprise application with Server Components, Prisma ORM, REST/Server Actions, and Tailwind CSS.',
    icon: '▲',
    languages: ['TypeScript', 'SQL', 'HTML'],
    framework: 'Next.js App Router',
    packageManager: 'pnpm',
    scaffold: (projectName: string) => [
      {
        id: 'pkg-json',
        name: 'package.json',
        path: 'package.json',
        type: 'file',
        content: JSON.stringify(
          {
            name: projectName.toLowerCase().replace(/\s+/g, '-'),
            version: '0.1.0',
            private: true,
            scripts: {
              dev: 'next dev',
              build: 'next build',
              start: 'next start',
              lint: 'next lint',
              'prisma:migrate': 'prisma migrate dev',
            },
            dependencies: {
              next: '^15.0.0',
              react: '^19.0.0',
              'react-dom': '^19.0.0',
              '@prisma/client': '^6.0.0',
              zod: '^3.23.0',
              'lucide-react': '^1.16.0',
            },
            devDependencies: {
              '@types/node': '^22.0.0',
              '@types/react': '^19.0.0',
              typescript: '^5.7.0',
              prisma: '^6.0.0',
              tailwindcss: '^4.0.0',
            },
          },
          null,
          2
        ),
      },
      {
        id: 'next-config',
        name: 'next.config.mjs',
        path: 'next.config.mjs',
        type: 'file',
        content: `/** @type {import('next').NextConfig} */\nconst nextConfig = {};\nexport default nextConfig;\n`,
      },
      {
        id: 'prisma-dir',
        name: 'prisma',
        path: 'prisma',
        type: 'folder',
        children: [
          {
            id: 'prisma-schema',
            name: 'schema.prisma',
            path: 'prisma/schema.prisma',
            type: 'file',
            content: `datasource db {\n  provider = "sqlite"\n  url      = "file:./dev.db"\n}\n\ngenerator client {\n  provider = "prisma-client-js"\n}\n\nmodel User {\n  id        String   @id @default(uuid())\n  email     String   @unique\n  name      String?\n  createdAt DateTime @default(now())\n}\n`,
          },
        ],
      },
      {
        id: 'app-dir',
        name: 'app',
        path: 'app',
        type: 'folder',
        children: [
          {
            id: 'app-layout',
            name: 'layout.tsx',
            path: 'app/layout.tsx',
            type: 'file',
            content: `export const metadata = {\n  title: '${projectName}',\n  description: 'Built with Next.js App Router in Vertex Forge',\n};\n\nexport default function RootLayout({ children }: { children: React.ReactNode }) {\n  return (\n    <html lang="en" className="dark bg-slate-950 text-slate-100">\n      <body>{children}</body>\n    </html>\n  );\n}\n`,
          },
          {
            id: 'app-page',
            name: 'page.tsx',
            path: 'app/page.tsx',
            type: 'file',
            content: `import React from 'react';\n\nexport default function Page() {\n  return (\n    <main className="p-8 max-w-4xl mx-auto flex flex-col gap-4">\n      <h1 className="text-2xl font-bold">${projectName}</h1>\n      <p className="text-slate-400">Next.js App Router + Prisma ORM setup ready.</p>\n    </main>\n  );\n}\n`,
          },
        ],
      },
    ],
  },

  // 3. Mobile: Expo / React Native
  {
    id: 'expo-mobile',
    name: 'Expo & React Native Mobile App',
    category: 'mobile',
    description: 'Cross-platform mobile application supporting iOS, Android, and Web with Expo SDK 52 and TypeScript.',
    icon: '📱',
    languages: ['TypeScript', 'JavaScript'],
    framework: 'Expo / React Native',
    packageManager: 'bun',
    scaffold: (projectName: string) => [
      {
        id: 'pkg-json',
        name: 'package.json',
        path: 'package.json',
        type: 'file',
        content: JSON.stringify(
          {
            name: projectName.toLowerCase().replace(/\s+/g, '-'),
            version: '1.0.0',
            scripts: {
              start: 'expo start',
              android: 'expo start --android',
              ios: 'expo start --ios',
              web: 'expo start --web',
            },
            dependencies: {
              expo: '~52.0.0',
              react: '18.3.1',
              'react-native': '0.76.0',
              'expo-status-bar': '~2.0.0',
            },
            devDependencies: {
              '@types/react': '~18.3.12',
              typescript: '^5.3.3',
            },
          },
          null,
          2
        ),
      },
      {
        id: 'app-json',
        name: 'app.json',
        path: 'app.json',
        type: 'file',
        content: JSON.stringify(
          {
            expo: {
              name: projectName,
              slug: projectName.toLowerCase().replace(/\s+/g, '-'),
              version: '1.0.0',
              orientation: 'portrait',
              userInterfaceStyle: 'dark',
            },
          },
          null,
          2
        ),
      },
      {
        id: 'app-tsx',
        name: 'App.tsx',
        path: 'App.tsx',
        type: 'file',
        content: `import { StatusBar } from 'expo-status-bar';\nimport { StyleSheet, Text, View } from 'react-native';\n\nexport default function App() {\n  return (\n    <View style={styles.container}>\n      <Text style={styles.title}>${projectName}</Text>\n      <Text style={styles.subtitle}>Open up App.tsx to start working on your app!</Text>\n      <StatusBar style="auto" />\n    </View>\n  );\n}\n\nconst styles = StyleSheet.create({\n  container: {\n    flex: 1,\n    backgroundColor: '#020617',\n    alignItems: 'center',\n    justifyContent: 'center',\n  },\n  title: {\n    fontSize: 24,\n    fontWeight: 'bold',\n    color: '#f8fafc',\n    marginBottom: 8,\n  },\n  subtitle: {\n    color: '#94a3b8',\n  },\n});\n`,
      },
    ],
  },

  // 4. Backend: Python FastAPI + Uvicorn
  {
    id: 'python-fastapi',
    name: 'Python FastAPI Microservice',
    category: 'backend',
    description: 'High-performance asynchronous Python API with Pydantic v2 schemas, automated OpenAPI documentation, and pytest.',
    icon: '🐍',
    languages: ['Python'],
    framework: 'FastAPI',
    packageManager: 'poetry',
    scaffold: (projectName: string) => [
      {
        id: 'reqs-txt',
        name: 'requirements.txt',
        path: 'requirements.txt',
        type: 'file',
        content: `fastapi>=0.115.0\nuvicorn>=0.32.0\npydantic>=2.10.0\npytest>=8.3.0\nhttpx>=0.28.0\n`,
      },
      {
        id: 'main-py',
        name: 'main.py',
        path: 'main.py',
        type: 'file',
        content: `from fastapi import FastAPI\nfrom pydantic import BaseModel\n\napp = FastAPI(title="${projectName}", version="1.0.0")\n\nclass HealthResponse(BaseModel):\n    status: str\n    service: str\n\n@app.get("/health", response_model=HealthResponse)\ndef health():\n    return {"status": "healthy", "service": "${projectName}"}\n\n@app.get("/")\ndef read_root():\n    return {"message": "Welcome to ${projectName} API"}\n`,
      },
      {
        id: 'test-main-py',
        name: 'test_main.py',
        path: 'test_main.py',
        type: 'file',
        content: `from fastapi.testclient import TestClient\nfrom main import app\n\nclient = TestClient(app)\n\ndef test_health():\n    response = client.get("/health")\n    assert response.status_code == 200\n    assert response.json()["status"] == "healthy"\n`,
      },
    ],
  },

  // 5. Backend: Node.js Express + TypeScript
  {
    id: 'node-express-ts',
    name: 'Node.js Express + TypeScript REST API',
    category: 'backend',
    description: 'Clean layered architecture with Express, TypeScript, Zod request validation, CORS, and Vitest endpoint testing.',
    icon: '⚙️',
    languages: ['TypeScript', 'JavaScript'],
    framework: 'Express + TypeScript',
    packageManager: 'pnpm',
    scaffold: (projectName: string) => [
      {
        id: 'pkg-json',
        name: 'package.json',
        path: 'package.json',
        type: 'file',
        content: JSON.stringify(
          {
            name: projectName.toLowerCase().replace(/\s+/g, '-'),
            version: '1.0.0',
            type: 'module',
            scripts: {
              dev: 'tsx watch src/server.ts',
              build: 'tsc',
              start: 'node dist/server.js',
              test: 'vitest run',
            },
            dependencies: {
              express: '^4.21.0',
              cors: '^2.8.5',
              dotenv: '^16.4.5',
              zod: '^3.23.0',
            },
            devDependencies: {
              '@types/express': '^5.0.0',
              '@types/cors': '^2.8.17',
              '@types/node': '^22.0.0',
              typescript: '^5.7.0',
              tsx: '^4.19.0',
              vitest: '^3.0.0',
            },
          },
          null,
          2
        ),
      },
      {
        id: 'src-folder',
        name: 'src',
        path: 'src',
        type: 'folder',
        children: [
          {
            id: 'server-ts',
            name: 'server.ts',
            path: 'src/server.ts',
            type: 'file',
            content: `import express from 'express';\nimport cors from 'cors';\n\nconst app = express();\nconst PORT = process.env.PORT || 4000;\n\napp.use(cors());\napp.use(express.json());\n\napp.get('/api/health', (req, res) => {\n  res.json({ status: 'ok', service: '${projectName}' });\n});\n\napp.listen(PORT, () => {\n  console.log(\`Server running on http://localhost:\${PORT}\`);\n});\n`,
          },
        ],
      },
    ],
  },
];
