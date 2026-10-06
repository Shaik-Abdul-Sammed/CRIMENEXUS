import React from 'react';
import { Link } from 'react-router-dom';
import {
  FolderGit2,
  FileCheck2,
  Users2,
  Network,
  ArrowUpRight,
  ShieldAlert,
  AlertTriangle,
  GitMerge,
  Sparkles,
} from 'lucide-react';
import { ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts';
import {
  useInvestigations,
  useCaseEvidence,
  useEntities,
  useNetworkGraph,
  useAIFindings,
  useResolutionCandidates,
} from '../../hooks/useIntelligenceApi';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { getStatusBadgeClass } from '../../utils/formatters';

export function DashboardPage() {
  const { data: cases } = useInvestigations();
  const { data: evidence } = useCaseEvidence('ALL');
  const { data: entities } = useEntities('ALL');
  const { data: network } = useNetworkGraph('ALL');
  const { data: aiFindings } = useAIFindings('ALL');
  const { data: candidates } = useResolutionCandidates();

  // Metrics calculation
  const totalCases = cases?.length || 0;
  const activeCases = cases?.filter((c) => c.status === 'UNDER_INVESTIGATION' || c.status === 'OPEN').length || 0;
  const totalEvidence = evidence?.length || 0;
  const totalEntities = entities?.length || 0;
  const totalRelationships = network?.edges?.length || 0;
  const pendingDuplicates = candidates?.filter((c) => c.status === 'PENDING').length || 0;

  // Chart data setup
  const entityTypeCounts: Record<string, number> = {};
  entities?.forEach((e) => {
    entityTypeCounts[e.type] = (entityTypeCounts[e.type] || 0) + 1;
  });
  const pieData = Object.entries(entityTypeCounts).map(([name, value]) => ({ name, value }));

  const relationshipTypeCounts: Record<string, number> = {};
  network?.edges?.forEach((r) => {
    relationshipTypeCounts[r.type] = (relationshipTypeCounts[r.type] || 0) + 1;
  });
  const barData = Object.entries(relationshipTypeCounts).map(([name, value]) => ({ name, value }));

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4', '#64748b'];

  return (
    <div className="space-y-6">
      {/* Disclaimer Banner */}
      <div className="flex items-center gap-3 p-3.5 rounded-xl border border-amber-500/30 bg-amber-500/10 text-amber-300 text-xs">
        <ShieldAlert className="h-5 w-5 text-amber-400 shrink-0" />
        <div className="flex-1 leading-relaxed">
          <span className="font-bold">INVESTIGATION ASSISTANCE MANDATE:</span> AI findings provide evidence-backed analytical suggestions. AI models do NOT assign guilt scores or make autonomous law-enforcement determinations. Human supervisor review is required.
        </div>
      </div>

      {/* Top Stat Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="hover:border-primary/40 transition-all">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Active Investigations
              </p>
              <h3 className="text-2xl font-extrabold text-foreground mt-1">
                {activeCases} <span className="text-xs font-normal text-muted-foreground">/ {totalCases} Total</span>
              </h3>
              <p className="text-[11px] text-emerald-400 mt-1 font-medium flex items-center gap-1">
                <ArrowUpRight className="h-3 w-3" /> 2 High Priority Operations
              </p>
            </div>
            <div className="p-3 rounded-xl bg-primary/10 text-primary border border-primary/20">
              <FolderGit2 className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="hover:border-emerald-500/40 transition-all">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Evidence Vault Count
              </p>
              <h3 className="text-2xl font-extrabold text-foreground mt-1">{totalEvidence}</h3>
              <p className="text-[11px] text-emerald-400 mt-1 font-medium">100% Cryptographically Hashed</p>
            </div>
            <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <FileCheck2 className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="hover:border-blue-500/40 transition-all">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Extracted Entities
              </p>
              <h3 className="text-2xl font-extrabold text-foreground mt-1">{totalEntities}</h3>
              <p className="text-[11px] text-amber-400 mt-1 font-medium flex items-center gap-1">
                <GitMerge className="h-3 w-3" /> {pendingDuplicates} Pending Merge Review
              </p>
            </div>
            <div className="p-3 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
              <Users2 className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="hover:border-purple-500/40 transition-all">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Network Links
              </p>
              <h3 className="text-2xl font-extrabold text-foreground mt-1">{totalRelationships}</h3>
              <p className="text-[11px] text-purple-400 mt-1 font-medium">Cytoscape Graph Ready</p>
            </div>
            <div className="p-3 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
              <Network className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Grid: AI Assistant & Graph Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: AI Insights & Charts */}
        <div className="lg:col-span-2 space-y-6">
          {/* AI Findings Highlight */}
          <Card className="border-primary/30 bg-gradient-to-br from-card via-card to-primary/5">
            <CardHeader className="flex flex-row items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                <CardTitle>AI Discovery & Investigative Synthesis</CardTitle>
              </div>
              <Link to="/ai-assistant">
                <Button size="sm" variant="outline">
                  Ask AI Assistant
                </Button>
              </Link>
            </CardHeader>
            <CardContent className="space-y-4">
              {aiFindings?.slice(0, 2).map((item) => (
                <div
                  key={item.id}
                  className="p-4 rounded-xl border border-border bg-background/60 space-y-2 hover:border-primary/40 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-sm text-foreground flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-amber-400" />
                      {item.title}
                    </span>
                    <Badge variant={item.riskLevel === 'CRITICAL' ? 'destructive' : 'warning'}>
                      {(item.confidence * 100).toFixed(0)}% Confidence
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">{item.finding}</p>
                  <div className="flex items-center justify-between pt-1 text-[11px] text-muted-foreground border-t border-border/40">
                    <span>Target Case: Operation Shadow Vault</span>
                    <Link to="/evidence" className="text-primary hover:underline font-medium">
                      View Grounded Evidence ({item.supportingEvidenceIds.length}) &rarr;
                    </Link>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Charts Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Entity Distribution</CardTitle>
              </CardHeader>
              <CardContent className="h-60">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={75}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {pieData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Relationship Types Breakdown</CardTitle>
              </CardHeader>
              <CardContent className="h-60">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={barData}>
                    <XAxis dataKey="name" stroke="#64748b" fontSize={10} tickLine={false} />
                    <YAxis stroke="#64748b" fontSize={10} tickLine={false} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px' }}
                    />
                    <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Right 1 Col: Quick Case Stream */}
        <div className="space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-sm">Active Target Cases</CardTitle>
              <Link to="/cases" className="text-xs text-primary hover:underline font-medium">
                View All
              </Link>
            </CardHeader>
            <CardContent className="space-y-3">
              {cases?.map((c) => (
                <Link
                  key={c.id}
                  to={`/cases/${c.id}`}
                  className="block p-3 rounded-lg border border-border hover:border-primary/40 bg-background/40 hover:bg-accent/40 transition-all group"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-mono text-[11px] text-primary font-bold">{c.caseNumber}</span>
                    <span className={`text-[10px] px-2 py-0.5 rounded border font-semibold ${getStatusBadgeClass(c.status)}`}>
                      {c.status}
                    </span>
                  </div>
                  <h4 className="text-xs font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-1">
                    {c.title}
                  </h4>
                  <p className="text-[11px] text-muted-foreground mt-1 line-clamp-2">{c.description}</p>
                  <div className="flex items-center justify-between mt-2 pt-2 border-t border-border/40 text-[10px] text-muted-foreground">
                    <span>{c.locationName}</span>
                    <span>{c.entityCount} Entities • {c.evidenceCount} Evidence</span>
                  </div>
                </Link>
              ))}
            </CardContent>
          </Card>

          {/* Hero Feature Quick Launcher */}
          <Card className="border-primary/40 bg-primary/10">
            <CardContent className="p-5 text-center space-y-3">
              <div className="inline-flex p-3 rounded-full bg-primary/20 text-primary border border-primary/40">
                <Network className="h-8 w-8" />
              </div>
              <div>
                <h4 className="font-bold text-sm text-foreground">Interactive Cytoscape Network Graph</h4>
                <p className="text-xs text-muted-foreground mt-1">
                  Explore full node topology, edge relationship confidence, and neighbor expansion.
                </p>
              </div>
              <Link to="/network-graph">
                <Button className="w-full" icon={<ArrowUpRight className="h-4 w-4" />}>
                  Launch Network Canvas
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
