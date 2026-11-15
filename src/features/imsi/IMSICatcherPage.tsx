import React, { useState, useEffect } from 'react';
import {
  RadioTower,
  ShieldCheck,
  Lock,
  Clock,
  AlertTriangle,
  RefreshCw,
  Plus,
  Trash2,
  FileCheck,
  CheckCircle2
} from 'lucide-react';

interface IMSISession {
  session_id: string;
  operation_name: string;
  target_imsi: string;
  warrant_number: string;
  approving_authority: string;
  statutory_basis: string;
  start_time: string;
  expires_at: string;
  hours_remaining: number;
  total_handsets_detected: number;
  bystanders_masked_count: number;
  target_hits_recorded: number;
  audit_hash: string;
  status: string;
}

export const IMSICatcherPage: React.FC = () => {
  const [sessions, setSessions] = useState<IMSISession[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState<boolean>(false);
  const [operationName, setOperationName] = useState<string>('');
  const [targetImsi, setTargetImsi] = useState<string>('');
  const [warrantNo, setWarrantNo] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [purgeSuccess, setPurgeSuccess] = useState<string | null>(null);

  const fetchSessions = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/v1/imsi/sessions');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setSessions(data.sessions || []);
    } catch (err: any) {
      setError(err.message || 'Error communicating with Cell-Site Simulator controller');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, []);

  const handleCreateSession = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!operationName || !targetImsi || !warrantNo) return;
    setSubmitting(true);
    try {
      const res = await fetch('/api/v1/imsi/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          operation_name: operationName,
          target_imsi: targetImsi,
          warrant_number: warrantNo,
          location_polygon: 'NCR-POLYGON-DEL-01',
          authorized_duration_hours: 72
        })
      });
      if (res.ok) {
        setShowModal(false);
        setOperationName('');
        setTargetImsi('');
        setWarrantNo('');
        fetchSessions();
      }
    } catch (err: any) {
      setError(err.message || 'Authorization failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handlePurge = async () => {
    try {
      const res = await fetch('/api/v1/imsi/purge-expired', { method: 'POST' });
      if (res.ok) {
        const json = await res.json();
        setPurgeSuccess(`Purge verified: ${json.purged_sessions_count} expired session metadata destroyed.`);
        fetchSessions();
        setTimeout(() => setPurgeSuccess(null), 4000);
      }
    } catch (err: any) {
      setError('Purge operation failed');
    }
  };

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto min-w-0">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/40 pb-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <RadioTower className="w-7 h-7 text-indigo-400 shrink-0" />
            <h1 className="text-xl md:text-2xl font-bold tracking-tight text-foreground overflow-hidden text-ellipsis whitespace-nowrap" title="Cell-Site Simulator (IMSI Catcher) Oversight & Audit">
              Cell-Site Simulator (IMSI Catcher) Oversight
            </h1>
          </div>
          <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
            Constitutional compliance ledger enforcing Sec 5(2) Telegraph Act dual-custody warrant approvals, automated 72-hour bystander metadata purge, and SHA-256 audit chaining.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={handlePurge}
            className="flex items-center gap-1.5 px-3 py-2 bg-destructive/10 text-destructive hover:bg-destructive/20 rounded-lg text-xs font-semibold border border-destructive/30 transition-all whitespace-nowrap shrink-0"
            title="Execute 72-Hour Data Purge"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Purge Expired
          </button>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-1.5 px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold transition-colors whitespace-nowrap shrink-0"
          >
            <Plus className="w-3.5 h-3.5" />
            New Warrant Authorization
          </button>
        </div>
      </div>

      {purgeSuccess && (
        <div className="p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-sm flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <span className="overflow-hidden text-ellipsis whitespace-nowrap">{purgeSuccess}</span>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/30 text-destructive text-sm flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 shrink-0" />
          <span className="overflow-hidden text-ellipsis whitespace-nowrap">{error}</span>
        </div>
      )}

      {/* Oversight Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-card border border-border shadow-sm min-w-0">
          <div className="flex items-center justify-between text-muted-foreground text-xs font-semibold uppercase tracking-wider">
            <span>Active Deployments</span>
            <RadioTower className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-2xl font-bold text-foreground mt-2">
            {sessions.filter(s => s.status === 'ACTIVE_AUTHORIZED').length} Active
          </div>
          <div className="text-xs text-muted-foreground mt-1">Under strict magistrate warrant</div>
        </div>

        <div className="p-4 rounded-xl bg-card border border-border shadow-sm min-w-0">
          <div className="flex items-center justify-between text-muted-foreground text-xs font-semibold uppercase tracking-wider">
            <span>Bystanders Protected</span>
            <Lock className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-emerald-400 mt-2">100% Masked</div>
          <div className="text-xs text-muted-foreground mt-1">SHA-256 PII Pseudonymization</div>
        </div>

        <div className="p-4 rounded-xl bg-card border border-border shadow-sm min-w-0">
          <div className="flex items-center justify-between text-muted-foreground text-xs font-semibold uppercase tracking-wider">
            <span>Purge Retention Timer</span>
            <Clock className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold text-amber-400 mt-2">72 Hours Max</div>
          <div className="text-xs text-muted-foreground mt-1">Automated non-target destruction</div>
        </div>

        <div className="p-4 rounded-xl bg-card border border-border shadow-sm min-w-0">
          <div className="flex items-center justify-between text-muted-foreground text-xs font-semibold uppercase tracking-wider">
            <span>Statutory Mandate</span>
            <FileCheck className="w-4 h-4 text-primary" />
          </div>
          <div className="text-sm font-semibold text-primary mt-2 overflow-hidden text-ellipsis whitespace-nowrap">
            Sec 5(2) Telegraph Act
          </div>
          <div className="text-xs text-muted-foreground mt-1">Puttaswamy Privacy Compliant</div>
        </div>
      </div>

      {/* Deployment Sessions Table */}
      <div className="p-5 bg-card border border-border rounded-xl min-w-0">
        <h3 className="font-semibold text-foreground text-base mb-3">
          Tactical Cell-Site Simulator Audit Ledger
        </h3>
        <div className="overflow-x-auto w-full">
          <table className="w-full text-left text-xs min-w-[750px]">
            <thead className="bg-muted/40 text-muted-foreground uppercase text-[10px] tracking-wider border-b border-border">
              <tr>
                <th className="py-2.5 px-3">Session ID</th>
                <th className="py-2.5 px-3">Operation & Warrant</th>
                <th className="py-2.5 px-3">Target IMSI</th>
                <th className="py-2.5 px-3">Approving Authority</th>
                <th className="py-2.5 px-3 text-right">Hours Left</th>
                <th className="py-2.5 px-3 text-right">Masked Bystanders</th>
                <th className="py-2.5 px-3 text-center">Status</th>
                <th className="py-2.5 px-3">Audit Hash</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              {sessions.map((s) => (
                <tr key={s.session_id} className="hover:bg-muted/20 transition-colors">
                  <td className="py-2.5 px-3 font-mono font-bold text-foreground">{s.session_id}</td>
                  <td className="py-2.5 px-3">
                    <div className="font-semibold text-foreground overflow-hidden text-ellipsis whitespace-nowrap max-w-[160px]" title={s.operation_name}>
                      {s.operation_name}
                    </div>
                    <div className="text-[11px] font-mono text-muted-foreground">{s.warrant_number}</div>
                  </td>
                  <td className="py-2.5 px-3 font-mono text-foreground font-semibold">{s.target_imsi}</td>
                  <td className="py-2.5 px-3 text-muted-foreground overflow-hidden text-ellipsis whitespace-nowrap max-w-[150px]" title={s.approving_authority}>
                    {s.approving_authority}
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono font-bold text-amber-400">
                    {s.hours_remaining > 0 ? `${s.hours_remaining.toFixed(0)}h` : 'EXPIRED'}
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono text-emerald-400">
                    {s.bystanders_masked_count} / {s.total_handsets_detected}
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold whitespace-nowrap ${
                      s.status === 'ACTIVE_AUTHORIZED'
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        : 'bg-secondary text-secondary-foreground'
                    }`}>
                      {s.status.replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 font-mono text-[10px] text-muted-foreground overflow-hidden text-ellipsis whitespace-nowrap max-w-[100px]" title={s.audit_hash}>
                    {s.audit_hash}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Warrant Authorization Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-xl max-w-md w-full p-5 max-h-[90vh] overflow-y-auto space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-border/40">
              <h3 className="font-bold text-foreground text-base">
                New Dual-Warrant Authorization
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-muted-foreground hover:text-foreground text-sm font-bold"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleCreateSession} className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-foreground">Operation Codename</label>
                <input
                  type="text"
                  required
                  value={operationName}
                  onChange={(e) => setOperationName(e.target.value)}
                  placeholder="e.g. Operation Shield East"
                  className="w-full bg-background border border-border text-foreground rounded-lg p-2 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 mt-1"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-foreground">Target Suspect IMSI (15 digits)</label>
                <input
                  type="text"
                  required
                  value={targetImsi}
                  onChange={(e) => setTargetImsi(e.target.value)}
                  placeholder="404450..."
                  className="w-full bg-background border border-border text-foreground rounded-lg p-2 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500 mt-1"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-foreground">Judicial / Home Sec Warrant No.</label>
                <input
                  type="text"
                  required
                  value={warrantNo}
                  onChange={(e) => setWarrantNo(e.target.value)}
                  placeholder="WAR-MHA-2026-..."
                  className="w-full bg-background border border-border text-foreground rounded-lg p-2 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500 mt-1"
                />
              </div>

              <div className="p-3 rounded bg-muted/40 border border-border text-[11px] text-muted-foreground space-y-1">
                <div>&bull; Authorizes 72 hours maximum active tracking.</div>
                <div>&bull; Bystander identifiers are irreversibly hashed.</div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-3 py-1.5 bg-secondary text-secondary-foreground rounded text-xs font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-xs font-semibold transition-colors"
                >
                  {submitting ? 'Registering...' : 'Authorize Deployment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default IMSICatcherPage;
