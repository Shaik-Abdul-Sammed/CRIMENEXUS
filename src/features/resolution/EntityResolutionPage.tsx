import { useState } from 'react';
import {
  GitMerge,
  CheckCircle2,
  XCircle,
  ShieldAlert,
  FileCheck2,
} from 'lucide-react';
import {
  useResolutionCandidates,
  useConfirmMergeMutation,
  useRejectMergeMutation,
} from '../../hooks/useIntelligenceApi';
import { Card, CardHeader, CardContent } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';

export function EntityResolutionPage() {
  const { data: candidates, isLoading } = useResolutionCandidates();
  const confirmMerge = useConfirmMergeMutation();
  const rejectMerge = useRejectMergeMutation();

  const [selectedCandidateId, setSelectedCandidateId] = useState<string | null>(null);
  const [actionType, setActionType] = useState<'CONFIRM' | 'REJECT' | null>(null);
  const [reviewNotes, setReviewNotes] = useState('');

  const handleActionClick = (id: string, type: 'CONFIRM' | 'REJECT') => {
    setSelectedCandidateId(id);
    setActionType(type);
    setReviewNotes('');
  };

  const handleExecuteAction = () => {
    if (!selectedCandidateId || !actionType) return;

    if (actionType === 'CONFIRM') {
      confirmMerge.mutate(
        { candidateId: selectedCandidateId, notes: reviewNotes },
        {
          onSuccess: () => {
            setSelectedCandidateId(null);
            setActionType(null);
          },
        }
      );
    } else {
      rejectMerge.mutate(
        { candidateId: selectedCandidateId, notes: reviewNotes },
        {
          onSuccess: () => {
            setSelectedCandidateId(null);
            setActionType(null);
          },
        }
      );
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-foreground flex items-center gap-2">
            <GitMerge className="h-6 w-6 text-amber-400" />
            Human-in-the-Loop Entity Resolution Engine
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Identify duplicate suspect profiles (e.g., &quot;Ramesh Kumar&quot; vs &quot;R. Kumar&quot;) with similarity scores and evidence matching.
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3 p-4 rounded-xl border border-amber-500/40 bg-amber-500/10 text-amber-300 text-xs">
        <ShieldAlert className="h-5 w-5 text-amber-400 shrink-0" />
        <div className="leading-relaxed">
          <span className="font-bold">STRICT HUMAN REVIEW MANDATE:</span> CRIMENEXUS entity resolution algorithms never merge duplicate entities silently or autonomously. All candidate matches require explicit review, notes logging, and approval by authorized investigators.
        </div>
      </div>

      {isLoading ? (
        <div className="p-12 text-center text-xs text-muted-foreground">Scanning candidate duplicate pairs...</div>
      ) : candidates?.length === 0 ? (
        <div className="p-12 text-center text-xs text-muted-foreground border border-dashed border-border rounded-xl">
          No pending duplicate entity candidates found.
        </div>
      ) : (
        <div className="space-y-6">
          {candidates?.map((candidate) => (
            <Card
              key={candidate.id}
              className={`border transition-all ${
                candidate.status === 'CONFIRMED'
                  ? 'border-emerald-500/40 bg-emerald-500/5'
                  : candidate.status === 'REJECTED'
                  ? 'border-destructive/40 bg-destructive/5'
                  : 'border-amber-500/40 bg-card'
              }`}
            >
              <CardHeader className="flex flex-row items-center justify-between">
                <div className="flex items-center gap-3">
                  <Badge
                    variant={
                      candidate.status === 'CONFIRMED'
                        ? 'success'
                        : candidate.status === 'REJECTED'
                        ? 'destructive'
                        : 'warning'
                    }
                  >
                    Status: {candidate.status}
                  </Badge>
                  <span className="text-xs font-mono text-muted-foreground">Candidate Pair #{candidate.id}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground font-semibold">Similarity Match:</span>
                  <span className="text-sm font-extrabold text-amber-400 font-mono">
                    {(candidate.similarityScore * 100).toFixed(0)}%
                  </span>
                </div>
              </CardHeader>

              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 rounded-xl bg-background/60 border border-border">
                  <div className="space-y-2 border-r border-border/40 pr-4">
                    <span className="text-[10px] font-bold text-primary uppercase tracking-wider block">
                      Primary Target Entity
                    </span>
                    <h4 className="text-base font-extrabold text-foreground">{candidate.primaryEntity.name}</h4>
                    <div className="space-y-1 text-xs text-muted-foreground">
                      <div>Type: <span className="font-semibold text-foreground">{candidate.primaryEntity.type}</span></div>
                      <div>Risk Level: <span className="font-semibold text-foreground">{candidate.primaryEntity.riskLevel}</span></div>
                      <div>Confidence: <span className="font-semibold text-foreground">{(candidate.primaryEntity.confidence * 100).toFixed(0)}%</span></div>
                    </div>
                  </div>

                  <div className="space-y-2 pl-2">
                    <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider block">
                      Candidate Duplicate Entity
                    </span>
                    <h4 className="text-base font-extrabold text-foreground">{candidate.candidateEntity.name}</h4>
                    <div className="space-y-1 text-xs text-muted-foreground">
                      <div>Type: <span className="font-semibold text-foreground">{candidate.candidateEntity.type}</span></div>
                      <div>Risk Level: <span className="font-semibold text-foreground">{candidate.candidateEntity.riskLevel}</span></div>
                      <div>Confidence: <span className="font-semibold text-foreground">{(candidate.candidateEntity.confidence * 100).toFixed(0)}%</span></div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div className="space-y-2">
                    <h5 className="font-bold text-foreground">Matching Attribute Overlaps</h5>
                    <div className="flex flex-wrap gap-1.5">
                      {candidate.matchingAttributes.map((attr) => (
                        <span
                          key={attr}
                          className="px-2.5 py-1 rounded bg-amber-500/10 text-amber-300 border border-amber-500/30 text-[11px] font-medium"
                        >
                          {attr}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h5 className="font-bold text-foreground">Supporting Evidence Ledger</h5>
                    <div className="flex items-center gap-2">
                      <FileCheck2 className="h-4 w-4 text-primary" />
                      <span className="text-muted-foreground">
                        Linked Artifacts: {candidate.supportingEvidenceIds.join(', ')}
                      </span>
                    </div>
                  </div>
                </div>

                {candidate.status === 'PENDING' && (
                  <div className="flex items-center justify-end gap-3 pt-4 border-t border-border/40">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleActionClick(candidate.id, 'REJECT')}
                      icon={<XCircle className="h-4 w-4 text-destructive" />}
                    >
                      Reject Duplicate Hypothesis
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => handleActionClick(candidate.id, 'CONFIRM')}
                      icon={<CheckCircle2 className="h-4 w-4" />}
                    >
                      Confirm Entity Merge
                    </Button>
                  </div>
                )}

                {candidate.status !== 'PENDING' && candidate.notes && (
                  <div className="p-3 rounded-lg bg-muted/40 border border-border text-xs text-muted-foreground">
                    <span className="font-bold text-foreground">Review Notes:</span> {candidate.notes}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Modal
        isOpen={Boolean(selectedCandidateId)}
        onClose={() => setSelectedCandidateId(null)}
        title={actionType === 'CONFIRM' ? 'Confirm Entity Merge' : 'Reject Duplicate Match'}
        description="Provide required audit notes for human investigator review recording."
      >
        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Investigator Review Notes & Rationale
            </label>
            <textarea
              rows={3}
              value={reviewNotes}
              onChange={(e) => setReviewNotes(e.target.value)}
              placeholder="Record reasoning, evidence corroboration, or reason for rejection..."
              className="w-full rounded-md border border-input bg-background p-2.5 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-border">
            <Button variant="ghost" onClick={() => setSelectedCandidateId(null)}>
              Cancel
            </Button>
            <Button
              variant={actionType === 'CONFIRM' ? 'primary' : 'danger'}
              onClick={handleExecuteAction}
              isLoading={confirmMerge.isPending || rejectMerge.isPending}
            >
              Submit Review Decision
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
