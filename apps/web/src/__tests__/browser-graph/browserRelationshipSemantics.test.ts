import {
  formatAssociationEdgeLabel,
  getAssociationEndpointLabels,
  formatAssociationMultiplicity,
  getAssociationBounds,
  getAssociationCardinality,
  getAssociationKind,
  hasAssociationDisplayMetadata,
  hasAssociationSemantics,
  isContainmentAssociation,
} from '../../browser-graph';

const relationship = {
  externalId: 'rel:1',
  kind: 'USES',
  sourceEntityId: 'entity:a',
  targetEntityId: 'entity:b',
  metadata: {
    associationKind: 'association',
    associationCardinality: 'many-to-one',
    sourceLowerBound: 0,
    sourceUpperBound: '*',
    targetLowerBound: 1,
    targetUpperBound: 1,
  },
} as any;

const containmentRelationship = {
  ...relationship,
  externalId: 'rel:containment',
  metadata: {
    associationKind: 'containment',
    associationCardinality: 'one-to-many',
    sourceLowerBound: 1,
    sourceUpperBound: 1,
    targetLowerBound: 0,
    targetUpperBound: '*',
  },
} as any;

describe('browserRelationshipSemantics', () => {
  test('reads normalized association metadata', () => {
    expect(getAssociationKind(relationship)).toBe('association');
    expect(getAssociationCardinality(relationship)).toBe('many-to-one');
    expect(getAssociationBounds(relationship)).toEqual({
      sourceLowerBound: '0',
      sourceUpperBound: '*',
      targetLowerBound: '1',
      targetUpperBound: '1',
    });
    expect(hasAssociationSemantics(relationship)).toBe(true);
    expect(hasAssociationDisplayMetadata(relationship)).toBe(true);
  });

  test('formats multiplicities', () => {
    expect(formatAssociationMultiplicity(1, 1)).toBe('1');
    expect(formatAssociationMultiplicity(0, 1)).toBe('0..1');
    expect(formatAssociationMultiplicity(0, '*')).toBe('0..*');
    expect(formatAssociationMultiplicity(1, '*')).toBe('1..*');
  });

  test('derives endpoint multiplicity labels from bounds', () => {
    expect(getAssociationEndpointLabels(relationship)).toEqual({ fromLabel: '0..*', toLabel: '1' });
  });

  test('formats association edge label from bounds', () => {
    expect(formatAssociationEdgeLabel(relationship)).toBe('0..* → 1');
  });

  test('treats containment associations as first-class display semantics', () => {
    expect(getAssociationKind(containmentRelationship)).toBe('containment');
    expect(isContainmentAssociation(containmentRelationship)).toBe(true);
    expect(hasAssociationSemantics(containmentRelationship)).toBe(true);
    expect(formatAssociationEdgeLabel(containmentRelationship)).toBe('containment');
  });
});
