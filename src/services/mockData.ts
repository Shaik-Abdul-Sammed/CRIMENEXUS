import { loadMasterDataset } from './mock/datasetLoader';

// Load and validate master dataset from src/data/crimenexus-dataset.txt
const loaded = loadMasterDataset();

export const MASTER_DATASET = loaded.dataset;
export const DATASET_VALIDATION = loaded.validation;

export const MOCK_USERS = MASTER_DATASET.users;
export const MOCK_CASES = MASTER_DATASET.cases;
export const MOCK_ENTITIES = MASTER_DATASET.entities;
export const MOCK_RELATIONSHIPS = MASTER_DATASET.relationships;
export const MOCK_EVIDENCE = MASTER_DATASET.evidenceRecords;
export const MOCK_TIMELINE_EVENTS = MASTER_DATASET.timelineEvents;
export const MOCK_MAP_LOCATIONS = MASTER_DATASET.locations;
export const MOCK_AI_FINDINGS = MASTER_DATASET.aiFindings;
export const MOCK_REPORTS = MASTER_DATASET.reports;
export const MOCK_AUDIT_LOGS = MASTER_DATASET.auditLogs;
export const MOCK_RESOLUTION_CANDIDATES = MASTER_DATASET.resolutionCandidates;
export const MOCK_NOTIFICATIONS = MASTER_DATASET.notifications;
export const MOCK_DASHBOARD_METRICS = MASTER_DATASET.dashboardMetrics;
export const MOCK_SEARCH_INDEX = MASTER_DATASET.searchIndex;
