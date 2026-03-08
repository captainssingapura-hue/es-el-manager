/**
 * ManagedComponent.js
 *
 * Marker base class. Components extend this to be accepted by ElementManager.
 *
 * This class holds no state and contains no logic. Its only purposes are:
 *  1. Type identity — ElementManager uses `instanceof ManagedComponent` as
 *     the sole gate for createElement / returnElement / destroyComponent.
 *  2. onDestroy() hook — a plain override point for subclass DOM teardown.
 *     ElementManager calls it during destroyComponent(); the component itself
 *     never drives its own destruction.
 *
 * No imports. No element tracking. No knowledge of ElementManager.
 */

export class ManagedComponent {

  /**
   * Called by ElementManager.destroyComponent() before it releases all
   * elements owned by this component. Subclasses override this to remove
   * DOM wrappers, null out references, and do any component-specific cleanup.
   *
   * Do NOT call elementManager.returnElement() here — ElementManager handles
   * that automatically after this hook returns.
   *
   * @abstract
   */
  onDestroy() {
    // Empty by default. Subclasses override as needed.
  }
}
