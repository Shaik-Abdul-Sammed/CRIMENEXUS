import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldAlert, ArrowRight, Lock, CheckCircle2 } from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import { UserRole } from '../../types';
import { Button } from '../../components/ui/Button';

export function LoginPage() {
  const { loginAsRole } = useAuthStore();
  const navigate = useNavigate();

  const handleRoleSelect = async (role: UserRole) => {
    await loginAsRole(role);
    navigate('/dashboard');
  };

  const roleOptions: { role: UserRole; title: string; desc: string; badge: string }[] = [
    {
      role: 'INVESTIGATOR',
      title: 'Field Investigator',
      desc: 'Case management, evidence processing, network graph exploration, and field timelines.',
      badge: 'Level 1 Clearance',
    },
    {
      role: 'ANALYST',
      title: 'Intelligence Analyst',
      desc: 'Entity resolution review, AI pattern discovery, spatial telemetry, and intelligence reports.',
      badge: 'Level 2 Clearance',
    },
    {
      role: 'SUPERVISOR',
      title: 'Investigation Supervisor',
      desc: 'Case sign-off, report generation, team assignment, and audit oversight.',
      badge: 'Level 3 Clearance',
    },
    {
      role: 'ADMIN',
      title: 'System Administrator',
      desc: 'System settings, security audit logs, access management, and infrastructure monitoring.',
      badge: 'Full Root Clearance',
    },
  ];

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-6 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <div className="w-full max-w-4xl grid md:grid-cols-2 gap-8 items-center">
        {/* Left Branding & Guarantees */}
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/20 text-primary border border-primary/40 shadow-lg">
              <ShieldAlert className="h-7 w-7 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold tracking-tight text-white flex items-center gap-2">
                CRIMENEXUS
                <span className="text-xs px-2 py-0.5 rounded bg-primary text-primary-foreground font-mono">
                  v2.4
                </span>
              </h1>
              <p className="text-xs text-slate-400">AI Criminal Network Intelligence Platform</p>
            </div>
          </div>

          <div className="space-y-3 border-l-2 border-primary/40 pl-4 py-1">
            <h2 className="text-lg font-bold text-slate-100">Multi-Source Criminal Relationship Discovery</h2>
            <p className="text-xs text-slate-400 leading-relaxed">
              Autonomous relationship extraction, Cytoscape network graph visualization, MapLibre spatial telemetry, and local RAG-assisted investigation discovery.
            </p>
          </div>

          <div className="space-y-2 text-xs text-slate-300">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
              <span>Strict human-in-the-loop oversight (Assistance only, no autonomous guilt assignment)</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
              <span>Comprehensive immutable audit logging & RBAC permissions</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
              <span>Synthetic intelligence test environment</span>
            </div>
          </div>
        </div>

        {/* Right Role Select Cards */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-6 shadow-2xl backdrop-blur-xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2 text-slate-200 font-bold text-sm">
              <Lock className="h-4 w-4 text-primary" />
              <span>Select Access Persona (1-Click Authentication)</span>
            </div>
            <span className="text-[10px] font-mono text-slate-400 bg-slate-800 px-2 py-0.5 rounded">
              DEMO AUTH
            </span>
          </div>

          <div className="space-y-3">
            {roleOptions.map((opt) => (
              <div
                key={opt.role}
                onClick={() => handleRoleSelect(opt.role)}
                className="group relative flex items-center justify-between p-3.5 rounded-xl border border-slate-800 bg-slate-950/60 hover:border-primary/50 hover:bg-slate-800/80 cursor-pointer transition-all"
              >
                <div className="space-y-1 min-w-0 pr-3">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm text-slate-100 group-hover:text-primary transition-colors">
                      {opt.title}
                    </span>
                    <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-primary/20 text-primary border border-primary/30">
                      {opt.badge}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-tight line-clamp-2">
                    {opt.desc}
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  className="shrink-0 text-slate-400 group-hover:text-primary group-hover:translate-x-1 transition-all"
                  icon={<ArrowRight className="h-4 w-4" />}
                >
                  Enter
                </Button>
              </div>
            ))}
          </div>

          <div className="pt-2 text-center text-[10px] text-slate-500">
            Law Enforcement & Intelligence Services Division • Restricted Access
          </div>
        </div>
      </div>
    </div>
  );
}
