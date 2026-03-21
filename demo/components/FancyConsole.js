/**
 * FancyConsole.js
 *
 * A multi-task console panel. Each task gets its own mini-console card
 * showing live execution output. Multiple tasks display sequentially.
 *
 * Branch layout:
 *   domOpsParty (L0)
 *     └─ branch 'fancy-console'  (L1, console panel)
 *          ├─ elements: wrapper, header, task-zone, task-count
 *          ├─ branch '<taskId>'   (L2, task card)
 *          │    └─ elements: card, card-header, title, status, output
 *          └─ …
 *
 * API:
 *   const fc = new FancyConsole({ ttl: 5000 });
 *   fc.mount(zone, onRefresh);
 *   const task = fc.createTask('build', 'Building project...');
 *   task.log('Step 1 done');
 *   task.log('Compiling...', 'warn');
 *   task.finish('Build complete');   // starts TTL countdown
 *   task.fail('Compilation error');  // marks failed, starts TTL
 *
 * Teardown:
 *   fc.removeTask(taskId)  — dissolve one task's branch
 *   fc.destroy()           — dissolve entire console branch
 */

import { domOpsParty } from '../../src/party/DomOpsParty.js';

export class FancyConsole {
  #branch    = null;
  #tasks     = new Map();   // taskId → { branch, status, ttlTimer, lineCount }
  #defaultTtl = 0;          // ms; 0 = no auto-cleanup
  #onRefresh  = null;

  /**
   * @param {object}            [opts]
   * @param {number}            [opts.ttl=0]     - Auto-cleanup delay (ms) after finish/fail. 0 = manual only.
   * @param {_DomOpsPartyBase}  [opts.branch]    - Pre-created branch. Defaults to root-level.
   */
  constructor({ ttl = 0, branch = null } = {}) {
    this.#defaultTtl = ttl;
    this.#branch = branch ?? domOpsParty.createBranch('fancy-console');
    this.#branch.activate(this);
  }

  get branch()    { return this.#branch; }
  get taskCount() { return this.#tasks.size; }

  /**
   * Toggle whether the console and task cards render with borders.
   * @param {boolean} show - true = borders visible (default), false = borderless.
   */
  set showBorders(show) {
    this.#branch?.getElement('wrapper')?.classList.toggle('fc-panel--borderless', !show);
  }
  get showBorders() {
    return !this.#branch?.getElement('wrapper')?.classList.contains('fc-panel--borderless');
  }

  /**
   * Mount the console panel into a container element.
   * @param {HTMLElement} zone       - Container to append into.
   * @param {Function}    [onRefresh] - Called after any structural change.
   */
  mount(zone, onRefresh = null) {
    this.#onRefresh = onRefresh;

    const wrapper   = this.#branch.createElement('wrapper',    'div');
    const header    = this.#branch.createElement('header',     'div');
    const countEl   = this.#branch.createElement('task-count', 'span');
    const taskZone  = this.#branch.createElement('task-zone',  'div');

    wrapper.className   = 'fc-panel';
    header.className    = 'fc-header';
    countEl.className   = 'fc-task-count';
    countEl.textContent = '0 tasks';
    taskZone.className  = 'fc-task-zone';

    header.innerHTML = '<span class="fc-header-label">FancyConsole</span>';
    header.appendChild(countEl);
    wrapper.append(header, taskZone);
    zone.appendChild(wrapper);
  }

  /**
   * Create a new task card.
   * @param {string} taskId  - Unique task identifier (becomes branch name).
   * @param {string} [label] - Display label; defaults to taskId.
   * @returns {{ log, finish, fail }} Task handle.
   */
  createTask(taskId, label = taskId) {
    if (this.#tasks.has(taskId)) {
      throw new RangeError(`[FancyConsole] Task "${taskId}" already exists.`);
    }

    const taskBranch = this.#branch.createBranch(taskId);
    taskBranch.activate(this);

    const card       = taskBranch.createElement('card',        'div');
    const cardHeader = taskBranch.createElement('card-header', 'div');
    const arrow      = taskBranch.createElement('arrow',       'span');
    const titleEl    = taskBranch.createElement('title',       'span');
    const statusEl   = taskBranch.createElement('status',      'span');
    const output     = taskBranch.createElement('output',      'div');

    card.className       = 'fc-task-card';
    cardHeader.className = 'fc-task-card-header';
    arrow.className      = 'fc-task-arrow';
    arrow.textContent    = '\u25BE';   // ▾ down-pointing
    titleEl.className    = 'fc-task-title';
    titleEl.textContent  = label;
    statusEl.className   = 'fc-task-status fc-task-status--running';
    statusEl.textContent = 'RUNNING';
    output.className     = 'fc-task-output';

    arrow.addEventListener('click', () => {
      const folded = card.classList.toggle('fc-task-card--folded');
      arrow.textContent = folded ? '\u25B8' : '\u25BE';   // ▸ right / ▾ down
    });

    cardHeader.append(arrow, titleEl, statusEl);
    card.append(cardHeader, output);
    this.#branch.getElement('task-zone').appendChild(card);

    const task = { branch: taskBranch, status: 'running', ttlTimer: null, lineCount: 0 };
    this.#tasks.set(taskId, task);
    this.#refreshCount();
    this.#onRefresh?.();

    return {
      log:    (msg, type = 'info') => this.#appendLine(taskId, msg, type),
      finish: (msg)                => this.#setStatus(taskId, 'done', msg),
      fail:   (msg)                => this.#setStatus(taskId, 'error', msg),
    };
  }

  /**
   * Remove a task card and dissolve its branch.
   */
  removeTask(taskId) {
    const task = this.#tasks.get(taskId);
    if (!task) return;
    if (task.ttlTimer) clearTimeout(task.ttlTimer);
    task.branch.dissolve();
    this.#tasks.delete(taskId);
    this.#refreshCount();
    this.#onRefresh?.();
  }

  /**
   * Destroy the entire console — dissolves all task branches and the panel.
   */
  destroy() {
    for (const [, task] of this.#tasks) {
      if (task.ttlTimer) clearTimeout(task.ttlTimer);
    }
    this.#tasks.clear();
    this.#branch?.dissolve();
    this.#branch = null;
  }

  // ── Private ─────────────────────────────────────────────────────────────────

  #appendLine(taskId, msg, type) {
    const task = this.#tasks.get(taskId);
    if (!task) return;

    const output = task.branch.getElement('output');
    const ts     = new Date();
    const time   = `${String(ts.getMinutes()).padStart(2, '0')}:${String(ts.getSeconds()).padStart(2, '0')}.${String(ts.getMilliseconds()).padStart(3, '0')}`;

    task.lineCount++;
    output.insertAdjacentHTML('beforeend',
      `<div class="fc-line fc-line--${type}">` +
        `<span class="fc-line-time">${time}</span>` +
        `<span class="fc-line-msg">${msg}</span>` +
      `</div>`
    );
    output.scrollTop = output.scrollHeight;
  }

  #setStatus(taskId, status, msg) {
    const task = this.#tasks.get(taskId);
    if (!task || task.status !== 'running') return;
    task.status = status;

    const statusEl = task.branch.getElement('status');
    statusEl.textContent = status === 'done' ? 'DONE' : 'FAILED';
    statusEl.className   = `fc-task-status fc-task-status--${status}`;

    const card = task.branch.getElement('card');
    card.classList.add(`fc-task-card--${status}`);

    if (msg) this.#appendLine(taskId, msg, status === 'done' ? 'ok' : 'error');

    if (this.#defaultTtl > 0) {
      task.ttlTimer = setTimeout(() => this.removeTask(taskId), this.#defaultTtl);
    }

    this.#onRefresh?.();
  }

  #refreshCount() {
    const el = this.#branch?.getElement('task-count');
    if (!el) return;
    const n = this.#tasks.size;
    el.textContent = `${n} task${n !== 1 ? 's' : ''}`;
  }
}
