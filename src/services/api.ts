import {
  InvestigationCase,
  Evidence,
  Entity,
  Relationship,
  EntityResolutionCandidate,
  AIFinding,
  TimelineEvent,
  MapLocation,
  IntelligenceReport,
  AuditLog,
  GlobalSearchResult,
  User,
} from '../types';
import {
  MOCK_CASES,
  MOCK_EVIDENCE,
  MOCK_ENTITIES,
  MOCK_RELATIONSHIPS,
  MOCK_RESOLUTION_CANDIDATES,
  MOCK_AI_FINDINGS,
  MOCK_TIMELINE_EVENTS,
  MOCK_MAP_LOCATIONS,
  MOCK_REPORTS,
  MOCK_AUDIT_LOGS,
  MOCK_USERS,
} from './mockData';

const STORAGE_KEY = 'crimenexus_mock_store_v1';

// In-memory data store with LocalStorage persistence fallback
class MockDataStore {
  cases: InvestigationCase[] = [];
  entities: Entity[] = [];
  relationships: Relationship[] = [];
  evidence: Evidence[] = [];
  candidates: EntityResolutionCandidate[] = [];
  timelineEvents: TimelineEvent[] = [];
  mapLocations: MapLocation[] = [];
  aiFindings: AIFinding[] = [];
  reports: IntelligenceReport[] = [];
  auditLogs: AuditLog[] = [];
  users: User[] = [];

  constructor() {
    this.loadFromStorage();
  }

  loadFromStorage() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        this.cases = parsed.cases?.length ? parsed.cases : [...MOCK_CASES];
        this.entities = parsed.entities?.length ? parsed.entities : [...MOCK_ENTITIES];
        this.relationships = parsed.relationships?.length ? parsed.relationships : [...MOCK_RELATIONSHIPS];
        this.evidence = parsed.evidence?.length ? parsed.evidence : [...MOCK_EVIDENCE];
        this.candidates = parsed.candidates?.length ? parsed.candidates : [...MOCK_RESOLUTION_CANDIDATES];
        this.timelineEvents = parsed.timelineEvents?.length ? parsed.timelineEvents : [...MOCK_TIMELINE_EVENTS];
        this.mapLocations = parsed.mapLocations?.length ? parsed.mapLocations : [...MOCK_MAP_LOCATIONS];
        this.aiFindings = parsed.aiFindings?.length ? parsed.aiFindings : [...MOCK_AI_FINDINGS];
        this.reports = parsed.reports?.length ? parsed.reports : [...MOCK_REPORTS];
        this.auditLogs = parsed.auditLogs?.length ? parsed.auditLogs : [...MOCK_AUDIT_LOGS];
        this.users = parsed.users?.length ? parsed.users : [...MOCK_USERS];
        return;
      }
    } catch {
      // Fallback on error
    }
    this.cases = [...MOCK_CASES];
    this.entities = [...MOCK_ENTITIES];
    this.relationships = [...MOCK_RELATIONSHIPS];
    this.evidence = [...MOCK_EVIDENCE];
    this.candidates = [...MOCK_RESOLUTION_CANDIDATES];
    this.timelineEvents = [...MOCK_TIMELINE_EVENTS];
    this.mapLocations = [...MOCK_MAP_LOCATIONS];
    this.aiFindings = [...MOCK_AI_FINDINGS];
    this.reports = [...MOCK_REPORTS];
    this.auditLogs = [...MOCK_AUDIT_LOGS];
    this.users = [...MOCK_USERS];
  }

  saveToStorage() {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          cases: this.cases,
          entities: this.entities,
          relationships: this.relationships,
          evidence: this.evidence,
          candidates: this.candidates,
          timelineEvents: this.timelineEvents,
          mapLocations: this.mapLocations,
          aiFindings: this.aiFindings,
          reports: this.reports,
          auditLogs: this.auditLogs,
          users: this.users,
        })
      );
    } catch {
      // Ignore storage quota limits gracefully
    }
  }
}

const store = new MockDataStore();

// Helper to simulate network latency
const delay = (ms = 120) => new Promise((res) => setTimeout(res, ms));

export const api = {
  // Authentication
  async getCurrentUser(userId = 'usr-1'): Promise<User> {
    await delay();
    return store.users.find((u) => u.id === userId) || store.users[0];
  },

  async login(role = 'INVESTIGATOR'): Promise<User> {
    await delay();
    const user = store.users.find((u) => u.role === role) || store.users[0];
    await this.addAuditLog({
      userId: user.id,
      userName: user.name,
      userRole: user.role,
      action: 'LOGIN',
      target: 'System Authentication Portal',
      ipAddress: '127.0.0.1 (Local Session)',
    });
    return user;
  },

  // Investigations
  async getInvestigations(query?: string, status?: string): Promise<InvestigationCase[]> {
    await delay();
    let result = [...store.cases];
    if (query) {
      const q = query.toLowerCase();
      result = result.filter(
        (c) =>
          c.title.toLowerCase().includes(q) ||
          c.caseNumber.toLowerCase().includes(q) ||
          c.description.toLowerCase().includes(q) ||
          c.tags.some((t) => t.toLowerCase().includes(q))
      );
    }
    if (status && status !== 'ALL') {
      result = result.filter((c) => c.status === status);
    }
    return result;
  },

  async getInvestigationById(id: string): Promise<InvestigationCase | null> {
    await delay();
    return store.cases.find((c) => c.id === id) || null;
  },

  async createInvestigation(data: Partial<InvestigationCase>): Promise<InvestigationCase> {
    await delay();
    const newCase: InvestigationCase = {
      id: `case-${Date.now()}`,
      caseNumber: `CASE-2026-${Math.floor(1000 + Math.random() * 9000)}`,
      title: data.title || 'Untitled Investigation',
      description: data.description || '',
      status: data.status || 'OPEN',
      priority: data.priority || 'MEDIUM',
      crimeType: data.crimeType || 'General Investigation',
      assignedTo: data.assignedTo || 'usr-1',
      assignedUserName: 'Inspector Rajesh Varma',
      locationName: data.locationName || 'Bengaluru',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      tags: data.tags || ['New Case'],
      entityCount: 0,
      evidenceCount: 0,
      relationshipCount: 0,
    };
    store.cases.unshift(newCase);
    store.saveToStorage();

    await this.addAuditLog({
      userId: 'usr-1',
      userName: 'Inspector Rajesh Varma',
      userRole: 'INVESTIGATOR',
      action: 'CASE_VIEWED',
      target: `Created Case ${newCase.caseNumber}: ${newCase.title}`,
      caseId: newCase.id,
      ipAddress: '127.0.0.1',
    });

    return newCase;
  },

  // Evidence
  async getCaseEvidence(caseId: string, typeFilter?: string): Promise<Evidence[]> {
    await delay();
    let result = store.evidence.filter((e) => e.caseId === caseId || caseId === 'ALL');
    if (typeFilter && typeFilter !== 'ALL') {
      result = result.filter((e) => e.type === typeFilter);
    }
    return result;
  },

  async getEvidenceById(id: string): Promise<Evidence | null> {
    await delay();
    return store.evidence.find((e) => e.id === id) || null;
  },

  async uploadEvidence(data: Partial<Evidence>): Promise<Evidence> {
    await delay();
    const newEvd: Evidence = {
      id: `ev-${Date.now()}`,
      evidenceNumber: `EVD-2026-${Math.floor(1000 + Math.random() * 9000)}`,
      caseId: data.caseId || 'case-101',
      title: data.title || 'Uploaded Artifact',
      type: data.type || 'DOCUMENT',
      source: data.source || 'Investigator Upload',
      sourceReference: data.sourceReference || 'REF-LOCAL-01',
      timestamp: new Date().toISOString(),
      uploadedBy: 'Inspector Rajesh Varma',
      hash: '9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08',
      processingStatus: 'PROCESSED',
      linkedEntityIds: data.linkedEntityIds || [],
      metadata: data.metadata || { size: '1.2 MB' },
      description: data.description || 'Uploaded investigation document.',
    };
    store.evidence.unshift(newEvd);

    // Increment count on case
    const targetCase = store.cases.find((c) => c.id === newEvd.caseId);
    if (targetCase) {
      targetCase.evidenceCount += 1;
    }

    store.saveToStorage();

    await this.addAuditLog({
      userId: 'usr-1',
      userName: 'Inspector Rajesh Varma',
      userRole: 'INVESTIGATOR',
      action: 'EVIDENCE_PROCESSED',
      target: `Uploaded Evidence ${newEvd.evidenceNumber} (${newEvd.title})`,
      caseId: newEvd.caseId,
      ipAddress: '127.0.0.1',
    });

    return newEvd;
  },

  async processEvidence(id: string): Promise<Evidence> {
    await delay();
    const item = store.evidence.find((e) => e.id === id);
    if (item) {
      item.processingStatus = 'PROCESSED';
      store.saveToStorage();
    }
    return item || store.evidence[0];
  },

  // Entities
  async getEntities(caseId = 'case-101', typeFilter?: string): Promise<Entity[]> {
    await delay();
    let result = store.entities.filter((e) => e.caseIds.includes(caseId) || caseId === 'ALL');
    if (typeFilter && typeFilter !== 'ALL') {
      result = result.filter((e) => e.type === typeFilter);
    }
    return result;
  },

  async getEntityById(id: string): Promise<Entity | null> {
    await delay();
    return store.entities.find((e) => e.id === id) || null;
  },

  async reviewEntity(id: string, reviewStatus: 'VERIFIED' | 'UNVERIFIED' | 'FLAGGED'): Promise<Entity> {
    await delay();
    const entity = store.entities.find((e) => e.id === id);
    if (entity) {
      entity.reviewStatus = reviewStatus;
      store.saveToStorage();

      await this.addAuditLog({
        userId: 'usr-1',
        userName: 'Inspector Rajesh Varma',
        userRole: 'INVESTIGATOR',
        action: 'ENTITY_REVIEWED',
        target: `Reviewed Entity ${entity.name} (${entity.type}) -> Status: ${reviewStatus}`,
        ipAddress: '127.0.0.1',
      });
    }
    return entity!;
  },

  // Entity Resolution
  async getResolutionCandidates(): Promise<EntityResolutionCandidate[]> {
    await delay();
    return store.candidates;
  },

  async confirmMergeEntities(candidateId: string, notes?: string): Promise<EntityResolutionCandidate> {
    await delay();
    const candidate = store.candidates.find((c) => c.id === candidateId);
    if (candidate) {
      candidate.status = 'CONFIRMED';
      candidate.reviewedAt = new Date().toISOString();
      candidate.notes = notes || 'Merged by investigator review';

      const primary = store.entities.find((e) => e.id === candidate.primaryEntityId);
      const secondary = store.entities.find((e) => e.id === candidate.candidateEntityId);
      if (primary && secondary) {
        primary.notes = `${primary.notes || ''} [Merged duplicate: ${secondary.name}]`;
        primary.confidence = Math.min(1.0, primary.confidence + 0.05);
        secondary.reviewStatus = 'FLAGGED';
      }

      store.saveToStorage();

      await this.addAuditLog({
        userId: 'usr-1',
        userName: 'Inspector Rajesh Varma',
        userRole: 'INVESTIGATOR',
        action: 'ENTITY_MERGE_CONFIRMED',
        target: `Confirmed Entity Merge: ${primary?.name || 'Primary'} + ${secondary?.name || 'Candidate'}`,
        metadata: { candidateId, similarityScore: candidate.similarityScore, notes: notes || '' },
        ipAddress: '127.0.0.1',
      });
    }
    return candidate!;
  },

  async rejectMergeEntities(candidateId: string, notes?: string): Promise<EntityResolutionCandidate> {
    await delay();
    const candidate = store.candidates.find((c) => c.id === candidateId);
    if (candidate) {
      candidate.status = 'REJECTED';
      candidate.reviewedAt = new Date().toISOString();
      candidate.notes = notes || 'Rejected duplicate hypothesis';

      store.saveToStorage();

      await this.addAuditLog({
        userId: 'usr-1',
        userName: 'Inspector Rajesh Varma',
        userRole: 'INVESTIGATOR',
        action: 'ENTITY_MERGE_REJECTED',
        target: `Rejected Entity Merge Candidate ${candidateId}`,
        metadata: { candidateId, similarityScore: candidate.similarityScore, notes: notes || '' },
        ipAddress: '127.0.0.1',
      });
    }
    return candidate!;
  },

  // Relationships
  async getRelationships(caseId = 'case-101'): Promise<Relationship[]> {
    await delay();
    return store.relationships.filter((r) => r.caseId === caseId || caseId === 'ALL');
  },

  // Network Graph (Cytoscape)
  async getNetworkGraph(caseId = 'case-101'): Promise<{ nodes: Entity[]; edges: Relationship[] }> {
    await delay();
    const caseEntities = store.entities.filter((e) => e.caseIds.includes(caseId) || caseId === 'ALL');
    const entityIds = new Set(caseEntities.map((e) => e.id));
    const caseEdges = store.relationships.filter(
      (r) => entityIds.has(r.sourceEntityId) && entityIds.has(r.targetEntityId)
    );
    return { nodes: caseEntities, edges: caseEdges };
  },

  // Timeline
  async getTimeline(caseId = 'case-101', entityId?: string): Promise<TimelineEvent[]> {
    await delay();
    let events = store.timelineEvents.filter((evt) => evt.caseId === caseId || caseId === 'ALL');
    if (entityId) {
      events = events.filter((evt) => evt.entityId === entityId);
    }
    return events.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  },

  // Map Locations
  async getMapLocations(caseId = 'case-101'): Promise<MapLocation[]> {
    await delay();
    return store.mapLocations.filter((l) => l.caseId === caseId || caseId === 'ALL');
  },

  // AI Assistant
  async queryAI(caseId: string, promptText: string): Promise<AIFinding> {
    await delay(250);
    const textLower = promptText.toLowerCase();

    let findingText = '';
    let category: AIFinding['category'] = 'PATTERN_MATCH';
    let riskLevel: AIFinding['riskLevel'] = 'HIGH';
    let evidenceIds = ['ev-101', 'ev-102'];
    let entityIds = ['ent-1', 'ent-5'];

    if (textLower.includes('connection') || textLower.includes('explain')) {
      findingText = `AI Network Synthesis: High density of indirect transfers detected between Ramesh Kumar (ent-1) and cryptocurrency wallet 0x71C765...89A2 (ent-11) via HDFC Account 908122. Encrypted call frequency spiked 48 hours prior to transaction execution.`;
      category = 'NETWORK_CLUSTER';
      riskLevel = 'CRITICAL';
      evidenceIds = ['ev-101', 'ev-102', 'ev-106'];
      entityIds = ['ent-1', 'ent-9', 'ent-11'];
    } else if (textLower.includes('person a') || textLower.includes('ramesh')) {
      findingText = `Ramesh Kumar is linked to 14 separate entities including shell firm Apex Trading, 3 phone SIMs, and ANPR vehicle sightings in Noida. Risk profile evaluated as CRITICAL based on financial volume.`;
      category = 'SUSPICIOUS_TRANSACTION';
      riskLevel = 'CRITICAL';
      evidenceIds = ['ev-101', 'ev-103', 'ev-105'];
      entityIds = ['ent-1', 'ent-8', 'ent-12'];
    } else if (textLower.includes('timeline') || textLower.includes('chronology')) {
      findingText = `Timeline Pattern: Incorporation of Apex Trading (Aug 11) was followed within 5 hours by wire transfers (₹ 5 Crore), leading to ANPR vehicle detection in Noida (Aug 20).`;
      category = 'CO_LOCATION';
      riskLevel = 'HIGH';
      evidenceIds = ['ev-102', 'ev-103', 'ev-105'];
      entityIds = ['ent-1', 'ent-12', 'ent-8'];
    } else {
      findingText = `Investigative Discovery: Pattern matching identified multi-case involvement across CASE-2026-8812 and CASE-2026-9043. Shared infrastructure includes vehicle KA-01-MJ-4091 and phone +91 91234 56789.`;
      category = 'ANOMALY';
      riskLevel = 'MEDIUM';
      evidenceIds = ['ev-104', 'ev-105'];
      entityIds = ['ent-6', 'ent-8'];
    }

    const finding: AIFinding = {
      id: `ai-${Date.now()}`,
      caseId,
      title: `AI Finding: ${promptText.slice(0, 45)}...`,
      finding: findingText,
      confidence: 0.93,
      supportingEvidenceIds: evidenceIds,
      relatedEntityIds: entityIds,
      timestamp: new Date().toISOString(),
      category,
      riskLevel,
      queryText: promptText,
    };

    store.aiFindings.unshift(finding);
    store.saveToStorage();

    await this.addAuditLog({
      userId: 'usr-1',
      userName: 'Inspector Rajesh Varma',
      userRole: 'INVESTIGATOR',
      action: 'AI_QUERY',
      target: 'AI Intelligence Assistant',
      caseId,
      metadata: { query: promptText },
      ipAddress: '127.0.0.1',
    });

    return finding;
  },

  async getAIFindings(caseId = 'case-101'): Promise<AIFinding[]> {
    await delay();
    return store.aiFindings.filter((f) => f.caseId === caseId || caseId === 'ALL');
  },

  // Reports
  async getReports(caseId = 'case-101'): Promise<IntelligenceReport[]> {
    await delay();
    return store.reports.filter((r) => r.caseId === caseId || caseId === 'ALL');
  },

  async generateReport(caseId: string, type: IntelligenceReport['type']): Promise<IntelligenceReport> {
    await delay(250);
    const targetCase = store.cases.find((c) => c.id === caseId) || store.cases[0];
    const newReport: IntelligenceReport = {
      id: `rep-${Date.now()}`,
      title: `${type.replace(/_/g, ' ')} - ${targetCase.caseNumber}`,
      type,
      caseId: targetCase.id,
      caseTitle: targetCase.title,
      generatedBy: 'Inspector Rajesh Varma (Investigator)',
      generatedAt: new Date().toISOString(),
      summaryStats: {
        totalEntities: targetCase.entityCount,
        totalEvidence: targetCase.evidenceCount,
        totalRelationships: targetCase.relationshipCount,
        aiFindingsCount: 3,
      },
      content: {
        executiveSummary: `Automated ${type.replace(/_/g, ' ')} synthesized from verified evidence ledger, Cytoscape network graph, and MapLibre spatial telemetry.`,
        keyFindings: [
          'Primary suspect Ramesh Kumar established as central nexus in multi-source network.',
          'Financial wire transfers totaling ₹ 4.5 Crore corroborated via FIU Suspicious Transaction Reports.',
          'Geospatial ANPR match confirms vehicle movement between Bengaluru safehouse and Noida tech park.',
        ],
        riskAssessment: 'CRITICAL INVESTIGATIVE CONTEXT: High risk of evidence tampering or financial liquidation.',
        recommendedActions: [
          'Submit frozen assets petition to Special Magistrate Court.',
          'Proceed with formal custodial interrogation based on CDR call frequency evidence.',
        ],
      },
      exportUrl: '#export-pdf',
    };
    store.reports.unshift(newReport);
    store.saveToStorage();

    await this.addAuditLog({
      userId: 'usr-1',
      userName: 'Inspector Rajesh Varma',
      userRole: 'INVESTIGATOR',
      action: 'REPORT_GENERATED',
      target: `Generated Report: ${newReport.title}`,
      caseId: targetCase.id,
      metadata: { reportType: type },
      ipAddress: '127.0.0.1',
    });

    return newReport;
  },

  // Audit Logs
  async getAuditLogs(filter?: string): Promise<AuditLog[]> {
    await delay();
    let logs = [...store.auditLogs];
    if (filter && filter !== 'ALL') {
      const f = filter.toLowerCase();
      logs = logs.filter(
        (l) =>
          l.userName.toLowerCase().includes(f) ||
          l.action.toLowerCase().includes(f) ||
          l.target.toLowerCase().includes(f) ||
          l.ipAddress.includes(f)
      );
    }
    return logs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  },

  async addAuditLog(entry: Omit<AuditLog, 'id' | 'timestamp'>): Promise<AuditLog> {
    const log: AuditLog = {
      id: `log-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      timestamp: new Date().toISOString(),
      ...entry,
    };
    store.auditLogs.unshift(log);
    store.saveToStorage();
    return log;
  },

  // Global Search
  async globalSearch(query: string): Promise<GlobalSearchResult[]> {
    await delay(80);
    if (!query || query.trim().length < 2) return [];
    const q = query.toLowerCase();
    const results: GlobalSearchResult[] = [];

    // Search Cases
    store.cases.forEach((c) => {
      if (c.title.toLowerCase().includes(q) || c.caseNumber.toLowerCase().includes(q)) {
        results.push({
          id: c.id,
          title: c.title,
          subtitle: `${c.caseNumber} • ${c.status} • ${c.crimeType}`,
          category: 'CASES',
          url: `/cases/${c.id}`,
        });
      }
    });

    // Search Entities
    store.entities.forEach((e) => {
      if (e.name.toLowerCase().includes(q) || String(e.attributes.phone || '').includes(q)) {
        let cat: GlobalSearchResult['category'] = 'PEOPLE';
        if (e.type === 'PHONE') cat = 'PHONES';
        else if (e.type === 'VEHICLE') cat = 'VEHICLES';
        else if (e.type === 'ORGANIZATION') cat = 'ORGANIZATIONS';
        else if (e.type === 'LOCATION') cat = 'LOCATIONS';

        results.push({
          id: e.id,
          title: e.name,
          subtitle: `${e.type} • Confidence ${(e.confidence * 100).toFixed(0)}% • ${e.reviewStatus}`,
          category: cat,
          url: `/entities/${e.id}`,
        });
      }
    });

    // Search Evidence
    store.evidence.forEach((ev) => {
      if (ev.title.toLowerCase().includes(q) || ev.evidenceNumber.toLowerCase().includes(q)) {
        results.push({
          id: ev.id,
          title: ev.title,
          subtitle: `${ev.evidenceNumber} • ${ev.type} • ${ev.source}`,
          category: 'EVIDENCE',
          url: `/evidence/${ev.id}`,
        });
      }
    });

    return results;
  },
};
