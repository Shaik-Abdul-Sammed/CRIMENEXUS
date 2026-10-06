import React from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  ShieldCheck,
  Download,
  Eye,
  FileText,
  User,
} from 'lucide-react';
import { useEvidenceDetail, useEntities } from '../../hooks/useIntelligenceApi';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { formatDate } from '../../utils/formatters';

export function EvidenceDetailPage() {
  const { id = 'ev-101' } = useParams<{ id: string }>();
  const { data: item, isLoading } = useEvidenceDetail(id);
  const { data: allEntities } = useEntities('ALL');

  if (isLoading) {
    return <div className="p-12 text-center text-xs text-muted-foreground">Loading artifact details...</div>;
  }

  if (!item) {
    return <div className="p-12 text-center text-xs text-muted-foreground">Evidence artifact not found.</div>;
  }

  const linkedEntities = allEntities?.filter((e) => item.linkedEntityIds.includes(e.id)) || [];

  return (
    <div className="space-y-6">
      <Link to="/evidence">
        <Button size="sm" variant="ghost" icon={<ArrowLeft className="h-4 w-4" />}>
          Back to Evidence Vault
        </Button>
      </Link>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-2xl border border-primary/30 bg-card">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <span className="font-mono text-sm font-extrabold text-primary px-2.5 py-0.5 rounded bg-primary/10 border border-primary/30">
              {item.evidenceNumber}
            </span>
            <Badge variant="success">{item.processingStatus}</Badge>
            <Badge variant="outline">{item.type}</Badge>
          </div>
          <h1 className="text-2xl font-extrabold text-foreground">{item.title}</h1>
          <p className="text-xs text-muted-foreground">{item.description}</p>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" icon={<Download className="h-4 w-4" />}>
            Export Hash Ledger
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Cryptographic Viewer Placeholder & Metadata */}
        <div className="lg:col-span-2 space-y-6">
          {/* Artifact Viewer Placeholder */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-sm flex items-center gap-2">
                <Eye className="h-4 w-4 text-primary" />
                Secure Digital Forensic Viewer Placeholder
              </CardTitle>
              <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/30">
                VERIFIED HASH MATCH
              </span>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="h-72 rounded-xl border border-border bg-slate-950 flex flex-col items-center justify-center p-6 text-center space-y-3 font-mono">
                <FileText className="h-12 w-12 text-primary opacity-60" />
                <div className="space-y-1">
                  <p className="text-xs text-slate-300 font-bold">Artifact Preview: {item.evidenceNumber}</p>
                  <p className="text-[11px] text-slate-500">Source: {item.source} ({item.sourceReference})</p>
                </div>
                <div className="p-3 rounded bg-slate-900 border border-slate-800 text-[10px] text-slate-400 max-w-md break-all">
                  SHA-256 Digest: {item.hash}
                </div>
              </div>

              {/* Extraction Metadata */}
              <div className="space-y-2">
                <h4 className="font-semibold text-xs text-foreground uppercase tracking-wider">Extracted Attributes & Metadata</h4>
                <div className="grid grid-cols-2 gap-3 p-3 rounded-lg border border-border bg-background/50 text-xs">
                  {Object.entries(item.metadata || {}).map(([k, v]) => (
                    <div key={k} className="flex justify-between border-b border-border/40 pb-1">
                      <span className="text-muted-foreground capitalize">{k.replace(/([A-Z])/g, ' $1')}:</span>
                      <span className="font-semibold text-foreground">{String(v)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right 1 Col: Chain of Custody & Linked Entities */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-emerald-400" />
                Chain of Custody Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-xs">
              <div className="flex justify-between py-1.5 border-b border-border/40">
                <span className="text-muted-foreground">Original Agency:</span>
                <span className="font-semibold text-foreground">{item.source}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-border/40">
                <span className="text-muted-foreground">Official Ref #:</span>
                <span className="font-mono text-foreground">{item.sourceReference}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-border/40">
                <span className="text-muted-foreground">Uploading Agent:</span>
                <span className="text-foreground">{item.uploadedBy}</span>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="text-muted-foreground">Timestamp Logged:</span>
                <span className="text-foreground">{formatDate(item.timestamp)}</span>
              </div>
            </CardContent>
          </Card>

          {/* Linked Entities */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Linked Entities ({linkedEntities.length})</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {linkedEntities.map((e) => (
                <Link
                  key={e.id}
                  to={`/entities/${e.id}`}
                  className="flex items-center justify-between p-2.5 rounded-lg border border-border hover:border-primary/40 bg-background/50 transition-all text-xs"
                >
                  <div className="flex items-center gap-2">
                    <User className="h-3.5 w-3.5 text-primary" />
                    <span className="font-semibold text-foreground">{e.name}</span>
                  </div>
                  <Badge variant="outline">{e.type}</Badge>
                </Link>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
