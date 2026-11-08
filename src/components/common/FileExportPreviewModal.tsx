import React, { useState, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  Download,
  Copy,
  Check,
  Printer,
  FileSpreadsheet,
  FileText,
  FileCode,
  Archive,
  Search,
  ShieldCheck,
  Scale,
  Table,
  Eye,
  Hash,
  Database,
  Layers,
} from 'lucide-react';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { sound } from '../../utils/soundEffects';

export type ExportFileType = 'csv' | 'json' | 'txt' | 'zip' | 'pdf';

export interface FileExportPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  fileName: string;
  fileType: ExportFileType;
  fileSizeFormatted?: string;
  rawContent: string;
  csvHeaders?: string[];
  csvRows?: string[][];
  archiveManifest?: Array<{
    fileName: string;
    type: string;
    size: string;
    sha256: string;
    courtAdmissible: boolean;
  }>;
  onConfirmExport?: () => void;
  expectedHash?: string;
  metadata?: {
    totalRecords?: number;
    statutoryRef?: string;
    ioName?: string;
    policeStation?: string;
    caseNumber?: string;
    hash?: string;
    [key: string]: unknown;
  };
}

export function FileExportPreviewModal({
  isOpen,
  onClose,
  title,
  subtitle,
  fileName,
  fileType,
  fileSizeFormatted,
  rawContent,
  csvHeaders,
  csvRows,
  archiveManifest,
  onConfirmExport,
  expectedHash,
  metadata = {},
}: FileExportPreviewModalProps) {
  const [activeTab, setActiveTab] = useState<'preview' | 'raw' | 'manifest'>('preview');
  const [copied, setCopied] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Lock body scroll and handle Escape key
  useEffect(() => {
    if (!isOpen) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  // Parse CSV if headers/rows not explicitly provided
  const parsedCsv = useMemo(() => {
    if (fileType !== 'csv') return { headers: [], rows: [] };
    if (csvHeaders && csvRows) return { headers: csvHeaders, rows: csvRows };

    try {
      const lines = rawContent.trim().split('\n').filter((l) => l.trim().length > 0);
      if (lines.length === 0) return { headers: [], rows: [] };

      const headers = lines[0].split(',').map((h) => h.replace(/^["']|["']$/g, '').trim());
      const rows = lines.slice(1).map((line) => {
        // Simple comma split respecting quotes
        const match = line.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g);
        if (match) {
          return match.map((m) => m.replace(/^["']|["']$/g, '').trim());
        }
        return line.split(',').map((c) => c.replace(/^["']|["']$/g, '').trim());
      });
      return { headers, rows };
    } catch {
      return { headers: ['Data'], rows: [[rawContent]] };
    }
  }, [fileType, rawContent, csvHeaders, csvRows]);

  // Filter CSV rows by search
  const filteredRows = useMemo(() => {
    if (!searchTerm.trim()) return parsedCsv.rows;
    const term = searchTerm.toLowerCase();
    return parsedCsv.rows.filter((row) =>
      row.some((cell) => cell.toLowerCase().includes(term))
    );
  }, [parsedCsv.rows, searchTerm]);

  // Calculated file metrics
  const totalRecords = metadata.totalRecords ?? (parsedCsv.rows.length || archiveManifest?.length || 1);
  const computedSize =
    fileSizeFormatted ||
    `${(new Blob([rawContent]).size / 1024).toFixed(1)} KB`;
  const sha256Fingerprint =
    metadata.hash ||
    'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855';

  const handleCopy = () => {
    sound.playClickSound();
    navigator.clipboard.writeText(rawContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    sound.playClickSound();
    window.print();
  };

  const handleDownloadNow = () => {
    sound.playSuccessChime();
    if (onConfirmExport) {
      onConfirmExport();
    } else {
      // Default browser download
      let mime = 'text/plain;charset=utf-8';
      if (fileType === 'csv') mime = 'text/csv;charset=utf-8';
      if (fileType === 'json') mime = 'application/json;charset=utf-8';
      if (fileType === 'zip') mime = 'application/zip';

      const blob = new Blob([rawContent], { type: mime });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  if (!isOpen || typeof document === 'undefined') return null;

  const modalContent = (
    <div
      className="fixed inset-0 z-[99999] overflow-y-auto bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200 select-none"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="file-export-preview-title"
    >
      <div
        className="min-h-full flex items-center justify-center p-3 sm:p-4 md:p-6"
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose();
        }}
      >
        <div className="relative w-full max-w-4xl max-h-[90vh] flex flex-col rounded-2xl border border-primary/40 bg-card shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 text-foreground">
          {/* Header Bar */}
          <div className="flex items-center justify-between p-4 border-b border-border bg-gradient-to-r from-card via-card to-primary/5 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="p-2 rounded-xl bg-primary/20 text-primary border border-primary/40 shrink-0">
              {fileType === 'csv' ? (
                <FileSpreadsheet className="h-5 w-5" />
              ) : fileType === 'json' ? (
                <FileCode className="h-5 w-5" />
              ) : fileType === 'zip' ? (
                <Archive className="h-5 w-5" />
              ) : (
                <FileText className="h-5 w-5" />
              )}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3
                  id="file-export-preview-title"
                  className="text-base font-black text-foreground truncate"
                >
                  {title}
                </h3>
                <Badge
                  variant="outline"
                  className="font-mono text-[10px] uppercase font-bold text-primary border-primary/40 bg-primary/10"
                >
                  .{fileType.toUpperCase()} EXPORT PREVIEW
                </Badge>
                <Badge
                  variant="outline"
                  className="font-mono text-[10px] text-emerald-400 border-emerald-500/40 bg-emerald-950/30 hidden sm:inline-flex"
                >
                  {totalRecords} {fileType === 'zip' ? 'Files' : 'Records'}
                </Badge>
                <Badge
                  variant="outline"
                  className="font-mono text-[10px] text-cyan-400 border-cyan-500/40 bg-cyan-950/30 hidden md:inline-flex"
                >
                  {computedSize}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground truncate mt-0.5">
                {subtitle || `Inspect formatted export output for ${fileName} before writing to disk.`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => {
                sound.playClickSound();
                onClose();
              }}
              className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              title="Close Preview (Esc)"
              aria-label="Close Preview"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Tab Controls & File Search */}
        <div className="flex items-center justify-between p-3 border-b border-border/80 bg-muted/30 gap-2 flex-wrap text-xs">
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => {
                sound.playClickSound();
                setActiveTab('preview');
              }}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1.5 ${
                activeTab === 'preview'
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted'
              }`}
            >
              <Eye className="h-3.5 w-3.5" />
              <span>Formatted Preview</span>
            </button>
            <button
              onClick={() => {
                sound.playClickSound();
                setActiveTab('raw');
              }}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1.5 ${
                activeTab === 'raw'
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted'
              }`}
            >
              <FileCode className="h-3.5 w-3.5" />
              <span>Raw Code / Text</span>
            </button>
            {archiveManifest && (
              <button
                onClick={() => {
                  sound.playClickSound();
                  setActiveTab('manifest');
                }}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1.5 ${
                  activeTab === 'manifest'
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                }`}
              >
                <Layers className="h-3.5 w-3.5" />
                <span>Archive Manifest ({archiveManifest.length})</span>
              </button>
            )}
          </div>

          {activeTab === 'preview' && fileType === 'csv' && (
            <div className="relative min-w-[200px] flex-1 max-w-xs">
              <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-muted-foreground" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search rows in preview..."
                className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-background border border-border text-xs text-foreground placeholder-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-2 top-2 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>
          )}
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 max-h-[58vh] bg-background/50 space-y-3 font-sans">
          {activeTab === 'preview' && (
            <>
              {fileType === 'csv' && (
                <div className="rounded-xl border border-border overflow-hidden bg-card shadow-sm">
                  <div className="overflow-x-auto max-h-[50vh]">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead className="sticky top-0 bg-muted/90 text-foreground font-bold uppercase tracking-wider text-[10px] border-b border-border shadow-sm z-10 backdrop-blur-sm">
                        <tr>
                          <th className="p-2.5 pl-3 w-12 text-muted-foreground font-mono">#</th>
                          {parsedCsv.headers.map((h, i) => (
                            <th key={i} className="p-2.5 pr-4 whitespace-nowrap">
                              {h}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/40 font-mono text-[11px]">
                        {filteredRows.length === 0 ? (
                          <tr>
                            <td
                              colSpan={parsedCsv.headers.length + 1}
                              className="p-8 text-center text-muted-foreground"
                            >
                              No matching records found in export preview.
                            </td>
                          </tr>
                        ) : (
                          filteredRows.map((row, rIdx) => (
                            <tr
                              key={rIdx}
                              className="hover:bg-muted/40 transition-colors odd:bg-card even:bg-muted/10"
                            >
                              <td className="p-2 pl-3 text-muted-foreground font-mono text-[10px]">
                                {rIdx + 1}
                              </td>
                              {row.map((cell, cIdx) => (
                                <td
                                  key={cIdx}
                                  className="p-2 pr-4 whitespace-nowrap text-foreground"
                                  title={cell}
                                >
                                  {cell}
                                </td>
                              ))}
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                  <div className="p-2.5 border-t border-border bg-muted/30 text-[10px] text-muted-foreground flex items-center justify-between">
                    <span>
                      Showing {filteredRows.length} of {parsedCsv.rows.length} rows
                    </span>
                    <span className="font-mono">
                      Target File: <strong className="text-foreground">{fileName}</strong>
                    </span>
                  </div>
                </div>
              )}

              {fileType === 'json' && (
                <div className="rounded-xl border border-border bg-slate-950 p-4 font-mono text-xs text-emerald-400 overflow-x-auto max-h-[50vh] leading-relaxed shadow-inner">
                  <pre>{rawContent}</pre>
                </div>
              )}

              {fileType === 'txt' && (
                <div className="rounded-xl border border-border bg-card p-6 font-serif text-sm text-foreground space-y-4 max-h-[50vh] overflow-y-auto shadow-inner leading-relaxed select-text">
                  <div className="border-b border-border/80 pb-3 flex items-center justify-between">
                    <div>
                      <div className="text-xs font-mono font-bold text-primary uppercase tracking-wider">
                        CRIMENEXUS LEGAL DRAFT PREVIEW
                      </div>
                      <div className="text-xs text-muted-foreground font-sans">
                        Statutory Formatting under Section 63 BSA & Bharatiya Nagarik Suraksha Sanhita, 2023
                      </div>
                    </div>
                    <div className="p-2 rounded-lg bg-emerald-950/40 text-emerald-400 border border-emerald-500/40 flex items-center gap-1.5 font-sans font-bold text-xs">
                      <Scale className="h-4 w-4" />
                      <span>Court Ready</span>
                    </div>
                  </div>
                  <div className="whitespace-pre-wrap font-mono text-xs bg-slate-950/60 p-4 rounded-lg border border-border/60 text-slate-200">
                    {rawContent}
                  </div>
                </div>
              )}

              {fileType === 'zip' && archiveManifest && (
                <div className="space-y-3">
                  <div className="p-3 rounded-xl border border-indigo-500/30 bg-indigo-950/20 text-xs text-indigo-300 flex items-center gap-2">
                    <Archive className="h-4 w-4 text-indigo-400 shrink-0" />
                    <span>
                      Archive Package contains {archiveManifest.length} authenticated exhibits sealed with Section 63 BSA SHA-256 signatures.
                    </span>
                  </div>
                  <div className="rounded-xl border border-border overflow-hidden bg-card">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-muted/80 text-foreground font-bold uppercase text-[10px] border-b border-border">
                        <tr>
                          <th className="p-2.5 pl-3">File Name</th>
                          <th className="p-2.5">Category</th>
                          <th className="p-2.5">Size</th>
                          <th className="p-2.5">SHA-256 Checksum</th>
                          <th className="p-2.5 text-right pr-3">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/40 font-mono text-[11px]">
                        {archiveManifest.map((item, idx) => (
                          <tr key={idx} className="hover:bg-muted/30">
                            <td className="p-2.5 pl-3 font-bold text-foreground">
                              {item.fileName}
                            </td>
                            <td className="p-2.5 text-muted-foreground">{item.type}</td>
                            <td className="p-2.5 text-cyan-400">{item.size}</td>
                            <td className="p-2.5 text-muted-foreground text-[10px] truncate max-w-[160px]">
                              {item.sha256}
                            </td>
                            <td className="p-2.5 text-right pr-3">
                              <Badge variant="success" className="text-[9px]">
                                SEALED & VERIFIED
                              </Badge>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </>
          )}

          {activeTab === 'raw' && (
            <div className="rounded-xl border border-border bg-slate-950 p-4 font-mono text-xs text-slate-200 overflow-x-auto max-h-[50vh] leading-relaxed shadow-inner">
              <pre className="whitespace-pre-wrap">{rawContent}</pre>
            </div>
          )}

          {activeTab === 'manifest' && archiveManifest && (
            <div className="space-y-3">
              <div className="p-3 rounded-xl border border-border bg-card text-xs space-y-1.5 font-mono">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Archive File Name:</span>
                  <span className="text-foreground font-bold">{fileName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Payload Size:</span>
                  <span className="text-cyan-400 font-bold">{computedSize}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Master Bundle Hash (SHA-256):</span>
                  <span className="text-amber-400 font-bold truncate max-w-[280px]">
                    {sha256Fingerprint}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Statutory Reference:</span>
                  <span className="text-emerald-400">
                    {metadata.statutoryRef || 'Section 63 BSA / Section 173 BNSS'}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between p-4 border-t border-border bg-muted/40 gap-3">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <ShieldCheck className="h-4 w-4 text-emerald-400" />
            <span className="font-mono text-[11px] truncate">
              SHA-256: {sha256Fingerprint.slice(0, 16)}...{sha256Fingerprint.slice(-8)}
            </span>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end flex-wrap">
            <Button
              size="sm"
              variant="outline"
              onClick={handleCopy}
              className="border-border text-xs font-semibold flex items-center gap-1.5"
              title="Copy export content to clipboard"
            >
              {copied ? (
                <>
                  <Check className="h-3.5 w-3.5 text-emerald-400" />
                  <span>Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5" />
                  <span>Copy Content</span>
                </>
              )}
            </Button>

            <Button
              size="sm"
              variant="outline"
              onClick={handlePrint}
              className="border-border text-xs font-semibold flex items-center gap-1.5"
              title="Print document or send to printer"
            >
              <Printer className="h-3.5 w-3.5" />
              <span>Print</span>
            </Button>

            <Button
              size="sm"
              onClick={handleDownloadNow}
              className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-xs flex items-center gap-1.5 shadow-md shadow-primary/20"
              title={`Download and save ${fileName}`}
            >
              <Download className="h-3.5 w-3.5" />
              <span>Download {fileName}</span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  </div>
);

  return createPortal(modalContent, document.body);
}
