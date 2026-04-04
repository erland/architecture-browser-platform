import type { BrowserProjectionEdge, BrowserProjectionNode } from '../../browser-projection';
import type { BrowserWorkspaceNodeModel } from './browserGraphWorkspaceModel';

export function buildProjectionNodeIdToWorkspaceNodeId(nodes: BrowserProjectionNode[]): Map<string, string> {
  return new Map(nodes.map((node) => [node.id, node.source.id] as const));
}

export function normalizeProjectionEdgesForWorkspace(
  projectionNodes: BrowserProjectionNode[],
  edges: BrowserProjectionEdge[],
): BrowserProjectionEdge[] {
  const projectionNodeIdToWorkspaceNodeId = buildProjectionNodeIdToWorkspaceNodeId(projectionNodes);
  return edges.map((edge) => ({
    ...edge,
    fromNodeId: projectionNodeIdToWorkspaceNodeId.get(edge.fromNodeId) ?? edge.fromEntityId,
    toNodeId: projectionNodeIdToWorkspaceNodeId.get(edge.toNodeId) ?? edge.toEntityId,
  }));
}

export function buildWorkspaceNodes(projectionNodes: BrowserProjectionNode[]): BrowserWorkspaceNodeModel[] {
  return projectionNodes.map((node) => ({
    id: node.source.id,
    kind: node.kind,
    badgeLabel: node.badgeLabel,
    title: node.title,
    subtitle: node.subtitle,
    x: node.x,
    y: node.y,
    width: node.width,
    height: node.height,
    pinned: node.pinned,
    selected: node.selected,
    focused: node.focused,
    memberEntityIds: node.memberEntityIds,
    compartments: node.compartments,
    classPresentationMode: node.classPresentationMode,
    classVisibleCompartmentKinds: node.classVisibleCompartmentKinds,
    isExpandedClassMember: node.isExpandedClassMember,
    parentClassEntityId: node.parentClassEntityId,
    memberKind: node.memberKind,
  }));
}

export function compareWorkspaceNodes(left: BrowserWorkspaceNodeModel, right: BrowserWorkspaceNodeModel) {
  return left.kind.localeCompare(right.kind) || left.id.localeCompare(right.id);
}
