/**
 * ManagedComponent.js
 *
 * Wrapper class. Any plain object can become a managed component by
 * constructing `new ManagedComponent(this)` and passing the wrapper to
 * ElementManager calls. Components compose the wrapper rather than
 * inheriting from it, keeping the library out of their class hierarchy.
 *
 *  1. Type identity — ElementManager uses `instanceof ManagedComponent` as
 *     the sole gate for createElement / returnElement / destroyComponent.
 *  2. onDestroy() delegation — calls the wrapped component's onDestroy() if
 *     present. ElementManager invokes this during destroyComponent().
 *
 * No imports. No element tracking. No knowledge of ElementManager.
 */

export class ManagedComponent {
  #component;

  /** @param {object|null} component - The plain object/instance being wrapped. */
  constructor(component) {
    this.#component = component ?? null;
  }

  /** Returns the wrapped component instance. */
  get component() { return this.#component; }

  /**
   * Called by ElementManager.destroyComponent() before it releases all
   * elements owned by this wrapper. Delegates to the wrapped component's
   * onDestroy() if present.
   * Here there is a need for the ElementManager to access the actual component that is using the manager. This is like a circular dependency. Not ideal
   *
   *
   * Do NOT call elementManager.returnElement() here — ElementManager handles
   * that automatically after this hook returns.
   */
  onDestroy() {
    if (typeof this.#component?.onDestroy === 'function') {
      this.#component.onDestroy();
    }
  }
}
