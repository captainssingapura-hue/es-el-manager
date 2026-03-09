/**
 * _DomOpsPartyBase.js
 *
 * Internal base class shared by all DomOpsParty level types.
 * Not part of the public API — import from DomOpsParty.js instead.
 *
 * Responsibilities:
 *  - Registers the ManagedComponent constructor token at module load time so
 *    that _mc() is the only way to create ManagedComponent instances anywhere
 *    in the application.
 *  - Holds all private state: name, depth, parent, secretary, branches.
 *  - Implements the branch inspection/dissolution API.
 *  - Exposes _validateBranchName and _addBranch as protected helpers so that
 *    each level's createBranch override can validate then store in one line.
 *  - Provides a default createBranch that always throws RangeError
 *    (used as-is by DomOpsPartyL18, the deepest level).
 *
 * Secretary / secretaryComponent
 * ───────────────────────────────
 * Each party node has a permanent secretary ManagedComponent — the sole member
 * of the node. By default the secretary wraps the party node itself, but
 * callers may supply a secretaryComponent so the secretary wraps their own
 * object instead.
 *
 * This matters for destroyComponent(branch.secretary): ElementManager calls
 * secretary.onDestroy() which delegates to secretary.component.onDestroy().
 * Passing `this` (the owning component) as secretaryComponent means teardown
 * flows to the correct onDestroy() implementation on the component.
 *
 * Usage:
 *   const branch = domOpsParty.createBranch('ui', myComponent);
 *   // branch.secretary.component === myComponent
 *   elementManager.destroyComponent(branch.secretary);
 *   // → myComponent.onDestroy() is called
 *
 * dissolve() — integrated teardown
 * ─────────────────────────────────
 * branch.dissolve() is the preferred single-call teardown for components that
 * own a branch. It:
 *  1. Recursively dissolves all sub-branches (depth-first).
 *  2. Calls elementManager.removeAllElementsForComponent(member) for every
 *     member of every dissolved node — no manual returnElement() needed.
 *  3. Removes this branch from its parent's branch map.
 *
 * Components therefore only need to:
 *   - Remove their own DOM wrapper (unmanaged div).
 *   - Call branch.dissolve().
 *   - Null their branch reference.
 *
 * Note: dissolve() uses removeAllElementsForComponent (not destroyComponent),
 * so onDestroy() hooks on nested members are NOT re-invoked. DOM cleanup of
 * nested cards is automatic because child wrappers live inside the parent's
 * wrapper — removing the parent wrapper cascades to all descendants.
 */

import { ManagedComponent, _registerConstructorToken } from '../ManagedComponent.js';
import { elementManager } from '../elementManager.js';

// ── Token registration ────────────────────────────────────────────────────────
// The symbol is never exported, so only code in this file can mint new
// ManagedComponent instances. All external callers must go through the party.

const MC_TOKEN = Symbol('DomOpsParty.MC');
_registerConstructorToken(MC_TOKEN);

/**
 * Private factory — the sole authorised constructor for ManagedComponent.
 * @param {*} component
 * @returns {ManagedComponent}
 */
function _mc(component) {
  return new ManagedComponent(component, MC_TOKEN);
}

// ─────────────────────────────────────────────────────────────────────────────

const VALID_NAME = /^[a-zA-Z0-9_-]+$/;

export class _DomOpsPartyBase {
  /** @type {string} */
  #name;

  /** @type {number} */
  #depth;

  /** @type {_DomOpsPartyBase|null} */
  #parent;

  /** @type {ManagedComponent} — sole permanent member of this party node */
  #secretary;

  /** @type {Map<string, _DomOpsPartyBase>} */
  #branches;

  /**
   * @param {string}               name               - Party/branch label. [a-zA-Z0-9_-]+
   * @param {_DomOpsPartyBase|null} parent             - Parent node; null for the root singleton.
   * @param {number}               depth              - Distance from root (0 = root, 18 = max).
   * @param {*}                    [secretaryComponent] - Object the secretary wraps. Defaults to
   *                                                    the party node itself when omitted/null.
   *
   * Called only from subclass constructors — never directly by application code.
   */
  constructor(name, parent, depth, secretaryComponent = null) {
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
    this.#secretary = _mc(secretaryComponent ?? this);
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
   * that belong to this branch. When a secretaryComponent was supplied to
   * createBranch, destroyComponent(secretary) will call that component's
   * onDestroy() directly.
   *
   * @returns {ManagedComponent}
   */
  get secretary() { return this.#secretary; }

  /** Always 1 — the secretary is the sole member. @returns {number} */
  get memberCount() { return 1; }

  /** Number of direct child branches. @returns {number} */
  get branchCount() { return this.#branches.size; }

  // ── Membership ────────────────────────────────────────────────────────────

  /**
   * Returns true if the given ManagedComponent is the secretary of this node.
   * Each node has exactly one member: its secretary.
   *
   * @param {ManagedComponent} mc
   * @returns {boolean}
   */
  hasMember(mc) {
    return mc === this.#secretary;
  }

  /**
   * Returns the secretary as the sole member of this node.
   *
   * @returns {ManagedComponent[]}
   */
  listMembers() {
    return [this.#secretary];
  }

  // ── Branches ──────────────────────────────────────────────────────────────

  /**
   * Creates a named child branch at depth + 1.
   * Each level class overrides this to return the next concrete level type.
   * DomOpsPartyL18 does not override it — this default always throws.
   *
   * @param {string} name
   * @param {*}      [component] - Optional object to use as the branch secretary's
   *                               wrapped component (see class header).
   * @throws {RangeError} Always — maximum depth (18) has been reached.
   */
  createBranch(name, component = null) {
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
   * Recursively dissolves all sub-branches of the named branch, cleans up
   * every ElementManager entry owned by any member of the dissolved subtree,
   * then removes the branch from this party's branch map.
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
   * Dissolves this branch: cleans up all ElementManager entries for every
   * member in this subtree (depth-first), clears all sub-branches, then
   * removes this node from its parent's branch map.
   *
   * This is the preferred single-call teardown for components that own a
   * branch. After calling dissolve(), null your branch reference — the object
   * must not be used again.
   */
  dissolve() {
    this._dissolveTree();
    this.#parent?._removeBranch(this.#name);
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
           `branches=${this.#branches.size})`;
  }

  // ── Protected helpers — for subclass createBranch overrides only ──────────

  /**
   * Depth-first recursive teardown used by both dissolveBranch() and dissolve().
   * For every node in the subtree rooted here:
   *  - Recursively calls _dissolveTree() on each child branch.
   *  - Calls elementManager.removeAllElementsForComponent(secretary) to clean
   *    the registry for this node's secretary.
   *  - Clears the branch map of this node.
   *
   * Does NOT remove this node from its parent — that is the caller's job.
   * (dissolveBranch deletes from #branches; dissolve calls _removeBranch.)
   */
  _dissolveTree() {
    for (const branch of this.#branches.values()) {
      branch._dissolveTree();
    }
    this.#branches.clear();
    elementManager.removeAllElementsForComponent(this.#secretary);
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

}
