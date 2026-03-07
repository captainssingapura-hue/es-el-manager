/**
 * registryTree.js
 *
 * Builds and renders a live tree view of the ElementManager registry.
 * The tree mirrors the segment hierarchy of each ElementId.
 *
 * Accepts an optional ownerColorMap (Map<ManagedComponent, string>) so the
 * caller can assign CSS colour classes per component instance — necessary
 * when root segments are dynamic (e.g. UUID-prefixed card ids).
 */

import { elementManager } from './elementManager.js';

// ── Internal tree node ────────────────────────────────────────────────────────

class TreeNode {
  segment;
  children = new Map();
  leaf = null;   // { id: ElementId, tagName: string, colorClass: string }

  constructor(segment) { this.segment = segment; }
}

// ── Build tree from registry ──────────────────────────────────────────────────

function buildTree(ownerColorMap) {
  const root = new TreeNode('__root__');

  for (const id of elementManager.listIds()) {
    let node = root;
    for (const seg of id.segments) {
      if (!node.children.has(seg)) node.children.set(seg, new TreeNode(seg));
      node = node.children.get(seg);
    }

    const el    = elementManager.getElement(id);
    const record = elementManager.getRecord?.(id);  // optional — if exposed
    // Resolve colour by asking the manager for the owner of this id
    const owner      = elementManager.getOwner(id);
    const colorClass = ownerColorMap?.get(owner) ?? (owner ? 'leaf-leak' : 'leaf-custom');

    node.leaf = {
      id,
      tagName: el?.tagName?.toLowerCase() ?? '?',
      colorClass,
    };
  }

  return root;
}

// ── Render ────────────────────────────────────────────────────────────────────

function renderNode(node, isRoot = false) {
  const ul = document.createElement('ul');
  ul.className = isRoot ? 'tree-root' : 'tree-children';

  for (const child of node.children.values()) {
    const li  = document.createElement('li');
    li.className = 'tree-node';

    const row = document.createElement('div');
    row.className = 'tree-row';

    const hasChildren = child.children.size > 0;

    const icon = document.createElement('span');
    icon.className   = 'tree-icon';
    icon.textContent = hasChildren ? '▾' : '○';

    const label = document.createElement('span');
    label.className   = 'tree-segment';
    label.textContent = child.segment;

    row.append(icon, label);

    if (child.leaf) {
      row.classList.add('tree-row--leaf', child.leaf.colorClass);

      const tag = document.createElement('span');
      tag.className   = 'tree-tag';
      tag.textContent = `<${child.leaf.tagName}>`;

      const key = document.createElement('span');
      key.className   = 'tree-key';
      key.textContent = child.leaf.id.key;

      row.append(tag, key);
    }

    li.appendChild(row);
    if (hasChildren) li.appendChild(renderNode(child));
    ul.appendChild(li);
  }

  return ul;
}

// ── Public ────────────────────────────────────────────────────────────────────

/**
 * Re-renders the registry tree into the given container.
 *
 * @param {HTMLElement}                    container
 * @param {Map<ManagedComponent, string>} [ownerColorMap] - Maps owner instances to CSS class names.
 */
export function refreshTree(container, ownerColorMap) {
  container.innerHTML = '';

  if (elementManager.size === 0) {
    const empty = document.createElement('div');
    empty.className   = 'tree-empty';
    empty.textContent = 'No elements registered';
    container.appendChild(empty);
    return;
  }

  container.appendChild(renderNode(buildTree(ownerColorMap), true));
}
