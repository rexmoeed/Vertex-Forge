import { describe, it, expect, beforeEach, vi } from 'vitest';
import { FocusTrapManager } from '../focusTrapManager';

describe('FocusTrapManager & Keyboard Accessibility', () => {
  let container: HTMLDivElement;
  let btn1: HTMLButtonElement;
  let input: HTMLInputElement;
  let btn2: HTMLButtonElement;

  beforeEach(() => {
    document.body.innerHTML = '';
    container = document.createElement('div');

    btn1 = document.createElement('button');
    btn1.textContent = 'Button 1';

    input = document.createElement('input');
    input.type = 'text';

    btn2 = document.createElement('button');
    btn2.textContent = 'Button 2';

    container.appendChild(btn1);
    container.appendChild(input);
    container.appendChild(btn2);
    document.body.appendChild(container);
  });

  it('identifies focusable elements inside container', () => {
    // JSDOM mock client rects for visibility check
    vi.spyOn(btn1, 'getClientRects').mockReturnValue([{}] as any);
    vi.spyOn(input, 'getClientRects').mockReturnValue([{}] as any);
    vi.spyOn(btn2, 'getClientRects').mockReturnValue([{}] as any);

    const elements = FocusTrapManager.getFocusableElements(container);
    expect(elements.length).toBe(3);
    expect(elements[0]).toBe(btn1);
    expect(elements[2]).toBe(btn2);
  });

  it('cycles focus from last element back to first element on Tab', () => {
    vi.spyOn(btn1, 'getClientRects').mockReturnValue([{}] as any);
    vi.spyOn(btn2, 'getClientRects').mockReturnValue([{}] as any);

    btn2.focus();
    const event = new KeyboardEvent('keydown', { key: 'Tab', bubbles: true, cancelable: true });
    const preventDefaultSpy = vi.spyOn(event, 'preventDefault');

    FocusTrapManager.handleTabKey(event, container);

    expect(preventDefaultSpy).toHaveBeenCalled();
  });

  it('cycles focus from first element to last element on Shift+Tab', () => {
    vi.spyOn(btn1, 'getClientRects').mockReturnValue([{}] as any);
    vi.spyOn(btn2, 'getClientRects').mockReturnValue([{}] as any);

    btn1.focus();
    const event = new KeyboardEvent('keydown', { key: 'Tab', shiftKey: true, bubbles: true, cancelable: true });
    const preventDefaultSpy = vi.spyOn(event, 'preventDefault');

    FocusTrapManager.handleTabKey(event, container);

    expect(preventDefaultSpy).toHaveBeenCalled();
  });

  it('cleans up event listeners when release callback is invoked', () => {
    const removeSpy = vi.spyOn(container, 'removeEventListener');
    const cleanup = FocusTrapManager.trapFocus(container);

    cleanup();
    expect(removeSpy).toHaveBeenCalledWith('keydown', expect.any(Function));
  });
});
