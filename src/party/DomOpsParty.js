/**
 * DomOpsParty.js
 *
 * Exports the DomOpsParty singleton and all 19 concrete level types
 * (DomOpsParty + DomOpsPartyL1 … DomOpsPartyL18).
 *
 * Structure
 * ─────────
 *   domOpsParty           ← global singleton (depth 0)
 *     .secretary          ← ManagedComponent wrapping the root party itself
 *     .join(component)    ← enrol any object; returns a ManagedComponent
 *     .createBranch(name) → DomOpsPartyL1    (depth 1)
 *        .createBranch(name) → DomOpsPartyL2 (depth 2)
 *           …
 *              .createBranch(name) → DomOpsPartyL18  (depth 18, leaf — no further branches)
 *
 * Each level class follows the same contract as the root (same methods, same
 * fields, same behaviour) — the only difference is which concrete class their
 * createBranch instantiates, and the depth value stored at construction.
 *
 * Classes are declared deepest-first (L18 → L17 → … → L1 → DomOpsParty) so
 * that each createBranch implementation references a class that is already in
 * scope at the point where the method is called.
 *
 * Usage
 * ─────
 *   import { domOpsParty } from './src/party/DomOpsParty.js';
 *
 *   const mc = domOpsParty.join(myComponent);  // → ManagedComponent
 *   const branch = domOpsParty.createBranch('ui');  // → DomOpsPartyL1
 *   const subBranch = branch.createBranch('cards'); // → DomOpsPartyL2
 */

import { _DomOpsPartyBase } from './_DomOpsPartyBase.js';

// ── Level 18 — deepest level, no further branching ───────────────────────────
// createBranch is inherited from _DomOpsPartyBase and always throws RangeError.

export class DomOpsPartyL18 extends _DomOpsPartyBase {
  /** @param {string} name @param {_DomOpsPartyBase} parent */
  constructor(name, parent) { super(name, parent, 18); }
}

// ── Level 17 ──────────────────────────────────────────────────────────────────

export class DomOpsPartyL17 extends _DomOpsPartyBase {
  /** @param {string} name @param {_DomOpsPartyBase} parent */
  constructor(name, parent) { super(name, parent, 17); }

  /** @param {string} name @returns {DomOpsPartyL18} */
  createBranch(name) {
    this._validateBranchName(name);
    return this._addBranch(name, new DomOpsPartyL18(name, this));
  }
}

// ── Level 16 ──────────────────────────────────────────────────────────────────

export class DomOpsPartyL16 extends _DomOpsPartyBase {
  /** @param {string} name @param {_DomOpsPartyBase} parent */
  constructor(name, parent) { super(name, parent, 16); }

  /** @param {string} name @returns {DomOpsPartyL17} */
  createBranch(name) {
    this._validateBranchName(name);
    return this._addBranch(name, new DomOpsPartyL17(name, this));
  }
}

// ── Level 15 ──────────────────────────────────────────────────────────────────

export class DomOpsPartyL15 extends _DomOpsPartyBase {
  /** @param {string} name @param {_DomOpsPartyBase} parent */
  constructor(name, parent) { super(name, parent, 15); }

  /** @param {string} name @returns {DomOpsPartyL16} */
  createBranch(name) {
    this._validateBranchName(name);
    return this._addBranch(name, new DomOpsPartyL16(name, this));
  }
}

// ── Level 14 ──────────────────────────────────────────────────────────────────

export class DomOpsPartyL14 extends _DomOpsPartyBase {
  /** @param {string} name @param {_DomOpsPartyBase} parent */
  constructor(name, parent) { super(name, parent, 14); }

  /** @param {string} name @returns {DomOpsPartyL15} */
  createBranch(name) {
    this._validateBranchName(name);
    return this._addBranch(name, new DomOpsPartyL15(name, this));
  }
}

// ── Level 13 ──────────────────────────────────────────────────────────────────

export class DomOpsPartyL13 extends _DomOpsPartyBase {
  /** @param {string} name @param {_DomOpsPartyBase} parent */
  constructor(name, parent) { super(name, parent, 13); }

  /** @param {string} name @returns {DomOpsPartyL14} */
  createBranch(name) {
    this._validateBranchName(name);
    return this._addBranch(name, new DomOpsPartyL14(name, this));
  }
}

// ── Level 12 ──────────────────────────────────────────────────────────────────

export class DomOpsPartyL12 extends _DomOpsPartyBase {
  /** @param {string} name @param {_DomOpsPartyBase} parent */
  constructor(name, parent) { super(name, parent, 12); }

  /** @param {string} name @returns {DomOpsPartyL13} */
  createBranch(name) {
    this._validateBranchName(name);
    return this._addBranch(name, new DomOpsPartyL13(name, this));
  }
}

// ── Level 11 ──────────────────────────────────────────────────────────────────

export class DomOpsPartyL11 extends _DomOpsPartyBase {
  /** @param {string} name @param {_DomOpsPartyBase} parent */
  constructor(name, parent) { super(name, parent, 11); }

  /** @param {string} name @returns {DomOpsPartyL12} */
  createBranch(name) {
    this._validateBranchName(name);
    return this._addBranch(name, new DomOpsPartyL12(name, this));
  }
}

// ── Level 10 ──────────────────────────────────────────────────────────────────

export class DomOpsPartyL10 extends _DomOpsPartyBase {
  /** @param {string} name @param {_DomOpsPartyBase} parent */
  constructor(name, parent) { super(name, parent, 10); }

  /** @param {string} name @returns {DomOpsPartyL11} */
  createBranch(name) {
    this._validateBranchName(name);
    return this._addBranch(name, new DomOpsPartyL11(name, this));
  }
}

// ── Level 9 ───────────────────────────────────────────────────────────────────

export class DomOpsPartyL9 extends _DomOpsPartyBase {
  /** @param {string} name @param {_DomOpsPartyBase} parent */
  constructor(name, parent) { super(name, parent, 9); }

  /** @param {string} name @returns {DomOpsPartyL10} */
  createBranch(name) {
    this._validateBranchName(name);
    return this._addBranch(name, new DomOpsPartyL10(name, this));
  }
}

// ── Level 8 ───────────────────────────────────────────────────────────────────

export class DomOpsPartyL8 extends _DomOpsPartyBase {
  /** @param {string} name @param {_DomOpsPartyBase} parent */
  constructor(name, parent) { super(name, parent, 8); }

  /** @param {string} name @returns {DomOpsPartyL9} */
  createBranch(name) {
    this._validateBranchName(name);
    return this._addBranch(name, new DomOpsPartyL9(name, this));
  }
}

// ── Level 7 ───────────────────────────────────────────────────────────────────

export class DomOpsPartyL7 extends _DomOpsPartyBase {
  /** @param {string} name @param {_DomOpsPartyBase} parent */
  constructor(name, parent) { super(name, parent, 7); }

  /** @param {string} name @returns {DomOpsPartyL8} */
  createBranch(name) {
    this._validateBranchName(name);
    return this._addBranch(name, new DomOpsPartyL8(name, this));
  }
}

// ── Level 6 ───────────────────────────────────────────────────────────────────

export class DomOpsPartyL6 extends _DomOpsPartyBase {
  /** @param {string} name @param {_DomOpsPartyBase} parent */
  constructor(name, parent) { super(name, parent, 6); }

  /** @param {string} name @returns {DomOpsPartyL7} */
  createBranch(name) {
    this._validateBranchName(name);
    return this._addBranch(name, new DomOpsPartyL7(name, this));
  }
}

// ── Level 5 ───────────────────────────────────────────────────────────────────

export class DomOpsPartyL5 extends _DomOpsPartyBase {
  /** @param {string} name @param {_DomOpsPartyBase} parent */
  constructor(name, parent) { super(name, parent, 5); }

  /** @param {string} name @returns {DomOpsPartyL6} */
  createBranch(name) {
    this._validateBranchName(name);
    return this._addBranch(name, new DomOpsPartyL6(name, this));
  }
}

// ── Level 4 ───────────────────────────────────────────────────────────────────

export class DomOpsPartyL4 extends _DomOpsPartyBase {
  /** @param {string} name @param {_DomOpsPartyBase} parent */
  constructor(name, parent) { super(name, parent, 4); }

  /** @param {string} name @returns {DomOpsPartyL5} */
  createBranch(name) {
    this._validateBranchName(name);
    return this._addBranch(name, new DomOpsPartyL5(name, this));
  }
}

// ── Level 3 ───────────────────────────────────────────────────────────────────

export class DomOpsPartyL3 extends _DomOpsPartyBase {
  /** @param {string} name @param {_DomOpsPartyBase} parent */
  constructor(name, parent) { super(name, parent, 3); }

  /** @param {string} name @returns {DomOpsPartyL4} */
  createBranch(name) {
    this._validateBranchName(name);
    return this._addBranch(name, new DomOpsPartyL4(name, this));
  }
}

// ── Level 2 ───────────────────────────────────────────────────────────────────

export class DomOpsPartyL2 extends _DomOpsPartyBase {
  /** @param {string} name @param {_DomOpsPartyBase} parent */
  constructor(name, parent) { super(name, parent, 2); }

  /** @param {string} name @returns {DomOpsPartyL3} */
  createBranch(name) {
    this._validateBranchName(name);
    return this._addBranch(name, new DomOpsPartyL3(name, this));
  }
}

// ── Level 1 ───────────────────────────────────────────────────────────────────

export class DomOpsPartyL1 extends _DomOpsPartyBase {
  /** @param {string} name @param {_DomOpsPartyBase} parent */
  constructor(name, parent) { super(name, parent, 1); }

  /** @param {string} name @returns {DomOpsPartyL2} */
  createBranch(name) {
    this._validateBranchName(name);
    return this._addBranch(name, new DomOpsPartyL2(name, this));
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

  /** @param {string} name @returns {DomOpsPartyL1} */
  createBranch(name) {
    this._validateBranchName(name);
    return this._addBranch(name, new DomOpsPartyL1(name, this));
  }
}

// ─── Global singleton ────────────────────────────────────────────────────────
export const domOpsParty = new DomOpsParty('root');
