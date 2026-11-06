import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  Keyboard,
  Search,
  MapPin,
  Share2,
  FileText,
  Shield,
  Siren,
  X,
  Volume2,
  Scale
} from 'lucide-react';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { sound } from '../../utils/soundEffects';

interface KeyboardShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const KEYBOARD_SHORTCUTS = [
  { key: '?', description: 'Open this Keyboard Shortcuts Hub', icon: Keyboard, category: 'GENERAL' },
  { key: '/', description: 'Trigger Global Case & Suspect Search', icon: Search, category: 'NAVIGATION' },
  { key: 'M', description: 'Jump to Map Intelligence & Live GIS', icon: MapPin, category: 'NAVIGATION' },
  { key: 'P', description: 'Jump to Live Pursuit & Tactical Dispatch', icon: Siren, category: 'TACTICAL' },
  { key: 'N', description: 'Jump to Network Graph Syndicate Canvas', icon: Share2, category: 'ANALYTICS' },
  { key: 'E', description: 'Jump to Evidence Vault & Section 63 BSA', icon: FileText, category: 'FORENSICS' },
  { key: 'S', description: 'Open 15 Statutory Rules & Remand Guard', icon: Scale, category: 'LEGAL' },
  { key: 'Esc', description: 'Close any active modal, dialog, or drawer', icon: X, category: 'GENERAL' },
];

export const KeyboardShortcutsModal: React.FC<KeyboardShortcutsModalProps> = ({ isOpen, onClose }) => {
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

  const modalContent = (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="keyboard-shortcuts-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          sound.playClickSound();
          onClose();
        }
      }}
    >
      <div className="relative w-full max-w-xl max-h-[90vh] rounded-2xl bg-slate-900 border border-slate-700 shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-800 bg-slate-950/80">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-400">
              <Keyboard className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 id="keyboard-shortcuts-title" className="text-base sm:text-lg font-black text-white">
                  Investigating Officer Keyboard Shortcuts
                </h2>
                <Badge variant="outline" className="border-indigo-500/50 text-indigo-400 text-[10px] font-mono">
                  HOTKEYS
                </Badge>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Rapid tactical navigation commands for high-speed police operations.
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              sound.playClickSound();
              onClose();
            }}
            className="p-2 rounded-xl text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-700 border border-slate-700 transition-colors"
            aria-label="Close shortcuts modal"
            title="Close [Esc]"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Shortcuts List */}
        <div className="p-5 space-y-2.5 overflow-y-auto max-h-[60vh]">
          {KEYBOARD_SHORTCUTS.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.key}
                className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 flex items-center justify-between text-xs hover:border-slate-700 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="p-1.5 rounded-lg bg-slate-800 text-slate-300">
                    <Icon className="h-4 w-4" />
                  </div>
                  <span className="font-semibold text-slate-200">{item.description}</span>
                </div>
                <kbd className="px-2.5 py-1 rounded-lg bg-slate-800 border border-slate-700 text-amber-400 font-mono font-bold text-xs shadow-inner min-w-[28px] text-center">
                  {item.key}
                </kbd>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/90 flex items-center justify-between text-xs text-slate-400">
          <span className="truncate mr-2">Press any highlighted hotkey anywhere in the system.</span>
          <div className="flex items-center gap-2 shrink-0">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                sound.playClickSound();
                onClose();
              }}
              className="border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white font-medium"
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
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold"
            >
              Got It
            </Button>
          </div>
        </div>
      </div>
    </div>
  );

  return typeof document !== 'undefined' ? createPortal(modalContent, document.body) : modalContent;
};
