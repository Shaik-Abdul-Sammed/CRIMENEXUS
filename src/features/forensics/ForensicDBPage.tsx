import React, { useState, useEffect } from 'react';
import {
  Dna,
  Fingerprint,
  Footprints,
  ShieldCheck,
  Search,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Building,
  FileText
} from 'lucide-react';

interface ForensicHit {
  match_id: string;
  target_case_id: string;
  modality: string;
  similarity_score: number;
  confidence_tier: string;
  custody_chain_verified: boolean;
  laboratory: string;
  suspect_attributed: string | null;
}

interface ForensicRecord {
  record_id: string;
  case_id: string;
  modality: string;
  loci_summary: string;
  suspect_name: string;
  lab: string;
  status: string;
  date_logged: string;
}

export const ForensicDBPage: React.FC = () => {
  const [records, setRecords] = useState<ForensicRecord[]>([]);
  const [selectedModality, setSelectedModality] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('D3S1358 vWA');
  const [matchHits, setMatchHits] = useState<ForensicHit[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searching, setSearching] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchRecords = async () => {
    setLoading(true);
    setError(null);
    try {
      const url = selectedModality === 'ALL'
        ? '/api/v1/forensics/records'
        : `/api/v1/forensics/records?modality=${selectedModality}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setRecords(data);
    } catch (err: any) {
      setError(err.message || 'Error communicating with CFSL repository');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecords();
  }, [selectedModality]);

  const handleRunMatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setSearching(true);
    try {
      const res = await fetch('/api/v1/forensics/match', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          modality: selectedModality === 'ALL' ? 'DNA' : selectedModality,
          profile_data: searchQuery,
          case_context: 'FIR-2026-ACTIVE'
        })
      });
      if (res.ok) {
        const json = await res.json();
        setMatchHits(json.hits || []);
      }
    } catch (err: any) {
      setError(err.message || 'Match calculation failed');
    } finally {
      setSearching(false);
    }
  };

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto min-w-0">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/40 pb-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <Dna className="w-7 h-7 text-teal-400 shrink-0" />
            <h1 className="text-xl md:text-2xl font-bold tracking-tight text-foreground leading-tight break-words" title="Forensic Intelligence Database (CFSL/FSL Multi-Modal Linker)">
              Forensic Intelligence Database (Multi-Modal Linker)
            </h1>
          </div>
          <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
            National integrated forensic intelligence repository uniting DNA (CODIS 24-loci STR), AFIS fingerprint minutiae vectors, footwear tread, and ballistics across state and central FSLs.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={fetchRecords}
            className="flex items-center gap-2 px-3 py-2 bg-card hover:bg-muted text-foreground rounded-lg text-sm font-medium border border-border transition-all whitespace-nowrap shrink-0"
            title="Refresh FSL Index"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
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
        <div className="p-4 rounded-xl bg-card border border-border shadow-sm min-w-0">
          <div className="flex items-center justify-between text-muted-foreground text-xs font-semibold uppercase tracking-wider">
            <span>DNA Profiles Indexed</span>
            <Dna className="w-4 h-4 text-teal-400" />
          </div>
          <div className="text-2xl font-bold text-foreground mt-2">18,450</div>
          <div className="text-xs text-muted-foreground mt-1">CODIS 24-STR Loci Standard</div>
        </div>

        <div className="p-4 rounded-xl bg-card border border-border shadow-sm min-w-0">
          <div className="flex items-center justify-between text-muted-foreground text-xs font-semibold uppercase tracking-wider">
            <span>AFIS Fingerprints</span>
            <Fingerprint className="w-4 h-4 text-sky-400" />
          </div>
          <div className="text-2xl font-bold text-foreground mt-2">42,800</div>
          <div className="text-xs text-muted-foreground mt-1">NAFIS Integration Ready</div>
        </div>

        <div className="p-4 rounded-xl bg-card border border-border shadow-sm min-w-0">
          <div className="flex items-center justify-between text-muted-foreground text-xs font-semibold uppercase tracking-wider">
            <span>Footwear & Tools</span>
            <Footprints className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold text-foreground mt-2">6,120</div>
          <div className="text-xs text-muted-foreground mt-1">SICAR Tread Database</div>
        </div>

        <div className="p-4 rounded-xl bg-card border border-border shadow-sm min-w-0">
          <div className="flex items-center justify-between text-muted-foreground text-xs font-semibold uppercase tracking-wider">
            <span>Admissibility Law</span>
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-sm font-semibold text-emerald-400 mt-2 overflow-hidden text-ellipsis whitespace-nowrap">
            BSA 2023 Sec 63 / Sec 39
          </div>
          <div className="text-xs text-muted-foreground mt-1">Expert Evidence & Chain-of-Custody</div>
        </div>
      </div>

      {/* Query Engine Box */}
      <div className="p-5 bg-card border border-border rounded-xl min-w-0">
        <h3 className="font-semibold text-foreground text-base mb-3 flex items-center gap-2">
          <Search className="w-5 h-5 text-teal-400" />
          Cross-Case Forensic Matching Engine
        </h3>
        <form onSubmit={handleRunMatch} className="flex flex-col md:flex-row gap-3">
          <select
            value={selectedModality}
            onChange={(e) => setSelectedModality(e.target.value)}
            className="bg-background border border-border text-foreground rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 whitespace-nowrap shrink-0 [&>option]:bg-slate-900 [&>option]:text-slate-100"
          >
            <option value="ALL" className="bg-slate-900 text-slate-100">All Modalities</option>
            <option value="DNA" className="bg-slate-900 text-slate-100">DNA (CODIS STR)</option>
            <option value="FINGERPRINT" className="bg-slate-900 text-slate-100">Fingerprint Minutiae</option>
            <option value="FOOTWEAR" className="bg-slate-900 text-slate-100">Footwear Tread (SICAR)</option>
            <option value="BALLISTICS" className="bg-slate-900 text-slate-100">Ballistics (IBIS)</option>
          </select>

          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Enter STR loci alleles, minutiae pattern vector, or tread designation..."
            className="flex-1 bg-background border border-border text-foreground rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 overflow-hidden text-ellipsis"
          />

          <button
            type="submit"
            disabled={searching}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-sm font-medium transition-colors whitespace-nowrap shrink-0"
          >
            <Search className={`w-4 h-4 ${searching ? 'animate-spin' : ''}`} />
            {searching ? 'Comparing...' : 'Run FSL Cross-Match'}
          </button>
        </form>

        {/* Match Hits Display */}
        {matchHits.length > 0 && (
          <div className="mt-5 p-4 rounded-lg bg-teal-950/20 border border-teal-500/30 space-y-3 min-w-0">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-teal-300 uppercase tracking-wider flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-teal-400" />
                Cross-Case Forensic Hits ({matchHits.length} Match Found)
              </span>
              <span className="text-xs text-muted-foreground">Certified Chain of Custody</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {matchHits.map((hit) => (
                <div key={hit.match_id} className="p-3 bg-card rounded border border-border text-xs min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-teal-400">{hit.match_id}</span>
                    <span className="font-bold text-emerald-400 font-mono">
                      {(hit.similarity_score * 100).toFixed(1)}% Match
                    </span>
                  </div>
                  <div className="mt-1 font-semibold text-foreground overflow-hidden text-ellipsis whitespace-nowrap" title={hit.suspect_attributed || 'Unidentified'}>
                    Linked Suspect: {hit.suspect_attributed || 'Unidentified Cold Case Profile'}
                  </div>
                  <div className="mt-0.5 text-muted-foreground flex justify-between">
                    <span>Case: {hit.target_case_id}</span>
                    <span>Lab: {hit.laboratory}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* FSL Master Records Roster */}
      <div className="p-5 bg-card border border-border rounded-xl min-w-0">
        <h3 className="font-semibold text-foreground text-base mb-3 flex items-center gap-2">
          <Building className="w-5 h-5 text-teal-400" />
          Indexed Forensic Laboratory Evidence Log
        </h3>
        <div className="overflow-x-auto w-full">
          <table className="w-full text-left text-xs min-w-[700px]">
            <thead className="bg-muted/40 text-muted-foreground uppercase text-[10px] tracking-wider border-b border-border">
              <tr>
                <th className="py-2.5 px-3">FSL Record ID</th>
                <th className="py-2.5 px-3">Case / FIR ID</th>
                <th className="py-2.5 px-3">Modality</th>
                <th className="py-2.5 px-3">Loci / Feature Summary</th>
                <th className="py-2.5 px-3">Suspect Attribution</th>
                <th className="py-2.5 px-3">Testing Laboratory</th>
                <th className="py-2.5 px-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              {records.map((r) => (
                <tr key={r.record_id} className="hover:bg-muted/20 transition-colors">
                  <td className="py-2.5 px-3 font-mono font-bold text-foreground">{r.record_id}</td>
                  <td className="py-2.5 px-3 font-mono text-muted-foreground">{r.case_id}</td>
                  <td className="py-2.5 px-3">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-secondary text-secondary-foreground whitespace-nowrap">
                      {r.modality}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-muted-foreground max-w-[200px] overflow-hidden text-ellipsis whitespace-nowrap" title={r.loci_summary}>
                    {r.loci_summary}
                  </td>
                  <td className="py-2.5 px-3 font-semibold text-foreground overflow-hidden text-ellipsis whitespace-nowrap max-w-[140px]" title={r.suspect_name}>
                    {r.suspect_name}
                  </td>
                  <td className="py-2.5 px-3 text-muted-foreground overflow-hidden text-ellipsis whitespace-nowrap max-w-[160px]" title={r.lab}>
                    {r.lab}
                  </td>
                  <td className="py-2.5 px-3">
                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-teal-500/10 text-teal-400 border border-teal-500/20 whitespace-nowrap">
                      {r.status.replace(/_/g, ' ')}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ForensicDBPage;
