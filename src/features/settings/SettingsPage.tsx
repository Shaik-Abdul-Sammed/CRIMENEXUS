import {
  Settings as SettingsIcon,
  User,
  Shield,
  Sun,
  Info,
  CheckCircle2,
} from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import { useAppStore } from '../../stores/appStore';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';

export function SettingsPage() {
  const { currentUser, activeRole } = useAuthStore();
  const { theme, toggleTheme } = useAppStore();

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
              <CardTitle className="text-sm flex items-center gap-2">
                <Sun className="h-4 w-4 text-amber-400" />
                UI Theme Preference
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-xs">
              <p className="text-muted-foreground">Select dark or light mode interface palette.</p>
              <Button variant="outline" className="w-full" onClick={toggleTheme}>
                Current Mode: <span className="font-bold text-foreground uppercase ml-1">{theme}</span> (Click to Switch)
              </Button>
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
