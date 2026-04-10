import type { BrowserNavigationChildNode } from './browserNavigationTree.shared';

export function getNavigationNodeKindLabel(node: BrowserNavigationChildNode) {
  if (node.nodeType === 'scope') {
    switch (node.kind) {
      case 'REPOSITORY':
        return 'Repo';
      case 'DIRECTORY':
        return 'Dir';
      case 'FILE':
        return 'File';
      case 'PACKAGE':
        return 'Pkg';
      case 'MODULE':
        return 'Mod';
      default:
        return 'Scope';
    }
  }
  switch (node.kind) {
    case 'CLASS':
      return 'Cls';
    case 'INTERFACE':
      return 'Ifc';
    case 'ENUM':
      return 'Enum';
    case 'SERVICE':
      return 'Svc';
    case 'REPOSITORY':
      return 'Repo';
    case 'ENDPOINT':
      return 'API';
    case 'COMPONENT':
      return 'UI';
    case 'HOOK':
      return 'Hook';
    case 'FUNCTION':
      return 'Fn';
    case 'MODULE':
      return 'Mod';
    default:
      return 'Ent';
  }
}
