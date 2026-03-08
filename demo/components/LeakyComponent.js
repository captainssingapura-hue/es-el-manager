/**
 * LeakyComponent.js
 * ⚠️  BAD EXAMPLE — intentionally leaks managed elements.
 *
 * Composes ManagedComponent correctly, so the manager accepts it.
 * The leak occurs because elementManager.destroyComponent() is never
 * called before the instance goes out of scope.
 */

import { elementManager, ManagedComponent } from '../../src/elementManager.js';
import { ElementId }                        from '../../src/ElementId.js';

export class LeakyComponent {
  #mc = new ManagedComponent(this);

  get mc() { return this.#mc; }

  /**
   * Creates a managed element and abandons the instance without
   * calling elementManager.destroyComponent(). Registry entry orphaned.
   *
   * @param {number} index
   * @returns {{ instance: LeakyComponent, id: ElementId }}
   */
  spawn(index) {
    const id = new ElementId(['leak', `item-${index}`, `t${Date.now()}`]);
    const el = elementManager.createElement(this.#mc, id, 'div');
    el.textContent = `Leaked element #${index}  ·  id: "${id}"`;
    return { instance: this, id };
  }

  /** onDestroy — nothing to tear down */
  onDestroy() {}
}
