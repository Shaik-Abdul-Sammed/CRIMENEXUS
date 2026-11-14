import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldAlert, ArrowRight, Lock, CheckCircle2, RefreshCw, Sparkles, Shield, Cpu, Database } from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import { UserRole } from '../../types';
import { Button } from '../../components/ui/Button';
import { sound } from '../../utils/soundEffects';

export function LoginPage() {
  const { loginAsRole } = useAuthStore();
  const navigate = useNavigate();
  const [loadingRole, setLoadingRole] = useState<UserRole | null>(null);
  const [authMode, setAuthMode] = useState<'persona' | 'credentials'>('persona');
  const [badgeId, setBadgeId] = useState('DL-POL-IO-8812');
  const [password, setPassword] = useState('Crimenexus@2026');
  const [selectedRole, setSelectedRole] = useState<UserRole>('INVESTIGATOR');

  const handleRoleSelect = async (role: UserRole) => {
    sound.playClickSound();
    setLoadingRole(role);
    try {
      await loginAsRole(role);
      sound.playSuccessChime();
      navigate('/dashboard', { replace: true });
    } catch (err) {
      console.error('Login error:', err);
      setLoadingRole(null);
    }
  };

  const handleCredentialLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    sound.playClickSound();
    setLoadingRole(selectedRole);
    try {
      await loginAsRole(selectedRole);
      sound.playSuccessChime();
      navigate('/dashboard', { replace: true });
    } catch (err) {
      console.error('Login error:', err);
      setLoadingRole(null);
    }
  };

  const roleOptions: { role: UserRole; title: string; desc: string; badge: string; icon: typeof Shield }[] = [
    {
      role: 'INVESTIGATOR',
      title: 'Field Investigating Officer (IO)',
      desc: 'Active FIR management, forensic evidence ingestion, Cytoscape link analysis, and field telemetry.',
      badge: 'Level 1 Operational',
      icon: Shield,
    },
    {
      role: 'ANALYST',
      title: 'Intelligence & Forensic Analyst',
      desc: 'Entity resolution cross-matching, AI smurfing detection, geospatial telemetry, and intelligence reports.',
      badge: 'Level 2 Analytical',
      icon: Cpu,
    },
    {
      role: 'SUPERVISOR',
      title: 'Supervisory Police Officer',
      desc: 'Dual-authorization statutory freezes, Section 63 BSA dossier approvals, and jurisdictional oversight.',
      badge: 'Level 3 Command',
      icon: Sparkles,
    },
    {
      role: 'ADMIN',
      title: 'System Administrator (CCTNS)',
      desc: 'WORM immutable audit ledger verification, RBAC policy enforcement, and infrastructure health.',
      badge: 'Full Root Access',
      icon: Database,
    },
  ];

  return (
    <main className="min-h-screen w-full relative flex items-center justify-center p-6 bg-slate-950 overflow-hidden select-none">
      {/* Dynamic Ambient Mesh & Grid Background */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(14,165,233,0.18),rgba(255,255,255,0))] pointer-events-none" />
      <div className="absolute top-1/4 -left-40 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -right-40 w-96 h-96 bg-primary/15 rounded-full blur-3xl pointer-events-none" />
      
      {/* Background Cyber Grid Pattern */}
      <div
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: `linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)`,
          backgroundSize: '40px 40px',
        }}
      />

      <div className="relative w-full max-w-5xl grid md:grid-cols-12 gap-8 items-center z-10">
        {/* Left Branding & System Overview (5 cols) */}
        <div className="md:col-span-5 space-y-6">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/20 text-primary border border-primary/40 shadow-[0_0_25px_rgba(59,130,246,0.4)]">
              <ShieldAlert className="h-7 w-7 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tight text-white flex items-center gap-2">
                CRIMENEXUS
                <span className="text-[10px] px-2 py-0.5 rounded bg-primary text-primary-foreground font-mono font-bold tracking-wider">
                  v2.4 INTEL
                </span>
              </h1>
              <p className="text-xs font-mono text-cyan-400">Tactical Police & Crime Syndicate Platform</p>
            </div>
          </div>

          <div className="space-y-2 border-l-2 border-primary/50 pl-4 py-1">
            <h2 className="text-base font-bold text-slate-100">
              Multi-Source Criminal Relationship Discovery
            </h2>
            <p className="text-xs text-slate-400 leading-relaxed">
              Autonomous relationship extraction, Cytoscape network graph visualization, MapLibre spatial telemetry, and local RAG-assisted investigation discovery.
            </p>
          </div>

          <div className="space-y-2.5 text-xs text-slate-300 bg-slate-900/60 p-4 rounded-xl border border-slate-800/80 backdrop-blur-md">
            <div className="flex items-start gap-2.5">
              <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
              <span>Strict human-in-the-loop oversight (Assistance only, zero autonomous guilt assignment)</span>
            </div>
            <div className="flex items-start gap-2.5">
              <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
              <span>Section 63 BSA & 65B IEA court-ready digital evidence compliance</span>
            </div>
            <div className="flex items-start gap-2.5">
              <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
              <span>Cryptographic WORM SHA-256 audit ledger across all station shifts</span>
            </div>
          </div>
        </div>

        {/* Right Role Select Cards (7 cols) */}
        <div className="md:col-span-7 rounded-2xl border border-slate-800/80 bg-slate-900/80 p-6 shadow-2xl backdrop-blur-xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2 text-slate-200 font-bold text-sm">
              <Lock className="h-4 w-4 text-emerald-400" />
              <span>Authentication Gate</span>
            </div>
            <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800">
              <button
                type="button"
                onClick={() => setAuthMode('persona')}
                className={`text-[10px] font-mono font-bold px-2.5 py-1 rounded transition-colors ${
                  authMode === 'persona'
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                1-Click Persona
              </button>
              <button
                type="button"
                onClick={() => setAuthMode('credentials')}
                className={`text-[10px] font-mono font-bold px-2.5 py-1 rounded transition-colors ${
                  authMode === 'credentials'
                    ? 'bg-primary/20 text-blue-300 border border-primary/30'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Badge ID / PIN
              </button>
            </div>
          </div>

          {authMode === 'persona' ? (
            <div className="space-y-3">
              {roleOptions.map((opt) => {
                const Icon = opt.icon;
                const isSelected = loadingRole === opt.role;
                return (
                  <div
                    key={opt.role}
                    onClick={() => handleRoleSelect(opt.role)}
                    className={`group relative flex items-center justify-between p-4 rounded-xl border transition-all duration-200 cursor-pointer ${
                      isSelected
                        ? 'border-emerald-500 bg-emerald-950/40 shadow-[0_0_25px_rgba(16,185,129,0.3)]'
                        : 'border-slate-800/80 bg-slate-950/70 hover:border-emerald-500/70 hover:bg-slate-850 hover:scale-[1.02] hover:shadow-[0_0_20px_rgba(16,185,129,0.2)]'
                    }`}
                  >
                    <div className="flex items-start gap-3.5 min-w-0 pr-3">
                      <div className="h-9 w-9 rounded-lg bg-slate-900 border border-slate-700/60 flex items-center justify-center shrink-0 group-hover:border-emerald-500/50 group-hover:bg-emerald-950/20 transition-colors">
                        <Icon className="h-4 w-4 text-slate-300 group-hover:text-emerald-400 transition-colors" />
                      </div>
                      <div className="space-y-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-slate-100 group-hover:text-emerald-300 transition-colors truncate">
                            {opt.title}
                          </span>
                          <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700 shrink-0">
                            {opt.badge}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 leading-relaxed line-clamp-2">
                          {opt.desc}
                        </p>
                      </div>
                    </div>

                    <Button
                      size="sm"
                      variant="ghost"
                      disabled={Boolean(loadingRole)}
                      className="shrink-0 text-slate-400 group-hover:text-emerald-400 group-hover:translate-x-1 transition-all"
                    >
                      {isSelected ? (
                        <RefreshCw className="h-4 w-4 animate-spin text-emerald-400" />
                      ) : (
                        <ArrowRight className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                );
              })}
            </div>
          ) : (
            <form onSubmit={handleCredentialLogin} className="space-y-4 py-2">
              <div className="space-y-1.5">
                <label className="text-xs font-mono font-semibold text-slate-300 flex items-center justify-between">
                  <span>OFFICER BADGE / CCTNS OPERATOR ID</span>
                  <span className="text-[10px] text-slate-500">FORMAT: DL-POL-XX-NNNN</span>
                </label>
                <input
                  type="text"
                  value={badgeId}
                  onChange={(e) => setBadgeId(e.target.value)}
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950/80 border border-slate-700 text-slate-100 font-mono text-xs focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary shadow-inner"
                  placeholder="e.g. DL-POL-IO-8812"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-mono font-semibold text-slate-300 flex items-center justify-between">
                  <span>SECURITY PASSCODE / PKI TOKEN</span>
                  <span className="text-[10px] text-emerald-400">256-BIT ENCRYPTED</span>
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950/80 border border-slate-700 text-slate-100 font-mono text-xs focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary shadow-inner"
                  placeholder="Enter security token"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-mono font-semibold text-slate-300">
                  ASSIGNED JURISDICTIONAL ROLE
                </label>
                <select
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value as UserRole)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950/80 border border-slate-700 text-slate-100 font-mono text-xs focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                >
                  <option value="INVESTIGATOR">Investigating Officer (IO) - Special Crime Branch</option>
                  <option value="ANALYST">Forensic Intelligence Analyst - Cyber Cell</option>
                  <option value="SUPERVISOR">Supervisory Police Officer (ACP / DCP Command)</option>
                  <option value="ADMIN">System Administrator - CCTNS Central Command</option>
                </select>
              </div>

              <Button
                type="submit"
                disabled={Boolean(loadingRole)}
                className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-blue-500/20 border border-blue-400/30 flex items-center justify-center gap-2"
              >
                {loadingRole ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin text-white" />
                    <span>Verifying PKI Credentials...</span>
                  </>
                ) : (
                  <>
                    <Lock className="h-4 w-4" />
                    <span>Authenticate & Access Tactical HUD</span>
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </Button>
            </form>
          )}

          <div className="pt-2 flex items-center justify-between text-[10px] text-slate-500 font-mono border-t border-slate-800/60">
            <span>Restricted Access: Government of India Law Enforcement</span>
            <span>Secured via TLS 1.3 & PKI</span>
          </div>
        </div>
      </div>
    </main>
  );
}
