import type { Dispatch, FormEvent, SetStateAction } from 'react';
import type {
  CustomizationOverview,
  OverlayKind,
  SnapshotComparison,
  SnapshotSummary,
} from '../appModel';

export type SelectOption = {
  value: string;
  label: string;
};

export type ComparisonPanelProps = {
  comparisonSnapshotId: string;
  setComparisonSnapshotId: Dispatch<SetStateAction<string>>;
  comparisonOptions: SelectOption[];
  snapshotComparison: SnapshotComparison | null;
};

export type CustomizationPanelProps = {
  customizationOverview: CustomizationOverview | null;
  selectedSnapshot: SnapshotSummary | null;
  selectedSearchEntityId: string | null;
  selectedSearchScopeId: string | null;
  selectedLayoutScopeId: string | null;
  overlayName: string;
  setOverlayName: Dispatch<SetStateAction<string>>;
  overlayKind: OverlayKind;
  setOverlayKind: Dispatch<SetStateAction<OverlayKind>>;
  overlayNote: string;
  setOverlayNote: Dispatch<SetStateAction<string>>;
  handleCreateOverlay: (event: FormEvent<HTMLFormElement>) => void | Promise<void>;
  selectedOverlayId: string | null;
  setSelectedOverlayId: Dispatch<SetStateAction<string | null>>;
  handleDeleteOverlay: (overlayId: string) => void | Promise<void>;
  savedViewName: string;
  setSavedViewName: Dispatch<SetStateAction<string>>;
  handleSaveCurrentView: (event: FormEvent<HTMLFormElement>) => void | Promise<void>;
  selectedSavedViewId: string | null;
  handleApplySavedView: (savedViewId: string) => void | Promise<void>;
  handleDuplicateSavedView: (savedViewId: string) => void | Promise<void>;
  handleDeleteSavedView: (savedViewId: string) => void | Promise<void>;
};
