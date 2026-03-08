/**
 * CardComponent.js
 * Good example — extends ManagedComponent, uses ElementId for multi-level ids.
 *
 * Each instance receives a unique cardId which is used as the top-level
 * segment of every ElementId it creates, e.g.:
 *
 *   cardId = 'a1b2c3'
 *   → ElementId(['a1b2c3', 'title'])   key: "a1b2c3.title"
 *   → ElementId(['a1b2c3', 'body'])    key: "a1b2c3.body"
 *   → ElementId(['a1b2c3', 'close'])   key: "a1b2c3.close"
 *
 * Multiple cards can coexist without id collisions because every element
 * lives under its own cardId namespace in the registry tree.
 */

import { elementManager, ManagedComponent } from '../../src/elementManager.js';
import { ElementId }                        from '../../src/ElementId.js';

export class CardComponent extends ManagedComponent {
  #cardId   = null;
  #idTitle  = null;
  #idBody   = null;
  #idClose  = null;
  #wrapper  = null;
  #onClose  = null;

  /**
   * @param {string} cardId - Unique identifier for this card instance.
   *                          Used as the root segment of all child ElementIds.
   */
  constructor(cardId) {
    super();
    if (typeof cardId !== 'string' || cardId.trim() === '') {
      throw new TypeError(`[CardComponent] cardId must be a non-empty string. Received: ${cardId}`);
    }
    this.#cardId  = cardId;
    this.#idTitle = new ElementId([cardId, 'title']);
    this.#idBody  = new ElementId([cardId, 'body']);
    this.#idClose = new ElementId([cardId, 'close']);
  }

  get cardId() { return this.#cardId; }

  /**
   * @param {HTMLElement} zone     - Container to append into.
   * @param {Function}   [onClose] - Called after the card has closed itself.
   */
  mount(zone, onClose = null) {
    this.#onClose = onClose;

    const titleEl = elementManager.createElement(this, this.#idTitle, 'h2');
    const bodyEl  = elementManager.createElement(this, this.#idBody,  'p');
    const closeEl = elementManager.createElement(this, this.#idClose, 'button');

    titleEl.textContent = `Card  ·  ${this.#cardId}`;
    bodyEl.textContent  = `Elements tracked under namespace "${this.#cardId}".`;
    closeEl.textContent = '✕';
    closeEl.className   = 'card-close-btn';
    closeEl.title       = 'Close — calls returnElement() for each owned id';
    closeEl.addEventListener('click', () => this.#close());

    this.#wrapper = document.createElement('div');
    this.#wrapper.className = 'managed-card';

    const tag = document.createElement('div');
    tag.className = 'tag';
    tag.textContent = `▸ CardComponent  ·  ${this.#idTitle}  ${this.#idBody}  ${this.#idClose}`;

    const header = document.createElement('div');
    header.className = 'card-header';
    header.append(titleEl, closeEl);

    this.#wrapper.append(tag, header, bodyEl);
    zone.appendChild(this.#wrapper);
  }

  /**
   * Close handler — returns each element individually then removes the wrapper.
   */
  #close() {
    elementManager.returnElement(this, this.#idClose);
    elementManager.returnElement(this, this.#idBody);
    elementManager.returnElement(this, this.#idTitle);
    this.#wrapper?.remove();
    this.#wrapper = null;
    this.#onClose?.();
  }

  /** @override */
  onDestroy() {
    this.#wrapper?.remove();
    this.#wrapper = null;
  }
}
