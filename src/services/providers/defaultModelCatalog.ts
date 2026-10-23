import {
  ProviderId,
  ProviderConfig,
  ModelInfo,
  RoleModelAssignments,
  PrivacySettings,
} from '../../types/aiProvider';
import { geminiModels, openaiModels, anthropicModels, julesModels } from './catalogs/cloudModels';
import { deepseekModels, mistralModels, xaiModels, groqModels, cohereModels } from './catalogs/openSourceModels';
import {
  togetherModels,
  fireworksModels,
  openrouterModels,
  ollamaModels,
  lmstudioModels,
  customModels,
  localModels,
} from './catalogs/routingAndLocalModels';
import {
  createDefaultProviders as buildDefaultProviders,
  DEFAULT_ROLE_ASSIGNMENTS,
  DEFAULT_PRIVACY_SETTINGS,
} from './catalogs/providerConfigs';

export const DEFAULT_MODELS: Record<ProviderId, ModelInfo[]> = {
  gemini: geminiModels,
  openai: openaiModels,
  anthropic: anthropicModels,
  deepseek: deepseekModels,
  mistral: mistralModels,
  xai: xaiModels,
  groq: groqModels,
  together: togetherModels,
  fireworks: fireworksModels,
  openrouter: openrouterModels,
  cohere: cohereModels,
  ollama: ollamaModels,
  lmstudio: lmstudioModels,
  custom: customModels,
  local: localModels,
  jules: julesModels,
};

export function createDefaultProviders(models: Record<ProviderId, ModelInfo[]> = DEFAULT_MODELS): ProviderConfig[] {
  return buildDefaultProviders(models);
}

export { DEFAULT_ROLE_ASSIGNMENTS, DEFAULT_PRIVACY_SETTINGS };
