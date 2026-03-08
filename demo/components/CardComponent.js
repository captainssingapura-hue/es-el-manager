/**
 * CardComponent.js
 * Good example — composes ManagedComponent via DomOpsParty, uses ElementId for multi-level ids.
 *
 * Each instance receives a unique cardId which is used as the top-level
 * segment of every ElementId it creates. Sub-cards extend the segment path:
 *
 *   cardId = 'a1b2c3'
 *   → ElementId(['a1b2c3', 'title'])   key: "a1b2c3.title"
 *   → ElementId(['a1b2c3', 'body'])    key: "a1b2c3.body"
 *   → ElementId(['a1b2c3', 'close'])   key: "a1b2c3.close"
 *
 *   Sub-card with cardId = 'x9y8z7' inside 'a1b2c3':
 *   → ElementId(['a1b2c3', 'x9y8z7', 'title'])   key: "a1b2c3.x9y8z7.title"
 *
 * Multiple cards can coexist without id collisions because every element
 * lives under its own cardId namespace in the registry tree.
 *
 * Party integration
 * ─────────────────
 * Every card owns a named party branch so the party tree mirrors the card
 * hierarchy:
 *
 *   domOpsParty (L0)
 *     └─ branch 'a1b2c3'  (L1, top-level card)
 *          └─ branch 'x9y8z7'  (L2, sub-card)
 *               └─ …
 *
 * Each branch is created with createBranch(cardId, this) so the secretary
 * wraps the card itself — destroyComponent(secretary) routes to this
 * card's onDestroy().
 *
 * Teardown
 * ────────
 * Cards self-close via the ✕ button (the sole teardown path):
 *   1. Remove the DOM wrapper  (cascade-removes all child card wrappers too).
 *   2. branch.dissolve()       (recursively cleans registry + party for the
 *                               entire subtree — no per-element returnElement).
 *
 * No onDestroy() is defined — destroyComponent() is not used for cards.
 * No child-component tracking is needed — the party branch tree already mirrors
 * the hierarchy, so dissolve() handles every descendant automatically.
 */

import { elementManager }  from '../../src/elementManager.js';
import { ElementId }       from '../../src/ElementId.js';
import { domOpsParty }     from '../../src/party/DomOpsParty.js';

export class CardComponent {
  #branch       = null;  // DomOpsParty branch; secretary wraps this card instance
  #cardId       = null;
  #depth        = 0;
  #segments     = null;
  #idTitle      = null;
  #idBody       = null;
  #idClose      = null;
  #idAddSub     = null;   // null when depth >= 5
  #wrapper      = null;
  #childrenZone = null;   // plain unmanaged div; holds sub-card wrappers
  #onClose      = null;
  #onRefresh    = null;

  /**
   * @param {string} cardId - Unique identifier for this card instance.
   *                          Used as the root segment of all child ElementIds.
   * @param {object} [opts]
   * @param {number} [opts.depth=0]              - Nesting depth; controls sub-card button visibility.
   * @param {string[]} [opts.segments]           - Full segment path; defaults to [cardId].
   * @param {_DomOpsPartyBase} [opts.parentBranch] - Party branch to nest under.
   *                                               Top-level cards omit this (uses domOpsParty root).
   */
  constructor(cardId, { depth = 0, segments = null, parentBranch = null } = {}) {
    if (typeof cardId !== 'string' || cardId.trim() === '') {
      throw new TypeError(`[CardComponent] cardId must be a non-empty string. Received: ${cardId}`);
    }
    this.#cardId   = cardId;
    this.#depth    = depth;
    this.#segments = segments ?? [cardId];

    // Secretary wraps this card so destroyComponent(branch.secretary) → this.onDestroy().
    // Top-level cards branch off the root; sub-cards branch off their parent's branch.
    this.#branch = (parentBranch ?? domOpsParty).createBranch(cardId, this);

    this.#idTitle = new ElementId([...this.#segments, 'title']);
    this.#idBody  = new ElementId([...this.#segments, 'body']);
    this.#idClose = new ElementId([...this.#segments, 'close']);
    if (depth < 5) {
      this.#idAddSub = new ElementId([...this.#segments, 'add-sub']);
    }
  }

  get cardId() { return this.#cardId; }
  get mc()     { return this.#branch?.secretary ?? null; }

  /**
   * @param {HTMLElement} zone        - Container to append into.
   * @param {Function}   [onClose]    - Called after the card has closed itself.
   * @param {Function}   [onRefresh]  - Called after any descendant change (sub-card add/remove).
   */
  mount(zone, onClose = null, onRefresh = null) {
    this.#onClose   = onClose;
    this.#onRefresh = onRefresh;

    const titleEl = elementManager.createElement(this.#branch.secretary, this.#idTitle, 'h2');
    const bodyEl  = elementManager.createElement(this.#branch.secretary, this.#idBody,  'p');
    const closeEl = elementManager.createElement(this.#branch.secretary, this.#idClose, 'button');

    titleEl.textContent = `Card  ·  ${this.#cardId}`;
    bodyEl.textContent  = `Elements tracked under namespace "${this.#segments.join('.')}".`;
    closeEl.textContent = '✕';
    closeEl.className   = 'card-close-btn';
    closeEl.title       = 'Close — branch.dissolve() removes all owned elements';
    closeEl.addEventListener('click', () => this.#close());

    this.#wrapper = document.createElement('div');
    this.#wrapper.className = 'managed-card';
    this.#wrapper.dataset.depth = String(this.#depth);

    const tag = document.createElement('div');
    tag.className = 'tag';
    const idList = [this.#idTitle, this.#idBody, this.#idClose, this.#idAddSub]
      .filter(Boolean).map(id => id.toString()).join('  ');
    tag.textContent = `▸ CardComponent  ·  ${idList}`;

    const header = document.createElement('div');
    header.className = 'card-header';
    header.append(titleEl, closeEl);

    this.#wrapper.append(tag, header, bodyEl);

    if (this.#idAddSub) {
      const addSubEl = elementManager.createElement(this.#branch.secretary, this.#idAddSub, 'button');
      addSubEl.textContent = '+ Add Sub-card';
      addSubEl.className   = 'btn btn-create card-add-sub-btn';
      addSubEl.title       = `Add a nested sub-card (depth ${this.#depth + 1}/5)`;
      addSubEl.addEventListener('click', () => this.#spawnSubCard());
      this.#wrapper.appendChild(addSubEl);
    }

    this.#childrenZone = document.createElement('div');
    this.#childrenZone.className = 'sub-card-zone';
    this.#wrapper.appendChild(this.#childrenZone);

    zone.appendChild(this.#wrapper);
  }

  /** Spawn a nested sub-card inside this card. */
  #spawnSubCard() {
    const childId = crypto.randomUUID().slice(0, 8);
    const child   = new CardComponent(childId, {
      depth:        this.#depth + 1,
      segments:     [...this.#segments, childId],
      parentBranch: this.#branch,
    });
    child.mount(
      this.#childrenZone,
      () => this.#onRefresh?.(),   // onClose — branch.dissolve() already cleaned registry
      this.#onRefresh,              // onRefresh (propagate up)
    );
    this.#onRefresh?.();
  }

  /**
   * Close handler — remove wrapper (cascades to all child wrappers in DOM),
   * then dissolve the branch (recursively cleans registry + party subtree).
   *
   * This is the sole teardown path for cards. No onDestroy() is defined:
   * cards are never torn down via elementManager.destroyComponent() — the
   * dissolve() call here is sufficient and no external caller needs the hook.
   */
  #close() {
    this.#wrapper?.remove();
    this.#wrapper = null;
    this.#branch?.dissolve();
    this.#branch = null;
    this.#onClose?.();
  }
}
