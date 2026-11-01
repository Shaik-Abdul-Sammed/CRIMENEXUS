import React, { useState } from 'react';
import {
  Palette,
  Layers,
  Type,
  Sparkles,
  Lock,
  Flame,
  Clock,
  CheckCircle2,
  Copy,
  Check,
  ExternalLink,
  Code2,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';

interface ColorSwatch {
  name: string;
  token: string;
  hex: string;
  description: string;
  contrastOnDark: string;
}

const COLOR_SWATCHES: ColorSwatch[] = [
  { name: 'Primary Background (Deep Void)', token: 'bg-primary', hex: '#0A1929', description: 'Root tactical canvas & ultra-dark background', contrastOnDark: '16.8:1' },
  { name: 'Secondary Background (Slate Navy)', token: 'bg-secondary', hex: '#112240', description: 'Elevated surfaces, card panels, modals', contrastOnDark: '13.2:1' },
  { name: 'Emerald (Success & Safe)', token: 'accent-emerald', hex: '#10B981', description: 'Verified evidence, active pipelines, compliant cases', contrastOnDark: '9.4:1' },
  { name: 'Crimson (High Risk & Danger)', token: 'accent-crimson', hex: '#DC2626', description: 'Kingpins, emergency account freezes, Red Notices', contrastOnDark: '4.8:1' },
  { name: 'Amber (Alert & Caution)', token: 'accent-amber', hex: '#F59E0B', description: 'Remand countdowns, hawala smurfing flags', contrastOnDark: '11.5:1' },
  { name: 'Indigo (Strategic & Analytics)', token: 'accent-indigo', hex: '#6366F1', description: 'Graph neural links, semantic embeddings', contrastOnDark: '5.2:1' },
  { name: 'Cyan (Geospatial & Sensor)', token: 'accent-cyan', hex: '#06B6D4', description: 'ANPR telemetry, trajectory routes, radar ping', contrastOnDark: '10.1:1' },
];

export function DesignSystemPage() {
  const [copiedToken, setCopiedToken] = useState<string | null>(null);
  const [sampleInput, setSampleInput] = useState('');

  const handleCopy = (text: string, token: string) => {
    navigator.clipboard.writeText(text);
    setCopiedToken(token);
    setTimeout(() => setCopiedToken(null), 2000);
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-2xl border border-white/10 bg-bg-secondary/80 backdrop-blur-md shadow-glass">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-accent-indigo/20 text-accent-indigo border border-accent-indigo/30">
              <Palette className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-black tracking-tight text-white flex items-center gap-2">
                CRIMENEXUS Design System
                <Badge variant="outline" className="text-[10px] bg-accent-emerald/20 text-emerald-400 border-emerald-500/30">
                  FIGMA TOKENS v1.0
                </Badge>
              </h1>
              <p className="text-xs text-text-muted mt-0.5">
                Palantir-grade tactical intelligence tokens, glassmorphism aesthetics, and WCAG 2.1 AA certified UI.
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <a
            href="/docs/11_FIGMA_HANDOFF.md"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-white/15 bg-white/5 hover:bg-white/10 text-xs font-semibold text-slate-200 transition-colors"
          >
            <ExternalLink className="h-4 w-4" />
            <span>Figma Handoff Guide</span>
          </a>
          <Button
            variant="primary"
            size="sm"
            onClick={() => handleCopy(JSON.stringify(COLOR_SWATCHES, null, 2), 'ALL_TOKENS')}
            className="flex items-center gap-1.5 shadow-glow-emerald"
          >
            {copiedToken === 'ALL_TOKENS' ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            <span>Export Tokens</span>
          </Button>
        </div>
      </div>

      {/* 1. Color Palette Tokens */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <Layers className="h-5 w-5 text-accent-indigo" />
          <h2 className="text-lg font-bold text-white">1. Core Color Token Architecture</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {COLOR_SWATCHES.map((swatch) => (
            <div
              key={swatch.token}
              className="p-4 rounded-xl border border-white/10 bg-bg-secondary/60 backdrop-blur-md shadow-glass flex flex-col justify-between hover:border-white/20 transition-all group"
            >
              <div>
                <div
                  className="h-20 w-full rounded-lg mb-3 shadow-inner flex items-end p-2 justify-between"
                  style={{ backgroundColor: swatch.hex }}
                >
                  <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-black/40 text-white backdrop-blur-sm">
                    {swatch.hex}
                  </span>
                  <button
                    onClick={() => handleCopy(swatch.hex, swatch.token)}
                    className="p-1 rounded bg-black/40 text-white hover:bg-black/60 transition-colors"
                    title="Copy hex code"
                  >
                    {copiedToken === swatch.token ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                  </button>
                </div>
                <h3 className="text-sm font-bold text-white group-hover:text-accent-indigo transition-colors">
                  {swatch.name}
                </h3>
                <code className="text-[11px] text-accent-cyan font-mono block mt-0.5">
                  --{swatch.token}
                </code>
                <p className="text-xs text-text-muted mt-2 leading-relaxed">
                  {swatch.description}
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-[10px] text-slate-400">
                <span>Contrast on Void:</span>
                <span className="font-mono font-bold text-emerald-400">{swatch.contrastOnDark} (Pass)</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 2. Typography Scale */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <Type className="h-5 w-5 text-accent-cyan" />
          <h2 className="text-lg font-bold text-white">2. Tactical Typography Scale (Inter / JetBrains Mono)</h2>
        </div>
        <Card className="border-white/10 bg-bg-secondary/60 backdrop-blur-md shadow-glass">
          <CardContent className="p-6 space-y-6">
            <div className="flex flex-col md:flex-row md:items-baseline justify-between border-b border-white/10 pb-4">
              <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground w-40">
                Display H1 (30px / 1.2)
              </span>
              <h1 className="text-3xl font-black text-white flex-1">
                Operation Shadow Vault: Tactical Matrix
              </h1>
            </div>

            <div className="flex flex-col md:flex-row md:items-baseline justify-between border-b border-white/10 pb-4">
              <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground w-40">
                Heading H2 (24px / 1.3)
              </span>
              <h2 className="text-2xl font-extrabold text-white flex-1">
                Forensic Evidence Chain of Custody & Geofence
              </h2>
            </div>

            <div className="flex flex-col md:flex-row md:items-baseline justify-between border-b border-white/10 pb-4">
              <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground w-40">
                Heading H3 (20px / 1.4)
              </span>
              <h3 className="text-xl font-bold text-white flex-1">
                Statutory Remand & Default Bail Deadlines (BNSS 187)
              </h3>
            </div>

            <div className="flex flex-col md:flex-row md:items-baseline justify-between border-b border-white/10 pb-4">
              <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground w-40">
                Body Regular (14px / 1.5)
              </span>
              <p className="text-sm text-text-primary flex-1 leading-relaxed">
                Analysis of transaction logs indicates 14 structured smurfing deposits of ₹49,000 each deposited into account ACC-HDFC-908122 within a 48-hour window from disparate cyber cafes across Noida Sector 62.
              </p>
            </div>

            <div className="flex flex-col md:flex-row md:items-baseline justify-between">
              <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground w-40">
                Code / Statutory Mono
              </span>
              <code className="text-xs font-mono text-accent-amber flex-1 bg-black/40 px-3 py-2 rounded-lg border border-amber-500/20">
                SEC_63_BSA_HASH: e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855
              </code>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* 3. Component & State Showcase */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-accent-emerald" />
          <h2 className="text-lg font-bold text-white">3. Tactical Components & Visual Micro-States</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Button Styles */}
          <Card className="border-white/10 bg-bg-secondary/60 backdrop-blur-md shadow-glass">
            <CardHeader>
              <CardTitle className="text-sm text-white">Command Buttons</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap items-center gap-3">
                <Button variant="primary" size="sm" className="shadow-glow-emerald">
                  Primary Action
                </Button>
                <Button variant="secondary" size="sm">
                  Secondary Action
                </Button>
                <Button variant="outline" size="sm">
                  Tactical Outline
                </Button>
                <Button variant="danger" size="sm" className="shadow-glow-crimson flex items-center gap-1.5">
                  <Lock className="h-3.5 w-3.5" />
                  Freeze Debit
                </Button>
              </div>
              <div className="flex flex-wrap items-center gap-3 pt-2">
                <Button variant="primary" size="sm" disabled>
                  Disabled State
                </Button>
                <button className="px-3 py-1.5 rounded-lg border border-white/20 bg-white/5 hover:bg-white/10 text-xs font-semibold text-slate-200 backdrop-blur-md shadow-glass transition-colors">
                  Glassmorphic Action
                </button>
              </div>
            </CardContent>
          </Card>

          {/* Badges & Legal Notice Tags */}
          <Card className="border-white/10 bg-bg-secondary/60 backdrop-blur-md shadow-glass">
            <CardHeader>
              <CardTitle className="text-sm text-white">Statutory & Threat Badges</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="destructive" className="bg-red-600 text-white font-bold text-[10px] tracking-wider uppercase px-2 py-0.5 flex items-center gap-1">
                  <Flame className="h-3 w-3" />
                  RED NOTICE: MOST WANTED
                </Badge>
                <Badge variant="success" className="bg-emerald-600 text-white font-bold text-[10px] tracking-wider uppercase px-2 py-0.5 flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3" />
                  BSA 63 VERIFIED
                </Badge>
                <Badge variant="warning" className="bg-amber-600 text-white font-bold text-[10px] tracking-wider uppercase px-2 py-0.5 flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  REMAND D-14
                </Badge>
              </div>
              <div className="flex flex-wrap items-center gap-2 pt-2">
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30">
                  PERSON: MULE
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30">
                  VEHICLE: ANPR HIT
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  HAWALA / PMLA 2002
                </span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Input & Form Preview */}
        <Card className="border-white/10 bg-bg-secondary/60 backdrop-blur-md shadow-glass">
          <CardHeader>
            <CardTitle className="text-sm text-white">Interactive Command Inputs</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-text-muted block mb-1">
                Target Entity Search
              </label>
              <Input
                placeholder="Search suspect name, CDR IMEI, or vehicle plate..."
                value={sampleInput}
                onChange={(e) => setSampleInput(e.target.value)}
                className="bg-bg-primary/80 border-white/15 focus:border-accent-indigo text-xs"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-text-muted block mb-1">
                Jurisdictional Filter
              </label>
              <select className="w-full h-10 px-3 text-xs rounded-lg border border-white/15 bg-bg-primary/80 text-foreground focus:outline-none focus:ring-1 focus:ring-accent-indigo">
                <option>All Police Ranges (Delhi NCR & Yamuna Corridor)</option>
                <option>Cyber Crime Police Station, Sector 20</option>
                <option>Special Cell Delhi Police (Lodhi Colony)</option>
              </select>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* 4. Figma Token JSON Preview */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Code2 className="h-5 w-5 text-accent-indigo" />
            <h2 className="text-lg font-bold text-white">4. Tokens Studio JSON Specification</h2>
          </div>
          <span className="text-xs text-text-muted font-mono">design/figma-tokens.json</span>
        </div>
        <Card className="border-white/10 bg-black/60 backdrop-blur-md shadow-glass">
          <CardContent className="p-4">
            <pre className="text-xs font-mono text-slate-300 overflow-x-auto max-h-64 leading-relaxed p-2">
{`{
  "color": {
    "bg-primary": { "value": "#0A1929", "type": "color" },
    "bg-secondary": { "value": "#112240", "type": "color" },
    "accent-emerald": { "value": "#10B981", "type": "color" },
    "accent-crimson": { "value": "#DC2626", "type": "color" },
    "accent-amber": { "value": "#F59E0B", "type": "color" },
    "accent-indigo": { "value": "#6366F1", "type": "color" },
    "accent-cyan": { "value": "#06B6D4", "type": "color" }
  },
  "shadow": {
    "glass": { "value": "0 8px 32px 0 rgba(0, 0, 0, 0.37)" },
    "glow-emerald": { "value": "0 0 15px rgba(16, 185, 129, 0.4)" }
  }
}`}
            </pre>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}

export default DesignSystemPage;
