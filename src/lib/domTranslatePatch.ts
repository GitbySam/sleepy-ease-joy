/**
 * Fix React crash when browser translation (Google Translate, Safari Translate,
 * Chrome auto-translate) mutates DOM text nodes that React later tries to
 * remove. Causes: "NotFoundError: Failed to execute 'removeChild' / 'insertBefore'
 * on 'Node': The node ... is not a child of this node."
 *
 * Reference: facebook/react#11538 — official Chrome team workaround.
 * Applied once at app bootstrap; safe no-op on SSR.
 */
export function applyDomTranslatePatch() {
  if (typeof Node === 'undefined') return;
  // Guard against double-patching (HMR)
  const proto = Node.prototype as unknown as { __sleepzyPatched?: boolean };
  if (proto.__sleepzyPatched) return;
  proto.__sleepzyPatched = true;

  const originalRemoveChild = Node.prototype.removeChild;
  Node.prototype.removeChild = function <T extends Node>(child: T): T {
    if (child.parentNode !== this) {
      if (typeof console !== 'undefined' && console.warn) {
        console.warn('[dom-patch] removeChild: node is no longer a child (likely browser translation).');
      }
      return child;
    }
    // eslint-disable-next-line prefer-rest-params
    return originalRemoveChild.apply(this, arguments as never) as T;
  } as typeof Node.prototype.removeChild;

  const originalInsertBefore = Node.prototype.insertBefore;
  Node.prototype.insertBefore = function <T extends Node>(newNode: T, referenceNode: Node | null): T {
    if (referenceNode && referenceNode.parentNode !== this) {
      if (typeof console !== 'undefined' && console.warn) {
        console.warn('[dom-patch] insertBefore: reference node not a child (likely browser translation).');
      }
      return this.appendChild(newNode) as T;
    }
    // eslint-disable-next-line prefer-rest-params
    return originalInsertBefore.apply(this, arguments as never) as T;
  } as typeof Node.prototype.insertBefore;
}