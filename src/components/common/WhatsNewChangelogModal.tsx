import React, { useState, useEffect } from 'react';
import { Sparkles, CheckCircle2, X, Radio, Cpu, Scale, ArrowRight } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { sound } from '../../utils/soundEffects';

interface WhatsNewChangelogModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function WhatsNewChangelogModal({ isOpen, onClose }: WhatsNewChangelogModalProps) {
  const newFeatures = [
    {
      title: 'Voice-Activated "Brief Me" & Audio Intelligence',
      badge: 'AUDIO AI',
      color: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40',
      description: 'Hands-free voice briefing using browser Web Speech synthesis. Officers can hear a tactical audio brief of kingpin networks and telemetry by clicking "Voice Briefing".',
    },
    {
      title: 'Quantum-Ready Intercept Router (Qiskit Aer Simulator)',
      badge: 'QUANTUM QAOA',
      color: 'bg-purple-500/20 text-purple-300 border-purple-500/40',
      description: 'Solves Vehicle Routing Intercept Problems (VRP) across patrol vehicles and suspect getaways on a simulated gate-based quantum processor with classical OSRM fallback.',
    },
    {
      title: 'Spatio-Temporal ANPR, CDR & Banking Fusion Engine',
      badge: 'TRI-STREAM FUSION',
      color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
      description: 'Correlates optical highway ANPR plate scans, telecom CDR cell tower handovers, and banking transactions into a single court-admissible Corridor Event.',
    },
    {
      title: 'Bias-Aware Article 14 Fairness & Equity Guardrails',
      badge: 'ETHICAL AI',
      color: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
      description: 'Real-time Disparate Impact Ratio (DIR) auditing and 85% confirmation bias dampening preventing algorithmic feedback loops and demographic skew.',
    },
    {
      title: 'Universal "Explain This" Court-Ready Cards',
      badge: 'SECTION 63 BSA',
      color: 'bg-blue-500/20 text-blue-300 border-blue-500/40',
      description: 'TreeSHAP mathematical feature attribution with plain-English summaries and SHA-256 cryptographic hashes for admissibility before Magistrate courts.',
    },
  ];

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg" title="What's New in CRIMENEXUS v2.4">
      <div className="space-y-5">
        <div className="p-4 rounded-xl border border-primary/30 bg-primary/10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/20 text-primary">
              <Sparkles className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                CRIMENEXUS v2.4 Release Notes
                <Badge className="bg-primary text-white text-[10px]">LATEST BUILD</Badge>
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Certified under Bharatiya Sakshya Adhiniyam, 2023 & Section 173 BNSS.
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          {newFeatures.map((feat, i) => (
            <div
              key={i}
              className="p-3.5 rounded-xl border border-border/70 bg-card/70 space-y-1.5 hover:border-border transition-colors"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-foreground flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                  {feat.title}
                </span>
                <Badge className={`text-[9px] ${feat.color}`}>{feat.badge}</Badge>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed pl-6">
                {feat.description}
              </p>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between pt-3 border-t border-border">
          <span className="text-[11px] font-mono text-muted-foreground">
            Build Hash: 9b4e7a2b91c0e3957fba3082 • Sec 63 BSA Grounded
          </span>
          <Button size="sm" onClick={onClose} className="bg-primary text-white font-bold">
            Got It
          </Button>
        </div>
      </div>
    </Modal>
  );
}
