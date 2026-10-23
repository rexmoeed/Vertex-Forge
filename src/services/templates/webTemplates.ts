/**
 * Web Templates Modular Facade
 * Decomposed into react, vue, and modern template engines
 */

import { TemplateDefinition } from '../../types/scaffolding';
import { webReactVite, webNextJs } from './webTemplates.react';
import { webVueVite, webNuxt } from './webTemplates.vue';
import {
  webAngular,
  webSvelteKit,
  webAstro,
  webVanilla,
} from './webTemplates.modern';

export * from './webTemplates.react';
export * from './webTemplates.vue';
export * from './webTemplates.modern';

export const allWebTemplates: TemplateDefinition[] = [
  webReactVite,
  webNextJs,
  webVueVite,
  webNuxt,
  webAngular,
  webSvelteKit,
  webAstro,
  webVanilla,
];
