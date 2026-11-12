import React, { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import * as maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import {
  Sparkles,
  MapPin,
  Clock,
  Radio,
  Wifi,
  CreditCard,
  Bluetooth,
  Bus,
  Search,
  AlertTriangle,
  ShieldAlert,
  Play,
  RotateCcw,
  CheckCircle2,
  Share2,
  FileText,
  Navigation,
  Layers,
  ChevronRight,
  User,
  Phone,
  Eye,
  Sliders,
  ExternalLink,
  Volume2,
  HeartPulse,
  Battery,
  Sun,
  Moon,
  Users,
  Plus,
  Activity,
  ShieldCheck,
  Check,
  Copy,
  FileSpreadsheet,
  Download,
  Car,
  Zap,
  FileCode,
  CheckSquare,
  VolumeX,
  RadioTower,
  EyeOff,
  Globe,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { sound } from '../../utils/soundEffects';
import { useToast } from '../../components/ui/Toast';
import { DemoPlayer } from './DemoPlayer';
import { DocumentPreviewModal } from '../../components/common/DocumentPreviewModal';
import { OmniTraceSatelliteModal } from '../../components/common/OmniTraceSatelliteModal';

// 100% Free OpenStreetMap Raster Style (Guarantees zero API keys, no Carto 'KEY REQUIRED' watermark)
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
        'raster-brightness-max': 0.72,
        'raster-contrast': 0.18,
        'raster-saturation': -0.82,
      },
    },
  ],
};

interface SightingItem {
  lat: number;
  lon: number;
  time: string;
  confidence: number;
  source: string;
  verified: boolean;
  note?: string;
}

interface PredictionItem {
  name: string;
  predicted_lat: number;
  predicted_lon: number;
  confidence: number;
  reasoning?: {
    title?: string;
    summary?: string;
    temporal_pattern?: string;
    transit_momentum?: string;
    bluetooth_density?: string;
    historical_pattern?: string;
    shap_weights?: Record<string, number>;
  };
}

export function GuardianTracePage() {
  const toast = useToast();
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const markersRef = useRef<maplibregl.Marker[]>([]);

  // Demo Player State
  const [demoPlayerOpen, setDemoPlayerOpen] = useState<boolean>(false);
  const [dossierModalOpen, setDossierModalOpen] = useState<boolean>(false);
  const [broadcastModalOpen, setBroadcastModalOpen] = useState<boolean>(false);
  const [foundModalOpen, setFoundModalOpen] = useState<boolean>(false);
  const [satelliteModalOpen, setSatelliteModalOpen] = useState<boolean>(false);

  // Search Grid & Rings Toggle
  const [searchRingsVisible, setSearchRingsVisible] = useState<boolean>(true);

  // Timeline Hour Slider (0 = last seen 18h ago, 18 = present time)
  const [timelineHour, setTimelineHour] = useState<number>(18);
  const [isPlayingTimeline, setIsPlayingTimeline] = useState<boolean>(false);

  // Realistic Feature Additions: Filter, Squads, Audio, Register
  const [selectedSignalSource, setSelectedSignalSource] = useState<string>('ALL');
  const [registerModalOpen, setRegisterModalOpen] = useState<boolean>(false);
  const [isSpeakingBriefing, setIsSpeakingBriefing] = useState<boolean>(false);

  // Ground Search & Rescue Squads Grid
  const [rescueSquads, setRescueSquads] = useState([
    { id: 'ALPHA', name: 'Squad Alpha (Metro Picket)', sector: 'Sector 1 - Lajpat Exit', freq: '142.85 MHz', status: 'SEARCHING', personnel: 4, leader: 'SI Ankit Kumar' },
    { id: 'BRAVO', name: 'Squad Bravo (NDLS Rail Unit)', sector: 'Sector 2 - Platform 1-4', freq: '143.20 MHz', status: 'EN_ROUTE', personnel: 6, leader: 'Insp. R. Varma' },
    { id: 'CHARLIE', name: 'Squad Charlie (Paharganj Combing)', sector: 'Sector 3 - Main Bazaar', freq: '144.10 MHz', status: 'STAGING', personnel: 5, leader: 'HC Devendra' },
  ]);

  // Transit Intercept Chokepoints
  const [chokepoints, setChokepoints] = useState([
    { id: 'CK-1', name: 'NDLS Railway Gate 1', type: 'Railway Terminal', status: 'PICKET_ACTIVE', officers: 4 },
    { id: 'CK-2', name: 'Rajiv Chowk Metro Gate 7', type: 'Metro Interchange', status: 'INTERCEPT_ALERT', officers: 3 },
    { id: 'CK-3', name: 'Kashmere Gate ISBT Concourse', type: 'Inter-State Bus', status: 'PATROL_ASSIGNED', officers: 5 },
    { id: 'CK-4', name: 'Paharganj Chowk Crossing', type: 'Vehicular Checkpost', status: 'SECTOR_SEALED', officers: 2 },
  ]);

  // Direct Case Registration Form State
  const [newCaseForm, setNewCaseForm] = useState({
    person_name: '',
    age: '',
    gender: 'Female',
    description: '',
    station_id: 'PS Lajpat Nagar',
    mobile_number: '',
    imei: '',
    last_seen_location: '',
    medical_notes: 'None',
  });

  // Case Data State
  const [caseData, setCaseData] = useState<any>({
    case_number: 'MP-2026-DEMO-001',
    person_name: 'Aanya Sharma',
    age: 8,
    gender: 'Female',
    description: '8-year-old girl, brown hair, wearing blue school uniform (Delhi Public School), red school bag, small scar on left knee',
    photo_url: 'https://images.unsplash.com/photo-1543332164-6e82f355badc?w=400',
    last_seen_lat: 28.5665,
    last_seen_lon: 77.2431,
    last_seen_location: 'Lajpat Nagar Metro Station, Exit Gate 3',
    last_seen_time: '18 hours ago (3:30 PM)',
    priority: 'CRITICAL',
    station_id: 'PS-LAJPAT-NAGAR',
    assigned_officer: 'Inspector Rajesh Varma (Missing Persons Unit)',
    mobile_number: '+91 98XXXX5678',
    imei: '356789012345678',
    status: 'ACTIVE',
  });

  const [sightings, setSightings] = useState<SightingItem[]>([
    { lat: 28.5665, lon: 77.2431, time: '15:30 IST (-18h)', confidence: 0.95, source: 'IMEI_PING', verified: true, note: 'Lajpat Nagar Metro Exit Gate 3' },
    { lat: 28.5668, lon: 77.2425, time: '15:42 IST (-17.8h)', confidence: 0.85, source: 'CCTV', verified: true, note: 'Metro Corridor optical match' },
    { lat: 28.5660, lon: 77.2435, time: '15:58 IST (-17.5h)', confidence: 0.90, source: 'METRO_CARD', verified: true, note: 'Violet Line AFC gate entry' },
    { lat: 28.6328, lon: 77.2197, time: '16:45 IST (-17.2h)', confidence: 0.90, source: 'METRO_CARD', verified: true, note: 'Rajiv Chowk Interchange exit' },
    { lat: 28.6320, lon: 77.2185, time: '18:30 IST (-15h)', confidence: 0.80, source: 'CCTV', verified: true, note: 'Connaught Place Inner Circle optical hit' },
    { lat: 28.6315, lon: 77.2167, time: '20:30 IST (-13h)', confidence: 0.70, source: 'WIFI_PROBE', verified: true, note: 'CP Block B public cafe WiFi probe' },
    { lat: 28.6280, lon: 77.2140, time: '21:30 IST (-12h)', confidence: 0.85, source: 'UPI', verified: true, note: '₹200 pharmacy medicine debit' },
    { lat: 28.6420, lon: 77.2120, time: '23:30 IST (-10h)', confidence: 0.65, source: 'BLUETOOTH', verified: true, note: 'Paharganj smart-band BLE beacon' },
    { lat: 28.6435, lon: 77.2105, time: '03:30 IST (-6h)', confidence: 0.72, source: 'WIFI_PROBE', verified: true, note: 'Paharganj hostel router handshake' },
    { lat: 28.6458, lon: 77.2087, time: '07:30 IST (-2h)', confidence: 0.90, source: 'TRANSIT', verified: true, note: 'DTC Bus E-Ticket #181 to NDLS' },
    { lat: 28.6480, lon: 77.2070, time: '08:30 IST (-1h)', confidence: 0.60, source: 'CITIZEN', verified: true, note: 'Citizen tip: girl near Ajmeri Gate' },
    { lat: 28.6500, lon: 77.2050, time: '09:30 IST (Recent)', confidence: 0.92, source: 'IMEI_PING', verified: true, note: 'Active cell tower: Sector 4 NDLS' },
  ]);

  const [predictions, setPredictions] = useState<PredictionItem[]>([
    {
      name: 'New Delhi Railway Station (Platform Concourse)',
      predicted_lat: 28.6430,
      predicted_lon: 77.2195,
      confidence: 0.87,
      reasoning: {
        summary: 'Diurnal transit momentum & directional velocity vector isolates NDLS Platform 1-4 concourse.',
      },
    },
    {
      name: 'Paharganj Hotel & Transit Lodging Zone',
      predicted_lat: 28.6420,
      predicted_lon: 77.2120,
      confidence: 0.72,
      reasoning: {
        summary: 'Dense Bluetooth MAC cluster and high-turnover pedestrian lodging density.',
      },
    },
    {
      name: 'Karol Bagh Commercial Metro Corridor',
      predicted_lat: 28.6520,
      predicted_lon: 77.1900,
      confidence: 0.65,
      reasoning: {
        summary: 'Westbound Blue Line connection and high-density commercial market sanctuary.',
      },
    },
  ]);

  // Fetch real case data from backend if available
  useEffect(() => {
    const baseURL = import.meta.env.VITE_API_BASE_URL || '/api/v1';
    axios
      .get(`${baseURL}/guardian-trace/case/MP-2026-DEMO-001`)
      .then((res) => {
        if (res.data) setCaseData(res.data);
      })
      .catch(() => {
        // Keeps resilient demo case data
      });

    axios
      .get(`${baseURL}/guardian-trace/case/MP-2026-DEMO-001/trajectory`)
      .then((res) => {
        if (res.data?.trajectory && res.data.trajectory.length > 0) {
          setSightings(res.data.trajectory);
        }
      })
      .catch(() => {});

    axios
      .get(`${baseURL}/guardian-trace/case/MP-2026-DEMO-001/predictions`)
      .then((res) => {
        if (res.data?.predictions && res.data.predictions.length > 0) {
          setPredictions(res.data.predictions);
        }
      })
      .catch(() => {});
  }, []);

  // Initialize MapLibre GL
  useEffect(() => {
    if (!mapContainerRef.current) return;

    const map = new maplibregl.Map({
      container: mapContainerRef.current,
      style: MAP_STYLE,
      center: [77.2250, 28.6050], // Delhi central corridor
      zoom: 11.2,
      pitch: 0,
    });

    map.on('load', () => {
      // 1. Add Trajectory Line Source & Layer (Cyan Dashed Line)
      const lineCoords = sightings.map((s) => [s.lon, s.lat]);

      map.addSource('guardian-trajectory', {
        type: 'geojson',
        data: {
          type: 'Feature',
          properties: {},
          geometry: {
            type: 'LineString',
            coordinates: lineCoords,
          },
        },
      });

      map.addLayer({
        id: 'guardian-trajectory-glow',
        type: 'line',
        source: 'guardian-trajectory',
        layout: { 'line-join': 'round', 'line-cap': 'round' },
        paint: {
          'line-color': '#06b6d4',
          'line-width': 8,
          'line-opacity': 0.35,
        },
      });

      map.addLayer({
        id: 'guardian-trajectory-line',
        type: 'line',
        source: 'guardian-trajectory',
        layout: { 'line-join': 'round', 'line-cap': 'round' },
        paint: {
          'line-color': '#22d3ee',
          'line-width': 3,
          'line-dasharray': [3, 2],
        },
      });

      // 2. Add Concentric Search Rings (1km, 3km, 10km) around Last Known
      const lastLat = 28.5665;
      const lastLon = 77.2431;

      // Helper to generate circle GeoJSON polygon
      const createGeoCircle = (centerLon: number, centerLat: number, radiusKm: number, points = 64) => {
        const coords: number[][] = [];
        const distanceX = radiusKm / (111.32 * Math.cos((centerLat * Math.PI) / 180));
        const distanceY = radiusKm / 110.574;

        for (let i = 0; i <= points; i++) {
          const theta = (i / points) * (2 * Math.PI);
          const x = distanceX * Math.cos(theta);
          const y = distanceY * Math.sin(theta);
          coords.push([centerLon + x, centerLat + y]);
        }
        return {
          type: 'Feature' as const,
          properties: { radiusKm },
          geometry: {
            type: 'Polygon' as const,
            coordinates: [coords],
          },
        };
      };

      map.addSource('search-rings-source', {
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features: [
            createGeoCircle(lastLon, lastLat, 1.0),
            createGeoCircle(lastLon, lastLat, 3.0),
            createGeoCircle(lastLon, lastLat, 10.0),
          ],
        },
      });

      map.addLayer({
        id: 'search-rings-fill',
        type: 'fill',
        source: 'search-rings-source',
        paint: {
          'fill-color': '#ef4444',
          'fill-opacity': 0.04,
        },
      });

      map.addLayer({
        id: 'search-rings-outline',
        type: 'line',
        source: 'search-rings-source',
        paint: {
          'line-color': '#f59e0b',
          'line-width': 1.5,
          'line-dasharray': [2, 2],
          'line-opacity': 0.65,
        },
      });

      // Render Map Markers
      renderMarkers(map);
    });

    mapRef.current = map;

    return () => {
      markersRef.current.forEach((m) => m.remove());
      markersRef.current = [];
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Update Markers based on timeline & predictions
  const renderMarkers = useCallback((mapInstance: maplibregl.Map) => {
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    // Filter sightings up to current timeline hour
    const visibleSightings = sightings.slice(0, Math.max(1, Math.ceil((timelineHour / 18) * sightings.length)));

    // 1. Red Pulsing Marker for Last Known / Origin (Lajpat Nagar)
    const originEl = document.createElement('div');
    originEl.className = 'relative flex items-center justify-center cursor-pointer';
    originEl.innerHTML = `
      <div class="h-6 w-6 rounded-full bg-red-600/40 animate-ping absolute"></div>
      <div class="h-4 w-4 rounded-full bg-red-600 border-2 border-white shadow-xl relative z-10 flex items-center justify-center text-[8px] font-bold text-white">0</div>
    `;
    const originMarker = new maplibregl.Marker({ element: originEl })
      .setLngLat([77.2431, 28.5665])
      .setPopup(new maplibregl.Popup({ offset: 15 }).setHTML('<b>Aanya Sharma (8)</b><br/>Last Seen: Lajpat Nagar Metro Exit Gate 3'))
      .addTo(mapInstance);
    markersRef.current.push(originMarker);

    // 2. Yellow Historical Sighting Markers
    visibleSightings.forEach((s, idx) => {
      if (idx === 0) return; // origin already rendered
      const el = document.createElement('div');
      el.className = 'h-3.5 w-3.5 rounded-full bg-amber-400 border border-black shadow-md cursor-pointer hover:scale-125 transition-transform';
      const marker = new maplibregl.Marker({ element: el })
        .setLngLat([s.lon, s.lat])
        .setPopup(new maplibregl.Popup({ offset: 10 }).setHTML(`<b>#${idx + 1} ${s.source}</b><br/>${s.time}<br/>Confidence: ${(s.confidence * 100).toFixed(0)}%`))
        .addTo(mapInstance);
      markersRef.current.push(marker);
    });

    // 3. Green Pulsing Circles for Top-3 Predicted Locations
    predictions.forEach((p, idx) => {
      const predEl = document.createElement('div');
      predEl.className = 'relative flex items-center justify-center cursor-pointer group';
      predEl.innerHTML = `
        <div class="h-8 w-8 rounded-full bg-emerald-500/30 animate-pulse absolute"></div>
        <div class="h-5 w-5 rounded-full bg-emerald-500 border-2 border-white shadow-2xl relative z-10 flex items-center justify-center text-[9px] font-black text-black">
          ${idx + 1}
        </div>
      `;
      const predMarker = new maplibregl.Marker({ element: predEl })
        .setLngLat([p.predicted_lon, p.predicted_lat])
        .setPopup(
          new maplibregl.Popup({ offset: 15 }).setHTML(
            `<b>AI PREDICTION #${idx + 1} (${(p.confidence * 100).toFixed(0)}%)</b><br/>${p.name}<br/><i>${p.reasoning?.summary || 'High transit probability'}</i>`
          )
        )
        .addTo(mapInstance);
      markersRef.current.push(predMarker);
    });
  }, [sightings, predictions, timelineHour]);

  // Re-render markers when timeline changes
  useEffect(() => {
    if (mapRef.current && mapRef.current.isStyleLoaded()) {
      renderMarkers(mapRef.current);
    }
  }, [timelineHour, renderMarkers]);

  // Toggle Search Rings Visibility
  const toggleSearchRings = () => {
    sound.playClickSound();
    const nextState = !searchRingsVisible;
    setSearchRingsVisible(nextState);

    if (mapRef.current && mapRef.current.getLayer('search-rings-fill')) {
      mapRef.current.setLayoutProperty(
        'search-rings-fill',
        'visibility',
        nextState ? 'visible' : 'none'
      );
      mapRef.current.setLayoutProperty(
        'search-rings-outline',
        'visibility',
        nextState ? 'visible' : 'none'
      );
    }
    toast.info(nextState ? 'Ring Search concentric grid activated (1km, 3km, 10km).' : 'Search rings hidden.', 'Search Grid');
  };

  // Keyboard Shortcuts: Space (timeline), T (toggle rings), B (broadcast), P (play demo)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeEl = document.activeElement;
      if (
        activeEl &&
        (activeEl.tagName === 'INPUT' ||
          activeEl.tagName === 'TEXTAREA' ||
          activeEl.getAttribute('contenteditable') === 'true')
      ) {
        return;
      }

      if (e.key === ' ' || e.code === 'Space') {
        e.preventDefault();
        setIsPlayingTimeline((prev) => !prev);
      } else if (e.key.toLowerCase() === 't') {
        e.preventDefault();
        toggleSearchRings();
      } else if (e.key.toLowerCase() === 'b') {
        e.preventDefault();
        sound.playAlertBeep();
        setBroadcastModalOpen(true);
      } else if (e.key.toLowerCase() === 'p') {
        e.preventDefault();
        sound.playRadarPing();
        setDemoPlayerOpen(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [searchRingsVisible]);

  // Timeline auto-play slider
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isPlayingTimeline) {
      interval = setInterval(() => {
        setTimelineHour((prev) => {
          if (prev >= 18) {
            setIsPlayingTimeline(false);
            return 18;
          }
          return prev + 1;
        });
      }, 800);
    }
    return () => clearInterval(interval);
  }, [isPlayingTimeline]);

  const handleDispatchPCR = (prediction: PredictionItem) => {
    sound.playWarningBeep();
    toast.warning(
      `TACTICAL DISPATCH: PCR-04 dispatched to ${prediction.name} (Predicted Confidence: ${(prediction.confidence * 100).toFixed(0)}%). Intercept ETA 4 mins.`,
      'PCR Patrol Dispatched'
    );
  };

  const playTacticalAudioBrief = () => {
    if (!('speechSynthesis' in window)) {
      toast.warning('Synthetic voice dispatch is not supported on this browser.');
      return;
    }
    if (isSpeakingBriefing) {
      window.speechSynthesis.cancel();
      setIsSpeakingBriefing(false);
      return;
    }
    const brief = `Guardian Trace Tactical Alert. Missing subject: ${caseData.person_name}, age ${caseData.age}. Priority Critical. Last seen at ${caseData.last_seen_location}. Highest probability vector is New Delhi Railway Station concourse with 87 percent confidence. Dispatch Squad Alpha and Bravo immediately.`;
    const utterance = new SpeechSynthesisUtterance(brief);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    utterance.onend = () => setIsSpeakingBriefing(false);
    utterance.onerror = () => setIsSpeakingBriefing(false);
    setIsSpeakingBriefing(true);
    window.speechSynthesis.speak(utterance);
    toast.info('Broadcasting tactical audio briefing to field units...', 'Audio Dispatch');
  };

  const handleExportSARGeoJSON = () => {
    sound.playSuccessChime();
    const geojsonData = {
      type: 'FeatureCollection',
      features: [
        {
          type: 'Feature',
          properties: { case_number: caseData.case_number, subject: caseData.person_name, type: 'trajectory' },
          geometry: {
            type: 'LineString',
            coordinates: sightings.map((s) => [s.lon, s.lat]),
          },
        },
        ...sightings.map((s, idx) => ({
          type: 'Feature',
          properties: { index: idx + 1, source: s.source, time: s.time, confidence: s.confidence, note: s.note },
          geometry: { type: 'Point', coordinates: [s.lon, s.lat] },
        })),
        ...predictions.map((p, idx) => ({
          type: 'Feature',
          properties: { type: 'prediction', rank: idx + 1, name: p.name, confidence: p.confidence },
          geometry: { type: 'Point', coordinates: [p.predicted_lon, p.predicted_lat] },
        })),
      ],
    };
    const blob = new Blob([JSON.stringify(geojsonData, null, 2)], { type: 'application/geo+json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Guardian_Trace_SAR_${caseData.case_number}.geojson`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success('SAR GeoJSON bundle downloaded for GPS units and DJI search drones.', 'Export Complete');
  };

  const handleRegisterNewCase = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCaseForm.person_name || !newCaseForm.age) {
      toast.error('Please enter person name and age.');
      return;
    }
    sound.playSuccessChime();
    const generatedCaseNumber = `MP-2026-REG-${Math.floor(1000 + Math.random() * 9000)}`;
    setCaseData({
      case_number: generatedCaseNumber,
      person_name: newCaseForm.person_name,
      age: parseInt(newCaseForm.age, 10),
      gender: newCaseForm.gender,
      description: newCaseForm.description || 'Subject reported missing. Investigation underway.',
      photo_url: 'https://images.unsplash.com/photo-1543332164-6e82f355badc?w=400',
      last_seen_lat: 28.5665,
      last_seen_lon: 77.2431,
      last_seen_location: newCaseForm.last_seen_location || 'Lajpat Nagar Metro Station',
      last_seen_time: 'Just now',
      priority: parseInt(newCaseForm.age, 10) < 12 ? 'CRITICAL' : 'HIGH',
      station_id: newCaseForm.station_id,
      assigned_officer: 'Duty Inspector (Crime Branch)',
      mobile_number: newCaseForm.mobile_number || '+91 98XXXX1100',
      imei: newCaseForm.imei || '356789012349999',
      status: 'ACTIVE',
    });
    setRegisterModalOpen(false);
    toast.success(`Missing person docket ${generatedCaseNumber} created and active in HUD.`, 'Case Docket Registered');
  };

  const filteredSightings = selectedSignalSource === 'ALL'
    ? sightings
    : sightings.filter((s) => s.source === selectedSignalSource);

  return (
    <div className="space-y-4">
      {/* Top Banner: Emergency Mandate & Demo Quick Launcher */}
      <div className="p-4 sm:p-5 rounded-2xl border-2 border-red-500/60 bg-gradient-to-br from-red-950/40 via-slate-900 to-slate-950 shadow-2xl space-y-4">
        {/* Row 1: Case Title, Emergency Badge & Live Case Status (Full Width - Zero Word Squishing) */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="p-2.5 rounded-xl bg-red-500/20 text-red-400 border border-red-500/40 animate-pulse shrink-0">
              <ShieldAlert className="h-6 w-6" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-lg sm:text-xl font-black text-white tracking-wide">
                  Guardian Trace: Multimodal Missing Persons Search HUD
                </h1>
                <Badge className="bg-red-600 text-white font-mono font-black text-[10px] px-2 py-0.5 animate-pulse shrink-0">
                  CRITICAL EMERGENCY (AGE &lt; 12)
                </Badge>
              </div>
              <p className="text-xs text-red-200/90 mt-1 flex items-center gap-2 flex-wrap">
                <span>Active Case: <strong className="text-white">Aanya Sharma (8)</strong></span>
                <span className="text-red-400/60">•</span>
                <span>Fused 12 sensor exhaust sightings across 18 hours</span>
                <span className="text-red-400/60">•</span>
                <span className="text-cyan-300 font-mono">PS Lajpat Nagar (NCT of Delhi)</span>
              </p>
            </div>
          </div>

          {/* Quick Case Summary Chip */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-red-950/60 border border-red-500/40 text-xs font-mono text-red-200 shrink-0 self-start lg:self-center">
            <span className="h-2 w-2 rounded-full bg-red-500 animate-ping" />
            <span>Search Window: 18h Elapsed</span>
            <span className="text-red-400 font-bold">• 10 km Search Radius</span>
          </div>
        </div>

        {/* Row 2: Tactical Action Control Ribbon (Graceful Wrap, Zero Clipping, Zero Overflow) */}
        <div className="pt-2.5 border-t border-red-500/20 flex items-center gap-2 flex-wrap">
          <Button
            size="sm"
            onClick={playTacticalAudioBrief}
            className={`h-9 text-xs font-bold flex items-center gap-1.5 transition-all ${
              isSpeakingBriefing
                ? 'bg-amber-600 hover:bg-amber-700 text-white animate-pulse'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
            }`}
            title="Hands-free synthetic audio tactical briefing for field units"
          >
            {isSpeakingBriefing ? <VolumeX className="h-3.5 w-3.5" /> : <Volume2 className="h-3.5 w-3.5" />}
            <span>{isSpeakingBriefing ? 'Stop Audio' : 'Voice Dispatch'}</span>
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={handleExportSARGeoJSON}
            className="h-9 text-xs font-bold border-cyan-500/40 text-cyan-300 hover:bg-cyan-950/30 flex items-center gap-1.5"
            title="Export search and rescue GeoJSON coordinates for handheld Garmin GPS & drones"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Export SAR GeoJSON</span>
          </Button>

          <Button
            size="sm"
            onClick={() => {
              sound.playClickSound();
              setRegisterModalOpen(true);
            }}
            className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-xs h-9 px-3 flex items-center gap-1.5 shadow-md"
            title="Register a new missing child or person docket"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Register Docket</span>
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              sound.playClickSound();
              setSatelliteModalOpen(true);
            }}
            className="h-9 text-xs font-bold border-cyan-500/40 text-cyan-300 hover:bg-cyan-950/30 flex items-center gap-1.5"
            title="Inspect OmniTrace Satellite Earth Observation Locus"
          >
            <Globe className="h-3.5 w-3.5 text-cyan-400" />
            <span>OmniTrace Satellite</span>
          </Button>

          <Button
            size="sm"
            onClick={() => {
              sound.playRadarPing();
              setDemoPlayerOpen(true);
            }}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs h-9 px-3.5 flex items-center gap-1.5 shadow-lg shadow-emerald-950/50"
            title="Launch interactive 90-second animated rescue presentation (Press P)"
          >
            <Play className="h-4 w-4 fill-current" />
            <span>▶ Play Live Demo</span>
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={toggleSearchRings}
            className={`h-9 text-xs font-bold flex items-center gap-1.5 transition-all ${
              searchRingsVisible
                ? 'border-amber-400 bg-amber-500/20 text-amber-300'
                : 'border-slate-700 bg-slate-800 text-slate-300'
            }`}
            title="Toggle Ring Search concentric police grid (1km, 3km, 10km) (Press T)"
          >
            <Layers className="h-3.5 w-3.5" />
            <span>Ring Search ({searchRingsVisible ? 'ON' : 'OFF'})</span>
          </Button>
        </div>
      </div>

      {/* Realistic Operational SAR Telemetry Ribbon (6 Live Sensors & Intelligence Feeds) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-2.5">
        {/* Sensor 1: Battery Decay Model */}
        <div className="p-3 rounded-xl border border-amber-500/40 bg-amber-950/20 text-xs font-mono space-y-1">
          <div className="flex items-center justify-between text-[10px] text-amber-400 font-bold">
            <span className="flex items-center gap-1"><Battery className="h-3.5 w-3.5" /> BATTERY DECAY</span>
            <span>14%</span>
          </div>
          <div className="text-[11px] font-bold text-slate-200 truncate">1h 40m Remaining</div>
          <div className="text-[9px] text-amber-200/70 truncate">Draw: 180mA • Cold Temp</div>
        </div>

        {/* Sensor 2: Day/Night Solar Illumination */}
        <div className="p-3 rounded-xl border border-indigo-500/40 bg-indigo-950/20 text-xs font-mono space-y-1">
          <div className="flex items-center justify-between text-[10px] text-indigo-400 font-bold">
            <span className="flex items-center gap-1"><Sun className="h-3.5 w-3.5" /> ILLUMINATION</span>
            <span>120 LUX</span>
          </div>
          <div className="text-[11px] font-bold text-slate-200 truncate">Civil Dusk: 18:14 IST</div>
          <div className="text-[9px] text-indigo-200/70 truncate">Night Combing Active</div>
        </div>

        {/* Sensor 3: Offline Vector MBTiles Sync */}
        <div className="p-3 rounded-xl border border-emerald-500/40 bg-emerald-950/20 text-xs font-mono space-y-1">
          <div className="flex items-center justify-between text-[10px] text-emerald-400 font-bold">
            <span className="flex items-center gap-1"><ShieldCheck className="h-3.5 w-3.5" /> OFFLINE CACHE</span>
            <span>142 MB</span>
          </div>
          <div className="text-[11px] font-bold text-slate-200 truncate">MBTiles Synced</div>
          <div className="text-[9px] text-emerald-200/70 truncate">Tunnel / Offline Ready</div>
        </div>

        {/* Sensor 4: CCTV Blind Spot Index */}
        <div className="p-3 rounded-xl border border-red-500/40 bg-red-950/20 text-xs font-mono space-y-1">
          <div className="flex items-center justify-between text-[10px] text-red-400 font-bold">
            <span className="flex items-center gap-1"><EyeOff className="h-3.5 w-3.5" /> BLIND SPOT RISK</span>
            <span>380m</span>
          </div>
          <div className="text-[11px] font-bold text-slate-200 truncate">Paharganj Lane 4</div>
          <div className="text-[9px] text-red-200/70 truncate">Zero Optical CCTV Cover</div>
        </div>

        {/* Sensor 5: Vehicle ANPR Intercept */}
        <div className="p-3 rounded-xl border border-sky-500/40 bg-sky-950/20 text-xs font-mono space-y-1">
          <div className="flex items-center justify-between text-[10px] text-sky-400 font-bold">
            <span className="flex items-center gap-1"><Car className="h-3.5 w-3.5" /> ANPR INTERCEPT</span>
            <span>BOLO ALERT</span>
          </div>
          <div className="text-[11px] font-bold text-slate-200 truncate">White Swift (DL-10)</div>
          <div className="text-[9px] text-sky-200/70 truncate">Spotted 12m ago at Gate 3</div>
        </div>

        {/* Sensor 6: Tri-State Inter-Agency Bridge */}
        <div className="p-3 rounded-xl border border-purple-500/40 bg-purple-950/20 text-xs font-mono space-y-1">
          <div className="flex items-center justify-between text-[10px] text-purple-400 font-bold">
            <span className="flex items-center gap-1"><RadioTower className="h-3.5 w-3.5" /> TRI-STATE BRIDGE</span>
            <span>NCR LIVE</span>
          </div>
          <div className="text-[11px] font-bold text-slate-200 truncate">Delhi ⇄ HR ⇄ UP STF</div>
          <div className="text-[9px] text-purple-200/70 truncate">Border Patrols Active</div>
        </div>
      </div>

      {/* Main Split-Screen HUD: 60% Left (Map + Timeline) | 40% Right (Intel Panel) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* LEFT 60% (7 Cols): MapLibre Map Canvas + Timeline Scrubber */}
        <div className="lg:col-span-7 space-y-3">
          <Card className="border border-border/80 bg-slate-950 shadow-2xl overflow-hidden relative">
            <div className="p-3 bg-slate-900 border-b border-border/80 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 font-mono">
                <MapPin className="h-4 w-4 text-cyan-400" />
                <span className="font-bold text-white">OpenStreetMap Sovereign Tactical Feed</span>
                <span className="text-[10px] text-slate-400">Delhi-NCR Corridor</span>
              </div>

              <div className="flex items-center gap-2 text-[10px] font-mono">
                <span className="flex items-center gap-1 text-red-400 font-bold">
                  <span className="h-2 w-2 rounded-full bg-red-500 animate-ping" />
                  Origin: Lajpat Nagar
                </span>
                <span className="text-slate-600">|</span>
                <span className="flex items-center gap-1 text-emerald-400 font-bold">
                  <span className="h-2 w-2 rounded-full bg-emerald-500" />
                  NDLS Prediction (87%)
                </span>
              </div>
            </div>

            {/* Map Container (Compact Tactical Height) */}
            <div className="h-[380px] sm:h-[420px] lg:h-[450px] w-full relative">
              <div ref={mapContainerRef} className="w-full h-full tactical-dark-map" />

              {/* Map Overlay Legend */}
              <div className="absolute top-3 left-3 z-10 p-2.5 rounded-xl bg-slate-950/90 border border-slate-700/80 text-[10px] space-y-1 font-mono text-slate-300 shadow-2xl backdrop-blur-md">
                <div className="font-bold text-white uppercase text-[9px] border-b border-slate-700 pb-1">
                  Guardian Trace Geospatial Legend
                </div>
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-red-600 inline-block animate-ping" />
                  <span>Red: Last Seen / Origin Metro Exit</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-amber-400 inline-block" />
                  <span>Yellow: 12 Sensor Sightings (IMEI, WiFi, UPI)</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-4 h-0.5 bg-cyan-400 inline-block" />
                  <span>Cyan Dashed: Fused Movement Trajectory</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-emerald-400 inline-block animate-pulse" />
                  <span>Green: Top-3 AI Predicted Locations</span>
                </div>
              </div>

              {/* Map Floating Dispatch Quick Status */}
              <div className="absolute bottom-3 right-3 z-10 p-2 rounded-lg bg-emerald-950/80 border border-emerald-500/50 text-[11px] font-mono text-emerald-300 shadow-xl backdrop-blur-md flex items-center gap-2">
                <Navigation className="h-3.5 w-3.5 text-emerald-400 animate-spin-slow" />
                <span>PCR Intercept Vector Locked: ~4 mins ETA</span>
              </div>
            </div>

            {/* Bottom Horizontal Timeline Slider */}
            <div className="p-3 bg-slate-900 border-t border-border/80 space-y-2">
              <div className="flex items-center justify-between text-xs font-mono">
                <div className="flex items-center gap-2 text-slate-300 font-bold">
                  <Clock className="h-4 w-4 text-primary" />
                  <span>Incident Timeline: {timelineHour} Hours Elapsed</span>
                  <span className="text-[10px] text-muted-foreground font-normal">
                    (Showing sightings up to hour {timelineHour})
                  </span>
                </div>

                <div className="flex items-center gap-1.5">
                  <Button
                    size="sm"
                    variant="outline"
                    aria-label="Auto-play timeline"
                    onClick={() => {
                      sound.playClickSound();
                      setIsPlayingTimeline(!isPlayingTimeline);
                    }}
                    className="h-7 text-[10px] font-bold px-2.5"
                  >
                    {isPlayingTimeline ? 'Pause' : 'Play Timeline'}
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      sound.playClickSound();
                      setTimelineHour(0);
                    }}
                    className="h-7 text-[10px] px-2 text-slate-400 hover:text-white"
                  >
                    <RotateCcw className="h-3 w-3" />
                  </Button>
                </div>
              </div>

              <input
                type="range"
                min="0"
                max="18"
                step="1"
                aria-label="Investigation Timeline Scrubber"
                value={timelineHour}
                onChange={(e) => {
                  setTimelineHour(parseInt(e.target.value, 10));
                }}
                className="w-full accent-primary h-2 bg-slate-800 rounded-lg cursor-pointer"
              />

              <div className="flex justify-between text-[10px] font-mono text-slate-400 pt-0.5">
                <span>0h: Metro Exit (3:30 PM)</span>
                <span>6h: CP WiFi & UPI</span>
                <span>12h: Paharganj BLE</span>
                <span>18h: NDLS Intercept (9:30 AM)</span>
              </div>
            </div>
          </Card>
        </div>

        {/* RIGHT 40% (5 Cols): Intel Panel, Predictions & Sighting Feed */}
        <div className="lg:col-span-5 space-y-3">
          {/* Missing Person Profile Header Card */}
          <Card className="border border-border/80 bg-card shadow-xl overflow-hidden">
            <CardContent className="p-4 space-y-3">
              <div className="flex items-start gap-3.5">
                <img
                  src={caseData.photo_url || 'https://images.unsplash.com/photo-1543332164-6e82f355badc?w=400'}
                  alt={caseData.person_name}
                  className="w-20 h-20 rounded-xl object-cover border-2 border-red-500 shadow-md shrink-0"
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-1">
                    <span className="font-mono text-xs font-bold text-primary">{caseData.case_number}</span>
                    <Badge className="bg-red-600 text-white font-extrabold text-[9px] px-1.5 py-0.2">
                      {caseData.priority}
                    </Badge>
                  </div>
                  <h3 className="text-base font-black text-foreground truncate mt-0.5">
                    {caseData.person_name} ({caseData.age} Years, {caseData.gender})
                  </h3>
                  <p className="text-[11px] text-muted-foreground line-clamp-2 mt-0.5">
                    {caseData.description}
                  </p>
                  <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                    <div className="text-[10px] text-red-400 font-mono flex items-center gap-1 bg-red-950/30 px-2 py-0.5 rounded border border-red-500/30">
                      <HeartPulse className="h-3 w-3 text-red-400 animate-pulse" />
                      <span>Medical Risk:</span>
                      <span className="font-bold text-red-200">Asthma Inhaler (5h 50m window)</span>
                    </div>
                    <div className="text-[10px] text-emerald-400 font-mono flex items-center gap-1 bg-emerald-950/30 px-2 py-0.5 rounded border border-emerald-500/30">
                      <Sparkles className="h-3 w-3 text-emerald-400" />
                      <span>Face Match:</span>
                      <span className="font-bold text-emerald-200">89.4% (CAM-METRO-04)</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* 4 Live Metric Pills */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-border/60 text-center font-mono">
                <div className="p-2 rounded-lg bg-background/60 border border-border/60">
                  <span className="text-[9px] uppercase text-muted-foreground block">Last Seen</span>
                  <span className="text-xs font-bold text-white">18 Hours Ago</span>
                </div>
                <div className="p-2 rounded-lg bg-background/60 border border-border/60">
                  <span className="text-[9px] uppercase text-muted-foreground block">Sightings</span>
                  <span className="text-xs font-bold text-cyan-400">12 Multimodal</span>
                </div>
                <div className="p-2 rounded-lg bg-background/60 border border-border/60">
                  <span className="text-[9px] uppercase text-muted-foreground block">Radius</span>
                  <span className="text-xs font-bold text-amber-400">10 km Ring</span>
                </div>
                <div className="p-2 rounded-lg bg-background/60 border border-border/60">
                  <span className="text-[9px] uppercase text-muted-foreground block">Station</span>
                  <span className="text-[11px] font-bold text-emerald-400 truncate block">PS Lajpat Nagar</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Top-3 Predicted Next Locations */}
          <Card className="border border-emerald-500/40 bg-gradient-to-br from-card via-card to-emerald-950/20 shadow-xl">
            <CardHeader className="pb-2 pt-3 px-4 flex flex-row items-center justify-between border-b border-border/60">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-emerald-400" />
                <CardTitle className="text-xs font-black uppercase tracking-wider text-emerald-300">
                  AI Next-Location Predictions (Top 3)
                </CardTitle>
              </div>
              <span className="text-[10px] font-mono text-muted-foreground">Markov &amp; Transit Vector</span>
            </CardHeader>
            <CardContent className="p-3 space-y-2">
              {predictions.map((p, idx) => (
                <div
                  key={idx}
                  onClick={() => {
                    sound.playRadarPing();
                    if (mapRef.current) {
                      mapRef.current.flyTo({ center: [p.predicted_lon, p.predicted_lat], zoom: 14.5, duration: 800 });
                    }
                  }}
                  className="p-3 rounded-xl border border-border/80 bg-background/80 hover:border-emerald-500/80 hover:bg-emerald-950/20 cursor-pointer transition-all space-y-1.5"
                  title="Click to zoom map to this predicted destination"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="h-5 w-5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 font-mono text-[10px] font-bold flex items-center justify-center shrink-0">
                        #{idx + 1}
                      </span>
                      <h4 className="text-xs font-bold text-foreground leading-snug">
                        {p.name}
                      </h4>
                    </div>
                    <Badge className="bg-emerald-600 text-white font-mono font-black text-[10px] shrink-0">
                      {(p.confidence * 100).toFixed(0)}% Match
                    </Badge>
                  </div>

                  <p className="text-[11px] text-muted-foreground leading-relaxed pl-7">
                    {p.reasoning?.summary || 'Transit vector and cellular tower handover convergence.'}
                  </p>

                  <div className="flex items-center justify-between pt-1 pl-7 text-[10px] font-mono">
                    <span className="text-slate-400">
                      [{p.predicted_lat.toFixed(4)}°N, {p.predicted_lon.toFixed(4)}°E]
                    </span>
                    <Button
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDispatchPCR(p);
                      }}
                      className="h-6 text-[10px] bg-red-600 hover:bg-red-700 text-white font-bold px-2 flex items-center gap-1 shadow-sm"
                    >
                      <Navigation className="h-2.5 w-2.5" />
                      <span>Dispatch PCR</span>
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Sighting Feed with Multimodal Sensor Signal Filter Pills */}
          <Card className="border border-border/80 bg-card shadow-xl">
            <CardHeader className="pb-2 pt-3 px-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border/60">
              <div className="flex items-center gap-2">
                <Radio className="h-4 w-4 text-cyan-400" />
                <CardTitle className="text-xs font-bold uppercase tracking-wider text-foreground">
                  Multimodal Sighting &amp; Digital Exhaust Stream ({filteredSightings.length}/{sightings.length} Events)
                </CardTitle>
              </div>
              <span className="text-[10px] font-mono text-emerald-400 font-bold">100% WORM Verified</span>
            </CardHeader>
            <CardContent className="p-3 space-y-2.5">
              {/* Sensor Filter Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-[10px] font-mono">
                {[
                  { id: 'ALL', label: 'All Signals', count: sightings.length },
                  { id: 'IMEI_PING', label: 'IMEI Ping', count: sightings.filter(s => s.source === 'IMEI_PING').length },
                  { id: 'METRO_CARD', label: 'Metro AFC', count: sightings.filter(s => s.source === 'METRO_CARD').length },
                  { id: 'CCTV', label: 'CCTV Optical', count: sightings.filter(s => s.source === 'CCTV').length },
                  { id: 'WIFI_PROBE', label: 'WiFi Probe', count: sightings.filter(s => s.source === 'WIFI_PROBE').length },
                  { id: 'UPI', label: 'UPI / POS', count: sightings.filter(s => s.source === 'UPI').length },
                  { id: 'BLUETOOTH', label: 'BLE Beacon', count: sightings.filter(s => s.source === 'BLUETOOTH').length },
                  { id: 'TRANSIT', label: 'Bus Transit', count: sightings.filter(s => s.source === 'TRANSIT').length },
                  { id: 'CITIZEN', label: 'Citizen Tip', count: sightings.filter(s => s.source === 'CITIZEN').length },
                ].map((flt) => (
                  <button
                    key={flt.id}
                    onClick={() => {
                      sound.playClickSound();
                      setSelectedSignalSource(flt.id);
                    }}
                    className={`px-2 py-0.5 rounded-full border transition-colors shrink-0 whitespace-nowrap flex items-center gap-1 ${
                      selectedSignalSource === flt.id
                        ? 'bg-primary text-primary-foreground border-primary font-bold'
                        : 'bg-background/80 text-muted-foreground border-border/60 hover:text-foreground'
                    }`}
                  >
                    <span>{flt.label}</span>
                    <span className="opacity-70 text-[9px]">({flt.count})</span>
                  </button>
                ))}
              </div>

              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {filteredSightings.map((s, idx) => (
                  <div
                    key={idx}
                    onClick={() => {
                      sound.playRadarPing();
                      if (mapRef.current) {
                        mapRef.current.flyTo({ center: [s.lon, s.lat], zoom: 15, duration: 800 });
                      }
                    }}
                    className="p-2 rounded-lg border border-border/60 bg-background/50 hover:border-cyan-500/70 hover:bg-cyan-950/20 cursor-pointer transition-all text-xs flex items-center justify-between gap-2"
                    title={`Click to focus map on sensor event #${idx + 1}`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="font-mono text-[10px] font-bold text-primary shrink-0">
                        #{String(idx + 1).padStart(2, '0')}
                      </span>
                      <div className="truncate">
                        <span className="font-bold text-foreground text-[11px] block truncate">
                          {s.source} — {s.note || 'Sensor Ping'}
                        </span>
                        <span className="text-[10px] text-muted-foreground font-mono">{s.time}</span>
                      </div>
                    </div>
                    <Badge variant="outline" className="text-[9px] font-mono shrink-0">
                      {(s.confidence * 100).toFixed(0)}%
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Ground Search & Rescue Squads Live Grid */}
          <Card className="border border-border/80 bg-card shadow-xl">
            <CardHeader className="pb-2 pt-3 px-4 flex flex-row items-center justify-between border-b border-border/60">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-primary" />
                <CardTitle className="text-xs font-bold uppercase tracking-wider text-foreground">
                  SAR Ground Squads Live Roster (3 Units)
                </CardTitle>
              </div>
              <span className="text-[10px] font-mono text-muted-foreground">Tactical Net VHF</span>
            </CardHeader>
            <CardContent className="p-3 space-y-2">
              {rescueSquads.map((sq) => (
                <div
                  key={sq.id}
                  className="p-2.5 rounded-xl border border-border/70 bg-background/60 flex items-center justify-between gap-2 text-xs"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-foreground truncate">{sq.name}</span>
                      <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950/40 px-1.5 py-0.2 rounded border border-cyan-500/30">
                        {sq.freq}
                      </span>
                    </div>
                    <div className="text-[10px] text-muted-foreground mt-0.5 truncate">
                      {sq.sector} • Lead: {sq.leader} ({sq.personnel} Officers)
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      sound.playClickSound();
                      setRescueSquads((prev) =>
                        prev.map((item) =>
                          item.id === sq.id
                            ? {
                                ...item,
                                status:
                                  item.status === 'SEARCHING'
                                    ? 'EN_ROUTE'
                                    : item.status === 'EN_ROUTE'
                                    ? 'STAGING'
                                    : 'SEARCHING',
                              }
                            : item
                        )
                      );
                      toast.info(`${sq.name} status updated.`, 'Squad Roster Updated');
                    }}
                    className={`text-[10px] font-mono font-bold px-2.5 py-1 rounded-lg border transition-colors shrink-0 ${
                      sq.status === 'SEARCHING'
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                        : sq.status === 'EN_ROUTE'
                        ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                        : 'bg-slate-800 text-slate-300 border-slate-700'
                    }`}
                  >
                    {sq.status}
                  </button>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Transit Intercept Chokepoints Grid */}
          <Card className="border border-border/80 bg-card shadow-xl">
            <CardHeader className="pb-2 pt-3 px-4 flex flex-row items-center justify-between border-b border-border/60">
              <div className="flex items-center gap-2">
                <Bus className="h-4 w-4 text-amber-400" />
                <CardTitle className="text-xs font-bold uppercase tracking-wider text-foreground">
                  Transit Intercept Chokepoints (4 Portals)
                </CardTitle>
              </div>
              <span className="text-[10px] font-mono text-amber-400 font-bold">Containment Grid</span>
            </CardHeader>
            <CardContent className="p-3 space-y-2">
              {chokepoints.map((ck) => (
                <div
                  key={ck.id}
                  className="p-2 rounded-lg border border-border/60 bg-background/50 flex items-center justify-between gap-2 text-xs"
                >
                  <div className="min-w-0">
                    <span className="font-bold text-foreground text-[11px] block truncate">{ck.name}</span>
                    <span className="text-[10px] text-muted-foreground">{ck.type} • {ck.officers} Picket Officers</span>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      sound.playAlertBeep();
                      setChokepoints(prev => prev.map(c => c.id === ck.id ? { ...c, status: c.status === 'PICKET_ACTIVE' ? 'SECTOR_SEALED' : 'PICKET_ACTIVE' } : c));
                      toast.warning(`Chokepoint ${ck.name} status toggled. Sector containment alerted.`, 'Picket Alert');
                    }}
                    className={`h-6 text-[9px] font-mono font-bold px-2 ${
                      ck.status === 'PICKET_ACTIVE'
                        ? 'border-emerald-500/40 text-emerald-300 bg-emerald-950/20'
                        : 'border-red-500/40 text-red-300 bg-red-950/20'
                    }`}
                  >
                    {ck.status}
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* 4 Core Operational Action Buttons */}
          <div className="grid grid-cols-2 gap-2">
            <Button
              onClick={() => {
                sound.playAlertBeep();
                setBroadcastModalOpen(true);
              }}
              className="bg-amber-600 hover:bg-amber-700 text-white font-extrabold text-xs h-10 flex items-center justify-center gap-1.5 shadow-md shadow-amber-950/40"
              title="Broadcast community emergency alert to nearby Citizen Sentinel users (Press B)"
            >
              <Radio className="h-4 w-4 animate-ping" />
              <span>🚨 Broadcast Alert</span>
            </Button>

            <Button
              onClick={() => handleDispatchPCR(predictions[0])}
              className="bg-red-600 hover:bg-red-700 text-white font-extrabold text-xs h-10 flex items-center justify-center gap-1.5 shadow-md shadow-red-950/40"
              title="Dispatch nearest patrol PCR unit to top prediction"
            >
              <Navigation className="h-4 w-4" />
              <span>👮 Dispatch PCR</span>
            </Button>

            <Button
              variant="outline"
              onClick={() => {
                sound.playSuccessChime();
                setDossierModalOpen(true);
              }}
              className="text-xs h-10 font-bold border-cyan-500/40 text-cyan-300 hover:bg-cyan-950/30 flex items-center justify-center gap-1.5"
              title="Generate court-ready Section 63 BSA search and rescue dossier"
            >
              <FileText className="h-4 w-4 text-cyan-400" />
              <span>📄 Search Dossier</span>
            </Button>

            <Button
              variant="outline"
              onClick={() => {
                sound.playClickSound();
                setFoundModalOpen(true);
              }}
              className="text-xs h-10 font-bold border-emerald-500/40 text-emerald-300 hover:bg-emerald-950/30 flex items-center justify-center gap-1.5"
              title="Mark missing person case as found with officer verification"
            >
              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
              <span>✅ Mark as Found</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Broadcast Community Alert Modal */}
      <Modal
        isOpen={broadcastModalOpen}
        onClose={() => setBroadcastModalOpen(false)}
        title="Trigger Emergency Community Broadcast Alert"
      >
        <div className="space-y-4 text-xs font-sans text-slate-200">
          <div className="p-3.5 rounded-xl bg-amber-950/40 border border-amber-500/40 text-amber-200 space-y-1">
            <div className="font-bold text-amber-300 flex items-center gap-1.5">
              <AlertTriangle className="h-4 w-4 text-amber-400" />
              <span>Broadcast Confirmation (DPDP Emergency Exemption Sec 17(b))</span>
            </div>
            <p className="text-[11px] text-amber-100/90 leading-relaxed">
              Transmitting this emergency broadcast sends a high-priority push notification to all Citizen Sentinel users and local PCR units within a 5 km radius of the last verified sighting.
            </p>
          </div>

          <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 space-y-2 font-mono text-[11px]">
            <div>Target: <b>Aanya Sharma (8), Blue School Uniform</b></div>
            <div>Estimated Citizen Reach: <b>~14,200 Registered Users</b></div>
            <div>Active PCR Patrols in Grid: <b>8 Vehicles Alerted</b></div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
            <Button size="sm" variant="ghost" onClick={() => setBroadcastModalOpen(false)}>
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={() => {
                sound.playSuccessChime();
                setBroadcastModalOpen(false);
                toast.success('Broadcast transmitted successfully across 14,200 citizen devices.', 'Alert Broadcasted');
              }}
              className="bg-amber-600 hover:bg-amber-700 text-white font-bold"
            >
              Confirm &amp; Broadcast Alert
            </Button>
          </div>
        </div>
      </Modal>

      {/* Mark As Found Modal */}
      <Modal
        isOpen={foundModalOpen}
        onClose={() => setFoundModalOpen(false)}
        title="Verify & Close Missing Person Case"
      >
        <div className="space-y-4 text-xs font-sans text-slate-200">
          <div className="p-3.5 rounded-xl bg-emerald-950/40 border border-emerald-500/40 text-emerald-200 space-y-1">
            <div className="font-bold text-emerald-300 flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
              <span>Statutory Recovery Verification (Sec 173 BNSS)</span>
            </div>
            <p className="text-[11px] text-emerald-100/90 leading-relaxed">
              Confirming this resolution marks the case as FOUND and safely updates the national TrackChild and CCTNS repositories.
            </p>
          </div>

          <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 space-y-1.5 font-mono text-[11px]">
            <div>Recovered Subject: <b>Aanya Sharma (8)</b></div>
            <div>Location: <b>New Delhi Railway Station Concourse</b></div>
            <div>Verifying Officer: <b>Inspector Rajesh Varma (DL-POL-IO-8812)</b></div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
            <Button size="sm" variant="ghost" onClick={() => setFoundModalOpen(false)}>
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={() => {
                sound.playSuccessChime();
                setCaseData((prev: any) => ({ ...prev, status: 'FOUND' }));
                setFoundModalOpen(false);
                toast.success('Case MP-2026-DEMO-001 marked as FOUND. Child united with parents.', 'Case Resolved');
              }}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
            >
              Confirm Recovery &amp; Close Case
            </Button>
          </div>
        </div>
      </Modal>

      {/* Register New Missing Person Docket Modal */}
      <Modal
        isOpen={registerModalOpen}
        onClose={() => setRegisterModalOpen(false)}
        title="Register New Missing Person Docket (Guardian Trace)"
      >
        <form onSubmit={handleRegisterNewCase} className="space-y-3.5 text-xs font-sans text-slate-200">
          <div className="p-3 rounded-xl bg-primary/10 border border-primary/30 text-primary-200 space-y-1">
            <div className="font-bold text-white flex items-center gap-1.5">
              <Plus className="h-4 w-4 text-primary" />
              <span>Statutory Missing Person Entry (Section 173 BNSS)</span>
            </div>
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              Registers immediate high-priority missing child/person docket. Automatically triggers cellular IMEI tracing and AI trajectory prediction across police grid.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-bold text-slate-300 block mb-1">Subject Full Name *</label>
              <input
                type="text"
                required
                value={newCaseForm.person_name}
                onChange={(e) => setNewCaseForm({ ...newCaseForm, person_name: e.target.value })}
                placeholder="e.g. Rahul Verma"
                className="w-full h-8 px-2.5 rounded-lg border border-border bg-slate-900 text-xs text-white focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[11px] font-bold text-slate-300 block mb-1">Age *</label>
                <input
                  type="number"
                  required
                  min="1"
                  max="120"
                  value={newCaseForm.age}
                  onChange={(e) => setNewCaseForm({ ...newCaseForm, age: e.target.value })}
                  placeholder="e.g. 11"
                  className="w-full h-8 px-2.5 rounded-lg border border-border bg-slate-900 text-xs text-white focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-300 block mb-1">Gender</label>
                <select
                  value={newCaseForm.gender}
                  onChange={(e) => setNewCaseForm({ ...newCaseForm, gender: e.target.value })}
                  className="w-full h-8 px-2 rounded-lg border border-border bg-slate-900 text-xs text-white focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  <option value="Female">Female</option>
                  <option value="Male">Male</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-bold text-slate-300 block mb-1">Last Seen Location</label>
              <input
                type="text"
                value={newCaseForm.last_seen_location}
                onChange={(e) => setNewCaseForm({ ...newCaseForm, last_seen_location: e.target.value })}
                placeholder="e.g. Rajiv Chowk Gate 2"
                className="w-full h-8 px-2.5 rounded-lg border border-border bg-slate-900 text-xs text-white focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-300 block mb-1">Mobile / IMEI (For Signal Ping)</label>
              <input
                type="text"
                value={newCaseForm.imei}
                onChange={(e) => setNewCaseForm({ ...newCaseForm, imei: e.target.value })}
                placeholder="e.g. 356789012349999"
                className="w-full h-8 px-2.5 rounded-lg border border-border bg-slate-900 text-xs text-white focus:outline-none focus:ring-1 focus:ring-primary font-mono"
              />
            </div>
          </div>

          <div>
            <label className="text-[11px] font-bold text-slate-300 block mb-1">Physical Clothing &amp; Identification Marks</label>
            <textarea
              rows={2}
              value={newCaseForm.description}
              onChange={(e) => setNewCaseForm({ ...newCaseForm, description: e.target.value })}
              placeholder="e.g. Yellow t-shirt, blue denim jeans, black watch, scar on left eyebrow..."
              className="w-full p-2 rounded-lg border border-border bg-slate-900 text-xs text-white focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
            <Button size="sm" variant="ghost" type="button" onClick={() => setRegisterModalOpen(false)}>
              Cancel
            </Button>
            <Button size="sm" type="submit" className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold">
              Register Docket &amp; Launch Trace
            </Button>
          </div>
        </form>
      </Modal>

      {/* Forensic Search Dossier Modal */}
      <DocumentPreviewModal
        isOpen={dossierModalOpen}
        onClose={() => setDossierModalOpen(false)}
        title="Guardian Trace: Missing Child Forensic Search Dossier"
        subtitle="Case MP-2026-DEMO-001 • Aanya Sharma (8) • Section 63 BSA Certified"
        caseNumber="MP-2026-DEMO-001"
        pdfUrl="/CRIMENEXUS_Police_Department_Deployment_Dossier.pdf"
        fileName="Guardian_Trace_Rescue_Dossier_MP-2026-DEMO-001.pdf"
        metadata={{
          ioName: 'Inspector Rajesh Varma (Missing Persons Unit)',
          policeStation: 'PS Lajpat Nagar • Crime Branch NCT of Delhi',
          suspectName: 'Subject: Aanya Sharma (Missing Child)',
          crimeType: 'Missing Person Section 173 BNSS / POCSO Emergency',
          hash: '8f2d4e7a2b91c0e3957fba3082e5b871c4d9201a4e5f76b90831ce829140aef5',
        }}
      />

      {/* Interactive 90-Second Demo Player Overlay */}
      <DemoPlayer
        isOpen={demoPlayerOpen}
        onClose={() => setDemoPlayerOpen(false)}
        onStepChange={(step) => {
          if (mapRef.current) {
            mapRef.current.flyTo({
              center: step.coords,
              zoom: 13.5,
              duration: 800,
            });
          }
        }}
      />
      {/* OmniTrace Satellite Verification Modal */}
      <OmniTraceSatelliteModal
        isOpen={satelliteModalOpen}
        onClose={() => setSatelliteModalOpen(false)}
        latitude={caseData.last_seen_lat}
        longitude={caseData.last_seen_lon}
        locationName={caseData.last_seen_location}
        reportNumber={caseData.case_number}
      />
    </div>
  );
}
