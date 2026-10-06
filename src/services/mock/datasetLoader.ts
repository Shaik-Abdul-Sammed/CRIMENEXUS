import rawDataset from '../../data/crimenexus-dataset.txt?raw';
import { validateDataset, ValidationResult } from './datasetValidator';
import {
  User,
  InvestigationCase,
  Entity,
  Evidence,
  Relationship,
  TimelineEvent,
  MapLocation,
  AIFinding,
  IntelligenceReport,
  AuditLog,
  EntityResolutionCandidate,
  GlobalSearchResult,
} from '../../types';

export interface RawEntityRecord {
  [key: string]: unknown;
}

export interface CrimeNexusMasterDataset {
  users: User[];
  cases: InvestigationCase[];
  personEntities: RawEntityRecord[];
  phoneEntities: RawEntityRecord[];
  emailEntities: RawEntityRecord[];
  vehicles: RawEntityRecord[];
  bankAccounts: RawEntityRecord[];
  upiIds: RawEntityRecord[];
  cryptoWallets: RawEntityRecord[];
  organizations: RawEntityRecord[];
  devices: RawEntityRecord[];
  socialAccounts: RawEntityRecord[];
  entities: Entity[];
  locations: MapLocation[];
  evidenceRecords: Evidence[];
  relationships: Relationship[];
  timelineEvents: TimelineEvent[];
  financialTransactions: RawEntityRecord[];
  vehicleSightings: RawEntityRecord[];
  communications: RawEntityRecord[];
  resolutionCandidates: EntityResolutionCandidate[];
  aiFindings: AIFinding[];
  reports: IntelligenceReport[];
  auditLogs: AuditLog[];
  notifications: RawEntityRecord[];
  dashboardMetrics: Record<string, number>;
  graphConfig: Record<string, unknown>;
  searchIndex: GlobalSearchResult[];
}

function parseSectionText(text: string): Record<string, unknown> {
  const sections: Record<string, string> = {};
  const lines = text.split('\n');

  let currentSectionKey = '';
  let currentLines: string[] = [];

  for (const line of lines) {
    if (line.startsWith('# SECTION ')) {
      if (currentSectionKey) {
        sections[currentSectionKey] = currentLines.join('\n').trim();
      }
      const match = line.match(/# SECTION \d+\s*—?\s*(.*)/);
      currentSectionKey = match ? match[1].trim() : line.trim();
      currentLines = [];
    } else if (currentSectionKey) {
      currentLines.push(line);
    }
  }
  if (currentSectionKey) {
    sections[currentSectionKey] = currentLines.join('\n').trim();
  }

  const rawParsed: Record<string, unknown> = {};

  const keyMapping: Record<string, string> = {
    'USERS': 'users',
    'CASES / INVESTIGATIONS': 'cases',
    'PERSON ENTITIES': 'personEntities',
    'PHONE ENTITIES': 'phoneEntities',
    'EMAIL ENTITIES': 'emailEntities',
    'VEHICLES': 'vehicles',
    'BANK ACCOUNTS': 'bankAccounts',
    'UPI IDs': 'upiIds',
    'CRYPTO WALLETS': 'cryptoWallets',
    'ORGANIZATIONS': 'organizations',
    'DEVICES': 'devices',
    'SOCIAL ACCOUNTS': 'socialAccounts',
    'LOCATIONS': 'locations',
    'EVIDENCE': 'evidenceRecords',
    'RELATIONSHIPS': 'relationships',
    'TIMELINE EVENTS': 'timelineEvents',
    'FINANCIAL TRANSACTIONS': 'financialTransactions',
    'VEHICLE SIGHTINGS': 'vehicleSightings',
    'COMMUNICATION RECORDS': 'communications',
    'COMMUNICATIONS': 'communications',
    'ENTITY RESOLUTION CANDIDATES': 'resolutionCandidates',
    'AI FINDINGS': 'aiFindings',
    'REPORTS': 'reports',
    'AUDIT LOGS': 'auditLogs',
    'NOTIFICATIONS': 'notifications',
    'DASHBOARD METRICS': 'dashboardMetrics',
    'GRAPH CONFIGURATION': 'graphConfig',
    'SEARCH INDEX': 'searchIndex',
  };

  for (const [secTitle, jsonStr] of Object.entries(sections)) {
    const matchedKey = Object.keys(keyMapping).find((k) => secTitle.toUpperCase().includes(k));
    const normKey = matchedKey ? keyMapping[matchedKey] : secTitle;

    try {
      if (jsonStr) {
        rawParsed[normKey] = JSON.parse(jsonStr);
      }
    } catch (err) {
      console.error(`Error parsing JSON for dataset section "${secTitle}":`, err);
    }
  }

  return rawParsed;
}

function transformToApplicationModels(parsed: Record<string, unknown>): CrimeNexusMasterDataset {
  const rawUsers = (parsed.users || []) as RawEntityRecord[];
  const users: User[] = rawUsers.map((u) => ({
    id: String(u.id),
    name: String(u.name),
    email: String(u.email),
    role: u.role as User['role'],
    avatar: String(u.avatar),
    department: String(u.department),
    badgeNumber: String(u.id).toUpperCase().replace('USR-', 'SCB-88'),
  }));

  const rawCases = (parsed.cases || []) as RawEntityRecord[];
  const cases: InvestigationCase[] = rawCases.map((c) => ({
    id: String(c.caseId),
    caseNumber: String(c.caseNumber),
    title: String(c.title),
    description: String(c.description),
    status: c.status as InvestigationCase['status'],
    priority: c.priority as InvestigationCase['priority'],
    crimeType: String(c.category),
    assignedTo: String(c.assignedInvestigator),
    assignedUserName: users.find((u) => u.id === c.assignedInvestigator)?.name || 'Inspector Rajesh Varma',
    locationName: String(c.location),
    createdAt: String(c.openedDate),
    updatedAt: String(c.updatedDate),
    tags: (c.tags as string[]) || [],
    entityCount: Number(c.entityCount || 0),
    evidenceCount: Number(c.evidenceCount || 0),
    relationshipCount: Number(c.relationshipCount || 0),
  }));

  const entities: Entity[] = [];

  // 1. Persons
  ((parsed.personEntities || []) as RawEntityRecord[]).forEach((p) => {
    entities.push({
      id: String(p.entityId),
      name: String(p.displayName),
      type: 'PERSON',
      attributes: {
        aliases: ((p.aliases as string[]) || []).join(', '),
        dob: String(p.dateOfBirth),
        gender: String(p.gender),
        occupation: String(p.occupation),
      },
      confidence: Number(p.confidence),
      caseIds: (p.caseIds as string[]) || [],
      riskLevel: Number(p.confidence) > 0.9 ? 'CRITICAL' : 'HIGH',
      reviewStatus: (p.reviewStatus as Entity['reviewStatus']) || 'VERIFIED',
      createdDate: String(p.createdAt || new Date().toISOString()),
    });
  });

  // 2. Phones
  ((parsed.phoneEntities || []) as RawEntityRecord[]).forEach((ph) => {
    entities.push({
      id: String(ph.phoneId),
      name: String(ph.phoneNumber),
      type: 'PHONE',
      attributes: {
        carrier: String(ph.carrier),
        ownerId: String(ph.ownerEntityId),
        deviceId: String(ph.deviceId),
      },
      confidence: Number(ph.confidence),
      caseIds: (ph.caseIds as string[]) || [],
      riskLevel: 'HIGH',
      reviewStatus: (ph.reviewStatus as Entity['reviewStatus']) || 'VERIFIED',
      createdDate: String(ph.firstSeen || new Date().toISOString()),
    });
  });

  // 3. Vehicles
  ((parsed.vehicles || []) as RawEntityRecord[]).forEach((v) => {
    entities.push({
      id: String(v.vehicleId),
      name: String(v.registration),
      type: 'VEHICLE',
      attributes: {
        makeModel: `${v.color} ${v.make} ${v.model}`,
        registration: String(v.registration),
        ownerId: String(v.ownerEntityId),
      },
      confidence: Number(v.confidence),
      caseIds: (v.caseIds as string[]) || [],
      riskLevel: 'HIGH',
      reviewStatus: (v.reviewStatus as Entity['reviewStatus']) || 'VERIFIED',
      createdDate: new Date().toISOString(),
    });
  });

  // 4. Bank Accounts
  ((parsed.bankAccounts || []) as RawEntityRecord[]).forEach((ba) => {
    entities.push({
      id: String(ba.bankAccountId),
      name: String(ba.maskedAccountNumber),
      type: 'BANK_ACCOUNT',
      attributes: {
        bankName: String(ba.bankName),
        accountHolder: String(ba.accountHolderEntityId),
      },
      confidence: Number(ba.confidence),
      caseIds: (ba.caseIds as string[]) || [],
      riskLevel: 'CRITICAL',
      reviewStatus: (ba.reviewStatus as Entity['reviewStatus']) || 'VERIFIED',
      createdDate: new Date().toISOString(),
    });
  });

  // 5. Crypto Wallets
  ((parsed.cryptoWallets || []) as RawEntityRecord[]).forEach((cw) => {
    entities.push({
      id: String(cw.walletId),
      name: String(cw.address),
      type: 'CRYPTO_WALLET',
      attributes: {
        blockchain: 'Ethereum / USDT TRC-20',
        ownerId: String(cw.ownerEntityId),
      },
      confidence: Number(cw.confidence),
      caseIds: (cw.caseIds as string[]) || [],
      riskLevel: 'CRITICAL',
      reviewStatus: (cw.reviewStatus as Entity['reviewStatus']) || 'VERIFIED',
      createdDate: new Date().toISOString(),
    });
  });

  // 6. Organizations
  ((parsed.organizations || []) as RawEntityRecord[]).forEach((org) => {
    entities.push({
      id: String(org.organizationId),
      name: String(org.name),
      type: 'ORGANIZATION',
      attributes: {
        type: String(org.type),
        description: String(org.description),
      },
      confidence: Number(org.confidence),
      caseIds: (org.caseIds as string[]) || [],
      riskLevel: 'HIGH',
      reviewStatus: (org.reviewStatus as Entity['reviewStatus']) || 'VERIFIED',
      createdDate: new Date().toISOString(),
    });
  });

  // 7. Locations as Entities
  ((parsed.locations || []) as RawEntityRecord[]).forEach((loc) => {
    entities.push({
      id: String(loc.locationId),
      name: String(loc.name),
      type: 'LOCATION',
      attributes: {
        city: String(loc.city),
        coordinates: `${loc.latitude}, ${loc.longitude}`,
        locationType: String(loc.type),
      },
      confidence: 0.95,
      caseIds: (loc.caseIds as string[]) || [],
      riskLevel: 'MEDIUM',
      reviewStatus: 'VERIFIED',
      createdDate: new Date().toISOString(),
    });
  });

  // Locations Map Data
  const locations: MapLocation[] = ((parsed.locations || []) as RawEntityRecord[]).map((loc) => ({
    id: String(loc.locationId),
    title: String(loc.name),
    entityType: 'LOCATION',
    locationType: loc.type as MapLocation['locationType'],
    latitude: Number(loc.latitude),
    longitude: Number(loc.longitude),
    address: `${loc.name}, ${loc.city}, ${loc.region}`,
    timestamp: new Date().toISOString(),
    caseId: ((loc.caseIds as string[]) || [])[0] || 'case-101',
    metadata: { description: String(loc.description), synthetic: 'true' },
  }));

  // Evidence Records
  const evidenceRecords: Evidence[] = ((parsed.evidenceRecords || []) as RawEntityRecord[]).map((ev) => ({
    id: String(ev.evidenceId),
    evidenceNumber: String(ev.evidenceId).toUpperCase().replace('EV-', 'EVD-2026-'),
    caseId: String(ev.caseId),
    title: String(ev.title),
    type: ev.type as Evidence['type'],
    source: String(ev.source),
    sourceReference: `REF-${String(ev.evidenceId).toUpperCase()}`,
    timestamp: String(ev.timestamp),
    uploadedBy: users.find((u) => u.id === ev.uploadedBy)?.name || 'Inspector Rajesh Varma',
    hash: String(ev.hashPlaceholder || '9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08'),
    processingStatus: ev.processingStatus as Evidence['processingStatus'],
    linkedEntityIds: (ev.linkedEntityIds as string[]) || [],
    metadata: { confidence: Number(ev.confidence), reviewStatus: String(ev.reviewStatus) },
    description: String(ev.description),
  }));

  // Relationships
  const relationships: Relationship[] = ((parsed.relationships || []) as RawEntityRecord[]).map((r) => {
    const srcEntity = entities.find((e) => e.id === r.sourceEntityId);
    const tgtEntity = entities.find((e) => e.id === r.targetEntityId);
    return {
      id: String(r.relationshipId),
      sourceEntityId: String(r.sourceEntityId),
      targetEntityId: String(r.targetEntityId),
      sourceEntityName: srcEntity?.name || String(r.sourceEntityId),
      sourceEntityType: srcEntity?.type || 'PERSON',
      targetEntityName: tgtEntity?.name || String(r.targetEntityId),
      targetEntityType: tgtEntity?.type || 'PERSON',
      type: r.relationshipType as Relationship['type'],
      confidenceScore: Number(r.confidence),
      evidenceIds: (r.evidenceIds as string[]) || [],
      caseId: ((r.caseIds as string[]) || [])[0] || 'case-101',
      timestamp: String(r.timestamp),
      reviewStatus: (r.reviewStatus as Relationship['reviewStatus']) || 'VERIFIED',
      metadata: { description: String(r.description) },
    };
  });

  // Timeline Events
  const timelineEvents: TimelineEvent[] = ((parsed.timelineEvents || []) as RawEntityRecord[]).map((evt) => {
    const primaryEntity = entities.find((e) => e.id === ((evt.entityIds as string[]) || [])[0]);
    return {
      id: String(evt.eventId),
      caseId: String(evt.caseId),
      entityId: primaryEntity?.id || 'ent-p-1',
      entityName: primaryEntity?.name || 'Ramesh Kumar',
      entityType: primaryEntity?.type || 'PERSON',
      eventType: evt.eventType as TimelineEvent['eventType'],
      timestamp: String(evt.timestamp),
      description: String(evt.description),
      location: evt.locationId ? locations.find((l) => l.id === evt.locationId)?.title : undefined,
      evidenceId: ((evt.evidenceIds as string[]) || [])[0],
      confidence: 0.95,
    };
  });

  // Entity Resolution Candidates
  const resolutionCandidates: EntityResolutionCandidate[] = ((parsed.resolutionCandidates || []) as RawEntityRecord[]).map((res) => {
    const primary = entities.find((e) => e.id === res.entityAId) || entities[0];
    const candidate = entities.find((e) => e.id === res.entityBId) || entities[1];
    return {
      id: String(res.candidateId),
      primaryEntityId: primary.id,
      candidateEntityId: candidate.id,
      primaryEntity: primary,
      candidateEntity: candidate,
      similarityScore: Number(res.similarityScore),
      matchingAttributes: (res.matchingAttributes as string[]) || [],
      supportingEvidenceIds: (res.supportingEvidenceIds as string[]) || [],
      status: res.status as EntityResolutionCandidate['status'],
      reviewedBy: res.reviewedBy ? String(res.reviewedBy) : undefined,
      reviewedAt: res.reviewedAt ? String(res.reviewedAt) : undefined,
    };
  });

  // AI Findings
  const aiFindings: AIFinding[] = ((parsed.aiFindings || []) as RawEntityRecord[]).map((ai) => ({
    id: String(ai.findingId),
    caseId: String(ai.caseId),
    title: String(ai.title),
    finding: String(ai.finding),
    confidence: Number(ai.confidence),
    supportingEvidenceIds: (ai.supportingEvidenceIds as string[]) || [],
    relatedEntityIds: (ai.relatedEntityIds as string[]) || [],
    timestamp: String(ai.timestamp),
    category: 'NETWORK_CLUSTER',
    riskLevel: (ai.severity as AIFinding['riskLevel']) || 'HIGH',
  }));

  // Reports
  const reports: IntelligenceReport[] = ((parsed.reports || []) as RawEntityRecord[]).map((rep) => {
    const targetCase = cases.find((c) => c.id === rep.caseId) || cases[0];
    return {
      id: String(rep.reportId),
      title: String(rep.title),
      type: rep.type as IntelligenceReport['type'],
      caseId: String(rep.caseId),
      caseTitle: targetCase.title,
      generatedBy: String(rep.generatedBy),
      generatedAt: String(rep.generatedAt),
      summaryStats: {
        totalEntities: targetCase.entityCount,
        totalEvidence: targetCase.evidenceCount,
        totalRelationships: targetCase.relationshipCount,
        aiFindingsCount: 3,
      },
      content: {
        executiveSummary: `Automated ${String(rep.type).replace(/_/g, ' ')} report derived from master synthetic dataset.`,
        keyFindings: [
          'Primary suspect Ramesh Kumar established as central nexus in multi-source network.',
          'Financial wire transfers corroborated via FIU Suspicious Transaction Reports.',
          'Geospatial ANPR match confirms vehicle movement between Bengaluru safehouse and Noida tech park.',
        ],
        riskAssessment: 'CRITICAL INVESTIGATIVE CONTEXT: High risk of capital flight or evidence tampering.',
        recommendedActions: [
          'Submit frozen assets petition to Special Magistrate Court.',
          'Proceed with formal custodial interrogation based on CDR call frequency evidence.',
        ],
      },
      exportUrl: '#export-pdf',
    };
  });

  // Audit Logs
  const auditLogs: AuditLog[] = ((parsed.auditLogs || []) as RawEntityRecord[]).map((log) => ({
    id: String(log.auditId),
    timestamp: String(log.timestamp),
    userId: String(log.userId),
    userName: users.find((u) => u.id === log.userId)?.name || 'System Operator',
    userRole: log.role as AuditLog['userRole'],
    action: log.action as AuditLog['action'],
    target: `${log.description} (${log.targetId || 'Resource'})`,
    caseId: log.caseId ? String(log.caseId) : undefined,
    metadata: log.metadata as Record<string, string | number | boolean>,
    ipAddress: (log.metadata as Record<string, string>)?.ip || '10.240.12.89',
  }));

  // Search Index
  const searchIndex: GlobalSearchResult[] = ((parsed.searchIndex || []) as RawEntityRecord[]).map((s) => ({
    id: String(s.searchId),
    title: String(s.title),
    subtitle: String(s.subtitle),
    category: s.entityType === 'CASE' ? 'CASES' : s.entityType === 'PERSON' ? 'PEOPLE' : s.entityType === 'PHONE' ? 'PHONES' : s.entityType === 'VEHICLE' ? 'VEHICLES' : 'EVIDENCE',
    url: s.entityType === 'CASE' ? `/cases/${s.entityId}` : s.entityType === 'EVIDENCE' ? `/evidence/${s.entityId}` : `/entities/${s.entityId}`,
  }));

  return {
    users,
    cases,
    personEntities: (parsed.personEntities || []) as RawEntityRecord[],
    phoneEntities: (parsed.phoneEntities || []) as RawEntityRecord[],
    emailEntities: (parsed.emailEntities || []) as RawEntityRecord[],
    vehicles: (parsed.vehicles || []) as RawEntityRecord[],
    bankAccounts: (parsed.bankAccounts || []) as RawEntityRecord[],
    upiIds: (parsed.upiIds || []) as RawEntityRecord[],
    cryptoWallets: (parsed.cryptoWallets || []) as RawEntityRecord[],
    organizations: (parsed.organizations || []) as RawEntityRecord[],
    devices: (parsed.devices || []) as RawEntityRecord[],
    socialAccounts: (parsed.socialAccounts || []) as RawEntityRecord[],
    entities,
    locations,
    evidenceRecords,
    relationships,
    timelineEvents,
    financialTransactions: (parsed.financialTransactions || []) as RawEntityRecord[],
    vehicleSightings: (parsed.vehicleSightings || []) as RawEntityRecord[],
    communications: (parsed.communications || []) as RawEntityRecord[],
    resolutionCandidates,
    aiFindings,
    reports,
    auditLogs,
    notifications: (parsed.notifications || []) as RawEntityRecord[],
    dashboardMetrics: (parsed.dashboardMetrics || {}) as Record<string, number>,
    graphConfig: (parsed.graphConfig || {}) as Record<string, unknown>,
    searchIndex,
  };
}

export function loadMasterDataset(): { dataset: CrimeNexusMasterDataset; validation: ValidationResult } {
  const parsedRaw = parseSectionText(rawDataset);
  const validation = validateDataset(parsedRaw);

  if (!validation.valid) {
    console.error('CRIMENEXUS Master Dataset Validation Failed with Errors:', validation.errors);
  } else {
    console.log('CRIMENEXUS Master Dataset Validated Successfully. Section Counts:', validation.counts);
  }

  const dataset = transformToApplicationModels(parsedRaw);
  return { dataset, validation };
}
