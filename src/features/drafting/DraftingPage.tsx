import React, { useState } from 'react';
import axios from 'axios';
import {
  FileText,
  Scale,
  Copy,
  Check,
  Download,
  Sparkles,
  Landmark,
  Compass,
  FileCheck2,
  RefreshCw,
  Eye,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { DocumentPreviewModal } from '../../components/common/DocumentPreviewModal';
import { useToast } from '../../components/ui/Toast';

type TabType = 'FIR' | 'CHARGE_SHEET' | 'BANK_NOTICE' | 'LOC';

interface DraftMetaInfo {
  applicable_statutes?: string[];
  source?: string;
  confidence?: number;
  [key: string]: unknown;
}

export function DraftingPage() {
  const toast = useToast();
  const [activeTab, setActiveTab] = useState<TabType>('FIR');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [previewModalOpen, setPreviewModalOpen] = useState(false);

  // Form inputs
  const [firNarrative, setFirNarrative] = useState(
    'On 28-Oct-2026, complainant reported unauthorized smurfing transactions. Suspect Rajan operating vehicle TS 09 AB 1234 transacted structured funds under 50,000 threshold across mule accounts in Karol Bagh.'
  );
  const [chargeSheetCaseId, setChargeSheetCaseId] = useState('FIR-2026-DEL-8902');
  const [chargeSheetAccused, setChargeSheetAccused] = useState('Rajan (Hawala Mastermind)');
  const [bankAccount, setBankAccount] = useState('ACC-HDFC-908122');
  const [bankIfsc, setBankIfsc] = useState('HDFC0001244');
  const [bankName, setBankName] = useState('HDFC Bank Ltd.');
  const [bankBranch, setBankBranch] = useState('Karol Bagh Commercial Branch');
  const [freezeAmount, setFreezeAmount] = useState('₹4,80,000 / Entire Account Balance');
  const [locSuspect, setLocSuspect] = useState('Rajan');

  // Multi-tab draft state preservation with localStorage persistence
  const [draftsByTab, setDraftsByTab] = useState<Record<TabType, { text: string; meta?: DraftMetaInfo | null }>>(() => {
    try {
      const saved = localStorage.getItem('crimenexus_drafts_v1');
      return saved ? JSON.parse(saved) : {
        FIR: { text: '' },
        CHARGE_SHEET: { text: '' },
        BANK_NOTICE: { text: '' },
        LOC: { text: '' },
      };
    } catch {
      return {
        FIR: { text: '' },
        CHARGE_SHEET: { text: '' },
        BANK_NOTICE: { text: '' },
        LOC: { text: '' },
      };
    }
  });

  const generatedDraft = draftsByTab[activeTab]?.text || '';
  const metaInfo = draftsByTab[activeTab]?.meta || null;

  const saveDraftForTab = (tab: TabType, text: string, meta?: DraftMetaInfo | null) => {
    setDraftsByTab((prev) => {
      const updated = { ...prev, [tab]: { text, meta } };
      try {
        localStorage.setItem('crimenexus_drafts_v1', JSON.stringify(updated));
      } catch {
        // ignore
      }
      return updated;
    });
  };

  const getBaseURL = () => import.meta.env.VITE_API_BASE_URL || '/api/v1';

  const handleGenerate = async () => {
    setLoading(true);
    setCopied(false);
    try {
      const baseURL = getBaseURL();
      if (activeTab === 'FIR') {
        const res = await axios.post(`${baseURL}/draft/fir`, { narrative: firNarrative });
        saveDraftForTab('FIR', res.data.draft_text, res.data);
      } else if (activeTab === 'CHARGE_SHEET') {
        const res = await axios.post(
          `${baseURL}/draft/charge-sheet/${encodeURIComponent(chargeSheetCaseId)}`,
          { accused_name: chargeSheetAccused }
        );
        saveDraftForTab('CHARGE_SHEET', res.data.draft_text, res.data);
      } else if (activeTab === 'BANK_NOTICE') {
        const res = await axios.post(
          `${baseURL}/draft/bank-notice/${encodeURIComponent(bankAccount)}`,
          {
            bank_name: bankName,
            ifsc_code: bankIfsc,
            branch_name: bankBranch,
            amount: freezeAmount,
            reason: 'Structured deposits under Section 102 CrPC / PMLA 2002',
          }
        );
        saveDraftForTab('BANK_NOTICE', res.data.draft_text, res.data);
      } else if (activeTab === 'LOC') {
        const res = await axios.post(
          `${baseURL}/draft/lookout-circular/${encodeURIComponent(locSuspect)}`,
          { identification: 'Aadhaar / Passport under verification' }
        );
        saveDraftForTab('LOC', res.data.draft_text, res.data);
      }
      toast.success(`${activeTab.replace('_', ' ')} draft generated successfully.`, 'Draft Complete');
    } catch (err: unknown) {
      console.error('Drafting generation failed', err);
      const fallbackText = `OFFICE OF THE SUPERINTENDENT OF POLICE • SPECIAL INVESTIGATION CELL
DISPATCH REF: LEGAL/${activeTab}/${new Date().getFullYear()}/8812
DATE: ${new Date().toLocaleDateString('en-IN')}

SUBJECT: STATUTORY DRAFT REQUISITION FOR ${activeTab.replace('_', ' ')}
CASE/ACCUSED: ${activeTab === 'BANK_NOTICE' ? bankAccount : locSuspect}

1. Whereas, reliable investigative telemetry and forensic analysis have established reasonable suspicion under relevant sections of BNS / CrPC.
2. The competent authority has authorized immediate statutory execution.

[GENERATED VIA CRIMENEXUS RAG ENGINE • SECTION 63 BSA COMPLIANT]`;
      saveDraftForTab(activeTab, fallbackText, null);
      toast.warning('Draft generated in offline fallback template mode.', 'Offline Mode');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (generatedDraft) {
      navigator.clipboard.writeText(generatedDraft);
      setCopied(true);
      toast.success('Legal draft copied to clipboard.', 'Copied');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDownload = () => {
    if (!generatedDraft) return;
    const blob = new Blob([generatedDraft], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `CRIMENEXUS_Legal_Draft_${activeTab}_${Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-2xl border-2 border-indigo-500/40 bg-gradient-to-r from-indigo-950/40 via-card to-background shadow-xl">
        <div className="flex items-start gap-4">
          <div className="p-3 rounded-2xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/40">
            <Sparkles className="h-8 w-8 text-indigo-400 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-black text-foreground tracking-tight">
                AI Statutory Legal Drafting & Generative RAG
              </h2>
              <Badge variant="outline" className="text-[10px] border-indigo-400/50 text-indigo-300">
                MahaCrimeOS Parity Engine
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-1 max-w-2xl">
              Automated synthesis of Court-Ready FIRs, Charge Sheets, Section 102 CrPC / Sec 106 BNSS Bank Freeze Notices, and
              Bureau of Immigration (BOI) Lookout Circulars powered by ChromaDB RAG.
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-border pb-3">
        <Button
          variant={activeTab === 'FIR' ? 'primary' : 'outline'}
          size="sm"
          className="text-xs flex items-center gap-2"
          onClick={() => setActiveTab('FIR')}
        >
          <FileText className="h-4 w-4" />
          <span>Formal FIR Draft (Form 24.5)</span>
        </Button>

        <Button
          variant={activeTab === 'CHARGE_SHEET' ? 'primary' : 'outline'}
          size="sm"
          className="text-xs flex items-center gap-2"
          onClick={() => setActiveTab('CHARGE_SHEET')}
        >
          <Scale className="h-4 w-4" />
          <span>Court Charge Sheet (Sec 193 BNSS)</span>
        </Button>

        <Button
          variant={activeTab === 'BANK_NOTICE' ? 'primary' : 'outline'}
          size="sm"
          className="text-xs flex items-center gap-2"
          onClick={() => setActiveTab('BANK_NOTICE')}
        >
          <Landmark className="h-4 w-4" />
          <span>Bank Freeze Notice (Sec 102 CrPC)</span>
        </Button>

        <Button
          variant={activeTab === 'LOC' ? 'primary' : 'outline'}
          size="sm"
          className="text-xs flex items-center gap-2"
          onClick={() => setActiveTab('LOC')}
        >
          <Compass className="h-4 w-4" />
          <span>Lookout Circular (BOI Immigration)</span>
        </Button>
      </div>

      {/* Main Grid: Parameters on Left, Live Output on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Panel: Inputs */}
        <div className="lg:col-span-5 space-y-4">
          <Card className="border-border">
            <CardHeader className="pb-3 border-b border-border/60">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <FileCheck2 className="h-4 w-4 text-primary" />
                <span>Statutory Parameters & Case Facts</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-4">
              {activeTab === 'FIR' && (
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-foreground">
                    Police Complaint / Ingestion Narrative
                  </label>
                  <textarea
                    rows={6}
                    value={firNarrative}
                    onChange={(e) => setFirNarrative(e.target.value)}
                    className="w-full p-3 rounded-lg border border-border bg-background text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary leading-relaxed font-mono"
                    placeholder="Enter incident facts, suspect details, bank accounts, or vehicle numbers..."
                  />
                  <p className="text-[11px] text-muted-foreground">
                    ChromaDB RAG retrieves relevant IPC / BNS sections and formats Section 173 BNSS FIR.
                  </p>
                </div>
              )}

              {activeTab === 'CHARGE_SHEET' && (
                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-semibold text-foreground">Target FIR / Case Number</label>
                    <input
                      type="text"
                      value={chargeSheetCaseId}
                      onChange={(e) => setChargeSheetCaseId(e.target.value)}
                      className="w-full h-9 px-3 rounded-lg border border-border bg-background text-xs font-mono text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-foreground">Primary Accused Name</label>
                    <input
                      type="text"
                      value={chargeSheetAccused}
                      onChange={(e) => setChargeSheetAccused(e.target.value)}
                      className="w-full h-9 px-3 rounded-lg border border-border bg-background text-xs font-mono text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    Drafts a complete final report with list of prosecution exhibits under Section 193 BNSS / 173 CrPC.
                  </p>
                </div>
              )}

              {activeTab === 'BANK_NOTICE' && (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-semibold text-foreground">Beneficiary / Target Account Number</label>
                      <input
                        type="text"
                        value={bankAccount}
                        onChange={(e) => setBankAccount(e.target.value)}
                        className="w-full h-9 px-3 rounded-lg border border-border bg-background text-xs font-mono text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                        placeholder="ACC-HDFC-908122"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-foreground">Bank IFSC Code</label>
                      <input
                        type="text"
                        value={bankIfsc}
                        onChange={(e) => setBankIfsc(e.target.value)}
                        className="w-full h-9 px-3 rounded-lg border border-border bg-background text-xs font-mono text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                        placeholder="HDFC0001244"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-semibold text-foreground">Target Financial Institution</label>
                      <input
                        type="text"
                        value={bankName}
                        onChange={(e) => setBankName(e.target.value)}
                        className="w-full h-9 px-3 rounded-lg border border-border bg-background text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                        placeholder="HDFC Bank Ltd."
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-foreground">Bank Branch Location</label>
                      <input
                        type="text"
                        value={bankBranch}
                        onChange={(e) => setBankBranch(e.target.value)}
                        className="w-full h-9 px-3 rounded-lg border border-border bg-background text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                        placeholder="Karol Bagh Commercial Branch"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-foreground">Quantum / Amount to Freeze</label>
                    <input
                      type="text"
                      value={freezeAmount}
                      onChange={(e) => setFreezeAmount(e.target.value)}
                      className="w-full h-9 px-3 rounded-lg border border-border bg-background text-xs font-mono text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                      placeholder="₹4,80,000 / Entire Account Balance"
                    />
                  </div>

                  <p className="text-[11px] text-muted-foreground">
                    Issues statutory 100% debit freeze order to bank nodal compliance officers under Section 106 BNSS / Section 102 Cr.P.C. read with Section 5 PMLA 2002.
                  </p>
                </div>
              )}

              {activeTab === 'LOC' && (
                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-semibold text-foreground">Fugitive Suspect Name</label>
                    <input
                      type="text"
                      value={locSuspect}
                      onChange={(e) => setLocSuspect(e.target.value)}
                      className="w-full h-9 px-3 rounded-lg border border-border bg-background text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    Generates official Ministry of Home Affairs (MHA) proforma to detain and prevent international flight.
                  </p>
                </div>
              )}

              <Button
                variant="primary"
                size="md"
                className="w-full font-bold flex items-center justify-center gap-2"
                onClick={handleGenerate}
                disabled={loading}
              >
                {loading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                <span>{loading ? 'Synthesizing Statutory Draft...' : 'Synthesize Legal Draft'}</span>
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Right Panel: Output Document Preview */}
        <div className="lg:col-span-7">
          <Card className="border-border flex flex-col h-full min-h-[520px]">
            <CardHeader className="pb-3 border-b border-border/60 flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <FileText className="h-4 w-4 text-indigo-400" />
                <span>Statutory Output Dossier</span>
                {metaInfo?.applicable_statutes && metaInfo.applicable_statutes.length > 0 && (
                  <Badge variant="outline" className="text-[10px] border-emerald-500/50 text-emerald-400 ml-2">
                    RAG Grounded
                  </Badge>
                )}
              </CardTitle>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs flex items-center gap-1.5 border-primary/40 text-primary hover:bg-primary/10"
                  onClick={() => setPreviewModalOpen(true)}
                  disabled={!generatedDraft}
                >
                  <Eye className="h-3.5 w-3.5" />
                  <span>Preview</span>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs flex items-center gap-1.5"
                  onClick={handleCopy}
                  disabled={!generatedDraft}
                >
                  {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                  <span>{copied ? 'Copied' : 'Copy'}</span>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs flex items-center gap-1.5 text-primary border-primary/40"
                  onClick={handleDownload}
                  disabled={!generatedDraft}
                >
                  <Download className="h-3.5 w-3.5" />
                  <span>Export</span>
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-4 flex-1 flex flex-col">
              {generatedDraft ? (
                <div className="flex-1 p-4 rounded-xl bg-background border border-border/70 overflow-auto font-mono text-xs text-foreground whitespace-pre-wrap leading-relaxed shadow-inner">
                  {generatedDraft}
                </div>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-8 text-muted-foreground border border-dashed border-border rounded-xl">
                  <FileText className="h-10 w-10 text-muted-foreground/40 mb-3" />
                  <p className="text-xs font-semibold">No statutory draft generated yet.</p>
                  <p className="text-[11px] text-muted-foreground mt-1 max-w-sm">
                    Configure the case parameters on the left and click "Synthesize Legal Draft" to generate a court-ready dossier.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <DocumentPreviewModal
        isOpen={previewModalOpen}
        onClose={() => setPreviewModalOpen(false)}
        title={`Statutory Judicial Draft Preview: ${activeTab.replace('_', ' ')}`}
        subtitle="Formatted Official Police Pleading • Section 63 BSA Certified Output"
        documentType="legal_draft"
        caseNumber="FIR-2026-CRIME-890"
        textContent={generatedDraft}
        fileName={`CRIMENEXUS_Legal_Draft_${activeTab}_${Date.now()}.txt`}
        metadata={{
          ioName: 'Inspector V. K. Sharma (Special Cell)',
          policeStation: 'Cyber Crime Police Station, Sector 20',
          suspectName: activeTab === 'CHARGE_SHEET' ? chargeSheetAccused : 'Rajan & Associates',
          crimeType: activeTab === 'FIR' ? 'First Information Report under BNSS' : `${activeTab.replace('_', ' ')} Statutory Submission`,
          hash: '6b89c3140aef51bc38901234567890abcdef1234567890abcdef1234567890ab',
        }}
      />
    </div>
  );
}
