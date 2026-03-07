/**
 * elementManager.js
 * Singleton DOM Element Manager
 *
 * All element IDs are ElementId instances — no raw strings in the public API.
 * Internally the registry is keyed by ElementId.key (the dot-joined string)
 * so Map lookups remain O(1).
 */

import { ManagedComponent } from './ManagedComponent.js';
import { ElementId }        from './ElementId.js';

class ElementManager {
  /**
   * @type {Map<string, { element: HTMLElement, owner: ManagedComponent, id: ElementId }>}
   * Keyed by ElementId.key
   */
  #registry = new Map();

  // ── Private guards ────────────────────────────────────────────────────────

  #assertManagedComponent(value, method) {
    if (!(value instanceof ManagedComponent)) {
      throw new TypeError(
        `[ElementManager] ${method}: owner must be a ManagedComponent instance. ` +
        `Received: ${value?.constructor?.name ?? typeof value}.`
      );
    }
  }

  #assertElementId(value, method) {
    if (!(value instanceof ElementId)) {
      throw new TypeError(
        `[ElementManager] ${method}: elementId must be an ElementId instance. ` +
        `Received: ${value?.constructor?.name ?? typeof value}. ` +
        `Construct one with: new ElementId(['segment', 'segment', ...])`
      );
    }
  }

  // ── Public API ────────────────────────────────────────────────────────────

  /**
   * Creates a DOM element, registers it under the given component, and returns it.
   * The element's id attribute is set to the ElementId's dot-joined key.
   *
   * @param {ManagedComponent} owner
   * @param {ElementId}        elementId
   * @param {string}           elementType - Valid HTML tag name.
   * @returns {HTMLElement}
   *
   * @throws {TypeError}  If owner or elementId are wrong types, or elementType invalid.
   * @throws {RangeError} If elementId is already in use.
   */
  createElement(owner, elementId, elementType) {
    this.#assertManagedComponent(owner, 'createElement');
    this.#assertElementId(elementId, 'createElement');

    if (typeof elementType !== 'string' || elementType.trim() === '') {
      throw new TypeError(
        `[ElementManager] createElement: elementType must be a non-empty string. Received: ${elementType}`
      );
    }
    if (this.#registry.has(elementId.key)) {
      throw new RangeError(
        `[ElementManager] createElement: elementId "${elementId}" is already in use.`
      );
    }

    const element = document.createElement(elementType);
    element.id = elementId.key;
    this.#registry.set(elementId.key, { element, owner, id: elementId });

    return element;
  }

  /**
   * Returns (releases) a single element back to the manager.
   * The element is detached from the DOM and removed from the registry.
   *
   * @param {ManagedComponent} owner
   * @param {ElementId}        elementId
   *
   * @throws {TypeError}      If owner or elementId are wrong types.
   * @throws {ReferenceError} If elementId is not found in the registry.
   * @throws {Error}          If the caller is not the registered owner.
   */
  returnElement(owner, elementId) {
    this.#assertManagedComponent(owner, 'returnElement');
    this.#assertElementId(elementId, 'returnElement');

    const record = this.#registry.get(elementId.key);

    if (!record) {
      throw new ReferenceError(
        `[ElementManager] returnElement: No element found with id "${elementId}".`
      );
    }
    if (record.owner !== owner) {
      throw new Error(
        `[ElementManager] returnElement: Caller is not the registered owner of "${elementId}". ` +
        `Only the original creator may return an element.`
      );
    }

    record.element.remove();
    this.#registry.delete(elementId.key);
  }

  /**
   * Releases all elements owned by the given component in one operation.
   * Each matched element is detached from the DOM and removed from the registry.
   *
   * @param {ManagedComponent} owner
   * @throws {TypeError} If owner is not a ManagedComponent instance.
   */
  removeAllElementsForComponent(owner) {
    this.#assertManagedComponent(owner, 'removeAllElementsForComponent');

    for (const [key, record] of this.#registry) {
      if (record.owner === owner) {
        record.element.remove();
        this.#registry.delete(key);
      }
    }
  }

  /**
   * Destroys a component cleanly:
   *  1. Calls component.onDestroy() for DOM/state teardown.
   *  2. Calls removeAllElementsForComponent() as a safety net.
   *
   * @param {ManagedComponent} component
   * @throws {TypeError} If component is not a ManagedComponent instance.
   */
  destroyComponent(component) {
    this.#assertManagedComponent(component, 'destroyComponent');
    component.onDestroy();
    this.removeAllElementsForComponent(component);
  }

  // ── Inspection ────────────────────────────────────────────────────────────

  /**
   * Retrieves a managed element by ElementId without releasing it.
   *
   * @param {ElementId} elementId
   * @returns {HTMLElement|null}
   */
  getElement(elementId) {
    this.#assertElementId(elementId, 'getElement');
    return this.#registry.get(elementId.key)?.element ?? null;
  }

  /**
   * Returns true if an ElementId is currently registered.
   *
   * @param {ElementId} elementId
   * @returns {boolean}
   */
  has(elementId) {
    this.#assertElementId(elementId, 'has');
    return this.#registry.has(elementId.key);
  }

  /**
   * Number of elements currently tracked.
   *
   * @returns {number}
   */
  get size() {
    return this.#registry.size;
  }

  /**
   * All ElementId instances currently registered.
   *
   * @returns {ElementId[]}
   */
  listIds() {
    return [...this.#registry.values()].map(r => r.id);
  }

  /**
   * All ElementIds currently owned by a specific component.
   *
   * @param {ManagedComponent} owner
   * @returns {ElementId[]}
   */
  listIdsForComponent(owner) {
    this.#assertManagedComponent(owner, 'listIdsForComponent');
    return [...this.#registry.values()]
      .filter(r => r.owner === owner)
      .map(r => r.id);
  }

  /**
   * All ElementIds whose key starts with the given prefix ElementId.
   * Useful for bulk operations on a component subtree.
   *
   * @param {ElementId} prefix
   * @returns {ElementId[]}
   */
  /**
   * Returns the owner component for the given ElementId, or null if not found.
   *
   * @param {ElementId} elementId
   * @returns {ManagedComponent|null}
   */
  getOwner(elementId) {
    this.#assertElementId(elementId, 'getOwner');
    return this.#registry.get(elementId.key)?.owner ?? null;
  }

  listIdsByPrefix(prefix) {
    this.#assertElementId(prefix, 'listIdsByPrefix');
    return [...this.#registry.values()]
      .filter(r => r.id.hasPrefix(prefix))
      .map(r => r.id);
  }
}

// ─── Singleton export ────────────────────────────────────────────────────────
export const elementManager = new ElementManager();

// Re-export ManagedComponent so all consumers import it through a single path,
// preventing the duplicate-evaluation that breaks instanceof checks.
export { ManagedComponent } from './ManagedComponent.js';
