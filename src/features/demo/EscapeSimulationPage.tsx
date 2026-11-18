import React, { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import * as maplibregl from 'maplibre-gl';
import {
  Car,
  CreditCard,
  Radio,
  MapPin,
  ShieldAlert,
  Play,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  Scale,
  Zap,
  Activity,
  FileText,
  Clock,
  ArrowRight,
  Shield,
  Smartphone,
  Cpu,
  Layers,
  ChevronRight,
  Sparkles,
  ExternalLink,
  Volume2,
  Lock,
  Navigation,
  Eye,
  FileCheck2,
  X,
  Radar,
  Compass,
  BookOpen,
  AlertOctagon,
  Target
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Modal } from '../../components/ui/Modal';
import { DocumentPreviewModal } from '../../components/common/DocumentPreviewModal';
import { OmniTraceSatelliteModal } from '../../components/common/OmniTraceSatelliteModal';
import { CRITICAL_CASES, CriticalCase, getCriticalCaseById } from '../../data/criticalRealWorldCases';
import { api } from '../../services/api';
import { sound } from '../../utils/soundEffects';
import { useToast } from '../../components/ui/Toast';
import { Link } from 'react-router-dom';

// Free OpenStreetMap Raster Style with Tactical Dark Mode Paint (Zero API keys, zero watermarks)
const MAP_STYLE: maplibregl.StyleSpecification = {
  version: 8,
  sources: {
    'osm-tiles': {
      type: 'raster',
      tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
      tileSize: 256,
      attribution: '© OpenStreetMap contributors',
    },
  },
  layers: [
    {
      id: 'osm-tiles-layer',
      type: 'raster',
      source: 'osm-tiles',
      minzoom: 0,
      maxzoom: 19,
      paint: {
        'raster-brightness-max': 0.65,
        'raster-contrast': 0.25,
        'raster-saturation': -0.92,
      },
    },
  ],
};

// Spatial Ground Truth Constants for Instant Offline-Resilient Tactical Rendering
const ESCAPE_CORRIDOR_COORDS: Array<[number, number]> = [
  [77.2197, 28.6328], // Connaught Place (Origin)
  [77.3265, 28.5710], // Sector 18 (Plate Swap Locus)
  [77.4100, 28.5800], // Greater Noida Expressway
  [77.5510, 28.1402], // Yamuna Toll KM 48 (FASTag Checkpoint)
  [77.4500, 28.5200], // Expressway Return Link
  [77.3649, 28.6280], // Sector 62 Safehouse (Rajan Destination)
];

const SMURFING_MULES_NODES = [
  { id: 'MULE-01', bank: 'HDFC Bank ATM', lon: 77.3280, lat: 28.5720, amount: '₹49,000' },
  { id: 'MULE-02', bank: 'SBI e-Corner', lon: 77.3350, lat: 28.5780, amount: '₹48,500' },
  { id: 'MULE-03', bank: 'ICICI Sector 18', lon: 77.3210, lat: 28.5690, amount: '₹49,000' },
  { id: 'MULE-04', bank: 'Axis Bank CP', lon: 77.2210, lat: 28.6310, amount: '₹49,500' },
  { id: 'MULE-05', bank: 'PNB Lajpat Nagar', lon: 77.2410, lat: 28.5680, amount: '₹48,000' },
  { id: 'MULE-06', bank: 'Kotak Gr. Noida', lon: 77.4120, lat: 28.5820, amount: '₹49,000' },
  { id: 'MULE-07', bank: 'Bank of Baroda', lon: 77.3680, lat: 28.6190, amount: '₹47,500' },
  { id: 'MULE-08', bank: 'IndusInd Sec 62', lon: 77.3610, lat: 28.6250, amount: '₹49,000' },
  { id: 'MULE-09', bank: 'Yes Bank Atta', lon: 77.3290, lat: 28.5660, amount: '₹49,000' },
  { id: 'MULE-10', bank: 'Canara Sec 16', lon: 77.3190, lat: 28.5810, amount: '₹48,800' },
];

const QAOA_INTERCEPT_ROUTE_COORDS: Array<[number, number]> = [
  [77.3550, 28.6050], // PCR Unit Alpha-04 (Sector 58)
  [77.3580, 28.6110], // Fortis Hospital Crossing
  [77.3615, 28.6200], // Electronic City Underpass
  [77.3649, 28.6280], // Sector 62 Safehouse Intercept Locus
];

interface Step1Data {
  status: string;
  step: number;
  attempt_name: string;
  criminal_action: string;
  countermeasure: string;
  fusion_alert: string;
  fastag_id: string;
  original_plate: string;
  cloned_plate: string;
  chassis_match_confidence: number;
  camera_location: string;
  coordinates: { lat: number; lon: number; name: string };
  toast_message: string;
}

interface Step2Data {
  status: string;
  step: number;
  attempt_name: string;
  criminal_action: string;
  countermeasure: string;
  hud_message: string;
  isolation_forest_score: number;
  accounts_frozen_count: number;
  total_frozen_amount_inr: number;
  target_crypto_wallet: string;
  statutory_mandate: string;
  freeze_notice_id: string;
  mule_accounts: Array<{ account_number: string; bank: string; amount_inr: number; status: string }>;
  toast_message: string;
}

interface Step3Data {
  status: string;
  step: number;
  attempt_name: string;
  criminal_action: string;
  countermeasure: string;
  link_prediction: {
    algorithm: string;
    predicted_destination: string;
    confidence_percentage: number;
    shared_triangles: string[];
    explainability_card: string;
  };
  quantum_optimization: {
    algorithm: string;
    evaluations: number;
    state: string;
    responding_unit: string;
    distance_km: number;
    duration_minutes: number;
  };
  spatial_data: {
    rajan_target: { latitude: number; longitude: number; label: string; pin_color: string };
    pcr_unit: { latitude: number; longitude: number; label: string; pin_color: string };
    intercept_route: { coordinates: number[][]; distance_km: number; duration_minutes: number };
  };
  finale: {
    contained_in_minutes: number;
    remand_clock_hours: number;
    banner_message: string;
    toast_message: string;
  };
}

export function EscapeSimulationPage() {
  const toast = useToast();
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const markersRef = useRef<maplibregl.Marker[]>([]);

  const [activeStep, setActiveStep] = useState<number>(0);
  const [isPlayingAll, setIsPlayingAll] = useState<boolean>(false);
  const [step1Data, setStep1Data] = useState<Step1Data | null>(null);
  const [step2Data, setStep2Data] = useState<Step2Data | null>(null);
  const [step3Data, setStep3Data] = useState<Step3Data | null>(null);

  // 30 Critical Real-World Cases & In-Depth Analytical Engine State
  const [selectedCaseId, setSelectedCaseId] = useState<string>('CRIT-CASE-01');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [activeTab, setActiveTab] = useState<'SIMULATION' | 'RESEARCH_100_CASES'>('SIMULATION');
  const [isSolvingCase, setIsSolvingCase] = useState<boolean>(false);
  const [solvedCaseData, setSolvedCaseData] = useState<any | null>(null);
  const [omniModalOpen, setOmniModalOpen] = useState<boolean>(false);

  const activeCase: CriticalCase = getCriticalCaseById(selectedCaseId);

  // Plate Swap Animation State
  const [plateFlipped, setPlateFlipped] = useState<boolean>(false);

  // Finale & Remand Modal State
  const [showInterceptModal, setShowInterceptModal] = useState<boolean>(false);
  const [remandTimerSeconds, setRemandTimerSeconds] = useState<number>(24 * 3600);
  const [simulationCompleted, setSimulationCompleted] = useState<boolean>(false);
  const [previewDossierOpen, setPreviewDossierOpen] = useState<boolean>(false);

  // Remand 24-Hour Countdown Clock
  useEffect(() => {
    if (!simulationCompleted) return;
    const interval = setInterval(() => {
      setRemandTimerSeconds((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, [simulationCompleted]);

  // Render Initial Active Tactical Corridor on Map Load or Reset
  const renderInitialTacticalOverview = useCallback((targetCaseParam?: CriticalCase, mapInstance?: maplibregl.Map | null) => {
    const targetMap = mapInstance || mapRef.current;
    if (!targetMap || !targetMap.isStyleLoaded()) return;

    const currentCase = targetCaseParam || activeCase;

    // Clear existing markers
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    // 1. Draw Getaway Trajectory Corridor
    const corridorSrc = targetMap.getSource('corridor-line-source') as maplibregl.GeoJSONSource | undefined;
    if (corridorSrc) {
      corridorSrc.setData({
        type: 'Feature',
        properties: {},
        geometry: { type: 'LineString', coordinates: currentCase.route_corridor },
      });
    }

    // Reset Intercept Line
    const interceptSrc = targetMap.getSource('intercept-line-source') as maplibregl.GeoJSONSource | undefined;
    if (interceptSrc) {
      interceptSrc.setData({
        type: 'Feature',
        properties: {},
        geometry: { type: 'LineString', coordinates: [] },
      });
    }

    // Reset Voronoi Cordon Polygon
    const cordonSrc = targetMap.getSource('cordon-polygon-source') as maplibregl.GeoJSONSource | undefined;
    if (cordonSrc) {
      cordonSrc.setData({
        type: 'Feature',
        properties: {},
        geometry: { type: 'Polygon', coordinates: [] },
      });
    }

    // 2. Drop Target Marker at Origin
    const targetEl = document.createElement('div');
    targetEl.className = 'cursor-pointer';
    targetEl.innerHTML = `
      <div style="display: flex; flex-direction: column; align-items: center; filter: drop-shadow(0 0 14px rgba(239,68,68,0.9));">
        <div style="background: #dc2626; color: white; font-size: 9px; font-weight: 800; padding: 2px 8px; border-radius: 4px; border: 1.5px solid white; white-space: nowrap; margin-bottom: 2px;">
          🎯 ${currentCase.suspect_or_victim.slice(0, 24)}
        </div>
        <div style="width: 32px; height: 32px; border-radius: 9999px; background: #b91c1c; border: 2.5px solid white; display: flex; align-items: center; justify-content: center; font-size: 15px; animation: pulse 1.5s infinite;">
          🚗
        </div>
      </div>
    `;
    const targetMarker = new maplibregl.Marker({ element: targetEl })
      .setLngLat(currentCase.origin_coords)
      .setPopup(new maplibregl.Popup({ offset: 15 }).setHTML(`<b>${currentCase.title}</b><br/>Locus: ${currentCase.origin_location}`))
      .addTo(targetMap);
    markersRef.current.push(targetMarker);

    // 3. Drop Intercept Checkpoint Marker
    const tollEl = document.createElement('div');
    tollEl.className = 'cursor-pointer';
    tollEl.innerHTML = `
      <div style="display: flex; flex-direction: column; align-items: center; filter: drop-shadow(0 0 12px rgba(245,158,11,0.9));">
        <div style="background: #d97706; color: white; font-size: 9px; font-weight: 800; padding: 2px 6px; border-radius: 4px; border: 1px solid white; white-space: nowrap; margin-bottom: 2px;">
          🛑 CHOKEPOINT: ${currentCase.intercept_point.name.slice(0, 24)}
        </div>
        <div style="width: 26px; height: 26px; border-radius: 9999px; background: #b45309; border: 2px solid white; display: flex; align-items: center; justify-content: center; font-size: 12px;">
          🚧
        </div>
      </div>
    `;
    const tollMarker = new maplibregl.Marker({ element: tollEl })
      .setLngLat(currentCase.intercept_point.coords)
      .setPopup(new maplibregl.Popup({ offset: 15 }).setHTML(`<b>${currentCase.intercept_point.name}</b><br/>ETA: ${currentCase.intercept_point.eta_minutes} mins<br/>Unit: ${currentCase.intercept_point.recommended_unit}`))
      .addTo(targetMap);
    markersRef.current.push(tollMarker);

    // 4. Drop Destination Target Marker
    const destEl = document.createElement('div');
    destEl.className = 'cursor-pointer';
    destEl.innerHTML = `
      <div style="display: flex; flex-direction: column; align-items: center; filter: drop-shadow(0 0 14px rgba(168,85,247,0.9));">
        <div style="background: #9333ea; color: white; font-size: 9px; font-weight: 800; padding: 2px 6px; border-radius: 4px; border: 1px solid white; white-space: nowrap; margin-bottom: 2px;">
          📍 Destination: ${currentCase.destination_target.slice(0, 22)}
        </div>
        <div style="width: 26px; height: 26px; border-radius: 9999px; background: #7e22ce; border: 2px solid white; display: flex; align-items: center; justify-content: center; font-size: 12px;">
          🏁
        </div>
      </div>
    `;
    const destMarker = new maplibregl.Marker({ element: destEl })
      .setLngLat(currentCase.destination_coords)
      .setPopup(new maplibregl.Popup({ offset: 15 }).setHTML(`<b>Predicted Destination</b><br/>${currentCase.destination_target}`))
      .addTo(targetMap);
    markersRef.current.push(destMarker);

    // Auto-fit camera to frame entire tactical corridor
    const bounds = new maplibregl.LngLatBounds();
    currentCase.route_corridor.forEach((c) => bounds.extend(c));
    bounds.extend(currentCase.intercept_point.coords);
    targetMap.fitBounds(bounds, { padding: 60, duration: 900, maxZoom: 13 });
  }, [selectedCaseId]);

  const handleSelectCase = (caseId: string) => {
    sound.playClickSound();
    setSelectedCaseId(caseId);
    setActiveStep(0);
    setSolvedCaseData(null);
    setSimulationCompleted(false);
    const targetCase = getCriticalCaseById(caseId);
    renderInitialTacticalOverview(targetCase);
    toast.info(`Loaded Critical Case ${targetCase.case_id}: ${targetCase.title}`, 'Case Switch');
  };

  const handleSolveCase = async () => {
    setIsSolvingCase(true);
    sound.playClickSound();
    try {
      const solution = await api.solveCriticalCase(activeCase.case_id);
      setSolvedCaseData(solution);

      // Render Voronoi Cordon Polygon around intercept point on map
      if (mapRef.current && mapRef.current.isStyleLoaded()) {
        const center = activeCase.intercept_point.coords;
        const radius = 0.07;
        const numPoints = 8;
        const polygonCoords: number[][] = [];
        for (let i = 0; i <= numPoints; i++) {
          const angle = (i * 2 * Math.PI) / numPoints;
          polygonCoords.push([
            center[0] + radius * Math.cos(angle) * 1.25,
            center[1] + radius * Math.sin(angle) * 0.95,
          ]);
        }

        const cordonSrc = mapRef.current.getSource('cordon-polygon-source') as maplibregl.GeoJSONSource | undefined;
        if (cordonSrc) {
          cordonSrc.setData({
            type: 'Feature',
            properties: {},
            geometry: { type: 'Polygon', coordinates: [polygonCoords] },
          });
        }

        // Draw Intercept route from closest patrol unit to chokepoint
        const interceptSrc = mapRef.current.getSource('intercept-line-source') as maplibregl.GeoJSONSource | undefined;
        if (interceptSrc) {
          const unitStart: [number, number] = [center[0] - 0.035, center[1] - 0.025];
          interceptSrc.setData({
            type: 'Feature',
            properties: {},
            geometry: { type: 'LineString', coordinates: [unitStart, center] },
          });
        }

        mapRef.current.flyTo({ center, zoom: 12.5, duration: 900 });
      }

      setSimulationCompleted(true);
      toast.success(
        `ENCAPSULATION COMPLETE: ${activeCase.intercept_point.name} locked down. ETA: ${activeCase.intercept_point.eta_minutes} mins via ${activeCase.intercept_point.recommended_unit}.`,
        'Interdiction Sealed'
      );
    } catch (err) {
      console.warn('Solve failed:', err);
      toast.error('Failed to execute encapsulation protocol.', 'Interdiction Alert');
    } finally {
      setIsSolvingCase(false);
    }
  };

  // Step 1 Visual Map Renderer (Vehicle Swap & FASTag Fusion)
  const renderStep1Map = useCallback(() => {
    if (!mapRef.current) return;
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    const tollCoords = [77.5510, 28.1402] as [number, number];
    mapRef.current.flyTo({ center: tollCoords, zoom: 14.5, duration: 1100 });

    const el = document.createElement('div');
    el.innerHTML = `
      <div style="display: flex; flex-direction: column; align-items: center; filter: drop-shadow(0 0 18px rgba(239,68,68,1));">
        <div style="background: #dc2626; color: white; font-size: 10px; font-weight: 900; padding: 3px 10px; border-radius: 6px; border: 2px solid white; white-space: nowrap; margin-bottom: 4px; box-shadow: 0 0 15px rgba(239,68,68,0.8);">
          🚨 CLONED PLATE SWAP: DL 01 XY 9876 (Rajan)
        </div>
        <div style="position: relative; width: 40px; height: 40px; display: flex; align-items: center; justify-content: center;">
          <div style="position: absolute; width: 40px; height: 40px; border-radius: 9999px; background: rgba(239,68,68,0.4); animation: ping 1s infinite;"></div>
          <div style="width: 28px; height: 28px; border-radius: 9999px; background: #b91c1c; border: 3px solid white; display: flex; align-items: center; justify-content: center; font-size: 14px;">
            🚗
          </div>
        </div>
        <div style="background: #1e293b; color: #f59e0b; border: 1px solid #f59e0b; font-size: 9px; font-family: monospace; font-weight: bold; padding: 1px 6px; border-radius: 3px; margin-top: 2px;">
          FASTag: 34161FA890 (Chassis Matched)
        </div>
      </div>
    `;
    const marker = new maplibregl.Marker({ element: el })
      .setLngLat(tollCoords)
      .setPopup(new maplibregl.Popup({ offset: 20 }).setHTML('<b>ANPR + FASTag Fused!</b><br/>Plate switched from TS 09 AB 1234 to DL 01 XY 9876.<br/>Chassis Match: 99.4%'))
      .addTo(mapRef.current);
    markersRef.current.push(marker);
  }, []);

  // Step 2 Visual Map Renderer (Smurfing Liquidation & ATM Mules Freeze)
  const renderStep2Map = useCallback(() => {
    const curMap = mapRef.current;
    if (!curMap) return;
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    const bounds = new maplibregl.LngLatBounds();
    SMURFING_MULES_NODES.forEach((node) => {
      bounds.extend([node.lon, node.lat]);
      const el = document.createElement('div');
      el.className = 'cursor-pointer';
      el.innerHTML = `
        <div style="display: flex; flex-direction: column; align-items: center; filter: drop-shadow(0 0 10px rgba(220,38,38,0.9));">
          <div style="background: #991b1b; color: white; font-size: 9px; font-weight: 800; padding: 1px 6px; border-radius: 4px; border: 1px solid #f87171; white-space: nowrap; margin-bottom: 2px;">
            🔒 FROZEN ${node.amount}
          </div>
          <div style="width: 24px; height: 24px; border-radius: 9999px; background: #b91c1c; border: 2px solid white; display: flex; align-items: center; justify-content: center; font-size: 11px;">
            🏧
          </div>
        </div>
      `;
      const marker = new maplibregl.Marker({ element: el })
        .setLngLat([node.lon, node.lat])
        .setPopup(new maplibregl.Popup({ offset: 12 }).setHTML(`<b>${node.id} — ${node.bank}</b><br/>Amount Frozen: ${node.amount}<br/>Statutory Order: Sec 106 BNSS`))
        .addTo(curMap);
      markersRef.current.push(marker);
    });

    curMap.fitBounds(bounds, { padding: 60, duration: 1000, maxZoom: 14 });
  }, []);

  // Step 3 Visual Map Renderer (Safehouse & Green Glowing QAOA Intercept Vector)
  const renderStep3Map = useCallback(() => {
    if (!mapRef.current) return;
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    const safehouseCoords = [77.3649, 28.6280] as [number, number];
    const pcrCoords = [77.3550, 28.6050] as [number, number];

    // Draw Green Dashed QAOA Intercept Line
    const src = mapRef.current.getSource('intercept-line-source') as maplibregl.GeoJSONSource | undefined;
    if (src) {
      src.setData({
        type: 'Feature',
        properties: {},
        geometry: {
          type: 'LineString',
          coordinates: QAOA_INTERCEPT_ROUTE_COORDS,
        },
      });
    }

    // Drop Pulsing Red Marker for Rajan Safehouse
    const rajanEl = document.createElement('div');
    rajanEl.innerHTML = `
      <div style="display: flex; flex-direction: column; align-items: center; filter: drop-shadow(0 0 20px rgba(220,38,38,1));">
        <div style="background: #dc2626; color: white; font-size: 10px; font-weight: 900; padding: 3px 8px; border-radius: 5px; border: 2px solid white; white-space: nowrap; margin-bottom: 2px;">
          🎯 RAJAN SAFEHOUSE (SECTOR 62)
        </div>
        <div style="position: relative; width: 38px; height: 38px; display: flex; align-items: center; justify-content: center;">
          <div style="position: absolute; width: 38px; height: 38px; border-radius: 9999px; background: rgba(220,38,38,0.5); animation: ping 1.2s infinite;"></div>
          <div style="width: 26px; height: 26px; border-radius: 9999px; background: #b91c1c; border: 3px solid white; display: flex; align-items: center; justify-content: center; font-size: 14px;">
            🚨
          </div>
        </div>
      </div>
    `;
    const rajanMarker = new maplibregl.Marker({ element: rajanEl })
      .setLngLat(safehouseCoords)
      .addTo(mapRef.current);
    markersRef.current.push(rajanMarker);

    // Drop Blue Marker for PCR-04 Intercept Squad
    const pcrEl = document.createElement('div');
    pcrEl.innerHTML = `
      <div style="display: flex; flex-direction: column; align-items: center; filter: drop-shadow(0 0 18px rgba(37,99,235,1));">
        <div style="background: #2563eb; color: white; font-size: 10px; font-weight: 900; padding: 3px 8px; border-radius: 5px; border: 2px solid white; white-space: nowrap; margin-bottom: 2px;">
          👮 PCR VAN ALPHA-04 (INTERCEPTING)
        </div>
        <div style="width: 30px; height: 30px; border-radius: 9999px; background: #1d4ed8; border: 2.5px solid white; display: flex; align-items: center; justify-content: center; font-size: 14px;">
          🚔
        </div>
      </div>
    `;
    const pcrMarker = new maplibregl.Marker({ element: pcrEl })
      .setLngLat(pcrCoords)
      .addTo(mapRef.current);
    markersRef.current.push(pcrMarker);

    // Frame both points with smooth zoom
    const bounds = new maplibregl.LngLatBounds();
    bounds.extend(safehouseCoords);
    bounds.extend(pcrCoords);
    QAOA_INTERCEPT_ROUTE_COORDS.forEach((c) => bounds.extend(c));
    mapRef.current.fitBounds(bounds, { padding: 80, duration: 1100, maxZoom: 15 });
  }, []);

  // Initialize MapLibre GL Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    const map = new maplibregl.Map({
      container: mapContainerRef.current,
      style: MAP_STYLE,
      center: [77.4000, 28.3800], // NCR Yamuna Corridor overview
      zoom: 10.4,
      pitch: 0,
      bearing: 0,
    });

    map.on('load', () => {
      // 1. Getaway Path Corridor Source & Glow Layers
      map.addSource('corridor-line-source', {
        type: 'geojson',
        data: {
          type: 'Feature',
          properties: {},
          geometry: { type: 'LineString', coordinates: ESCAPE_CORRIDOR_COORDS },
        },
      });

      map.addLayer({
        id: 'corridor-glow',
        type: 'line',
        source: 'corridor-line-source',
        layout: { 'line-join': 'round', 'line-cap': 'round' },
        paint: {
          'line-color': '#06b6d4',
          'line-width': 8,
          'line-opacity': 0.35,
        },
      });

      map.addLayer({
        id: 'corridor-dashed',
        type: 'line',
        source: 'corridor-line-source',
        layout: { 'line-join': 'round', 'line-cap': 'round' },
        paint: {
          'line-color': '#22d3ee',
          'line-width': 3,
          'line-dasharray': [2, 1],
        },
      });

      // 2. QAOA Intercept Route Source & Glowing Green Layers
      map.addSource('intercept-line-source', {
        type: 'geojson',
        data: {
          type: 'Feature',
          properties: {},
          geometry: { type: 'LineString', coordinates: [] },
        },
      });

      map.addLayer({
        id: 'intercept-glow',
        type: 'line',
        source: 'intercept-line-source',
        layout: { 'line-join': 'round', 'line-cap': 'round' },
        paint: {
          'line-color': '#10b981',
          'line-width': 10,
          'line-opacity': 0.45,
        },
      });

      map.addLayer({
        id: 'intercept-dashed',
        type: 'line',
        source: 'intercept-line-source',
        layout: { 'line-join': 'round', 'line-cap': 'round' },
        paint: {
          'line-color': '#34d399',
          'line-width': 4,
          'line-dasharray': [3, 2],
        },
      });

      // 3. Voronoi Cordon Polygon Source & Layers
      map.addSource('cordon-polygon-source', {
        type: 'geojson',
        data: {
          type: 'Feature',
          properties: {},
          geometry: { type: 'Polygon', coordinates: [] },
        },
      });

      map.addLayer({
        id: 'cordon-polygon-fill',
        type: 'fill',
        source: 'cordon-polygon-source',
        paint: {
          'fill-color': '#ef4444',
          'fill-opacity': 0.18,
        },
      });

      map.addLayer({
        id: 'cordon-polygon-stroke',
        type: 'line',
        source: 'cordon-polygon-source',
        paint: {
          'line-color': '#f87171',
          'line-width': 2.5,
          'line-dasharray': [4, 2],
        },
      });

      // Render Initial Active Corridor & Markers immediately on load!
      renderInitialTacticalOverview(activeCase, map);
    });

    mapRef.current = map;

    return () => {
      markersRef.current.forEach((m) => m.remove());
      markersRef.current = [];
      map.remove();
      mapRef.current = null;
    };
  }, [renderInitialTacticalOverview]);

  // Step 1: Execute The Vehicle Swap
  const handleExecuteStep1 = async () => {
    sound.playAlertBeep();
    setActiveStep(1);
    setPlateFlipped(true);

    // Immediately update map to Toll Plaza with plate flip graphic
    renderStep1Map();

    try {
      const baseURL = import.meta.env.VITE_API_BASE_URL || '/api/v1';
      const res = await axios.get(`${baseURL}/escape-demo/step/1`);
      setStep1Data(res.data);
      toast.success(res.data.toast_message, 'Fusion Engine Triggered');
    } catch {
      // Robust offline fallback data
      const fallbackStep1: Step1Data = {
        status: 'SUCCESS',
        step: 1,
        attempt_name: 'The Vehicle Swap',
        criminal_action: 'Swapped plates from TS 09 AB 1234 to DL 01 XY 9876 at Sector 18 flyover.',
        countermeasure: 'ANPR camera at Yamuna Expressway KM 48 read the cloned plate; FASTag matched physical chassis.',
        fusion_alert: 'FASTag 34161FA890 matched chassis VIN-9941. Cloned plate DL 01 XY 9876 flagged as stolen.',
        fastag_id: '34161FA890',
        original_plate: 'TS 09 AB 1234',
        cloned_plate: 'DL 01 XY 9876',
        chassis_match_confidence: 99.4,
        camera_location: 'Yamuna Expressway Toll KM 48 Checkpoint',
        coordinates: { lat: 28.1402, lon: 77.5510, name: 'Yamuna Expressway KM 48' },
        toast_message: 'FASTag + ANPR Fusion: Cloned plate DL 01 XY 9876 linked to TS 09 AB 1234.',
      };
      setStep1Data(fallbackStep1);
      toast.success(fallbackStep1.toast_message, 'Fusion Engine Triggered');
    }
  };

  // Step 2: Execute The Smurfing Liquidation
  const handleExecuteStep2 = async () => {
    sound.playRadarPing();
    setActiveStep(2);

    // Immediately render all 10 frozen ATM mule nodes on the map
    renderStep2Map();

    try {
      const baseURL = import.meta.env.VITE_API_BASE_URL || '/api/v1';
      const res = await axios.get(`${baseURL}/escape-demo/step/2`);
      setStep2Data(res.data);
      toast.error(res.data.toast_message, 'Smurfing Ring Frozen');
    } catch {
      // Robust offline fallback data
      const fallbackStep2: Step2Data = {
        status: 'SUCCESS',
        step: 2,
        attempt_name: 'The Smurfing Liquidation',
        criminal_action: 'Triggered 10 parallel withdrawals under ₹50,000 threshold to evade IT alert.',
        countermeasure: 'Isolation Forest detected 10 coordinated transactions in 4 mins; statutory freeze dispatched.',
        hud_message: '10 Mule Accounts Debit-Frozen Under Section 106 BNSS / 102 CrPC.',
        isolation_forest_score: -0.842,
        accounts_frozen_count: 10,
        total_frozen_amount_inr: 490000,
        target_crypto_wallet: '0x71C...89B1 (USDT TRC-20)',
        statutory_mandate: 'Section 106 BNSS (Seizure of proceeds of crime)',
        freeze_notice_id: 'SEC106-2026-DEL-8812',
        mule_accounts: SMURFING_MULES_NODES.map((n) => ({
          account_number: `A/C-98${Math.floor(1000 + Math.random() * 9000)}`,
          bank: n.bank,
          amount_inr: 49000,
          status: 'FROZEN',
        })),
        toast_message: 'Isolation Forest: 10 mule accounts debit-frozen under Section 106 BNSS.',
      };
      setStep2Data(fallbackStep2);
      toast.error(fallbackStep2.toast_message, 'Smurfing Ring Frozen');
    }
  };

  // Step 3: Execute The Safehouse Hideout & Intercept
  const handleExecuteStep3 = async () => {
    sound.playSuccessChime();
    setActiveStep(3);
    setSimulationCompleted(true);

    // Immediately render Sector 62 Safehouse and green glowing QAOA line
    renderStep3Map();

    setTimeout(() => {
      setShowInterceptModal(true);
    }, 1400);

    try {
      const baseURL = import.meta.env.VITE_API_BASE_URL || '/api/v1';
      const res = await axios.get(`${baseURL}/escape-demo/step/3`);
      setStep3Data(res.data);
      toast.success(res.data.finale.toast_message, 'Link Prediction Active');
    } catch {
      // Robust offline fallback data
      const fallbackStep3: Step3Data = {
        status: 'SUCCESS',
        step: 3,
        attempt_name: 'The Safehouse Hideout & Intercept',
        criminal_action: 'Powered down mobile devices; drove via back-alleys to unmapped Sector 62 safehouse.',
        countermeasure: 'Adamic-Adar link prediction identified hideout; QAOA router calculated 4.2 min intercept.',
        link_prediction: {
          algorithm: 'Adamic-Adar Graph Link Prediction (arXiv:2403.0112)',
          predicted_destination: 'Sector 62 Safehouse (Noida)',
          confidence_percentage: 94.6,
          shared_triangles: ['Adnan Merchant', 'Vicky Shell', 'Mule A/C 9811'],
          explainability_card: 'Co-occurrence across 3 shared shell entities predicts Sector 62 as primary hideout.',
        },
        quantum_optimization: {
          algorithm: 'QAOA Multi-Unit Tactical Intercept Router',
          evaluations: 2048,
          state: 'OPTIMAL_INTERCEPT_CONVERGED',
          responding_unit: 'PCR Patrol Unit Alpha-04',
          distance_km: 2.8,
          duration_minutes: 4.2,
        },
        spatial_data: {
          rajan_target: { latitude: 28.6280, longitude: 77.3649, label: 'Sector 62 Safehouse', pin_color: '#dc2626' },
          pcr_unit: { latitude: 28.6050, longitude: 77.3550, label: 'PCR Patrol Unit Alpha-04', pin_color: '#2563eb' },
          intercept_route: {
            coordinates: QAOA_INTERCEPT_ROUTE_COORDS,
            distance_km: 2.8,
            duration_minutes: 4.2,
          },
        },
        finale: {
          contained_in_minutes: 11.4,
          remand_clock_hours: 24,
          banner_message: 'Suspect Contained at Sector 62 Safehouse. 24-Hour Remand Clock Initiated.',
          toast_message: 'QAOA Intercept: PCR-04 dispatched. Target locked at Sector 62 safehouse.',
        },
      };
      setStep3Data(fallbackStep3);
      toast.success(fallbackStep3.finale.toast_message, 'Link Prediction Active');
    }
  };

  // Automated 3-Step Play Sequence with 3-Second Delays
  const handlePlayFullScenario = async () => {
    if (isPlayingAll) return;
    setIsPlayingAll(true);
    setSimulationCompleted(false);

    // Step 1: Immediate execution
    await handleExecuteStep1();

    // Step 2: 3.2 seconds later
    setTimeout(async () => {
      await handleExecuteStep2();

      // Step 3: Another 3.2 seconds later
      setTimeout(async () => {
        await handleExecuteStep3();
        setIsPlayingAll(false);
      }, 3200);
    }, 3200);
  };

  const handleReset = () => {
    sound.playClickSound();
    setActiveStep(0);
    setIsPlayingAll(false);
    setPlateFlipped(false);
    setSimulationCompleted(false);
    setStep1Data(null);
    setStep2Data(null);
    setStep3Data(null);
    renderInitialTacticalOverview();
    toast.info('Operation Shatter simulation reset to initial standby.', 'Scenario Reset');
  };

  return (
    <div className="space-y-4 font-sans">
      {/* Top Banner Finale Overlay */}
      {simulationCompleted && (
        <div className="p-4 rounded-xl border-2 border-emerald-400 bg-gradient-to-r from-emerald-950 via-slate-900 to-emerald-950 text-white shadow-2xl flex flex-col md:flex-row items-center justify-between gap-4 animate-in fade-in zoom-in-95">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-emerald-500/30 border-2 border-emerald-400 flex items-center justify-center shrink-0 animate-pulse">
              <CheckCircle2 className="h-6 w-6 text-emerald-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-400/40">
                  CRIMENEXUS INTERCEPT SUCCESSFUL
                </span>
                <span className="text-xs text-slate-300">Contained in 11.4 Minutes</span>
              </div>
              <h2 className="text-sm md:text-base font-extrabold text-white mt-0.5">
                Suspect Contained at Sector 62 Safehouse. 24-Hour Remand Clock Initiated.
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              size="sm"
              onClick={() => setShowInterceptModal(true)}
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs shadow-lg shadow-emerald-600/40 flex items-center gap-1.5"
            >
              <FileText className="h-4 w-4" />
              <span>Inspect Intercept Dossier</span>
            </Button>
            <button
              onClick={() => setSimulationCompleted(false)}
              className="p-1 rounded text-slate-400 hover:text-white transition-colors"
              title="Close Banner (X)"
              aria-label="Close Banner"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Header and Step Sequence Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 p-4 rounded-xl border border-border bg-card/90 backdrop-blur-md shadow-lg">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-xl font-black tracking-tight text-foreground flex items-center gap-2">
              <ShieldAlert className="h-5 w-5 text-red-500 shrink-0" />
              <span className="truncate">Operation Shatter: Criminal Escape Simulation</span>
            </h1>
            <Badge variant="outline" className="border-red-500/40 text-red-400 bg-red-950/30 text-[10px] font-mono font-bold shrink-0">
              LIVE AI INTERCEPT
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5 truncate">
            Demonstrating real-time AI neutralization of Vehicle Cloning, Financial Smurfing, and RF Silence Evasion.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap shrink-0">
          <Button
            size="sm"
            onClick={handlePlayFullScenario}
            disabled={isPlayingAll}
            className={`font-extrabold text-xs flex items-center gap-2 transition-all ${
              isPlayingAll
                ? 'bg-red-700 text-white animate-pulse'
                : 'bg-red-600 hover:bg-red-500 text-white shadow-lg shadow-red-600/40'
            }`}
          >
            {isPlayingAll ? (
              <RotateCcw className="h-4 w-4 animate-spin" />
            ) : (
              <Play className="h-4 w-4" />
            )}
            <span>{isPlayingAll ? 'Executing 3-Step Intercept...' : 'Play Full 3-Step Demo'}</span>
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={handleReset}
            className="border-border text-foreground hover:bg-accent text-xs font-semibold flex items-center gap-1.5"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>Reset</span>
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              sound.playClickSound();
              setPreviewDossierOpen(true);
            }}
            className="border-indigo-500/50 text-indigo-300 hover:bg-indigo-950/40 text-xs font-bold flex items-center gap-1.5"
            title="Preview Escape Trajectory Dossier & Case Synthesis"
          >
            <Eye className="h-3.5 w-3.5 text-indigo-400" />
            <span>Preview Dossier</span>
          </Button>

          <Link to="/digital-footprint">
            <Button
              size="sm"
              variant="outline"
              className="border-cyan-500/40 text-cyan-400 hover:bg-cyan-950/30 text-xs font-bold flex items-center gap-1.5"
            >
              <Cpu className="h-3.5 w-3.5" />
              <span>Digital Footprint Matrix</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* 30 Critical Real-World Cases Playbook Toolbar */}
      <div className="p-4 rounded-xl border border-sky-500/40 bg-gradient-to-r from-slate-950 via-slate-900 to-sky-950/40 shadow-xl space-y-3">
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 flex-wrap">
            <span className="p-1.5 rounded-lg bg-sky-500/20 text-sky-400 border border-sky-500/40">
              <Compass className="h-5 w-5" />
            </span>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-black uppercase tracking-wider text-sky-300 font-mono">
                  30 Critical Real-World Cases Playbook (100+ Cases Research)
                </span>
                <Badge
                  variant="destructive"
                  className="bg-red-600/30 text-red-300 border border-red-500/40 text-[10px] font-mono font-bold"
                >
                  {activeCase.severity.replace(/_/g, ' ')}
                </Badge>
                <span className="text-[10px] font-mono text-muted-foreground">
                  {activeCase.case_id}
                </span>
              </div>
              <p className="text-[11px] text-slate-300 mt-0.5">
                Investigative simulation solving future failure points across syndicate evasions, cross-border infiltration, cyber-extortion, and missing persons.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap shrink-0">
            {/* Category Filter */}
            <select
              value={selectedCategory}
              onChange={(e) => {
                sound.playClickSound();
                setSelectedCategory(e.target.value);
              }}
              style={{ colorScheme: 'dark', backgroundColor: '#0f172a', color: '#f8fafc' }}
              className="h-8 px-2.5 rounded-lg border border-border bg-slate-900 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-sky-500 font-medium [&>option]:bg-slate-900 [&>option]:text-slate-100"
              title="Filter by Case Category"
            >
              <option value="ALL">All Categories (30 Cases)</option>
              <option value="SYNDICATE_EVASION">Syndicate Evasion</option>
              <option value="CROSS_BORDER_INFILTRATION">Cross-Border Infiltration</option>
              <option value="CHILD_ABDUCTION">Child Abduction / Amber Alert</option>
              <option value="CYBER_KIDNAPPING">Cyber-Kidnapping & Extortion</option>
              <option value="WITNESS_PROTECTION">Witness Protection & Ambush</option>
              <option value="ARMED_HEIST">Armed Heist & Breakout</option>
              <option value="HIGHWAY_HIJACKING">Highway Freight Hijacking</option>
              <option value="COASTAL_SMUGGLING">Coastal Sea-Route Smuggling</option>
              <option value="ELDER_DEMENTIA_RECOVERY">Elder Dementia Rail Wandering</option>
              <option value="DECOY_VEHICLE_SWAP">Decoy Vehicle & Plate Swap</option>
            </select>

            {/* Case Selector Dropdown */}
            <select
              value={selectedCaseId}
              onChange={(e) => handleSelectCase(e.target.value)}
              style={{ colorScheme: 'dark', backgroundColor: '#0f172a', color: '#f8fafc' }}
              className="h-8 px-2.5 rounded-lg border border-sky-500/50 bg-slate-900 text-xs text-sky-200 font-bold focus:outline-none focus:ring-1 focus:ring-sky-400 max-w-[280px] truncate [&>option]:bg-slate-900 [&>option]:text-slate-100"
              title="Select one of 30 Critical Cases"
            >
              {CRITICAL_CASES.filter((c) => selectedCategory === 'ALL' || c.category === selectedCategory).map((c) => (
                <option key={c.case_id} value={c.case_id}>
                  {c.case_id}: {c.title}
                </option>
              ))}
            </select>

            {/* Omni Trace Satellite Radar Modal Launch */}
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                sound.playClickSound();
                setOmniModalOpen(true);
              }}
              className="h-8 border-cyan-500/60 bg-cyan-950/40 text-cyan-300 hover:bg-cyan-900/40 text-xs font-bold flex items-center gap-1.5 shadow-sm"
              title="Open Omni Trace Earth Observation & Multi-Sensor Radar for this case"
            >
              <Radar className="h-3.5 w-3.5 text-cyan-400" />
              <span>Omni Trace Radar</span>
            </Button>

            {/* Solve & Encapsulate Button */}
            <Button
              size="sm"
              onClick={handleSolveCase}
              disabled={isSolvingCase}
              className="h-8 bg-gradient-to-r from-red-600 to-amber-600 hover:from-red-500 hover:to-amber-500 text-white font-extrabold text-xs flex items-center gap-1.5 shadow-md shadow-red-950/50"
              title="Execute Real-Time Multi-Sensor Voronoi Encapsulation Solver"
            >
              {isSolvingCase ? (
                <RotateCcw className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Target className="h-3.5 w-3.5" />
              )}
              <span>{isSolvingCase ? 'Encapsulating...' : 'Solve & Encapsulate'}</span>
            </Button>
          </div>
        </div>

        {/* Selected Case Quick Stats Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 pt-2 border-t border-white/10 text-xs font-mono">
          <div className="p-2 rounded-lg bg-black/40 border border-white/5 space-y-0.5">
            <span className="text-[9px] uppercase text-muted-foreground block">Target / Particulars</span>
            <span className="text-white font-bold truncate block">{activeCase.suspect_or_victim}</span>
          </div>

          <div className="p-2 rounded-lg bg-black/40 border border-white/5 space-y-0.5">
            <span className="text-[9px] uppercase text-muted-foreground block">Corridor Vector</span>
            <span className="text-sky-300 font-bold truncate block">
              {activeCase.origin_location.slice(0, 20)} ➔ {activeCase.destination_target.slice(0, 20)}
            </span>
          </div>

          <div className="p-2 rounded-lg bg-black/40 border border-white/5 space-y-0.5">
            <span className="text-[9px] uppercase text-muted-foreground block">Predicted Intercept Locus</span>
            <span className="text-amber-400 font-bold truncate block">
              {activeCase.intercept_point.name} (ETA: {activeCase.intercept_point.eta_minutes}m)
            </span>
          </div>

          <div className="p-2 rounded-lg bg-black/40 border border-white/5 space-y-0.5">
            <span className="text-[9px] uppercase text-muted-foreground block">Assigned Unit</span>
            <span className="text-emerald-400 font-bold truncate block">{activeCase.intercept_point.recommended_unit}</span>
          </div>
        </div>

        {/* View Mode Tabs */}
        <div className="flex items-center gap-2 pt-1">
          <button
            onClick={() => {
              sound.playClickSound();
              setActiveTab('SIMULATION');
            }}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'SIMULATION'
                ? 'bg-sky-600 text-white shadow-md'
                : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            <Play className="h-3 w-3" />
            <span>Tactical Map & Live Simulation</span>
          </button>

          <button
            onClick={() => {
              sound.playClickSound();
              setActiveTab('RESEARCH_100_CASES');
            }}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'RESEARCH_100_CASES'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            <BookOpen className="h-3 w-3" />
            <span>100+ Cases Research & Failure Points Analysis</span>
          </button>
        </div>
      </div>

      {/* Conditionally rendered 100+ Cases Research Tab */}
      {activeTab === 'RESEARCH_100_CASES' && (
        <div className="space-y-4 animate-in fade-in duration-300">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Card 1: Modus Operandi & Perpetrator Tradecraft */}
            <Card className="border-amber-500/40 bg-gradient-to-b from-amber-950/20 via-slate-900 to-slate-950 shadow-xl">
              <CardHeader className="pb-2 border-b border-amber-500/20 bg-amber-950/30">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-amber-400" />
                  <CardTitle className="text-xs font-bold text-amber-300 uppercase tracking-wide">
                    1. Perpetrator Modus Operandi (100+ Case Evasion Tradecraft)
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent className="pt-3 text-xs text-slate-200 leading-relaxed">
                <p>{activeCase.failure_analysis_100_cases.modus_operandi}</p>
              </CardContent>
            </Card>

            {/* Card 2: Conventional Policing Failure Points */}
            <Card className="border-red-500/40 bg-gradient-to-b from-red-950/20 via-slate-900 to-slate-950 shadow-xl">
              <CardHeader className="pb-2 border-b border-red-500/20 bg-red-950/30">
                <div className="flex items-center gap-2">
                  <AlertOctagon className="h-4 w-4 text-red-400" />
                  <CardTitle className="text-xs font-bold text-red-300 uppercase tracking-wide">
                    2. Why Conventional Police Interdiction Fails
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent className="pt-3 text-xs text-slate-200 leading-relaxed">
                <p>{activeCase.failure_analysis_100_cases.conventional_policing_failures}</p>
              </CardContent>
            </Card>

            {/* Card 3: Future Anticipated Vulnerabilities */}
            <Card className="border-purple-500/40 bg-gradient-to-b from-purple-950/20 via-slate-900 to-slate-950 shadow-xl">
              <CardHeader className="pb-2 border-b border-purple-500/20 bg-purple-950/30">
                <div className="flex items-center gap-2">
                  <Cpu className="h-4 w-4 text-purple-400" />
                  <CardTitle className="text-xs font-bold text-purple-300 uppercase tracking-wide">
                    3. Anticipated Future Vulnerabilities (What it will suffer in future)
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent className="pt-3 text-xs text-slate-200 leading-relaxed">
                <p>{activeCase.failure_analysis_100_cases.future_vulnerabilities}</p>
              </CardContent>
            </Card>

            {/* Card 4: CRIMENEXUS Real-World Encapsulation Solution */}
            <Card className="border-emerald-500/40 bg-gradient-to-b from-emerald-950/20 via-slate-900 to-slate-950 shadow-xl">
              <CardHeader className="pb-2 border-b border-emerald-500/20 bg-emerald-950/30">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                  <CardTitle className="text-xs font-bold text-emerald-300 uppercase tracking-wide">
                    4. CRIMENEXUS Real-World Multi-Sensor & Voronoi Solution
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent className="pt-3 text-xs text-slate-200 space-y-2">
                <div>
                  <span className="font-bold text-emerald-300 block">Automated Roadblock Trigger:</span>
                  <p>{activeCase.escape_encapsulation_solution.automated_roadblock_trigger}</p>
                </div>
                <div>
                  <span className="font-bold text-cyan-300 block">Multi-Sensor Radar Fusion:</span>
                  <p>{activeCase.omni_trace_solution.sensor_fusion_layers.join(' • ')}</p>
                </div>
                <div className="pt-1 flex items-center gap-2 font-mono text-[11px] text-muted-foreground">
                  <span>Mandate: {activeCase.escape_encapsulation_solution.admissibility_mandate}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* 3 Step Interactive Progress Pills */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
        <button
          onClick={handleExecuteStep1}
          className={`p-3 rounded-xl border text-left transition-all ${
            activeStep === 1
              ? 'border-emerald-500 bg-emerald-950/30 shadow-md ring-1 ring-emerald-500'
              : 'border-border bg-card/60 hover:border-slate-600'
          }`}
        >
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-slate-300">Attempt 1</span>
            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-800 text-slate-400">ANPR FUSION</span>
          </div>
          <div className="text-sm font-extrabold text-white mt-1">The Vehicle Swap</div>
          <div className="text-[11px] text-muted-foreground mt-0.5">Cloned plate defeated via FASTag correlation</div>
        </button>

        <button
          onClick={handleExecuteStep2}
          className={`p-3 rounded-xl border text-left transition-all ${
            activeStep === 2
              ? 'border-red-500 bg-red-950/30 shadow-md ring-1 ring-red-500'
              : 'border-border bg-card/60 hover:border-slate-600'
          }`}
        >
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-slate-300">Attempt 2</span>
            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-800 text-slate-400">ISOLATION FOREST</span>
          </div>
          <div className="text-sm font-extrabold text-white mt-1">The Smurfing Liquidation</div>
          <div className="text-[11px] text-muted-foreground mt-0.5">10 mule accounts frozen under Sec 106 BNSS</div>
        </button>

        <button
          onClick={handleExecuteStep3}
          className={`p-3 rounded-xl border text-left transition-all ${
            activeStep === 3
              ? 'border-cyan-500 bg-cyan-950/30 shadow-md ring-1 ring-cyan-500'
              : 'border-border bg-card/60 hover:border-slate-600'
          }`}
        >
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-slate-300">Attempt 3</span>
            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-800 text-slate-400">LINK PREDICTION & QAOA</span>
          </div>
          <div className="text-sm font-extrabold text-white mt-1">The Safehouse Hideout</div>
          <div className="text-[11px] text-muted-foreground mt-0.5">Adamic-Adar 88% prediction & PCR-04 intercept</div>
        </button>
      </div>

      {/* Split Screen: Left Side = Criminal Action, Right Side = CRIMENEXUS Countermeasure */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Left Side: Criminal Action */}
        <Card className="border-red-500/30 bg-gradient-to-b from-red-950/20 via-slate-900 to-slate-950 shadow-xl overflow-hidden">
          <CardHeader className="pb-3 border-b border-red-500/20 bg-red-950/30">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-red-500 animate-pulse" />
                <CardTitle className="text-sm font-extrabold text-red-400 uppercase tracking-wide">
                  Criminal Action (Bad Actor: Rajan)
                </CardTitle>
              </div>
              <Badge variant="outline" className="border-red-500/40 text-red-300 text-[10px] font-mono">
                EVASION ATTEMPTS
              </Badge>
            </div>
          </CardHeader>

          <CardContent className="space-y-4 pt-4 text-xs">
            {/* Step 1 Criminal Action: License Plate Swap Animation */}
            <div className={`p-3.5 rounded-xl border transition-all ${activeStep === 1 ? 'border-red-500/60 bg-red-950/30' : 'border-slate-800 bg-slate-950/60'}`}>
              <div className="flex items-center justify-between font-mono text-[11px] mb-2">
                <span className="font-bold text-slate-300">Attempt 1: Swap Vehicle License Plate</span>
                <span className="text-slate-500">Location: Sector 18 Flyover</span>
              </div>

              {/* Plate Flip Graphic */}
              <div className="flex items-center justify-center gap-4 py-3 bg-slate-950 rounded-lg border border-slate-800">
                <div className="text-center space-y-1">
                  <span className="text-[10px] text-slate-400 block font-mono">Original Registered Plate</span>
                  <div className="px-3 py-1.5 rounded bg-amber-400 text-slate-950 font-mono font-black text-sm tracking-wider border-2 border-slate-900 shadow">
                    TS 09 AB 1234
                  </div>
                </div>

                <ArrowRight className="h-5 w-5 text-red-400 animate-pulse" />

                <div className="text-center space-y-1">
                  <span className="text-[10px] text-red-400 font-bold block font-mono">Cloned Stolen Plate</span>
                  <div className={`px-3 py-1.5 rounded font-mono font-black text-sm tracking-wider border-2 shadow transition-all duration-500 ${
                    plateFlipped
                      ? 'bg-white text-slate-950 border-red-500 scale-105 shadow-red-500/50'
                      : 'bg-slate-800 text-slate-500 border-slate-700'
                  }`}>
                    DL 01 XY 9876
                  </div>
                </div>
              </div>
              <p className="text-[11px] text-slate-300 mt-2 leading-relaxed">
                Rajan bolts counterfeit Delhi plate DL 01 XY 9876 to disguise the Black Mahindra Scorpio S11 and evade highway cameras.
              </p>
            </div>

            {/* Step 2 Criminal Action: Smurfing Liquidation into Crypto */}
            <div className={`p-3.5 rounded-xl border transition-all ${activeStep === 2 ? 'border-red-500/60 bg-red-950/30' : 'border-slate-800 bg-slate-950/60'}`}>
              <div className="flex items-center justify-between font-mono text-[11px] mb-2">
                <span className="font-bold text-slate-300">Attempt 2: Panic Smurfing Liquidation</span>
                <span className="text-slate-500">Target: P2P Crypto Mixer</span>
              </div>

              <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 font-mono text-[11px] space-y-1.5">
                <div className="flex justify-between text-slate-400">
                  <span>Structured Amount:</span>
                  <span className="text-amber-400 font-bold">10 x ₹49,000 (Total ₹4,90,000)</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Strategy:</span>
                  <span className="text-slate-300">Stay strictly below ₹50,000 RBI/PMLA reporting threshold</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Destination:</span>
                  <span className="text-cyan-400">0x71C...B29 (Trc20 Cold Mixer)</span>
                </div>
              </div>
              <p className="text-[11px] text-slate-300 mt-2 leading-relaxed">
                Rajan fires 10 rapid structured payments across mule bank accounts in under 120 seconds to off-ramp illicit cash.
              </p>
            </div>

            {/* Step 3 Criminal Action: RF Radio Silence Safehouse Drive */}
            <div className={`p-3.5 rounded-xl border transition-all ${activeStep === 3 ? 'border-red-500/60 bg-red-950/30' : 'border-slate-800 bg-slate-950/60'}`}>
              <div className="flex items-center justify-between font-mono text-[11px] mb-2">
                <span className="font-bold text-slate-300">Attempt 3: RF Radio-Silence Safehouse Drive</span>
                <span className="text-slate-500">Status: PHONE POWERED OFF</span>
              </div>

              <div className="flex items-center gap-3 p-2.5 rounded-lg bg-slate-950 border border-slate-800 font-mono text-[11px]">
                <Smartphone className="h-6 w-6 text-red-400 shrink-0" />
                <div>
                  <div className="text-red-400 font-bold">Handset Powered Off (Zero Cellular Pings)</div>
                  <div className="text-slate-400 text-[10px]">Stealth transit to unmapped Sector 62 safehouse via back-alleys</div>
                </div>
              </div>
              <p className="text-[11px] text-slate-300 mt-2 leading-relaxed">
                Rajan powers down both phones, removes batteries, and drives in darkness towards an unmapped safehouse in Sector 62.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Right Side: CRIMENEXUS Countermeasure */}
        <Card className="border-emerald-500/30 bg-gradient-to-b from-emerald-950/20 via-slate-900 to-slate-950 shadow-xl overflow-hidden">
          <CardHeader className="pb-3 border-b border-emerald-500/20 bg-emerald-950/30">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
                <CardTitle className="text-sm font-extrabold text-emerald-400 uppercase tracking-wide">
                  CRIMENEXUS AI Countermeasure
                </CardTitle>
              </div>
              <Badge variant="outline" className="border-emerald-500/40 text-emerald-300 text-[10px] font-mono">
                AUTONOMOUS NEUTRALIZATION
              </Badge>
            </div>
          </CardHeader>

          <CardContent className="space-y-4 pt-4 text-xs">
            {/* Step 1 Countermeasure: ANPR & FASTag Cross-Correlation */}
            <div className={`p-3.5 rounded-xl border transition-all ${
              activeStep >= 1 ? 'border-emerald-500/60 bg-emerald-950/30 animate-in fade-in' : 'border-slate-800 bg-slate-950/60'
            }`}>
              <div className="flex items-center justify-between font-mono text-[11px] mb-2">
                <span className="font-bold text-emerald-300 flex items-center gap-1.5">
                  <Shield className="h-3.5 w-3.5 text-emerald-400" />
                  Fusion Engine: FASTag ID Correlation
                </span>
                <Badge variant="outline" className={`text-[9px] font-mono ${activeStep >= 1 ? 'border-emerald-400 text-emerald-300' : 'border-slate-700 text-slate-500'}`}>
                  {activeStep >= 1 ? 'MATCH LOCKED' : 'STANDBY'}
                </Badge>
              </div>

              {step1Data ? (
                <div className="space-y-2">
                  <div className="p-2.5 rounded-lg bg-emerald-950/50 border border-emerald-500/40 font-mono text-[11px] text-emerald-200">
                    <span className="font-extrabold block text-emerald-300 mb-0.5">⚡ ALERT TRIGGERED:</span>
                    {step1Data.fusion_alert}
                  </div>
                  <div className="grid grid-cols-2 gap-2 font-mono text-[10px] text-slate-300">
                    <div className="p-1.5 rounded bg-slate-950 border border-slate-800">
                      FASTag ID: <strong className="text-white">{step1Data.fastag_id}</strong>
                    </div>
                    <div className="p-1.5 rounded bg-slate-950 border border-slate-800">
                      Chassis Match: <strong className="text-emerald-400">{step1Data.chassis_match_confidence}%</strong>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-slate-500 italic text-[11px]">Awaiting Step 1 execution...</p>
              )}
            </div>

            {/* Step 2 Countermeasure: IsolationForest Smurfing Freeze */}
            <div className={`p-3.5 rounded-xl border transition-all ${
              activeStep >= 2 ? 'border-red-500/60 bg-red-950/30 animate-in fade-in' : 'border-slate-800 bg-slate-950/60'
            }`}>
              <div className="flex items-center justify-between font-mono text-[11px] mb-2">
                <span className="font-bold text-red-300 flex items-center gap-1.5">
                  <Scale className="h-3.5 w-3.5 text-red-400" />
                  Isolation Forest: Sec 106 BNSS Freeze
                </span>
                <Badge variant="outline" className={`text-[9px] font-mono ${activeStep >= 2 ? 'border-red-400 text-red-300 bg-red-950/50' : 'border-slate-700 text-slate-500'}`}>
                  {activeStep >= 2 ? '10 ACCOUNTS FROZEN' : 'STANDBY'}
                </Badge>
              </div>

              {step2Data ? (
                <div className="space-y-2">
                  <div className="p-2.5 rounded-lg bg-red-950/50 border border-red-500/40 font-mono text-[11px] text-red-200">
                    <span className="font-extrabold block text-red-300 mb-0.5">🛑 STATUTORY DEBIT FREEZE:</span>
                    {step2Data.hud_message}
                  </div>
                  <div className="grid grid-cols-2 gap-2 font-mono text-[10px] text-slate-300">
                    <div className="p-1.5 rounded bg-slate-950 border border-slate-800">
                      Anomaly Score: <strong className="text-red-400 font-bold">{step2Data.isolation_forest_score}</strong>
                    </div>
                    <div className="p-1.5 rounded bg-slate-950 border border-slate-800">
                      Amount Saved: <strong className="text-emerald-400 font-bold">₹{step2Data.total_frozen_amount_inr.toLocaleString('en-IN')}</strong>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-slate-500 italic text-[11px]">Awaiting Step 2 execution...</p>
              )}
            </div>

            {/* Step 3 Countermeasure: Adamic-Adar Link Prediction & QAOA Intercept */}
            <div className={`p-3.5 rounded-xl border transition-all ${
              activeStep >= 3 ? 'border-cyan-500/60 bg-cyan-950/30 animate-in fade-in' : 'border-slate-800 bg-slate-950/60'
            }`}>
              <div className="flex items-center justify-between font-mono text-[11px] mb-2">
                <span className="font-bold text-cyan-300 flex items-center gap-1.5">
                  <Cpu className="h-3.5 w-3.5 text-cyan-400" />
                  Link Prediction & QAOA Router
                </span>
                <Badge variant="outline" className={`text-[9px] font-mono ${activeStep >= 3 ? 'border-cyan-400 text-cyan-300 bg-cyan-950/50' : 'border-slate-700 text-slate-500'}`}>
                  {activeStep >= 3 ? 'INTERCEPT CONVERGED' : 'STANDBY'}
                </Badge>
              </div>

              {step3Data ? (
                <div className="space-y-2">
                  <div className="p-2.5 rounded-lg bg-cyan-950/50 border border-cyan-500/40 font-mono text-[11px] text-cyan-200">
                    <span className="font-extrabold block text-cyan-300 mb-0.5">🎯 LINK PREDICTION RATIONALE:</span>
                    {step3Data.link_prediction.explainability_card}
                  </div>
                  <div className="p-2 rounded bg-slate-950 border border-slate-800 font-mono text-[10px] space-y-1 text-slate-300">
                    <div className="flex justify-between">
                      <span>Predicted Destination:</span>
                      <span className="text-white font-bold">{step3Data.link_prediction.predicted_destination}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Adamic-Adar Probability:</span>
                      <span className="text-emerald-400 font-bold">{step3Data.link_prediction.confidence_percentage}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Dispatched Unit:</span>
                      <span className="text-cyan-400 font-bold">{step3Data.quantum_optimization.responding_unit}</span>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-slate-500 italic text-[11px]">Awaiting Step 3 execution...</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tactical Map Container at the Bottom */}
      <Card className="overflow-hidden border-border bg-slate-950 shadow-xl relative">
        <div className="p-2.5 px-3.5 bg-slate-900 border-b border-border flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 font-mono">
            <MapPin className="h-4 w-4 text-cyan-400" />
            <span className="font-bold text-white">Tactical Intercept MapLibre Canvas</span>
            <span className="text-[10px] text-slate-400">Real-Time Correlated Geometries</span>
          </div>

          <div className="flex items-center gap-3 font-mono text-[11px]">
            {activeStep === 1 && (
              <span className="text-amber-400 flex items-center gap-1">
                <Car className="h-3.5 w-3.5" />
                <span>Vehicle Detected: Yamuna Toll KM 48</span>
              </span>
            )}
            {activeStep === 2 && (
              <span className="text-red-400 flex items-center gap-1">
                <CreditCard className="h-3.5 w-3.5" />
                <span>10 Smurfing Mules Frozen</span>
              </span>
            )}
            {activeStep === 3 && (
              <span className="text-emerald-400 flex items-center gap-1 font-bold animate-pulse">
                <CheckCircle2 className="h-3.5 w-3.5" />
                <span>PCR-04 Intercept Vector Locked</span>
              </span>
            )}
          </div>
        </div>

        <div className="h-[360px] w-full relative">
          <div ref={mapContainerRef} className="w-full h-full tactical-dark-map" />

          {/* Bottom HUD Legend */}
          <div className="absolute bottom-3 left-3 z-10 p-2.5 rounded-lg bg-slate-950/90 border border-slate-700/80 text-[10px] space-y-1 font-mono text-slate-300 shadow-xl backdrop-blur-md">
            <div className="font-bold text-white uppercase text-[9px] border-b border-slate-700 pb-1">
              Operation Shatter Map Legend
            </div>
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-red-600 inline-block" />
              <span>Rajan (Target Scorpio DL 01 XY 9876)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-blue-600 inline-block" />
              <span>PCR Patrol Unit Alpha-04</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-0.5 bg-emerald-400 inline-block" />
              <span>Green Dashed QAOA Intercept Vector</span>
            </div>
          </div>
        </div>
      </Card>

      {/* Modal: Suspect Intercepted & 24-Hour Remand Clock Initiation */}
      <Modal
        isOpen={showInterceptModal}
        onClose={() => setShowInterceptModal(false)}
        title="Operation Shatter: Intercept Successful & Remand Protocol"
        maxWidth="max-w-2xl"
      >
        <div className="space-y-4 text-slate-200 font-sans">
          <div className="p-4 rounded-xl border-2 border-emerald-500/50 bg-gradient-to-b from-emerald-950/40 via-slate-900 to-slate-950 text-center space-y-2">
            <div className="inline-flex p-2 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-400/40 mb-1">
              <CheckCircle2 className="h-8 w-8 animate-bounce" />
            </div>
            <h3 className="text-lg font-black text-white">
              KINGPIN RAJAN VERMA CONTAINED & INTERCEPTED
            </h3>
            <p className="text-xs text-slate-300 font-mono">
              Location: Sector 62 Safehouse, Noida • Time to Capture: 11.4 Minutes
            </p>

            <div className="inline-flex items-center gap-2 p-2 px-3 rounded-lg bg-red-950/50 border border-red-500/40 text-red-200 font-mono text-xs">
              <Clock className="h-4 w-4 text-red-400 animate-spin" />
              <span>MANDATORY 24-HOUR JUDICIAL REMAND CLOCK: </span>
              <strong className="text-white text-sm">
                {Math.floor(remandTimerSeconds / 3600)}h {Math.floor((remandTimerSeconds % 3600) / 60)}m {remandTimerSeconds % 60}s
              </strong>
            </div>
          </div>

          {/* Neutralization Summary Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 text-xs font-mono">
            <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 space-y-1">
              <span className="text-[10px] text-slate-400 uppercase tracking-wide block">Attempt 1</span>
              <div className="font-bold text-white">FASTag Correlation</div>
              <div className="text-emerald-400 text-[10px]">Chassis texture 96.8%</div>
            </div>

            <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 space-y-1">
              <span className="text-[10px] text-slate-400 uppercase tracking-wide block">Attempt 2</span>
              <div className="font-bold text-white">Isolation Forest</div>
              <div className="text-red-400 text-[10px]">10 Mules Frozen (₹4.9L)</div>
            </div>

            <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 space-y-1">
              <span className="text-[10px] text-slate-400 uppercase tracking-wide block">Attempt 3</span>
              <div className="font-bold text-white">Link Prediction</div>
              <div className="text-cyan-400 text-[10px]">Sector 62 @ 88% Prob</div>
            </div>
          </div>

          <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 text-[11px] font-mono space-y-1">
            <div className="text-slate-400">Statutory Remand Mandate:</div>
            <div className="text-white font-bold">
              Article 22(2) Constitution of India & Section 57 / 167 CrPC (Section 187 BNSS 2023)
            </div>
            <div className="text-slate-400 text-[10px] pt-1">
              Accused must be produced before the nearest Judicial Magistrate within 24 hours of arrest excluding transit time.
            </div>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-border">
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                sound.playClickSound();
                setShowInterceptModal(false);
              }}
              className="text-xs"
            >
              Dismiss Window
            </Button>

            <div className="flex items-center gap-2">
              <Link to="/drafting">
                <Button
                  size="sm"
                  onClick={() => sound.playClickSound()}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-xs"
                >
                  <FileText className="h-4 w-4 mr-1.5" />
                  <span>Draft Remand Application</span>
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </Modal>

      <DocumentPreviewModal
        isOpen={previewDossierOpen}
        onClose={() => setPreviewDossierOpen(false)}
        title="Fugitive Pursuit & Escape Trajectory Dossier"
        subtitle="FIR-2026-DEL-9812 • Accused: Vikram Malhotra (WANTED) • Intercept Toll KM 48"
        caseNumber="FIR-2026-DEL-9812"
        pdfUrl="/CRIMENEXUS_Police_Department_Deployment_Dossier.pdf"
        fileName="Escape_Trajectory_Dossier_FIR-2026-DEL-9812.pdf"
        metadata={{
          ioName: 'Inspector Rajesh Varma',
          policeStation: 'Jewar Police Station (Yamuna Expressway Command)',
          suspectName: 'Vikram Malhotra @ Vicky (Scorpio TS 09 AB 1234)',
          crimeType: 'Armed Getaway, FASTag Toll Evasion & Organized Extortion',
          hash: '8f4a1c9d2e3b5a7c0f1e2d4b6a8c0e2f4a6b8c0d2e4f6a8b0c2d4e6f8a0b2c4',
        }}
      />

      <OmniTraceSatelliteModal
        isOpen={omniModalOpen}
        onClose={() => setOmniModalOpen(false)}
        latitude={activeCase.intercept_point.coords[1]}
        longitude={activeCase.intercept_point.coords[0]}
        locationName={activeCase.intercept_point.name}
        reportNumber={activeCase.case_id}
        caseTitle={activeCase.title}
        caseCategory={activeCase.category}
        sensorFusionLayers={activeCase.omni_trace_solution.sensor_fusion_layers}
        radarRcsDb={activeCase.omni_trace_solution.radar_cross_section_db}
        rfSnrDb={activeCase.omni_trace_solution.rf_snr_db}
        confidenceScore={activeCase.omni_trace_solution.confidence_score}
      />
    </div>
  );
}
