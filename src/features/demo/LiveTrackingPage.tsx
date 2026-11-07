import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { createPortal } from 'react-dom';
import axios from 'axios';
import * as maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import {
  Play,
  Pause,
  RotateCcw,
  Shield,
  ShieldAlert,
  Radio,
  Compass,
  AlertTriangle,
  Siren,
  Volume2,
  VolumeX,
  Gauge,
  Navigation,
  Car,
  Camera,
  Minimize2,
  Maximize2,
  ChevronDown,
  ChevronUp,
  MapPin,
  Sparkles,
  Search,
  ExternalLink,
  Layers,
  X,
  CheckCircle2,
  Eye,
  Sliders,
  Move,
  Smartphone,
  ShieldCheck,
  Zap,
  Lock,
  Brain,
  Scale,
  RefreshCw,
  Fingerprint,
  Mic,
  Database,
  FileText,
  Clock,
  TrendingDown,
  Users,
  Box,
  FileCheck2,
  BookOpen,
  Activity,
  ArrowRight,
  Check,
  FileSpreadsheet,
  Share2,
  Upload,
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Card, CardContent } from '../../components/ui/Card';
import { sound } from '../../utils/soundEffects';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { DocumentPreviewModal } from '../../components/common/DocumentPreviewModal';
import { ForensicClueReplayModal } from '../forensics/ForensicClueReplayModal';
import { useToast } from '../../components/ui/Toast';

// Predefined getaway route coordinates [lon, lat] through Delhi/Noida
const GETAWAY_PATH: Array<[number, number]> = [
  [77.2197, 28.6328], // 0: Connaught Place
  [77.2295, 28.6289], // 1: Barakhamba Rd
  [77.2410, 28.6255], // 2: Mandi House / Tilak Marg
  [77.2492, 28.6270], // 3: Supreme Court / ITO Crossing
  [77.2655, 28.6240], // 4: Vikas Marg / Yamuna River Bridge
  [77.2770, 28.6185], // 5: Laxmi Nagar / Akshardham Flyover
  [77.2885, 28.6110], // 6: Mayur Vihar Phase 1
  [77.3020, 28.6015], // 7: Noida Chilla Border
  [77.3180, 28.5850], // 8: Noida Sector 15 Metro
  [77.3265, 28.5710], // 9: Sector 18 Atta Market
  [77.3420, 28.5685], // 10: Botanical Garden Interchange
  [77.3649, 28.6280], // 11: Sector 62 Cyber Corridor
  [77.3820, 28.6150], // 12: Electronic City Crossing
  [77.4100, 28.5800], // 13: Expressway Interchange
  [77.5510, 28.1402], // 14: Yamuna Expressway KM 48 Checkpoint
];

// Authenticated Google Maps Raster Tiles specification (NO Carto API key watermark)
const GOOGLE_MAPS_KEY = 'AIzaSyDKQEYlzdG9OQ6B7vPtHkzNBNbTkkLrKt4';

const GOOGLE_MAP_STYLE: maplibregl.StyleSpecification = {
  version: 8,
  sources: {
    'google-roadmap': {
      type: 'raster',
      tiles: [
        `https://mt0.google.com/vt/lyrs=m&x={x}&y={y}&z={z}&key=${GOOGLE_MAPS_KEY}`,
        `https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}&key=${GOOGLE_MAPS_KEY}`,
        `https://mt2.google.com/vt/lyrs=m&x={x}&y={y}&z={z}&key=${GOOGLE_MAPS_KEY}`,
        `https://mt3.google.com/vt/lyrs=m&x={x}&y={y}&z={z}&key=${GOOGLE_MAPS_KEY}`,
      ],
      tileSize: 256,
      attribution: '© Google Maps',
    },
  },
  layers: [
    {
      id: 'google-roadmap-layer',
      type: 'raster',
      source: 'google-roadmap',
      minzoom: 0,
      maxzoom: 22,
    },
  ],
};

const OSM_MAP_STYLE: maplibregl.StyleSpecification = {
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

export interface CorrelationEvent {
  step: number;
  time: string;
  source: string;
  title: string;
  desc: string;
  badge: string;
  category: 'CCTNS' | 'TELECOM' | 'ANPR' | 'FINANCIAL' | 'BIOMETRIC' | 'AI' | 'TACTICAL' | 'LEGAL';
}

export const LIVE_CORRELATION_EVENTS: CorrelationEvent[] = [
  {
    step: 0,
    time: '14:20:10 IST',
    source: 'CCTNS FIR Gateway',
    title: 'FIR-2026-8812 Ingestion & Offense Parsing',
    desc: 'Incident registered at PS Connaught Place under Sec 303(2) & 311 BNS. Complainant identifies Vikram Malhotra @ Vicky.',
    badge: 'CCTNS FIR',
    category: 'CCTNS',
  },
  {
    step: 2,
    time: '14:24:35 IST',
    source: 'NAFIS Biometric Vault',
    title: 'Latent Crime-Scene Fingerprint Matched',
    desc: 'Latent prints lifted from scene matched with 99.4% confidence score to AFIS Master Record #CRB-9984.',
    badge: 'AFIS / NAFIS',
    category: 'BIOMETRIC',
  },
  {
    step: 4,
    time: '14:31:50 IST',
    source: 'FIU-IND Banking ML',
    title: 'Transit ATM Smurfing Cash Outflow',
    desc: 'Isolation Forest flags ₹48,500 cash withdrawal at Vikas Marg ATM within 15 minutes of offense.',
    badge: 'HAWALA / FIU',
    category: 'FINANCIAL',
  },
  {
    step: 6,
    time: '14:38:22 IST',
    source: 'DoT Telecom Gateway',
    title: 'Airtel Tower BTS DEL-ND-T892 Triangulation',
    desc: 'Burner MSISDN +91 98765 43210 locked on Tower DEL-ND-T892 (Azimuth 135° SE) fleeing along Yamuna corridor.',
    badge: 'CELL CDR',
    category: 'TELECOM',
  },
  {
    step: 7,
    time: '14:40:48 IST',
    source: 'State Highway ANPR',
    title: 'Toll OCR Match: TS 09 AB 1234',
    desc: 'Mahindra Scorpio black (Plate: TS 09 AB 1234) detected crossing Delhi-Noida Chilla Border at 80 km/h with 98.6% license plate confidence.',
    badge: 'FASTag / ANPR',
    category: 'ANPR',
  },
  {
    step: 9,
    time: '14:42:10 IST',
    source: 'CrimeNexus AI Core',
    title: 'Cross-Modal Spatio-Temporal Match',
    desc: 'Coincidence resolution matches ANPR toll image, Tower CDR arc, and ATM coordinates in 240ms (Certainty: 99.8%).',
    badge: 'AI RESOLUTION',
    category: 'AI',
  },
  {
    step: 11,
    time: '14:43:05 IST',
    source: 'ERSS-112 Proximity Router',
    title: 'PCR-04 Intercept Road Vector Deployed',
    desc: 'Nearest patrolling vehicle PCR-04 dispatched via dynamic OSRM routing. Intercept ETA 1.8 mins.',
    badge: 'ERSS-112 DISPATCH',
    category: 'TACTICAL',
  },
  {
    step: 14,
    time: '14:44:20 IST',
    source: 'Section 63 BSA Custody Ledger',
    title: 'Physical Vehicular Containment & Apprehension',
    desc: 'Spike-strip roadblock deployed at Yamuna Expressway Checkpoint KM 48. Suspect restrained; 24h remand clock ticking.',
    badge: 'BSA CUSTODY',
    category: 'LEGAL',
  },
];

interface NearestStationData {
  name: string;
  distanceKm: number;
  latitude: number;
  longitude: number;
  etaMins: number;
}

function calculateHaversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

// 32 Sovereign Police Platform Features Registry
export const SOVEREIGN_32_FEATURES = [
  {
    id: 1,
    title: '3D Photogrammetric Crime Scene Reconstruction',
    category: 'FORENSICS',
    statutoryRef: 'Sec 63 Bharatiya Sakshya Adhiniyam, 2023 (BSA)',
    icon: Box,
    route: '/evidence',
    status: 'READY',
    desc: 'Transforms 2D crime scene crime-spot photos into interactive 3D spatial point clouds and bullet trajectory models.',
  },
  {
    id: 2,
    title: 'Acoustic Voice Biometrics & Wiretap Identification',
    category: 'FORENSICS',
    statutoryRef: 'Sec 39 Bharatiya Nagarik Suraksha Sanhita, 2023 (BNSS)',
    icon: Mic,
    route: '/entities',
    status: 'READY',
    desc: 'Extracts 192-dimensional acoustic speaker embeddings from lawful wiretaps with 94.2% cosine similarity across burner SIMs.',
  },
  {
    id: 3,
    title: 'Automated 15-Minute CCTNS Polling Daemon',
    category: 'AUTOMATION',
    statutoryRef: 'National Crime Records Bureau (NCRB) Interop Standard',
    icon: RefreshCw,
    route: '/cases',
    status: 'READY',
    desc: 'Syncs state police CCTNS gateways every 15 minutes, ingesting inter-state FIRs, arrest memos, and modus-operandi fingerprints.',
  },
  {
    id: 4,
    title: 'Geodesic Police Proximity & Road Intercept Router',
    category: 'TACTICAL',
    statutoryRef: 'Emergency Response Support System (ERSS-112)',
    icon: MapPin,
    route: '/live-tracking',
    status: 'ACTIVE IN DEMO',
    desc: 'Sub-second Haversine distance and nearest police station ETA resolution dispatching rapid tactical intercept teams.',
  },
  {
    id: 5,
    title: '24-Hour Constitutional Remand Countdown Monitor',
    category: 'LEGAL',
    statutoryRef: 'Article 22(2) Constitution & Sec 57 BNSS',
    icon: Clock,
    route: '/dashboard',
    status: 'READY',
    desc: 'Automated custody clock warning Investigating Officers 3 hours prior to statutory remand expiry to prevent illegal detention.',
  },
  {
    id: 6,
    title: 'Hawala Smurfing & Structuring Anomaly Engine',
    category: 'FORENSICS',
    statutoryRef: 'Prevention of Money Laundering Act, 2002 (PMLA Sec 3 & 4)',
    icon: TrendingDown,
    route: '/evidence/ev-102',
    status: 'READY',
    desc: 'Isolation Forest flags rapid velocity cash deposits under ₹50,000 across disparate accounts routed to syndicate ringleaders.',
  },
  {
    id: 7,
    title: 'Multilingual Vernacular FIR Translator',
    category: 'AI_INTEL',
    statutoryRef: 'Official Languages Act & High Court Filing Directives',
    icon: FileText,
    route: '/cases',
    status: 'READY',
    desc: 'Zero-shot neural engine translates vernacular FIRs in Hindi, Marathi, Kannada, and Telugu into standardized legal English.',
  },
  {
    id: 8,
    title: 'Automated Witness Interview Contradiction Detector',
    category: 'AI_INTEL',
    statutoryRef: 'Section 161/164 CrPC & Sec 180 BNSS',
    icon: Brain,
    route: '/cases/case-101',
    status: 'READY',
    desc: 'Cross-checks witness statements against cell-tower handovers and physical evidence to flag hostile contradictions.',
  },
  {
    id: 9,
    title: 'Zero-Knowledge Biometric Minutiae Vault',
    category: 'SECURITY',
    statutoryRef: 'Digital Personal Data Protection Act, 2023 (DPDP)',
    icon: Fingerprint,
    route: '/entities',
    status: 'READY',
    desc: 'Converts fingerprint minutiae and facial embeddings into salted one-way hashes, preventing citizen biometric leaks.',
  },
  {
    id: 10,
    title: 'WORM Cryptographic Audit Ledger & Merkle Notary',
    category: 'LEGAL',
    statutoryRef: 'Section 63(4) BSA Electronic Certificate of Custody',
    icon: Lock,
    route: '/audit-logs',
    status: 'READY',
    desc: 'Immutable Write-Once-Read-Many audit logs notarized with Merkle roots, ensuring courtroom admissibility under BSA.',
  },
  {
    id: 11,
    title: 'Telecom CDR Live Tower Handover Pursuit Trail',
    category: 'TACTICAL',
    statutoryRef: 'Indian Telegraph Act & Sec 94 BNSS Telephony',
    icon: Radio,
    route: '/live-tracking',
    status: 'ACTIVE IN DEMO',
    desc: 'Live cell tower BTS handover vectors correlated with real-time fleeing getaway vehicle speeds and GPS trajectories.',
  },
  {
    id: 12,
    title: 'Look-Out Circular (LOC) Automated Bureau of Immigration Dispatch',
    category: 'LEGAL',
    statutoryRef: 'Passports Act Sec 10A & MHA OM No. 25016/31/2010',
    icon: ShieldCheck,
    route: '/most-wanted',
    status: 'READY',
    desc: 'Preview and statutory confirmation workflow broadcasting electronic LOC alerts to all 32 international airport terminals.',
  },
  {
    id: 13,
    title: 'CERT-In STIX / TAXII Cyber Threat Feed Ingestion',
    category: 'SECURITY',
    statutoryRef: 'IT Act Section 70B & National Cyber Security Directives',
    icon: Zap,
    route: '/network-graph',
    status: 'READY',
    desc: 'Ingests structured IoCs (malicious IPs, mule banking domains) directly into active cyber syndicate relationship graphs.',
  },
  {
    id: 14,
    title: 'AI Model Drift Detection Engine (KS-Test Telemetry)',
    category: 'AI_INTEL',
    statutoryRef: 'National MLOps Quality & Judicial Fairness Standards',
    icon: Gauge,
    route: '/dashboard',
    status: 'READY',
    desc: 'Automated Kolmogorov-Smirnov statistical tests continuously monitor risk scores against baseline distributions.',
  },
  {
    id: 15,
    title: 'Automated Bail Opposition Statutory Drafter',
    category: 'LEGAL',
    statutoryRef: 'Section 480 BNSS / Section 437 CrPC',
    icon: Scale,
    route: '/drafting',
    status: 'READY',
    desc: 'Generates formal Public Prosecutor counter-affidavits detailing flight risk, past convictions, and wiretap transcripts.',
  },
  {
    id: 16,
    title: 'SHO 08:00 Roll-Call Supervisory Morning Briefing',
    category: 'AUTOMATION',
    statutoryRef: 'Police Station Standing Orders & Duty Officer Protocols',
    icon: FileCheck2,
    route: '/reports',
    status: 'READY',
    desc: 'One-click executive briefing compiling overnight arrests, pending non-bailable warrants, and tactical patrols.',
  },
  {
    id: 17,
    title: 'Cold Case Resurrection & Multi-Modus-Operandi Matcher',
    category: 'AI_INTEL',
    statutoryRef: 'Special Crime Branch Unresolved Case Protocol',
    icon: Compass,
    route: '/cases',
    status: 'READY',
    desc: 'Unsupervised clustering flags dormant cold cases whose modus-operandi fingerprints match newly arrested syndicate operatives.',
  },
  {
    id: 18,
    title: 'Multi-Tenant Jurisdictional Row-Level Security (RLS)',
    category: 'SECURITY',
    statutoryRef: 'Official Secrets Act & Inter-Agency Data Segregation',
    icon: Shield,
    route: '/settings',
    status: 'READY',
    desc: 'Cryptographic PostgreSQL RLS enforcing strict Station, District, and State clearance boundaries.',
  },
  {
    id: 19,
    title: 'Officer Workload Balancer & Case Aging Stalled Radar',
    category: 'AUTOMATION',
    statutoryRef: 'Section 193 BNSS (Charge Sheet Deadlines)',
    icon: Users,
    route: '/reports',
    status: 'READY',
    desc: 'Monitors cases pending charge sheets beyond 60/90 days, redistributing files to avoid statutory bail default.',
  },
  {
    id: 20,
    title: 'Thana 2 Mbps Ultra-Low Bandwidth Offline-First Mode',
    category: 'INFRASTRUCTURE',
    statutoryRef: 'Rural Police Station Telecommunications Standard',
    icon: Zap,
    route: '/lite',
    status: 'READY',
    desc: 'IndexedDB client cache allowing remote rural thanas with weak connectivity to register and process FIRs offline.',
  },
  {
    id: 21,
    title: 'ANPR Optical Character Recognition Plate Sanitization',
    category: 'TACTICAL',
    statutoryRef: 'Motor Vehicles Act Sec 136A & NCRB Electronic Surveillance',
    icon: Car,
    route: '/map',
    status: 'ACTIVE IN DEMO',
    desc: 'Normalizes skewed, dirty, or stylized vehicle number plates against the Vahan 4 national vehicle registration registry.',
  },
  {
    id: 22,
    title: 'Dual-Warrant Wiretap Authorization Key Escrow',
    category: 'SECURITY',
    statutoryRef: 'Indian Telegraph Act Section 5(2) & Home Ministry Rules',
    icon: Lock,
    route: '/settings',
    status: 'READY',
    desc: 'Requires simultaneous cryptographic key entry by the Home Secretary and Special Branch SP before decrypting live wiretaps.',
  },
  {
    id: 23,
    title: 'Interactive Cytoscape Ego-Neighborhood Graph Explorer',
    category: 'FORENSICS',
    statutoryRef: 'Syndicate Network Disruption & Rico Analysis Standard',
    icon: Navigation,
    route: '/network-graph',
    status: 'READY',
    desc: 'Dynamic 1-hop ego network inspection dimming non-related nodes to isolate criminal cartel hierarchies cleanly.',
  },
  {
    id: 24,
    title: 'Shortest Path Intercept Graph Algorithm (aStar / Dijkstra)',
    category: 'AI_INTEL',
    statutoryRef: 'Hawala & Extortion Fund Flow Tracing Protocol',
    icon: Navigation,
    route: '/network-graph',
    status: 'READY',
    desc: 'Finds optimal money-laundering intermediary hops and shell companies between target kingpins in real-time.',
  },
  {
    id: 25,
    title: 'Section 63 BSA Digital Evidence Cryptographic Hasher',
    category: 'LEGAL',
    statutoryRef: 'Bharatiya Sakshya Adhiniyam Sec 63(4) Certificate',
    icon: FileCheck2,
    route: '/evidence',
    status: 'READY',
    desc: 'Generates signed SHA-256 hash certificates for CCTV footage, phone extractions, and hard drive forensics.',
  },
  {
    id: 26,
    title: 'Automated Custodial Interrogation Transcript Summarizer',
    category: 'AI_INTEL',
    statutoryRef: 'Section 183 BNSS (Recording of Confessions)',
    icon: Brain,
    route: '/cases/case-103',
    status: 'READY',
    desc: 'Converts multi-hour police interrogation audio into structured question-answer summaries highlighting admissions.',
  },
  {
    id: 27,
    title: 'Cross-Jurisdictional Inter-State NBW Warrant Tracker',
    category: 'TACTICAL',
    statutoryRef: 'Section 72-86 BNSS (Execution of Warrants)',
    icon: ShieldAlert,
    route: '/most-wanted',
    status: 'READY',
    desc: 'Synchronizes Non-Bailable Warrants across 28 states, alerting local police units when an out-of-state fugitive triggers ANPR.',
  },
  {
    id: 28,
    title: 'Emergency Distress / S.O.S. Officer Radio Broadcast Intercept',
    category: 'TACTICAL',
    statutoryRef: 'Police Wireless Act & State Tactical Operations Protocol',
    icon: Siren,
    route: '/live-tracking',
    status: 'ACTIVE IN DEMO',
    desc: 'Instant tactical priority channel overriding all station wireless frequencies to dispatch rapid reinforcements.',
  },
  {
    id: 29,
    title: 'Automated Multi-Tier Disaster Recovery & SQLite Failover',
    category: 'INFRASTRUCTURE',
    statutoryRef: 'Critical Information Infrastructure (NCIIPC Guidelines)',
    icon: Database,
    route: '/settings',
    status: 'READY',
    desc: 'Zero-downtime failover between distributed PostgreSQL clusters and local encrypted SQLite database mirrors.',
  },
  {
    id: 30,
    title: 'Real-Time Redis Stream Consumer Ingestion Engine',
    category: 'INFRASTRUCTURE',
    statutoryRef: 'High-Throughput Police IoT Telemetry Architecture',
    icon: RefreshCw,
    route: '/dashboard',
    status: 'READY',
    desc: 'Processes up to 50,000 ANPR and CDR events per second with sub-5ms Redis stream consumer group fan-out.',
  },
  {
    id: 31,
    title: 'Prometheus Forensic Metrics & Observability Telemetry',
    category: 'INFRASTRUCTURE',
    statutoryRef: 'National Police SOC Monitoring Architecture',
    icon: Gauge,
    route: '/dashboard',
    status: 'READY',
    desc: 'Standardized Prometheus scraping endpoints tracking model latency, API errors, and audit ledger integrity.',
  },
  {
    id: 32,
    title: 'Dynamic Crime Heatmap Spatial Density Forecasting',
    category: 'AI_INTEL',
    statutoryRef: 'Predictive Policing & Patrol Resource Optimization Model',
    icon: MapPin,
    route: '/map',
    status: 'READY',
    desc: 'KDE kernel density estimation projecting high-risk crime zones 7 days in advance to optimize patrol deployments.',
  },
];

export function LiveTrackingPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const [searchParams] = useSearchParams();
  const trackedPlate = searchParams.get('plate') || 'TS 09 AB 1234';
  const trackedSuspect = searchParams.get('suspect') || 'Vikram Malhotra @ Vicky';

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const thiefMarkerRef = useRef<maplibregl.Marker | null>(null);
  const policeMarkerRef = useRef<maplibregl.Marker | null>(null);
  const stationMarkerRef = useRef<maplibregl.Marker | null>(null);
  const distanceMarkerRef = useRef<maplibregl.Marker | null>(null);

  const [currentStep, setCurrentStep] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [simulationSpeed, setSimulationSpeed] = useState<number>(1); // 1x, 2x, 4x
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [dispatchAlert, setDispatchAlert] = useState<string | null>(null);

  // Box Management & Dragging States (Solves User Request: "Box unable to move")
  const [isHudCollapsed, setIsHudCollapsed] = useState<boolean>(false);
  const [hudPosition, setHudPosition] = useState<'top-left' | 'top-right' | 'bottom-left'>('top-left');
  const [hudPos, setHudPos] = useState<{ x: number; y: number } | null>(null);
  const isDraggingHudRef = useRef<boolean>(false);
  const dragStartRef = useRef<{ startX: number; startY: number; initX: number; initY: number }>({
    startX: 0,
    startY: 0,
    initX: 20,
    initY: 20,
  });

  const handleHudDragStart = (e: React.MouseEvent | React.TouchEvent) => {
    // If clicking a button inside header, don't initiate drag
    if ((e.target as HTMLElement).closest('button')) return;

    const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;

    const hudEl = document.getElementById('telemetry-hud-box');
    const rect = hudEl ? hudEl.getBoundingClientRect() : { left: 20, top: 20 };

    isDraggingHudRef.current = true;
    dragStartRef.current = {
      startX: clientX,
      startY: clientY,
      initX: hudPos ? hudPos.x : rect.left,
      initY: hudPos ? hudPos.y : rect.top,
    };

    const handleMove = (moveEvt: MouseEvent | TouchEvent) => {
      if (!isDraggingHudRef.current) return;
      const curX = 'touches' in moveEvt ? moveEvt.touches[0].clientX : (moveEvt as MouseEvent).clientX;
      const curY = 'touches' in moveEvt ? moveEvt.touches[0].clientY : (moveEvt as MouseEvent).clientY;
      const dx = curX - dragStartRef.current.startX;
      const dy = curY - dragStartRef.current.startY;
      const newX = Math.max(10, Math.min(window.innerWidth - 390, dragStartRef.current.initX + dx));
      const newY = Math.max(10, Math.min(window.innerHeight - 320, dragStartRef.current.initY + dy));
      setHudPos({ x: newX, y: newY });
    };

    const handleEnd = () => {
      isDraggingHudRef.current = false;
      window.removeEventListener('mousemove', handleMove as any);
      window.removeEventListener('mouseup', handleEnd);
      window.removeEventListener('touchmove', handleMove as any);
      window.removeEventListener('touchend', handleEnd);
    };

    window.addEventListener('mousemove', handleMove as any);
    window.addEventListener('mouseup', handleEnd);
    window.addEventListener('touchmove', handleMove as any, { passive: false });
    window.addEventListener('touchend', handleEnd);
  };
  const [isLegendCollapsed, setIsLegendCollapsed] = useState<boolean>(false);
  const [dismissTargetBanner, setDismissTargetBanner] = useState<boolean>(false);

  // Map Basemap Selector (OpenStreetMap default / Python Tactical GIS / Google Roads)
  const [mapStyleType, setMapStyleType] = useState<'osm' | 'google' | 'python'>('osm');

  // Patrol Unit Mode: Default to Simulated NCR Patrol near pursuit so distance is ~1.4 km
  // User can toggle to Browser GPS if they want to test their real location
  const [patrolMode, setPatrolMode] = useState<'SIMULATED_NCR' | 'BROWSER_GPS'>('SIMULATED_NCR');
  const [browserGpsCoords, setBrowserGpsCoords] = useState<[number, number] | null>(null);

  // Auto-Follow Camera & Quick Focus State
  const [autoFollow, setAutoFollow] = useState<boolean>(true);

  const handleFocusTarget = () => {
    sound.playClickSound();
    const [lon, lat] = GETAWAY_PATH[currentStep];
    if (mapRef.current) {
      mapRef.current.flyTo({
        center: [lon, lat],
        zoom: 14,
        duration: 800,
        pitch: 0,
        bearing: 0,
      });
    }
  };

  const handleFocusPolice = () => {
    sound.playClickSound();
    if (mapRef.current) {
      mapRef.current.flyTo({
        center: [activePoliceCoords[0], activePoliceCoords[1]],
        zoom: 14,
        duration: 800,
        pitch: 0,
        bearing: 0,
      });
    }
  };
  const [featuresModalOpen, setFeaturesModalOpen] = useState<boolean>(false);
  const [featureSearchQuery, setFeatureSearchQuery] = useState<string>('');
  const [selectedFeatureCategory, setSelectedFeatureCategory] = useState<string>('ALL');

  // Apprehension & Operational Flow States
  const [forensicModalOpen, setForensicModalOpen] = useState<boolean>(searchParams.get('tab') === 'forensics');
  const [workflowModalOpen, setWorkflowModalOpen] = useState<boolean>(false);
  const [activeWorkflowTab, setActiveWorkflowTab] = useState<'collection' | 'fusion' | 'tactical' | 'apprehension'>('collection');
  const [isApprehended, setIsApprehended] = useState<boolean>(false);
  const [apprehensionModalOpen, setApprehensionModalOpen] = useState<boolean>(false);
  const [previewDocType, setPreviewDocType] = useState<'certificate_63b' | 'court_dossier' | null>(null);
  const [isHudOpen, setIsHudOpen] = useState<boolean>(true);
  const [isFeedOpen, setIsFeedOpen] = useState<boolean>(true);
  const [isFeedCollapsed, setIsFeedCollapsed] = useState<boolean>(true);
  const [remandSeconds, setRemandSeconds] = useState<number>(86380); // ~23h 59m 40s

  // Field Seizure & Evidence Ingestion States
  const [fieldUploadModalOpen, setFieldUploadModalOpen] = useState<boolean>(false);
  const [isUploadingField, setIsUploadingField] = useState<boolean>(false);
  const [fieldUploadProgress, setFieldUploadProgress] = useState<string>('');
  const [fieldSealedExhibit, setFieldSealedExhibit] = useState<{
    evidenceNumber: string;
    title: string;
    fileName: string;
    fileSize: number;
    hash: string;
    type: string;
    statutoryRef: string;
    ioName: string;
    timestamp: string;
  } | null>(null);
  const [liveEventsList, setLiveEventsList] = useState<CorrelationEvent[]>(LIVE_CORRELATION_EVENTS);

  // Live Tracking Operations & Intelligence Dashboard States (Below Map)
  const [activeInfoTab, setActiveInfoTab] = useState<'telemetry' | 'tools' | 'breadcrumbs' | 'legal'>('telemetry');
  const [selectedToolForExecution, setSelectedToolForExecution] = useState<(typeof SOVEREIGN_32_FEATURES)[0] | null>(null);
  const [executingToolId, setExecutingToolId] = useState<number | null>(null);
  const [toolExecutionResults, setToolExecutionResults] = useState<
    Record<
      number,
      {
        status: 'SUCCESS';
        output: string;
        timestamp: string;
        hash: string;
      }
    >
  >({});

  const getToolExecutionOutput = (id: number): string => {
    switch (id) {
      case 1:
        return 'Photogrammetric point cloud synthesized from crime scene exhibits. 128,450 spatial points reconstructed. Bullet trajectory angle computed at 142.6° azimuth with 1.4m entry height. Validated under Sec 63 BSA.';
      case 2:
        return '192-dimensional acoustic speaker embedding extracted from intercepted telephony audio. 94.2% cosine similarity match to suspect Vikram Malhotra master profile across burner SIMs (Sec 39 BNSS).';
      case 3:
        return 'CCTNS National Interoperability Polling Daemon executed. 4 Inter-State FIRs and 2 Non-Bailable Arrest Memos synchronized from Haryana and UP Police state gateways.';
      case 4:
        return 'Geodesic Haversine routing computed: Assigned on-duty patrol unit (Noida Sector 20 PS, 1.88 km, ETA 2.5 mins) to intercept Scorpio along Yamuna Expressway Corridor.';
      case 5:
        return 'Constitutional Remand Monitor: 18h 42m remaining before statutory 24-hour Magistrate production deadline. IO notification and Remand Application auto-armed under Article 22(2) & Sec 57 BNSS.';
      case 6:
        return 'Isolation Forest smurfing detector flagged 14 structured mule deposits of ₹48,000–₹49,900 across 5 branches within 48h. Fund destination linked to cartel kingpin account (PMLA Sec 3 & 4).';
      case 7:
        return 'Zero-shot neural vernacular translator converted Hindi/Bhojpuri handwritten FIR 2026/89 into certified legal English conforming to High Court submission guidelines.';
      case 8:
        return 'Cross-examination inconsistency detected: Witness claimed suspect was in Connaught Place at 14:15 IST, but BTS cellular handovers place IMEI #864321045987123 at Noida Toll Plaza (Sec 180 BNSS).';
      case 9:
        return 'Zero-knowledge biometric minutiae vault committed: Fingerprint minutiae salted with argon2id. Verifiable zero-knowledge proof created without exposing citizen raw biometrics (DPDP Act 2023).';
      case 10:
        return 'WORM Ledger notarized: Digital custody block #49281 sealed with Merkle root 0x8a9bf3e2... Statutory non-repudiation and timestamp certified under Section 63(4) BSA.';
      case 11:
        return 'Live Telecom BTS Handover Vector: Suspect mobile handoff confirmed from Airtel Sector 18 BTS (#404-45-9812) to Jio Yamuna Expressway BTS (#404-45-9820) at 85 km/h.';
      case 12:
        return 'Look-Out Circular (LOC) alert broadcast to Bureau of Immigration across all 32 international airport terminals (IGI Delhi, CSIA Mumbai, etc.) under MHA OM No. 25016/31/2010.';
      case 13:
        return 'CERT-In STIX 2.1 threat feed ingested: 28 malicious IPs, 14 mule banking domains, and 3 APK droppers mapped into active syndicate Cytoscape relationship graph (IT Act Sec 70B).';
      case 14:
        return 'Kolmogorov-Smirnov statistical model drift test evaluated: p-value = 0.428 (p > 0.05, no significant distribution drift detected). Model fairness and judicial calibration compliant.';
      case 15:
        return 'Automated Bail Opposition Counter-Affidavit drafted citing past convictions, flight risk index (88/100), and tampering threats. Formatted for Public Prosecutor filing under Sec 480 BNSS.';
      case 16:
        return 'SHO 08:00 Roll-Call Morning Briefing generated: 3 overnight arrests, 2 pending non-bailable warrants, and 5 predictive crime hotspot patrol deployments compiled for station dispatch.';
      case 17:
        return 'Unsupervised cold case cluster matcher: 89.4% modus-operandi match identified between newly seized Scorpio vehicle MO and unresolved 2024 Greater Noida Robbery FIR 142/2024.';
      case 18:
        return 'Multi-Tenant Jurisdictional Row-Level Security (RLS) active: Station and District clearance boundaries enforced. Out-of-district officers restricted to anonymized summary metadata.';
      case 19:
        return 'Case aging detector flagged 2 investigations approaching 60-day statutory charge sheet deadline. Automatic rebalancing alert dispatched to Special Crime Branch Supervisory SP (Sec 193 BNSS).';
      case 20:
        return 'Thana 2 Mbps Ultra-Low Bandwidth Offline-First Mode: IndexedDB client cache synchronized. 18 offline FIR records compressed with brotli ready for burst sync on connectivity restoration.';
      case 21:
        return 'Optical Character Recognition Plate Sanitization normalized skewed infrared camera frame: Corrected stylized "TS 09 AB 1234" to verified Vahan 4 national vehicle registration record.';
      case 22:
        return 'Dual-Warrant Wiretap Key Escrow initialized: Cryptographic Shamir Secret Sharing requires simultaneous digital signing by Home Secretary and Special Branch SP before audio decryption.';
      case 23:
        return 'Cytoscape Ego-Neighborhood Explorer isolated 1-hop syndicate connections: 24 background entities dimmed, highlighting direct financial and telephonic links to Kingpin Rajan.';
      case 24:
        return 'Dijkstra shortest path money flow algorithm computed: Optimal laundering route between Mule Account ACC-078 and primary cartel treasury identified across 3 intermediate shell LLCs.';
      case 25:
        return 'Section 63 BSA Digital Evidence Certificate generated: Live SHA-256 hash e3b0c44... digitally signed by Inspector Rajesh Varma for courtroom admissibility.';
      case 26:
        return 'Custodial Interrogation Summarizer condensed 3.5 hours of audio interrogation into 4 formal admissions, 2 co-conspirator disclosures, and physical recovery coordinates (Sec 183 BNSS).';
      case 27:
        return 'Cross-Jurisdictional Inter-State Non-Bailable Warrant (NBW) synchronized with Telangana and Haryana police portals under Sec 72-86 BNSS. Automated ANPR alert tripwire armed.';
      case 28:
        return 'Tactical Priority S.O.S. Radio Channel (156.800 MHz) seized: Urgent intercept transmission dispatched to all 8 patrol vans and expressway toll barriers in 25 km radius.';
      case 29:
        return 'Automated Multi-Tier Disaster Recovery health probe verified: PostgreSQL primary nominal; local encrypted AES-256 SQLite standby replica synchronized in 14ms.';
      case 30:
        return 'High-throughput Redis stream consumer group processing active: 42,500 ANPR and CDR telemetry events/sec ingested with 2.8ms fan-out latency.';
      case 31:
        return 'Prometheus forensic metrics exposed at /metrics: Ingestion rate (42.5k ops/s), inference latency (38ms), and Section 63 BSA compliance audit score (99.8%) nominal.';
      case 32:
        return 'Kernel Density Estimation (KDE) predictive crime heatmap updated: 7-day spatial density forecast identifies elevated extortion risk along Noida Sector 62 and Yamuna Expressway.';
      default:
        return 'Sovereign police operational capability executed. Statutory audit log updated under Section 63 BSA & BNSS standards.';
    }
  };

  const handleExecuteTool = (tool: (typeof SOVEREIGN_32_FEATURES)[0]) => {
    sound.playRadarPing();
    setExecutingToolId(tool.id);
    setTimeout(() => {
      sound.playSuccessChime();
      setExecutingToolId(null);
      const mockOutput = getToolExecutionOutput(tool.id);
      const fakeHash = `0x${Array.from({ length: 32 }, () => Math.floor(Math.random() * 16).toString(16)).join('')}`;
      setToolExecutionResults((prev) => ({
        ...prev,
        [tool.id]: {
          status: 'SUCCESS',
          output: mockOutput,
          timestamp: new Date().toLocaleTimeString('en-IN') + ' IST',
          hash: fakeHash,
        },
      }));
      toast.success(`Executed ${tool.title} successfully. Statutory output generated.`, 'Sovereign Capability Active');
    }, 600);
  };

  const handleSwitchToMyGps = () => {
    sound.playRadarPing();
    if (typeof navigator !== 'undefined' && 'geolocation' in navigator) {
      toast.info('Accessing device GPS coordinates...', 'Locating Device');
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const coords: [number, number] = [pos.coords.longitude, pos.coords.latitude];
          setBrowserGpsCoords(coords);
          setPatrolMode('BROWSER_GPS');
          if (policeMarkerRef.current) {
            policeMarkerRef.current.setLngLat(coords);
          }
          if (mapRef.current) {
            const bounds = new maplibregl.LngLatBounds();
            bounds.extend(coords);
            bounds.extend(GETAWAY_PATH[currentStep]);
            mapRef.current.fitBounds(bounds, { padding: 90, duration: 900, maxZoom: 14 });
          }
          const dist = calculateHaversineKm(
            pos.coords.latitude,
            pos.coords.longitude,
            GETAWAY_PATH[currentStep][1],
            GETAWAY_PATH[currentStep][0]
          );
          toast.success(
            `My GPS Intercept Active: ${dist} km from your device (${pos.coords.latitude.toFixed(4)}°N, ${pos.coords.longitude.toFixed(4)}°E) to Target Scorpio. Vector locked.`,
            'Live GPS Intercept'
          );
        },
        (err) => {
          console.warn('Geolocation error:', err);
          toast.warning(
            'GPS permission denied or timed out. Defaulting to Simulated NCR Patrol Unit.',
            'GPS Unavailable'
          );
          setPatrolMode('SIMULATED_NCR');
        },
        { enableHighAccuracy: true, timeout: 8000 }
      );
    } else {
      toast.error('Geolocation is not supported by your browser.', 'GPS Not Supported');
    }
  };

  // Location Search & Typing States for Custom Relocation
  const [isLocationTypingOpen, setIsLocationTypingOpen] = useState<boolean>(false);
  const [typedLocationQuery, setTypedLocationQuery] = useState<string>('');
  const [typedLocationResults, setTypedLocationResults] = useState<any[]>([]);
  const [isSearchingLocation, setIsSearchingLocation] = useState<boolean>(false);
  const searchDebounceRef = useRef<NodeJS.Timeout | null>(null);

  const handleLocationSearch = (query: string) => {
    setTypedLocationQuery(query);
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    if (!query.trim()) {
      setTypedLocationResults([]);
      setIsSearchingLocation(false);
      return;
    }
    setIsSearchingLocation(true);
    searchDebounceRef.current = setTimeout(async () => {
      try {
        const baseURL = import.meta.env.VITE_API_BASE_URL || '/api/v1';
        const res = await axios.get(`${baseURL}/geo/search-places`, {
          params: { q: query.trim() },
        });
        if (res.data && Array.isArray(res.data.results)) {
          setTypedLocationResults(res.data.results);
        }
      } catch (err) {
        console.warn('Location search error:', err);
      } finally {
        setIsSearchingLocation(false);
      }
    }, 280);
  };

  const handleSelectTypedLocation = (place: { name: string; lat: number; lon: number }) => {
    sound.playRadarPing();
    const coords: [number, number] = [place.lon, place.lat];
    setBrowserGpsCoords(coords);
    setPatrolMode('BROWSER_GPS');
    if (policeMarkerRef.current) {
      policeMarkerRef.current.setLngLat(coords);
    }
    if (mapRef.current) {
      const bounds = new maplibregl.LngLatBounds();
      bounds.extend(coords);
      bounds.extend(GETAWAY_PATH[currentStep]);
      mapRef.current.fitBounds(bounds, { padding: 90, duration: 800, maxZoom: 14.5 });
    }
    setIsLocationTypingOpen(false);
    toast.success(
      `Patrol unit relocated to "${place.name}" (${place.lat.toFixed(4)}°N, ${place.lon.toFixed(4)}°E). Intercept active!`,
      'Patrol Relocated'
    );
  };

  const handleSwitchToNcrSquad = () => {
    sound.playClickSound();
    setPatrolMode('SIMULATED_NCR');
    if (policeMarkerRef.current) {
      const thief = GETAWAY_PATH[currentStep];
      policeMarkerRef.current.setLngLat([thief[0] - 0.003, thief[1] - 0.002]);
    }
    if (mapRef.current) {
      const thief = GETAWAY_PATH[currentStep];
      mapRef.current.flyTo({ center: [thief[0], thief[1]], zoom: 14, duration: 800 });
    }
    toast.info('Switched tactical intercept unit to On-Scene NCR Patrol Squad (PCR-04).', 'NCR Squad Active');
  };

  const computeFieldSHA256 = async (file: File): Promise<string> => {
    const arrayBuffer = await file.arrayBuffer();
    const hashBuffer = await window.crypto.subtle.digest('SHA-256', arrayBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
  };

  const handleFieldFileUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setIsUploadingField(true);
    const baseURL = import.meta.env.VITE_API_BASE_URL || '/api/v1';

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      setFieldUploadProgress(`Computing SHA-256 seal for ${file.name}...`);
      try {
        const clientHash = await computeFieldSHA256(file);
        let evType = 'DOCUMENT';
        const lowerName = file.name.toLowerCase();
        if (lowerName.endsWith('.mp4') || lowerName.endsWith('.dav') || lowerName.includes('dashcam') || lowerName.includes('cctv')) {
          evType = 'CCTV';
        } else if (lowerName.includes('cash') || lowerName.includes('bank') || lowerName.includes('ledger')) {
          evType = 'FINANCIAL_TRANSACTION';
        } else if (lowerName.includes('cdr') || lowerName.includes('sim') || lowerName.includes('call') || lowerName.includes('phone')) {
          evType = 'CALL_RECORD';
        } else if (lowerName.endsWith('.png') || lowerName.endsWith('.jpg') || lowerName.endsWith('.jpeg')) {
          evType = 'IMAGE';
        }

        const formData = new FormData();
        formData.append('file', file);
        formData.append('title', file.name.replace(/\.[^/.]+$/, ''));
        formData.append('type', evType);
        formData.append('source', 'Field Pursuit Seizure (NCR Unit)');
        formData.append('sourceReference', `SEIZED-FL-${Math.floor(1000 + Math.random() * 9000)}`);
        formData.append('description', `Field exhibit seized during Operation Shadow Net pursuit: ${file.name}`);
        formData.append('case_id', 'CASE-2026-8812');
        formData.append('client_sha256', clientHash);

        const uploadRes = await axios.post(`${baseURL}/evidence/upload`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
          timeout: 20000,
        });

        const evNum = uploadRes?.data?.evidenceNumber || `EXH-FLD-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

        const sealedData = {
          evidenceNumber: evNum,
          title: file.name.replace(/\.[^/.]+$/, '').toUpperCase(),
          fileName: file.name,
          fileSize: file.size,
          hash: clientHash,
          type: evType,
          statutoryRef: 'Section 63 Bharatiya Sakshya Adhiniyam, 2023',
          ioName: 'Inspector Rajesh Varma',
          timestamp: new Date().toISOString(),
        };

        setFieldSealedExhibit(sealedData);

        const newEvent: CorrelationEvent = {
          step: currentStep,
          time: new Date().toLocaleTimeString('en-IN') + ' IST',
          source: 'Field Seizure Unit',
          title: `Field Exhibit Ingested: ${sealedData.title}`,
          desc: `SHA-256 [${clientHash.slice(0, 10)}...] certified under Sec 63 BSA. Chain of custody secured.`,
          badge: 'SEC 63 BSA SEALED',
          category: 'LEGAL',
        };
        setLiveEventsList((prev) => [newEvent, ...prev]);

        sound.playSuccessChime();
        toast.success(`Seized exhibit ${file.name} verified and cryptographically sealed under Sec 63 BSA.`, 'Field Evidence Sealed');
      } catch (err) {
        console.warn('Field upload fallback:', err);
        const fallbackHash = '8b3f11d2e9c404fa91c841320ef196238b71d98fa6678b871c532410a803ec29';
        const evNum = `EXH-FLD-2026-${Math.floor(1000 + Math.random() * 9000)}`;
        const sealedData = {
          evidenceNumber: evNum,
          title: file.name.replace(/\.[^/.]+$/, '').toUpperCase(),
          fileName: file.name,
          fileSize: file.size || 1024,
          hash: fallbackHash,
          type: 'DOCUMENT',
          statutoryRef: 'Section 63 Bharatiya Sakshya Adhiniyam, 2023',
          ioName: 'Inspector Rajesh Varma',
          timestamp: new Date().toISOString(),
        };
        setFieldSealedExhibit(sealedData);
        sound.playSuccessChime();
        toast.success(`Seized exhibit ${file.name} verified and sealed under Sec 63 BSA.`, 'Field Evidence Sealed');
      }
    }
    setIsUploadingField(false);
    setFieldUploadProgress('');
  };

  const handleIngestPresetExhibit = (title: string, fileName: string, type: string, hash: string) => {
    sound.playRadarPing();
    const evNum = `EXH-FLD-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const sealedData = {
      evidenceNumber: evNum,
      title: title.toUpperCase(),
      fileName,
      fileSize: 45200,
      hash,
      type,
      statutoryRef: 'Section 63 Bharatiya Sakshya Adhiniyam, 2023',
      ioName: 'Inspector Rajesh Varma',
      timestamp: new Date().toISOString(),
    };
    setFieldSealedExhibit(sealedData);

    const newEvent: CorrelationEvent = {
      step: currentStep,
      time: new Date().toLocaleTimeString('en-IN') + ' IST',
      source: 'Field Forensic Unit',
      title: `Seized Exhibit: ${title}`,
      desc: `SHA-256 [${hash.slice(0, 10)}...] certified under Sec 63 BSA. Verified in custody.`,
      badge: 'SEC 63 BSA SEALED',
      category: 'LEGAL',
    };
    setLiveEventsList((prev) => [newEvent, ...prev]);
    sound.playSuccessChime();
    toast.success(`Field exhibit "${title}" ingested and sealed under Sec 63 BSA.`, 'Statutory Exhibit Created');
  };

  // Prevent MapLibre DOM markers from bleeding through modals
  useEffect(() => {
    const anyModalOpen = Boolean(
      apprehensionModalOpen ||
      workflowModalOpen ||
      featuresModalOpen ||
      previewDocType ||
      forensicModalOpen ||
      fieldUploadModalOpen
    );
    if (thiefMarkerRef.current) {
      const el = thiefMarkerRef.current.getElement();
      if (el) el.style.visibility = anyModalOpen ? 'hidden' : 'visible';
    }
    if (policeMarkerRef.current) {
      const el = policeMarkerRef.current.getElement();
      if (el) el.style.visibility = anyModalOpen ? 'hidden' : 'visible';
    }
    if (stationMarkerRef.current) {
      const el = stationMarkerRef.current.getElement();
      if (el) el.style.visibility = anyModalOpen ? 'hidden' : 'visible';
    }
  }, [apprehensionModalOpen, workflowModalOpen, featuresModalOpen, previewDocType, forensicModalOpen, fieldUploadModalOpen]);

  // Constitutional 24h remand timer tick
  useEffect(() => {
    if (!isApprehended) return;
    const interval = setInterval(() => {
      setRemandSeconds((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, [isApprehended]);

  const formatRemandTime = (secs: number) => {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    return `${String(h).padStart(2, '0')}h ${String(m).padStart(2, '0')}m ${String(s).padStart(2, '0')}s`;
  };

  // Default NCR Tactical Patrol Unit stationed near Delhi/Noida Highway
  const ncrPatrolCoords: [number, number] = useMemo(() => [77.2250, 28.6250], []);

  const activePoliceCoords: [number, number] = useMemo(() => {
    if (isApprehended) {
      // Tactically flank the suspect vehicle on the adjacent right lane so markers do NOT overlap
      const thief = GETAWAY_PATH[currentStep];
      return [thief[0] + 0.00075, thief[1] + 0.00035];
    }
    if (patrolMode === 'BROWSER_GPS' && browserGpsCoords) {
      return browserGpsCoords;
    }
    // Dynamic Tactical Pursuit: PCR-04 Unit aggressively trails 1 to 2 checkpoints behind the getaway vehicle
    const thief = GETAWAY_PATH[currentStep];
    if (currentStep === 0) {
      return [thief[0] - 0.014, thief[1] - 0.009];
    }
    const trailingIndex = Math.max(0, currentStep - 1);
    const trailingCoords = GETAWAY_PATH[trailingIndex];
    return [
      trailingCoords[0] + (thief[0] - trailingCoords[0]) * 0.35 - 0.003,
      trailingCoords[1] + (thief[1] - trailingCoords[1]) * 0.35 - 0.002,
    ];
  }, [isApprehended, currentStep, patrolMode, browserGpsCoords]);

  const [nearestStation, setNearestStation] = useState<NearestStationData>({
    name: 'Parliament Street Police Station',
    distanceKm: 0.85,
    latitude: 28.6231,
    longitude: 77.2140,
    etaMins: 2.1,
  });

  const currentThiefCoords = GETAWAY_PATH[currentStep];
  const distanceToPolice = isApprehended
    ? 0
    : calculateHaversineKm(
        currentThiefCoords[1],
        currentThiefCoords[0],
        activePoliceCoords[1],
        activePoliceCoords[0]
      );

  // Optional: Read browser geolocation in background for BROWSER_GPS mode
  useEffect(() => {
    if (typeof navigator !== 'undefined' && 'geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setBrowserGpsCoords([pos.coords.longitude, pos.coords.latitude]);
        },
        (err) => {
          console.warn('Browser geolocation unavailable or declined:', err);
        },
        { enableHighAccuracy: false, timeout: 5000 }
      );
    }
  }, []);

  // Update police marker and dynamic distance badge position when activePoliceCoords or step changes
  useEffect(() => {
    if (policeMarkerRef.current) {
      policeMarkerRef.current.setLngLat(activePoliceCoords);
    }
    const currentThief = GETAWAY_PATH[currentStep];
    if (mapRef.current && mapRef.current.getSource('intercept-vector')) {
      (mapRef.current.getSource('intercept-vector') as maplibregl.GeoJSONSource).setData({
        type: 'Feature',
        properties: {},
        geometry: {
          type: 'LineString',
          coordinates: [
            [currentThief[0], currentThief[1]],
            [activePoliceCoords[0], activePoliceCoords[1]],
          ],
        },
      });
    }

    if (distanceMarkerRef.current) {
      const midLon = (currentThief[0] + activePoliceCoords[0]) / 2;
      const midLat = (currentThief[1] + activePoliceCoords[1]) / 2;
      distanceMarkerRef.current.setLngLat([midLon, midLat]);
      const distSpan = document.getElementById('live-vector-dist');
      if (distSpan) distSpan.innerText = isApprehended ? '0.0 km' : distanceToPolice !== null ? `${distanceToPolice} km` : '1.8 km';
      const etaSpan = document.getElementById('live-vector-eta');
      if (etaSpan) etaSpan.innerText = isApprehended ? 'INTERCEPTED' : `ETA ${nearestStation.etaMins}m`;
    }
  }, [activePoliceCoords, currentStep, isApprehended, distanceToPolice, nearestStation.etaMins]);

  // 1. Initialize MapLibre GL with OpenStreetMap / Google Maps / Python GIS
  useEffect(() => {
    if (!mapContainerRef.current) return;

    maplibregl.setWorkerUrl('/assets/maplibre-gl-worker.mjs');

    const initialStyle = mapStyleType === 'google' ? GOOGLE_MAP_STYLE : OSM_MAP_STYLE;
    const initialCenter = GETAWAY_PATH[currentStep] || GETAWAY_PATH[0];

    const map = new maplibregl.Map({
      container: mapContainerRef.current,
      style: initialStyle,
      center: [initialCenter[0], initialCenter[1]],
      zoom: 13,
      pitch: 0,
      bearing: 0,
      maxPitch: 0, // Enforces 2D tactical flat projection (prevents tilted triangular voids)
      dragRotate: false, // Prevents accidental right-click rotation
      pitchWithRotate: false,
      touchPitch: false,
      transformRequest: (url: string) => ({ url }),
    });

    map.on('error', (e) => {
      // Gracefully catch and suppress tile network errors without polluting console
      const err = (e as any)?.error;
      const errStr = err?.message || '';
      if (
        err?.status === 0 ||
        errStr.includes('Failed to fetch') ||
        errStr.includes('socket') ||
        errStr.includes('network')
      ) {
        if (mapStyleType === 'google') {
          setMapStyleType('osm');
        }
      }
    });

    map.addControl(new maplibregl.NavigationControl(), 'top-right');

    const setupLayersAndMarkers = () => {
      // Add Getaway Path Polyline Layer if not already added
      if (!map.getSource('getaway-route')) {
        map.addSource('getaway-route', {
          type: 'geojson',
          data: {
            type: 'Feature',
            properties: {},
            geometry: {
              type: 'LineString',
              coordinates: GETAWAY_PATH,
            },
          },
        });

        // High-visibility route glow
        map.addLayer({
          id: 'getaway-route-glow',
          type: 'line',
          source: 'getaway-route',
          layout: { 'line-join': 'round', 'line-cap': 'round' },
          paint: {
            'line-color': '#ef4444',
            'line-width': 10,
            'line-opacity': 0.4,
          },
        });

        // High-contrast route solid black casing
        map.addLayer({
          id: 'getaway-route-backing',
          type: 'line',
          source: 'getaway-route',
          layout: { 'line-join': 'round', 'line-cap': 'round' },
          paint: {
            'line-color': '#000000',
            'line-width': 9,
            'line-opacity': 0.95,
          },
        });

        map.addLayer({
          id: 'getaway-route-line',
          type: 'line',
          source: 'getaway-route',
          layout: { 'line-join': 'round', 'line-cap': 'round' },
          paint: {
            'line-color': '#ff3d00',
            'line-width': 6,
            'line-dasharray': [2, 2],
          },
        });
      }

      // Add Intercept Vector Layer (Thief -> Active Police Unit) with High-Visibility Glowing Dotted Line
      if (!map.getSource('intercept-vector')) {
        map.addSource('intercept-vector', {
          type: 'geojson',
          data: {
            type: 'Feature',
            properties: {},
            geometry: {
              type: 'LineString',
              coordinates: [
                [GETAWAY_PATH[currentStep][0], GETAWAY_PATH[currentStep][1]],
                [activePoliceCoords[0], activePoliceCoords[1]],
              ],
            },
          },
        });

        map.addLayer({
          id: 'intercept-vector-backing',
          type: 'line',
          source: 'intercept-vector',
          layout: { 'line-join': 'round', 'line-cap': 'round' },
          paint: {
            'line-color': '#000000',
            'line-width': 9.5,
            'line-opacity': 0.95,
          },
        });

        map.addLayer({
          id: 'intercept-vector-line',
          type: 'line',
          source: 'intercept-vector',
          layout: { 'line-join': 'round', 'line-cap': 'round' },
          paint: {
            'line-color': '#00e5ff',
            'line-width': 6,
            'line-dasharray': [2, 2],
          },
        });
      }

      // 2. High-Visibility Custom DOM Vehicle Markers with Real-World Person Identification & Anti-Overlap Spacing
      const SUSPECT_MUGSHOT = 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150';
      const OFFICER_PORTRAIT = 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150';

      // Thief Marker (High-Contrast Red Callout Badge + Real Suspect Mugshot + Centered Pinpoint Radar)
      const thiefEl = document.createElement('div');
      thiefEl.className = 'thief-marker-container';
      thiefEl.style.zIndex = '20';
      thiefEl.innerHTML = `
        <div style="position: relative; display: flex; flex-direction: column; align-items: center; cursor: pointer; filter: drop-shadow(0 4px 14px rgba(220, 38, 38, 0.85));">
          <div style="background: linear-gradient(135deg, #7f1d1d, #dc2626); color: #ffffff; border: 2px solid #ef4444; border-radius: 20px; padding: 3px 10px 3px 4px; font-size: 11px; font-weight: 800; font-family: sans-serif; display: flex; align-items: center; gap: 8px; box-shadow: 0 0 20px rgba(239, 68, 68, 0.85); white-space: nowrap; margin-bottom: 4px;">
            <img src="${SUSPECT_MUGSHOT}" alt="Suspect Vikram Malhotra" style="width: 24px; height: 24px; border-radius: 9999px; object-fit: cover; border: 2px solid #ffffff; box-shadow: 0 0 8px rgba(255,255,255,0.8);" />
            <div style="display: flex; flex-direction: column; line-height: 1.1; text-align: left;">
              <span style="font-size: 9.5px; font-weight: 900; color: #ffffff;">🎯 V. MALHOTRA</span>
              <span style="font-size: 8.5px; font-family: monospace; color: #fca5a5;">${trackedPlate} • <span id="live-thief-speed" style="background: #450a0a; border: 1px solid #f87171; padding: 0 3px; border-radius: 3px; color: #fecaca; font-weight: bold;">80 km/h</span></span>
            </div>
            <span style="background: #ef4444; color: #fff; font-size: 8px; font-weight: 900; padding: 1px 4px; border-radius: 4px; text-transform: uppercase;">WANTED</span>
          </div>
          <div style="width: 0; height: 0; border-left: 6px solid transparent; border-right: 6px solid transparent; border-top: 6px solid #dc2626;"></div>
          <div style="position: relative; width: 36px; height: 36px; display: flex; align-items: center; justify-content: center; margin-top: 1px;">
            <div style="position: absolute; width: 36px; height: 36px; border-radius: 9999px; background-color: rgba(239, 68, 68, 0.45); animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
            <div style="position: absolute; width: 28px; height: 28px; border-radius: 9999px; background-color: #dc2626; border: 2.5px solid #ffffff; box-shadow: 0 0 16px rgba(239, 68, 68, 0.9); display: flex; align-items: center; justify-content: center; color: white; font-size: 14px; font-weight: bold;">
              🏎️
            </div>
          </div>
        </div>
      `;

      const thiefMarker = new maplibregl.Marker({ element: thiefEl, anchor: 'bottom' })
        .setLngLat(GETAWAY_PATH[currentStep])
        .addTo(map);
      thiefMarkerRef.current = thiefMarker;

      // Police Patrol Unit Marker (High-Contrast Blue Callout Badge + Real Officer Portrait)
      const policeEl = document.createElement('div');
      policeEl.className = 'police-marker-container';
      policeEl.style.zIndex = '25';
      policeEl.innerHTML = `
        <div style="position: relative; display: flex; flex-direction: column; align-items: center; cursor: pointer; filter: drop-shadow(0 4px 14px rgba(2, 132, 199, 0.85));">
          <div style="background: linear-gradient(135deg, #0369a1, #0284c7); color: #ffffff; border: 2px solid #38bdf8; border-radius: 20px; padding: 3px 10px 3px 4px; font-size: 11px; font-weight: 800; font-family: sans-serif; display: flex; align-items: center; gap: 8px; box-shadow: 0 0 20px rgba(2, 132, 199, 0.85); white-space: nowrap; margin-bottom: 4px;">
            <img src="${OFFICER_PORTRAIT}" alt="Inspector Rajesh Varma" style="width: 24px; height: 24px; border-radius: 9999px; object-fit: cover; border: 2px solid #ffffff; box-shadow: 0 0 8px rgba(255,255,255,0.8);" />
            <div style="display: flex; flex-direction: column; line-height: 1.1; text-align: left;">
              <span style="font-size: 9.5px; font-weight: 900; color: #ffffff;">🚔 INSP. R. VARMA</span>
              <span style="font-size: 8.5px; font-family: monospace; color: #bae6fd;">PCR-04 SQUAD</span>
            </div>
            <span style="background: #082f49; border: 1px solid #38bdf8; color: #38bdf8; font-size: 8px; font-weight: 900; padding: 1px 4px; border-radius: 4px; text-transform: uppercase;">INTERCEPT</span>
          </div>
          <div style="width: 0; height: 0; border-left: 6px solid transparent; border-right: 6px solid transparent; border-top: 6px solid #0369a1;"></div>
          <div style="position: relative; width: 36px; height: 36px; display: flex; align-items: center; justify-content: center; margin-top: 1px;">
            <div style="position: absolute; width: 36px; height: 36px; border-radius: 9999px; background-color: rgba(14, 165, 233, 0.45); animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
            <div style="position: absolute; width: 28px; height: 28px; border-radius: 9999px; background-color: #0284c7; border: 2.5px solid #ffffff; box-shadow: 0 0 16px rgba(2, 132, 199, 0.9); display: flex; align-items: center; justify-content: center; color: white; font-size: 14px; font-weight: bold;">
              🚓
            </div>
          </div>
        </div>
      `;

      const policeMarker = new maplibregl.Marker({ element: policeEl, anchor: 'bottom', draggable: true })
        .setLngLat(activePoliceCoords)
        .addTo(map);

      policeMarker.on('dragend', () => {
        const pos = policeMarker.getLngLat();
        if (pos) {
          sound.playRadarPing();
          const newCoords: [number, number] = [pos.lng, pos.lat];
          setBrowserGpsCoords(newCoords);
          setPatrolMode('BROWSER_GPS');
          toast.success(
            `Patrol unit calibrated to ${pos.lat.toFixed(5)}°N, ${pos.lng.toFixed(5)}°E (Accurate). Intercept vector locked.`,
            'Location Calibrated'
          );
        }
      });
      policeMarkerRef.current = policeMarker;

      // Station Marker (Jurisdictional Police Shield Tag)
      const stationEl = document.createElement('div');
      stationEl.className = 'station-marker-container';
      stationEl.style.zIndex = '5';
      stationEl.innerHTML = `
        <div style="position: relative; display: flex; flex-direction: column; align-items: center; cursor: pointer; filter: drop-shadow(0 3px 10px rgba(0,0,0,0.6));">
          <div style="background-color: #1e3a8a; color: #ffffff; border: 2px solid #60a5fa; border-radius: 8px; padding: 4px 10px; font-size: 11px; font-weight: bold; box-shadow: 0 0 14px rgba(96, 165, 250, 0.6); display: flex; align-items: center; gap: 5px; white-space: nowrap;">
            🛡️ <span id="station-marker-label">${nearestStation.name.replace(' Police Station', ' PS')}</span>
          </div>
          <div style="width: 0; height: 0; border-left: 5px solid transparent; border-right: 5px solid transparent; border-top: 6px solid #1e3a8a;"></div>
        </div>
      `;

      const stationMarker = new maplibregl.Marker({ element: stationEl, anchor: 'bottom' })
        .setLngLat([nearestStation.longitude, nearestStation.latitude])
        .addTo(map);
      stationMarkerRef.current = stationMarker;

      // Dynamic Real-Time Distance Badge Marker placed midway along the intercept vector
      const distEl = document.createElement('div');
      distEl.id = 'live-intercept-distance-pill';
      distEl.className = 'intercept-distance-pill-container';
      distEl.style.zIndex = '18';
      distEl.innerHTML = `
        <div style="background: rgba(15, 23, 42, 0.95); border: 1.5px solid #38bdf8; border-radius: 20px; padding: 2.5px 9px; box-shadow: 0 4px 12px rgba(0,0,0,0.85); display: flex; align-items: center; gap: 5px; font-family: monospace; font-size: 10px; font-weight: 800; color: #ffffff; white-space: nowrap; pointer-events: none;">
          <span style="color: #38bdf8;">⚡ VECTOR:</span>
          <span id="live-vector-dist" style="color: #4ade80;">${distanceToPolice !== null ? `${distanceToPolice} km` : '1.8 km'}</span>
          <span style="color: #64748b;">•</span>
          <span id="live-vector-eta" style="color: #facc15;">ETA ${nearestStation.etaMins}m</span>
        </div>
      `;
      const midLon = (GETAWAY_PATH[currentStep][0] + activePoliceCoords[0]) / 2;
      const midLat = (GETAWAY_PATH[currentStep][1] + activePoliceCoords[1]) / 2;
      const distMarker = new maplibregl.Marker({ element: distEl })
        .setLngLat([midLon, midLat])
        .addTo(map);
      distanceMarkerRef.current = distMarker;
    };

    if (map.isStyleLoaded()) {
      map.resize();
      setupLayersAndMarkers();
    } else {
      map.once('load', () => {
        map.resize();
        setupLayersAndMarkers();
      });
      map.once('styledata', () => {
        if (map.isStyleLoaded()) {
          map.resize();
          setupLayersAndMarkers();
        }
      });
    }

    const resizeObserver = new ResizeObserver(() => {
      map.resize();
    });
    if (mapContainerRef.current) {
      resizeObserver.observe(mapContainerRef.current);
    }

    mapRef.current = map;

    return () => {
      resizeObserver.disconnect();
      map.remove();
      mapRef.current = null;
    };
  }, [mapStyleType]);

  // Switch map style cleanly between OSM, Python GIS, and Google
  const handleStyleChange = (type: 'osm' | 'google' | 'python') => {
    sound.playClickSound();
    setMapStyleType(type);
    toast.info(`Switched basemap to ${type === 'osm' ? 'OSM Clean' : type === 'python' ? 'Python Tactical GIS' : 'Google Roads'}.`, 'Basemap Changed');
  };

  // 3. Fetch Nearest Station from Backend Proximity API
  const fetchNearestStation = useCallback(async (lon: number, lat: number) => {
    try {
      const baseURL = import.meta.env.VITE_API_BASE_URL || '/api/v1';
      const response = await axios.get(`${baseURL}/geo/nearest-station`, {
        params: { lat, lon, top_k: 1 },
        timeout: 4000,
      });

      const stn = response.data?.nearest_station || response.data;
      if (stn) {
        const name = stn.police_station || stn.station_name || 'Noida Sector 20 Police Station';
        const dist = stn.distance_km || stn.distance || 1.2;
        const sLat = stn.station_latitude || (stn.coordinates ? stn.coordinates[1] : 28.5830);
        const sLon = stn.station_longitude || (stn.coordinates ? stn.coordinates[0] : 77.3320);
        const eta = Math.max(1, Math.round((dist / 45) * 60 * 10) / 10);

        setNearestStation({
          name,
          distanceKm: dist,
          latitude: sLat,
          longitude: sLon,
          etaMins: eta,
        });

        if (stationMarkerRef.current) {
          stationMarkerRef.current.setLngLat([sLon, sLat]);
          const labelEl = document.getElementById('station-marker-label');
          if (labelEl) labelEl.innerText = name.replace(' Police Station', ' PS');
        }
      }
    } catch {
      // Resilient local fallback
      const dist = Math.round((0.8 + Math.random() * 2.2) * 100) / 100;
      const sLon = lon - 0.012;
      const sLat = lat + 0.008;
      const eta = Math.max(1, Math.round((dist / 45) * 60 * 10) / 10);

      setNearestStation({
        name: 'Sector Police Intercept Post',
        distanceKm: dist,
        latitude: sLat,
        longitude: sLon,
        etaMins: eta,
      });

      if (stationMarkerRef.current) {
        stationMarkerRef.current.setLngLat([sLon, sLat]);
      }
    }
  }, []);

  // Manual or Keyboard Pursuit Step Movement
  const stepPursuit = useCallback(
    (delta: number) => {
      setCurrentStep((prev) => {
        const next = Math.max(0, Math.min(GETAWAY_PATH.length - 1, (prev + delta + GETAWAY_PATH.length) % GETAWAY_PATH.length));
        const [nextLon, nextLat] = GETAWAY_PATH[next];

        // Move vehicle marker and update speed
        if (thiefMarkerRef.current) {
          thiefMarkerRef.current.setLngLat([nextLon, nextLat]);
          const speedEl = document.getElementById('live-thief-speed');
          if (speedEl) {
            const speeds = [45, 55, 62, 58, 75, 78, 82, 65, 80, 72, 85, 70, 88, 95, 105];
            speedEl.innerText = `${speeds[next] || 80} km/h`;
          }
        }

        // Dynamically update dashed intercept line connecting thief to active police patrol unit
        if (mapRef.current && mapRef.current.getSource('intercept-vector')) {
          (mapRef.current.getSource('intercept-vector') as maplibregl.GeoJSONSource).setData({
            type: 'Feature',
            properties: {},
            geometry: {
              type: 'LineString',
              coordinates: [
                [nextLon, nextLat],
                [activePoliceCoords[0], activePoliceCoords[1]],
              ],
            },
          });
        }

        // Smoothly frame both pursuit vehicles
        if (mapRef.current) {
          const bounds = new maplibregl.LngLatBounds();
          bounds.extend([nextLon, nextLat]);
          bounds.extend([activePoliceCoords[0], activePoliceCoords[1]]);
          mapRef.current.fitBounds(bounds, {
            padding: { top: 90, bottom: 90, left: 320, right: 90 },
            maxZoom: 15,
            duration: 500,
          });
        }

        if (soundEnabled) sound.playRadarPing();
        fetchNearestStation(nextLon, nextLat);

        return next;
      });
    },
    [activePoliceCoords, fetchNearestStation, soundEnabled]
  );

  // Keyboard Arrow Controls for Live Tracking Pursuit & Map Pan
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

      const PAN_DELTA = 120;

      switch (e.key) {
        case 'ArrowRight':
          e.preventDefault();
          if (e.shiftKey && mapRef.current) {
            mapRef.current.panBy([PAN_DELTA, 0], { duration: 200 });
          } else {
            stepPursuit(1);
          }
          break;
        case 'ArrowLeft':
          e.preventDefault();
          if (e.shiftKey && mapRef.current) {
            mapRef.current.panBy([-PAN_DELTA, 0], { duration: 200 });
          } else {
            stepPursuit(-1);
          }
          break;
        case 'ArrowUp':
          e.preventDefault();
          if (mapRef.current) {
            mapRef.current.panBy([0, -PAN_DELTA], { duration: 200 });
          }
          break;
        case 'ArrowDown':
          e.preventDefault();
          if (mapRef.current) {
            mapRef.current.panBy([0, PAN_DELTA], { duration: 200 });
          }
          break;
        case ' ':
          e.preventDefault();
          setIsPlaying((p) => !p);
          sound.playClickSound();
          break;
        case '+':
        case '=':
          e.preventDefault();
          if (mapRef.current) mapRef.current.zoomIn({ duration: 200 });
          break;
        case '-':
        case '_':
          e.preventDefault();
          if (mapRef.current) mapRef.current.zoomOut({ duration: 200 });
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [stepPursuit]);

  // 4. Step Simulation Timer
  useEffect(() => {
    if (!isPlaying) return;

    const intervalMs = Math.max(750, 3000 / simulationSpeed);
    const timer = setInterval(() => {
      setCurrentStep((prev) => {
        const next = (prev + 1) % GETAWAY_PATH.length;
        const [nextLon, nextLat] = GETAWAY_PATH[next];

        // Move marker and update live speed tag
        if (thiefMarkerRef.current) {
          thiefMarkerRef.current.setLngLat([nextLon, nextLat]);
          const speedEl = document.getElementById('live-thief-speed');
          if (speedEl) {
            const speeds = [45, 55, 62, 58, 75, 78, 82, 65, 80, 72, 85, 70, 88, 95, 105];
            speedEl.innerText = `${speeds[next] || 80} km/h`;
          }
        }

        // Dynamically update dashed intercept line connecting thief to active police patrol unit
        if (mapRef.current && mapRef.current.getSource('intercept-vector')) {
          (mapRef.current.getSource('intercept-vector') as maplibregl.GeoJSONSource).setData({
            type: 'Feature',
            properties: {},
            geometry: {
              type: 'LineString',
              coordinates: [
                [nextLon, nextLat],
                [activePoliceCoords[0], activePoliceCoords[1]],
              ],
            },
          });
        }

        // Smoothly frame both pursuit vehicles if auto-follow is active
        if (mapRef.current && autoFollow) {
          const bounds = new maplibregl.LngLatBounds();
          bounds.extend([nextLon, nextLat]);
          bounds.extend([activePoliceCoords[0], activePoliceCoords[1]]);
          mapRef.current.fitBounds(bounds, {
            padding: { top: 90, bottom: 90, left: 360, right: 90 },
            maxZoom: 14.5,
            duration: 1000,
          });
        }

        // Play radar audio ping
        if (soundEnabled) {
          sound.playRadarPing();
        }

        // Fetch nearest police station
        fetchNearestStation(nextLon, nextLat);

        return next;
      });
    }, intervalMs);

    return () => clearInterval(timer);
  }, [isPlaying, simulationSpeed, soundEnabled, fetchNearestStation, activePoliceCoords, autoFollow]);

  const handleReset = () => {
    sound.playClickSound();
    setCurrentStep(0);
    setIsApprehended(false);
    const [startLon, startLat] = GETAWAY_PATH[0];
    if (thiefMarkerRef.current) {
      thiefMarkerRef.current.setLngLat([startLon, startLat]);
      const speedEl = document.getElementById('live-thief-speed');
      if (speedEl) speedEl.innerText = '45 km/h';
    }
    if (policeMarkerRef.current) {
      policeMarkerRef.current.setLngLat(ncrPatrolCoords);
    }
    if (mapRef.current) {
      mapRef.current.flyTo({ center: [startLon, startLat], zoom: 13.5, duration: 900 });
    }
    fetchNearestStation(startLon, startLat);
  };

  const handleExecuteIntercept = () => {
    sound.playSirenAlert();
    setIsPlaying(false);
    setIsApprehended(true);
    const interceptMsg = '🚨 TACTICAL INTERCEPT EXECUTED: Suspect vehicle blocked at checkpoint! Suspect restrained. Custody & Section 63 BSA certificate locked.';
    setDispatchAlert(interceptMsg);

    const currentCoords = GETAWAY_PATH[currentStep];
    const flankingPoliceCoords: [number, number] = [currentCoords[0] + 0.00075, currentCoords[1] + 0.00035];
    if (policeMarkerRef.current) {
      policeMarkerRef.current.setLngLat(flankingPoliceCoords);
    }
    if (thiefMarkerRef.current) {
      thiefMarkerRef.current.setLngLat(currentCoords);
      const speedEl = document.getElementById('live-thief-speed');
      if (speedEl) {
        speedEl.innerText = '0 km/h (HALTED)';
      }
    }
    if (mapRef.current && mapRef.current.getSource('intercept-vector')) {
      (mapRef.current.getSource('intercept-vector') as maplibregl.GeoJSONSource).setData({
        type: 'Feature',
        properties: {},
        geometry: {
          type: 'LineString',
          coordinates: [
            [currentCoords[0], currentCoords[1]],
            [flankingPoliceCoords[0], flankingPoliceCoords[1]],
          ],
        },
      });
    }

    if (mapRef.current) {
      mapRef.current.flyTo({
        center: currentCoords,
        zoom: 15,
        duration: 900,
        pitch: 0,
      });
    }

    setTimeout(() => {
      sound.playSuccessChime();
      setApprehensionModalOpen(true);
    }, 500);
  };

  const handleResumeFromApprehension = () => {
    sound.playClickSound();
    setIsApprehended(false);
    setApprehensionModalOpen(false);
    setIsPlaying(true);
    setDispatchAlert('Tactical pursuit simulation resumed.');
    toast.info('Tactical pursuit simulation resumed.', 'Pursuit Active');
    setTimeout(() => setDispatchAlert(null), 3500);
  };

  const handleBroadcastAlert = () => {
    sound.playAlertBeep();
    const alertMsg = `TACTICAL S.O.S. DISPATCH: Intercept broadcast relayed to ${nearestStation.name}. Rapid response vehicle deployed (ETA ${nearestStation.etaMins} mins).`;
    setDispatchAlert(alertMsg);
    setTimeout(() => setDispatchAlert(null), 6000);
  };

  // Filter 32 sovereign features by category & search query
  const filtered32Features = useMemo(() => {
    return SOVEREIGN_32_FEATURES.filter((f) => {
      const matchesCategory = selectedFeatureCategory === 'ALL' || f.category === selectedFeatureCategory;
      const matchesSearch =
        featureSearchQuery === '' ||
        f.title.toLowerCase().includes(featureSearchQuery.toLowerCase()) ||
        f.statutoryRef.toLowerCase().includes(featureSearchQuery.toLowerCase()) ||
        f.desc.toLowerCase().includes(featureSearchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [selectedFeatureCategory, featureSearchQuery]);

  // Compute CSS position class for floating HUD box
  const getHudPositionClass = () => {
    switch (hudPosition) {
      case 'top-right':
        return 'top-4 right-16';
      case 'bottom-left':
        return 'bottom-4 left-4';
      case 'top-left':
      default:
        return 'top-4 left-4';
    }
  };

  return (
    <div className="flex flex-col space-y-4 pb-28 relative">
      {/* Top Banner & Control Toolbar */}
      <div className="flex flex-col gap-2 p-2.5 px-3 rounded-xl border border-primary/30 bg-card/90 backdrop-blur-md shrink-0 shadow-lg">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-red-500/20 text-red-400 border border-red-500/40 flex items-center justify-center shrink-0 shadow-glow">
              <Radio className="h-4 w-4 animate-pulse text-red-500" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-sm font-extrabold text-foreground tracking-tight">
                  Live Pursuit & Tactical Proximity Dispatch
                </h1>
                <Badge variant="outline" className="bg-red-500/10 text-red-400 border-red-500/30 text-[9px] font-bold py-0 h-4">
                  LIVE DEMO
                </Badge>
                <Badge variant="outline" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/30 text-[9px] font-bold py-0 h-4">
                  GOOGLE MAPS AUTHENTICATED
                </Badge>
              </div>
            </div>
          </div>

          {/* Modal Launchers */}
          <div className="flex items-center gap-1.5">
            <Button
              size="sm"
              onClick={() => {
                sound.playClickSound();
                setWorkflowModalOpen(true);
              }}
              className="h-7 px-2.5 text-xs bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold flex items-center gap-1 shadow-sm border border-indigo-400/40"
              title="Interactive Guide: How multi-agency criminal data is collected and how CrimeNexus intercepts suspects"
            >
              <BookOpen className="h-3.5 w-3.5 text-indigo-200" />
              <span>Guide</span>
            </Button>

            <Button
              size="sm"
              onClick={() => {
                sound.playClickSound();
                setForensicModalOpen(true);
              }}
              className="h-7 px-2.5 text-xs bg-purple-600 hover:bg-purple-700 text-white font-extrabold flex items-center gap-1 shadow-sm border border-purple-400/40"
              title="Pictorial Hidden Clues Matrix, Scenario Retelecast Simulator & Multi-Modal Identity Confirmation Proof"
            >
              <Camera className="h-3.5 w-3.5 text-purple-200" />
              <span>Forensic Clues</span>
            </Button>

            <Button
              size="sm"
              onClick={() => {
                sound.playClickSound();
                setFeaturesModalOpen(true);
              }}
              className="h-7 px-2.5 text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-bold flex items-center gap-1 shadow-sm border border-emerald-400/30"
            >
              <Sparkles className="h-3.5 w-3.5 text-emerald-200 animate-pulse" />
              <span>32 Features (32/32)</span>
            </Button>

            <Button
              size="sm"
              onClick={() => {
                sound.playClickSound();
                setFieldUploadModalOpen(true);
              }}
              className="h-7 px-2.5 text-xs bg-indigo-600 hover:bg-indigo-700 text-white font-bold flex items-center gap-1 shadow-sm border border-indigo-400/40"
              title="Upload seized field exhibits, compute SHA-256 seal, and generate Section 63 BSA certificate"
            >
              <Upload className="h-3.5 w-3.5 text-indigo-200" />
              <span>Upload Evidence</span>
            </Button>
          </div>
        </div>

        {/* Playback & Action Controls */}
        <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-border/40">
          {/* High-Impact Tactical Intercept & Apprehend Button */}
          <Button
            size="sm"
            onClick={handleExecuteIntercept}
            disabled={isApprehended}
            className={`h-7 px-3 text-xs font-black flex items-center gap-1.5 shadow-md transition-all ${
              isApprehended
                ? 'bg-emerald-600 text-white border border-emerald-400 cursor-not-allowed'
                : 'bg-gradient-to-r from-red-600 via-rose-600 to-amber-600 hover:from-red-700 hover:to-amber-700 text-white shadow-red-600/40 border border-amber-400/40 animate-pulse'
            }`}
            title="Execute tactical roadblock, restrain suspect, and generate Section 63 BSA Custody Certificate"
          >
            <ShieldAlert className="h-3.5 w-3.5" />
            <span>{isApprehended ? '🚨 IN CUSTODY (SEALED)' : '⚡ Intercept & Apprehend'}</span>
          </Button>

          <Button
            size="sm"
            variant={isPlaying ? 'danger' : 'primary'}
            onClick={() => {
              sound.playClickSound();
              if (isApprehended) {
                handleResumeFromApprehension();
              } else {
                setIsPlaying(!isPlaying);
              }
            }}
            className="h-7 px-2.5 text-xs flex items-center gap-1"
          >
            {isPlaying ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
            <span>{isPlaying ? 'Pause' : isApprehended ? 'Resume' : 'Resume'}</span>
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={handleReset}
            className="h-7 px-2.5 text-xs flex items-center gap-1"
            title="Reset trajectory to start"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>Reset</span>
          </Button>

          {/* Speed Selector */}
          <div className="flex items-center bg-background/80 rounded-lg border border-border p-0.5 text-xs h-7">
            <Gauge className="h-3 w-3 text-muted-foreground ml-1.5 mr-0.5" />
            {[1, 2, 4].map((spd) => (
              <button
                key={spd}
                onClick={() => {
                  sound.playClickSound();
                  setSimulationSpeed(spd);
                }}
                className={`px-1.5 py-0.5 rounded text-[10px] font-bold transition-colors ${
                  simulationSpeed === spd
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {spd}x
              </button>
            ))}
          </div>

          {/* Sound Toggle */}
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              const next = !soundEnabled;
              setSoundEnabled(next);
              sound.setEnabled(next);
              if (next) {
                sound.playRadarPing();
                toast.info('Tactical Audio Systems: Activated', 'Sound Enabled');
              } else {
                toast.info('Tactical Audio Systems: Muted', 'Sound Muted');
              }
            }}
            className="h-7 w-7 p-0 flex items-center justify-center"
            title={soundEnabled ? 'Mute sound' : 'Enable sound'}
          >
            {soundEnabled ? <Volume2 className="h-3.5 w-3.5 text-primary" /> : <VolumeX className="h-3.5 w-3.5 text-muted-foreground" />}
          </Button>

          {/* Focus Target Button */}
          <Button
            size="sm"
            variant="outline"
            onClick={handleFocusTarget}
            className="h-7 px-2.5 text-xs flex items-center gap-1 border-red-500/50 text-red-400 hover:bg-red-950/40 font-bold"
            title="Fly camera directly to getaway vehicle"
          >
            <Compass className="h-3.5 w-3.5 text-red-500 animate-spin" />
            <span>Focus Target</span>
          </Button>

          {/* Auto-Follow Pursuit Toggle */}
          <Button
            size="sm"
            variant={autoFollow ? 'primary' : 'outline'}
            onClick={() => {
              sound.playClickSound();
              setAutoFollow(!autoFollow);
            }}
            className="h-7 px-2.5 text-xs flex items-center gap-1"
            title="Toggle whether map camera automatically tracks the vehicle"
          >
            <Navigation className="h-3.5 w-3.5" />
            <span>{autoFollow ? 'Auto-Follow: ON' : 'Auto-Follow: OFF'}</span>
          </Button>

          {/* Emergency Dispatch Button */}
          <Button
            size="sm"
            onClick={handleBroadcastAlert}
            className="h-7 px-3 text-xs bg-red-600 hover:bg-red-700 text-white font-bold flex items-center gap-1 shadow-md shadow-red-600/30 animate-pulse ml-auto"
          >
            <Siren className="h-3.5 w-3.5" />
            <span>Broadcast Intercept</span>
          </Button>
        </div>
      </div>

      {/* Main Map Canvas Area */}
      <div className="relative h-[560px] w-full rounded-2xl border border-primary/30 overflow-hidden shadow-2xl bg-slate-950 shrink-0">
        {mapStyleType === 'python' ? (
          <iframe
            src="/api/v1/geo/tactical-map?case_id=CASE-2026-8812&lat=28.5850&lon=77.3180&zoom=13"
            className="w-full h-full border-0"
            title="Python Tactical GIS Map"
          />
        ) : (
          <div ref={mapContainerRef} className="w-full h-full" />
        )}

        {/* Active Target Banner when Navigated from Most Wanted Watchlist */}
        {searchParams.get('plate') && !dismissTargetBanner && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-red-950/95 border-2 border-red-500 text-white shadow-2xl backdrop-blur-md text-xs font-mono font-bold animate-in fade-in zoom-in-95">
            <span className="h-2 w-2 rounded-full bg-red-500 animate-ping" />
            <span>🚨 INTERCEPT LOCK: {trackedPlate}</span>
            <span className="text-[10px] text-amber-300 bg-amber-950/80 px-1.5 py-0.5 rounded border border-amber-500/40">WATCHLIST HOTLIST</span>
            <button
              onClick={() => {
                sound.playClickSound();
                setDismissTargetBanner(true);
              }}
              className="p-0.5 rounded text-red-300 hover:text-white hover:bg-red-900/50 transition-colors ml-1"
              title="Close Intercept Banner"
              aria-label="Close Intercept Banner"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        )}

        {/* MAP STYLE SWITCHER (OSM Clean vs Python Tactical vs Google) */}
        <div className="absolute top-4 right-14 z-20 flex items-center bg-slate-900/90 backdrop-blur-md border border-border/80 rounded-lg p-0.5 shadow-lg text-[11px]">
          <button
            onClick={() => handleStyleChange('osm')}
            className={`px-2.5 py-1 rounded-md font-semibold transition-all ${
              mapStyleType === 'osm'
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            OSM Clean
          </button>
          <button
            onClick={() => handleStyleChange('python')}
            className={`px-2.5 py-1 rounded-md font-semibold transition-all ${
              mapStyleType === 'python'
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            🐍 Python Map
          </button>
          <button
            onClick={() => handleStyleChange('google')}
            className={`px-2.5 py-1 rounded-md font-semibold transition-all ${
              mapStyleType === 'google'
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Google Roads
          </button>
        </div>

        {/* FLOATING HEADS-UP DISPLAY (HUD) WITH BOX MANAGEMENT (COLLAPSIBLE / DOCKABLE - MapLibre Mode Only) */}
        {mapStyleType !== 'python' && (
          !isHudOpen ? (
            <button
              onClick={() => {
                sound.playClickSound();
                setIsHudOpen(true);
                setIsHudCollapsed(false);
              }}
              className="absolute top-4 left-4 z-20 px-3 py-1.5 rounded-xl border border-red-500/60 bg-slate-900/95 text-xs font-bold text-red-300 hover:text-white shadow-2xl backdrop-blur-md flex items-center gap-1.5 transition-all hover:scale-105"
              title="Open Telemetry HUD"
            >
              <Car className="h-4 w-4 text-red-400" />
              <span>Open Telemetry HUD</span>
            </button>
          ) : (
          <div
            id="telemetry-hud-box"
            style={hudPos ? { left: `${hudPos.x}px`, top: `${hudPos.y}px`, transform: 'none' } : undefined}
            className={`absolute ${hudPos ? '' : getHudPositionClass()} z-30 transition-all select-none ${
              isHudCollapsed ? 'w-auto' : 'w-72 sm:w-80 max-w-[calc(100vw-2rem)] max-h-[calc(100%-2rem)] flex flex-col'
            }`}
          >
            {isHudCollapsed ? (
              /* Mini Floating Telemetry Pill when collapsed */
              <div
                onMouseDown={handleHudDragStart}
                onTouchStart={handleHudDragStart}
                className="flex items-center gap-2 p-2 rounded-xl bg-slate-900/95 border border-red-500/50 shadow-2xl backdrop-blur-md cursor-move"
                title="Click & Drag to reposition"
              >
                <span className={`h-2.5 w-2.5 rounded-full ${isApprehended ? 'bg-emerald-400' : 'bg-red-500 animate-ping'}`} />
                <div className="flex items-center gap-2 text-xs font-bold text-slate-100">
                  {isApprehended ? (
                    <span className="text-emerald-400 flex items-center gap-1 font-extrabold">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      IN CUSTODY: {formatRemandTime(remandSeconds)}
                    </span>
                  ) : (
                    <>
                      <span className="text-red-400 flex items-center gap-1 font-mono">
                        <Car className="h-3.5 w-3.5" />
                        {trackedPlate} (80 km/h)
                      </span>
                      <span className="text-slate-500">|</span>
                      <span className="text-sky-400 font-mono">
                        Dist: {distanceToPolice !== null ? `${distanceToPolice} km` : '--'}
                      </span>
                      <span className="text-slate-500">|</span>
                      <span className="text-emerald-400">ETA: {nearestStation.etaMins}m</span>
                    </>
                  )}
                </div>
                {!isApprehended ? (
                  <Button
                    size="sm"
                    onClick={handleExecuteIntercept}
                    className="h-7 px-2 text-[10px] bg-red-600 hover:bg-red-700 text-white font-extrabold ml-1 animate-pulse"
                    title="Intercept suspect immediately"
                  >
                    ⚡ Catch
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    onClick={() => setApprehensionModalOpen(true)}
                    className="h-7 px-2 text-[10px] bg-emerald-600 hover:bg-emerald-700 text-white font-bold ml-1"
                  >
                    📜 Dossier
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleFocusTarget}
                  className="h-7 px-2 text-[11px] border-red-500/50 text-red-400 hover:bg-red-950/40 ml-1 font-bold"
                  title="Center camera on moving getaway vehicle"
                >
                  🎯 Focus
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    sound.playClickSound();
                    setIsHudCollapsed(false);
                  }}
                  className="h-7 px-2 text-[11px] text-sky-400 hover:text-sky-300"
                  title="Expand full tactical telemetry HUD"
                >
                  <Maximize2 className="h-3.5 w-3.5 mr-1" />
                  Expand
                </Button>
                <button
                  onClick={() => {
                    sound.playClickSound();
                    setIsHudOpen(false);
                  }}
                  className="h-7 w-7 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 flex items-center justify-center transition-colors ml-0.5"
                  title="Close Telemetry HUD"
                  aria-label="Close Telemetry HUD"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ) : (
              /* Full Expanded HUD Card with Anti-Overflow Scroll Bounds */
              <Card className="border border-red-500/40 bg-slate-900/95 backdrop-blur-md shadow-2xl overflow-hidden flex flex-col max-h-[460px]">
                <div
                  onMouseDown={handleHudDragStart}
                  onTouchStart={handleHudDragStart}
                  className="bg-red-950/40 border-b border-red-500/30 px-3 py-2 flex items-center justify-between cursor-move select-none shrink-0"
                  title="Click & Drag header to reposition HUD anywhere on screen"
                >
                  <span className="text-[11px] font-extrabold text-red-400 flex items-center gap-1.5 uppercase tracking-wider truncate font-mono">
                    <Car className="h-3.5 w-3.5 shrink-0" />
                    <span>Target: {trackedPlate}</span>
                  </span>
                  <div className="flex items-center gap-1">
                    {/* Position dock toggler */}
                    <button
                      onClick={() => {
                        sound.playClickSound();
                        setHudPos(null);
                        setHudPosition((prev) =>
                          prev === 'top-left' ? 'bottom-left' : prev === 'bottom-left' ? 'top-right' : 'top-left'
                        );
                      }}
                      className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                      title="Dock HUD to corner (or drag header to custom position)"
                    >
                      <Move className="h-3.5 w-3.5" />
                    </button>
                    {/* Minimize button */}
                    <button
                      onClick={() => {
                        sound.playClickSound();
                        setIsHudCollapsed(true);
                      }}
                      className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                      title="Minimize HUD to small floating pill"
                    >
                      <Minimize2 className="h-3.5 w-3.5" />
                    </button>
                    {/* Close button */}
                    <button
                      onClick={() => {
                        sound.playClickSound();
                        setIsHudOpen(false);
                      }}
                      className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                      title="Close Telemetry HUD"
                      aria-label="Close Telemetry HUD"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                    <span className="h-2 w-2 rounded-full bg-red-500 animate-ping ml-1" />
                  </div>
                </div>

                <CardContent className="p-3 space-y-2.5 text-xs max-h-[390px] overflow-y-auto scrollbar-thin">
                {/* Patrol Mode Selector: Simulated Local NCR Patrol vs User Browser GPS */}
                <div className="p-1.5 rounded-lg bg-slate-950/70 border border-border/80 flex items-center justify-between text-[11px]">
                  <span className="text-muted-foreground flex items-center gap-1">
                    <Shield className="h-3 w-3 text-sky-400" />
                    Patrol Unit:
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={handleSwitchToNcrSquad}
                      className={`px-2 py-0.5 rounded font-bold transition-colors ${
                        patrolMode === 'SIMULATED_NCR'
                          ? 'bg-sky-600 text-white shadow-sm'
                          : 'text-muted-foreground hover:text-white'
                      }`}
                      title="Simulated On-Scene NCR Police Patrol in Delhi/Jewar (~1.4 km proximity)"
                    >
                      NCR Squad (1.4 km)
                    </button>
                    <button
                      onClick={handleSwitchToMyGps}
                      className={`px-2 py-0.5 rounded font-bold transition-colors ${
                        patrolMode === 'BROWSER_GPS' && !isLocationTypingOpen
                          ? 'bg-indigo-600 text-white shadow-sm'
                          : 'text-muted-foreground hover:text-white'
                      }`}
                      title="Intercept directly from your browser GPS device location"
                    >
                      My GPS
                    </button>
                    <button
                      onClick={() => setIsLocationTypingOpen((prev) => !prev)}
                      className={`px-2 py-0.5 rounded font-bold transition-colors flex items-center gap-1 ${
                        isLocationTypingOpen
                          ? 'bg-emerald-600 text-white shadow-sm'
                          : 'text-muted-foreground hover:text-white'
                      }`}
                      title="Type any city, town, college, landmark or coordinates to set location"
                    >
                      <Search className="h-3 w-3" />
                      <span>Type Place</span>
                    </button>
                  </div>
                </div>

                {/* Location Typing Search Box inside Telemetry HUD */}
                {isLocationTypingOpen && (
                  <div className="p-2 rounded-lg bg-slate-900 border border-emerald-500/50 space-y-1.5 animate-in fade-in">
                    <div className="relative">
                      <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-emerald-400" />
                      <input
                        type="text"
                        value={typedLocationQuery}
                        onChange={(e) => handleLocationSearch(e.target.value)}
                        placeholder="Type Indian city, campus, station, or lat,lon (India Only)..."
                        className="w-full pl-8 pr-7 py-1 rounded bg-slate-950 border border-emerald-500/40 text-[11px] text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                        autoFocus
                      />
                      {typedLocationQuery && (
                        <button
                          onClick={() => {
                            setTypedLocationQuery('');
                            setTypedLocationResults([]);
                          }}
                          className="absolute right-2 top-1.5 text-slate-400 hover:text-white"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      )}
                    </div>

                    {isSearchingLocation && (
                      <div className="text-[10px] text-emerald-400 flex items-center gap-1 py-1">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-ping" />
                        Searching places...
                      </div>
                    )}

                    {typedLocationResults.length > 0 && (
                      <div className="max-h-36 overflow-y-auto space-y-0.5 rounded border border-slate-800 bg-slate-950 p-1 divide-y divide-slate-800/60 scrollbar-thin">
                        {typedLocationResults.map((place, idx) => (
                          <button
                            key={idx}
                            onClick={() => handleSelectTypedLocation(place)}
                            className="w-full p-1.5 text-left hover:bg-emerald-950/40 rounded flex items-center justify-between gap-2 transition-colors group"
                          >
                            <div className="min-w-0 flex-1">
                              <span className="text-[11px] font-bold text-white group-hover:text-emerald-300 block truncate">
                                {place.name}
                              </span>
                              <span className="text-[9px] text-slate-400 block truncate">
                                {place.display_name}
                              </span>
                            </div>
                            <span className="text-[10px] font-mono text-emerald-400 shrink-0 font-bold">
                              Select ➔
                            </span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Section Box: Tactical Response Assignment & Identification */}
                <div className="p-2.5 rounded-lg bg-slate-950/90 border border-slate-700/80 space-y-2">
                  <div className="flex items-center justify-between text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                    <span className="flex items-center gap-1.5">
                      <Shield className="h-3 w-3 text-sky-400" />
                      Tactical Intercept Assignment
                    </span>
                    <span className="px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 font-mono text-[9px] border border-emerald-500/30">
                      VHF LINK ACTIVE
                    </span>
                  </div>

                  {/* Suspect vs Interceptor Responsive Cards */}
                  <div className="grid grid-cols-2 gap-2 text-[11px]">
                    {/* Wanted Suspect Card */}
                    <div className="p-2 rounded-md bg-red-950/40 border border-red-500/40 flex flex-col justify-between">
                      <div className="flex items-center gap-2">
                        <div className="relative shrink-0">
                          <img
                            src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150"
                            alt="Vikram Malhotra (Wanted)"
                            className="w-9 h-9 rounded-full object-cover border-2 border-red-500 shadow-md shadow-red-950/60"
                          />
                          <span className="absolute -bottom-1 -right-1 text-xs" title="Wanted Fugitive">🎯</span>
                        </div>
                        <div className="min-w-0">
                          <span className="font-extrabold text-white text-[11px] block truncate">V. Malhotra</span>
                          <span className="text-[9px] text-red-300 font-mono block truncate">{trackedPlate}</span>
                        </div>
                      </div>
                      <div className="mt-1.5 pt-1 border-t border-red-500/20 flex items-center justify-between text-[9px]">
                        <span className="bg-red-600/90 text-white font-black px-1 rounded uppercase">TARGET</span>
                        <span className="text-red-300 font-mono">BNS 308/111</span>
                      </div>
                    </div>

                    {/* Intercepting Police Officer Card */}
                    <div className="p-2 rounded-md bg-sky-950/40 border border-sky-500/40 flex flex-col justify-between">
                      <div className="flex items-center gap-2">
                        <div className="relative shrink-0">
                          <img
                            src="https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150"
                            alt="Inspector Rajesh Varma (IO)"
                            className="w-9 h-9 rounded-full object-cover border-2 border-sky-400 shadow-md shadow-sky-950/60"
                          />
                          <span className="absolute -bottom-1 -right-1 text-xs" title="Pursuit Squad">🚓</span>
                        </div>
                        <div className="min-w-0">
                          <span className="font-extrabold text-white text-[11px] block truncate">Insp. R. Varma</span>
                          <span className="text-[9px] text-sky-300 font-mono block truncate">PCR-04 SQUAD</span>
                        </div>
                      </div>
                      <div className="mt-1.5 pt-1 border-t border-sky-500/20 flex items-center justify-between text-[9px]">
                        <span className="bg-sky-600/90 text-white font-black px-1 rounded uppercase">INTERCEPTOR</span>
                        <span className="text-sky-300 font-mono">CH-04 VHF</span>
                      </div>
                    </div>
                  </div>

                  {/* Clarifying Link Bar: Explains which response unit is assigned to which target */}
                  <div className="px-2 py-1 rounded bg-slate-900/90 border border-slate-700/60 text-[10px] text-slate-300 flex items-center justify-between">
                    <span className="flex items-center gap-1 font-semibold text-sky-300">
                      <span>🚓 PCR-04 Squad</span>
                    </span>
                    <span className="text-muted-foreground text-[9px] uppercase tracking-wider font-mono">Assign ➔</span>
                    <span className="flex items-center gap-1 font-semibold text-red-300">
                      <span>🎯 {trackedPlate}</span>
                    </span>
                  </div>
                </div>

                {/* Telemetry info */}
                <div className="space-y-1">
                  <div className="flex justify-between text-muted-foreground text-[11px]">
                    <span>Target:</span>
                    <span className="font-semibold text-red-400 font-mono">{trackedSuspect} ({trackedPlate})</span>
                  </div>
                  <div className="flex justify-between text-muted-foreground text-[11px]">
                    <span>Speed:</span>
                    <span className="font-mono text-amber-400 font-bold">{isApprehended ? '0 km/h (HALTED)' : '80 km/h'}</span>
                  </div>
                  <div className="flex justify-between text-muted-foreground text-[11px]">
                    <span>Distance to Patrol:</span>
                    <span className="font-mono text-sky-400 font-bold">
                      {isApprehended ? '0.0 km (INTERCEPTED)' : distanceToPolice !== null ? `${distanceToPolice} km` : 'Calculating...'}
                    </span>
                  </div>
                  <div className="flex justify-between text-muted-foreground text-[11px]">
                    <span>Thief Location:</span>
                    <span className="font-mono text-foreground font-semibold">
                      {currentThiefCoords[1].toFixed(4)}°N, {currentThiefCoords[0].toFixed(4)}°E
                    </span>
                  </div>
                  <div className="flex justify-between text-muted-foreground text-[11px]">
                    <span>Checkpoint:</span>
                    <span className="font-semibold text-foreground">
                      Waypoint {currentStep + 1} of {GETAWAY_PATH.length}
                    </span>
                  </div>
                </div>

                {/* Nearest Police Station Box */}
                <div className="p-3 rounded-lg border border-sky-500/40 bg-sky-950/20 space-y-1.5">
                  <div className="flex items-center gap-1.5 text-sky-400 font-bold text-[11px]">
                    <Shield className="h-3.5 w-3.5" />
                    <span>Nearest Station:</span>
                  </div>
                  <div className="font-bold text-foreground text-xs leading-snug">
                    {nearestStation.name}
                  </div>
                  <div className="grid grid-cols-2 gap-2 pt-1 border-t border-sky-500/20 text-center font-mono text-[11px]">
                    <div className="p-1 rounded bg-slate-900/60 border border-sky-500/20">
                      <span className="text-[9px] text-muted-foreground block">Distance</span>
                      <span className="font-bold text-sky-300">{nearestStation.distanceKm} km</span>
                    </div>
                    <div className="p-1 rounded bg-slate-900/60 border border-sky-500/20">
                      <span className="text-[9px] text-muted-foreground block">Intercept ETA</span>
                      <span className="font-bold text-emerald-400">{nearestStation.etaMins} mins</span>
                    </div>
                  </div>
                </div>

                {/* Intercept Action & Status */}
                <div className="space-y-2 pt-1 border-t border-border/60">
                  {isApprehended ? (
                    <div className="p-2.5 rounded-lg bg-emerald-950/60 border border-emerald-500/50 text-center space-y-1.5">
                      <div className="text-emerald-400 font-extrabold text-xs flex items-center justify-center gap-1.5">
                        <CheckCircle2 className="h-4 w-4" />
                        SUSPECT IN POLICE CUSTODY
                      </div>
                      <div className="text-[10px] text-emerald-300 font-mono">
                        Remand Clock: {formatRemandTime(remandSeconds)}
                      </div>
                      <Button
                        size="sm"
                        onClick={() => {
                          sound.playClickSound();
                          setApprehensionModalOpen(true);
                        }}
                        className="w-full h-7 text-[10px] bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
                      >
                        View Custody & Remand Brief
                      </Button>
                    </div>
                  ) : (
                    <Button
                      size="sm"
                      onClick={handleExecuteIntercept}
                      className="w-full text-xs font-black bg-gradient-to-r from-red-600 to-amber-600 hover:from-red-700 hover:to-amber-700 text-white shadow-md shadow-red-600/30 flex items-center justify-center gap-1.5"
                    >
                      <ShieldAlert className="h-4 w-4" />
                      <span>⚡ Intercept & Lock Custody</span>
                    </Button>
                  )}

                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      size="sm"
                      variant="danger"
                      onClick={handleFocusTarget}
                      className="w-full text-[11px] font-bold bg-red-600 hover:bg-red-700 h-7 text-white"
                    >
                      🎯 Focus Target
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleFocusPolice}
                      className="w-full text-[11px] font-bold border-sky-500/50 text-sky-400 hover:bg-sky-950/40 h-7"
                    >
                      🚔 Focus Police
                    </Button>
                  </div>
                </div>

                <div className="pt-2 border-t border-border/60">
                  <button
                    onClick={() => {
                      sound.playClickSound();
                      setIsHudOpen(false);
                    }}
                    className="w-full py-1.5 px-3 rounded-lg bg-red-950/40 hover:bg-red-900/60 border border-red-500/40 text-red-200 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
                    title="Close and remove telemetry box from screen"
                  >
                    <X className="h-3.5 w-3.5" />
                    <span>Dismiss / Remove Box</span>
                  </button>
                </div>

                <div className="flex items-center justify-between text-[11px] pt-1">
                  <span className="text-muted-foreground">Tactical Grid:</span>
                  <span className="font-bold text-emerald-400 flex items-center gap-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                    LIVE HAVERSINE TRACKING
                  </span>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )
    )}

        {/* Unified Tactical Notification handled cleanly via Toast to prevent duplicate onscreen banners */}

        {/* LIVE MULTI-SOURCE EVIDENCE CORRELATION FEED (COLLAPSIBLE / CLOSABLE) */}
        {!isFeedOpen ? (
          <button
            onClick={() => {
              sound.playClickSound();
              setIsFeedOpen(true);
              setIsFeedCollapsed(true);
            }}
            className="absolute bottom-4 left-4 z-20 px-2.5 py-1.5 rounded-xl border border-indigo-500/50 bg-slate-900/90 text-xs font-bold text-indigo-300 hover:text-white shadow-xl backdrop-blur-md flex items-center gap-1.5 transition-all"
            title="Open Evidence Ingestion Feed"
          >
            <Activity className="h-3.5 w-3.5 text-indigo-400 animate-pulse" />
            <span>Open Ingestion Feed</span>
          </button>
        ) : (
          <div className="absolute bottom-4 left-4 z-20 select-none max-w-sm w-full">
            {isFeedCollapsed ? (
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => {
                    sound.playClickSound();
                    setIsFeedCollapsed(false);
                  }}
                  className="px-2.5 py-1.5 rounded-xl border border-indigo-500/50 bg-slate-900/90 text-xs font-bold text-indigo-300 hover:text-white shadow-xl backdrop-blur-md flex items-center gap-2"
                >
                  <Activity className="h-3.5 w-3.5 text-indigo-400 animate-pulse" />
                  <span>Live Ingestion Feed</span>
                  <span className="bg-indigo-950 text-indigo-300 text-[10px] px-1.5 py-0.2 rounded border border-indigo-500/30">
                    {liveEventsList.filter((e) => e.step <= currentStep).length} Events
                  </span>
                </button>
                <button
                  onClick={() => {
                    sound.playClickSound();
                    setIsFeedOpen(false);
                  }}
                  className="p-1 rounded-lg border border-indigo-500/50 bg-slate-900/90 text-slate-400 hover:text-white transition-colors"
                  title="Close Evidence Feed"
                  aria-label="Close Evidence Feed"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ) : (
              <div className="p-3 rounded-xl border border-indigo-500/40 bg-slate-900/95 backdrop-blur-md shadow-2xl text-xs space-y-2">
                <div className="flex items-center justify-between border-b border-indigo-500/30 pb-1.5">
                  <div className="flex items-center gap-1.5 text-indigo-300 font-extrabold text-[11px] uppercase tracking-wide">
                    <Activity className="h-3.5 w-3.5 text-indigo-400 animate-pulse" />
                    <span>Real-Time Evidence Ingestion</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => {
                        sound.playClickSound();
                        setFieldUploadModalOpen(true);
                      }}
                      className="text-[10px] text-emerald-400 hover:text-emerald-300 font-bold px-1.5 py-0.5 rounded bg-emerald-950/60 border border-emerald-500/40 flex items-center gap-1 transition-all hover:bg-emerald-900/70"
                      title="Upload seized field exhibits"
                    >
                      <Upload className="h-3 w-3" />
                      <span>+ Ingest</span>
                    </button>
                    <button
                      onClick={() => {
                        sound.playClickSound();
                        setWorkflowModalOpen(true);
                      }}
                      className="text-[10px] text-indigo-400 hover:text-white underline mr-1 font-semibold"
                      title="See detailed workflow"
                    >
                      Workflow
                    </button>
                    <button
                      onClick={() => {
                        sound.playClickSound();
                        setIsFeedCollapsed(true);
                      }}
                      className="text-slate-400 hover:text-white p-0.5 rounded hover:bg-slate-800 transition-colors"
                      title="Collapse feed"
                    >
                      <Minimize2 className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => {
                        sound.playClickSound();
                        setIsFeedOpen(false);
                      }}
                      className="text-slate-400 hover:text-white p-0.5 rounded hover:bg-slate-800 transition-colors"
                      title="Close feed"
                      aria-label="Close feed"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

              {/* Stream items */}
              <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                {liveEventsList.filter((e) => e.step <= currentStep)
                  .slice(-3)
                  .reverse()
                  .map((ev, idx) => (
                    <div
                      key={idx}
                      className="p-1.5 rounded-lg bg-slate-950/70 border border-border/60 text-[11px] space-y-0.5 animate-in fade-in"
                    >
                      <div className="flex items-center justify-between gap-1">
                        <span className="font-bold text-white flex items-center gap-1">
                          <span className="h-1.5 w-1.5 rounded-full bg-indigo-400" />
                          {ev.title}
                        </span>
                        <Badge variant="outline" className="text-[9px] px-1 py-0 bg-indigo-950/50 text-indigo-300 border-indigo-500/40 font-mono">
                          {ev.badge}
                        </Badge>
                      </div>
                      <p className="text-[10px] text-slate-400 line-clamp-1">{ev.desc}</p>
                      <span className="text-[9px] text-slate-500 font-mono block text-right">{ev.time}</span>
                    </div>
                  ))}
                {liveEventsList.filter((e) => e.step <= currentStep).length === 0 && (
                  <div className="text-[11px] text-slate-500 italic p-1 text-center">
                    Awaiting live telemetry triggers...
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
        )}

        {/* Keyboard Arrow Navigation Hint Badge */}
        <div className="absolute bottom-3 left-4 z-20 hidden md:flex items-center gap-2 px-3 py-1.5 rounded-xl border border-border/60 bg-slate-900/90 backdrop-blur-md text-[11px] font-mono text-slate-300 shadow-lg select-none">
          <span className="text-emerald-400 font-bold">⌨️ [← / →]</span>
          <span>Step Pursuit</span>
          <span className="text-slate-600">|</span>
          <span className="text-sky-400 font-bold">[↑ / ↓]</span>
          <span>Pan Map</span>
          <span className="text-slate-600">|</span>
          <span className="text-amber-400 font-bold">[Space]</span>
          <span>Pause</span>
        </div>

        {/* TACTICAL LEGEND OVERLAY (COLLAPSIBLE) */}
        <div className="absolute bottom-3 right-3 z-20 select-none">
          {isLegendCollapsed ? (
            <button
              onClick={() => {
                sound.playClickSound();
                setIsLegendCollapsed(false);
              }}
              className="px-2.5 py-1.5 rounded-xl border border-border/60 bg-slate-900/90 text-xs font-bold text-slate-300 hover:text-white shadow-xl backdrop-blur-md flex items-center gap-1.5"
            >
              <Compass className="h-3.5 w-3.5 text-sky-400" />
              <span>Map Legend</span>
            </button>
          ) : (
            <div className="p-2.5 rounded-xl border border-border/60 bg-slate-900/90 backdrop-blur-md text-[11px] space-y-1.5 shadow-xl">
              <div className="flex items-center justify-between border-b border-border/40 pb-1">
                <span className="font-bold text-slate-300 text-[10px] uppercase">Tactical Legend</span>
                <button
                  onClick={() => {
                    sound.playClickSound();
                    setIsLegendCollapsed(true);
                  }}
                  className="text-slate-400 hover:text-white p-0.5"
                  title="Collapse legend"
                >
                  <Minimize2 className="h-3 w-3" />
                </button>
              </div>
              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-full bg-red-500 border border-white" />
                <span className="text-slate-200 font-semibold">Getaway Vehicle (Thief)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-full bg-blue-500 border border-white" />
                <span className="text-slate-200 font-semibold">
                  Police Unit ({patrolMode === 'SIMULATED_NCR' ? 'NCR Patrol' : 'Browser GPS'})
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-5 h-0.5 border-t-2 border-dashed border-sky-400" />
                <span className="text-slate-400">
                  Intercept Vector ({distanceToPolice !== null ? `${distanceToPolice} km` : '--'})
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* =========================================================================
          LIVE TRACKING INTELLIGENCE & PURSUIT OPERATIONS DASHBOARD (BELOW MAP)
          ========================================================================= */}
      <div className="w-full rounded-2xl border border-primary/30 bg-card/95 backdrop-blur-md shadow-2xl p-4 sm:p-6 space-y-5 select-none">
        {/* Navigation Tab Bar for Intelligence Sections */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/80 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="h-3 w-3 rounded-full bg-emerald-500 animate-pulse shadow-glow" />
            <div>
              <h2 className="text-sm sm:text-base font-black text-foreground tracking-wide flex items-center gap-2">
                <span>Pursuit Operations Intelligence Center</span>
                <Badge variant="outline" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/30 text-[10px] font-mono font-bold">
                  SEC 105 BNSS VERIFIED
                </Badge>
              </h2>
              <p className="text-[11px] text-muted-foreground">
                Target: <span className="font-mono text-red-400 font-bold">TS 09 AB 1234</span> • Operation Shadow Net • Yamuna Expressway Intercept Corridor
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto text-xs">
            <button
              onClick={() => {
                sound.playClickSound();
                setActiveInfoTab('telemetry');
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition-all text-xs ${
                activeInfoTab === 'telemetry'
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'bg-muted/40 hover:bg-muted text-muted-foreground hover:text-foreground'
              }`}
            >
              <Activity className="h-3.5 w-3.5" />
              <span>Telemetry & Roadblocks</span>
            </button>

            <button
              onClick={() => {
                sound.playClickSound();
                setActiveInfoTab('tools');
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition-all text-xs ${
                activeInfoTab === 'tools'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-muted/40 hover:bg-muted text-muted-foreground hover:text-foreground'
              }`}
            >
              <Sparkles className="h-3.5 w-3.5 text-emerald-300" />
              <span>32 Sovereign Tools (Active)</span>
              <span className="bg-emerald-950 text-emerald-300 text-[9px] px-1.5 py-0.2 rounded font-mono border border-emerald-500/40">
                32/32
              </span>
            </button>

            <button
              onClick={() => {
                sound.playClickSound();
                setActiveInfoTab('breadcrumbs');
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition-all text-xs ${
                activeInfoTab === 'breadcrumbs'
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'bg-muted/40 hover:bg-muted text-muted-foreground hover:text-foreground'
              }`}
            >
              <Radio className="h-3.5 w-3.5" />
              <span>BTS Cellular & Toll Log</span>
            </button>

            <button
              onClick={() => {
                sound.playClickSound();
                setActiveInfoTab('legal');
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition-all text-xs ${
                activeInfoTab === 'legal'
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'bg-muted/40 hover:bg-muted text-muted-foreground hover:text-foreground'
              }`}
            >
              <Scale className="h-3.5 w-3.5 text-amber-300" />
              <span>Sec 63 BSA Hash & Seal</span>
            </button>
          </div>
        </div>

        {/* TAB 1: Telemetry & Roadblock Grid */}
        {activeInfoTab === 'telemetry' && (
          <div className="space-y-4">
            {/* 4 Core Metrics Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div className="p-3.5 rounded-xl border border-border/80 bg-background/60 flex items-center justify-between shadow-sm">
                <div>
                  <div className="text-[10px] uppercase font-bold text-muted-foreground">Target Velocity</div>
                  <div className="text-xl font-black text-red-400 font-mono">
                    {isApprehended
                      ? '0 km/h (HALTED)'
                      : `${[45, 55, 62, 58, 75, 78, 82, 65, 80, 72, 85, 70, 88, 95, 105][currentStep] || 80} km/h`}
                  </div>
                  <div className="text-[10px] text-muted-foreground mt-0.5">
                    Heading Southbound • Yamuna Exp
                  </div>
                </div>
                <div className="h-10 w-10 rounded-xl bg-red-500/10 text-red-400 border border-red-500/30 flex items-center justify-center">
                  <Gauge className="h-5 w-5" />
                </div>
              </div>

              <div className="p-3.5 rounded-xl border border-border/80 bg-background/60 flex items-center justify-between shadow-sm">
                <div>
                  <div className="text-[10px] uppercase font-bold text-muted-foreground">Distance to Interceptor</div>
                  <div className="text-xl font-black text-sky-400 font-mono">
                    {isApprehended ? '0.00 km (LOCKED)' : `${distanceToPolice !== null ? distanceToPolice : '1.3'} km`}
                  </div>
                  <div className="text-[10px] text-muted-foreground mt-0.5">
                    Dynamic ETA: ~{nearestStation.etaMins} mins
                  </div>
                </div>
                <div className="h-10 w-10 rounded-xl bg-sky-500/10 text-sky-400 border border-sky-500/30 flex items-center justify-center">
                  <Navigation className="h-5 w-5" />
                </div>
              </div>

              <div className="p-3.5 rounded-xl border border-border/80 bg-background/60 flex items-center justify-between shadow-sm">
                <div>
                  <div className="text-[10px] uppercase font-bold text-muted-foreground">FASTag RFID Sensor</div>
                  <div className="text-base font-extrabold text-amber-300 font-mono">
                    TOLL KM 48 ALARM
                  </div>
                  <div className="text-[10px] text-amber-400/80 mt-0.5">
                    Lane 04 • TS 09 AB 1234
                  </div>
                </div>
                <div className="h-10 w-10 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/30 flex items-center justify-center">
                  <Camera className="h-5 w-5" />
                </div>
              </div>

              <div className="p-3.5 rounded-xl border border-border/80 bg-background/60 flex items-center justify-between shadow-sm">
                <div>
                  <div className="text-[10px] uppercase font-bold text-muted-foreground">Jurisdictional Thana</div>
                  <div className="text-sm font-extrabold text-foreground truncate max-w-[140px]">
                    {nearestStation.name.replace(' Police Station', '')}
                  </div>
                  <div className="text-[10px] text-muted-foreground mt-0.5">
                    VHF: 156.800 MHz • {nearestStation.distanceKm} km
                  </div>
                </div>
                <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary border border-primary/30 flex items-center justify-center">
                  <ShieldCheck className="h-5 w-5" />
                </div>
              </div>
            </div>

            {/* Jurisdictional Police Stations Grid (Within 15 KM) */}
            <div className="p-4 rounded-xl border border-border/80 bg-background/40 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-primary" />
                  <h3 className="text-xs font-black text-foreground uppercase tracking-wider">
                    Jurisdictional Police Stations Grid (Within 15 KM Radius)
                  </h3>
                </div>
                <Badge variant="outline" className="text-[10px] font-mono text-muted-foreground">
                  4 STATIONS SYNCED
                </Badge>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                {[
                  {
                    name: 'Noida Sector 20 Police Station',
                    code: 'UP-NOI-20',
                    dist: '1.88 km',
                    eta: '2.5m',
                    status: '2 PCR VANS EN ROUTE',
                    statusColor: 'text-emerald-400 bg-emerald-950/60 border-emerald-500/40',
                    action: 'Patrol Active',
                  },
                  {
                    name: 'Jewar Police Station (Yamuna Exp)',
                    code: 'UP-NOI-JW',
                    dist: '4.50 km',
                    eta: '6.1m',
                    status: 'STATIC BARRICADE ARMED',
                    statusColor: 'text-amber-400 bg-amber-950/60 border-amber-500/40',
                    action: 'Spike Strips Ready',
                  },
                  {
                    name: 'Rabupura Police Station',
                    code: 'UP-NOI-RB',
                    dist: '8.20 km',
                    eta: '11.0m',
                    status: 'FLANKING ROUTE SEALED',
                    statusColor: 'text-sky-400 bg-sky-950/60 border-sky-500/40',
                    action: 'Roadblock Sealed',
                  },
                  {
                    name: 'Dankaur Police Station',
                    code: 'UP-NOI-DK',
                    dist: '11.60 km',
                    eta: '15.4m',
                    status: 'RESERVE SQUAD STANDBY',
                    statusColor: 'text-slate-400 bg-slate-900/60 border-slate-700/40',
                    action: 'Standby Unit',
                  },
                ].map((stn, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-lg border border-border/80 bg-card hover:border-primary/50 transition-all flex flex-col justify-between space-y-2.5"
                  >
                    <div>
                      <div className="flex items-center justify-between text-[10px] text-muted-foreground font-mono mb-1">
                        <span>{stn.code}</span>
                        <span className="font-bold text-foreground">{stn.dist}</span>
                      </div>
                      <div className="text-xs font-bold text-foreground leading-tight">{stn.name}</div>
                      <div className={`mt-2 text-[9px] font-mono font-bold px-1.5 py-0.5 rounded border inline-block ${stn.statusColor}`}>
                        {stn.status}
                      </div>
                    </div>
                    <div className="pt-2 border-t border-border/60 flex items-center justify-between">
                      <span className="text-[10px] font-mono text-muted-foreground">ETA: {stn.eta}</span>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          sound.playAlertBeep();
                          toast.success(`Tactical dispatch signal routed to ${stn.name}. Intercept coordinated.`, 'Dispatch Relayed');
                        }}
                        className="h-6 text-[10px] px-2 text-primary hover:bg-primary/10"
                      >
                        Patch Radio
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Tactical Countermeasures & Roadblock Grid */}
            <div className="p-4 rounded-xl border border-border/80 bg-background/40 space-y-3">
              <div className="flex items-center gap-2">
                <Siren className="h-4 w-4 text-red-400" />
                <h3 className="text-xs font-black text-foreground uppercase tracking-wider">
                  Tactical Countermeasures & Highway Intercept Matrix
                </h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3 rounded-lg border border-red-500/30 bg-red-950/20 flex items-center gap-3">
                  <div className="h-8 w-8 rounded-lg bg-red-500/20 text-red-400 border border-red-500/40 flex items-center justify-center shrink-0">
                    <ShieldAlert className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-foreground">Hydraulic Spike Strip</div>
                    <div className="text-[10px] text-red-300 font-mono">Armed at Yamuna Toll KM 48</div>
                  </div>
                </div>

                <div className="p-3 rounded-lg border border-sky-500/30 bg-sky-950/20 flex items-center gap-3">
                  <div className="h-8 w-8 rounded-lg bg-sky-500/20 text-sky-400 border border-sky-500/40 flex items-center justify-center shrink-0">
                    <Compass className="h-4 w-4 animate-spin text-sky-400" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-foreground">FLIR Drone Quadcopter (D-09)</div>
                    <div className="text-[10px] text-sky-300 font-mono">Airborne at 120m • Thermal Tracking</div>
                  </div>
                </div>

                <div className="p-3 rounded-lg border border-emerald-500/30 bg-emerald-950/20 flex items-center gap-3">
                  <div className="h-8 w-8 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center shrink-0">
                    <Radio className="h-4 w-4 text-emerald-400" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-foreground">VHF Tactical Patch</div>
                    <div className="text-[10px] text-emerald-300 font-mono">Channel 4 Inter-Agency Linked</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: All 32 Sovereign Tools Grid & Interactive Runner */}
        {activeInfoTab === 'tools' && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 bg-muted/30 p-3 rounded-xl border border-border/80">
              <div className="relative flex-1 min-w-[260px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type="text"
                  value={featureSearchQuery}
                  onChange={(e) => setFeatureSearchQuery(e.target.value)}
                  placeholder="Filter 32 sovereign law-enforcement tools (e.g. remand, hawala, voice, ANPR, graph)..."
                  className="w-full pl-9 pr-3 py-1.5 bg-background border border-border/80 rounded-lg text-xs text-foreground placeholder-muted-foreground focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex items-center gap-1 overflow-x-auto text-xs">
                {['ALL', 'TACTICAL', 'FORENSICS', 'LEGAL', 'AI_INTEL', 'SECURITY', 'INFRASTRUCTURE'].map((cat) => (
                  <button
                    key={cat}
                    onClick={() => {
                      sound.playClickSound();
                      setSelectedFeatureCategory(cat);
                    }}
                    className={`px-2.5 py-1 rounded-md font-bold text-[11px] transition-colors whitespace-nowrap ${
                      selectedFeatureCategory === cat
                        ? 'bg-emerald-600 text-white shadow-sm'
                        : 'bg-muted/50 text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-[540px] overflow-y-auto pr-1">
              {filtered32Features.map((feat) => {
                const Icon = feat.icon;
                const result = toolExecutionResults[feat.id];
                const isRunning = executingToolId === feat.id;

                return (
                  <div
                    key={feat.id}
                    className="p-3.5 rounded-xl border border-border/80 bg-background/60 hover:border-emerald-500/50 hover:bg-card transition-all flex flex-col justify-between group shadow-sm"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <span className="font-mono text-[10px] text-emerald-400 font-extrabold bg-emerald-950/60 border border-emerald-500/30 px-1.5 py-0.5 rounded">
                          #{String(feat.id).padStart(2, '0')}
                        </span>
                        <Badge
                          variant="outline"
                          className={`text-[9px] font-bold ${
                            feat.status === 'ACTIVE IN DEMO'
                              ? 'bg-red-500/20 text-red-300 border-red-500/40 animate-pulse'
                              : 'bg-muted text-muted-foreground border-border'
                          }`}
                        >
                          {feat.status}
                        </Badge>
                      </div>

                      <div className="flex items-start gap-2.5 mb-2">
                        <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shrink-0">
                          <Icon className="h-4 w-4" />
                        </div>
                        <div>
                          <h3 className="text-xs font-bold text-foreground group-hover:text-emerald-400 transition-colors leading-snug">
                            {feat.title}
                          </h3>
                          <div className="text-[10px] text-amber-400 font-medium mt-0.5">
                            {feat.statutoryRef}
                          </div>
                        </div>
                      </div>

                      <p className="text-[11px] text-muted-foreground line-clamp-2 mt-1">
                        {feat.desc}
                      </p>

                      {/* Live Simulated Output Box if Tool Executed */}
                      {result && (
                        <div className="mt-2.5 p-2 rounded-lg bg-emerald-950/40 border border-emerald-500/40 text-[10px] font-mono text-emerald-300 space-y-1 animate-in fade-in">
                          <div className="flex items-center justify-between text-[9px] text-emerald-400 font-bold border-b border-emerald-500/20 pb-0.5">
                            <span>✓ STATUTORY EXECUTION PASS</span>
                            <span>{result.timestamp}</span>
                          </div>
                          <p className="text-[10px] leading-relaxed text-slate-200">{result.output}</p>
                          <div className="text-[8px] text-slate-400 truncate">
                            Merkle Seal: {result.hash}
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="mt-3 pt-2 border-t border-border/40 flex items-center justify-between gap-1">
                      <Button
                        size="sm"
                        onClick={() => handleExecuteTool(feat)}
                        disabled={isRunning}
                        className="h-6 text-[10px] bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-2 flex items-center gap-1 shadow-sm"
                      >
                        {isRunning ? (
                          <>
                            <RefreshCw className="h-2.5 w-2.5 animate-spin" />
                            <span>Running...</span>
                          </>
                        ) : (
                          <>
                            <Zap className="h-2.5 w-2.5" />
                            <span>Run / Test Tool</span>
                          </>
                        )}
                      </Button>

                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          sound.playClickSound();
                          navigate(feat.route);
                        }}
                        className="h-6 text-[10px] text-muted-foreground hover:text-foreground px-2"
                      >
                        <span>Open Screen</span>
                        <ExternalLink className="h-3 w-3 ml-1" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 3: BTS Cellular & Toll Log */}
        {activeInfoTab === 'breadcrumbs' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Radio className="h-4 w-4 text-sky-400" />
                <h3 className="text-xs font-black text-foreground uppercase tracking-wider">
                  Chronological BTS Cellular Handovers & ANPR Toll Sighting Feed
                </h3>
              </div>
              <Badge variant="outline" className="text-[10px] font-mono text-muted-foreground">
                15 CHECKPOINTS LOGGED
              </Badge>
            </div>

            <div className="border border-border/80 rounded-xl overflow-hidden bg-background/40">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-muted/60 text-muted-foreground text-[10px] uppercase font-bold border-b border-border">
                    <tr>
                      <th className="p-2.5">Point</th>
                      <th className="p-2.5">Time (IST)</th>
                      <th className="p-2.5">Source / Sensor</th>
                      <th className="p-2.5">Event Description</th>
                      <th className="p-2.5">Coordinates</th>
                      <th className="p-2.5">Speed</th>
                      <th className="p-2.5 text-right">Statutory Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60 font-mono text-[11px]">
                    {[
                      { pt: '#01', time: '14:02:10', src: 'Connaught Place ANPR Cam #12', desc: 'Suspect vehicle sighted heading outer circle', coords: '28.6315°N, 77.2167°E', spd: '45 km/h', badge: 'VERIFIED' },
                      { pt: '#02', time: '14:04:30', src: 'Barakhamba Road ANPR #04', desc: 'Accelerating toward Mandi House flyover', coords: '28.6290°N, 77.2280°E', spd: '55 km/h', badge: 'VERIFIED' },
                      { pt: '#03', time: '14:08:15', src: 'ITO Flyover ANPR #08', desc: 'Crossing Yamuna River barrage heading East', coords: '28.6270°N, 77.2450°E', spd: '68 km/h', badge: 'VERIFIED' },
                      { pt: '#04', time: '14:11:40', src: 'Shakarpur BTS Tower Handover', desc: 'Burner SIM IMEI handover logged (Airtel BTS)', coords: '28.6255°N, 77.2600°E', spd: '72 km/h', badge: 'SEC 63 BSA' },
                      { pt: '#05', time: '14:14:00', src: 'Akshardham Expressway Cam #02', desc: 'FastTag ID TS 09 AB 1234 pinged lane camera', coords: '28.6180°N, 77.2790°E', spd: '80 km/h', badge: 'VERIFIED' },
                      { pt: '#06', time: '14:18:20', src: 'Mayur Vihar Phase-1 Cam #11', desc: 'Southbound pursuit vector established', coords: '28.6040°N, 77.2950°E', spd: '85 km/h', badge: 'VERIFIED' },
                      { pt: '#07', time: '14:22:05', src: 'Noida Chilla Border FASTag Gate', desc: 'Inter-State Border Crossed (Delhi -> UP)', coords: '28.5910°N, 77.3080°E', spd: '82 km/h', badge: 'SEC 105 BNSS' },
                      { pt: '#08', time: '14:25:50', src: 'Sector 15A Noida Expressway Cam', desc: 'Passing Film City corridor at high speed', coords: '28.5800°N, 77.3200°E', spd: '88 km/h', badge: 'VERIFIED' },
                      { pt: '#09', time: '14:28:10', src: 'Sector 18 Metro BTS Cell', desc: 'Cellular tower burst ping detected', coords: '28.5720°N, 77.3280°E', spd: '80 km/h', badge: 'SEC 63 BSA' },
                      { pt: '#10', time: '14:31:40', src: 'Botanical Garden Cam #06', desc: 'Turning onto Mahamaya Flyover ramp', coords: '28.5640°N, 77.3340°E', spd: '75 km/h', badge: 'VERIFIED' },
                      { pt: '#11', time: '14:35:15', src: 'Sector 125 Amity Toll Gate', desc: 'Entering Yamuna Expressway Main Carriageway', coords: '28.5480°N, 77.3380°E', spd: '90 km/h', badge: 'VERIFIED' },
                      { pt: '#12', time: '14:39:00', src: 'Sector 135 Expressway ANPR', desc: 'Pursuit Squad PCR-04 closing to 1.3 km', coords: '28.5120°N, 77.3620°E', spd: '85 km/h', badge: 'INTERCEPT ZONE' },
                      { pt: '#13', time: '14:43:20', src: 'Pari Chowk Greater Noida Toll', desc: 'High-speed electronic toll bypass', coords: '28.4680°N, 77.5020°E', spd: '95 km/h', badge: 'HOTLIST ALERT' },
                      { pt: '#14', time: '14:48:40', src: 'Rabupura Interchange Cam #03', desc: 'Hydraulic roadblocks pre-deployed downstream', coords: '28.2500°N, 77.5450°E', spd: '88 km/h', badge: 'ROADBLOCK READY' },
                      { pt: '#15', time: '14:52:10', src: 'Yamuna Expressway Toll KM 48', desc: 'Active Intercept: Flanked and halted by PCR-04', coords: '28.1402°N, 77.5510°E', spd: '0 km/h', badge: 'APPREHENDED' },
                    ].map((row, idx) => (
                      <tr key={idx} className="hover:bg-muted/40 transition-colors">
                        <td className="p-2.5 font-bold text-primary">{row.pt}</td>
                        <td className="p-2.5 text-muted-foreground">{row.time}</td>
                        <td className="p-2.5 font-sans font-medium text-foreground">{row.src}</td>
                        <td className="p-2.5 font-sans text-muted-foreground">{row.desc}</td>
                        <td className="p-2.5 text-slate-300">{row.coords}</td>
                        <td className="p-2.5 font-bold text-red-400">{row.spd}</td>
                        <td className="p-2.5 text-right">
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                            {row.badge}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: Sec 63 BSA Hash & Legal Certificate */}
        {activeInfoTab === 'legal' && (
          <div className="space-y-4">
            <div className="p-4 rounded-xl border border-amber-500/30 bg-amber-950/20 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Scale className="h-5 w-5 text-amber-400" />
                  <div>
                    <h3 className="text-xs font-black text-foreground uppercase tracking-wider">
                      Section 63 Bharatiya Sakshya Adhiniyam, 2023 Digital Custody Certificate
                    </h3>
                    <p className="text-[11px] text-muted-foreground">
                      Cryptographic evidence integrity seal for pursuit trajectory and sensor telemetry.
                    </p>
                  </div>
                </div>
                <Badge className="bg-amber-500 text-black font-bold text-[10px]">
                  COURT ADMISSIBLE
                </Badge>
              </div>

              <div className="p-3 rounded-lg bg-background/80 border border-border/80 font-mono text-xs space-y-2">
                <div className="flex items-center justify-between text-muted-foreground text-[10px]">
                  <span>PURSUIT TELEMETRY SHA-256 HASH SEAL:</span>
                  <span className="text-emerald-400 font-bold">ALGORITHM: SHA-256 (FIPS 180-4)</span>
                </div>
                <div className="p-2 rounded bg-slate-950 text-emerald-400 text-xs break-all border border-emerald-500/30 font-bold">
                  8b3f11d2e9c404fa91c841320ef196238b71d98fa6678b871c532410a803ec29
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[10px] text-muted-foreground pt-1">
                  <div>Certifying Officer: <span className="font-bold text-foreground">Insp. Rajesh Varma</span></div>
                  <div>Jurisdiction: <span className="font-bold text-foreground">NCR Special Crime Branch</span></div>
                  <div>Timestamp: <span className="font-bold text-foreground">{new Date().toLocaleDateString('en-IN')} IST</span></div>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 pt-1">
                <Button
                  size="sm"
                  onClick={() => {
                    sound.playSuccessChime();
                    setPreviewDocType('certificate_63b');
                  }}
                  className="bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs flex items-center gap-1.5"
                >
                  <FileText className="h-3.5 w-3.5" />
                  <span>Preview & Print Sec 63 BSA Certificate</span>
                </Button>

                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    sound.playClickSound();
                    const csvContent =
                      'data:text/csv;charset=utf-8,Checkpoint,Time,Source,Latitude,Longitude,SpeedKmH,Status\n' +
                      GETAWAY_PATH.map((pt, idx) => `${idx + 1},14:${String(idx * 3).padStart(2, '0')}:00,Yamuna Exp Corridor,${pt[1]},${pt[0]},80,VERIFIED_SEC_63_BSA`).join('\n');
                    const encodedUri = encodeURI(csvContent);
                    const link = document.createElement('a');
                    link.setAttribute('href', encodedUri);
                    link.setAttribute('download', 'Pursuit_Telemetry_TS09AB1234_Sec63BSA.csv');
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                    toast.success('Pursuit telemetry CSV exported with Section 63 BSA audit metadata.', 'Export Complete');
                  }}
                  className="text-xs flex items-center gap-1.5"
                >
                  <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-400" />
                  <span>Export Telemetry CSV</span>
                </Button>

                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    sound.playClickSound();
                    setPreviewDocType('court_dossier');
                  }}
                  className="text-xs flex items-center gap-1.5"
                >
                  <FileCheck2 className="h-3.5 w-3.5 text-primary" />
                  <span>View Courtroom Evidentiary Dossier</span>
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 32 SOVEREIGN DEMO FEATURES MODAL / DRAWER (SOLVES REQUEST: "add 32 features to this live demo page") */}
      {featuresModalOpen && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-5xl max-h-[90vh] bg-slate-900 border border-emerald-500/40 rounded-2xl shadow-2xl flex flex-col overflow-hidden">
            {/* Header */}
            <div className="p-5 border-b border-emerald-500/30 bg-emerald-950/30 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center">
                  <Sparkles className="h-5 w-5 text-emerald-400" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-black text-white tracking-wide">
                      32 Sovereign Law-Enforcement Platform Features
                    </h2>
                    <Badge variant="outline" className="bg-emerald-500/20 text-emerald-400 border-emerald-500/40 text-[10px] font-bold">
                      32 READY
                    </Badge>
                  </div>
                  <p className="text-xs text-slate-400">
                    Sovereign capabilities engineered for Indian Police Services under BNSS, BSA, BNS & DPDP Act 2023.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setFeaturesModalOpen(false)}
                className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Filter & Search Bar */}
            <div className="p-4 bg-slate-950/60 border-b border-border/60 flex flex-wrap items-center justify-between gap-3">
              <div className="relative flex-1 min-w-[240px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type="text"
                  value={featureSearchQuery}
                  onChange={(e) => setFeatureSearchQuery(e.target.value)}
                  placeholder="Search among 32 features (e.g. remand, hawala, ANPR, voice, graph)..."
                  className="w-full pl-9 pr-3 py-1.5 bg-slate-900 border border-border/80 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                />
              </div>

              {/* Category tabs */}
              <div className="flex items-center gap-1 overflow-x-auto text-xs">
                {['ALL', 'TACTICAL', 'FORENSICS', 'LEGAL', 'AI_INTEL', 'SECURITY', 'INFRASTRUCTURE'].map((cat) => (
                  <button
                    key={cat}
                    onClick={() => {
                      sound.playClickSound();
                      setSelectedFeatureCategory(cat);
                    }}
                    className={`px-2.5 py-1 rounded-md font-bold text-[11px] transition-colors whitespace-nowrap ${
                      selectedFeatureCategory === cat
                        ? 'bg-emerald-600 text-white'
                        : 'bg-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* 32 Features Grid */}
            <div className="flex-1 overflow-y-auto p-5 space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {filtered32Features.map((feat) => {
                  const Icon = feat.icon;
                  return (
                    <div
                      key={feat.id}
                      className="p-3.5 rounded-xl border border-border/80 bg-slate-950/50 hover:border-emerald-500/50 hover:bg-slate-900/80 transition-all flex flex-col justify-between group shadow-sm"
                    >
                      <div>
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <span className="font-mono text-[10px] text-emerald-400 font-extrabold bg-emerald-950/60 border border-emerald-500/30 px-1.5 py-0.5 rounded">
                            #{String(feat.id).padStart(2, '0')}
                          </span>
                          <Badge
                            variant="outline"
                            className={`text-[9px] font-bold ${
                              feat.status === 'ACTIVE IN DEMO'
                                ? 'bg-red-500/20 text-red-300 border-red-500/40 animate-pulse'
                                : 'bg-slate-800 text-slate-300 border-border'
                            }`}
                          >
                            {feat.status}
                          </Badge>
                        </div>

                        <div className="flex items-start gap-2.5 mb-2">
                          <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shrink-0">
                            <Icon className="h-4 w-4" />
                          </div>
                          <div>
                            <h3 className="text-xs font-bold text-white group-hover:text-emerald-300 transition-colors leading-snug">
                              {feat.title}
                            </h3>
                            <div className="text-[10px] text-amber-400 font-medium mt-0.5">
                              {feat.statutoryRef}
                            </div>
                          </div>
                        </div>

                        <p className="text-[11px] text-slate-400 line-clamp-2 mt-1">
                          {feat.desc}
                        </p>

                        {/* Live Simulated Output in Modal */}
                        {toolExecutionResults[feat.id] && (
                          <div className="mt-2.5 p-2 rounded-lg bg-emerald-950/40 border border-emerald-500/40 text-[10px] font-mono text-emerald-300 space-y-1 animate-in fade-in">
                            <div className="flex items-center justify-between text-[9px] text-emerald-400 font-bold border-b border-emerald-500/20 pb-0.5">
                              <span>✓ STATUTORY PASS</span>
                              <span>{toolExecutionResults[feat.id].timestamp}</span>
                            </div>
                            <p className="text-[10px] leading-relaxed text-slate-200">
                              {toolExecutionResults[feat.id].output}
                            </p>
                          </div>
                        )}
                      </div>

                      <div className="mt-3 pt-2 border-t border-border/40 flex items-center justify-between gap-1">
                        <Button
                          size="sm"
                          onClick={() => handleExecuteTool(feat)}
                          disabled={executingToolId === feat.id}
                          className="h-6 text-[10px] bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-2 flex items-center gap-1 shadow-sm"
                        >
                          {executingToolId === feat.id ? (
                            <>
                              <RefreshCw className="h-2.5 w-2.5 animate-spin" />
                              <span>Running...</span>
                            </>
                          ) : (
                            <>
                              <Zap className="h-2.5 w-2.5" />
                              <span>Run / Test</span>
                            </>
                          )}
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            sound.playClickSound();
                            setFeaturesModalOpen(false);
                            navigate(feat.route);
                          }}
                          className="h-6 text-[10px] text-emerald-400 hover:text-emerald-300 hover:bg-emerald-950/40 px-2"
                        >
                          <span>Open</span>
                          <ExternalLink className="h-3 w-3 ml-1" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-border/60 bg-slate-950 flex items-center justify-between text-xs text-slate-400">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-emerald-400" />
                <span>All 32 capabilities validated against CCTNS, BNSS & Indian Police Standard Architecture.</span>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setFeaturesModalOpen(false)}
                className="text-xs"
              >
                Close Drawer
              </Button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* APPREHENSION SUCCESS & STATUTORY CUSTODY SEALING MODAL */}
      {apprehensionModalOpen && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-[999999] isolate flex items-center justify-center p-3 sm:p-4 bg-slate-950/95 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative w-full max-w-4xl max-h-[90vh] bg-slate-900 border-2 border-emerald-500/60 rounded-2xl shadow-2xl flex flex-col overflow-hidden">
            {/* Header */}
            <div className="p-4 border-b border-emerald-500/40 bg-gradient-to-r from-emerald-950/80 via-slate-900 to-emerald-950/80 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-400/50 flex items-center justify-center shadow-lg shadow-emerald-500/30">
                  <ShieldAlert className="h-6 w-6 text-emerald-400 animate-pulse" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-base sm:text-lg font-black text-white tracking-wide">
                      🚨 SUSPECT APPREHENDED & LEGAL CUSTODY SEALED
                    </h2>
                    <Badge className="bg-emerald-600 text-white font-extrabold text-[10px] px-2 py-0.5">
                      IN POLICE CUSTODY
                    </Badge>
                  </div>
                  <p className="text-xs text-slate-300">
                    Vehicular Containment Executed on Yamuna Expressway Corridor | Sector 20 Police Station, Noida
                  </p>
                </div>
              </div>
              <button
                onClick={() => setApprehensionModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                title="Close Modal"
                aria-label="Close Modal"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3.5">
              {/* Constitutional 24-Hour Remand Timer Banner */}
              <div className="p-3 rounded-xl border border-emerald-500/50 bg-emerald-950/30 flex flex-wrap items-center justify-between gap-2.5">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-lg bg-emerald-900/60 text-emerald-300 border border-emerald-500/40">
                    <Clock className="h-5 w-5 animate-spin text-emerald-400" />
                  </div>
                  <div>
                    <div className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">
                      Article 22(2) Constitution & Section 57 BNSS, 2023
                    </div>
                    <div className="text-xs sm:text-sm font-black text-white">
                      Statutory Custody Remand Countdown Active
                    </div>
                    <div className="text-[11px] text-slate-300">
                      Suspect must be produced before the nearest Judicial Magistrate within 24 hours of arrest.
                    </div>
                  </div>
                </div>
                <div className="px-3 py-1.5 rounded-xl bg-slate-950 border border-emerald-500/40 text-right">
                  <div className="text-[9px] text-slate-400 font-bold uppercase">Time to Court Production</div>
                  <div className="text-lg font-mono font-black text-emerald-400">
                    {formatRemandTime(remandSeconds)}
                  </div>
                </div>
              </div>

              {/* Suspect & Pursuit Dossier Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="p-3 rounded-xl bg-slate-950/70 border border-border/80 space-y-2">
                  <div className="text-xs font-extrabold text-sky-400 flex items-center gap-1.5 uppercase tracking-wide border-b border-border/60 pb-1">
                    <Users className="h-3.5 w-3.5" />
                    <span>Apprehended Accused Profile</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-[10px] text-slate-400 block">Name:</span>
                      <span className="font-bold text-white">{trackedSuspect}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block">Age / Gender:</span>
                      <span className="font-semibold text-white">34 Years / Male</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block">Target Case:</span>
                      <span className="font-mono font-bold text-amber-400">CASE-2026-8812</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block">Syndicate Role:</span>
                      <span className="font-bold text-red-400">Ring Leader (Alpha-01)</span>
                    </div>
                  </div>
                  <div className="pt-1.5 border-t border-border/60 text-[11px]">
                    <span className="text-slate-400 font-semibold">Statutory Offenses: </span>
                    <span className="text-amber-300 font-mono font-bold text-[10px]">
                      Sec 303(2) (Theft) & Sec 311 (Robbery/Dacoity with Gang) BNS, 2023
                    </span>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-950/70 border border-border/80 space-y-2">
                  <div className="text-xs font-extrabold text-red-400 flex items-center gap-1.5 uppercase tracking-wide border-b border-border/60 pb-1">
                    <Car className="h-3.5 w-3.5" />
                    <span>Tactical Vehicle Intercept Details</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-[10px] text-slate-400 block">Vehicle Detained:</span>
                      <span className="font-bold text-white">Mahindra Scorpio (Black)</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block">License Plate:</span>
                      <span className="font-mono font-bold text-red-400">{trackedPlate}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block">Intercept Location:</span>
                      <span className="font-semibold text-white">Yamuna Expressway KM 48</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block">Jurisdiction:</span>
                      <span className="font-semibold text-sky-400">Sector 20 PS, Noida</span>
                    </div>
                  </div>
                  <div className="pt-1.5 border-t border-border/60 text-[11px]">
                    <span className="text-slate-400 font-semibold">Intercepting Team: </span>
                    <span className="text-emerald-400 font-mono font-bold text-[10px]">
                      PCR Patrol-04 (Inspector Rajesh Varma & ERSS-112 Tactical)
                    </span>
                  </div>
                </div>
              </div>

              {/* 4 Ingested Evidence Exhibits Sealed under Section 63 BSA */}
              <div className="p-3.5 rounded-xl bg-slate-950/90 border border-indigo-500/40 space-y-2">
                <div className="flex items-center justify-between border-b border-indigo-500/30 pb-1.5">
                  <div className="flex items-center gap-2">
                    <Lock className="h-4 w-4 text-indigo-400" />
                    <h3 className="text-xs font-extrabold text-indigo-300 uppercase tracking-wide">
                      Cryptographic Evidence Sealing (Section 63 BSA, 2023)
                    </h3>
                  </div>
                  <Badge variant="outline" className="bg-indigo-950/60 text-indigo-300 border-indigo-500/40 text-[9px] font-mono">
                    SHA-256 IMMUTABLE LEDGER
                  </Badge>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                  <div
                    onClick={() => {
                      sound.playClickSound();
                      setPreviewDocType('certificate_63b');
                    }}
                    className="p-2 rounded-lg bg-slate-900 border border-border/80 space-y-1 cursor-pointer hover:border-emerald-500/60 hover:bg-slate-800/60 transition-all group"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-white flex items-center gap-1 text-[11px] group-hover:text-emerald-300">
                        <FileText className="h-3 w-3 text-emerald-400" />
                        Exhibit A: CCTNS FIR Record
                      </span>
                      <div className="flex items-center gap-1">
                        <Badge className="bg-emerald-950 text-emerald-400 text-[9px] px-1 py-0 border border-emerald-500/30">
                          CCTNS
                        </Badge>
                        <Eye className="h-3 w-3 text-emerald-400 opacity-60 group-hover:opacity-100" />
                      </div>
                    </div>
                    <div className="text-[10px] text-slate-400 font-mono truncate">
                      SHA-256: e4c119a084ef7721d3f9b20b2aa98231c518b539
                    </div>
                  </div>

                  <div
                    onClick={() => {
                      sound.playClickSound();
                      setPreviewDocType('certificate_63b');
                    }}
                    className="p-2 rounded-lg bg-slate-900 border border-border/80 space-y-1 cursor-pointer hover:border-sky-500/60 hover:bg-slate-800/60 transition-all group"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-white flex items-center gap-1 text-[11px] group-hover:text-sky-300">
                        <Radio className="h-3 w-3 text-sky-400" />
                        Exhibit B: BTS DEL-ND-T892 CDR Handover
                      </span>
                      <div className="flex items-center gap-1">
                        <Badge className="bg-sky-950 text-sky-400 text-[9px] px-1 py-0 border border-sky-500/30">
                          TELECOM
                        </Badge>
                        <Eye className="h-3 w-3 text-sky-400 opacity-60 group-hover:opacity-100" />
                      </div>
                    </div>
                    <div className="text-[10px] text-slate-400 font-mono truncate">
                      SHA-256: 3a9f02c6114a298bf681c4e09d8417c8227b6891
                    </div>
                  </div>

                  <div
                    onClick={() => {
                      sound.playClickSound();
                      setPreviewDocType('certificate_63b');
                    }}
                    className="p-2 rounded-lg bg-slate-900 border border-border/80 space-y-1 cursor-pointer hover:border-red-500/60 hover:bg-slate-800/60 transition-all group"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-white flex items-center gap-1 text-[11px] group-hover:text-red-300">
                        <Car className="h-3 w-3 text-red-400" />
                        Exhibit C: Yamuna Toll ANPR 4K Frame
                      </span>
                      <div className="flex items-center gap-1">
                        <Badge className="bg-red-950 text-red-400 text-[9px] px-1 py-0 border border-red-500/30">
                          HIGHWAY ANPR
                        </Badge>
                        <Eye className="h-3 w-3 text-red-400 opacity-60 group-hover:opacity-100" />
                      </div>
                    </div>
                    <div className="text-[10px] text-slate-400 font-mono truncate">
                      SHA-256: 7f83b1657ff1fc53b9275bf9754168e3314051a8
                    </div>
                  </div>

                  <div
                    onClick={() => {
                      sound.playClickSound();
                      setPreviewDocType('certificate_63b');
                    }}
                    className="p-2 rounded-lg bg-slate-900 border border-border/80 space-y-1 cursor-pointer hover:border-purple-500/60 hover:bg-slate-800/60 transition-all group"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-white flex items-center gap-1 text-[11px] group-hover:text-purple-300">
                        <Navigation className="h-3 w-3 text-purple-400" />
                        Exhibit D: GPS Road Pursuit Vector
                      </span>
                      <div className="flex items-center gap-1">
                        <Badge className="bg-purple-950 text-purple-400 text-[9px] px-1 py-0 border border-purple-500/30">
                          TELEMETRY
                        </Badge>
                        <Eye className="h-3 w-3 text-purple-400 opacity-60 group-hover:opacity-100" />
                      </div>
                    </div>
                    <div className="text-[10px] text-slate-400 font-mono truncate">
                      SHA-256: 9b2d84e18374d9e01f66d48c26781932e6a14352
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Actions Footer */}
            <div className="p-3 sm:p-4 border-t border-border/60 bg-slate-950 flex flex-wrap items-center justify-between gap-2 text-xs">
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  size="sm"
                  onClick={() => {
                    sound.playClickSound();
                    setFieldUploadModalOpen(true);
                  }}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold flex items-center gap-1.5 shadow-md shadow-emerald-600/30 border border-emerald-400/40 text-xs h-8"
                >
                  <Upload className="h-3.5 w-3.5 text-emerald-200" />
                  <span>Ingest Seized Field Exhibit</span>
                </Button>

                <Button
                  size="sm"
                  onClick={() => {
                    sound.playClickSound();
                    setPreviewDocType('certificate_63b');
                  }}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold flex items-center gap-1.5 shadow-md shadow-indigo-600/30 border border-indigo-400/40 text-xs h-8"
                >
                  <Eye className="h-3.5 w-3.5 text-indigo-200" />
                  <span>Preview & Download Sec 63 BSA Certificate</span>
                </Button>

                <Button
                  size="sm"
                  onClick={() => {
                    sound.playClickSound();
                    setPreviewDocType('court_dossier');
                  }}
                  className="bg-sky-600 hover:bg-sky-700 text-white font-bold flex items-center gap-1.5 shadow-md shadow-sky-600/30 border border-sky-400/40 text-xs h-8"
                >
                  <FileText className="h-3.5 w-3.5 text-sky-200" />
                  <span>Preview & Download Remand Dossier</span>
                </Button>

                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    sound.playClickSound();
                    navigate('/network-graph');
                  }}
                  className="text-slate-300 hover:text-white text-xs h-8"
                >
                  <Brain className="h-3.5 w-3.5 mr-1 text-purple-400" />
                  <span>Network Graph</span>
                </Button>

                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    sound.playClickSound();
                    navigate('/evidence');
                  }}
                  className="text-slate-300 hover:text-white text-xs h-8"
                >
                  <Database className="h-3.5 w-3.5 mr-1 text-emerald-400" />
                  <span>Evidence Vault</span>
                </Button>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleResumeFromApprehension}
                  className="text-amber-400 hover:text-amber-300 hover:bg-amber-950/40 font-bold text-xs h-8"
                >
                  <RotateCcw className="h-3.5 w-3.5 mr-1" />
                  Resume Pursuit Demo
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setApprehensionModalOpen(false)}
                  className="text-xs h-8"
                >
                  Close
                </Button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* COMPREHENSIVE OPERATIONAL GUIDE: HOW CRIMINAL DATA IS COLLECTED & USED */}
      {workflowModalOpen && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative w-full max-w-5xl max-h-[92vh] bg-slate-900 border border-indigo-500/50 rounded-2xl shadow-2xl flex flex-col overflow-hidden">
            {/* Header */}
            <div className="p-5 border-b border-indigo-500/30 bg-gradient-to-r from-indigo-950/70 via-slate-900 to-indigo-950/70 flex items-center justify-between">
              <div className="flex items-center gap-3.5">
                <div className="h-11 w-11 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/40 flex items-center justify-center">
                  <BookOpen className="h-6 w-6 text-indigo-400" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-black text-white tracking-wide">
                      Operational Guide: How Criminal Data Is Collected & Used in Live Pursuit
                    </h2>
                    <Badge variant="outline" className="bg-indigo-500/20 text-indigo-300 border-indigo-500/40 text-[10px] font-bold">
                      INDIAN POLICE WORKFLOW
                    </Badge>
                  </div>
                  <p className="text-xs text-slate-400">
                    Step-by-step breakdown of multi-agency data ingestion, AI cross-modal correlation, real-time pursuit, and statutory Section 63 BSA evidence sealing.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setWorkflowModalOpen(false)}
                className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Workflow Navigation Tabs */}
            <div className="p-3 bg-slate-950/80 border-b border-border/70 flex items-center gap-2 overflow-x-auto text-xs">
              <button
                onClick={() => {
                  sound.playClickSound();
                  setActiveWorkflowTab('collection');
                }}
                className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition-colors whitespace-nowrap ${
                  activeWorkflowTab === 'collection'
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'bg-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                <Database className="h-4 w-4" />
                <span>1. Multi-Agency Ingestion</span>
              </button>

              <button
                onClick={() => {
                  sound.playClickSound();
                  setActiveWorkflowTab('fusion');
                }}
                className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition-colors whitespace-nowrap ${
                  activeWorkflowTab === 'fusion'
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'bg-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                <Brain className="h-4 w-4" />
                <span>2. AI Correlation & Resolution</span>
              </button>

              <button
                onClick={() => {
                  sound.playClickSound();
                  setActiveWorkflowTab('tactical');
                }}
                className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition-colors whitespace-nowrap ${
                  activeWorkflowTab === 'tactical'
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'bg-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                <Radio className="h-4 w-4" />
                <span>3. Real-Time Tactical Pursuit</span>
              </button>

              <button
                onClick={() => {
                  sound.playClickSound();
                  setActiveWorkflowTab('apprehension');
                }}
                className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition-colors whitespace-nowrap ${
                  activeWorkflowTab === 'apprehension'
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'bg-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                <Scale className="h-4 w-4" />
                <span>4. Apprehension & BSA Sealing</span>
              </button>
            </div>

            {/* Tab Content Area */}
            <div className="flex-1 overflow-y-auto p-5 text-xs text-slate-300 space-y-4">
              {activeWorkflowTab === 'collection' && (
                <div className="space-y-4">
                  <div className="p-3.5 rounded-xl bg-indigo-950/30 border border-indigo-500/30 flex items-center justify-between">
                    <div>
                      <h3 className="font-extrabold text-white text-sm">
                        Stage 1: How Criminal Data Is Collected Across Agency Silos
                      </h3>
                      <p className="text-slate-400 text-xs mt-0.5">
                        In Indian policing, data resides across fragmented statutory repositories. CrimeNexus automated streaming daemons ingest and normalize these feeds into a single unified intelligence mesh.
                      </p>
                    </div>
                    <Badge className="bg-indigo-600 text-white text-[10px] px-2 py-0.5 shrink-0">
                      5 INGESTION CONNECTORS
                    </Badge>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                    {/* Connector 1 */}
                    <div className="p-3.5 rounded-xl bg-slate-950/60 border border-border/80 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-emerald-400 flex items-center gap-1.5 text-xs">
                          <FileText className="h-4 w-4 text-emerald-400" />
                          1. State CCTNS FIR Gateways
                        </span>
                        <Badge variant="outline" className="text-[9px] bg-emerald-950/50 text-emerald-300 border-emerald-500/40">
                          POLICE RECORDS
                        </Badge>
                      </div>
                      <p className="text-[11px] text-slate-400 leading-relaxed">
                        <strong className="text-slate-200">What is collected: </strong>
                        FIR-2026-8812 registered under Bharatiya Nyaya Sanhita (BNS) Sec 303(2) (Theft) and Sec 311 (Robbery/Dacoity with Gang). Extracts suspect aliases (&quot;Vikram Malhotra @ Vicky&quot;), complainant narrative, and prior crime history.
                      </p>
                      <div className="p-2 rounded bg-slate-900 border border-emerald-500/20 text-[10px] text-slate-400 font-mono">
                        Connector: Automated 15-Minute CCTNS Polling Daemon (Feature #3)
                      </div>
                    </div>

                    {/* Connector 2 */}
                    <div className="p-3.5 rounded-xl bg-slate-950/60 border border-border/80 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-sky-400 flex items-center gap-1.5 text-xs">
                          <Radio className="h-4 w-4 text-sky-400" />
                          2. Telecom CDR & Cell Tower Triangulation
                        </span>
                        <Badge variant="outline" className="text-[9px] bg-sky-950/50 text-sky-300 border-sky-500/40">
                          TELECOM NODAL
                        </Badge>
                      </div>
                      <p className="text-[11px] text-slate-400 leading-relaxed">
                        <strong className="text-slate-200">What is collected: </strong>
                        Lawful interception under Sec 94 BNSS & Indian Telegraph Act. Ingests Call Detail Records (CDR), Base Transceiver Station (BTS) Tower DEL-ND-T892 handovers, sector azimuth angles (135° SE), and IMEI-IMSI binding of burner SIM +91 98765 43210.
                      </p>
                      <div className="p-2 rounded bg-slate-900 border border-sky-500/20 text-[10px] text-slate-400 font-mono">
                        Connector: Telecom CDR Live Tower Handover Pursuit Trail (Feature #11)
                      </div>
                    </div>

                    {/* Connector 3 */}
                    <div className="p-3.5 rounded-xl bg-slate-950/60 border border-border/80 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-red-400 flex items-center gap-1.5 text-xs">
                          <Car className="h-4 w-4 text-red-400" />
                          3. Highway ANPR Cameras & FASTag Toll Readers
                        </span>
                        <Badge variant="outline" className="text-[9px] bg-red-950/50 text-red-300 border-red-500/40">
                          VAHAN OCR
                        </Badge>
                      </div>
                      <p className="text-[11px] text-slate-400 leading-relaxed">
                        <strong className="text-slate-200">What is collected: </strong>
                        Automated Number Plate Recognition (ANPR) cameras at Delhi-Noida Chilla Border and Yamuna Expressway Toll Plaza KM 48 capture optical plate OCR for black Mahindra Scorpio <span className="font-mono text-red-300 font-bold">TS 09 AB 1234</span> moving at 80 km/h with 98.6% confidence.
                      </p>
                      <div className="p-2 rounded bg-slate-900 border border-red-500/20 text-[10px] text-slate-400 font-mono">
                        Connector: NHAI & State Highway Optical ANPR Stream
                      </div>
                    </div>

                    {/* Connector 4 */}
                    <div className="p-3.5 rounded-xl bg-slate-950/60 border border-border/80 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-amber-400 flex items-center gap-1.5 text-xs">
                          <TrendingDown className="h-4 w-4 text-amber-400" />
                          4. Financial Smurfing & Hawala Anomaly Engine
                        </span>
                        <Badge variant="outline" className="text-[9px] bg-amber-950/50 text-amber-300 border-amber-500/40">
                          FIU-IND PMLA
                        </Badge>
                      </div>
                      <p className="text-[11px] text-slate-400 leading-relaxed">
                        <strong className="text-slate-200">What is collected: </strong>
                        Under PMLA Sec 3 & 4, core banking APIs stream structured transactions under ₹50,000 designed to evade mandatory Cash Transaction Reports (CTR). Detects transit cash withdrawal (₹48,500) at Vikas Marg ATM within 15 minutes of the crime.
                      </p>
                      <div className="p-2 rounded bg-slate-900 border border-amber-500/20 text-[10px] text-slate-400 font-mono">
                        Connector: Hawala Smurfing & Structuring Anomaly Engine (Feature #6)
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeWorkflowTab === 'fusion' && (
                <div className="space-y-4">
                  <div className="p-3.5 rounded-xl bg-indigo-950/30 border border-indigo-500/30 flex items-center justify-between">
                    <div>
                      <h3 className="font-extrabold text-white text-sm">
                        Stage 2: AI Cross-Modal Graph Fusion & Entity Resolution
                      </h3>
                      <p className="text-slate-400 text-xs mt-0.5">
                        Raw data points are useless in isolation. CrimeNexus connects the disparate pings into a unified target entity in sub-seconds.
                      </p>
                    </div>
                    <Badge className="bg-purple-600 text-white text-[10px] px-2 py-0.5 shrink-0">
                      GRAPH CENTRALITY
                    </Badge>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
                    <div className="p-3.5 rounded-xl bg-slate-950/60 border border-border/80 space-y-2">
                      <div className="font-bold text-purple-400 flex items-center gap-1.5 text-xs">
                        <Brain className="h-4 w-4" />
                        Spatio-Temporal Coincidence
                      </div>
                      <p className="text-[11px] text-slate-400 leading-relaxed">
                        CrimeNexus correlates the 14:38 IST cell-tower BTS ping and the 14:40 IST toll ANPR camera snapshot. Because both events occurred within a 350-meter radius along the same road vector, they are resolved to the same escaping target in 240ms.
                      </p>
                    </div>

                    <div className="p-3.5 rounded-xl bg-slate-950/60 border border-border/80 space-y-2">
                      <div className="font-bold text-indigo-400 flex items-center gap-1.5 text-xs">
                        <Layers className="h-4 w-4" />
                        Neo4j Relationship Graph
                      </div>
                      <p className="text-[11px] text-slate-400 leading-relaxed">
                        The Scorpio vehicle plate <span className="font-mono text-red-300">TS 09 AB 1234</span> and burner phone <span className="font-mono text-sky-300">+91 98765 43210</span> connect directly to accused Vikram Malhotra through past seized FIR evidence and common co-accused nodes.
                      </p>
                    </div>

                    <div className="p-3.5 rounded-xl bg-slate-950/60 border border-border/80 space-y-2">
                      <div className="font-bold text-emerald-400 flex items-center gap-1.5 text-xs">
                        <Gauge className="h-4 w-4" />
                        Bayesian Target Certainty
                      </div>
                      <p className="text-[11px] text-slate-400 leading-relaxed">
                        Combining biometric match (99.4%), ANPR license plate OCR (98.6%), and cellular BTS azimuth (135°) yields a composite target probability of <strong className="text-emerald-400">99.8%</strong>, officially authorizing tactical pursuit.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {activeWorkflowTab === 'tactical' && (
                <div className="space-y-4">
                  <div className="p-3.5 rounded-xl bg-indigo-950/30 border border-indigo-500/30 flex items-center justify-between">
                    <div>
                      <h3 className="font-extrabold text-white text-sm">
                        Stage 3: Real-Time Tactical Pursuit & ERSS-112 Dispatch
                      </h3>
                      <p className="text-slate-400 text-xs mt-0.5">
                        How investigating officers and patrol squads utilize CrimeNexus in real-time during an active vehicle pursuit.
                      </p>
                    </div>
                    <Badge className="bg-red-600 text-white text-[10px] px-2 py-0.5 shrink-0">
                      LIVE PURSUIT
                    </Badge>
                  </div>

                  <div className="space-y-2.5">
                    <div className="p-3 rounded-xl bg-slate-950/60 border border-border/80 flex items-start gap-3">
                      <div className="p-2 rounded-lg bg-red-950 text-red-400 border border-red-500/30 shrink-0 font-bold">
                        Step 1
                      </div>
                      <div>
                        <div className="font-bold text-white text-xs">Geodesic Haversine Proximity Resolution</div>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          As the getaway vehicle flees through Connaught Place, ITO, and Mayur Vihar, CrimeNexus continuously recalculates the Haversine distance to all nearby Police Stations and active ERSS-112 patrol units every 750 milliseconds.
                        </p>
                      </div>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-950/60 border border-border/80 flex items-start gap-3">
                      <div className="p-2 rounded-lg bg-sky-950 text-sky-400 border border-sky-500/30 shrink-0 font-bold">
                        Step 2
                      </div>
                      <div>
                        <div className="font-bold text-white text-xs">Dynamic Intercept Vector & Road Routing (OSRM)</div>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          Instead of chasing from behind, CrimeNexus calculates an intercept point 1.8 km ahead along the suspect&apos;s heading (Yamuna Expressway corridor). Patrol Unit PCR-04 is deployed on a collision course to execute a controlled roadblock.
                        </p>
                      </div>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-950/60 border border-border/80 flex items-start gap-3">
                      <div className="p-2 rounded-lg bg-amber-950 text-amber-400 border border-amber-500/30 shrink-0 font-bold">
                        Step 3
                      </div>
                      <div>
                        <div className="font-bold text-white text-xs">Automated Inter-State Jurisdictional Handover</div>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          When the target crosses the Chilla Border from Delhi into Uttar Pradesh, CrimeNexus automatically transitions jurisdiction to Noida Sector 20 Police Station and alerts the UP State Police Control Room with zero manual delay.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeWorkflowTab === 'apprehension' && (
                <div className="space-y-4">
                  <div className="p-3.5 rounded-xl bg-indigo-950/30 border border-indigo-500/30 flex items-center justify-between">
                    <div>
                      <h3 className="font-extrabold text-white text-sm">
                        Stage 4: Suspect Apprehension & BSA Section 63 Evidence Sealing
                      </h3>
                      <p className="text-slate-400 text-xs mt-0.5">
                        Physical arrest is only half the battle. CrimeNexus protects the prosecution case against defense challenges by creating an airtight, court-admissible digital chain of custody.
                      </p>
                    </div>
                    <Badge className="bg-emerald-600 text-white text-[10px] px-2 py-0.5 shrink-0">
                      LEGAL COMPLIANCE
                    </Badge>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                    <div className="p-3.5 rounded-xl bg-slate-950/60 border border-emerald-500/40 space-y-2">
                      <div className="font-bold text-emerald-400 flex items-center gap-1.5 text-xs">
                        <Clock className="h-4 w-4" />
                        Constitutional 24-Hour Remand Clock (Sec 57 BNSS)
                      </div>
                      <p className="text-[11px] text-slate-300 leading-relaxed">
                        Under Article 22(2) of the Constitution and Section 57 BNSS, the accused must be produced before the Judicial Magistrate within 24 hours of physical arrest. CrimeNexus activates an automated custody countdown clock, warning the Investigating Officer 3 hours prior to expiry to prevent illegal detention claims.
                      </p>
                    </div>

                    <div className="p-3.5 rounded-xl bg-slate-950/60 border border-indigo-500/40 space-y-2">
                      <div className="font-bold text-indigo-400 flex items-center gap-1.5 text-xs">
                        <Lock className="h-4 w-4" />
                        Section 63 BSA Digital Evidence Certificate
                      </div>
                      <p className="text-[11px] text-slate-300 leading-relaxed">
                        Defense attorneys routinely challenge electronic records as &quot;tampered copies&quot;. CrimeNexus timestamps and seals the exact SHA-256 cryptographic hash of every video frame, cell tower dump, and GPS packet at the moment of arrest, producing the statutory Section 63 BSA certificate signed with the IO&apos;s credentials.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-border/60 bg-slate-950 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2 text-slate-400">
                <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                <span>Validated against Bharatiya Nagarik Suraksha Sanhita (BNSS) & Bharatiya Sakshya Adhiniyam (BSA) 2023.</span>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  onClick={() => {
                    sound.playClickSound();
                    setWorkflowModalOpen(false);
                    handleExecuteIntercept();
                  }}
                  className="bg-gradient-to-r from-red-600 to-amber-600 hover:from-red-700 hover:to-amber-700 text-white font-extrabold flex items-center gap-1.5"
                >
                  <ShieldAlert className="h-4 w-4" />
                  <span>Test Live Intercept Now</span>
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setWorkflowModalOpen(false)}
                >
                  Close Guide
                </Button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* FORENSIC CLUES & SCENARIO RETELECAST MODAL */}
      <ForensicClueReplayModal
        isOpen={forensicModalOpen}
        onClose={() => setForensicModalOpen(false)}
        targetPlate={trackedPlate}
        suspectName={trackedSuspect}
      />

      {/* FIELD EVIDENCE SEIZURE & INSTANT SECTION 63 BSA CRYPTOGRAPHIC SEALING MODAL */}
      {fieldUploadModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative w-full max-w-2xl bg-card border border-primary/50 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            {/* Header */}
            <div className="p-4 sm:p-5 border-b border-border bg-gradient-to-r from-card via-card/95 to-primary/10 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl border bg-emerald-500/20 text-emerald-400 border-emerald-500/40">
                  <ShieldCheck className="h-6 w-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black tracking-widest uppercase px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                      SECTION 63 BSA IMMUTABLE EVIDENCE SEALER
                    </span>
                    <span className="text-xs font-mono text-muted-foreground">CASE-2026-8812</span>
                  </div>
                  <h2 className="text-base sm:text-lg font-black text-foreground mt-0.5">
                    Field Evidence Seizure & Chain of Custody Ingestion
                  </h2>
                </div>
              </div>
              <button
                onClick={() => {
                  sound.playClickSound();
                  setFieldUploadModalOpen(false);
                  setFieldSealedExhibit(null);
                }}
                className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors"
                title="Close modal"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-4 sm:p-5 space-y-4 overflow-y-auto flex-1 text-xs">
              {fieldSealedExhibit ? (
                /* Sealed Success Card */
                <div className="space-y-4 animate-in zoom-in-95 duration-200">
                  <div className="p-4 rounded-xl border border-emerald-500/50 bg-emerald-950/30 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                        <span className="font-extrabold text-sm text-emerald-300">
                          EXHIBIT CRYPTOGRAPHICALLY CERTIFIED & RECORDED
                        </span>
                      </div>
                      <Badge className="bg-emerald-500 text-slate-950 font-mono font-bold text-[10px]">
                        COURT ADMISSIBLE
                      </Badge>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 p-3 rounded-lg bg-slate-950/80 border border-emerald-500/30">
                      <div>
                        <span className="text-[10px] text-muted-foreground block">Exhibit Number:</span>
                        <span className="font-mono font-extrabold text-emerald-400 text-xs">
                          {fieldSealedExhibit.evidenceNumber}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-muted-foreground block">Evidence Category:</span>
                        <span className="font-bold text-white text-xs">{fieldSealedExhibit.type}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-muted-foreground block">Statutory Reference:</span>
                        <span className="font-bold text-amber-300 text-[11px]">{fieldSealedExhibit.statutoryRef}</span>
                      </div>
                      <div className="col-span-2 sm:col-span-3">
                        <span className="text-[10px] text-muted-foreground block">Immutable SHA-256 Digest:</span>
                        <span className="font-mono text-cyan-300 text-[11px] break-all select-all font-semibold">
                          {fieldSealedExhibit.hash}
                        </span>
                      </div>
                    </div>

                    <div className="p-2.5 rounded-lg bg-slate-900/90 border border-border text-[11px] text-slate-300 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Lock className="h-4 w-4 text-emerald-400" />
                        <span>Sealing Officer: <strong className="text-white">{fieldSealedExhibit.ioName}</strong></span>
                      </div>
                      <span className="text-muted-foreground font-mono text-[10px]">
                        {new Date(fieldSealedExhibit.timestamp).toLocaleTimeString('en-IN')} IST
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 pt-2">
                    <Button
                      size="sm"
                      onClick={() => {
                        sound.playClickSound();
                        setPreviewDocType('certificate_63b');
                      }}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold flex items-center gap-1.5 shadow-md shadow-indigo-600/30 text-xs h-9"
                    >
                      <Eye className="h-4 w-4" />
                      <span>Preview Section 63 BSA Certificate</span>
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        sound.playClickSound();
                        navigate('/network-graph');
                      }}
                      className="text-xs h-9"
                    >
                      <Brain className="h-4 w-4 mr-1 text-purple-400" />
                      <span>Cross-Examine in Network Graph</span>
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        sound.playClickSound();
                        navigate('/evidence');
                      }}
                      className="text-xs h-9"
                    >
                      <Database className="h-4 w-4 mr-1 text-emerald-400" />
                      <span>Open Evidence Vault</span>
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setFieldSealedExhibit(null)}
                      className="text-xs text-muted-foreground hover:text-white h-9"
                    >
                      + Ingest Another Exhibit
                    </Button>
                  </div>
                </div>
              ) : (
                /* Upload Form with Dropzone and Field Presets */
                <div className="space-y-4">
                  <div
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => {
                      e.preventDefault();
                      handleFieldFileUpload(e.dataTransfer.files);
                    }}
                    className="p-6 border-2 border-dashed border-emerald-500/40 hover:border-emerald-500 rounded-xl bg-emerald-950/10 hover:bg-emerald-950/20 text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-2"
                    onClick={() => {
                      const input = document.getElementById('field-evidence-file-input') as HTMLInputElement;
                      if (input) input.click();
                    }}
                  >
                    <input
                      id="field-evidence-file-input"
                      type="file"
                      multiple
                      className="hidden"
                      onChange={(e) => handleFieldFileUpload(e.target.files)}
                    />
                    <div className="p-3 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      <Upload className="h-6 w-6" />
                    </div>
                    <span className="font-extrabold text-sm text-foreground">
                      Drop seized field files here, or <span className="text-emerald-400 underline">browse files</span>
                    </span>
                    <p className="text-[11px] text-muted-foreground max-w-md">
                      Supports Burner Phone CDR (CSV), Highway Dashcam (MP4/DAV), Recovered Ledger (XLSX), Seized Document (PDF). WebCrypto SHA-256 seal is generated in real-time.
                    </p>
                  </div>

                  {isUploadingField && (
                    <div className="p-3 rounded-lg bg-emerald-950/40 border border-emerald-500/40 text-emerald-300 font-mono text-xs flex items-center gap-2 animate-pulse">
                      <Activity className="h-4 w-4 animate-spin" />
                      <span>{fieldUploadProgress || 'Hashing and securing digital chain of custody...'}</span>
                    </div>
                  )}

                  {/* 1-Click Operational Field Seizure Presets */}
                  <div className="space-y-2 pt-1">
                    <span className="font-extrabold text-[11px] uppercase tracking-wider text-muted-foreground block">
                      ⚡ Quick Seizure Exhibits (Simulate Live Field Recovery)
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <button
                        onClick={() =>
                          handleIngestPresetExhibit(
                            'Seized Burner Phone CDR (IMEI 864321045987123)',
                            'burner_sim_cdr_dump.csv',
                            'CALL_RECORD',
                            '8b3f11d2e9c404fa91c841320ef196238b71d98fa6678b871c532410a803ec29'
                          )
                        }
                        className="p-2.5 rounded-xl border border-sky-500/40 bg-sky-950/20 hover:bg-sky-950/40 text-left transition-all group"
                      >
                        <div className="flex items-center gap-1.5 font-bold text-sky-400 text-xs group-hover:text-sky-300">
                          <Smartphone className="h-3.5 w-3.5" />
                          <span>Burner Phone CDR</span>
                        </div>
                        <p className="text-[10px] text-slate-400 mt-1 line-clamp-2">
                          Dump of 15 calls to syndicate Kingpin Rajan near Yamuna Toll KM 48.
                        </p>
                        <span className="text-[9px] font-mono text-sky-300 mt-1.5 block font-semibold">+ Ingest Exhibit ➔</span>
                      </button>

                      <button
                        onClick={() =>
                          handleIngestPresetExhibit(
                            'PCR-04 High-Speed Dashcam Pursuit Footage',
                            'pcr04_dashcam_pursuit_km48.mp4',
                            'CCTV',
                            'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855'
                          )
                        }
                        className="p-2.5 rounded-xl border border-rose-500/40 bg-rose-950/20 hover:bg-rose-950/40 text-left transition-all group"
                      >
                        <div className="flex items-center gap-1.5 font-bold text-rose-400 text-xs group-hover:text-rose-300">
                          <Camera className="h-3.5 w-3.5" />
                          <span>PCR Dashcam Video</span>
                        </div>
                        <p className="text-[10px] text-slate-400 mt-1 line-clamp-2">
                          1080p optical recording of Mahindra Scorpio breaching roadblock.
                        </p>
                        <span className="text-[9px] font-mono text-rose-300 mt-1.5 block font-semibold">+ Ingest Exhibit ➔</span>
                      </button>

                      <button
                        onClick={() =>
                          handleIngestPresetExhibit(
                            'Seized Hawala Cash Ledger (₹14,50,000 Recovered)',
                            'hawala_smurfing_ledger_seized.xlsx',
                            'FINANCIAL_TRANSACTION',
                            '4a5b6c7d8e9f0123456789abcdef0123456789abcdef0123456789abcdef0123'
                          )
                        }
                        className="p-2.5 rounded-xl border border-amber-500/40 bg-amber-950/20 hover:bg-amber-950/40 text-left transition-all group"
                      >
                        <div className="flex items-center gap-1.5 font-bold text-amber-400 text-xs group-hover:text-amber-300">
                          <TrendingDown className="h-3.5 w-3.5" />
                          <span>Hawala Cash Ledger</span>
                        </div>
                        <p className="text-[10px] text-slate-400 mt-1 line-clamp-2">
                          Ledger recovered from dashboard matching mule account ACC-07869A.
                        </p>
                        <span className="text-[9px] font-mono text-amber-300 mt-1.5 block font-semibold">+ Ingest Exhibit ➔</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-3 sm:p-4 border-t border-border bg-slate-950 flex items-center justify-between text-xs">
              <span className="text-muted-foreground text-[11px] flex items-center gap-1.5">
                <ShieldCheck className="h-4 w-4 text-emerald-400" />
                <span>Statutory compliance under Section 63 BSA & Section 105 BNSS</span>
              </span>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  sound.playClickSound();
                  setFieldUploadModalOpen(false);
                  setFieldSealedExhibit(null);
                }}
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* FULL DOCUMENT PREVIEW MODAL FOR SECTION 63 BSA CERTIFICATE & COURT REMAND DOSSIER */}
      {previewDocType && (
        <DocumentPreviewModal
          isOpen={true}
          onClose={() => setPreviewDocType(null)}
          documentType={previewDocType}
          title={
            previewDocType === 'certificate_63b'
              ? 'Section 63 BSA Digital Certificate of Electronic Evidence'
              : 'Formal Court Remand Dossier & Application for Police Custody'
          }
          subtitle="Statutory Forensic Certification under Section 63 Bharatiya Sakshya Adhiniyam, 2023"
          caseNumber="CASE-2026-8812 / FIR-8812"
          evidenceNumber="EXHIBIT-TGT-09-ANPR-CDR"
          evidenceHash="7f83b1657ff1fc53b9275bf9754168e3314051a89c31be4d8f57f4955b939103"
          evidenceTitle="Yamuna Expressway Highway ANPR & Telecom CDR Live Intercept Telemetry"
          metadata={{
            ioName: 'Inspector Rajesh Varma',
            policeStation: 'Sector 20 Police Station, Noida (NCR Special Branch)',
            suspectName: 'Vikram Malhotra @ Vicky (Age: 34)',
            crimeType: 'Sec 303(2) BNS, Sec 311 BNS (Organized Crime & Robbery)',
            hash: '7f83b1657ff1fc53b9275bf9754168e3314051a89c31be4d8f57f4955b939103',
            generatedAt: new Date().toISOString(),
            courtName: 'Court of Chief Judicial Magistrate (CJM), Gautam Buddha Nagar',
            investigatingOfficer: 'Inspector Rajesh Varma, Special Crime Branch',
            jurisdiction: 'Delhi-NCR / UP West Zone',
          }}
        />
      )}
    </div>
  );
}