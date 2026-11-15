import React, { useState, useEffect } from 'react';
import {
  BellRing,
  AlertTriangle,
  Clock,
  Shield,
  Layers,
  RefreshCw,
  TrendingUp,
  MapPin,
  Send,
  CheckCircle2
} from 'lucide-react';

interface VulnerableTarget {
  target_id: string;
  address: string;
  distance_m: number;
  risk_level: string;
  patrol_recommendation: string;
}

interface ContagionZone {
  origin_crime_id: string;
  offense_type: string;
  lat: number;
  lon: number;
  location: string;
  occurred_at: string;
  days_elapsed: number;
  days_remaining_in_window: number;
  relative_risk_multiplier: number;
  spatial_radius_m: number;
  status: string;
  vulnerable_targets: VulnerableTarget[];
}

interface NearRepeatResponse {
  district: string;
  total_origin_events: number;
  active_contagion_zones_count: number;
  spatial_bandwidth_m: number;
  temporal_window_days: number;
  methodology: string;
  zones: ContagionZone[];
}

export const NearRepeatAlertsPage: React.FC = () => {
  const [district, setDistrict] = useState<string>('South Delhi');
  const [windowDays, setWindowDays] = useState<number>(14);
  const [data, setData] = useState<NearRepeatResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [patrolDispatched, setPatrolDispatched] = useState<string | null>(null);

  const fetchAlerts = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/v1/near-repeat/alerts?district=${encodeURIComponent(district)}&window_days=${windowDays}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      setData(json);
    } catch (err: any) {
      setError(err.message || 'Error fetching near-repeat victimization alerts');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
  }, [district, windowDays]);

  const handleDispatchPatrol = (zoneId: string, address: string) => {
    setPatrolDispatched(`High-visibility prophylactic patrol dispatched to ${address} for Zone ${zoneId}`);
    setTimeout(() => setPatrolDispatched(null), 5000);
  };

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto min-w-0">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/40 pb-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <BellRing className="w-7 h-7 text-amber-500 shrink-0" />
            <h1 className="text-xl md:text-2xl font-bold tracking-tight text-foreground overflow-hidden text-ellipsis whitespace-nowrap" title="Near-Repeat Victimization Prediction & Prophylactic Alerts">
              Near-Repeat Victimization Prediction & Alerts
            </h1>
          </div>
          <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
            Knox-Mantel spatio-temporal contagion modeling. Automatically identifies elevated secondary burglary/heist risks within 300m for 14 days post-incident to deploy preventative deterrence.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <select
            value={district}
            onChange={(e) => setDistrict(e.target.value)}
            className="bg-card border border-border text-foreground rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 whitespace-nowrap"
          >
            <option value="South Delhi">South Delhi Police District</option>
            <option value="Central Delhi">Central Delhi Police District</option>
            <option value="Dwarka">Dwarka Police District</option>
          </select>
          <button
            onClick={fetchAlerts}
            className="flex items-center gap-2 px-3 py-2 bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 rounded-lg text-sm font-medium border border-amber-500/30 transition-all whitespace-nowrap shrink-0"
            title="Refresh Contagion Alerts"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {patrolDispatched && (
        <div className="p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-sm flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <span className="overflow-hidden text-ellipsis whitespace-nowrap">{patrolDispatched}</span>
        </div>
      )}

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
            <span>Active Contagion Zones</span>
            <AlertTriangle className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold text-amber-400 mt-2">
            {data?.active_contagion_zones_count || 0} Zones
          </div>
          <div className="text-xs text-muted-foreground mt-1">Spatial Bandwidth: 350 meters</div>
        </div>

        <div className="p-4 rounded-xl bg-card border border-border shadow-sm min-w-0">
          <div className="flex items-center justify-between text-muted-foreground text-xs font-semibold uppercase tracking-wider">
            <span>Peak Risk Multiplier</span>
            <TrendingUp className="w-4 h-4 text-red-400" />
          </div>
          <div className="text-2xl font-bold text-red-400 mt-2">
            3.2&times; Normal
          </div>
          <div className="text-xs text-muted-foreground mt-1">Elevated 0–7 days post-incident</div>
        </div>

        <div className="p-4 rounded-xl bg-card border border-border shadow-sm min-w-0">
          <div className="flex items-center justify-between text-muted-foreground text-xs font-semibold uppercase tracking-wider">
            <span>Contagion Window</span>
            <Clock className="w-4 h-4 text-primary" />
          </div>
          <div className="text-2xl font-bold text-foreground mt-2">
            {windowDays} Days
          </div>
          <div className="text-xs text-muted-foreground mt-1">Knox Temporal Matrix Threshold</div>
        </div>

        <div className="p-4 rounded-xl bg-card border border-border shadow-sm min-w-0">
          <div className="flex items-center justify-between text-muted-foreground text-xs font-semibold uppercase tracking-wider">
            <span>Prevention Directive</span>
            <Shield className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-sm font-semibold text-emerald-400 mt-2 overflow-hidden text-ellipsis whitespace-nowrap">
            Prophylactic Patrol Active
          </div>
          <div className="text-xs text-muted-foreground mt-1">Preventing repeat target visits</div>
        </div>
      </div>

      {/* Main Contagion Zones Feed */}
      <div className="space-y-6">
        {data?.zones.map((zone) => (
          <div key={zone.origin_crime_id} className="p-5 bg-card border border-border rounded-xl shadow-sm min-w-0 space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-border/40 pb-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-foreground text-base overflow-hidden text-ellipsis whitespace-nowrap">
                    {zone.origin_crime_id}
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 whitespace-nowrap">
                    {zone.offense_type}
                  </span>
                </div>
                <div className="text-xs text-muted-foreground mt-1 flex items-center gap-3">
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-muted-foreground" />
                    {zone.location}
                  </span>
                  <span>&bull;</span>
                  <span>Occurred: {new Date(zone.occurred_at).toLocaleDateString()} ({zone.days_elapsed}d ago)</span>
                </div>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <div className="text-right">
                  <div className="text-xs font-bold text-red-400">
                    {zone.relative_risk_multiplier}&times; Contagion Multiplier
                  </div>
                  <div className="text-[11px] text-muted-foreground">
                    {zone.days_remaining_in_window} days left in danger window
                  </div>
                </div>
              </div>
            </div>

            {/* Vulnerable Targets Table within this zone */}
            <div className="min-w-0">
              <div className="text-xs font-semibold text-foreground mb-2 flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-amber-400" />
                Vulnerable Secondary Premises Inside {zone.spatial_radius_m}m Blast Radius:
              </div>

              <div className="overflow-x-auto w-full">
                <table className="w-full text-left text-xs min-w-[650px]">
                  <thead className="bg-muted/40 text-muted-foreground uppercase text-[10px] tracking-wider border-b border-border">
                    <tr>
                      <th className="py-2 px-3">Target ID</th>
                      <th className="py-2 px-3">Premises / Address</th>
                      <th className="py-2 px-3 text-right">Distance</th>
                      <th className="py-2 px-3 text-center">Calculated Risk</th>
                      <th className="py-2 px-3">Patrol Recommendation</th>
                      <th className="py-2 px-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/40">
                    {zone.vulnerable_targets.map((tgt) => (
                      <tr key={tgt.target_id} className="hover:bg-muted/20 transition-colors">
                        <td className="py-2 px-3 font-mono text-muted-foreground">{tgt.target_id}</td>
                        <td className="py-2 px-3 font-medium text-foreground overflow-hidden text-ellipsis whitespace-nowrap max-w-[200px]" title={tgt.address}>
                          {tgt.address}
                        </td>
                        <td className="py-2 px-3 text-right font-mono">{tgt.distance_m} m</td>
                        <td className="py-2 px-3 text-center">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold whitespace-nowrap ${
                            tgt.risk_level === 'CRITICAL'
                              ? 'bg-red-500/20 text-red-300 border border-red-500/30'
                              : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                          }`}>
                            {tgt.risk_level}
                          </span>
                        </td>
                        <td className="py-2 px-3 text-muted-foreground overflow-hidden text-ellipsis whitespace-nowrap max-w-[220px]" title={tgt.patrol_recommendation}>
                          {tgt.patrol_recommendation}
                        </td>
                        <td className="py-2 px-3 text-right">
                          <button
                            onClick={() => handleDispatchPatrol(zone.origin_crime_id, tgt.address)}
                            className="flex items-center gap-1 px-2.5 py-1 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 rounded text-[11px] font-medium border border-amber-500/30 transition-colors whitespace-nowrap shrink-0 ml-auto"
                          >
                            <Send className="w-3 h-3" />
                            Dispatch
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default NearRepeatAlertsPage;
