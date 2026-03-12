/**
 * DomOpsParty.js
 *
 * Exports the DomOpsParty singleton and all 19 concrete level types
 * (DomOpsParty + DomOpsPartyL1 … DomOpsPartyL18).
 *
 * Structure
 * ─────────
 *   domOpsParty                        ← global singleton (depth 0)
 *     .createElement(name, tagName)    ← root-level element creation
 *     .createBranch(name)          → DomOpsPartyL1    (depth 1)
 *        .createBranch(name)       → DomOpsPartyL2    (depth 2)
 *           …
 *              .createBranch(name)  → DomOpsPartyL18  (depth 18, leaf)
 *
 * Each branch owns its elements directly and releases them on dissolve().
 * No component may call document.createElement() — all elements come from
 * branch.createElement(name, tagName).
 *
 * Classes are declared deepest-first (L18 → L17 → … → L1 → DomOpsParty) so
 * that each createBranch implementation references a class already in scope
 * at the point where the method body executes.
 *
 * Usage
 * ─────
 *   import { domOpsParty } from './src/party/DomOpsParty.js';
 *
 *   const branch  = domOpsParty.createBranch('nav');
 *   const navEl   = branch.createElement('nav', 'nav');
 *
 *   // Teardown — releases all owned elements and removes branch from party.
 *   branch.dissolve();
 */

import { _DomOpsPartyBase } from './_DomOpsPartyBase.js';

// ── Level 18 — deepest level, no further branching ───────────────────────────
// createBranch is inherited from _DomOpsPartyBase and always throws RangeError.

export class DomOpsPartyL18 extends _DomOpsPartyBase {
  /** @param {string} name @param {(() => void)|null} [deregister=null] */
  constructor(name, deregister) { super(name, 18, deregister); }
}

// ── Level 17 ──────────────────────────────────────────────────────────────────

export class DomOpsPartyL17 extends _DomOpsPartyBase {
  /** @param {string} name @param {(() => void)|null} [deregister=null] */
  constructor(name, deregister) { super(name, 17, deregister); }

  /** @param {string} name @returns {DomOpsPartyL18} */
  createBranch(name, owner = null) {
    this._validateBranchName(name);
    return this._addBranch(name, DomOpsPartyL18, owner);
  }
}

// ── Level 16 ──────────────────────────────────────────────────────────────────

export class DomOpsPartyL16 extends _DomOpsPartyBase {
  /** @param {string} name @param {(() => void)|null} [deregister=null] */
  constructor(name, deregister) { super(name, 16, deregister); }

  /** @param {string} name @returns {DomOpsPartyL17} */
  createBranch(name, owner = null) {
    this._validateBranchName(name);
    return this._addBranch(name, DomOpsPartyL17, owner);
  }
}

// ── Level 15 ──────────────────────────────────────────────────────────────────

export class DomOpsPartyL15 extends _DomOpsPartyBase {
  /** @param {string} name @param {(() => void)|null} [deregister=null] */
  constructor(name, deregister) { super(name, 15, deregister); }

  /** @param {string} name @returns {DomOpsPartyL16} */
  createBranch(name, owner = null) {
    this._validateBranchName(name);
    return this._addBranch(name, DomOpsPartyL16, owner);
  }
}

// ── Level 14 ──────────────────────────────────────────────────────────────────

export class DomOpsPartyL14 extends _DomOpsPartyBase {
  /** @param {string} name @param {(() => void)|null} [deregister=null] */
  constructor(name, deregister) { super(name, 14, deregister); }

  /** @param {string} name @returns {DomOpsPartyL15} */
  createBranch(name, owner = null) {
    this._validateBranchName(name);
    return this._addBranch(name, DomOpsPartyL15, owner);
  }
}

// ── Level 13 ──────────────────────────────────────────────────────────────────

export class DomOpsPartyL13 extends _DomOpsPartyBase {
  /** @param {string} name @param {(() => void)|null} [deregister=null] */
  constructor(name, deregister) { super(name, 13, deregister); }

  /** @param {string} name @returns {DomOpsPartyL14} */
  createBranch(name, owner = null) {
    this._validateBranchName(name);
    return this._addBranch(name, DomOpsPartyL14, owner);
  }
}

// ── Level 12 ──────────────────────────────────────────────────────────────────

export class DomOpsPartyL12 extends _DomOpsPartyBase {
  /** @param {string} name @param {(() => void)|null} [deregister=null] */
  constructor(name, deregister) { super(name, 12, deregister); }

  /** @param {string} name @returns {DomOpsPartyL13} */
  createBranch(name, owner = null) {
    this._validateBranchName(name);
    return this._addBranch(name, DomOpsPartyL13, owner);
  }
}

// ── Level 11 ──────────────────────────────────────────────────────────────────

export class DomOpsPartyL11 extends _DomOpsPartyBase {
  /** @param {string} name @param {(() => void)|null} [deregister=null] */
  constructor(name, deregister) { super(name, 11, deregister); }

  /** @param {string} name @returns {DomOpsPartyL12} */
  createBranch(name, owner = null) {
    this._validateBranchName(name);
    return this._addBranch(name, DomOpsPartyL12, owner);
  }
}

// ── Level 10 ──────────────────────────────────────────────────────────────────

export class DomOpsPartyL10 extends _DomOpsPartyBase {
  /** @param {string} name @param {(() => void)|null} [deregister=null] */
  constructor(name, deregister) { super(name, 10, deregister); }

  /** @param {string} name @returns {DomOpsPartyL11} */
  createBranch(name, owner = null) {
    this._validateBranchName(name);
    return this._addBranch(name, DomOpsPartyL11, owner);
  }
}

// ── Level 9 ───────────────────────────────────────────────────────────────────

export class DomOpsPartyL9 extends _DomOpsPartyBase {
  /** @param {string} name @param {(() => void)|null} [deregister=null] */
  constructor(name, deregister) { super(name, 9, deregister); }

  /** @param {string} name @returns {DomOpsPartyL10} */
  createBranch(name, owner = null) {
    this._validateBranchName(name);
    return this._addBranch(name, DomOpsPartyL10, owner);
  }
}

// ── Level 8 ───────────────────────────────────────────────────────────────────

export class DomOpsPartyL8 extends _DomOpsPartyBase {
  /** @param {string} name @param {(() => void)|null} [deregister=null] */
  constructor(name, deregister) { super(name, 8, deregister); }

  /** @param {string} name @returns {DomOpsPartyL9} */
  createBranch(name, owner = null) {
    this._validateBranchName(name);
    return this._addBranch(name, DomOpsPartyL9, owner);
  }
}

// ── Level 7 ───────────────────────────────────────────────────────────────────

export class DomOpsPartyL7 extends _DomOpsPartyBase {
  /** @param {string} name @param {(() => void)|null} [deregister=null] */
  constructor(name, deregister) { super(name, 7, deregister); }

  /** @param {string} name @returns {DomOpsPartyL8} */
  createBranch(name, owner = null) {
    this._validateBranchName(name);
    return this._addBranch(name, DomOpsPartyL8, owner);
  }
}

// ── Level 6 ───────────────────────────────────────────────────────────────────

export class DomOpsPartyL6 extends _DomOpsPartyBase {
  /** @param {string} name @param {(() => void)|null} [deregister=null] */
  constructor(name, deregister) { super(name, 6, deregister); }

  /** @param {string} name @returns {DomOpsPartyL7} */
  createBranch(name, owner = null) {
    this._validateBranchName(name);
    return this._addBranch(name, DomOpsPartyL7, owner);
  }
}

// ── Level 5 ───────────────────────────────────────────────────────────────────

export class DomOpsPartyL5 extends _DomOpsPartyBase {
  /** @param {string} name @param {(() => void)|null} [deregister=null] */
  constructor(name, deregister) { super(name, 5, deregister); }

  /** @param {string} name @returns {DomOpsPartyL6} */
  createBranch(name, owner = null) {
    this._validateBranchName(name);
    return this._addBranch(name, DomOpsPartyL6, owner);
  }
}

// ── Level 4 ───────────────────────────────────────────────────────────────────

export class DomOpsPartyL4 extends _DomOpsPartyBase {
  /** @param {string} name @param {(() => void)|null} [deregister=null] */
  constructor(name, deregister) { super(name, 4, deregister); }

  /** @param {string} name @returns {DomOpsPartyL5} */
  createBranch(name, owner = null) {
    this._validateBranchName(name);
    return this._addBranch(name, DomOpsPartyL5, owner);
  }
}

// ── Level 3 ───────────────────────────────────────────────────────────────────

export class DomOpsPartyL3 extends _DomOpsPartyBase {
  /** @param {string} name @param {(() => void)|null} [deregister=null] */
  constructor(name, deregister) { super(name, 3, deregister); }

  /** @param {string} name @returns {DomOpsPartyL4} */
  createBranch(name, owner = null) {
    this._validateBranchName(name);
    return this._addBranch(name, DomOpsPartyL4, owner);
  }
}

// ── Level 2 ───────────────────────────────────────────────────────────────────

export class DomOpsPartyL2 extends _DomOpsPartyBase {
  /** @param {string} name @param {(() => void)|null} [deregister=null] */
  constructor(name, deregister) { super(name, 2, deregister); }

  /** @param {string} name @returns {DomOpsPartyL3} */
  createBranch(name, owner = null) {
    this._validateBranchName(name);
    return this._addBranch(name, DomOpsPartyL3, owner);
  }
}

// ── Level 1 ───────────────────────────────────────────────────────────────────

export class DomOpsPartyL1 extends _DomOpsPartyBase {
  /** @param {string} name @param {(() => void)|null} [deregister=null] */
  constructor(name, deregister) { super(name, 1, deregister); }

  /** @param {string} name @returns {DomOpsPartyL2} */
  createBranch(name, owner = null) {
    this._validateBranchName(name);
    return this._addBranch(name, DomOpsPartyL2, owner);
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
  constructor(name = 'root') { super(name, 0); }

  /** @param {string} name @returns {DomOpsPartyL1} */
  createBranch(name, owner = null) {
    this._validateBranchName(name);
    return this._addBranch(name, DomOpsPartyL1, owner);
  }
}

// ─── Global singleton ────────────────────────────────────────────────────────
export const domOpsParty = new DomOpsParty('root');
