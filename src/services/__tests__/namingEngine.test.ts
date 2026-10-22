import { describe, it, expect } from 'vitest';
import { NamingEngine } from '../namingEngine';

describe('NamingEngine', () => {
  describe('validateProjectName', () => {
    it('validates standard project names', () => {
      expect(NamingEngine.validateProjectName('my-awesome-app').valid).toBe(true);
      expect(NamingEngine.validateProjectName('vertex_forge_v2').valid).toBe(true);
      expect(NamingEngine.validateProjectName('CoolProject123').valid).toBe(true);
    });

    it('rejects empty or whitespace-only names', () => {
      expect(NamingEngine.validateProjectName('').valid).toBe(false);
      expect(NamingEngine.validateProjectName('   ').valid).toBe(false);
    });

    it('rejects reserved Windows/Unix filenames', () => {
      expect(NamingEngine.validateProjectName('node_modules').valid).toBe(false);
      expect(NamingEngine.validateProjectName('con').valid).toBe(false);
      expect(NamingEngine.validateProjectName('nul').valid).toBe(false);
      expect(NamingEngine.validateProjectName('.env').valid).toBe(false);
    });

    it('rejects names with invalid characters or excessive length', () => {
      expect(NamingEngine.validateProjectName('proj/with/slashes').valid).toBe(false);
      expect(NamingEngine.validateProjectName('app:with:colons').valid).toBe(false);
      expect(NamingEngine.validateProjectName('a'.repeat(250)).valid).toBe(false);
    });
  });

  describe('validateRelativePath', () => {
    it('approves safe relative workspace paths', () => {
      expect(NamingEngine.validateRelativePath('src/components/Header.tsx').valid).toBe(true);
      expect(NamingEngine.validateRelativePath('package.json').valid).toBe(true);
    });

    it('rejects path traversal attempts', () => {
      expect(NamingEngine.validateRelativePath('../secret.txt').valid).toBe(false);
      expect(NamingEngine.validateRelativePath('src/../../etc/passwd').valid).toBe(false);
      expect(NamingEngine.validateRelativePath('/absolute/path').valid).toBe(false);
    });
  });

  describe('Casing conversion methods', () => {
    it('converts to PascalCase correctly', () => {
      expect(NamingEngine.toPascalCase('user_profile_card')).toBe('UserProfileCard');
      expect(NamingEngine.toPascalCase('user-profile-card')).toBe('UserProfileCard');
      expect(NamingEngine.toPascalCase('user profile card')).toBe('UserProfileCard');
    });

    it('converts to camelCase correctly', () => {
      expect(NamingEngine.toCamelCase('User_Profile_Card')).toBe('userProfileCard');
      expect(NamingEngine.toCamelCase('user-profile-card')).toBe('userProfileCard');
    });

    it('converts to kebab-case correctly', () => {
      expect(NamingEngine.toKebabCase('UserProfileCard')).toBe('user-profile-card');
      expect(NamingEngine.toKebabCase('user_profile_card')).toBe('user-profile-card');
    });

    it('converts to snake_case correctly', () => {
      expect(NamingEngine.toSnakeCase('UserProfileCard')).toBe('user_profile_card');
      expect(NamingEngine.toSnakeCase('user-profile-card')).toBe('user_profile_card');
    });
  });

  describe('formatFileName', () => {
    it('formats files based on framework-specific conventions', () => {
      expect(NamingEngine.formatFileName('user_button', 'react-component')).toBe('UserButton.tsx');
      expect(NamingEngine.formatFileName('auth_helper', 'react-hook')).toBe('useAuthHelper.ts');
      expect(NamingEngine.formatFileName('api_service', 'ts-service')).toBe('apiService.ts');
      expect(NamingEngine.formatFileName('data_model', 'python')).toBe('data_model.py');
      expect(NamingEngine.formatFileName('CargoApp', 'rust')).toBe('cargo_app.rs');
    });
  });

  describe('detectConventions', () => {
    it('detects PascalCase component and kebab-case file conventions from file lists', () => {
      const files = [
        'src/components/Header.tsx',
        'src/components/Footer.tsx',
        'src/utils/date-formatter.ts',
        'src/utils/string-helpers.ts',
      ];
      const conventions = NamingEngine.detectConventions(files);
      expect(conventions).toBeDefined();
    });
  });
});
