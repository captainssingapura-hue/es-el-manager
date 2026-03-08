/**
 * ManagedComponent.js
 *
 * Wrapper class. Obtained exclusively through DomOpsParty:
 *   - branch.secretary  — the branch's permanent representative
 *   - branch.join(obj)  — enrols any object and returns a ManagedComponent
 *
 * Direct construction (`new ManagedComponent(...)`) is prevented at runtime
 * by a private module-level token that only _DomOpsPartyBase can supply.
 *
 *  1. Type identity — ElementManager uses `instanceof ManagedComponent` as
 *     the sole gate for createElement / returnElement / destroyComponent.
 *  2. onDestroy() delegation — calls the wrapped component's onDestroy() if
 *     present. ElementManager invokes this during destroyComponent().
 *
 * No element tracking. No knowledge of ElementManager or DomOpsParty internals.
 */

/** @type {symbol|null} — set once by _DomOpsPartyBase at module load time */
let _token = null;

/**
 * Registers the constructor token that authorises ManagedComponent creation.
 * May only be called once — invoked by _DomOpsPartyBase during its own
 * module initialisation. Subsequent calls throw.
 *
 * @param {symbol} symbol
 */
export function _registerConstructorToken(symbol) {
  if (_token !== null) {
    throw new Error('[ManagedComponent] Constructor token already registered.');
  }
  _token = symbol;
}

export class ManagedComponent {
  #component;

  /**
   * @param {object|null} component - The plain object/instance being wrapped.
   * @param {symbol}      token     - Internal token; only _DomOpsPartyBase may supply this.
   */
  constructor(component, token) {
    if (_token === null || token !== _token) {
      throw new TypeError(
        '[ManagedComponent] Direct construction is not allowed. ' +
        'Obtain a ManagedComponent via branch.join() or branch.secretary.'
      );
    }
    this.#component = component ?? null;
  }

  /** Returns the wrapped component instance. */
  get component() { return this.#component; }

  /**
   * Called by ElementManager.destroyComponent() before it releases all
   * elements owned by this wrapper. Delegates to the wrapped component's
   * onDestroy() if present.
   *
   * Do NOT call elementManager.returnElement() here — ElementManager handles
   * that automatically after this hook returns.
   */
  onDestroy() {
    if (typeof this.#component?.onDestroy === 'function') {
      this.#component.onDestroy();
    }
  }
}
