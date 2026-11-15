import React, { useState, useEffect } from 'react';
import {
  Eye,
  ShieldAlert,
  Search,
  AlertTriangle,
  RefreshCw,
  Globe,
  Radio,
  ExternalLink,
  MapPin,
  CheckCircle2,
  Clock
} from 'lucide-react';

interface OSINTAlert {
  id: string;
  source: string;
  content: string;
  keywords_detected: string[];
  threat_score: number;
  urgency: string;
  geotag_hint: string;
  timestamp: string;
}

export const OSINTMonitorPage: React.FC = () => {
  const [alerts, setAlerts] = useState<OSINTAlert[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [scanText, setScanText] = useState<string>('');
  const [scanResult, setScanResult] = useState<any | null>(null);
  const [scanning, setScanning] = useState<boolean>(false);

  const fetchAlerts = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/v1/osint/alerts');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setAlerts(data.alerts || []);
    } catch (err: any) {
      setError(err.message || 'Error communicating with OSINT crawler pipeline');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
  }, []);

  const handleScan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!scanText.trim()) return;
    setScanning(true);
    try {
      const res = await fetch('/api/v1/osint/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ raw_text: scanText })
      });
      if (res.ok) {
        const json = await res.json();
        setScanResult(json);
      }
    } catch (err: any) {
      setError(err.message || 'Error analyzing snippet');
    } finally {
      setScanning(false);
    }
  };

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto min-w-0">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/40 pb-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <Eye className="w-7 h-7 text-sky-400 shrink-0" />
            <h1 className="text-xl md:text-2xl font-bold tracking-tight text-foreground overflow-hidden text-ellipsis whitespace-nowrap" title="Open Source Intelligence (OSINT) & Dark Web Monitor">
              Open Source Intelligence (OSINT) & Dark Web Monitor
            </h1>
          </div>
          <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
            Automated threat crawling across Telegram public black-markets, Tor .onion leak pastes, and social chatter tracking illegal arms, data dumps, and violent unrest.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={fetchAlerts}
            className="flex items-center gap-2 px-3 py-2 bg-card hover:bg-muted text-foreground rounded-lg text-sm font-medium border border-border transition-all whitespace-nowrap shrink-0"
            title="Refresh OSINT Streams"
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

      {/* Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-card border border-border shadow-sm min-w-0">
          <div className="flex items-center justify-between text-muted-foreground text-xs font-semibold uppercase tracking-wider">
            <span>Crawled Threat Posts</span>
            <Radio className="w-4 h-4 text-sky-400" />
          </div>
          <div className="text-2xl font-bold text-foreground mt-2">{alerts.length} Flagged</div>
          <div className="text-xs text-muted-foreground mt-1">High-Confidence Threat Leads</div>
        </div>

        <div className="p-4 rounded-xl bg-card border border-border shadow-sm min-w-0">
          <div className="flex items-center justify-between text-muted-foreground text-xs font-semibold uppercase tracking-wider">
            <span>Critical Urgency</span>
            <ShieldAlert className="w-4 h-4 text-red-400" />
          </div>
          <div className="text-2xl font-bold text-red-400 mt-2">
            {alerts.filter(a => a.urgency === 'CRITICAL').length} High Priority
          </div>
          <div className="text-xs text-muted-foreground mt-1">Arms Trafficking & Unrest</div>
        </div>

        <div className="p-4 rounded-xl bg-card border border-border shadow-sm min-w-0">
          <div className="flex items-center justify-between text-muted-foreground text-xs font-semibold uppercase tracking-wider">
            <span>Dark Web Tor Pastes</span>
            <Globe className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold text-amber-400 mt-2">Active Onion Scraper</div>
          <div className="text-xs text-muted-foreground mt-1">Identity & Aadhaar Leaks</div>
        </div>

        <div className="p-4 rounded-xl bg-card border border-border shadow-sm min-w-0">
          <div className="flex items-center justify-between text-muted-foreground text-xs font-semibold uppercase tracking-wider">
            <span>IT Act Oversight</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-sm font-semibold text-emerald-400 mt-2 overflow-hidden text-ellipsis whitespace-nowrap">
            Sec 69 IT Act / CERT-In
          </div>
          <div className="text-xs text-muted-foreground mt-1">Lawful Open-Source Ingestion</div>
        </div>
      </div>

      {/* Snippet Scanner Box */}
      <div className="p-5 bg-card border border-border rounded-xl min-w-0">
        <h3 className="font-semibold text-foreground text-base mb-2">
          Ad-Hoc Telegram / Dark Web Text Scanner
        </h3>
        <p className="text-xs text-muted-foreground mb-3">
          Paste suspected chat logs or forum snippets to analyze contraband keywords and extract threat score.
        </p>

        <form onSubmit={handleScan} className="space-y-3">
          <textarea
            rows={2}
            value={scanText}
            onChange={(e) => setScanText(e.target.value)}
            placeholder="Paste raw telegram text, tweet, or darknet paste here..."
            className="w-full bg-background border border-border text-foreground rounded-lg p-3 text-xs focus:outline-none focus:ring-2 focus:ring-sky-500"
          />
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={scanning}
              className="flex items-center gap-1.5 px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-lg text-xs font-medium transition-colors whitespace-nowrap shrink-0"
            >
              <Search className={`w-3.5 h-3.5 ${scanning ? 'animate-spin' : ''}`} />
              {scanning ? 'Scanning...' : 'Analyze Threat Score'}
            </button>
          </div>
        </form>

        {scanResult && (
          <div className="mt-4 p-3 rounded-lg bg-sky-950/20 border border-sky-500/30 text-xs min-w-0 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="font-bold text-foreground">Score: {scanResult.threat_score}%</span>
              <span className="text-muted-foreground">
                Keywords: {scanResult.threat_keywords_detected.join(', ') || 'None'}
              </span>
            </div>
            <span className={`px-2 py-0.5 rounded font-bold text-[10px] whitespace-nowrap ${
              scanResult.status === 'BENIGN' ? 'bg-secondary text-secondary-foreground' : 'bg-red-500/20 text-red-300'
            }`}>
              {scanResult.status}
            </span>
          </div>
        )}
      </div>

      {/* Active OSINT Alerts Feed */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {alerts.map((alert) => (
          <div
            key={alert.id}
            className="p-5 rounded-xl border border-border bg-card shadow-sm flex flex-col justify-between min-w-0"
          >
            <div>
              <div className="flex items-center justify-between gap-2 border-b border-border/40 pb-3">
                <span className="font-mono font-bold text-xs text-foreground overflow-hidden text-ellipsis whitespace-nowrap">
                  {alert.id}
                </span>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold whitespace-nowrap ${
                  alert.urgency === 'CRITICAL'
                    ? 'bg-red-500/20 text-red-300 border border-red-500/30'
                    : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                }`}>
                  {alert.urgency} ({alert.threat_score}%)
                </span>
              </div>

              <div className="mt-3 text-xs font-semibold text-sky-400 overflow-hidden text-ellipsis whitespace-nowrap" title={alert.source}>
                {alert.source}
              </div>

              <p className="mt-2 text-xs text-foreground leading-relaxed break-words">
                "{alert.content}"
              </p>

              <div className="mt-3 flex flex-wrap gap-1.5">
                {alert.keywords_detected.map((kw, i) => (
                  <span key={i} className="px-2 py-0.5 rounded text-[10px] bg-secondary text-secondary-foreground font-mono">
                    #{kw}
                  </span>
                ))}
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-border/40 flex items-center justify-between text-xs text-muted-foreground">
              <span className="flex items-center gap-1 overflow-hidden text-ellipsis whitespace-nowrap max-w-[150px]" title={alert.geotag_hint}>
                <MapPin className="w-3.5 h-3.5 shrink-0" />
                {alert.geotag_hint}
              </span>
              <span className="flex items-center gap-1 shrink-0 font-mono text-[11px]">
                <Clock className="w-3 h-3" />
                {alert.timestamp}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default OSINTMonitorPage;
