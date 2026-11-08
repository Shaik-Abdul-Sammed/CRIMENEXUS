import React from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import {
  X,
  ShieldAlert,
  UserX,
  MapPin,
  Car,
  Phone,
  Clock,
  Radio,
  Network,
  Download,
  AlertTriangle,
  Brain,
  FileText,
  Compass,
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Card, CardContent } from '../../components/ui/Card';
import { WantedSuspect } from './MostWantedPage';
import { sound } from '../../utils/soundEffects';

interface EntityDetailModalProps {
  suspect: WantedSuspect | null;
  onClose: () => void;
  onIssueLOC?: (suspectName: string, id: string) => void;
  onDownloadDossier?: (suspect: WantedSuspect) => void;
}

export function EntityDetailModal({
  suspect,
  onClose,
  onIssueLOC,
  onDownloadDossier,
}: EntityDetailModalProps) {
  const navigate = useNavigate();

  if (!suspect) return null;

  // Enrich with demo fallback data if fields are missing or empty
  const displayName = suspect.name || 'Identified Kingpin';
  const displayRole = suspect.role || 'Syndicate Operational Ringleader & Hawala Mastermind';
  const displayAliases = suspect.aliases && suspect.aliases.length > 0
    ? suspect.aliases
    : ['The Ghost Operator', 'Cash Mule-01', 'Hawala Kingpin'];
  const displayBounty = suspect.bounty || '₹ 5,00,000';
  const displayStatus = suspect.status || 'WANTED - RED NOTICE ACTIVE';
  const displayDanger = suspect.danger_level || 'EXTREME FLIGHT & ARMED RISK';
  const displayLocation = suspect.last_known_location || 'NH-48 Kherki Daula Toll Plaza, Gurugram';
  const displayLastSeen = suspect.last_seen || '12 mins ago (ANPR Camera Cam-04)';
  const displayVehicle = suspect.linked_vehicle || 'TS 09 AB 1234 (Toyota Fortuner)';
  const displayPhone = suspect.linked_phone || '+91 99999 88888 (Burner SIM)';
  const displayWarrants = suspect.warrants && suspect.warrants.length > 0
    ? suspect.warrants
    : [
        'Sec 111 BNS (Organized Crime Syndicate)',
        'Sec 120B IPC (Criminal Conspiracy)',
        'PMLA Sec 3 & 4 (Hawala Money Laundering)',
        'Sec 420 IPC (Multi-Jurisdiction Bank Fraud)',
      ];
  const riskScore = suspect.risk_score || 95;

  const handleTrackOnMap = () => {
    sound.playClickSound();
    onClose();
    navigate(`/live-tracking?plate=${encodeURIComponent(suspect.linked_vehicle || 'TS 09 AB 1234')}&suspect=${encodeURIComponent(displayName)}`);
  };

  const handleInspectGraph = () => {
    sound.playClickSound();
    onClose();
    navigate(`/network-graph?suspect=${encodeURIComponent(displayName)}`);
  };

  const handleLOC = () => {
    sound.playAlertBeep();
    if (onIssueLOC) {
      onIssueLOC(displayName, suspect.id || 'ent-1');
    }
  };

  const modalContent = (
    <div
      className="fixed inset-0 z-[99999] overflow-y-auto bg-black/85 backdrop-blur-md animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="min-h-full flex justify-center p-2 sm:p-4 md:p-6"
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose();
        }}
      >
        <div className="relative w-full my-auto max-w-3xl max-h-[92vh] overflow-y-auto rounded-2xl border-2 border-red-500/50 bg-slate-950 shadow-2xl shadow-red-950/50 text-foreground scrollbar-thin">
        {/* Header Ribbon */}
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-border/80 bg-slate-900/95 px-6 py-4 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-red-600/20 border border-red-500/40 flex items-center justify-center text-red-400">
              <ShieldAlert className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-black tracking-tight text-white">{displayName}</h3>
                <Badge variant="destructive" className="bg-red-600/30 text-red-300 border-red-500/50 text-[10px] font-bold">
                  {displayStatus}
                </Badge>
              </div>
              <p className="text-xs text-primary font-semibold">{displayRole}</p>
            </div>
          </div>

          <button
            onClick={() => {
              sound.playClickSound();
              onClose();
            }}
            className="rounded-lg p-1.5 text-muted-foreground hover:bg-white/10 hover:text-white transition-colors"
            aria-label="Close dialog"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Top Key Info Card */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex flex-col items-center justify-center p-4 rounded-xl border border-red-500/30 bg-red-950/20 text-center">
              <div className="h-16 w-16 rounded-2xl bg-slate-900 border border-slate-700 flex items-center justify-center mb-2 shadow-inner">
                <UserX className="h-8 w-8 text-red-400" />
              </div>
              <span className="text-xs text-muted-foreground font-semibold">Reward Bounty</span>
              <span className="text-lg font-black text-amber-300 font-mono">{displayBounty}</span>
              <span className="text-[10px] text-red-400 uppercase font-bold tracking-wider mt-1">{displayDanger}</span>
            </div>

            <div className="md:col-span-2 p-4 rounded-xl border border-border bg-slate-900/40 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground font-bold">Threat Evaluation</span>
                <span className="text-xl font-black font-mono px-2 py-0.5 rounded border border-red-500/50 bg-red-950/40 text-red-400">
                  {riskScore}% RISK
                </span>
              </div>
              <div className="w-full h-2.5 rounded-full bg-slate-800 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-amber-500 to-red-600 transition-all duration-500"
                  style={{ width: `${riskScore}%` }}
                />
              </div>

              <div className="pt-2 border-t border-border/60">
                <span className="text-[11px] font-bold text-muted-foreground block mb-1">Aliases & Operational Monikers:</span>
                <div className="flex flex-wrap gap-1.5">
                  {displayAliases.map((alias, idx) => (
                    <span key={idx} className="text-[10px] font-mono px-2 py-0.5 rounded bg-muted/80 text-foreground border border-border">
                      "{alias}"
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Telemetry & Movement Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="p-3.5 rounded-xl border border-border bg-slate-900/40 space-y-1.5">
              <div className="flex items-center gap-1.5 text-muted-foreground font-semibold">
                <MapPin className="h-4 w-4 text-red-400" />
                <span>Last Verified Sighting</span>
              </div>
              <p className="font-bold text-foreground text-sm">{displayLocation}</p>
              <p className="text-[11px] text-muted-foreground flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" /> {displayLastSeen}
              </p>
            </div>

            <div className="p-3.5 rounded-xl border border-border bg-slate-900/40 space-y-1.5">
              <div className="flex items-center gap-1.5 text-muted-foreground font-semibold">
                <Car className="h-4 w-4 text-amber-400" />
                <span>ANPR Hotlisted Vehicle</span>
              </div>
              <p className="font-mono font-bold text-foreground text-sm">{displayVehicle}</p>
              <span className="text-[10px] text-amber-400 font-medium">Automatic Toll Intercept & Flashing Alert</span>
            </div>

            <div className="p-3.5 rounded-xl border border-border bg-slate-900/40 space-y-1.5">
              <div className="flex items-center gap-1.5 text-muted-foreground font-semibold">
                <Phone className="h-4 w-4 text-sky-400" />
                <span>Cellular Tower Intercept</span>
              </div>
              <p className="font-mono font-bold text-foreground text-sm">{displayPhone}</p>
              <span className="text-[10px] text-sky-400 font-medium">CDR Multi-Carrier Triangulation Active</span>
            </div>

            <div className="p-3.5 rounded-xl border border-border bg-slate-900/40 space-y-1.5">
              <div className="flex items-center gap-1.5 text-muted-foreground font-semibold">
                <AlertTriangle className="h-4 w-4 text-purple-400" />
                <span>Judicial Warrants & Charges</span>
              </div>
              <div className="space-y-0.5">
                {displayWarrants.map((w, idx) => (
                  <p key={idx} className="font-semibold text-foreground text-[11px] truncate">• {w}</p>
                ))}
              </div>
            </div>
          </div>

          {/* Explainable AI Risk Attribution Breakdown */}
          <div className="p-4 rounded-xl border border-indigo-500/40 bg-indigo-950/20 space-y-3">
            <div className="flex items-center justify-between border-b border-indigo-500/30 pb-2">
              <div className="flex items-center gap-2">
                <Brain className="h-4 w-4 text-indigo-400" />
                <h4 className="text-xs font-bold text-indigo-200 uppercase tracking-wide">
                  XAI Model Risk Factor Decomposition
                </h4>
              </div>
              <Badge variant="outline" className="border-indigo-400/50 text-indigo-300 text-[10px]">
                Sec 65B BNSS Compliant
              </Badge>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs">
              <div className="p-2 rounded bg-slate-900/70 border border-indigo-500/20">
                <span className="text-[10px] text-muted-foreground block">Hawala Volume</span>
                <span className="font-mono font-bold text-emerald-400">+35% Impact</span>
              </div>
              <div className="p-2 rounded bg-slate-900/70 border border-indigo-500/20">
                <span className="text-[10px] text-muted-foreground block">Degree Centrality</span>
                <span className="font-mono font-bold text-sky-400">+28% Impact</span>
              </div>
              <div className="p-2 rounded bg-slate-900/70 border border-indigo-500/20">
                <span className="text-[10px] text-muted-foreground block">CDR Anomaly</span>
                <span className="font-mono font-bold text-amber-400">+22% Impact</span>
              </div>
              <div className="p-2 rounded bg-slate-900/70 border border-indigo-500/20">
                <span className="text-[10px] text-muted-foreground block">Toll Sightings</span>
                <span className="font-mono font-bold text-red-400">+15% Impact</span>
              </div>
            </div>
          </div>

          {/* Action Toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-border">
            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant="danger"
                size="sm"
                onClick={handleLOC}
                className="bg-red-600 hover:bg-red-700 text-white font-bold flex items-center gap-1.5 shadow-md shadow-red-950/50"
              >
                <Radio className="h-3.5 w-3.5" />
                Issue LOC Notice
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={handleTrackOnMap}
                className="border-amber-500/50 text-amber-400 hover:bg-amber-950/30 flex items-center gap-1.5"
                title={`Track vehicle ${suspect.linked_vehicle || 'TS 09 AB 1234'} on live tactical map`}
              >
                <Car className="h-3.5 w-3.5" />
                Track Vehicle
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={handleInspectGraph}
                className="border-primary/50 text-primary hover:bg-primary/20 flex items-center gap-1.5"
              >
                <Network className="h-3.5 w-3.5" />
                Inspect in Graph
              </Button>
            </div>

            <div className="flex items-center gap-2">
              {onDownloadDossier && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onDownloadDossier(suspect)}
                  className="border-border text-foreground hover:bg-white/10 flex items-center gap-1.5"
                >
                  <Download className="h-3.5 w-3.5" />
                  Court Dossier PDF
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
);

  return typeof document !== 'undefined' ? createPortal(modalContent, document.body) : modalContent;
}
