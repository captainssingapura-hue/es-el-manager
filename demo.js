/**
 * demo.js
 * Wires the demo HTML controls to ElementManager, ManagedComponent,
 * CardComponent, BannerComponent, and LeakyComponent.
 */

import { elementManager } from './elementManager.js';
import { ManagedComponent } from './ManagedComponent.js';

import { ElementId }        from './ElementId.js';
import { CardComponent }    from './CardComponent.js';
import { BannerComponent }  from './BannerComponent.js';
import { LeakyComponent }   from './LeakyComponent.js';
import { refreshTree }      from './registryTree.js';

// ── DOM refs ──────────────────────────────────────────────────────────────────
const zone        = document.getElementById('render-zone');
const treeContainer = document.getElementById('tree-container');

// ── Component instances ───────────────────────────────────────────────────────
/** @type {Map<string, CardComponent>} cardId → CardComponent */
const cards  = new Map();
let banner   = new BannerComponent();

// ── Local state ───────────────────────────────────────────────────────────────
let bannerVisible = false;
let customComp    = null;
let customId      = null;  // ElementId
let customWrapper = null;

// ════════════════════════════════════════════════════════════════════════════════
//  Logging
// ════════════════════════════════════════════════════════════════════════════════
function log(msg, type = 'info') {
  const out  = document.getElementById('log-output');
  const now  = new Date();
  const time = `${String(now.getMinutes()).padStart(2,'0')}:${String(now.getSeconds()).padStart(2,'0')}.${String(now.getMilliseconds()).padStart(3,'0')}`;
  const entry = document.createElement('div');
  entry.className = `log-entry log-${type}`;
  entry.innerHTML = `<span class="log-time">${time}</span><span class="log-msg">${msg}</span>`;
  out.appendChild(entry);
  out.scrollTop = out.scrollHeight;
}

// ════════════════════════════════════════════════════════════════════════════════
//  Registry status panel
// ════════════════════════════════════════════════════════════════════════════════
function refreshRegistry() {
  const count = elementManager.size;
  document.getElementById('reg-count').textContent = count;
  zone.classList.toggle('active', count > 0);
}

/**
 * Builds a Map<ManagedComponent, cssClass> so the tree can colour
 * nodes by component type regardless of their dynamic id prefix.
 */
function buildOwnerColorMap() {
  const map = new Map();
  for (const card of cards.values())    map.set(card,        'leaf-card');
  if (banner)                            map.set(banner,      'leaf-banner');
  if (customComp)                        map.set(customComp,  'leaf-custom');
  // Leak entries have no live reference — they will fall through to leaf-custom
  // in the tree (coloured yellow), which is fine for the audit demo.
  return map;
}

// ════════════════════════════════════════════════════════════════════════════════
//  CardComponent controls
// ════════════════════════════════════════════════════════════════════════════════
function spawnCard() {
  // Use a short UUID (first 8 chars) as the cardId namespace
  const cardId = crypto.randomUUID().slice(0, 8);
  const card   = new CardComponent(cardId);

  card.mount(zone, () => {
    // Invoked by the card's own close button after returnElement() calls
    cards.delete(cardId);
    log(`Card "${cardId}" closed → returnElement ×3  |  registry.size = ${elementManager.size}`, 'warn');
    refreshRegistry();
    refreshTree(treeContainer, buildOwnerColorMap());
  });

  cards.set(cardId, card);

  const owned = elementManager.listIdsForComponent(card).map(id => id.toString()).join(', ');
  log(`CardComponent("${cardId}").mount() → createElement ×3`, 'ok');
  log(`tracked: [${owned}]  |  cards alive: ${cards.size}  |  registry.size = ${elementManager.size}`, 'info');
  refreshRegistry();
  refreshTree(treeContainer, buildOwnerColorMap());
}

document.getElementById('btn-card-mount').addEventListener('click', () => {
  try {
    spawnCard();
  } catch (e) { log(e.message, 'error'); }
});

// ════════════════════════════════════════════════════════════════════════════════
//  BannerComponent controls
// ════════════════════════════════════════════════════════════════════════════════
document.getElementById('btn-banner-show').addEventListener('click', () => {
  if (bannerVisible) return;
  try {
    banner.show(zone);
    bannerVisible = true;
    const owned = elementManager.listIdsForComponent(banner).map(id => id.toString()).join(', ');
    log(`BannerComponent.show() → createElement(["site","banner"])`, 'ok');
    log(`tracked by manager for banner: [${owned}]  |  registry.size = ${elementManager.size}`, 'info');
    document.getElementById('btn-banner-show').disabled = true;
    document.getElementById('btn-banner-hide').disabled = false;
    refreshRegistry();
refreshTree(treeContainer, buildOwnerColorMap());
  } catch (e) { log(e.message, 'error'); }
});

document.getElementById('btn-banner-hide').addEventListener('click', () => {
  if (!bannerVisible) return;
  try {
    elementManager.destroyComponent(banner);
    bannerVisible = false;
    log('elementManager.destroyComponent(banner) → onDestroy() + removeAllElementsForComponent()', 'warn');
    log(`registry.size = ${elementManager.size}`, 'info');
    banner = new BannerComponent();
    document.getElementById('btn-banner-show').disabled = false;
    document.getElementById('btn-banner-hide').disabled = true;
    refreshRegistry();
refreshTree(treeContainer, buildOwnerColorMap());
  } catch (e) { log(e.message, 'error'); }
});

// ════════════════════════════════════════════════════════════════════════════════
//  Custom element controls
// ════════════════════════════════════════════════════════════════════════════════
document.getElementById('btn-custom-create').addEventListener('click', () => {
  const rawId  = document.getElementById('custom-id').value.trim();
  const tagVal = document.getElementById('custom-tag').value;
  if (!rawId) { log('Custom ID field is empty.', 'warn'); return; }

  // Parse slash-separated input into segments: "app/nav/item" → ['app','nav','item']
  const segments = rawId.split('/').map(s => s.trim()).filter(Boolean);

  try {
    customId = new ElementId(segments);

    customComp = new (class extends ManagedComponent {
      onDestroy() { customWrapper?.remove(); }
    })();

    const el = elementManager.createElement(customComp, customId, tagVal);

    customWrapper = document.createElement('div');
    customWrapper.className = 'managed-custom';
    const labelDiv = document.createElement('div');
    labelDiv.className = 'tag';
    labelDiv.textContent = `▸ Anonymous ManagedComponent  ·  ${customId}  ·  depth: ${customId.depth}  ·  tag: <${tagVal}>`;
    el.textContent = `<${tagVal} id="${customId.key}">`;
    customWrapper.append(labelDiv, el);
    zone.appendChild(customWrapper);

    log(`createElement(anonymousComp, ${customId}, "${tagVal}") ✓  segments: [${customId.segments.map(s=>`"${s}"`).join(', ')}]`, 'ok');
    log(`tracked by manager for customComp: [${elementManager.listIdsForComponent(customComp).map(id=>id.toString()).join(', ')}]  |  registry.size = ${elementManager.size}`, 'info');
    document.getElementById('btn-custom-create').disabled = true;
    document.getElementById('btn-custom-return').disabled = false;
    refreshRegistry();
refreshTree(treeContainer, buildOwnerColorMap());
  } catch (e) { log(`[${e.constructor.name}] ${e.message}`, 'error'); }
});

document.getElementById('btn-custom-return').addEventListener('click', () => {
  if (!customComp || !customId) return;
  try {
    elementManager.destroyComponent(customComp);
    log(`elementManager.destroyComponent(customComp) → onDestroy() + removeAllElementsForComponent() ✓`, 'warn');
    log(`registry.size = ${elementManager.size}`, 'info');
    customComp = customId = customWrapper = null;
    document.getElementById('btn-custom-create').disabled = false;
    document.getElementById('btn-custom-return').disabled = true;
    document.getElementById('custom-id').value = '';
    refreshRegistry();
refreshTree(treeContainer, buildOwnerColorMap());
  } catch (e) { log(`[${e.constructor.name}] ${e.message}`, 'error'); }
});

// ════════════════════════════════════════════════════════════════════════════════
//  Error scenario controls
// ════════════════════════════════════════════════════════════════════════════════
document.getElementById('btn-err-dupe').addEventListener('click', () => {
  const ids = elementManager.listIds();
  if (ids.length === 0) { log('Mount CardComponent or BannerComponent first.', 'warn'); return; }
  try {
    const fakeComp = new (class extends ManagedComponent { onDestroy() {} })();
    elementManager.createElement(fakeComp, ids[0], 'span');
  } catch (e) { log(`[${e.constructor.name}] ${e.message}`, 'error'); }
});

document.getElementById('btn-err-owner').addEventListener('click', () => {
  const ids = elementManager.listIds();
  if (ids.length === 0) { log('Mount an element first.', 'warn'); return; }
  try {
    const impostor = new (class extends ManagedComponent { onDestroy() {} })();
    elementManager.returnElement(impostor, ids[0]);
  } catch (e) { log(`[${e.constructor.name}] ${e.message}`, 'error'); }
});

document.getElementById('btn-err-missing').addEventListener('click', () => {
  try {
    const ghost  = new (class extends ManagedComponent { onDestroy() {} })();
    const ghostId = new ElementId(['ghost', 'element', 'xyz']);
    elementManager.returnElement(ghost, ghostId);
  } catch (e) { log(`[${e.constructor.name}] ${e.message}`, 'error'); }
});

document.getElementById('btn-err-plain-obj').addEventListener('click', () => {
  try {
    elementManager.createElement({}, new ElementId(['plain', 'obj']), 'div');
  } catch (e) { log(`[${e.constructor.name}] ${e.message}`, 'error'); }
});

// ════════════════════════════════════════════════════════════════════════════════
//  LeakyComponent controls
// ════════════════════════════════════════════════════════════════════════════════
let leakCount = 0;
const leakedIds = [];  // ElementId[]

document.getElementById('btn-leak-spawn').addEventListener('click', () => {
  leakCount++;
  // Each spawn creates a fresh instance — the instance is then discarded
  // without calling destroyComponent(), orphaning its registry entry.
  const leaky = new LeakyComponent();
  const { id } = leaky.spawn(leakCount);
  leakedIds.push(id);
  // leaky goes out of scope here — destroyComponent() never called

  const wrapper = document.createElement('div');
  wrapper.className = 'leaked-el';
  const tag = document.createElement('div');
  tag.className = 'tag';
  tag.textContent = `⚠ LeakyComponent  ·  destroyComponent() never called`;
  const p = document.createElement('p');
  p.textContent = `Leaked element #${leakCount}  ·  ${id}  ·  still in registry`;
  wrapper.append(tag, p);
  zone.appendChild(wrapper);

  log(`new LeakyComponent().spawn(${leakCount}) → createElement(${id}) — destroyComponent() never called`, 'error');
  log(`⚠ registry.size = ${elementManager.size}  — orphaned: [${leakedIds.map(i=>i.key).join(', ')}]`, 'warn');
  refreshRegistry();
  refreshTree(treeContainer, buildOwnerColorMap());
});

document.getElementById('btn-leak-reset').addEventListener('click', () => {
  if (leakedIds.length === 0) { log('No leaks to clear.', 'info'); return; }

  for (const id of leakedIds) {
    const impostor = new (class extends ManagedComponent { onDestroy() {} })();
    try {
      elementManager.returnElement(impostor, id);
    } catch (e) {
      log(`[Audit] "${id.key}" — original instance lost, cannot return. (${e.constructor.name})`, 'error');
    }
  }

  document.querySelectorAll('.leaked-el').forEach(el => el.remove());
  log(`Audit complete. ${leakedIds.length} entry/entries permanently stuck in registry.`, 'warn');
  leakedIds.length = 0;
  leakCount = 0;
  refreshRegistry();
refreshTree(treeContainer, buildOwnerColorMap());
});

// ════════════════════════════════════════════════════════════════════════════════
//  Misc
// ════════════════════════════════════════════════════════════════════════════════
document.getElementById('btn-log-clear').addEventListener('click', () => {
  document.getElementById('log-output').innerHTML = '';
});

// Update custom-id placeholder to explain slash-separated input
document.getElementById('custom-id').placeholder = 'e.g. app/nav/item';

log('ElementManager singleton initialised.  registry.size = 0', 'info');
log('Element IDs are now ElementId instances — e.g. new ElementId(["card","title"])', 'info');
refreshRegistry();
refreshTree(treeContainer, buildOwnerColorMap());
