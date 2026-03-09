/**
 * LeakyComponent.js
 * ⚠️  BAD EXAMPLE — intentionally leaks managed elements.
 *
 * Creates a named branch on the root DomOpsParty but never calls
 * branch.dissolve() — so both the branch node and any registry entries
 * it owns are permanently orphaned when the instance goes out of scope.
 */

import { elementManager } from '../../src/elementManager.js';
import { ElementId }      from '../../src/ElementId.js';
import { domOpsParty }    from '../../src/party/DomOpsParty.js';

let _seq = 0;

export class LeakyComponent {
  #branch;

  constructor() {
    // Creates a branch — but dissolve() is never called, so the branch and
    // its registry entries persist even after this instance goes out of scope.
    this.#branch = domOpsParty.createBranch(`leak-${++_seq}`, this);
  }

  get mc() { return this.#branch.secretary; }

  /**
   * Creates a managed element and abandons the instance without
   * calling branch.dissolve(). Registry entry and branch node orphaned.
   *
   * @param {number} index
   * @returns {{ instance: LeakyComponent, id: ElementId }}
   */
  spawn(index) {
    const id = new ElementId(['leak', `item-${index}`, `t${Date.now()}`]);
    const el = elementManager.createElement(this.#branch.secretary, id, 'div');
    el.textContent = `Leaked element #${index}  ·  id: "${id}"`;
    return { instance: this, id };
  }

  /** onDestroy — nothing to tear down (intentionally incomplete) */
  onDestroy() {}
}
