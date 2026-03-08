# ElementManager — Live Demo

An interactive browser demo for the `ElementManager` singleton library.
Open `demo.html` directly in any modern browser — no build step, no server required.

---

## File Structure

```
demo/
├── demo.html           Entry point — open this in your browser
├── demo.js             Control wiring, event handlers, logging
├── demo.css            All styles for the demo UI
├── registryTree.js     Renders the live registry as a segment-hierarchy tree
└── components/
    ├── CardComponent.js    Good example — multi-instance, nested sub-cards
    ├── BannerComponent.js  Good example — single-instance, show/hide
    └── LeakyComponent.js   ⚠ Bad example — intentional leak for audit demo
```

---

## UI Layout

| Panel | Description |
|---|---|
| **Left — Controls** | Buttons and inputs for each demo scenario |
| **Top-right — Registry Tree** | Live segment-hierarchy view of every tracked `ElementId` |
| **Mid-right — DOM Render Zone** | Where managed elements actually mount |
| **Bottom-right — Console Output** | Timestamped log of every registry operation |

---

## Demo Sections

### CardComponent

Click **"new Card() — spawn with random ID"** to mount a card.

- Each card is a `CardComponent` instance with a UUID-derived `cardId` (first 8 chars).
- Creates four managed elements: `title` (`h2`), `body` (`p`), `close` (`button`), `add-sub` (`button`).
- All four are registered under the card's own namespace, e.g. `a1b2c3.title`.
- The **✕** button calls `returnElement()` for each owned id, then removes the wrapper.

#### Nested Sub-cards

Each card has an **"+ Add Sub-card"** button (visible when `depth < 5`).

- Sub-cards are full `CardComponent` instances with an extended segment path:
  `a1b2c3 → x9y8z7 → title` appears in the registry as `a1b2c3.x9y8z7.title`.
- Sub-cards are depth-coloured by their left border:

  | Depth | Border colour |
  |---|---|
  | 0 (root) | `#5599ff` blue |
  | 1 | `#7b9fff` lighter blue |
  | 2 | `#b47bff` purple |
  | 3 | `#ff7bea` pink |
  | 4 | `#ff7b7b` red |
  | 5 | no button — max depth reached |

- Closing a parent cascades: all descendants are destroyed (DOM removed + registry cleared) before the parent's own elements are returned.

---

### BannerComponent

- **show()** — creates one managed element: `ElementId(['site', 'banner'])`.
- **destroy()** — calls `elementManager.destroyComponent(banner)`, which triggers `onDestroy()` then `removeAllElementsForComponent()`.
- Only one banner can exist at a time (buttons toggle disabled state).

---

### Custom Element

Enter a slash-separated ID (e.g. `app/nav/item`) and choose an HTML tag.

- The input is split on `/` to produce an `ElementId` segment array.
- An anonymous `ManagedComponent` subclass is created inline and used as the owner.
- **destroyComponent** returns the element and clears the anonymous component's wrapper.

---

### ⚠ LeakyComponent — Bad Example

Demonstrates what orphaned registry entries look like.

- **spawn()** — creates a managed element under `leak.item-N.tTIMESTAMP`, then the instance goes out of scope without `destroyComponent()` ever being called.
- The registry count grows and never shrinks.
- **force-clear leaks (audit)** — attempts `returnElement()` with a fresh impostor component. This intentionally fails (wrong owner), leaving the entries permanently stuck — illustrating why keeping a reference to the owner is essential.

---

### Error Scenarios

| Button | What it triggers |
|---|---|
| **Duplicate ID** | `createElement` with an already-registered `ElementId` → `RangeError` |
| **Wrong Owner** | `returnElement` called by a component that does not own the id → `Error` |
| **Missing ID** | `returnElement` for an `ElementId` not in the registry → `ReferenceError` |
| **Plain Object Owner** | `createElement` with a plain `{}` instead of a `ManagedComponent` → `TypeError` |

All errors are caught and printed to the console panel — nothing crashes the page.

---

## Registry Tree

The tree panel re-renders after every operation. Each row represents one segment in an `ElementId` path:

```
▾ a1b2c3
  ○ title   <h2>   a1b2c3.title
  ○ body    <p>    a1b2c3.body
  ○ close   <button>  a1b2c3.close
  ○ add-sub <button>  a1b2c3.add-sub
  ▾ x9y8z7
    ○ title   <h2>   a1b2c3.x9y8z7.title
    ...
```

Leaf rows are colour-coded by owner type:

| Colour class | Owner type |
|---|---|
| `leaf-card` | `CardComponent` (blue) |
| `leaf-banner` | `BannerComponent` (orange) |
| `leaf-custom` | Anonymous `ManagedComponent` (yellow) |
| `leaf-leak` | Orphaned — original owner reference lost (red) |

---

## Key Files

### `registryTree.js`

Exports one function:

```js
refreshTree(container, ownerColorMap)
```

- Calls `elementManager.listIds()` to walk all registered ids.
- Builds an internal segment-tree, then renders it as nested `<ul>/<li>` elements.
- `ownerColorMap` is a `Map<ManagedComponent, cssClass>` — built fresh on each refresh by querying the registry for current owners.

### `demo.js`

- Wires all button click handlers.
- `buildOwnerColorMap()` iterates `elementManager.listIds()` and resolves each owner to a CSS class — this automatically includes sub-card owners without any separate tracking map.
- Every state change calls `refreshRegistry()` and `refreshTree(...)`.

---

## Running Locally

```
open demo/demo.html
```

Or serve from any static file server if your browser blocks ES module imports from `file://`:

```bash
npx serve .
# then navigate to http://localhost:3000/demo/demo.html
```

No npm install, no bundler, no transpilation.
