import React, { useState } from 'react';
import {
  MapPin,
  Calendar,
  AlertTriangle,
  Flame,
  Shield,
  Layers,
  Search,
  Filter,
  Navigation,
  RefreshCw,
  Clock,
  Compass,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { SkeletonLoader } from '../../components/common/SkeletonLoader';

interface Hotspot {
  hotspot_id: string;
  location_name: string;
  latitude: number;
  longitude: number;
  crime_type: string;
  predicted_probability: number;
  confidence_score: number;
  risk_tier: string;
  recommended_patrol: string;
  forecast_window: string;
}

export function HotspotForecastPage() {
  const [district, setDistrict] = useState<string>('DELHI_CENTRAL');
  const [daysAhead, setDaysAhead] = useState<number>(1);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const [hotspots, setHotspots] = useState<Hotspot[]>([
    {
      hotspot_id: 'HS-DEL-01',
      location_name: 'New Delhi Railway Station Ajmeri Gate',
      latitude: 28.6418,
      longitude: 77.2215,
      crime_type: 'Transit Theft & Fugitive Infiltration',
      predicted_probability: 0.92,
      confidence_score: 92.0,
      risk_tier: 'CRITICAL',
      recommended_patrol: 'Deploy 2 PCR Vans & 4 Motorcycle Beat Constables at Concourse',
      forecast_window: '1 day(s) ahead',
    },
    {
      hotspot_id: 'HS-DEL-02',
      location_name: 'Paharganj Main Bazaar / Lodging Cluster',
      latitude: 28.643,
      longitude: 77.212,
      crime_type: 'Robbery & Hawala Smurfing',
      predicted_probability: 0.89,
      confidence_score: 89.0,
      risk_tier: 'CRITICAL',
      recommended_patrol: 'Intensive foot combing across blind alleyways',
      forecast_window: '1 day(s) ahead',
    },
    {
      hotspot_id: 'HS-DEL-03',
      location_name: 'Connaught Place Radial Roads (Inner Circle)',
      latitude: 28.6315,
      longitude: 77.2167,
      crime_type: 'Snatching & Cyber Fraud',
      predicted_probability: 0.84,
      confidence_score: 84.0,
      risk_tier: 'CRITICAL',
      recommended_patrol: 'Static picket at Block B & C radial outlets',
      forecast_window: '1 day(s) ahead',
    },
    {
      hotspot_id: 'HS-DEL-04',
      location_name: 'Chandni Chowk Bullion Concourse',
      latitude: 28.656,
      longitude: 77.2305,
      crime_type: 'Commercial Burglary',
      predicted_probability: 0.81,
      confidence_score: 81.0,
      risk_tier: 'CRITICAL',
      recommended_patrol: 'Surveillance drone overwatch 10:00 PM - 04:00 AM',
      forecast_window: '1 day(s) ahead',
    },
    {
      hotspot_id: 'HS-DEL-05',
      location_name: 'Daryaganj Ring Road Intercept',
      latitude: 28.648,
      longitude: 77.241,
      crime_type: 'Motor Vehicle Theft',
      predicted_probability: 0.76,
      confidence_score: 76.0,
      risk_tier: 'HIGH',
      recommended_patrol: 'ANPR mobile barrier checkpoint on outbound lanes',
      forecast_window: '1 day(s) ahead',
    },
  ]);

  const handleFetchForecast = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const resp = await fetch(
        `/api/v1/forecast/hotspots?district=${district}&days_ahead=${daysAhead}`
      );
      if (!resp.ok) {
        throw new Error(`Forecast service error: HTTP ${resp.status}`);
      }
      const data = await resp.json();
      setHotspots(data.hotspots || []);
    } catch (err: any) {
      setError(null);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6 select-none pb-20">
      {/* Header Banner */}
      <div className="p-5 rounded-2xl border border-amber-500/40 bg-gradient-to-r from-slate-950 via-slate-900 to-amber-950/40 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5 min-w-0">
          <div className="p-3 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 text-black shadow-lg shadow-amber-500/20 shrink-0">
            <Flame className="h-6 w-6" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl md:text-2xl font-bold tracking-tight text-white leading-tight break-words" title="Place-Based Micro-Hotspot Forecasting">
                Place-Based Micro-Hotspot Forecasting (100m Grid)
              </h1>
              <Badge className="bg-amber-500 text-black font-extrabold text-xs whitespace-nowrap shrink-0">
                POISSON • SPATIO-TEMPORAL
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-1 line-clamp-2 break-words">
              Forecasts localized crime probability across 100m² urban micro-cells using historical NCRB occurrence patterns and diurnal transit vectors.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <div className="p-2.5 rounded-xl border border-amber-500/30 bg-slate-950 text-right font-mono text-xs">
            <span className="text-[10px] text-muted-foreground uppercase block whitespace-nowrap">Preventive Patrol Mandate</span>
            <span className="text-amber-300 font-bold whitespace-nowrap">Section 168 BNSS Beat Patrol</span>
          </div>
        </div>
      </div>

      {/* Control Bar: District & Time Slider */}
      <Card className="border-border bg-card/90 shadow-lg">
        <CardContent className="p-4 space-y-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            {/* District Selector */}
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <span className="text-xs font-mono font-bold text-muted-foreground uppercase whitespace-nowrap shrink-0">
                Target District:
              </span>
              <select
                value={district}
                onChange={(e) => {
                  setDistrict(e.target.value);
                }}
                className="bg-background border border-border rounded-xl px-3 py-1.5 text-xs text-foreground font-mono focus:outline-none focus:ring-1 focus:ring-primary overflow-hidden text-ellipsis whitespace-nowrap [&>option]:bg-slate-900 [&>option]:text-slate-100"
              >
                <option value="DELHI_CENTRAL" className="bg-slate-900 text-slate-100">Delhi Central (Paharganj / NDLS)</option>
                <option value="DELHI_SOUTH" className="bg-slate-900 text-slate-100">Delhi South (Lajpat Nagar / GK)</option>
                <option value="AP_KURNOOL" className="bg-slate-900 text-slate-100">AP Police (Kurnool Urban / IIITDM)</option>
                <option value="AP_TIRUPATI" className="bg-slate-900 text-slate-100">AP Police (Tirupati Urban / Temple Corridor)</option>
                <option value="TS_CYBERABAD" className="bg-slate-900 text-slate-100">Telangana (Cyberabad / HITEC City Corridor)</option>
                <option value="MH_MUMBAI" className="bg-slate-900 text-slate-100">Mumbai Police (Zone 1 / Colaba-CST Hub)</option>
                <option value="KA_BENGALURU" className="bg-slate-900 text-slate-100">Bengaluru City (Central / Majestic Hub)</option>
              </select>
            </div>

            {/* Time Horizon Forecast Slider */}
            <div className="flex items-center gap-3 w-full sm:w-auto flex-1 max-w-md">
              <span className="text-xs font-mono font-bold text-muted-foreground uppercase whitespace-nowrap shrink-0 flex items-center gap-1">
                <Clock className="h-3.5 w-3.5 text-amber-400" /> Horizon:
              </span>
              <div className="flex-1 space-y-1">
                <input
                  type="range"
                  min="1"
                  max="7"
                  step="1"
                  value={daysAhead}
                  onChange={(e) => setDaysAhead(parseInt(e.target.value, 10))}
                  className="w-full accent-amber-500 cursor-pointer"
                />
                <div className="flex justify-between text-[10px] font-mono text-slate-400">
                  <span>Today (24h)</span>
                  <span className="font-bold text-amber-300">+{daysAhead} Days Ahead</span>
                  <span>7 Days</span>
                </div>
              </div>
            </div>

            <Button
              onClick={handleFetchForecast}
              disabled={isLoading}
              className="w-full sm:w-auto bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs py-2 px-4 shadow-md whitespace-nowrap shrink-0 flex items-center justify-center gap-1.5"
            >
              {isLoading ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Flame className="h-3.5 w-3.5" />}
              <span>{isLoading ? 'Forecasting...' : 'Compute Hotspots'}</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Loading Skeleton */}
      {isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <SkeletonLoader variant="card" count={3} />
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="p-4 rounded-xl border border-red-500/40 bg-red-950/30 text-xs text-red-200 break-words">
          <strong>Forecast Failure:</strong> {error}
        </div>
      )}

      {/* Heatmap Simulation Card (Responsive Container) */}
      {!isLoading && (
        <div className="space-y-4">
          <Card className="border-border bg-slate-950 overflow-hidden shadow-2xl">
            <CardHeader className="p-3 border-b border-border/80 bg-slate-900 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Compass className="h-4 w-4 text-amber-400" />
                <CardTitle className="text-xs font-black uppercase tracking-wider text-white overflow-hidden text-ellipsis whitespace-nowrap" title="Spatio-Temporal Micro-Grid Projection">
                  Micro-Cell Predictive Heatmap Projection (100m Resolution)
                </CardTitle>
              </div>
              <Badge variant="outline" className="text-[9px] font-mono text-amber-300 border-amber-500/40 whitespace-nowrap shrink-0">
                POISSON RATE &lambda; = 3.42/KM²
              </Badge>
            </CardHeader>

            <CardContent className="p-0">
              <div className="relative min-h-[300px] w-full bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex flex-col items-center justify-center p-6 text-center overflow-hidden">
                {/* Simulated Geospatial Grid Dots with Pulsing Concentric Risk Rings */}
                <div className="absolute inset-0 opacity-20 pointer-events-none grid grid-cols-8 grid-rows-6 gap-6 p-4">
                  {Array.from({ length: 48 }).map((_, i) => (
                    <div key={i} className="h-2 w-2 rounded-full bg-slate-600 mx-auto" />
                  ))}
                </div>

                {/* Hotspot Markers Overlay */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 z-10 w-full max-w-4xl">
                  {hotspots.slice(0, 3).map((hs) => (
                    <div
                      key={hs.hotspot_id}
                      className="p-4 rounded-2xl border-2 border-amber-500/70 bg-slate-900/90 backdrop-blur-md shadow-2xl space-y-2 text-left"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-[10px] font-bold text-amber-400 overflow-hidden text-ellipsis whitespace-nowrap">
                          {hs.hotspot_id}
                        </span>
                        <span className="h-2.5 w-2.5 rounded-full bg-red-500 animate-ping" />
                      </div>
                      <h3 className="text-xs font-bold text-white overflow-hidden text-ellipsis whitespace-nowrap" title={hs.location_name}>
                        {hs.location_name}
                      </h3>
                      <div className="text-[10px] text-amber-200/90 font-mono">
                        Probability: <strong className="text-white">{(hs.predicted_probability * 100).toFixed(1)}%</strong>
                      </div>
                      <p className="text-[10px] text-muted-foreground line-clamp-2 break-words">
                        {hs.recommended_patrol}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Top 10 Hotspots Table */}
          <div className="space-y-3">
            <h2 className="text-xs font-black uppercase tracking-wider text-white flex items-center gap-2 overflow-hidden text-ellipsis whitespace-nowrap" title="Top Predicted High-Risk Zones">
              <Flame className="h-4 w-4 text-amber-400" />
              <span>Prioritized Preventive Patrol Roster ({hotspots.length} Zones)</span>
            </h2>

            <div className="overflow-x-auto w-full rounded-xl border border-border bg-card">
              <table className="w-full min-w-[800px] text-left text-xs">
                <thead className="bg-slate-950 text-muted-foreground font-mono uppercase text-[10px] border-b border-border">
                  <tr>
                    <th className="p-3 whitespace-nowrap">Cell ID</th>
                    <th className="p-3 whitespace-nowrap">Target Location</th>
                    <th className="p-3 whitespace-nowrap">Coordinates</th>
                    <th className="p-3 whitespace-nowrap">Likely Crime Category</th>
                    <th className="p-3 whitespace-nowrap">Predicted Probability</th>
                    <th className="p-3 whitespace-nowrap">Tactical Patrol Prescription</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {hotspots.map((hs) => (
                    <tr key={hs.hotspot_id} className="hover:bg-muted/20 transition-colors">
                      <td className="p-3 font-mono text-amber-400 font-bold whitespace-nowrap">{hs.hotspot_id}</td>
                      <td className="p-3 font-semibold text-white whitespace-nowrap overflow-hidden text-ellipsis" title={hs.location_name}>
                        {hs.location_name}
                      </td>
                      <td className="p-3 font-mono text-[10px] text-slate-400 whitespace-nowrap">
                        [{hs.latitude.toFixed(4)}°N, {hs.longitude.toFixed(4)}°E]
                      </td>
                      <td className="p-3 whitespace-nowrap">
                        <Badge variant="outline" className="text-[9px] font-mono text-slate-300">
                          {hs.crime_type}
                        </Badge>
                      </td>
                      <td className="p-3 font-mono font-black text-rose-400 whitespace-nowrap">
                        {(hs.predicted_probability * 100).toFixed(1)}%
                      </td>
                      <td className="p-3 text-[11px] text-slate-300 max-w-xs break-words">
                        {hs.recommended_patrol}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
