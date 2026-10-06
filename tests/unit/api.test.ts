import { describe, it, expect } from 'vitest';
import { api } from '../../src/services/api';

describe('CRIMENEXUS API & Data Service Layer Unit Tests', () => {
  it('should fetch investigations and filter by status', async () => {
    const cases = await api.getInvestigations('', 'UNDER_INVESTIGATION');
    expect(cases.length).toBeGreaterThan(0);
    expect(cases[0].status).toBe('UNDER_INVESTIGATION');
  });

  it('should retrieve evidence by case ID', async () => {
    const evidence = await api.getCaseEvidence('case-101');
    expect(evidence.length).toBeGreaterThan(0);
    expect(evidence[0].caseId).toBe('case-101');
  });

  it('should generate network graph topology nodes and edges', async () => {
    const graph = await api.getNetworkGraph('case-101');
    expect(graph.nodes.length).toBeGreaterThan(0);
    expect(graph.edges.length).toBeGreaterThan(0);
  });

  it('should query AI assistant and return grounded findings with disclaimer', async () => {
    const finding = await api.queryAI('case-101', 'Explain the connections found in this case');
    expect(finding.finding).toContain('AI Network Synthesis');
    expect(finding.supportingEvidenceIds.length).toBeGreaterThan(0);
  });

  it('should confirm entity resolution merge and update audit log', async () => {
    const candidate = await api.confirmMergeEntities('res-1', 'Corroborated by CDR phone logs');
    expect(candidate.status).toBe('CONFIRMED');
    expect(candidate.notes).toContain('Corroborated');
  });

  it('should perform global search across cases and entities', async () => {
    const results = await api.globalSearch('Ramesh');
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].title).toContain('Ramesh');
  });
});
