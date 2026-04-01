import type React from 'react';

export function closeOpenMenus(root: ParentNode | null) {
  if (!root) {
    return;
  }
  root.querySelectorAll('details[open]').forEach((element) => {
    if (element instanceof HTMLDetailsElement) {
      element.open = false;
    }
  });
}

export function handleMenuSummaryClick(event: React.MouseEvent<HTMLElement>, enabled: boolean) {
  if (enabled) {
    return;
  }
  event.preventDefault();
  event.stopPropagation();
}

export function closeContainingMenus(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) {
    return;
  }
  let current: HTMLElement | null = target;
  while (current) {
    const detailsElement: Element | null = current.closest('details');
    if (!(detailsElement instanceof HTMLDetailsElement)) {
      break;
    }
    detailsElement.open = false;
    current = detailsElement.parentElement;
  }
}

export function runMenuAction(event: React.MouseEvent<HTMLButtonElement>, action: () => void) {
  action();
  closeContainingMenus(event.currentTarget);
}

export function BrowserGraphWorkspaceMenu({
  label,
  enabled,
  children,
  inline = false,
}: {
  label: string;
  enabled: boolean;
  children: React.ReactNode;
  inline?: boolean;
}) {
  return (
    <details className={[ 'browser-canvas__menu', inline ? 'browser-canvas__menu--inline' : '' ].filter(Boolean).join(' ')}>
      <summary
        className={['button-secondary', 'browser-canvas__menu-summary', !enabled ? 'browser-canvas__menu-summary--disabled' : ''].filter(Boolean).join(' ')}
        aria-disabled={!enabled}
        onClick={(event) => handleMenuSummaryClick(event, enabled)}
      >{label}</summary>
      <div className="browser-canvas__menu-list card">{children}</div>
    </details>
  );
}
