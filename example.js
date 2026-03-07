/**
 * example.js
 * Demonstrates correct usage of the ElementManager singleton.
 */

import { elementManager } from './elementManager.js';

// ─── Example Component A ─────────────────────────────────────────────────────

class CardComponent {
  #titleEl = null;
  #bodyEl  = null;

  mount() {
    // Each element is created through the manager, not via document.createElement
    this.#titleEl = elementManager.createElement(this, 'card-title', 'h2');
    this.#bodyEl  = elementManager.createElement(this, 'card-body',  'p');

    this.#titleEl.textContent = 'Hello from CardComponent';
    this.#bodyEl.textContent  = 'Managed element content.';

    document.body.append(this.#titleEl, this.#bodyEl);

    console.log('Managed element count:', elementManager.size);   // 2
    console.log('Registered ids:',        elementManager.listIds()); // ['card-title', 'card-body']
  }

  unmount() {
    // Elements MUST be returned before the component goes out of scope
    elementManager.returnElement(this, 'card-title');
    elementManager.returnElement(this, 'card-body');

    this.#titleEl = null;
    this.#bodyEl  = null;

    console.log('Managed element count after unmount:', elementManager.size); // 0
  }
}

// ─── Example Component B ─────────────────────────────────────────────────────

class BannerComponent {
  #bannerEl = null;

  show() {
    this.#bannerEl = elementManager.createElement(this, 'site-banner', 'div');
    this.#bannerEl.textContent = 'Banner managed by BannerComponent';
    document.body.prepend(this.#bannerEl);
  }

  hide() {
    elementManager.returnElement(this, 'site-banner');
    this.#bannerEl = null;
  }
}

// ─── Run ─────────────────────────────────────────────────────────────────────

const card   = new CardComponent();
const banner = new BannerComponent();

card.mount();
banner.show();

console.log('All ids in use:', elementManager.listIds());
// ['card-title', 'card-body', 'site-banner']

// Attempting to create a duplicate id throws immediately
try {
  elementManager.createElement(banner, 'card-title', 'span');
} catch (err) {
  console.error(err.message);
  // [ElementManager] createElement: elementId "card-title" is already in use.
}

// Clean up in reverse order (order doesn't matter; owner check does)
banner.hide();
card.unmount();

console.log('Final managed count:', elementManager.size); // 0
