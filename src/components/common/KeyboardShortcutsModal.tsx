import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
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
  Scale,
  ArrowRight
} from 'lucide-react';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { sound } from '../../utils/soundEffects';
import { useAppStore } from '../../stores/appStore';

interface KeyboardShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenRules?: () => void;
}

export const KEYBOARD_SHORTCUTS = [
  { key: '?', description: 'Open this Keyboard Shortcuts Hub', icon: Keyboard, category: 'GENERAL', path: undefined },
  { key: '/', description: 'Trigger Global Case & Suspect Search', icon: Search, category: 'NAVIGATION', path: undefined },
  { key: 'M', description: 'Jump to Map Intelligence & Live GIS', icon: MapPin, category: 'NAVIGATION', path: '/map' },
  { key: 'P', description: 'Jump to Live Pursuit & Tactical Dispatch', icon: Siren, category: 'TACTICAL', path: '/live-tracking' },
  { key: 'N', description: 'Jump to Network Graph Syndicate Canvas', icon: Share2, category: 'ANALYTICS', path: '/network-graph' },
  { key: 'E', description: 'Jump to Evidence Vault & Section 63 BSA', icon: FileText, category: 'FORENSICS', path: '/evidence' },
  { key: 'S', description: 'Open 15 Statutory Rules & Remand Guard', icon: Scale, category: 'LEGAL', path: undefined },
  { key: 'Esc', description: 'Close any active modal, dialog, or drawer', icon: X, category: 'GENERAL', path: undefined },
];

export const KeyboardShortcutsModal: React.FC<KeyboardShortcutsModalProps> = ({
  isOpen,
  onClose,
  onOpenRules
}) => {
  const navigate = useNavigate();
  const { setGlobalSearchOpen } = useAppStore();

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

  const handleShortcutClick = (item: typeof KEYBOARD_SHORTCUTS[0]) => {
    sound.playClickSound();
    onClose();

    if (item.key === '/') {
      setGlobalSearchOpen(true);
    } else if (item.key === 'S') {
      if (onOpenRules) onOpenRules();
    } else if (item.path) {
      navigate(item.path);
    }
  };

  const modalContent = (
    <div
      className="fixed inset-0 z-[99999] overflow-y-auto bg-black/85 backdrop-blur-md animate-in fade-in duration-200"
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
      <div
        className="min-h-full flex items-center justify-center p-3 sm:p-5"
        onClick={(e) => {
          if (e.target === e.currentTarget) {
            sound.playClickSound();
            onClose();
          }
        }}
      >
        <div className="relative w-full max-w-xl max-h-[88vh] rounded-2xl bg-slate-900 border border-slate-700 shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="shrink-0 flex items-center justify-between p-4 sm:p-5 border-b border-slate-800 bg-slate-950/80">
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
        <div className="flex-1 min-h-0 p-5 space-y-2.5 overflow-y-auto max-h-[55vh]">
          {KEYBOARD_SHORTCUTS.map((item) => {
            const Icon = item.icon;
            const isClickable = item.key !== '?' && item.key !== 'Esc';

            return (
              <button
                key={item.key}
                type="button"
                onClick={() => handleShortcutClick(item)}
                className="w-full p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 flex items-center justify-between text-xs hover:border-indigo-500/50 hover:bg-slate-800/50 transition-all text-left group cursor-pointer"
                title={`Press "${item.key}" or click to jump`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="p-1.5 rounded-lg bg-slate-800 text-slate-300 group-hover:text-indigo-400 group-hover:bg-slate-700 transition-colors shrink-0">
                    <Icon className="h-4 w-4" />
                  </div>
                  <span className="font-semibold text-slate-200 group-hover:text-white transition-colors truncate">
                    {item.description}
                  </span>
                </div>
                <div className="flex items-center gap-2 shrink-0 ml-2">
                  {isClickable && (
                    <span className="text-[10px] text-indigo-400 opacity-0 group-hover:opacity-100 transition-opacity hidden sm:inline-flex items-center gap-0.5">
                      Jump <ArrowRight className="h-3 w-3" />
                    </span>
                  )}
                  <kbd className="px-2.5 py-1 rounded-lg bg-slate-800 border border-slate-700 text-amber-400 font-mono font-bold text-xs shadow-inner min-w-[28px] text-center group-hover:border-indigo-500/50">
                    {item.key}
                  </kbd>
                </div>
              </button>
            );
          })}
        </div>

        {/* Footer */}
        <div className="shrink-0 p-4 border-t border-slate-800 bg-slate-950/90 flex items-center justify-between text-xs text-slate-400">
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
  </div>
);

  return typeof document !== 'undefined' ? createPortal(modalContent, document.body) : modalContent;
};
