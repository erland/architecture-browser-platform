import type { Dispatch, FormEvent, SetStateAction } from "react";
import type { DependencyEntityOption } from "../dependencyViewModel";
import type { EntryPointItemOption } from "../entryPointViewModel";
import type { SearchResultOption } from "../searchViewModel";
import type {
  CustomizationOverview,
  DependencyDirection,
  DependencyView,
  EntityDetail,
  EntryCategory,
  EntryPointView,
  LayoutNode,
  LayoutScopeDetail,
  LayoutTree,
  OverlayKind,
  SearchView,
  SnapshotComparison,
  SnapshotOverview,
  SnapshotSummary,
  Workspace,
} from "../appModel";

export type Setter<T> = Dispatch<SetStateAction<T>>;
export type ComparisonOption = { value: string; label: string };

export type SnapshotCatalogSectionProps = {
  snapshots: SnapshotSummary[];
  selectedWorkspace: Workspace | null;
  selectedSnapshotId: string | null;
  setSelectedSnapshotId: Setter<string | null>;
  selectedSnapshot: SnapshotSummary | null;
  snapshotOverview: SnapshotOverview | null;
  flattenedLayoutNodes: LayoutNode[];
  selectedLayoutScopeId: string | null;
  setSelectedLayoutScopeId: Setter<string | null>;
  layoutTree: LayoutTree | null;
  layoutScopeDetail: LayoutScopeDetail | null;
  selectedDependencyScopeId: string;
  setSelectedDependencyScopeId: Setter<string>;
  dependencyDirection: DependencyDirection;
  setDependencyDirection: Setter<DependencyDirection>;
  dependencyView: DependencyView | null;
  dependencyEntityOptions: DependencyEntityOption[];
  focusedDependencyEntityId: string;
  setFocusedDependencyEntityId: Setter<string>;
  selectedEntryPointScopeId: string;
  setSelectedEntryPointScopeId: Setter<string>;
  entryCategory: EntryCategory;
  setEntryCategory: Setter<EntryCategory>;
  entryPointView: EntryPointView | null;
  entryPointOptions: EntryPointItemOption[];
  focusedEntryPointId: string;
  setFocusedEntryPointId: Setter<string>;
  selectedSearchScopeId: string;
  setSelectedSearchScopeId: Setter<string>;
  searchQuery: string;
  setSearchQuery: Setter<string>;
  searchView: SearchView | null;
  searchResultOptions: SearchResultOption[];
  selectedSearchEntityId: string;
  setSelectedSearchEntityId: Setter<string>;
  entityDetail: EntityDetail | null;
  customizationOverview: CustomizationOverview | null;
  overlayName: string;
  setOverlayName: Setter<string>;
  overlayKind: OverlayKind;
  setOverlayKind: Setter<OverlayKind>;
  overlayNote: string;
  setOverlayNote: Setter<string>;
  handleCreateOverlay: (event: FormEvent<HTMLFormElement>) => Promise<void>;
  selectedOverlayId: string;
  setSelectedOverlayId: Setter<string>;
  handleDeleteOverlay: (overlayId: string) => Promise<void>;
  savedViewName: string;
  setSavedViewName: Setter<string>;
  handleSaveCurrentView: (event: FormEvent<HTMLFormElement>) => Promise<void>;
  selectedSavedViewId: string;
  handleApplySavedView: (savedViewId: string) => Promise<void>;
  handleDuplicateSavedView: (savedViewId: string) => Promise<void>;
  handleDeleteSavedView: (savedViewId: string) => Promise<void>;
  comparisonSnapshotId: string;
  setComparisonSnapshotId: Setter<string>;
  comparisonOptions: ComparisonOption[];
  snapshotComparison: SnapshotComparison | null;
};

export type SnapshotOverviewPanelProps = {
  selectedSnapshot: SnapshotSummary;
  snapshotOverview: SnapshotOverview;
};

export type LayoutExplorerPanelProps = {
  flattenedLayoutNodes: LayoutNode[];
  selectedLayoutScopeId: string | null;
  setSelectedLayoutScopeId: Setter<string | null>;
  layoutTree: LayoutTree | null;
  layoutScopeDetail: LayoutScopeDetail | null;
};

export type DependencyPanelProps = {
  flattenedLayoutNodes: LayoutNode[];
  selectedDependencyScopeId: string;
  setSelectedDependencyScopeId: Setter<string>;
  dependencyDirection: DependencyDirection;
  setDependencyDirection: Setter<DependencyDirection>;
  dependencyView: DependencyView | null;
  dependencyEntityOptions: DependencyEntityOption[];
  focusedDependencyEntityId: string;
  setFocusedDependencyEntityId: Setter<string>;
};

export type EntryPointPanelProps = {
  flattenedLayoutNodes: LayoutNode[];
  selectedEntryPointScopeId: string;
  setSelectedEntryPointScopeId: Setter<string>;
  entryCategory: EntryCategory;
  setEntryCategory: Setter<EntryCategory>;
  entryPointView: EntryPointView | null;
  entryPointOptions: EntryPointItemOption[];
  focusedEntryPointId: string;
  setFocusedEntryPointId: Setter<string>;
};

export type SearchDetailPanelProps = {
  flattenedLayoutNodes: LayoutNode[];
  selectedSearchScopeId: string;
  setSelectedSearchScopeId: Setter<string>;
  searchQuery: string;
  setSearchQuery: Setter<string>;
  searchView: SearchView | null;
  searchResultOptions: SearchResultOption[];
  selectedSearchEntityId: string;
  setSelectedSearchEntityId: Setter<string>;
  entityDetail: EntityDetail | null;
};

export type CustomizationPanelProps = {
  customizationOverview: CustomizationOverview | null;
  selectedSnapshot: SnapshotSummary | null;
  selectedSearchEntityId: string;
  selectedSearchScopeId: string;
  selectedLayoutScopeId: string | null;
  overlayName: string;
  setOverlayName: Setter<string>;
  overlayKind: OverlayKind;
  setOverlayKind: Setter<OverlayKind>;
  overlayNote: string;
  setOverlayNote: Setter<string>;
  handleCreateOverlay: (event: FormEvent<HTMLFormElement>) => Promise<void>;
  selectedOverlayId: string;
  setSelectedOverlayId: Setter<string>;
  handleDeleteOverlay: (overlayId: string) => Promise<void>;
  savedViewName: string;
  setSavedViewName: Setter<string>;
  handleSaveCurrentView: (event: FormEvent<HTMLFormElement>) => Promise<void>;
  selectedSavedViewId: string;
  handleApplySavedView: (savedViewId: string) => Promise<void>;
  handleDuplicateSavedView: (savedViewId: string) => Promise<void>;
  handleDeleteSavedView: (savedViewId: string) => Promise<void>;
};

export type ComparisonPanelProps = {
  comparisonSnapshotId: string;
  setComparisonSnapshotId: Setter<string>;
  comparisonOptions: ComparisonOption[];
  snapshotComparison: SnapshotComparison | null;
};
