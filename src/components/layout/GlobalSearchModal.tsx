import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, FolderGit2, User, Phone, Car, FileCheck, Building, MapPin, X } from 'lucide-react';
import { useAppStore } from '../../stores/appStore';
import { api } from '../../services/api';
import { GlobalSearchResult } from '../../types';

export function GlobalSearchModal() {
  const { globalSearchOpen, setGlobalSearchOpen } = useAppStore();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<GlobalSearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  // Listen for global '/' shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === '/' && !['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) {
        e.preventDefault();
        setGlobalSearchOpen(true);
      } else if (e.key === 'Escape') {
        setGlobalSearchOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [setGlobalSearchOpen]);

  // Execute search when query changes
  useEffect(() => {
    if (!query.trim() || query.length < 2) {
      setResults([]);
      return;
    }
    setIsLoading(true);
    const timer = setTimeout(() => {
      api.globalSearch(query).then((res) => {
        setResults(res);
        setIsLoading(false);
      });
    }, 150);
    return () => clearTimeout(timer);
  }, [query]);

  if (!globalSearchOpen) return null;

  const handleSelect = (url: string) => {
    setGlobalSearchOpen(false);
    setQuery('');
    navigate(url);
  };

  const getCategoryIcon = (cat: GlobalSearchResult['category']) => {
    switch (cat) {
      case 'CASES':
        return <FolderGit2 className="h-4 w-4 text-emerald-400" />;
      case 'PEOPLE':
        return <User className="h-4 w-4 text-blue-400" />;
      case 'PHONES':
        return <Phone className="h-4 w-4 text-amber-400" />;
      case 'VEHICLES':
        return <Car className="h-4 w-4 text-purple-400" />;
      case 'EVIDENCE':
        return <FileCheck className="h-4 w-4 text-cyan-400" />;
      case 'ORGANIZATIONS':
        return <Building className="h-4 w-4 text-orange-400" />;
      case 'LOCATIONS':
        return <MapPin className="h-4 w-4 text-pink-400" />;
      default:
        return <Search className="h-4 w-4 text-muted-foreground" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-150">
      <div className="relative w-full max-w-2xl rounded-xl border border-border bg-card shadow-2xl overflow-hidden">
        {/* Search Header */}
        <div className="flex items-center px-4 border-b border-border bg-background/50">
          <Search className="h-5 w-5 text-primary shrink-0 mr-3" />
          <input
            type="text"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search cases, suspects, phones, vehicle numbers, evidence..."
            className="w-full h-14 bg-transparent text-base text-foreground placeholder:text-muted-foreground focus:outline-none"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="p-1 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Results Stream */}
        <div className="max-h-[60vh] overflow-y-auto p-3">
          {isLoading && (
            <div className="p-8 text-center text-xs text-muted-foreground">
              Scanning CRIMENEXUS intelligence databases...
            </div>
          )}

          {!isLoading && query.length >= 2 && results.length === 0 && (
            <div className="p-8 text-center text-xs text-muted-foreground">
              No matching intelligence entities or cases found for &quot;{query}&quot;.
            </div>
          )}

          {!isLoading && results.length > 0 && (
            <div className="space-y-1">
              {results.map((item) => (
                <div
                  key={item.id}
                  onClick={() => handleSelect(item.url)}
                  className="flex items-center justify-between p-3 rounded-lg border border-transparent hover:border-primary/30 hover:bg-accent/60 cursor-pointer transition-all group"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-background border border-border shrink-0">
                      {getCategoryIcon(item.category)}
                    </div>
                    <div>
                      <span className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors block">
                        {item.title}
                      </span>
                      <span className="text-xs text-muted-foreground">{item.subtitle}</span>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-muted text-muted-foreground uppercase border border-border">
                    {item.category}
                  </span>
                </div>
              ))}
            </div>
          )}

          {!query && (
            <div className="p-6 text-center text-xs text-muted-foreground space-y-2">
              <p className="font-semibold text-foreground">Global Intelligence Search</p>
              <p>Type at least 2 characters or use exact parameters (e.g. &quot;Ramesh&quot;, &quot;+91 98765&quot;, &quot;EVD-2026&quot;)</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-4 py-2 border-t border-border bg-background/50 text-[10px] text-muted-foreground">
          <span>Navigate with mouse or keyboard</span>
          <span>Press ESC to close</span>
        </div>
      </div>
    </div>
  );
}
