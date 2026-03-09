/**
 * demo.js
 * Wires the demo HTML controls to DomOpsParty, CardComponent,
 * BannerComponent, and LeakyComponent.
 *
 * The root party (domOpsParty) owns the top-level layout zones.
 * No raw document.createElement() is used outside of demo infrastructure (log).
 */

import { CardComponent }    from './components/CardComponent.js';
import { BannerComponent }  from './components/BannerComponent.js';
import { LeakyComponent }   from './components/LeakyComponent.js';
import { refreshPartyTree } from './partyTree.js';
import { domOpsParty }      from '../src/party/DomOpsParty.js';

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
  renderZone.appendChild(element);
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
  leakedBranchNames.length = 0;
  leakCount = 0;
  log('Audit complete — all orphaned branches dissolved.', 'warn');
  refresh();
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
