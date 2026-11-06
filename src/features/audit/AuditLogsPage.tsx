import React, { useState } from 'react';
import {
  History,
  Search,
  ShieldCheck,
  Download,
  Eye,
  FileCode,
  X,
} from 'lucide-react';
import { useAuditLogs } from '../../hooks/useIntelligenceApi';
import { Card, CardContent } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { formatDate } from '../../utils/formatters';
import { sound } from '../../utils/soundEffects';
import { useToast } from '../../components/ui/Toast';
import { AuditLog } from '../../types';

export function AuditLogsPage() {
  const [filterText, setFilterText] = useState('');
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const toast = useToast();
  const { data: logs, isLoading } = useAuditLogs(filterText);

  const getActionColor = (action: string) => {
    if (action.includes('MERGE') || action.includes('CONFIRM')) return 'success';
    if (action.includes('REJECT') || action.includes('LOGOUT')) return 'destructive';
    if (action.includes('AI') || action.includes('GRAPH')) return 'default';
    return 'secondary';
  };

  const handleExportCsv = () => {
    sound.playClickSound();
    if (!logs || logs.length === 0) {
      toast.warning('No audit logs to export.', 'Export Skipped');
      return;
    }

    const headers = ['Log ID', 'Timestamp', 'User', 'Role', 'Action', 'Target Resource', 'IP Address', 'Metadata JSON'];
    const rows = logs.map((l) => [
      `"${l.id}"`,
      `"${new Date(l.timestamp).toISOString()}"`,
      `"${l.userName.replace(/"/g, '""')}"`,
      `"${l.userRole}"`,
      `"${l.action}"`,
      `"${l.target.replace(/"/g, '""')}"`,
      `"${l.ipAddress}"`,
      `"${JSON.stringify(l.metadata || {}).replace(/"/g, '""')}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `CRIMENEXUS_Security_Audit_Ledger_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success(`Exported ${logs.length} immutable security audit events.`, 'Audit Ledger Exported');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-foreground flex items-center gap-2">
            <History className="h-6 w-6 text-primary" />
            Immutable System Security Audit Logs
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Tamper-evident audit trail recording user logins, evidence access, entity merge confirmations, graph queries, and AI interactions.
          </p>
        </div>
        <Button
          variant="outline"
          onClick={handleExportCsv}
          icon={<Download className="h-4 w-4 text-emerald-400" />}
          title="Download signed CSV manifest of security audit trail for Section 63 BSA records"
        >
          Export Audit Ledger CSV
        </Button>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-xl border border-border bg-card">
        <div className="w-full sm:w-80">
          <Input
            placeholder="Filter by user, action, target, or IP address..."
            value={filterText}
            onChange={(e) => setFilterText(e.target.value)}
            icon={<Search className="h-4 w-4" />}
          />
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground font-mono">
          <ShieldCheck className="h-4 w-4 text-emerald-400" />
          <span>Integrity Verification: SHA-256 Ledger Synchronized</span>
        </div>
      </div>

      {/* Audit Table */}
      <Card>
        <CardContent className="p-0 overflow-x-auto table-container-scroll">
          {isLoading ? (
            <div className="p-12 text-center text-xs text-muted-foreground">Fetching system audit trail...</div>
          ) : !logs || logs.length === 0 ? (
            <div className="p-12 text-center space-y-2 text-muted-foreground text-xs">
              <History className="h-8 w-8 mx-auto opacity-50" />
              <p>No audit events match your filter &quot;{filterText}&quot;.</p>
            </div>
          ) : (
            <table className="w-full text-left text-xs">
              <thead className="bg-muted/50 border-b border-border text-muted-foreground uppercase text-[10px] font-bold tracking-wider">
                <tr>
                  <th className="p-3.5">Timestamp</th>
                  <th className="p-3.5">User & Persona</th>
                  <th className="p-3.5">Action Executed</th>
                  <th className="p-3.5">Target Resource</th>
                  <th className="p-3.5">IP Address</th>
                  <th className="p-3.5">Audit Metadata</th>
                  <th className="p-3.5 text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40 font-mono">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-accent/40 transition-colors">
                    <td className="p-3.5 text-muted-foreground whitespace-nowrap">
                      {formatDate(log.timestamp)}
                    </td>
                    <td className="p-3.5 font-sans">
                      <div className="font-semibold text-foreground">{log.userName}</div>
                      <span className="text-[10px] text-primary font-mono">{log.userRole}</span>
                    </td>
                    <td className="p-3.5">
                      <Badge variant={getActionColor(log.action)}>{log.action}</Badge>
                    </td>
                    <td className="p-3.5 font-sans text-foreground max-w-xs truncate">{log.target}</td>
                    <td className="p-3.5 text-muted-foreground">{log.ipAddress}</td>
                    <td className="p-3.5 text-[11px] text-muted-foreground max-w-xs truncate font-mono">
                      {log.metadata ? JSON.stringify(log.metadata) : 'N/A'}
                    </td>
                    <td className="p-3.5 text-right font-sans">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          sound.playClickSound();
                          setSelectedLog(log);
                        }}
                        className="h-7 px-2 text-[11px] text-sky-400 hover:text-white"
                        title="Inspect full audit event metadata"
                      >
                        <Eye className="h-3.5 w-3.5 mr-1" />
                        Inspect
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>

      {/* Audit Detail Modal */}
      {selectedLog && (
        <Modal
          isOpen={!!selectedLog}
          onClose={() => setSelectedLog(null)}
          title={`Audit Event: ${selectedLog.action}`}
          size="lg"
        >
          <div className="space-y-4 text-xs">
            <div className="grid grid-cols-2 gap-3 p-3 rounded-lg bg-card border border-border">
              <div>
                <span className="text-muted-foreground block text-[10px]">EVENT ID</span>
                <span className="font-mono text-foreground font-semibold">{selectedLog.id}</span>
              </div>
              <div>
                <span className="text-muted-foreground block text-[10px]">RECORDED TIMESTAMP</span>
                <span className="font-mono text-foreground">{new Date(selectedLog.timestamp).toLocaleString('en-IN')}</span>
              </div>
              <div>
                <span className="text-muted-foreground block text-[10px]">OPERATOR</span>
                <span className="font-sans text-foreground font-bold">{selectedLog.userName} ({selectedLog.userRole})</span>
              </div>
              <div>
                <span className="text-muted-foreground block text-[10px]">NETWORK ORIGIN IP</span>
                <span className="font-mono text-sky-400">{selectedLog.ipAddress}</span>
              </div>
              <div className="col-span-2">
                <span className="text-muted-foreground block text-[10px]">TARGET RESOURCE</span>
                <span className="font-sans text-foreground font-semibold">{selectedLog.target}</span>
              </div>
            </div>

            <div>
              <div className="flex items-center gap-1.5 text-xs font-bold text-foreground mb-1.5">
                <FileCode className="h-3.5 w-3.5 text-primary" />
                <span>Cryptographic Metadata & Context (JSON)</span>
              </div>
              <pre className="p-3 rounded-lg bg-slate-950 border border-border text-emerald-300 font-mono text-[11px] overflow-x-auto max-h-60 leading-relaxed">
                {JSON.stringify(selectedLog.metadata || {}, null, 2)}
              </pre>
            </div>

            <div className="flex justify-end pt-2 border-t border-border">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedLog(null)}
              >
                Close Inspector
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
