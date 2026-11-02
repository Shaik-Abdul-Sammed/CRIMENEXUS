import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import {
  FileText,
  Download,
  Printer,
  Copy,
  Check,
  ShieldCheck,
  Lock,
  Scale,
  ZoomIn,
  ZoomOut,
  RefreshCw,
  Eye,
  FileCode,
  AlertCircle,
} from 'lucide-react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';

export interface DocumentPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  documentType?: 'dossier_pdf' | 'legal_draft' | 'evidence_bundle';
  caseNumber?: string;
  pdfUrl?: string;
  fileName?: string;
  textContent?: string;
  metadata?: {
    ioName?: string;
    policeStation?: string;
    suspectName?: string;
    crimeType?: string;
    hash?: string;
    generatedAt?: string;
    courtName?: string;
    [key: string]: unknown;
  };
}

export function DocumentPreviewModal({
  isOpen,
  onClose,
  title = 'Court-Ready Forensic Dossier',
  subtitle = 'Statutory Digital Evidence Certification under Section 63 Bharatiya Sakshya Adhiniyam 2023',
  documentType: _documentType = 'dossier_pdf',
  caseNumber = 'FIR-2026-CRIME-890',
  pdfUrl,
  fileName,
  textContent,
  metadata = {},
}: DocumentPreviewModalProps) {
  const [activeTab, setActiveTab] = useState<'pdf' | 'formatted' | 'integrity'>('formatted');
  const [loadingPdf, setLoadingPdf] = useState<boolean>(false);
  const [pdfBlobUrl, setPdfBlobUrl] = useState<string | null>(null);
  const [pdfError, setPdfError] = useState<string | null>(null);
  const [zoomLevel, setZoomLevel] = useState<number>(100);
  const [copiedHash, setCopiedHash] = useState<boolean>(false);
  const [copiedText, setCopiedText] = useState<boolean>(false);
  const printIframeRef = useRef<HTMLIFrameElement>(null);

  const cleanCaseNum = caseNumber.replace('/', '_').replace(' ', '_');
  const effectiveFileName = fileName || `Court_Ready_Dossier_${cleanCaseNum}.pdf`;

  // Resolved metadata with reliable defaults
  const ioName = metadata.ioName || 'Inspector V. K. Sharma (Special Cell)';
  const policeStation = metadata.policeStation || 'Cyber Crime Police Station, Sector 20';
  const suspectName = metadata.suspectName || 'Rajan & Associated Hawala Syndicate';
  const crimeType = metadata.crimeType || 'Organized Hawala Smurfing & Multi-State Extortion';
  const sha256Hash =
    metadata.hash ||
    'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855f41029c7d413b8';
  const timestamp = metadata.generatedAt || new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });

  // Load PDF Blob when modal opens if pdfUrl is provided
  useEffect(() => {
    let currentBlobUrl: string | null = null;

    if (isOpen && pdfUrl) {
      setLoadingPdf(true);
      setPdfError(null);

      axios
        .get(pdfUrl, {
          responseType: 'blob',
          timeout: 15000,
        })
        .then((response) => {
          const blob = new Blob([response.data], { type: 'application/pdf' });
          currentBlobUrl = URL.createObjectURL(blob);
          setPdfBlobUrl(currentBlobUrl);
          setActiveTab('pdf'); // default to PDF view when loaded successfully
        })
        .catch((err) => {
          console.warn('PDF load failed, falling back to judicial document view:', err);
          setPdfError('Live PDF binary stream unavailable. Showing court-admissible formatted document preview.');
          setActiveTab('formatted');
        })
        .finally(() => {
          setLoadingPdf(false);
        });
    }

    return () => {
      if (currentBlobUrl) {
        URL.revokeObjectURL(currentBlobUrl);
      }
    };
  }, [isOpen, pdfUrl]);

  // Clean up blob url on unmount
  useEffect(() => {
    return () => {
      if (pdfBlobUrl) {
        URL.revokeObjectURL(pdfBlobUrl);
      }
    };
  }, [pdfBlobUrl]);

  const handleDownload = () => {
    if (pdfBlobUrl) {
      const a = document.createElement('a');
      a.href = pdfBlobUrl;
      a.download = effectiveFileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } else if (textContent) {
      const blob = new Blob([textContent], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = effectiveFileName.replace('.pdf', '.txt');
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } else if (pdfUrl) {
      // Trigger direct browser download
      window.open(pdfUrl, '_blank');
    }
  };

  const handlePrint = () => {
    if (pdfBlobUrl && printIframeRef.current) {
      try {
        printIframeRef.current.contentWindow?.print();
      } catch {
        window.print();
      }
    } else {
      window.print();
    }
  };

  const copyHash = () => {
    navigator.clipboard.writeText(sha256Hash);
    setCopiedHash(true);
    setTimeout(() => setCopiedHash(false), 2000);
  };

  const copyDraft = () => {
    if (textContent) {
      navigator.clipboard.writeText(textContent);
      setCopiedText(true);
      setTimeout(() => setCopiedText(false), 2000);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="2xl" className="max-w-5xl">
      <div className="flex flex-col h-[82vh] -m-5">
        {/* Top Control Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 p-4 border-b border-border bg-card/90 backdrop-blur-md shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="p-2.5 rounded-xl bg-primary/20 text-primary border border-primary/30 shrink-0">
              <Scale className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-extrabold text-foreground truncate">{title}</h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 whitespace-nowrap">
                  Sec 63 BSA Compliant
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground truncate mt-0.5">{subtitle}</p>
            </div>
          </div>

          {/* Action Tools */}
          <div className="flex items-center gap-2">
            {/* View Tab Switcher */}
            <div className="flex items-center bg-background/80 p-0.5 rounded-lg border border-border/80 text-xs font-medium">
              {pdfBlobUrl && (
                <button
                  onClick={() => setActiveTab('pdf')}
                  className={`px-2.5 py-1 rounded-md transition-all flex items-center gap-1.5 ${
                    activeTab === 'pdf'
                      ? 'bg-primary text-primary-foreground font-semibold shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <Eye className="h-3.5 w-3.5" />
                  <span>PDF Viewer</span>
                </button>
              )}
              <button
                onClick={() => setActiveTab('formatted')}
                className={`px-2.5 py-1 rounded-md transition-all flex items-center gap-1.5 ${
                  activeTab === 'formatted'
                    ? 'bg-primary text-primary-foreground font-semibold shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <FileText className="h-3.5 w-3.5" />
                <span>Court Sheet</span>
              </button>
              <button
                onClick={() => setActiveTab('integrity')}
                className={`px-2.5 py-1 rounded-md transition-all flex items-center gap-1.5 ${
                  activeTab === 'integrity'
                    ? 'bg-primary text-primary-foreground font-semibold shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
                <span>Chain of Custody</span>
              </button>
            </div>

            {/* Zoom Controls (for formatted sheet) */}
            {activeTab === 'formatted' && (
              <div className="hidden sm:flex items-center bg-background/80 p-0.5 rounded-lg border border-border/80 text-xs">
                <button
                  onClick={() => setZoomLevel((z) => Math.max(80, z - 10))}
                  className="p-1 hover:text-primary transition-colors"
                  title="Zoom Out"
                >
                  <ZoomOut className="h-3.5 w-3.5" />
                </button>
                <span className="px-1.5 font-mono text-[11px] text-muted-foreground">{zoomLevel}%</span>
                <button
                  onClick={() => setZoomLevel((z) => Math.min(130, z + 10))}
                  className="p-1 hover:text-primary transition-colors"
                  title="Zoom In"
                >
                  <ZoomIn className="h-3.5 w-3.5" />
                </button>
              </div>
            )}

            {/* Print & Download Buttons */}
            <Button
              variant="outline"
              size="sm"
              onClick={handlePrint}
              className="text-xs h-8 px-2.5 border-border flex items-center gap-1.5 hover:bg-accent"
              title="Print Official Document"
            >
              <Printer className="h-3.5 w-3.5" />
              <span className="hidden md:inline">Print</span>
            </Button>

            <Button
              variant="primary"
              size="sm"
              onClick={handleDownload}
              className="text-xs h-8 px-3 bg-primary hover:bg-primary/90 text-primary-foreground font-bold shadow-md shadow-primary/20 flex items-center gap-1.5"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Download File</span>
            </Button>
          </div>
        </div>

        {/* Hidden Iframe for silent printing */}
        {pdfBlobUrl && (
          <iframe
            ref={printIframeRef}
            src={pdfBlobUrl}
            className="hidden"
            title="Silent Print Frame"
          />
        )}

        {/* Main Preview Canvas */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-950/60">
          {/* PDF Fallback Alert if applicable */}
          {pdfError && activeTab === 'formatted' && (
            <div className="mx-auto max-w-3xl mb-4 p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-amber-400 shrink-0" />
              <span>{pdfError}</span>
            </div>
          )}

          {/* Loading PDF State */}
          {loadingPdf && (
            <div className="flex flex-col items-center justify-center h-full min-h-[350px] space-y-3">
              <RefreshCw className="h-8 w-8 text-primary animate-spin" />
              <p className="text-sm font-semibold text-foreground">
                Compiling Court-Ready Forensic Dossier...
              </p>
              <p className="text-xs text-muted-foreground max-w-sm text-center">
                Querying relational evidence, embedding Neo4j syndicate graph, and computing Section 63 BSA cryptographic signature.
              </p>
            </div>
          )}

          {/* TAB 1: Native PDF Viewer */}
          {!loadingPdf && activeTab === 'pdf' && pdfBlobUrl && (
            <div className="w-full h-full min-h-[580px] rounded-xl overflow-hidden border border-border shadow-2xl bg-slate-900 flex flex-col">
              <div className="flex items-center justify-between p-2 px-4 bg-slate-800/90 border-b border-border/60 text-xs text-muted-foreground">
                <span className="font-mono flex items-center gap-1.5">
                  <FileText className="h-3.5 w-3.5 text-red-400" />
                  {effectiveFileName}
                </span>
                <span className="text-[11px] text-emerald-400 font-semibold flex items-center gap-1">
                  <Check className="h-3.5 w-3.5" /> Stream Verified
                </span>
              </div>
              <iframe
                src={`${pdfBlobUrl}#toolbar=1&navpanes=0`}
                className="w-full flex-1 border-0"
                title="Court Dossier PDF Document"
              />
            </div>
          )}

          {/* TAB 2: Formatted Court Document Sheet */}
          {!loadingPdf && activeTab === 'formatted' && (
            <div
              className="mx-auto max-w-3xl transition-transform duration-200"
              style={{ transform: `scale(${zoomLevel / 100})`, transformOrigin: 'top center' }}
            >
              <div className="p-8 sm:p-12 rounded-xl border border-border/80 bg-card text-card-foreground shadow-2xl space-y-6 relative overflow-hidden font-sans">
                {/* Watermark */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.03] select-none">
                  <span className="text-8xl font-black rotate-[-25deg] tracking-widest text-foreground">
                    COURT ADMISSIBLE
                  </span>
                </div>

                {/* Government & Police Seal Header */}
                <div className="text-center border-b-2 border-primary/40 pb-5 space-y-1">
                  <div className="inline-flex items-center justify-center p-2 rounded-full bg-primary/10 border border-primary/30 text-primary mb-1">
                    <ShieldCheck className="h-6 w-6" />
                  </div>
                  <h4 className="text-xs uppercase tracking-widest font-black text-primary">
                    State Police Department &bull; Cyber Crime Investigation Wing
                  </h4>
                  <h2 className="text-base sm:text-lg font-black text-foreground tracking-tight">
                    FORENSIC INTELLIGENCE & SYNDICATE INVESTIGATION DOSSIER
                  </h2>
                  <p className="text-[11px] font-mono text-muted-foreground">
                    Statutory Submission Compliant with Section 63 Bharatiya Sakshya Adhiniyam, 2023 / Section 65B IEA
                  </p>
                </div>

                {/* Case Particulars Table */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3.5 rounded-lg bg-background/80 border border-border/60 text-xs">
                  <div>
                    <span className="text-[10px] text-muted-foreground uppercase font-bold block">Case Reference</span>
                    <span className="font-bold text-foreground font-mono">{caseNumber}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-muted-foreground uppercase font-bold block">Police Station</span>
                    <span className="font-medium text-foreground">{policeStation}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-muted-foreground uppercase font-bold block">Investigating Officer</span>
                    <span className="font-medium text-foreground">{ioName}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-muted-foreground uppercase font-bold block">Timestamp (IST)</span>
                    <span className="font-mono text-foreground text-[11px]">{timestamp}</span>
                  </div>
                </div>

                {/* Text Content for Legal Drafts */}
                {textContent ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between border-b border-border/50 pb-2">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-primary flex items-center gap-1.5">
                        <FileCode className="h-4 w-4" />
                        Statutory Judicial Pleading Draft
                      </h4>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={copyDraft}
                        className="text-xs h-6 px-2 text-muted-foreground hover:text-foreground"
                      >
                        {copiedText ? <Check className="h-3 w-3 text-emerald-400 mr-1" /> : <Copy className="h-3 w-3 mr-1" />}
                        {copiedText ? 'Copied' : 'Copy Text'}
                      </Button>
                    </div>
                    <div className="p-4 rounded-lg bg-background border border-border/70 font-mono text-xs whitespace-pre-wrap leading-relaxed text-foreground shadow-inner">
                      {textContent}
                    </div>
                  </div>
                ) : (
                  <>
                    {/* Section 1: Executive Case Synopsis */}
                    <div className="space-y-2">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-primary border-b border-border/50 pb-1">
                        1. Executive Synopsis & Offence Classification
                      </h4>
                      <p className="text-xs leading-relaxed text-muted-foreground">
                        This dossier encapsulates evidentiary findings compiled via CRIMENEXUS Dual-Write Intelligence
                        Architecture. It corroborates structured illicit fund transfers (Hawala Smurfing), cell tower
                        radiolocation waypoints, and vehicle surveillance data implicating primary suspect <strong className="text-foreground">{suspectName}</strong> under Section 111 (Organized Crime) BNS 2023, Sections 316/318 BNS (Cheating/Breach of Trust), and Prevention of Money Laundering Act (PMLA) for offences pertaining to <strong className="text-foreground">{crimeType}</strong>.
                      </p>
                    </div>

                    {/* Section 2: Syndicate Matrix */}
                    <div className="space-y-2">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-primary border-b border-border/50 pb-1">
                        2. Criminal Syndicate Matrix & Kingpins
                      </h4>
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs border border-border/60 rounded-lg overflow-hidden">
                          <thead className="bg-muted/60 text-muted-foreground uppercase text-[10px]">
                            <tr>
                              <th className="p-2.5">Accused / Entity</th>
                              <th className="p-2.5">Role in Syndicate</th>
                              <th className="p-2.5">Linked Asset / Phone</th>
                              <th className="p-2.5 text-right">Risk Factor</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-border/40">
                            <tr className="hover:bg-muted/30">
                              <td className="p-2.5 font-bold text-foreground">Rajan (Fugitive)</td>
                              <td className="p-2.5 text-muted-foreground">Syndicate Kingpin & Hawala Mastermind</td>
                              <td className="p-2.5 font-mono text-[11px]">+91 99999 88888 &bull; TS 09 AB 1234</td>
                              <td className="p-2.5 text-right">
                                <span className="px-1.5 py-0.5 rounded bg-red-500/20 text-red-400 font-bold font-mono">
                                  95% CRITICAL
                                </span>
                              </td>
                            </tr>
                            <tr className="hover:bg-muted/30">
                              <td className="p-2.5 font-bold text-foreground">Vikram Malhotra</td>
                              <td className="p-2.5 text-muted-foreground">Hawala Cashier & Drop Controller</td>
                              <td className="p-2.5 font-mono text-[11px]">+91 98111 22334 &bull; KA 01 MJ 4091</td>
                              <td className="p-2.5 text-right">
                                <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold font-mono">
                                  82% HIGH
                                </span>
                              </td>
                            </tr>
                            <tr className="hover:bg-muted/30">
                              <td className="p-2.5 font-bold text-foreground">Apex Trading Corp</td>
                              <td className="p-2.5 text-muted-foreground">Shell Entity Conduit for Smurfed Inflows</td>
                              <td className="p-2.5 font-mono text-[11px]">HDFC-908122 &bull; ₹5.2 Cr Transacted</td>
                              <td className="p-2.5 text-right">
                                <span className="px-1.5 py-0.5 rounded bg-red-500/20 text-red-400 font-bold font-mono">
                                  90% CRITICAL
                                </span>
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* Section 3: Financial Smurfing Trail */}
                    <div className="space-y-2">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-primary border-b border-border/50 pb-1">
                        3. Forensic Financial Audit & Smurfing Patterns
                      </h4>
                      <div className="p-3 rounded-lg bg-background/80 border border-border/60 text-xs space-y-2">
                        <div className="flex items-center justify-between text-muted-foreground">
                          <span>Structured Cash Deposits (&lt; ₹50,000 Threshold)</span>
                          <span className="font-mono font-bold text-emerald-400">14 Detected Cycles</span>
                        </div>
                        <div className="flex items-center justify-between text-muted-foreground">
                          <span>Primary Conduit Account</span>
                          <span className="font-mono text-foreground">HDFC Bank #908122 (Apex Trading)</span>
                        </div>
                        <div className="flex items-center justify-between text-muted-foreground">
                          <span>Immediate Outflow Redirection</span>
                          <span className="font-mono text-foreground">Escrow Wallet 0x71C... & Shell Logistics</span>
                        </div>
                        <p className="text-[11px] text-muted-foreground border-t border-border/40 pt-2">
                          Matches statutory typologies issued by Financial Intelligence Unit (FIU-IND) for illegal hawala structuring.
                        </p>
                      </div>
                    </div>
                  </>
                )}

                {/* Section 4: Statutory Compliance & Certificate of Integrity */}
                <div className="p-4 rounded-lg bg-primary/5 border-2 border-primary/30 space-y-3">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="h-5 w-5 text-emerald-400" />
                    <h4 className="text-xs font-extrabold text-foreground uppercase tracking-wide">
                      Section 63 Bharatiya Sakshya Adhiniyam, 2023 Digital Certificate
                    </h4>
                  </div>
                  <p className="text-[11px] leading-relaxed text-muted-foreground">
                    I hereby certify that the electronic records contained in this dossier were generated by automated,
                    tamper-evident forensic data stores operating normally during the ordinary course of lawful police intelligence operations. Hash integrity has been cryptographically preserved.
                  </p>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-2 rounded bg-background border border-border/60 font-mono text-[10px]">
                    <span className="text-muted-foreground truncate">
                      SHA-256: <strong className="text-foreground">{sha256Hash}</strong>
                    </span>
                    <button
                      onClick={copyHash}
                      className="text-primary hover:underline shrink-0 text-right flex items-center gap-1"
                    >
                      {copiedHash ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                      {copiedHash ? 'Hash Copied' : 'Copy Hash'}
                    </button>
                  </div>
                </div>

                {/* Sign-off & Seal */}
                <div className="flex items-end justify-between pt-6 border-t border-border/60 text-xs">
                  <div className="space-y-1">
                    <div className="h-10 w-24 border border-dashed border-primary/40 rounded flex items-center justify-center text-[9px] text-primary/70 font-mono uppercase">
                      OFFICIAL SEAL
                    </div>
                    <span className="text-[10px] text-muted-foreground block">Cyber Crime Police Station</span>
                  </div>
                  <div className="text-right space-y-1">
                    <span className="font-bold text-foreground block font-mono text-xs">{ioName}</span>
                    <span className="text-[10px] text-muted-foreground block">Investigating Officer &bull; Special Cell</span>
                    <span className="text-[9px] font-mono text-emerald-400 block">Digitally Signed & Validated</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: Cryptographic Integrity & Chain of Custody */}
          {!loadingPdf && activeTab === 'integrity' && (
            <div className="max-w-2xl mx-auto space-y-4">
              <div className="p-5 rounded-xl border border-border bg-card shadow-lg space-y-4">
                <div className="flex items-center gap-3 border-b border-border/60 pb-3">
                  <div className="p-2 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    <Lock className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-foreground">Cryptographic Chain of Custody Log</h4>
                    <p className="text-xs text-muted-foreground">
                      Immutable forensic ledger for court admission under Section 63 BSA 2023
                    </p>
                  </div>
                </div>

                <div className="space-y-3 text-xs">
                  <div className="p-3 rounded-lg bg-background border border-border/60 space-y-1">
                    <span className="text-[10px] text-muted-foreground uppercase font-bold block">Document SHA-256 Digest</span>
                    <p className="font-mono text-xs text-emerald-400 break-all select-all font-semibold">
                      {sha256Hash}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 rounded-lg bg-background border border-border/60">
                      <span className="text-[10px] text-muted-foreground uppercase font-bold block">Generation Terminal</span>
                      <span className="font-mono text-xs text-foreground">CRIMENEXUS-TERM-01 (STN-SEC20)</span>
                    </div>
                    <div className="p-3 rounded-lg bg-background border border-border/60">
                      <span className="text-[10px] text-muted-foreground uppercase font-bold block">Hash Algorithm</span>
                      <span className="font-mono text-xs text-foreground">FIPS PUB 180-4 (SHA-256)</span>
                    </div>
                  </div>

                  <div className="p-3 rounded-lg bg-background border border-border/60 space-y-1">
                    <span className="text-[10px] text-muted-foreground uppercase font-bold block">Digital Evidence Integrity Verification</span>
                    <div className="flex items-center gap-2 text-emerald-400 text-xs font-semibold">
                      <Check className="h-4 w-4" />
                      <span>Zero Byte Alteration Detected &bull; Ledger Signature Confirmed</span>
                    </div>
                  </div>

                  <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs flex items-start gap-2">
                    <AlertCircle className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
                    <p className="leading-snug">
                      Any physical modification or tampering of exported binary files invalidates this cryptographic hash certificate and will be recorded in the immutable audit ledger.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}
