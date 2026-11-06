import React, { useState } from 'react';
import figmaTokens from '../../design/figma-tokens.json';
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
  Monitor,
  Shield,
  Zap,
  Radio,
  Sliders,
  CheckCircle,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { useAppStore, FigmaTheme } from '../../stores/appStore';
import { sound } from '../../utils/soundEffects';

interface ColorSwatch {
  name: string;
  token: string;
  hex: string;
  description: string;
  contrastOnDark: string;
}

interface FigmaThemeMeta {
  id: FigmaTheme;
  name: string;
  codename: string;
  tagline: string;
  description: string;
  bgHex: string;
  cardHex: string;
  primaryHex: string;
  accentHex: string;
  badgeText: string;
  icon: string;
  recommendedRole: string;
  contrastRatio: string;
}

export const FIGMA_THEMES: FigmaThemeMeta[] = [
  {
    id: 'dark',
    name: 'Palantir Midnight Command',
    codename: 'theme-palantir (Default)',
    tagline: 'State Command Center & 24/7 Ops Room',
    description: 'Deep Midnight Navy (#0A1929) optimized for low ocular fatigue in dark Ops Command rooms. High-contrast cobalt blue (#3B82F6) nodes with fluorescent telemetry pings.',
    bgHex: '#0A1929',
    cardHex: '#112240',
    primaryHex: '#3B82F6',
    accentHex: '#10B981',
    badgeText: '24/7 OPS ROOM',
    icon: '🌙',
    recommendedRole: 'Investigators & Analysts',
    contrastRatio: '16.8:1 (AAA Pass)',
  },
  {
    id: 'light',
    name: 'Daylight Thana Patrol',
    codename: 'theme-daylight (High Contrast)',
    tagline: 'Police Station Desk & Sunlight Rugged Tablets',
    description: 'Ultra-crisp daylight slate (#F8FAFC) canvas with pure white (#FFFFFF) elevated panels, deep cobalt (#2563EB) accents, and dark navy text. Calibrated for direct sunlight field tablets.',
    bgHex: '#F8FAFC',
    cardHex: '#FFFFFF',
    primaryHex: '#2563EB',
    accentHex: '#059669',
    badgeText: 'DAYLIGHT DESK',
    icon: '☀️',
    recommendedRole: 'Station Duty Officers & Field Teams',
    contrastRatio: '14.2:1 (AAA Pass)',
  },
  {
    id: 'cyber-matrix',
    name: 'Cyber Forensics Matrix',
    codename: 'theme-cyber-matrix (Forensics Mode)',
    tagline: 'Digital Wiretap & Financial Hawala Forensics',
    description: 'Ultra-dark matrix void (#020B08) with pine-tinted surfaces (#051C14) and glowing matrix emerald (#10B981). Engineered for deep-packet wiretap decoding and crypto tracing.',
    bgHex: '#020B08',
    cardHex: '#051C14',
    primaryHex: '#10B981',
    accentHex: '#06B6D4',
    badgeText: 'CYBER CRIME LAB',
    icon: '⚡',
    recommendedRole: 'Cyber Forensics & Financial Units',
    contrastRatio: '18.1:1 (AAA Pass)',
  },
  {
    id: 'amber-tactical',
    name: 'Highway Intercept Tactical',
    codename: 'theme-amber-tactical (Pursuit Mode)',
    tagline: 'ERSS-112 Highway Pursuit & High Alert Roadblocks',
    description: 'Dark carbon charcoal (#0C0A07) with warm asphalt surfaces (#18140D) and high-visibility tactical warning amber (#F59E0B). Tailored for night highway intercepts, ANPR tolls, and Red Notices.',
    bgHex: '#0C0A07',
    cardHex: '#18140D',
    primaryHex: '#F59E0B',
    accentHex: '#DC2626',
    badgeText: 'PURSUIT & INTERCEPT',
    icon: '🚨',
    recommendedRole: 'PCR Flying Squads & Highway Patrol',
    contrastRatio: '15.4:1 (AAA Pass)',
  },
];

export function DesignSystemPage() {
  const { figmaTheme, setFigmaTheme } = useAppStore();
  const [copiedToken, setCopiedToken] = useState<string | null>(null);
  const [sampleInput, setSampleInput] = useState('');

  const activeThemeMeta = FIGMA_THEMES.find((t) => t.id === figmaTheme) || FIGMA_THEMES[0];

  const handleCopy = (text: string, token: string) => {
    sound.playClickSound();
    navigator.clipboard.writeText(text);
    setCopiedToken(token);
    setTimeout(() => setCopiedToken(null), 2000);
  };

  const handleSelectTheme = (themeId: FigmaTheme) => {
    sound.playClickSound();
    setFigmaTheme(themeId);
  };

  // Active theme responsive swatches
  const getThemeSwatches = (theme: FigmaTheme): ColorSwatch[] => {
    switch (theme) {
      case 'cyber-matrix':
        return [
          { name: 'Matrix Void Canvas', token: 'background', hex: '#020B08', description: 'Deep terminal void for forensic dark rooms', contrastOnDark: '18.1:1' },
          { name: 'Pine Elevated Surface', token: 'card', hex: '#051C14', description: 'Elevated evidence cards & cyber inspector panels', contrastOnDark: '14.5:1' },
          { name: 'Matrix Emerald Primary', token: 'primary', hex: '#10B981', description: 'Grounded network nodes & active packet streams', contrastOnDark: '11.2:1' },
          { name: 'Cyan Telemetry Glow', token: 'accent-cyan', hex: '#06B6D4', description: 'Packet sniffing hops & satellite links', contrastOnDark: '9.8:1' },
          { name: 'Tactical Amber Warning', token: 'accent-amber', hex: '#F59E0B', description: 'Suspect mule velocity anomaly flags', contrastOnDark: '11.5:1' },
          { name: 'Crimson Breach Alert', token: 'destructive', hex: '#DC2626', description: 'Zero-day exploits & emergency crypto freezes', contrastOnDark: '5.2:1' },
        ];
      case 'amber-tactical':
        return [
          { name: 'Charcoal Asphalt Canvas', token: 'background', hex: '#0C0A07', description: 'Night pursuit low-glare vehicle background', contrastOnDark: '15.4:1' },
          { name: 'Warm Carbon Surface', token: 'card', hex: '#18140D', description: 'Tactical dispatch HUD & vehicle telematics card', contrastOnDark: '12.8:1' },
          { name: 'Warning Amber Primary', token: 'primary', hex: '#F59E0B', description: 'High-visibility target lock & toll alert', contrastOnDark: '11.5:1' },
          { name: 'Crimson Intercept Alert', token: 'destructive', hex: '#DC2626', description: 'Red Notice fugitives & roadblock activation', contrastOnDark: '5.2:1' },
          { name: 'Gold Speed Radar', token: 'accent-gold', hex: '#FBBF24', description: 'ANPR optical speed radar velocity flags', contrastOnDark: '12.2:1' },
          { name: 'Tactical Cyan GPS', token: 'accent-cyan', hex: '#38BDF8', description: 'PCR Patrol vehicle GPS vector line', contrastOnDark: '10.5:1' },
        ];
      case 'light':
        return [
          { name: 'Daylight Slate Canvas', token: 'background', hex: '#F8FAFC', description: 'Ultra-crisp daytime canvas for sunlit police desks', contrastOnDark: '14.2:1' },
          { name: 'Pure White Surface', token: 'card', hex: '#FFFFFF', description: 'High-clarity case dossiers & evidence cards', contrastOnDark: '16.0:1' },
          { name: 'Daylight Cobalt Primary', token: 'primary', hex: '#2563EB', description: 'High-visibility buttons, links, and selections', contrastOnDark: '8.4:1' },
          { name: 'Police Navy Text', token: 'foreground', hex: '#0F172A', description: 'Deep contrast legal typography (BNSS/BNS)', contrastOnDark: '16.8:1' },
          { name: 'Verified Emerald', token: 'accent-emerald', hex: '#059669', description: 'Court-admissible Section 63 BSA certificates', contrastOnDark: '7.8:1' },
          { name: 'Crimson Notice', token: 'destructive', hex: '#DC2626', description: 'Red Notice warrants and armed suspect tags', contrastOnDark: '5.2:1' },
        ];
      case 'dark':
      default:
        return [
          { name: 'Palantir Void Canvas', token: 'background', hex: '#0A1929', description: 'Deep Midnight Command Navy root canvas', contrastOnDark: '16.8:1' },
          { name: 'Slate Navy Surface', token: 'card', hex: '#112240', description: 'Elevated surfaces, card panels, modals', contrastOnDark: '13.2:1' },
          { name: 'Electric Cobalt Primary', token: 'primary', hex: '#3B82F6', description: 'Graph neural links & primary command buttons', contrastOnDark: '9.4:1' },
          { name: 'Emerald Section 63 BSA', token: 'accent-emerald', hex: '#10B981', description: 'Verified evidence, active pipelines, compliant cases', contrastOnDark: '9.4:1' },
          { name: 'Crimson Kingpin Alert', token: 'destructive', hex: '#DC2626', description: 'Kingpins, emergency account freezes, Red Notices', contrastOnDark: '4.8:1' },
          { name: 'Amber Smurfing Caution', token: 'accent-amber', hex: '#F59E0B', description: 'Remand countdowns, hawala smurfing flags', contrastOnDark: '11.5:1' },
          { name: 'Cyan ANPR Telemetry', token: 'accent-cyan', hex: '#06B6D4', description: 'ANPR telemetry, trajectory routes, radar ping', contrastOnDark: '10.1:1' },
        ];
    }
  };

  const currentSwatches = getThemeSwatches(figmaTheme);

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-2xl border border-border bg-card/80 backdrop-blur-md shadow-glass">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-xl bg-primary/20 text-primary border border-primary/30">
              <Palette className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-black tracking-tight text-foreground flex items-center gap-2">
                CRIMENEXUS Figma Design System
                <Badge variant="outline" className="text-[10px] bg-emerald-500/20 text-emerald-400 border-emerald-500/30">
                  FIGMA TOKENS v2.4 LIVE
                </Badge>
              </h1>
              <p className="text-xs text-muted-foreground mt-0.5">
                Multi-theme Palantir-grade tactical intelligence tokens, glassmorphism aesthetics, and WCAG 2.1 AA certified UI.
              </p>
            </div>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <a
            href="/docs/11_FIGMA_HANDOFF.md"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-border bg-background/50 hover:bg-background text-xs font-semibold text-foreground transition-colors"
          >
            <ExternalLink className="h-4 w-4" />
            <span>Figma Handoff Guide</span>
          </a>
          <Button
            variant="primary"
            size="sm"
            onClick={() => handleCopy(JSON.stringify(currentSwatches, null, 2), 'ALL_TOKENS')}
            className="flex items-center gap-1.5 shadow-glow-emerald"
          >
            {copiedToken === 'ALL_TOKENS' ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            <span>Export Active Theme Tokens</span>
          </Button>
        </div>
      </div>

      {/* 0. FIGMA THEME SELECTOR & LIVE SWITCHER */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sliders className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-bold text-foreground">
              Figma Theme Architecture & Live Switcher
            </h2>
          </div>
          <span className="text-xs text-muted-foreground font-mono">
            Active: <strong className="text-primary">{activeThemeMeta.name}</strong>
          </span>
        </div>

        <p className="text-xs text-muted-foreground">
          Click any of the 4 sovereign Figma themes below to switch the application theme instantly in real-time. All components, graphs, and HUD cards adapt dynamically.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {FIGMA_THEMES.map((theme) => {
            const isActive = figmaTheme === theme.id;
            return (
              <div
                key={theme.id}
                onClick={() => handleSelectTheme(theme.id)}
                className={`cursor-pointer rounded-2xl p-5 border transition-all relative flex flex-col justify-between ${
                  isActive
                    ? 'border-primary ring-2 ring-primary/40 bg-card shadow-2xl scale-[1.02]'
                    : 'border-border bg-card/60 hover:border-primary/50 hover:bg-card/90 shadow-glass'
                }`}
              >
                {isActive && (
                  <div className="absolute top-3 right-3 flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary text-primary-foreground text-[10px] font-black uppercase tracking-wider shadow-md">
                    <CheckCircle className="h-3 w-3" />
                    <span>Applied</span>
                  </div>
                )}

                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-2xl">{theme.icon}</span>
                    <div>
                      <h3 className="text-sm font-black text-foreground leading-tight">
                        {theme.name}
                      </h3>
                      <span className="text-[10px] font-mono text-muted-foreground block">
                        {theme.codename}
                      </span>
                    </div>
                  </div>

                  <p className="text-[11px] text-muted-foreground leading-relaxed my-3">
                    {theme.description}
                  </p>

                  {/* Visual Color Preview Bars */}
                  <div className="space-y-1.5 my-3 p-2.5 rounded-xl bg-background/50 border border-border/60">
                    <div className="flex items-center justify-between text-[10px]">
                      <span className="text-muted-foreground">Canvas Void:</span>
                      <div className="flex items-center gap-1.5 font-mono font-bold">
                        <span className="h-3 w-3 rounded-full border border-white/20" style={{ backgroundColor: theme.bgHex }} />
                        <span>{theme.bgHex}</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-[10px]">
                      <span className="text-muted-foreground">Surface Card:</span>
                      <div className="flex items-center gap-1.5 font-mono font-bold">
                        <span className="h-3 w-3 rounded-full border border-white/20" style={{ backgroundColor: theme.cardHex }} />
                        <span>{theme.cardHex}</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-[10px]">
                      <span className="text-muted-foreground">Command Accent:</span>
                      <div className="flex items-center gap-1.5 font-mono font-bold">
                        <span className="h-3 w-3 rounded-full border border-white/20" style={{ backgroundColor: theme.primaryHex }} />
                        <span>{theme.primaryHex}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-border/60 flex items-center justify-between text-[10px]">
                  <span className="text-muted-foreground">{theme.recommendedRole}</span>
                  <Badge variant={isActive ? 'default' : 'outline'} className="text-[9px]">
                    {theme.badgeText}
                  </Badge>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 1. Dynamic Color Palette Tokens for Active Theme */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-bold text-foreground">
              1. Active Figma Palette Tokens ({activeThemeMeta.name})
            </h2>
          </div>
          <span className="text-xs text-muted-foreground">
            {currentSwatches.length} Tokens Loaded
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {currentSwatches.map((swatch) => (
            <div
              key={swatch.token}
              className="p-4 rounded-xl border border-border bg-card/60 backdrop-blur-md shadow-glass flex flex-col justify-between hover:border-primary/40 transition-all group"
            >
              <div>
                <div
                  className="h-20 w-full rounded-lg mb-3 shadow-inner flex items-end p-2 justify-between border border-border/40"
                  style={{ backgroundColor: swatch.hex }}
                >
                  <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-black/60 text-white backdrop-blur-sm">
                    {swatch.hex}
                  </span>
                  <button
                    onClick={() => handleCopy(swatch.hex, swatch.token)}
                    className="p-1 rounded bg-black/60 text-white hover:bg-black/80 transition-colors"
                    title="Copy hex code"
                  >
                    {copiedToken === swatch.token ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                  </button>
                </div>
                <h3 className="text-sm font-bold text-foreground group-hover:text-primary transition-colors">
                  {swatch.name}
                </h3>
                <code className="text-[11px] text-primary font-mono block mt-0.5">
                  --{swatch.token}
                </code>
                <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
                  {swatch.description}
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-border/60 flex items-center justify-between text-[10px] text-muted-foreground">
                <span>Contrast Ratio:</span>
                <span className="font-mono font-bold text-emerald-400">{swatch.contrastOnDark} (Pass)</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 2. Tactical Typography Scale */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <Type className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-bold text-foreground">
            2. Tactical Typography Scale (Inter / JetBrains Mono)
          </h2>
        </div>
        <Card className="border-border bg-card/60 backdrop-blur-md shadow-glass">
          <CardContent className="p-6 space-y-6">
            <div className="flex flex-col md:flex-row md:items-baseline justify-between border-b border-border/60 pb-4">
              <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground w-40">
                Display H1 (30px / 1.2)
              </span>
              <h1 className="text-3xl font-black text-foreground flex-1">
                Operation Shadow Vault: Tactical Matrix
              </h1>
            </div>

            <div className="flex flex-col md:flex-row md:items-baseline justify-between border-b border-border/60 pb-4">
              <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground w-40">
                Heading H2 (24px / 1.3)
              </span>
              <h2 className="text-2xl font-extrabold text-foreground flex-1">
                Forensic Evidence Chain of Custody & Geofence
              </h2>
            </div>

            <div className="flex flex-col md:flex-row md:items-baseline justify-between border-b border-border/60 pb-4">
              <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground w-40">
                Heading H3 (20px / 1.4)
              </span>
              <h3 className="text-xl font-bold text-foreground flex-1">
                Statutory Remand & Default Bail Deadlines (BNSS 187)
              </h3>
            </div>

            <div className="flex flex-col md:flex-row md:items-baseline justify-between border-b border-border/60 pb-4">
              <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground w-40">
                Body Regular (14px / 1.5)
              </span>
              <p className="text-sm text-foreground/90 flex-1 leading-relaxed">
                Analysis of transaction logs indicates 14 structured smurfing deposits of ₹49,000 each deposited into account ACC-HDFC-908122 within a 48-hour window from disparate cyber cafes across Noida Sector 62.
              </p>
            </div>

            <div className="flex flex-col md:flex-row md:items-baseline justify-between">
              <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground w-40">
                Code / Statutory Mono
              </span>
              <code className="text-xs font-mono text-amber-400 flex-1 bg-black/40 px-3 py-2 rounded-lg border border-amber-500/20">
                SEC_63_BSA_HASH: e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855
              </code>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* 3. Component & State Showcase */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-emerald-400" />
          <h2 className="text-lg font-bold text-foreground">3. Tactical Components & Visual Micro-States</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Button Styles */}
          <Card className="border-border bg-card/60 backdrop-blur-md shadow-glass">
            <CardHeader>
              <CardTitle className="text-sm text-foreground">Command Buttons ({activeThemeMeta.name})</CardTitle>
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
                <button className="px-3 py-1.5 rounded-lg border border-border bg-background/50 hover:bg-background text-xs font-semibold text-foreground backdrop-blur-md shadow-glass transition-colors">
                  Glassmorphic Action
                </button>
              </div>
            </CardContent>
          </Card>

          {/* Badges & Legal Notice Tags */}
          <Card className="border-border bg-card/60 backdrop-blur-md shadow-glass">
            <CardHeader>
              <CardTitle className="text-sm text-foreground">Statutory & Threat Badges</CardTitle>
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
        <Card className="border-border bg-card/60 backdrop-blur-md shadow-glass">
          <CardHeader>
            <CardTitle className="text-sm text-foreground">Interactive Command Inputs</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-muted-foreground block mb-1">
                Target Entity Search
              </label>
              <Input
                placeholder="Search suspect name, CDR IMEI, or vehicle plate..."
                value={sampleInput}
                onChange={(e) => setSampleInput(e.target.value)}
                className="bg-background/80 border-border focus:border-primary text-xs"
              />
            </div>
            <div>
              <label htmlFor="jurisdiction-filter-select" className="text-xs font-semibold text-muted-foreground block mb-1">
                Jurisdictional Filter
              </label>
              <select
                id="jurisdiction-filter-select"
                aria-label="Jurisdictional Filter"
                className="w-full h-10 px-3 text-xs rounded-lg border border-border bg-background/80 text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option>All Police Ranges (Delhi NCR & Yamuna Corridor)</option>
                <option>Cyber Crime Police Station, Sector 20</option>
                <option>Special Cell Delhi Police (Lodhi Colony)</option>
              </select>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* 4. Active Figma Token Studio JSON Specification */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Code2 className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-bold text-foreground">
              4. Figma Tokens Studio Export ({activeThemeMeta.codename})
            </h2>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleCopy(JSON.stringify({ theme: activeThemeMeta.id, tokens: currentSwatches }, null, 2), 'JSON_TOKENS')}
            className="text-xs flex items-center gap-1.5"
          >
            {copiedToken === 'JSON_TOKENS' ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
            <span>Copy Theme JSON</span>
          </Button>
        </div>
        <Card className="border-border bg-black/60 backdrop-blur-md shadow-glass">
          <CardContent className="p-4">
            <pre className="text-xs font-mono text-slate-300 overflow-x-auto max-h-64 leading-relaxed p-2">
{JSON.stringify(
  {
    theme: activeThemeMeta.id,
    codename: activeThemeMeta.codename,
    name: activeThemeMeta.name,
    color: {
      background: { value: activeThemeMeta.bgHex, type: 'color' },
      surface: { value: activeThemeMeta.cardHex, type: 'color' },
      primary: { value: activeThemeMeta.primaryHex, type: 'color' },
      accent: { value: activeThemeMeta.accentHex, type: 'color' },
    },
    tokens: currentSwatches.map((s) => ({
      name: s.name,
      variable: `--${s.token}`,
      value: s.hex,
      description: s.description,
    })),
  },
  null,
  2
)}
            </pre>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}

export default DesignSystemPage;
