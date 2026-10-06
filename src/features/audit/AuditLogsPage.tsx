import React, { useState } from 'react';
import {
  History,
  Search,
  ShieldCheck,
} from 'lucide-react';
import { useAuditLogs } from '../../hooks/useIntelligenceApi';
import { Card, CardContent } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Input } from '../../components/ui/Input';
import { formatDate } from '../../utils/formatters';

export function AuditLogsPage() {
  const [filterText, setFilterText] = useState('');
  const { data: logs, isLoading } = useAuditLogs(filterText);

  const getActionColor = (action: string) => {
    if (action.includes('MERGE') || action.includes('CONFIRM')) return 'success';
    if (action.includes('REJECT') || action.includes('LOGOUT')) return 'destructive';
    if (action.includes('AI') || action.includes('GRAPH')) return 'default';
    return 'secondary';
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
        <CardContent className="p-0 overflow-x-auto">
          {isLoading ? (
            <div className="p-12 text-center text-xs text-muted-foreground">Fetching system audit trail...</div>
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
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40 font-mono">
                {logs?.map((log) => (
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
                    <td className="p-3.5 text-[11px] text-muted-foreground max-w-xs truncate">
                      {log.metadata ? JSON.stringify(log.metadata) : 'N/A'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
