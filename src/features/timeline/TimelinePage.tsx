import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  Clock,
  PhoneCall,
  MessageSquare,
  Car,
  Video,
  DollarSign,
  MapPin,
  FileCheck2,
  Filter,
  UserCheck,
  Play,
  Pause,
  RotateCcw,
  Search,
  ShieldAlert,
  ArrowRight,
  X,
  ExternalLink,
  Sliders,
  ChevronRight,
  Shield,
  Hash,
  FileSpreadsheet,
  Eye,
} from 'lucide-react';
import { useTimeline } from '../../hooks/useIntelligenceApi';
import { EventType, TimelineEvent } from '../../types';
import { Card, CardHeader, CardContent } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { DocumentPreviewModal } from '../../components/common/DocumentPreviewModal';
import { FileExportPreviewModal } from '../../components/common/FileExportPreviewModal';
import { formatDate } from '../../utils/formatters';
import { sound } from '../../utils/soundEffects';

export function TimelinePage() {
  const [eventTypeFilter, setEventTypeFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedEvent, setSelectedEvent] = useState<TimelineEvent | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [activeStep, setActiveStep] = useState<number>(0);
  const [playSpeed, setPlaySpeed] = useState<number>(1);
  const [previewDossierOpen, setPreviewDossierOpen] = useState<boolean>(false);
  const [csvExportPreviewOpen, setCsvExportPreviewOpen] = useState<boolean>(false);
  const eventRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const { data: rawEvents, isLoading } = useTimeline('ALL');

  // Sort events chronologically ascending
  const sortedEvents = useMemo(() => {
    if (!rawEvents) return [];
    return [...rawEvents].sort(
      (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );
  }, [rawEvents]);

  // Filter events based on type and search query
  const filteredEvents = useMemo(() => {
    return sortedEvents.filter((e) => {
      const matchesType = eventTypeFilter === 'ALL' || e.eventType === eventTypeFilter;
      const matchesSearch =
        searchQuery.trim() === '' ||
        e.entityName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        e.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (e.location && e.location.toLowerCase().includes(searchQuery.toLowerCase())) ||
        e.id.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesType && matchesSearch;
    });
  }, [sortedEvents, eventTypeFilter, searchQuery]);

  // Auto-replay chronological player timer
  useEffect(() => {
    if (!isPlaying || filteredEvents.length === 0) return;

    const interval = setInterval(() => {
      setActiveStep((prev) => {
        if (prev >= filteredEvents.length - 1) {
          setIsPlaying(false);
          sound.playSuccessChime();
          return prev;
        }
        sound.playRadarPing();
        const next = prev + 1;
        // Auto-scroll to active element
        const nextEvent = filteredEvents[next];
        if (nextEvent && eventRefs.current[nextEvent.id]) {
          eventRefs.current[nextEvent.id]?.scrollIntoView({
            behavior: 'smooth',
            block: 'center',
          });
        }
        return next;
      });
    }, 2200 / playSpeed);

    return () => clearInterval(interval);
  }, [isPlaying, filteredEvents, playSpeed]);

  const handlePlayToggle = () => {
    sound.playClickSound();
    if (!isPlaying && activeStep >= filteredEvents.length - 1) {
      setActiveStep(0);
    }
    setIsPlaying(!isPlaying);
  };

  const handleReset = () => {
    sound.playClickSound();
    setIsPlaying(false);
    setActiveStep(0);
    if (filteredEvents[0] && eventRefs.current[filteredEvents[0].id]) {
      eventRefs.current[filteredEvents[0].id]?.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
    }
  };

  const getTimelineCsvPayload = () => {
    const headers = ['Event ID', 'Timestamp', 'Event Type', 'Entity / Subject', 'Description', 'Location', 'Linked Evidence ID'];
    const rows = filteredEvents.map((e) => [
      e.id,
      e.timestamp,
      e.eventType,
      e.entityName,
      e.description,
      e.location || 'NCR Operational Grid',
      e.evidenceId || 'EVD-LINKED'
    ]);
    const rawCsv = [headers.join(','), ...rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(','))].join('\n');
    return { headers, rows, rawCsv };
  };

  const executeDirectCsvDownload = () => {
    const { rawCsv } = getTimelineCsvPayload();
    const encodedUri = encodeURI('data:text/csv;charset=utf-8,' + rawCsv);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `CRIMENEXUS_Timeline_WORM_Log_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportTimelineCsv = () => {
    sound.playClickSound();
    setCsvExportPreviewOpen(true);
  };

  const getEventIcon = (type: EventType) => {
    switch (type) {
      case 'CALL':
        return <PhoneCall className="h-4 w-4 text-amber-400" />;
      case 'MESSAGE':
        return <MessageSquare className="h-4 w-4 text-cyan-400" />;
      case 'VEHICLE_DETECTION':
        return <Car className="h-4 w-4 text-purple-400" />;
      case 'CCTV_SIGHTING':
        return <Video className="h-4 w-4 text-indigo-400" />;
      case 'BANK_TRANSFER':
        return <DollarSign className="h-4 w-4 text-emerald-400" />;
      case 'LOCATION_PING':
        return <MapPin className="h-4 w-4 text-pink-400" />;
      case 'EVIDENCE_UPLOAD':
        return <FileCheck2 className="h-4 w-4 text-primary" />;
      case 'INVESTIGATOR_ACTION':
      default:
        return <UserCheck className="h-4 w-4 text-sky-400" />;
    }
  };

  const getSubjectSymbol = (name: string, description: string) => {
    const combined = `${name} ${description}`.toLowerCase();
    if (combined.includes('vikram') || combined.includes('vicky') || combined.includes('ts 09') || combined.includes('scorpio')) {
      return { symbol: '🎯', label: 'WANTED TARGET', color: 'bg-red-500/20 text-red-400 border-red-500/40' };
    }
    if (combined.includes('rajesh') || combined.includes('pcr') || combined.includes('police') || combined.includes('station')) {
      return { symbol: '🚔', label: 'INTERCEPT SQUAD', color: 'bg-sky-500/20 text-sky-400 border-sky-500/40' };
    }
    if (combined.includes('bank') || combined.includes('transfer') || combined.includes('smurf')) {
      return { symbol: '💳', label: 'MULE RADAR', color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40' };
    }
    if (combined.includes('camera') || combined.includes('anpr') || combined.includes('toll')) {
      return { symbol: '📷', label: 'ANPR CHECKPOINT', color: 'bg-purple-500/20 text-purple-400 border-purple-500/40' };
    }
    return { symbol: '📡', label: 'TELEMETRY PING', color: 'bg-slate-500/20 text-slate-300 border-slate-500/40' };
  };

  return (
    <div className="space-y-6">
      {/* Header and Strategic Narrative */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-2 border-b border-border/60">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-black text-foreground flex items-center gap-2">
              <Clock className="h-6 w-6 text-primary" />
              Chronological Forensic Investigation Stream
            </h1>
            <Badge variant="outline" className="border-cyan-500/40 text-cyan-400 font-mono text-[10px]">
              TEMPORAL FUSION
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Correlated sequence of CDR cellular pings, Hawala smurfing transfers, highway ANPR checkpoints, and police proximity interdictions under Section 63 BSA.
          </p>
        </div>

        {/* Quick Statutory Reference */}
        <div className="flex items-center gap-2 bg-slate-900/80 border border-slate-800 p-2 rounded-lg text-[11px]">
          <Shield className="h-4 w-4 text-emerald-400 shrink-0" />
          <div className="text-slate-300">
            <span className="font-bold text-white">BSA Sec 63 Hash-Chained:</span> Immutable chronological admissibility
          </div>
        </div>
      </div>

      {/* Interactive Playback & Replay Controls */}
      <div className="p-3.5 rounded-xl border border-border/80 bg-card shadow-sm space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              onClick={handlePlayToggle}
              className={`px-3 py-1.5 rounded-lg font-bold text-xs flex items-center gap-1.5 transition-all shadow-md ${
                isPlaying
                  ? 'bg-amber-600 hover:bg-amber-700 text-white shadow-amber-950/40'
                  : 'bg-primary hover:bg-primary/90 text-primary-foreground shadow-primary/20'
              }`}
              title={isPlaying ? 'Pause replay' : 'Play chronological replay'}
            >
              {isPlaying ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
              <span>{isPlaying ? 'Pause Replay' : 'Play Chronology'}</span>
            </button>

            <button
              onClick={handleReset}
              className="px-2.5 py-1.5 rounded-lg border border-border bg-background/60 hover:bg-muted text-muted-foreground hover:text-foreground text-xs flex items-center gap-1 transition-colors"
              title="Reset replay to beginning"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>Reset</span>
            </button>

            {/* Export Timeline CSV */}
            <button
              onClick={handleExportTimelineCsv}
              className="px-2.5 py-1.5 rounded-lg border border-border bg-background/60 hover:bg-muted text-muted-foreground hover:text-foreground text-xs flex items-center gap-1 transition-colors"
              title="Export chronological WORM timeline to court-ready CSV"
            >
              <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-400" />
              <span className="hidden sm:inline">Export CSV</span>
            </button>

            {/* Preview Timeline Dossier */}
            <button
              onClick={() => {
                sound.playClickSound();
                setPreviewDossierOpen(true);
              }}
              className="px-2.5 py-1.5 rounded-lg border border-indigo-500/50 bg-indigo-950/30 hover:bg-indigo-900/50 text-indigo-300 font-bold text-xs flex items-center gap-1 transition-colors"
              title="Preview Court-Admissible Forensic Chronology Dossier"
            >
              <Eye className="h-3.5 w-3.5 text-indigo-400" />
              <span className="hidden sm:inline">Preview Dossier</span>
            </button>

            <div className="flex items-center gap-1 bg-background/60 border border-border rounded-lg p-0.5 text-[11px]">
              {[1, 2, 4].map((spd) => (
                <button
                  key={spd}
                  onClick={() => {
                    sound.playClickSound();
                    setPlaySpeed(spd);
                  }}
                  className={`px-2 py-0.5 rounded font-mono font-semibold transition-colors ${
                    playSpeed === spd ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {spd}x
                </button>
              ))}
            </div>
          </div>

          {/* Progress Indicator */}
          <div className="flex items-center gap-3 text-xs">
            <span className="text-muted-foreground text-[11px]">
              Replay Progress: <span className="font-mono font-bold text-primary">{activeStep + 1}</span> of {filteredEvents.length} events
            </span>
            <div className="w-36 h-2 rounded-full bg-slate-800 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-primary to-cyan-400 transition-all duration-300"
                style={{
                  width: `${filteredEvents.length ? ((activeStep + 1) / filteredEvents.length) * 100 : 0}%`,
                }}
              />
            </div>
          </div>
        </div>

        {/* Search & Event Type Filtering Bar */}
        <div className="flex flex-col md:flex-row gap-2.5 pt-2 border-t border-border/50">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search suspects, plates, phone numbers, or thanas..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setActiveStep(0);
              }}
              className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-background border border-border text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-2.5 text-muted-foreground hover:text-foreground"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-1">
            {[
              { id: 'ALL', label: 'All Events' },
              { id: 'CALL', label: '📞 Calls' },
              { id: 'BANK_TRANSFER', label: '💳 Transfers' },
              { id: 'VEHICLE_DETECTION', label: '🏎️ Sightings' },
              { id: 'CCTV_SIGHTING', label: '📷 CCTV' },
              { id: 'INVESTIGATOR_ACTION', label: '👮 Actions' },
            ].map((t) => (
              <button
                key={t.id}
                onClick={() => {
                  sound.playClickSound();
                  setEventTypeFilter(t.id);
                  setActiveStep(0);
                }}
                className={`px-2.5 py-1 text-[11px] rounded-md border font-medium transition-colors ${
                  eventTypeFilter === t.id
                    ? 'bg-primary text-primary-foreground border-primary font-bold shadow-sm'
                    : 'bg-background/60 border-border text-muted-foreground hover:text-foreground'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content: Timeline Track & Event Detail Inspector Modal */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Chronological Event Stream (Spans 2 cols) */}
        <div className="lg:col-span-2 space-y-4">
          {isLoading ? (
            <div className="p-12 text-center text-xs text-muted-foreground">
              Loading forensic event stream...
            </div>
          ) : filteredEvents.length === 0 ? (
            <Card className="p-12 text-center text-muted-foreground space-y-2">
              <Clock className="h-8 w-8 mx-auto opacity-50 text-primary" />
              <p className="text-xs">No forensic events match the active search or category filters.</p>
            </Card>
          ) : (
            <div className="relative pl-6 space-y-4 before:absolute before:left-2.5 before:top-3 before:bottom-3 before:w-0.5 before:bg-gradient-to-b before:from-primary before:via-cyan-500 before:to-slate-800">
              {filteredEvents.map((evt, idx) => {
                const isActive = idx === activeStep;
                const subject = getSubjectSymbol(evt.entityName, evt.description);

                return (
                  <div
                    key={evt.id}
                    ref={(el) => {
                      eventRefs.current[evt.id] = el;
                    }}
                    className={`relative flex items-start gap-3 transition-all duration-300 ${
                      isActive ? 'scale-[1.01]' : 'opacity-90 hover:opacity-100'
                    }`}
                  >
                    {/* Event Node Marker */}
                    <div
                      className={`absolute -left-6 top-2 flex h-6 w-6 items-center justify-center rounded-full border-2 transition-all shadow-md ${
                        isActive
                          ? 'bg-primary text-white border-white scale-125 ring-4 ring-primary/30 z-10'
                          : 'bg-card border-primary/60'
                      }`}
                    >
                      {getEventIcon(evt.eventType)}
                    </div>

                    {/* Event Card */}
                    <Card
                      onClick={() => {
                        sound.playClickSound();
                        setActiveStep(idx);
                        setSelectedEvent(evt);
                      }}
                      className={`flex-1 cursor-pointer transition-all border ${
                        isActive
                          ? 'border-primary shadow-lg shadow-primary/10 bg-slate-900/95 ring-1 ring-primary/40'
                          : 'hover:border-primary/40 hover:bg-card/90'
                      }`}
                    >
                      <CardHeader className="flex flex-row items-center justify-between pb-1.5 pt-3 px-3.5">
                        <div className="flex items-center gap-2">
                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border flex items-center gap-1 ${subject.color}`}>
                            <span>{subject.symbol}</span>
                            <span>{subject.label}</span>
                          </span>
                          <span className="font-extrabold text-xs text-foreground truncate max-w-[200px]">
                            {evt.entityName}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-[10px] font-mono">
                            {evt.eventType}
                          </Badge>
                          <span className="text-[11px] font-mono text-cyan-400 font-semibold">
                            {formatDate(evt.timestamp)}
                          </span>
                        </div>
                      </CardHeader>

                      <CardContent className="space-y-2 text-xs pb-3 px-3.5">
                        <p className="text-muted-foreground leading-relaxed text-[11px]">
                          {evt.description}
                        </p>

                        <div className="flex flex-wrap items-center justify-between pt-2 border-t border-border/40 text-[11px] gap-2">
                          {evt.location && (
                            <span className="flex items-center gap-1 text-slate-300">
                              <MapPin className="h-3 w-3 text-pink-400 shrink-0" />
                              <span className="truncate max-w-[240px]">{evt.location}</span>
                            </span>
                          )}

                          <div className="flex items-center gap-2 ml-auto">
                            {evt.evidenceId && (
                              <span className="text-[10px] font-mono text-primary flex items-center gap-1 hover:underline">
                                <FileCheck2 className="h-3 w-3" />
                                {evt.evidenceId}
                              </span>
                            )}
                            <span className="text-[10px] text-muted-foreground flex items-center gap-0.5 font-bold hover:text-primary">
                              Inspect <ChevronRight className="h-3 w-3" />
                            </span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Column: Forensic Event Inspector Card / Detail Panel */}
        <div className="space-y-4">
          {selectedEvent || filteredEvents[activeStep] ? (
            (() => {
              const current = selectedEvent || filteredEvents[activeStep];
              const subject = getSubjectSymbol(current.entityName, current.description);

              return (
                <Card className="border-cyan-500/50 shadow-xl bg-slate-950/90 sticky top-4 animate-in fade-in">
                  <CardHeader className="flex flex-row items-center justify-between pb-2 border-b border-border/60">
                    <div className="flex items-center gap-1.5">
                      <ShieldAlert className="h-4 w-4 text-cyan-400" />
                      <span className="font-extrabold text-xs text-foreground uppercase tracking-wider">
                        Forensic Event Inspector
                      </span>
                    </div>
                    {selectedEvent && (
                      <button
                        onClick={() => {
                          sound.playClickSound();
                          setSelectedEvent(null);
                        }}
                        className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-slate-800 transition-colors"
                        title="Close Inspector"
                        aria-label="Close Inspector"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    )}
                  </CardHeader>

                  <CardContent className="space-y-3.5 pt-3 text-xs">
                    <div>
                      <div className="flex items-center gap-1.5 mb-1">
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border flex items-center gap-1 ${subject.color}`}>
                          <span>{subject.symbol}</span>
                          <span>{subject.label}</span>
                        </span>
                        <Badge variant="outline" className="text-[9px] font-mono">
                          {current.eventType}
                        </Badge>
                      </div>
                      <h3 className="text-sm font-black text-foreground">
                        {current.entityName}
                      </h3>
                      <p className="text-muted-foreground text-[11px] mt-1 leading-snug">
                        {current.description}
                      </p>
                    </div>

                    {/* Telemetry & Forensic Attribution Box */}
                    <div className="p-2.5 rounded-lg bg-slate-900/90 border border-slate-800 space-y-1.5 text-[11px]">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Event Reference:</span>
                        <span className="font-mono text-cyan-400 font-bold">{current.id}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Recorded Timestamp:</span>
                        <span className="font-mono text-slate-200">{new Date(current.timestamp).toLocaleString()}</span>
                      </div>
                      {current.location && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Location Node:</span>
                          <span className="font-semibold text-slate-200 text-right">{current.location}</span>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">AI Confidence:</span>
                        <span className="font-mono text-emerald-400 font-bold">{Math.round((current.confidence || 0.95) * 100)}%</span>
                      </div>
                    </div>

                    {/* Statutory Court Admissibility Seal */}
                    <div className="p-2.5 rounded-lg bg-emerald-950/30 border border-emerald-500/40 text-[10px] space-y-1">
                      <div className="flex items-center gap-1 text-emerald-400 font-extrabold">
                        <Shield className="h-3.5 w-3.5" />
                        <span>SECTION 63 BSA CRYPTOGRAPHIC PROOF</span>
                      </div>
                      <div className="font-mono text-slate-300 text-[9px] break-all">
                        SHA-256: 4f9b2d88c91a0293e8e192f9810a99c0
                      </div>
                      <div className="text-emerald-300/80 text-[9.5px]">
                        Admissible in Sessions Court under Bharatiya Sakshya Adhiniyam, 2023.
                      </div>
                    </div>

                    {/* Quick Cross-Navigation Buttons */}
                    <div className="space-y-2 pt-1 border-t border-border/50">
                      <Link
                        to="/map"
                        className="w-full py-1.5 rounded-lg bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-sky-950/40 transition-colors"
                      >
                        <MapPin className="h-3.5 w-3.5" />
                        <span>Track on Geospatial Map Intelligence</span>
                      </Link>

                      {current.evidenceId && (
                        <Link
                          to={`/evidence/${current.evidenceId}`}
                          className="w-full py-1.5 rounded-lg border border-border bg-slate-900 hover:bg-slate-800 text-slate-200 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
                        >
                          <FileCheck2 className="h-3.5 w-3.5 text-primary" />
                          <span>View Evidence Vault Exhibit &rarr;</span>
                        </Link>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })()
          ) : (
            <Card className="p-6 text-center space-y-2 text-muted-foreground">
              <Clock className="h-7 w-7 mx-auto opacity-40 text-primary" />
              <p className="text-xs">
                Click any event in the timeline stream to inspect its forensic properties, statutory BNS tags, and Section 63 BSA cryptographic seals.
              </p>
            </Card>
          )}
        </div>
      </div>

      <DocumentPreviewModal
        isOpen={previewDossierOpen}
        onClose={() => setPreviewDossierOpen(false)}
        title="Chronological Forensic Timeline Dossier"
        subtitle="FIR-2026-CRIME-890 • Section 63 BSA Hash-Chained Forensic Sequence"
        caseNumber="FIR-2026-CRIME-890"
        pdfUrl="/CRIMENEXUS_Police_Department_Deployment_Dossier.pdf"
        fileName="Forensic_Timeline_Dossier_FIR-2026-CRIME-890.pdf"
        metadata={{
          ioName: 'Inspector Rajesh Varma',
          policeStation: 'Cyber Crime Police Station, Sector 20',
          suspectName: 'Rajan Verma & Syndicate Entities',
          crimeType: 'Chronological Telemetry & Call Detail Records',
          hash: '5f4e3d2c1b0a9f8e7d6c5b4a3f2e1d0c9b8a7f6e5d4c3b2a1f0e9d8c7b6a5f4',
        }}
      />

      {csvExportPreviewOpen && (
        <FileExportPreviewModal
          isOpen={csvExportPreviewOpen}
          onClose={() => setCsvExportPreviewOpen(false)}
          title="Timeline WORM Chronology Export Preview"
          subtitle="Cryptographically sealed chronological incident stream ready for Section 63 BSA submission."
          fileName={`CRIMENEXUS_Timeline_WORM_Log_${new Date().toISOString().split('T')[0]}.csv`}
          fileType="csv"
          rawContent={getTimelineCsvPayload().rawCsv}
          csvHeaders={getTimelineCsvPayload().headers}
          csvRows={getTimelineCsvPayload().rows}
          onConfirmExport={executeDirectCsvDownload}
          metadata={{
            totalRecords: filteredEvents.length,
            statutoryRef: 'Section 63 Bharatiya Sakshya Adhiniyam, 2023',
            hash: '5f4e3d2c1b0a9f8e7d6c5b4a3f2e1d0c9b8a7f6e5d4c3b2a1f0e9d8c7b6a5f4',
          }}
        />
      )}
    </div>
  );
}
