import React, { useState, useEffect } from 'react';
import {
  Radio,
  Camera,
  GitFork,
  AlertTriangle,
  Volume2,
  VolumeX,
  Mic,
  MicOff,
  Sparkles,
  RefreshCw,
  Zap,
  ShieldAlert,
  Play,
  CheckCircle2,
  ExternalLink,
} from 'lucide-react';
import axios from 'axios';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { toast } from '../../components/ui/Toast';
import { sound } from '../../utils/soundEffects';
import { ExplainModal, ExplainData, ExplainButton } from '../../components/common/ExplainModal';

interface AnprItem {
  id: string;
  time: string;
  plate: string;
  vehicle: string;
  speed: number;
  location: string;
  flag: string;
}

interface CdrItem {
  id: string;
  time: string;
  phone: string;
  tower: string;
  azimuth: string;
  distance: number;
}

interface AlertItem {
  id: string;
  time: string;
  title: string;
  summary: string;
  confidence: number;
  hash: string;
}

interface LinkPredItem {
  id: string;
  source: string;
  target: string;
  role: string;
  confidence: number;
  adamicAdar: number;
  sharedNodes: string;
  explanation: string;
}

export function TacticalCommandHUD() {
  const [isLive, setIsLive] = useState(true);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [selectedExplain, setSelectedExplain] = useState<ExplainData | null>(null);

  // Live Stream Feed States
  const [anprFeeds, setAnprFeeds] = useState<AnprItem[]>([
    {
      id: 'ANPR-1',
      time: '11:42:04 IST',
      plate: 'TS 09 AB 1234',
      vehicle: 'Black Mahindra Scorpio',
      speed: 118,
      location: 'Yamuna Expressway KM 48 Lane 3',
      flag: 'WANTED_FIR_8812',
    },
    {
      id: 'ANPR-2',
      time: '11:38:12 IST',
      plate: 'UP 16 AX 9901',
      vehicle: 'White Hyundai Creta',
      speed: 84,
      location: 'Noida Sector 62 Electronic City',
      flag: 'CLEARED',
    },
    {
      id: 'ANPR-3',
      time: '11:34:55 IST',
      plate: 'DL 01 CA 4819',
      vehicle: 'Maruti Suzuki Dzire',
      speed: 72,
      location: 'Karol Bagh Metro Gate 2',
      flag: 'SUSPICIOUS_UNREGISTERED',
    },
  ]);

  const [cdrFeeds, setCdrFeeds] = useState<CdrItem[]>([
    {
      id: 'CDR-1',
      time: '11:42:10 IST',
      phone: '+91 98765 43210 (Burner #4)',
      tower: 'TOW-DEL-UP-SEC4B-912',
      azimuth: '142° SE Azimuth',
      distance: 240,
    },
    {
      id: 'CDR-2',
      time: '11:40:22 IST',
      phone: '+91 98111 22334 (VoIP Relay)',
      tower: 'TOW-NOIDA-SEC62-04',
      azimuth: '085° E Azimuth',
      distance: 510,
    },
    {
      id: 'CDR-3',
      time: '11:36:01 IST',
      phone: '+91 94120 89123 (Mule SIM)',
      tower: 'TOW-JEWAR-HWY-01',
      azimuth: '210° SW Azimuth',
      distance: 180,
    },
  ]);

  const [alerts, setAlerts] = useState<AlertItem[]>([
    {
      id: 'ALERT-FUSION-01',
      time: '11:42:15 IST',
      title: 'CRITICAL CONVERGENCE: ANPR + CDR + BANKING FUSED',
      summary: 'Stolen Scorpio TS 09 AB 1234 coincides with suspect phone handover within 240m and structured ATM debit.',
      confidence: 0.965,
      hash: 'SHA256:7B8C4A91E23F89',
    },
    {
      id: 'ALERT-FUSION-02',
      time: '11:32:00 IST',
      title: 'PMLA SMURFING: 14 MULE DEPOSITS UNDER ₹50,000',
      summary: 'Rapid cash structuring across 5 bank branches funneled into common kingpin account ACC-HDFC-908122.',
      confidence: 0.942,
      hash: 'SHA256:4C98B21F0A812E',
    },
  ]);

  const [linkPredictions, setLinkPredictions] = useState<LinkPredItem[]>([
    {
      id: 'LINK-1',
      source: 'Suraj Mehra (New Suspect)',
      target: 'Rajan Verma (Kingpin)',
      role: 'Direct Syndicate Associate',
      confidence: 0.94,
      adamicAdar: 3.84,
      sharedNodes: '2 Burner Phones, 1 Vehicle, 1 Bank Account',
      explanation: 'Rajan is likely linked to Suraj Mehra because they share 2 burner SIMs, 1 vehicle sighting at Yamuna Toll, and a common money-mule account.',
    },
    {
      id: 'LINK-2',
      source: 'Suraj Mehra (New Suspect)',
      target: 'Vikram Malhotra (Fleet)',
      role: 'Co-Transit Accomplice',
      confidence: 0.86,
      adamicAdar: 2.65,
      sharedNodes: 'TS 09 AB 1234, Tower Sector 4B',
      explanation: 'Co-registered in fleeing Scorpio passing Yamuna KM 48 within 4 minutes of tower handover.',
    },
  ]);

  const getBaseURL = () => import.meta.env.VITE_API_BASE_URL || '/api/v1';

  // Voice "Brief Me" Handler using SpeechSynthesis API
  const handleBriefMe = (targetSuspect: string = 'Rajan Verma') => {
    sound.playRadarPing();
    const briefingText = (
      `Intelligence Briefing for Investigating Officer. Target Subject: ${targetSuspect}. ` +
      `Executive Summary: Rajan Verma is evaluated as Critical Risk with 94% confidence. ` +
      `Top Contributing Factors: 14 structured smurfing deposits below 50,000 rupees, ` +
      `active co-location with fleeing Mahindra Scorpio TS 09 AB 1234, and direct control over 4 burner SIMs. ` +
      `Link Prediction Engine identifies 3 unobserved syndicate conduits with Adamic-Adar score of 3.84. ` +
      `Immediate action recommended: Section 102 CrPC bank freeze and Section 35 BNSS intercept dispatch.`
    );

    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(briefingText);
      utterance.rate = 1.05;
      utterance.pitch = 1.0;
      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);
      window.speechSynthesis.speak(utterance);
      toast.info(`Voice Briefing: Speaking tactical intelligence summary for ${targetSuspect}...`, 'Voice Briefing Active');
    } else {
      toast.info(briefingText, 'Tactical Intelligence Briefing');
    }
  };

  const handleStopSpeaking = () => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      toast.info('Voice briefing halted.', 'Speech Stopped');
    }
  };

  // Voice Speech Recognition listener for "Brief me"
  const toggleVoiceListener = () => {
    if (typeof window === 'undefined') return;
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      toast.warning('Web Speech Recognition API not supported in this browser. Use the Brief Me button.', 'Voice Command');
      handleBriefMe('Rajan Verma');
      return;
    }

    if (isListening) {
      setIsListening(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = 'en-IN';
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        setIsListening(true);
        toast.info('Listening... Say "Brief me on Rajan" or "Brief me on Vikram"', 'Voice Recognition Active');
      };

      recognition.onresult = (event: any) => {
        const spoken = event.results[0][0].transcript.toLowerCase();
        setIsListening(false);
        if (spoken.includes('rajan')) {
          handleBriefMe('Rajan Verma');
        } else if (spoken.includes('vikram')) {
          handleBriefMe('Vikram Malhotra');
        } else {
          handleBriefMe('Rajan Verma');
        }
      };

      recognition.onerror = () => {
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.start();
    } catch {
      setIsListening(false);
      handleBriefMe('Rajan Verma');
    }
  };

  // Trigger Real-Time Fusion Corridor Simulation
  const handleTriggerFusionConvergence = async () => {
    sound.playAlertBeep();
    toast.info('Synthesizing ANPR, CDR tower, and core banking packet streams...', 'Fusion Triggered');
    try {
      const res = await axios.get(`${getBaseURL()}/fusion/corridor-event`);
      const event = res.data;
      sound.playSuccessChime();
      toast.success(
        `Corridor Convergence Verified: ${event.tactical_synthesis}`,
        'Section 63 BSA Fused Event'
      );
      // Append new alert
      setAlerts((prev) => [
        {
          id: `FUSION-${Date.now().toString().slice(-4)}`,
          time: new Date().toLocaleTimeString('en-IN'),
          title: `LIVE CONVERGENCE: ${event.implicated_subject}`,
          summary: event.tactical_synthesis,
          confidence: event.correlation_confidence,
          hash: event.statutory_compliance?.merkle_leaf_hash || 'SHA256:VERIFIED',
        },
        ...prev,
      ]);
    } catch {
      sound.playSuccessChime();
      toast.success(
        'Simulated Corridor Event: ANPR plate TS 09 AB 1234 correlated with tower Sector 4B & Bank Account #908122.',
        'Spatio-Temporal Fusion Complete'
      );
    }
  };

  return (
    <>
      <Card className="border border-primary/40 bg-slate-950/95 shadow-2xl overflow-hidden space-y-0">
        {/* Top Command Header */}
        <CardHeader className="p-4 border-b border-border/80 bg-gradient-to-r from-slate-950 via-slate-900 to-primary/10 flex flex-col xl:flex-row xl:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0 flex-1">
            <div className="p-2 rounded-xl bg-primary/20 border border-primary/40 text-primary shrink-0">
              <Zap className="h-5 w-5 animate-pulse" />
            </div>
            <div className="min-w-0 flex-1">
              <CardTitle className="text-base font-black text-foreground flex items-center gap-2 flex-wrap">
                <span>Tactical Multi-Stream Command HUD</span>
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                </span>
                <Badge variant="outline" className="text-[10px] bg-emerald-950/40 text-emerald-300 border-emerald-500/40">
                  REAL-TIME FUSION ACTIVE
                </Badge>
              </CardTitle>
              <p className="text-[11px] text-muted-foreground truncate">
                Synchronized ANPR Optical Scans, Multi-Carrier Telecom CDRs, and Core Banking Stream
              </p>
            </div>
          </div>

          {/* Action Toolbar */}
          <div className="flex items-center gap-2 flex-wrap shrink-0">
            <Button
              size="sm"
              variant="outline"
              onClick={handleTriggerFusionConvergence}
              className="border-cyan-500/50 text-cyan-300 hover:bg-cyan-950/40 text-xs font-bold flex items-center gap-1.5 shadow-sm"
              title="Simulate real-time convergence of vehicle, phone tower, and banking hit"
            >
              <RefreshCw className="h-3.5 w-3.5 text-cyan-400" />
              <span>Simulate Stream Convergence</span>
            </Button>

            {isSpeaking ? (
              <Button
                size="sm"
                variant="outline"
                onClick={handleStopSpeaking}
                className="border-red-500/50 text-red-300 bg-red-950/30 hover:bg-red-900/50 text-xs font-bold flex items-center gap-1.5"
                title="Stop Voice Briefing"
              >
                <VolumeX className="h-4 w-4 text-red-400" />
                <span>Mute Briefing</span>
              </Button>
            ) : (
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleBriefMe('Rajan Verma')}
                className="border-purple-500/50 text-purple-300 hover:bg-purple-950/40 text-xs font-bold flex items-center gap-1.5 shadow-sm"
                title="Read out loud tactical XAI intelligence summary"
              >
                <Volume2 className="h-4 w-4 text-purple-400" />
                <span>Brief Me</span>
              </Button>
            )}

            <Button
              size="sm"
              variant="outline"
              onClick={toggleVoiceListener}
              className={`text-xs font-bold flex items-center gap-1.5 border transition-all ${
                isListening
                  ? 'border-red-500 bg-red-600 text-white animate-pulse'
                  : 'border-slate-700 text-slate-300 hover:text-white'
              }`}
              title="Voice-Activated 'Brief Me on [Suspect]'"
            >
              {isListening ? <Mic className="h-4 w-4" /> : <MicOff className="h-4 w-4 text-slate-400" />}
              <span>{isListening ? 'Listening...' : 'Voice Command'}</span>
            </Button>
          </div>
        </CardHeader>

        {/* 4 Concurrent Live Feeds Grid */}
        <CardContent className="p-4 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 bg-slate-950/50">
          {/* Feed 1: Optical ANPR Stream */}
          <div className="rounded-xl border border-border/80 bg-slate-900/60 p-3 space-y-2 flex flex-col h-[280px]">
            <div className="flex items-center justify-between pb-2 border-b border-border/60">
              <span className="font-extrabold text-xs text-amber-400 flex items-center gap-1.5 uppercase tracking-wide">
                <Camera className="h-3.5 w-3.5" />
                1. Highway ANPR Feed
              </span>
              <span className="text-[10px] font-mono text-emerald-400 font-bold">118 km/h</span>
            </div>
            <div className="flex-1 overflow-y-auto space-y-2 scrollbar-thin pr-1">
              {anprFeeds.map((item) => (
                <div
                  key={item.id}
                  className={`p-2 rounded-lg border text-xs space-y-1 ${
                    item.flag === 'WANTED_FIR_8812'
                      ? 'border-red-500/50 bg-red-950/20'
                      : 'border-slate-800 bg-slate-950/60'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-black text-amber-300 text-[11px]">{item.plate}</span>
                    <span className="text-[9px] font-mono text-slate-400">{item.time}</span>
                  </div>
                  <p className="text-[10px] text-slate-300 truncate">{item.vehicle}</p>
                  <div className="flex items-center justify-between text-[9px] text-slate-400 pt-0.5">
                    <span>{item.location}</span>
                    {item.flag === 'WANTED_FIR_8812' && (
                      <span className="px-1.5 py-0.2 rounded bg-red-600 text-white font-bold text-[8px]">
                        HOT HIT
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Feed 2: Telecom CDR Pings */}
          <div className="rounded-xl border border-border/80 bg-slate-900/60 p-3 space-y-2 flex flex-col h-[280px]">
            <div className="flex items-center justify-between pb-2 border-b border-border/60">
              <span className="font-extrabold text-xs text-sky-400 flex items-center gap-1.5 uppercase tracking-wide">
                <Radio className="h-3.5 w-3.5" />
                2. Telecom CDR Azimuth
              </span>
              <span className="text-[10px] font-mono text-sky-400 font-bold">Δ 240m</span>
            </div>
            <div className="flex-1 overflow-y-auto space-y-2 scrollbar-thin pr-1">
              {cdrFeeds.map((item) => (
                <div key={item.id} className="p-2 rounded-lg border border-slate-800 bg-slate-950/60 text-xs space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-sky-300 text-[10px] truncate">{item.phone}</span>
                    <span className="text-[9px] font-mono text-slate-400 shrink-0">{item.time}</span>
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-slate-300">
                    <span>{item.tower}</span>
                    <span className="font-mono text-emerald-400 text-[9px]">Handover</span>
                  </div>
                  <div className="flex items-center justify-between text-[9px] text-slate-400">
                    <span>{item.azimuth}</span>
                    <span className="font-mono text-amber-300">Prox: {item.distance}m</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Feed 3: High-Priority Spatio-Temporal Fusion Alerts */}
          <div className="rounded-xl border border-border/80 bg-slate-900/60 p-3 space-y-2 flex flex-col h-[280px]">
            <div className="flex items-center justify-between pb-2 border-b border-border/60">
              <span className="font-extrabold text-xs text-red-400 flex items-center gap-1.5 uppercase tracking-wide">
                <AlertTriangle className="h-3.5 w-3.5" />
                3. High-Priority Fused Alerts
              </span>
              <span className="text-[10px] font-mono text-red-400 font-bold">{alerts.length} Active</span>
            </div>
            <div className="flex-1 overflow-y-auto space-y-2 scrollbar-thin pr-1">
              {alerts.map((item) => (
                <div key={item.id} className="p-2.5 rounded-lg border border-red-500/40 bg-red-950/20 text-xs space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-red-300 text-[10.5px] truncate">{item.title}</span>
                    <span className="text-[9px] font-mono text-slate-400 shrink-0">{item.time}</span>
                  </div>
                  <p className="text-[10px] text-slate-200 leading-snug line-clamp-2">{item.summary}</p>
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-[9px] font-mono text-emerald-400">
                      Conf: {(item.confidence * 100).toFixed(1)}%
                    </span>
                    <ExplainButton
                      onClick={() =>
                        setSelectedExplain({
                          title: item.title,
                          category: 'RISK_SCORE',
                          subjectName: 'TS 09 AB 1234 + Burner Corridor',
                          confidenceScore: item.confidence,
                          plainEnglishSummary: item.summary,
                          contributingFeatures: [
                            { name: 'ANPR License Optical Identification', impact: 0.52, description: 'High-speed getaway' },
                            { name: 'Cell Tower Azimuth Handover', impact: 0.34, description: 'Co-located mobile burner' },
                            { name: 'Core Banking Cash Exit Spike', impact: 0.14, description: 'Highway ATM withdrawal' },
                          ],
                          statutoryBasis: 'Section 63(4) BSA Court Admissibility',
                          courtAdmissibilityHash: item.hash,
                        })
                      }
                      label="Explain"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Feed 4: Explainable Link Prediction Suggestions (Adamic-Adar / HDM-GNN) */}
          <div className="rounded-xl border border-border/80 bg-slate-900/60 p-3 space-y-2 flex flex-col h-[280px]">
            <div className="flex items-center justify-between pb-2 border-b border-border/60">
              <span className="font-extrabold text-xs text-purple-400 flex items-center gap-1.5 uppercase tracking-wide">
                <GitFork className="h-3.5 w-3.5" />
                4. Link Predictions (HDM-GNN)
              </span>
              <span className="text-[10px] font-mono text-purple-300 font-bold">Adamic-Adar</span>
            </div>
            <div className="flex-1 overflow-y-auto space-y-2 scrollbar-thin pr-1">
              {linkPredictions.map((item) => (
                <div key={item.id} className="p-2 rounded-lg border border-purple-500/40 bg-purple-950/20 text-xs space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-purple-200 text-[10.5px] truncate">{item.target}</span>
                    <Badge variant="outline" className="text-[8px] bg-purple-950 text-purple-300 border-purple-400/40">
                      AA: {item.adamicAdar}
                    </Badge>
                  </div>
                  <p className="text-[10px] text-slate-300 truncate">{item.role}</p>
                  <p className="text-[9px] text-slate-400 truncate">Shared: {item.sharedNodes}</p>
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-[9px] font-mono text-emerald-400">
                      Prob: {(item.confidence * 100).toFixed(0)}%
                    </span>
                    <ExplainButton
                      onClick={() =>
                        setSelectedExplain({
                          title: `Link Prediction: ${item.source} ➔ ${item.target}`,
                          category: 'LINK_PREDICTION',
                          subjectName: item.target,
                          confidenceScore: item.confidence,
                          plainEnglishSummary: item.explanation,
                          contributingFeatures: [
                            { name: 'Common Burner SIM Telephony Neighbors', impact: 0.44, description: 'Shared phone graphs' },
                            { name: 'Co-Located Vehicle Sighting', impact: 0.36, description: 'Yamuna KM 48 pass' },
                            { name: 'Common Mule Bank Destination', impact: 0.20, description: 'Account #908122' },
                          ],
                          statutoryBasis: 'Section 111 BNS (Organized Syndicate Member Attribution)',
                          courtAdmissibilityHash: `SHA256:LINK-PRED-${item.id}-BSA`,
                        })
                      }
                      label="Explain Link"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <ExplainModal
        isOpen={Boolean(selectedExplain)}
        onClose={() => setSelectedExplain(null)}
        data={selectedExplain}
      />
    </>
  );
}
