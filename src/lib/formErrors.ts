/** After a failed submit, bring the first highlighted field into view and focus it. */
export function revealFirstInvalid(root: ParentNode = document) {
  window.requestAnimationFrame(() => {
    const first = root.querySelector<HTMLElement>('[data-invalid="true"]');
    if (!first) return;
    first.scrollIntoView({ behavior: 'smooth', block: 'center' });
    const target = first.querySelector<HTMLElement>('input:not([type=hidden]):not([type=file]), select, textarea, button');
    window.setTimeout(() => target?.focus({ preventScroll: true }), 350);
  });
}

export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
