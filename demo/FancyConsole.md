# FancyConsole

A multi-task console panel built on **DomOpsParty**. Each task gets its own
mini-console card with timestamped log output, a status badge, and
fold/unfold support. Multiple tasks display sequentially inside a single
console panel. Finished tasks can auto-remove after an optional TTL.

---

## Quick Start

```js
import { FancyConsole } from './components/FancyConsole.js';

// 1. Create the console (TTL = 10 s auto-cleanup for finished tasks)
const fc = new FancyConsole({ ttl: 10_000 });

// 2. Mount into a container element
fc.mount(document.getElementById('my-container'));

// 3. Create a task — returns a handle
const task = fc.createTask('deploy', 'Deploy to staging');

// 4. Log updates
task.log('Pulling image...');
task.log('Rolling update started');
task.log('Pod 1/3 healthy', 'ok');
task.log('Memory limit exceeded', 'warn');

// 5. Mark complete
task.finish('Deploy successful');   // or task.fail('Rollback triggered')
```

---

## Constructor

```js
new FancyConsole({ ttl, branch })
```

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `ttl` | `number` | `0` | Milliseconds before a finished/failed task auto-removes. `0` disables auto-cleanup. |
| `branch` | `_DomOpsPartyBase` | `null` | Pre-created branch. If omitted, creates a root-level branch named `'fancy-console'`. |

---

## Instance Methods

### `mount(zone, onRefresh?)`

Appends the console panel into `zone`.

| Parameter | Type | Description |
|-----------|------|-------------|
| `zone` | `HTMLElement` | Container to append into. |
| `onRefresh` | `Function` | Optional callback fired after any structural change (task created, removed, status changed). |

### `createTask(taskId, label?)`

Creates a new task card and returns a **task handle**.

| Parameter | Type | Description |
|-----------|------|-------------|
| `taskId` | `string` | Unique identifier. Must match `[a-zA-Z0-9_-]+`. Becomes the branch name. |
| `label` | `string` | Display label shown in the card header. Defaults to `taskId`. |

**Returns:** `{ log, finish, fail }` — see [Task Handle](#task-handle).

**Throws:** `RangeError` if `taskId` already exists.

### `removeTask(taskId)`

Immediately removes a task card and dissolves its branch. Safe to call on
already-removed tasks (no-op).

### `destroy()`

Tears down the entire console — cancels all TTL timers, dissolves every task
branch, and dissolves the console branch itself.

---

## Task Handle

The object returned by `createTask()`. All methods are safe to call after the
task has been removed (they silently no-op).

### `task.log(message, type?)`

Appends a timestamped line to the task's output area.

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `message` | `string` | — | Text to display. |
| `type` | `string` | `'info'` | Log level. One of `'info'`, `'ok'`, `'warn'`, `'error'`. Controls line colour. |

### `task.finish(message?)`

Marks the task as **DONE**. The status badge turns green and the card's left
border changes to accent green. If a `message` is provided it is appended as
a final `'ok'` log line. Starts the TTL countdown (if configured).

Calling `finish()` on an already-finished or failed task is a no-op.

### `task.fail(message?)`

Marks the task as **FAILED**. The status badge turns red and the card's left
border changes to red. If a `message` is provided it is appended as a final
`'error'` log line. Starts the TTL countdown (if configured).

---

## Properties

| Property | Type | Description |
|----------|------|-------------|
| `branch` | `_DomOpsPartyBase` | The console's DomOpsParty branch. |
| `taskCount` | `number` | Number of active tasks. |
| `showBorders` | `boolean` | Get/set border visibility on the panel and all task cards. `true` by default. |

---

## Look & Feel

### Borders

Toggle borders on the console panel and all task cards:

```js
fc.showBorders = false;   // borderless mode
fc.showBorders = true;    // restore borders (default)
```

### Fold / Unfold

Each task card has a clickable arrow in its header:

- **Unfolded** (default): arrow points down (`▾`), output area is visible.
- **Folded**: arrow points right (`▸`), output area is hidden — only the
  title and status badge remain visible.

Folding is per-card and controlled by the user clicking the arrow. There is no
programmatic API for folding.

---

## Branch Layout

FancyConsole uses DomOpsParty branches to manage all its DOM:

```
domOpsParty (L0)
  └─ fancy-console (L1)
       ├─ elements: wrapper, header, task-count, task-zone
       ├─ branch 'deploy' (L2)
       │    └─ elements: card, card-header, arrow, title, status, output
       ├─ branch 'build' (L2)
       │    └─ elements: card, card-header, arrow, title, status, output
       └─ …
```

Each task occupies one sub-branch with 6 managed elements. Log lines within the
output element are ephemeral HTML content, not individually managed elements.

---

## Task Lifecycle

```
 createTask()          log() / log() / ...         finish() or fail()
      │                       │                           │
      ▼                       ▼                           ▼
  ┌────────┐           ┌────────────┐              ┌────────────┐
  │RUNNING │──────────▶│  RUNNING   │─────────────▶│ DONE/FAILED│
  │(empty) │           │(with logs) │              │            │
  └────────┘           └────────────┘              └─────┬──────┘
                                                         │
                                                    TTL timer
                                                    (if set)
                                                         │
                                                         ▼
                                                   removeTask()
                                                  branch.dissolve()
```

- A task starts in **RUNNING** state.
- `log()` appends lines at any time while running.
- `finish()` or `fail()` transitions to a terminal state. Only the first
  call takes effect.
- If TTL is configured, a timer starts on transition. When it fires, the
  task card is removed and its branch dissolved.
- `removeTask()` can be called at any time to immediately remove a task,
  cancelling any pending TTL timer.
- `destroy()` removes everything at once.

---

## CSS Classes Reference

| Class | Applied to | Purpose |
|-------|-----------|---------|
| `fc-panel` | Console wrapper | Outer panel with green left border. |
| `fc-panel--borderless` | Console wrapper | Removes all borders (toggled by `showBorders`). |
| `fc-header` | Panel header | Dark header bar with label and task count. |
| `fc-task-zone` | Task container | Vertical stack of task cards. |
| `fc-task-card` | Task card | Individual task with blue left border. |
| `fc-task-card--done` | Task card | Green left border (finished). |
| `fc-task-card--error` | Task card | Red left border (failed). |
| `fc-task-card--folded` | Task card | Hides output, removes header bottom border. |
| `fc-task-arrow` | Arrow toggle | Fold/unfold indicator in card header. |
| `fc-task-status` | Status badge | Inline badge. Variants: `--running`, `--done`, `--error`. |
| `fc-task-output` | Output area | Scrollable log area (max-height: 140px). |
| `fc-line` | Log line | Flex row with timestamp + message. |
| `fc-line--info/ok/warn/error` | Log line | Colour variants for log level. |

---

## Example: Concurrent Tasks with TTL

```js
const fc = new FancyConsole({ ttl: 5000 });
fc.mount(document.getElementById('output'));

const build = fc.createTask('build', 'Build project');
const test  = fc.createTask('test',  'Run tests');

build.log('Compiling...');
test.log('Collecting suites...');

setTimeout(() => build.finish('Build complete'), 2000);
setTimeout(() => {
  test.log('12/12 passed', 'ok');
  test.finish('All tests passed');
}, 3000);

// Both cards auto-remove 5 seconds after finishing.
```

---

## Demo

Open `demo/fancy-console.html` in a browser to interact with FancyConsole.
The demo page provides controls for mounting, creating tasks, logging,
finishing/failing, and toggling visual options.
