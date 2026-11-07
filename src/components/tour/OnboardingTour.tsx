import React, { useState, useEffect, useCallback } from 'react';
import ReactDOM from 'react-dom';
import {
  ChevronRight,
  ChevronLeft,
  X,
  Compass,
  CheckCircle2,
  Zap,
} from 'lucide-react';
import { Button } from '../ui/Button';
import { useAppStore } from '../../stores/appStore';
import { sound } from '../../utils/soundEffects';

export interface TourStep {
  targetId: string;
  title: string;
  policeRole: string;
  description: string;
  workloadReduction: string;
  position?: 'top' | 'bottom' | 'left' | 'right' | 'center';
}

const TOUR_STEPS: TourStep[] = [
  {
    targetId: 'sidebar-dashboard',
    title: 'Operational Command Center',
    policeRole: 'Incident Command & Synthesis',
    description:
      'Provides a bird’s-eye view of active syndicates, recent FIRs, critical financial tripwires, and statutory freeze controls.',
    workloadReduction:
      'Aggregates multi-station alerts in one real-time dashboard without manual phone calls.',
    position: 'right',
  },
  {
    targetId: 'sidebar-graph',
    title: 'Interactive Crime Network Graph',
    policeRole: 'Syndicate Topology & Link Analysis',
    description:
      'Instantly visualize multi-hop relationships between kingpins, hawala operators, burner phones, and getaway vehicles. Click any node to expand hidden co-conspirators.',
    workloadReduction:
      'Eliminates manual pin-and-thread crime mapping boards. Uncovers hidden ringleaders in seconds.',
    position: 'right',
  },
  {
    targetId: 'sidebar-cases',
    title: 'Case Directory & Evidence Linkage',
    policeRole: 'Investigation Lifecycle & FIR Ingestion',
    description:
      'Manage open, under-investigation, and chargesheeted cases with deep links to seized assets, suspects, and electronic records.',
    workloadReduction:
      'Eliminates paper file tracking across station jurisdictions.',
    position: 'right',
  },
  {
    targetId: 'sidebar-evidence',
    title: 'Cryptographic Evidence Vault',
    policeRole: 'Forensic Integrity & Chain of Custody',
    description:
      'Direct binary drag-and-drop upload for CCTV videos, CDR dumps, and bank statements with automated client-side WebCrypto SHA-256 verification.',
    workloadReduction:
      'Secures Sec 63 BSA compliance automatically before presenting evidence to magistrates.',
    position: 'right',
  },
  {
    targetId: 'sidebar-most-wanted',
    title: 'District "Most Wanted" Watchlist',
    policeRole: 'Tactical Interception & LOC Tracking',
    description:
      'Ranks district fugitives and kingpins by AI risk score (> 80%). Displays active Non-Bailable Warrants, vehicle ANPR sightings, and allows instant Lookout Circular (LOC) notices.',
    workloadReduction:
      'Provides field officers with instant tactical threat briefing at borders and toll checkpoints.',
    position: 'right',
  },
];

interface OnboardingTourProps {
  isOpen: boolean;
  onClose: () => void;
}

export function OnboardingTour({ isOpen, onClose }: OnboardingTourProps) {
  const [currentStepIdx, setCurrentStepIdx] = useState(0);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const { theme } = useAppStore();
  const isLight = theme === 'light';

  const step = TOUR_STEPS[currentStepIdx];

  const clearTargetHighlights = useCallback(() => {
    if (typeof document !== 'undefined') {
      document.querySelectorAll('.tour-highlighted-element').forEach((el) => {
        el.classList.remove('tour-highlighted-element');
      });
    }
  }, []);

  const updateTargetPosition = useCallback(() => {
    try {
      clearTargetHighlights();

      if (!step) {
        setTargetRect(null);
        return;
      }
      if (step.targetId.startsWith('sidebar-')) {
        useAppStore.getState().setSidebarOpen(true);
      }
      const el = document.getElementById(step.targetId) || document.querySelector(`[data-tour="${step.targetId}"]`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        const rect = el.getBoundingClientRect();
        if (rect.width > 10 && rect.height > 10) {
          el.classList.add('tour-highlighted-element');
          setTargetRect(rect);
          return;
        }
      }
      setTargetRect(null);
    } catch {
      setTargetRect(null);
    }
  }, [step, clearTargetHighlights]);

  useEffect(() => {
    if (isOpen) {
      updateTargetPosition();
      const handleResize = () => updateTargetPosition();
      window.addEventListener('resize', handleResize);
      window.addEventListener('scroll', handleResize, true);
      return () => {
        window.removeEventListener('resize', handleResize);
        window.removeEventListener('scroll', handleResize, true);
        clearTargetHighlights();
      };
    } else {
      clearTargetHighlights();
    }
  }, [isOpen, currentStepIdx, updateTargetPosition, clearTargetHighlights]);

  const handleComplete = useCallback(() => {
    clearTargetHighlights();
    localStorage.setItem('crimenexus_tour_seen', 'true');
    onClose();
  }, [clearTargetHighlights, onClose]);

  const handleNext = useCallback(() => {
    clearTargetHighlights();
    if (currentStepIdx < TOUR_STEPS.length - 1) {
      setCurrentStepIdx((prev) => prev + 1);
    } else {
      handleComplete();
    }
  }, [currentStepIdx, handleComplete, clearTargetHighlights]);

  const handlePrev = useCallback(() => {
    clearTargetHighlights();
    if (currentStepIdx > 0) {
      setCurrentStepIdx((prev) => prev - 1);
    }
  }, [currentStepIdx, clearTargetHighlights]);

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleComplete();
      } else if (e.key === 'ArrowRight') {
        handleNext();
      } else if (e.key === 'ArrowLeft') {
        handlePrev();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, handleComplete, handleNext, handlePrev]);

  const dialogStyle = React.useMemo<React.CSSProperties>(() => {
    if (!targetRect || typeof window === 'undefined') {
      return {
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
      };
    }
    // If target is in the sidebar (left side of screen)
    if (targetRect.left < 360) {
      const topPos = Math.max(24, Math.min(window.innerHeight - 480, targetRect.top - 20));
      const leftPos = Math.min(window.innerWidth - 540, targetRect.right + 28);
      return {
        top: `${topPos}px`,
        left: `${leftPos}px`,
      };
    }
    return {
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
    };
  }, [targetRect]);

  if (!isOpen) return null;

  const tourContent = (
    <div
      className="fixed inset-0 z-[9999] overflow-hidden select-none"
      role="dialog"
      aria-modal="true"
      aria-label="Investigating Officer Onboarding Tour"
    >
      {/* SVG Spotlight Cutout Mask - Leaves target element crystal clear without dark blur */}
      <svg
        className="fixed inset-0 w-full h-full pointer-events-auto"
        onClick={handleComplete}
        style={{ width: '100vw', height: '100vh' }}
      >
        <defs>
          <mask id="tour-spotlight-mask">
            <rect x="0" y="0" width="100%" height="100%" fill="white" />
            {targetRect && (
              <rect
                x={targetRect.left - 6}
                y={targetRect.top - 6}
                width={targetRect.width + 12}
                height={targetRect.height + 12}
                rx="10"
                ry="10"
                fill="black"
              />
            )}
          </mask>
        </defs>
        <rect
          x="0"
          y="0"
          width="100%"
          height="100%"
          fill={isLight ? 'rgba(15, 23, 42, 0.55)' : 'rgba(3, 7, 18, 0.8)'}
          mask="url(#tour-spotlight-mask)"
        />
      </svg>

      {/* Target Element Highlight Box with Glowing Perimeter */}
      {targetRect && targetRect.width > 10 && targetRect.height > 10 && (
        <div
          className="absolute border-2 border-primary rounded-xl pointer-events-none transition-all duration-300 shadow-[0_0_35px_rgba(59,130,246,0.85)] z-[10002]"
          style={{
            top: targetRect.top - 6,
            left: targetRect.left - 6,
            width: targetRect.width + 12,
            height: targetRect.height + 12,
          }}
        >
          <div className="absolute -top-3.5 left-3 bg-primary text-primary-foreground text-[10px] font-black px-2.5 py-0.5 rounded-full shadow-lg uppercase tracking-wider flex items-center gap-1.5 whitespace-nowrap">
            <span className="h-1.5 w-1.5 rounded-full bg-primary-foreground animate-ping" />
            ACTIVE STEP {currentStepIdx + 1}: {step.title}
          </div>
        </div>
      )}

      {/* Tour Dialog Card with Smart Viewport Positioning */}
      <div
        className="absolute z-[10003] pointer-events-none transition-all duration-300"
        style={dialogStyle}
      >
        <div className="relative w-full max-w-lg bg-card/95 text-card-foreground border-2 border-primary/70 rounded-2xl shadow-2xl p-6 pointer-events-auto backdrop-blur-xl animate-in fade-in zoom-in-95 duration-200">
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-border/70">
            <div className="flex items-center gap-2 text-primary font-bold text-sm tracking-wide">
              <Compass className="h-5 w-5 animate-spin" style={{ animationDuration: '6s' }} />
              <span>INVESTIGATING OFFICER (IO) ONBOARDING TOUR</span>
            </div>
            <button
              onClick={handleComplete}
              className="text-muted-foreground hover:text-foreground p-1 rounded-md hover:bg-accent transition-colors"
              title="Close Tour (Esc)"
              aria-label="Close Tour"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Step Meta */}
          <div className="mt-4 flex items-center justify-between">
            <span className="text-[11px] font-mono font-bold text-primary px-2 py-0.5 rounded bg-primary/10 border border-primary/30 uppercase tracking-wider">
              Step {currentStepIdx + 1} of {TOUR_STEPS.length}
            </span>
            <span className="text-[11px] text-muted-foreground font-semibold flex items-center gap-1">
              <Zap className="h-3 w-3 text-primary" />
              {step.policeRole}
            </span>
          </div>

          {/* Title & Description */}
          <div className="mt-3 space-y-2">
            <h3 className="text-lg font-extrabold text-foreground tracking-tight flex items-center gap-2">
              {step.title}
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {step.description}
            </p>
          </div>

          {/* Workload Reduction Alert - Universal Multi-Theme Contrast */}
          <div className="mt-4 p-3 rounded-xl border border-primary/30 bg-primary/10 text-foreground text-xs flex items-start gap-2.5">
            <CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-foreground">Police Workload Reduction: </span>
              <span className="text-muted-foreground">{step.workloadReduction}</span>
            </div>
          </div>

          {/* Step Progress Dots & Navigation Buttons */}
          <div className="mt-6 flex items-center justify-between pt-3 border-t border-border/60">
            {/* Dots */}
            <div className="flex items-center gap-1.5">
              {TOUR_STEPS.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentStepIdx(idx)}
                  className={`h-2 rounded-full transition-all ${
                    idx === currentStepIdx
                      ? 'w-6 bg-primary shadow-glow'
                      : 'w-2 bg-muted hover:bg-muted-foreground'
                  }`}
                  title={`Go to step ${idx + 1}`}
                  aria-label={`Go to step ${idx + 1}`}
                />
              ))}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleComplete}
                className="text-xs text-muted-foreground hover:text-foreground"
              >
                Skip Tour
              </Button>

              {currentStepIdx > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handlePrev}
                  className="text-xs flex items-center gap-1"
                >
                  <ChevronLeft className="h-3.5 w-3.5" />
                  Prev
                </Button>
              )}

              <Button
                size="sm"
                onClick={handleNext}
                className="text-xs font-bold flex items-center gap-1 shadow-md shadow-primary/20"
              >
                {currentStepIdx === TOUR_STEPS.length - 1 ? (
                  <>
                    <span>Finish Tour</span>
                    <CheckCircle2 className="h-3.5 w-3.5" />
                  </>
                ) : (
                  <>
                    <span>Next</span>
                    <ChevronRight className="h-3.5 w-3.5" />
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return typeof document !== 'undefined'
    ? ReactDOM.createPortal(tourContent, document.body)
    : tourContent;
}
