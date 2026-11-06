import {
  Settings as SettingsIcon,
  User,
  Shield,
  Sun,
  Info,
  CheckCircle2,
  Palette,
  Check,
} from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import { useAppStore, FigmaTheme } from '../../stores/appStore';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { sound } from '../../utils/soundEffects';

export function SettingsPage() {
  const { currentUser, activeRole } = useAuthStore();
  const { theme, toggleTheme, figmaTheme, setFigmaTheme } = useAppStore();

  const permissionsMatrix = [
    { module: 'Dashboard & Intelligence Workspace', INVESTIGATOR: true, ANALYST: true, SUPERVISOR: true, ADMIN: true },
    { module: 'Investigations & Case Creation', INVESTIGATOR: true, ANALYST: true, SUPERVISOR: true, ADMIN: true },
    { module: 'Evidence Vault & Hash Processing', INVESTIGATOR: true, ANALYST: true, SUPERVISOR: true, ADMIN: true },
    { module: 'Entity Resolution & Merge Approval', INVESTIGATOR: false, ANALYST: true, SUPERVISOR: true, ADMIN: true },
    { module: 'Cytoscape Network Topology Graph', INVESTIGATOR: true, ANALYST: true, SUPERVISOR: true, ADMIN: true },
    { module: 'AI Assistant & Local RAG Queries', INVESTIGATOR: true, ANALYST: true, SUPERVISOR: true, ADMIN: true },
    { module: 'Formal Intelligence Reports Generation', INVESTIGATOR: false, ANALYST: true, SUPERVISOR: true, ADMIN: true },
    { module: 'System Security Audit Logs Inspection', INVESTIGATOR: false, ANALYST: true, SUPERVISOR: true, ADMIN: true },
    { module: 'System Configuration & User Management', INVESTIGATOR: false, ANALYST: false, SUPERVISOR: false, ADMIN: true },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-foreground flex items-center gap-2">
            <SettingsIcon className="h-6 w-6 text-primary" />
            System Settings & Security Control Center
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Configure user profile, active RBAC permissions, UI theme, and API backend integration points.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <User className="h-4 w-4 text-primary" />
                Active Officer Profile
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-xs">
              <div className="flex items-center gap-4 p-4 rounded-xl bg-background/50 border border-border">
                <img
                  src={currentUser?.avatar}
                  alt={currentUser?.name}
                  className="h-14 w-14 rounded-full object-cover border-2 border-primary"
                />
                <div className="space-y-1">
                  <h3 className="text-base font-extrabold text-foreground">{currentUser?.name}</h3>
                  <p className="text-muted-foreground">{currentUser?.department}</p>
                  <div className="flex items-center gap-2 pt-1">
                    <Badge variant="default">Role: {activeRole}</Badge>
                    <span className="font-mono text-[11px] text-muted-foreground">Badge #: {currentUser?.badgeNumber}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <Shield className="h-4 w-4 text-emerald-400" />
                Role-Based Access Control (RBAC) Permissions Matrix
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0 overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-muted/50 border-b border-border text-muted-foreground uppercase text-[10px] font-bold">
                  <tr>
                    <th className="p-3">Workspace Module</th>
                    <th className="p-3 text-center">INVESTIGATOR</th>
                    <th className="p-3 text-center">ANALYST</th>
                    <th className="p-3 text-center">SUPERVISOR</th>
                    <th className="p-3 text-center">ADMIN</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40">
                  {permissionsMatrix.map((row) => (
                    <tr key={row.module} className="hover:bg-accent/40">
                      <td className="p-3 font-semibold text-foreground">{row.module}</td>
                      <td className="p-3 text-center">
                        {row.INVESTIGATOR ? <CheckCircle2 className="h-4 w-4 text-emerald-400 mx-auto" /> : <span className="text-muted-foreground text-[10px]">—</span>}
                      </td>
                      <td className="p-3 text-center">
                        {row.ANALYST ? <CheckCircle2 className="h-4 w-4 text-emerald-400 mx-auto" /> : <span className="text-muted-foreground text-[10px]">—</span>}
                      </td>
                      <td className="p-3 text-center">
                        {row.SUPERVISOR ? <CheckCircle2 className="h-4 w-4 text-emerald-400 mx-auto" /> : <span className="text-muted-foreground text-[10px]">—</span>}
                      </td>
                      <td className="p-3 text-center">
                        {row.ADMIN ? <CheckCircle2 className="h-4 w-4 text-emerald-400 mx-auto" /> : <span className="text-muted-foreground text-[10px]">—</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Palette className="h-4 w-4 text-primary" />
                  Figma Sovereign Theme Architecture
                </span>
                <Badge variant="outline" className="text-[10px] font-mono">
                  {figmaTheme.toUpperCase()}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-xs">
              <p className="text-muted-foreground leading-relaxed">
                Select your operational tactical interface theme. Calibrated to WCAG 2.1 AA standards for 24/7 command centers and field tablets.
              </p>
              
              <div className="space-y-2 pt-1">
                {[
                  { id: 'dark' as FigmaTheme, name: 'Palantir Midnight Command', icon: '🌙', hex: '#0A1929', desc: 'Ops Room Dark Navy & Cobalt' },
                  { id: 'light' as FigmaTheme, name: 'Daylight Thana Patrol', icon: '☀️', hex: '#F8FAFC', desc: 'Station Desk Crisp White & Cobalt' },
                  { id: 'cyber-matrix' as FigmaTheme, name: 'Cyber Forensics Matrix', icon: '⚡', hex: '#020B08', desc: 'Wiretap Terminal Void & Emerald' },
                  { id: 'amber-tactical' as FigmaTheme, name: 'Highway Intercept Tactical', icon: '🚨', hex: '#0C0A07', desc: 'PCR Pursuit Charcoal & Amber' },
                ].map((th) => {
                  const isActive = figmaTheme === th.id;
                  return (
                    <button
                      key={th.id}
                      onClick={() => {
                        sound.playClickSound();
                        setFigmaTheme(th.id);
                      }}
                      className={`w-full flex items-center justify-between p-2.5 rounded-lg border text-left transition-all ${
                        isActive
                          ? 'border-primary bg-primary/10 text-foreground font-semibold shadow-sm'
                          : 'border-border/60 bg-background/50 hover:border-primary/40 text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="text-lg">{th.icon}</span>
                        <div>
                          <div className="text-xs font-bold text-foreground leading-tight">{th.name}</div>
                          <div className="text-[10px] text-muted-foreground">{th.desc}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="h-3 w-3 rounded-full border border-white/20" style={{ backgroundColor: th.hex }} />
                        {isActive ? <Check className="h-4 w-4 text-primary" /> : null}
                      </div>
                    </button>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <Info className="h-4 w-4 text-primary" />
                Platform Infrastructure Specs
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-xs font-mono">
              <div className="flex justify-between py-1 border-b border-border/40">
                <span className="text-muted-foreground">System:</span>
                <span className="font-bold text-foreground">CRIMENEXUS v2.4</span>
              </div>
              <div className="flex justify-between py-1 border-b border-border/40">
                <span className="text-muted-foreground">Frontend Stack:</span>
                <span className="text-foreground">React 19 + TypeScript + Vite</span>
              </div>
              <div className="flex justify-between py-1 border-b border-border/40">
                <span className="text-muted-foreground">Graph Engine:</span>
                <span className="text-foreground">Cytoscape.js v3.30</span>
              </div>
              <div className="flex justify-between py-1 border-b border-border/40">
                <span className="text-muted-foreground">Map Engine:</span>
                <span className="text-foreground">MapLibre GL JS v5.1</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-muted-foreground">State Management:</span>
                <span className="text-foreground">TanStack Query + Zustand</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
