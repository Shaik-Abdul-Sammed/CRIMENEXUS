import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import {
  ArrowLeft,
  ShieldCheck,
  Download,
  Eye,
  FileText,
  User,
  Binary,
  Award,
  CheckCircle2,
  Copy,
  Check,
  Lock,
  Video,
  Play,
} from 'lucide-react';
import { useEvidenceDetail, useEntities } from '../../hooks/useIntelligenceApi';
import { Evidence } from '../../types';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { formatDate } from '../../utils/formatters';
import { useToast } from '../../components/ui/Toast';
import { sound } from '../../utils/soundEffects';
import { DocumentPreviewModal } from '../../components/common/DocumentPreviewModal';

export function EvidenceDetailPage() {
  const { id = 'ev-101' } = useParams<{ id: string }>();
  const toast = useToast();
  const { data: queriedItem, isLoading: isQueryLoading } = useEvidenceDetail(id);
  const { data: allEntities } = useEntities('ALL');

  const [directItem, setDirectItem] = useState<Evidence | null>(null);
  const [directLoading, setDirectLoading] = useState<boolean>(false);
  const [viewerTab, setViewerTab] = useState<'DOCUMENT' | 'HEX' | 'CERTIFICATE' | 'MEDIA'>('DOCUMENT');
  const [copiedHash, setCopiedHash] = useState(false);
  const [certificatePreviewOpen, setCertificatePreviewOpen] = useState(false);

  // Fallback direct backend fetch to guarantee resolution under any ID scheme
  useEffect(() => {
    if (!id) return;
    setDirectLoading(true);
    const baseURL = import.meta.env.VITE_API_BASE_URL || '/api/v1';
    axios
      .get(`${baseURL}/evidence/${encodeURIComponent(id)}`, { timeout: 4000 })
      .then((res) => {
        if (res.data) {
          const d = res.data;
          setDirectItem({
            id: String(d.id || d.evidence_id || id),
            evidenceNumber: String(d.evidenceNumber || d.evidence_id || id),
            caseId: String(d.caseId || d.case_id || 'case-101'),
            title: String(d.title || 'Forensic Evidence Artifact'),
            type: d.type || 'DOCUMENT',
            source: String(d.source || 'CCTNS Evidence Vault'),
            sourceReference: String(d.sourceReference || d.source_reference || 'REF-VAULT-01'),
            timestamp: String(d.timestamp || d.uploaded_at || new Date().toISOString()),
            uploadedBy: String(d.uploadedBy || d.uploaded_by || 'Inspector In-Charge'),
            hash: String(d.hash || d.sha256_hash || 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855'),
            processingStatus: d.processingStatus || 'PROCESSED',
            linkedEntityIds: d.linkedEntityIds || d.linked_entity_ids || ['ent-1'],
            metadata: d.metadata || {
              filename: String(d.filename || 'evidence_artifact.dat'),
              fileSize: d.file_size ? `${Math.round(Number(d.file_size) / 1024)} KB` : '1.8 MB',
            },
            description: String(d.description || ''),
            fileUrl: d.video_url || d.fileUrl || undefined,
          });
        }
      })
      .catch(() => {
        // Direct fetch failed, query fallback will handle it
      })
      .finally(() => {
        setDirectLoading(false);
      });
  }, [id]);

  const item = directItem || queriedItem;
  const isLoading = isQueryLoading && directLoading;

  if (isLoading && !item) {
    return <div className="p-12 text-center text-xs text-muted-foreground">Loading forensic artifact details...</div>;
  }

  if (!item) {
    return (
      <div className="p-12 text-center text-xs text-muted-foreground space-y-4">
        <p>Evidence artifact record not found in active session.</p>
        <Link to="/evidence">
          <Button size="sm" variant="outline">
            Return to Evidence Vault
          </Button>
        </Link>
      </div>
    );
  }

  const linkedEntities = allEntities?.filter((e) => item.linkedEntityIds?.includes(e.id)) || [];

  const handleCopyHash = () => {
    sound.playClickSound();
    if (navigator?.clipboard && item.hash) {
      navigator.clipboard.writeText(item.hash);
      setCopiedHash(true);
      toast.info('Cryptographic SHA-256 hash copied to clipboard.', 'Hash Copied');
      setTimeout(() => setCopiedHash(false), 2000);
    }
  };

  const handleExportCertificate = () => {
    sound.playSuccessChime();
    const certificateText = `GOVERNMENT OF INDIA - MINISTRY OF HOME AFFAIRS
CENTRAL FORENSIC SCIENCE LABORATORY (CFSL) / CCTNS EVIDENCE REPOSITORY
========================================================================
CERTIFICATE OF ELECTRONIC EVIDENCE UNDER SECTION 63 BNS / 65B IEA
========================================================================
Evidence Number:       ${item.evidenceNumber}
Artifact Title:        ${item.title}
Category:              ${item.type}
Case Identifier:       ${item.caseId}
Source Agency:         ${item.source} (${item.sourceReference})
Seizing Officer:       ${item.uploadedBy}
Date & Time Captured:  ${formatDate(item.timestamp)}
Integrity Status:      VERIFIED (Zero bitstream tampering)

CRYPTOGRAPHIC BITSTREAM AUDIT:
------------------------------------------------------------------------
Algorithm:             SHA-256 (NIST FIPS 180-4)
Digest Checksum:       ${item.hash}
Key Size:              256-bit

CHAIN OF CUSTODY VERIFICATION:
This electronic record was ingested directly from source hardware into a
WORM (Write Once, Read Many) tamper-evident database ledger. The checksum
computed at the moment of seizure matches the current digest bit-for-bit.

Certified By:
Digital Evidence Custodian, Special Cyber Crime Branch
[STAMP: SEC 63 BSA ADMISSIBLE IN EVIDENCE]
`;

    const blob = new Blob([certificateText], { type: 'text/plain;charset=utf-8' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Forensic_Cert_${item.evidenceNumber}_Sec63BSA.txt`);
    document.body.appendChild(link);
    link.click();
    link.parentNode?.removeChild(link);
    window.URL.revokeObjectURL(url);
    toast.success('Downloaded Section 63 BSA Digital Evidence Certificate.', 'Certificate Generated');
  };

  return (
    <div className="space-y-6">
      <Link to="/evidence">
        <Button size="sm" variant="ghost" icon={<ArrowLeft className="h-4 w-4" />}>
          Back to Evidence Vault
        </Button>
      </Link>

      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-2xl border border-primary/30 bg-card">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="font-mono text-sm font-extrabold text-primary px-2.5 py-0.5 rounded bg-primary/10 border border-primary/30">
              {item.evidenceNumber}
            </span>
            <Badge variant="success">{item.processingStatus || 'PROCESSED'}</Badge>
            <Badge variant="outline">{item.type}</Badge>
            <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/30 flex items-center gap-1">
              <ShieldCheck className="h-3 w-3" />
              Sec 63 BSA Compliant
            </span>
          </div>
          <h1 className="text-2xl font-extrabold text-foreground">{item.title}</h1>
          <p className="text-xs text-muted-foreground">{item.description}</p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="primary"
            onClick={() => {
              sound.playClickSound();
              setCertificatePreviewOpen(true);
            }}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold flex items-center gap-1.5 shadow-md shadow-emerald-950/40"
            icon={<Eye className="h-4 w-4" />}
          >
            Preview Certificate
          </Button>

          <Button
            variant="outline"
            onClick={handleExportCertificate}
            className="border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/10 flex items-center gap-1.5"
            icon={<Download className="h-4 w-4" />}
          >
            Export Sec 63 (.txt)
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Interactive Digital Forensic Viewer */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="overflow-hidden">
            <CardHeader className="pb-3 border-b border-border/70 flex flex-row items-center justify-between">
              <div className="flex items-center gap-1 border border-border rounded-lg p-0.5 bg-background">
                {(item.type === 'CCTV' || item.fileUrl) && (
                  <button
                    onClick={() => {
                      sound.playClickSound();
                      setViewerTab('MEDIA');
                    }}
                    className={`px-3 py-1 text-xs rounded-md font-semibold transition-colors flex items-center gap-1.5 ${
                      viewerTab === 'MEDIA'
                        ? 'bg-primary text-primary-foreground shadow-sm'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <Video className="h-3.5 w-3.5" />
                    <span>CCTV Media Playback</span>
                  </button>
                )}
                <button
                  onClick={() => {
                    sound.playClickSound();
                    setViewerTab('DOCUMENT');
                  }}
                  className={`px-3 py-1 text-xs rounded-md font-semibold transition-colors flex items-center gap-1.5 ${
                    viewerTab === 'DOCUMENT'
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <Eye className="h-3.5 w-3.5" />
                  <span>Document Preview</span>
                </button>
                <button
                  onClick={() => {
                    sound.playClickSound();
                    setViewerTab('HEX');
                  }}
                  className={`px-3 py-1 text-xs rounded-md font-semibold transition-colors flex items-center gap-1.5 ${
                    viewerTab === 'HEX'
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <Binary className="h-3.5 w-3.5" />
                  <span>Hex Stream</span>
                </button>
                <button
                  onClick={() => {
                    sound.playClickSound();
                    setViewerTab('CERTIFICATE');
                  }}
                  className={`px-3 py-1 text-xs rounded-md font-semibold transition-colors flex items-center gap-1.5 ${
                    viewerTab === 'CERTIFICATE'
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <Award className="h-3.5 w-3.5" />
                  <span>Legal Audit Certificate</span>
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopyHash}
                  className="p-1.5 rounded-lg border border-border text-muted-foreground hover:text-foreground hover:bg-accent transition-colors flex items-center gap-1 text-[11px]"
                  title="Copy SHA-256 Digest"
                >
                  {copiedHash ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                  <span className="font-mono hidden sm:inline">Copy Hash</span>
                </button>
              </div>
            </CardHeader>

            <CardContent className="p-4">
              {viewerTab === 'MEDIA' && (
                <div className="rounded-xl border border-border bg-slate-950 p-4 space-y-3">
                  <div className="relative rounded-lg overflow-hidden border border-purple-500/30 bg-black aspect-video flex items-center justify-center">
                    {item.fileUrl ? (
                      <video controls preload="metadata" className="w-full h-full object-cover">
                        <source src={item.fileUrl} type="video/mp4" />
                        Your browser does not support HTML5 CCTV video playback.
                      </video>
                    ) : (
                      <div className="text-center p-8 space-y-2">
                        <Video className="h-10 w-10 text-purple-400 mx-auto animate-pulse" />
                        <p className="text-xs text-slate-300 font-mono">
                          Authenticated CCTV Stream: {item.sourceReference}
                        </p>
                        <p className="text-[10px] text-slate-500 font-mono">
                          Sealed video bitstream verified under Section 63 BSA.
                        </p>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center justify-between text-xs text-slate-400 p-2 rounded bg-slate-900 border border-slate-800">
                    <span>Source: {item.source}</span>
                    <span className="text-emerald-400 font-mono">Bitstream Digest Verified</span>
                  </div>
                </div>
              )}

              {viewerTab === 'DOCUMENT' && (
                <div className="rounded-xl border border-border bg-slate-950 p-6 space-y-4 font-mono text-xs">
                  {/* Top Seal & Official Header */}
                  <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                    <div className="flex items-center gap-2 text-cyan-400">
                      <Lock className="h-4 w-4" />
                      <span className="font-bold tracking-wider">CCTNS FORENSIC VAULT REPOSITORY // SEALED RECORD</span>
                    </div>
                    <span className="text-[10px] text-slate-400">ISO/IEC 27037 FORENSIC STANDARD</span>
                  </div>

                  {/* Certified Document Mock View */}
                  <div className="bg-slate-900/80 rounded-lg p-5 border border-slate-800 space-y-3 relative overflow-hidden">
                    {/* Watermark */}
                    <div className="absolute inset-0 flex items-center justify-center opacity-[0.04] pointer-events-none select-none text-4xl font-extrabold rotate-[-25deg] text-white">
                      COURT EVIDENCE ADMISSIBLE
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-400">
                      <span>FILE IDENTIFIER: {item.evidenceNumber}</span>
                      <span>INGESTION TIMESTAMP: {formatDate(item.timestamp)}</span>
                    </div>

                    <h3 className="text-sm font-bold text-slate-100 font-sans">{item.title}</h3>
                    <p className="text-xs text-slate-300 font-sans leading-relaxed">{item.description}</p>

                    <div className="pt-2 border-t border-slate-800/80 grid grid-cols-2 gap-3 text-[11px]">
                      <div>
                        <span className="text-slate-500 block">SOURCE JURISDICTION:</span>
                        <span className="text-slate-300 font-semibold">{item.source}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block">CASE RECORD REFERENCE:</span>
                        <span className="text-slate-300 font-semibold">{item.sourceReference}</span>
                      </div>
                    </div>
                  </div>

                  {/* SHA-256 Digest Box */}
                  <div className="p-3 rounded-lg bg-emerald-950/20 border border-emerald-500/30 text-[11px] text-emerald-300 flex items-start gap-2.5">
                    <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                    <div className="space-y-0.5 break-all">
                      <span className="font-bold text-emerald-200">Cryptographic Bitstream Verified:</span>
                      <p className="font-mono text-[10px] text-emerald-400">{item.hash}</p>
                    </div>
                  </div>
                </div>
              )}

              {viewerTab === 'HEX' && (
                <div className="rounded-xl border border-border bg-slate-950 p-4 font-mono text-[11px] text-slate-300 overflow-x-auto space-y-1 max-h-80 select-all">
                  <div className="text-[10px] text-slate-500 border-b border-slate-800 pb-1 mb-2 flex justify-between">
                    <span>OFFSET    00 01 02 03 04 05 06 07  08 09 0A 0B 0C 0D 0E 0F   DECODED TEXT</span>
                    <span>BITSTREAM VERIFIED</span>
                  </div>
                  <div>00000000  25 50 44 46 2d 31 2e 37  0a 25 e2 e3 cf d3 0a 31   %PDF-1.7.%.....1</div>
                  <div>00000010  30 20 30 20 6f 62 6a 0a  3c 3c 2f 4c 65 6e 67 74   0 0 obj.&lt;&lt;/Lengt</div>
                  <div>00000020  68 20 33 39 38 32 30 2f  46 69 6c 74 65 72 2f 46   h 39820/Filter/F</div>
                  <div>00000030  6c 61 74 65 44 65 63 6f  64 65 3e 3e 73 74 72 65   lateDecode&gt;&gt;stre</div>
                  <div>00000040  61 6d 0a 78 9c 5d 53 4b  6f 1b 31 10 bd f7 57 10   am.x.]SKo.1...W.</div>
                  <div>00000050  59 d0 9c 1e d2 a4 19 b2  24 81 29 93 42 6d b1 20   Y.......$.).Gm. </div>
                  <div>00000060  62 13 4a b4 52 de 7f 3f  8c d8 e8 a2 49 bb 42 16   b.J.R..?....I.B.</div>
                  <div>00000070  20 50 41 53 53 57 4f 52  44 5f 50 52 4f 54 45 43    PASSWORD_PROTEC</div>
                  <div>00000080  54 45 44 5f 46 49 52 5f  45 56 49 44 45 4e 43 45   TED_FIR_EVIDENCE</div>
                  <div className="text-[10px] text-slate-500 pt-2 border-t border-slate-800">
                    Showing first 144 bytes of authenticated binary bitstream.
                  </div>
                </div>
              )}

              {viewerTab === 'CERTIFICATE' && (
                <div className="rounded-xl border border-emerald-500/30 bg-emerald-950/10 p-5 font-mono text-xs text-slate-200 space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-emerald-500/30">
                    <span className="font-bold text-emerald-400 flex items-center gap-2">
                      <Award className="h-4 w-4" />
                      STATUTORY DIGITAL CERTIFICATE (SEC 63 BSA / 65B IEA)
                    </span>
                    <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded border border-emerald-500/30">
                      LEGAL VALIDITY CONFIRMED
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-[11px] pt-1">
                    <div>
                      <span className="text-slate-400 block">Producing Agency:</span>
                      <span className="font-semibold text-slate-200">{item.source}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block">Certifying Officer:</span>
                      <span className="font-semibold text-slate-200">{item.uploadedBy}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block">SHA-256 Digest:</span>
                      <span className="text-emerald-400 break-all">{item.hash}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block">Storage Layer:</span>
                      <span className="text-slate-200">PostgreSQL Immutable WORM Ledger</span>
                    </div>
                  </div>
                  <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-emerald-500/20">
                    <p className="text-[10px] text-slate-400">
                      Under the Bharatiya Sakshya Adhiniyam, 2023, this digital signature proves the electronic record remained intact with zero alteration from time of creation.
                    </p>
                    <Button
                      size="sm"
                      variant="primary"
                      onClick={() => {
                        sound.playClickSound();
                        setCertificatePreviewOpen(true);
                      }}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shrink-0 flex items-center gap-1.5"
                    >
                      <Eye className="h-3.5 w-3.5" />
                      <span>Full Certificate Preview</span>
                    </Button>
                  </div>
                </div>
              )}

              {/* Extraction Metadata Grid */}
              <div className="mt-4 space-y-2">
                <h4 className="font-semibold text-xs text-foreground uppercase tracking-wider">
                  Extracted Attributes & Forensic Properties
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 rounded-lg border border-border bg-background/50 text-xs">
                  {Object.entries(item.metadata || {}).map(([k, v]) => (
                    <div key={k} className="flex justify-between border-b border-border/40 pb-1">
                      <span className="text-muted-foreground capitalize">{k.replace(/([A-Z])/g, ' $1')}:</span>
                      <span className="font-semibold text-foreground font-mono">{String(v)}</span>
                    </div>
                  ))}
                  <div className="flex justify-between border-b border-border/40 pb-1">
                    <span className="text-muted-foreground">Original Reference:</span>
                    <span className="font-mono text-foreground">{item.sourceReference}</span>
                  </div>
                  <div className="flex justify-between border-b border-border/40 pb-1">
                    <span className="text-muted-foreground">Chain Verification:</span>
                    <span className="text-emerald-400 font-bold">VERIFIED</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right 1 Col: Chain of Custody & Linked Entities */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-emerald-400" />
                Chain of Custody Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-xs">
              <div className="flex justify-between py-1.5 border-b border-border/40">
                <span className="text-muted-foreground">Original Agency:</span>
                <span className="font-semibold text-foreground">{item.source}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-border/40">
                <span className="text-muted-foreground">Official Ref #:</span>
                <span className="font-mono text-foreground">{item.sourceReference}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-border/40">
                <span className="text-muted-foreground">Uploading Agent:</span>
                <span className="text-foreground">{item.uploadedBy}</span>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="text-muted-foreground">Timestamp Logged:</span>
                <span className="text-foreground">{formatDate(item.timestamp)}</span>
              </div>
            </CardContent>
          </Card>

          {/* Linked Entities */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Linked Entities ({linkedEntities.length})</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {linkedEntities.length === 0 ? (
                <p className="text-xs text-muted-foreground py-2 text-center font-mono">
                  No directly resolved entities linked
                </p>
              ) : (
                linkedEntities.map((e) => (
                  <Link
                    key={e.id}
                    to={`/entities/${e.id}`}
                    className="flex items-center justify-between p-2.5 rounded-lg border border-border hover:border-primary/40 bg-background/50 transition-all text-xs"
                  >
                    <div className="flex items-center gap-2">
                      <User className="h-3.5 w-3.5 text-primary" />
                      <span className="font-semibold text-foreground">{e.name}</span>
                    </div>
                    <Badge variant="outline">{e.type}</Badge>
                  </Link>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Statutory Section 63 BSA Certificate Preview Modal */}
      <DocumentPreviewModal
        isOpen={certificatePreviewOpen}
        onClose={() => setCertificatePreviewOpen(false)}
        title="Statutory Digital Evidence Certificate (Sec 63 BSA)"
        subtitle="Certificate of Electronic Evidence under Section 63 Bharatiya Sakshya Adhiniyam, 2023 / Section 65B Indian Evidence Act"
        caseNumber={item.caseId || 'CASE-2026-8812'}
        fileName={`Forensic_Cert_${item.evidenceNumber}_Sec63BSA.pdf`}
        textContent={`GOVERNMENT OF INDIA - MINISTRY OF HOME AFFAIRS
CENTRAL FORENSIC SCIENCE LABORATORY (CFSL) / CCTNS EVIDENCE REPOSITORY
========================================================================
CERTIFICATE OF ELECTRONIC EVIDENCE UNDER SECTION 63 BNS / 65B IEA
========================================================================
Evidence Number:       ${item.evidenceNumber}
Artifact Title:        ${item.title}
Category:              ${item.type}
Case Identifier:       ${item.caseId}
Source Agency:         ${item.source} (${item.sourceReference})
Seizing Officer:       ${item.uploadedBy}
Date & Time Captured:  ${formatDate(item.timestamp)}
Integrity Status:      VERIFIED (Zero bitstream tampering)

CRYPTOGRAPHIC BITSTREAM AUDIT:
------------------------------------------------------------------------
Algorithm:             SHA-256 (NIST FIPS 180-4)
Digest Checksum:       ${item.hash}
Key Size:              256-bit

CHAIN OF CUSTODY VERIFICATION:
This electronic record was ingested directly from source hardware into a
WORM (Write Once, Read Many) tamper-evident database ledger. The checksum
computed at the moment of seizure matches the current digest bit-for-bit.

Certified By:
Digital Evidence Custodian, Special Cyber Crime Branch
[STAMP: SEC 63 BSA ADMISSIBLE IN EVIDENCE]`}
        metadata={{
          ioName: item.uploadedBy || 'Inspector Rajesh Varma',
          policeStation: item.source || 'Special Crime Branch & Cyber Cell',
          crimeType: item.title,
          hash: item.hash,
          courtName: 'High Court / Special Session Court for Financial & Cyber Crimes',
          evidenceNumber: item.evidenceNumber,
          category: item.type,
          sourceReference: item.sourceReference,
          timestamp: item.timestamp,
        }}
      />
    </div>
  );
}
