import { describe, it, expect } from 'vitest';

describe('Network Graph Intelligence Suite', () => {
  // Test dataset simulating syndicate entities and relationships
  const mockNodes = [
    { id: 'ent-1', name: 'Vikram Malhotra @ Vicky', type: 'PERSON', riskLevel: 'CRITICAL', confidence: 0.99 },
    { id: 'ent-2', name: 'Siddharth Rao', type: 'PERSON', riskLevel: 'HIGH', confidence: 0.92 },
    { id: 'phone-1', name: '+91 98765 43210', type: 'PHONE', riskLevel: 'HIGH', confidence: 0.95 },
    { id: 'veh-1', name: 'TS 09 AB 1234 (Scorpio)', type: 'VEHICLE', riskLevel: 'HIGH', confidence: 0.98 },
    { id: 'bank-1', name: 'HDFC-XX-9482', type: 'BANK_ACCOUNT', riskLevel: 'CRITICAL', confidence: 0.94 },
    { id: 'orphan-1', name: 'Unconnected Suspect 1', type: 'PERSON', riskLevel: 'LOW', confidence: 0.5 },
    { id: 'orphan-2', name: 'Dormant Account 88', type: 'BANK_ACCOUNT', riskLevel: 'LOW', confidence: 0.5 },
  ];

  const mockEdges = [
    { id: 'e1', sourceEntityId: 'ent-1', targetEntityId: 'phone-1', type: 'OPERATES', confidenceScore: 0.95 },
    { id: 'e2', sourceEntityId: 'ent-1', targetEntityId: 'veh-1', type: 'USES_VEHICLE', confidenceScore: 0.98 },
    { id: 'e3', sourceEntityId: 'ent-1', targetEntityId: 'bank-1', type: 'CONTROLS_ACCOUNT', confidenceScore: 0.94 },
    { id: 'e4', sourceEntityId: 'ent-2', targetEntityId: 'bank-1', type: 'TRANSFERS_TO', confidenceScore: 0.91 },
  ];

  it('should correctly identify and filter connected vs orphan/disconnected nodes', () => {
    const connectedNodeIds = new Set<string>();
    mockEdges.forEach((e) => {
      connectedNodeIds.add(e.sourceEntityId);
      connectedNodeIds.add(e.targetEntityId);
    });

    const connectedNodes = mockNodes.filter((n) => connectedNodeIds.has(n.id));
    const orphanNodes = mockNodes.filter((n) => !connectedNodeIds.has(n.id));

    expect(connectedNodes.length).toBe(5);
    expect(orphanNodes.length).toBe(2);
    expect(orphanNodes.map((n) => n.id)).toEqual(['orphan-1', 'orphan-2']);
  });

  it('should enforce 3-state label visibility (none, nodes, all)', () => {
    const getLabelStyle = (mode: 'none' | 'nodes' | 'all', isNode: boolean) => {
      if (mode === 'none') return '';
      if (mode === 'nodes') return isNode ? 'data(label)' : '';
      return 'data(label)';
    };

    // Clean mode: labels must be empty for both nodes and edges
    expect(getLabelStyle('none', true)).toBe('');
    expect(getLabelStyle('none', false)).toBe('');

    // Nodes-only mode: nodes have labels, edges do not
    expect(getLabelStyle('nodes', true)).toBe('data(label)');
    expect(getLabelStyle('nodes', false)).toBe('');

    // All mode: both nodes and edges have labels
    expect(getLabelStyle('all', true)).toBe('data(label)');
    expect(getLabelStyle('all', false)).toBe('data(label)');
  });

  it('should calculate degree centrality and rank top kingpins accurately', () => {
    const degreeMap: Record<string, number> = {};
    mockNodes.forEach((n) => (degreeMap[n.id] = 0));
    mockEdges.forEach((e) => {
      degreeMap[e.sourceEntityId] = (degreeMap[e.sourceEntityId] || 0) + 1;
      degreeMap[e.targetEntityId] = (degreeMap[e.targetEntityId] || 0) + 1;
    });

    expect(degreeMap['ent-1']).toBe(3); // connected to phone-1, veh-1, bank-1
    expect(degreeMap['bank-1']).toBe(2); // connected to ent-1, ent-2
    expect(degreeMap['ent-2']).toBe(1); // connected to bank-1
    expect(degreeMap['orphan-1']).toBe(0); // disconnected
    expect(degreeMap['orphan-2']).toBe(0); // disconnected

    // Rank by degree
    const ranked = [...mockNodes].sort((a, b) => degreeMap[b.id] - degreeMap[a.id]);
    expect(ranked[0].id).toBe('ent-1');
    expect(ranked[0].name).toContain('Vikram Malhotra');
  });

  it('should filter entities correctly by multi-category selection', () => {
    const categoryFilters: Record<string, boolean> = {
      PERSON: true,
      PHONE: false,
      VEHICLE: true,
      BANK_ACCOUNT: false,
      ORGANIZATION: true,
      CRYPTO_WALLET: true,
      LOCATION: true,
    };

    const visibleNodes = mockNodes.filter((n) => categoryFilters[n.type] !== false);
    const visibleTypes = new Set(visibleNodes.map((n) => n.type));

    expect(visibleTypes.has('PERSON')).toBe(true);
    expect(visibleTypes.has('VEHICLE')).toBe(true);
    expect(visibleTypes.has('PHONE')).toBe(false);
    expect(visibleTypes.has('BANK_ACCOUNT')).toBe(false);
  });
});
