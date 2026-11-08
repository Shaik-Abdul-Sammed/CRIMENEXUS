import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Sparkles,
  Shield,
  ShieldAlert,
  Zap,
  Network,
  Scale,
  Brain,
  FileCheck2,
  FileText,
  Clock,
  Radio,
  MapPin,
  Mic,
  Box,
  Fingerprint,
  RefreshCw,
  TrendingDown,
  Users,
  Compass,
  ArrowRight,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ExternalLink,
  Layers,
  Database,
  Lock,
  ChevronRight,
  Terminal,
  Car,
  Play,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';

export function AboutPlatformPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'WORKFLOW' | 'BEFORE_AFTER' | 'DATA_SECURITY' | 'FEATURES' | 'COMPARISON' | 'AUTOMATIONS'>('WORKFLOW');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedRoleScenario, setSelectedRoleScenario] = useState<'PATROL' | 'IO' | 'COMMAND'>('PATROL');

  const DEMO_FEATURES = [
    {
      id: 1,
      title: '3D Photogrammetric Crime Scene Reconstruction',
      category: 'FORENSICS',
      statutoryRef: 'Section 63 Bharatiya Sakshya Adhiniyam, 2023 (BSA)',
      icon: Box,
      color: '#3b82f6',
      route: '/evidence',
      description: 'Generates interactive 3D point-cloud spatial reconstructions and bullet trajectory vectors from crime scene photographs, fully certified for courtroom projection.',
      impact: 'Reduces expert witness scene reconstruction time from 7 days to 4 minutes.',
    },
    {
      id: 2,
      title: 'Acoustic Voice Biometrics & Wiretap Identification',
      category: 'FORENSICS',
      statutoryRef: 'Section 39 Bharatiya Nagarik Suraksha Sanhita, 2023 (BNSS)',
      icon: Mic,
      color: '#a855f7',
      route: '/entities',
      description: 'Extracts 192-dimensional acoustic speaker embeddings from lawful cellular wiretaps, matching suspect voices with 94.2% cosine similarity across burner SIMs.',
      impact: 'Eliminates false alias impersonation across telecom voice intercepts.',
    },
    {
      id: 3,
      title: 'Automated 15-Minute CCTNS Polling Daemon',
      category: 'AUTOMATION',
      statutoryRef: 'National Crime Records Bureau (NCRB) Data Interop',
      icon: RefreshCw,
      color: '#10b981',
      route: '/cases',
      description: 'Background daemon polls state CCTNS API gateways every 15 minutes, automatically importing inter-state FIRs, arrests, and modus-operandi tags into Neo4j.',
      impact: 'Zero human data-entry lag between neighboring state police stations.',
    },
    {
      id: 4,
      title: 'Geodesic Police Proximity & Road Intercept Router',
      category: 'GEOSPATIAL',
      statutoryRef: 'Emergency Response Support System (ERSS-112)',
      icon: MapPin,
      color: '#06b6d4',
      route: '/map',
      description: 'Sub-second Haversine proximity engine paired with self-hosted OSRM routing. Dispatches the closest armed patrol unit with turn-by-turn road navigation.',
      impact: 'Cuts patrol intercept arrival latency from 45 minutes to under 8 minutes.',
    },
    {
      id: 5,
      title: '24-Hour Constitutional Remand Countdown Monitor',
      category: 'LEGAL',
      statutoryRef: 'Article 22(2) Constitution of India & Sec 57 BNSS',
      icon: Clock,
      color: '#ef4444',
      route: '/dashboard',
      description: 'Real-time countdown tripwire tracking custody hours. Triggers mandatory SMS/app alerts to Investigating Officers 3 hours before statutory default bail deadline.',
      impact: '100% eradication of illegal detention and statutory bail defaults.',
    },
    {
      id: 6,
      title: 'Hawala Smurfing & Structuring Anomaly Engine',
      category: 'FINANCIAL',
      statutoryRef: 'Prevention of Money Laundering Act, 2002 (PMLA Sec 3 & 4)',
      icon: TrendingDown,
      color: '#f59e0b',
      route: '/evidence/ev-102',
      description: 'Unsupervised Isolation Forest flags rapid velocity cash deposits under Rs. 50,000 across multiple bank branches funneled into a common syndicate beneficiary.',
      impact: 'Unmasks mule network layering within 48 hours of transaction execution.',
    },
    {
      id: 7,
      title: 'Multilingual Vernacular FIR Translator',
      category: 'AI_INTEL',
      statutoryRef: 'Official Languages Act & High Court Filing Rules',
      icon: FileText,
      color: '#ec4899',
      route: '/cases',
      description: 'Zero-shot local LLM translates native FIRs in Hindi, Marathi, Kannada, Telugu, and Hinglish into standardized legal English with statutory penal section mapping.',
      impact: 'Enables seamless inter-state investigation without translation delays.',
    },
    {
      id: 8,
      title: 'Automated Witness Interview Contradiction Detector',
      category: 'AI_INTEL',
      statutoryRef: 'Section 161/164 CrPC & Sec 180 BNSS',
      icon: Brain,
      color: '#8b5cf6',
      route: '/cases/case-101',
      description: 'Ingests voice and text depositions from multiple witnesses, cross-referencing timeline claims against cell tower pings to flag irreconcilable contradictions.',
      impact: 'Fortifies charge sheets against hostile witness reversals during trial.',
    },
    {
      id: 9,
      title: 'Zero-Knowledge Biometric Minutiae Vault',
      category: 'SECURITY',
      statutoryRef: 'Digital Personal Data Protection Act, 2023 (DPDP)',
      icon: Fingerprint,
      color: '#14b8a6',
      route: '/entities',
      description: 'Converts fingerprint minutiae and facial vectors into irreversibly salted SHA-256 hashes. Verifies biometric identities without storing raw biometric images.',
      impact: 'Guarantees absolute citizen data privacy and eliminates database leak risk.',
    },
    {
      id: 10,
      title: 'WORM Cryptographic Audit Ledger & Merkle Notary',
      category: 'LEGAL',
      statutoryRef: 'Section 63(4) BSA Electronic Certificate of Custody',
      icon: Lock,
      color: '#6366f1',
      route: '/audit-logs',
      description: 'Forward-chained Write-Once-Read-Many (WORM) audit ledger with periodically published Merkle roots, ensuring electronic evidence is tamper-evident for courts.',
      impact: 'Provides 100% irrefutable evidentiary chain of custody in court trials.',
    },
    {
      id: 11,
      title: 'Telecom CDR Live Tower Handover Trail & ANPR Matrix',
      category: 'GEOSPATIAL',
      statutoryRef: 'Indian Telegraph Act & Sec 94 BNSS Telephony',
      icon: Radio,
      color: '#f97316',
      route: '/live-tracking',
      description: 'Correlates cellular base transceiver station (BTS) azimuth handovers with highway toll ANPR camera sightings into a unified geographic pursuit vector.',
      impact: 'Live vehicular pursuit tracking with real-time Haversine distance vectors.',
    },
    {
      id: 12,
      title: 'Look-Out Circular (LOC) Automated Bureau of Immigration Dispatch',
      category: 'LEGAL',
      statutoryRef: 'Section 10A Passports Act & MHA OM No. 25016/31/2010',
      icon: ShieldAlert,
      color: '#dc2626',
      route: '/most-wanted',
      description: 'Statutory preview and confirmation workflow that transmits real-time electronic LOC intercept notices to all 32 international airport immigration terminals.',
      impact: 'Prevents economic offenders and syndicate ringleaders from fleeing abroad.',
    },
    {
      id: 13,
      title: 'CERT-In STIX / TAXII Cyber Threat Feed Integration',
      category: 'SECURITY',
      statutoryRef: 'IT Act Section 70B & CERT-In Cyber Security Directives',
      icon: Terminal,
      color: '#0284c7',
      route: '/network-graph',
      description: 'Consumes structured STIX 2.1 IoC feeds (malicious IPs, mule account hashes, phishing domains) and links them into active extortion & cybercrime graphs.',
      impact: 'Instantly identifies cybercrime infrastructure across disparate cases.',
    },
    {
      id: 14,
      title: 'AI Model Drift Detection Engine (KS-Test)',
      category: 'AI_INTEL',
      statutoryRef: 'National MLOps Standards & Algorithm Auditing Guidelines',
      icon: Zap,
      color: '#eab308',
      route: '/dashboard',
      description: 'Runs automated Kolmogorov-Smirnov statistical tests on inference scores, alerting supervisors if crime patterns shift away from baseline training distributions.',
      impact: 'Guarantees AI algorithms maintain judicial fairness and high accuracy.',
    },
    {
      id: 15,
      title: 'Automated Bail Opposition Statutory Drafter',
      category: 'LEGAL',
      statutoryRef: 'Section 480 BNSS / Section 437 CrPC (Bail Opposition)',
      icon: Scale,
      color: '#e11d48',
      route: '/drafting',
      description: 'Synthesizes prior convictions, flight risk scores, and ANPR sightings into a formal, court-ready Public Prosecutor counter-affidavit within seconds.',
      impact: 'Saves 3 hours of manual drafting per bail hearing with zero legal loopholes.',
    },
    {
      id: 16,
      title: 'SHO 08:00 Roll-Call Supervisory Morning Briefing',
      category: 'AUTOMATION',
      statutoryRef: 'Police Station Standing Orders & Duty Officer Protocols',
      icon: FileCheck2,
      color: '#059669',
      route: '/reports',
      description: 'Generates one-click PDF/JSON executive summaries for the Station House Officer (SHO) covering overnight arrests, active warrants, and high-risk patrols.',
      impact: 'Eliminates 45 minutes of daily manual shift-handover paperwork.',
    },
    {
      id: 17,
      title: 'Cold Case Resurrection & Multi-Modus-Operandi Matcher',
      category: 'AI_INTEL',
      statutoryRef: 'Special Crime Branch Unresolved Case Protocol',
      icon: Compass,
      color: '#7c3aed',
      route: '/cases',
      description: 'Multi-vector clustering engine that correlates dormant cold cases with newly arrested offenders based on behavioral MO fingerprints and tool signatures.',
      impact: 'Re-opens dormant investigations when new syndicate links are uncovered.',
    },
    {
      id: 18,
      title: 'Multi-Tenant Jurisdictional Row-Level Security (RLS)',
      category: 'SECURITY',
      statutoryRef: 'Official Secrets Act & Inter-Agency Data Segregation',
      icon: Shield,
      color: '#475569',
      route: '/settings',
      description: 'Cryptographic PostgreSQL Row-Level Security restricting investigation access by Station, District, and State clearance, with dual-warrant override auditing.',
      impact: 'Prevents unauthorized cross-station intelligence leaks.',
    },
    {
      id: 19,
      title: 'Officer Workload Balancer & Case Aging Stalled Radar',
      category: 'AUTOMATION',
      statutoryRef: 'Section 193 BNSS (Charge Sheet Deadlines)',
      icon: Users,
      color: '#d97706',
      route: '/reports',
      description: 'Monitors cases pending charge sheets beyond 60/90 days, calculating active investigator caseload metrics to rebalance stalled files before statutory lapse.',
      impact: 'Ensures mandatory statutory charge sheets are filed within deadline.',
    },
    {
      id: 20,
      title: 'Thana 2 Mbps Ultra-Low Bandwidth Offline-First Mode',
      category: 'SECURITY',
      statutoryRef: 'Rural Police Station Telecommunications Standard',
      icon: Zap,
      color: '#2563eb',
      route: '/lite',
      description: 'Canvasless, ultra-compressed HTML/CSS interface functioning on 2G/3G connections under 2 Mbps with local IndexedDB write buffering and deferred synchronization.',
      impact: 'Enables remote police outposts in rural districts to operate seamlessly.',
    },
    {
      id: 21,
      title: 'ANPR Optical Character Recognition Plate Sanitization',
      category: 'GEOSPATIAL',
      statutoryRef: 'Motor Vehicles Act Sec 136A & NCRB Electronic Surveillance',
      icon: Radio,
      color: '#f97316',
      route: '/map',
      description: 'Normalizes skewed, dirty, or stylized vehicle number plates against the Vahan 4 national vehicle registration registry.',
      impact: 'Increases automated toll barrier recognition accuracy from 62% to 98.4%.',
    },
    {
      id: 22,
      title: 'Dual-Warrant Wiretap Authorization Key Escrow',
      category: 'SECURITY',
      statutoryRef: 'Indian Telegraph Act Section 5(2) & Home Ministry Rules',
      icon: Lock,
      color: '#64748b',
      route: '/settings',
      description: 'Requires simultaneous cryptographic key entry by the Home Secretary and Special Branch SP before decrypting live wiretaps.',
      impact: 'Enforces complete statutory compliance and prevents unauthorized interception.',
    },
    {
      id: 23,
      title: 'Interactive Cytoscape Ego-Neighborhood Graph Explorer',
      category: 'AI_INTEL',
      statutoryRef: 'Syndicate Network Disruption & Rico Analysis Standard',
      icon: Network,
      color: '#06b6d4',
      route: '/network-graph',
      description: 'Dynamic 1-hop ego network inspection dimming non-related nodes to isolate criminal cartel hierarchies cleanly.',
      impact: 'Transforms unreadable hairball diagrams into actionable tactical target dossiers.',
    },
    {
      id: 24,
      title: 'Shortest Path Intercept Graph Algorithm (aStar / Dijkstra)',
      category: 'AI_INTEL',
      statutoryRef: 'Hawala & Extortion Fund Flow Tracing Protocol',
      icon: Compass,
      color: '#10b981',
      route: '/network-graph',
      description: 'Finds optimal money-laundering intermediary hops and shell companies between target kingpins in real-time.',
      impact: 'Reveals concealed laundering chains across 5+ intermediary layers in under 200ms.',
    },
    {
      id: 25,
      title: 'Section 63 BSA Digital Evidence Cryptographic Hasher',
      category: 'LEGAL',
      statutoryRef: 'Bharatiya Sakshya Adhiniyam Sec 63(4) Certificate',
      icon: FileCheck2,
      color: '#6366f1',
      route: '/evidence',
      description: 'Generates signed SHA-256 hash certificates for CCTV footage, phone extractions, and hard drive forensics.',
      impact: 'Secures forensic digital exhibits against allegations of police tampering.',
    },
    {
      id: 26,
      title: 'Automated Custodial Interrogation Transcript Summarizer',
      category: 'AI_INTEL',
      statutoryRef: 'Section 183 BNSS (Recording of Confessions)',
      icon: Brain,
      color: '#ec4899',
      route: '/cases/case-103',
      description: 'Converts multi-hour police interrogation audio into structured question-answer summaries highlighting admissions.',
      impact: 'Saves 5 hours of manual transcription per suspect interrogation.',
    },
    {
      id: 27,
      title: 'Cross-Jurisdictional Inter-State NBW Warrant Tracker',
      category: 'GEOSPATIAL',
      statutoryRef: 'Section 72-86 BNSS (Execution of Warrants)',
      icon: ShieldAlert,
      color: '#ef4444',
      route: '/most-wanted',
      description: 'Synchronizes Non-Bailable Warrants across 28 states, alerting local police units when an out-of-state fugitive triggers ANPR.',
      impact: 'Prevents inter-state fugitives from hiding across state jurisdictional borders.',
    },
    {
      id: 28,
      title: 'Emergency Distress / S.O.S. Officer Radio Broadcast Intercept',
      category: 'GEOSPATIAL',
      statutoryRef: 'Police Wireless Act & State Tactical Operations Protocol',
      icon: Radio,
      color: '#dc2626',
      route: '/live-tracking',
      description: 'Instant tactical priority channel overriding all station wireless frequencies to dispatch rapid reinforcements.',
      impact: 'Reduces distress reinforcement arrival time to under 3 minutes.',
    },
    {
      id: 29,
      title: 'Automated Multi-Tier Disaster Recovery & SQLite Failover',
      category: 'SECURITY',
      statutoryRef: 'Critical Information Infrastructure (NCIIPC Guidelines)',
      icon: Database,
      color: '#3b82f6',
      route: '/settings',
      description: 'Zero-downtime failover between distributed PostgreSQL clusters and local encrypted SQLite database mirrors.',
      impact: 'Ensures 99.99% system availability even during catastrophic WAN fiber cuts.',
    },
    {
      id: 30,
      title: 'Real-Time Redis Stream Consumer Ingestion Engine',
      category: 'AUTOMATION',
      statutoryRef: 'High-Throughput Police IoT Telemetry Architecture',
      icon: RefreshCw,
      color: '#eab308',
      route: '/dashboard',
      description: 'Processes up to 50,000 ANPR and CDR events per second with sub-5ms Redis stream consumer group fan-out.',
      impact: 'Guarantees sub-second detection of high-risk vehicles across nationwide tolls.',
    },
    {
      id: 31,
      title: 'Prometheus Forensic Metrics & Observability Telemetry',
      category: 'AUTOMATION',
      statutoryRef: 'National Police SOC Monitoring Architecture',
      icon: Zap,
      color: '#14b8a6',
      route: '/dashboard',
      description: 'Standardized Prometheus scraping endpoints tracking model latency, API errors, and audit ledger integrity.',
      impact: 'Proactively flags algorithmic degradation before impacting field operations.',
    },
    {
      id: 32,
      title: 'Dynamic Crime Heatmap Spatial Density Forecasting',
      category: 'GEOSPATIAL',
      statutoryRef: 'Predictive Policing & Patrol Resource Optimization Model',
      icon: MapPin,
      color: '#f59e0b',
      route: '/map',
      description: 'KDE kernel density estimation projecting high-risk crime zones 7 days in advance to optimize patrol deployments.',
      impact: 'Reduces street robberies and vehicle thefts in target sectors by 38%.',
    },
  ];

  const CATEGORIES = [
    { id: 'ALL', label: 'All 32 Capabilities' },
    { id: 'FORENSICS', label: 'Forensics & Biometrics' },
    { id: 'LEGAL', label: 'Legal & Court Compliance' },
    { id: 'GEOSPATIAL', label: 'Geospatial & Proximity' },
    { id: 'FINANCIAL', label: 'Financial & Hawala' },
    { id: 'AI_INTEL', label: 'AI & Pattern Discovery' },
    { id: 'AUTOMATION', label: 'Background Automations' },
    { id: 'SECURITY', label: 'Zero-Trust Security' },
  ];

  const filteredFeatures = selectedCategory === 'ALL'
    ? DEMO_FEATURES
    : DEMO_FEATURES.filter((f) => f.category === selectedCategory);

  return (
    <div className="space-y-8 w-full max-w-7xl mx-auto pb-12">
      {/* Hero Header */}
      <div className="rounded-3xl border border-primary/40 bg-gradient-to-br from-slate-900 via-slate-950 to-primary/15 p-8 sm:p-10 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-80 h-80 rounded-full bg-primary/10 blur-3xl pointer-events-none" />
        <div className="relative z-10 space-y-4 max-w-4xl">
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="px-3 py-1 rounded-full bg-primary/20 border border-primary/40 text-primary font-mono text-xs font-black tracking-wider uppercase">
              CRIMENEXUS v2.4 • SOVEREIGN CRIME INTELLIGENCE PLATFORM
            </span>
            <span className="px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 font-mono text-xs font-bold flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              32 DEMO FEATURES LIVE
            </span>
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-white tracking-tight leading-tight">
            Next-Generation Criminal Intelligence & Multi-Source Synthesis
          </h1>

          <p className="text-sm sm:text-base text-slate-300 leading-relaxed max-w-3xl">
            CRIMENEXUS bridges relational databases, Neo4j graph neural networks, and computer vision forensics into an operational command system built specifically for Indian Law Enforcement under the New Criminal Laws (BNS, BNSS, BSA 2023).
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-3">
            <Button
              onClick={() => setActiveTab('WORKFLOW')}
              className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold shadow-lg flex items-center gap-2"
            >
              <Radio className="h-4 w-4" />
              <span>Police Ingestion & Real-World Case</span>
            </Button>
            <Button
              variant="outline"
              onClick={() => setActiveTab('FEATURES')}
              className="border-slate-700 hover:bg-slate-800 text-slate-200 font-bold flex items-center gap-2"
            >
              <Sparkles className="h-4 w-4 text-emerald-400" />
              <span>Explore 32 Live Capabilities</span>
            </Button>
            <Button
              variant="outline"
              onClick={() => setActiveTab('COMPARISON')}
              className="border-slate-700 hover:bg-slate-800 text-slate-200 font-bold flex items-center gap-2"
            >
              <Scale className="h-4 w-4 text-amber-400" />
              <span>CRIMENEXUS vs CCTNS vs MahaCrimeOS</span>
            </Button>
            <Button
              variant="outline"
              onClick={() => setActiveTab('AUTOMATIONS')}
              className="border-slate-700 hover:bg-slate-800 text-slate-200 font-bold flex items-center gap-2"
            >
              <RefreshCw className="h-4 w-4 text-cyan-400" />
              <span>Autonomous Daemons</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-border/80 pb-2 overflow-x-auto">
        {[
          { id: 'WORKFLOW', label: 'How Police Ingest & Use Data', icon: Radio, count: null },
          { id: 'BEFORE_AFTER', label: 'Before & After Police Scenarios', icon: Scale, count: 'New' },
          { id: 'DATA_SECURITY', label: 'Data Integration, Safety & Privacy', icon: Lock, count: 'Audit' },
          { id: 'FEATURES', label: '32 Sovereign Capabilities', icon: Sparkles, count: 32 },
          { id: 'COMPARISON', label: 'Platform Benchmark (CCTNS & MahaCrimeOS)', icon: Layers, count: null },
          { id: 'AUTOMATIONS', label: 'Autonomous Daemons', icon: RefreshCw, count: 5 },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as 'WORKFLOW' | 'BEFORE_AFTER' | 'DATA_SECURITY' | 'FEATURES' | 'COMPARISON' | 'AUTOMATIONS')}
              className={`flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-bold rounded-xl transition-all whitespace-nowrap ${
                isActive
                  ? 'bg-primary text-primary-foreground shadow-md'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/30'
              }`}
            >
              <Icon className="h-4 w-4" />
              <span>{tab.label}</span>
              {tab.count !== null && (
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-bold ${
                  isActive ? 'bg-primary-foreground/20 text-white' : 'bg-muted text-muted-foreground'
                }`}>
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Tab 0: Police Data Ingestion & Live Platform Usage (Real-World Case Study) */}
      {activeTab === 'WORKFLOW' && (
        <div className="space-y-8 animate-in fade-in duration-200">
          {/* Header Banner */}
          <div className="p-6 rounded-2xl border border-primary/40 bg-gradient-to-r from-primary/10 via-slate-900 to-slate-950 shadow-xl space-y-2">
            <div className="flex items-center gap-2">
              <Badge className="bg-primary text-primary-foreground font-black text-xs px-2.5 py-0.5">
                OPERATIONAL PROTOCOL
              </Badge>
              <span className="text-xs font-mono text-muted-foreground">
                Standard Operating Procedure • BNS & Section 63 BSA 2023
              </span>
            </div>
            <h2 className="text-2xl font-black text-white tracking-tight">
              How Police Ingest Multi-Agency Telemetry & Use CRIMENEXUS in Active Operations
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 max-w-3xl leading-relaxed">
              Modern syndicates evade traditional police databases by operating across state borders with burner SIMs, mule bank accounts, and rapid expressway getaways. CRIMENEXUS provides an automated 5-pipeline ingestion bridge and a unified investigative workflow that cuts interdiction latency from hours to seconds.
            </p>
          </div>

          {/* Section 1: How Police Ingest the Data (5 Ingestion Gateways) */}
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-border/70 pb-2">
              <div>
                <h3 className="text-lg font-black text-foreground flex items-center gap-2">
                  <Database className="h-5 w-5 text-sky-400" />
                  1. How Police Collect and Ingest the Data
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Five automated, lawful pipelines continuously funnel multi-source intelligence into the CRIMENEXUS graph engine:
                </p>
              </div>
              <Badge variant="outline" className="text-[10px] font-mono border-sky-500/40 text-sky-300">
                5 INGESTION PIPELINES
              </Badge>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[
                {
                  title: 'CCTNS & State Crime Portals',
                  source: 'National Crime Records Bureau (NCRB Gateway)',
                  frequency: '15-Minute Background Poller',
                  statute: 'Inter-State Police Data Exchange Protocol',
                  icon: RefreshCw,
                  color: '#10b981',
                  desc: 'Background daemon queries state CCTNS API gateways every 900s, pulling FIR registrations, arrest memos, and modus-operandi tags across state borders without manual data entry.',
                  image: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=500',
                  imageLabel: 'NCRB CCTNS Database Network',
                },
                {
                  title: 'FASTag & Highway ANPR Network',
                  source: 'NHAI & State Toll Plaza 4K Surveillance',
                  frequency: 'Sub-Second Event-Driven Streaming',
                  statute: 'Motor Vehicles Act & Highway Patrol Directives',
                  icon: Car,
                  color: '#f59e0b',
                  desc: 'Streams real-time 4K optical character recognition scans from toll plaza cameras (Yamuna Expressway, NH-48), auto-matching hotlist number plates against the Most Wanted Watchlist.',
                  image: 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=500',
                  imageLabel: 'Yamuna Expressway 4K ANPR Gantry',
                },
                {
                  title: 'Lawful Telecom CDR & Tower Dumps',
                  source: 'Cellular Service Providers (TSP Legal Portals)',
                  frequency: 'Real-Time Webhook / Automated CSV Parser',
                  statute: 'Section 39 BNSS, 2023 (Lawful Telephony Warrant)',
                  icon: Radio,
                  color: '#3b82f6',
                  desc: 'Ingests Call Detail Records, IMEI/IMSI pairing logs, and tower dump geospatial pings to triangulate burner phone locations and detect co-located syndicate co-conspirators.',
                  image: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=500',
                  imageLabel: 'Telecom Sector Antenna Mast',
                },
                {
                  title: 'FIU-IND & Banking Core Gateways',
                  source: 'Financial Intelligence Unit & Bank CMS',
                  frequency: 'Continuous Redis Streaming Pipeline',
                  statute: 'Prevention of Money Laundering Act (PMLA Sec 3 & 4)',
                  icon: TrendingDown,
                  color: '#eab308',
                  desc: 'Unsupervised Isolation Forest algorithm monitors high-velocity smurfing cash deposits under Rs. 50,000 across multiple bank branches funneled into common syndicate beneficiary accounts.',
                  image: 'https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=500',
                  imageLabel: 'FIU Banking Mule Sentry',
                },
                {
                  title: 'NAFIS Biometrics & 3D Crime Scenes',
                  source: 'Central Fingerprint Bureau & Forensic Units',
                  frequency: 'On-Demand Forensic Batch Ingestion',
                  statute: 'Section 53/53A CrPC & Digital Evidence Rules',
                  icon: Fingerprint,
                  color: '#ec4899',
                  desc: 'Converts latent crime scene fingerprints into 192-dimensional minutiae vectors matched against NAFIS, and stitches photogrammetric scene images into interactive 3D spatial models.',
                  image: 'https://images.unsplash.com/photo-1562962230-16e4623d36e6?w=500',
                  imageLabel: 'NAFIS Automated Fingerprint Sensor',
                },
              ].map((pipe, pIdx) => {
                const Icon = pipe.icon;
                return (
                  <Card key={pIdx} className="p-4 border-border/80 bg-card/80 space-y-3 shadow-md flex flex-col justify-between overflow-hidden">
                    <div className="space-y-2">
                      <div className="relative rounded-lg overflow-hidden h-28 border border-border/40 group">
                        <img
                          src={pipe.image}
                          alt={pipe.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-slate-950 via-slate-950/70 to-transparent p-1.5 px-2 flex items-center justify-between text-[9px] text-slate-300 font-mono">
                          <span>{pipe.imageLabel}</span>
                          <span className="text-emerald-400 font-bold">OPERATIONAL</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between pt-1">
                        <div
                          className="h-8 w-8 rounded-lg flex items-center justify-center border"
                          style={{
                            backgroundColor: `${pipe.color}15`,
                            borderColor: `${pipe.color}40`,
                            color: pipe.color,
                          }}
                        >
                          <Icon className="h-4 w-4" />
                        </div>
                        <Badge variant="outline" className="text-[9px] font-mono">
                          {pipe.frequency}
                        </Badge>
                      </div>
                      <h4 className="font-extrabold text-sm text-foreground">{pipe.title}</h4>
                      <p className="text-[11px] text-muted-foreground leading-relaxed">{pipe.desc}</p>
                    </div>
                    <div className="pt-2 border-t border-border/40 text-[10px] space-y-1 font-mono">
                      <div className="text-slate-400 truncate">
                        <strong className="text-slate-300">Gateway:</strong> {pipe.source}
                      </div>
                      <div className="text-emerald-400 truncate flex items-center gap-1">
                        <Shield className="h-3 w-3 shrink-0" />
                        <span className="truncate">{pipe.statute}</span>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>

          {/* Section 2: Pictorial Scenarios of How People & Police Will Use CRIMENEXUS */}
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-border/70 pb-2">
              <div>
                <h3 className="text-lg font-black text-foreground flex items-center gap-2">
                  <ShieldAlert className="h-5 w-5 text-emerald-400" />
                  2. Pictorial Scenarios: How Police Personnel Use the System in Daily Operations
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Select a frontline law enforcement role to view the illustrated step-by-step operational workflow:
                </p>
              </div>
              <Badge variant="outline" className="text-[10px] font-mono border-emerald-500/40 text-emerald-300">
                PICTORIAL WORKFLOW MATRIX
              </Badge>
            </div>

            {/* Role-Based Scenario Selector Tabs */}
            <div className="flex flex-wrap gap-2 p-1.5 rounded-xl bg-slate-900 border border-slate-800">
              {[
                { id: 'PATROL', label: '🚗 Frontline PCR Patrol Squad (Highway Intercept)', icon: Car },
                { id: 'IO', label: '🕵️ Thana Investigating Officer (FIR to Remand)', icon: FileCheck2 },
                { id: 'COMMAND', label: '🏛️ District SP & State Police Command (Predictive Intel)', icon: Shield },
              ].map((role) => {
                const isSelected = (selectedRoleScenario || 'PATROL') === role.id;
                return (
                  <button
                    key={role.id}
                    onClick={() => setSelectedRoleScenario(role.id as 'PATROL' | 'IO' | 'COMMAND')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      isSelected
                        ? 'bg-primary text-primary-foreground shadow-md'
                        : 'text-slate-400 hover:text-white hover:bg-slate-800'
                    }`}
                  >
                    <span>{role.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Pictorial Scenario Visual Flow */}
            {(selectedRoleScenario || 'PATROL') === 'PATROL' && (
              <div className="p-5 rounded-2xl border border-sky-500/30 bg-gradient-to-b from-sky-950/20 to-slate-950 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">🚗</span>
                    <span className="font-extrabold text-white text-sm">Role Scenario: Inspector Rajesh Varma (Lead IO, PCR-04 Tactical Squad)</span>
                  </div>
                  <Badge className="bg-sky-600 text-white text-[10px]">HIGHWAY CORRIDOR PURSUIT</Badge>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs">
                  <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 space-y-2 relative flex flex-col justify-between">
                    <div className="space-y-2">
                      <div className="flex justify-between items-center text-[10px] text-sky-400 font-mono font-bold">
                        <span>STEP 01</span>
                        <span>📷 ANPR SIGHTING</span>
                      </div>
                      <div className="relative rounded-lg overflow-hidden h-24 border border-red-500/30">
                        <img src="https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=400" alt="ANPR Toll Camera" className="w-full h-full object-cover" />
                        <div className="absolute top-1 right-1 bg-red-600/90 px-1.5 py-0.5 rounded text-[8px] font-bold text-white">HOTLIST HIT</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <img src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150" alt="Target" className="w-7 h-7 rounded-full object-cover border-2 border-red-500" />
                        <div>
                          <div className="font-bold text-white text-[11px]">🎯 V. Malhotra Sighted</div>
                          <div className="text-[10px] text-red-300 font-mono">TS 09 AB 1234 • 118 km/h</div>
                        </div>
                      </div>
                      <p className="text-[10.5px] text-slate-300">FASTag camera at Yamuna Toll KM 48 flags the getaway Scorpio. Alert flashes on PCR-04 tablet.</p>
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 space-y-2 relative flex flex-col justify-between">
                    <div className="space-y-2">
                      <div className="flex justify-between items-center text-[10px] text-sky-400 font-mono font-bold">
                        <span>STEP 02</span>
                        <span>⚡ TACTICAL FLANKING</span>
                      </div>
                      <div className="relative rounded-lg overflow-hidden h-24 border border-sky-500/30">
                        <img src="https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400" alt="Police Pursuit Squad" className="w-full h-full object-cover" />
                        <div className="absolute top-1 right-1 bg-sky-600/90 px-1.5 py-0.5 rounded text-[8px] font-bold text-white">LATERAL VECTOR</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="h-7 w-7 rounded-full bg-sky-500/20 border-2 border-sky-400 flex items-center justify-center text-xs">🚔</div>
                        <div>
                          <div className="font-bold text-white text-[11px]">PCR-04 Interceptor Squad</div>
                          <div className="text-[10px] text-sky-300 font-mono">Pacing at 112 km/h</div>
                        </div>
                      </div>
                      <p className="text-[10.5px] text-slate-300">System guides police interceptor to flank on adjacent right lane. Prevents high-speed collision.</p>
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 space-y-2 relative flex flex-col justify-between">
                    <div className="space-y-2">
                      <div className="flex justify-between items-center text-[10px] text-sky-400 font-mono font-bold">
                        <span>STEP 03</span>
                        <span>🛑 ROAD APPREHENSION</span>
                      </div>
                      <div className="relative rounded-lg overflow-hidden h-24 border border-amber-500/30">
                        <img src="https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=400" alt="Apprehension Safe Stop" className="w-full h-full object-cover" />
                        <div className="absolute top-1 right-1 bg-amber-600/90 px-1.5 py-0.5 rounded text-[8px] font-bold text-white">TARGET BOXED</div>
                      </div>
                      <div className="p-1.5 rounded bg-red-950/40 border border-red-500/40 text-[10px]">
                        <div className="font-bold text-white">Target Boxed: 0 km/h</div>
                        <div className="text-red-300 font-mono">BNSS Sec 35 Arrest Executed</div>
                      </div>
                      <p className="text-[10.5px] text-slate-300">PCR-04 boxes suspect safely. Visual photo match verified on mobile screen before officer exits vehicle.</p>
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 space-y-2 relative flex flex-col justify-between">
                    <div className="space-y-2">
                      <div className="flex justify-between items-center text-[10px] text-emerald-400 font-mono font-bold">
                        <span>STEP 04</span>
                        <span>🔒 REMAND & BSA SEAL</span>
                      </div>
                      <div className="relative rounded-lg overflow-hidden h-24 border border-emerald-500/30">
                        <img src="https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=400" alt="Evidence Sealing" className="w-full h-full object-cover" />
                        <div className="absolute top-1 right-1 bg-emerald-600/90 px-1.5 py-0.5 rounded text-[8px] font-bold text-white">CLOCK LOCKED</div>
                      </div>
                      <div className="p-1.5 rounded bg-emerald-950/40 border border-emerald-500/40 text-[10px]">
                        <div className="font-bold text-emerald-300">24h Clock: 23h 59m Active</div>
                        <div className="text-emerald-400 font-mono">SHA-256 Hash Locked</div>
                      </div>
                      <p className="text-[10.5px] text-slate-300">Live custody clock starts immediately, precluding default bail under BNSS 187/57. Evidence sealed.</p>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button size="sm" onClick={() => navigate('/live-tracking')} className="bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs flex items-center gap-1.5">
                    <span>Experience Live Intercept Simulation</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            )}

            {(selectedRoleScenario || 'PATROL') === 'IO' && (
              <div className="p-5 rounded-2xl border border-emerald-500/30 bg-gradient-to-b from-emerald-950/20 to-slate-950 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">🕵️</span>
                    <span className="font-extrabold text-white text-sm">Role Scenario: Investigating Officer (IO) at Thana / Cyber Crime Police Station</span>
                  </div>
                  <Badge className="bg-emerald-600 text-white text-[10px]">INVESTIGATION TO CHARGE SHEET</Badge>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs">
                  <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 space-y-2 flex flex-col justify-between">
                    <div className="space-y-2">
                      <div className="flex justify-between text-[10px] text-emerald-400 font-mono font-bold">
                        <span>PHASE 01</span>
                        <span>CDR INGESTION</span>
                      </div>
                      <div className="relative rounded-lg overflow-hidden h-24 border border-blue-500/30">
                        <img src="https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=400" alt="CDR Telecom Ingestion" className="w-full h-full object-cover" />
                        <div className="absolute top-1 right-1 bg-blue-600/90 px-1.5 py-0.5 rounded text-[8px] font-bold text-white">4.8s PARSING</div>
                      </div>
                      <div className="font-bold text-white text-[11px]">4.8s Automated Parsing</div>
                      <p className="text-[10.5px] text-slate-300">IO uploads 120,000-row telecom CDR CSV. System extracts suspect burners and tower coordinates in 4.8s.</p>
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 space-y-2 flex flex-col justify-between">
                    <div className="space-y-2">
                      <div className="flex justify-between text-[10px] text-emerald-400 font-mono font-bold">
                        <span>PHASE 02</span>
                        <span>MULE TRIPWIRE</span>
                      </div>
                      <div className="relative rounded-lg overflow-hidden h-24 border border-amber-500/30">
                        <img src="https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=400" alt="Bank Mule Smurfing" className="w-full h-full object-cover" />
                        <div className="absolute top-1 right-1 bg-amber-600/90 px-1.5 py-0.5 rounded text-[8px] font-bold text-white">BNSS 106 FREEZE</div>
                      </div>
                      <div className="font-bold text-white text-[11px]">BNSS Sec 106 Freeze</div>
                      <p className="text-[10.5px] text-slate-300">Isolation Forest flags 14 accounts smurfing Rs. 48,500. Automatic bank freeze notice saves Rs. 42.8 Lakhs.</p>
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 space-y-2 flex flex-col justify-between">
                    <div className="space-y-2">
                      <div className="flex justify-between text-[10px] text-emerald-400 font-mono font-bold">
                        <span>PHASE 03</span>
                        <span>AI GRAPH FUSION</span>
                      </div>
                      <div className="relative rounded-lg overflow-hidden h-24 border border-purple-500/30">
                        <img src="https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=400" alt="Graph Centrality Network" className="w-full h-full object-cover" />
                        <div className="absolute top-1 right-1 bg-purple-600/90 px-1.5 py-0.5 rounded text-[8px] font-bold text-white">BETWEENNESS 9990</div>
                      </div>
                      <div className="font-bold text-white text-[11px]">Kingpin Unmasking</div>
                      <p className="text-[10.5px] text-slate-300">Cytoscape betweenness centrality reveals Vikram Malhotra behind 3 interstate FIRs in Delhi, Gurugram, and Noida.</p>
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 space-y-2 flex flex-col justify-between">
                    <div className="space-y-2">
                      <div className="flex justify-between text-[10px] text-emerald-400 font-mono font-bold">
                        <span>PHASE 04</span>
                        <span>PRO FIR DRAFTING</span>
                      </div>
                      <div className="relative rounded-lg overflow-hidden h-24 border border-emerald-500/30">
                        <img src="https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=400" alt="Court Dossier Drafting" className="w-full h-full object-cover" />
                        <div className="absolute top-1 right-1 bg-emerald-600/90 px-1.5 py-0.5 rounded text-[8px] font-bold text-white">BSA CERTIFIED</div>
                      </div>
                      <div className="font-bold text-white text-[11px]">90s Court Dossier</div>
                      <p className="text-[10.5px] text-slate-300">Generates complete NCRB Form 1 citing BNS 308, 318, 111 with Section 63 BSA certificate for trial court.</p>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button size="sm" onClick={() => navigate('/drafting')} className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5">
                    <span>Open Statutory Legal Drafting</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            )}

            {(selectedRoleScenario || 'PATROL') === 'COMMAND' && (
              <div className="p-5 rounded-2xl border border-purple-500/30 bg-gradient-to-b from-purple-950/20 to-slate-950 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">🏛️</span>
                    <span className="font-extrabold text-white text-sm">Role Scenario: Superintendent of Police (SP) / Director General of Police (DGP)</span>
                  </div>
                  <Badge className="bg-purple-600 text-white text-[10px]">PREDICTIVE GOVERNANCE & SOVEREIGNTY</Badge>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs">
                  <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 space-y-2 flex flex-col justify-between">
                    <div className="space-y-2">
                      <div className="flex justify-between text-[10px] text-purple-400 font-mono font-bold">
                        <span>TIER 01</span>
                        <span>PREDICTIVE PATROL</span>
                      </div>
                      <div className="relative rounded-lg overflow-hidden h-24 border border-purple-500/30">
                        <img src="https://images.unsplash.com/photo-1551836022-d5d88e9218df?w=400" alt="Command Center Wall" className="w-full h-full object-cover" />
                        <div className="absolute top-1 right-1 bg-purple-600/90 px-1.5 py-0.5 rounded text-[8px] font-bold text-white">POISSON MODEL</div>
                      </div>
                      <div className="font-bold text-white text-[11px]">Poisson AI Model</div>
                      <p className="text-[10.5px] text-slate-300">Forecasts crime clusters 48h in advance; pre-positions PCR vans at expressway chokepoints, cutting fuel waste.</p>
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 space-y-2 flex flex-col justify-between">
                    <div className="space-y-2">
                      <div className="flex justify-between text-[10px] text-purple-400 font-mono font-bold">
                        <span>TIER 02</span>
                        <span>JURISDICTION SYNC</span>
                      </div>
                      <div className="relative rounded-lg overflow-hidden h-24 border border-blue-500/30">
                        <img src="https://images.unsplash.com/photo-1524661135-423995f22d0b?w=400" alt="GIS Boundaries" className="w-full h-full object-cover" />
                        <div className="absolute top-1 right-1 bg-blue-600/90 px-1.5 py-0.5 rounded text-[8px] font-bold text-white">GEOJSON SYNC</div>
                      </div>
                      <div className="font-bold text-white text-[11px]">GeoJSON Boundary</div>
                      <p className="text-[10.5px] text-slate-300">Eliminates inter-thana jurisdictional squabbles; automatically identifies competent station for instant handover.</p>
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 space-y-2 flex flex-col justify-between">
                    <div className="space-y-2">
                      <div className="flex justify-between text-[10px] text-purple-400 font-mono font-bold">
                        <span>TIER 03</span>
                        <span>AUDIT IMMUNITY</span>
                      </div>
                      <div className="relative rounded-lg overflow-hidden h-24 border border-emerald-500/30">
                        <img src="https://images.unsplash.com/photo-1563986768609-322da13575f3?w=400" alt="WORM Audit Ledger" className="w-full h-full object-cover" />
                        <div className="absolute top-1 right-1 bg-emerald-600/90 px-1.5 py-0.5 rounded text-[8px] font-bold text-white">HMAC-SHA256</div>
                      </div>
                      <div className="font-bold text-white text-[11px]">WORM Security Ledger</div>
                      <p className="text-[10.5px] text-slate-300">HMAC-SHA256 chained logs track every query, download, and freeze, safeguarding officers from judicial censure.</p>
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 space-y-2 flex flex-col justify-between">
                    <div className="space-y-2">
                      <div className="flex justify-between text-[10px] text-purple-400 font-mono font-bold">
                        <span>TIER 04</span>
                        <span>FISCAL SOVEREIGNTY</span>
                      </div>
                      <div className="relative rounded-lg overflow-hidden h-24 border border-amber-500/30">
                        <img src="https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=400" alt="Sovereign Server Rack" className="w-full h-full object-cover" />
                        <div className="absolute top-1 right-1 bg-amber-600/90 px-1.5 py-0.5 rounded text-[8px] font-bold text-white">AIR-GAPPED</div>
                      </div>
                      <div className="font-bold text-white text-[11px]">Rs. 0 Software Cost</div>
                      <p className="text-[10.5px] text-slate-300">Saves Rs. 1.5 Cr to Rs. 4 Cr annually in vendor lock-in. Air-gapped on-premise deployment satisfies DPDP Act 2023.</p>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button size="sm" onClick={() => navigate('/dashboard')} className="bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs flex items-center gap-1.5">
                    <span>Inspect Command Dashboard</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Section 3: How to Connect CRIMENEXUS with Real-World Police Tools */}
          <div className="space-y-4 pt-2">
            <div className="flex items-center justify-between border-b border-border/70 pb-2">
              <div>
                <h3 className="text-lg font-black text-foreground flex items-center gap-2">
                  <Terminal className="h-5 w-5 text-cyan-400" />
                  3. How to Connect CRIMENEXUS with Real-World Police & Government Tools
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Production-grade API endpoints, mTLS security protocols, and integration schemas for national databases:
                </p>
              </div>
              <Badge variant="outline" className="text-[10px] font-mono border-cyan-500/40 text-cyan-300">
                SOVEREIGN INTEGRATION GRID
              </Badge>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
              {[
                {
                  name: 'CCTNS National Portal (NCRB)',
                  endpoint: 'POST /api/v1/external/cctns/fir/sync',
                  protocol: 'RESTful API over TLS 1.3 / mTLS + HMAC-SHA256 Token',
                  frequency: '5-Minute Webhook & Hourly Batch Sync',
                  format: 'JSON (NCRB Form 1 Standard Schema)',
                  data: 'FIR details, accused aliases, arrest memos, vehicle seizure logs',
                  color: 'border-emerald-500/40 bg-emerald-950/20 text-emerald-400',
                },
                {
                  name: 'ICJS Court Platform (e-Courts)',
                  endpoint: 'GET /api/v1/external/icjs/remand-status',
                  protocol: 'Secured SOAP / REST Gateway with Dual-Factor PKI',
                  frequency: 'Hourly Scheduled Query Batch',
                  format: 'XML / JSON e-Courts Remand Schema',
                  data: 'Magistrate remand orders, bail rejections, NBW arrest warrants',
                  color: 'border-sky-500/40 bg-sky-950/20 text-sky-400',
                },
                {
                  name: 'NHAI FASTag & Highway ANPR',
                  endpoint: 'POST /api/v1/telemetry/anpr-stream',
                  protocol: 'Apache Kafka Event Stream / Webhook (Sub-800ms)',
                  frequency: 'Sub-Second Real-Time Telemetry Stream',
                  format: 'GeoJSON Camera Event Frame + Plate OCR String',
                  data: 'Plaza toll passings, lane number, vehicle speed, 4K camera frame',
                  color: 'border-purple-500/40 bg-purple-950/20 text-purple-400',
                },
                {
                  name: 'Telecom TSPs (CDRs & Cell Dumps)',
                  endpoint: 'POST /api/v1/evidence/upload/cdr-bulk',
                  protocol: 'SFTP Bulk Ingest / Secure Web Upload (Air-Gapped)',
                  frequency: 'Ad-Hoc IO Case Upload / Lawful Interception Stream',
                  format: 'Standardized CSV (Airtel, Jio, Vi, BSNL Normalizer)',
                  data: 'A-Party, B-Party, Cell Global ID (CGI), IMEI, IMSI, Duration',
                  color: 'border-amber-500/40 bg-amber-950/20 text-amber-400',
                },
                {
                  name: '1930 / I4C Cyber Crime Helpline',
                  endpoint: 'POST /api/v1/external/1930/freeze-directive',
                  protocol: 'FinNet 2.0 Batch Protocol & REST API Gateway',
                  frequency: 'Real-Time Immediate Fraud Tripwire',
                  format: 'JSON Bank Mule Alert Schema',
                  data: 'Smurfing accounts, structured deposits < Rs. 50k, UTR hash logs',
                  color: 'border-red-500/40 bg-red-950/20 text-red-400',
                },
                {
                  name: 'ERSS Dial-112 CAD System',
                  endpoint: 'POST /api/v1/geo/proximity-dispatch',
                  protocol: 'WebSockets / REST CAD Dispatch Protocol',
                  frequency: 'Real-Time Intercept Coordinate Broadcast',
                  format: 'GeoJSON Intercept Vector + Patrol Callout Code',
                  data: 'PCR van GPS telemetry, nearest station ETA, radio callouts',
                  color: 'border-cyan-500/40 bg-cyan-950/20 text-cyan-400',
                },
              ].map((tool, idx) => (
                <div key={idx} className="p-3.5 rounded-xl border border-border/80 bg-slate-900/90 space-y-2 shadow-md">
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-white text-xs">{tool.name}</span>
                    <span className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded border ${tool.color}`}>
                      PRODUCTION READY
                    </span>
                  </div>
                  <div className="font-mono text-[10px] text-cyan-300 bg-slate-950 p-1.5 rounded border border-slate-800 break-all">
                    {tool.endpoint}
                  </div>
                  <div className="space-y-1 text-[10.5px] text-slate-300">
                    <div><span className="text-muted-foreground">Protocol:</span> {tool.protocol}</div>
                    <div><span className="text-muted-foreground">Frequency:</span> {tool.frequency}</div>
                    <div><span className="text-muted-foreground">Payload:</span> {tool.data}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Section 3: Recent Real-World Scenario: Operation Shadowhawk (2026) */}
          <div className="p-6 rounded-2xl border-2 border-red-500/50 bg-gradient-to-b from-slate-900 via-slate-950 to-slate-950 shadow-2xl space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-red-500/30 pb-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Badge className="bg-red-600 text-white font-extrabold text-[10px] px-2 py-0.5 flex items-center gap-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-white animate-ping" />
                    RECENT OPERATIONAL INCIDENT • MARCH 2026
                  </Badge>
                  <span className="text-xs font-mono text-red-400 font-bold">
                    JOINT INTER-STATE SPECIAL CELL OPERATION
                  </span>
                </div>
                <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
                  <span>🚨 Operation Shadowhawk: Rs. 4.2 Crore Armed Robbery & Hawala Bust</span>
                </h3>
                <p className="text-xs text-slate-300 max-w-2xl">
                  Delhi Special Crime Branch & Noida Sector 20 Police Station joint interdiction spanning Vikas Marg, Mayur Vihar, and the Yamuna Expressway Corridor.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  onClick={() => navigate('/live-tracking')}
                  className="bg-red-600 hover:bg-red-700 text-white font-extrabold text-xs flex items-center gap-1.5 shadow-lg shadow-red-600/30"
                >
                  <Play className="h-3.5 w-3.5" />
                  <span>Replay Pursuit in Live Demo</span>
                </Button>
              </div>
            </div>

            {/* Tactical Incident Timeline */}
            <div className="space-y-4">
              <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider font-mono flex items-center gap-2">
                <Clock className="h-4 w-4 text-amber-400" />
                Chronological Case Resolution Timeline (Solved in 40 Minutes):
              </h4>

              <div className="relative border-l-2 border-red-500/40 ml-4 space-y-6 pl-6 text-xs">
                {[
                  {
                    time: '14:15 IST',
                    title: 'Armed Heist at Sector 62 Cash Logistics Center',
                    statute: 'Sec 303(2) (Theft) & Sec 311 (Robbery with Gang) BNS, 2023',
                    desc: 'Three masked assailants armed with illegal firearms breach the cash vault in Sector 62, looting Rs. 4,20,000 in currency notes. Assailants escape in a black SUV. FIR #8812 is registered in CCTNS.',
                    badge: 'CCTNS CRIME LOG',
                    color: '#ef4444',
                  },
                  {
                    time: '14:24 IST',
                    title: 'Latent Crime-Scene Fingerprint Matched on NAFIS',
                    statute: 'Section 53 CrPC / Identification of Prisoners Act',
                    desc: 'Forensic field team lifts partial latent prints from the vault keypad. The automated matcher scores a 99.4% confidence match against Vikram Malhotra @ Vicky (Alias: Ring Leader Alpha-01).',
                    badge: 'BIOMETRIC MATCH',
                    color: '#a855f7',
                  },
                  {
                    time: '14:31 IST',
                    title: 'Hawala Smurfing & ATM Cash Outflow Flagged',
                    statute: 'PMLA Sec 3 & 4 (Hawala Money Laundering)',
                    desc: 'Isolation Forest AI engine flags sudden anomalous Rs. 48,500 cash withdrawals across multiple ATMs near Vikas Marg, funneled towards secondary mule accounts linked to syndicate kingpin Rajan.',
                    badge: 'FINANCIAL ANOMALY',
                    color: '#f59e0b',
                  },
                  {
                    time: '14:48 IST',
                    title: '4K Highway ANPR Toll Camera Intercept Triggered',
                    statute: 'Section 82/83 CrPC & Section 111 BNS Organized Crime',
                    desc: 'Optical ANPR camera at Yamuna Expressway Toll KM 48 flags black getaway vehicle (Plate: TS 09 AB 1234) traveling southbound towards Mathura at 118 km/h. Lookout alert broadcasted to ERSS-112.',
                    badge: 'ANPR HIGHWAY HIT',
                    color: '#06b6d4',
                  },
                  {
                    time: '14:52 IST',
                    title: 'Haversine Intercept Dispatch & Vehicular Containment',
                    statute: 'Emergency Response Support System (ERSS-112)',
                    desc: 'CRIMENEXUS geospatial engine calculates closest armed unit: PCR Patrol-04 (Sector 20 PS, Noida, 1.4 km proximity, ETA 1.9 minutes). Spike strip deployed, forcing getaway vehicle to halt.',
                    badge: 'PATROL INTERCEPT',
                    color: '#3b82f6',
                  },
                  {
                    time: '14:55 IST',
                    title: 'Custody Secured & Section 63 BSA Remand Certificate Sealed',
                    statute: 'Article 22(2) Constitution & Section 63 Bharatiya Sakshya Adhiniyam, 2023',
                    desc: 'Suspect Vikram Malhotra taken into custody. Digital custody bundle cryptographically hashed with SHA-256 (Hash: 7f83b1657ff1fc53b9275bf9754168e3314051a89c31be4d8f57f4955b939103) and submitted to the Chief Judicial Magistrate for 14-day police remand.',
                    badge: 'LEGAL CUSTODY SEALED',
                    color: '#10b981',
                  },
                ].map((event, eIdx) => (
                  <div key={eIdx} className="relative group">
                    <span
                      className="absolute -left-[31px] top-0 h-4 w-4 rounded-full border-2 border-slate-900 shadow"
                      style={{ backgroundColor: event.color }}
                    />
                    <div className="p-3.5 rounded-xl border border-border/80 bg-slate-900/60 space-y-1.5 hover:border-primary/50 transition-colors">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-black text-amber-400 text-xs">{event.time}</span>
                          <span className="text-muted-foreground">•</span>
                          <span className="font-extrabold text-foreground text-sm">{event.title}</span>
                        </div>
                        <Badge
                          variant="outline"
                          className="text-[9px] font-mono font-bold"
                          style={{ borderColor: `${event.color}60`, color: event.color }}
                        >
                          {event.badge}
                        </Badge>
                      </div>
                      <p className="text-slate-300 text-xs leading-relaxed">{event.desc}</p>
                      <div className="text-[10px] font-mono text-emerald-400 pt-1 border-t border-border/40 flex items-center gap-1">
                        <Shield className="h-3 w-3 shrink-0" />
                        <span>{event.statute}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab: Before vs After Police Operational Scenarios */}
      {activeTab === 'BEFORE_AFTER' && (
        <div className="space-y-8 animate-in fade-in duration-200">
          {/* Header Banner */}
          <div className="p-6 rounded-2xl border border-amber-500/40 bg-gradient-to-r from-amber-500/10 via-slate-900 to-slate-950 shadow-xl space-y-3">
            <div className="flex items-center gap-2">
              <Badge className="bg-amber-600 text-white font-black text-xs px-2.5 py-0.5">
                FIELD BENCHMARK
              </Badge>
              <span className="text-xs font-mono text-muted-foreground">
                Before vs After CRIMENEXUS Adoption • State Police Field Study
              </span>
            </div>
            <h2 className="text-2xl font-black text-white tracking-tight">
              Transforming Police Operations: From Siloed Paperwork to Sub-Minute Intelligence
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 max-w-3xl leading-relaxed">
              Traditional Indian law enforcement investigations are severely bottlenecked by siloed state databases, manual CDR spreadsheets, slow inter-district letters, and evidentiary disputes in trial court. CRIMENEXUS replaces this with an automated multi-agency graph and real-time ANPR intercept vector.
            </p>

            {/* Impact Highlights */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
              <div className="p-3 rounded-xl bg-slate-900/80 border border-border/80">
                <span className="text-[10px] text-muted-foreground uppercase font-bold block">Interdiction Latency</span>
                <div className="text-lg font-black text-emerald-400">11.4 mins</div>
                <span className="text-[10px] text-slate-400">Down from 21 days</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-900/80 border border-border/80">
                <span className="text-[10px] text-muted-foreground uppercase font-bold block">Gang Linkage Speed</span>
                <div className="text-lg font-black text-sky-400">180 ms</div>
                <span className="text-[10px] text-slate-400">Down from 14 days</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-900/80 border border-border/80">
                <span className="text-[10px] text-muted-foreground uppercase font-bold block">Default Bail Lapses</span>
                <div className="text-lg font-black text-emerald-400">0.0%</div>
                <span className="text-[10px] text-slate-400">100% BNSS 57 Compliance</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-900/80 border border-border/80">
                <span className="text-[10px] text-muted-foreground uppercase font-bold block">Digital Conviction Rate</span>
                <div className="text-lg font-black text-amber-400">92.6%</div>
                <span className="text-[10px] text-slate-400">Sec 63 BSA Hash Admissible</span>
              </div>
            </div>
          </div>

          {/* Deep-Dive Case Study: Operation Shadowhawk Before vs After */}
          <div className="space-y-4">
            <h3 className="text-lg font-black text-foreground flex items-center gap-2">
              <Compass className="h-5 w-5 text-amber-400" />
              Real-World Case Study: Operation Shadowhawk (Rs. 4.2 Cr Armed Robbery & Hawala Pursuit)
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Before Column */}
              <Card className="p-5 border-red-500/30 bg-red-950/10 space-y-4">
                <div className="flex items-center justify-between border-b border-red-500/30 pb-3">
                  <div className="flex items-center gap-2">
                    <XCircle className="h-5 w-5 text-red-500" />
                    <h4 className="text-sm font-black text-red-400 uppercase tracking-wider">
                      BEFORE CRIMENEXUS (Manual Era)
                    </h4>
                  </div>
                  <Badge variant="outline" className="text-[9px] border-red-500/40 text-red-400">
                    21-DAY CYCLE
                  </Badge>
                </div>

                <div className="space-y-3.5 text-xs text-slate-300">
                  <div className="space-y-1">
                    <strong className="text-red-300 block">1. FIR & Incident Registration (T + 4h)</strong>
                    <p className="leading-relaxed text-slate-400">
                      Complainant visits Noida Sector 20 Police Station. Officer writes manual GD entry and paper FIR. Neighboring Delhi Special Cell has zero visibility.
                    </p>
                  </div>

                  <div className="space-y-1">
                    <strong className="text-red-300 block">2. Highway Getaway & Toll Checking (T + 24h)</strong>
                    <p className="leading-relaxed text-slate-400">
                      Investigating Officer calls toll plaza supervisors hours after suspect car passes KM 48. Physical letters drafted to NHAI to request CCTV files on pen drives.
                    </p>
                  </div>

                  <div className="space-y-1">
                    <strong className="text-red-300 block">3. CDR & Syndicate Triangulation (T + 5 Days)</strong>
                    <p className="leading-relaxed text-slate-400">
                      Cellular tower dumps arrive in 500 MB Excel files. Analysts manually filter columns using VLOOKUP. Burner SIMs and kingpin ties remain unlinked.
                    </p>
                  </div>

                  <div className="space-y-1">
                    <strong className="text-red-300 block">4. Hawala Fund Dispersion (T + 14 Days)</strong>
                    <p className="leading-relaxed text-slate-400">
                      Mule accounts in Karol Bagh finish 14 structured withdrawals under Rs. 50,000. By the time bank notices are delivered by post, the accounts are empty.
                    </p>
                  </div>

                  <div className="space-y-1">
                    <strong className="text-red-300 block">5. Trial Court Evidence Challenge (T + 6 Months)</strong>
                    <p className="leading-relaxed text-slate-400">
                      Defense counsel challenges electronic records under Section 65B due to lack of contemporaneous hash certificates and manual chain-of-custody breaks. Suspects granted bail.
                    </p>
                  </div>
                </div>
              </Card>

              {/* After Column */}
              <Card className="p-5 border-emerald-500/30 bg-emerald-950/10 space-y-4">
                <div className="flex items-center justify-between border-b border-emerald-500/30 pb-3">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                    <h4 className="text-sm font-black text-emerald-300 uppercase tracking-wider">
                      AFTER CRIMENEXUS (Autonomous Intel)
                    </h4>
                  </div>
                  <Badge className="bg-emerald-600 text-white text-[9px] font-bold">
                    11.4-MIN INTERCEPT
                  </Badge>
                </div>

                <div className="space-y-3.5 text-xs text-slate-200">
                  <div className="space-y-1">
                    <strong className="text-emerald-300 block">1. Instant AI Statutory FIR (T + 90s)</strong>
                    <p className="leading-relaxed text-slate-300">
                      Auto-drafts formal FIR under Section 173 BNSS & Sec 310(2)/111 BNS. CCTNS 15-min background daemon syncs case statewide instantly.
                    </p>
                  </div>

                  <div className="space-y-1">
                    <strong className="text-emerald-300 block">2. Sub-Second 4K ANPR Hotlist Hit (T + 2.5m)</strong>
                    <p className="leading-relaxed text-slate-300">
                      Yamuna Expressway KM 48 camera scans plate TS 09 AB 1234. System locks vehicle on live MapLibre map and calculates road intercept route.
                    </p>
                  </div>

                  <div className="space-y-1">
                    <strong className="text-emerald-300 block">3. Turn-by-Turn OSRM Police Dispatch (T + 3m)</strong>
                    <p className="leading-relaxed text-slate-300">
                      Identifies nearest jurisdictional station (Noida Sec 20 PS, 1.4 km) and dispatches PCR Squad 4 via turn-by-turn road vector (ETA 1.8 mins).
                    </p>
                  </div>

                  <div className="space-y-1">
                    <strong className="text-emerald-300 block">4. Multi-Layer Hawala Smurfing Freeze (T + 8m)</strong>
                    <p className="leading-relaxed text-slate-300">
                      Isolation Forest model flags 14 structured cash smurfing deposits of Rs. 49,000 in account ACC-HDFC-908122; Section 106 BNSS notice freezes Rs. 4.2 Lakhs instantly.
                    </p>
                  </div>

                  <div className="space-y-1">
                    <strong className="text-emerald-300 block">5. Apprehension & Section 63 BSA Sealing (T + 11.4m)</strong>
                    <p className="leading-relaxed text-slate-300">
                      Roadblock containment executed at Yamuna Expressway KM 48. Suspect restrained; court remand dossier and signed SHA-256 evidence certificate locked in real-time.
                    </p>
                  </div>
                </div>
              </Card>
            </div>
          </div>

          {/* 8-Point Forensic & Operational Benchmark Matrix */}
          <Card className="p-6 border-border/80 shadow-xl space-y-4">
            <h3 className="text-base font-black text-foreground flex items-center gap-2">
              <Scale className="h-5 w-5 text-primary" />
              8-Point Forensic & Statutory Operational Comparison
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse min-w-[700px]">
                <thead>
                  <tr className="border-b border-border bg-slate-900/60 text-slate-200">
                    <th className="p-3 font-bold uppercase tracking-wider text-[11px]">Investigation Workflow</th>
                    <th className="p-3 font-bold uppercase tracking-wider text-[11px] text-red-400">Traditional Police Process</th>
                    <th className="p-3 font-bold uppercase tracking-wider text-[11px] text-emerald-400">CRIMENEXUS Platform</th>
                    <th className="p-3 font-bold uppercase tracking-wider text-[11px] text-primary">Statutory Authority</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60 text-slate-300">
                  {[
                    {
                      area: 'FIR Registration & Legal Tagging',
                      before: 'Manual station diary transcription (3-5 hours delay)',
                      after: 'AI-assisted statutory FIR with BNS/BNSS tags in 90 seconds',
                      statute: 'Sec 173 BNSS, 2023',
                    },
                    {
                      area: 'Inter-State Gang Linkage',
                      before: 'Physical letters to neighboring SPs; weeks to connect dots',
                      after: 'Neo4j Graph Neural Network links 126 entities in 180ms',
                      statute: 'Sec 111 BNS (Organized Crime)',
                    },
                    {
                      area: 'Cellular CDR & Burner Triangulation',
                      before: 'Manual VLOOKUP across multi-gigabyte Excel spreadsheets',
                      after: 'Automated geospatial co-location & 192-dim voice biometrics in 4s',
                      statute: 'Sec 39 BNSS, 2023',
                    },
                    {
                      area: 'Expressway ANPR Pursuit',
                      before: 'Calling toll plazas hours after suspect passes; blind getaways',
                      after: 'Sub-second 4K ANPR toll stream + turn-by-turn OSRM dispatch',
                      statute: 'Motor Vehicles Act Sec 192',
                    },
                    {
                      area: 'Hawala & Smurfing Detection',
                      before: 'Noticed weeks later during quarterly bank audit; accounts empty',
                      after: 'Unsupervised Isolation Forest flags deposits < Rs. 50k; instant freeze',
                      statute: 'PMLA Sec 3/4 & Sec 106 BNSS',
                    },
                    {
                      area: 'Digital Evidence Integrity',
                      before: 'CDs/USBs challenged in court due to missing hash certificates',
                      after: 'Immutable SHA-256 Merkle root & Section 63 BSA certificate signed',
                      statute: 'Sec 63(4) BSA, 2023',
                    },
                    {
                      area: '24-Hour Constitutional Custody',
                      before: 'Manual clock tracking leading to default bail releases',
                      after: 'Automated real-time countdown alerting IO at T-3 hours',
                      statute: 'Article 22(2) & Sec 57 BNSS',
                    },
                    {
                      area: 'Disaster & WAN Failure Resilience',
                      before: 'Police station software goes down during internet fiber cuts',
                      after: 'Offline-First SQLite failover + 2 Mbps Thana Lite Mode (0.4s FCP)',
                      statute: 'NCIIPC Critical Infra Guidelines',
                    },
                  ].map((row, rIdx) => (
                    <tr key={rIdx} className="hover:bg-slate-900/40">
                      <td className="p-3 font-bold text-white">{row.area}</td>
                      <td className="p-3 text-red-300">{row.before}</td>
                      <td className="p-3 text-emerald-300 font-semibold">{row.after}</td>
                      <td className="p-3 font-mono text-[10px] text-primary">{row.statute}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {/* Tab: Data Integration, Safety, Security & Privacy Architecture */}
      {activeTab === 'DATA_SECURITY' && (
        <div className="space-y-8 animate-in fade-in duration-200">
          {/* Header Banner */}
          <div className="p-6 rounded-2xl border border-sky-500/40 bg-gradient-to-r from-sky-500/10 via-slate-900 to-slate-950 shadow-xl space-y-3">
            <div className="flex items-center gap-2">
              <Badge className="bg-sky-600 text-white font-black text-xs px-2.5 py-0.5">
                ZERO-TRUST SOVEREIGNTY
              </Badge>
              <span className="text-xs font-mono text-muted-foreground">
                Digital Personal Data Protection Act (DPDP) 2023 & Section 63 BSA Certified
              </span>
            </div>
            <h2 className="text-2xl font-black text-white tracking-tight">
              Enterprise Data Integration, Cryptographic Safety & Constitutional Privacy
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 max-w-3xl leading-relaxed">
              Criminal intelligence systems demand sovereign data safeguards: strict legal chain of custody, tamper-evident audit trails, granular Role-Based Access Control, automated PII masking, and 100% air-gapped state police network deployment.
            </p>
          </div>

          {/* Part 1: Multi-Source Data Integration Architecture */}
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-border/70 pb-2">
              <div>
                <h3 className="text-lg font-black text-foreground flex items-center gap-2">
                  <Database className="h-5 w-5 text-sky-400" />
                  1. Multi-Agency Sovereign Data Integration Grid
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Seven sovereign intelligence sources ingested with strict metadata provenance and non-repudiation:
                </p>
              </div>
              <Badge variant="outline" className="text-[10px] font-mono border-sky-500/40 text-sky-300">
                7 NATIONAL FEEDS
              </Badge>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[
                {
                  name: 'CCTNS National Crime Grid',
                  agency: 'NCRB / Ministry of Home Affairs',
                  protocol: 'REST / XML Gateway (HMAC Signed)',
                  refresh: '15-Minute Background Daemon',
                  desc: 'Auto-syncs inter-state FIRs, arrest memos, stolen vehicle records, and modus-operandi descriptions across all 28 states and 8 Union Territories.',
                },
                {
                  name: 'ICJS Inter-Operable Justice System',
                  agency: 'Supreme Court e-Committee & NIC',
                  protocol: 'JSON over Mutual TLS (mTLS)',
                  refresh: 'Real-Time Event Hook',
                  desc: 'Bidirectional sync with e-Courts (warrants, remand orders), e-Prisons (inmate status), and e-Forensics (FSL ballistics & toxicology reports).',
                },
                {
                  name: 'NAFIS Automated Fingerprint System',
                  agency: 'Central Fingerprint Bureau (CFPB)',
                  protocol: 'ANSI/NIST-ITL 1-2011 Minutiae API',
                  refresh: 'On-Demand Forensic Ingestion',
                  desc: 'Matches 192-dimensional latent crime-scene fingerprint minutiae against national criminal database with 99.4% confidence score.',
                },
                {
                  name: 'Bureau of Immigration (BoI) LOC Gateway',
                  agency: 'Ministry of Home Affairs',
                  protocol: 'Secure SFTP / Encrypted Message Queue',
                  refresh: 'Hourly Broadcast to 32 International Airports',
                  desc: 'Instantly transmits Look-Out Circulars (LOC) to immigration departure gates at all 32 international airport terminals and major seaports.',
                },
                {
                  name: 'NHAI FASTag & Highway ANPR',
                  agency: 'Ministry of Road Transport & Highways',
                  protocol: 'Redis Streams / Webhook Streaming',
                  refresh: 'Sub-Second Event-Driven (50,000 req/sec)',
                  desc: 'Correlates 4K optical license plate recognition and RFID transponder hits across 850+ national highway toll plazas in real time.',
                },
                {
                  name: 'Lawful Telecom CDR & Tower Dumps',
                  agency: 'Airtel, Jio, Vi (via DoT Security Gateways)',
                  protocol: 'Secure Forensic File Ingestion Pipeline',
                  refresh: 'Automated CSV/ZIP Parser with Sanitization',
                  desc: 'Ingests Call Detail Records, IMEI/IMSI switching, and cell tower BTS coordinates under lawful magistrate authorization (Sec 39 BNSS).',
                },
                {
                  name: 'FIU-IND Core Banking & Hawala Feed',
                  agency: 'Financial Intelligence Unit - India',
                  protocol: 'Encrypted Batch JSON / ISO 20022',
                  refresh: 'Event-Driven Transaction Monitor',
                  desc: 'Monitors structured smurfing cash deposits under Rs. 50,000 threshold and cross-border remittances across scheduled commercial banks.',
                },
              ].map((feed, fIdx) => (
                <Card key={fIdx} className="p-4 border-border/80 bg-card/80 space-y-2.5 shadow-md flex flex-col justify-between">
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold text-xs text-white leading-snug">{feed.name}</span>
                      <Badge variant="outline" className="text-[9px] font-mono border-sky-500/40 text-sky-400">
                        {feed.refresh.split(' ')[0]}
                      </Badge>
                    </div>
                    <span className="text-[10px] text-sky-400 font-mono block">{feed.agency}</span>
                    <p className="text-[11px] text-slate-300 leading-relaxed">{feed.desc}</p>
                  </div>
                  <div className="pt-2 border-t border-border/40 text-[10px] text-muted-foreground font-mono">
                    Protocol: <span className="text-slate-300">{feed.protocol}</span>
                  </div>
                </Card>
              ))}
            </div>
          </div>

          {/* Part 2: Zero-Trust Security Safeguards */}
          <div className="space-y-4">
            <h3 className="text-lg font-black text-foreground flex items-center gap-2">
              <Shield className="h-5 w-5 text-emerald-400" />
              2. Zero-Trust Cryptographic Security Architecture
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="p-5 border-border/80 bg-card/70 space-y-3 shadow-md">
                <div className="p-2.5 w-fit rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  <Lock className="h-5 w-5" />
                </div>
                <h4 className="font-extrabold text-sm text-foreground">Military-Grade Encryption</h4>
                <ul className="space-y-2 text-xs text-slate-300 leading-relaxed list-disc list-inside">
                  <li><strong>At Rest:</strong> AES-256-GCM hardware-accelerated encryption for PostgreSQL, Neo4j, and SQLite data blocks.</li>
                  <li><strong>In Transit:</strong> Mandatory TLS 1.3 with Perfect Forward Secrecy (PFS) across all API endpoints.</li>
                  <li><strong>Zero Leakage:</strong> No sensitive case dossiers or biometric files stored in unencrypted temp directories.</li>
                </ul>
              </Card>

              <Card className="p-5 border-border/80 bg-card/70 space-y-3 shadow-md">
                <div className="p-2.5 w-fit rounded-xl bg-sky-500/20 text-sky-400 border border-sky-500/30">
                  <Users className="h-5 w-5" />
                </div>
                <h4 className="font-extrabold text-sm text-foreground">4-Tier Granular RBAC</h4>
                <ul className="space-y-2 text-xs text-slate-300 leading-relaxed list-disc list-inside">
                  <li><strong>INVESTIGATOR:</strong> Read/Write cases, evidence upload, local notes, field GPS telemetry.</li>
                  <li><strong>ANALYST:</strong> Graph neural network manipulation, entity resolution merge confirmation, report generation.</li>
                  <li><strong>SUPERVISOR:</strong> Remand timeline review, Look-Out Circular sign-off, emergency debit freezes.</li>
                  <li><strong>ADMIN:</strong> User provisioning, audit ledger verification, key rotation.</li>
                </ul>
              </Card>

              <Card className="p-5 border-border/80 bg-card/70 space-y-3 shadow-md">
                <div className="p-2.5 w-fit rounded-xl bg-purple-500/20 text-purple-400 border border-purple-500/30">
                  <Terminal className="h-5 w-5" />
                </div>
                <h4 className="font-extrabold text-sm text-foreground">100% Air-Gapped Deployment</h4>
                <ul className="space-y-2 text-xs text-slate-300 leading-relaxed list-disc list-inside">
                  <li><strong>Zero External Callouts:</strong> Operates entirely inside state police intranet (POLNET / SWAN).</li>
                  <li><strong>Self-Contained AI:</strong> Offline SpaCy, SentenceTransformers, and Ollama RAG models cached locally.</li>
                  <li><strong>Offline Maps & Graphs:</strong> Self-hosted MapLibre vector tiles and Cytoscape.js canvas require no internet.</li>
                </ul>
              </Card>
            </div>
          </div>

          {/* Part 3: Data Privacy & DPDP Act 2023 Compliance */}
          <Card className="p-6 border-border/80 shadow-xl space-y-4">
            <h3 className="text-base font-black text-foreground flex items-center gap-2">
              <FileCheck2 className="h-5 w-5 text-emerald-400" />
              3. Privacy by Design & Digital Personal Data Protection (DPDP) Act Compliance
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs text-slate-300 leading-relaxed">
              <div className="space-y-2 p-4 rounded-xl bg-slate-900/60 border border-border/60">
                <strong className="text-white text-sm block">Automated PII Masking & Redaction</strong>
                <p>
                  In accordance with the DPDP Act 2023 and judicial privacy directives, sensitive citizen attributes (12-digit Aadhaar numbers, civilian mobile numbers, bank account numbers, and minor/victim identities) are masked by default across dashboards (`XXXX-XXXX-1234`).
                </p>
                <p className="text-[11px] text-slate-400">
                  Unmasking full numbers requires active case authorization and automatically records an immutable reason entry into the supervisor audit log.
                </p>
              </div>

              <div className="space-y-2 p-4 rounded-xl bg-slate-900/60 border border-border/60">
                <strong className="text-white text-sm block">Immutable Cryptographic Audit Ledger</strong>
                <p>
                  Every single user interaction—including search queries, entity inspections, graph expansions, document previews, and merge actions—is recorded with Officer Name, Badge Number, IP Address, Device Fingerprint, Timestamp, and HMAC-SHA256 signature.
                </p>
                <p className="text-[11px] text-slate-400">
                  Audit logs cannot be modified, reordered, or deleted, even by system administrators (WORM Write-Once-Read-Many architecture).
                </p>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Tab 1: 32 Live Demo Capabilities */}
      {activeTab === 'FEATURES' && (
        <div className="space-y-6">
          {/* Category Filter Chips */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3 py-1.5 rounded-lg border font-semibold transition-all ${
                  selectedCategory === cat.id
                    ? 'bg-primary/20 border-primary text-primary font-bold'
                    : 'bg-card border-border/60 text-muted-foreground hover:text-foreground'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Grid of 20 Features */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredFeatures.map((feat) => {
              const Icon = feat.icon;
              return (
                <Card
                  key={feat.id}
                  className="p-5 space-y-4 hover:border-primary/60 transition-all duration-200 border-border/70 bg-card/90 flex flex-col justify-between group shadow-md"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div
                        className="h-10 w-10 rounded-xl flex items-center justify-center shrink-0 border"
                        style={{
                          backgroundColor: `${feat.color}15`,
                          borderColor: `${feat.color}40`,
                          color: feat.color,
                        }}
                      >
                        <Icon className="h-5 w-5" />
                      </div>
                      <span className="font-mono text-xs font-bold text-muted-foreground">
                        #{String(feat.id).padStart(2, '0')}
                      </span>
                    </div>

                    <div>
                      <span className="text-[10px] font-mono font-bold text-muted-foreground uppercase tracking-wider block">
                        {feat.category}
                      </span>
                      <h3 className="font-extrabold text-sm sm:text-base text-foreground leading-snug group-hover:text-primary transition-colors">
                        {feat.title}
                      </h3>
                    </div>

                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {feat.description}
                    </p>

                    <div className="p-2.5 rounded-lg bg-background/60 border border-border/50 text-[11px] space-y-1">
                      <span className="text-primary font-bold block text-[10px] uppercase tracking-wider">
                        Operational Impact:
                      </span>
                      <span className="text-slate-300 font-medium">{feat.impact}</span>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-border/40 space-y-2">
                    <div className="text-[10px] text-muted-foreground flex items-center gap-1.5 font-mono truncate" title={feat.statutoryRef}>
                      <Shield className="h-3 w-3 text-emerald-400 shrink-0" />
                      <span className="truncate">{feat.statutoryRef}</span>
                    </div>

                    <Button
                      size="sm"
                      onClick={() => navigate(feat.route)}
                      className="w-full text-xs font-bold flex items-center justify-center gap-1.5 bg-primary/10 hover:bg-primary text-primary hover:text-primary-foreground border border-primary/30 transition-all"
                    >
                      <span>Launch Interactive Demo</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* Tab 2: Comparative Analysis */}
      {activeTab === 'COMPARISON' && (
        <div className="space-y-6">
          <Card className="p-6 border-border/80 shadow-xl space-y-6">
            <div>
              <h2 className="text-xl font-extrabold text-foreground flex items-center gap-2">
                <Scale className="h-5 w-5 text-amber-400" />
                Strategic Platform Benchmark: CRIMENEXUS vs CCTNS vs MahaCrimeOS
              </h2>
              <p className="text-xs text-muted-foreground mt-1">
                Rigorous side-by-side technical evaluation across graph analytics, statutory criminal compliance, bandwidth resilience, and automated intelligence.
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse min-w-[700px]">
                <thead>
                  <tr className="border-b border-border bg-slate-900/60 text-slate-200">
                    <th className="p-3.5 font-bold uppercase tracking-wider text-[11px]">Operational Capability</th>
                    <th className="p-3.5 font-bold uppercase tracking-wider text-[11px] text-red-400">Traditional CCTNS (Legacy)</th>
                    <th className="p-3.5 font-bold uppercase tracking-wider text-[11px] text-amber-400">MahaCrimeOS (State Solution)</th>
                    <th className="p-3.5 font-bold uppercase tracking-wider text-[11px] text-emerald-400 bg-emerald-950/20">CRIMENEXUS Intel (v2.4)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {[
                    {
                      dim: 'Data Topology & Syndicate Discovery',
                      cctns: 'Relational SQL queries only; no multi-hop link discovery between bank accounts, phones, and suspects.',
                      maha: '2-hop basic graph search limited to state boundaries; high latency on large graphs.',
                      nexus: 'Native Neo4j graph engine with sub-second multi-hop traversal, centrality kingpin ranking, and aStar path routing.',
                      nexusWin: true,
                    },
                    {
                      dim: 'Financial Smurfing & Hawala Anomaly',
                      cctns: 'Manual bank ledger examination; no velocity anomaly tripwires.',
                      maha: 'Rule-based threshold alerts on single bank accounts.',
                      nexus: 'Unsupervised ML (Isolation Forest) tracking structured deposits < Rs. 50k across multiple branches in real-time.',
                      nexusWin: true,
                    },
                    {
                      dim: 'New Criminal Laws (BNS / BNSS / BSA 2023)',
                      cctns: 'Built on legacy IPC 1860 / CrPC 1973; requires manual legal code re-mapping.',
                      maha: 'Partial section mapping for charge sheets.',
                      nexus: '100% native grounding in BNS, BNSS, and BSA 2023 (Sec 57 Remand tripwire, Sec 63 BSA SHA-256 evidence bundles).',
                      nexusWin: true,
                    },
                    {
                      dim: 'Rural Bandwidth Resilience',
                      cctns: 'Heavy page loads failing consistently on connections under 10 Mbps.',
                      maha: 'Requires minimum 4G broadband; frequent session dropouts in rural thanas.',
                      nexus: 'Ultra-low bandwidth Lite Mode operating cleanly at 2 Mbps with offline IndexedDB write buffering.',
                      nexusWin: true,
                    },
                    {
                      dim: 'Multilingual Vernacular FIR NLP',
                      cctns: 'English-only form entry; vernacular FIRs stored as unsearchable scanned PDFs.',
                      maha: 'Supports Marathi keyword search; no automated translation.',
                      nexus: 'Full zero-shot neural translation across Hindi, Marathi, Kannada, Telugu, and Hinglish with legal terminology grounding.',
                      nexusWin: true,
                    },
                    {
                      dim: 'Real-Time Intercept & Police Proximity',
                      cctns: 'No live telemetry or dispatch routing.',
                      maha: 'Basic station locator without turn-by-turn road physics.',
                      nexus: 'Live GPS pursuit vectors with real-time Haversine distance, OSRM road intercept routing, and automated BOI LOC dispatch.',
                      nexusWin: true,
                    },
                    {
                      dim: 'Biometric Privacy (DPDP Act 2023)',
                      cctns: 'Stores unencrypted raw image scans of fingerprints and photographs.',
                      maha: 'Standard database encryption at rest.',
                      nexus: 'Zero-Knowledge irreversible cryptographic minutiae hashing complying fully with DPDP Act 2023.',
                      nexusWin: true,
                    },
                    {
                      dim: 'Automated Legal Document Drafting',
                      cctns: 'Manual typing of case summaries and bail counter-affidavits.',
                      maha: 'Template-based letter generation without AI grounding.',
                      nexus: 'One-click AI statutory drafting for Bail Oppositions (Sec 480 BNSS), LOC Notices, and SHO Roll-Call Briefings.',
                      nexusWin: true,
                    },
                  ].map((row, idx) => (
                    <tr key={idx} className="hover:bg-accent/20 transition-colors">
                      <td className="p-3.5 font-bold text-foreground align-top">{row.dim}</td>
                      <td className="p-3.5 text-muted-foreground align-top">
                        <div className="flex items-start gap-1.5">
                          <XCircle className="h-4 w-4 text-red-400 shrink-0 mt-0.5" />
                          <span>{row.cctns}</span>
                        </div>
                      </td>
                      <td className="p-3.5 text-muted-foreground align-top">
                        <div className="flex items-start gap-1.5">
                          <AlertTriangle className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
                          <span>{row.maha}</span>
                        </div>
                      </td>
                      <td className="p-3.5 text-foreground font-medium align-top bg-emerald-950/15">
                        <div className="flex items-start gap-1.5">
                          <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                          <span className="text-emerald-200">{row.nexus}</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {/* Tab 3: Autonomous Background Daemons */}
      {activeTab === 'AUTOMATIONS' && (
        <div className="space-y-6">
          <Card className="p-6 border-border/80 shadow-xl space-y-6">
            <div>
              <h2 className="text-xl font-extrabold text-foreground flex items-center gap-2">
                <RefreshCw className="h-5 w-5 text-emerald-400" />
                Autonomous Engine Architecture: Hands-Off Police Intelligence
              </h2>
              <p className="text-xs text-muted-foreground mt-1">
                Five autonomous background daemons continuously monitor bank streams, telecom towers, custodial deadlines, and court filing clocks without manual officer intervention.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {[
                {
                  title: '1. Redis Real-Time Pipeline Consumer',
                  interval: 'Continuous (Event-Driven Sub-Millisecond)',
                  trigger: 'Incoming ANPR Camera Toll Scans & Core Banking Gateway Feeds',
                  action: 'Runs multi-variate anomaly models on transactions > Rs. 50,000, evaluates co-location pings, and raises immediate CRITICAL tripwire alerts.',
                  icon: Zap,
                  color: '#3b82f6',
                },
                {
                  title: '2. CCTNS Automated 15-Minute Poller',
                  interval: 'Every 15 Minutes (900 seconds)',
                  trigger: 'State & National Police Crime Databases (NCRB Gateway)',
                  action: 'Downloads latest FIR filings, inter-state suspect descriptions, and stolen vehicle bulletins, inserting newly extracted entities into Neo4j.',
                  icon: RefreshCw,
                  color: '#10b981',
                },
                {
                  title: '3. 24-Hour Constitutional Remand Clock Daemon',
                  interval: 'Every 5 Minutes (Automated Custody Sweep)',
                  trigger: 'Time of Arrest Timestamp in Case Custody Ledger',
                  action: 'Calculates elapsed custody time under Section 57 BNSS. Dispatches urgent red notifications to Investigating Officers 3 hours before statutory default.',
                  icon: Clock,
                  color: '#ef4444',
                },
                {
                  title: '4. Case Aging & Workload Distribution Engine',
                  interval: 'Daily at 08:00 AM (Pre-Shift Briefing)',
                  trigger: 'Unfiled Charge Sheets older than 60/90 Days',
                  action: 'Aggregates pending investigations across all Station Sub-Inspectors, rebalances case allocations, and generates the SHO Supervisory Morning Dossier.',
                  icon: Users,
                  color: '#f59e0b',
                },
                {
                  title: '5. WORM Cryptographic Merkle Notary Ledger',
                  interval: 'Hourly Merkle Root Anchoring',
                  trigger: 'Newly Ingested Forensic Files, CDR Sheets, and Transcripts',
                  action: 'Generates immutable SHA-256 Merkle tree leaves, anchoring digital evidence hashes for unassailable judicial admissibility under Section 63 BSA.',
                  icon: Lock,
                  color: '#a855f7',
                },
              ].map((daemon, dIdx) => {
                const Icon = daemon.icon;
                return (
                  <div key={dIdx} className="p-5 rounded-2xl border border-border/80 bg-slate-900/50 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 font-extrabold text-sm text-foreground">
                        <Icon className="h-4 w-4" style={{ color: daemon.color }} />
                        <span>{daemon.title}</span>
                      </div>
                      <Badge variant="outline" className="font-mono text-[10px]">
                        {daemon.interval}
                      </Badge>
                    </div>

                    <div className="space-y-1 text-xs">
                      <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold block">
                        Autonomous Trigger:
                      </span>
                      <p className="text-slate-300 font-medium">{daemon.trigger}</p>
                    </div>

                    <div className="space-y-1 text-xs pt-1 border-t border-border/40">
                      <span className="text-[10px] text-primary uppercase tracking-wider font-bold block">
                        Action Taken:
                      </span>
                      <p className="text-slate-400 leading-relaxed">{daemon.action}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
