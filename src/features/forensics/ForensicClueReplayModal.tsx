import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import {
  Shield,
  Eye,
  Camera,
  Radio,
  CreditCard,
  Fingerprint,
  Play,
  Pause,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  Scale,
  FileText,
  MapPin,
  Clock,
  Car,
  ChevronRight,
  ExternalLink,
  Award,
  Sparkles,
  Zap,
  X
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Card, CardContent } from '../../components/ui/Card';
import { sound } from '../../utils/soundEffects';

interface ForensicClueReplayModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetPlate?: string;
  suspectName?: string;
}

interface ClueData {
  id: string;
  title: string;
  category: 'OPTICAL_ANPR' | 'BIOMETRIC_FACE' | 'RF_CDR' | 'FINANCIAL_ATM' | 'PHYSICAL_TATTOO';
  confidenceScore: number;
  timestamp: string;
  location: string;
  image: string;
  comparisonImage?: string;
  description: string;
  statutoryReference: string;
  technicalFindings: string[];
  forensicHash: string;
}

const FORENSIC_CLUES: ClueData[] = [
  {
    id: 'clue-1',
    title: 'High-Speed ANPR Optical Plate Reconstruction',
    category: 'OPTICAL_ANPR',
    confidenceScore: 99.4,
    timestamp: '2026-10-29 11:42:04 IST',
    location: 'Yamuna Expressway Toll KM 48 (Lane 4)',
    image: 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=450',
    comparisonImage: 'https://images.unsplash.com/photo-1617788138017-80ad40651399?w=450',
    description: 'High-speed infrared strobe optical sensor captured fleeing vehicle at 118 km/h. Optical character recognition algorithm applied bilateral edge filtering and neural character dewarping to resolve obscured plate TS 09 AB 1234.',
    statutoryReference: 'Section 136A Motor Vehicles Act & Section 63 BSA',
    technicalFindings: [
      'VAHAN 4 Database Query: Plate TS 09 AB 1234 registered to Black Mahindra Scorpio S11 (Chassis VIN: MA1TA2...981).',
      'Engine Serial & Subframe Geometry: Matched vehicle specs registered under known Hawala syndicate shell firm M/s Apex Logistics.',
      'Infrared Reflectance: High-Security Registration Plate (HSRP) hologram watermark verified authentic (Anti-cloning match: 98.7%).'
    ],
    forensicHash: '8f7a9c2b4e6d8a0f1c3e5b7d9a1f3e5b7d9a1f3e5b7d9a1f3e5b7d9a1f3e5b7d'
  },
  {
    id: 'clue-2',
    title: 'Windshield Driver Facial Keypoint Biometrics',
    category: 'BIOMETRIC_FACE',
    confidenceScore: 94.6,
    timestamp: '2026-10-29 11:42:06 IST',
    location: 'Yamuna Expressway Toll KM 48 HD Overhead Camera',
    image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=450',
    comparisonImage: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=450',
    description: '4K telephoto toll camera penetrated windshield glare via polarized optical filter. 68-point facial landmark mesh extracted and compared against national CCTNS criminal mugshot repository.',
    statutoryReference: 'Identification of Prisoners Act & Section 53 CrPC / Sec 51 BNSS',
    technicalFindings: [
      'Facial Landmark Alignment: Inter-pupillary distance, nasal bridge curvature, and jawline mandibular angle matched CCTNS Dossier #DEL-MUG-8901.',
      'Cosine Similarity: 0.946 (Threshold for judicial conviction corroboration: >= 0.85).',
      'Distinctive Facial Scars: 1.4 cm linear laceration scar on left zygomatic arch cataloged from 2024 custody record fully corroborated.'
    ],
    forensicHash: 'a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2'
  },
  {
    id: 'clue-3',
    title: 'Cellular CDR IMSI/IMEI Sector Hand-off Triangulation',
    category: 'RF_CDR',
    confidenceScore: 97.2,
    timestamp: '2026-10-29 10:55:18 IST',
    location: 'BTS Tower TOWER-NOIDA-EXPR-14 (Sector 2 Azimuth 120°)',
    image: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=450',
    description: 'Cellular network telemetry captured burner phone +91 98765 43210 executing cell hand-off during 48-second voice call. Doppler frequency shift confirmed physical handset velocity of 92 km/h moving southbound along the expressway.',
    statutoryReference: 'Indian Telegraph Act Section 5(2) & Section 63 BSA',
    technicalFindings: [
      'Timing Advance (TA) Measurement: TA=2 indicates target device was exactly 1,100m from tower antenna, intersecting Expressway KM 14.',
      'Dual SIM Co-Location: Secondary IMEI 86490104... (linked to suspect Vikram Malhotra) pinged simultaneous tower sector with 0 ms time skew.',
      'Call Audio Metadata: Call made to known safehouse coordinator Suresh Verma (+91 98110 23456) discussing vehicle swap in Mathura.'
    ],
    forensicHash: '3f4e5d6c7b8a90123456789abcdef0123456789abcdef0123456789abcdef01'
  },
  {
    id: 'clue-4',
    title: 'Noida Sector 18 ATM Smurfing Withdrawal Still',
    category: 'FINANCIAL_ATM',
    confidenceScore: 96.8,
    timestamp: '2026-10-29 10:32:44 IST',
    location: 'HDFC Bank ATM Kiosk #1804, Sector 18, Noida',
    image: 'https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=450',
    description: 'CCTV footage inside ATM kiosk captured suspect wearing dark windbreaker with orange collar piping withdrawing Rs. 49,000 using debit card linked to mule account ACC-HDFC-908122, exactly 32 minutes before highway toll sighting.',
    statutoryReference: 'Section 102 CrPC / Section 106 BNSS Bank Seizure Standard',
    technicalFindings: [
      'Card Fingerprint: RuPay Platinum Card #6071...5541 seized from Vikram Malhotra matches magnetic stripe authorization log at 10:32:44 IST.',
      'Structured Cash Deposit & Withdrawal Pattern: Part of 14-account smurfing ring funneled by syndicate operative Suresh to evade FIU-IND Rs. 50k reporting ceiling.',
      'Apparel Verification: Exact same black windbreaker with orange collar piping visible on driver in Yamuna Toll KM 48 optical feed.'
    ],
    forensicHash: '5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6'
  },
  {
    id: 'clue-5',
    title: 'Distinctive Right Forearm Scorpion Tattoo',
    category: 'PHYSICAL_TATTOO',
    confidenceScore: 98.9,
    timestamp: '2026-10-29 11:42:05 IST',
    location: 'Yamuna Expressway Toll KM 48 Side Barrier Camera',
    image: 'https://images.unsplash.com/photo-1598371839696-5c5bb00bdc28?w=450',
    comparisonImage: 'https://images.unsplash.com/photo-1562962230-16e4623d36e6?w=450',
    description: 'When driver extended right arm to tap FASTag RFID bypass sensor, side barrier camera captured a 3.5-inch black ink scorpion tattoo on the dorsal aspect of the right forearm.',
    statutoryReference: 'CCTNS Physical Features & Modus Operandi Modality',
    technicalFindings: [
      'CCTNS Modus Operandi Registry #MO-DEL-2024-819: Records suspect Vikram Malhotra possessing permanent scorpion tattoo on right forearm.',
      'Visual Invariant SIFT Keypoints: Tattoo morphology, stinger curve curvature, and pincer symmetry match prior jail booking photograph with 98.9% certainty.',
      'Biometric Uniqueness: Eliminates any defense of lookalike driver or identity dispute in court.'
    ],
    forensicHash: '7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8'
  }
];

interface ScenarioPhase {
  step: number;
  time: string;
  title: string;
  location: string;
  speed: string;
  tacticalLog: string;
  policeDispatch: string;
  cluesActive: string[];
  image: string;
  imageCaption: string;
}

const SCENARIO_PHASES: ScenarioPhase[] = [
  {
    step: 1,
    time: '09:30 IST',
    title: 'Extortion Threat & Burner Activation',
    location: 'Connaught Place Inner Circle, New Delhi',
    speed: '45 km/h',
    tacticalLog: 'Suspect Vikram Malhotra activates burner SIM +91 98765 43210 at CP safehouse. Dispatches extortion threat to victim businessman demanding Rs. 25 Lakhs hawala transfer.',
    policeDispatch: 'Cyber Cell flags active call keyword hit on Hawala monitoring grid. Local PCR-01 alerted to patrol outer circle.',
    cluesActive: ['clue-3'],
    image: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=500',
    imageCaption: 'RF Telecom Gateway: Cellular sector tower dump ping tracking burner SIM +91 98765 43210 in Connaught Place'
  },
  {
    step: 2,
    time: '10:15 IST',
    title: 'Inter-State Border Crossing at Chilla',
    location: 'Mayur Vihar / Chilla Border Toll Plaza',
    speed: '75 km/h',
    tacticalLog: 'Suspect vehicle TS 09 AB 1234 crosses Delhi-UP border heading into Noida. ANPR camera records vehicle at 75 km/h.',
    policeDispatch: 'UP Police Inter-State Border Control room receives automated VAHAN hotlist hit. Inter-state alert dispatched to Noida Control.',
    cluesActive: ['clue-1'],
    image: 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=500',
    imageCaption: 'Highway ANPR Gantry: High-speed infrared optical OCR camera capture at Chilla Toll Plaza'
  },
  {
    step: 3,
    time: '10:32 IST',
    title: 'ATM Cash Mule Withdrawal & Highway Transit',
    location: 'Noida Sector 18 HDFC Kiosk & Sector 14 BTS',
    speed: '80 km/h',
    tacticalLog: 'Suspect makes quick 3-minute stop at Sector 18 ATM withdrawing Rs. 49,000 cash. Cellular tower at KM 14 records encrypted coordination call with syndicate safehouse in Mathura.',
    policeDispatch: 'Financial Intelligence Unit registers structured smurfing transaction. Highway patrol unit PCR-04 dispatched toward Greater Noida gateway.',
    cluesActive: ['clue-3', 'clue-4'],
    image: 'https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=500',
    imageCaption: 'CCTV Kiosk Surveillance: Sector 18 ATM optical feed capturing cash withdrawal under BNSS Sec 106'
  },
  {
    step: 4,
    time: '11:42 IST',
    title: 'Yamuna Expressway Toll KM 48 Sighting & Intercept Lock',
    location: 'Yamuna Expressway Toll KM 48, Jewar',
    speed: '118 km/h',
    tacticalLog: 'Vehicle speeds through Toll KM 48 at 118 km/h. High-speed infrared ANPR confirms plate, 4K camera captures facial landmarks, and side camera photographs right forearm tattoo.',
    policeDispatch: 'CRIMENEXUS spatial engine calculates optimal interdiction: Jewar PS Interceptor Squad PCR-04 executes highway rolling roadblock, halting vehicle safely at KM 52.',
    cluesActive: ['clue-1', 'clue-2', 'clue-3', 'clue-4', 'clue-5'],
    image: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=500',
    imageCaption: 'Tactical Interdiction: Lead IO Insp. Rajesh Varma and PCR-04 squad executing rolling roadblock at KM 52'
  }
];

export function ForensicClueReplayModal({
  isOpen,
  onClose,
  targetPlate = 'TS 09 AB 1234',
  suspectName = 'Vikram Malhotra @ Vicky'
}: ForensicClueReplayModalProps) {
  const [activeTab, setActiveTab] = useState<'clues' | 'telecast' | 'proof'>('clues');
  const [selectedClue, setSelectedClue] = useState<ClueData>(FORENSIC_CLUES[0]);

  // Telecast Replay States
  const [currentPhaseIdx, setCurrentPhaseIdx] = useState<number>(0);
  const [isPlayingScenario, setIsPlayingScenario] = useState<boolean>(false);
  const [scenarioSpeed, setScenarioSpeed] = useState<number>(1);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!isPlayingScenario) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    const interval = Math.max(1200, 3200 / scenarioSpeed);
    timerRef.current = setInterval(() => {
      setCurrentPhaseIdx((prev) => {
        if (prev >= SCENARIO_PHASES.length - 1) {
          setIsPlayingScenario(false);
          sound.playSuccessChime();
          return prev;
        }
        sound.playRadarPing();
        return prev + 1;
      });
    }, interval);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPlayingScenario, scenarioSpeed]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const currentPhase = SCENARIO_PHASES[currentPhaseIdx];

  const modalContent = (
    <div
      className="fixed inset-0 z-[99999] overflow-y-auto bg-black/85 backdrop-blur-md animate-in fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          sound.playClickSound();
          onClose();
        }
      }}
    >
      <div
        className="min-h-full flex justify-center p-2 sm:p-4 md:p-6"
        onClick={(e) => {
          if (e.target === e.currentTarget) {
            sound.playClickSound();
            onClose();
          }
        }}
      >
        <div className="relative w-full my-auto max-w-6xl max-h-[92vh] flex flex-col rounded-2xl border-2 border-primary/50 bg-slate-900 shadow-2xl overflow-hidden text-slate-100">
          {/* Modal Header */}
          <div className="p-4 px-6 border-b border-border/80 bg-slate-950 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-red-600/20 text-red-400 border border-red-500/40">
              <Shield className="h-6 w-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black tracking-wide text-white">
                  Forensic Multi-Clue Telecast & Identity Triangulation Engine
                </h2>
                <Badge variant="outline" className="border-red-500 text-red-400 bg-red-950/50 text-[10px] font-mono">
                  SECTION 63 BSA CERTIFIED
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                Target: <b className="text-white">{suspectName}</b> • Vehicle: <b className="text-amber-300 font-mono">{targetPlate}</b> • IO: Insp. Rajesh Varma
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Tab Navigation */}
            <div className="flex items-center bg-slate-800/80 p-1 rounded-xl border border-slate-700">
              <button
                onClick={() => {
                  sound.playClickSound();
                  setActiveTab('clues');
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                  activeTab === 'clues'
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Eye className="h-3.5 w-3.5" />
                <span>Hidden Clues Matrix (5)</span>
              </button>
              <button
                onClick={() => {
                  sound.playClickSound();
                  setActiveTab('telecast');
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                  activeTab === 'telecast'
                    ? 'bg-red-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Play className="h-3.5 w-3.5" />
                <span>Retelecast Scenario</span>
              </button>
              <button
                onClick={() => {
                  sound.playClickSound();
                  setActiveTab('proof');
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                  activeTab === 'proof'
                    ? 'bg-emerald-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Scale className="h-3.5 w-3.5" />
                <span>How We Confirmed It Is Him</span>
              </button>
            </div>

            <button
              onClick={() => {
                sound.playClickSound();
                onClose();
              }}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              title="Close Modal"
              aria-label="Close Modal"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
          {/* TAB 1: PICTORIAL HIDDEN CLUES MATRIX */}
          {activeTab === 'clues' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                {FORENSIC_CLUES.map((clue) => {
                  const isSelected = selectedClue.id === clue.id;
                  return (
                    <button
                      key={clue.id}
                      onClick={() => {
                        sound.playClickSound();
                        setSelectedClue(clue);
                      }}
                      className={`p-3 rounded-xl border text-left transition-all relative overflow-hidden flex flex-col justify-between ${
                        isSelected
                          ? 'border-blue-500 bg-blue-950/40 shadow-lg shadow-blue-950/60 ring-2 ring-blue-500/50'
                          : 'border-slate-800 bg-slate-950/60 hover:bg-slate-800/50 hover:border-slate-700'
                      }`}
                    >
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-mono text-muted-foreground uppercase">
                            {clue.category}
                          </span>
                          <span className="text-[11px] font-black text-emerald-400">
                            {clue.confidenceScore}%
                          </span>
                        </div>
                        <h4 className="font-extrabold text-xs text-white line-clamp-2 leading-snug">
                          {clue.title}
                        </h4>
                      </div>

                      <div className="pt-3 border-t border-slate-800/80 mt-2 flex items-center justify-between text-[10px] text-slate-400">
                        <span>{clue.location.split('(')[0]}</span>
                        <ChevronRight className="h-3 w-3 text-blue-400" />
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Selected Clue Deep-Dive Forensic View */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 bg-slate-950/70 p-5 rounded-2xl border border-slate-800">
                {/* Visual Imagery Panel (Before / After Optical Comparison) */}
                <div className="lg:col-span-5 space-y-3">
                  <div className="relative rounded-xl overflow-hidden border border-slate-700 bg-slate-900 shadow-xl group">
                    <img
                      src={selectedClue.image}
                      alt={selectedClue.title}
                      className="w-full h-64 object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute top-3 left-3 bg-slate-950/90 backdrop-blur-md px-2.5 py-1 rounded-lg border border-red-500/50 text-[10px] font-bold text-red-300 flex items-center gap-1.5">
                      <Camera className="h-3 w-3 text-red-400" />
                      <span>OPTICAL CAPTURE STILL</span>
                    </div>
                    <div className="absolute bottom-3 right-3 bg-emerald-950/90 backdrop-blur-md px-2.5 py-1 rounded-lg border border-emerald-500/50 text-[10px] font-mono font-bold text-emerald-300">
                      Match: {selectedClue.confidenceScore}%
                    </div>
                  </div>

                  {selectedClue.comparisonImage && (
                    <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex items-center gap-3">
                      <img
                        src={selectedClue.comparisonImage}
                        alt="CCTNS Reference"
                        className="w-14 h-14 rounded-lg object-cover border border-slate-700 shrink-0"
                      />
                      <div className="text-xs space-y-0.5">
                        <span className="font-bold text-white text-[11px] block">
                          Official CCTNS Database Criminal Record
                        </span>
                        <p className="text-[10px] text-muted-foreground">
                          Corroborated against biometric booking entry from FIR #2026-DEL-9901.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* SHA-256 Hash Seal */}
                  <div className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800 text-[10px] space-y-1 font-mono">
                    <span className="text-muted-foreground block text-[9px] uppercase tracking-wider">
                      Section 63 BSA Digital Evidence SHA-256 Seal:
                    </span>
                    <span className="text-sky-300 break-all select-all font-semibold">
                      {selectedClue.forensicHash}
                    </span>
                  </div>
                </div>

                {/* Analytical Forensics & Corroboration Details */}
                <div className="lg:col-span-7 space-y-4">
                  <div>
                    <div className="flex flex-wrap items-center gap-2 mb-1.5">
                      <Badge className="bg-blue-600/30 text-blue-300 border border-blue-500/50 text-xs">
                        {selectedClue.category}
                      </Badge>
                      <Badge className="bg-emerald-600/20 text-emerald-300 border border-emerald-500/40 text-xs">
                        JUDICIAL CERTAINTY: {selectedClue.confidenceScore}%
                      </Badge>
                      <span className="text-xs text-muted-foreground font-mono">
                        {selectedClue.timestamp}
                      </span>
                    </div>
                    <h3 className="text-lg font-black text-white">{selectedClue.title}</h3>
                    <p className="text-xs text-slate-300 leading-relaxed mt-2">
                      {selectedClue.description}
                    </p>
                  </div>

                  {/* Technical Findings Bullet Points */}
                  <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-2.5">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                      <CheckCircle2 className="h-4 w-4" />
                      Forensic Triangulation Analysis
                    </h4>
                    <ul className="space-y-2 text-xs text-slate-300">
                      {selectedClue.technicalFindings.map((finding, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <span className="h-1.5 w-1.5 rounded-full bg-amber-400 mt-1.5 shrink-0" />
                          <span>{finding}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Statutory Reference Card */}
                  <div className="p-3 rounded-xl bg-sky-950/30 border border-sky-500/40 flex items-center justify-between text-xs">
                    <div>
                      <span className="text-[10px] text-sky-400 font-bold block uppercase">
                        Legal Evidentiary Grounding
                      </span>
                      <span className="font-semibold text-white">
                        {selectedClue.statutoryReference}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] text-slate-400 block">Admissibility Status</span>
                      <span className="text-emerald-400 font-bold text-xs">Court-Admissible</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: SCENARIO RETELECAST ENGINE */}
          {activeTab === 'telecast' && (
            <div className="space-y-6">
              {/* Playback Controls Bar */}
              <div className="p-3 px-4 rounded-xl border border-slate-700 bg-slate-950 flex flex-wrap items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant={isPlayingScenario ? 'danger' : 'primary'}
                    onClick={() => {
                      sound.playClickSound();
                      setIsPlayingScenario(!isPlayingScenario);
                    }}
                    className="flex items-center gap-1.5 font-bold"
                  >
                    {isPlayingScenario ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                    <span>{isPlayingScenario ? 'Pause Retelecast' : 'Play Scenario Retelecast'}</span>
                  </Button>

                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      sound.playClickSound();
                      setCurrentPhaseIdx(0);
                      setIsPlayingScenario(false);
                    }}
                    className="flex items-center gap-1.5"
                  >
                    <RotateCcw className="h-4 w-4" />
                    <span>Reset</span>
                  </Button>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-muted-foreground font-semibold">Speed:</span>
                  {[1, 2].map((spd) => (
                    <button
                      key={spd}
                      onClick={() => {
                        sound.playClickSound();
                        setScenarioSpeed(spd);
                      }}
                      className={`px-2.5 py-1 rounded text-xs font-bold transition-colors ${
                        scenarioSpeed === spd
                          ? 'bg-blue-600 text-white'
                          : 'bg-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      {spd}x
                    </button>
                  ))}
                  <span className="h-4 w-px bg-slate-700 mx-1" />
                  <span className="text-slate-300 font-mono text-xs">
                    Phase <b>{currentPhase.step}</b> of <b>{SCENARIO_PHASES.length}</b>
                  </span>
                </div>
              </div>

              {/* Dynamic Phase Progress Stepper */}
              <div className="grid grid-cols-4 gap-2">
                {SCENARIO_PHASES.map((phase, idx) => {
                  const isActive = idx === currentPhaseIdx;
                  const isPassed = idx < currentPhaseIdx;
                  return (
                    <button
                      key={phase.step}
                      onClick={() => {
                        sound.playClickSound();
                        setCurrentPhaseIdx(idx);
                      }}
                      className={`p-3 rounded-xl border text-left transition-all ${
                        isActive
                          ? 'border-red-500 bg-red-950/40 shadow-lg ring-2 ring-red-500/40'
                          : isPassed
                          ? 'border-emerald-500/50 bg-emerald-950/20'
                          : 'border-slate-800 bg-slate-950/40 hover:bg-slate-800/40'
                      }`}
                    >
                      <div className="flex items-center justify-between text-[11px] mb-1">
                        <span className="font-mono font-bold text-amber-400">{phase.time}</span>
                        {isPassed && <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />}
                      </div>
                      <div className="font-extrabold text-xs text-white truncate">
                        {phase.title}
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Active Phase Cinematic Telecast Display */}
              <div className="p-6 rounded-2xl bg-slate-950 border border-slate-800 grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
                <div className="lg:col-span-7 space-y-4">
                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full bg-red-500 animate-ping" />
                    <span className="text-xs font-mono font-black text-red-400 uppercase tracking-wider">
                      LIVE SCENARIO RETELECAST: PHASE {currentPhase.step} OF 4
                    </span>
                    <Badge variant="outline" className="border-slate-700 text-slate-300 text-[10px]">
                      {currentPhase.speed} Recorded Speed
                    </Badge>
                  </div>

                  <h3 className="text-xl font-black text-white">{currentPhase.title}</h3>
                  <div className="flex items-center gap-2 text-xs text-sky-400 font-mono">
                    <MapPin className="h-4 w-4 shrink-0" />
                    <span>{currentPhase.location}</span>
                  </div>

                  {/* Tactical Narrative */}
                  <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-1.5 text-xs">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                      Incident Chronicle Narrative:
                    </span>
                    <p className="text-slate-200 leading-relaxed font-sans">
                      {currentPhase.tacticalLog}
                    </p>
                  </div>

                  {/* Police VHF Dispatch Order */}
                  <div className="p-3.5 rounded-xl bg-blue-950/40 border border-blue-500/40 text-xs space-y-1 font-mono">
                    <span className="text-[10px] text-blue-400 font-bold block uppercase flex items-center gap-1.5">
                      <Radio className="h-3.5 w-3.5 animate-pulse" />
                      Police VHF CH-04 Dispatch Telemetry:
                    </span>
                    <p className="text-blue-200">
                      "{currentPhase.policeDispatch}"
                    </p>
                  </div>
                </div>

                {/* Evidence Clues Triggered in this Phase */}
                <div className="lg:col-span-5 space-y-3">
                  {/* Phase Scene Photographic Evidence */}
                  <div className="relative rounded-xl overflow-hidden border border-slate-700 bg-slate-900 shadow-xl group">
                    <img
                      src={currentPhase.image}
                      alt={currentPhase.title}
                      className="w-full h-36 object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute top-2 left-2 bg-slate-950/90 backdrop-blur-md px-2 py-0.5 rounded border border-blue-500/50 text-[9px] font-bold text-blue-300 flex items-center gap-1">
                      <Camera className="h-3 w-3 text-blue-400" />
                      <span>OPTICAL TELEMETRY STILL</span>
                    </div>
                    <div className="p-2 bg-slate-950/95 border-t border-slate-800 text-[10px] text-slate-300 font-mono leading-tight">
                      {currentPhase.imageCaption}
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-3">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                      <Eye className="h-4 w-4" />
                      Corroborating Evidence Rails Active:
                    </h4>

                    <div className="space-y-2">
                      {currentPhase.cluesActive.map((clueId) => {
                        const clue = FORENSIC_CLUES.find((c) => c.id === clueId);
                        if (!clue) return null;
                        return (
                          <div
                            key={clue.id}
                            className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-between text-xs"
                          >
                            <div className="flex items-center gap-2">
                              <span className="h-2 w-2 rounded-full bg-emerald-400" />
                              <span className="font-bold text-white text-[11px]">{clue.title}</span>
                            </div>
                            <span className="text-emerald-400 font-mono font-bold text-[10px]">
                              {clue.confidenceScore}%
                            </span>
                          </div>
                        );
                      })}
                    </div>

                    <div className="pt-2 border-t border-slate-800 text-center">
                      <button
                        onClick={() => {
                          sound.playClickSound();
                          setActiveTab('proof');
                        }}
                        className="text-xs text-blue-400 hover:text-white underline font-semibold"
                      >
                        Inspect Section 63 BSA Confirmation Analysis ➔
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: HOW WE CONFIRMED IT IS HIM (FORENSIC PROOF) */}
          {activeTab === 'proof' && (
            <div className="space-y-6">
              {/* Executive Forensic Confirmation Statement */}
              <div className="p-6 rounded-2xl bg-gradient-to-r from-emerald-950/60 via-slate-950 to-blue-950/60 border border-emerald-500/50 space-y-4">
                <div className="flex items-center gap-2.5">
                  <Award className="h-6 w-6 text-emerald-400" />
                  <h3 className="text-lg font-black text-white">
                    Multi-Factor Forensic Triangulation: Legal Proof of Identity
                  </h3>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed font-sans">
                  Under Indian criminal jurisprudence, single-factor digital identification (such as optical plate detection alone or isolated CDR tower records) is vulnerable to judicial dismissal due to cloned number plates, borrowed handsets, or windshield glare. CRIMENEXUS confirms suspect identity by executing a <b>5-Modal Independent Corroboration Engine</b>. When optical, biometric, radio frequency, financial, and physical markers intersect at the exact same geographical coordinates and millisecond timestamp, identity certainty surpasses the statutory threshold of <i>beyond reasonable doubt</i>.
                </p>

                {/* Proof Modality Table */}
                <div className="overflow-x-auto rounded-xl border border-slate-800">
                  <table className="w-full text-xs text-left min-w-[650px]">
                    <thead className="bg-slate-900 text-slate-300 font-bold uppercase text-[10px] border-b border-slate-800">
                      <tr>
                        <th className="p-3">Evidence Modality</th>
                        <th className="p-3">Seizure / Detection Source</th>
                        <th className="p-3">Cross-Corroborating Match</th>
                        <th className="p-3 text-right">Confidence</th>
                        <th className="p-3 text-center">Judicial Admissibility</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/80 font-mono text-[11px]">
                      <tr className="hover:bg-slate-900/40">
                        <td className="p-3 font-sans font-bold text-white flex items-center gap-1.5">
                          <Camera className="h-3.5 w-3.5 text-blue-400" /> 1. Optical ANPR
                        </td>
                        <td className="p-3 text-slate-300">Toll KM 48 Lane 4 Sensor</td>
                        <td className="p-3 text-amber-300">VAHAN 4 Chassis VIN Link</td>
                        <td className="p-3 text-right text-emerald-400 font-bold">99.4%</td>
                        <td className="p-3 text-center">
                          <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800 text-[10px]">
                            SEC 136A MVA
                          </span>
                        </td>
                      </tr>
                      <tr className="hover:bg-slate-900/40">
                        <td className="p-3 font-sans font-bold text-white flex items-center gap-1.5">
                          <Fingerprint className="h-3.5 w-3.5 text-purple-400" /> 2. Facial Biometrics
                        </td>
                        <td className="p-3 text-slate-300">4K Windshield Glare Filter</td>
                        <td className="p-3 text-amber-300">CCTNS Criminal Mugshot #8901</td>
                        <td className="p-3 text-right text-emerald-400 font-bold">94.6%</td>
                        <td className="p-3 text-center">
                          <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800 text-[10px]">
                            SEC 51 BNSS
                          </span>
                        </td>
                      </tr>
                      <tr className="hover:bg-slate-900/40">
                        <td className="p-3 font-sans font-bold text-white flex items-center gap-1.5">
                          <Radio className="h-3.5 w-3.5 text-cyan-400" /> 3. Cellular CDR & TA
                        </td>
                        <td className="p-3 text-slate-300">BTS Tower Sector 14 Azimuth</td>
                        <td className="p-3 text-amber-300">Target Burner IMEI Co-Location</td>
                        <td className="p-3 text-right text-emerald-400 font-bold">97.2%</td>
                        <td className="p-3 text-center">
                          <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800 text-[10px]">
                            SEC 63 BSA
                          </span>
                        </td>
                      </tr>
                      <tr className="hover:bg-slate-900/40">
                        <td className="p-3 font-sans font-bold text-white flex items-center gap-1.5">
                          <CreditCard className="h-3.5 w-3.5 text-amber-400" /> 4. Financial Smurfing
                        </td>
                        <td className="p-3 text-slate-300">Sector 18 ATM Camera</td>
                        <td className="p-3 text-amber-300">Rs. 49k Cash Card Magnetic Stripe</td>
                        <td className="p-3 text-right text-emerald-400 font-bold">96.8%</td>
                        <td className="p-3 text-center">
                          <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800 text-[10px]">
                            SEC 106 BNSS
                          </span>
                        </td>
                      </tr>
                      <tr className="hover:bg-slate-900/40">
                        <td className="p-3 font-sans font-bold text-white flex items-center gap-1.5">
                          <Eye className="h-3.5 w-3.5 text-red-400" /> 5. Bodily Scorpion Tattoo
                        </td>
                        <td className="p-3 text-slate-300">Toll Cabin Optical Zoom</td>
                        <td className="p-3 text-amber-300">CCTNS MO Record #MO-DEL-2024</td>
                        <td className="p-3 text-right text-emerald-400 font-bold">98.9%</td>
                        <td className="p-3 text-center">
                          <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800 text-[10px]">
                            SEC 9 IEA / BSA
                          </span>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Summary Score Bar */}
                <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-xl bg-slate-900 border border-slate-800 text-xs">
                  <div>
                    <span className="text-muted-foreground block text-[10px] uppercase font-bold">
                      Composite Triangulation Certainty Index
                    </span>
                    <span className="text-lg font-black text-emerald-400">
                      98.8% Statistical & Evidentiary Proof
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      onClick={() => {
                        sound.playSuccessChime();
                        window.open('/CRIMENEXUS_Police_Department_Deployment_Dossier.pdf', '_blank');
                      }}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold flex items-center gap-1.5 shadow-lg shadow-emerald-950/50"
                    >
                      <FileText className="h-4 w-4" />
                      <span>Download Section 63 BSA Court Certificate</span>
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-3.5 px-6 border-t border-slate-800 bg-slate-950 flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-400" />
            <span>CRIMENEXUS Multi-Modal Telecast Engine v2.4</span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                sound.playClickSound();
                onClose();
              }}
              className="border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white"
            >
              <X className="h-3.5 w-3.5 mr-1" />
              Close [Esc]
            </Button>
          </div>
        </div>
      </div>
    </div>
  </div>
);

  return typeof document !== 'undefined' ? createPortal(modalContent, document.body) : modalContent;
}
