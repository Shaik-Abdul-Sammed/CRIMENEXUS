import React, { useState, useEffect, useRef } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  FastForward,
  CheckCircle2,
  MapPin,
  Radio,
  Wifi,
  CreditCard,
  Bluetooth,
  Bus,
  Sparkles,
  ShieldAlert,
  FileText,
  Clock,
  Navigation,
  X,
  Globe,
  HeartPulse,
  Battery,
  Sun,
  Moon,
  Users,
  Car,
  ShieldCheck,
  Download,
  AlertTriangle,
  Phone,
  Layers,
  Eye,
  EyeOff,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { sound } from '../../utils/soundEffects';
import { useToast } from '../../components/ui/Toast';
import { DocumentPreviewModal } from '../../components/common/DocumentPreviewModal';
import { OmniTraceSatelliteModal } from '../../components/common/OmniTraceSatelliteModal';

export interface DemoStep {
  second: number;
  title: string;
  source: string;
  icon: React.ElementType;
  color: string;
  locationName: string;
  coords: [number, number]; // [lon, lat]
  toastMsg: string;
  details: string;
  confidence: number;
}

export const DEMO_STEPS: DemoStep[] = [
  {
    second: 0,
    title: 'Report Registered (Form 24.5 & POCSO Alert)',
    source: 'FIR_INTAKE',
    icon: ShieldAlert,
    color: '#EF4444',
    locationName: 'Lajpat Nagar Metro Station Exit Gate 3',
    coords: [77.2431, 28.5665],
    toastMsg: 'AANYA SHARMA (8) reported missing — 3:30 PM yesterday.',
    details: 'Father reported 8yo girl in blue school uniform missing after school bus drop at metro station. Statutory Form 24.5 lodged under Sec 173 BNSS.',
    confidence: 0.95,
  },
  {
    second: 10,
    title: 'Cellular Tower Sector & Azimuth Triangulation',
    source: 'IMEI_PING',
    icon: Radio,
    color: '#3B82F6',
    locationName: 'Airtel Tower #DEL-LPN-03 (Sector 4)',
    coords: [77.2431, 28.5665],
    toastMsg: 'Digital Fusion Engine: First sighting detected via IMEI — 3:32 PM.',
    details: 'Active handset IMEI 356789012345678 registered azimuth 140° directional beam at Lajpat Nagar.',
    confidence: 0.95,
  },
  {
    second: 20,
    title: 'OmniTrace Satellite EO / Sentinel-2 Verification',
    source: 'SATELLITE_EO',
    icon: Globe,
    color: '#10B981',
    locationName: 'Orbital Pass Sentinel-2B Multi-Spectral (10m Resolution)',
    coords: [77.2431, 28.5665],
    toastMsg: 'OmniTrace Satellite: Locus corroboration confirmed (14m EXIF delta, 3.2% cloud cover).',
    details: 'Multispectral Band 4-3-2 true color and NIR Band 8 verify physical urban concourse and eliminate digital location spoofing.',
    confidence: 0.88,
  },
  {
    second: 30,
    title: 'DMRC Metro AFC Gate Transit Turnstile Tap',
    source: 'METRO_CARD',
    icon: Bus,
    color: '#06B6D4',
    locationName: 'Lajpat Nagar Metro Turnstile 08 (Violet Line)',
    coords: [77.2435, 28.5660],
    toastMsg: 'Movement confirmed — Metro card used at turnstile 08 at 4:45 PM.',
    details: 'Prepaid metro smartcard tapped through turnstile 08 at Violet Line entry; passenger momentum tracked northbound towards Rajiv Chowk.',
    confidence: 0.90,
  },
  {
    second: 40,
    title: 'CCTV Optical Facial Biometrics Match (89.4%)',
    source: 'CCTV_OPTICAL',
    icon: Eye,
    color: '#8B5CF6',
    locationName: 'Metro Interchange Corridor Camera CAM-04',
    coords: [77.2425, 28.5668],
    toastMsg: 'Optical Facial Recognition Hit: 89.4% confidence (CAM-METRO-04).',
    details: 'Deep learning biometrics matches facial features of Aanya Sharma with 89.4% confidence. Visual tags: blue DPS uniform, red backpack.',
    confidence: 0.89,
  },
  {
    second: 50,
    title: 'Concentric Ring Search Grid Deployed',
    source: 'SEARCH_RINGS',
    icon: Layers,
    color: '#F59E0B',
    locationName: 'South Delhi Concentric Police Grid (1km, 3km, 10km)',
    coords: [77.2350, 28.5800],
    toastMsg: 'Ring Search activated (1km walking, 3km bicycle/auto, 10km transit).',
    details: 'Automated search containment rings established with time-distance travel speeds across South and Central Delhi districts.',
    confidence: 0.92,
  },
  {
    second: 60,
    title: 'Public Municipal WiFi Probe Burst',
    source: 'WIFI_PROBE',
    icon: Wifi,
    color: '#06B6D4',
    locationName: 'Connaught Place Inner Circle Block B Cafe',
    coords: [77.2167, 28.6315],
    toastMsg: 'WiFi probe detected near Connaught Place — 8:30 PM.',
    details: 'Smartphone MAC address probed public municipal open WiFi router near Block B CP.',
    confidence: 0.70,
  },
  {
    second: 70,
    title: 'Medical Vulnerability Alert (Asthma / Inhaler)',
    source: 'MEDICAL_ALERT',
    icon: HeartPulse,
    color: '#EF4444',
    locationName: 'Central Health Intelligence Roster',
    coords: [77.2155, 28.6300],
    toastMsg: 'CRITICAL MEDICAL ALERT: Pediatric Asthma inhaler urgency timer active.',
    details: 'Health profile indicates acute asthma vulnerability. 6-hour critical window active for medical interception before severe respiratory distress.',
    confidence: 0.95,
  },
  {
    second: 80,
    title: 'Emergency UPI Micro-Debit at Pharmacy',
    source: 'UPI',
    icon: CreditCard,
    color: '#F59E0B',
    locationName: 'Paharganj Medical Store Pharmacy Terminal',
    coords: [77.2140, 28.6280],
    toastMsg: 'UPI transaction — ₹200 at Paharganj Chemist — 9:30 PM.',
    details: 'Merchant micro-debit of ₹200 at chemist pharmacy counter; confirmed purchase of emergency inhaler medicine.',
    confidence: 0.85,
  },
  {
    second: 90,
    title: 'Bluetooth BLE Peripheral Wearable Beacon',
    source: 'BLUETOOTH',
    icon: Bluetooth,
    color: '#8B5CF6',
    locationName: 'Paharganj Commercial Guesthouse Zone',
    coords: [77.2120, 28.6420],
    toastMsg: 'Bluetooth beacon — Paharganj lodging area — 11:30 PM.',
    details: 'BLE wearable smart-band ping logged by municipal sensor beacon near Main Bazaar tourist lodging cluster.',
    confidence: 0.65,
  },
  {
    second: 100,
    title: 'CCTV Blind-Spot Risk Corroboration',
    source: 'BLIND_SPOT',
    icon: EyeOff,
    color: '#EF4444',
    locationName: 'Paharganj Lane 4 Unmonitored Corridor',
    coords: [77.2110, 28.6430],
    toastMsg: 'Dark corridor alert: 380m stretch with zero CCTV optical coverage.',
    details: 'Geospatial blind-spot index isolates dark pedestrian alleys between CP Block B and Paharganj; ground teams deployed for foot combing.',
    confidence: 0.78,
  },
  {
    second: 110,
    title: 'Highway ANPR Vehicle Getaway Corroboration',
    source: 'ANPR_CAMERA',
    icon: Car,
    color: '#3B82F6',
    locationName: 'Paharganj Chowk Traffic Junction',
    coords: [77.2105, 28.6435],
    toastMsg: 'ANPR BOLO match: White Swift (DL-10-CE-4412) spotted near corridor.',
    details: 'Traffic ANPR cameras record suspect vehicle movement; license plate flagged across state border pickets.',
    confidence: 0.84,
  },
  {
    second: 120,
    title: 'DTC Transit Bus E-Ticket #181 to NDLS',
    source: 'TRANSIT',
    icon: Bus,
    color: '#10B981',
    locationName: 'Paharganj → New Delhi Railway Station Bus Route',
    coords: [77.2087, 28.6458],
    toastMsg: 'Bus ticket purchased — Paharganj → New Delhi Station — 7:30 AM.',
    details: 'Electronic ticket validator confirms boarding on route 181 bound for Ajmeri Gate Railway Concourse.',
    confidence: 0.90,
  },
  {
    second: 130,
    title: 'Device Battery Decay & Radio Silence Model',
    source: 'BATTERY_MODEL',
    icon: Battery,
    color: '#F59E0B',
    locationName: 'Cellular Terminal Power Telemetry',
    coords: [77.2140, 28.6440],
    toastMsg: 'BATTERY ALERT: 14% power remaining (~1h 40m to radio silence).',
    details: 'Power decay model projects total device shutoff by 11:10 AM due to cold temperature drain; rapid interception mandated.',
    confidence: 0.91,
  },
  {
    second: 140,
    title: 'AI Spatio-Temporal Prediction (87% Match)',
    source: 'AI_PREDICTION',
    icon: Sparkles,
    color: '#22C55E',
    locationName: 'New Delhi Railway Station (Platform Concourse)',
    coords: [77.2195, 28.6430],
    toastMsg: 'AI Prediction: 87% probability — New Delhi Railway Station.',
    details: 'Diurnal transit momentum & directional velocity vector isolates NDLS Platform 1-4 passenger waiting concourse.',
    confidence: 0.87,
  },
  {
    second: 150,
    title: 'Geofenced AMBER & Citizen Sentinel Push Broadcast',
    source: 'COMMUNITY_BROADCAST',
    icon: Radio,
    color: '#F59E0B',
    locationName: 'NDLS 5km Geofenced Perimeter Grid',
    coords: [77.2195, 28.6430],
    toastMsg: 'Community Amber Broadcast transmitted to 14,200 local citizens & 8 PCR units.',
    details: 'Statutory push notification dispatched to verified Citizen Sentinel apps within 5km radius under DPDP Act Sec 17(b).',
    confidence: 0.94,
  },
  {
    second: 160,
    title: 'Ground SAR Squads Alpha & Bravo Dispatched',
    source: 'SQUAD_DISPATCH',
    icon: Users,
    color: '#3B82F6',
    locationName: 'NDLS Platform 1-4 Pickets (VHF 142.85 MHz)',
    coords: [77.2195, 28.6430],
    toastMsg: 'SAR Squad Alpha & Bravo dispatched with VHF tactical containment.',
    details: 'Squad Alpha seals Ajmeri Gate exits; Squad Bravo sweeps platform waiting rooms on radio frequency 142.85 MHz.',
    confidence: 0.95,
  },
  {
    second: 170,
    title: 'NCR Tri-State Inter-Agency Border Handoff',
    source: 'INTER_AGENCY',
    icon: ShieldCheck,
    color: '#8B5CF6',
    locationName: 'Delhi ⇄ Haryana ⇄ UP STF Real-Time Bridge',
    coords: [77.2210, 28.6420],
    toastMsg: 'Tri-State SAR Bridge Active: Alert synchronized with Haryana & UP Police.',
    details: 'Inter-state containment protocol operational with Gurugram and Ghaziabad police to prevent state boundary escape.',
    confidence: 0.93,
  },
  {
    second: 175,
    title: 'Section 63 BSA Digital Forensic Dossier Sealed',
    source: 'LEGAL_DOSSIER',
    icon: FileText,
    color: '#06B6D4',
    locationName: 'Crime Branch Digital Forensics Vault',
    coords: [77.2195, 28.6430],
    toastMsg: 'Court-ready Section 63 BSA search dossier generated with SHA-256 seal.',
    details: 'Complete 18-hour multimodal audit log cryptographically compiled and signed for magistrate submission.',
    confidence: 0.98,
  },
  {
    second: 180,
    title: 'Tactical Intercept Locked & Subject Safely Recovered',
    source: 'PCR_RECOVERY',
    icon: CheckCircle2,
    color: '#10B981',
    locationName: 'NDLS Ajmeri Gate Passenger Concourse',
    coords: [77.2195, 28.6430],
    toastMsg: 'SUBJECT RECOVERED: Aanya Sharma located safe; case marked FOUND.',
    details: 'PCR Unit Alpha-04 intercept locked at NDLS Concourse; child united with parents; resolution synchronized to CCTNS & TrackChild.',
    confidence: 0.99,
  },
];

interface DemoPlayerProps {
  isOpen: boolean;
  onClose: () => void;
  onStepChange?: (step: DemoStep) => void;
}

export function DemoPlayer({ isOpen, onClose, onStepChange }: DemoPlayerProps) {
  const toast = useToast();
  const [currentSecond, setCurrentSecond] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [activeStepIndex, setActiveStepIndex] = useState<number>(0);
  const [speedMultiplier, setSpeedMultiplier] = useState<number>(1);
  const [voiceDispatchEnabled, setVoiceDispatchEnabled] = useState<boolean>(true);
  const [dossierPreviewOpen, setDossierPreviewOpen] = useState<boolean>(false);
  const [satelliteModalOpen, setSatelliteModalOpen] = useState<boolean>(false);

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Synthesized Voice Dispatch Narration via Web Speech API
  const speakDispatchNarration = (text: string) => {
    if (!voiceDispatchEnabled || typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.05;
      utterance.pitch = 1.0;
      window.speechSynthesis.speak(utterance);
    } catch (e) {
      // Speech synthesis unsupported or suppressed in environment
    }
  };

  // Synchronized step sequence driven by seconds counter (up to 180s = 3 minutes)
  useEffect(() => {
    if (!isOpen) {
      if (timerRef.current) clearInterval(timerRef.current);
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
      return;
    }

    if (isPlaying) {
      const intervalMs = 1000 / speedMultiplier;
      timerRef.current = setInterval(() => {
        setCurrentSecond((prev) => {
          if (prev >= 180) {
            setIsPlaying(false);
            return 180;
          }
          return prev + 1;
        });
      }, intervalMs);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isOpen, isPlaying, speedMultiplier]);

  // Handle milestone toasts and audio cues at exact seconds
  useEffect(() => {
    const matchingStepIndex = DEMO_STEPS.findIndex((s) => s.second === currentSecond);
    if (matchingStepIndex !== -1 && matchingStepIndex !== activeStepIndex) {
      setActiveStepIndex(matchingStepIndex);
      const step = DEMO_STEPS[matchingStepIndex];
      
      // Dynamic audio cue based on severity
      if (step.second === 180) {
        sound.playSuccessChime();
      } else if (step.second === 0 || step.second === 70 || step.second === 100) {
        sound.playAlertBeep();
      } else {
        sound.playRadarPing();
      }

      speakDispatchNarration(step.toastMsg);
      toast.info(step.toastMsg, step.title);
      if (onStepChange) {
        onStepChange(step);
      }
    }
  }, [currentSecond, activeStepIndex, onStepChange, toast, voiceDispatchEnabled]);

  if (!isOpen) return null;

  const currentStep = DEMO_STEPS[activeStepIndex] || DEMO_STEPS[0];
  const StepIcon = currentStep.icon;

  const handleSkip = () => {
    sound.playClickSound();
    setCurrentSecond(180);
    setActiveStepIndex(DEMO_STEPS.length - 1);
    setIsPlaying(false);
    toast.success('Jumped to final Tactical Intercept & Subject Recovery stage.', 'Simulation Fast-Forward');
  };

  const handleReplay = () => {
    sound.playClickSound();
    setCurrentSecond(0);
    setActiveStepIndex(0);
    setIsPlaying(true);
    toast.info('Restarting 3-minute Guardian Trace rescue simulation.', 'Demo Replay');
  };

  return (
    <div className="fixed inset-0 z-[999999] bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-hidden animate-in fade-in duration-200">
      <div className="relative w-full max-w-5xl bg-slate-900 border-2 border-emerald-500/60 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Top Header */}
        <div className="p-4 border-b border-border/80 bg-slate-950 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 shadow-glow">
              <Sparkles className="h-5 w-5 animate-spin-slow" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black text-white tracking-wide">
                  Guardian Trace: 90-Second Operational Scenario / 3-Minute 20-Feature Live Rescue Demo
                </h2>
                <Badge className="bg-emerald-600 text-white font-extrabold text-[10px] animate-pulse">
                  SIMULATION ACTIVE
                </Badge>
              </div>
              <p className="text-xs text-slate-300">
                Operation Aanya: Aanya Sharma (8) • 20 Real-Time Operational Intelligence Milestones (0s to 180s)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Synthetic Voice Dispatch Narration Toggle */}
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                const next = !voiceDispatchEnabled;
                setVoiceDispatchEnabled(next);
                if (!next && typeof window !== 'undefined' && 'speechSynthesis' in window) {
                  window.speechSynthesis.cancel();
                } else {
                  sound.playClickSound();
                }
              }}
              className={`h-8 text-xs font-bold flex items-center gap-1.5 transition-colors ${
                voiceDispatchEnabled
                  ? 'border-emerald-500/50 bg-emerald-950/40 text-emerald-300'
                  : 'border-slate-700 bg-slate-800 text-slate-400'
              }`}
              title="Toggle Hands-Free Synthetic Voice Dispatch Narration"
            >
              {voiceDispatchEnabled ? (
                <>
                  <Volume2 className="h-3.5 w-3.5 text-emerald-400 animate-pulse" />
                  <span className="hidden sm:inline">Voice Dispatch: ON</span>
                </>
              ) : (
                <>
                  <VolumeX className="h-3.5 w-3.5 text-slate-400" />
                  <span className="hidden sm:inline">Voice Dispatch: OFF</span>
                </>
              )}
            </Button>

            {/* Speed Selector */}
            <div className="flex items-center gap-1 bg-slate-800 p-1 rounded-lg border border-slate-700 text-[10px] font-mono">
              {[1, 2, 4].map((spd) => (
                <button
                  key={spd}
                  onClick={() => {
                    sound.playClickSound();
                    setSpeedMultiplier(spd);
                  }}
                  className={`px-2 py-0.5 rounded font-bold transition-colors ${
                    speedMultiplier === spd ? 'bg-emerald-500 text-black' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {spd}x
                </button>
              ))}
            </div>

            <Button
              size="sm"
              variant="outline"
              onClick={() => setSatelliteModalOpen(true)}
              className="h-8 text-xs font-bold border-cyan-500/40 text-cyan-300 hover:bg-cyan-950/40 flex items-center gap-1.5"
              title="Inspect OmniTrace Satellite Earth Observation Locus"
            >
              <Globe className="h-3.5 w-3.5 text-cyan-400" />
              <span className="hidden sm:inline">OmniTrace Satellite</span>
            </Button>

            <Button
              size="sm"
              variant="outline"
              onClick={handleSkip}
              className="h-8 text-xs font-bold border-slate-700 hover:bg-slate-800 text-slate-300 flex items-center gap-1.5"
            >
              <FastForward className="h-3.5 w-3.5" />
              <span>Skip to End</span>
            </Button>
            <button
              onClick={() => {
                sound.playClickSound();
                onClose();
              }}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              title="Close Demo Player"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Progress Timeline Scrubber Bar */}
        <div className="bg-slate-950 px-4 py-2.5 border-b border-border/60 shrink-0">
          <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 mb-1">
            <span className="flex items-center gap-1.5 text-emerald-400 font-bold">
              <Clock className="h-3.5 w-3.5" />
              <span>Elapsed: {currentSecond}s / 180s (3 Minutes) • Speed: {speedMultiplier}x</span>
            </span>
            <span className="text-cyan-300 font-bold">
              Stage {activeStepIndex + 1} of {DEMO_STEPS.length}: {currentStep.title}
            </span>
          </div>

          <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden relative cursor-pointer" onClick={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const clickPos = (e.clientX - rect.left) / rect.width;
            const targetSec = Math.round(clickPos * 180);
            setCurrentSecond(targetSec);
          }}>
            <div
              className="h-full bg-gradient-to-r from-emerald-500 via-cyan-400 to-amber-400 transition-all duration-200 rounded-full"
              style={{ width: `${(currentSecond / 180) * 100}%` }}
            />
          </div>

          {/* Quick-Jump Tactical Waypoints */}
          <div className="flex items-center gap-1.5 pt-2 overflow-x-auto scrollbar-none">
            <span className="text-[10px] font-bold text-muted-foreground uppercase font-mono mr-1 shrink-0">
              Tactical Jump:
            </span>
            {[
              { sec: 0, label: '0s: Intake', color: 'border-red-500/40 text-red-300 bg-red-950/30' },
              { sec: 20, label: '20s: Satellite EO', color: 'border-emerald-500/40 text-emerald-300 bg-emerald-950/30' },
              { sec: 40, label: '40s: CCTV Hit', color: 'border-purple-500/40 text-purple-300 bg-purple-950/30' },
              { sec: 50, label: '50s: Ring Search', color: 'border-amber-500/40 text-amber-300 bg-amber-950/30' },
              { sec: 140, label: '140s: NDLS Prediction', color: 'border-cyan-500/40 text-cyan-300 bg-cyan-950/30' },
              { sec: 180, label: '180s: Safe Recovery', color: 'border-emerald-400 text-emerald-200 bg-emerald-900/40 font-bold' },
            ].map((jump) => (
              <button
                key={jump.sec}
                onClick={() => {
                  sound.playClickSound();
                  setCurrentSecond(jump.sec);
                }}
                className={`px-2 py-0.5 rounded text-[10px] font-mono border transition-all whitespace-nowrap hover:scale-105 active:scale-95 ${jump.color}`}
              >
                {jump.label}
              </button>
            ))}
          </div>
        </div>

        {/* Central Narrative Screen */}
        <div className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-6 space-y-4">
          {/* Active Milestone Card */}
          <div
            className="p-5 rounded-2xl border-2 transition-all space-y-3 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 shadow-xl"
            style={{ borderColor: currentStep.color }}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div
                  className="p-3 rounded-2xl border flex items-center justify-center text-white"
                  style={{ backgroundColor: `${currentStep.color}25`, borderColor: currentStep.color }}
                >
                  <StepIcon className="h-6 w-6 animate-pulse" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono font-black uppercase tracking-wider px-2 py-0.5 rounded bg-black/40 border border-white/10 text-white">
                      Stage {activeStepIndex + 1} of {DEMO_STEPS.length} • Second {currentStep.second}s
                    </span>
                    <Badge variant="outline" className="font-mono text-[9px] text-emerald-400 border-emerald-500/40">
                      {(currentStep.confidence * 100).toFixed(0)}% Confidence
                    </Badge>
                  </div>
                  <h3 className="text-lg font-black text-white mt-1">
                    {currentStep.title}
                  </h3>
                  <div className="text-xs text-emerald-400 font-mono flex items-center gap-1.5 mt-0.5">
                    <MapPin className="h-3.5 w-3.5" />
                    <span>{currentStep.locationName}</span>
                  </div>
                </div>
              </div>

              <div className="text-right font-mono text-xs text-slate-400 shrink-0">
                <div className="font-bold text-white">Signal: {currentStep.source}</div>
                <div className="text-[10px] text-slate-500">
                  [{currentStep.coords[1].toFixed(4)}°N, {currentStep.coords[0].toFixed(4)}°E]
                </div>
              </div>
            </div>

            <p className="text-xs sm:text-sm text-slate-200 leading-relaxed bg-black/30 p-3.5 rounded-xl border border-white/5">
              {currentStep.details}
            </p>
          </div>

          {/* Sequential 20-Feature Stepper Grid */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider font-mono">
                20 Operational Intelligence Milestones (Click Any to Jump)
              </span>
              <span className="text-[10px] font-mono text-emerald-400 font-bold">100% WORM Verified</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-2 max-h-56 overflow-y-auto pr-1">
              {DEMO_STEPS.map((step, idx) => {
                const isPassed = currentSecond >= step.second;
                const isCurrent = activeStepIndex === idx;
                const Icon = step.icon;

                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      sound.playClickSound();
                      setCurrentSecond(step.second);
                      setActiveStepIndex(idx);
                    }}
                    className={`p-2 rounded-xl border transition-all text-xs flex items-center gap-2 text-left ${
                      isCurrent
                        ? 'border-emerald-400 bg-emerald-950/40 shadow-md ring-1 ring-emerald-500/50'
                        : isPassed
                        ? 'border-border/60 bg-slate-900/60 opacity-90'
                        : 'border-border/30 bg-slate-950/30 opacity-40'
                    }`}
                  >
                    <div
                      className={`p-1.5 rounded-lg border shrink-0 ${
                        isCurrent
                          ? 'bg-emerald-500 text-black border-emerald-400'
                          : isPassed
                          ? 'bg-slate-800 text-emerald-400 border-slate-700'
                          : 'bg-slate-900 text-slate-600 border-slate-800'
                      }`}
                    >
                      <Icon className="h-3.5 w-3.5" />
                    </div>
                    <div className="min-w-0">
                      <div className="font-bold text-white truncate text-[10px]">{step.title}</div>
                      <div className="text-[8px] font-mono text-slate-400 truncate">{step.second}s • {step.source}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Final Resolution Banner (Appears at 170s+) */}
          {currentSecond >= 170 && (
            <div className="p-4 rounded-xl border-2 border-emerald-500 bg-gradient-to-r from-emerald-950/80 via-slate-900 to-emerald-950/80 text-center space-y-2 animate-in zoom-in-95">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 font-mono text-xs font-black border border-emerald-400/40">
                <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                <span>MULTIMODAL FUSION RESCUE RESOLUTION</span>
              </div>
              <h4 className="text-base font-black text-white">
                AANYA REUNITED: New Delhi Railway Station Concourse (Platform 1)
              </h4>
              <p className="text-xs text-emerald-200/90 font-mono max-w-xl mx-auto">
                Fused 20 sensor milestones across 18 hours. PCR Unit Alpha-04 intercept locked; subject safely found and case closed under Section 173 BNSS.
              </p>
            </div>
          )}
        </div>

        {/* Bottom Control Bar */}
        <div className="p-4 border-t border-border/80 bg-slate-950 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              onClick={() => {
                sound.playClickSound();
                setIsPlaying(!isPlaying);
              }}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 h-9 px-4"
            >
              {isPlaying ? (
                <>
                  <Pause className="h-4 w-4" />
                  <span>Pause</span>
                </>
              ) : (
                <>
                  <Play className="h-4 w-4 fill-current" />
                  <span>Play Demo</span>
                </>
              )}
            </Button>

            <Button
              size="sm"
              variant="outline"
              onClick={handleReplay}
              className="h-9 text-xs font-bold border-slate-700 hover:bg-slate-800 text-slate-300 flex items-center gap-1.5"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>Replay</span>
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <Button
              size="sm"
              onClick={() => {
                sound.playSuccessChime();
                setDossierPreviewOpen(true);
              }}
              className="bg-cyan-600 hover:bg-cyan-700 text-white font-bold text-xs flex items-center gap-1.5 h-9 px-3.5 shadow-md shadow-cyan-950/40"
            >
              <FileText className="h-4 w-4" />
              <span>Preview Search Dossier (PDF)</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Forensic Search Dossier Modal */}
      <DocumentPreviewModal
        isOpen={dossierPreviewOpen}
        onClose={() => setDossierPreviewOpen(false)}
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

      {/* OmniTrace Satellite Verification Modal */}
      <OmniTraceSatelliteModal
        isOpen={satelliteModalOpen}
        onClose={() => setSatelliteModalOpen(false)}
        latitude={28.5665}
        longitude={77.2431}
        locationName="Lajpat Nagar Metro Concourse • Delhi Corridor"
        reportNumber="MP-2026-DEMO-001"
      />
    </div>
  );
}
