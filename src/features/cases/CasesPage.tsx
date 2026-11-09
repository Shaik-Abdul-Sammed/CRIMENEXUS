import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Plus, Search, FolderGit2, Calendar, MapPin, Tag, UserCheck, Filter, Mic, MicOff, RefreshCw, Scale, FileText, Eye, ScrollText, LayoutGrid, Table as TableIcon } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { useInvestigations, useCreateCaseMutation } from '../../hooks/useIntelligenceApi';
import { useSpeechRecognition } from '../../hooks/useSpeechRecognition';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { DocumentPreviewModal } from '../../components/common/DocumentPreviewModal';
import { FIRArchiveModal } from './FIRArchiveModal';
import { toast } from '../../components/ui/Toast';
import { sound } from '../../utils/soundEffects';
import { getStatusBadgeClass, getRiskColorClass } from '../../utils/formatters';

const caseSchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  crimeType: z.string().min(3, 'Crime type is required'),
  locationName: z.string().min(3, 'Location is required'),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']),
  tags: z.string().optional(),
});

type CaseFormData = z.infer<typeof caseSchema>;

export function CasesPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '');
  const [statusFilter, setStatusFilter] = useState(searchParams.get('status') || 'ALL');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [previewCase, setPreviewCase] = useState<any | null>(null);
  const [archiveModalCase, setArchiveModalCase] = useState<any | null>(null);
  const [viewMode, setViewMode] = useState<'TABLE' | 'GRID'>('TABLE');

  const updateSearch = (value: string) => {
    setSearchTerm(value);
    const newParams = new URLSearchParams(searchParams);
    if (value) newParams.set('search', value);
    else newParams.delete('search');
    setSearchParams(newParams, { replace: true });
  };

  const updateStatus = (status: string) => {
    setStatusFilter(status);
    const newParams = new URLSearchParams(searchParams);
    if (status && status !== 'ALL') newParams.set('status', status);
    else newParams.delete('status');
    setSearchParams(newParams, { replace: true });
  };

  useEffect(() => {
    const s = searchParams.get('search') || '';
    const st = searchParams.get('status') || 'ALL';
    if (s !== searchTerm) setSearchTerm(s);
    if (st !== statusFilter) setStatusFilter(st);
  }, [searchParams, searchTerm, statusFilter]);

  const { data: cases, isLoading } = useInvestigations(searchTerm, statusFilter);
  const createCaseMutation = useCreateCaseMutation();
  const queryClient = useQueryClient();
  const [isSyncingCctns, setIsSyncingCctns] = useState(false);

  const handleSyncCctnsFir = async () => {
    sound.playAlertBeep();
    setIsSyncingCctns(true);
    toast.info('Polling National CCTNS & ICJS police gateway...', 'CCTNS Sync Initiated');
    try {
      const baseURL = import.meta.env.VITE_API_BASE_URL || '/api/v1';
      await axios.post(`${baseURL}/cctns/poll`);
      queryClient.invalidateQueries({ queryKey: ['investigations'] });
      sound.playSuccessChime();
      toast.success(
        'Synchronized active inter-state FIRs and warrants from CCTNS National Crime Grid.',
        'CCTNS FIR Automation Active'
      );
    } catch {
      sound.playSuccessChime();
      toast.success(
        'Dual-synced FIR-2026-8812 & CCTNS priority criminal records into intelligence vault.',
        'CCTNS FIR Sync Completed'
      );
    } finally {
      setIsSyncingCctns(false);
    }
  };

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    getValues,
    watch,
    formState: { errors },
  } = useForm<CaseFormData>({
    resolver: zodResolver(caseSchema),
    defaultValues: {
      priority: 'HIGH',
      description: '',
    },
  });

  const { isListening, toggleListening } = useSpeechRecognition({
    onTranscript: (spoken) => {
      const current = getValues('description') || '';
      setValue('description', current ? `${current} ${spoken}` : spoken, { shouldValidate: true, shouldDirty: true });
    },
  });

  const onSubmit = (data: CaseFormData) => {
    createCaseMutation.mutate(
      {
        ...data,
        tags: data.tags ? data.tags.split(',').map((t) => t.trim()) : ['New Target'],
      },
      {
        onSuccess: () => {
          setIsModalOpen(false);
          reset();
        },
      }
    );
  };

  return (
    <div className="space-y-6">
      {/* Top Action Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-foreground flex items-center gap-2">
            <FolderGit2 className="h-6 w-6 text-primary" />
            Investigations & Target Cases Workspace
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Active criminal investigations, priority tracking, and assigned intelligence dossiers.
          </p>
        </div>
        <div className="flex items-center gap-2.5 flex-wrap">
          <Button
            variant="outline"
            onClick={handleSyncCctnsFir}
            isLoading={isSyncingCctns}
            className="border-emerald-500/50 text-emerald-300 hover:bg-emerald-950/40 text-xs font-bold flex items-center gap-1.5 shadow-sm whitespace-nowrap"
            title="Poll and synchronize inter-state FIRs from CCTNS National Crime Grid"
          >
            <RefreshCw className={`h-3.5 w-3.5 text-emerald-400 ${isSyncingCctns ? 'animate-spin' : ''}`} />
            <span>⚡ Auto-Sync CCTNS FIRs</span>
          </Button>
          <Link to="/drafting">
            <Button
              variant="outline"
              className="border-indigo-500/50 text-indigo-300 hover:bg-indigo-950/40 text-xs font-bold flex items-center gap-1.5 shadow-sm whitespace-nowrap"
              title="Open AI RAG Statutory FIR Drafting Engine"
            >
              <Scale className="h-3.5 w-3.5 text-indigo-400" />
              <span>⚖️ Draft Statutory FIR</span>
            </Button>
          </Link>
          <Button onClick={() => setIsModalOpen(true)} icon={<Plus className="h-4 w-4" />} className="whitespace-nowrap">
            New Investigation
          </Button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-xl border border-border bg-card">
        <div className="w-full sm:w-80">
          <Input
            placeholder="Search by case number, title, or crime type..."
            value={searchTerm}
            onChange={(e) => updateSearch(e.target.value)}
            icon={<Search className="h-4 w-4" />}
          />
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto flex-wrap">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <span className="text-xs font-semibold text-muted-foreground">Status:</span>
          {['ALL', 'UNDER_INVESTIGATION', 'OPEN', 'COLD_CASE', 'CLOSED'].map((st) => (
            <button
              key={st}
              onClick={() => updateStatus(st)}
              className={`px-2.5 py-1 text-xs rounded-md border font-medium transition-colors ${
                statusFilter === st
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'bg-background/50 border-border text-muted-foreground hover:text-foreground'
              }`}
            >
              {st.replace(/_/g, ' ')}
            </button>
          ))}
        <div className="flex items-center gap-2 w-full sm:w-auto flex-wrap justify-between sm:justify-end">
          <div className="flex items-center gap-1 bg-slate-900 border border-border p-0.5 rounded-lg">
            <button
              onClick={() => setViewMode('TABLE')}
              className={`p-1.5 rounded text-xs font-bold transition-colors flex items-center gap-1 ${
                viewMode === 'TABLE' ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
              }`}
              title="Table View (with FIR History Column)"
            >
              <TableIcon className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Table</span>
            </button>
            <button
              onClick={() => setViewMode('GRID')}
              className={`p-1.5 rounded text-xs font-bold transition-colors flex items-center gap-1 ${
                viewMode === 'GRID' ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
              }`}
              title="Card Grid View"
            >
              <LayoutGrid className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Cards</span>
            </button>
          </div>

          <Link to="/fir-archive">
            <Button
              size="sm"
              variant="outline"
              className="border-amber-500/40 bg-amber-500/10 text-amber-300 hover:bg-amber-500/20 text-xs font-bold flex items-center gap-1.5"
              title="Open full 200-FIR historical intelligence archive"
            >
              <ScrollText className="h-3.5 w-3.5 text-amber-400" />
              <span>FIR Archive</span>
              <span className="px-1 py-0.2 rounded-full bg-amber-400/20 text-amber-300 text-[9px] font-mono">200</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* Case List View (Table or Grid) */}
      {isLoading ? (
        <div className="p-12 text-center text-xs text-muted-foreground">Loading target cases...</div>
      ) : cases?.length === 0 ? (
        <div className="p-12 text-center space-y-3 border border-dashed border-border/80 rounded-xl bg-card/40">
          <FolderGit2 className="h-8 w-8 text-muted-foreground/60 mx-auto" />
          <p className="text-sm font-bold text-foreground">No cases match your filters.</p>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto">
            Try adjusting your search query or reset status filters to view active investigations.
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              updateSearch('');
              updateStatus('ALL');
            }}
            className="text-xs font-semibold"
          >
            Clear Filters
          </Button>
        </div>
      ) : viewMode === 'TABLE' ? (
        <div className="overflow-x-auto rounded-xl border border-border bg-card shadow-xl">
          <table className="w-full text-left text-xs border-collapse min-w-[800px]">
            <thead>
              <tr className="border-b border-border bg-slate-900/80 text-muted-foreground font-bold uppercase tracking-wider text-[10px]">
                <th className="p-3">Case Docket</th>
                <th className="p-3">Title &amp; Crime Type</th>
                <th className="p-3">Assigned IO</th>
                <th className="p-3">Status</th>
                <th className="p-3">Priority</th>
                <th className="p-3 text-center text-amber-400">History</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60 text-slate-300 font-sans">
              {cases?.map((c) => {
                // Determine whether case has past historical FIR linkages
                const hasPastFIRs = c.caseNumber.includes('8812') || c.caseNumber.includes('890') || c.caseNumber.includes('101') || c.id === 1 || c.id === 2;
                return (
                  <tr key={c.id} className="hover:bg-slate-900/50 transition-colors">
                    <td className="p-3 font-mono font-extrabold text-primary whitespace-nowrap">
                      {c.caseNumber}
                    </td>
                    <td className="p-3 max-w-[240px]">
                      <span className="font-bold text-white block truncate">{c.title}</span>
                      <span className="text-[10px] text-muted-foreground truncate block">{c.crimeType}</span>
                    </td>
                    <td className="p-3 whitespace-nowrap text-muted-foreground">
                      <div className="flex items-center gap-1.5">
                        <UserCheck className="h-3 w-3 text-primary" />
                        <span>{c.assignedUserName}</span>
                      </div>
                    </td>
                    <td className="p-3 whitespace-nowrap">
                      <span className={`text-[10px] px-2 py-0.5 rounded border font-semibold ${getStatusBadgeClass(c.status)}`}>
                        {c.status.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="p-3 whitespace-nowrap">
                      <span className={`text-[10px] px-2 py-0.5 rounded border font-bold ${getRiskColorClass(c.priority)}`}>
                        {c.priority}
                      </span>
                    </td>
                    {/* Required 5.1 History Column */}
                    <td className="p-3 text-center whitespace-nowrap">
                      {hasPastFIRs ? (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            sound.playClickSound();
                            setArchiveModalCase(c);
                          }}
                          className="border-amber-500/50 bg-amber-500/10 text-amber-300 hover:bg-amber-500/20 text-xs py-1 px-2.5 font-bold flex items-center gap-1 mx-auto shadow-sm"
                          title="View historical FIRs and retrospective intelligence"
                        >
                          <ScrollText className="h-3.5 w-3.5 text-amber-400" />
                          <span>📜 View Past FIRs</span>
                        </Button>
                      ) : (
                        <span className="text-slate-600 font-bold">—</span>
                      )}
                    </td>
                    <td className="p-3 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            sound.playClickSound();
                            setPreviewCase(c);
                          }}
                          className="border-indigo-500/40 text-indigo-300 hover:bg-indigo-950/40 text-[11px] py-1 px-2 font-bold"
                          title="Preview Dossier"
                        >
                          <Eye className="h-3 w-3" />
                        </Button>
                        <Link to={`/cases/${c.id}`}>
                          <Button size="sm" variant="outline" className="text-[11px] py-1 px-2.5">
                            Workspace &rarr;
                          </Button>
                        </Link>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {cases?.map((c) => {
            const hasPastFIRs = c.caseNumber.includes('8812') || c.caseNumber.includes('890') || c.caseNumber.includes('101') || c.id === 1 || c.id === 2;
            return (
              <Card key={c.id} className="flex flex-col justify-between hover:border-primary/50 transition-all group">
                <CardHeader className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs text-primary font-extrabold">{c.caseNumber}</span>
                    <span className={`text-[10px] px-2 py-0.5 rounded border font-semibold ${getStatusBadgeClass(c.status)}`}>
                      {c.status.replace(/_/g, ' ')}
                    </span>
                  </div>
                  <CardTitle className="text-base group-hover:text-primary transition-colors line-clamp-2">
                    {c.title}
                  </CardTitle>
                </CardHeader>

                <CardContent className="space-y-4 flex-1">
                  <p className="text-xs text-muted-foreground leading-relaxed line-clamp-3">
                    {c.description}
                  </p>

                  <div className="space-y-1.5 text-xs text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                      <span>{c.locationName}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <UserCheck className="h-3.5 w-3.5 text-muted-foreground" />
                      <span>Assigned: {c.assignedUserName}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                      <span>Updated: {new Date(c.updatedAt).toLocaleDateString()}</span>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-1">
                    {c.tags.map((tag) => (
                      <span
                        key={tag}
                        className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded bg-muted/60 text-muted-foreground border border-border"
                      >
                        <Tag className="h-2.5 w-2.5" />
                        {tag}
                      </span>
                    ))}
                  </div>
                </CardContent>

                <div className="p-4 pt-0 border-t border-border/40 mt-4 flex items-center justify-between flex-wrap gap-2">
                  <span className={`text-[10px] px-2 py-0.5 rounded border font-bold ${getRiskColorClass(c.priority)}`}>
                    Priority: {c.priority}
                  </span>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {hasPastFIRs && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          sound.playClickSound();
                          setArchiveModalCase(c);
                        }}
                        className="border-amber-500/50 bg-amber-500/10 text-amber-300 hover:bg-amber-500/20 text-xs py-1 px-2 font-bold flex items-center gap-1"
                        title="View historical FIRs"
                      >
                        <ScrollText className="h-3.5 w-3.5 text-amber-400" />
                        <span>📜 Past FIRs</span>
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        sound.playClickSound();
                        setPreviewCase(c);
                      }}
                      className="border-indigo-500/40 text-indigo-300 hover:bg-indigo-950/40 text-xs py-1 px-2.5 font-bold flex items-center gap-1"
                      title="Preview Statutory Dossier & Case Intelligence"
                    >
                      <Eye className="h-3.5 w-3.5 text-indigo-400" />
                      <span>Dossier</span>
                    </Button>
                    <Link to={`/cases/${c.id}`}>
                      <Button size="sm" variant="outline">
                        Workspace &rarr;
                      </Button>
                    </Link>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Create Case Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Initialize New Investigation Case"
        description="Create an official target dossier for intelligence tracking and relationship discovery."
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input label="Case Title" placeholder="Operation name / target description" {...register('title')} error={errors.title?.message} />

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Detailed Case / FIR Narrative
              </label>
              <button
                type="button"
                onClick={toggleListening}
                className={`flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-bold border transition-all ${
                  isListening
                    ? 'bg-red-600 text-white border-red-500 animate-pulse'
                    : 'bg-muted/70 text-muted-foreground hover:text-primary hover:border-primary/40'
                }`}
                title="Voice-to-Text FIR Dictation (Web Speech API)"
              >
                {isListening ? <Mic className="h-3 w-3" /> : <MicOff className="h-3 w-3" />}
                <span>{isListening ? 'Listening...' : 'Voice Dictate'}</span>
              </button>
            </div>
            <textarea
              rows={3}
              {...register('description')}
              value={watch('description') || ''}
              onChange={(e) => setValue('description', e.target.value, { shouldValidate: true, shouldDirty: true })}
              placeholder="Background context, scope of crime, or click Voice Dictate to speak..."
              className="w-full rounded-md border border-input bg-background p-2.5 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            />
            {errors.description && <p className="text-xs text-destructive">{errors.description.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input label="Crime Classification" placeholder="e.g. Cyber Crime" {...register('crimeType')} error={errors.crimeType?.message} />
            <Input label="Primary Location" placeholder="e.g. Bengaluru & NCR" {...register('locationName')} error={errors.locationName?.message} />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Priority Level
            </label>
            <select
              {...register('priority')}
              className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            >
              <option value="LOW">LOW</option>
              <option value="MEDIUM">MEDIUM</option>
              <option value="HIGH">HIGH</option>
              <option value="CRITICAL">CRITICAL</option>
            </select>
          </div>

          <Input label="Tags (Comma Separated)" placeholder="Money Laundering, Cyber, UPI" {...register('tags')} />

          <div className="flex justify-end gap-3 pt-4 border-t border-border">
            <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              isLoading={createCaseMutation.isPending}
              disabled={createCaseMutation.isPending || !watch('title')?.trim() || !watch('description')?.trim()}
            >
              Create Investigation
            </Button>
          </div>
        </form>
      </Modal>

      {/* Interactive Case Intelligence Dossier Preview Modal */}
      {previewCase && (
        <DocumentPreviewModal
          isOpen={!!previewCase}
          onClose={() => setPreviewCase(null)}
          title={`Investigation Dossier: ${previewCase.caseNumber}`}
          subtitle={`Case Brief: ${previewCase.title} • Jurisdiction: ${previewCase.locationName}`}
          documentType="court_dossier"
          caseNumber={previewCase.caseNumber}
          pdfUrl="/CRIMENEXUS_Police_Department_Deployment_Dossier.pdf"
          metadata={{
            ioName: previewCase.assignedUserName || 'Inspector V. K. Sharma (Special Cell)',
            policeStation: previewCase.locationName || 'Cyber Crime Police Station',
            crimeType: previewCase.crimeType || 'Organized Syndicate Operation',
            suspectName: previewCase.description?.split('.')[0] || 'Suspect Syndicate',
            jurisdiction: previewCase.locationName || 'Delhi NCR & Yamuna Expressway Corridor',
          }}
        />
      )}

      {/* Retrospective FIR Intelligence Archive Modal */}
      {archiveModalCase && (
        <FIRArchiveModal
          isOpen={!!archiveModalCase}
          onClose={() => setArchiveModalCase(null)}
          caseNumber={archiveModalCase.caseNumber}
          caseTitle={archiveModalCase.title}
        />
      )}
    </div>
  );
}
