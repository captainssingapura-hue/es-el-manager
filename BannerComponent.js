/**
 * BannerComponent.js
 * Demo component — creates a single managed element (div) via ElementManager.
 */

import { elementManager } from './elementManager.js';

export class BannerComponent {
  #bannerEl = null;
  #wrapper  = null;

  /**
   * Shows the banner inside the given zone element.
   * Creates one managed element: 'site-banner' (div).
   *
   * @param {HTMLElement} zone - Container to prepend into.
   */
  show(zone) {
    this.#bannerEl = elementManager.createElement(this, 'site-banner', 'div');
    this.#bannerEl.textContent = '📢  Banner managed by BannerComponent';

    this.#wrapper = document.createElement('div');
    this.#wrapper.className = 'managed-banner';

    const tag = document.createElement('div');
    tag.className = 'tag';
    tag.textContent = '▸ BannerComponent  ·  owner: banner  ·  id: site-banner';

    this.#wrapper.append(tag, this.#bannerEl);
    zone.prepend(this.#wrapper);
  }

  /**
   * Hides the banner and returns the managed element to the manager.
   * Must be called before the component goes out of scope.
   */
  hide() {
    elementManager.returnElement(this, 'site-banner');
    this.#wrapper?.remove();
    this.#bannerEl = null;
    this.#wrapper  = null;
  }
}
