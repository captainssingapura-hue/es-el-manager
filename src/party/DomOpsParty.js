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
  createBranch(name) {
    this._validateBranchName(name);
    return this._addBranch(name, DomOpsPartyL18);
  }
}

// ── Level 16 ──────────────────────────────────────────────────────────────────

export class DomOpsPartyL16 extends _DomOpsPartyBase {
  /** @param {string} name @param {(() => void)|null} [deregister=null] */
  constructor(name, deregister) { super(name, 16, deregister); }

  /** @param {string} name @returns {DomOpsPartyL17} */
  createBranch(name) {
    this._validateBranchName(name);
    return this._addBranch(name, DomOpsPartyL17);
  }
}

// ── Level 15 ──────────────────────────────────────────────────────────────────

export class DomOpsPartyL15 extends _DomOpsPartyBase {
  /** @param {string} name @param {(() => void)|null} [deregister=null] */
  constructor(name, deregister) { super(name, 15, deregister); }

  /** @param {string} name @returns {DomOpsPartyL16} */
  createBranch(name) {
    this._validateBranchName(name);
    return this._addBranch(name, DomOpsPartyL16);
  }
}

// ── Level 14 ──────────────────────────────────────────────────────────────────

export class DomOpsPartyL14 extends _DomOpsPartyBase {
  /** @param {string} name @param {(() => void)|null} [deregister=null] */
  constructor(name, deregister) { super(name, 14, deregister); }

  /** @param {string} name @returns {DomOpsPartyL15} */
  createBranch(name) {
    this._validateBranchName(name);
    return this._addBranch(name, DomOpsPartyL15);
  }
}

// ── Level 13 ──────────────────────────────────────────────────────────────────

export class DomOpsPartyL13 extends _DomOpsPartyBase {
  /** @param {string} name @param {(() => void)|null} [deregister=null] */
  constructor(name, deregister) { super(name, 13, deregister); }

  /** @param {string} name @returns {DomOpsPartyL14} */
  createBranch(name) {
    this._validateBranchName(name);
    return this._addBranch(name, DomOpsPartyL14);
  }
}

// ── Level 12 ──────────────────────────────────────────────────────────────────

export class DomOpsPartyL12 extends _DomOpsPartyBase {
  /** @param {string} name @param {(() => void)|null} [deregister=null] */
  constructor(name, deregister) { super(name, 12, deregister); }

  /** @param {string} name @returns {DomOpsPartyL13} */
  createBranch(name) {
    this._validateBranchName(name);
    return this._addBranch(name, DomOpsPartyL13);
  }
}

// ── Level 11 ──────────────────────────────────────────────────────────────────

export class DomOpsPartyL11 extends _DomOpsPartyBase {
  /** @param {string} name @param {(() => void)|null} [deregister=null] */
  constructor(name, deregister) { super(name, 11, deregister); }

  /** @param {string} name @returns {DomOpsPartyL12} */
  createBranch(name) {
    this._validateBranchName(name);
    return this._addBranch(name, DomOpsPartyL12);
  }
}

// ── Level 10 ──────────────────────────────────────────────────────────────────

export class DomOpsPartyL10 extends _DomOpsPartyBase {
  /** @param {string} name @param {(() => void)|null} [deregister=null] */
  constructor(name, deregister) { super(name, 10, deregister); }

  /** @param {string} name @returns {DomOpsPartyL11} */
  createBranch(name) {
    this._validateBranchName(name);
    return this._addBranch(name, DomOpsPartyL11);
  }
}

// ── Level 9 ───────────────────────────────────────────────────────────────────

export class DomOpsPartyL9 extends _DomOpsPartyBase {
  /** @param {string} name @param {(() => void)|null} [deregister=null] */
  constructor(name, deregister) { super(name, 9, deregister); }

  /** @param {string} name @returns {DomOpsPartyL10} */
  createBranch(name) {
    this._validateBranchName(name);
    return this._addBranch(name, DomOpsPartyL10);
  }
}

// ── Level 8 ───────────────────────────────────────────────────────────────────

export class DomOpsPartyL8 extends _DomOpsPartyBase {
  /** @param {string} name @param {(() => void)|null} [deregister=null] */
  constructor(name, deregister) { super(name, 8, deregister); }

  /** @param {string} name @returns {DomOpsPartyL9} */
  createBranch(name) {
    this._validateBranchName(name);
    return this._addBranch(name, DomOpsPartyL9);
  }
}

// ── Level 7 ───────────────────────────────────────────────────────────────────

export class DomOpsPartyL7 extends _DomOpsPartyBase {
  /** @param {string} name @param {(() => void)|null} [deregister=null] */
  constructor(name, deregister) { super(name, 7, deregister); }

  /** @param {string} name @returns {DomOpsPartyL8} */
  createBranch(name) {
    this._validateBranchName(name);
    return this._addBranch(name, DomOpsPartyL8);
  }
}

// ── Level 6 ───────────────────────────────────────────────────────────────────

export class DomOpsPartyL6 extends _DomOpsPartyBase {
  /** @param {string} name @param {(() => void)|null} [deregister=null] */
  constructor(name, deregister) { super(name, 6, deregister); }

  /** @param {string} name @returns {DomOpsPartyL7} */
  createBranch(name) {
    this._validateBranchName(name);
    return this._addBranch(name, DomOpsPartyL7);
  }
}

// ── Level 5 ───────────────────────────────────────────────────────────────────

export class DomOpsPartyL5 extends _DomOpsPartyBase {
  /** @param {string} name @param {(() => void)|null} [deregister=null] */
  constructor(name, deregister) { super(name, 5, deregister); }

  /** @param {string} name @returns {DomOpsPartyL6} */
  createBranch(name) {
    this._validateBranchName(name);
    return this._addBranch(name, DomOpsPartyL6);
  }
}

// ── Level 4 ───────────────────────────────────────────────────────────────────

export class DomOpsPartyL4 extends _DomOpsPartyBase {
  /** @param {string} name @param {(() => void)|null} [deregister=null] */
  constructor(name, deregister) { super(name, 4, deregister); }

  /** @param {string} name @returns {DomOpsPartyL5} */
  createBranch(name) {
    this._validateBranchName(name);
    return this._addBranch(name, DomOpsPartyL5);
  }
}

// ── Level 3 ───────────────────────────────────────────────────────────────────

export class DomOpsPartyL3 extends _DomOpsPartyBase {
  /** @param {string} name @param {(() => void)|null} [deregister=null] */
  constructor(name, deregister) { super(name, 3, deregister); }

  /** @param {string} name @returns {DomOpsPartyL4} */
  createBranch(name) {
    this._validateBranchName(name);
    return this._addBranch(name, DomOpsPartyL4);
  }
}

// ── Level 2 ───────────────────────────────────────────────────────────────────

export class DomOpsPartyL2 extends _DomOpsPartyBase {
  /** @param {string} name @param {(() => void)|null} [deregister=null] */
  constructor(name, deregister) { super(name, 2, deregister); }

  /** @param {string} name @returns {DomOpsPartyL3} */
  createBranch(name) {
    this._validateBranchName(name);
    return this._addBranch(name, DomOpsPartyL3);
  }
}

// ── Level 1 ───────────────────────────────────────────────────────────────────

export class DomOpsPartyL1 extends _DomOpsPartyBase {
  /** @param {string} name @param {(() => void)|null} [deregister=null] */
  constructor(name, deregister) { super(name, 1, deregister); }

  /** @param {string} name @returns {DomOpsPartyL2} */
  createBranch(name) {
    this._validateBranchName(name);
    return this._addBranch(name, DomOpsPartyL2);
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
  createBranch(name) {
    this._validateBranchName(name);
    return this._addBranch(name, DomOpsPartyL1);
  }
}

// ─── Global singleton ────────────────────────────────────────────────────────
export const domOpsParty = new DomOpsParty('root');

/** Sentinel owner for the root — module-scoped, never GC'd. */
const partyChief = Object.freeze({ toString: () => 'partyChief' });
domOpsParty.activate(partyChief);
