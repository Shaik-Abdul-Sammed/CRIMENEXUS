import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  ShieldAlert,
  Zap,
  Lock,
  Radio,
  Eye,
  FileCheck2,
  CheckCircle2,
  SlidersHorizontal,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';

export interface ActionItem {
  id: string;
  title: string;
  category: 'FREEZE_ACCOUNT' | 'TRACK_VEHICLE' | 'CHECK_CCTV' | 'TELECOM_INTERCEPT';
  targetIdentifier: string;
  targetName: string;
  reason: string;
  priority: 'CRITICAL' | 'HIGH' | 'MEDIUM';
  confidenceScore: number;
  status: 'PENDING' | 'EXECUTED';
  legalAuthority: string;
}

const DEFAULT_RECOMMENDED_ACTIONS: ActionItem[] = [
  {
    id: 'act-101',
    title: 'Emergency Account Freeze Directive',
    category: 'FREEZE_ACCOUNT',
    targetIdentifier: 'HDFC-908122',
    targetName: 'Apex Trading Co. (Shell Entity)',
    reason: 'Multi-hop laundering detected: Rapid dissipation of ₹ 50,000,000 to crypto escrow within 4 hours of deposit.',
    priority: 'CRITICAL',
    confidenceScore: 0.94,
    status: 'PENDING',
    legalAuthority: 'Section 102 CrPC / PMLA 2002',
  },
  {
    id: 'act-102',
    title: 'Immediate ANPR Checkpoint Interception',
    category: 'TRACK_VEHICLE',
    targetIdentifier: 'KA-01-MJ-4091',
    targetName: 'Black Toyota Fortuner (Suspect Convoy)',
    reason: 'Spatiotemporal AI model predicts vehicle approaching Yamuna Expressway Toll Plaza KM 48 within 35 minutes.',
    priority: 'CRITICAL',
    confidenceScore: 0.88,
    status: 'PENDING',
    legalAuthority: 'CrPC Section 41B Lookout Notice',
  },
  {
    id: 'act-103',
    title: 'Surveillance Footage Subpoena (CCTV)',
    category: 'CHECK_CCTV',
    targetIdentifier: 'PORT-CCTV-12',
    targetName: 'Nhava Sheva Warehouse Gate #4',
    reason: 'Cell site logs place primary suspect phone +91 91234 56789 within 25m of gate during container offloading.',
    priority: 'HIGH',
    confidenceScore: 0.91,
    status: 'PENDING',
    legalAuthority: 'Section 91 CrPC Production Order',
  },
  {
    id: 'act-104',
    title: 'Cellular Tower Intercept & Pen Register',
    category: 'TELECOM_INTERCEPT',
    targetIdentifier: '+91 91234 56789',
    targetName: 'Burner SIM (Suspect Primary Voice Node)',
    reason: 'Burst frequency anomaly: 42 encrypted calls to overseas VoIP proxy prior to wire transfers.',
    priority: 'HIGH',
    confidenceScore: 0.85,
    status: 'PENDING',
    legalAuthority: 'Indian Telegraph Act Section 5(2)',
  },
];

export function RecommendedActions() {
  const [actions, setActions] = useState<ActionItem[]>(DEFAULT_RECOMMENDED_ACTIONS);
  const [selectedPriority, setSelectedPriority] = useState<string>('ALL');
  const [executingId, setExecutingId] = useState<string | null>(null);

  useEffect(() => {
    const isMock = import.meta.env.VITE_API_MOCK_MODE === 'true';
    if (!isMock) {
      const baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1';
      axios
        .get(`${baseURL}/threats/risk-score/Vikram%20Malhotra`, { timeout: 2500 })
        .then((res) => {
          if (res.data?.recommendations && Array.isArray(res.data.recommendations)) {
            const dynamicActions: ActionItem[] = res.data.recommendations.map(
              (rec: string, idx: number) => ({
                id: `ai-rec-${idx + 1}`,
                title: rec,
                category: rec.toLowerCase().includes('freeze')
                  ? 'FREEZE_ACCOUNT'
                  : rec.toLowerCase().includes('intercept') || rec.toLowerCase().includes('track')
                  ? 'TRACK_VEHICLE'
                  : rec.toLowerCase().includes('call') || rec.toLowerCase().includes('cdr')
                  ? 'TELECOM_INTERCEPT'
                  : 'CHECK_CCTV',
                targetIdentifier: res.data.suspect_name || 'Primary Suspect',
                targetName: `${res.data.suspect_name} (Risk: ${res.data.risk_percentage}%)`,
                reason: `AI Risk Factor: ${res.data.primary_risk_factor || 'Suspicious network connectivity'}`,
                priority: res.data.threat_level === 'CRITICAL' ? 'CRITICAL' : 'HIGH',
                confidenceScore: (res.data.risk_score || 85) / 100,
                status: 'PENDING',
                legalAuthority: 'Section 102 CrPC / Sec 106 BNSS',
              })
            );
            if (dynamicActions.length > 0) {
              setActions((prev) => [
                ...dynamicActions,
                ...prev.filter((p) => !dynamicActions.some((d) => d.id === p.id)),
              ]);
            }
          }
        })
        .catch(() => {
          // Fallback to default operational directives
        });
    }
  }, []);

  const handleExecute = (id: string) => {
    setExecutingId(id);
    setTimeout(() => {
      setActions((prev) =>
        prev.map((act) => (act.id === id ? { ...act, status: 'EXECUTED' } : act))
      );
      setExecutingId(null);
    }, 600);
  };

  const getCategoryIcon = (category: ActionItem['category']) => {
    switch (category) {
      case 'FREEZE_ACCOUNT':
        return <Lock className="h-4 w-4 text-emerald-400" />;
      case 'TRACK_VEHICLE':
        return <Radio className="h-4 w-4 text-purple-400" />;
      case 'CHECK_CCTV':
        return <Eye className="h-4 w-4 text-blue-400" />;
      case 'TELECOM_INTERCEPT':
        return <Zap className="h-4 w-4 text-amber-400" />;
    }
  };

  const filtered = selectedPriority === 'ALL'
    ? actions
    : actions.filter((a) => a.priority === selectedPriority);

  const pendingCount = actions.filter((a) => a.status === 'PENDING').length;

  return (
    <Card className="border-primary/40 bg-card/60 backdrop-blur-md">
      <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 gap-2">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-red-500/10 text-red-400 border border-red-500/20">
            <ShieldAlert className="h-5 w-5" />
          </div>
          <div>
            <CardTitle className="text-base font-bold flex items-center gap-2">
              Actionable Directives & Priority Orders
              <span className="text-xs px-2 py-0.5 rounded-full bg-red-500/20 text-red-300 border border-red-500/30 font-mono">
                {pendingCount} Pending Action
              </span>
            </CardTitle>
            <p className="text-xs text-muted-foreground mt-0.5">
              Automated AI-synthesized operational recommendations for law enforcement dispatch and asset restraint.
            </p>
          </div>
        </div>

        {/* Priority Filter */}
        <div className="flex items-center gap-1.5 text-xs">
          <SlidersHorizontal className="h-3.5 w-3.5 text-muted-foreground" />
          {['ALL', 'CRITICAL', 'HIGH'].map((p) => (
            <button
              key={p}
              onClick={() => setSelectedPriority(p)}
              className={`px-2 py-0.5 rounded text-[11px] font-semibold transition-colors ${
                selectedPriority === p
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted/40 text-muted-foreground hover:bg-muted'
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      </CardHeader>

      <CardContent className="space-y-3 pt-2">
        {filtered.map((item) => (
          <div
            key={item.id}
            className={`p-4 rounded-xl border transition-all ${
              item.status === 'EXECUTED'
                ? 'border-emerald-500/20 bg-emerald-500/5 opacity-80'
                : item.priority === 'CRITICAL'
                ? 'border-red-500/30 bg-red-500/5 hover:border-red-500/50'
                : 'border-amber-500/30 bg-amber-500/5 hover:border-amber-500/50'
            }`}
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-background/80 border border-border">
                  {getCategoryIcon(item.category)}
                </div>
                <div>
                  <h4 className="text-sm font-bold text-foreground flex items-center gap-2">
                    {item.title}
                    <Badge
                      variant={
                        item.priority === 'CRITICAL'
                          ? 'destructive'
                          : item.priority === 'HIGH'
                          ? 'warning'
                          : 'default'
                      }
                      className="text-[10px]"
                    >
                      {item.priority}
                    </Badge>
                  </h4>
                  <p className="text-xs text-muted-foreground font-mono mt-0.5">
                    Target: <span className="text-foreground font-semibold">{item.targetName}</span> [{item.targetIdentifier}]
                  </p>
                </div>
              </div>

              {/* Action Button */}
              <div className="flex items-center gap-2 self-end sm:self-auto">
                <div className="text-right text-[11px] text-muted-foreground mr-1 hidden md:block">
                  <div className="font-medium text-foreground">{(item.confidenceScore * 100).toFixed(0)}% AI Confidence</div>
                  <div className="text-[10px]">{item.legalAuthority}</div>
                </div>

                {item.status === 'EXECUTED' ? (
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 text-xs font-bold">
                    <CheckCircle2 className="h-4 w-4" /> Order Dispatched
                  </div>
                ) : (
                  <Button
                    size="sm"
                    variant={item.priority === 'CRITICAL' ? 'danger' : 'primary'}
                    onClick={() => handleExecute(item.id)}
                    isLoading={executingId === item.id}
                    icon={<FileCheck2 className="h-3.5 w-3.5" />}
                  >
                    Execute Directive
                  </Button>
                )}
              </div>
            </div>

            <p className="text-xs text-muted-foreground mt-2 pl-1 leading-relaxed border-t border-border/30 pt-2">
              {item.reason}
            </p>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
