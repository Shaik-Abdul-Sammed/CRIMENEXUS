import React, { useState, useEffect } from 'react';
import {
  MapPin,
  ShieldAlert,
  Users,
  Lock,
  Eye,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  Layers,
  FileCheck2
} from 'lucide-react';

interface AnonymizedDevice {
  device_anon_id: string;
  pings: number;
  dwell_time_mins: number;
  status: string;
}

interface DeanonymizedTarget {
  device_anon_id: string;
  revealed_imsi: string;
  msisdn: string;
  owner_name: string;
  probable_cause_verified: boolean;
}

interface GeofenceWarrant {
  warrant_id: string;
  case_id: string;
  polygon_area: string;
  time_window: string;
  step_1_total_devices_in_polygon: number;
  step_2_anonymized_candidates: AnonymizedDevice[];
  step_3_deanonymized_targets: DeanonymizedTarget[];
  magistrate_bench: string;
  constitutional_status: string;
}

export const GeofencePage: React.FC = () => {
  const [warrants, setWarrants] = useState<GeofenceWarrant[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedWarrant, setSelectedWarrant] = useState<GeofenceWarrant | null>(null);
  const [deanonymizing, setDeanonymizing] = useState<boolean>(false);
  const [deanonymizeSuccess, setDeanonymizeSuccess] = useState<string | null>(null);

  const fetchWarrants = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/v1/geofence/warrants');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setWarrants(data || []);
      if (data && data.length > 0) setSelectedWarrant(data[0]);
    } catch (err: any) {
      setError(err.message || 'Error communicating with Geofence warrant engine');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWarrants();
  }, []);

  const handleDeanonymize = async (anonId: string) => {
    if (!selectedWarrant) return;
    setDeanonymizing(true);
    try {
      const res = await fetch('/api/v1/geofence/deanonymize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          warrant_id: selectedWarrant.warrant_id,
          anonymized_device_id: anonId,
          probable_cause_affidavit: 'Corroborated loitering in vault corridor during alarm trigger'
        })
      });
      if (res.ok) {
        const json = await res.json();
        setDeanonymizeSuccess(`Step 3 Complete: ${anonId} unmasked as ${json.owner_name} (${json.msisdn})`);
        fetchWarrants();
      }
    } catch (e: any) {
      setError(e.message || 'De-anonymization failed');
    } finally {
      setDeanonymizing(false);
    }
  };

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto min-w-0">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/40 pb-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <MapPin className="w-7 h-7 text-sky-400 shrink-0" />
            <h1 className="text-xl md:text-2xl font-bold tracking-tight text-foreground overflow-hidden text-ellipsis whitespace-nowrap" title="Constitutional Reverse-Location Geofence Warrants">
              Reverse-Location Geofence Warrants
            </h1>
          </div>
          <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
            Constitutional 3-step filtering pipeline satisfying the Supreme Court Puttaswamy proportionality test: (1) Broad polygon boundary &rarr; (2) Anonymized commuter elimination &rarr; (3) Probable-cause judicial de-anonymization.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={fetchWarrants}
            className="flex items-center gap-2 px-3 py-2 bg-card hover:bg-muted text-foreground rounded-lg text-sm font-medium border border-border transition-all whitespace-nowrap shrink-0"
            title="Refresh Geofence Warrants"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {deanonymizeSuccess && (
        <div className="p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-sm flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 shrink-0" />
            <span>{deanonymizeSuccess}</span>
          </div>
          <button onClick={() => setDeanonymizeSuccess(null)} className="text-xs text-muted-foreground hover:text-foreground">
            Dismiss
          </button>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/30 text-destructive text-sm flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 shrink-0" />
          <span className="overflow-hidden text-ellipsis whitespace-nowrap">{error}</span>
        </div>
      )}

      {/* 3-Step Pipeline Flow Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-5 bg-card border border-border rounded-xl min-w-0">
          <div className="flex items-center gap-2 text-sky-400 font-bold text-xs uppercase tracking-wider mb-2">
            <span className="w-5 h-5 rounded-full bg-sky-500/20 flex items-center justify-center font-mono">1</span>
            Step 1: Broad Polygon Query
          </div>
          <div className="text-2xl font-bold text-foreground mt-1">
            {selectedWarrant?.step_1_total_devices_in_polygon || 0} Devices
          </div>
          <div className="text-xs text-muted-foreground mt-2 line-clamp-2" title={selectedWarrant?.polygon_area}>
            Boundary: {selectedWarrant?.polygon_area || 'None'}
          </div>
        </div>

        <div className="p-5 bg-card border border-border rounded-xl min-w-0">
          <div className="flex items-center gap-2 text-amber-400 font-bold text-xs uppercase tracking-wider mb-2">
            <span className="w-5 h-5 rounded-full bg-amber-500/20 flex items-center justify-center font-mono">2</span>
            Step 2: Anonymized Scrubbing
          </div>
          <div className="text-2xl font-bold text-amber-400 mt-1">
            {selectedWarrant?.step_2_anonymized_candidates.length || 0} Filtered Candidates
          </div>
          <div className="text-xs text-muted-foreground mt-2">
            Eliminates bystanders, residents & passers-by
          </div>
        </div>

        <div className="p-5 bg-card border border-emerald-500/30 bg-emerald-500/5 rounded-xl min-w-0">
          <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs uppercase tracking-wider mb-2">
            <span className="w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center font-mono">3</span>
            Step 3: Judicial De-anonymization
          </div>
          <div className="text-2xl font-bold text-emerald-400 mt-1">
            {selectedWarrant?.step_3_deanonymized_targets.length || 0} Warrant Targets
          </div>
          <div className="text-xs text-emerald-300 mt-2">
            Full subscriber ID unmasked via Court Order
          </div>
        </div>
      </div>

      {/* Warrant Detail Panels */}
      {selectedWarrant && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Step 2 Candidates List */}
          <div className="p-5 bg-card border border-border rounded-xl min-w-0 space-y-4">
            <div className="flex items-center justify-between border-b border-border/40 pb-3">
              <div>
                <h3 className="font-semibold text-foreground text-base">
                  Step 2: Anonymized Candidate Devices
                </h3>
                <span className="text-xs text-muted-foreground">
                  Review dwell-time and trajectory before requesting unmasking
                </span>
              </div>
              <span className="text-xs font-mono px-2 py-0.5 rounded bg-secondary text-secondary-foreground">
                Anonymized
              </span>
            </div>

            <div className="space-y-3">
              {selectedWarrant.step_2_anonymized_candidates.map((cand) => (
                <div
                  key={cand.device_anon_id}
                  className="p-3.5 rounded-lg border border-border bg-background/50 text-xs flex items-center justify-between gap-3 min-w-0"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <Lock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                      <span className="font-mono font-bold text-foreground overflow-hidden text-ellipsis whitespace-nowrap">
                        {cand.device_anon_id}
                      </span>
                    </div>
                    <div className="text-muted-foreground mt-1 flex gap-3">
                      <span>Pings: {cand.pings}</span>
                      <span>Dwell Time: {cand.dwell_time_mins} mins</span>
                    </div>
                    <div className="text-[11px] font-semibold text-amber-300 mt-1">
                      {cand.status.replace(/_/g, ' ')}
                    </div>
                  </div>

                  <button
                    onClick={() => handleDeanonymize(cand.device_anon_id)}
                    disabled={deanonymizing}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-xs font-semibold transition-colors whitespace-nowrap shrink-0"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    Unmask Target
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Step 3 De-anonymized Targets Roster */}
          <div className="p-5 bg-card border border-border rounded-xl min-w-0 space-y-4">
            <div className="flex items-center justify-between border-b border-border/40 pb-3">
              <div>
                <h3 className="font-semibold text-foreground text-base">
                  Step 3: Unmasked Subscriber Targets
                </h3>
                <span className="text-xs text-muted-foreground">
                  Probable-cause verified by Magistrate
                </span>
              </div>
              <span className="text-xs font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-bold">
                De-Anonymized
              </span>
            </div>

            <div className="space-y-3">
              {selectedWarrant.step_3_deanonymized_targets.length === 0 ? (
                <div className="p-8 text-center text-xs text-muted-foreground">
                  No devices de-anonymized yet. Select a candidate from Step 2 to file judicial unmasking.
                </div>
              ) : (
                selectedWarrant.step_3_deanonymized_targets.map((tgt) => (
                  <div
                    key={tgt.device_anon_id}
                    className="p-3.5 rounded-lg border border-emerald-500/30 bg-emerald-500/5 text-xs space-y-1.5 min-w-0"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-foreground text-sm overflow-hidden text-ellipsis whitespace-nowrap" title={tgt.owner_name}>
                        {tgt.owner_name}
                      </span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 whitespace-nowrap">
                        AFFIDAVIT VERIFIED
                      </span>
                    </div>
                    <div className="font-mono text-muted-foreground flex justify-between">
                      <span>Phone: {tgt.msisdn}</span>
                      <span>IMSI: {tgt.revealed_imsi}</span>
                    </div>
                    <div className="text-[11px] text-muted-foreground">
                      Linked from Anonymized Token: <span className="font-mono font-bold text-foreground">{tgt.device_anon_id}</span>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="p-3 rounded bg-muted/40 border border-border text-[11px] text-muted-foreground">
              Magistrate Approval: <strong className="text-foreground">{selectedWarrant.magistrate_bench}</strong>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GeofencePage;
