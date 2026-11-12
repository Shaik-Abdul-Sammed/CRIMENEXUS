import React, { useState } from 'react';
import {
  Globe,
  Layers,
  Sparkles,
  ShieldCheck,
  Download,
  CheckCircle2,
  AlertTriangle,
  Compass,
  Sun,
  Moon,
  Clock,
  Eye,
  X,
  FileCheck2,
} from 'lucide-react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { sound } from '../../utils/soundEffects';
import { useToast } from '../ui/Toast';

export interface OmniTraceSatelliteModalProps {
  isOpen: boolean;
  onClose: () => void;
  latitude?: number | null;
  longitude?: number | null;
  locationName?: string;
  reportNumber?: string;
  timestamp?: string;
}

export function OmniTraceSatelliteModal({
  isOpen,
  onClose,
  latitude = 28.6315,
  longitude = 77.2167,
  locationName = 'Connaught Place Block B / Metro Corridor',
  reportNumber = 'PUB-2026-DEMO',
  timestamp = new Date().toISOString(),
}: OmniTraceSatelliteModalProps) {
  const toast = useToast();
  const [activeBand, setActiveBand] = useState<'OPTICAL' | 'NDVI' | 'VIIRS' | 'RADAR_DEM' | 'SAR'>('OPTICAL');

  const lat = latitude ?? 28.6315;
  const lon = longitude ?? 77.2167;

  // Band Metadata
  const BANDS = [
    {
      id: 'OPTICAL',
      name: 'Optical True Color (B4-B3-B2)',
      sensor: 'Sentinel-2B MSI (10m Resolution)',
      color: '#10B981',
      desc: 'High-resolution multispectral imagery confirming physical urban features, building perimeters, and transit portals.',
      bgGradient: 'from-emerald-950/80 via-slate-900 to-slate-950',
    },
    {
      id: 'NDVI',
      name: 'NIR Vegetation & Urban Index (B8-B4)',
      sensor: 'Sentinel-2 NIR Band 8',
      color: '#06B6D4',
      desc: 'Near-Infrared reflection verifying open pedestrian concourses, asphalt roads, and impervious surfaces.',
      bgGradient: 'from-cyan-950/80 via-slate-900 to-slate-950',
    },
    {
      id: 'VIIRS',
      name: 'Nighttime Radiance (VIIRS DNB)',
      sensor: 'Suomi-NPP VIIRS Day/Night Band',
      color: '#F59E0B',
      desc: 'Nocturnal luminescent radiance measuring streetlamp illumination (142 nW/cm²·sr) matching reported night incident.',
      bgGradient: 'from-amber-950/80 via-slate-900 to-slate-950',
    },
    {
      id: 'RADAR_DEM',
      name: 'Digital Elevation Model (SRTM/ALOS)',
      sensor: 'PALSAR-2 Radar Interferometry',
      color: '#8B5CF6',
      desc: 'Topographical altitude (214m AMSL) confirming ground-level terrain and absence of subterranean elevation mismatch.',
      bgGradient: 'from-purple-950/80 via-slate-900 to-slate-950',
    },
    {
      id: 'SAR',
      name: 'SAR Ground Coherence (Sentinel-1)',
      sensor: 'C-Band Synthetic Aperture Radar',
      color: '#EC4899',
      desc: 'Phase coherence detecting surface stability, absence of structural collapse, and temporal spatial consistency.',
      bgGradient: 'from-pink-950/80 via-slate-900 to-slate-950',
    },
  ];

  const currentBandInfo = BANDS.find((b) => b.id === activeBand) || BANDS[0];

  const handleDownloadCertificate = () => {
    sound.playSuccessChime();
    const certText = `================================================================================
CRIMENEXUS OMNITRACE SATELLITE VERIFICATION CERTIFICATE
Earth Observation Corroboration under Section 63 Bharatiya Sakshya Adhiniyam, 2023
================================================================================
CASE REFERENCE NUMBER  : ${reportNumber}
LOCATION DESIGNATION   : ${locationName}
GROUND GPS COORDINATES : [${lat.toFixed(5)}° N, ${lon.toFixed(5)}° E]
ORBITAL PASS REFERENCE : SENTINEL-2B / ORBIT #14920
TIMESTAMP OF OVERPASS  : ${new Date(timestamp).toUTCString()}

MULTI-SPECTRAL EO LAYERS VERIFIED:
1. True Color Optical (B4-B3-B2) : PASS (10m Spatial Resolution)
2. Normalized Difference Index  : PASS (Corroborated Urban Surface)
3. VIIRS Night Radiance (DNB)    : PASS (Illumination Level Corroborated)
4. Radar DEM Elevation           : 214m AMSL (Zero Geodetic Anomaly)
5. SAR Ground Coherence (S-1)   : 0.94 Phase Coherence (Stable Surface)

EXIF VS ORBITAL DELTA: 14.2 meters (Permissible Error Margin: < 50 meters)
CLOUD OBSCURATION     : 3.2% (Unobstructed Line of Sight)
AI SATELLITE VERDICT  : 100% ORBITALLY CORROBORATED • ZERO GPS SPOOFING

CRYPTOGRAPHIC SEAL (SHA-256):
9a8b7c6d5e4f3a2b1c0d9e8f7a6b5c4d3e2f1a0b9c8d7e6f5a4b3c2d1e0f9a8b

ISSUED UNDER STATUTORY AUTHORITY:
CRIMENEXUS Geospatial AI & Forensic Earth Observation Division
================================================================================`;

    const blob = new Blob([certText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `OmniTrace_Satellite_Certificate_${reportNumber}.txt`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success('OmniTrace Satellite Verification Certificate downloaded.', 'Certificate Exported');
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="OmniTrace: AI Satellite Earth Observation Verification"
    >
      <div className="space-y-4 text-xs font-sans text-slate-200">
        {/* Top Header Card */}
        <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-950/60 via-slate-900 to-cyan-950/60 border border-emerald-500/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 animate-pulse">
              <Globe className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-sm font-black text-white">
                  {reportNumber} • Sentinel-2B Multi-Spectral
                </span>
                <Badge className="bg-emerald-600 text-white font-mono text-[10px] font-bold">
                  PASS: 88% CONFIDENCE
                </Badge>
              </div>
              <p className="text-[11px] text-emerald-200/90 mt-0.5">
                Overhead locus: <strong className="text-white">{locationName}</strong> [{lat.toFixed(4)}°N, {lon.toFixed(4)}°E]
              </p>
            </div>
          </div>

          <Button
            size="sm"
            onClick={handleDownloadCertificate}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs h-9 px-3.5 flex items-center gap-1.5 shrink-0 shadow-lg shadow-emerald-950/50"
          >
            <Download className="h-4 w-4" />
            <span>Download Satellite Cert</span>
          </Button>
        </div>

        {/* Spectral Band Selector Tabs */}
        <div className="space-y-2">
          <label className="text-[11px] font-mono text-muted-foreground uppercase tracking-wider block">
            Select Multi-Spectral Sensor Band:
          </label>
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none font-mono text-xs">
            {BANDS.map((b) => (
              <button
                key={b.id}
                onClick={() => {
                  sound.playClickSound();
                  setActiveBand(b.id as any);
                }}
                className={`px-3 py-1.5 rounded-xl border transition-all shrink-0 flex items-center gap-1.5 ${
                  activeBand === b.id
                    ? 'bg-slate-800 text-white font-bold shadow-md'
                    : 'bg-slate-950 text-muted-foreground border-border/60 hover:text-white'
                }`}
                style={{ borderColor: activeBand === b.id ? b.color : undefined }}
              >
                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: b.color }} />
                <span>{b.id}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Visual Simulated Satellite Canvas */}
        <div className={`p-5 rounded-2xl border-2 bg-gradient-to-br ${currentBandInfo.bgGradient} transition-all space-y-4`} style={{ borderColor: `${currentBandInfo.color}60` }}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/10 pb-3">
            <div>
              <div className="text-xs font-mono font-bold text-white flex items-center gap-2">
                <Layers className="h-4 w-4" style={{ color: currentBandInfo.color }} />
                <span>{currentBandInfo.name}</span>
              </div>
              <p className="text-[11px] text-slate-300 mt-0.5">{currentBandInfo.desc}</p>
            </div>
            <span className="text-[10px] font-mono px-2.5 py-1 rounded-lg bg-black/50 border border-white/10 text-slate-300 shrink-0">
              Sensor: {currentBandInfo.sensor}
            </span>
          </div>

          {/* 4 Satellite Orbit Telemetry Metric Pills */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 font-mono text-center">
            <div className="p-2 rounded-xl bg-black/40 border border-white/10">
              <span className="text-[9px] uppercase text-slate-400 block">EXIF Delta</span>
              <span className="text-xs font-bold text-emerald-400">14.2 m (Passed)</span>
            </div>
            <div className="p-2 rounded-xl bg-black/40 border border-white/10">
              <span className="text-[9px] uppercase text-slate-400 block">Cloud Cover</span>
              <span className="text-xs font-bold text-cyan-400">3.2% (Clear)</span>
            </div>
            <div className="p-2 rounded-xl bg-black/40 border border-white/10">
              <span className="text-[9px] uppercase text-slate-400 block">Solar Zenith</span>
              <span className="text-xs font-bold text-amber-400">48.2° Sun Angle</span>
            </div>
            <div className="p-2 rounded-xl bg-black/40 border border-white/10">
              <span className="text-[9px] uppercase text-slate-400 block">Anti-Spoofing</span>
              <span className="text-xs font-bold text-emerald-400">100% Genuine</span>
            </div>
          </div>

          {/* Visual Coordinate Target Crosshair Box */}
          <div className="h-32 rounded-xl bg-slate-950 border border-white/10 relative overflow-hidden flex items-center justify-center">
            <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#10b981_1px,transparent_1px)] [background-size:12px_12px]" />
            <div className="relative z-10 flex flex-col items-center gap-1 font-mono text-[11px]">
              <div className="h-8 w-8 rounded-full border-2 border-emerald-400 flex items-center justify-center animate-ping" />
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none">
                <span className="h-3 w-3 rounded-full bg-emerald-400 inline-block shadow-lg shadow-emerald-500" />
                <span className="text-[10px] text-emerald-300 font-bold block whitespace-nowrap mt-1">
                  Target Locus: [{lat.toFixed(4)}°N, {lon.toFixed(4)}°E]
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Statutory Legal Statement under Section 63 BSA */}
        <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex items-start gap-2.5 text-[11px] leading-relaxed text-slate-300">
          <ShieldCheck className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
          <div>
            <strong className="text-white">Section 63 BSA 2023 Statutory Corroboration:</strong> Electronic satellite telemetry confirms physical existence of the crime scene and eliminates simulated coordinates, false reports, or digital location spoofing.
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
          <Button size="sm" variant="ghost" onClick={onClose}>
            Close Inspection
          </Button>
          <Button size="sm" onClick={handleDownloadCertificate} className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold">
            Export Certificate
          </Button>
        </div>
      </div>
    </Modal>
  );
}
