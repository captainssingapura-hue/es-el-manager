/**
 * partyTree.js
 *
 * Renders a live DomOpsParty hierarchy as a DOM tree.
 * Each node shows its name, depth badge, owned element chips (name + tagName),
 * and recursively rendered child branches.
 *
 * Works with any node sharing the _DomOpsPartyBase public API —
 * no party type imports needed.
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
  icon.className   = 'party-icon';
  icon.textContent = party.branchCount > 0 ? '▾' : '○';

  const nameEl = document.createElement('span');
  nameEl.className   = 'party-name';
  nameEl.textContent = party.name;

  const depthBadge = document.createElement('span');
  depthBadge.className   = 'party-depth-badge';
  depthBadge.textContent = `L${party.depth}`;

  header.append(icon, nameEl, depthBadge);

  if (party.elementCount > 0) {
    const elBadge = document.createElement('span');
    elBadge.className   = 'party-badge';
    elBadge.textContent = `${party.elementCount} el`;
    header.appendChild(elBadge);
  }

  if (party.branchCount > 0) {
    const branchBadge = document.createElement('span');
    branchBadge.className   = 'party-badge party-badge--branch';
    branchBadge.textContent = `${party.branchCount} branch${party.branchCount !== 1 ? 'es' : ''}`;
    header.appendChild(branchBadge);
  }

  wrapper.appendChild(header);

  // ── Owned element chips ──────────────────────────────────────────────────────
  const elements = party.listElements();
  if (elements.length > 0) {
    const elList = document.createElement('ul');
    elList.className = 'party-elements-list';
    for (const { name, tagName } of elements) {
      const chip = document.createElement('li');
      chip.className   = 'party-element-chip';
      chip.textContent = `${name}  <${tagName}>`;
      elList.appendChild(chip);
    }
    wrapper.appendChild(elList);
  }

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
 * @param {HTMLElement}    container
 * @param {_DomOpsPartyBase} party   - Root party node.
 */
export function refreshPartyTree(container, party) {
  container.innerHTML = '';
  container.appendChild(renderNode(party));
}
