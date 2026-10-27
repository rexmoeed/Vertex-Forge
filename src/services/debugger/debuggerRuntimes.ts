import { RuntimeCapability } from '../../types/debugger';
import { DesktopBridge } from '../desktopBridge';

export async function discoverAvailableRuntimes(): Promise<RuntimeCapability[]> {
  const list: RuntimeCapability[] = [];

  // 1. Node.js & TypeScript
  try {
    const nodeCheck = await DesktopBridge.executeCommand('node -v');
    const isAvailable = nodeCheck.exitCode === 0;
    list.push({
      language: 'JavaScript / TypeScript',
      runtime: 'Node.js',
      version: isAvailable ? nodeCheck.stdout.trim() : undefined,
      isAvailable,
      adapterName: 'js-debug (Node V8 Inspector)',
      adapterInstalled: isAvailable,
      reasonIfNotAvailable: isAvailable ? undefined : 'Node.js runtime not found in environment.',
    });
  } catch {
    list.push({
      language: 'JavaScript / TypeScript',
      runtime: 'Node.js',
      isAvailable: false,
      adapterName: 'js-debug',
      adapterInstalled: false,
      reasonIfNotAvailable: 'Unable to execute node binary check.',
    });
  }

  // 2. Python
  try {
    const pyCheck = await DesktopBridge.executeCommand('python3 --version');
    const isAvailable = pyCheck.exitCode === 0;
    list.push({
      language: 'Python',
      runtime: 'Python 3',
      version: isAvailable ? pyCheck.stdout.trim() : undefined,
      isAvailable,
      adapterName: 'debugpy (DAP)',
      adapterInstalled: isAvailable,
      reasonIfNotAvailable: isAvailable ? undefined : 'Python 3 not detected in host system PATH.',
    });
  } catch {
    list.push({
      language: 'Python',
      runtime: 'Python 3',
      isAvailable: false,
      adapterName: 'debugpy (DAP)',
      adapterInstalled: false,
      reasonIfNotAvailable: 'Python 3 not detected in host system PATH.',
    });
  }

  // 3. Go
  try {
    const goCheck = await DesktopBridge.executeCommand('go version');
    const isAvailable = goCheck.exitCode === 0;
    list.push({
      language: 'Go',
      runtime: 'Go Toolchain',
      version: isAvailable ? goCheck.stdout.trim() : undefined,
      isAvailable,
      adapterName: 'delve (dlv)',
      adapterInstalled: isAvailable,
      reasonIfNotAvailable: isAvailable ? undefined : 'Go toolchain not detected in host system PATH.',
    });
  } catch {
    list.push({
      language: 'Go',
      runtime: 'Go Toolchain',
      isAvailable: false,
      adapterName: 'delve (dlv)',
      adapterInstalled: false,
      reasonIfNotAvailable: 'Go compiler not found in PATH.',
    });
  }

  return list;
}
