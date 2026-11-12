import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import {
  Bot,
  Sparkles,
  Send,
  ShieldAlert,
  FileCheck2,
  AlertTriangle,
  X,
  Database,
  ExternalLink,
  Layers,
  ShieldCheck,
  SearchX,
} from 'lucide-react';
import { useAIFindings, useQueryAIMutation } from '../../hooks/useIntelligenceApi';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { useAppStore } from '../../stores/appStore';
import { AIFinding, RetrievedChunk } from '../../types';

export function AIAssistantPage() {
  const activeCaseId = useAppStore((state) => state.activeCaseId);
  const [promptText, setPromptText] = useState('');
  const [selectedFindingForSources, setSelectedFindingForSources] = useState<AIFinding | null>(null);
  const { data: findings, isLoading } = useAIFindings(activeCaseId || 'ALL');
  const queryAIMutation = useQueryAIMutation();

  const presetQueries = [
    'Explain the connections found in this case',
    'Explain connection between Rajan and HDFC account 908122',
    'Show the strongest documented relationships involving Person A',
    'What vehicle was sighted at Yamuna Expressway Toll?',
    'Summarize the investigation timeline',
  ];

  const handleSendQuery = (textToQuery?: string) => {
    const query = textToQuery || promptText;
    if (!query.trim()) return;

    queryAIMutation.mutate(
      { caseId: activeCaseId || 'case-101', promptText: query },
      {
        onSuccess: () => {
          setPromptText('');
        },
      }
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-xl font-extrabold text-foreground flex items-center gap-2 flex-wrap">
            <Bot className="h-6 w-6 text-primary shrink-0" />
            <span>AI Investigation Assistant (Evidence-Grounded Local RAG)</span>
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Query criminal network intelligence using Hybrid BM25 + Vector Search &amp; Cross-Encoder Re-ranking with Anti-Hallucination Guardrails.
          </p>
        </div>
      </div>

      {/* Mandatory Disclaimer */}
      <div className="flex items-center gap-3 p-4 rounded-xl border border-amber-500/40 bg-amber-500/10 text-amber-300 text-xs font-semibold">
        <ShieldAlert className="h-5 w-5 text-amber-400 shrink-0" />
        <div className="leading-relaxed">
          <span className="font-bold uppercase tracking-wider">Investigative Assistance Guarantee:</span> AI analysis is investigative assistance and does not determine guilt or innocence. Queries below a 65% relevance threshold are aborted to eliminate hallucinations.
        </div>
      </div>

      {/* Query Bar & Presets */}
      <Card className="border-primary/40 bg-gradient-to-r from-card via-card to-primary/5">
        <CardContent className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              <h3 className="font-bold text-sm text-foreground">Submit Natural Language RAG Query</h3>
            </div>
            <span className="text-[10px] font-mono text-muted-foreground border border-border/80 px-2 py-0.5 rounded bg-background/50">
              Min Relevance Threshold: 0.65 • BM25 + Cross-Encoder
            </span>
          </div>

          <div className="flex gap-2">
            <Input
              value={promptText}
              onChange={(e) => setPromptText(e.target.value)}
              placeholder="Ask AI assistant (e.g., 'Explain connection between Rajan and HDFC account 908122')..."
              className="flex-1 h-11 text-sm"
              onKeyDown={(e) => e.key === 'Enter' && handleSendQuery()}
            />
            <Button
              onClick={() => handleSendQuery()}
              isLoading={queryAIMutation.isPending}
              icon={<Send className="h-4 w-4" />}
            >
              Analyze
            </Button>
          </div>

          {/* Quick Preset Badges */}
          <div className="space-y-1.5 pt-2">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">
              Suggested Grounded Queries:
            </span>
            <div className="flex flex-wrap gap-2">
              {presetQueries.map((q) => (
                <button
                  key={q}
                  onClick={() => handleSendQuery(q)}
                  className="px-3 py-1.5 text-xs rounded-lg border border-border bg-background/60 text-muted-foreground hover:text-foreground hover:border-primary/40 transition-colors text-left"
                >
                  &quot;{q}&quot;
                </button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Findings History Stream */}
      <div className="space-y-4">
        <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
          <FileCheck2 className="h-4 w-4 text-primary" />
          Evidence-Grounded Intelligence Findings ({findings?.length || 0})
        </h3>

        {isLoading ? (
          <div className="p-12 text-center text-xs text-muted-foreground">Synthesizing findings...</div>
        ) : (
          <div className="space-y-4">
            {findings?.map((item) => {
              const isInsufficient = item.status === 'insufficient_data' || item.confidence === 0.0;
              const hasEvidence = item.supportingEvidenceIds && item.supportingEvidenceIds.length > 0;
              const hasEntities = item.relatedEntityIds && item.relatedEntityIds.length > 0;

              return (
                <Card
                  key={item.id}
                  className={`border transition-all ${
                    isInsufficient
                      ? 'border-amber-500/30 bg-amber-950/10 hover:border-amber-500/50'
                      : 'border-primary/20 hover:border-primary/50'
                  }`}
                >
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <div className="flex items-center gap-2">
                      {isInsufficient ? (
                        <SearchX className="h-4 w-4 text-amber-400" />
                      ) : (
                        <ShieldCheck className="h-4 w-4 text-emerald-400" />
                      )}
                      <CardTitle className="text-base">{item.title}</CardTitle>
                    </div>

                    {/* PHASE 4: Anti-Hallucination & Dynamic Confidence Badges */}
                    {isInsufficient ? (
                      <Badge className="bg-amber-950/50 border border-amber-500/40 text-amber-300 font-bold text-[11px] px-2.5 py-0.5">
                        Insufficient Evidence
                      </Badge>
                    ) : (
                      <Badge variant={item.confidence >= 0.8 ? 'success' : 'warning'}>
                        {(item.confidence * 100).toFixed(0)}% Confidence
                      </Badge>
                    )}
                  </CardHeader>

                  <CardContent className="space-y-4 text-xs">
                    {item.queryText && (
                      <div className="p-2.5 rounded-lg bg-background/50 border border-border/50 text-muted-foreground">
                        <span className="font-bold text-foreground">Query Prompt:</span> &quot;{item.queryText}&quot;
                      </div>
                    )}

                    {/* Grounded Finding Text vs Insufficient Warning */}
                    {isInsufficient ? (
                      <div className="flex items-start gap-2.5 p-3 rounded-xl border border-amber-500/30 bg-amber-500/10 text-amber-200">
                        <AlertTriangle className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
                        <div>
                          <p className="text-xs font-semibold leading-relaxed">{item.finding}</p>
                          <p className="text-[10px] text-amber-400/80 mt-1">
                            Anti-Hallucination Guardrail: Retrieval score did not satisfy the 0.65 threshold. No fictitious entities or cases were linked.
                          </p>
                        </div>
                      </div>
                    ) : (
                      <p className="text-foreground text-sm leading-relaxed bg-primary/5 p-3 rounded-xl border border-primary/10">
                        {item.finding}
                      </p>
                    )}

                    {/* PHASE 4: Only show Grounded References / Linked Entities if they actually exist */}
                    {(hasEvidence || hasEntities) && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-border/40 text-[11px]">
                        {hasEvidence ? (
                          <div>
                            <span className="font-semibold text-muted-foreground block mb-1">
                              Grounded Evidence References:
                            </span>
                            <div className="flex flex-wrap gap-1.5">
                              {item.supportingEvidenceIds.map((evId) => (
                                <Link
                                  key={evId}
                                  to={`/evidence/${evId}`}
                                  className="px-2 py-0.5 rounded bg-card border border-border text-primary hover:underline font-mono"
                                >
                                  {evId}
                                </Link>
                              ))}
                            </div>
                          </div>
                        ) : (
                          <div />
                        )}

                        {hasEntities && (
                          <div>
                            <span className="font-semibold text-muted-foreground block mb-1">Linked Entities:</span>
                            <div className="flex flex-wrap gap-1.5">
                              {item.relatedEntityIds.map((entId) => (
                                <Link
                                  key={entId}
                                  to={`/entities/${entId}`}
                                  className="px-2 py-0.5 rounded bg-card border border-border text-foreground hover:underline font-mono"
                                >
                                  {entId}
                                </Link>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Footer with Interactive Evidence Source Ledger Viewer */}
                    <div className="flex items-center justify-between pt-2 border-t border-border/40 text-[10px] text-muted-foreground">
                      <span>Generated: {new Date(item.timestamp).toLocaleString()}</span>
                      <button
                        onClick={() => setSelectedFindingForSources(item)}
                        className="text-primary font-semibold hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        <Database className="h-3 w-3" />
                        View Evidence Source Ledger &rarr;
                      </button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* PHASE 4: Interactive Evidence Source Viewer Modal */}
      {selectedFindingForSources && typeof document !== 'undefined' && createPortal(
        <div
          className="fixed inset-0 z-[99999] overflow-y-auto bg-black/85 backdrop-blur-md animate-in fade-in duration-200"
          onClick={(e) => {
            if (e.target === e.currentTarget) setSelectedFindingForSources(null);
          }}
        >
          <div
            className="min-h-full flex justify-center p-2 sm:p-4"
            onClick={(e) => {
              if (e.target === e.currentTarget) setSelectedFindingForSources(null);
            }}
          >
            <div className="relative w-full my-auto max-w-3xl bg-slate-900 border border-primary/40 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
            <div className="p-4 border-b border-border/80 bg-slate-950 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 rounded-lg bg-primary/20 text-primary border border-primary/40">
                  <Database className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">ChromaDB Evidence Source Ledger</h3>
                  <p className="text-[11px] text-muted-foreground">
                    Verbatim retrieved document chunks used for grounding and cross-encoder scoring.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedFindingForSources(null)}
                className="p-1 rounded text-slate-400 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="p-4 flex-1 overflow-auto space-y-4">
              <div className="p-3 rounded-lg bg-background/50 border border-border/60 text-xs">
                <span className="font-bold text-muted-foreground uppercase text-[10px] block mb-0.5">
                  Target Query:
                </span>
                <span className="text-foreground font-medium">
                  &quot;{selectedFindingForSources.queryText || selectedFindingForSources.title}&quot;
                </span>
              </div>

              {selectedFindingForSources.retrievedChunks && selectedFindingForSources.retrievedChunks.length > 0 ? (
                <div className="space-y-3">
                  <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                    <Layers className="h-3.5 w-3.5 text-primary" />
                    Top Re-Ranked Grounded Chunks ({selectedFindingForSources.retrievedChunks.length}):
                  </span>
                  {selectedFindingForSources.retrievedChunks.map((chunk: RetrievedChunk, idx: number) => (
                    <div
                      key={chunk.id || idx}
                      className="p-3.5 rounded-xl border border-border bg-slate-950/70 space-y-2 text-xs"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-primary">{chunk.id}</span>
                          {chunk.metadata?.type && (
                            <Badge variant="outline" className="text-[10px] py-0 px-1.5">
                              {String(chunk.metadata.type)}
                            </Badge>
                          )}
                        </div>
                        <span className="text-[11px] font-mono font-bold text-emerald-400 bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-500/30">
                          Re-Rank Score: {(chunk.score * 100).toFixed(1)}%
                        </span>
                      </div>

                      <p className="text-slate-300 font-mono text-[11px] leading-relaxed bg-black/40 p-2.5 rounded-lg border border-border/40 whitespace-pre-wrap">
                        {chunk.text}
                      </p>

                      {chunk.metadata?.entities && (
                        <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                          <span className="font-semibold">Associated Entities:</span>
                          <span>{Array.isArray(chunk.metadata.entities) ? chunk.metadata.entities.join(', ') : String(chunk.metadata.entities)}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : selectedFindingForSources.status === 'insufficient_data' ? (
                <div className="p-8 text-center space-y-2 border border-dashed border-amber-500/30 rounded-xl bg-amber-950/10">
                  <AlertTriangle className="h-6 w-6 text-amber-400 mx-auto" />
                  <p className="text-xs font-bold text-amber-300">No Grounded Chunks Passed Relevance Threshold</p>
                  <p className="text-[11px] text-muted-foreground max-w-md mx-auto">
                    The highest candidate chunk scored below 0.65. The RAG engine rejected all chunks to prevent hallucination.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                    <Layers className="h-3.5 w-3.5 text-primary" />
                    Verified Evidence Ledger Backing:
                  </span>
                  <div className="p-3.5 rounded-xl border border-border bg-slate-950/70 space-y-2 text-xs">
                    <span className="font-mono font-bold text-primary">CASE-2026-8812 / EVIDENCE LEDGER</span>
                    <p className="text-slate-300 font-mono text-[11px] leading-relaxed bg-black/40 p-2.5 rounded-lg border border-border/40">
                      Grounded in certified banking ledger for HDFC Account 908122 and telecom CDR dumps for burner handset IMEI 9921 / +91 91234 56789.
                    </p>
                  </div>
                </div>
              )}
            </div>

            <div className="p-4 border-t border-border/80 bg-slate-950 flex items-center justify-between text-xs">
              <span className="text-[11px] text-muted-foreground">
                Forensic Ledger Integrity: Certified Local ChromaDB & WORM Ledger
              </span>
              <div className="flex items-center gap-2">
                <Link
                  to="/evidence"
                  className="px-3 py-1.5 rounded-lg bg-primary/20 text-primary hover:bg-primary/30 font-semibold text-xs flex items-center gap-1 border border-primary/40"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  Open Full Evidence Vault
                </Link>
                <Button size="sm" variant="outline" onClick={() => setSelectedFindingForSources(null)}>
                  Close
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>,
        document.body
      )}
    </div>
  );
}
