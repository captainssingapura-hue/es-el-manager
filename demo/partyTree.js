/**
 * partyTree.js
 *
 * Renders a live DomOpsParty hierarchy as a DOM tree.
 * Works with any node that shares the _DomOpsPartyBase public API —
 * no type imports needed.
 */

// ── Internal renderer ─────────────────────────────────────────────────────────

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
    const li = document.createElement('li');
    const isSecretary = mc === party.secretary;
    li.className = isSecretary ? 'party-member party-member--secretary' : 'party-member';

    if (isSecretary) {
      li.innerHTML = '<span class="party-secretary-star">★</span> secretary';
    } else {
      // Best-effort label from the wrapped component
      const comp   = mc.component;
      const label  = comp?.label ?? comp?.name ?? comp?.constructor?.name ?? 'anonymous';
      li.innerHTML = `<span class="party-dot">·</span> ${label}`;
    }

    membersList.appendChild(li);
  }

  wrapper.appendChild(membersList);

  // ── Child branches (recursive) ───────────────────────────────────────────────
  if (party.branchCount > 0) {
    const branchesEl = document.createElement('div');
    branchesEl.className = 'party-branches';

    for (const branchName of party.listBranches()) {
      const child = party.getBranch(branchName);
      branchesEl.appendChild(renderNode(child));
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
