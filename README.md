# DomOpsParty

A tree-structured DOM element manager for vanilla JavaScript applications.

Every DOM element in your application is created through a named branch in a single hierarchy. Every element has an owner. Cleanup is one call. Leaks are detectable at runtime.

No framework. No build step. Pure ES6 modules.

---

## The Problem

In any non-trivial vanilla JS application, DOM elements are created everywhere — inside components, inside helpers, inside callbacks. There is no record of what exists, who created it, or whether it was cleaned up. The larger the codebase, the worse it gets:

- **Scattered lifecycle** — `document.createElement()` calls are spread across dozens of files. No single place knows what is alive.
- **Silent leaks** — a component goes out of scope, but its elements stay in the DOM. Nothing reports this. The user sees stale UI or degraded performance.
- **Teardown is manual and fragile** — every component must remember to `.remove()` each element it created. Miss one, and it lingers. Nest components, and teardown order becomes a source of bugs.
- **Ownership is implicit** — there is no way to ask "which component created this element?" at runtime.

These problems compound when components are reusable and nested — exactly the case where you need the most discipline and get the least help from the platform.

---

## How DomOpsParty Solves This

### 1. One sanctioned way to create elements

```js
const el = branch.createElement('title', 'h2');
```

`document.createElement()` is never called directly. Every element is registered the moment it is created, under a name, on a branch. If a name is already taken, it throws. If the branch has not been activated, it throws. There is no silent failure path.

### 2. Tree-structured ownership

Branches form a tree that mirrors your component hierarchy:

```
domOpsParty (root)
  ├── banner          ← BannerComponent
  ├── a1b2c3d4        ← CardComponent (top-level)
  │     ├── x9y8z7w6  ← CardComponent (sub-card)
  │     │     └── …
  │     └── p3q4r5s6  ← CardComponent (sub-card)
  └── leak-1          ← LeakyComponent (orphaned)
```

Each branch knows its name, depth, owned elements, and child branches. The tree is inspectable at any time — you can walk it, render it, or scan it for leaks.

### 3. Single-call teardown

```js
branch.dissolve();
```

One call tears down everything rooted at that branch: depth-first, it dissolves every sub-branch, removes every element from the DOM, and deregisters the branch from its parent. No manual element removal. No teardown ordering bugs.

### 4. Ownership activation and leak detection

Every branch must be activated with an owner before it can create elements:

```js
const branch = domOpsParty.createBranch('my-widget');
branch.activate(this);  // set-once — binds a WeakRef to the owner
```

Activation is enforced: `createElement()` and `createBranch()` throw if the branch has not been activated. The owner is tracked via `WeakRef`, which means the system can detect when an owner has been garbage-collected while its branch is still alive — a leak.

```js
branch.isOwnerAlive  // null = no owner, true = alive, false = leaked
```

The included `leakScanner` walks the tree periodically and reports (or auto-dissolves) leaked branches.

---

## Design Rationale

### Why a tree, not a flat registry?

A flat `Map<id, element>` answers "does this element exist?" but not "what else belongs to the same component?" and not "what happens when the parent component is destroyed?" The tree structure means `dissolve()` on any node cleans up the entire subtree — matching how component hierarchies actually work.

### Why set-once activation instead of passing owner at creation?

When a parent creates a branch for a child component, the child does not exist yet. The branch must be created first, then passed to the child's constructor, where the child calls `activate(this)`. This two-step pattern avoids giving the child access to the parent's branch (which would break encapsulation) while still binding ownership at the earliest possible moment.

### Why a depth limit?

The 19-level type hierarchy (L0 through L18) is a deliberate constraint. In practice, component nesting beyond 5-6 levels is a design smell. The hard cap at 18 catches runaway recursion at compile time (via the type system) rather than at runtime.

### Why a singleton root?

The root `domOpsParty` is activated with a frozen sentinel (`partyChief`) so that every branch in the system follows the same activation rule — no special cases. The singleton also provides a single entry point for tree inspection, leak scanning, and debugging.

### Why no framework integration?

DomOpsParty operates below the framework layer. It manages raw DOM elements and their lifecycle. This makes it usable with any rendering approach — vanilla JS, Web Components, or as a managed layer beneath a framework — without creating coupling.

---

## Quick Start

```js
import { domOpsParty } from './src/party/DomOpsParty.js';

class ProfileCard {
  #branch = null;

  constructor(cardId) {
    this.#branch = domOpsParty.createBranch(cardId);
    this.#branch.activate(this);
  }

  mount(zone) {
    const wrapper = this.#branch.createElement('wrapper', 'div');
    const title   = this.#branch.createElement('title',   'h2');
    const body    = this.#branch.createElement('body',    'p');
    const close   = this.#branch.createElement('close',   'button');

    close.textContent = '×';
    close.addEventListener('click', () => this.destroy());

    wrapper.append(title, body, close);
    zone.appendChild(wrapper);
  }

  destroy() {
    this.#branch?.dissolve();
    this.#branch = null;
  }
}
```

### Nested components

Parent creates a branch and passes it to the child. The child activates it.

```js
// Inside parent component
#spawnChild() {
  const childId     = crypto.randomUUID().slice(0, 8);
  const childBranch = this.#branch.createBranch(childId);
  const child       = new ChildWidget(childId, childBranch);
  child.mount(this.#childrenZone);
}

// Inside ChildWidget constructor
constructor(id, branch) {
  this.#branch = branch;
  this.#branch.activate(this);
}
```

Dissolving the parent automatically dissolves all child branches. The child never has access to the parent's branch.

---

## API Reference

### Element Operations

| Method / Property | Description |
|---|---|
| `branch.createElement(name, tagName)` | Creates a `<tagName>`, registers it under `name`, returns it. Throws on invalid/duplicate name or if branch is not activated. |
| `branch.getElement(name)` | Returns element by name, or `null`. |
| `branch.listElements()` | Returns `{ name, tagName }[]` for all elements on this branch. |
| `branch.elementCount` | Number of elements owned by this branch. |

### Branch Operations

| Method / Property | Description |
|---|---|
| `branch.createBranch(name)` | Creates a child branch at `depth + 1`. Max depth 18. |
| `branch.getBranch(name)` | Returns child branch by name, or `null`. |
| `branch.hasBranch(name)` | `true` if a child branch exists. |
| `branch.listBranches()` | Names of all direct child branches. |
| `branch.branchCount` | Number of direct child branches. |
| `branch.dissolveBranch(name)` | Dissolves a named child branch and its subtree. |
| `branch.dissolve()` | Dissolves this branch, its subtree, and deregisters from parent. |

### Ownership

| Method / Property | Description |
|---|---|
| `branch.activate(owner)` | Binds an owner (set-once). Required before any element/branch creation. |
| `branch.isOwnerAlive` | `null` (no owner), `true` (owner alive), `false` (owner GC'd — leak). |

### Inspection

| Property | Description |
|---|---|
| `branch.name` | Branch label. |
| `branch.depth` | Distance from root (0 = root, 18 = deepest). |
| `branch.toString()` | `DomOpsParty("name", depth=N, elements=N, branches=N)` |

---

## Leak Detection

```js
import { scanOnce, startLeakScanner } from './demo/leakScanner.js';

// One-shot scan
const leaks = scanOnce(domOpsParty);

// Periodic background scan with auto-dissolve
const scanner = startLeakScanner(domOpsParty, {
  intervalMs:   5000,
  autoDissolve: true,
  onLeaksFound: (leaks) => console.warn('Leaked branches:', leaks),
});

// Stop scanning
scanner.stop();
```

A branch is considered leaked when `isOwnerAlive === false` — the owner was registered via `activate()` but has since been garbage-collected, meaning the component went out of scope without calling `dissolve()`.

---

## File Structure

```
es-el-manager/
├── src/
│   └── party/
│       ├── _DomOpsPartyBase.js   Base class — element tracking, branch management,
│       │                         activation gate, dissolve logic
│       └── DomOpsParty.js        Root singleton + 18 typed level classes (L1–L18)
│
└── demo/
    ├── components/
    │   ├── CardComponent.js      Multi-instance, nestable. Self-closes via dissolve().
    │   ├── BannerComponent.js    Single-instance. External destroy() via dissolve().
    │   └── LeakyComponent.js     ⚠ Intentional bad example — dissolve() never called.
    ├── leakScanner.js            WeakRef-based leak detection (scan + auto-dissolve)
    ├── partyTree.js              Live party hierarchy renderer
    ├── demo.html                 Interactive demo
    ├── demo.js                   Demo wiring
    └── demo.css                  Demo styles
```

---

## Lifecycle

```
createBranch('widget')  →  branch.activate(this)
      │
      ├── branch.createElement('wrapper', 'div')
      ├── branch.createElement('title',   'h2')
      ├── branch.createBranch('child-1')  →  activate(childComponent)
      │     ├── createElement('icon', 'span')
      │     └── createElement('label', 'p')
      │
      ▼
branch.dissolve()
      │
      ├── child-1._dissolveTree()
      │     ├── icon.remove(), label.remove()
      │     └── clear element map
      ├── wrapper.remove(), title.remove()
      ├── clear element map
      └── deregister from parent
```

---

## Demo

Serve the project root and open `demo/demo.html`.

```bash
python3 -m http.server 8080
# or
npx serve .
```

The demo includes:

- **Cards** — spawn, nest up to 5 levels deep, close any card and watch the subtree dissolve.
- **Banner** — single-instance show/hide lifecycle.
- **Leak demo** — create orphaned branches, then audit and dissolve them.
- **Error scenarios** — duplicate names, invalid characters, unactivated branches.
- **Party tree** — live hierarchical view updated on every operation.
