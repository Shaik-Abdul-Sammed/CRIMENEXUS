import React, { useState, useEffect } from 'react';
import { ArrowUp } from 'lucide-react';
import { sound } from '../../utils/soundEffects';

export function BackToTopButton() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Find the main scrolling container or listen to window scroll
    const scrollHandler = () => {
      const scrollPos = window.scrollY || document.documentElement.scrollTop || (document.querySelector('main')?.scrollTop ?? 0);
      setIsVisible(scrollPos > 240);
    };

    window.addEventListener('scroll', scrollHandler, { passive: true });
    const mainEl = document.querySelector('main');
    if (mainEl) {
      mainEl.addEventListener('scroll', scrollHandler, { passive: true });
    }

    return () => {
      window.removeEventListener('scroll', scrollHandler);
      if (mainEl) {
        mainEl.removeEventListener('scroll', scrollHandler);
      }
    };
  }, []);

  const scrollToTop = () => {
    sound.playClickSound();
    window.scrollTo({ top: 0, behavior: 'smooth' });
    const mainEl = document.querySelector('main');
    if (mainEl) {
      mainEl.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  if (!isVisible) return null;

  return (
    <button
      onClick={scrollToTop}
      className="fixed bottom-6 right-6 z-40 p-2.5 rounded-full bg-primary/90 text-primary-foreground hover:bg-primary shadow-xl shadow-primary/30 border border-primary/50 transition-all transform hover:scale-110 active:scale-95 flex items-center justify-center animate-in fade-in zoom-in-75"
      title="Back to Top"
      aria-label="Back to top of page"
    >
      <ArrowUp className="h-5 w-5" />
    </button>
  );
}
