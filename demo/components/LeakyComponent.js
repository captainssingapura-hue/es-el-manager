/**
 * LeakyComponent.js
 * ⚠️  BAD EXAMPLE — intentionally leaks managed elements.
 *
 * Joins the root DomOpsParty via join() (not createBranch) so it doesn't
 * own a named branch — it is just an extra party member.
 *
 * The leak occurs because elementManager.destroyComponent() and
 * domOpsParty.expel() are never called before the instance goes out of scope,
 * so both the registry entry and the party membership are orphaned.
 */

import { elementManager } from '../../src/elementManager.js';
import { ElementId }      from '../../src/ElementId.js';
import { domOpsParty }    from '../../src/party/DomOpsParty.js';

export class LeakyComponent {
  #mc;

  constructor() {
    // Joins the root party — obtains a ManagedComponent wrapping this instance.
    // Neither expel() nor destroyComponent() is ever called, so this member
    // and its registry entries persist even after the LeakyComponent goes out of scope.
    this.#mc = domOpsParty.join(this);
  }

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

  /** onDestroy — nothing to tear down (intentionally incomplete) */
  onDestroy() {}
}
