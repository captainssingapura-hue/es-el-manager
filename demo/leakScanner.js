/**
 * leakScanner.js
 *
 * Detects leaked party branches by checking whether the owner registered with
 * each branch (via createBranch(name, owner)) is still reachable.
 *
 * A branch is considered leaked when:
 *   branch.isOwnerAlive === false
 *   → the owner object was registered but has since been garbage-collected,
 *     meaning the component went out of scope without calling branch.dissolve().
 *
 * Two modes:
 *   scanOnce(root)        — one-shot walk, returns leaked branches
 *   startLeakScanner(...) — periodic background scan with optional auto-dissolve
 */

/**
 * Recursively walks the party tree and collects all branches where
 * isOwnerAlive === false (owner has been garbage-collected).
 *
 * @param {import('../src/party/_DomOpsPartyBase.js')._DomOpsPartyBase} party
 * @param {Array} [acc]
 * @returns {import('../src/party/_DomOpsPartyBase.js')._DomOpsPartyBase[]}
 */
function collectLeaks(party, acc = []) {
  for (const name of party.listBranches()) {
    const branch = party.getBranch(name);
    if (branch.isOwnerAlive === false) {
      acc.push(branch);
    } else {
      // Only recurse into non-leaked branches; a leaked branch will be dissolved
      // entirely, so scanning its children is redundant.
      collectLeaks(branch, acc);
    }
  }
  return acc;
}

/**
 * Performs a single scan of the party tree and returns all leaked branches.
 * Does NOT dissolve anything — caller decides what to do.
 *
 * Note: detection depends on the JS engine having GC'd the owner. In practice,
 * run this after some time has passed or after forcing GC in a test environment.
 *
 * @param {import('../src/party/_DomOpsPartyBase.js')._DomOpsPartyBase} rootParty
 * @returns {import('../src/party/_DomOpsPartyBase.js')._DomOpsPartyBase[]}
 */
export function scanOnce(rootParty) {
  return collectLeaks(rootParty);
}

/**
 * Starts a periodic leak scan on the given party tree.
 *
 * @param {import('../src/party/_DomOpsPartyBase.js')._DomOpsPartyBase} rootParty
 * @param {object}   [opts]
 * @param {number}   [opts.intervalMs=5000]    - Milliseconds between scans.
 * @param {boolean}  [opts.autoDissolve=true]  - Dissolve leaked branches automatically.
 * @param {Function} [opts.onLeaksFound]       - Called with the array of leaked branches
 *                                               before auto-dissolve runs (if enabled).
 * @returns {{ stop: Function, scanNow: Function }}
 */
export function startLeakScanner(rootParty, {
  intervalMs   = 5000,
  autoDissolve = true,
  onLeaksFound = null,
} = {}) {
  function scan() {
    const leaks = collectLeaks(rootParty);
    if (leaks.length === 0) return;

    onLeaksFound?.(leaks);

    if (autoDissolve) {
      for (const branch of leaks) {
        branch.dissolve();
      }
    }
  }

  const timerId = setInterval(scan, intervalMs);

  return {
    /** Stop the periodic scan. */
    stop: () => clearInterval(timerId),

    /** Run a scan immediately, outside of the normal interval. */
    scanNow: scan,
  };
}
