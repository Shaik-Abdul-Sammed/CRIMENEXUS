import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  Scale,
  ShieldCheck,
  AlertTriangle,
  FileText,
  CheckCircle2,
  XCircle,
  HelpCircle,
  ChevronRight,
  X,
  Lock,
  Clock,
  Sparkles,
  Search,
  BookOpen
} from 'lucide-react';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Card, CardContent } from '../ui/Card';
import { STATUTORY_RULES, StatutoryRule, validateCaseCompliance } from '../../utils/statutoryRules';
import { sound } from '../../utils/soundEffects';

interface StatutoryRulesModalProps {
  isOpen: boolean;
  onClose: () => void;
  caseContext?: Record<string, any>;
}

export const StatutoryRulesModal: React.FC<StatutoryRulesModalProps> = ({
  isOpen,
  onClose,
  caseContext = {}
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedRule, setSelectedRule] = useState<StatutoryRule>(STATUTORY_RULES[0]);

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

  // Run real-time compliance validation
  const compliance = validateCaseCompliance({
    custodyDurationHours: 18.5,
    hasMagistrateRemand: false,
    evidenceHash: '7f83b1657ff1fc53b9275bf9754168e3314051a89c31be4d8f57f4955b939103',
    custodyHistory: ['Seized at KM 48 Toll', 'Logged at Sector 20 PS Malkhana'],
    transactionAmount: 48500,
    isStructuredMule: true,
    age: 34,
    isMasked: false,
    isNightTime: false,
    isDeviceEvidence: true,
    isFaradayIsolated: true,
    isWriteBlocked: true,
    isCdrEvidence: true,
    hasSpAuthorization: true,
    investigationDays: 24,
    hasChargeSheetFiled: false,
    isHeinousOffense: true,
    ...caseContext
  });

  const filteredRules = STATUTORY_RULES.filter((rule) => {
    const matchesCategory = selectedCategory === 'ALL' || rule.category === selectedCategory;
    const matchesSearch =
      rule.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      rule.statutoryReference.toLowerCase().includes(searchQuery.toLowerCase()) ||
      rule.mandatoryRequirement.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const modalContent = (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="statutory-rules-modal-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          sound.playClickSound();
          onClose();
        }
      }}
    >
      <div className="relative w-full max-w-5xl rounded-2xl bg-slate-900 border border-slate-700 shadow-2xl flex flex-col max-h-[88vh] my-auto overflow-hidden">
        {/* Header */}
        <div className="shrink-0 flex items-center justify-between p-4 sm:p-5 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
              <Scale className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 id="statutory-rules-modal-title" className="text-lg font-black text-white">
                  15 Sovereign Statutory Criminal Rules & Judicial Safeguards
                </h2>
                <Badge variant="outline" className="border-amber-500/50 text-amber-400 text-[10px] font-mono">
                  BNS • BNSS • BSA 2023
                </Badge>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Constitutional remand limits, digital evidence admissibility standards, and mandatory police duties.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Real-Time Compliance Score Pill */}
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-800/80 border border-slate-700">
              <ShieldCheck className="h-4 w-4 text-emerald-400" />
              <div className="text-right">
                <span className="text-[10px] text-slate-400 uppercase font-bold block leading-none">
                  Compliance Score
                </span>
                <span className="text-xs font-mono font-black text-emerald-400">
                  {compliance.complianceScore}% Passed ({compliance.passed.length}/15)
                </span>
              </div>
            </div>

            <button
              onClick={() => {
                sound.playClickSound();
                onClose();
              }}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              aria-label="Close Statutory Rules Modal"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="p-4 border-b border-slate-800/80 bg-slate-950/30 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full">
            {['ALL', 'CONSTITUTIONAL', 'EVIDENCE_BSA', 'PROCEDURAL_BNSS', 'FINANCIAL_AML', 'HUMAN_RIGHTS'].map(
              (cat) => (
                <button
                  key={cat}
                  onClick={() => {
                    sound.playClickSound();
                    setSelectedCategory(cat);
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                    selectedCategory === cat
                      ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                      : 'bg-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-700/60'
                  }`}
                >
                  {cat.replace('_', ' ')}
                </button>
              )
            )}
          </div>

          <div className="relative min-w-[220px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search sections, rules, crimes..."
              className="w-full bg-slate-950 border border-slate-700/80 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                aria-label="Clear search"
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </div>
        </div>

        {/* Modal Body: Two-Pane Rule Browser */}
        <div className="grid grid-cols-1 md:grid-cols-12 flex-1 overflow-hidden divide-y md:divide-y-0 md:divide-x divide-slate-800">
          {/* Left Column: Rule List (5 cols) */}
          <div className="md:col-span-5 overflow-y-auto max-h-[50vh] md:max-h-[62vh] p-3 space-y-2">
            {filteredRules.length === 0 ? (
              <div className="text-center py-12 text-slate-500 text-xs">
                No statutory rules match your query.
              </div>
            ) : (
              filteredRules.map((rule) => {
                const isSelected = selectedRule.id === rule.id;
                const isFailed = compliance.failed.some((f) => f.rule.id === rule.id);
                return (
                  <button
                    key={rule.id}
                    onClick={() => {
                      sound.playClickSound();
                      setSelectedRule(rule);
                    }}
                    className={`w-full text-left p-3 rounded-xl border transition-all flex items-start gap-3 ${
                      isSelected
                        ? 'bg-amber-500/10 border-amber-500/60 shadow-md ring-1 ring-amber-500/40'
                        : 'bg-slate-950/40 border-slate-800/80 hover:bg-slate-800/40'
                    }`}
                  >
                    <div className="mt-0.5">
                      {isFailed ? (
                        <AlertTriangle className="h-4 w-4 text-rose-400 shrink-0" />
                      ) : (
                        <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1 mb-0.5">
                        <span className="text-[10px] font-mono font-bold text-amber-400">
                          RULE #{rule.ruleNumber}
                        </span>
                        <Badge
                          variant="outline"
                          className={`text-[9px] px-1 py-0 ${
                            rule.severity === 'CRITICAL'
                              ? 'border-rose-500/50 text-rose-400'
                              : 'border-amber-500/50 text-amber-400'
                          }`}
                        >
                          {rule.severity}
                        </Badge>
                      </div>
                      <div className="text-xs font-bold text-white truncate">{rule.title}</div>
                      <div className="text-[11px] text-slate-400 truncate mt-0.5 font-mono">
                        {rule.statutoryReference}
                      </div>
                    </div>
                    <ChevronRight
                      className={`h-4 w-4 mt-2 transition-transform shrink-0 ${
                        isSelected ? 'text-amber-400 translate-x-0.5' : 'text-slate-600'
                      }`}
                    />
                  </button>
                );
              })
            )}
          </div>

          {/* Right Column: Detailed Rule Specification & Validation Check (7 cols) */}
          <div className="md:col-span-7 overflow-y-auto max-h-[50vh] md:max-h-[62vh] p-5 space-y-5 bg-slate-950/30">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/40 font-mono text-xs font-bold">
                  RULE #{selectedRule.ruleNumber} OF 15
                </span>
                <Badge variant="outline" className="text-slate-300 border-slate-700 text-[10px]">
                  {selectedRule.category.replace('_', ' ')}
                </Badge>
              </div>

              <h3 className="text-lg font-black text-white">{selectedRule.title}</h3>

              <div className="flex items-center gap-1.5 text-xs text-amber-300 font-mono bg-amber-950/30 border border-amber-900/50 p-2.5 rounded-xl">
                <BookOpen className="h-4 w-4 shrink-0 text-amber-400" />
                <span className="font-semibold">{selectedRule.statutoryReference}</span>
              </div>
            </div>

            {/* Mandatory Legal Requirement */}
            <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-1.5">
              <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400 block flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4" />
                Mandatory Statutory Requirement:
              </span>
              <p className="text-xs text-slate-200 leading-relaxed font-sans">
                {selectedRule.mandatoryRequirement}
              </p>
            </div>

            {/* Judicial & Trial Consequences */}
            <div className="p-4 rounded-xl bg-rose-950/30 border border-rose-900/50 space-y-1.5">
              <span className="text-[11px] font-bold uppercase tracking-wider text-rose-400 block flex items-center gap-1.5">
                <AlertTriangle className="h-4 w-4" />
                Trial Court Consequences of Non-Compliance:
              </span>
              <p className="text-xs text-rose-200/90 leading-relaxed font-sans">
                {selectedRule.nonComplianceConsequence}
              </p>
            </div>

            {/* Active Case Ground Truth Validation */}
            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                Automated System Check Status on Active Case:
              </span>
              {compliance.failed.some((f) => f.rule.id === selectedRule.id) ? (
                <div className="flex items-start gap-2.5 p-3 rounded-lg bg-rose-900/30 border border-rose-700/50 text-xs text-rose-300">
                  <XCircle className="h-4 w-4 shrink-0 text-rose-400 mt-0.5" />
                  <div>
                    <span className="font-bold block">NON-COMPLIANCE DETECTED</span>
                    <span className="text-[11px] text-rose-200">
                      {
                        compliance.failed.find((f) => f.rule.id === selectedRule.id)?.warning
                      }
                    </span>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2.5 p-3 rounded-lg bg-emerald-900/20 border border-emerald-700/40 text-xs text-emerald-300">
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
                  <span className="font-semibold">
                    COMPLIANT: Current investigation parameters meet all statutory safeguards.
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between">
          <span className="text-[11px] text-slate-500 font-mono hidden sm:inline">
            Statutory Framework: BNS 2023, BNSS 2023, BSA 2023, JJ Act 2015, PMLA 2002
          </span>
          <div className="flex items-center gap-2 ml-auto">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                sound.playClickSound();
                onClose();
              }}
              className="border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white"
            >
              <X className="h-3.5 w-3.5 mr-1" />
              Close
            </Button>
            <Button
              size="sm"
              onClick={() => {
                sound.playClickSound();
                onClose();
              }}
              className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold"
            >
              Acknowledge & Close
            </Button>
          </div>
        </div>
      </div>
    </div>
  );

  return typeof document !== 'undefined' ? createPortal(modalContent, document.body) : modalContent;
};
