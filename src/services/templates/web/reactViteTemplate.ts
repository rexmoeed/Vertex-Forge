import { TemplateDefinition, ScaffoldingContext, PlannedFileItem } from '../../../types/scaffolding';
import { generateReadme } from '../shared';

// React + Vite Template
export const webReactVite: TemplateDefinition = {
  id: 'web-react-vite',
  name: 'React + Vite',
  category: 'web',
  description: 'Ultra-fast React 19 SPA with TypeScript, Tailwind CSS v4, Lucide Icons, and Vitest suite.',
  icon: '⚛️',
  badge: 'Popular',
  languages: ['TypeScript', 'CSS', 'HTML'],
  frameworks: ['React 19', 'Vite', 'Tailwind CSS'],
  defaultPackageManager: 'npm',
  supportedPackageManagers: ['npm', 'pnpm', 'yarn', 'bun'],
  defaultArchitecture: 'feature-based',
  supportedArchitectures: ['feature-based', 'modular', 'simple'],
  defaultPorts: { dev: 5173, preview: 4173 },
  commands: {
    dev: 'npm run dev',
    build: 'npm run build',
    test: 'npm test',
    lint: 'npm run lint',
  },
  envVariables: [
    { key: 'VITE_API_URL', description: 'Base backend API URL', defaultValue: 'http://localhost:3000/api' },
    { key: 'VITE_APP_TITLE', description: 'Application display title', defaultValue: 'My React Application' },
  ],
  compatibleLibraries: [
    { id: 'tailwind', name: 'Tailwind CSS v4', category: 'styling', description: 'Utility-first styling system', defaultSelected: true, packageNames: ['tailwindcss', '@tailwindcss/vite'] },
    { id: 'zustand', name: 'Zustand', category: 'state', description: 'Lightweight reactive state management', defaultSelected: true, packageNames: ['zustand'] },
    { id: 'react-router', name: 'React Router v7', category: 'routing', description: 'Client-side declarative routing', defaultSelected: true, packageNames: ['react-router'] },
    { id: 'zod', name: 'Zod', category: 'validation', description: 'TypeScript-first schema validation', defaultSelected: true, packageNames: ['zod'] },
  ],
  generateManifest: (ctx: ScaffoldingContext): PlannedFileItem[] => [
    {
      id: 'pkg-json',
      path: 'package.json',
      description: 'Project manifest and build scripts',
      category: 'config',
      content: JSON.stringify({
        name: ctx.projectName.toLowerCase().replace(/[^a-z0-9-]/g, '-'),
        version: '0.1.0',
        private: true,
        type: 'module',
        scripts: {
          dev: 'vite',
          build: 'tsc -b && vite build',
          preview: 'vite preview',
          test: 'vitest run',
        },
        dependencies: {
          react: '^19.0.0',
          'react-dom': '^19.0.0',
          'lucide-react': '^0.475.0',
          zustand: '^5.0.3',
          zod: '^3.24.1',
        },
        devDependencies: {
          '@types/react': '^19.0.8',
          '@types/react-dom': '^19.0.3',
          '@vitejs/plugin-react': '^4.3.4',
          typescript: '^5.7.0',
          vite: '^6.0.0',
          vitest: '^3.0.0',
        },
      }, null, 2),
    },
    {
      id: 'tsconfig',
      path: 'tsconfig.json',
      description: 'TypeScript configuration',
      category: 'config',
      content: JSON.stringify({
        compilerOptions: {
          target: 'ES2022',
          module: 'ESNext',
          moduleResolution: 'bundler',
          jsx: 'react-jsx',
          strict: true,
          noEmit: true,
        },
        include: ['src'],
      }, null, 2),
    },
    {
      id: 'vite-config',
      path: 'vite.config.ts',
      description: 'Vite bundler config',
      category: 'config',
      content: `import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: { port: 5173 },
});
`,
    },
    {
      id: 'index-html',
      path: 'index.html',
      description: 'HTML5 entry point',
      category: 'config',
      content: `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>\${ctx.projectName}</title>
  </head>
  <body class="bg-slate-950 text-slate-100 min-h-screen">
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
`,
    },
    {
      id: 'src-main',
      path: 'src/main.tsx',
      description: 'Application entry bootstrap',
      category: 'source',
      content: `import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
`,
    },
    {
      id: 'src-index-css',
      path: 'src/index.css',
      description: 'Tailwind styling imports',
      category: 'style',
      content: `@import "tailwindcss";

body {
  margin: 0;
  min-height: 100vh;
}
`,
    },
    {
      id: 'src-app',
      path: 'src/App.tsx',
      description: 'Working starter home page with feature architecture',
      category: 'source',
      content: `import React from 'react';
import { Navbar } from './components/layout/Navbar';
import { DashboardView } from './features/dashboard/components/DashboardView';

export default function App() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      <Navbar appName="${ctx.projectName}" />
      <main className="flex-1 max-w-3xl w-full mx-auto p-6 space-y-6">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
          <h2 className="text-base font-bold text-white mb-1">Project Milestone Manager</h2>
          <p className="text-xs text-slate-400 mb-4">Feature-based architecture with React 19, TypeScript & Tailwind CSS</p>
          <DashboardView />
        </div>
      </main>
    </div>
  );
}
`,
    },
    {
      id: 'comp-btn',
      path: 'src/components/ui/Button.tsx',
      description: 'Reusable typed button component',
      category: 'source',
      content: `import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline';
  size?: 'sm' | 'md';
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  className = '',
  ...props
}) => {
  const base = 'inline-flex items-center justify-center font-medium rounded-lg transition-colors focus:outline-none';
  const variants = {
    primary: 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-sm',
    secondary: 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700',
    outline: 'border border-slate-700 hover:border-slate-600 text-slate-300',
  };
  const sizes = {
    sm: 'px-2.5 py-1 text-xs',
    md: 'px-3.5 py-1.5 text-xs',
  };

  return (
    <button className={\`\${base} \${variants[variant]} \${sizes[size]} \${className}\`} {...props}>
      {children}
    </button>
  );
};
`,
    },
    {
      id: 'comp-nav',
      path: 'src/components/layout/Navbar.tsx',
      description: 'Application layout header',
      category: 'source',
      content: `import React from 'react';
import { Sparkles, Shield } from 'lucide-react';

export const Navbar: React.FC<{ appName: string }> = ({ appName }) => {
  return (
    <header className="border-b border-slate-800 bg-slate-900/60 backdrop-blur px-6 py-3 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white">
          <Sparkles className="w-4 h-4" />
        </div>
        <span className="font-bold text-sm text-white">{appName}</span>
      </div>
      <div className="flex items-center gap-3 text-xs text-slate-400">
        <span className="flex items-center gap-1 font-mono text-[11px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
          <Shield className="w-3 h-3" /> Ready
        </span>
      </div>
    </header>
  );
};
`,
    },
    {
      id: 'feat-dash',
      path: 'src/features/dashboard/components/DashboardView.tsx',
      description: 'Feature view component',
      category: 'source',
      content: `import React, { useState } from 'react';
import { CheckCircle2, Plus } from 'lucide-react';
import { Button } from '../../../components/ui/Button';

export const DashboardView: React.FC = () => {
  const [items, setItems] = useState([
    { id: '1', title: 'Verify React 19 toolchain', done: true },
    { id: '2', title: 'Configure Tailwind CSS styling', done: true },
    { id: '3', title: 'Implement feature-based domain logic', done: false },
  ]);
  const [inputVal, setInputVal] = useState('');

  const addItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputVal.trim()) return;
    setItems(prev => [...prev, { id: String(Date.now()), title: inputVal.trim(), done: false }]);
    setInputVal('');
  };

  const toggle = (id: string) => {
    setItems(prev => prev.map(item => item.id === id ? { ...item, done: !item.done } : item));
  };

  return (
    <div className="space-y-4">
      <form onSubmit={addItem} className="flex gap-2">
        <input
          type="text"
          value={inputVal}
          onChange={e => setInputVal(e.target.value)}
          placeholder="Add a new project milestone..."
          className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-indigo-500 font-mono"
        />
        <Button type="submit" variant="primary" size="sm">
          <Plus className="w-3.5 h-3.5 mr-1" /> Add
        </Button>
      </form>
      <div className="space-y-1.5">
        {items.map(item => (
          <div
            key={item.id}
            onClick={() => toggle(item.id)}
            className="p-3 bg-slate-950/60 border border-slate-800 hover:border-slate-700 rounded-xl flex items-center justify-between cursor-pointer transition"
          >
            <span className={\`text-xs \${item.done ? 'line-through text-slate-500' : 'text-slate-200'}\`}>
              {item.title}
            </span>
            <CheckCircle2 className={\`w-4 h-4 \${item.done ? 'text-emerald-400' : 'text-slate-600'}\`} />
          </div>
        ))}
      </div>
    </div>
  );
};
`,
    },
    {
      id: 'env-example',
      path: '.env.example',
      description: 'Sample environment variables',
      category: 'config',
      content: `VITE_API_URL=http://localhost:3000/api
VITE_APP_TITLE="${ctx.projectName}"
`,
    },
    {
      id: 'readme',
      path: 'README.md',
      description: 'Documentation',
      category: 'doc',
      content: generateReadme(
        ctx,
        'React 19 + TypeScript + Vite + Tailwind CSS',
        `${ctx.projectName}/
├── src/
│   ├── components/
│   ├── features/
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
├── package.json
└── vite.config.ts`,
        ['Node.js 18+ or 20+'],
        {
          install: `${ctx.packageManager} install`,
          dev: `${ctx.packageManager} run dev`,
          test: `${ctx.packageManager} test`,
          build: `${ctx.packageManager} run build`,
        },
        'Uses standard React 19 functional components and typed interfaces.'
      ),
    },
  ],
};
