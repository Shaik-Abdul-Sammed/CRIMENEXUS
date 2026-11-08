import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldAlert, Compass, ArrowLeft, Home, FileQuestion } from 'lucide-react';
import { Button } from '../../components/ui/Button';

export function NotFoundPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-foreground flex flex-col items-center justify-center p-6 text-center select-none">
      <div className="max-w-md w-full p-8 rounded-2xl border border-slate-800 bg-slate-900/80 shadow-2xl space-y-6">
        <div className="flex flex-col items-center gap-3">
          <div className="p-4 rounded-full bg-primary/10 text-primary border border-primary/20">
            <ShieldAlert className="h-12 w-12 text-primary" />
          </div>
          <div>
            <span className="text-xs font-mono font-bold tracking-widest uppercase px-2.5 py-0.5 rounded bg-primary/20 text-primary border border-primary/30">
              ERROR 404 • JURISDICTION UNCHARTED
            </span>
            <h1 className="text-2xl font-black text-white mt-2">Classified Route Not Found</h1>
            <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
              The intelligence ledger, case dossier, or coordinate you requested does not exist in the active CRIMENEXUS registry.
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-3 justify-center pt-2">
          <Link to="/dashboard" className="w-full sm:w-auto">
            <Button className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-white font-bold flex items-center justify-center gap-2">
              <Home className="h-4 w-4" />
              <span>Return to Dashboard</span>
            </Button>
          </Link>
          <button
            onClick={() => window.history.back()}
            className="w-full sm:w-auto px-4 py-2 rounded-lg border border-border text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-colors flex items-center justify-center gap-1.5"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Go Back</span>
          </button>
        </div>

        <div className="pt-4 border-t border-border/40 text-[10px] text-muted-foreground font-mono">
          System Verification: CRIMENEXUS v2.4 • Court Compliant
        </div>
      </div>
    </div>
  );
}
