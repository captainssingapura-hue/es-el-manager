/**
 * CardComponent.js
 *
 * Multi-instance card. Each instance owns a named party branch and creates
 * all its DOM elements through that branch — no document.createElement().
 *
 * Sub-cards nest inside the parent's 'children-zone' element and branch off
 * the parent's party branch, mirroring the component hierarchy:
 *
 *   domOpsParty (L0)
 *     └─ branch 'a1b2c3'  (L1, top-level card)
 *          └─ branch 'x9y8z7'  (L2, sub-card)
 *               └─ …
 *
 * Elements owned per card (depth < 5 shown; depth ≥ 5 omits 'add-sub'):
 *   wrapper, tag, header, title, body, close, add-sub, children-zone
 *
 * Teardown
 * ────────
 * Cards self-close via the ✕ button:
 *   branch.dissolve() — depth-first: sub-branches release their elements
 *   first, then this branch releases its own (wrapper last, cascading all
 *   child DOM nodes out of the document in one step).
 *
 * No onDestroy(), no explicit wrapper.remove() — dissolve() handles everything.
 */

import { domOpsParty } from '../../src/party/DomOpsParty.js';

export class CardComponent {
  #branch    = null;
  #cardId    = null;
  #depth     = 0;
  #onClose   = null;
  #onRefresh = null;

  /**
   * @param {string} cardId - Unique identifier; becomes the branch name.
   * @param {object} [opts]
   * @param {number}           [opts.depth=0]  - Nesting depth; controls sub-card button.
   * @param {_DomOpsPartyBase} [opts.branch]   - Pre-created branch (parent creates it).
   *                                             Defaults to a new root-level branch.
   */
  constructor(cardId, { depth = 0, branch = null } = {}) {
    if (typeof cardId !== 'string' || cardId.trim() === '') {
      throw new TypeError(`[CardComponent] cardId must be a non-empty string. Received: ${cardId}`);
    }
    this.#cardId = cardId;
    this.#depth  = depth;
    this.#branch = branch ?? domOpsParty.createBranch(cardId);
    this.#branch.activate(this);
  }

  get cardId() { return this.#cardId; }
  get branch() { return this.#branch; }

  /**
   * @param {HTMLElement} zone       - Container to append into.
   * @param {Function}   [onClose]   - Called after this card has dissolved.
   * @param {Function}   [onRefresh] - Called after any descendant change.
   */
  mount(zone, onClose = null, onRefresh = null) {
    this.#onClose   = onClose;
    this.#onRefresh = onRefresh;

    const wrapper      = this.#branch.createElement('wrapper',       'div');
    const tag          = this.#branch.createElement('tag',           'div');
    const header       = this.#branch.createElement('header',        'div');
    const titleEl      = this.#branch.createElement('title',         'h2');
    const bodyEl       = this.#branch.createElement('body',          'p');
    const closeEl      = this.#branch.createElement('close',         'button');
    const childrenZone = this.#branch.createElement('children-zone', 'div');

    wrapper.className      = 'managed-card';
    wrapper.dataset.depth  = String(this.#depth);
    tag.className          = 'tag';
    tag.textContent        = `▸ CardComponent  ·  ${this.#cardId}`;
    header.className       = 'card-header';
    titleEl.textContent    = `Card  ·  ${this.#cardId}`;
    bodyEl.textContent     = `Branch: "${this.#cardId}"  ·  depth: ${this.#depth}`;
    closeEl.textContent    = '✕';
    closeEl.className      = 'card-close-btn';
    closeEl.title          = 'Close — branch.dissolve() releases all owned elements';
    childrenZone.className = 'sub-card-zone';

    closeEl.addEventListener('click', () => this.#close());
    header.append(titleEl, closeEl);
    wrapper.append(tag, header, bodyEl);

    if (this.#depth < 5) {
      const addSubEl = this.#branch.createElement('add-sub', 'button');
      addSubEl.textContent = '+ Add Sub-card';
      addSubEl.className   = 'btn btn-create card-add-sub-btn';
      addSubEl.title       = `Add a nested sub-card (depth ${this.#depth + 1}/5)`;
      addSubEl.addEventListener('click', () => this.#spawnSubCard());
      wrapper.appendChild(addSubEl);
    }

    wrapper.appendChild(childrenZone);
    zone.appendChild(wrapper);
  }

  #spawnSubCard() {
    const childId     = crypto.randomUUID().slice(0, 8);
    const childBranch = this.#branch.createBranch(childId);
    const child       = new CardComponent(childId, {
      depth:  this.#depth + 1,
      branch: childBranch,
    });
    child.mount(
      this.#branch.getElement('children-zone'),
      () => this.#onRefresh?.(),
      this.#onRefresh,
    );
    this.#onRefresh?.();
  }

  /**
   * Close handler — dissolve() depth-first: sub-card branches release first,
   * then this branch releases its own elements (including wrapper, which
   * cascades removal of all child DOM nodes in one step).
   */
  #close() {
    this.#branch?.dissolve();
    this.#branch = null;
    this.#onClose?.();
  }
}
