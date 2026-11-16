import React, { useState, useEffect } from 'react';
import {
  Languages,
  Radio,
  FileText,
  Volume2,
  AlertTriangle,
  RefreshCw,
  Search,
  CheckCircle2,
  BookOpen,
  Send
} from 'lucide-react';

interface SlangItem {
  argot_token: string;
  decoded_meaning: string;
  category: string;
}

interface TranslationResult {
  original_transcript: string;
  source_language: string;
  target_language: string;
  translated_transcript: string;
  slang_detected_count: number;
  detected_slang: SlangItem[];
  extracted_entities: {
    monetary_amounts: string[];
    weapons_identified: string[];
    urgency_markers: string[];
  };
  certification: string;
}

export const InterceptTranslatePage: React.FC = () => {
  const [transcript, setTranscript] = useState<string>(
    'Bhai ka call aaya tha. Safehouse pe do ghoda deliver ho gaya hai. Raat ko hawala se ek khoka uthana hai aur target ko thokna hai bina kisi shor ke.'
  );
  const [sourceLang, setSourceLang] = useState<string>('HINDI_BAMBAIYA_ARGOT');
  const [result, setResult] = useState<TranslationResult | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [playingAudio, setPlayingAudio] = useState<boolean>(false);

  const handleTranslate = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!transcript.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/v1/intercept/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transcript: transcript,
          source_language: sourceLang
        })
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setResult(data);
    } catch (err: any) {
      setError(err.message || 'Translation failed');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    handleTranslate();
  }, []);

  const toggleAudio = () => {
    setPlayingAudio(!playingAudio);
  };

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto min-w-0">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/40 pb-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <Languages className="w-7 h-7 text-indigo-400 shrink-0" />
            <h1 className="text-xl md:text-2xl font-bold tracking-tight text-foreground leading-tight break-words" title="Real-Time Lawful Intercept Multilingual Translation & Argot Decoder">
              Real-Time Intercept Translation & Argot Decoder
            </h1>
          </div>
          <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
            Multilingual lawful intercept translation across 22 Scheduled Indian languages with underworld slang / Bambaiya criminal code-word decoding for court-certified evidence dossiers.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={toggleAudio}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold border transition-all whitespace-nowrap shrink-0 ${
              playingAudio
                ? 'bg-red-500/20 text-red-300 border-red-500/40 animate-pulse'
                : 'bg-card hover:bg-muted text-foreground border-border'
            }`}
          >
            <Volume2 className="w-4 h-4" />
            {playingAudio ? 'Intercept Audio Streaming...' : 'Simulate Intercept Playback'}
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/30 text-destructive text-sm flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 shrink-0" />
          <span className="overflow-hidden text-ellipsis whitespace-nowrap">{error}</span>
        </div>
      )}

      {/* Top Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-card border border-border shadow-sm min-w-0">
          <div className="flex items-center justify-between text-muted-foreground text-xs font-semibold uppercase tracking-wider">
            <span>Criminal Argot Hits</span>
            <BookOpen className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold text-amber-400 mt-2 font-mono">
            {result?.slang_detected_count || 0} Terms Decoded
          </div>
          <div className="text-xs text-muted-foreground mt-1">Underworld code-words identified</div>
        </div>

        <div className="p-4 rounded-xl bg-card border border-border shadow-sm min-w-0">
          <div className="flex items-center justify-between text-muted-foreground text-xs font-semibold uppercase tracking-wider">
            <span>Source Dialect</span>
            <Radio className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-base font-bold text-foreground mt-2 overflow-hidden text-ellipsis whitespace-nowrap">
            Hindi / Bambaiya Gang Argot
          </div>
          <div className="text-xs text-muted-foreground mt-1">Trans-State Syndicate Wiretap</div>
        </div>

        <div className="p-4 rounded-xl bg-card border border-border shadow-sm min-w-0">
          <div className="flex items-center justify-between text-muted-foreground text-xs font-semibold uppercase tracking-wider">
            <span>Entity Extraction</span>
            <Search className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-lg font-bold text-emerald-400 mt-2 overflow-hidden text-ellipsis whitespace-nowrap">
            ₹1 Cr &bull; Handgun &bull; Contract Hit
          </div>
          <div className="text-xs text-muted-foreground mt-1">Direct conspiracy evidence</div>
        </div>

        <div className="p-4 rounded-xl bg-card border border-border shadow-sm min-w-0">
          <div className="flex items-center justify-between text-muted-foreground text-xs font-semibold uppercase tracking-wider">
            <span>Certification Proof</span>
            <FileText className="w-4 h-4 text-primary" />
          </div>
          <div className="text-sm font-semibold text-primary mt-2 overflow-hidden text-ellipsis whitespace-nowrap">
            BSA 2023 Sec 63 / 65B
          </div>
          <div className="text-xs text-muted-foreground mt-1">Court-Admissible Legal Translation</div>
        </div>
      </div>

      {/* Main Dual-Transcript View */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input Raw Intercept Panel */}
        <div className="p-5 bg-card border border-border rounded-xl min-w-0 flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between border-b border-border/40 pb-3 mb-3">
              <h3 className="font-semibold text-foreground text-base">
                Original Intercepted Audio Transcript
              </h3>
              <span className="text-xs font-mono text-muted-foreground">Raw Audio Feed</span>
            </div>

            <textarea
              rows={5}
              value={transcript}
              onChange={(e) => setTranscript(e.target.value)}
              className="w-full bg-background border border-border text-foreground rounded-lg p-3 text-xs leading-relaxed focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="Paste raw phone intercept wiretap transcript here..."
            />
          </div>

          <button
            onClick={() => handleTranslate()}
            disabled={loading}
            className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold transition-colors flex items-center justify-center gap-2 whitespace-nowrap shrink-0"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            {loading ? 'Decoding Argot...' : 'Re-Translate & Decode Code-Words'}
          </button>
        </div>

        {/* Certified English Court Draft Panel */}
        <div className="p-5 bg-card border border-border rounded-xl min-w-0 flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between border-b border-border/40 pb-3 mb-3">
              <h3 className="font-semibold text-foreground text-base">
                Certified Legal English Translation
              </h3>
              <span className="text-xs px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono whitespace-nowrap">
                Court Ready
              </span>
            </div>

            <div className="p-3.5 rounded-lg bg-background/70 border border-border text-xs leading-relaxed text-foreground min-h-[120px] break-words">
              {result?.translated_transcript}
            </div>
          </div>

          <div className="p-3 bg-muted/40 rounded border border-border text-[11px] text-muted-foreground flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="break-words">{result?.certification}</span>
          </div>
        </div>
      </div>

      {/* Decoded Argot Table */}
      {result && result.detected_slang.length > 0 && (
        <div className="p-5 bg-card border border-border rounded-xl min-w-0">
          <h3 className="font-semibold text-foreground text-base mb-3">
            Decoded Underworld Slang (Argot Glossary Hits)
          </h3>
          <div className="overflow-x-auto w-full">
            <table className="w-full text-left text-xs min-w-[650px]">
              <thead className="bg-muted/40 text-muted-foreground uppercase text-[10px] tracking-wider border-b border-border">
                <tr>
                  <th className="py-2.5 px-3">Underworld Argot Token</th>
                  <th className="py-2.5 px-3">Decoded Forensic Meaning</th>
                  <th className="py-2.5 px-3">Criminal Category</th>
                  <th className="py-2.5 px-3">Statutory Implication</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {result.detected_slang.map((item, idx) => (
                  <tr key={idx} className="hover:bg-muted/20 transition-colors">
                    <td className="py-2.5 px-3 font-mono font-bold text-amber-400">{item.argot_token}</td>
                    <td className="py-2.5 px-3 font-semibold text-foreground">{item.decoded_meaning}</td>
                    <td className="py-2.5 px-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-secondary text-secondary-foreground whitespace-nowrap">
                        {item.category}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-muted-foreground">
                      Conspiracy corroboration under BNSS Sec 61 & IPC Sec 120B
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default InterceptTranslatePage;
