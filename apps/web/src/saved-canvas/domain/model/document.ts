import type { SnapshotSummary } from "../../../app-model/appModel.api";

export const SAVED_CANVAS_DOCUMENT_SCHEMA_VERSION = "saved-canvas/v1" as const;

export type SavedCanvasDocumentSchemaVersion = typeof SAVED_CANVAS_DOCUMENT_SCHEMA_VERSION;
export type SavedCanvasSyncState =
  | "SYNCHRONIZED"
  | "LOCAL_ONLY"
  | "LOCALLY_MODIFIED"
  | "PENDING_SYNC"
  | "CONFLICTED"
  | "DELETED_LOCALLY_PENDING_SYNC"
  | "UNRESOLVED"
  | "PARTIALLY_RESOLVED";

export type SavedCanvasBindingTargetType = "SCOPE" | "ENTITY" | "RELATIONSHIP";

export type SavedCanvasSnapshotRef = {
  snapshotId: string;
  snapshotKey: string;
  workspaceId: string;
  repositoryRegistrationId: string;
  repositoryKey: string | null;
  repositoryName: string | null;
  sourceBranch: string | null;
  sourceRevision: string | null;
  importedAt: string | null;
};

export type SavedCanvasFallbackReference = {
  kind?: string | null;
  name?: string | null;
  displayName?: string | null;
  scopeStableKey?: string | null;
  path?: string | null;
  relationshipKind?: string | null;
  fromStableKey?: string | null;
  toStableKey?: string | null;
  qualifiedName?: string | null;
  signature?: string | null;
  primarySourcePath?: string | null;
  stableCategory?: string | null;
  semanticFingerprint?: string | null;
  metadata?: Record<string, unknown>;
};

export type SavedCanvasItemReference = {
  targetType: SavedCanvasBindingTargetType;
  stableKey: string;
  originalSnapshotLocalId?: string | null;
  fallback?: SavedCanvasFallbackReference | null;
};

export type SavedCanvasNodePresentation = {
  pinned: boolean;
  hidden: boolean;
  collapsed: boolean;
  zIndex?: number | null;
  classPresentation?: {
    mode: 'simple' | 'compartments' | 'expanded';
    showFields: boolean;
    showFunctions: boolean;
  } | null;
};

export type SavedCanvasEdgePresentation = {
  hidden: boolean;
  label?: string | null;
  styleVariant?: string | null;
};

export type SavedCanvasNode = {
  canvasNodeId: string;
  reference: SavedCanvasItemReference;
  position: {
    x: number;
    y: number;
  };
  size?: {
    width: number;
    height: number;
  } | null;
  presentation: SavedCanvasNodePresentation;
  annotationIds: string[];
  metadata: Record<string, unknown>;
};

export type SavedCanvasEdge = {
  canvasEdgeId: string;
  reference: SavedCanvasItemReference;
  sourceCanvasNodeId: string | null;
  targetCanvasNodeId: string | null;
  presentation: SavedCanvasEdgePresentation;
  annotationIds: string[];
  metadata: Record<string, unknown>;
};

export type SavedCanvasAnnotation = {
  annotationId: string;
  kind: "TEXT_NOTE";
  text: string;
  anchor: {
    canvasNodeId?: string | null;
    canvasEdgeId?: string | null;
    x?: number | null;
    y?: number | null;
  };
  metadata: Record<string, unknown>;
};

export type SavedCanvasBindingState = {
  originSnapshot: SavedCanvasSnapshotRef;
  currentTargetSnapshot?: SavedCanvasSnapshotRef | null;
  rebinding?: {
    sourceSnapshotId: string;
    targetSnapshotId: string;
    rebindingState: "NOT_ATTEMPTED" | "EXACT" | "PARTIAL" | "UNRESOLVED";
    exactMatchCount: number;
    remappedCount: number;
    unresolvedCount: number;
    reviewedAt?: string | null;
  } | null;
};

export type SavedCanvasPresentationState = {
  viewport: {
    x: number;
    y: number;
    zoom: number;
  };
  activeViewpointId?: string | null;
  layoutMode?: string | null;
  filters: {
    hiddenNodeIds: string[];
    hiddenEdgeIds: string[];
  };
};

export type SavedCanvasSyncMetadata = {
  state: SavedCanvasSyncState;
  localVersion: number;
  backendVersion?: string | null;
  lastModifiedAt: string;
  lastSyncedAt?: string | null;
  lastSyncError?: string | null;
  conflict?: {
    detectedAt: string;
    backendVersion: string | null;
    message: string;
  } | null;
};

export type SavedCanvasDocument = {
  schemaVersion: SavedCanvasDocumentSchemaVersion;
  canvasId: string;
  name: string;
  content: {
    nodes: SavedCanvasNode[];
    edges: SavedCanvasEdge[];
    annotations: SavedCanvasAnnotation[];
  };
  bindings: SavedCanvasBindingState;
  presentation: SavedCanvasPresentationState;
  sync: SavedCanvasSyncMetadata;
  metadata: {
    createdAt: string;
    updatedAt: string;
  };
};

export type CreateSavedCanvasDocumentInput = {
  canvasId: string;
  name: string;
  originSnapshot: SavedCanvasSnapshotRef;
  nodes?: SavedCanvasNode[];
  edges?: SavedCanvasEdge[];
  annotations?: SavedCanvasAnnotation[];
  viewport?: SavedCanvasPresentationState["viewport"];
  activeViewpointId?: string | null;
  layoutMode?: string | null;
  hiddenNodeIds?: string[];
  hiddenEdgeIds?: string[];
  syncState?: SavedCanvasSyncState;
  localVersion?: number;
  backendVersion?: string | null;
  lastModifiedAt?: string;
  lastSyncedAt?: string | null;
  lastSyncError?: string | null;
  createdAt?: string;
  updatedAt?: string;
  rebinding?: SavedCanvasBindingState["rebinding"];
};

export function toSavedCanvasSnapshotRef(snapshot: SnapshotSummary): SavedCanvasSnapshotRef {
  return {
    snapshotId: snapshot.id,
    snapshotKey: snapshot.snapshotKey,
    workspaceId: snapshot.workspaceId,
    repositoryRegistrationId: snapshot.repositoryRegistrationId,
    repositoryKey: snapshot.repositoryKey,
    repositoryName: snapshot.repositoryName,
    sourceBranch: snapshot.sourceBranch,
    sourceRevision: snapshot.sourceRevision,
    importedAt: snapshot.importedAt,
  };
}

export function createSavedCanvasDocument(input: CreateSavedCanvasDocumentInput): SavedCanvasDocument {
  const now = input.lastModifiedAt ?? input.updatedAt ?? input.createdAt ?? new Date().toISOString();
  return {
    schemaVersion: SAVED_CANVAS_DOCUMENT_SCHEMA_VERSION,
    canvasId: input.canvasId,
    name: input.name.trim(),
    content: {
      nodes: [...(input.nodes ?? [])],
      edges: [...(input.edges ?? [])],
      annotations: [...(input.annotations ?? [])],
    },
    bindings: {
      originSnapshot: input.originSnapshot,
      currentTargetSnapshot: input.originSnapshot,
      rebinding: input.rebinding ?? null,
    },
    presentation: {
      viewport: input.viewport ?? { x: 0, y: 0, zoom: 1 },
      activeViewpointId: input.activeViewpointId ?? null,
      layoutMode: input.layoutMode ?? null,
      filters: {
        hiddenNodeIds: [...(input.hiddenNodeIds ?? [])],
        hiddenEdgeIds: [...(input.hiddenEdgeIds ?? [])],
      },
    },
    sync: {
      state: input.syncState ?? "LOCAL_ONLY",
      localVersion: input.localVersion ?? 1,
      backendVersion: input.backendVersion ?? null,
      lastModifiedAt: now,
      lastSyncedAt: input.lastSyncedAt ?? null,
      lastSyncError: input.lastSyncError ?? null,
      conflict: null,
    },
    metadata: {
      createdAt: input.createdAt ?? now,
      updatedAt: input.updatedAt ?? now,
    },
  };
}

export function parseSavedCanvasJson(json: string | null): SavedCanvasDocument | null {
  if (!json || !json.trim()) {
    return null;
  }
  try {
    const parsed = JSON.parse(json) as SavedCanvasDocument;
    if (parsed?.schemaVersion !== SAVED_CANVAS_DOCUMENT_SCHEMA_VERSION) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function createSavedCanvasItemReference(input: {
  targetType: SavedCanvasBindingTargetType;
  stableKey: string;
  originalSnapshotLocalId?: string | null;
  fallback?: SavedCanvasFallbackReference | null;
}): SavedCanvasItemReference {
  return {
    targetType: input.targetType,
    stableKey: input.stableKey.trim(),
    originalSnapshotLocalId: input.originalSnapshotLocalId ?? null,
    fallback: input.fallback ?? null,
  };
}
