import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useOperatorConsole } from '../useOperatorConsole';

describe('useOperatorConsole Hook', () => {
  it('initializes with default approvals tab and loaded state slices', () => {
    const { result } = renderHook(() => useOperatorConsole());

    expect(result.current.activeTab).toBe('approvals');
    expect(Array.isArray(result.current.approvals)).toBe(true);
    expect(Array.isArray(result.current.rules)).toBe(true);
    expect(Array.isArray(result.current.secrets)).toBe(true);
    expect(result.current.activeBiz).toBeDefined();
    expect(result.current.version).toBeDefined();
  });

  it('switches navigation tabs correctly', () => {
    const { result } = renderHook(() => useOperatorConsole());

    act(() => {
      result.current.setActiveTab('rulebook');
    });
    expect(result.current.activeTab).toBe('rulebook');

    act(() => {
      result.current.setActiveTab('vault');
    });
    expect(result.current.activeTab).toBe('vault');
  });

  it('handles business context switching and updates tracker items', () => {
    const { result } = renderHook(() => useOperatorConsole());
    const businesses = result.current.businesses;

    if (businesses.length > 1) {
      const targetBiz = businesses[1];
      act(() => {
        result.current.handleSwitchBusiness(targetBiz.id);
      });
      expect(result.current.activeBiz.id).toBe(targetBiz.id);
    }
  });

  it('toggles rule status and displays feedback toast', () => {
    const { result } = renderHook(() => useOperatorConsole());
    const firstRule = result.current.rules[0];

    if (firstRule) {
      const originalState = firstRule.enabled;
      act(() => {
        result.current.handleToggleRule(firstRule.id, !originalState);
      });
      expect(result.current.toastMsg).toContain(!originalState ? 'enabled' : 'disabled');
    }
  });

  it('manages task status advances in business trackers', () => {
    const { result } = renderHook(() => useOperatorConsole());
    const firstTask = result.current.trackerItems[0];

    if (firstTask) {
      act(() => {
        result.current.handleMoveTask(firstTask.id, 'done');
      });
      const updated = result.current.trackerItems.find(t => t.id === firstTask.id);
      expect(updated?.status).toBe('done');
    }
  });
});
