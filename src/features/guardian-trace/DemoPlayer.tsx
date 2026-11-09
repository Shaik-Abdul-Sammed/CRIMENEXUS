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
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { sound } from '../../utils/soundEffects';
import { useToast } from '../../components/ui/Toast';
import { DocumentPreviewModal } from '../../components/common/DocumentPreviewModal';

interface DemoStep {
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

const DEMO_STEPS: DemoStep[] = [
  {
    second: 0,
    title: 'Report Registered (Form 24.5)',
    source: 'FIR_INTAKE',
    icon: ShieldAlert,
    color: '#EF4444',
    locationName: 'Lajpat Nagar Metro Station Exit Gate 3',
    coords: [77.2431, 28.5665],
    toastMsg: 'AANYA SHARMA (8) reported missing — 3:30 PM yesterday.',
    details: 'Father reported 8yo girl in blue school uniform missing after school bus drop at metro station.',
    confidence: 0.95,
  },
  {
    second: 5,
    title: 'Initial Cellular IMEI Ping',
    source: 'IMEI_PING',
    icon: Radio,
    color: '#3B82F6',
    locationName: 'Airtel Tower #DEL-LPN-03 (Sector 4)',
    coords: [77.2431, 28.5665],
    toastMsg: 'Digital Fusion Engine: First sighting detected via IMEI — 3:32 PM.',
    details: 'Active handset IMEI 356789012345678 registered azimuth 140° beam at Lajpat Nagar.',
    confidence: 0.95,
  },
  {
    second: 15,
    title: 'Metro AFC Gate Transit Tap',
    source: 'METRO_CARD',
    icon: Bus,
    color: '#10B981',
    locationName: 'Rajiv Chowk Metro Concourse (Blue Line)',
    coords: [77.2197, 28.6328],
    toastMsg: 'Movement confirmed — Metro card used at Rajiv Chowk at 4:45 PM.',
    details: 'Prepaid metro smartcard tapped through turnstile 08 at Rajiv Chowk station interchange.',
    confidence: 0.90,
  },
  {
    second: 30,
    title: 'Public WiFi Probe Burst',
    source: 'WIFI_PROBE',
    icon: Wifi,
    color: '#06B6D4',
    locationName: 'Connaught Place Inner Circle Cafe',
    coords: [77.2167, 28.6315],
    toastMsg: 'WiFi probe detected near Connaught Place — 8:30 PM.',
    details: 'Smartphone MAC address probed public municipal open WiFi router near Block B CP.',
    confidence: 0.70,
  },
  {
    second: 45,
    title: 'Emergency UPI Transaction',
    source: 'UPI',
    icon: CreditCard,
    color: '#F59E0B',
    locationName: 'Paharganj Medical Store ATM Gateway',
    coords: [77.2140, 28.6280],
    toastMsg: 'UPI transaction — ₹200 at Paharganj ATM — 9:30 PM.',
    details: 'Merchant micro-debit ₹200 at chemist pharmacy counter; likely inhaler medicine purchase.',
    confidence: 0.85,
  },
  {
    second: 60,
    title: 'Bluetooth BLE Peripheral Beacon',
    source: 'BLUETOOTH',
    icon: Bluetooth,
    color: '#8B5CF6',
    locationName: 'Paharganj Commercial Guesthouse Zone',
    coords: [77.2120, 28.6420],
    toastMsg: 'Bluetooth beacon — Paharganj area — 11:30 PM.',
    details: 'BLE wearable smart-band ping logged by municipal sensor beacon near Main Bazaar.',
    confidence: 0.65,
  },
  {
    second: 75,
    title: 'DTC Transit Bus E-Ticket',
    source: 'TRANSIT',
    icon: Bus,
    color: '#10B981',
    locationName: 'Paharganj → New Delhi Railway Station Bus Route',
    coords: [77.2087, 28.6458],
    toastMsg: 'Bus ticket purchased — Paharganj → New Delhi Station — 7:30 AM.',
    details: 'Electronic ticket validator confirmed boarding on route 181 bound for Ajmeri Gate.',
    confidence: 0.90,
  },
  {
    second: 85,
    title: 'AI Spatio-Temporal Prediction',
    source: 'AI_PREDICTION',
    icon: Sparkles,
    color: '#22C55E',
    locationName: 'New Delhi Railway Station (Platform Concourse)',
    coords: [77.2195, 28.6430],
    toastMsg: 'AI Prediction: 87% probability — New Delhi Railway Station.',
    details: 'Diurnal transit momentum & directional velocity vector isolates NDLS Platform 1-4.',
    confidence: 0.87,
  },
  {
    second: 90,
    title: 'Tactical Intercept Locked & PCR Dispatched',
    source: 'PCR_DISPATCH',
    icon: Navigation,
    color: '#EF4444',
    locationName: 'NDLS Ajmeri Gate Passenger Concourse',
    coords: [77.2195, 28.6430],
    toastMsg: 'Search grid optimized. 12 sightings in 18 hours. PCR dispatched to top prediction.',
    details: 'PCR Patrol Unit Alpha-04 vector deployed. Intercept cordon locked; ETA 4 minutes.',
    confidence: 0.96,
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
  const [dossierPreviewOpen, setDossierPreviewOpen] = useState<boolean>(false);

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Synchronized step sequence driven by seconds counter
  useEffect(() => {
    if (!isOpen) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    if (isPlaying) {
      timerRef.current = setInterval(() => {
        setCurrentSecond((prev) => {
          if (prev >= 90) {
            setIsPlaying(false);
            return 90;
          }
          return prev + 1;
        });
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isOpen, isPlaying]);

  // Handle milestone toasts and audio cues at exact seconds
  useEffect(() => {
    const matchingStepIndex = DEMO_STEPS.findIndex((s) => s.second === currentSecond);
    if (matchingStepIndex !== -1 && matchingStepIndex !== activeStepIndex) {
      setActiveStepIndex(matchingStepIndex);
      const step = DEMO_STEPS[matchingStepIndex];
      sound.playRadarPing();
      toast.info(step.toastMsg, step.title);
      if (onStepChange) {
        onStepChange(step);
      }
    }
  }, [currentSecond, activeStepIndex, onStepChange, toast]);

  if (!isOpen) return null;

  const currentStep = DEMO_STEPS[activeStepIndex] || DEMO_STEPS[0];
  const StepIcon = currentStep.icon;

  const handleSkip = () => {
    sound.playClickSound();
    setCurrentSecond(90);
    setActiveStepIndex(DEMO_STEPS.length - 1);
    setIsPlaying(false);
    toast.success('Jumped to final AI Prediction & Tactical Intercept stage.', 'Simulation Fast-Forward');
  };

  const handleReplay = () => {
    sound.playClickSound();
    setCurrentSecond(0);
    setActiveStepIndex(0);
    setIsPlaying(true);
    toast.info('Restarting 90-second Guardian Trace rescue simulation.', 'Demo Replay');
  };

  return (
    <div className="fixed inset-0 z-[999999] bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-hidden animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl bg-slate-900 border-2 border-emerald-500/60 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Top Header */}
        <div className="p-4 border-b border-border/80 bg-slate-950 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 shadow-glow">
              <Sparkles className="h-5 w-5 animate-spin-slow" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black text-white tracking-wide">
                  Guardian Trace: Live 90-Second Multimodal Rescue Demo
                </h2>
                <Badge className="bg-emerald-600 text-white font-extrabold text-[10px] animate-pulse">
                  SIMULATION ACTIVE
                </Badge>
              </div>
              <p className="text-xs text-slate-300">
                Aanya Sharma (8) • 18-Hour Digital Exhaust Fusion & Predictive Transit Intercept
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
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
        <div className="bg-slate-950 px-4 py-2 border-b border-border/60 shrink-0">
          <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 mb-1">
            <span className="flex items-center gap-1.5 text-emerald-400 font-bold">
              <Clock className="h-3.5 w-3.5" />
              <span>Elapsed: {currentSecond}s / 90s</span>
            </span>
            <span>Target: NDLS Platform Concourse</span>
          </div>

          <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden relative">
            <div
              className="h-full bg-gradient-to-r from-emerald-500 via-cyan-400 to-amber-400 transition-all duration-300 rounded-full"
              style={{ width: `${(currentSecond / 90) * 100}%` }}
            />
          </div>

          {/* Milestone markers on scrubber */}
          <div className="flex justify-between text-[9px] font-mono text-slate-500 pt-1">
            <span>0s: Intake</span>
            <span>15s: Metro</span>
            <span>45s: UPI</span>
            <span>60s: BLE</span>
            <span>75s: Bus</span>
            <span>85s: AI Pred</span>
            <span>90s: Intercept</span>
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

          {/* Sequential Timeline Stepper Overview */}
          <div className="space-y-2">
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider font-mono block">
              18-Hour Multimodal Sensor Audit Trail
            </span>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
              {DEMO_STEPS.slice(0, 9).map((step, idx) => {
                const isPassed = currentSecond >= step.second;
                const isCurrent = activeStepIndex === idx;
                const Icon = step.icon;

                return (
                  <div
                    key={idx}
                    className={`p-2.5 rounded-xl border transition-all text-xs flex items-center gap-2.5 ${
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
                      <div className="font-bold text-white truncate text-[11px]">{step.title}</div>
                      <div className="text-[9px] font-mono text-slate-400 truncate">{step.second}s • {step.source}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Final Resolution Banner (Appears when simulation completes or at 85s+) */}
          {currentSecond >= 85 && (
            <div className="p-4 rounded-xl border-2 border-emerald-500 bg-gradient-to-r from-emerald-950/80 via-slate-900 to-emerald-950/80 text-center space-y-2 animate-in zoom-in-95">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 font-mono text-xs font-black border border-emerald-400/40">
                <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                <span>MULTIMODAL FUSION RESCUE RESULT</span>
              </div>
              <h4 className="text-base font-black text-white">
                AANYA&apos;S LAST DIGITAL FOOTPRINT: New Delhi Railway Station, 9:30 AM
              </h4>
              <p className="text-xs text-emerald-200/90 font-mono max-w-xl mx-auto">
                Corridor trajectory converged with 92% confidence. PCR-04 intercept unit deployed with tactical ETA of 4 minutes.
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
                  <span>Pause Demo</span>
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
              className="bg-amber-500 hover:bg-amber-600 text-black font-extrabold text-xs flex items-center gap-1.5 h-9 px-3.5 shadow-md shadow-amber-500/20"
            >
              <FileText className="h-4 w-4 text-black" />
              <span>Generate Search Dossier (Sec 63 BSA)</span>
            </Button>

            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                sound.playClickSound();
                onClose();
              }}
              className="h-9 text-xs font-bold text-slate-400 hover:text-white"
            >
              Exit Simulation
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
    </div>
  );
}
