import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Train,
  Camera,
  ShieldAlert,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  User,
  Search,
  Scan,
  Radio,
  PhoneCall,
  Printer,
  Download,
  Share2,
  Eye,
  RefreshCw,
  Clock,
  MapPin,
  Car,
  FileText,
  BadgeAlert,
  Sparkles,
  Compass,
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { sound } from '../../utils/soundEffects';
import { useToast } from '../../components/ui/Toast';
import { FileExportPreviewModal } from '../../components/common/FileExportPreviewModal';
import { NearestThanaDispatchModal } from '../../components/common/NearestThanaDispatchModal';

interface PassengerVerificationResult {
  status: 'WANTED_FUGITIVE' | 'VERIFIED_CITIZEN' | 'NO_MATCH';
  aadhaarVid: string;
  fullName: string;
  age: number;
  gender: string;
  registeredAddress: string;
  mobileMasked: string;
  facialConfidence: number;
  pnrNumber: string;
  trainNumber: string;
  trainName: string;
  coach: string;
  berth: string;
  locNotice?: {
    caseNumber: string;
    sections: string;
    issuingCourt: string;
    reward: string;
    warning: string;
  };
}

export function RailwayVerificationPage() {
  const toast = useToast();

  const [activeTab, setActiveTab] = useState<'FACIAL_SCAN' | 'PNR_LOOKUP' | 'TRAIN_ROSTER'>('FACIAL_SCAN');
  const [selectedScenario, setSelectedScenario] = useState<'FUGITIVE' | 'CITIZEN'>('FUGITIVE');
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [scanProgress, setScanProgress] = useState<number>(0);
  const [verificationResult, setVerificationResult] = useState<PassengerVerificationResult | null>(null);
  
  // Modals
  const [exportModalOpen, setExportModalOpen] = useState<boolean>(false);
  const [thanaModalOpen, setThanaModalOpen] = useState<boolean>(false);
  const [rpfAlertSent, setRpfAlertSent] = useState<boolean>(false);
  const [platformLockdownSent, setPlatformLockdownSent] = useState<boolean>(false);

  // Manual PNR input state
  const [manualPnr, setManualPnr] = useState<string>('245-8910245');

  // Autonomous No-TTE Gate / Turnstile Scan Mode Toggle
  const [isAutonomousGateMode, setIsAutonomousGateMode] = useState<boolean>(true);
  const [selectedVictimMatch, setSelectedVictimMatch] = useState<string | null>(null);

  // Victims & Missing Persons Track Registry
  const RAILWAY_TRACK_VICTIMS = [
    {
      id: 'aanya',
      name: 'Aanya Sharma',
      age: 8,
      gender: 'Female',
      photo: 'https://images.unsplash.com/photo-1543332164-6e82f355badc?w=400',
      caseNumber: 'MP-2026-DEMO-001',
      station: 'Lajpat Nagar / NDLS Platform 2',
      missingSince: '18 hours ago (3:30 PM)',
      description: 'Blue DPS school uniform, red school bag, scar on left knee',
      urgency: 'CRITICAL • Asthma Inhaler (5h 50m window)',
      officer: 'Inspector Rajesh Varma (Missing Persons Unit)',
      status: 'HIGH-ALERT INTERCEPT ACTIVE',
    },
    {
      id: 'aarav',
      name: 'Aarav Kapoor',
      age: 11,
      gender: 'Male',
      photo: 'https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?w=400',
      caseNumber: 'MP-2026-DEL-0412',
      station: 'GK-II / Old Delhi Station Platform 4',
      missingSince: '6 hours ago (11:00 AM)',
      description: 'Red soccer jersey #10, black shorts, sports wristband',
      urgency: 'CRITICAL • Type-1 Diabetes (Insulin pump)',
      officer: 'SI Neha Sharma (South Dist SAR)',
      status: 'TRANSIT WATCH ACTIVE',
    },
    {
      id: 'meera',
      name: 'Meera Joshi',
      age: 16,
      gender: 'Female',
      photo: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400',
      caseNumber: 'MP-2026-DEL-0789',
      station: 'Hauz Khas / Anand Vihar Terminal',
      missingSince: '12 hours ago (9:15 PM)',
      description: 'Navy blue college hoodie, silver glasses, yellow tote',
      urgency: 'HIGH ALERT • Suspected Inter-City Trafficking Racket',
      officer: 'Insp. Vikram Singh (Crime Branch)',
      status: 'RPF FLYING SQUAD DEPLOYED',
    },
    {
      id: 'rohan',
      name: 'Rohan Mehta',
      age: 6,
      gender: 'Male',
      photo: 'https://images.unsplash.com/photo-1485546246426-74dc88dec4d9?w=400',
      caseNumber: 'MP-2026-DEL-1024',
      station: 'Chandni Chowk / Delhi Sarai Rohilla',
      missingSince: '3 hours ago (2:10 PM)',
      description: 'Yellow cap, green dinosaur shirt, brown sandals',
      urgency: 'CODE AMBER • Non-verbal neurodivergent child',
      officer: 'Insp. Sunita Rao (Central SAR)',
      status: 'AMBER RESCUE ACTIVE',
    },
  ];

  // Trigger Biometric Facial Scan
  const handleStartFacialScan = () => {
    sound.playRadarPing();
    setIsScanning(true);
    setScanProgress(15);
    setVerificationResult(null);
    setRpfAlertSent(false);
    setPlatformLockdownSent(false);

    setTimeout(() => setScanProgress(45), 600);
    setTimeout(() => {
      setScanProgress(75);
      sound.playRadarPing();
    }, 1200);

    setTimeout(() => {
      setScanProgress(100);
      setIsScanning(false);

      if (selectedScenario === 'FUGITIVE') {
        sound.playSirenAlert();
        setVerificationResult({
          status: 'WANTED_FUGITIVE',
          aadhaarVid: 'XXXX-XXXX-8921',
          fullName: 'Vikram Malhotra @ Vicky',
          age: 34,
          gender: 'Male',
          registeredAddress: 'House 42, Gali 3, Karol Bagh, Central Delhi 110005',
          mobileMasked: '+91 98*** **234',
          facialConfidence: 99.4,
          pnrNumber: '245-8910245',
          trainNumber: '12424',
          trainName: 'New Delhi - Dibrugarh Rajdhani Express',
          coach: 'B4',
          berth: 'Berth 28 (Side Lower)',
          locNotice: {
            caseNumber: 'CASE-2026-8812 / FIR-8812',
            sections: 'Section 303(2) BNS, Section 311 BNS, Section 102 CrPC',
            issuingCourt: 'Court of Chief Judicial Magistrate, Gautam Buddha Nagar',
            reward: '₹ 2,00,000 Cash Bounty',
            warning: 'ARMED ESCAPEE • DO NOT ALERT SUSPECT • MOBILIZE RPF ESCORT IMMEDIATELY',
          },
        });
        toast.warning(
          'RED NOTICE FUGITIVE DETECTED! Vikram Malhotra identified in Coach B4 Berth 28.',
          'Biometric Watchlist Alert'
        );
      } else {
        sound.playSuccessChime();
        setVerificationResult({
          status: 'VERIFIED_CITIZEN',
          aadhaarVid: 'XXXX-XXXX-4412',
          fullName: 'Priya Ananya Sharma',
          age: 29,
          gender: 'Female',
          registeredAddress: 'Flat 402, Mayur Vihar Phase 1, East Delhi 110091',
          mobileMasked: '+91 97*** **901',
          facialConfidence: 98.7,
          pnrNumber: '681-9048122',
          trainNumber: '12424',
          trainName: 'New Delhi - Dibrugarh Rajdhani Express',
          coach: 'A2',
          berth: 'Berth 14 (Lower Berth)',
        });
        toast.success(
          'Aadhaar Face Verified. Passenger identity confirmed with zero criminal flags.',
          'Passenger Authenticated'
        );
      }
    }, 2000);
  };

  // Trigger Silent Alert to RPF Squad on train
  const handleAlertRpfSquad = () => {
    sound.playAlertBeep();
    setRpfAlertSent(true);
    toast.warning(
      'Silent Alarm Transmitted: RPF Onboard Escort Squad (Coach B1) alerted to position at Coach B4 vestibule.',
      'RPF Tactical Team En Route'
    );
  };

  // Trigger Platform 2 Lockdown at Aligarh Jn
  const handleLockdownPlatform = () => {
    sound.playAlertBeep();
    setPlatformLockdownSent(true);
    toast.warning(
      'Aligarh Junction RPF Post & GRP Control notified: Platform 2 exits sealed for train arrival.',
      'Station Lockdown Activated'
    );
  };

  const getVerificationMemoText = () => {
    if (!verificationResult) return '';
    return `================================================================================
INDIAN RAILWAYS / CENTRE FOR RAILWAY INFORMATION SYSTEMS (CRIS)
AADHAAR BIOMETRIC PASSENGER FACE VERIFICATION & CCTNS WATCHLIST AUDIT MEMO
================================================================================
MEMO NUMBER      : IR-UIDAI-FACE-2026-B4-28
TIMESTAMP        : ${new Date().toISOString()}
VERIFICATION UNIT: UIDAI FaceRD Sovereign Terminal v2.4 (Northern Railway)
TRAIN NUMBER     : ${verificationResult.trainNumber} - ${verificationResult.trainName}
LOCATION AT SCAN : KM 84 Marker near Jewar / Aligarh Outer (Speed: 92 km/h)
================================================================================
1. BIOMETRIC PASSENGER VERIFICATION (UIDAI FaceRD AI Engine):
   - Verified Name   : ${verificationResult.fullName}
   - Aadhaar VID     : ${verificationResult.aadhaarVid}
   - Facial Match    : ${verificationResult.facialConfidence}% Cosine Similarity vs UIDAI Aadhaar Photo
   - PNR Identifier  : ${verificationResult.pnrNumber}
   - Assigned Seat   : Coach ${verificationResult.coach}, ${verificationResult.berth}
   - Registered Addr : ${verificationResult.registeredAddress}

2. NATIONAL POLICE CCTNS WATCHLIST CROSS-VERIFICATION:
   - System Status   : ${verificationResult.status === 'WANTED_FUGITIVE' ? 'CRITICAL MATCH (ACTIVE FUGITIVE LOC)' : 'CLEARED (ZERO WARRANTS)'}
   ${
     verificationResult.locNotice
       ? `- Warrant Case  : ${verificationResult.locNotice.caseNumber}
   - Penal Statutes: ${verificationResult.locNotice.sections}
   - Issuing Court : ${verificationResult.locNotice.issuingCourt}
   - Tactical Action: Section 43 BNSS Railway Detention Mandated`
       : '- Journey Status : Confirmed Legal Passenger. Journey Authenticated.'
   }

3. STATUTORY COMPLIANCE:
   Sealed under Section 63 Bharatiya Sakshya Adhiniyam, 2023 & Aadhaar Act 2016.
   Cryptographic SHA-256 Digest: b894101acdf20489912048912ef0984128941208941249812491280941829041
================================================================================`;
  };

  return (
    <div className="space-y-6 select-none">
      {/* Header Banner */}
      <div className="p-5 rounded-2xl border border-sky-500/40 bg-gradient-to-r from-slate-950 via-slate-900 to-sky-950/40 shadow-xl flex flex-col xl:flex-row xl:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5 min-w-0">
          <div className="p-3 rounded-2xl bg-gradient-to-br from-sky-500 to-blue-600 text-white shadow-lg shadow-sky-500/20 shrink-0">
            <Train className="h-6 w-6" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                Indian Railways Biometric Aadhaar Face Verification Terminal
              </h1>
              <Badge className="bg-sky-500 text-black font-extrabold text-xs">
                UIDAI FaceRD • CCTNS LIVE
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-1 max-w-3xl">
              Real-time edge passenger biometric terminal matching live optical facial capture directly against official UIDAI Aadhaar Digital Photo records and National Police CCTNS Look Out Circulars (LOC).
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <Link to="/roadmap">
            <Button
              size="sm"
              variant="outline"
              className="border-amber-500/40 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 text-xs font-bold flex items-center gap-1.5"
              title="View Spec #37: UIDAI FaceRD Biometrics in 100 Technical Roadmap"
            >
              <Compass className="h-3.5 w-3.5 text-amber-400" />
              <span>Spec #37 in Roadmap</span>
            </Button>
          </Link>

          {/* Train Operational Badge */}
          <div className="p-2.5 rounded-xl border border-sky-500/30 bg-slate-950 flex flex-col text-right">
            <div className="text-[10px] text-muted-foreground uppercase font-mono">Current Corridor Intercept</div>
            <div className="text-xs font-extrabold text-white flex items-center justify-end gap-1.5 font-mono">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
              <span>12424 Rajdhani Exp (92 km/h)</span>
            </div>
            <div className="text-[10px] text-sky-400 font-mono">
              Next: Aligarh Jn (Platform 2 in 18m)
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid: Left Scanner & Right Verification Intelligence */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (6 Cols): Live Optical Passenger Capture vs Aadhaar Digital Card Photo */}
        <div className="lg:col-span-6 space-y-4">
          <Card className="border-sky-500/30 bg-card/90 overflow-hidden shadow-xl">
            <CardHeader className="p-4 border-b border-border/60 bg-muted/30">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xs font-black uppercase tracking-wider text-foreground flex items-center gap-2">
                  <Scan className="h-4 w-4 text-sky-400" />
                  <span>Aadhaar Biometric Face Verification: Live Camera vs Card Photo</span>
                </CardTitle>
                <Badge variant="outline" className="border-sky-500/40 text-sky-400 text-[10px] font-mono">
                  UIDAI FaceRD v2.4 • 60 FPS
                </Badge>
              </div>
            </CardHeader>

            <CardContent className="p-4 space-y-4">
              {/* Operational Gate Inspection Mode Toggle */}
              <div className="p-3 rounded-xl border border-sky-500/40 bg-slate-950/80 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                    Inspection Modality:
                  </span>
                  <Badge variant="outline" className="border-sky-500/50 text-sky-300 text-[9px] font-mono">
                    {isAutonomousGateMode ? 'AUTOMATED GANTRY' : 'TTE HANDHELD'}
                  </Badge>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => {
                      sound.playClickSound();
                      setIsAutonomousGateMode(true);
                    }}
                    className={`p-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                      isAutonomousGateMode
                        ? 'bg-sky-600 text-white shadow-md shadow-sky-600/30 ring-1 ring-sky-400'
                        : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    <Train className="h-3.5 w-3.5" />
                    <span>Autonomous Gate (No TTE)</span>
                  </button>
                  <button
                    onClick={() => {
                      sound.playClickSound();
                      setIsAutonomousGateMode(false);
                    }}
                    className={`p-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                      !isAutonomousGateMode
                        ? 'bg-sky-600 text-white shadow-md shadow-sky-600/30 ring-1 ring-sky-400'
                        : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    <User className="h-3.5 w-3.5" />
                    <span>TTE Handheld Scan</span>
                  </button>
                </div>
                {isAutonomousGateMode && (
                  <p className="text-[10px] text-sky-300/80 font-mono leading-tight bg-sky-950/30 p-1.5 rounded border border-sky-500/20">
                    Gate 04 Automated Turnstile: Passenger walks in &rarr; Camera captures face &rarr; Instantly verified against Aadhaar Card Digital Photo &rarr; Turnstile auto-unlocks or silent alert sent to RPF escort.
                  </p>
                )}
              </div>

              {/* Test Scenario Selector */}
              <div className="p-3 rounded-xl border border-border bg-slate-950/60 space-y-2">
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">
                  Select Boarding Passenger Identity to Verify:
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => {
                      sound.playClickSound();
                      setSelectedScenario('FUGITIVE');
                      setVerificationResult(null);
                      setSelectedVictimMatch(null);
                    }}
                    className={`p-2.5 rounded-lg border text-left transition-all ${
                      selectedScenario === 'FUGITIVE'
                        ? 'border-red-500 bg-red-950/40 text-white font-bold shadow-sm ring-1 ring-red-500/50'
                        : 'border-border/60 bg-muted/20 text-muted-foreground hover:bg-muted/40'
                    }`}
                  >
                    <div className="text-xs flex items-center gap-1.5 text-red-400">
                      <AlertTriangle className="h-3.5 w-3.5" />
                      <span>Fugitive Escaping</span>
                    </div>
                    <div className="text-[10px] text-slate-300 mt-1">
                      Vikram Malhotra (Scorpio Escaped to Train B4)
                    </div>
                  </button>

                  <button
                    onClick={() => {
                      sound.playClickSound();
                      setSelectedScenario('CITIZEN');
                      setVerificationResult(null);
                      setSelectedVictimMatch(null);
                    }}
                    className={`p-2.5 rounded-lg border text-left transition-all ${
                      selectedScenario === 'CITIZEN'
                        ? 'border-emerald-500 bg-emerald-950/40 text-white font-bold shadow-sm ring-1 ring-emerald-500/50'
                        : 'border-border/60 bg-muted/20 text-muted-foreground hover:bg-muted/40'
                    }`}
                  >
                    <div className="text-xs flex items-center gap-1.5 text-emerald-400">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      <span>Regular Passenger</span>
                    </div>
                    <div className="text-[10px] text-slate-300 mt-1">
                      Priya Sharma (Aadhaar Verified Passenger)
                    </div>
                  </button>
                </div>
              </div>

              {/* Side-by-Side Verification Terminal: Live Passenger Capture ⟷ Official Aadhaar Photo */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 rounded-xl border border-sky-500/40 bg-slate-950">
                {/* 1. Live Passenger Optical Camera Feed */}
                <div className="p-3 rounded-lg border border-sky-500/30 bg-slate-900/90 flex flex-col items-center justify-between space-y-2 relative overflow-hidden">
                  <div className="w-full flex items-center justify-between text-[10px] font-mono text-sky-400">
                    <span className="flex items-center gap-1">
                      <Camera className="h-3 w-3" />
                      <span>{isAutonomousGateMode ? 'AUTO GATE OPTICAL CAM' : 'LIVE TTE CAM CAPTURE'}</span>
                    </span>
                    <span className="h-2 w-2 rounded-full bg-red-500 animate-ping" />
                  </div>

                  {/* Camera Viewfinder with Realistic Face Portrait + 68-Point Landmark Mesh */}
                  <div className="relative w-32 h-36 rounded-xl border-2 border-sky-400/70 overflow-hidden bg-slate-950 flex flex-col items-center justify-center shadow-inner">
                    {/* Passenger Photo Portrait */}
                    <div className="relative w-full h-full flex items-center justify-center">
                      <img
                        src={
                          selectedScenario === 'FUGITIVE'
                            ? 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300'
                            : 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300'
                        }
                        alt="Live Passenger Camera Stream"
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent opacity-80" />

                      {/* 68-Point Biometric Landmarks Simulation Mesh Overlay */}
                      <div className="absolute inset-0 pointer-events-none grid grid-cols-4 grid-rows-5 p-2 gap-1.5 opacity-70">
                        {Array.from({ length: 20 }).map((_, i) => (
                          <div key={i} className="h-1.5 w-1.5 rounded-full bg-cyan-400 mx-auto shadow-sm shadow-cyan-300 animate-pulse" />
                        ))}
                      </div>

                      {/* Scanning Laser Beam */}
                      {isScanning && (
                        <div className="absolute inset-x-0 h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent animate-bounce top-1/2 shadow-lg shadow-cyan-400/80" />
                      )}

                      <div className="absolute bottom-1.5 inset-x-1 flex items-center justify-between px-1 text-[8px] font-mono font-bold text-white bg-black/70 rounded py-0.5">
                        <span className="truncate">{selectedScenario === 'FUGITIVE' ? 'Vikram M.' : 'Priya S.'}</span>
                        <span className={selectedScenario === 'FUGITIVE' ? 'text-red-400' : 'text-emerald-400'}>
                          {selectedScenario === 'FUGITIVE' ? 'LOC MATCH' : 'CLEARED'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="w-full text-center space-y-0.5">
                    <span className="text-[9px] font-mono text-slate-300 block">
                      Iris Focus: Locked • Yaw: +0.8° • 60 FPS
                    </span>
                    <span className="text-[9px] font-mono text-emerald-400 block font-semibold">
                      3D Depth Liveness: VERIFIED (0.98 Score)
                    </span>
                  </div>
                </div>

                {/* 2. Official UIDAI Aadhaar Digital ID Card Record (Exact Match against Photo) */}
                <div className="p-3 rounded-lg border border-amber-500/40 bg-gradient-to-b from-amber-950/20 via-slate-900 to-slate-950 flex flex-col justify-between space-y-2 relative overflow-hidden">
                  {/* Aadhaar Header */}
                  <div className="border-b border-amber-500/30 pb-1.5 flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <div className="h-4 w-4 rounded-full bg-amber-500/20 border border-amber-400 flex items-center justify-center text-[8px] font-bold text-amber-300">
                        🏛️
                      </div>
                      <div className="text-[9px] font-bold text-amber-200 uppercase leading-none">
                        <div>भारत सरकार</div>
                        <div className="text-[7px] text-slate-400">Govt. of India</div>
                      </div>
                    </div>
                    <Badge variant="outline" className="text-[8px] text-amber-400 border-amber-500/40 font-mono px-1 py-0">
                      UIDAI DATABASE PHOTO
                    </Badge>
                  </div>

                  {/* Aadhaar Photo & Details */}
                  <div className="flex items-center gap-2">
                    <div className="w-20 h-24 rounded border-2 border-amber-400/80 bg-slate-950 p-0.5 flex flex-col items-center justify-center shrink-0 relative overflow-hidden shadow-md">
                      <img
                        src={
                          selectedScenario === 'FUGITIVE'
                            ? 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300'
                            : 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300'
                        }
                        alt="Official Aadhaar Card Photo"
                        className="w-full h-full object-cover filter contrast-105"
                      />
                      <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-amber-400/10 to-transparent pointer-events-none" />
                      <div className="absolute bottom-0 inset-x-0 bg-amber-950/90 text-[7px] font-mono text-amber-300 text-center py-0.2">
                        UIDAI RECORD
                      </div>
                    </div>

                    <div className="min-w-0 text-[10px] space-y-1 font-mono">
                      <div className="font-black text-white text-xs truncate">
                        {selectedScenario === 'FUGITIVE' ? 'Vikram Malhotra' : 'Priya Sharma'}
                      </div>
                      <div className="text-slate-300 text-[9px]">
                        DOB: {selectedScenario === 'FUGITIVE' ? '14/08/1990' : '22/03/1995'}
                      </div>
                      <div className="text-slate-300 text-[9px]">
                        Gender: {selectedScenario === 'FUGITIVE' ? 'MALE' : 'FEMALE'}
                      </div>
                      <div className="text-amber-400 font-extrabold text-[10px]">
                        {selectedScenario === 'FUGITIVE' ? 'XXXX-XXXX-8921' : 'XXXX-XXXX-4412'}
                      </div>
                      <div className="text-[8px] text-emerald-400 flex items-center gap-1 font-bold">
                        <CheckCircle2 className="h-2.5 w-2.5 text-emerald-400" />
                        <span>Biometrics Verified</span>
                      </div>
                    </div>
                  </div>

                  {/* Aadhaar Bottom Bar with Hologram & QR Code Marker */}
                  <div className="border-t border-amber-500/30 pt-1.5 flex items-center justify-between text-[8px] font-mono text-slate-400">
                    <span className="text-amber-300 font-bold">मेरा आधार, मेरी पहचान</span>
                    <span className="text-[8px] text-sky-400 border border-sky-500/30 px-1 rounded bg-sky-950/60">
                      SEC-63 BSA VALID
                    </span>
                  </div>
                </div>
              </div>

              {/* Facial Match Status Meter */}
              <div className="p-2.5 rounded-lg border border-sky-500/30 bg-slate-900/80 flex items-center justify-between text-xs font-mono">
                <span className="text-muted-foreground flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5 text-sky-400" />
                  <span>Face ⟷ Aadhaar Correlation:</span>
                </span>
                <span className="font-bold text-sky-300">
                  {verificationResult
                    ? `${verificationResult.facialConfidence}% COSINE MATCH (${selectedScenario === 'FUGITIVE' ? 'RED LOC DETECTED' : 'CLEAR PASS'})`
                    : isScanning
                    ? `Matching Vector... ${scanProgress}%`
                    : 'Awaiting Optical Comparison'}
                </span>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2">
                <Button
                  onClick={handleStartFacialScan}
                  disabled={isScanning}
                  className="w-full bg-sky-600 hover:bg-sky-700 text-white font-extrabold text-xs py-2.5 shadow-lg shadow-sky-600/30 flex items-center justify-center gap-2"
                >
                  <Scan className="h-4 w-4" />
                  <span>
                    {isScanning
                      ? 'Matching Face Against Official Aadhaar Photo...'
                      : 'Scan & Match Face with Aadhaar Photo'}
                  </span>
                </Button>

                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={manualPnr}
                    onChange={(e) => setManualPnr(e.target.value)}
                    placeholder="Enter 10-Digit PNR..."
                    className="flex-1 px-3 py-1.5 rounded-lg bg-background border border-border text-xs text-foreground font-mono focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleStartFacialScan}
                    className="text-xs shrink-0"
                  >
                    Query PNR
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column (6 Cols): Verification Dossier & Intercept Actions */}
        <div className="lg:col-span-6 space-y-4">
          {verificationResult ? (
            <div className="space-y-4">
              {/* Alert Status Card */}
              {verificationResult.status === 'WANTED_FUGITIVE' ? (
                <div className="p-5 rounded-2xl border-2 border-red-500 bg-gradient-to-r from-red-950/60 via-slate-900 to-slate-950 shadow-2xl space-y-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="p-3 rounded-2xl bg-red-600 text-white shadow-lg shadow-red-600/40 animate-pulse">
                        <BadgeAlert className="h-7 w-7" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-mono font-black uppercase px-2 py-0.5 rounded bg-red-600 text-white">
                            RED NOTICE • ACTIVE LOC FUGITIVE DETECTED
                          </span>
                        </div>
                        <h2 className="text-xl font-black text-white mt-1">
                          {verificationResult.fullName}
                        </h2>
                        <div className="text-xs text-red-300 font-mono">
                          Matched with {verificationResult.facialConfidence}% UIDAI Aadhaar Face Authenticity
                        </div>
                      </div>
                    </div>

                    <Badge className="bg-red-600 text-white font-extrabold text-xs">
                      SECTION 35 BNSS
                    </Badge>
                  </div>

                  {/* Seat Location Choke Box */}
                  <div className="p-3.5 rounded-xl bg-slate-950 border border-red-500/50 grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs font-mono">
                    <div className="p-2 rounded bg-slate-900 border border-slate-800">
                      <span className="text-[9px] text-muted-foreground block">Train</span>
                      <strong className="text-white">12424 Rajdhani</strong>
                    </div>
                    <div className="p-2 rounded bg-slate-900 border border-slate-800">
                      <span className="text-[9px] text-muted-foreground block">Coach</span>
                      <strong className="text-red-400 text-sm">{verificationResult.coach}</strong>
                    </div>
                    <div className="p-2 rounded bg-slate-900 border border-slate-800">
                      <span className="text-[9px] text-muted-foreground block">Assigned Berth</span>
                      <strong className="text-amber-300">{verificationResult.berth}</strong>
                    </div>
                    <div className="p-2 rounded bg-slate-900 border border-slate-800">
                      <span className="text-[9px] text-muted-foreground block">Booked PNR</span>
                      <strong className="text-cyan-300">{verificationResult.pnrNumber}</strong>
                    </div>
                  </div>

                  {/* Police Case Warrant Card */}
                  {verificationResult.locNotice && (
                    <div className="p-3.5 rounded-xl bg-red-950/30 border border-red-900/60 text-xs space-y-1.5">
                      <div className="font-bold text-red-200 flex items-center justify-between">
                        <span>Warrant File: {verificationResult.locNotice.caseNumber}</span>
                        <span className="text-amber-300 font-mono">{verificationResult.locNotice.reward}</span>
                      </div>
                      <p className="text-slate-300 text-[11px]">
                        <strong>Statutes:</strong> {verificationResult.locNotice.sections}
                      </p>
                      <p className="text-slate-400 text-[11px]">
                        <strong>Issuing Court:</strong> {verificationResult.locNotice.issuingCourt}
                      </p>
                      <div className="p-2 rounded bg-red-900/40 border border-red-700/50 text-[11px] font-bold text-white flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4 text-amber-400 shrink-0" />
                        <span>{verificationResult.locNotice.warning}</span>
                      </div>
                    </div>
                  )}

                  {/* Immediate Tactical Actions */}
                  <div className="space-y-2 pt-2 border-t border-red-900/40">
                    <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block">
                      Mandatory Railway Police Protocol (Section 43 BNSS):
                    </span>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <Button
                        onClick={handleAlertRpfSquad}
                        disabled={rpfAlertSent}
                        className={`text-xs font-black py-2.5 flex items-center justify-center gap-1.5 ${
                          rpfAlertSent
                            ? 'bg-emerald-600 text-white'
                            : 'bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-600/30'
                        }`}
                      >
                        <Radio className="h-3.5 w-3.5" />
                        <span>{rpfAlertSent ? '✓ RPF Escort Alerted (En Route)' : '🚨 Silent Alert RPF Onboard Squad'}</span>
                      </Button>

                      <Button
                        onClick={handleLockdownPlatform}
                        disabled={platformLockdownSent}
                        className={`text-xs font-black py-2.5 flex items-center justify-center gap-1.5 ${
                          platformLockdownSent
                            ? 'bg-emerald-600 text-white'
                            : 'bg-amber-600 hover:bg-amber-700 text-white shadow-lg shadow-amber-600/30'
                        }`}
                      >
                        <ShieldAlert className="h-3.5 w-3.5" />
                        <span>{platformLockdownSent ? '✓ Aligarh Jn Platform Sealed' : '🚔 Seal Aligarh Jn Platform 2'}</span>
                      </Button>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 pt-1">
                      <Button
                        size="sm"
                        onClick={() => setThanaModalOpen(true)}
                        className="bg-blue-600 hover:bg-blue-700 text-white text-xs flex items-center gap-1.5"
                      >
                        <PhoneCall className="h-3.5 w-3.5" />
                        <span>Coordinate with Nearest Thana (Jewar PS)</span>
                      </Button>

                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setExportModalOpen(true)}
                        className="text-xs flex items-center gap-1.5"
                      >
                        <FileText className="h-3.5 w-3.5" />
                        <span>Preview & Print Sec 43 BNSS Detention Memo</span>
                      </Button>
                    </div>
                  </div>
                </div>
              ) : (
                /* Citizen Verified Card */
                <div className="p-5 rounded-2xl border-2 border-emerald-500/50 bg-gradient-to-r from-emerald-950/40 via-slate-900 to-slate-950 shadow-xl space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-3 rounded-2xl bg-emerald-500 text-black shadow-lg shadow-emerald-500/30">
                        <ShieldCheck className="h-7 w-7" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-mono font-black uppercase px-2 py-0.5 rounded bg-emerald-500 text-black">
                            AADHAAR FACE AUTHENTICATED
                          </span>
                        </div>
                        <h2 className="text-xl font-black text-white mt-1">
                          {verificationResult.fullName}
                        </h2>
                        <div className="text-xs text-emerald-400 font-mono">
                          {verificationResult.facialConfidence}% Facial Match • Zero Criminal Records Found
                        </div>
                      </div>
                    </div>

                    <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/40">
                      JOURNEY CLEARED
                    </Badge>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-xs bg-slate-950 p-4 rounded-xl border border-border">
                    <div>
                      <span className="text-[10px] text-muted-foreground block font-mono">Masked Aadhaar VID</span>
                      <strong className="text-white font-mono">{verificationResult.aadhaarVid}</strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-muted-foreground block font-mono">Registered Phone</span>
                      <strong className="text-white font-mono">{verificationResult.mobileMasked}</strong>
                    </div>
                    <div className="col-span-2 pt-2 border-t border-border/50">
                      <span className="text-[10px] text-muted-foreground block font-mono">Registered Address</span>
                      <span className="text-slate-300">{verificationResult.registeredAddress}</span>
                    </div>
                  </div>

                  <div className="p-3 rounded-lg bg-emerald-950/30 border border-emerald-500/30 text-xs text-emerald-300 flex items-center justify-between">
                    <span>PNR {verificationResult.pnrNumber} validated against Coach {verificationResult.coach} Seat {verificationResult.berth}.</span>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setExportModalOpen(true)}
                      className="border-emerald-500/40 text-emerald-300 text-xs"
                    >
                      Export Clearance Memo
                    </Button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* Idle Instruction Card */
            <div className="p-10 rounded-2xl border border-dashed border-border bg-card/40 text-center space-y-3 flex flex-col items-center justify-center">
              <div className="p-4 rounded-2xl bg-muted/60 text-muted-foreground">
                <Scan className="h-8 w-8 text-sky-400" />
              </div>
              <h3 className="text-base font-black text-foreground">
                Awaiting Passenger Facial Biometric Scan
              </h3>
              <p className="text-xs text-muted-foreground max-w-md leading-relaxed">
                Click &quot;Scan Passenger Face with Aadhaar&quot; on the left terminal to simulate an in-coach ticket inspection. The engine queries UIDAI FaceRD registered biometrics and performs a real-time CCTNS fugitive cross-check.
              </p>
            </div>
          )}

          {/* Statutory Architecture Card */}
          <div className="p-4 rounded-xl border border-border bg-slate-950 text-xs space-y-2">
            <div className="flex items-center gap-2 text-sky-400 font-bold text-xs">
              <Sparkles className="h-4 w-4" />
              <span>Indian Railways TC Sovereign Biometric Architecture</span>
            </div>
            <p className="text-slate-400 text-[11px] leading-relaxed">
              Equipped with 512-dimensional face embedding vectors matched on edge terminals via TensorRT-optimized ArcFace neural backbones. Fully compliant with Criminal Procedure (Identification) Act 2022 and Section 63 BSA electronic admissibility.
            </p>
          </div>
        </div>
      </div>

      {/* Victims & Missing Persons Railway Corridor Intelligence Section */}
      <div className="p-5 rounded-2xl border-2 border-rose-500/40 bg-gradient-to-r from-rose-950/20 via-slate-900 to-slate-950 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-rose-500/30 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-400">
              <ShieldAlert className="h-5 w-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-black text-white uppercase tracking-wider">
                  Railway Track-Child & Trafficking Victims Alert Registry
                </h2>
                <Badge className="bg-rose-500 text-white font-mono text-[9px] font-black">
                  OPERATION NANHE FARISHTE
                </Badge>
              </div>
              <p className="text-xs text-rose-300/80">
                Active Missing Children & Vulnerable Persons Transiting Via Indian Railways (Cross-Referenced Against Live Passenger Scans)
              </p>
            </div>
          </div>
          <Badge variant="outline" className="border-rose-400 text-rose-300 font-mono text-xs font-bold px-2 py-1 shrink-0">
            4 Critical Leads Monitored
          </Badge>
        </div>

        {/* Victim Photo Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {RAILWAY_TRACK_VICTIMS.map((victim) => (
            <div
              key={victim.id}
              className={`p-3.5 rounded-xl border transition-all flex flex-col justify-between space-y-3 ${
                selectedVictimMatch === victim.id
                  ? 'border-rose-500 bg-rose-950/40 ring-2 ring-rose-500/50 shadow-lg'
                  : 'border-border/70 bg-slate-950/80 hover:border-rose-500/40 hover:bg-slate-950'
              }`}
            >
              <div className="space-y-2.5">
                {/* Photo & Badge */}
                <div className="relative h-44 rounded-xl overflow-hidden border border-rose-500/30 bg-slate-900">
                  <img
                    src={victim.photo}
                    alt={victim.name}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-85" />
                  <div className="absolute top-2 left-2">
                    <Badge className="bg-red-600 text-white font-mono text-[9px] font-extrabold shadow">
                      MISSING
                    </Badge>
                  </div>
                  <div className="absolute top-2 right-2">
                    <span className="px-1.5 py-0.5 rounded bg-black/70 text-rose-300 text-[9px] font-mono border border-rose-500/30">
                      Age {victim.age} • {victim.gender}
                    </span>
                  </div>
                  <div className="absolute bottom-2 left-2 right-2">
                    <div className="text-sm font-black text-white leading-tight">{victim.name}</div>
                    <div className="text-[10px] text-rose-300 font-mono truncate">{victim.caseNumber}</div>
                  </div>
                </div>

                {/* Info Details */}
                <div className="space-y-1.5 text-[11px]">
                  <div className="p-2 rounded-lg bg-rose-950/30 border border-rose-500/20 text-rose-200 text-[10px] font-mono leading-snug">
                    <span className="font-bold text-rose-400 block uppercase text-[9px]">Emergency Urgency:</span>
                    {victim.urgency}
                  </div>

                  <div className="space-y-1 text-slate-300 text-[10px]">
                    <div>
                      <span className="text-muted-foreground">Last Seen:</span>{' '}
                      <span className="font-semibold text-white">{victim.station}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Elapsed:</span>{' '}
                      <span className="text-amber-300 font-mono">{victim.missingSince}</span>
                    </div>
                    <div className="line-clamp-2 text-slate-400">
                      {victim.description}
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 border-t border-border/50 flex flex-col gap-1.5">
                <Button
                  size="sm"
                  onClick={() => {
                    sound.playRadarPing();
                    setSelectedVictimMatch(victim.id);
                    toast.info(`Scanning live camera stream against ${victim.name}'s biometric vectors...`, 'Victim Cross-Check');
                  }}
                  className={`w-full text-xs font-bold ${
                    selectedVictimMatch === victim.id
                      ? 'bg-rose-600 text-white hover:bg-rose-700'
                      : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
                  }`}
                >
                  <Scan className="h-3.5 w-3.5 mr-1" />
                  <span>{selectedVictimMatch === victim.id ? 'Vector Matched' : 'Match Live Face'}</span>
                </Button>

                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    sound.playSirenAlert();
                    toast.warning(`ALERT DISPATCHED: RPF Flying Squad notified for ${victim.name} at current corridor.`, 'RPF Amber Alert');
                  }}
                  className="w-full border-rose-500/40 text-rose-300 hover:bg-rose-950/30 text-[11px] font-bold"
                >
                  <PhoneCall className="h-3 w-3 mr-1 text-rose-400" />
                  <span>Alert Platform RPF</span>
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Detention / Clearance Memo Export Preview Modal */}
      <FileExportPreviewModal
        isOpen={exportModalOpen}
        onClose={() => setExportModalOpen(false)}
        fileName={`Railway_Biometric_Memo_${verificationResult?.pnrNumber || '245-8910245'}_Sec63BSA.txt`}
        fileType="txt"
        title="Railway Police TC Biometric Verification Memo"
        subtitle="Statutory electronic audit memo sealed under Section 63 BSA & Section 43 BNSS"
        rawContent={getVerificationMemoText()}
        expectedHash="b894101acdf20489912048912ef0984128941208941249812491280941829041"
      />

      {/* Nearest Thana Dispatch Modal Coordination */}
      <NearestThanaDispatchModal
        isOpen={thanaModalOpen}
        onClose={() => setThanaModalOpen(false)}
        suspectName={verificationResult?.fullName || 'Vikram Malhotra'}
        vehicleNumber="Train 12424 Rajdhani Express (Coach B4)"
        suspectSpeed={92}
        currentCorridor="KM 84 Marker (Jewar - Aligarh Jn Railway Line)"
        caseNumber="CASE-2026-8812 / FIR-8812"
      />
    </div>
  );
}
