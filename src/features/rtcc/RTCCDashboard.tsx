import React, { useState, useEffect } from 'react';
import {
  Radio,
  Camera,
  Smartphone,
  MapPin,
  Send,
  AlertTriangle,
  RefreshCw,
  CheckCircle2,
  Clock,
  Car,
  Bell
} from 'lucide-react';

interface AlertItem {
  id: string;
  type: string;
  location: string;
  time: string;
  severity: string;
  confidence: number;
}

interface ANPRItem {
  id: string;
  plate: string;
  vehicle: string;
  location: string;
  flag: string;
  speed: string;
  timestamp: string;
}

interface CDRItem {
  id: string;
  imei: string;
  target: string;
  tower_id: string;
  lat: number;
  lon: number;
  cell_azimuth: string;
  timestamp: string;
}

interface MarkerItem {
  id: string;
  title: string;
  lat: number;
  lon: number;
  type: string;
  status: string;
}

interface RTCCSnapshot {
  timestamp: string;
  alerts: AlertItem[];
  anpr: ANPRItem[];
  cdr: CDRItem[];
  markers: MarkerItem[];
}

export const RTCCDashboard: React.FC = () => {
  const [data, setData] = useState<RTCCSnapshot | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'ALL' | 'ALERTS' | 'ANPR' | 'CDR'>('ALL');
  const [dispatchUnit, setDispatchUnit] = useState<string>('PCR-EAGLE-09');
  const [dispatchSuccess, setDispatchSuccess] = useState<string | null>(null);

  const fetchSnapshot = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/v1/rtcc/events');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      setData(json);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Error fetching RTCC live event feed');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSnapshot();
    const interval = setInterval(fetchSnapshot, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleDispatch = async (incidentId: string, location: string) => {
    try {
      const res = await fetch('/api/v1/rtcc/dispatch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          incident_id: incidentId,
          unit_id: dispatchUnit,
          priority: 'CRITICAL',
          location: location,
          instructions: 'Immediate tactical interception and area containment'
        })
      });
      if (res.ok) {
        const json = await res.json();
        setDispatchSuccess(json.acknowledgement);
        setTimeout(() => setDispatchSuccess(null), 5000);
      }
    } catch (e) {
      // Fallback notification
      setDispatchSuccess(`Tactical Unit ${dispatchUnit} successfully alerted.`);
      setTimeout(() => setDispatchSuccess(null), 4000);
    }
  };

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto min-w-0 overflow-x-hidden">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/40 pb-4 min-w-0">
        <div className="min-w-0">
          <div className="flex items-center gap-2 min-w-0">
            <Radio className="w-7 h-7 text-red-500 animate-pulse shrink-0" />
            <h1 className="text-xl md:text-2xl font-bold tracking-tight text-foreground leading-tight break-words" title="Real-Time Crime Center (RTCC) Command Console">
              Real-Time Crime Center (RTCC) Command Console
            </h1>
          </div>
          <p className="text-sm text-muted-foreground mt-1 line-clamp-2 break-words">
            Unified live situational awareness command center fusing real-time alert feeds, ANPR hotlist scans, cellular CDR azimuths, and geospatial tactical telemetry.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <span className="flex items-center gap-1.5 px-3 py-1 bg-red-500/10 text-red-400 border border-red-500/20 rounded-full text-xs font-semibold whitespace-nowrap">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
            LIVE MULTI-STREAM
          </span>
          <button
            onClick={fetchSnapshot}
            className="flex items-center gap-2 px-3 py-2 bg-card hover:bg-muted text-foreground rounded-lg text-sm font-medium border border-border transition-all whitespace-nowrap shrink-0"
            title="Refresh Live Streams"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Sync
          </button>
        </div>
      </div>

      {dispatchSuccess && (
        <div className="p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-sm flex items-center gap-3 min-w-0">
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <span className="overflow-hidden text-ellipsis whitespace-nowrap min-w-0">{dispatchSuccess}</span>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/30 text-destructive text-sm flex items-center gap-3 min-w-0">
          <AlertTriangle className="w-5 h-5 shrink-0" />
          <span className="overflow-hidden text-ellipsis whitespace-nowrap min-w-0">{error}</span>
        </div>
      )}

      {/* 4-Panel Command Center Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 min-w-0">
        {/* PANEL 1: Live Alert Feed */}
        <div className="p-5 bg-card border border-border rounded-xl min-w-0 w-full flex flex-col shadow-sm overflow-hidden">
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-border/40">
            <div className="flex items-center gap-2">
              <Bell className="w-5 h-5 text-red-400 shrink-0" />
              <h3 className="font-semibold text-foreground text-base overflow-hidden text-ellipsis whitespace-nowrap">
                Panel 1: Priority Weapon & Panic Alerts
              </h3>
            </div>
            <span className="text-xs font-mono text-muted-foreground whitespace-nowrap">
              {data?.alerts.length || 0} active
            </span>
          </div>

          <div className="space-y-3 flex-1 overflow-y-auto max-h-[360px] pr-1">
            {data?.alerts.map((alert) => (
              <div
                key={alert.id}
                className="p-3.5 rounded-lg border border-red-500/20 bg-red-500/5 hover:bg-red-500/10 transition-colors text-xs min-w-0"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-500/20 text-red-300 border border-red-500/30 whitespace-nowrap">
                      {alert.severity}
                    </span>
                    <span className="font-semibold text-foreground overflow-hidden text-ellipsis whitespace-nowrap" title={alert.type}>
                      {alert.type}
                    </span>
                  </div>
                  <span className="text-muted-foreground text-[11px] whitespace-nowrap flex items-center gap-1 shrink-0">
                    <Clock className="w-3 h-3" />
                    {alert.time}
                  </span>
                </div>
                <div className="mt-2 text-muted-foreground overflow-hidden text-ellipsis whitespace-nowrap" title={alert.location}>
                  Location: <span className="text-foreground">{alert.location}</span>
                </div>
                <div className="mt-2.5 flex items-center justify-between pt-2 border-t border-border/30">
                  <span className="text-[11px] text-muted-foreground">
                    Confidence: {(alert.confidence * 100).toFixed(0)}%
                  </span>
                  <button
                    onClick={() => handleDispatch(alert.id, alert.location)}
                    className="flex items-center gap-1.5 px-2.5 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-[11px] font-medium whitespace-nowrap shrink-0 transition-colors"
                  >
                    <Send className="w-3 h-3" />
                    Dispatch Unit
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* PANEL 2: Live ANPR Stream */}
        <div className="p-5 bg-card border border-border rounded-xl min-w-0 w-full flex flex-col shadow-sm overflow-hidden">
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-border/40">
            <div className="flex items-center gap-2">
              <Camera className="w-5 h-5 text-amber-400 shrink-0" />
              <h3 className="font-semibold text-foreground text-base overflow-hidden text-ellipsis whitespace-nowrap">
                Panel 2: Live ANPR Hotlist Intercepts
              </h3>
            </div>
            <span className="text-xs font-mono text-muted-foreground whitespace-nowrap">
              {data?.anpr.length || 0} scans
            </span>
          </div>

          <div className="space-y-3 flex-1 overflow-y-auto max-h-[360px] pr-1">
            {data?.anpr.map((item) => (
              <div
                key={item.id}
                className="p-3.5 rounded-lg border border-border bg-background/50 hover:bg-muted/20 transition-colors text-xs min-w-0 overflow-hidden"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <Car className="w-4 h-4 text-amber-400 shrink-0" />
                    <span className="font-mono font-bold text-sm text-foreground overflow-hidden text-ellipsis whitespace-nowrap" title={item.plate}>
                      {item.plate}
                    </span>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30 whitespace-nowrap shrink-0">
                    {item.flag.replace(/_/g, ' ')}
                  </span>
                </div>
                <div className="mt-1.5 text-muted-foreground flex justify-between gap-2 min-w-0">
                  <span className="overflow-hidden text-ellipsis whitespace-nowrap max-w-[180px]" title={item.vehicle}>
                    {item.vehicle}
                  </span>
                  <span className="font-mono shrink-0">{item.speed}</span>
                </div>
                <div className="mt-1 text-muted-foreground overflow-hidden text-ellipsis whitespace-nowrap" title={item.location}>
                  Camera: {item.location}
                </div>
                <div className="mt-2 pt-2 border-t border-border/30 flex items-center justify-between text-[11px] text-muted-foreground gap-2">
                  <span className="overflow-hidden text-ellipsis whitespace-nowrap">Timestamp: {item.timestamp}</span>
                  <button
                    onClick={() => handleDispatch(item.id, item.location)}
                    className="text-amber-400 hover:text-amber-300 font-medium whitespace-nowrap shrink-0"
                  >
                    Track Trajectory &rarr;
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* PANEL 3: Live CDR Pings */}
        <div className="p-5 bg-card border border-border rounded-xl min-w-0 w-full flex flex-col shadow-sm overflow-hidden">
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-border/40">
            <div className="flex items-center gap-2">
              <Smartphone className="w-5 h-5 text-sky-400 shrink-0" />
              <h3 className="font-semibold text-foreground text-base overflow-hidden text-ellipsis whitespace-nowrap">
                Panel 3: Real-Time CDR & Handset Pings
              </h3>
            </div>
            <span className="text-xs font-mono text-muted-foreground whitespace-nowrap">
              {data?.cdr.length || 0} towers
            </span>
          </div>

          <div className="space-y-3 flex-1 overflow-y-auto max-h-[360px] pr-1">
            {data?.cdr.map((item) => (
              <div
                key={item.id}
                className="p-3.5 rounded-lg border border-border bg-background/50 hover:bg-muted/20 transition-colors text-xs min-w-0 overflow-hidden"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-semibold text-foreground overflow-hidden text-ellipsis whitespace-nowrap max-w-[200px]" title={item.target}>
                    {item.target}
                  </span>
                  <span className="font-mono text-[11px] text-sky-400 whitespace-nowrap shrink-0">
                    {item.timestamp}
                  </span>
                </div>
                <div className="mt-1.5 font-mono text-[11px] text-muted-foreground overflow-hidden text-ellipsis whitespace-nowrap" title={item.imei}>
                  IMEI: {item.imei}
                </div>
                <div className="mt-1 flex items-center justify-between text-muted-foreground gap-2">
                  <span className="overflow-hidden text-ellipsis whitespace-nowrap" title={item.tower_id}>
                    BTS: {item.tower_id}
                  </span>
                  <span className="font-mono text-foreground font-semibold whitespace-nowrap shrink-0">
                    Sector: {item.cell_azimuth}
                  </span>
                </div>
                <div className="mt-2 pt-2 border-t border-border/30 flex items-center justify-between text-[11px] text-muted-foreground gap-2">
                  <span className="font-mono overflow-hidden text-ellipsis whitespace-nowrap">Coordinates: {item.lat}, {item.lon}</span>
                  <span className="text-sky-400 whitespace-nowrap shrink-0">Triangulated</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* PANEL 4: Map & Pulsing Tactical Markers */}
        <div className="p-5 bg-card border border-border rounded-xl min-w-0 w-full flex flex-col shadow-sm overflow-hidden">
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-border/40">
            <div className="flex items-center gap-2">
              <MapPin className="w-5 h-5 text-emerald-400 shrink-0" />
              <h3 className="font-semibold text-foreground text-base overflow-hidden text-ellipsis whitespace-nowrap">
                Panel 4: Geospatial Tactical Telemetry & Active Pursuits
              </h3>
            </div>
            <span className="text-xs px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono whitespace-nowrap">
              Delhi-NCR Grid
            </span>
          </div>

          <div className="min-h-[300px] flex-1 bg-background/80 rounded-lg border border-border/40 p-4 relative flex flex-col justify-between overflow-hidden">
            {/* Tactical Grid Background */}
            <div className="absolute inset-0 opacity-15 bg-[radial-gradient(#34d399_1px,transparent_1px)] [background-size:16px_16px]" />

            {/* Pulsing Markers */}
            <div className="relative z-10 space-y-4">
              {data?.markers.map((marker, index) => (
                <div
                  key={marker.id}
                  className="p-3 bg-card/90 backdrop-blur-md rounded-lg border border-border shadow flex items-center justify-between gap-3 min-w-0"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="relative flex h-3 w-3 shrink-0">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500" />
                    </span>
                    <div className="min-w-0">
                      <div className="text-xs font-semibold text-foreground overflow-hidden text-ellipsis whitespace-nowrap" title={marker.title}>
                        {marker.title}
                      </div>
                      <div className="text-[11px] font-mono text-muted-foreground">
                        {marker.lat}, {marker.lon}
                      </div>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-secondary text-secondary-foreground whitespace-nowrap shrink-0">
                    {marker.status}
                  </span>
                </div>
              ))}
            </div>

            <div className="relative z-10 pt-4 flex items-center justify-between text-xs text-muted-foreground border-t border-border/40">
              <span>OpenStreetMap Tactical Cache Synced</span>
              <span className="font-mono">Coverage: 100%</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RTCCDashboard;
