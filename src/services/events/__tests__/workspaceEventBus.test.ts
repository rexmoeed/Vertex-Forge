import { describe, it, expect, beforeEach, vi } from 'vitest';
import { WorkspaceEventBus } from '../workspaceEventBus';

describe('WorkspaceEventBus & Decoupled State Communication', () => {
  let bus: WorkspaceEventBus;

  beforeEach(() => {
    bus = new WorkspaceEventBus();
  });

  it('delivers typed payload to registered subscriber', () => {
    const listener = vi.fn();
    bus.on('file:opened', listener);

    bus.emit('file:opened', { filePath: 'src/main.ts', timestamp: 123456789 });

    expect(listener).toHaveBeenCalledWith({ filePath: 'src/main.ts', timestamp: 123456789 });
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it('unsubscribes listener when unsubscribe callback is invoked', () => {
    const listener = vi.fn();
    const unsubscribe = bus.on('test:run_finished', listener);

    bus.emit('test:run_finished', { total: 10, passed: 10, failed: 0 });
    expect(listener).toHaveBeenCalledTimes(1);

    unsubscribe();
    bus.emit('test:run_finished', { total: 10, passed: 9, failed: 1 });
    expect(listener).toHaveBeenCalledTimes(1);
    expect(bus.listenerCount('test:run_finished')).toBe(0);
  });

  it('isolates listener errors so other listeners still execute', () => {
    const faultyListener = vi.fn().mockImplementation(() => {
      throw new Error('Exploding subscriber');
    });
    const healthyListener = vi.fn();

    bus.on('agent:task_started', faultyListener);
    bus.on('agent:task_started', healthyListener);

    bus.emit('agent:task_started', {
      taskId: 't1',
      agentRole: 'Security Lead',
      title: 'Audit dependencies',
    });

    expect(faultyListener).toHaveBeenCalled();
    expect(healthyListener).toHaveBeenCalled();
  });

  it('clears all subscriptions cleanly', () => {
    bus.on('file:saved', vi.fn());
    bus.on('file:opened', vi.fn());

    bus.clear();

    expect(bus.listenerCount('file:saved')).toBe(0);
    expect(bus.listenerCount('file:opened')).toBe(0);
  });
});

