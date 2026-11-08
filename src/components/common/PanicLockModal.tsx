import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Lock, ShieldAlert, KeyRound, CheckCircle2, Eye, EyeOff } from 'lucide-react';
import { Button } from '../ui/Button';
import { sound } from '../../utils/soundEffects';

interface PanicLockModalProps {
  isLocked: boolean;
  onUnlock: () => void;
}

export function PanicLockModal({ isLocked, onUnlock }: PanicLockModalProps) {
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);

  useEffect(() => {
    if (isLocked) {
      setPin('');
      setError(false);
    }
  }, [isLocked]);

  if (!isLocked) return null;

  const handleUnlockAttempt = (e: React.FormEvent) => {
    e.preventDefault();
    // Default demo PIN is 1234 or clicking Resume
    if (pin === '1234' || pin === '' || pin === '0000') {
      sound.playSuccessChime();
      onUnlock();
    } else {
      sound.playWarningBeep();
      setError(true);
    }
  };

  const modalContent = (
    <div className="fixed inset-0 z-[999999] bg-slate-950/98 backdrop-blur-2xl overflow-y-auto select-none animate-in fade-in duration-150">
      <div className="min-h-full flex justify-center p-3 sm:p-6 text-center">
        <div className="max-w-md w-full my-auto p-6 sm:p-8 rounded-2xl border-2 border-red-500/60 bg-slate-900/90 shadow-2xl shadow-red-950/80 space-y-6">
        <div className="flex flex-col items-center gap-3">
          <div className="p-4 rounded-full bg-red-500/20 text-red-400 border border-red-500/40 animate-pulse">
            <Lock className="h-10 w-10 text-red-400" />
          </div>
          <div>
            <span className="text-[10px] font-mono font-bold tracking-widest uppercase px-2.5 py-0.5 rounded bg-red-500/20 text-red-300 border border-red-500/40">
              OFFICIAL USE ONLY • PANIC LOCK ENGAGED
            </span>
            <h2 className="text-xl font-black text-white mt-2">
              CRIMENEXUS WORKSPACE LOCKED
            </h2>
            <p className="text-xs text-muted-foreground mt-1">
              All tactical maps, suspect dossiers, and evidence files are obfuscated under Official Secrets & BSA digital protocol.
            </p>
          </div>
        </div>

        <form onSubmit={handleUnlockAttempt} className="space-y-4">
          <div className="space-y-1.5 text-left">
            <label className="text-[11px] font-bold text-slate-300 font-mono">
              ENTER AUTHORIZED IO PIN (Default: 1234)
            </label>
            <div className="relative">
              <input
                type="password"
                maxLength={6}
                value={pin}
                onChange={(e) => {
                  setPin(e.target.value);
                  setError(false);
                }}
                placeholder="Enter PIN (e.g. 1234)"
                autoFocus
                className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-slate-950 border border-slate-700 focus:border-red-500 text-center text-lg tracking-widest font-mono text-white placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-red-500"
              />
              <KeyRound className="absolute left-3 top-3 h-4 w-4 text-slate-500" />
            </div>
            {error && (
              <p className="text-[11px] text-red-400 font-semibold mt-1">
                Incorrect PIN. Enter 1234 or click Emergency Resume.
              </p>
            )}
          </div>

          <div className="flex flex-col gap-2 pt-2">
            <Button
              type="submit"
              className="w-full bg-red-600 hover:bg-red-700 text-white font-bold text-xs py-2.5 shadow-lg shadow-red-600/30"
            >
              Unlock Classified Workspace
            </Button>
            <button
              type="button"
              onClick={() => {
                sound.playSuccessChime();
                onUnlock();
              }}
              className="text-xs text-slate-400 hover:text-white underline py-1"
            >
              Emergency IO Resume (Bypass PIN)
            </button>
          </div>
        </form>

        <div className="pt-2 border-t border-slate-800 text-[10px] text-slate-500 font-mono">
          Session Token: SEC-63-BSA-WORM-LOCKED • Patch v2.4
        </div>
      </div>
    </div>
  </div>
);

  return typeof document !== 'undefined' ? createPortal(modalContent, document.body) : modalContent;
}
