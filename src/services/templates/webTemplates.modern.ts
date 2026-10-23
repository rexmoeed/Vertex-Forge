import { TemplateDefinition, ScaffoldingContext, PlannedFileItem } from '../../types/scaffolding';
import { generateReadme } from './shared';

export const webAngular: TemplateDefinition = {
  id: 'web-angular',
  name: 'Angular',
  category: 'web',
  description: 'Enterprise-grade Angular 18+ application with Standalone Components and Signals.',
  icon: '🅰️',
  languages: ['TypeScript', 'HTML', 'CSS'],
  frameworks: ['Angular 18+', 'RxJS'],
  defaultPackageManager: 'npm',
  supportedPackageManagers: ['npm', 'pnpm', 'yarn'],
  defaultArchitecture: 'modular',
  supportedArchitectures: ['modular', 'clean'],
  defaultPorts: { dev: 4200 },
  commands: {
    dev: 'ng serve',
    build: 'ng build',
    test: 'ng test',
  },
  envVariables: [],
  compatibleLibraries: [],
  generateManifest: (ctx: ScaffoldingContext): PlannedFileItem[] => [
    {
      id: 'pkg',
      path: 'package.json',
      description: 'Angular package manifest',
      category: 'config',
      content: JSON.stringify({
        name: ctx.projectName.toLowerCase().replace(/[^a-z0-9-]/g, '-'),
        scripts: {
          start: 'ng serve',
          build: 'ng build',
          test: 'ng test',
        },
        dependencies: {
          '@angular/core': '^18.2.0',
          '@angular/common': '^18.2.0',
          rxjs: '^7.8.0',
        },
      }, null, 2),
    },
    {
      id: 'app-component',
      path: 'src/app/app.component.ts',
      description: 'Angular standalone root component',
      category: 'source',
      content: `import { Component, signal } from '@angular/core';

@Component({
  selector: 'app-root',
  standalone: true,
  template: \`
    <div style="background:#090d16;color:#fff;min-height:100vh;display:flex;align-items:center;justify-content:center;">
      <h2>{{ title() }}</h2>
    </div>
  \`,
})
export class AppComponent {
  title = signal('${ctx.projectName}');
}
`,
    },
  ],
};

// 6. SvelteKit
export const webSvelteKit: TemplateDefinition = {
  id: 'web-sveltekit',
  name: 'SvelteKit',
  category: 'web',
  description: 'Lightning-fast Svelte 5 application with SvelteKit file-based routing and Vite.',
  icon: '🧡',
  languages: ['TypeScript', 'Svelte', 'CSS'],
  frameworks: ['Svelte 5', 'SvelteKit', 'Vite'],
  defaultPackageManager: 'npm',
  supportedPackageManagers: ['npm', 'pnpm', 'yarn', 'bun'],
  defaultArchitecture: 'modular',
  supportedArchitectures: ['modular', 'simple'],
  defaultPorts: { dev: 5173 },
  commands: {
    dev: 'vite dev',
    build: 'vite build',
    test: 'vitest run',
  },
  envVariables: [],
  compatibleLibraries: [],
  generateManifest: (ctx: ScaffoldingContext): PlannedFileItem[] => [
    {
      id: 'pkg',
      path: 'package.json',
      description: 'SvelteKit package manifest',
      category: 'config',
      content: JSON.stringify({
        name: ctx.projectName.toLowerCase().replace(/[^a-z0-9-]/g, '-'),
        scripts: { dev: 'vite dev', build: 'vite build', test: 'vitest run' },
        dependencies: { '@sveltejs/kit': '^2.15.0', svelte: '^5.0.0' },
      }, null, 2),
    },
    {
      id: 'page-svelte',
      path: 'src/routes/+page.svelte',
      description: 'Home route in SvelteKit',
      category: 'source',
      content: `<script lang="ts">
  let count = $state(0);
</script>

<div style="background:#090d16;color:#fff;min-height:100vh;display:flex;flex-direction:column;align-items:center;justify-content:center;">
  <h1>${ctx.projectName} (Svelte 5)</h1>
  <button onclick={() => count++}>Clicks: {count}</button>
</div>
`,
    },
  ],
};

// 7. Astro
export const webAstro: TemplateDefinition = {
  id: 'web-astro',
  name: 'Astro',
  category: 'web',
  description: 'Content-driven island architecture web framework for content sites and documentation.',
  icon: '🚀',
  languages: ['TypeScript', 'Astro'],
  frameworks: ['Astro 4+', 'Vite'],
  defaultPackageManager: 'npm',
  supportedPackageManagers: ['npm', 'pnpm', 'yarn', 'bun'],
  defaultArchitecture: 'simple',
  supportedArchitectures: ['simple', 'modular'],
  defaultPorts: { dev: 4321 },
  commands: { dev: 'astro dev', build: 'astro build', test: 'vitest run' },
  envVariables: [],
  compatibleLibraries: [],
  generateManifest: (ctx: ScaffoldingContext): PlannedFileItem[] => [
    {
      id: 'pkg',
      path: 'package.json',
      description: 'Astro package manifest',
      category: 'config',
      content: JSON.stringify({
        name: ctx.projectName.toLowerCase().replace(/[^a-z0-9-]/g, '-'),
        scripts: { dev: 'astro dev', build: 'astro build' },
        dependencies: { astro: '^5.0.0' },
      }, null, 2),
    },
    {
      id: 'index-astro',
      path: 'src/pages/index.astro',
      description: 'Astro home page',
      category: 'source',
      content: `---
const title = '${ctx.projectName}';
---
<html lang="en">
  <body style="background:#090d16;color:#fff;min-height:100vh;display:flex;align-items:center;justify-content:center;">
    <h1>{title}</h1>
  </body>
</html>
`,
    },
  ],
};

// 8. Vanilla HTML/CSS/TypeScript
export const webVanilla: TemplateDefinition = {
  id: 'web-vanilla',
  name: 'Vanilla HTML/CSS/TypeScript',
  category: 'web',
  description: 'Pure TypeScript and HTML5 with Vite bundler. Zero framework dependencies.',
  icon: '🌐',
  languages: ['TypeScript', 'HTML', 'CSS'],
  frameworks: ['TypeScript', 'Vite'],
  defaultPackageManager: 'npm',
  supportedPackageManagers: ['npm', 'pnpm', 'yarn', 'bun'],
  defaultArchitecture: 'simple',
  supportedArchitectures: ['simple'],
  defaultPorts: { dev: 5173 },
  commands: { dev: 'vite', build: 'vite build', test: 'vitest run' },
  envVariables: [],
  compatibleLibraries: [],
  generateManifest: (ctx: ScaffoldingContext): PlannedFileItem[] => [
    {
      id: 'pkg',
      path: 'package.json',
      description: 'Vanilla TypeScript manifest',
      category: 'config',
      content: JSON.stringify({
        name: ctx.projectName.toLowerCase().replace(/[^a-z0-9-]/g, '-'),
        scripts: { dev: 'vite', build: 'tsc && vite build' },
        devDependencies: { typescript: '^5.7.0', vite: '^6.1.0' },
      }, null, 2),
    },
    {
      id: 'main-ts',
      path: 'src/main.ts',
      description: 'Vanilla TypeScript entry point',
      category: 'source',
      content: `document.getElementById('app')!.innerHTML = '<h1>${ctx.projectName} (Vanilla TypeScript)</h1>';`,
    },
    {
      id: 'index-html',
      path: 'index.html',
      description: 'HTML5 entry',
      category: 'config',
      content: `<!DOCTYPE html><html><body><div id="app"></div><script type="module" src="/src/main.ts"></script></body></html>`,
    },
  ],
};
