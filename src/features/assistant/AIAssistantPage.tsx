import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Bot,
  Sparkles,
  Send,
  ShieldAlert,
  FileCheck2,
  AlertTriangle,
} from 'lucide-react';
import { useAIFindings, useQueryAIMutation } from '../../hooks/useIntelligenceApi';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';

export function AIAssistantPage() {
  const [promptText, setPromptText] = useState('');
  const { data: findings, isLoading } = useAIFindings('ALL');
  const queryAIMutation = useQueryAIMutation();

  const presetQueries = [
    'Explain the connections found in this case',
    'Show the strongest documented relationships involving Person A',
    'What evidence connects Person A and Person B?',
    'Summarize the investigation timeline',
    'Which entities appear across multiple cases?',
  ];

  const handleSendQuery = (textToQuery?: string) => {
    const query = textToQuery || promptText;
    if (!query.trim()) return;

    queryAIMutation.mutate(
      { caseId: 'case-101', promptText: query },
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
        <div>
          <h1 className="text-xl font-extrabold text-foreground flex items-center gap-2">
            <Bot className="h-6 w-6 text-primary" />
            AI Investigation Assistant (Evidence-Grounded Local RAG)
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Query criminal network intelligence using local synthetic RAG abstraction. All findings are backed by verified evidence ledger files.
          </p>
        </div>
      </div>

      {/* Mandatory Disclaimer */}
      <div className="flex items-center gap-3 p-4 rounded-xl border border-amber-500/40 bg-amber-500/10 text-amber-300 text-xs font-semibold">
        <ShieldAlert className="h-5 w-5 text-amber-400 shrink-0" />
        <div className="leading-relaxed">
          <span className="font-bold uppercase tracking-wider">Investigative Assistance Guarantee:</span> AI analysis is investigative assistance and does not determine guilt or innocence. AI results must be reviewed and verified by a qualified investigator before legal action.
        </div>
      </div>

      {/* Query Bar & Presets */}
      <Card className="border-primary/40 bg-gradient-to-r from-card via-card to-primary/5">
        <CardContent className="p-6 space-y-4">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            <h3 className="font-bold text-sm text-foreground">Submit Natural Language RAG Query</h3>
          </div>

          <div className="flex gap-2">
            <Input
              value={promptText}
              onChange={(e) => setPromptText(e.target.value)}
              placeholder="Ask AI assistant (e.g., 'Explain the connections found in this case')..."
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
              Suggested Investigative Queries:
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
            {findings?.map((item) => (
              <Card key={item.id} className="border-primary/20 hover:border-primary/50 transition-all">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-amber-400" />
                    <CardTitle className="text-base">{item.title}</CardTitle>
                  </div>
                  <Badge variant={item.confidence > 0.9 ? 'success' : 'warning'}>
                    {(item.confidence * 100).toFixed(0)}% Confidence
                  </Badge>
                </CardHeader>

                <CardContent className="space-y-4 text-xs">
                  {item.queryText && (
                    <div className="p-2.5 rounded-lg bg-background/50 border border-border/50 text-muted-foreground">
                      <span className="font-bold text-foreground">Query Prompt:</span> &quot;{item.queryText}&quot;
                    </div>
                  )}

                  <p className="text-foreground text-sm leading-relaxed bg-primary/5 p-3 rounded-xl border border-primary/10">
                    {item.finding}
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-border/40 text-[11px]">
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
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-border/40 text-[10px] text-muted-foreground">
                    <span>Generated: {new Date(item.timestamp).toLocaleString()}</span>
                    <Link to="/evidence" className="text-primary font-semibold hover:underline flex items-center gap-1">
                      View Evidence Source Ledger &rarr;
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
