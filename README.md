# ElementManager

A singleton DOM element manager for ES6 module-based applications.  
All DOM element creation flows through a single registry, every element has a typed owner, and cleanup is automatic and leak-proof.

---

## Why

Calling `document.createElement` directly scatters element lifecycle across the codebase. There is no central record of what exists, who owns it, or whether it was ever cleaned up. `ElementManager` fixes this by making creation and destruction explicit, auditable, and enforced at runtime.

---

## Core Concepts

### `ElementId` — hierarchical element identity

Elements are identified by an ordered list of string segments rather than a flat string.

```js
new ElementId(['app', 'sidebar', 'toggle'])
// key: "app.sidebar.toggle"
```

This makes component namespacing natural and unambiguous. A card with id `a1b2c3` owns `a1b2c3.title`, `a1b2c3.body`, `a1b2c3.close` — none of which can collide with a second card `f4e5d6` owning its own subtree.

**`ElementId` API**

| Member | Description |
|---|---|
| `new ElementId(segments)` | Create from a `string[]`. Segments must match `[a-zA-Z0-9_-]`. |
| `.key` | Dot-joined canonical string — `"card.title"` |
| `.segments` | Read-only copy of the segment array |
| `.depth` | Number of segments |
| `.child(segment)` | Returns a new `ElementId` with one segment appended |
| `.hasPrefix(other)` | `true` if this id starts with all segments of `other` |
| `.equals(other)` | Value equality by key |
| `.toString()` | `"ElementId(card.title)"` |

---

### `ManagedComponent` — marker base class

Any class that wants to create elements must extend `ManagedComponent`. It is a pure value object — no state, no imports, no logic. Its only jobs are:

1. **Type gate** — `ElementManager` rejects any owner that is not an `instanceof ManagedComponent`. Plain objects cannot own elements.
2. **Override hook** — subclasses implement `onDestroy()` for DOM teardown. `ElementManager` calls it during `destroyComponent()`.

```js
import { ManagedComponent } from './ManagedComponent.js';

class MyWidget extends ManagedComponent {
  #wrapper = null;

  mount(zone) {
    const el = elementManager.createElement(this, new ElementId(['widget', 'root']), 'div');
    this.#wrapper = zone.appendChild(el);
  }

  onDestroy() {
    this.#wrapper?.remove();
    this.#wrapper = null;
  }
}
```

---

### `elementManager` — the singleton registry

The single source of truth for all managed elements. Imported as a constant — only one instance ever exists.

```js
import { elementManager } from './elementManager.js';
```

**Creation & release**

| Method | Description |
|---|---|
| `createElement(owner, elementId, elementType)` | Creates a `<elementType>` element, registers it, sets `element.id` to `elementId.key`, and returns it. Throws if `owner` is not a `ManagedComponent` or if `elementId` is already in use. |
| `returnElement(owner, elementId)` | Releases a single element. Detaches it from the DOM and removes it from the registry. Only the original owner may return an element. |
| `removeAllElementsForComponent(owner)` | Releases every element owned by the given component in one call. |
| `destroyComponent(component)` | Calls `component.onDestroy()` then `removeAllElementsForComponent()`. The recommended teardown entry point. |

**Inspection**

| Method / Property | Description |
|---|---|
| `elementManager.size` | Number of elements currently tracked |
| `has(elementId)` | `true` if the id is registered |
| `getElement(elementId)` | Returns the `HTMLElement` without releasing it |
| `getOwner(elementId)` | Returns the `ManagedComponent` instance that owns the element |
| `listIds()` | All registered `ElementId` instances |
| `listIdsForComponent(owner)` | All `ElementId` instances owned by a specific component |
| `listIdsByPrefix(prefix)` | All `ElementId` instances whose key starts with the given prefix |

---

## File Structure

```
el_man/
├── ElementId.js          Immutable multi-level element identifier
├── ManagedComponent.js   Marker base class — pure value object
├── elementManager.js     Singleton registry — all lifecycle logic lives here
│
├── CardComponent.js      Example: multi-element component with close button
├── BannerComponent.js    Example: single-element component
├── LeakyComponent.js     ⚠ Bad example: never calls destroyComponent()
│
├── demo.html             Live interactive demo
├── demo.js               Demo wiring — ES6 module
├── demo.css              Demo styles
└── registryTree.js       Registry tree view renderer
```

---

## Usage Pattern

```js
import { elementManager }  from './elementManager.js';
import { ManagedComponent } from './ManagedComponent.js';
import { ElementId }        from './ElementId.js';

class ProfileCard extends ManagedComponent {
  #wrapper = null;

  mount(zone, cardId) {
    // All IDs share the same prefix — scoped to this instance
    const avatar = elementManager.createElement(this, new ElementId([cardId, 'avatar']), 'img');
    const name   = elementManager.createElement(this, new ElementId([cardId, 'name']),   'h2');
    const bio    = elementManager.createElement(this, new ElementId([cardId, 'bio']),    'p');

    this.#wrapper = document.createElement('div');
    this.#wrapper.append(avatar, name, bio);
    zone.appendChild(this.#wrapper);
  }

  onDestroy() {
    this.#wrapper?.remove();
    this.#wrapper = null;
  }
}

// Mount
const card = new ProfileCard();
card.mount(document.getElementById('app'), 'profile-1');

// Later — single call cleans up every element
elementManager.destroyComponent(card);
```

---

## Lifecycle

```
createElement()
      │
      ▼
  registry
  ┌─────────────────────────────────────────┐
  │  "a1b2c3.title" → { element, owner }   │
  │  "a1b2c3.body"  → { element, owner }   │
  │  "a1b2c3.close" → { element, owner }   │
  └─────────────────────────────────────────┘
      │
      ├── returnElement()                    manual, per-element
      ├── removeAllElementsForComponent()    bulk release
      └── destroyComponent()                 onDestroy() → bulk release
```

Elements can be returned manually one at a time (as the close button in `CardComponent` demonstrates), or all at once via `destroyComponent()`. The two paths are interchangeable — `destroyComponent()` applies the bulk version as a safety net after calling `onDestroy()`.

---

## Memory Leak Prevention

The design makes leaks structurally difficult:

- **Type enforcement** — only `ManagedComponent` subclasses can own elements. Plain objects are rejected at the gate.
- **Ownership checks** — only the original owner can return an element. Impostors throw immediately.
- **`destroyComponent()` safety net** — calls `removeAllElementsForComponent()` after `onDestroy()`, so any element the subclass forgot to return is still cleaned up.
- **Registry tree** — the live tree view in the demo makes orphaned entries visible the moment they occur.

The only way to produce a persistent leak is to hold a `ManagedComponent` instance, register elements against it, and then discard the instance reference without calling `destroyComponent()` — exactly what `LeakyComponent` demonstrates. Without the original instance, the registry entry is unreachable and cannot be returned.

---

## Demo

Serve the `el_man/` directory from any static web server and open `demo.html`.

```bash
# Python
python3 -m http.server 8080

# Node
npx serve .
```

The demo includes:

- **CardComponent** — spawn multiple cards, each with its own UUID-prefixed namespace. Close buttons call `returnElement()` directly, and the tree updates live.
- **BannerComponent** — single-element component with show/hide lifecycle.
- **Custom element** — create any element with a slash-separated multi-level id (`app/nav/item`).
- **LeakyComponent** — demonstrates what an orphaned registry entry looks like in the tree.
- **Error scenarios** — duplicate id, wrong owner, missing id, and plain object owner — all showing the exact error thrown.
- **Registry tree** — live hierarchical view of every registered `ElementId`, colour-coded by component type and updated on every operation.
