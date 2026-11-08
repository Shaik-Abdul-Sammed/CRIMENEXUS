import React, { useState, useEffect } from 'react';
import { Sun, Type, Eye, Check } from 'lucide-react';
import { sound } from '../../utils/soundEffects';

export function AccessibilityBar() {
  const [fontSize, setFontSize] = useState<'normal' | 'large' | 'xlarge'>('normal');
  const [highContrast, setHighContrast] = useState(false);

  useEffect(() => {
    const root = document.documentElement;
    if (fontSize === 'large') {
      root.style.fontSize = '17px';
    } else if (fontSize === 'xlarge') {
      root.style.fontSize = '18.5px';
    } else {
      root.style.fontSize = '16px';
    }
  }, [fontSize]);

  useEffect(() => {
    if (highContrast) {
      document.documentElement.classList.add('high-contrast');
    } else {
      document.documentElement.classList.remove('high-contrast');
    }
  }, [highContrast]);

  const toggleContrast = () => {
    sound.playClickSound();
    setHighContrast(!highContrast);
  };

  const handleFontChange = (sz: 'normal' | 'large' | 'xlarge') => {
    sound.playClickSound();
    setFontSize(sz);
  };

  return (
    <div className="hidden lg:flex items-center gap-1.5 p-1 rounded-lg border border-border/60 bg-background/60 text-xs">
      {/* High Contrast / Sunlight Toggle */}
      <button
        onClick={toggleContrast}
        className={`px-2 py-0.5 rounded text-[10px] font-bold flex items-center gap-1 transition-colors ${
          highContrast
            ? 'bg-amber-400 text-slate-950 shadow-sm font-black'
            : 'text-muted-foreground hover:text-foreground'
        }`}
        title="High Contrast Sunlight Mode (for field patrol in bright sunlight)"
        aria-label="Toggle High Contrast Sunlight Mode"
      >
        <Sun className="h-3 w-3" />
        <span className="hidden xl:inline">Sunlight</span>
      </button>

      {/* Font Size A- / A / A+ Switcher */}
      <div className="flex items-center border-l border-border/50 pl-1">
        {(['normal', 'large', 'xlarge'] as const).map((sz, idx) => (
          <button
            key={sz}
            onClick={() => handleFontChange(sz)}
            className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold transition-colors ${
              fontSize === sz
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:text-foreground'
            }`}
            title={`Font Size: ${sz === 'normal' ? 'Standard' : sz === 'large' ? 'Large (110%)' : 'Extra Large (125%)'}`}
          >
            {idx === 0 ? 'A' : idx === 1 ? 'A+' : 'A++'}
          </button>
        ))}
      </div>
    </div>
  );
}
