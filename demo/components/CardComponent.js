/**
 * CardComponent.js
 * Good example — composes ManagedComponent, uses ElementId for multi-level ids.
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
 */

import { elementManager, ManagedComponent } from '../../src/elementManager.js';
import { ElementId }                        from '../../src/ElementId.js';

export class CardComponent {
  #mc           = new ManagedComponent(this);
  #cardId       = null;
  #depth        = 0;
  #segments     = null;
  #idTitle      = null;
  #idBody       = null;
  #idClose      = null;
  #idAddSub     = null;   // null when depth >= 5
  #wrapper      = null;
  #childrenZone = null;   // plain unmanaged div; holds sub-card wrappers
  #children     = new Set();  // live CardComponent child instances
  #onClose      = null;
  #onRefresh    = null;

  /**
   * @param {string} cardId - Unique identifier for this card instance.
   *                          Used as the root segment of all child ElementIds.
   * @param {object} [opts]
   * @param {number} [opts.depth=0]    - Nesting depth; controls sub-card button visibility.
   * @param {string[]} [opts.segments] - Full segment path; defaults to [cardId].
   */
  constructor(cardId, { depth = 0, segments = null } = {}) {
    if (typeof cardId !== 'string' || cardId.trim() === '') {
      throw new TypeError(`[CardComponent] cardId must be a non-empty string. Received: ${cardId}`);
    }
    this.#cardId   = cardId;
    this.#depth    = depth;
    this.#segments = segments ?? [cardId];

    this.#idTitle = new ElementId([...this.#segments, 'title']);
    this.#idBody  = new ElementId([...this.#segments, 'body']);
    this.#idClose = new ElementId([...this.#segments, 'close']);
    if (depth < 5) {
      this.#idAddSub = new ElementId([...this.#segments, 'add-sub']);
    }
  }

  get cardId() { return this.#cardId; }
  get mc()     { return this.#mc; }

  /**
   * @param {HTMLElement} zone        - Container to append into.
   * @param {Function}   [onClose]    - Called after the card has closed itself.
   * @param {Function}   [onRefresh]  - Called after any descendant change (sub-card add/remove).
   */
  mount(zone, onClose = null, onRefresh = null) {
    this.#onClose   = onClose;
    this.#onRefresh = onRefresh;

    const titleEl = elementManager.createElement(this.#mc, this.#idTitle, 'h2');
    const bodyEl  = elementManager.createElement(this.#mc, this.#idBody,  'p');
    const closeEl = elementManager.createElement(this.#mc, this.#idClose, 'button');

    titleEl.textContent = `Card  ·  ${this.#cardId}`;
    bodyEl.textContent  = `Elements tracked under namespace "${this.#segments.join('.')}".`;
    closeEl.textContent = '✕';
    closeEl.className   = 'card-close-btn';
    closeEl.title       = 'Close — calls returnElement() for each owned id';
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
      const addSubEl = elementManager.createElement(this.#mc, this.#idAddSub, 'button');
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
      depth:    this.#depth + 1,
      segments: [...this.#segments, childId],
    });
    this.#children.add(child);
    child.mount(
      this.#childrenZone,
      () => { this.#children.delete(child); this.#onRefresh?.(); },  // onClose
      this.#onRefresh,                                                 // onRefresh (pass down)
    );
    this.#onRefresh?.();
  }

  /**
   * Close handler — destroys children, returns each own element individually,
   * then removes the wrapper.
   */
  #close() {
    for (const child of this.#children) elementManager.destroyComponent(child.mc);
    this.#children.clear();

    if (this.#idAddSub) elementManager.returnElement(this.#mc, this.#idAddSub);
    elementManager.returnElement(this.#mc, this.#idClose);
    elementManager.returnElement(this.#mc, this.#idBody);
    elementManager.returnElement(this.#mc, this.#idTitle);
    this.#wrapper?.remove();
    this.#wrapper = null;
    this.#onClose?.();
  }

  onDestroy() {
    for (const child of this.#children) elementManager.destroyComponent(child.mc);
    this.#children.clear();
    this.#wrapper?.remove();
    this.#wrapper = null;
  }
}
