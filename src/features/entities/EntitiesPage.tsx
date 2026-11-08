import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Users2,
  Search,
  Filter,
  User,
  Phone,
  Mail,
  Car,
  CreditCard,
  Wallet,
  Globe,
  MapPin,
  Building,
  Smartphone,
  Share2,
  AlertTriangle,
  Download,
  Copy,
  Check,
  X,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  Eye,
} from 'lucide-react';
import { useEntities, useResolutionCandidates } from '../../hooks/useIntelligenceApi';
import { EntityType, Entity } from '../../types';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { DocumentPreviewModal } from '../../components/common/DocumentPreviewModal';
import { FileExportPreviewModal } from '../../components/common/FileExportPreviewModal';
import { getRiskColorClass } from '../../utils/formatters';
import { sound } from '../../utils/soundEffects';
import { useToast } from '../../components/ui/Toast';

export function EntitiesPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'name' | 'risk' | 'confidence'>('risk');
  const [previewEntity, setPreviewEntity] = useState<Entity | null>(null);
  const [csvExportPreviewOpen, setCsvExportPreviewOpen] = useState<boolean>(false);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [rowsPerPage, setRowsPerPage] = useState<number>(12);

  const toast = useToast();
  const { data: entities, isLoading } = useEntities('ALL', typeFilter);
  const { data: candidates } = useResolutionCandidates();

  const handleCopyValue = (text: string, id: string) => {
    sound.playClickSound();
    navigator.clipboard.writeText(text);
    setCopiedKey(id);
    toast.success(`Copied: ${text}`, 'Entity Attribute Copied');
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const highlightMatch = (text: string, term: string) => {
    if (!term.trim()) return text;
    const regex = new RegExp(`(${term.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&')})`, 'gi');
    const parts = text.split(regex);
    return parts.map((part, i) =>
      part.toLowerCase() === term.toLowerCase() ? (
        <mark key={i} className="bg-amber-400/90 text-slate-950 font-black px-1 rounded">
          {part}
        </mark>
      ) : (
        part
      )
    );
  };

  const getEntitiesCsvPayload = () => {
    const list = filtered || [];
    const headers = ['Entity ID', 'Name', 'Type', 'Risk Level', 'Review Status', 'Confidence', 'Attributes'];
    const rows = list.map((e) => [
      e.id,
      e.name,
      e.type,
      e.riskLevel,
      e.reviewStatus,
      `${(e.confidence * 100).toFixed(0)}%`,
      Object.entries(e.attributes).map(([k, v]) => `${k}:${v}`).join('; ')
    ]);
    const rawCsv = [headers.join(','), ...rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(','))].join('\n');
    return { headers, rows, rawCsv };
  };

  const executeDirectCsvDownload = () => {
    const { rawCsv } = getEntitiesCsvPayload();
    const encodedUri = encodeURI('data:text/csv;charset=utf-8,' + rawCsv);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `CRIMENEXUS_Entities_Manifest_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success(`Exported ${(filtered || []).length} entities to CSV manifest.`, 'CSV Export Ready');
  };

  const handleExportCsv = () => {
    sound.playClickSound();
    if (!filtered || filtered.length === 0) {
      toast.warning('No entities to export under current filter.', 'Export Skipped');
      return;
    }
    setCsvExportPreviewOpen(true);
  };

  const getEntityIcon = (type: EntityType) => {
    switch (type) {
      case 'PHONE':
        return <Phone className="h-4 w-4 text-amber-400" />;
      case 'EMAIL':
        return <Mail className="h-4 w-4 text-cyan-400" />;
      case 'VEHICLE':
        return <Car className="h-4 w-4 text-purple-400" />;
      case 'BANK_ACCOUNT':
        return <CreditCard className="h-4 w-4 text-emerald-400" />;
      case 'UPI_ID':
        return <Globe className="h-4 w-4 text-blue-400" />;
      case 'CRYPTO_WALLET':
        return <Wallet className="h-4 w-4 text-amber-500" />;
      case 'LOCATION':
        return <MapPin className="h-4 w-4 text-pink-400" />;
      case 'ORGANIZATION':
        return <Building className="h-4 w-4 text-orange-400" />;
      case 'DEVICE':
        return <Smartphone className="h-4 w-4 text-slate-400" />;
      case 'SOCIAL_ACCOUNT':
        return <Share2 className="h-4 w-4 text-indigo-400" />;
      case 'PERSON':
      default:
        return <User className="h-4 w-4 text-primary" />;
    }
  };

  const riskWeight: Record<string, number> = { CRITICAL: 4, HIGH: 3, MEDIUM: 2, LOW: 1 };

  const filteredAndSorted = useMemo(() => {
    let list = (entities || []).filter((e) =>
      e.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    list.sort((a, b) => {
      let comparison = 0;
      if (sortBy === 'name') {
        comparison = a.name.localeCompare(b.name);
      } else if (sortBy === 'risk') {
        comparison = (riskWeight[b.riskLevel] || 0) - (riskWeight[a.riskLevel] || 0);
      } else if (sortBy === 'confidence') {
        comparison = b.confidence - a.confidence;
      }
      return sortOrder === 'asc' ? -comparison : comparison;
    });

    return list;
  }, [entities, searchTerm, sortBy, sortOrder]);

  const totalPages = Math.max(1, Math.ceil(filteredAndSorted.length / rowsPerPage));
  const paginated = useMemo(() => {
    const start = (currentPage - 1) * rowsPerPage;
    return filteredAndSorted.slice(start, start + rowsPerPage);
  }, [filteredAndSorted, currentPage, rowsPerPage]);

  const filtered = filteredAndSorted;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-foreground flex items-center gap-2">
            <Users2 className="h-6 w-6 text-primary" />
            Extracted Entity Directory
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Structured entities cataloged across investigations with confidence scores and verification status.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={handleExportCsv}
            icon={<Download className="h-4 w-4 text-emerald-400" />}
            title="Download CSV manifest of all filtered entities"
          >
            Export Directory CSV
          </Button>
          <Link to="/entity-resolution">
            <Button variant="outline" icon={<AlertTriangle className="h-4 w-4 text-amber-400" />}>
              Resolution ({candidates?.filter((c) => c.status === 'PENDING').length || 0})
            </Button>
          </Link>
        </div>
      </div>

      {/* Filter Bar with Search, Clear 'X', Sort & Rows Per Page */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 p-4 rounded-xl border border-border bg-card">
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search entity name, phone, vehicle..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full pl-9 pr-8 py-2 rounded-lg bg-background border border-border text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary font-sans"
          />
          {searchTerm && (
            <button
              onClick={() => {
                setSearchTerm('');
                setCurrentPage(1);
              }}
              className="absolute right-2.5 top-2.5 text-muted-foreground hover:text-foreground p-0.5"
              title="Clear search"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* Sort & Rows Per Page Controls */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <ArrowUpDown className="h-3.5 w-3.5 text-primary" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-background border border-border rounded-md px-2 py-1 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
            >
              <option value="risk">Sort by Risk Level</option>
              <option value="name">Sort by Name</option>
              <option value="confidence">Sort by Confidence</option>
            </select>
            <button
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              className="px-2 py-1 rounded bg-background border border-border text-xs font-bold hover:bg-muted"
              title="Toggle Ascending/Descending"
            >
              {sortOrder.toUpperCase()}
            </button>
          </div>

          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <span>Show:</span>
            <select
              value={rowsPerPage}
              onChange={(e) => {
                setRowsPerPage(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="bg-background border border-border rounded-md px-2 py-1 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
            >
              <option value={6}>6</option>
              <option value={12}>12</option>
              <option value={24}>24</option>
              <option value={48}>48</option>
            </select>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-1.5 w-full md:w-auto">
          <Filter className="h-4 w-4 text-muted-foreground mr-1" />
          {[
            'ALL',
            'PERSON',
            'PHONE',
            'VEHICLE',
            'BANK_ACCOUNT',
            'CRYPTO_WALLET',
            'ORGANIZATION',
            'LOCATION',
          ].map((t) => (
            <button
              key={t}
              onClick={() => {
                setTypeFilter(t);
                setCurrentPage(1);
              }}
              className={`px-2.5 py-1 text-[11px] rounded-md border font-medium transition-colors ${
                typeFilter === t
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'bg-background/50 border-border text-muted-foreground hover:text-foreground'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Entity Cards Grid */}
      {isLoading ? (
        <div className="p-12 text-center text-xs text-muted-foreground">Loading entity catalog...</div>
      ) : !paginated || paginated.length === 0 ? (
        <div className="p-12 text-center rounded-xl border border-dashed border-border bg-card/40 space-y-3">
          <Users2 className="h-10 w-10 text-muted-foreground/60 mx-auto" />
          <h3 className="text-sm font-bold text-foreground">No Entities Found</h3>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto">
            No entities matched your search query &quot;{searchTerm}&quot; or type filter &quot;{typeFilter}&quot;.
          </p>
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              setSearchTerm('');
              setTypeFilter('ALL');
              setCurrentPage(1);
            }}
          >
            Clear Filters
          </Button>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {paginated.map((item) => (
              <Card key={item.id} className="flex flex-col justify-between hover:border-primary/50 transition-all">
                <CardHeader className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-xs text-primary flex items-center gap-1.5">
                      {getEntityIcon(item.type)}
                      {item.type}
                    </span>
                    <span className={`text-[10px] px-2 py-0.5 rounded border font-bold ${getRiskColorClass(item.riskLevel)}`}>
                      {item.riskLevel}
                    </span>
                  </div>
                  <CardTitle className="text-base line-clamp-1">{highlightMatch(item.name, searchTerm)}</CardTitle>
                </CardHeader>

                <CardContent className="space-y-3 flex-1 text-xs">
                  <div className="p-3 rounded-lg bg-background/60 border border-border/50 space-y-1.5 text-[11px]">
                    {Object.entries(item.attributes).map(([k, v]) => {
                      const strVal = String(v);
                      const copyId = `${item.id}-${k}`;
                      return (
                        <div key={k} className="flex justify-between items-center border-b border-border/40 pb-1 last:border-0 last:pb-0">
                          <span className="text-muted-foreground capitalize shrink-0 mr-2">{k}:</span>
                          <div className="flex items-center gap-1 min-w-0">
                            <span
                              className="font-semibold text-foreground truncate max-w-[150px] font-mono select-all"
                              title={strVal}
                            >
                              {strVal}
                            </span>
                            <button
                              onClick={() => handleCopyValue(strVal, copyId)}
                              className="text-muted-foreground hover:text-foreground p-0.5 rounded transition-colors shrink-0"
                              title="Copy full attribute value"
                              aria-label={`Copy ${k}`}
                            >
                              {copiedKey === copyId ? (
                                <Check className="h-3 w-3 text-emerald-400" />
                              ) : (
                                <Copy className="h-3 w-3" />
                              )}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-1">
                    <span>Confidence Score:</span>
                    <span className="font-bold text-foreground">{(item.confidence * 100).toFixed(0)}%</span>
                  </div>
                </CardContent>

                <div className="p-4 pt-0 border-t border-border/40 mt-3 flex items-center justify-between gap-2 flex-wrap">
                  <Badge variant={item.reviewStatus === 'VERIFIED' ? 'success' : 'warning'}>
                    {item.reviewStatus}
                  </Badge>
                  <div className="flex items-center gap-1.5">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        sound.playClickSound();
                        setPreviewEntity(item);
                      }}
                      className="border-indigo-500/40 text-indigo-300 hover:bg-indigo-950/40 text-xs font-bold flex items-center gap-1"
                      title="Preview Entity Intelligence Dossier"
                    >
                      <Eye className="h-3 w-3 text-indigo-400" />
                      <span>Preview</span>
                    </Button>
                    <Link to={`/entities/${item.id}`}>
                      <Button size="sm" variant="outline">
                        Inspect &rarr;
                      </Button>
                    </Link>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-3 rounded-xl border border-border bg-card text-xs">
              <span className="text-muted-foreground">
                Showing {Math.min(filteredAndSorted.length, (currentPage - 1) * rowsPerPage + 1)} to{' '}
                {Math.min(filteredAndSorted.length, currentPage * rowsPerPage)} of {filteredAndSorted.length} entries
              </span>
              <div className="flex items-center gap-1">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="h-8 px-2 flex items-center gap-1"
                >
                  <ChevronLeft className="h-3.5 w-3.5" />
                  <span>Previous</span>
                </Button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((pg) => (
                  <button
                    key={pg}
                    onClick={() => setCurrentPage(pg)}
                    className={`h-8 w-8 rounded-lg font-bold transition-colors ${
                      currentPage === pg
                        ? 'bg-primary text-primary-foreground shadow-sm'
                        : 'text-muted-foreground hover:bg-muted'
                    }`}
                  >
                    {pg}
                  </button>
                ))}
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="h-8 px-2 flex items-center gap-1"
                >
                  <span>Next</span>
                  <ChevronRight className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {previewEntity && (
        <DocumentPreviewModal
          isOpen={!!previewEntity}
          onClose={() => setPreviewEntity(null)}
          title={`Entity Intelligence Dossier: ${previewEntity.name}`}
          subtitle={`Entity ID: ${previewEntity.id} • Type: ${previewEntity.type} • Confidence: ${((previewEntity.confidence ?? 0.85) * 100).toFixed(0)}%`}
          caseNumber="CASE-2026-8812"
          pdfUrl="/CRIMENEXUS_Police_Department_Deployment_Dossier.pdf"
          fileName={`Entity_Dossier_${previewEntity.name.replace(/\s+/g, '_')}.pdf`}
          metadata={{
            ioName: 'Inspector Rajesh Varma',
            policeStation: 'Cyber Crime Police Station, Sector 20',
            suspectName: previewEntity.name,
            crimeType: `Suspected Target (${previewEntity.type})`,
            hash: '4d3c2b1a0f9e8d7c6b5a4f3e2d1c0b9a8f7e6d5c4b3a2f1e0d9c8b7a6f5e4d3',
          }}
        />
      )}

      {csvExportPreviewOpen && (
        <FileExportPreviewModal
          isOpen={csvExportPreviewOpen}
          onClose={() => setCsvExportPreviewOpen(false)}
          title="Entity Directory Manifest CSV Export Preview"
          subtitle="Comprehensive cross-jurisdictional entity resolution ledger and risk classifications."
          fileName={`CRIMENEXUS_Entities_Manifest_${new Date().toISOString().slice(0, 10)}.csv`}
          fileType="csv"
          rawContent={getEntitiesCsvPayload().rawCsv}
          csvHeaders={getEntitiesCsvPayload().headers}
          csvRows={getEntitiesCsvPayload().rows}
          onConfirmExport={executeDirectCsvDownload}
          metadata={{
            totalRecords: (filtered || []).length,
            statutoryRef: 'Section 63 Bharatiya Sakshya Adhiniyam, 2023',
            hash: '4d3c2b1a0f9e8d7c6b5a4f3e2d1c0b9a8f7e6d5c4b3a2f1e0d9c8b7a6f5e4d3',
          }}
        />
      )}
    </div>
  );
}
