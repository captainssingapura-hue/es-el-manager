/**
 * DomOpsParty.js
 *
 * Exports the DomOpsParty singleton and all 19 concrete level types
 * (DomOpsParty + DomOpsPartyL1 … DomOpsPartyL18).
 *
 * Structure
 * ─────────
 *   domOpsParty                            ← global singleton (depth 0)
 *     .secretary                           ← ManagedComponent wrapping the root party itself
 *     .createBranch(name, component?)  → DomOpsPartyL1    (depth 1)
 *        .createBranch(name, component?) → DomOpsPartyL2  (depth 2)
 *           …
 *              .createBranch(name, component?) → DomOpsPartyL18  (depth 18, leaf)
 *
 * secretaryComponent parameter
 * ────────────────────────────
 * Each createBranch(name, component) forwards `component` to the branch
 * constructor, which passes it to _DomOpsPartyBase as secretaryComponent.
 * When provided, the new branch's secretary wraps `component` instead of the
 * party node itself. This allows destroyComponent(branch.secretary) to
 * correctly invoke component.onDestroy() for teardown.
 *
 * Classes are declared deepest-first (L18 → L17 → … → L1 → DomOpsParty) so
 * that each createBranch implementation references a class already in scope
 * at the point where the method body executes.
 *
 * Usage
 * ─────
 *   import { domOpsParty } from './src/party/DomOpsParty.js';
 *
 *   // Top-level component owns a branch; secretary wraps the component.
 *   const branch = domOpsParty.createBranch('nav', myNavComponent);
 *   elementManager.createElement(branch.secretary, navId, 'nav');
 *
 *   // Teardown — calls myNavComponent.onDestroy() then removes registry entries.
 *   elementManager.destroyComponent(branch.secretary);
 *   domOpsParty.dissolveBranch('nav');
 */

import { _DomOpsPartyBase } from './_DomOpsPartyBase.js';

// ── Level 18 — deepest level, no further branching ───────────────────────────
// createBranch is inherited from _DomOpsPartyBase and always throws RangeError.

export class DomOpsPartyL18 extends _DomOpsPartyBase {
  /** @param {string} name @param {_DomOpsPartyBase} parent @param {*} [secretaryComponent] */
  constructor(name, parent, secretaryComponent = null) { super(name, parent, 18, secretaryComponent); }
}

// ── Level 17 ──────────────────────────────────────────────────────────────────

export class DomOpsPartyL17 extends _DomOpsPartyBase {
  /** @param {string} name @param {_DomOpsPartyBase} parent @param {*} [secretaryComponent] */
  constructor(name, parent, secretaryComponent = null) { super(name, parent, 17, secretaryComponent); }

  /** @param {string} name @param {*} [component] @returns {DomOpsPartyL18} */
  createBranch(name, component = null) {
    this._validateBranchName(name);
    return this._addBranch(name, new DomOpsPartyL18(name, this, component));
  }
}

// ── Level 16 ──────────────────────────────────────────────────────────────────

export class DomOpsPartyL16 extends _DomOpsPartyBase {
  /** @param {string} name @param {_DomOpsPartyBase} parent @param {*} [secretaryComponent] */
  constructor(name, parent, secretaryComponent = null) { super(name, parent, 16, secretaryComponent); }

  /** @param {string} name @param {*} [component] @returns {DomOpsPartyL17} */
  createBranch(name, component = null) {
    this._validateBranchName(name);
    return this._addBranch(name, new DomOpsPartyL17(name, this, component));
  }
}

// ── Level 15 ──────────────────────────────────────────────────────────────────

export class DomOpsPartyL15 extends _DomOpsPartyBase {
  /** @param {string} name @param {_DomOpsPartyBase} parent @param {*} [secretaryComponent] */
  constructor(name, parent, secretaryComponent = null) { super(name, parent, 15, secretaryComponent); }

  /** @param {string} name @param {*} [component] @returns {DomOpsPartyL16} */
  createBranch(name, component = null) {
    this._validateBranchName(name);
    return this._addBranch(name, new DomOpsPartyL16(name, this, component));
  }
}

// ── Level 14 ──────────────────────────────────────────────────────────────────

export class DomOpsPartyL14 extends _DomOpsPartyBase {
  /** @param {string} name @param {_DomOpsPartyBase} parent @param {*} [secretaryComponent] */
  constructor(name, parent, secretaryComponent = null) { super(name, parent, 14, secretaryComponent); }

  /** @param {string} name @param {*} [component] @returns {DomOpsPartyL15} */
  createBranch(name, component = null) {
    this._validateBranchName(name);
    return this._addBranch(name, new DomOpsPartyL15(name, this, component));
  }
}

// ── Level 13 ──────────────────────────────────────────────────────────────────

export class DomOpsPartyL13 extends _DomOpsPartyBase {
  /** @param {string} name @param {_DomOpsPartyBase} parent @param {*} [secretaryComponent] */
  constructor(name, parent, secretaryComponent = null) { super(name, parent, 13, secretaryComponent); }

  /** @param {string} name @param {*} [component] @returns {DomOpsPartyL14} */
  createBranch(name, component = null) {
    this._validateBranchName(name);
    return this._addBranch(name, new DomOpsPartyL14(name, this, component));
  }
}

// ── Level 12 ──────────────────────────────────────────────────────────────────

export class DomOpsPartyL12 extends _DomOpsPartyBase {
  /** @param {string} name @param {_DomOpsPartyBase} parent @param {*} [secretaryComponent] */
  constructor(name, parent, secretaryComponent = null) { super(name, parent, 12, secretaryComponent); }

  /** @param {string} name @param {*} [component] @returns {DomOpsPartyL13} */
  createBranch(name, component = null) {
    this._validateBranchName(name);
    return this._addBranch(name, new DomOpsPartyL13(name, this, component));
  }
}

// ── Level 11 ──────────────────────────────────────────────────────────────────

export class DomOpsPartyL11 extends _DomOpsPartyBase {
  /** @param {string} name @param {_DomOpsPartyBase} parent @param {*} [secretaryComponent] */
  constructor(name, parent, secretaryComponent = null) { super(name, parent, 11, secretaryComponent); }

  /** @param {string} name @param {*} [component] @returns {DomOpsPartyL12} */
  createBranch(name, component = null) {
    this._validateBranchName(name);
    return this._addBranch(name, new DomOpsPartyL12(name, this, component));
  }
}

// ── Level 10 ──────────────────────────────────────────────────────────────────

export class DomOpsPartyL10 extends _DomOpsPartyBase {
  /** @param {string} name @param {_DomOpsPartyBase} parent @param {*} [secretaryComponent] */
  constructor(name, parent, secretaryComponent = null) { super(name, parent, 10, secretaryComponent); }

  /** @param {string} name @param {*} [component] @returns {DomOpsPartyL11} */
  createBranch(name, component = null) {
    this._validateBranchName(name);
    return this._addBranch(name, new DomOpsPartyL11(name, this, component));
  }
}

// ── Level 9 ───────────────────────────────────────────────────────────────────

export class DomOpsPartyL9 extends _DomOpsPartyBase {
  /** @param {string} name @param {_DomOpsPartyBase} parent @param {*} [secretaryComponent] */
  constructor(name, parent, secretaryComponent = null) { super(name, parent, 9, secretaryComponent); }

  /** @param {string} name @param {*} [component] @returns {DomOpsPartyL10} */
  createBranch(name, component = null) {
    this._validateBranchName(name);
    return this._addBranch(name, new DomOpsPartyL10(name, this, component));
  }
}

// ── Level 8 ───────────────────────────────────────────────────────────────────

export class DomOpsPartyL8 extends _DomOpsPartyBase {
  /** @param {string} name @param {_DomOpsPartyBase} parent @param {*} [secretaryComponent] */
  constructor(name, parent, secretaryComponent = null) { super(name, parent, 8, secretaryComponent); }

  /** @param {string} name @param {*} [component] @returns {DomOpsPartyL9} */
  createBranch(name, component = null) {
    this._validateBranchName(name);
    return this._addBranch(name, new DomOpsPartyL9(name, this, component));
  }
}

// ── Level 7 ───────────────────────────────────────────────────────────────────

export class DomOpsPartyL7 extends _DomOpsPartyBase {
  /** @param {string} name @param {_DomOpsPartyBase} parent @param {*} [secretaryComponent] */
  constructor(name, parent, secretaryComponent = null) { super(name, parent, 7, secretaryComponent); }

  /** @param {string} name @param {*} [component] @returns {DomOpsPartyL8} */
  createBranch(name, component = null) {
    this._validateBranchName(name);
    return this._addBranch(name, new DomOpsPartyL8(name, this, component));
  }
}

// ── Level 6 ───────────────────────────────────────────────────────────────────

export class DomOpsPartyL6 extends _DomOpsPartyBase {
  /** @param {string} name @param {_DomOpsPartyBase} parent @param {*} [secretaryComponent] */
  constructor(name, parent, secretaryComponent = null) { super(name, parent, 6, secretaryComponent); }

  /** @param {string} name @param {*} [component] @returns {DomOpsPartyL7} */
  createBranch(name, component = null) {
    this._validateBranchName(name);
    return this._addBranch(name, new DomOpsPartyL7(name, this, component));
  }
}

// ── Level 5 ───────────────────────────────────────────────────────────────────

export class DomOpsPartyL5 extends _DomOpsPartyBase {
  /** @param {string} name @param {_DomOpsPartyBase} parent @param {*} [secretaryComponent] */
  constructor(name, parent, secretaryComponent = null) { super(name, parent, 5, secretaryComponent); }

  /** @param {string} name @param {*} [component] @returns {DomOpsPartyL6} */
  createBranch(name, component = null) {
    this._validateBranchName(name);
    return this._addBranch(name, new DomOpsPartyL6(name, this, component));
  }
}

// ── Level 4 ───────────────────────────────────────────────────────────────────

export class DomOpsPartyL4 extends _DomOpsPartyBase {
  /** @param {string} name @param {_DomOpsPartyBase} parent @param {*} [secretaryComponent] */
  constructor(name, parent, secretaryComponent = null) { super(name, parent, 4, secretaryComponent); }

  /** @param {string} name @param {*} [component] @returns {DomOpsPartyL5} */
  createBranch(name, component = null) {
    this._validateBranchName(name);
    return this._addBranch(name, new DomOpsPartyL5(name, this, component));
  }
}

// ── Level 3 ───────────────────────────────────────────────────────────────────

export class DomOpsPartyL3 extends _DomOpsPartyBase {
  /** @param {string} name @param {_DomOpsPartyBase} parent @param {*} [secretaryComponent] */
  constructor(name, parent, secretaryComponent = null) { super(name, parent, 3, secretaryComponent); }

  /** @param {string} name @param {*} [component] @returns {DomOpsPartyL4} */
  createBranch(name, component = null) {
    this._validateBranchName(name);
    return this._addBranch(name, new DomOpsPartyL4(name, this, component));
  }
}

// ── Level 2 ───────────────────────────────────────────────────────────────────

export class DomOpsPartyL2 extends _DomOpsPartyBase {
  /** @param {string} name @param {_DomOpsPartyBase} parent @param {*} [secretaryComponent] */
  constructor(name, parent, secretaryComponent = null) { super(name, parent, 2, secretaryComponent); }

  /** @param {string} name @param {*} [component] @returns {DomOpsPartyL3} */
  createBranch(name, component = null) {
    this._validateBranchName(name);
    return this._addBranch(name, new DomOpsPartyL3(name, this, component));
  }
}

// ── Level 1 ───────────────────────────────────────────────────────────────────

export class DomOpsPartyL1 extends _DomOpsPartyBase {
  /** @param {string} name @param {_DomOpsPartyBase} parent @param {*} [secretaryComponent] */
  constructor(name, parent, secretaryComponent = null) { super(name, parent, 1, secretaryComponent); }

  /** @param {string} name @param {*} [component] @returns {DomOpsPartyL2} */
  createBranch(name, component = null) {
    this._validateBranchName(name);
    return this._addBranch(name, new DomOpsPartyL2(name, this, component));
  }
}

// ── Root (depth 0) ────────────────────────────────────────────────────────────

/**
 * Root party class (depth 0).
 * Instantiated once as the global singleton `domOpsParty`.
 * All other DomOpsPartyLN classes are created exclusively via createBranch().
 */
export class DomOpsParty extends _DomOpsPartyBase {
  /** @param {string} [name='root'] */
  constructor(name = 'root') { super(name, null, 0); }

  /** @param {string} name @param {*} [component] @returns {DomOpsPartyL1} */
  createBranch(name, component = null) {
    this._validateBranchName(name);
    return this._addBranch(name, new DomOpsPartyL1(name, this, component));
  }
}

// ─── Global singleton ────────────────────────────────────────────────────────
export const domOpsParty = new DomOpsParty('root');
