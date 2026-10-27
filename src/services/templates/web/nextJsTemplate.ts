import { TemplateDefinition, ScaffoldingContext, PlannedFileItem } from '../../../types/scaffolding';
import { generateReadme } from '../shared';

// Next.js App Router
export const webNextJs: TemplateDefinition = {
  id: 'web-nextjs',
  name: 'Next.js (App Router)',
  category: 'web',
  description: 'Full-stack React framework with App Router, React Server Components, Server Actions, and Tailwind CSS.',
  icon: '▲',
  languages: ['TypeScript', 'CSS', 'HTML'],
  frameworks: ['Next.js 15', 'React 19', 'Tailwind CSS'],
  defaultPackageManager: 'npm',
  supportedPackageManagers: ['npm', 'pnpm', 'yarn', 'bun'],
  defaultArchitecture: 'modular',
  supportedArchitectures: ['modular', 'feature-based'],
  defaultPorts: { dev: 3000 },
  commands: {
    dev: 'npm run dev',
    build: 'npm run build',
    test: 'npm test',
    lint: 'npm run lint',
  },
  envVariables: [
    { key: 'NEXT_PUBLIC_APP_URL', description: 'Application base URL', defaultValue: 'http://localhost:3000' },
  ],
  compatibleLibraries: [
    { id: 'tailwind', name: 'Tailwind CSS', category: 'styling', description: 'Utility CSS', defaultSelected: true, packageNames: ['tailwindcss'] },
  ],
  generateManifest: (ctx: ScaffoldingContext): PlannedFileItem[] => [
    {
      id: 'pkg',
      path: 'package.json',
      description: 'Dependencies and scripts',
      category: 'config',
      content: JSON.stringify({
        name: ctx.projectName.toLowerCase().replace(/[^a-z0-9-]/g, '-'),
        version: '0.1.0',
        private: true,
        scripts: {
          dev: 'next dev',
          build: 'next build',
          start: 'next start',
          test: 'vitest run',
        },
        dependencies: {
          next: '^15.1.0',
          react: '^19.0.0',
          'react-dom': '^19.0.0',
          'lucide-react': '^0.475.0',
        },
        devDependencies: {
          '@types/node': '^22.0.0',
          '@types/react': '^19.0.0',
          tailwindcss: '^4.0.0',
          typescript: '^5.7.0',
          vitest: '^3.0.0',
        },
      }, null, 2),
    },
    {
      id: 'app-layout',
      path: 'src/app/layout.tsx',
      description: 'Root layout',
      category: 'source',
      content: `import './globals.css';
export const metadata = { title: '${ctx.projectName}' };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="bg-slate-950 text-slate-100 min-h-screen">{children}</body>
    </html>
  );
}
`,
    },
    {
      id: 'app-page',
      path: 'src/app/page.tsx',
      description: 'Home page route',
      category: 'source',
      content: `import React from 'react';

export default function Page() {
  return (
    <main className="min-h-screen flex items-center justify-center p-8 bg-slate-950 text-slate-100">
      <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-2xl p-6 text-center space-y-3">
        <h1 className="text-xl font-bold text-white">${ctx.projectName}</h1>
        <p className="text-xs text-slate-400">Next.js 15 App Router + Server Components</p>
      </div>
    </main>
  );
}
`,
    },
    {
      id: 'globals-css',
      path: 'src/app/globals.css',
      description: 'Tailwind CSS',
      category: 'style',
      content: `@import "tailwindcss";`,
    },
    {
      id: 'readme',
      path: 'README.md',
      description: 'Documentation',
      category: 'doc',
      content: generateReadme(
        ctx,
        'Next.js 15 App Router + React 19 + TypeScript',
        `${ctx.projectName}/src/app/`,
        ['Node.js 18.17+ or 20+'],
        {
          install: `${ctx.packageManager} install`,
          dev: `${ctx.packageManager} run dev`,
          test: `${ctx.packageManager} test`,
          build: `${ctx.packageManager} run build`,
        },
        'Follows Next.js 15 App Router conventions.'
      ),
    },
  ],
};
