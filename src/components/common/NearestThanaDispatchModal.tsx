import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import {
  Siren,
  Phone,
  PhoneCall,
  PhoneOff,
  Radio,
  Send,
  CheckCircle2,
  AlertTriangle,
  Clock,
  MapPin,
  Car,
  Shield,
  FileText,
  Volume2,
  VolumeX,
  ExternalLink,
  X,
  Printer,
  Download,
  Copy,
  Check
} from 'lucide-react';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { sound } from '../../utils/soundEffects';
import { useToast } from '../ui/Toast';

export interface NearestThanaDispatchModalProps {
  isOpen: boolean;
  onClose: () => void;
  suspectName?: string;
  vehicleNumber?: string;
  suspectSpeed?: number;
  currentCorridor?: string;
  currentCoordinates?: [number, number]; // [lat, lon]
  caseNumber?: string;
}

interface PoliceStation {
  id: string;
  name: string;
  circle: string;
  district: string;
  shoName: string;
  shoRank: string;
  shoPhone: string;
  thanaLandline: string;
  cctnsVoip: string;
  distanceKm: number;
  etaMinutes: number;
  coordinates: [number, number];
  patrolVans: string[];
  status: 'PRIMARY' | 'BACKUP' | 'STANDBY';
  channelFrequency: string;
}

export function NearestThanaDispatchModal({
  isOpen,
  onClose,
  suspectName = 'Vikram Malhotra @ Vicky',
  vehicleNumber = 'TS 09 AB 1234',
  suspectSpeed = 118,
  currentCorridor = 'Yamuna Expressway (KM 42 Marker)',
  currentCoordinates = [28.1402, 77.5510],
  caseNumber = 'CASE-2026-8812 / FIR-8812',
}: NearestThanaDispatchModalProps) {
  const toast = useToast();

  // Stations along the corridor
  const policeStations: PoliceStation[] = [
    {
      id: 'PS-UP-JWR-01',
      name: 'Jewar Police Station (Yamuna Exp Circle)',
      circle: 'Jewar Sub-Division',
      district: 'Gautam Buddha Nagar Police Commissionerate',
      shoName: 'Inspector Devendra Chauhan',
      shoRank: 'Station House Officer (SHO)',
      shoPhone: '+91 94544 03892',
      thanaLandline: '0120-2894100',
      cctnsVoip: 'EXT-8492',
      distanceKm: 3.4,
      etaMinutes: 4.5,
      coordinates: [28.1284, 77.5562],
      patrolVans: ['UP-16-G-4402 (Cheetah 1)', 'UP-16-G-4419 (Highway Patrol 4)'],
      status: 'PRIMARY',
      channelFrequency: 'VHF Ch 4 (156.800 MHz)',
    },
    {
      id: 'PS-UP-RBP-02',
      name: 'Rabupura Police Station',
      circle: 'Greater Noida 3rd Zone',
      district: 'Gautam Buddha Nagar Police Commissionerate',
      shoName: 'Sub-Inspector Rakesh Bhati',
      shoRank: 'Acting In-Charge / Additional SHO',
      shoPhone: '+91 94544 03895',
      thanaLandline: '0120-2893201',
      cctnsVoip: 'EXT-8495',
      distanceKm: 7.8,
      etaMinutes: 8.8,
      coordinates: [28.2415, 77.6012],
      patrolVans: ['UP-16-G-4211 (Tiger 2)'],
      status: 'BACKUP',
      channelFrequency: 'VHF Ch 4 (156.800 MHz)',
    },
    {
      id: 'PS-UP-TPL-03',
      name: 'Tappal Police Thana',
      circle: 'Khair Sub-Division',
      district: 'Aligarh District Police',
      shoName: 'Inspector Anand Swaroop',
      shoRank: 'Station House Officer (SHO)',
      shoPhone: '+91 94544 01244',
      thanaLandline: '0572-245100',
      cctnsVoip: 'EXT-9102',
      distanceKm: 12.1,
      etaMinutes: 13.2,
      coordinates: [28.0120, 77.6200],
      patrolVans: ['UP-81-G-3100 (Border Intercept)'],
      status: 'STANDBY',
      channelFrequency: 'VHF Ch 7 (158.450 MHz)',
    },
  ];

  const [selectedStation, setSelectedStation] = useState<PoliceStation>(policeStations[0]);
  const [activeTab, setActiveTab] = useState<'DISPATCH' | 'CALL' | 'RADIO' | 'MEMO'>('DISPATCH');
  
  // Dispatch transmission states
  const [isTransmitting, setIsTransmitting] = useState<boolean>(false);
  const [transmissionStep, setTransmissionStep] = useState<number>(0);
  const [isDispatched, setIsDispatched] = useState<boolean>(false);

  // Phone Call simulator states
  const [callState, setCallState] = useState<'IDLE' | 'DIALING' | 'CONNECTED' | 'ENDED'>('IDLE');
  const [callDuration, setCallDuration] = useState<number>(0);
  const callTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Radio Broadcast states
  const [isRadioBroadcasting, setIsRadioBroadcasting] = useState<boolean>(false);
  const [radioSpeechEnabled, setRadioSpeechEnabled] = useState<boolean>(true);

  // Lock body scroll and handle Escape key
  useEffect(() => {
    if (!isOpen) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  // Clean up call timer
  useEffect(() => {
    return () => {
      if (callTimerRef.current) clearInterval(callTimerRef.current);
    };
  }, []);

  if (!isOpen || typeof document === 'undefined') return null;

  // Handle tactical transmission
  const handleTransmitDirective = () => {
    sound.playClickSound();
    setIsTransmitting(true);
    setTransmissionStep(1);

    setTimeout(() => {
      setTransmissionStep(2);
      sound.playRadarPing();
    }, 1200);

    setTimeout(() => {
      setTransmissionStep(3);
      sound.playAlertBeep();
    }, 2400);

    setTimeout(() => {
      setTransmissionStep(4);
      setIsTransmitting(false);
      setIsDispatched(true);
      sound.playSuccessChime();
      toast.success(
        `Tactical Intercept Order acknowledged by ${selectedStation.shoName} (${selectedStation.name}). 2 PCR vans dispatched to barricade.`,
        'Flash Dispatch Confirmed'
      );
    }, 3800);
  };

  // Handle phone call simulation
  const handleStartCall = () => {
    sound.playClickSound();
    setCallState('DIALING');
    setCallDuration(0);

    // Play ringing tone
    sound.playRadarPing();

    setTimeout(() => {
      setCallState('CONNECTED');
      sound.playSuccessChime();
      callTimerRef.current = setInterval(() => {
        setCallDuration((prev) => prev + 1);
      }, 1000);
    }, 2800);
  };

  const handleEndCall = () => {
    sound.playClickSound();
    if (callTimerRef.current) clearInterval(callTimerRef.current);
    setCallState('ENDED');
    setTimeout(() => setCallState('IDLE'), 2000);
  };

  // Handle radio broadcast
  const handleRadioBroadcast = () => {
    sound.playSirenAlert();
    setIsRadioBroadcasting(true);

    const message = `Priority Flash Message to Jewar Control Room and Yamuna Expressway Intercept Network. Suspect vehicle ${vehicleNumber}, black Scorpio, heading south at ${suspectSpeed} kilometers per hour. Wanted accused ${suspectName} under Section 35 BNSS. Deploy heavy barricades and spike strips at Kilometer 48 Toll Plaza immediately.`;

    if (radioSpeechEnabled && typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(message);
      utterance.rate = 1.05;
      utterance.pitch = 0.9;
      utterance.lang = 'en-IN';
      utterance.onend = () => setIsRadioBroadcasting(false);
      utterance.onerror = () => setIsRadioBroadcasting(false);
      window.speechSynthesis.speak(utterance);
    } else {
      setTimeout(() => setIsRadioBroadcasting(false), 4500);
    }

    toast.warning('Transmitted Priority Wireless Flash across VHF Intercept Net.', 'Wireless Net Alert');
  };

  const formatSeconds = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const s = sec % 60;
    return `${mins}:${String(s).padStart(2, '0')}`;
  };

  const vtMessageText = `================================================================================
POLICE WIRELESS TELEGRAPHY (VT) IMMEDIATE FLASH DISPATCH MESSAGE
STATE CRIME BRANCH & CYBER COMMAND • CCTNS SECURE ENCRYPTED NETWORK
================================================================================
MESSAGE ID   : VT-DISPATCH-2026-UP-JWR-8812
TRANSMITTED  : ${new Date().toISOString()}
PRIORITY     : FLASH / IMMEDIATE (LIFE & HIGHWAY SECURITY)
FROM         : SPECIAL CELL & CRIME BRANCH COMMAND, SECTOR 20 NOIDA
TO           : STATION HOUSE OFFICER (SHO), ${selectedStation.name.toUpperCase()}
INFO         : SSP GAUTAM BUDDHA NAGAR / DIG MEERUT RANGE / UP 112 COMMAND
================================================================================
STATUTORY POWER : SECTION 35 BNSS (ARREST WITHOUT WARRANT)
                : SECTION 43 BNSS (PURSUIT INTO OTHER JURISDICTIONS)
                : SECTION 102 CRPC / SECTION 106 BNSS (SEIZURE OF VEHICLE)
================================================================================
1. TARGET SUSPECT DETAILS:
   - Full Name        : ${suspectName}
   - Fleeing Vehicle  : Black Mahindra Scorpio (${vehicleNumber})
   - Offense Head     : Section 303(2) BNS, Section 311 BNS (Organized Hawala Extortion)
   - Warrant Status   : Non-Bailable Arrest Warrant Issued by CJM Gautam Buddha Nagar

2. TELEMETRY & VECTOR TO SUSPECT:
   - Current Velocity : ${suspectSpeed} km/h (High-Speed Expressway Dash)
   - Current Corridor : ${currentCorridor}
   - Intercept Distance: ${selectedStation.distanceKm} km from ${selectedStation.name}
   - Estimated ETA    : ${selectedStation.etaMinutes} minutes to Toll KM 48 Plaza

3. MANDATORY DIRECTIVE TO THANA UNITS:
   a) Deploy heavy steel barricades across all 4 southward toll lanes at KM 48.
   b) Station armed PCR vans ${selectedStation.patrolVans.join(' & ')} on shoulder aprons.
   c) Lay tire deflation spike strips across Lane 1 & Lane 2.
   d) Apprehend occupants using minimum necessary force under Section 43 BNSS.
   e) Seize mobile terminals and physical currency bundles under Section 63 BSA audit.

AUTHORIZING OFFICER:
Inspector Rajesh Varma, Special Crime Branch (Badge: IO-90812)
Digital Signature Token: SEC-63-BSA-JWR-VT-ACK-9921
================================================================================`;

  const modalContent = (
    <div
      className="fixed inset-0 z-[99999] overflow-y-auto bg-black/85 backdrop-blur-md animate-in fade-in duration-200 select-none"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="thana-dispatch-title"
    >
      <div
        className="min-h-full flex justify-center p-2 sm:p-4 md:p-6"
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose();
        }}
      >
        <div className="relative w-full my-auto max-w-5xl rounded-2xl bg-slate-900 border-2 border-red-500/50 shadow-2xl overflow-hidden flex flex-col max-h-[92vh] text-slate-100">
          {/* Header */}
          <div className="p-4 sm:p-5 border-b border-border/80 bg-slate-950 flex flex-wrap items-center justify-between gap-3 shrink-0">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-red-500/20 text-red-400 border border-red-500/40 animate-pulse">
                <Siren className="h-6 w-6" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 id="thana-dispatch-title" className="text-base sm:text-lg font-black text-white tracking-tight">
                    Nearest Police Station Emergency Hotline & Flash Dispatch
                  </h2>
                  <Badge variant="outline" className="border-red-500/50 text-red-400 bg-red-950/40 text-[10px] font-mono">
                    LIVE PROXIMITY ALERT
                  </Badge>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  Direct CCTNS link to intercept fleeing suspect <span className="text-amber-300 font-bold">{suspectName}</span> ({vehicleNumber})
                </p>
              </div>
            </div>

            <button
              onClick={() => {
                sound.playClickSound();
                onClose();
              }}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              title="Close dispatch modal [Esc]"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Target Status Ribbon */}
          <div className="px-4 py-2.5 bg-red-950/40 border-b border-red-900/50 flex flex-wrap items-center justify-between gap-2 text-xs shrink-0 font-mono">
            <div className="flex items-center gap-4 flex-wrap">
              <span className="flex items-center gap-1.5 text-red-300">
                <Car className="h-3.5 w-3.5 text-red-400" />
                <span>Vehicle: <strong>{vehicleNumber}</strong> (Black Scorpio)</span>
              </span>
              <span className="flex items-center gap-1.5 text-amber-300">
                <Clock className="h-3.5 w-3.5 text-amber-400" />
                <span>Speed: <strong>{suspectSpeed} km/h</strong></span>
              </span>
              <span className="flex items-center gap-1.5 text-emerald-300">
                <MapPin className="h-3.5 w-3.5 text-emerald-400" />
                <span>Corridor: {currentCorridor}</span>
              </span>
            </div>
            <div className="text-[11px] text-slate-300">
              Nearest Thana: <strong className="text-white underline">{selectedStation.name}</strong> ({selectedStation.distanceKm} km away)
            </div>
          </div>

          {/* Station Selector Bar */}
          <div className="px-4 py-2 border-b border-border/60 bg-slate-950/80 flex items-center justify-between gap-2 overflow-x-auto shrink-0">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider whitespace-nowrap">
                Corridor Police Stations:
              </span>
              {policeStations.map((st) => (
                <button
                  key={st.id}
                  onClick={() => {
                    sound.playClickSound();
                    setSelectedStation(st);
                  }}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap ${
                    selectedStation.id === st.id
                      ? 'bg-primary text-black shadow-md'
                      : 'bg-slate-800/80 text-slate-300 hover:text-white hover:bg-slate-700'
                  }`}
                >
                  <MapPin className="h-3 w-3" />
                  <span>{st.name.split(' ')[0]} PS</span>
                  <span className={`text-[10px] px-1 rounded ${
                    st.status === 'PRIMARY' ? 'bg-red-500/20 text-red-300' : 'bg-slate-700 text-slate-300'
                  }`}>
                    {st.distanceKm} km
                  </span>
                </button>
              ))}
            </div>

            <div className="hidden sm:flex items-center gap-1">
              <Badge variant="outline" className="text-[10px] text-cyan-300 border-cyan-500/40 font-mono">
                {selectedStation.channelFrequency}
              </Badge>
            </div>
          </div>

          {/* Navigation Sub-Tabs */}
          <div className="px-4 pt-2.5 border-b border-border/60 bg-slate-950/40 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  sound.playClickSound();
                  setActiveTab('DISPATCH');
                }}
                className={`px-3 py-1.5 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 ${
                  activeTab === 'DISPATCH'
                    ? 'border-red-500 text-red-400'
                    : 'border-transparent text-slate-400 hover:text-white'
                }`}
              >
                <Send className="h-3.5 w-3.5" />
                <span>Flash Intercept Order</span>
              </button>

              <button
                onClick={() => {
                  sound.playClickSound();
                  setActiveTab('CALL');
                }}
                className={`px-3 py-1.5 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 ${
                  activeTab === 'CALL'
                    ? 'border-emerald-500 text-emerald-400'
                    : 'border-transparent text-slate-400 hover:text-white'
                }`}
              >
                <Phone className="h-3.5 w-3.5" />
                <span>Direct Thana Hotline Dial</span>
              </button>

              <button
                onClick={() => {
                  sound.playClickSound();
                  setActiveTab('RADIO');
                }}
                className={`px-3 py-1.5 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 ${
                  activeTab === 'RADIO'
                    ? 'border-cyan-500 text-cyan-400'
                    : 'border-transparent text-slate-400 hover:text-white'
                }`}
              >
                <Radio className="h-3.5 w-3.5" />
                <span>VHF Wireless Broadcast</span>
              </button>

              <button
                onClick={() => {
                  sound.playClickSound();
                  setActiveTab('MEMO');
                }}
                className={`px-3 py-1.5 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 ${
                  activeTab === 'MEMO'
                    ? 'border-amber-500 text-amber-400'
                    : 'border-transparent text-slate-400 hover:text-white'
                }`}
              >
                <FileText className="h-3.5 w-3.5" />
                <span>Statutory VT Memo Text</span>
              </button>
            </div>
          </div>

          {/* Modal Main Content */}
          <div className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-6 space-y-4">
            {/* Station Contact Card */}
            <div className="p-4 rounded-xl border border-border bg-slate-950/70 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/30 text-blue-400 shrink-0">
                  <Shield className="h-6 w-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-extrabold text-sm sm:text-base text-white">
                      {selectedStation.name}
                    </h3>
                    <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/40 text-[10px]">
                      LIVE LINKED
                    </Badge>
                  </div>
                  <div className="text-xs text-slate-300 mt-1 space-y-0.5">
                    <p><strong>SHO:</strong> {selectedStation.shoName} ({selectedStation.shoRank})</p>
                    <p><strong>Jurisdiction:</strong> {selectedStation.circle}, {selectedStation.district}</p>
                    <p className="text-slate-400"><strong>Patrol Units:</strong> {selectedStation.patrolVans.join(', ')}</p>
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 shrink-0 bg-slate-900/80 p-3 rounded-xl border border-slate-800">
                <div className="text-left sm:text-right">
                  <div className="text-[10px] uppercase tracking-wider text-slate-400">Suspect Intercept Window</div>
                  <div className="text-lg font-black text-amber-400 font-mono">
                    {selectedStation.etaMinutes} MINS
                  </div>
                  <div className="text-[10px] text-slate-400 font-mono">
                    Distance: {selectedStation.distanceKm} km
                  </div>
                </div>
                <Button
                  size="sm"
                  onClick={handleStartCall}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-emerald-600/30 w-full sm:w-auto"
                >
                  <PhoneCall className="h-3.5 w-3.5" />
                  <span>Call Thana Hotline</span>
                </Button>
              </div>
            </div>

            {/* TAB 1: DISPATCH */}
            {activeTab === 'DISPATCH' && (
              <div className="space-y-4">
                <div className="p-4 rounded-xl border border-red-500/40 bg-gradient-to-r from-red-950/30 via-slate-900 to-slate-950 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="h-5 w-5 text-red-400" />
                      <h4 className="font-extrabold text-sm text-white">
                        Emergency Roadblock & Intercept Order (Section 43 BNSS)
                      </h4>
                    </div>
                    <Badge variant="outline" className="border-red-500/50 text-red-400 text-[10px] font-mono">
                      CCTNS DISPATCH LEVEL 1
                    </Badge>
                  </div>

                  <p className="text-xs text-slate-300 leading-relaxed">
                    Transmits an authorized electronic flash warrant to {selectedStation.name}. Instructs the Duty Officer to position armed barricades, deploy tire spikes, and mobilize <strong className="text-white">{selectedStation.patrolVans[0]}</strong> to intercept the fleeing Scorpio before it crosses the district perimeter.
                  </p>

                  {/* Transmission Process Box */}
                  {isTransmitting && (
                    <div className="p-3.5 rounded-lg bg-slate-950 border border-red-500/40 space-y-2">
                      <div className="flex items-center justify-between text-xs font-mono">
                        <span className="text-red-400 font-bold">Transmitting Electronic VT Warrant...</span>
                        <span className="text-slate-400">Step {transmissionStep} of 4</span>
                      </div>
                      <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                        <div
                          className="bg-red-500 h-full transition-all duration-500"
                          style={{ width: `${(transmissionStep / 4) * 100}%` }}
                        />
                      </div>
                      <div className="text-[11px] text-slate-300 font-mono">
                        {transmissionStep === 1 && 'Authenticating IO digital token with UP Police CCTNS Node...'}
                        {transmissionStep === 2 && `Routing encrypted packet to ${selectedStation.id} terminal...`}
                        {transmissionStep === 3 && `Target station terminal ringing. Alerting SHO ${selectedStation.shoName}...`}
                        {transmissionStep === 4 && 'Directive verified and acknowledged by Station Watch Officer!'}
                      </div>
                    </div>
                  )}

                  {isDispatched && !isTransmitting && (
                    <div className="p-3.5 rounded-lg bg-emerald-950/40 border border-emerald-500/50 text-xs text-emerald-300 flex items-start gap-2.5">
                      <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0 mt-0.5" />
                      <div>
                        <div className="font-bold text-white text-xs">
                          TACTICAL INTERCEPT DIRECTIVE ACKNOWLEDGED & EXECUTED
                        </div>
                        <p className="text-[11px] text-emerald-200/90 mt-0.5 leading-relaxed">
                          Duty Officer at {selectedStation.name} has dispatched <strong>{selectedStation.patrolVans[0]}</strong> to Yamuna Expressway KM 48 Checkpoint. Roadblock barricades deployed with Section 43 BNSS statutory power.
                        </p>
                      </div>
                    </div>
                  )}

                  {!isTransmitting && !isDispatched && (
                    <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
                      <Button
                        onClick={handleTransmitDirective}
                        className="w-full sm:w-auto bg-red-600 hover:bg-red-700 text-white font-extrabold text-xs py-2.5 px-4 shadow-lg shadow-red-600/30 flex items-center justify-center gap-2"
                      >
                        <Send className="h-4 w-4" />
                        <span>Transmit Flash Intercept Order to {selectedStation.name.split(' ')[0]} PS</span>
                      </Button>
                      <span className="text-[11px] text-slate-400 font-mono">
                        Authorizing Officer: Inspector Rajesh Varma (Crime Branch)
                      </span>
                    </div>
                  )}
                </div>

                {/* Pre-formatted tactical checklist */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                  <div className="p-3 rounded-xl border border-border bg-slate-950/50 space-y-1">
                    <span className="font-bold text-white flex items-center gap-1.5">
                      <Shield className="h-3.5 w-3.5 text-blue-400" />
                      Legal Ground
                    </span>
                    <p className="text-slate-400 text-[11px]">
                      Section 35 & 43 BNSS authorizes inter-district highway pursuit and warrantless apprehension of cognizable offenders.
                    </p>
                  </div>

                  <div className="p-3 rounded-xl border border-border bg-slate-950/50 space-y-1">
                    <span className="font-bold text-white flex items-center gap-1.5">
                      <Car className="h-3.5 w-3.5 text-amber-400" />
                      Interception Vector
                    </span>
                    <p className="text-slate-400 text-[11px]">
                      Scorpio TS 09 AB 1234 predicted to arrive at Jewar KM 48 Toll Plaza in approximately 4 minutes 20 seconds.
                    </p>
                  </div>

                  <div className="p-3 rounded-xl border border-border bg-slate-950/50 space-y-1">
                    <span className="font-bold text-white flex items-center gap-1.5">
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                      Evidence Protocol
                    </span>
                    <p className="text-slate-400 text-[11px]">
                      Upon apprehension, all electronic devices must be sealed under Section 63 BSA tamper-evident forensic protocols.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: CALL SIMULATOR */}
            {activeTab === 'CALL' && (
              <div className="p-6 rounded-xl border border-border bg-slate-950 flex flex-col items-center justify-center text-center space-y-5">
                <div className="flex flex-col items-center gap-2">
                  <div className={`p-4 rounded-full border-2 transition-all ${
                    callState === 'CONNECTED'
                      ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500 animate-pulse'
                      : callState === 'DIALING'
                      ? 'bg-amber-500/20 text-amber-400 border-amber-500 animate-bounce'
                      : 'bg-slate-800 text-slate-400 border-slate-700'
                  }`}>
                    <Phone className="h-8 w-8" />
                  </div>
                  <h4 className="text-base font-black text-white mt-1">
                    {selectedStation.name} Hotline
                  </h4>
                  <div className="text-xs font-mono text-slate-400">
                    Direct Line: <strong className="text-white">{selectedStation.thanaLandline}</strong> | SHO Mobile: <strong className="text-white">{selectedStation.shoPhone}</strong>
                  </div>
                </div>

                {callState === 'IDLE' && (
                  <div className="space-y-3">
                    <p className="text-xs text-slate-300 max-w-md">
                      Initiate an encrypted CCTNS VoIP telephone link directly to {selectedStation.shoName}.
                    </p>
                    <Button
                      onClick={handleStartCall}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-2.5 px-6 shadow-lg shadow-emerald-600/30 flex items-center gap-2 mx-auto"
                    >
                      <PhoneCall className="h-4 w-4" />
                      <span>Dial {selectedStation.name.split(' ')[0]} Thana Duty Desk</span>
                    </Button>
                  </div>
                )}

                {callState === 'DIALING' && (
                  <div className="space-y-2">
                    <div className="text-sm font-mono text-amber-400 animate-pulse">
                      Dialing {selectedStation.thanaLandline}... (Ringing)
                    </div>
                    <p className="text-[11px] text-slate-400">
                      Connecting to Jewar Thana Exchange via UP Police VPN...
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleEndCall}
                      className="border-red-500/50 text-red-400 hover:bg-red-500/20"
                    >
                      Cancel Call
                    </Button>
                  </div>
                )}

                {callState === 'CONNECTED' && (
                  <div className="w-full max-w-lg space-y-4">
                    <div className="p-3 rounded-lg bg-emerald-950/40 border border-emerald-500/40 flex items-center justify-between text-xs font-mono">
                      <span className="text-emerald-400 font-bold flex items-center gap-2">
                        <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-ping" />
                        CALL CONNECTED • {selectedStation.shoName}
                      </span>
                      <span className="text-white font-extrabold">{formatSeconds(callDuration)}</span>
                    </div>

                    {/* Simulated Voice Dialogue Box */}
                    <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 text-left space-y-3 text-xs">
                      <div className="flex items-start gap-2">
                        <span className="font-bold text-emerald-400 shrink-0 font-mono">[SHO JEWAR PS]:</span>
                        <p className="text-slate-200 leading-relaxed">
                          &quot;Inspector Chauhan here, Jewar PS. We have your CCTNS flash on our screen, Inspector Varma. Scorpio TS 09 AB 1234 heading south. We are already stationing Cheetah 1 and Highway Patrol 4 at the KM 48 Toll Plaza with tire spikes ready. What is suspect status?&quot;
                        </p>
                      </div>

                      <div className="flex items-start gap-2">
                        <span className="font-bold text-cyan-400 shrink-0 font-mono">[YOU / CRIME BRANCH]:</span>
                        <p className="text-slate-300 leading-relaxed">
                          &quot;Suspect Vikram Malhotra is armed and dangerous. High flight risk. Speed 118 km/h. Estimated contact in 4 minutes. Block all toll lanes and take him into custody under Section 35 BNSS.&quot;
                        </p>
                      </div>

                      <div className="flex items-start gap-2">
                        <span className="font-bold text-emerald-400 shrink-0 font-mono">[SHO JEWAR PS]:</span>
                        <p className="text-slate-200 leading-relaxed">
                          &quot;Understood. Barricades active. We will secure suspect and transmit Section 63 BSA custody confirmation immediately upon capture.&quot;
                        </p>
                      </div>
                    </div>

                    <Button
                      onClick={handleEndCall}
                      className="bg-red-600 hover:bg-red-700 text-white font-bold text-xs py-2 px-6 flex items-center gap-2 mx-auto"
                    >
                      <PhoneOff className="h-4 w-4" />
                      <span>End Hotline Call</span>
                    </Button>
                  </div>
                )}

                {callState === 'ENDED' && (
                  <div className="text-xs text-slate-400 font-mono">
                    Call terminated. Total duration: {formatSeconds(callDuration)}. Recording logged to WORM audio ledger.
                  </div>
                )}
              </div>
            )}

            {/* TAB 3: RADIO BROADCAST */}
            {activeTab === 'RADIO' && (
              <div className="space-y-4">
                <div className="p-5 rounded-xl border border-cyan-500/40 bg-gradient-to-r from-cyan-950/30 via-slate-900 to-slate-950 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Radio className="h-5 w-5 text-cyan-400" />
                      <h4 className="font-extrabold text-sm text-white">
                        VHF Wireless Channel 4 Police Net Broadcast (156.800 MHz)
                      </h4>
                    </div>
                    <Badge variant="outline" className="border-cyan-500/50 text-cyan-400 text-[10px] font-mono">
                      UP POLICE NET 4
                    </Badge>
                  </div>

                  <p className="text-xs text-slate-300 leading-relaxed">
                    Broadcasts an immediate synthesized voice radio alert across all PCR vehicles, highway interceptors, and Thana duty consoles patrolling the Jewar / Noida / Mathura expressway grid.
                  </p>

                  <div className="p-3.5 rounded-lg bg-slate-950 border border-slate-800 space-y-2">
                    <span className="text-[11px] font-mono text-cyan-300 font-bold block">
                      RADIO TRANSMISSION TRANSCRIPT:
                    </span>
                    <p className="text-xs font-mono text-slate-200 leading-relaxed bg-slate-900 p-3 rounded border border-slate-800">
                      &quot;PRIORITY FLASH TO JEWAR CONTROL ROOM AND YAMUNA EXPRESSWAY INTERCEPT NET. SUSPECT VEHICLE {vehicleNumber}, BLACK SCORPIO, SPEED {suspectSpeed} KM/H HEADING SOUTH. WANTED ACCUSED {suspectName.toUpperCase()} UNDER SECTION 35 BNSS. DEPLOY ARMED ROADBLOCK AT KM 48 TOLL PLAZA IMMEDIATELY.&quot;
                    </p>
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    <div className="flex items-center gap-2">
                      <Button
                        onClick={handleRadioBroadcast}
                        disabled={isRadioBroadcasting}
                        className="bg-cyan-600 hover:bg-cyan-700 text-black font-extrabold text-xs py-2.5 px-4 shadow-lg shadow-cyan-600/30 flex items-center gap-2"
                      >
                        <Radio className={`h-4 w-4 ${isRadioBroadcasting ? 'animate-pulse text-white' : ''}`} />
                        <span>{isRadioBroadcasting ? 'Broadcasting on VHF Net...' : 'Transmit Voice Radio Flash'}</span>
                      </Button>
                      <button
                        onClick={() => setRadioSpeechEnabled(!radioSpeechEnabled)}
                        className={`p-2 rounded-lg border text-xs flex items-center gap-1.5 transition-colors ${
                          radioSpeechEnabled ? 'border-cyan-500/40 text-cyan-300 bg-cyan-950/30' : 'border-slate-700 text-slate-400'
                        }`}
                        title="Toggle Web Speech Synthesizer"
                      >
                        {radioSpeechEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
                        <span className="text-[10px]">Speech Synth {radioSpeechEnabled ? 'ON' : 'OFF'}</span>
                      </button>
                    </div>

                    <span className="text-[11px] text-slate-400 font-mono hidden sm:inline">
                      Simulates Two-Way Motorola APX-8000 Net
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 4: VT MEMO */}
            {activeTab === 'MEMO' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono text-slate-400">
                    Format: Police Wireless Telegraphy Dispatch (VT Message) • Court Admissible
                  </span>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        navigator.clipboard.writeText(vtMessageText);
                        toast.success('VT Dispatch Memo copied to clipboard.', 'Copied');
                      }}
                      className="text-xs flex items-center gap-1.5"
                    >
                      <Copy className="h-3.5 w-3.5" />
                      <span>Copy Memo</span>
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => window.print()}
                      className="text-xs flex items-center gap-1.5"
                    >
                      <Printer className="h-3.5 w-3.5" />
                      <span>Print Memo</span>
                    </Button>
                  </div>
                </div>

                <div className="p-4 rounded-xl border border-border bg-slate-950 text-xs font-mono text-slate-200 overflow-x-auto max-h-[48vh] leading-relaxed shadow-inner">
                  <pre className="whitespace-pre-wrap">{vtMessageText}</pre>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-3 sm:p-4 border-t border-border/80 bg-slate-950 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs shrink-0">
            <div className="flex items-center gap-2 text-slate-400 text-[11px]">
              <Shield className="h-3.5 w-3.5 text-primary" />
              <span>Compliant with Section 35 & 43 BNSS (Inter-Agency Police Dispatch)</span>
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  sound.playClickSound();
                  onClose();
                }}
                className="w-full sm:w-auto text-xs"
              >
                Close Hotline
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
