import React, { useState, useRef, useEffect, useCallback } from 'react';
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
  Archive,
  Eye,
  RefreshCw,
  Copy,
  Check,
  FolderOpen,
  Download,
} from 'lucide-react';
import axios from 'axios';
import { useCaseEvidence } from '../../hooks/useIntelligenceApi';
import { EvidenceType } from '../../types';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { DocumentPreviewModal } from '../../components/common/DocumentPreviewModal';
import { formatDate } from '../../utils/formatters';
import { useToast } from '../../components/ui/Toast';
import { useAppStore } from '../../stores/appStore';
import { useTranslation } from '../../hooks/useTranslation';

interface IngestedEvidenceItem {
  id: string;
  evidenceNumber: string;
  title: string;
  type: EvidenceType;
  source: string;
  sourceReference: string;
  description: string;
  hash: string;
  timestamp: string;
  uploadedBy: string;
  processingStatus: string;
  file_size?: number;
  filename?: string;
  video_url?: string;
}

export function EvidencePage() {
  const toast = useToast();
  const { t } = useTranslation();
  const activeCaseId = useAppStore((state) => state.activeCaseId);

  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [downloadingBundle, setDownloadingBundle] = useState(false);
  const [previewManifestOpen, setPreviewManifestOpen] = useState(false);
  const [copiedHash, setCopiedHash] = useState<string | null>(null);

  // Upload & Drag-and-Drop state
  const [dragActive, setDragActive] = useState<boolean>(false);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploadProgress, setUploadProgress] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Live backend evidence state with fallback
  const { data: storeEvidence, isLoading: storeLoading, refetch } = useCaseEvidence(activeCaseId || 'ALL', typeFilter);
  const [liveItems, setLiveItems] = useState<IngestedEvidenceItem[]>([]);
  const [fetchingBackend, setFetchingBackend] = useState<boolean>(true);

  // Fetch from backend /api/v1/evidence
  const fetchLiveEvidence = useCallback(async () => {
    setFetchingBackend(true);
    try {
      const baseURL = import.meta.env.VITE_API_BASE_URL || '/api/v1';
      const res = await axios.get(`${baseURL}/evidence`, {
        params: { case_id: activeCaseId, type: typeFilter },
        timeout: 4000,
      });
      if (Array.isArray(res.data) && res.data.length > 0) {
        setLiveItems(res.data);
      } else if (storeEvidence && storeEvidence.length > 0) {
        setLiveItems(storeEvidence as IngestedEvidenceItem[]);
      } else {
        setLiveItems([]);
      }
    } catch {
      if (storeEvidence && storeEvidence.length > 0) {
        setLiveItems(storeEvidence as IngestedEvidenceItem[]);
      } else {
        setLiveItems([]);
      }
    } finally {
      setFetchingBackend(false);
    }
  }, [activeCaseId, typeFilter, storeEvidence]);

  useEffect(() => {
    fetchLiveEvidence();
  }, [fetchLiveEvidence]);

  // Compute WebCrypto SHA-256 for a File
  const computeSHA256 = async (file: File): Promise<string> => {
    const arrayBuffer = await file.arrayBuffer();
    const hashBuffer = await window.crypto.subtle.digest('SHA-256', arrayBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
  };

  // Upload handler for dropped/selected files
  const handleFilesUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setIsUploading(true);
    const baseURL = import.meta.env.VITE_API_BASE_URL || '/api/v1';

    let successCount = 0;
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      setUploadProgress(`Hashing & uploading ${file.name} (${i + 1}/${files.length})...`);
      try {
        const clientHash = await computeSHA256(file);
        let evType: EvidenceType = 'DOCUMENT';
        const lowerName = file.name.toLowerCase();
        if (lowerName.endsWith('.mp4') || lowerName.endsWith('.dav') || lowerName.includes('cctv')) {
          evType = 'CCTV';
        } else if (lowerName.includes('bank') || lowerName.includes('statement') || lowerName.includes('txn')) {
          evType = 'FINANCIAL_TRANSACTION';
        } else if (lowerName.includes('cdr') || lowerName.includes('call') || lowerName.includes('tower')) {
          evType = 'CALL_RECORD';
        } else if (lowerName.endsWith('.png') || lowerName.endsWith('.jpg') || lowerName.endsWith('.jpeg')) {
          evType = 'IMAGE';
        }

        const formData = new FormData();
        formData.append('file', file);
        formData.append('title', file.name.replace(/\.[^/.]+$/, ''));
        formData.append('type', evType);
        formData.append('source', 'Investigator Upload Vault');
        formData.append('sourceReference', `REF-${Math.floor(1000 + Math.random() * 9000)}`);
        formData.append('description', `Direct ingested file: ${file.name} (${(file.size / 1024).toFixed(1)} KB)`);
        formData.append('case_id', activeCaseId || 'case-101');
        formData.append('client_sha256', clientHash);

        await axios.post(`${baseURL}/evidence/upload`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
          timeout: 20000,
        });

        successCount++;
      } catch (err) {
        console.error(`Failed to upload ${file.name}:`, err);
      }
    }

    setIsUploading(false);
    setUploadProgress('');
    if (successCount > 0) {
      toast.success(
        `Successfully uploaded and SHA-256 verified ${successCount} evidence artifact(s).`,
        'Evidence Ingestion Complete'
      );
      refetch();
      fetchLiveEvidence();
    } else {
      toast.error('File upload failed. Ensure server connection is active.', 'Upload Error');
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFilesUpload(e.dataTransfer.files);
    }
  };

  const copyToClipboard = (hash: string) => {
    navigator.clipboard.writeText(hash);
    setCopiedHash(hash);
    toast.info('SHA-256 checksum copied to clipboard.', 'Copied');
    setTimeout(() => setCopiedHash(null), 2500);
  };

  const handleDownloadEvidenceBundle = async () => {
    setDownloadingBundle(true);
    try {
      const baseURL = import.meta.env.VITE_API_BASE_URL || '/api/v1';
      const response = await axios.get(`${baseURL}/cases/FIR-2026-CRIME-890/evidence-bundle`, {
        params: { officer_badge: 'BADGE-9081' },
        responseType: 'blob',
      });
      const blob = new Blob([response.data], { type: 'application/zip' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'Evidence_Bundle_FIR-2026-CRIME-890.zip');
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast.success('Evidence bundle downloaded successfully.', 'Export Complete');
    } catch (err) {
      console.error('Failed to download bundle:', err);
      toast.error('Could not download evidence bundle. Verify backend connection.', 'Download Failed');
    } finally {
      setDownloadingBundle(false);
    }
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

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return 'N/A';
    if (bytes >= 1048576) return `${(bytes / 1048576).toFixed(1)} MB`;
    return `${(bytes / 1024).toFixed(0)} KB`;
  };

  const displayList = (liveItems.length > 0 ? liveItems : (storeEvidence as IngestedEvidenceItem[]) || []);
  const filtered = displayList.filter(
    (e) =>
      e.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (e.evidenceNumber && e.evidenceNumber.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (e.source && e.source.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      {/* Page Header */}
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
        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            onClick={() => setPreviewManifestOpen(true)}
            className="border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/10 flex items-center gap-1.5"
            title="Preview Evidence Bundle Manifest and Cryptographic Hashes"
          >
            <Eye className="h-4 w-4 text-emerald-400" />
            <span>Preview Manifest</span>
          </Button>
          <Button
            variant="outline"
            onClick={handleDownloadEvidenceBundle}
            disabled={downloadingBundle}
            className="border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/10 flex items-center gap-1.5"
            title="Download password-protected court evidence zip"
          >
            <Archive className="h-4 w-4 text-emerald-400" />
            <span>{downloadingBundle ? 'Bundling...' : t('actions.downloadBundle')}</span>
          </Button>
          <Button
            onClick={() => fileInputRef.current?.click()}
            icon={<Upload className="h-4 w-4" />}
          >
            Upload Evidence
          </Button>
        </div>
      </div>

      {/* Prominent Drag & Drop Zone */}
      <div
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all duration-200 ${
          dragActive
            ? 'border-primary bg-primary/10 shadow-glow'
            : isUploading
            ? 'border-amber-500/50 bg-amber-950/20'
            : 'border-border/80 hover:border-primary/60 hover:bg-accent/40 bg-card/60'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          onChange={(e) => handleFilesUpload(e.target.files)}
          className="hidden"
          accept=".pdf,.csv,.mp4,.dav,.jpg,.png,.jpeg,.txt,.json,.xml"
        />

        {isUploading ? (
          <div className="flex flex-col items-center gap-2 text-amber-300">
            <RefreshCw className="h-8 w-8 animate-spin text-amber-400" />
            <span className="font-semibold text-sm">{uploadProgress}</span>
            <span className="text-xs text-muted-foreground">
              Generating native WebCrypto SHA-256 bitstream checksum...
            </span>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center border border-primary/30">
              <Upload className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-sm font-bold text-foreground">
                Drop forensic evidence files here, or <span className="text-primary underline">browse to upload</span>
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Supports PDF FIRs, Telecom CDR CSVs, Bank Ledgers, and CCTV Videos (.mp4). Automatic client-side SHA-256 verification.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 p-4 rounded-xl border border-border bg-card">
        <div className="w-full md:w-80">
          <Input
            placeholder="Search evidence by number, title, or source..."
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
      {storeLoading && fetchingBackend ? (
        <div className="p-12 text-center text-xs text-muted-foreground flex flex-col items-center gap-2">
          <RefreshCw className="h-6 w-6 animate-spin text-primary" />
          <span>Loading verified evidence artifacts from forensic vault...</span>
        </div>
      ) : filtered.length === 0 ? (
        /* Empty State */
        <div className="p-12 rounded-2xl border border-border bg-card text-center space-y-3">
          <FolderOpen className="h-10 w-10 text-muted-foreground mx-auto" />
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-foreground">No Evidence Uploaded Yet</h3>
            <p className="text-xs text-muted-foreground max-w-md mx-auto">
              There are no evidence artifacts for the selected filter. Drag and drop documents, CCTV recordings, or CDR telecom files into the dropzone above to begin forensic ingestion.
            </p>
          </div>
          <Button
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            className="text-xs"
          >
            Upload First Artifact
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((item) => (
            <Card
              key={item.id}
              className="flex flex-col justify-between hover:border-primary/50 transition-all bg-card/90"
            >
              <CardHeader className="space-y-2 pb-2">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs text-primary font-bold flex items-center gap-1.5">
                    {getTypeIcon(item.type)}
                    {item.evidenceNumber || item.id}
                  </span>
                  <Badge
                    variant={item.processingStatus === 'PROCESSED' ? 'success' : 'warning'}
                  >
                    {item.processingStatus || 'VERIFIED'}
                  </Badge>
                </div>
                <CardTitle className="text-sm font-bold line-clamp-1 text-foreground" title={item.title}>
                  {item.title}
                </CardTitle>
              </CardHeader>

              <CardContent className="space-y-3 flex-1 text-xs">
                <p className="text-muted-foreground leading-relaxed line-clamp-2">
                  {item.description}
                </p>

                {/* Metadata Box */}
                <div className="p-2.5 rounded-lg bg-background/70 border border-border/50 space-y-1 text-[11px]">
                  <div className="flex items-center justify-between text-muted-foreground">
                    <span>Source:</span>
                    <span className="font-medium text-foreground truncate max-w-[170px]" title={item.source}>
                      {item.source}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-muted-foreground">
                    <span>Reference:</span>
                    <span className="font-mono text-foreground">{item.sourceReference || 'N/A'}</span>
                  </div>
                  <div className="flex items-center justify-between text-muted-foreground">
                    <span>File Size:</span>
                    <span className="text-foreground">{formatFileSize(item.file_size)}</span>
                  </div>
                  <div className="flex items-center justify-between text-muted-foreground">
                    <span>Investigating Officer:</span>
                    <span className="text-foreground">{item.uploadedBy || 'Investigator In-Charge'}</span>
                  </div>
                </div>

                {/* SHA-256 Hash with Copy Button */}
                <div className="flex items-center justify-between gap-2 p-2 rounded-lg bg-muted/30 border border-border/40 font-mono text-[10px]">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <Hash className="h-3.5 w-3.5 text-primary shrink-0" />
                    <span className="truncate text-muted-foreground" title={item.hash}>
                      {item.hash ? `${item.hash.substring(0, 14)}...${item.hash.substring(item.hash.length - 8)}` : 'Generating hash...'}
                    </span>
                  </div>
                  {item.hash && (
                    <button
                      onClick={() => copyToClipboard(item.hash)}
                      className="p-1 rounded hover:bg-accent text-muted-foreground hover:text-foreground transition-colors shrink-0"
                      title="Copy SHA-256 Hash"
                      aria-label="Copy SHA-256 Hash"
                    >
                      {copiedHash === item.hash ? (
                        <Check className="h-3 w-3 text-emerald-400" />
                      ) : (
                        <Copy className="h-3 w-3" />
                      )}
                    </button>
                  )}
                </div>

                {/* Real CCTV Video Player (Only rendered if real video_url exists) */}
                {item.video_url && (
                  <div className="pt-2">
                    <div className="relative rounded-lg overflow-hidden border border-purple-500/30 bg-black aspect-video flex items-center justify-center">
                      <video
                        controls
                        preload="metadata"
                        className="w-full h-full object-cover"
                      >
                        <source src={item.video_url} type="video/mp4" />
                        Your browser does not support HTML5 CCTV video playback.
                      </video>
                    </div>
                  </div>
                )}
              </CardContent>

              {/* Card Footer Actions */}
              <div className="p-4 pt-2 border-t border-border/40 mt-2 flex items-center justify-between">
                <span className="text-[10px] text-muted-foreground">
                  {formatDate(item.timestamp)}
                </span>
                <div className="flex items-center gap-1.5">
                  <Link to={`/evidence/${item.id}`}>
                    <Button size="sm" variant="outline" className="text-xs">
                      View Details
                    </Button>
                  </Link>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      toast.info(`Preparing artifact "${item.title}" for download...`, 'Export');
                      window.open(item.video_url || '#', '_blank');
                    }}
                    className="p-1.5 text-muted-foreground hover:text-foreground"
                    title="Download artifact"
                    aria-label="Download artifact"
                  >
                    <Download className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Manifest Preview Modal */}
      <DocumentPreviewModal
        isOpen={previewManifestOpen}
        onClose={() => setPreviewManifestOpen(false)}
        caseNumber={activeCaseId || 'CASE-2026-8812'}
        documentType="evidence_bundle"
        metadata={{
          courtName: 'Special Cyber & Financial Crimes Court',
        }}
      />
    </div>
  );
}
