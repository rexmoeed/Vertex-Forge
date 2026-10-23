import { TemplateDefinition, ScaffoldingContext, PlannedFileItem } from '../../types/scaffolding';
import { generateReadme } from './shared';

export const webVueVite: TemplateDefinition = {
  id: 'web-vue-vite',
  name: 'Vue + Vite',
  category: 'web',
  description: 'Modern Vue 3 application with Vite, Pinia state management, TypeScript, and Vue Router.',
  icon: '💚',
  languages: ['TypeScript', 'Vue', 'CSS', 'HTML'],
  frameworks: ['Vue 3', 'Vite', 'Pinia'],
  defaultPackageManager: 'npm',
  supportedPackageManagers: ['npm', 'pnpm', 'yarn', 'bun'],
  defaultArchitecture: 'feature-based',
  supportedArchitectures: ['feature-based', 'modular', 'simple'],
  defaultPorts: { dev: 5173 },
  commands: {
    dev: 'npm run dev',
    build: 'npm run build',
    test: 'npm test',
  },
  envVariables: [
    { key: 'VITE_API_URL', description: 'Backend API URL', defaultValue: 'http://localhost:3000' },
  ],
  compatibleLibraries: [
    { id: 'pinia', name: 'Pinia', category: 'state', description: 'Intuitive store for Vue', defaultSelected: true, packageNames: ['pinia'] },
    { id: 'vue-router', name: 'Vue Router', category: 'routing', description: 'Official Vue routing', defaultSelected: true, packageNames: ['vue-router@4'] },
  ],
  generateManifest: (ctx: ScaffoldingContext): PlannedFileItem[] => [
    {
      id: 'pkg',
      path: 'package.json',
      description: 'Vue 3 package manifest',
      category: 'config',
      content: JSON.stringify({
        name: ctx.projectName.toLowerCase().replace(/[^a-z0-9-]/g, '-'),
        version: '0.1.0',
        scripts: {
          dev: 'vite',
          build: 'vite build',
          test: 'vitest run',
        },
        dependencies: {
          vue: '^3.5.0',
          pinia: '^2.3.0',
        },
        devDependencies: {
          '@vitejs/plugin-vue': '^5.2.0',
          typescript: '^5.7.0',
          vite: '^6.1.0',
          vitest: '^3.0.0',
        },
      }, null, 2),
    },
    {
      id: 'app-vue',
      path: 'src/App.vue',
      description: 'Root Vue component with reactive counter',
      category: 'source',
      content: `<template>
  <div class="app-container">
    <div class="card">
      <h1>{{ title }}</h1>
      <p>Vue 3 + Vite + TypeScript</p>
      <button @click="count++">Clicked {{ count }} times</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
const title = ref('${ctx.projectName}');
const count = ref(0);
</script>

<style scoped>
.app-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #090d16;
  color: #fff;
  font-family: system-ui, sans-serif;
}
.card {
  background: #111827;
  padding: 2rem;
  border-radius: 1rem;
  border: 1px solid #1f2937;
  text-align: center;
}
button {
  background: #10b981;
  color: #fff;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 0.5rem;
  cursor: pointer;
  margin-top: 1rem;
}
</style>
`,
    },
    {
      id: 'main-ts',
      path: 'src/main.ts',
      description: 'Vue 3 bootstrap',
      category: 'source',
      content: `import { createApp } from 'vue';
import { createPinia } from 'pinia';
import App from './App.vue';

const app = createApp(App);
app.use(createPinia());
app.mount('#root');
`,
    },
    {
      id: 'index-html',
      path: 'index.html',
      description: 'HTML5 entry',
      category: 'config',
      content: `<!DOCTYPE html>
<html>
  <head><meta charset="utf-8"/><title>${ctx.projectName}</title></head>
  <body><div id="root"></div><script type="module" src="/src/main.ts"></script></body>
</html>
`,
    },
    {
      id: 'readme',
      path: 'README.md',
      description: 'Vue documentation',
      category: 'doc',
      content: generateReadme(
        ctx,
        'Vue 3 + Vite + Pinia',
        `${ctx.projectName}/src/`,
        ['Node.js 18+'],
        {
          install: `${ctx.packageManager} install`,
          dev: `${ctx.packageManager} run dev`,
          test: `${ctx.packageManager} test`,
          build: `${ctx.packageManager} run build`,
        },
        'Uses Composition API with <script setup>.'
      ),
    },
  ],
};

// 4. Nuxt
export const webNuxt: TemplateDefinition = {
  id: 'web-nuxt',
  name: 'Nuxt',
  category: 'web',
  description: 'Intuitive full-stack Vue framework with auto-imports, file-based routing, and SSR/SSG capabilities.',
  icon: '🏔️',
  languages: ['TypeScript', 'Vue'],
  frameworks: ['Nuxt 3', 'Vue 3'],
  defaultPackageManager: 'npm',
  supportedPackageManagers: ['npm', 'pnpm', 'yarn', 'bun'],
  defaultArchitecture: 'modular',
  supportedArchitectures: ['modular', 'feature-based'],
  defaultPorts: { dev: 3000 },
  commands: {
    dev: 'npm run dev',
    build: 'npm run build',
    test: 'npm test',
  },
  envVariables: [],
  compatibleLibraries: [],
  generateManifest: (ctx: ScaffoldingContext): PlannedFileItem[] => [
    {
      id: 'pkg',
      path: 'package.json',
      description: 'Nuxt package manifest',
      category: 'config',
      content: JSON.stringify({
        name: ctx.projectName.toLowerCase().replace(/[^a-z0-9-]/g, '-'),
        scripts: {
          dev: 'nuxt dev',
          build: 'nuxt build',
          test: 'vitest run',
        },
        dependencies: {
          nuxt: '^3.15.0',
          vue: '^3.5.0',
        },
      }, null, 2),
    },
    {
      id: 'app-vue',
      path: 'app.vue',
      description: 'Nuxt entry component',
      category: 'source',
      content: `<template>
  <div style="background:#090d16;color:#fff;min-height:100vh;display:flex;align-items:center;justify-content:center;">
    <h1>${ctx.projectName} (Nuxt 3)</h1>
  </div>
</template>
`,
    },
    {
      id: 'nuxt-config',
      path: 'nuxt.config.ts',
      description: 'Nuxt configuration',
      category: 'config',
      content: `export default defineNuxtConfig({
  compatibilityDate: '2025-01-01',
  devtools: { enabled: true },
});
`,
    },
  ],
};

// 5. Angular