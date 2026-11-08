import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import * as maplibregl from 'maplibre-gl';
import {
  Terminal,
  Shield,
  FileCheck2,
  MapPin,
  Navigation,
  Radio,
  Activity,
  Zap,
  CheckCircle2,
  AlertTriangle,
  Download,
  Printer,
  RotateCcw,
  Cpu,
  Wifi,
  ShoppingBag,
  Smartphone,
  Cloud,
  CreditCard,
  Lock,
  Eye,
  Car,
  Play,
  Layers,
  Sparkles,
  ExternalLink,
  Search,
  X,
  Volume2
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Modal } from '../../components/ui/Modal';
import { DocumentPreviewModal } from '../../components/common/DocumentPreviewModal';
import { sound } from '../../utils/soundEffects';
import { useToast } from '../../components/ui/Toast';

// 100% Free OpenStreetMap Raster Basemap
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
    },
  ],
};

interface OmniTraceDossier {
  status: string;
  suspect_id: string;
  suspect_name: string;
  timestamp: string;
  confidence_score: number;
  fused_location: string;
  fused_coordinates: {
    latitude: number;
    longitude: number;
    accuracy_radius_meters: number;
  };
  summary_verdict: string;
  spatial_markers: {
    safehouse: { latitude: number; longitude: number; label: string; pin_type: string };
    zomato_delivery: { latitude: number; longitude: number; label: string; pin_type: string };
    amazon_drop: { latitude: number; longitude: number; label: string; pin_type: string };
    wifi_probe_radius: { latitude: number; longitude: number; radius_meters: number; label: string };
    smart_meter_anomaly: { latitude: number; longitude: number; spike_percentage: number; label: string };
    uber_route: {
      origin: string;
      destination: string;
      coordinates: number[][];
      vehicle: string;
      fare: string;
    };
  };
  categories: {
    telecom_isp: any;
    ecommerce_logistics: any;
    social_cloud: any;
    iot_smart_home: any;
    financial_alternative: any;
  };
  section_63_bsa_warrant: {
    warrant_number: string;
    issuing_court: string;
    governing_statute: string;
    digital_certificate_section: string;
    certifying_authority: string;
    sha256_hash: string;
    custody_remand_clock_hours: number;
    authorized_officer: string;
    recommended_action: string;
  };
}

interface TerminalLog {
  id: string;
  timestamp: string;
  category: 'TELECOM' | 'ECOMMERCE' | 'SOCIAL' | 'IOT' | 'FINANCE' | 'SYSTEM';
  source: string;
  message: string;
  highlight?: boolean;
}

export function DigitalFootprintPage() {
  const toast = useToast();
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const markersRef = useRef<maplibregl.Marker[]>([]);
  const terminalEndRef = useRef<HTMLDivElement | null>(null);

  const [dossier, setDossier] = useState<OmniTraceDossier | null>(null);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [isCompleted, setIsCompleted] = useState<boolean>(false);
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [confidenceDisplay, setConfidenceDisplay] = useState<number>(0);

  // Fusion Panel Live States
  const [telecomStatus, setTelecomStatus] = useState<string>('Standby (Awaiting Ingestion)');
  const [ecomStatus, setEcomStatus] = useState<string>('Standby');
  const [iotStatus, setIotStatus] = useState<string>('Standby');
  const [socialStatus, setSocialStatus] = useState<string>('Standby');
  const [financeStatus, setFinanceStatus] = useState<string>('Standby');
  const [finalVerdict, setFinalVerdict] = useState<string | null>(null);

  // Terminal Logs State
  const [logs, setLogs] = useState<TerminalLog[]>([]);
  const [terminalSearch, setTerminalSearch] = useState<string>('');
  const [autoScroll, setAutoScroll] = useState<boolean>(true);

  // Warrant Modal State
  const [warrantModalOpen, setWarrantModalOpen] = useState<boolean>(false);
  const [remandSeconds, setRemandSeconds] = useState<number>(24 * 3600);
  const [previewDossierOpen, setPreviewDossierOpen] = useState<boolean>(false);

  // Remand Countdown Timer
  useEffect(() => {
    if (!isCompleted) return;
    const interval = setInterval(() => {
      setRemandSeconds((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, [isCompleted]);

  // Fetch initial dossier payload from backend
  useEffect(() => {
    const fetchDossier = async () => {
      try {
        const baseURL = import.meta.env.VITE_API_BASE_URL || '/api/v1';
        const res = await axios.get(`${baseURL}/escape-demo/omni-trace/rajan`);
        if (res.data && res.data.status === 'success') {
          setDossier(res.data);
        }
      } catch (err) {
        console.warn('Using built-in fallback omni-trace dossier:', err);
      }
    };
    fetchDossier();
  }, []);

  // Initialize MapLibre GL Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    const map = new maplibregl.Map({
      container: mapContainerRef.current,
      style: MAP_STYLE,
      center: [77.2800, 28.6350], // Midpoint between Karol Bagh and Sector 62
      zoom: 11.2,
      pitch: 0,
      bearing: 0,
    });

    map.on('load', () => {
      // Add empty route source
      map.addSource('uber-route', {
        type: 'geojson',
        data: {
          type: 'Feature',
          properties: {},
          geometry: { type: 'LineString', coordinates: [] },
        },
      });

      // Neon Cyan Outer Glow
      map.addLayer({
        id: 'uber-route-glow',
        type: 'line',
        source: 'uber-route',
        layout: { 'line-join': 'round', 'line-cap': 'round' },
        paint: {
          'line-color': '#06b6d4',
          'line-width': 10,
          'line-opacity': 0.45,
        },
      });

      // Solid Dark Casing
      map.addLayer({
        id: 'uber-route-casing',
        type: 'line',
        source: 'uber-route',
        layout: { 'line-join': 'round', 'line-cap': 'round' },
        paint: {
          'line-color': '#0f172a',
          'line-width': 6,
          'line-opacity': 0.95,
        },
      });

      // Vibrant Green Dashed Core
      map.addLayer({
        id: 'uber-route-core',
        type: 'line',
        source: 'uber-route',
        layout: { 'line-join': 'round', 'line-cap': 'round' },
        paint: {
          'line-color': '#10b981',
          'line-width': 3.5,
          'line-dasharray': [3, 2],
        },
      });

      // WiFi Probe Radius Circle Source
      map.addSource('wifi-probe-circle', {
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features: [],
        },
      });

      map.addLayer({
        id: 'wifi-probe-fill',
        type: 'circle',
        source: 'wifi-probe-circle',
        paint: {
          'circle-radius': ['interpolate', ['linear'], ['zoom'], 10, 15, 14, 45, 16, 75],
          'circle-color': '#3b82f6',
          'circle-opacity': 0.25,
          'circle-stroke-width': 2.5,
          'circle-stroke-color': '#60a5fa',
          'circle-stroke-opacity': 0.85,
        },
      });
    });

    mapRef.current = map;

    return () => {
      markersRef.current.forEach((m) => m.remove());
      markersRef.current = [];
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Auto-scroll terminal
  useEffect(() => {
    if (autoScroll && terminalEndRef.current) {
      terminalEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs, autoScroll]);

  const addLog = (category: TerminalLog['category'], source: string, message: string, highlight: boolean = false) => {
    const newLog: TerminalLog = {
      id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      timestamp: new Date().toTimeString().split(' ')[0],
      category,
      source,
      message,
      highlight,
    };
    setLogs((prev) => [...prev, newLog]);
  };

  // Run the 5-Stage Omni-Trace Fusion Simulation
  const handleRunOmniTrace = async () => {
    if (isRunning) return;
    sound.playRadarPing();
    setIsRunning(true);
    setIsCompleted(false);
    setCurrentStep(1);
    setConfidenceDisplay(15.2);
    setLogs([]);
    setFinalVerdict(null);

    // Clear existing markers
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    // Reset Map Sources
    if (mapRef.current && mapRef.current.isStyleLoaded()) {
      const routeSrc = mapRef.current.getSource('uber-route') as maplibregl.GeoJSONSource | undefined;
      if (routeSrc) {
        routeSrc.setData({
          type: 'Feature',
          properties: {},
          geometry: { type: 'LineString', coordinates: [] },
        });
      }
      const wifiSrc = mapRef.current.getSource('wifi-probe-circle') as maplibregl.GeoJSONSource | undefined;
      if (wifiSrc) {
        wifiSrc.setData({ type: 'FeatureCollection', features: [] });
      }
      mapRef.current.flyTo({ center: [77.2800, 28.6350], zoom: 11.2, duration: 800 });
    }

    addLog('SYSTEM', 'KERNEL_INIT', 'Initializing Omni-Trace Correlation Pipeline across 96 data feeds...', true);

    // ==========================================
    // STAGE 1: TELECOM & RF (0 - 1.8s)
    // ==========================================
    setTimeout(() => {
      sound.playAlertBeep();
      setCurrentStep(1);
      setConfidenceDisplay(38.4);
      setTelecomStatus('Telecom: IMEI 358912093847291 tracked on Sector 62 Mast #04');

      addLog('TELECOM', 'CDOT_CMS', 'IMSI Swap detected: Discarded primary SIM. Burner SIM active.');
      addLog('TELECOM', 'HARDWARE_LOCK', 'Static IMEI 358912093847291 locked to Sector 62 cell mast (TA=340m)', true);
      addLog('TELECOM', 'BLE_SNIFFER', 'Smart Pole #09 captured Bluetooth MAC BC:D0:74:12:9A:FF ("Rajan_Buds_Pro")');
      addLog('TELECOM', 'ISP_DPI', 'ACT Fibernet IP 122.161.44.89 resolved api.binance.com and check.torproject.org');

      // Drop Bluetooth / Tower Marker
      if (mapRef.current) {
        const el = document.createElement('div');
        el.className = 'marker-telecom';
        el.innerHTML = `
          <div style="display: flex; flex-direction: column; align-items: center; filter: drop-shadow(0 0 10px rgba(6,182,212,0.9));">
            <div style="background: #0891b2; color: white; font-size: 9px; font-weight: 800; padding: 2px 6px; border-radius: 4px; border: 1px solid #22d3ee; white-space: nowrap; margin-bottom: 2px;">
              📡 TOWER NOIDA-62 (IMEI PINNED)
            </div>
            <div style="width: 24px; height: 24px; border-radius: 9999px; background: #06b6d4; border: 2px solid white; display: flex; align-items: center; justify-content: center; font-size: 11px;">
              📱
            </div>
          </div>
        `;
        const m = new maplibregl.Marker({ element: el })
          .setLngLat([77.3620, 28.6275])
          .addTo(mapRef.current);
        markersRef.current.push(m);
      }
    }, 1200);

    // ==========================================
    // STAGE 2: UBER TRANSIT & E-COMMERCE (1.8 - 3.8s)
    // ==========================================
    setTimeout(() => {
      sound.playAlertBeep();
      setCurrentStep(2);
      setConfidenceDisplay(62.7);
      setEcomStatus('E-Commerce: Amazon burner phone drop & Uber Karol Bagh trip verified');

      addLog('ECOMMERCE', 'UBER_API', 'Trip UBER-991823: White Swift Tour (DL 1ZB 4412) from Karol Bagh to Sector 62', true);
      addLog('FINANCE', 'NPCI_UPI', 'Uber trip fare ₹485.50 settled via persistent UPI VPA rajan.bhai@okhdfcbank');
      addLog('ECOMMERCE', 'AMAZON_INDIA', 'Order #OD-402 delivered: Nokia 105 Dual SIM to Flat 402, Green View Apts', true);

      // Draw animated Uber Route
      if (mapRef.current && dossier?.spatial_markers?.uber_route?.coordinates) {
        const routeSrc = mapRef.current.getSource('uber-route') as maplibregl.GeoJSONSource | undefined;
        if (routeSrc) {
          routeSrc.setData({
            type: 'Feature',
            properties: {},
            geometry: {
              type: 'LineString',
              coordinates: dossier.spatial_markers.uber_route.coordinates,
            },
          });
        }
      }

      // Drop Amazon Package Marker
      if (mapRef.current) {
        const el = document.createElement('div');
        el.className = 'marker-amazon';
        el.innerHTML = `
          <div style="display: flex; flex-direction: column; align-items: center; filter: drop-shadow(0 0 10px rgba(245,158,11,0.9));">
            <div style="background: #b45309; color: white; font-size: 9px; font-weight: 800; padding: 2px 6px; border-radius: 4px; border: 1px solid #fbbf24; white-space: nowrap; margin-bottom: 2px;">
              📦 AMAZON DROP (FLAT 402)
            </div>
            <div style="width: 24px; height: 24px; border-radius: 9999px; background: #f59e0b; border: 2px solid white; display: flex; align-items: center; justify-content: center; font-size: 11px;">
              📦
            </div>
          </div>
        `;
        const m = new maplibregl.Marker({ element: el })
          .setLngLat([77.3649, 28.6280])
          .addTo(mapRef.current);
        markersRef.current.push(m);
      }
    }, 3200);

    // ==========================================
    // STAGE 3: FOOD DELIVERY & NIGHT TIME BEACONS (3.8 - 5.5s)
    // ==========================================
    setTimeout(() => {
      sound.playAlertBeep();
      setCurrentStep(3);
      setConfidenceDisplay(79.3);

      addLog('ECOMMERCE', 'ZOMATO_LEAD', 'Zomato Midnight Biryani delivered at 02:14 AM to Safehouse C-402 Sector 62', true);
      addLog('SOCIAL', 'META_GRAPH', 'Deleted Instagram Story EXIF extracted: iPhone 15 Pro GPS at 28.6279°N, 77.3648°E');
      addLog('SOCIAL', 'GDRIVE_API', 'Encrypted vault Syndicate_Ledger.kdbx synced from ACT IP 122.161.44.89');

      // Drop Zomato Delivery Marker
      if (mapRef.current) {
        const el = document.createElement('div');
        el.className = 'marker-zomato';
        el.innerHTML = `
          <div style="display: flex; flex-direction: column; align-items: center; filter: drop-shadow(0 0 12px rgba(239,68,68,0.95));">
            <div style="background: #dc2626; color: white; font-size: 9px; font-weight: 800; padding: 2px 6px; border-radius: 4px; border: 1px solid #fca5a5; white-space: nowrap; margin-bottom: 2px;">
              🍔 ZOMATO 02:14 AM MIDNIGHT DELIVERY
            </div>
            <div style="width: 26px; height: 26px; border-radius: 9999px; background: #ef4444; border: 2px solid white; display: flex; align-items: center; justify-content: center; font-size: 12px; animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;">
            </div>
            <div style="position: absolute; width: 20px; height: 20px; border-radius: 9999px; background: #b91c1c; border: 2px solid white; display: flex; align-items: center; justify-content: center; color: white; font-size: 10px;">
              🍗
            </div>
          </div>
        `;
        const m = new maplibregl.Marker({ element: el })
          .setLngLat([77.3655, 28.6288])
          .addTo(mapRef.current);
        markersRef.current.push(m);
      }
    }, 5000);

    // ==========================================
    // STAGE 4: IOT SMART METER & WIFI PROBE (5.5 - 7.5s)
    // ==========================================
    setTimeout(() => {
      sound.playAlertBeep();
      setCurrentStep(4);
      setConfidenceDisplay(91.5);
      setIotStatus('IoT: Smart Meter SM-9811 +420% surge & Alexa voiceprint match 96.2%');

      addLog('IOT', 'UPPCL_GRID', 'CRITICAL: Smart Meter SM-9811 power consumption jumped from 0.38 to 4.82 kWh (+420% spike!)', true);
      addLog('IOT', 'ALEXA_VOICE', 'Echo Dot recorded utterance "turn off lights": Voiceprint matched Rajan Verma (96.2%)', true);
      addLog('IOT', 'FITBIT_PULSE', 'Subject experienced 142 BPM tachycardia at 03:12 AM when police patrol passed');
      addLog('TELECOM', 'WIFI_PROBE', '802.11 probe frame captured querying historic SSID "Home_WiFi" within 35m radius');

      // Draw WiFi Probe Radius Circle on Map
      if (mapRef.current) {
        const wifiSrc = mapRef.current.getSource('wifi-probe-circle') as maplibregl.GeoJSONSource | undefined;
        if (wifiSrc) {
          wifiSrc.setData({
            type: 'FeatureCollection',
            features: [
              {
                type: 'Feature',
                properties: { radius: 35 },
                geometry: { type: 'Point', coordinates: [77.3649, 28.6280] },
              },
            ],
          });
        }

        // Drop Smart Meter Anomaly Marker
        const el = document.createElement('div');
        el.className = 'marker-smart-meter';
        el.innerHTML = `
          <div style="display: flex; flex-direction: column; align-items: center; filter: drop-shadow(0 0 14px rgba(244,63,94,0.95));">
            <div style="background: #e11d48; color: white; font-size: 9px; font-weight: 800; padding: 2px 6px; border-radius: 4px; border: 1px solid #fda4af; white-space: nowrap; margin-bottom: 2px;">
              ⚡ METER SM-9811 (+420% POWER SPIKE)
            </div>
            <div style="width: 26px; height: 26px; border-radius: 9999px; background: #f43f5e; border: 2px solid white; display: flex; align-items: center; justify-content: center; font-size: 12px;">
              ⚡
            </div>
          </div>
        `;
        const m = new maplibregl.Marker({ element: el })
          .setLngLat([77.3649, 28.6280])
          .addTo(mapRef.current);
        markersRef.current.push(m);
      }
    }, 7000);

    // ==========================================
    // STAGE 5: FINAL FUSION & ARREST WARRANT (7.5 - 9.0s)
    // ==========================================
    setTimeout(() => {
      sound.playSuccessChime();
      setIsRunning(false);
      setIsCompleted(true);
      setCurrentStep(5);
      setConfidenceDisplay(98.4);
      setSocialStatus('Social/Cloud: EXIF coordinates & Drive IP verified');
      setFinanceStatus('Financial: Binance P2P ₹4.5L frozen under Sec 106 BNSS');
      setFinalVerdict('FINAL VERDICT: Suspect Location Pinned to 8.5 meters (Sector 62, Noida)');

      addLog('FINANCE', 'FIU_BNSS', 'FIU Alert: Off-ramp ₹4,50,000 -> USDT frozen under Section 106 BNSS');
      addLog('SYSTEM', 'FUSION_COMPLETE', 'OMNI-TRACE COMPLETE: Matched 4 IoT devices, 3 Telecom tower handovers, 2 delivery logs, 1 Uber trip', true);
      addLog('SYSTEM', 'VERDICT', 'Target pinned within 8.5 meters: Flat 402, Block C, Green View Apartments, Sector 62, Noida', true);
      addLog('SYSTEM', 'WARRANT_READY', 'Section 63 BSA Digital Arrest Warrant generated and cryptographically signed (SHA-256 locked)', true);

      // Zoom into target safehouse
      if (mapRef.current) {
        mapRef.current.flyTo({
          center: [77.3649, 28.6280],
          zoom: 15.6,
          duration: 1200,
        });

        // Drop Master Red Bullseye Pin
        const el = document.createElement('div');
        el.className = 'marker-safehouse';
        el.innerHTML = `
          <div style="display: flex; flex-direction: column; align-items: center; filter: drop-shadow(0 0 20px rgba(220,38,38,1));">
            <div style="background: linear-gradient(135deg, #b91c1c, #dc2626); color: white; font-size: 10px; font-weight: 900; padding: 3px 8px; border-radius: 6px; border: 2px solid #ffffff; box-shadow: 0 0 16px rgba(220,38,38,0.9); white-space: nowrap; margin-bottom: 2px;">
              🎯 PRIMARY TARGET PINNED (FLAT 402)
            </div>
            <div style="position: relative; width: 34px; height: 34px; display: flex; align-items: center; justify-content: center;">
              <div style="position: absolute; width: 34px; height: 34px; border-radius: 9999px; background: rgba(220,38,38,0.5); animation: ping 1s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
              <div style="width: 24px; height: 24px; border-radius: 9999px; background: #dc2626; border: 3px solid white; display: flex; align-items: center; justify-content: center; color: white; font-size: 13px;">
                🚨
              </div>
            </div>
          </div>
        `;
        const m = new maplibregl.Marker({ element: el })
          .setLngLat([77.3649, 28.6280])
          .addTo(mapRef.current);
        markersRef.current.push(m);
      }

      toast.success(
        'Omni-Trace Correlation Complete. Target pinned within 8.5 meters at Sector 62, Noida. Section 63 BSA arrest warrant ready.',
        'Target Pinned'
      );
    }, 9000);
  };

  const filteredLogs = logs.filter((log) => {
    if (!terminalSearch) return true;
    return (
      log.message.toLowerCase().includes(terminalSearch.toLowerCase()) ||
      log.source.toLowerCase().includes(terminalSearch.toLowerCase()) ||
      log.category.toLowerCase().includes(terminalSearch.toLowerCase())
    );
  });

  return (
    <div className="space-y-4">
      {/* Massive Celebratory Warrant Ready Banner */}
      {isCompleted && (
        <div className="p-4 rounded-xl border-2 border-emerald-400 bg-gradient-to-r from-emerald-950 via-slate-900 to-emerald-950 text-white shadow-2xl flex flex-col md:flex-row items-center justify-between gap-4 animate-in fade-in zoom-in-95">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-emerald-500/30 border-2 border-emerald-400 flex items-center justify-center shrink-0 animate-pulse">
              <CheckCircle2 className="h-6 w-6 text-emerald-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-400/40">
                  OMNI-TRACE COMPLETE • 98.4% CONFIDENCE
                </span>
                <span className="text-xs text-slate-300">Target Pinned within 8.5m</span>
              </div>
              <h2 className="text-sm md:text-base font-extrabold text-white mt-0.5">
                Suspect Located: Flat 402, Block C, Green View Apartments, Sector 62, Noida
              </h2>
            </div>
          </div>
          <div className="flex items-center gap-2 w-full md:w-auto">
            <Button
              size="sm"
              onClick={() => {
                sound.playClickSound();
                setWarrantModalOpen(true);
              }}
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs shadow-lg shadow-emerald-600/40 flex items-center gap-2 border border-emerald-300/50"
            >
              <FileCheck2 className="h-4 w-4" />
              <span>Generate Section 63 BSA Arrest Dossier</span>
            </Button>
          </div>
        </div>
      )}

      {/* Main Top Header Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl border border-border bg-card/90 backdrop-blur-md shadow-lg">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-black tracking-tight text-foreground flex items-center gap-2">
              <Cpu className="h-5 w-5 text-cyan-400" />
              <span>Omni-Trace Digital Footprint Engine</span>
            </h1>
            <Badge variant="outline" className="border-cyan-500/40 text-cyan-400 bg-cyan-950/30 text-[10px] font-mono font-bold">
              MULTI-VECTOR FUSION
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Fusing 100+ digital traces: Telecom, E-Commerce, IoT Smart Home, Social Media & Alternative Finance.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              sound.playClickSound();
              setPreviewDossierOpen(true);
            }}
            className="border-indigo-500/50 text-indigo-300 hover:bg-indigo-950/40 text-xs font-bold flex items-center gap-1.5"
            title="Preview Multi-Vector Digital Footprint Dossier"
          >
            <Eye className="h-3.5 w-3.5 text-indigo-400" />
            <span>Preview Dossier</span>
          </Button>

          <Button
            size="sm"
            onClick={handleRunOmniTrace}
            disabled={isRunning}
            className={`font-extrabold text-xs flex items-center gap-2 transition-all ${
              isRunning
                ? 'bg-cyan-700 text-white animate-pulse'
                : 'bg-cyan-600 hover:bg-cyan-500 text-white shadow-lg shadow-cyan-600/30'
            }`}
          >
            {isRunning ? (
              <>
                <RotateCcw className="h-4 w-4 animate-spin" />
                <span>Correlating 96 Streams...</span>
              </>
            ) : (
              <>
                <Play className="h-4 w-4" />
                <span>Run Omni-Trace</span>
              </>
            )}
          </Button>

          {isCompleted && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                sound.playClickSound();
                setWarrantModalOpen(true);
              }}
              className="border-emerald-500/50 text-emerald-400 hover:bg-emerald-950/40 text-xs font-bold flex items-center gap-1.5"
            >
              <FileCheck2 className="h-4 w-4" />
              <span>View Arrest Warrant</span>
            </Button>
          )}
        </div>
      </div>

      {/* Grid: Left Column (Map & Hacker Terminal) vs Right Column (Glassmorphic Fusion Panel) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left Column: Visual Map (Top) & Hacker Terminal (Bottom) */}
        <div className="lg:col-span-8 space-y-4">
          {/* Map Container */}
          <Card className="overflow-hidden border-border bg-slate-950 shadow-xl relative">
            <div className="p-2.5 px-3 bg-slate-900 border-b border-border flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 font-mono">
                <MapPin className="h-4 w-4 text-cyan-400" />
                <span className="font-bold text-white">Spatial Telemetry MapLibre Canvas</span>
                <span className="text-[10px] text-slate-400">Delhi-NCR Tactical Corridor</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-cyan-400 animate-pulse" />
                <span className="text-[10px] text-cyan-300 font-mono">
                  {currentStep === 0
                    ? 'Map Ready'
                    : currentStep === 1
                    ? 'Telecom Tower Locked'
                    : currentStep === 2
                    ? 'Uber Transit & Amazon Drop Plotted'
                    : currentStep === 3
                    ? 'Zomato 02:14 AM Pin Ingested'
                    : currentStep === 4
                    ? 'IoT Smart Meter Anomaly Overlaid'
                    : 'Target Pinned (8.5m Radius)'}
                </span>
              </div>
            </div>

            <div className="h-[360px] w-full relative">
              <div ref={mapContainerRef} className="w-full h-full" />

              {/* Map Floating HUD Legend */}
              <div className="absolute bottom-3 left-3 z-10 p-2.5 rounded-lg bg-slate-950/90 border border-slate-700/80 text-[10px] space-y-1 font-mono text-slate-300 shadow-xl backdrop-blur-md">
                <div className="font-bold text-white uppercase text-[9px] border-b border-slate-700 pb-1">
                  Tactical Spatial Legend
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-0.5 bg-emerald-400 inline-block" />
                  <span>Uber Getaway Route (Karol Bagh &rarr; Noida)</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-amber-400 inline-block" />
                  <span>Amazon Burner Phone Package Drop</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-red-500 inline-block" />
                  <span>Zomato 02:14 AM Delivery Address</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-blue-400 inline-block" />
                  <span>WiFi Probe Geofence ("Home_WiFi")</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-rose-500 inline-block" />
                  <span>Smart Electricity Meter (+420% Surge)</span>
                </div>
              </div>
            </div>
          </Card>

          {/* Hacker Terminal Matrix Log Stream */}
          <Card className="overflow-hidden border-border bg-slate-950 shadow-xl font-mono">
            <div className="p-2.5 px-3 bg-slate-900 border-b border-border flex flex-wrap items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-2">
                <Terminal className="h-4 w-4 text-emerald-400" />
                <span className="font-bold text-white tracking-wide">DIGITAL EXHAUST MATRIX LOG STREAM</span>
                <Badge variant="outline" className="border-emerald-500/40 text-emerald-400 text-[9px] bg-emerald-950/30">
                  LIVE INTERCEPT
                </Badge>
              </div>

              <div className="flex items-center gap-2 text-[11px]">
                <div className="relative">
                  <Search className="absolute left-2 top-1.5 h-3 w-3 text-slate-400" />
                  <input
                    type="text"
                    value={terminalSearch}
                    onChange={(e) => setTerminalSearch(e.target.value)}
                    placeholder="Filter logs (IMEI, Uber, IoT)..."
                    className="pl-7 pr-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-200 text-[10px] focus:outline-none focus:border-cyan-500"
                  />
                </div>
                <button
                  onClick={() => setAutoScroll(!autoScroll)}
                  className={`px-2 py-0.5 rounded border text-[10px] font-bold ${
                    autoScroll
                      ? 'bg-emerald-950 border-emerald-500/40 text-emerald-400'
                      : 'bg-slate-800 border-slate-700 text-slate-400'
                  }`}
                >
                  {autoScroll ? 'Auto-Scroll: ON' : 'Auto-Scroll: OFF'}
                </button>
                <button
                  onClick={() => setLogs([])}
                  className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-400 hover:text-white text-[10px]"
                >
                  Clear
                </button>
              </div>
            </div>

            <div className="h-[260px] p-3 overflow-y-auto overflow-x-hidden break-words bg-slate-950 text-[11px] space-y-1.5 scrollbar-thin select-text">
              {logs.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-500 text-xs">
                  <Terminal className="h-8 w-8 mb-2 opacity-40 text-cyan-400" />
                  <p>Awaiting ingestion trigger... Click "Run Omni-Trace" above to execute multi-feed fusion.</p>
                </div>
              ) : (
                filteredLogs.map((log) => (
                  <div
                    key={log.id}
                    className={`flex items-start gap-2 leading-relaxed ${
                      log.highlight
                        ? 'text-emerald-300 font-bold bg-emerald-950/30 px-1.5 py-0.5 rounded border border-emerald-500/20'
                        : log.category === 'TELECOM'
                        ? 'text-cyan-300'
                        : log.category === 'ECOMMERCE'
                        ? 'text-amber-300'
                        : log.category === 'IOT'
                        ? 'text-rose-300'
                        : log.category === 'FINANCE'
                        ? 'text-yellow-300'
                        : 'text-slate-300'
                    }`}
                  >
                    <span className="text-slate-500 shrink-0">[{log.timestamp}]</span>
                    <span
                      className={`px-1 rounded text-[9px] font-bold shrink-0 ${
                        log.category === 'TELECOM'
                          ? 'bg-cyan-900/60 text-cyan-200'
                          : log.category === 'ECOMMERCE'
                          ? 'bg-amber-900/60 text-amber-200'
                          : log.category === 'IOT'
                          ? 'bg-rose-900/60 text-rose-200'
                          : log.category === 'FINANCE'
                          ? 'bg-yellow-900/60 text-yellow-200'
                          : 'bg-slate-800 text-slate-300'
                      }`}
                    >
                      {log.source}
                    </span>
                    <span className="flex-1 break-all">{log.message}</span>
                  </div>
                ))
              )}
              <div ref={terminalEndRef} />
            </div>
          </Card>
        </div>

        {/* Right Column: Glassmorphic Fusion Panel */}
        <div className="lg:col-span-4 space-y-4">
          <Card className="border-cyan-500/30 bg-gradient-to-b from-slate-900/90 via-slate-900/95 to-slate-950 shadow-2xl backdrop-blur-md">
            <CardHeader className="pb-3 border-b border-border/50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-cyan-600/30 border border-cyan-400 text-cyan-300">
                    <Activity className="h-4 w-4" />
                  </div>
                  <div>
                    <CardTitle className="text-sm font-extrabold text-white">
                      Real-Time Fusion Panel
                    </CardTitle>
                    <span className="text-[10px] text-muted-foreground font-mono">
                      Multi-Source Spatial Correlation
                    </span>
                  </div>
                </div>
                <Badge
                  variant="outline"
                  className={`text-xs font-mono font-black ${
                    confidenceDisplay >= 90
                      ? 'border-emerald-400 text-emerald-300 bg-emerald-950/40'
                      : 'border-cyan-400 text-cyan-300 bg-cyan-950/40'
                  }`}
                >
                  {confidenceDisplay.toFixed(1)}% CONFIDENCE
                </Badge>
              </div>
            </CardHeader>

            <CardContent className="space-y-3 pt-3 text-xs">
              {/* Target Dossier Summary Card */}
              <div className="p-2.5 rounded-lg bg-slate-950/70 border border-slate-800 space-y-1 font-mono text-[11px]">
                <div className="flex justify-between">
                  <span className="text-slate-400">Target Identity:</span>
                  <span className="text-white font-bold">Rajan Verma (Shadow-01)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Hardware IMEI:</span>
                  <span className="text-cyan-400 font-bold">358912093847291</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Persistent UPI:</span>
                  <span className="text-emerald-400 font-bold">rajan.bhai@okhdfcbank</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Safehouse Address:</span>
                  <span className="text-slate-200">Sector 62, Noida (Flat 402)</span>
                </div>
              </div>

              {/* Real-time Category Correlation Status Cards */}
              <div className="space-y-2">
                {/* 1. Telecom Card */}
                <div className="p-2.5 rounded-lg border border-cyan-500/30 bg-cyan-950/20 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-cyan-300 flex items-center gap-1.5 text-[11px]">
                      <Radio className="h-3.5 w-3.5 text-cyan-400" />
                      Telecom & ISP Infrastructure
                    </span>
                    <span className={`text-[9px] font-mono px-1.5 py-0.2 rounded font-bold ${currentStep >= 1 ? 'bg-cyan-500/20 text-cyan-300' : 'bg-slate-800 text-slate-500'}`}>
                      {currentStep >= 1 ? 'CORRELATED' : 'PENDING'}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-300 leading-snug">{telecomStatus}</p>
                </div>

                {/* 2. E-Commerce & Mobility Card */}
                <div className="p-2.5 rounded-lg border border-amber-500/30 bg-amber-950/20 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-amber-300 flex items-center gap-1.5 text-[11px]">
                      <ShoppingBag className="h-3.5 w-3.5 text-amber-400" />
                      E-Commerce & Urban Mobility
                    </span>
                    <span className={`text-[9px] font-mono px-1.5 py-0.2 rounded font-bold ${currentStep >= 2 ? 'bg-amber-500/20 text-amber-300' : 'bg-slate-800 text-slate-500'}`}>
                      {currentStep >= 2 ? 'CORRELATED' : 'PENDING'}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-300 leading-snug">{ecomStatus}</p>
                </div>

                {/* 3. IoT Smart Meter Card */}
                <div className="p-2.5 rounded-lg border border-rose-500/30 bg-rose-950/20 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-rose-300 flex items-center gap-1.5 text-[11px]">
                      <Zap className="h-3.5 w-3.5 text-rose-400" />
                      IoT & Smart Power Grid
                    </span>
                    <span className={`text-[9px] font-mono px-1.5 py-0.2 rounded font-bold ${currentStep >= 4 ? 'bg-rose-500/20 text-rose-300' : 'bg-slate-800 text-slate-500'}`}>
                      {currentStep >= 4 ? 'CORRELATED' : 'PENDING'}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-300 leading-snug">{iotStatus}</p>
                </div>

                {/* 4. Social & Cloud Card */}
                <div className="p-2.5 rounded-lg border border-indigo-500/30 bg-indigo-950/20 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-indigo-300 flex items-center gap-1.5 text-[11px]">
                      <Cloud className="h-3.5 w-3.5 text-indigo-400" />
                      Social Media & Cloud Backups
                    </span>
                    <span className={`text-[9px] font-mono px-1.5 py-0.2 rounded font-bold ${currentStep >= 3 ? 'bg-indigo-500/20 text-indigo-300' : 'bg-slate-800 text-slate-500'}`}>
                      {currentStep >= 3 ? 'CORRELATED' : 'PENDING'}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-300 leading-snug">{socialStatus}</p>
                </div>

                {/* 5. Alternative Finance Card */}
                <div className="p-2.5 rounded-lg border border-emerald-500/30 bg-emerald-950/20 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-emerald-300 flex items-center gap-1.5 text-[11px]">
                      <CreditCard className="h-3.5 w-3.5 text-emerald-400" />
                      Alternative Finance & Crypto
                    </span>
                    <span className={`text-[9px] font-mono px-1.5 py-0.2 rounded font-bold ${currentStep >= 5 ? 'bg-emerald-500/20 text-emerald-300' : 'bg-slate-800 text-slate-500'}`}>
                      {currentStep >= 5 ? 'FROZEN / SECTION 106' : 'PENDING'}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-300 leading-snug">{financeStatus}</p>
                </div>
              </div>

              {/* Final Verdict Callout */}
              {finalVerdict && (
                <div className="p-3 rounded-xl border-2 border-emerald-400 bg-emerald-950/50 text-white font-mono space-y-1 animate-in zoom-in-95">
                  <div className="flex items-center gap-1.5 text-emerald-300 font-extrabold text-[11px]">
                    <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                    <span>PRECISION LOCALIZATION VERIFIED</span>
                  </div>
                  <p className="text-xs font-bold leading-snug text-white">{finalVerdict}</p>
                  <p className="text-[10px] text-emerald-300/80 pt-1 border-t border-emerald-400/30">
                    Accuracy Radius: ±8.5 meters • Court Admissibility: Section 63 BSA 2023 Compliant.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Official Section 63 BSA Digital Arrest Warrant Modal */}
      <Modal
        isOpen={warrantModalOpen}
        onClose={() => setWarrantModalOpen(false)}
        title="Official Judicial Arrest Warrant & Electronic Evidence Dossier"
        maxWidth="max-w-3xl"
      >
        <div className="space-y-4 text-slate-200 font-sans">
          {/* Header of Warrant */}
          <div className="p-4 rounded-xl border-2 border-amber-500/40 bg-gradient-to-b from-amber-950/30 via-slate-900 to-slate-950 text-center space-y-1.5 relative overflow-hidden">
            <div className="text-amber-400 text-xs font-bold tracking-widest uppercase">
              BHARATIYA NAGARIK SURAKSHA SANHITA (BNSS), 2023
            </div>
            <h3 className="text-lg font-black text-white tracking-wide">
              COURT OF THE CHIEF JUDICIAL MAGISTRATE, GAUTAM BUDDHA NAGAR
            </h3>
            <div className="text-[11px] text-slate-300 font-mono">
              WARRANT OF ARREST (SECTION 35 & 106 BNSS) • BSA SECTION 63 CERTIFIED
            </div>

            <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
              <Badge variant="outline" className="border-amber-400 text-amber-300 font-mono text-xs">
                WARRANT NO: {dossier?.section_63_bsa_warrant?.warrant_number || 'NBW-BSA-2026-RAJAN-9812'}
              </Badge>
              <Badge variant="outline" className="border-red-400 text-red-300 font-mono text-xs animate-pulse">
                REMAND CLOCK: {Math.floor(remandSeconds / 3600)}h {Math.floor((remandSeconds % 3600) / 60)}m {remandSeconds % 60}s
              </Badge>
            </div>
          </div>

          {/* Subject & Location Target */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs font-mono">
            <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 space-y-1">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Target Subject</span>
              <div className="font-bold text-white text-sm">Rajan Verma @ Rajan Bhai</div>
              <div className="text-slate-300">Alias: Shadow-01 / Interstate Extortion Syndicate</div>
              <div className="text-cyan-400">IMEI: 358912093847291</div>
            </div>

            <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 space-y-1">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Authorized Target Location</span>
              <div className="font-bold text-white text-sm">Flat 402, Block C, Green View Apts</div>
              <div className="text-slate-300">Sector 62, Noida, Uttar Pradesh 201309</div>
              <div className="text-emerald-400">GPS: 28.6280°N, 77.3649°E (±8.5m Accuracy)</div>
            </div>
          </div>

          {/* Electronic Evidence Exhibit Matrix */}
          <div className="space-y-1.5">
            <div className="text-xs font-bold text-slate-300 uppercase tracking-wider font-mono">
              Exhibit Schedule under Section 63 BSA, 2023 (Admissible Electronic Evidence)
            </div>
            <div className="rounded-lg border border-slate-800 overflow-x-auto text-xs">
              <table className="w-full text-left font-mono min-w-[500px]">
                <thead className="bg-slate-900 text-slate-400 text-[11px] border-b border-slate-800">
                  <tr>
                    <th className="p-2">Exhibit</th>
                    <th className="p-2">Category</th>
                    <th className="p-2">Forensic Finding</th>
                    <th className="p-2 text-right">Confidence</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 bg-slate-950/60 text-[11px]">
                  <tr>
                    <td className="p-2 font-bold text-cyan-400">EX-01</td>
                    <td className="p-2 text-slate-300">Telecom Tower Dump</td>
                    <td className="p-2 text-slate-300">Hardware IMEI 358912093847291 locked to Sector 62 Mast</td>
                    <td className="p-2 text-right text-emerald-400 font-bold">98.6%</td>
                  </tr>
                  <tr>
                    <td className="p-2 font-bold text-amber-400">EX-02</td>
                    <td className="p-2 text-slate-300">Mobility & Ride-Hail</td>
                    <td className="p-2 text-slate-300">Uber Swift Tour from Karol Bagh paid via rajan.bhai@okhdfcbank</td>
                    <td className="p-2 text-right text-emerald-400 font-bold">97.8%</td>
                  </tr>
                  <tr>
                    <td className="p-2 font-bold text-rose-400">EX-03</td>
                    <td className="p-2 text-slate-300">Food Logistics</td>
                    <td className="p-2 text-slate-300">Zomato delivery at 02:14 AM confirms physical occupancy in safehouse</td>
                    <td className="p-2 text-right text-emerald-400 font-bold">96.9%</td>
                  </tr>
                  <tr>
                    <td className="p-2 font-bold text-purple-400">EX-04</td>
                    <td className="p-2 text-slate-300">Smart Grid IoT</td>
                    <td className="p-2 text-slate-300">UPPCL Smart Meter SM-9811 spiked +420.5% (0.38 &rarr; 4.82 kWh)</td>
                    <td className="p-2 text-right text-emerald-400 font-bold">99.1%</td>
                  </tr>
                  <tr>
                    <td className="p-2 font-bold text-indigo-400">EX-05</td>
                    <td className="p-2 text-slate-300">Social Media EXIF</td>
                    <td className="p-2 text-slate-300">Deleted Instagram Story camera EXIF retains GPS at Flat 402 balcony</td>
                    <td className="p-2 text-right text-emerald-400 font-bold">98.2%</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Digital Signature & SHA-256 Hash Box */}
          <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 space-y-1 font-mono text-[10px]">
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Cryptographic Seal (SHA-256):</span>
              <span className="text-emerald-400 font-bold">SHA-256 TAMPER-PROOF VERIFIED</span>
            </div>
            <div className="p-1.5 rounded bg-slate-950 text-cyan-300 text-[10px] break-all border border-slate-800">
              {dossier?.section_63_bsa_warrant?.sha256_hash ||
                'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855'}
            </div>
            <div className="flex justify-between text-slate-400 pt-1">
              <span>Certifying Officer: Insp. Rajesh Varma</span>
              <span>Issued under Digital Security Protocol v2.4</span>
            </div>
          </div>

          {/* Modal Bottom Actions */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-border">
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                sound.playClickSound();
                navigator.clipboard.writeText(JSON.stringify(dossier, null, 2));
                toast.success('Complete Section 63 BSA JSON payload copied to clipboard.', 'Copied');
              }}
              className="border-slate-700 text-xs text-slate-300"
            >
              <Download className="h-4 w-4 mr-1.5" />
              <span>Copy Raw Warrant JSON</span>
            </Button>

            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  sound.playClickSound();
                  window.print();
                }}
                className="border-slate-700 text-xs text-slate-300"
              >
                <Printer className="h-4 w-4 mr-1.5" />
                <span>Print Official Warrant</span>
              </Button>

              <Button
                size="sm"
                onClick={() => {
                  sound.playSuccessChime();
                  setWarrantModalOpen(false);
                  toast.success(
                    'PCR Patrol Squad Alpha-04 dispatched to Sector 62, Noida. Remand timer initiated.',
                    'Unit Dispatched'
                  );
                }}
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs shadow-lg shadow-emerald-600/30"
              >
                <Navigation className="h-4 w-4 mr-1.5" />
                <span>Dispatch PCR Alpha-04 (Execute Arrest)</span>
              </Button>
            </div>
          </div>
        </div>
      </Modal>

      <DocumentPreviewModal
        isOpen={previewDossierOpen}
        onClose={() => setPreviewDossierOpen(false)}
        title="Multi-Vector Digital Footprint & Telemetry Dossier"
        subtitle="Suspect: Rajan Verma • Safehouse: Sector 62, Noida • Fused 96 Data Feeds"
        caseNumber="FIR-2026-CRIME-890"
        pdfUrl="/CRIMENEXUS_Police_Department_Deployment_Dossier.pdf"
        fileName="Digital_Footprint_Dossier_Rajan_Verma.pdf"
        metadata={{
          ioName: 'Inspector V. K. Sharma',
          policeStation: 'Cyber Crime Police Station, Sector 20, Noida',
          suspectName: 'Rajan Verma (Syndicate Kingpin)',
          crimeType: 'Telecom Spoofing, Fastag Evasion, Safehouse IoT Spikes',
          hash: '6a5b4c3d2e1f0a9b8c7d6e5f4a3b2c1d0e9f8a7b6c5d4e3f2a1b0c9d8e7f6a5',
        }}
      />
    </div>
  );
}
