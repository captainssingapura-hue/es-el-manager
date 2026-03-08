/**
 * BannerComponent.js
 * Demo component — creates a single managed element (div) via ElementManager.
 *
 * Party integration
 * ─────────────────
 * The banner owns a named branch on the root DomOpsParty. The branch is
 * created with `this` as the secretaryComponent so that:
 *
 *   elementManager.destroyComponent(this.#branch.secretary)
 *
 * correctly calls BannerComponent.onDestroy() via the secretary delegation.
 *
 * Teardown
 * ────────
 * The demo's "destroy" button calls elementManager.destroyComponent(banner.mc).
 * This calls secretary.onDestroy() → BannerComponent.onDestroy():
 *   1. Remove the DOM wrapper.
 *   2. branch.dissolve() — removes the 'site.banner' element from the registry
 *      and removes the 'banner' branch from domOpsParty (so a new instance can
 *      claim the same name).
 * ElementManager then calls removeAllElementsForComponent(secretary) —
 * harmless no-op since dissolve() already cleared the registry entry.
 */

import { elementManager }  from '../../src/elementManager.js';
import { ElementId }       from '../../src/ElementId.js';
import { domOpsParty }     from '../../src/party/DomOpsParty.js';

const BANNER_ID = new ElementId(['site', 'banner']);

export class BannerComponent {
  #branch   = null;
  #bannerEl = null;
  #wrapper  = null;

  constructor() {
    // Secretary wraps this banner instance; destroyComponent(secretary) → this.onDestroy()
    this.#branch = domOpsParty.createBranch('banner', this);
  }

  /** @returns {ManagedComponent} The branch secretary for use with ElementManager. */
  get mc() { return this.#branch?.secretary ?? null; }

  /**
   * Shows the banner inside the given zone element.
   * Creates one managed element: ElementId(['site', 'banner']).
   *
   * @param {HTMLElement} zone - Container to prepend into.
   */
  show(zone) {
    this.#bannerEl = elementManager.createElement(this.#branch.secretary, BANNER_ID, 'div');
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
   * Invoked by ElementManager.destroyComponent() before it runs
   * removeAllElementsForComponent. Removes the DOM wrapper and dissolves the
   * branch — which cleans up the registry entry and the party node in one call.
   */
  onDestroy() {
    this.#wrapper?.remove();
    this.#wrapper  = null;
    this.#bannerEl = null;
    this.#branch?.dissolve();
    this.#branch = null;
  }
}
