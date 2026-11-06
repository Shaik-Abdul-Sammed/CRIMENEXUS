import React, { useState } from 'react';
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
} from 'lucide-react';
import { useEntities, useResolutionCandidates } from '../../hooks/useIntelligenceApi';
import { EntityType } from '../../types';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { getRiskColorClass } from '../../utils/formatters';
import { sound } from '../../utils/soundEffects';
import { useToast } from '../../components/ui/Toast';

export function EntitiesPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

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

  const handleExportCsv = () => {
    sound.playClickSound();
    if (!filtered || filtered.length === 0) {
      toast.warning('No entities to export under current filter.', 'Export Skipped');
      return;
    }

    const headers = ['Entity ID', 'Name', 'Type', 'Risk Level', 'Review Status', 'Confidence', 'Attributes'];
    const rows = filtered.map((e) => [
      `"${e.id}"`,
      `"${e.name.replace(/"/g, '""')}"`,
      `"${e.type}"`,
      `"${e.riskLevel}"`,
      `"${e.reviewStatus}"`,
      `"${(e.confidence * 100).toFixed(0)}%"`,
      `"${Object.entries(e.attributes).map(([k, v]) => `${k}:${v}`).join('; ').replace(/"/g, '""')}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `CRIMENEXUS_Entities_Manifest_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success(`Exported ${filtered.length} entities to CSV manifest.`, 'CSV Export Ready');
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

  const filtered = entities?.filter((e) =>
    e.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

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

      {/* Filter Bar */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 p-4 rounded-xl border border-border bg-card">
        <div className="w-full md:w-80">
          <Input
            placeholder="Search entity name, phone, vehicle registration..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            icon={<Search className="h-4 w-4" />}
          />
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
              onClick={() => setTypeFilter(t)}
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
      ) : !filtered || filtered.length === 0 ? (
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
            }}
          >
            Clear Filters
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((item) => (
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
                <CardTitle className="text-base line-clamp-1">{item.name}</CardTitle>
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

              <div className="p-4 pt-0 border-t border-border/40 mt-3 flex items-center justify-between">
                <Badge variant={item.reviewStatus === 'VERIFIED' ? 'success' : 'warning'}>
                  {item.reviewStatus}
                </Badge>
                <Link to={`/entities/${item.id}`}>
                  <Button size="sm" variant="outline">
                    Inspect Entity &rarr;
                  </Button>
                </Link>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
