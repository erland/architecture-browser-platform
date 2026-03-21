import type { FullSnapshotRelationship } from './appModel';

export type BrowserAssociationKind = 'association';
export type BrowserAssociationCardinality = 'one-to-one' | 'one-to-many' | 'many-to-one' | 'many-to-many';
export type BrowserAssociationBounds = {
  sourceLowerBound?: string;
  sourceUpperBound?: string;
  targetLowerBound?: string;
  targetUpperBound?: string;
};

type MultiplicityBound = string | number | undefined;

function getMetadataRecord(relationship: FullSnapshotRelationship): Record<string, unknown> {
  const metadata = (relationship.metadata ?? {}) as Record<string, unknown>;
  const nested = metadata.metadata;
  if (nested && typeof nested === 'object' && !Array.isArray(nested)) {
    return { ...nested as Record<string, unknown>, ...metadata };
  }
  return metadata;
}

function readString(record: Record<string, unknown>, key: string): string | undefined {
  const value = record[key];
  if (typeof value === 'string') {
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : undefined;
  }
  if (typeof value === 'number') {
    return String(value);
  }
  return undefined;
}

export function getAssociationKind(relationship: FullSnapshotRelationship): BrowserAssociationKind | undefined {
  const value = readString(getMetadataRecord(relationship), 'associationKind');
  return value === 'association' ? 'association' : undefined;
}

export function getAssociationCardinality(relationship: FullSnapshotRelationship): BrowserAssociationCardinality | undefined {
  const value = readString(getMetadataRecord(relationship), 'associationCardinality');
  return value === 'one-to-one' || value === 'one-to-many' || value === 'many-to-one' || value === 'many-to-many'
    ? value
    : undefined;
}

export function getAssociationBounds(relationship: FullSnapshotRelationship): BrowserAssociationBounds | undefined {
  const record = getMetadataRecord(relationship);
  const bounds: BrowserAssociationBounds = {
    sourceLowerBound: readString(record, 'sourceLowerBound'),
    sourceUpperBound: readString(record, 'sourceUpperBound'),
    targetLowerBound: readString(record, 'targetLowerBound'),
    targetUpperBound: readString(record, 'targetUpperBound'),
  };
  return bounds.sourceLowerBound || bounds.sourceUpperBound || bounds.targetLowerBound || bounds.targetUpperBound
    ? bounds
    : undefined;
}

export function formatAssociationMultiplicity(lower?: MultiplicityBound, upper?: MultiplicityBound): string | undefined {
  if (lower === undefined || upper === undefined) {
    return undefined;
  }
  const lowerText = String(lower).trim();
  const upperText = String(upper).trim();
  if (!lowerText || !upperText) {
    return undefined;
  }
  if (lowerText === upperText) {
    return lowerText;
  }
  return `${lowerText}..${upperText}`;
}

export function hasAssociationSemantics(relationship: FullSnapshotRelationship): boolean {
  return getAssociationKind(relationship) === 'association';
}

export function formatAssociationEdgeLabel(relationship: FullSnapshotRelationship): string | undefined {
  const bounds = getAssociationBounds(relationship);
  const fromBounds = formatAssociationMultiplicity(bounds?.sourceLowerBound, bounds?.sourceUpperBound);
  const toBounds = formatAssociationMultiplicity(bounds?.targetLowerBound, bounds?.targetUpperBound);
  if (fromBounds && toBounds) {
    return `${fromBounds} → ${toBounds}`;
  }
  if (toBounds) {
    return toBounds;
  }
  if (fromBounds) {
    return fromBounds;
  }
  return getAssociationCardinality(relationship);
}

export function hasAssociationDisplayMetadata(relationship: FullSnapshotRelationship): boolean {
  return Boolean(formatAssociationEdgeLabel(relationship));
}
