/**
 * LeakyComponent.js
 * ⚠️  BAD EXAMPLE — intentionally leaks managed elements.
 *
 * Creates a named branch and elements via that branch, but never calls
 * branch.dissolve() before the instance goes out of scope. Both the branch
 * node and its elements are permanently orphaned in the party tree.
 */

import { domOpsParty } from '../../src/party/DomOpsParty.js';

let _seq = 0;

export class LeakyComponent {
  #branch;
  #branchName;

  constructor() {
    this.#branchName = `leak-${++_seq}`;
    // Branch created — but dissolve() is never called, so the branch and
    // its elements persist even after this instance goes out of scope.
    this.#branch = domOpsParty.createBranch(this.#branchName);
    this.#branch.activate(this);
  }

  get branchName() { return this.#branchName; }

  /**
   * Creates a managed element on the branch and returns it along with the
   * branch name. The element is attached to the DOM by the caller.
   *
   * dissolve() is intentionally never called — branch and element orphaned.
   *
   * @param {number} index
   * @returns {{ branchName: string, element: HTMLElement }}
   */
  spawn(index) {
    const el = this.#branch.createElement(`item-${index}`, 'div');
    el.className   = 'leaked-el';
    el.textContent = `Leaked element #${index}  ·  branch: "${this.#branchName}"  ·  dissolve() never called`;
    return { branchName: this.#branchName, element: el };
  }
}
