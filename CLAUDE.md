# CLAUDE.md — ElementManager Project Guide

This file gives Claude Code the context needed to continue development
without re-reading the entire conversation history.

---

## What This Project Is

A singleton DOM element manager packaged as ES6 modules. All DOM element
creation is centralised through a single registry. Every element has a typed
owner and a guaranteed cleanup path. No element can be created or released
outside the system.

---

## Architecture — Non-Negotiable Design Decisions

### 1. `ManagedComponent` is a pure marker class
- Zero imports, zero state, zero logic.
- Its only purpose is to serve as a type gate (`instanceof` check) and expose
  the `onDestroy()` override hook.
- Do NOT add lifecycle logic, tracking state, or imports to `ManagedComponent`.
- All logic belongs in `ElementManager`.

### 2. `ElementId` is an immutable value object
- Wraps a frozen `string[]` of segments.
- Segments: `[a-zA-Z0-9_-]` only, non-empty.
- `.key` is the dot-joined canonical string used as the internal `Map` key.
- Constructed as `new ElementId(['namespace', 'child', 'leaf'])`.
- Raw strings are **never** accepted in the public API — always `ElementId`.

### 3. `ElementManager` owns all lifecycle logic
- The registry is `Map<string, { element, owner, id }>` keyed by `ElementId.key`.
- `createElement` → registers and returns element, sets `element.id = elementId.key`.
- `returnElement` → owner-checked, removes from DOM and registry.
- `removeAllElementsForComponent` → bulk release by owner identity (`===`).
- `destroyComponent` → calls `onDestroy()` then `removeAllElementsForComponent()`.
- Element tracking (which IDs belong to which component) lives **only** in the
  registry. `ManagedComponent` does not mirror this state.

### 4. Component ID namespacing
- Components that can have multiple instances (e.g. `CardComponent`) receive a
  `cardId` (or equivalent) in their constructor.
- All `ElementId` instances for that component are prefixed with the instance id:
  `new ElementId([cardId, 'title'])`, `new ElementId([cardId, 'body'])`, etc.
- This prevents collisions between instances and makes the registry tree readable.

### 5. Teardown paths
There are two valid teardown paths — they are interchangeable:
- **Manual** — component calls `returnElement()` per element (e.g. close button).
- **Automatic** — caller calls `elementManager.destroyComponent(component)`.
  `destroyComponent` always runs `removeAllElementsForComponent` as a safety net
  after `onDestroy()`, so partial manual cleanup is still safe.

---

## File Responsibilities

| File | Responsibility |
|---|---|
| `ElementId.js` | Immutable value object. No imports. |
| `ManagedComponent.js` | Marker base class. No imports. No logic. |
| `elementManager.js` | Singleton registry + all lifecycle logic. Imports the above two. Re-exports nothing except `elementManager`. |
| `CardComponent.js` | Multi-instance component. Constructor takes `cardId`. Has close button that calls `returnElement` directly. |
| `BannerComponent.js` | Single-instance component. Simple show/hide. |
| `LeakyComponent.js` | ⚠ Intentional bad example. `destroyComponent()` is never called. |
| `registryTree.js` | Renders the live registry as a DOM tree. Accepts `ownerColorMap: Map<ManagedComponent, cssClass>`. |
| `demo.html/js/css` | Interactive demo. Uses `crypto.randomUUID()` for card IDs. |

---

## Public API Quick Reference

```js
// Create
elementManager.createElement(owner, elementId, elementType) → HTMLElement

// Release
elementManager.returnElement(owner, elementId)
elementManager.removeAllElementsForComponent(owner)
elementManager.destroyComponent(component)       // preferred teardown

// Inspect
elementManager.size                              // number
elementManager.has(elementId)                    // boolean
elementManager.getElement(elementId)             // HTMLElement | null
elementManager.getOwner(elementId)               // ManagedComponent | null
elementManager.listIds()                         // ElementId[]
elementManager.listIdsForComponent(owner)        // ElementId[]
elementManager.listIdsByPrefix(prefix)           // ElementId[]
```

---

## Coding Conventions

- All files are ES6 modules — `import`/`export` only, no CommonJS.
- Private fields use `#` prefix (`#wrapper`, `#registry`).
- Guards (`#assertManagedComponent`, `#assertElementId`) are private methods on
  `ElementManager` — reuse them, don't duplicate inline checks.
- New components follow this pattern:
  1. `extends ManagedComponent`
  2. Import `elementManager` and `ElementId` — never `document.createElement` directly.
  3. Define `ElementId` constants at module level (or derive from `cardId` in constructor).
  4. Implement `onDestroy()` to remove wrapper divs and null refs only — no `returnElement` calls there.
- The demo wires `refreshRegistry()` and `refreshTree(treeContainer, buildOwnerColorMap())`
  after every state change. New components must be added to `buildOwnerColorMap()` in `demo.js`.

---

## Known Intentional Constraints

- `ManagedComponent` has **no** `destroy()` method — destruction is driven by
  `ElementManager`, not the component itself.
- `LeakyComponent` is a demo artifact — it exists to show what orphaned registry
  entries look like. Do not "fix" it.
- The registry tree colours nodes by owner identity via `ownerColorMap`, not by
  segment string, because card root segments are dynamic UUIDs.
