/**
 * ElementId.js
 *
 * Immutable value object representing a multi-level component element ID.
 *
 * An ElementId is an ordered list of non-empty string segments that together
 * uniquely identify a DOM element within the ElementManager registry.
 *
 * Examples:
 *   new ElementId(['app', 'sidebar', 'toggle'])  → key: "app.sidebar.toggle"
 *   new ElementId(['card', 'title'])             → key: "card.title"
 *   new ElementId(['banner'])                    → key: "banner"
 *
 * Benefits over a flat string id:
 *  - Hierarchy is explicit and unambiguous — no delimiter collisions.
 *  - Segments can be validated independently.
 *  - Components can share a namespace prefix without risk of collision
 *    (e.g. ['nav','item'] never clashes with ['nav','item','icon']).
 *  - No parsing required — the segment array is always available as-is.
 */

const SEPARATOR = '.';
const VALID_SEGMENT = /^[a-zA-Z0-9_-]+$/;

export class ElementId {
  /** @type {readonly string[]} */
  #segments;

  /** @type {string} */
  #key;

  /**
   * @param {string[]} segments - One or more non-empty strings.
   *
   * @throws {TypeError}  If segments is not a non-empty array of strings.
   * @throws {RangeError} If any segment is empty or contains invalid characters.
   */
  constructor(segments) {
    if (!Array.isArray(segments) || segments.length === 0) {
      throw new TypeError(
        `[ElementId] segments must be a non-empty array of strings. Received: ${JSON.stringify(segments)}`
      );
    }

    for (let i = 0; i < segments.length; i++) {
      const seg = segments[i];
      if (typeof seg !== 'string' || seg.trim() === '') {
        throw new TypeError(
          `[ElementId] Each segment must be a non-empty string. ` +
          `Segment at index ${i} is invalid: ${JSON.stringify(seg)}`
        );
      }
      if (!VALID_SEGMENT.test(seg)) {
        throw new RangeError(
          `[ElementId] Segment "${seg}" at index ${i} contains invalid characters. ` +
          `Only letters, digits, underscores, and hyphens are allowed.`
        );
      }
    }

    this.#segments = Object.freeze([...segments]);
    this.#key = this.#segments.join(SEPARATOR);
  }

  /**
   * The canonical string key used internally by ElementManager.
   * Segments joined by '.' — e.g. "app.sidebar.toggle".
   *
   * @returns {string}
   */
  get key() {
    return this.#key;
  }

  /**
   * Read-only copy of the segment array.
   *
   * @returns {readonly string[]}
   */
  get segments() {
    return this.#segments;
  }

  /**
   * Number of levels in this id.
   *
   * @returns {number}
   */
  get depth() {
    return this.#segments.length;
  }

  /**
   * Returns a new ElementId with one additional segment appended.
   * Useful for building child ids from a parent.
   *
   * @param {string} segment
   * @returns {ElementId}
   *
   * @example
   *   const parent = new ElementId(['card']);
   *   const child  = parent.child('title'); // ElementId(['card', 'title'])
   */
  child(segment) {
    return new ElementId([...this.#segments, segment]);
  }

  /**
   * Returns true if this id starts with all segments of the given prefix.
   *
   * @param {ElementId} prefix
   * @returns {boolean}
   *
   * @example
   *   new ElementId(['app','nav','item']).hasPrefix(new ElementId(['app','nav'])) // true
   */
  hasPrefix(prefix) {
    if (!(prefix instanceof ElementId)) return false;
    if (prefix.depth > this.depth) return false;
    return prefix.segments.every((seg, i) => seg === this.#segments[i]);
  }

  /**
   * Value equality — two ElementIds are equal if their keys match.
   *
   * @param {ElementId} other
   * @returns {boolean}
   */
  equals(other) {
    return other instanceof ElementId && other.#key === this.#key;
  }

  /**
   * Human-readable representation.
   *
   * @returns {string}
   */
  toString() {
    return `ElementId(${this.#key})`;
  }
}
