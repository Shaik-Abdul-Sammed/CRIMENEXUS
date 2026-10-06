import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  FileCheck2,
  Upload,
  Search,
  Filter,
  FileText,
  Video,
  PhoneCall,
  DollarSign,
  Car,
  MapPin,
  MessageSquare,
  Hash,
  ShieldCheck,
} from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useCaseEvidence, useUploadEvidenceMutation } from '../../hooks/useIntelligenceApi';
import { EvidenceType } from '../../types';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { formatDate } from '../../utils/formatters';

const evidenceUploadSchema = z.object({
  title: z.string().min(5, 'Title required'),
  type: z.enum([
    'DOCUMENT',
    'IMAGE',
    'CCTV',
    'CALL_RECORD',
    'FINANCIAL_TRANSACTION',
    'VEHICLE_SIGHTING',
    'LOCATION_RECORD',
    'COMMUNICATION_RECORD',
  ]),
  source: z.string().min(3, 'Source required'),
  sourceReference: z.string().min(3, 'Reference required'),
  description: z.string().min(10, 'Description required'),
});

type UploadFormData = z.infer<typeof evidenceUploadSchema>;

export function EvidencePage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { data: evidenceList, isLoading } = useCaseEvidence('ALL', typeFilter);
  const uploadMutation = useUploadEvidenceMutation();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<UploadFormData>({
    resolver: zodResolver(evidenceUploadSchema),
    defaultValues: { type: 'DOCUMENT' },
  });

  const onSubmit = (data: UploadFormData) => {
    uploadMutation.mutate(data, {
      onSuccess: () => {
        setIsModalOpen(false);
        reset();
      },
    });
  };

  const getTypeIcon = (type: EvidenceType) => {
    switch (type) {
      case 'CCTV':
        return <Video className="h-4 w-4 text-purple-400" />;
      case 'CALL_RECORD':
        return <PhoneCall className="h-4 w-4 text-amber-400" />;
      case 'FINANCIAL_TRANSACTION':
        return <DollarSign className="h-4 w-4 text-emerald-400" />;
      case 'VEHICLE_SIGHTING':
        return <Car className="h-4 w-4 text-blue-400" />;
      case 'LOCATION_RECORD':
        return <MapPin className="h-4 w-4 text-pink-400" />;
      case 'COMMUNICATION_RECORD':
        return <MessageSquare className="h-4 w-4 text-cyan-400" />;
      case 'DOCUMENT':
      default:
        return <FileText className="h-4 w-4 text-primary" />;
    }
  };

  const filtered = evidenceList?.filter(
    (e) =>
      e.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.evidenceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.source.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-foreground flex items-center gap-2">
            <FileCheck2 className="h-6 w-6 text-primary" />
            Evidence Vault & Chain of Custody
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Cryptographically hashed multi-source intelligence artifacts, extract logs, and source references.
          </p>
        </div>
        <Button onClick={() => setIsModalOpen(true)} icon={<Upload className="h-4 w-4" />}>
          Upload Evidence Artifact
        </Button>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 p-4 rounded-xl border border-border bg-card">
        <div className="w-full md:w-80">
          <Input
            placeholder="Filter evidence by number, title, or source..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            icon={<Search className="h-4 w-4" />}
          />
        </div>
        <div className="flex flex-wrap items-center gap-1.5 w-full md:w-auto">
          <Filter className="h-4 w-4 text-muted-foreground mr-1" />
          {[
            'ALL',
            'CALL_RECORD',
            'FINANCIAL_TRANSACTION',
            'DOCUMENT',
            'CCTV',
            'LOCATION_RECORD',
          ].map((t) => (
            <button
              key={t}
              onClick={() => setTypeFilter(t)}
              className={`px-2.5 py-1 text-[11px] rounded-md border font-medium transition-colors ${
                typeFilter === t
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'bg-background/50 border-border text-muted-foreground hover:text-foreground'
              }`}
            >
              {t.replace(/_/g, ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Evidence Items Grid */}
      {isLoading ? (
        <div className="p-12 text-center text-xs text-muted-foreground">Loading evidence vault...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered?.map((item) => (
            <Card key={item.id} className="flex flex-col justify-between hover:border-primary/50 transition-all">
              <CardHeader className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs text-primary font-bold flex items-center gap-1.5">
                    {getTypeIcon(item.type)}
                    {item.evidenceNumber}
                  </span>
                  <Badge variant={item.processingStatus === 'PROCESSED' ? 'success' : 'warning'}>
                    {item.processingStatus}
                  </Badge>
                </div>
                <CardTitle className="text-sm line-clamp-1">{item.title}</CardTitle>
              </CardHeader>

              <CardContent className="space-y-3 flex-1 text-xs">
                <p className="text-muted-foreground leading-relaxed line-clamp-2">{item.description}</p>

                <div className="p-2.5 rounded-lg bg-background/60 border border-border/50 space-y-1 text-[11px]">
                  <div className="flex items-center justify-between text-muted-foreground">
                    <span>Source:</span>
                    <span className="font-medium text-foreground truncate max-w-[160px]">{item.source}</span>
                  </div>
                  <div className="flex items-center justify-between text-muted-foreground">
                    <span>Ref:</span>
                    <span className="font-mono text-foreground">{item.sourceReference}</span>
                  </div>
                  <div className="flex items-center justify-between text-muted-foreground">
                    <span>Uploaded By:</span>
                    <span className="text-foreground">{item.uploadedBy}</span>
                  </div>
                </div>

                <div className="flex items-center gap-1 text-[10px] font-mono text-muted-foreground bg-muted/40 p-2 rounded border border-border/30 truncate">
                  <Hash className="h-3 w-3 text-primary shrink-0" />
                  <span className="truncate">{item.hash}</span>
                </div>
              </CardContent>

              <div className="p-4 pt-0 border-t border-border/40 mt-3 flex items-center justify-between">
                <span className="text-[10px] text-muted-foreground">{formatDate(item.timestamp)}</span>
                <Link to={`/evidence/${item.id}`}>
                  <Button size="sm" variant="outline">
                    Inspect Artifact &rarr;
                  </Button>
                </Link>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Upload Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Upload & Hash Evidence Artifact"
        description="Catalog official digital forensic extracts, documents, CCTV references, or telecom logs."
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input label="Artifact Title" placeholder="e.g. Seized Phone CDR Extract" {...register('title')} error={errors.title?.message} />

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Evidence Type
            </label>
            <select
              {...register('type')}
              className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            >
              <option value="CALL_RECORD">CALL RECORD (CDR)</option>
              <option value="FINANCIAL_TRANSACTION">FINANCIAL TRANSACTION</option>
              <option value="DOCUMENT">DOCUMENT / DEED</option>
              <option value="CCTV">CCTV SURVEILLANCE</option>
              <option value="VEHICLE_SIGHTING">VEHICLE ANPR SIGHTING</option>
              <option value="LOCATION_RECORD">LOCATION TOWER DUMP</option>
              <option value="COMMUNICATION_RECORD">COMMUNICATION / CHAT LOG</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input label="Source Agency/Lab" placeholder="e.g. Cyber Forensics Lab" {...register('source')} error={errors.source?.message} />
            <Input label="Official Reference #" placeholder="e.g. CFL-REPORT-8849" {...register('sourceReference')} error={errors.sourceReference?.message} />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Description & Context
            </label>
            <textarea
              rows={3}
              {...register('description')}
              placeholder="Summary of forensic findings, extracted entities, and metadata..."
              className="w-full rounded-md border border-input bg-background p-2.5 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            />
            {errors.description && <p className="text-xs text-destructive">{errors.description.message}</p>}
          </div>

          <div className="p-3 rounded-lg bg-primary/10 border border-primary/20 text-xs text-primary flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 shrink-0" />
            <span>SHA-256 integrity hash will be generated automatically upon upload.</span>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-border">
            <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" isLoading={uploadMutation.isPending}>
              Process & Hash Artifact
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
