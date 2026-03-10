/**
 * demo.js
 * Wires the demo HTML controls to DomOpsParty, CardComponent,
 * BannerComponent, and LeakyComponent.
 *
 * The root party (domOpsParty) owns the top-level layout zones.
 * No raw document.createElement() is used outside of demo infrastructure (log).
 */

import { CardComponent }              from './components/CardComponent.js';
import { BannerComponent }            from './components/BannerComponent.js';
import { LeakyComponent }             from './components/LeakyComponent.js';
import { refreshPartyTree }           from './partyTree.js';
import { startLeakScanner, scanOnce } from './leakScanner.js';
import { domOpsParty }                from '../src/party/DomOpsParty.js';

// ── Debug exposure ────────────────────────────────────────────────────────────
window.__demo = { party: domOpsParty };

// ── Root party creates managed layout zones ───────────────────────────────────
const renderZone         = domOpsParty.createElement('render-zone',          'div');
const partyTreeContainer = domOpsParty.createElement('party-tree-container', 'div');

document.getElementById('dom-canvas').appendChild(renderZone);
document.getElementById('party-tree-panel').appendChild(partyTreeContainer);

// ── Component instances ───────────────────────────────────────────────────────
let banner        = new BannerComponent();
let bannerVisible = false;
let customBranch  = null;
let partySeq      = 0;

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

function refreshStatus() {
  document.getElementById('reg-count').textContent = countTotalElements(domOpsParty);
}

function refreshParty() {
  const sel      = document.getElementById('party-branch-select');
  const branches = domOpsParty.listBranches();

  sel.innerHTML = branches.length === 0
    ? '<option value="">— no branches yet —</option>'
    : branches.map(b => `<option value="${b}">${b}</option>`).join('');

  const hasBranches = branches.length > 0;
  document.getElementById('btn-party-join-branch').disabled = !hasBranches;
  document.getElementById('btn-party-dissolve').disabled    = !hasBranches;

  refreshPartyTree(partyTreeContainer, domOpsParty);
}

function refresh() {
  refreshStatus();
  refreshParty();
}

// ════════════════════════════════════════════════════════════════════════════════
//  CardComponent controls
// ════════════════════════════════════════════════════════════════════════════════
function spawnCard() {
  const cardId = crypto.randomUUID().slice(0, 8);
  const card   = new CardComponent(cardId);

  card.mount(
    renderZone,
    () => { log(`Card "${cardId}" closed — branch.dissolve()`, 'warn'); refresh(); },
    refresh,
  );

  log(`new CardComponent("${cardId}").mount() → 8 elements on branch`, 'ok');
  refresh();
}

document.getElementById('btn-card-mount').addEventListener('click', () => {
  try { spawnCard(); } catch (e) { log(e.message, 'error'); }
});

// ════════════════════════════════════════════════════════════════════════════════
//  BannerComponent controls
// ════════════════════════════════════════════════════════════════════════════════
document.getElementById('btn-banner-show').addEventListener('click', () => {
  if (bannerVisible) return;
  try {
    banner.show(renderZone);
    bannerVisible = true;
    log('BannerComponent.show() → 3 elements on "banner" branch', 'ok');
    document.getElementById('btn-banner-show').disabled = true;
    document.getElementById('btn-banner-hide').disabled = false;
    refresh();
  } catch (e) { log(e.message, 'error'); }
});

document.getElementById('btn-banner-hide').addEventListener('click', () => {
  if (!bannerVisible) return;
  try {
    banner.destroy();
    bannerVisible = false;
    log('BannerComponent.destroy() → branch.dissolve() — 3 elements released', 'warn');
    banner = new BannerComponent();
    document.getElementById('btn-banner-show').disabled = false;
    document.getElementById('btn-banner-hide').disabled = true;
    refresh();
  } catch (e) { log(e.message, 'error'); }
});

// ════════════════════════════════════════════════════════════════════════════════
//  Custom element controls
// ════════════════════════════════════════════════════════════════════════════════
document.getElementById('btn-custom-create').addEventListener('click', () => {
  const name   = document.getElementById('custom-id').value.trim();
  const tagVal = document.getElementById('custom-tag').value;
  if (!name) { log('Element name is empty.', 'warn'); return; }

  try {
    customBranch = domOpsParty.createBranch('custom');

    const wrapper = customBranch.createElement('wrapper', 'div');
    const label   = customBranch.createElement('label',   'div');
    const el      = customBranch.createElement(name,      tagVal);

    wrapper.className = 'managed-custom';
    label.className   = 'tag';
    label.textContent = `▸ Custom Branch  ·  element: "${name}"  ·  <${tagVal}>`;
    el.textContent    = `<${tagVal}>  "${name}"`;

    wrapper.append(label, el);
    renderZone.appendChild(wrapper);

    log(`customBranch.createElement("${name}", "${tagVal}") ✓`, 'ok');
    document.getElementById('btn-custom-create').disabled = true;
    document.getElementById('btn-custom-return').disabled = false;
    refresh();
  } catch (e) { log(`[${e.constructor.name}] ${e.message}`, 'error'); }
});

document.getElementById('btn-custom-return').addEventListener('click', () => {
  if (!customBranch) return;
  try {
    customBranch.dissolve();
    log('customBranch.dissolve() → all elements released', 'warn');
    customBranch = null;
    document.getElementById('btn-custom-create').disabled = false;
    document.getElementById('btn-custom-return').disabled = true;
    document.getElementById('custom-id').value = '';
    refresh();
  } catch (e) { log(`[${e.constructor.name}] ${e.message}`, 'error'); }
});

// ════════════════════════════════════════════════════════════════════════════════
//  Error scenario controls
// ════════════════════════════════════════════════════════════════════════════════

// Duplicate element name on same branch → RangeError
document.getElementById('btn-err-dupe').addEventListener('click', () => {
  partySeq++;
  const b = domOpsParty.createBranch(`err-${partySeq}`);
  try {
    b.createElement('test', 'div');
    b.createElement('test', 'span');  // duplicate name
  } catch (e) {
    log(`[${e.constructor.name}] ${e.message}`, 'error');
  } finally {
    b.dissolve();
    refresh();
  }
});

// Element name with invalid characters → RangeError
document.getElementById('btn-err-owner').addEventListener('click', () => {
  partySeq++;
  const b = domOpsParty.createBranch(`err-${partySeq}`);
  try {
    b.createElement('bad name!', 'div');
  } catch (e) {
    log(`[${e.constructor.name}] ${e.message}`, 'error');
  } finally {
    b.dissolve();
    refresh();
  }
});

// Empty element name → TypeError
document.getElementById('btn-err-missing').addEventListener('click', () => {
  partySeq++;
  const b = domOpsParty.createBranch(`err-${partySeq}`);
  try {
    b.createElement('', 'div');
  } catch (e) {
    log(`[${e.constructor.name}] ${e.message}`, 'error');
  } finally {
    b.dissolve();
    refresh();
  }
});

// Invalid branch name → RangeError
document.getElementById('btn-err-plain-obj').addEventListener('click', () => {
  try {
    domOpsParty.createBranch('invalid name!');
  } catch (e) { log(`[${e.constructor.name}] ${e.message}`, 'error'); }
});

// ════════════════════════════════════════════════════════════════════════════════
//  DomOpsParty controls
// ════════════════════════════════════════════════════════════════════════════════
document.getElementById('btn-party-join-root').addEventListener('click', () => {
  partySeq++;
  const name = `branch-${partySeq}`;
  domOpsParty.createBranch(name);
  log(`domOpsParty.createBranch("${name}") → DomOpsPartyL1  |  root branches: ${domOpsParty.branchCount}`, 'ok');
  refresh();
});

document.getElementById('btn-party-create-branch').addEventListener('click', () => {
  const name = document.getElementById('party-branch-name').value.trim();
  if (!name) { log('Branch name is empty.', 'warn'); return; }
  try {
    domOpsParty.createBranch(name);
    document.getElementById('party-branch-name').value = '';
    log(`domOpsParty.createBranch("${name}") → DomOpsPartyL1  |  root branches: ${domOpsParty.branchCount}`, 'ok');
    refresh();
  } catch (e) { log(`[${e.constructor.name}] ${e.message}`, 'error'); }
});

document.getElementById('btn-party-join-branch').addEventListener('click', () => {
  const name   = document.getElementById('party-branch-select').value;
  if (!name) { log('No branch selected.', 'warn'); return; }
  const branch = domOpsParty.getBranch(name);
  if (!branch) { log(`Branch "${name}" not found.`, 'error'); return; }
  partySeq++;
  const childName = `branch-${partySeq}`;
  try {
    branch.createBranch(childName);
    log(`branch("${name}").createBranch("${childName}") → DomOpsPartyL2  |  sub-branches: ${branch.branchCount}`, 'ok');
    refresh();
  } catch (e) { log(`[${e.constructor.name}] ${e.message}`, 'error'); }
});

document.getElementById('btn-party-dissolve').addEventListener('click', () => {
  const name = document.getElementById('party-branch-select').value;
  if (!name) { log('No branch selected.', 'warn'); return; }
  try {
    domOpsParty.dissolveBranch(name);
    log(`domOpsParty.dissolveBranch("${name}") ✓  root branches: ${domOpsParty.branchCount}`, 'warn');
    refresh();
  } catch (e) { log(`[${e.constructor.name}] ${e.message}`, 'error'); }
});

// ════════════════════════════════════════════════════════════════════════════════
//  LeakyComponent controls
// ════════════════════════════════════════════════════════════════════════════════
let leakCount = 0;
const leakedBranchNames = [];

document.getElementById('btn-leak-spawn').addEventListener('click', () => {
  leakCount++;
  const leaky = new LeakyComponent();
  const { branchName, element } = leaky.spawn(leakCount);
  leakedBranchNames.push(branchName);

  // Wrap the managed element in an unmanaged container so we can attach a
  // per-item cleanup button without touching the branch-managed element itself.
  const wrapper   = document.createElement('div');
  wrapper.className = 'leaked-el-wrapper';

  const removeBtn = document.createElement('button');
  removeBtn.className   = 'leaked-el-remove-btn';
  removeBtn.textContent = '✕ clean up';
  removeBtn.title       = `Force-dissolve branch "${branchName}"`;

  removeBtn.addEventListener('click', () => {
    const idx = leakedBranchNames.indexOf(branchName);
    if (idx !== -1) leakedBranchNames.splice(idx, 1);
    try {
      domOpsParty.dissolveBranch(branchName);
      log(`[Manual cleanup] dissolveBranch("${branchName}") ✓ — elements released`, 'warn');
    } catch (e) {
      log(`[Manual cleanup] "${branchName}" — ${e.message}`, 'error');
    }
    wrapper.remove();   // remove the unmanaged wrapper (managed element already gone)
    refresh();
  });

  wrapper.appendChild(element);
  wrapper.appendChild(removeBtn);
  renderZone.appendChild(wrapper);
  // leaky goes out of scope — dissolve() never called

  log(`new LeakyComponent().spawn(${leakCount}) — branch "${branchName}" orphaned, dissolve() never called`, 'error');
  log(`⚠ ${leakedBranchNames.length} orphaned branch${leakedBranchNames.length !== 1 ? 'es' : ''}: [${leakedBranchNames.join(', ')}]`, 'warn');
  refresh();
});

document.getElementById('btn-leak-reset').addEventListener('click', () => {
  if (leakedBranchNames.length === 0) { log('No leaks to clear.', 'info'); return; }
  for (const branchName of leakedBranchNames) {
    try {
      domOpsParty.dissolveBranch(branchName);
      log(`[Audit] dissolveBranch("${branchName}") ✓ — elements released`, 'warn');
    } catch (e) {
      log(`[Audit] "${branchName}" — ${e.message}`, 'error');
    }
  }
  // Also remove any leftover unmanaged wrapper divs (the per-item cleanup buttons).
  renderZone.querySelectorAll('.leaked-el-wrapper').forEach(w => w.remove());
  leakedBranchNames.length = 0;
  leakCount = 0;
  log('Audit complete — all orphaned branches dissolved.', 'warn');
  refresh();
});

// ════════════════════════════════════════════════════════════════════════════════
//  Leak Scanner controls
// ════════════════════════════════════════════════════════════════════════════════
let _scanner         = null;
let _leaksDissolved  = 0;

function recordLeaks(leaks) {
  _leaksDissolved += leaks.length;
  const el = document.getElementById('leak-count');
  el.textContent = _leaksDissolved;
  el.classList.toggle('has-leaks', _leaksDissolved > 0);
  for (const b of leaks) {
    log(`[LeakScanner] branch "${b.name}" — owner GC'd, dissolved`, 'error');
  }
}

/**
 * Scans the full party tree for leaked branches (isOwnerAlive === false),
 * dissolves them all recursively, sweeps unmanaged wrapper divs left behind
 * by the LeakyComponent demo UI, and syncs the leakedBranchNames tracking.
 * Returns the number of branches dissolved.
 */
function cleanAllLeaks() {
  const leaks = scanOnce(domOpsParty);
  if (leaks.length === 0) return 0;

  recordLeaks(leaks);

  for (const b of leaks) {
    // Keep manual tracking in sync so force-clear doesn't attempt to
    // re-dissolve branches that we already cleaned here.
    const idx = leakedBranchNames.indexOf(b.name);
    if (idx !== -1) leakedBranchNames.splice(idx, 1);
    b.dissolve();   // depth-first: dissolves entire subtree
  }

  // Sweep unmanaged wrapper divs left behind by the per-item UI.
  renderZone.querySelectorAll('.leaked-el-wrapper').forEach(w => w.remove());

  return leaks.length;
}

document.getElementById('btn-scanner-start').addEventListener('click', () => {
  if (_scanner) return;
  _scanner = startLeakScanner(domOpsParty, {
    intervalMs:   5000,
    autoDissolve: true,
    // onLeaksFound fires before auto-dissolve runs inside leakScanner.js.
    // Defer the full post-dissolve cleanup so it runs after that loop completes.
    onLeaksFound: (leaks) => {
      recordLeaks(leaks);
      setTimeout(() => {
        for (const b of leaks) {
          const idx = leakedBranchNames.indexOf(b.name);
          if (idx !== -1) leakedBranchNames.splice(idx, 1);
        }
        renderZone.querySelectorAll('.leaked-el-wrapper').forEach(w => w.remove());
        refresh();
      }, 0);
    },
  });
  log('[LeakScanner] Auto-scan started — interval: 5 s', 'info');
  document.getElementById('btn-scanner-start').disabled = true;
  document.getElementById('btn-scanner-stop').disabled  = false;
});

document.getElementById('btn-scanner-stop').addEventListener('click', () => {
  _scanner?.stop();
  _scanner = null;
  log('[LeakScanner] Auto-scan stopped', 'info');
  document.getElementById('btn-scanner-start').disabled = false;
  document.getElementById('btn-scanner-stop').disabled  = true;
});

document.getElementById('btn-scanner-scan-now').addEventListener('click', () => {
  const count = cleanAllLeaks();
  if (count === 0) {
    log('[LeakScanner] Scan complete — no leaked branches detected', 'info');
    return;
  }
  refresh();
});

document.getElementById('btn-scanner-clean-all').addEventListener('click', () => {
  const count = cleanAllLeaks();
  if (count === 0) {
    log('[LeakScanner] Tree scan complete — no leaks found', 'info');
  } else {
    log(`[LeakScanner] Cleaned ${count} leaked branch${count !== 1 ? 'es' : ''} from tree`, 'warn');
    refresh();
  }
});

// ════════════════════════════════════════════════════════════════════════════════
//  Misc
// ════════════════════════════════════════════════════════════════════════════════
document.getElementById('btn-log-clear').addEventListener('click', () => {
  document.getElementById('log-output').innerHTML = '';
});

document.getElementById('custom-id').placeholder = 'e.g. my-widget';

// ── Init ──────────────────────────────────────────────────────────────────────
log('DomOpsParty singleton initialised.', 'info');
log('All component DOM elements come from branch.createElement() — no raw document.createElement().', 'info');
refresh();
