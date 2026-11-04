/**
 * Keyboard Navigation Focus Trap Manager
 * Constrains Tab / Shift+Tab keyboard traversal inside modal dialogues (WCAG 2.1 AA compliance).
 */

export class FocusTrapManager {
  public static readonly FOCUSABLE_SELECTOR =
    'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

  public static getFocusableElements(container: HTMLElement): HTMLElement[] {
    if (!container) return [];
    const elements = Array.from(
      container.querySelectorAll<HTMLElement>(this.FOCUSABLE_SELECTOR)
    );
    return elements.filter(el => {
      return el.offsetParent !== null || el.getClientRects().length > 0;
    });
  }

  public static handleTabKey(event: KeyboardEvent, container: HTMLElement): void {
    if (event.key !== 'Tab') return;

    const focusable = this.getFocusableElements(container);
    if (focusable.length === 0) {
      event.preventDefault();
      return;
    }

    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    const active = document.activeElement as HTMLElement;

    if (event.shiftKey) {
      // Shift + Tab: moving backwards
      if (active === first || !container.contains(active)) {
        event.preventDefault();
        last.focus();
      }
    } else {
      // Tab: moving forwards
      if (active === last || !container.contains(active)) {
        event.preventDefault();
        first.focus();
      }
    }
  }

  public static trapFocus(container: HTMLElement): () => void {
    const focusable = this.getFocusableElements(container);
    if (focusable.length > 0) {
      focusable[0].focus();
    }

    const keyListener = (e: KeyboardEvent) => {
      this.handleTabKey(e, container);
    };

    container.addEventListener('keydown', keyListener);

    return () => {
      container.removeEventListener('keydown', keyListener);
    };
  }
}
