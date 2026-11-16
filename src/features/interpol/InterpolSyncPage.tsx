import React, { useState, useEffect } from 'react';
import {
  Globe2,
  ShieldAlert,
  Search,
  Flag,
  FileCheck,
  RefreshCw,
  AlertTriangle,
  Building,
  UserCheck,
  ExternalLink
} from 'lucide-react';

interface InterpolNotice {
  notice_id: string;
  notice_type: string;
  subject_name: string;
  nationality: string;
  issuing_country: string;
  charge: string;
  known_locations: string[];
  extradition_treaty_active: boolean;
  biometrics_available: string[];
}

export const InterpolSyncPage: React.FC = () => {
  const [notices, setNotices] = useState<InterpolNotice[]>([]);
  const [noticeType, setNoticeType] = useState<string>('ALL');
  const [query, setQuery] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchNotices = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (noticeType !== 'ALL') params.append('notice_type', noticeType);
      if (query.trim()) params.append('query', query.trim());

      const res = await fetch(`/api/v1/interpol/notices?${params.toString()}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setNotices(data.notices || []);
    } catch (err: any) {
      setError(err.message || 'Error communicating with Interpol I-24/7 gateway');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotices();
  }, [noticeType]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchNotices();
  };

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto min-w-0">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/40 pb-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <Globe2 className="w-7 h-7 text-red-500 shrink-0" />
            <h1 className="text-xl md:text-2xl font-bold tracking-tight text-foreground leading-tight break-words" title="Interpol I-24/7 & Cross-Border Intelligence Sharing">
              Interpol I-24/7 & Cross-Border Intelligence Sharing
            </h1>
          </div>
          <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
            Direct integration with National Central Bureau (NCB) New Delhi (CBI). Live synchronization of Red Notices (Wanted Persons), Yellow Notices (Missing Persons), and Extradition Treaties.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <span className="px-3 py-1 bg-red-500/10 text-red-400 border border-red-500/20 rounded-full text-xs font-semibold flex items-center gap-1.5 whitespace-nowrap">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            NCB NEW DELHI NODE: ONLINE
          </span>
          <button
            onClick={fetchNotices}
            className="flex items-center gap-2 px-3 py-2 bg-card hover:bg-muted text-foreground rounded-lg text-sm font-medium border border-border transition-all whitespace-nowrap shrink-0"
            title="Sync I-24/7 Feed"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Sync
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/30 text-destructive text-sm flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 shrink-0" />
          <span className="overflow-hidden text-ellipsis whitespace-nowrap">{error}</span>
        </div>
      )}

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-card border border-red-500/30 bg-red-500/5 shadow-sm min-w-0">
          <div className="flex items-center justify-between text-red-400 text-xs font-semibold uppercase tracking-wider">
            <span>Red Notices (Fugitives)</span>
            <ShieldAlert className="w-4 h-4 text-red-400" />
          </div>
          <div className="text-2xl font-bold text-red-400 mt-2">Active Extradition</div>
          <div className="text-xs text-red-300 mt-1">Underworld & Transnational Terror</div>
        </div>

        <div className="p-4 rounded-xl bg-card border border-border shadow-sm min-w-0">
          <div className="flex items-center justify-between text-muted-foreground text-xs font-semibold uppercase tracking-wider">
            <span>CBI NCB Node</span>
            <Building className="w-4 h-4 text-primary" />
          </div>
          <div className="text-lg font-bold text-foreground mt-2 overflow-hidden text-ellipsis whitespace-nowrap">
            CBI Headquarters, Delhi
          </div>
          <div className="text-xs text-muted-foreground mt-1">Official Lyon Secretariat Node</div>
        </div>

        <div className="p-4 rounded-xl bg-card border border-border shadow-sm min-w-0">
          <div className="flex items-center justify-between text-muted-foreground text-xs font-semibold uppercase tracking-wider">
            <span>Treaty Coverage</span>
            <FileCheck className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-emerald-400 mt-2">48 Countries</div>
          <div className="text-xs text-muted-foreground mt-1">Extradition Act 1962 Compliant</div>
        </div>

        <div className="p-4 rounded-xl bg-card border border-border shadow-sm min-w-0">
          <div className="flex items-center justify-between text-muted-foreground text-xs font-semibold uppercase tracking-wider">
            <span>Biometric Linkage</span>
            <UserCheck className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-base font-bold text-foreground mt-2">DNA & 10-Print Vectors</div>
          <div className="text-xs text-muted-foreground mt-1">Cross-matched with CFSL index</div>
        </div>
      </div>

      {/* Notice Filter & Search Bar */}
      <div className="p-5 bg-card border border-border rounded-xl min-w-0">
        <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-3">
          <div className="flex items-center gap-2 shrink-0">
            {['ALL', 'RED_NOTICE', 'YELLOW_NOTICE', 'BLUE_NOTICE'].map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => setNoticeType(type)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
                  noticeType === type
                    ? 'bg-red-600 text-white'
                    : 'bg-secondary text-secondary-foreground hover:bg-muted'
                }`}
              >
                {type.replace(/_/g, ' ')}
              </button>
            ))}
          </div>

          <div className="flex-1 flex gap-2">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by fugitive name, charges, or notice ID..."
              className="flex-1 bg-background border border-border text-foreground rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 overflow-hidden text-ellipsis"
            />
            <button
              type="submit"
              className="flex items-center gap-1.5 px-4 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition-colors whitespace-nowrap shrink-0"
            >
              <Search className="w-4 h-4" />
              Search
            </button>
          </div>
        </form>
      </div>

      {/* Notices Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {notices.map((n) => (
          <div
            key={n.notice_id}
            className={`p-5 rounded-xl border flex flex-col justify-between shadow-sm min-w-0 ${
              n.notice_type === 'RED_NOTICE'
                ? 'bg-card border-red-500/30'
                : 'bg-card border-border'
            }`}
          >
            <div>
              <div className="flex items-center justify-between gap-2 border-b border-border/40 pb-3">
                <span className="font-mono font-bold text-xs text-foreground overflow-hidden text-ellipsis whitespace-nowrap">
                  {n.notice_id}
                </span>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold whitespace-nowrap ${
                  n.notice_type === 'RED_NOTICE'
                    ? 'bg-red-500/20 text-red-300 border border-red-500/30'
                    : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                }`}>
                  {n.notice_type.replace(/_/g, ' ')}
                </span>
              </div>

              <div className="mt-3">
                <h3 className="font-bold text-foreground text-base overflow-hidden text-ellipsis whitespace-nowrap" title={n.subject_name}>
                  {n.subject_name}
                </h3>
                <div className="text-xs text-muted-foreground mt-0.5 flex items-center gap-2">
                  <Flag className="w-3.5 h-3.5" />
                  <span>Nationality: {n.nationality}</span>
                </div>
              </div>

              <div className="mt-3 text-xs text-muted-foreground line-clamp-2" title={n.charge}>
                <strong className="text-foreground">Charges:</strong> {n.charge}
              </div>

              <div className="mt-3 space-y-1 text-xs text-muted-foreground">
                <div className="overflow-hidden text-ellipsis whitespace-nowrap">
                  <strong>Issuing:</strong> {n.issuing_country}
                </div>
                <div className="overflow-hidden text-ellipsis whitespace-nowrap">
                  <strong>Known Havens:</strong> {n.known_locations.join(', ')}
                </div>
                <div className="overflow-hidden text-ellipsis whitespace-nowrap">
                  <strong>Biometrics:</strong> {n.biometrics_available.join(', ')}
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-border/40 flex items-center justify-between">
              <span className={`text-[11px] font-semibold ${
                n.extradition_treaty_active ? 'text-emerald-400' : 'text-amber-400'
              }`}>
                {n.extradition_treaty_active ? 'Treaty Active' : 'No Bilateral Treaty'}
              </span>
              <button
                className="text-xs text-red-400 hover:text-red-300 font-medium flex items-center gap-1 whitespace-nowrap shrink-0"
              >
                Dossier <ExternalLink className="w-3 h-3" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default InterpolSyncPage;
