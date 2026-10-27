import { DebugConfiguration } from '../../types/debugger';
import { DesktopBridge } from '../desktopBridge';
import { VirtualFileSystem } from '../virtualFs';

export class DebuggerConfigManager {
  private vfs: VirtualFileSystem;
  private configurations: DebugConfiguration[] = [];
  private activeConfigName: string = 'Launch Current File (TypeScript / Node)';

  constructor(vfs: VirtualFileSystem) {
    this.vfs = vfs;
    this.initDefaultConfigurations();
  }

  private initDefaultConfigurations() {
    this.configurations = [
      {
        name: 'Launch Current File (TypeScript / Node)',
        type: 'node',
        request: 'launch',
        program: '${file}',
        stopOnEntry: false,
        sourceMaps: true,
      },
      {
        name: 'Debug Sample Program (sampleDebugTarget.ts)',
        type: 'tsx',
        request: 'launch',
        program: 'src/services/sampleDebugTarget.ts',
        stopOnEntry: true,
        sourceMaps: true,
      },
      {
        name: 'Debug Vitest Test Runner',
        type: 'node',
        request: 'launch',
        program: 'node_modules/vitest/vitest.mjs',
        args: ['run'],
        stopOnEntry: false,
      },
    ];

    this.loadPersistedConfigurations();
  }

  public getConfigurations(): DebugConfiguration[] {
    return this.configurations;
  }

  public getActiveConfigName(): string {
    return this.activeConfigName;
  }

  public setActiveConfigName(name: string) {
    this.activeConfigName = name;
  }

  public getConfigurationByName(name?: string): DebugConfiguration {
    const targetName = name || this.activeConfigName;
    return this.configurations.find(c => c.name === targetName) || this.configurations[0];
  }

  public async saveConfiguration(config: DebugConfiguration): Promise<void> {
    const existingIdx = this.configurations.findIndex(c => c.name === config.name);
    if (existingIdx !== -1) {
      this.configurations[existingIdx] = config;
    } else {
      this.configurations.push(config);
    }

    const payload = JSON.stringify({ version: '0.2.0', configurations: this.configurations }, null, 2);
    this.vfs.writeFile('.vertex/launch.json', payload);
    try {
      await DesktopBridge.writeFile('.vertex/launch.json', payload);
    } catch {}
  }

  public loadPersistedConfigurations() {
    const content = this.vfs.readFile('.vertex/launch.json') || this.vfs.readFile('.vscode/launch.json');
    if (content) {
      try {
        const parsed = JSON.parse(content);
        if (Array.isArray(parsed.configurations) && parsed.configurations.length > 0) {
          this.configurations = parsed.configurations;
          this.activeConfigName = this.configurations[0].name;
        }
      } catch {}
    }
  }
}
