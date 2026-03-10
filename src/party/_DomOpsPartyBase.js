/**
 * _DomOpsPartyBase.js
 *
 * Internal base class shared by all DomOpsParty level types.
 * Not part of the public API — import from DomOpsParty.js instead.
 *
 * Each party node:
 *  - Has a name, depth, and optional parent.
 *  - Owns a set of named DOM elements created via createElement().
 *    This is the only sanctioned way to create DOM elements — no component
 *    may call document.createElement() directly.
 *  - Can have named child branches created via createBranch() overrides.
 *
 * dissolve() — integrated teardown
 * ─────────────────────────────────
 * branch.dissolve() is the single-call teardown for any branch. It:
 *  1. Recursively dissolves all sub-branches (depth-first).
 *  2. Calls _releaseAll() on every dissolved node — removes each owned
 *     DOM element from the document and clears the element map.
 *  3. Removes this branch from its parent's branch map.
 *
 * After dissolve(), the entire DOM subtree and party subtree rooted here
 * are clean. No manual element removal is needed.
 */

const VALID_NAME = /^[a-zA-Z0-9_-]+$/;

export class _DomOpsPartyBase {
  /** @type {string} */
  #name;

  /** @type {number} */
  #depth;

  /** @type {_DomOpsPartyBase|null} */
  #parent;

  /** @type {Map<string, HTMLElement>} — elements owned by this branch */
  #elements;

  /** @type {Map<string, _DomOpsPartyBase>} */
  #branches;

  /** @type {WeakRef|null} — weak reference to the object that owns this branch */
  #ownerRef = null;

  /**
   * @param {string}               name   - Branch label. [a-zA-Z0-9_-]+
   * @param {_DomOpsPartyBase|null} parent - Parent node; null for the root singleton.
   * @param {number}               depth  - Distance from root (0 = root, 18 = max).
   */
  constructor(name, parent, depth) {
    if (typeof name !== 'string' || name.trim() === '') {
      throw new TypeError(
        `[DomOpsParty] name must be a non-empty string. Received: ${JSON.stringify(name)}`
      );
    }
    if (!VALID_NAME.test(name)) {
      throw new RangeError(
        `[DomOpsParty] name "${name}" contains invalid characters. ` +
        `Only letters, digits, underscores, and hyphens are allowed.`
      );
    }

    this.#name     = name;
    this.#depth    = depth;
    this.#parent   = parent ?? null;
    this.#elements = new Map();
    this.#branches = new Map();
  }

  // ── Getters ───────────────────────────────────────────────────────────────

  /**
   * Whether the registered owner of this branch is still alive.
   *
   * Returns:
   *   null  — no owner registered (root or unowned branch)
   *   true  — owner object is reachable (not a leak)
   *   false — owner has been garbage-collected → this branch is leaked
   *
   * @returns {boolean|null}
   */
  get isOwnerAlive() {
    if (this.#ownerRef === null) return null;
    return this.#ownerRef.deref() !== undefined;
  }

  /** Human-readable label for this party node. @returns {string} */
  get name()  { return this.#name; }

  /** Distance from the root singleton (0 = root, 18 = deepest). @returns {number} */
  get depth() { return this.#depth; }

  /** Parent party node, or null if this is the root. @returns {_DomOpsPartyBase|null} */
  get parent() { return this.#parent; }

  // ── Element management ────────────────────────────────────────────────────

  /**
   * Creates a DOM element, registers it under this branch, and returns it.
   *
   * This is the only sanctioned way to create DOM elements in the application.
   * Components must never call document.createElement() directly.
   *
   * @param {string} name    - Unique name within this branch. [a-zA-Z0-9_-]+
   * @param {string} tagName - Valid HTML tag name.
   * @returns {HTMLElement}
   *
   * @throws {TypeError}  If name or tagName are not non-empty strings, or name
   *                      contains invalid characters.
   * @throws {RangeError} If name is already in use on this branch.
   */
  createElement(name, tagName) {
    if (typeof name !== 'string' || name.trim() === '') {
      throw new TypeError(
        `[DomOpsParty] createElement: name must be a non-empty string. ` +
        `Received: ${JSON.stringify(name)}`
      );
    }
    if (!VALID_NAME.test(name)) {
      throw new RangeError(
        `[DomOpsParty] createElement: name "${name}" contains invalid characters. ` +
        `Only letters, digits, underscores, and hyphens are allowed.`
      );
    }
    if (this.#elements.has(name)) {
      throw new RangeError(
        `[DomOpsParty] createElement: name "${name}" is already in use ` +
        `on branch "${this.#name}".`
      );
    }
    if (typeof tagName !== 'string' || tagName.trim() === '') {
      throw new TypeError(
        `[DomOpsParty] createElement: tagName must be a non-empty string. ` +
        `Received: ${JSON.stringify(tagName)}`
      );
    }

    const el = document.createElement(tagName);
    this.#elements.set(name, el);
    return el;
  }

  /**
   * Returns a previously created element by name, or null if not found.
   *
   * @param {string} name
   * @returns {HTMLElement|null}
   */
  getElement(name) {
    return this.#elements.get(name) ?? null;
  }

  /**
   * Descriptors for all elements owned by this branch (excludes sub-branches).
   *
   * @returns {{ name: string, tagName: string }[]}
   */
  listElements() {
    return [...this.#elements.entries()].map(([name, el]) => ({
      name,
      tagName: el.tagName.toLowerCase(),
    }));
  }

  /** Number of elements directly owned by this branch. @returns {number} */
  get elementCount() { return this.#elements.size; }

  // ── Branches ──────────────────────────────────────────────────────────────

  /** Number of direct child branches. @returns {number} */
  get branchCount() { return this.#branches.size; }

  /**
   * Creates a named child branch at depth + 1.
   * Each level class overrides this to return the next concrete level type.
   * DomOpsPartyL18 does not override — this default always throws.
   *
   * @param {string} name
   * @throws {RangeError} Always — maximum depth (18) has been reached.
   */
  createBranch(name) {
    throw new RangeError(
      `[DomOpsParty] createBranch: Maximum branch depth (18) reached. ` +
      `Cannot create branch "${name}".`
    );
  }

  /**
   * Returns the named child branch, or null if it does not exist.
   *
   * @param {string} name
   * @returns {_DomOpsPartyBase|null}
   */
  getBranch(name) {
    return this.#branches.get(name) ?? null;
  }

  /** @param {string} name @returns {boolean} */
  hasBranch(name) {
    return this.#branches.has(name);
  }

  /** Names of all direct child branches. @returns {string[]} */
  listBranches() {
    return [...this.#branches.keys()];
  }

  /**
   * Recursively dissolves the named child branch: releases all elements in
   * the subtree (depth-first), clears all its sub-branches, then removes it
   * from this node's branch map.
   *
   * @param {string} name
   * @throws {ReferenceError} If no branch with that name exists.
   */
  dissolveBranch(name) {
    const branch = this.#branches.get(name);
    if (!branch) {
      throw new ReferenceError(
        `[DomOpsParty] dissolveBranch: No branch named "${name}" found at this level.`
      );
    }
    branch._dissolveTree();
    this.#branches.delete(name);
  }

  /**
   * Dissolves this branch: recursively releases all elements in the subtree,
   * clears all sub-branches, then removes this node from its parent.
   *
   * This is the preferred single-call teardown. After dissolve(), null your
   * branch reference — the object must not be used again.
   */
  dissolve() {
    this._dissolveTree();
    this.#parent?._removeBranch(this.#name);
  }

  // ── Inspection ────────────────────────────────────────────────────────────

  toString() {
    return `DomOpsParty("${this.#name}", depth=${this.#depth}, ` +
           `elements=${this.#elements.size}, branches=${this.#branches.size})`;
  }

  // ── Protected helpers — for subclass createBranch overrides only ──────────

  /**
   * Depth-first recursive teardown used by both dissolveBranch() and dissolve().
   * For every node in the subtree rooted here:
   *  - Recursively calls _dissolveTree() on each child branch.
   *  - Calls _releaseAll() to remove all owned elements from the DOM and
   *    clear the element map.
   *  - Clears the branch map of this node.
   *
   * Does NOT remove this node from its parent — that is the caller's job.
   */
  _dissolveTree() {
    for (const branch of this.#branches.values()) {
      branch._dissolveTree();
    }
    this.#branches.clear();
    this._releaseAll();
  }

  /**
   * Removes all owned DOM elements from the document and clears the element map.
   * Called by _dissolveTree(). Safe to call on elements already detached from DOM.
   */
  _releaseAll() {
    for (const el of this.#elements.values()) {
      el.remove();
    }
    this.#elements.clear();
  }

  /**
   * Removes a named branch from this node's branch map without triggering
   * any further cleanup. Called by dissolve() on the parent after _dissolveTree()
   * has already run on the child.
   *
   * @param {string} name
   */
  _removeBranch(name) {
    this.#branches.delete(name);
  }

  /**
   * Validates a branch name and asserts it is not already in use at this level.
   *
   * @param {string} name
   * @throws {TypeError}  If name is not a non-empty string.
   * @throws {RangeError} If name contains invalid characters or already exists.
   */
  _validateBranchName(name) {
    if (typeof name !== 'string' || name.trim() === '') {
      throw new TypeError(
        `[DomOpsParty] createBranch: Branch name must be a non-empty string. ` +
        `Received: ${JSON.stringify(name)}`
      );
    }
    if (!VALID_NAME.test(name)) {
      throw new RangeError(
        `[DomOpsParty] createBranch: Branch name "${name}" contains invalid characters. ` +
        `Only letters, digits, underscores, and hyphens are allowed.`
      );
    }
    if (this.#branches.has(name)) {
      throw new RangeError(
        `[DomOpsParty] createBranch: A branch named "${name}" already exists at this level.`
      );
    }
  }

  /**
   * Registers the owner of this branch as a weak reference.
   * When the owner is garbage-collected, isOwnerAlive returns false,
   * signalling that this branch has been leaked.
   *
   * @param {object} owner - The component or object responsible for this branch.
   */
  _setOwner(owner) {
    this.#ownerRef = new WeakRef(owner);
  }

  /**
   * Stores a newly created branch. Call after _validateBranchName.
   * If owner is provided, registers it as the branch's weak owner reference.
   * Returns the branch so createBranch overrides can return it in one line.
   *
   * @param {string}           name
   * @param {_DomOpsPartyBase} branch
   * @param {object|null}      [owner=null]
   * @returns {_DomOpsPartyBase}
   */
  _addBranch(name, branch, owner = null) {
    if (owner !== null) branch._setOwner(owner);
    this.#branches.set(name, branch);
    return branch;
  }
}
