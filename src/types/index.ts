export type UserRole = 'INVESTIGATOR' | 'ANALYST' | 'SUPERVISOR' | 'ADMIN';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar: string;
  department: string;
  badgeNumber: string;
}

export type CaseStatus = 'OPEN' | 'UNDER_INVESTIGATION' | 'COLD_CASE' | 'CLOSED';
export type CasePriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface InvestigationCase {
  id: string;
  caseNumber: string;
  title: string;
  description: string;
  status: CaseStatus;
  priority: CasePriority;
  crimeType: string;
  assignedTo: string; // User ID
  assignedUserName?: string;
  locationName: string;
  createdAt: string;
  updatedAt: string;
  tags: string[];
  entityCount: number;
  evidenceCount: number;
  relationshipCount: number;
}

export type EntityType =
  | 'PERSON'
  | 'PHONE'
  | 'EMAIL'
  | 'VEHICLE'
  | 'BANK_ACCOUNT'
  | 'UPI_ID'
  | 'CRYPTO_WALLET'
  | 'LOCATION'
  | 'ORGANIZATION'
  | 'DEVICE'
  | 'SOCIAL_ACCOUNT'
  | 'CASE'
  | 'EVIDENCE';

export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type ReviewStatus = 'VERIFIED' | 'UNVERIFIED' | 'FLAGGED';

export interface Entity {
  id: string;
  name: string;
  type: EntityType;
  attributes: Record<string, string | number | boolean>;
  confidence: number; // 0 to 1
  caseIds: string[];
  riskLevel: RiskLevel;
  reviewStatus: ReviewStatus;
  createdDate: string;
  notes?: string;
}

export type ResolutionStatus = 'PENDING' | 'CONFIRMED' | 'REJECTED' | 'DEFERRED';

export interface EntityResolutionCandidate {
  id: string;
  primaryEntityId: string;
  candidateEntityId: string;
  primaryEntity: Entity;
  candidateEntity: Entity;
  similarityScore: number; // 0 to 1
  matchingAttributes: string[];
  supportingEvidenceIds: string[];
  status: ResolutionStatus;
  reviewedBy?: string;
  reviewedAt?: string;
  notes?: string;
}

export type RelationshipType =
  | 'CALLED'
  | 'MESSAGED'
  | 'OWNED'
  | 'TRANSFERRED_TO'
  | 'LOCATED_AT'
  | 'WORKED_WITH'
  | 'RELATED_TO'
  | 'MENTIONED_IN'
  | 'SEEN_WITH'
  | 'USED'
  | 'CONNECTED_TO';

export interface Relationship {
  id: string;
  sourceEntityId: string;
  targetEntityId: string;
  sourceEntityName?: string;
  sourceEntityType?: EntityType;
  targetEntityName?: string;
  targetEntityType?: EntityType;
  type: RelationshipType;
  confidenceScore: number; // 0 to 1
  evidenceIds: string[];
  caseId: string;
  timestamp: string;
  reviewStatus: ReviewStatus;
  metadata?: Record<string, string | number>;
}

export type EvidenceType =
  | 'DOCUMENT'
  | 'IMAGE'
  | 'CCTV'
  | 'CALL_RECORD'
  | 'FINANCIAL_TRANSACTION'
  | 'VEHICLE_SIGHTING'
  | 'LOCATION_RECORD'
  | 'COMMUNICATION_RECORD';

export type ProcessingStatus = 'PENDING' | 'PROCESSED' | 'FAILED';

export interface Evidence {
  id: string;
  evidenceNumber: string;
  caseId: string;
  title: string;
  type: EvidenceType;
  source: string;
  sourceReference: string;
  timestamp: string;
  uploadedBy: string;
  hash: string;
  processingStatus: ProcessingStatus;
  linkedEntityIds: string[];
  metadata: Record<string, string | number>;
  fileUrl?: string;
  fileSize?: string;
  description?: string;
}

export type EventType =
  | 'CALL'
  | 'MESSAGE'
  | 'VEHICLE_DETECTION'
  | 'CCTV_SIGHTING'
  | 'BANK_TRANSFER'
  | 'LOCATION_PING'
  | 'EVIDENCE_UPLOAD'
  | 'INVESTIGATOR_ACTION';

export interface TimelineEvent {
  id: string;
  caseId: string;
  entityId: string;
  entityName: string;
  entityType: EntityType;
  eventType: EventType;
  timestamp: string;
  description: string;
  location?: string;
  evidenceId?: string;
  confidence: number;
}

export type MapLocationType =
  | 'CRIME_SCENE'
  | 'CCTV_SIGHTING'
  | 'VEHICLE_DETECTION'
  | 'PHONE_CELL_TOWER'
  | 'STATION';

export interface MapLocation {
  id: string;
  title: string;
  entityType: EntityType;
  locationType: MapLocationType;
  latitude: number;
  longitude: number;
  address: string;
  timestamp: string;
  entityId?: string;
  entityName?: string;
  caseId: string;
  metadata?: Record<string, string>;
}

export interface AIFinding {
  id: string;
  caseId: string;
  title: string;
  finding: string;
  confidence: number;
  supportingEvidenceIds: string[];
  relatedEntityIds: string[];
  timestamp: string;
  category: 'NETWORK_CLUSTER' | 'SUSPICIOUS_TRANSACTION' | 'PATTERN_MATCH' | 'CO_LOCATION' | 'ANOMALY';
  riskLevel: RiskLevel;
  queryText?: string;
}

export type ReportType =
  | 'CASE_SUMMARY'
  | 'EVIDENCE_SUMMARY'
  | 'RELATIONSHIP_REPORT'
  | 'NETWORK_ANALYSIS'
  | 'TIMELINE_REPORT'
  | 'AI_INTELLIGENCE';

export interface IntelligenceReport {
  id: string;
  title: string;
  type: ReportType;
  caseId: string;
  caseTitle?: string;
  generatedBy: string;
  generatedAt: string;
  summaryStats: {
    totalEntities: number;
    totalEvidence: number;
    totalRelationships: number;
    aiFindingsCount: number;
  };
  content: {
    executiveSummary: string;
    keyFindings: string[];
    riskAssessment: string;
    recommendedActions: string[];
  };
  exportUrl?: string;
}

export type AuditAction =
  | 'LOGIN'
  | 'LOGOUT'
  | 'CASE_VIEWED'
  | 'EVIDENCE_VIEWED'
  | 'EVIDENCE_PROCESSED'
  | 'ENTITY_REVIEWED'
  | 'ENTITY_MERGE_CONFIRMED'
  | 'ENTITY_MERGE_REJECTED'
  | 'GRAPH_INVESTIGATED'
  | 'AI_QUERY'
  | 'AI_FINDING_VIEWED'
  | 'REPORT_GENERATED'
  | 'REPORT_EXPORTED'
  | 'SETTINGS_CHANGED';

export interface AuditLog {
  id: string;
  timestamp: string;
  userId: string;
  userName: string;
  userRole: UserRole;
  action: AuditAction;
  target: string;
  caseId?: string;
  metadata?: Record<string, string | number | boolean>;
  ipAddress: string;
}

export interface GlobalSearchResult {
  id: string;
  title: string;
  subtitle: string;
  category: 'CASES' | 'PEOPLE' | 'PHONES' | 'VEHICLES' | 'EVIDENCE' | 'ORGANIZATIONS' | 'LOCATIONS';
  url: string;
  metadata?: string;
}
