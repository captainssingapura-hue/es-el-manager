/**
 * LeakyComponent.js
 * ⚠️  BAD EXAMPLE — intentionally leaks managed elements.
 *
 * Extends ManagedComponent correctly, so the manager accepts it.
 * The leak occurs because elementManager.destroyComponent() is never
 * called before the instance goes out of scope.
 */

import { elementManager } from './elementManager.js';
import { ManagedComponent } from './ManagedComponent.js';
import { ElementId }                        from './ElementId.js';

export class LeakyComponent extends ManagedComponent {

  /**
   * Creates a managed element and abandons the instance without
   * calling elementManager.destroyComponent(). Registry entry orphaned.
   *
   * @param {number} index
   * @returns {{ instance: LeakyComponent, id: ElementId }}
   */
  spawn(index) {
    const id = new ElementId(['leak', `item-${index}`, `t${Date.now()}`]);
    const el = elementManager.createElement(this, id, 'div');
    el.textContent = `Leaked element #${index}  ·  id: "${id}"`;
    return { instance: this, id };
  }

  /** @override — nothing to tear down */
  onDestroy() {}
}
