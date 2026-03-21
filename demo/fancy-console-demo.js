/**
 * fancy-console-demo.js
 *
 * Dedicated demo page for FancyConsole — a multi-task console panel
 * built on DomOpsParty.
 */

import { FancyConsole }     from './components/FancyConsole.js';
import { refreshPartyTree } from './partyTree.js';
import { domOpsParty }      from '../src/party/DomOpsParty.js';

// ── Debug exposure ──────────────────────────────────────────────────────────────
window.__demo = { party: domOpsParty };

// ── Root party creates managed layout zones ─────────────────────────────────────
const renderZone         = domOpsParty.createElement('render-zone',          'div');
const partyTreeContainer = domOpsParty.createElement('party-tree-container', 'div');

document.getElementById('dom-canvas').appendChild(renderZone);
document.getElementById('party-tree-panel').appendChild(partyTreeContainer);

// ════════════════════════════════════════════════════════════════════════════════
//  Logging  (demo infrastructure — document.createElement intentional here)
// ════════════════════════════════════════════════════════════════════════════════
function log(msg, type = 'info') {
  const out   = document.getElementById('log-output');
  const now   = new Date();
  const time  = `${String(now.getMinutes()).padStart(2,'0')}:${String(now.getSeconds()).padStart(2,'0')}.${String(now.getMilliseconds()).padStart(3,'0')}`;
  const entry = document.createElement('div');
  entry.className = `log-entry log-${type}`;
  entry.innerHTML = `<span class="log-time">${time}</span><span class="log-msg">${msg}</span>`;
  out.appendChild(entry);
  out.scrollTop = out.scrollHeight;
}

// ════════════════════════════════════════════════════════════════════════════════
//  Status + party tree refresh
// ════════════════════════════════════════════════════════════════════════════════
function countTotalElements(branch) {
  let n = branch.elementCount;
  for (const name of branch.listBranches()) n += countTotalElements(branch.getBranch(name));
  return n;
}

function refresh() {
  document.getElementById('reg-count').textContent = countTotalElements(domOpsParty);
  refreshPartyTree(partyTreeContainer, domOpsParty);
}

// ════════════════════════════════════════════════════════════════════════════════
//  FancyConsole controls
// ════════════════════════════════════════════════════════════════════════════════
let fancyConsole = null;
let fcTaskSeq    = 0;
let latestTask   = null;   // { handle, taskId }
let latestTaskId = null;

function setMounted(mounted) {
  document.getElementById('btn-fc-create').disabled   = mounted;
  document.getElementById('btn-fc-destroy').disabled  = !mounted;
  document.getElementById('btn-fc-task').disabled      = !mounted;
  document.getElementById('btn-fc-demo').disabled      = !mounted;
  document.getElementById('btn-fc-demo-fail').disabled = !mounted;
  document.getElementById('fc-borders').disabled       = !mounted;
  if (!mounted) {
    setTaskControls(false);
    document.getElementById('fc-borders').checked = true;
  }
}

function setTaskControls(enabled) {
  document.getElementById('btn-fc-log').disabled    = !enabled;
  document.getElementById('btn-fc-finish').disabled = !enabled;
  document.getElementById('btn-fc-fail').disabled   = !enabled;
}

// ── Mount / Destroy ─────────────────────────────────────────────────────────────
document.getElementById('btn-fc-create').addEventListener('click', () => {
  if (fancyConsole) return;
  const ttlSec = Math.max(0, Number(document.getElementById('fc-ttl').value) || 0);
  try {
    fancyConsole = new FancyConsole({ ttl: ttlSec * 1000 });
    fancyConsole.mount(renderZone, refresh);
    setMounted(true);
    log(`FancyConsole mounted (TTL: ${ttlSec ? ttlSec + ' s' : 'disabled'})`, 'ok');
    refresh();
  } catch (e) { log(`[${e.constructor.name}] ${e.message}`, 'error'); }
});

document.getElementById('btn-fc-destroy').addEventListener('click', () => {
  if (!fancyConsole) return;
  fancyConsole.destroy();
  fancyConsole = null;
  fcTaskSeq    = 0;
  latestTask   = null;
  latestTaskId = null;
  setMounted(false);
  log('FancyConsole destroyed — branch.dissolve()', 'warn');
  refresh();
});

// ── Look & Feel ─────────────────────────────────────────────────────────────────
document.getElementById('fc-borders').addEventListener('change', (e) => {
  if (!fancyConsole) return;
  fancyConsole.showBorders = e.target.checked;
  log(`Borders ${e.target.checked ? 'enabled' : 'disabled'}`, 'info');
});

// ── Create Task ─────────────────────────────────────────────────────────────────
document.getElementById('btn-fc-task').addEventListener('click', () => {
  if (!fancyConsole) return;
  fcTaskSeq++;
  const label  = document.getElementById('fc-task-label').value.trim() || `task-${fcTaskSeq}`;
  const taskId = label.replace(/[^a-zA-Z0-9_-]/g, '_');
  try {
    const handle = fancyConsole.createTask(taskId, label);
    handle.log('Task created — awaiting updates...');
    latestTask   = handle;
    latestTaskId = taskId;
    setTaskControls(true);
    document.getElementById('fc-task-label').value = '';
    log(`createTask("${taskId}") — ready`, 'ok');
    refresh();
  } catch (e) { log(`[${e.constructor.name}] ${e.message}`, 'error'); }
});

// ── Task Control ────────────────────────────────────────────────────────────────
document.getElementById('btn-fc-log').addEventListener('click', () => {
  if (!latestTask) return;
  const msg  = document.getElementById('fc-log-msg').value.trim() || 'ping';
  const type = document.getElementById('fc-log-type').value;
  latestTask.log(msg, type);
  document.getElementById('fc-log-msg').value = '';
});

document.getElementById('btn-fc-finish').addEventListener('click', () => {
  if (!latestTask) return;
  latestTask.finish('Task completed successfully.');
  log(`Task "${latestTaskId}" finished`, 'ok');
  setTaskControls(false);
  latestTask = null;
  refresh();
});

document.getElementById('btn-fc-fail').addEventListener('click', () => {
  if (!latestTask) return;
  latestTask.fail('Task failed with an error.');
  log(`Task "${latestTaskId}" failed`, 'error');
  setTaskControls(false);
  latestTask = null;
  refresh();
});

// ════════════════════════════════════════════════════════════════════════════════
//  Demo Scenarios
// ════════════════════════════════════════════════════════════════════════════════

// ── Build + Test (both succeed) ─────────────────────────────────────────────────
document.getElementById('btn-fc-demo').addEventListener('click', () => {
  if (!fancyConsole) return;

  const buildId = `build-${crypto.randomUUID().slice(0, 6)}`;
  const testId  = `test-${crypto.randomUUID().slice(0, 6)}`;

  let build, test;
  try { build = fancyConsole.createTask(buildId, 'Build project'); } catch (e) { log(e.message, 'error'); return; }
  try { test  = fancyConsole.createTask(testId,  'Run tests');     } catch (e) { log(e.message, 'error'); return; }
  refresh();

  build.log('Compiling sources...');
  test.log('Collecting test suites...');

  setTimeout(() => { build.log('src/core — 12 modules compiled');     },   400);
  setTimeout(() => { test.log('Suite: unit — 48 tests');              },   600);
  setTimeout(() => { build.log('src/utils — 5 modules compiled');     },   900);
  setTimeout(() => { test.log('Suite: integration — 12 tests');       },  1100);
  setTimeout(() => { build.log('Bundling output...', 'warn');         },  1500);
  setTimeout(() => { test.log('Running unit suite...');               },  1400);
  setTimeout(() => { test.log('  48/48 passed', 'ok');                },  2200);
  setTimeout(() => { build.finish('Build complete — 0 errors');       },  2000);
  setTimeout(() => { test.log('Running integration suite...');        },  2600);
  setTimeout(() => { test.log('  12/12 passed', 'ok');                },  3400);
  setTimeout(() => { test.finish('All tests passed');                 },  3600);
  setTimeout(refresh, 3700);

  log(`Demo: "${buildId}" + "${testId}" running concurrently`, 'info');
});

// ── Deploy (fails) ──────────────────────────────────────────────────────────────
document.getElementById('btn-fc-demo-fail').addEventListener('click', () => {
  if (!fancyConsole) return;

  const deployId = `deploy-${crypto.randomUUID().slice(0, 6)}`;

  let deploy;
  try { deploy = fancyConsole.createTask(deployId, 'Deploy to staging'); } catch (e) { log(e.message, 'error'); return; }
  refresh();

  deploy.log('Pulling latest image...');
  setTimeout(() => { deploy.log('Image: app:v2.4.1-rc3 (142 MB)');                  },   500);
  setTimeout(() => { deploy.log('Starting rolling update...');                       },  1200);
  setTimeout(() => { deploy.log('Pod 1/3 healthy', 'ok');                            },  1800);
  setTimeout(() => { deploy.log('Pod 2/3 — CrashLoopBackOff', 'warn');              },  2600);
  setTimeout(() => { deploy.log('Pod 2/3 — OOMKilled (limit: 256 Mi)', 'error');    },  3200);
  setTimeout(() => { deploy.fail('Rollback triggered — deploy aborted');             },  3800);
  setTimeout(refresh, 3900);

  log(`Demo: "${deployId}" — deploy scenario (will fail)`, 'info');
});

// ════════════════════════════════════════════════════════════════════════════════
//  Misc
// ════════════════════════════════════════════════════════════════════════════════
document.getElementById('btn-log-clear').addEventListener('click', () => {
  document.getElementById('log-output').innerHTML = '';
});

// ── Init ────────────────────────────────────────────────────────────────────────
log('DomOpsParty singleton initialised.', 'info');
log('FancyConsole demo — mount the console, then create tasks or run scenarios.', 'info');
refresh();
