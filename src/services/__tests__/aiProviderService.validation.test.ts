import { describe, it, expect, beforeEach } from 'vitest';
import {
  AIProviderService,
  ProviderValidationError,
  ProviderConfigUpdateSchema,
} from '../aiProviderService';
import { ProviderConfig } from '../../types/aiProvider';

describe('AIProviderService Input Boundary Validation', () => {
  beforeEach(() => {
    // Reset provider configs to default
    AIProviderService.resetToDefaults();
  });

  describe('Zod Schema Validation', () => {
    it('passes for valid partial updates with clean baseUrl and apiKey', () => {
      const validUpdate = {
        apiKey: 'sk-test-valid-key-12345678',
        baseUrl: 'https://api.openai.com/v1',
        enabled: true,
      };
      const parsed = ProviderConfigUpdateSchema.parse(validUpdate);
      expect(parsed.apiKey).toBe('sk-test-valid-key-12345678');
      expect(parsed.baseUrl).toBe('https://api.openai.com/v1');
    });

    it('allows empty string baseUrl for providers using default cloud endpoints', () => {
      const validUpdate = {
        baseUrl: '',
      };
      const parsed = ProviderConfigUpdateSchema.parse(validUpdate);
      expect(parsed.baseUrl).toBe('');
    });

    it('rejects malformed baseUrl that is not a valid URL', () => {
      const invalidUpdate = {
        baseUrl: 'not-a-valid-url-format',
      };
      const result = ProviderConfigUpdateSchema.safeParse(invalidUpdate);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('Invalid baseUrl');
      }
    });

    it('rejects out-of-range temperature (> 2.0)', () => {
      const invalidUpdate = {
        temperature: 3.5,
      };
      const result = ProviderConfigUpdateSchema.safeParse(invalidUpdate);
      expect(result.success).toBe(false);
    });

    it('rejects negative temperature (< 0)', () => {
      const invalidUpdate = {
        temperature: -0.5,
      };
      const result = ProviderConfigUpdateSchema.safeParse(invalidUpdate);
      expect(result.success).toBe(false);
    });
  });

  describe('updateProvider() Service Boundary Enforcement', () => {
    it('successfully updates provider when valid inputs are supplied', () => {
      const updated = AIProviderService.updateProvider('openai', {
        apiKey: 'sk-real-valid-key-xyz987',
        baseUrl: 'https://api.openai.com/v1',
        enabled: true,
      });

      expect(updated.apiKey).toBe('sk-real-valid-key-xyz987');
      expect(updated.baseUrl).toBe('https://api.openai.com/v1');
      expect(updated.enabled).toBe(true);

      // Verify persistence in storage
      const stored = AIProviderService.getProvider('openai');
      expect(stored?.apiKey).toBe('sk-real-valid-key-xyz987');
    });

    it('throws typed ProviderValidationError when updating with invalid baseUrl', () => {
      expect(() => {
        AIProviderService.updateProvider('openai', {
          baseUrl: 'invalid-non-url',
        });
      }).toThrowError(ProviderValidationError);
    });

    it('throws typed ProviderValidationError when updating with invalid temperature', () => {
      expect(() => {
        AIProviderService.updateProvider('gemini', {
          temperature: 99,
        });
      }).toThrowError(ProviderValidationError);
    });

    it('throws error when updating an unknown provider id', () => {
      expect(() => {
        // @ts-expect-error Testing invalid runtime ID
        AIProviderService.updateProvider('non_existent_provider_xyz', {
          enabled: true,
        });
      }).toThrowError(/Provider not found/);
    });
  });

  describe('saveProviders() Integrity Gate', () => {
    it('throws ProviderValidationError and rejects persisting any malformed provider in batch', () => {
      const currentList = AIProviderService.loadProviders();
      const corruptedList: ProviderConfig[] = [
        ...currentList,
        {
          id: 'custom',
          name: 'Corrupted Provider',
          type: 'custom',
          description: 'Corrupted Provider',
          icon: 'Bot',
          enabled: true,
          status: 'error',
          isVerified: false,
          authMethod: 'api_key',
          apiKey: 'key',
          baseUrl: 'not-a-valid-url',
          models: [],
          defaultModelId: 'model',
        },
      ];

      expect(() => {
        AIProviderService.saveProviders(corruptedList);
      }).toThrowError(ProviderValidationError);
    });
  });
});
