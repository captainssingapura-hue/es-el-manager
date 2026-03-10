/**
 * BannerComponent.js
 *
 * Single-instance banner. Owns a named party branch and creates all its
 * DOM elements through that branch — no document.createElement().
 *
 * Elements owned:
 *   wrapper, tag, banner
 *
 * Teardown
 * ────────
 * Caller calls banner.destroy(), which calls branch.dissolve() — removes
 * all owned elements from the DOM and clears the branch from the party tree.
 */

import { domOpsParty } from '../../src/party/DomOpsParty.js';

export class BannerComponent {
  #branch = null;

  constructor() {
    this.#branch = domOpsParty.createBranch('banner', this);
  }

  get branch() { return this.#branch; }

  /**
   * Creates and mounts the banner into the given zone.
   *
   * @param {HTMLElement} zone - Container to prepend into.
   */
  show(zone) {
    const wrapper  = this.#branch.createElement('wrapper', 'div');
    const tag      = this.#branch.createElement('tag',     'div');
    const bannerEl = this.#branch.createElement('banner',  'div');

    wrapper.className    = 'managed-banner';
    tag.className        = 'tag';
    tag.textContent      = '▸ BannerComponent';
    bannerEl.textContent = '📢  Banner managed by BannerComponent';

    wrapper.append(tag, bannerEl);
    zone.prepend(wrapper);
  }

  /**
   * Tears down the banner — branch.dissolve() removes all owned elements
   * from the DOM and removes the 'banner' branch from the party tree.
   */
  destroy() {
    this.#branch?.dissolve();
    this.#branch = null;
  }
}
