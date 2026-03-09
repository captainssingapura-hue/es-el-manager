# DomOpsParty

A singleton DOM element manager for ES6 module-based applications.
All DOM element creation flows through a branch hierarchy. Every element has a named owner, and cleanup is a single call — no manual element removal needed.

---

## Why

Calling `document.createElement` directly scatters element lifecycle across the codebase. There is no central record of what exists, who owns it, or whether it was ever cleaned up. `DomOpsParty` fixes this by making creation and destruction explicit, auditable, and enforced at the branch level.

---

## Core Concepts

### Branch — the element owner

A branch is a named node in the party tree. It is the only entity that can create DOM elements. Components receive a branch at construction time and use it exclusively for all DOM work.

```js
const branch = domOpsParty.createBranch('my-widget');
const el     = branch.createElement('root', 'div');
```

Names for both branches and elements must match `[a-zA-Z0-9_-]+`.

---

### `branch.createElement(name, tagName)` — the only sanctioned DOM API

No component may call `document.createElement()` directly. All elements must be created through a branch.

- `name` — unique within the branch, `[a-zA-Z0-9_-]+`
- `tagName` — any valid HTML tag

Returns the `HTMLElement`. Throws `TypeError` on empty/invalid name, `RangeError` on duplicate name within the same branch.

---

### `branch.dissolve()` — single-call teardown

`dissolve()` is the complete teardown primitive. One call:

1. Depth-first dissolves all sub-branches.
2. Calls `.remove()` on every owned DOM element at every node.
3. Clears all element and branch maps.
4. Removes the branch from its parent.

After `dissolve()`, null the branch reference — the object must not be used again.

```js
branch.dissolve();
branch = null;
```

---

### `domOpsParty` — the root singleton

The root party is the "big boss". It owns the top-level layout zones and is the entry point for creating the first-level branches.

```js
import { domOpsParty } from './src/party/DomOpsParty.js';

// Root party creates managed layout zones — no raw document.createElement
const renderZone = domOpsParty.createElement('render-zone', 'div');
document.getElementById('app').appendChild(renderZone);
```

---

## File Structure

```
es-el-manager/
├── src/
│   └── party/
│       ├── _DomOpsPartyBase.js   Internal base class — all branch logic lives here
│       └── DomOpsParty.js        Root singleton + 18 typed level classes
│
└── demo/
    ├── components/
    │   ├── CardComponent.js      Multi-instance component; close = branch.dissolve()
    │   ├── BannerComponent.js    Single-instance component; destroy = branch.dissolve()
    │   └── LeakyComponent.js     ⚠ Bad example: dissolve() never called
    ├── partyTree.js              Live party hierarchy renderer
    ├── demo.html                 Interactive demo
    ├── demo.js                   Demo wiring — ES6 module
    └── demo.css                  Demo styles
```

---

## API Reference

### Element operations

| Method / Property | Description |
|---|---|
| `branch.createElement(name, tagName)` | Creates a `<tagName>` element, registers it under `name`, returns it. Throws on invalid or duplicate name. |
| `branch.getElement(name)` | Returns a previously created element by name, or `null`. |
| `branch.listElements()` | Returns `{ name, tagName }[]` for all elements on this branch (not sub-branches). |
| `branch.elementCount` | Number of elements directly owned by this branch. |

### Branch operations

| Method / Property | Description |
|---|---|
| `branch.createBranch(name)` | Creates and returns a named child branch at `depth + 1`. Max depth 18. |
| `branch.getBranch(name)` | Returns a child branch by name, or `null`. |
| `branch.hasBranch(name)` | `true` if a child branch with that name exists. |
| `branch.listBranches()` | Names of all direct child branches. |
| `branch.branchCount` | Number of direct child branches. |
| `branch.dissolveBranch(name)` | Dissolves a named child branch and its entire subtree. |
| `branch.dissolve()` | Dissolves this branch and removes it from its parent. |

### Inspection

| Property | Description |
|---|---|
| `branch.name` | Human-readable label. |
| `branch.depth` | Distance from root (0 = root, 18 = deepest). |
| `branch.parent` | Parent branch node, or `null` for the root. |
| `branch.toString()` | `DomOpsParty("name", depth=N, elements=N, branches=N)` |

---

## Usage Pattern

```js
import { domOpsParty } from './src/party/DomOpsParty.js';

class ProfileCard {
  #branch = null;
  #onClose;

  constructor(cardId, onClose) {
    this.#onClose = onClose;
    this.#branch  = domOpsParty.createBranch(cardId);
  }

  mount(zone) {
    const wrapper = this.#branch.createElement('wrapper', 'div');
    const title   = this.#branch.createElement('title',   'h2');
    const body    = this.#branch.createElement('body',    'p');
    const close   = this.#branch.createElement('close',   'button');

    close.textContent = '×';
    close.addEventListener('click', () => this.#close());

    wrapper.append(title, body, close);
    zone.appendChild(wrapper);
  }

  #close() {
    this.#branch?.dissolve();
    this.#branch = null;
    this.#onClose?.();
  }
}

// Mount
const card = new ProfileCard('profile-1', () => console.log('closed'));
card.mount(document.getElementById('app'));

// Later — one call cleans up every element and the branch
// (or click the close button — same path)
```

---

## Lifecycle

```
createBranch('widget')
      │
      ├── branch.createElement('wrapper', 'div')
      ├── branch.createElement('title',   'h2')
      └── branch.createElement('close',   'button')
            │
            ▼
      branch.dissolve()
            │
            ├── _releaseAll()  → wrapper.remove(), title.remove(), close.remove()
            └── removed from parent branch map
```

Components can also nest sub-branches for sub-components. `dissolve()` on any ancestor node tears down the entire subtree in one call — depth-first, no manual cleanup needed.

---

## Memory Leak Prevention

The design makes leaks structurally difficult:

- **No raw `document.createElement`** — the only way to create a DOM element is through `branch.createElement()`, which registers it immediately.
- **Explicit dissolve contract** — before a branch goes out of scope, `branch.dissolve()` must be called. This is a design-time convention enforced by code review, not a runtime lock.
- **Depth-first teardown** — `dissolve()` walks the entire subtree before releasing the parent's elements, so child wrappers are always detached before their ancestors. Calling `.remove()` on an already-detached element is a safe no-op.
- **Party tree** — the live tree view in the demo makes orphaned branches visible the moment they occur.

The only way to produce a persistent leak is to hold a branch reference, create elements on it, and then discard the reference without calling `dissolve()` — exactly what `LeakyComponent` demonstrates.

---

## Demo

Serve the project root from any static web server and open `demo/demo.html`.

```bash
# Python
python3 -m http.server 8080

# Node
npx serve .
```

The demo includes:

- **CardComponent** — spawn multiple cards, each with its own UUID-prefixed branch. Close buttons call `branch.dissolve()` directly, and the party tree updates live.
- **BannerComponent** — single-instance component with show/hide lifecycle.
- **Custom element** — create any element with a custom name and tag type on a dedicated branch.
- **LeakyComponent** — demonstrates what an orphaned branch looks like in the party tree. The audit button dissolves all leaked branches.
- **Error scenarios** — duplicate element name, invalid name characters, empty name, and invalid branch name — all showing the exact error thrown.
- **Party tree** — live hierarchical view of every branch, element count per node, and depth badges — updated on every operation.
