import React from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  ShieldCheck,
  Network,
  FileCheck2,
} from 'lucide-react';
import { useEntityDetail, useNetworkGraph, useCaseEvidence } from '../../hooks/useIntelligenceApi';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { getRiskColorClass } from '../../utils/formatters';

export function EntityDetailPage() {
  const { id = 'ent-1' } = useParams<{ id: string }>();
  const { data: entity, isLoading } = useEntityDetail(id);
  const { data: network } = useNetworkGraph('ALL');
  const { data: evidenceList } = useCaseEvidence('ALL');

  if (isLoading) {
    return <div className="p-12 text-center text-xs text-muted-foreground">Loading entity dossier...</div>;
  }

  if (!entity) {
    return <div className="p-12 text-center text-xs text-muted-foreground">Entity not found.</div>;
  }

  const linkedRelationships =
    network?.edges.filter((r) => r.sourceEntityId === entity.id || r.targetEntityId === entity.id) || [];

  const linkedEvidence = evidenceList?.filter((ev) => ev.linkedEntityIds.includes(entity.id)) || [];

  return (
    <div className="space-y-6">
      <Link to="/entities">
        <Button size="sm" variant="ghost" icon={<ArrowLeft className="h-4 w-4" />}>
          Back to Entity Directory
        </Button>
      </Link>

      {/* Header Dossier Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-2xl border border-primary/30 bg-gradient-to-r from-card via-card to-primary/10">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <Badge variant="outline">{entity.type}</Badge>
            <span className={`text-xs px-2.5 py-0.5 rounded border font-semibold ${getRiskColorClass(entity.riskLevel)}`}>
              {entity.riskLevel} Risk Level
            </span>
            <Badge variant={entity.reviewStatus === 'VERIFIED' ? 'success' : 'warning'}>{entity.reviewStatus}</Badge>
          </div>
          <h1 className="text-2xl font-extrabold text-foreground">{entity.name}</h1>
          {entity.notes && <p className="text-xs text-muted-foreground max-w-2xl">{entity.notes}</p>}
        </div>

        <div className="flex gap-2 shrink-0">
          <Link to="/network-graph">
            <Button icon={<Network className="h-4 w-4" />}>Focus on Graph</Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Attributes & Relationships */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Entity Attributes & Telemetry</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              {Object.entries(entity.attributes).map(([key, val]) => (
                <div key={key} className="p-3 rounded-lg border border-border bg-background/50 flex justify-between">
                  <span className="text-muted-foreground capitalize font-medium">{key}:</span>
                  <span className="font-semibold text-foreground">{String(val)}</span>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <Network className="h-4 w-4 text-primary" />
                Direct Network Connections ({linkedRelationships.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-xs">
              {linkedRelationships.length === 0 ? (
                <div className="text-muted-foreground p-4 text-center">No direct network relationships logged.</div>
              ) : (
                linkedRelationships.map((r) => {
                  const targetName = r.sourceEntityId === entity.id ? r.targetEntityName : r.sourceEntityName;
                  return (
                    <div
                      key={r.id}
                      className="p-3 rounded-lg border border-border bg-background/50 flex items-center justify-between"
                    >
                      <div>
                        <span className="font-mono text-primary font-bold">{r.type}</span>
                        <span className="text-muted-foreground mx-2">&rarr;</span>
                        <span className="font-bold text-foreground">{targetName}</span>
                      </div>
                      <Badge variant="outline">{(r.confidenceScore * 100).toFixed(0)}% Confidence</Badge>
                    </div>
                  );
                })
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right 1 Col: Confidence & Evidence */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-primary" />
                Confidence & Verification
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-xs">
              <div className="p-4 rounded-xl bg-primary/10 border border-primary/20 text-center space-y-1">
                <span className="text-2xl font-extrabold text-primary">{(entity.confidence * 100).toFixed(0)}%</span>
                <span className="text-muted-foreground block text-[11px]">Extraction Confidence Score</span>
              </div>
              <p className="text-muted-foreground leading-relaxed">
                Extracted automatically from cryptographically cataloged evidence files. Verified by assigned investigator.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <FileCheck2 className="h-4 w-4 text-primary" />
                Linked Evidence Artifacts ({linkedEvidence.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-xs">
              {linkedEvidence.length === 0 ? (
                <div className="text-muted-foreground p-3 text-center">No direct evidence linked.</div>
              ) : (
                linkedEvidence.map((ev) => (
                  <Link
                    key={ev.id}
                    to={`/evidence/${ev.id}`}
                    className="p-2.5 rounded-lg border border-border bg-background/50 hover:bg-accent flex items-center justify-between transition-colors"
                  >
                    <div>
                      <span className="font-semibold text-foreground block truncate max-w-[160px]">{ev.title}</span>
                      <span className="text-[10px] text-muted-foreground font-mono">{ev.evidenceNumber}</span>
                    </div>
                    <Badge variant="outline">{ev.type}</Badge>
                  </Link>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
