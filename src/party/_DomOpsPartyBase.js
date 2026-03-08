/**
 * _DomOpsPartyBase.js
 *
 * Internal base class shared by all DomOpsParty level types.
 * Not part of the public API — import from DomOpsParty.js instead.
 *
 * Responsibilities:
 *  - Holds all private state: name, depth, parent, secretary, members, branches.
 *  - Implements the full membership API (join, expel, hasMember, listMembers).
 *  - Implements the full branch inspection/dissolution API.
 *  - Exposes _validateBranchName and _addBranch as protected helpers so that
 *    each level's createBranch override can validate then store in one line.
 *  - Provides a default createBranch that always throws RangeError
 *    (used as-is by DomOpsPartyL18, the deepest level).
 *
 * Design notes:
 *  - The secretary is a ManagedComponent auto-created on construction that
 *    wraps the party instance itself. It is the designated owner for any
 *    ElementManager elements that belong to the party as an entity (not to
 *    any individual member). It is always enrolled and can never be expelled.
 *  - join() creates the ManagedComponent for the caller — callers never
 *    construct ManagedComponent directly.
 *  - No ElementManager calls are made here; DomOpsParty is purely
 *    organisational at this stage.
 */

import { ManagedComponent } from '../ManagedComponent.js';

const VALID_NAME = /^[a-zA-Z0-9_-]+$/;

export class _DomOpsPartyBase {
  /** @type {string} */
  #name;

  /** @type {number} */
  #depth;

  /** @type {_DomOpsPartyBase|null} */
  #parent;

  /** @type {ManagedComponent} — permanent representative of this party node */
  #secretary;

  /** @type {Set<ManagedComponent>} — secretary is always the first element */
  #members;

  /** @type {Map<string, _DomOpsPartyBase>} */
  #branches;

  /**
   * @param {string}               name   - Party/branch label. [a-zA-Z0-9_-]+
   * @param {_DomOpsPartyBase|null} parent - Parent node; null for the root singleton.
   * @param {number}               depth  - Distance from root (0 = root, 18 = max).
   *
   * Called only from subclass constructors — never directly by application code.
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

    this.#name      = name;
    this.#depth     = depth;
    this.#parent    = parent ?? null;
    this.#secretary = new ManagedComponent(this);
    this.#members   = new Set([this.#secretary]);
    this.#branches  = new Map();
  }

  // ── Getters ───────────────────────────────────────────────────────────────

  /** Human-readable label for this party node. @returns {string} */
  get name() { return this.#name; }

  /** Distance from the root singleton (0 = root, 18 = deepest branch). @returns {number} */
  get depth() { return this.#depth; }

  /** Parent party node, or null if this is the root. @returns {_DomOpsPartyBase|null} */
  get parent() { return this.#parent; }

  /**
   * The secretary — the ManagedComponent that represents this party node as
   * an entity in ElementManager. Use this as the owner when creating elements
   * that belong to the party itself rather than to any individual member.
   *
   * @returns {ManagedComponent}
   */
  get secretary() { return this.#secretary; }

  /** Total number of enrolled members (including the secretary). @returns {number} */
  get memberCount() { return this.#members.size; }

  /** Number of direct child branches. @returns {number} */
  get branchCount() { return this.#branches.size; }

  // ── Membership ────────────────────────────────────────────────────────────

  /**
   * Joins the party: wraps component in a new ManagedComponent, enrolls it,
   * and returns the ManagedComponent for the caller to use with ElementManager.
   *
   * component may be any value — a class instance, a plain object, or null.
   * ManagedComponent already normalises null via (component ?? null).
   *
   * @param {*} component - The object joining the party.
   * @returns {ManagedComponent}
   */
  join(component) {
    const mc = new ManagedComponent(component);
    this.#members.add(mc);
    return mc;
  }

  /**
   * Removes a previously joined member from this party.
   * The secretary can never be expelled.
   *
   * @param {ManagedComponent} mc
   * @throws {TypeError}      If mc is not a ManagedComponent instance.
   * @throws {Error}          If mc is this party's secretary.
   * @throws {ReferenceError} If mc is not currently a member of this party.
   */
  expel(mc) {
    this.#assertManagedComponent(mc, 'expel');
    if (mc === this.#secretary) {
      throw new Error(
        `[DomOpsParty] expel: The secretary cannot be expelled from the party.`
      );
    }
    if (!this.#members.has(mc)) {
      throw new ReferenceError(
        `[DomOpsParty] expel: The given ManagedComponent is not a member of this party.`
      );
    }
    this.#members.delete(mc);
  }

  /**
   * Returns true if the given ManagedComponent is currently enrolled.
   *
   * @param {ManagedComponent} mc
   * @returns {boolean}
   */
  hasMember(mc) {
    return this.#members.has(mc);
  }

  /**
   * Snapshot of all enrolled members (secretary included).
   *
   * @returns {ManagedComponent[]}
   */
  listMembers() {
    return [...this.#members];
  }

  // ── Branches ──────────────────────────────────────────────────────────────

  /**
   * Creates a named child branch at depth + 1.
   * Each level class overrides this to return the next concrete level type.
   * DomOpsPartyL18 does not override it — this default always throws.
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

  /**
   * @param {string} name
   * @returns {boolean}
   */
  hasBranch(name) {
    return this.#branches.has(name);
  }

  /**
   * Recursively dissolves all sub-branches of the named branch, then removes
   * the branch itself from this party's branch map.
   *
   * Purely organisational — does not call elementManager. Any ElementManager
   * entries owned by the dissolved branch's secretary or members remain in the
   * registry until explicitly cleaned up by the caller.
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
    // Depth-first recursive dissolution of all descendant branches.
    for (const subName of branch.listBranches()) {
      branch.dissolveBranch(subName);
    }
    this.#branches.delete(name);
  }

  /**
   * Names of all direct child branches.
   *
   * @returns {string[]}
   */
  listBranches() {
    return [...this.#branches.keys()];
  }

  // ── Inspection ────────────────────────────────────────────────────────────

  toString() {
    return `DomOpsParty("${this.#name}", depth=${this.#depth}, ` +
           `members=${this.#members.size}, branches=${this.#branches.size})`;
  }

  // ── Protected helpers — for subclass createBranch overrides only ──────────

  /**
   * Validates a branch name and asserts it is not already in use at this level.
   * Call this at the top of every createBranch override before constructing the
   * child party.
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
   * Stores a newly created branch. Call after _validateBranchName.
   * Returns the branch so createBranch overrides can return it in one line.
   *
   * @param {string}           name
   * @param {_DomOpsPartyBase} branch
   * @returns {_DomOpsPartyBase}
   */
  _addBranch(name, branch) {
    this.#branches.set(name, branch);
    return branch;
  }

  // ── Private guard ─────────────────────────────────────────────────────────

  /**
   * @param {*}      value
   * @param {string} method
   * @throws {TypeError}
   */
  #assertManagedComponent(value, method) {
    if (!(value instanceof ManagedComponent)) {
      throw new TypeError(
        `[DomOpsParty] ${method}: expected a ManagedComponent instance. ` +
        `Received: ${value?.constructor?.name ?? typeof value}.`
      );
    }
  }
}
