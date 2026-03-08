/**
 * BannerComponent.js
 * Demo component — creates a single managed element (div) via ElementManager.
 */

import { elementManager, ManagedComponent } from '../../src/elementManager.js';
import { ElementId }                        from '../../src/ElementId.js';

const BANNER_ID = new ElementId(['site', 'banner']);

export class BannerComponent extends ManagedComponent {
  #bannerEl = null;
  #wrapper  = null;

  /**
   * Shows the banner inside the given zone element.
   * Creates one managed element: ElementId(['site', 'banner']).
   *
   * @param {HTMLElement} zone - Container to prepend into.
   */
  show(zone) {
    this.#bannerEl = elementManager.createElement(this, BANNER_ID, 'div');
    this.#bannerEl.textContent = '📢  Banner managed by BannerComponent';

    this.#wrapper = document.createElement('div');
    this.#wrapper.className = 'managed-banner';

    const tag = document.createElement('div');
    tag.className = 'tag';
    tag.textContent = `▸ BannerComponent  ·  ${BANNER_ID}`;

    this.#wrapper.append(tag, this.#bannerEl);
    zone.prepend(this.#wrapper);
  }

  /**
   * Hides the banner and returns the managed element to the manager.
   * Must be called before the component goes out of scope.
   */
  hide() {
    elementManager.returnElement(this, BANNER_ID);
    this.#wrapper?.remove();
    this.#bannerEl = null;
    this.#wrapper  = null;
  }

  /** @override */
  onDestroy() {
    this.#wrapper?.remove();
    this.#wrapper = null;
  }
}
