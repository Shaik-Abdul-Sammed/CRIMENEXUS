import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api';
import { useAppStore } from '../stores/appStore';
import { Evidence, IntelligenceReport } from '../types';

export function useInvestigations(query?: string, status?: string) {
  return useQuery({
    queryKey: ['investigations', query, status],
    queryFn: () => api.getInvestigations(query, status),
  });
}

export function useInvestigationDetail(caseId: string) {
  return useQuery({
    queryKey: ['investigation', caseId],
    queryFn: () => api.getInvestigationById(caseId),
    enabled: Boolean(caseId),
  });
}

export function useCaseEvidence(caseId?: string, typeFilter?: string) {
  const activeCaseId = useAppStore((state) => state.activeCaseId);
  const targetCaseId = caseId || activeCaseId;
  return useQuery({
    queryKey: ['evidence', targetCaseId, typeFilter],
    queryFn: () => api.getCaseEvidence(targetCaseId, typeFilter),
  });
}

export function useEvidenceDetail(evidenceId: string) {
  return useQuery({
    queryKey: ['evidence-detail', evidenceId],
    queryFn: () => api.getEvidenceById(evidenceId),
    enabled: Boolean(evidenceId),
  });
}

export function useEntities(caseId?: string, typeFilter?: string) {
  const activeCaseId = useAppStore((state) => state.activeCaseId);
  const targetCaseId = caseId || activeCaseId;
  return useQuery({
    queryKey: ['entities', targetCaseId, typeFilter],
    queryFn: () => api.getEntities(targetCaseId, typeFilter),
  });
}

export function useEntityDetail(entityId: string) {
  return useQuery({
    queryKey: ['entity-detail', entityId],
    queryFn: () => api.getEntityById(entityId),
    enabled: Boolean(entityId),
  });
}

export function useResolutionCandidates() {
  return useQuery({
    queryKey: ['resolution-candidates'],
    queryFn: () => api.getResolutionCandidates(),
  });
}

export function useNetworkGraph(caseId?: string) {
  const activeCaseId = useAppStore((state) => state.activeCaseId);
  const targetCaseId = caseId || activeCaseId;
  return useQuery({
    queryKey: ['network-graph', targetCaseId],
    queryFn: () => api.getNetworkGraph(targetCaseId),
  });
}

export function useTimeline(caseId?: string, entityId?: string) {
  const activeCaseId = useAppStore((state) => state.activeCaseId);
  const targetCaseId = caseId || activeCaseId;
  return useQuery({
    queryKey: ['timeline', targetCaseId, entityId],
    queryFn: () => api.getTimeline(targetCaseId, entityId),
  });
}

export function useMapLocations(caseId?: string) {
  const activeCaseId = useAppStore((state) => state.activeCaseId);
  const targetCaseId = caseId || activeCaseId;
  return useQuery({
    queryKey: ['map-locations', targetCaseId],
    queryFn: () => api.getMapLocations(targetCaseId),
  });
}

export function useAIFindings(caseId?: string) {
  const activeCaseId = useAppStore((state) => state.activeCaseId);
  const targetCaseId = caseId || activeCaseId;
  return useQuery({
    queryKey: ['ai-findings', targetCaseId],
    queryFn: () => api.getAIFindings(targetCaseId),
  });
}

export function useReports(caseId?: string) {
  const activeCaseId = useAppStore((state) => state.activeCaseId);
  const targetCaseId = caseId || activeCaseId;
  return useQuery({
    queryKey: ['reports', targetCaseId],
    queryFn: () => api.getReports(targetCaseId),
  });
}

export function useAuditLogs(filter?: string) {
  return useQuery({
    queryKey: ['audit-logs', filter],
    queryFn: () => api.getAuditLogs(filter),
  });
}

// Mutations
export function useCreateCaseMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.createInvestigation.bind(api),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['investigations'] });
    },
  });
}

export function useUploadEvidenceMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<Evidence>) => api.uploadEvidence(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['evidence'] });
    },
  });
}

export function useConfirmMergeMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ candidateId, notes }: { candidateId: string; notes?: string }) =>
      api.confirmMergeEntities(candidateId, notes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['resolution-candidates'] });
      queryClient.invalidateQueries({ queryKey: ['entities'] });
      queryClient.invalidateQueries({ queryKey: ['network-graph'] });
    },
  });
}

export function useRejectMergeMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ candidateId, notes }: { candidateId: string; notes?: string }) =>
      api.rejectMergeEntities(candidateId, notes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['resolution-candidates'] });
    },
  });
}

export function useQueryAIMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ caseId, promptText }: { caseId: string; promptText: string }) =>
      api.queryAI(caseId, promptText),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ai-findings'] });
    },
  });
}

export function useGenerateReportMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ caseId, type }: { caseId: string; type: IntelligenceReport['type'] }) =>
      api.generateReport(caseId, type),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reports'] });
    },
  });
}
