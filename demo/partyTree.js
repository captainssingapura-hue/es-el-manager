/**
 * partyTree.js
 *
 * Renders a live DomOpsParty hierarchy as a DOM tree.
 * Works with any node that shares the _DomOpsPartyBase public API —
 * no party type imports needed.
 *
 * Each member row shows:
 *   ★ secretary  [id.key] [id.key] …   — permanent branch representative
 *   · ClassName  [id.key] …            — joined members, with owned registry
 *                                         keys making every row distinguishable
 */

import { elementManager } from '../src/elementManager.js';

// ── Internal renderer ─────────────────────────────────────────────────────────

/**
 * Builds one <li> for a single ManagedComponent member.
 *
 * @param {import('../src/ManagedComponent.js').ManagedComponent} mc
 * @param {boolean} isSecretary
 * @returns {HTMLLIElement}
 */
function renderMember(mc, isSecretary) {
  const li = document.createElement('li');
  li.className = isSecretary
    ? 'party-member party-member--secretary'
    : 'party-member';

  // ── Label ────────────────────────────────────────────────────────────────────
  if (isSecretary) {
    const star = document.createElement('span');
    star.className = 'party-secretary-star';
    star.textContent = '★';
    li.append(star, '\u00a0secretary');
  } else {
    const dot = document.createElement('span');
    dot.className = 'party-dot';
    dot.textContent = '·';
    const comp  = mc.component;
    const label = comp?.label ?? comp?.name ?? comp?.constructor?.name ?? 'anonymous';
    li.append(dot, '\u00a0', label);
  }

  // ── Owned element IDs ────────────────────────────────────────────────────────
  // Querying the live registry gives each member a unique fingerprint.
  // For LeakyComponents this is the distinguishing detail; for secretaries it
  // maps the party node directly to its registry keys.
  const ownedIds = elementManager.listIdsForComponent(mc);
  for (const id of ownedIds) {
    const chip = document.createElement('span');
    chip.className = 'party-member-id';
    chip.textContent = id.key;
    li.appendChild(chip);
  }

  return li;
}

/**
 * Recursively renders a single party node and its children.
 *
 * @param {import('../src/party/_DomOpsPartyBase.js')._DomOpsPartyBase} party
 * @returns {HTMLElement}
 */
function renderNode(party) {
  const wrapper = document.createElement('div');
  wrapper.className = 'party-node';

  // ── Node header ─────────────────────────────────────────────────────────────
  const header = document.createElement('div');
  header.className = 'party-node-header';

  const icon = document.createElement('span');
  icon.className = 'party-icon';
  icon.textContent = party.branchCount > 0 ? '▾' : '○';

  const nameEl = document.createElement('span');
  nameEl.className = 'party-name';
  nameEl.textContent = party.name;

  const depthBadge = document.createElement('span');
  depthBadge.className = 'party-depth-badge';
  depthBadge.textContent = `L${party.depth}`;

  const memberBadge = document.createElement('span');
  memberBadge.className = 'party-badge';
  memberBadge.textContent = `${party.memberCount} member${party.memberCount !== 1 ? 's' : ''}`;

  header.append(icon, nameEl, depthBadge, memberBadge);

  if (party.branchCount > 0) {
    const branchBadge = document.createElement('span');
    branchBadge.className = 'party-badge party-badge--branch';
    branchBadge.textContent = `${party.branchCount} branch${party.branchCount !== 1 ? 'es' : ''}`;
    header.appendChild(branchBadge);
  }

  wrapper.appendChild(header);

  // ── Members list ─────────────────────────────────────────────────────────────
  const membersList = document.createElement('ul');
  membersList.className = 'party-members-list';

  for (const mc of party.listMembers()) {
    membersList.appendChild(renderMember(mc, mc === party.secretary));
  }

  wrapper.appendChild(membersList);

  // ── Child branches (recursive) ───────────────────────────────────────────────
  if (party.branchCount > 0) {
    const branchesEl = document.createElement('div');
    branchesEl.className = 'party-branches';

    for (const branchName of party.listBranches()) {
      branchesEl.appendChild(renderNode(party.getBranch(branchName)));
    }

    wrapper.appendChild(branchesEl);
  }

  return wrapper;
}

// ── Public ────────────────────────────────────────────────────────────────────

/**
 * Re-renders the DomOpsParty hierarchy into the given container.
 *
 * @param {HTMLElement} container
 * @param {import('../src/party/_DomOpsPartyBase.js')._DomOpsPartyBase} party - Root party node.
 */
export function refreshPartyTree(container, party) {
  container.innerHTML = '';
  container.appendChild(renderNode(party));
}
