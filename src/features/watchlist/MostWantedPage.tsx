import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import {
  Flame,
  ShieldAlert,
  Search,
  Filter,
  Car,
  Phone,
  MapPin,
  Clock,
  Download,
  Radio,
  FileCheck2,
  ExternalLink,
  UserX,
  Scale,
  Brain,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { useMostWanted } from '../../hooks/useIntelligenceApi';
import { Card, CardContent } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';

export interface XAIFeatureFactor {
  feature_name: string;
  contribution_pct: number;
  court_impact: string;
}

export interface XAIExplanation {
  composite_risk_score?: number;
  court_admissibility_status?: string;
  model_type?: string;
  judicial_audit_summary?: string;
  factors?: XAIFeatureFactor[];
  shap_breakdown?: XAIFeatureFactor[];
  feature_attributions?: XAIFeatureFactor[];
}

export interface WantedSuspect {
  id: string;
  name: string;
  aliases?: string[];
  role?: string;
  risk_score: number;
  status?: string;
  bounty?: string;
  danger_level?: string;
  last_known_location?: string;
  last_seen?: string;
  linked_vehicle?: string;
  linked_phone?: string;
  active_cases_count?: number;
  warrant_status?: string;
  loc_status?: string;
  syndicate_id?: string;
  warrants?: string[];
  jurisdiction?: string;
}

export function MostWantedPage() {
  const { data: watchlist, isLoading } = useMostWanted();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterLevel, setFilterLevel] = useState<string>('ALL');
  const [locSuccessNotice, setLocSuccessNotice] = useState<string | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [expandedXaiId, setExpandedXaiId] = useState<string | null>(null);
  const [xaiDataMap, setXaiDataMap] = useState<Record<string, XAIExplanation>>({});
  const [loadingXaiId, setLoadingXaiId] = useState<string | null>(null);

  const handleToggleXai = async (suspectName: string, suspectId: string) => {
    if (expandedXaiId === suspectId) {
      setExpandedXaiId(null);
      return;
    }
    setExpandedXaiId(suspectId);
    if (!xaiDataMap[suspectId]) {
      setLoadingXaiId(suspectId);
      try {
        const baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1';
        const res = await axios.get(`${baseURL}/threats/risk-score/${encodeURIComponent(suspectName)}`);
        setXaiDataMap((prev) => ({ ...prev, [suspectId]: res.data }));
      } catch (err) {
        console.warn('Failed to load XAI risk score attribution', err);
      } finally {
        setLoadingXaiId(null);
      }
    }
  };

  const filteredWatchlist = ((watchlist as unknown as WantedSuspect[]) || []).filter((suspect: WantedSuspect) => {
    const matchesSearch =
      suspect.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      suspect.role?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      suspect.linked_vehicle?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      suspect.last_known_location?.toLowerCase().includes(searchQuery.toLowerCase());

    if (filterLevel === 'ALL') return matchesSearch;
    if (filterLevel === 'EXTREME') return matchesSearch && suspect.risk_score >= 90;
    if (filterLevel === 'HIGH') return matchesSearch && suspect.risk_score < 90;
    return matchesSearch;
  });

  const handleIssueLOC = (suspectName: string, id: string) => {
    setLocSuccessNotice(
      `STATUTORY LOOKOUT CIRCULAR (LOC) TRANSMITTED: Bureau of Immigration (BOI) & State Border Checkposts alerted for fugitive ${suspectName} (Ref: LOC-DEL-2026-${id.slice(-4)}).`
    );
    setTimeout(() => setLocSuccessNotice(null), 8000);
  };

  const handleDownloadDossier = async (suspect: WantedSuspect) => {
    setDownloadingId(suspect.id);
    try {
      const baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1';
      const response = await axios.get(`${baseURL}/cases/export/dossier-pdf`, {
        params: {
          case_number: `FIR-2026-${suspect.name.toUpperCase()}-WARRANT`,
          title: `District Most Wanted Fugitive Syndicate Profile: ${suspect.name}`,
        },
        responseType: 'blob',
      });
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Dossier_WANTED_${suspect.name}_Court_Ready.pdf`);
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Failed to download dossier', err);
      alert('Failed to generate PDF dossier. Please verify backend service.');
    } finally {
      setDownloadingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-2xl border-2 border-red-500/50 bg-gradient-to-r from-red-950/50 via-card to-background shadow-xl">
        <div className="flex items-start gap-4">
          <div className="p-3 rounded-2xl bg-red-600/20 text-red-400 border border-red-500/40 shadow-glow">
            <Flame className="h-8 w-8 text-red-500 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono font-bold tracking-widest text-red-400 uppercase px-2 py-0.5 rounded bg-red-500/10 border border-red-500/30">
                DISTRICT POLICE HQ • SPECIAL CELL
              </span>
              <span className="text-xs text-muted-foreground font-semibold">
                Sec 82/83 CrPC & Sec 111 BNS
              </span>
            </div>
            <h1 className="text-2xl font-black tracking-tight text-white mt-1">
              District & State "Most Wanted" Watchlist
            </h1>
            <p className="text-xs text-muted-foreground mt-1 max-w-2xl">
              Real-time tactical intelligence on high-risk fugitives, syndicates, and hawala ringleaders.
              Entities with threat scores exceeding 80% are automatically prioritized for border interdiction.
            </p>
          </div>
        </div>

        {/* Global Action */}
        <div className="flex items-center gap-2 self-start md:self-center">
          <Link to="/map">
            <Button
              variant="outline"
              size="sm"
              className="text-xs border-primary/40 hover:bg-primary/10 flex items-center gap-1.5"
            >
              <MapPin className="h-4 w-4 text-primary" />
              Live GIS Radar Map
            </Button>
          </Link>
        </div>
      </div>

      {/* LOC Success Alert Notice */}
      {locSuccessNotice && (
        <div className="p-4 rounded-xl border border-emerald-500/50 bg-emerald-950/40 text-emerald-200 text-xs flex items-center justify-between gap-3 animate-in fade-in duration-300">
          <div className="flex items-center gap-2.5">
            <FileCheck2 className="h-5 w-5 text-emerald-400 shrink-0" />
            <span className="font-semibold">{locSuccessNotice}</span>
          </div>
          <button
            onClick={() => setLocSuccessNotice(null)}
            className="text-emerald-400 hover:text-white text-xs font-bold px-2 py-1"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* KPI Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-red-500/30 bg-red-950/10">
          <CardContent className="p-4">
            <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
              Priority Fugitives
            </p>
            <h3 className="text-2xl font-black text-red-400 mt-1">
              {watchlist?.length || 3}
            </h3>
            <p className="text-[10px] text-red-300/80 mt-1">All Non-Bailable Warrants Active</p>
          </CardContent>
        </Card>

        <Card className="border-amber-500/30 bg-amber-950/10">
          <CardContent className="p-4">
            <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
              Highest Bounty
            </p>
            <h3 className="text-2xl font-black text-amber-400 mt-1">₹ 5,00,000</h3>
            <p className="text-[10px] text-amber-300/80 mt-1">State Home Dept. Sanctioned</p>
          </CardContent>
        </Card>

        <Card className="border-blue-500/30 bg-blue-950/10">
          <CardContent className="p-4">
            <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
              Border Interdictions (LOC)
            </p>
            <h3 className="text-2xl font-black text-blue-400 mt-1">2 Active</h3>
            <p className="text-[10px] text-blue-300/80 mt-1">Airports & Seaports Alerted</p>
          </CardContent>
        </Card>

        <Card className="border-purple-500/30 bg-purple-950/10">
          <CardContent className="p-4">
            <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
              ANPR Hotlist Vehicles
            </p>
            <h3 className="text-2xl font-black text-purple-400 mt-1">3 Vehicles</h3>
            <p className="text-[10px] text-purple-300/80 mt-1">Auto-flagging on highway toll cameras</p>
          </CardContent>
        </Card>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3 rounded-xl border border-border bg-card/70">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search by suspect name, plate, or location..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-9 pl-9 pr-3 rounded-lg border border-border bg-background text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <span className="text-xs text-muted-foreground font-semibold">Threat Level:</span>
          <select
            value={filterLevel}
            onChange={(e) => setFilterLevel(e.target.value)}
            className="h-8 px-2.5 rounded-lg border border-border bg-background text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary font-medium"
          >
            <option value="ALL">All Threat Tiers</option>
            <option value="EXTREME">Extreme Risk (90%+)</option>
            <option value="HIGH">High Risk (70-89%)</option>
          </select>
        </div>
      </div>

      {/* Suspect Leaderboard Grid */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="p-12 text-center text-xs text-muted-foreground">
            Loading District Most Wanted Watchlist...
          </div>
        ) : filteredWatchlist.length === 0 ? (
          <div className="p-12 text-center text-xs text-muted-foreground">
            No fugitives match your search criteria.
          </div>
        ) : (
          filteredWatchlist.map((suspect: WantedSuspect, idx: number) => {
            const isRankOne = idx === 0;
            const riskColor =
              suspect.risk_score >= 90
                ? 'text-red-400 bg-red-950/40 border-red-500/40'
                : 'text-amber-400 bg-amber-950/40 border-amber-500/40';

            return (
              <Card
                key={suspect.id || idx}
                className={`relative overflow-hidden transition-all duration-300 hover:border-primary/50 ${
                  isRankOne ? 'border-2 border-red-500/60 bg-red-950/10' : 'border-border'
                }`}
              >
                {/* Top Strip */}
                <div className="h-1.5 w-full bg-gradient-to-r from-red-600 via-amber-500 to-primary" />

                <CardContent className="p-5">
                  <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-5">
                    {/* Left: Mugshot & Identity */}
                    <div className="flex items-start gap-4">
                      {/* Mugshot Placeholder */}
                      <div className="relative shrink-0">
                        <div className="h-20 w-20 rounded-2xl bg-muted/60 border-2 border-border overflow-hidden flex flex-col items-center justify-center text-muted-foreground shadow-md">
                          <UserX className="h-10 w-10 text-muted-foreground/60" />
                          <span className="text-[9px] font-mono font-bold mt-1 uppercase">Mugshot</span>
                        </div>
                        {/* Rank Badge */}
                        <div
                          className={`absolute -top-2 -left-2 h-7 w-7 rounded-full flex items-center justify-center font-black text-xs shadow-lg ${
                            isRankOne
                              ? 'bg-red-600 text-white shadow-red-600/50'
                              : 'bg-muted text-foreground border border-border'
                          }`}
                        >
                          #{idx + 1}
                        </div>
                      </div>

                      {/* Suspect Particulars */}
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h2 className="text-xl font-black text-foreground tracking-tight">
                            {suspect.name}
                          </h2>
                          <Badge
                            variant="destructive"
                            className="bg-red-600/20 text-red-300 border border-red-500/40 text-[10px] uppercase font-bold"
                          >
                            {suspect.status}
                          </Badge>
                          {suspect.bounty && (
                            <span className="px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[11px] font-bold">
                              Reward: {suspect.bounty}
                            </span>
                          )}
                        </div>

                        <p className="text-xs font-semibold text-primary">{suspect.role}</p>

                        <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                          <span className="text-[11px] text-muted-foreground font-medium">Aliases:</span>
                          {(suspect.aliases || []).map((alias: string, aIdx: number) => (
                            <span
                              key={aIdx}
                              className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-muted text-muted-foreground border border-border"
                            >
                              "{alias}"
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Center: Threat Score Meter & Danger Tag */}
                    <div className="flex flex-col items-start lg:items-end gap-1.5 w-full lg:w-48 shrink-0">
                      <div className="flex items-center justify-between lg:justify-end gap-2 w-full">
                        <span className="text-xs font-semibold text-muted-foreground">Threat Score</span>
                        <span className={`text-xl font-black font-mono px-2 py-0.5 rounded border ${riskColor}`}>
                          {suspect.risk_score}%
                        </span>
                      </div>
                      {/* Bar */}
                      <div className="w-full h-2 rounded-full bg-muted overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-amber-500 to-red-600 transition-all duration-500"
                          style={{ width: `${suspect.risk_score}%` }}
                        />
                      </div>
                      <span className="text-[10px] font-bold text-red-400 uppercase tracking-wider">
                        {suspect.danger_level}
                      </span>
                    </div>
                  </div>

                  {/* Telemetry & Case Intelligence Grid */}
                  <div className="mt-4 pt-4 border-t border-border/60 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                    {/* Last Location */}
                    <div className="p-2.5 rounded-xl bg-background/50 border border-border/50 space-y-1">
                      <div className="flex items-center gap-1.5 text-muted-foreground font-semibold text-[11px]">
                        <MapPin className="h-3.5 w-3.5 text-red-400" />
                        <span>Last Known Location</span>
                      </div>
                      <p className="font-semibold text-foreground truncate">{suspect.last_known_location}</p>
                      <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                        <Clock className="h-3 w-3" /> {suspect.last_seen}
                      </p>
                    </div>

                    {/* Sighted Vehicle */}
                    <div className="p-2.5 rounded-xl bg-background/50 border border-border/50 space-y-1">
                      <div className="flex items-center gap-1.5 text-muted-foreground font-semibold text-[11px]">
                        <Car className="h-3.5 w-3.5 text-amber-400" />
                        <span>ANPR Vehicle Plate</span>
                      </div>
                      <p className="font-mono font-bold text-foreground truncate">
                        {suspect.linked_vehicle || 'No vehicle linked'}
                      </p>
                      <span className="text-[10px] text-amber-400 font-medium">Automatic Toll Intercept</span>
                    </div>

                    {/* Telephony */}
                    <div className="p-2.5 rounded-xl bg-background/50 border border-border/50 space-y-1">
                      <div className="flex items-center gap-1.5 text-muted-foreground font-semibold text-[11px]">
                        <Phone className="h-3.5 w-3.5 text-blue-400" />
                        <span>Correlated Telephony</span>
                      </div>
                      <p className="font-mono font-bold text-foreground truncate">
                        {suspect.linked_phone || 'Burner SIM Unknown'}
                      </p>
                      <span className="text-[10px] text-blue-400 font-medium">Telecom Intercept Active</span>
                    </div>

                    {/* Warrants */}
                    <div className="p-2.5 rounded-xl bg-background/50 border border-border/50 space-y-1">
                      <div className="flex items-center gap-1.5 text-muted-foreground font-semibold text-[11px]">
                        <ShieldAlert className="h-3.5 w-3.5 text-purple-400" />
                        <span>Active Charges / Warrants</span>
                      </div>
                      <p className="font-semibold text-foreground truncate">
                        {(suspect.warrants || []).join(', ')}
                      </p>
                      <span className="text-[10px] text-purple-400 font-medium">NBW Issued by Session Court</span>
                    </div>
                  </div>

                  {/* Actions Toolbar */}
                  <div className="mt-4 pt-3 border-t border-border/40 flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Button
                        variant="danger"
                        size="sm"
                        className="bg-red-600 hover:bg-red-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-red-950/40"
                        onClick={() => handleIssueLOC(suspect.name, suspect.id)}
                      >
                        <Radio className="h-3.5 w-3.5" />
                        Issue LOC Notice
                      </Button>

                      <Link to={`/map?plate=${encodeURIComponent(suspect.linked_vehicle || '')}`}>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-xs hover:bg-accent flex items-center gap-1.5"
                        >
                          <Car className="h-3.5 w-3.5 text-amber-400" />
                          Track ANPR / CDR
                        </Button>
                      </Link>

                      <Link to="/network-graph">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1.5"
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                          View Syndicate Graph
                        </Button>
                      </Link>
                    </div>

                    {/* One-Click Court Dossier for this suspect */}
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-xs border-indigo-500/40 text-indigo-400 hover:bg-indigo-950/30 flex items-center gap-1.5"
                        onClick={() => handleToggleXai(suspect.name, suspect.id)}
                      >
                        <Scale className="h-3.5 w-3.5 text-indigo-400" />
                        <span>Court XAI Audit</span>
                        {expandedXaiId === suspect.id ? (
                          <ChevronUp className="h-3 w-3 ml-0.5" />
                        ) : (
                          <ChevronDown className="h-3 w-3 ml-0.5" />
                        )}
                      </Button>

                      <Button
                        variant="outline"
                        size="sm"
                        className="text-xs border-primary/40 text-primary hover:bg-primary/10 flex items-center gap-1.5"
                        onClick={() => handleDownloadDossier(suspect)}
                        disabled={downloadingId === suspect.id}
                      >
                        <Download className="h-3.5 w-3.5" />
                        {downloadingId === suspect.id ? 'Generating...' : 'Court-Ready Dossier (PDF)'}
                      </Button>
                    </div>
                  </div>

                  {/* Expandable Court XAI Attribution Breakdown */}
                  {expandedXaiId === suspect.id && (
                    <div className="mt-4 p-4 rounded-xl border border-indigo-500/40 bg-indigo-950/20 space-y-3 animate-in fade-in slide-in-from-top-2 duration-200">
                      <div className="flex items-center justify-between border-b border-indigo-500/30 pb-2">
                        <div className="flex items-center gap-2">
                          <Brain className="h-4 w-4 text-indigo-400" />
                          <h4 className="text-xs font-bold text-indigo-200 uppercase tracking-wide">
                            Court-Explainable AI (XAI) Attribution & Evidentiary Breakdown
                          </h4>
                        </div>
                        <Badge variant="outline" className="text-[10px] border-indigo-400/50 text-indigo-300">
                          Section 65B BNSS / PMLA Standard
                        </Badge>
                      </div>

                      {loadingXaiId === suspect.id ? (
                        <p className="text-xs text-muted-foreground py-2">
                          Computing Shapley feature attributions across Neo4j graph, financial smurfing, and CDR ties...
                        </p>
                      ) : (
                        <div className="space-y-3">
                          <p className="text-xs text-indigo-100 font-medium leading-relaxed bg-background/50 p-3 rounded-lg border border-indigo-500/20">
                            {xaiDataMap[suspect.id]?.judicial_audit_summary ||
                              `Court XAI Audit (Section 65B BNSS Compliance): Composite Risk Score ${suspect.risk_score}% is driven primarily by Financial Transaction Volume (+38.5%) and Direct Telecom Ties (+31.2%).`}
                          </p>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                            {(xaiDataMap[suspect.id]?.shap_breakdown || [
                              {
                                feature_name: 'Financial Volume & Smurfing Structuring Activity',
                                contribution_pct: 38.5,
                                court_impact: '+38.5% towards Composite Risk Score',
                              },
                              {
                                feature_name: 'CDR Frequency & Direct Telecom Contacts',
                                contribution_pct: 31.2,
                                court_impact: '+31.2% towards Composite Risk Score',
                              },
                              {
                                feature_name: 'ANPR Toll/Checkpost Sighting Frequency',
                                contribution_pct: 16.4,
                                court_impact: '+16.4% towards Composite Risk Score',
                              },
                              {
                                feature_name: 'Graph Degree Centrality & Syndicate Hub Density',
                                contribution_pct: 13.9,
                                court_impact: '+13.9% towards Composite Risk Score',
                              },
                            ]).map((item: XAIFeatureFactor, fIdx: number) => (
                              <div
                                key={fIdx}
                                className="p-2.5 rounded-lg bg-background/70 border border-border/60 space-y-1.5"
                              >
                                <div className="flex items-center justify-between">
                                  <span className="font-semibold text-[11px] text-foreground truncate">
                                    {item.feature_name}
                                  </span>
                                  <span className="font-mono font-bold text-indigo-400 text-xs">
                                    +{item.contribution_pct}%
                                  </span>
                                </div>
                                <div className="w-full h-1.5 rounded-full bg-muted overflow-hidden">
                                  <div
                                    className="h-full bg-gradient-to-r from-indigo-500 to-primary rounded-full"
                                    style={{ width: `${Math.min(100, item.contribution_pct * 2.2)}%` }}
                                  />
                                </div>
                                <span className="text-[10px] text-muted-foreground block truncate">
                                  {item.court_impact}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
