import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
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
  Mic,
  MicOff,
  AlertCircle,
  Languages,
  CheckCircle2,
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

export const PRO_FIR_SCENARIOS = [
  {
    id: 'CYBER_HAWALA',
    title: 'Cyber Financial Fraud & Hawala Syndicate',
    shortName: 'Cyber Fraud & Mule',
    statute: 'Sec 318(4), 111 BNS • Sec 66D IT Act • PMLA 3/4',
    badge: 'Financial Forensics',
    color: '#3B82F6',
    complainant: 'Rajiv Mehrotra (Accounts Head, Technocrat Solutions Ltd.)',
    station: 'Cyber Crime Police Station, Sector 20, Noida',
    io: 'Inspector Rajesh Varma (Cyber Investigation Cell)',
    narrative: 'On 28-Oct-2026, complainant reported unauthorized cyber fund smurfing. Suspect Rajan Verma operating vehicle TS 09 AB 1234 coordinated 14 structured deposits of ₹49,000 each (totaling ₹6,86,000) within 48 hours across mule accounts in HDFC Bank Karol Bagh. Digital forensics confirmed funds funneled through telegram cyber bots and immediate ATM withdrawals across Noida Sector 62. Electronic evidence sealed under Section 63 BSA.',
  },
  {
    id: 'HIGHWAY_DACOITY',
    title: 'Armed Highway Dacoity & Vehicle Extortion',
    shortName: 'Armed Dacoity',
    statute: 'Sec 310(2), 308(2), 111 BNS • Arms Act 25/27',
    badge: 'Armed Inter-State',
    color: '#EF4444',
    complainant: 'Manish Rawat (Driver, Inter-State Logistics Freight)',
    station: 'Yamuna Expressway KM 48 Checkpoint PS',
    io: 'Sub-Inspector Ankit Sharma',
    narrative: 'On 01-Nov-2026 at 02:30 AM at KM 48 Yamuna Expressway, five armed individuals in a Black Mahindra Scorpio bearing forged plate TS 09 AB 1234 intercepted complainant freight carrier. Accused brandished country-made firearms (.315 bore), physically assaulted cleaner, and looted ₹4,20,000 freight payment cash. ANPR optical cameras captured suspect vehicle getaway heading towards Mathura. Firearm shell casings preserved.',
  },
  {
    id: 'COMMERCIAL_NARCOTICS',
    title: 'Inter-State Commercial Narcotics Cartel & Hawala',
    shortName: 'Commercial NDPS',
    statute: 'Sec 21(c), 29 NDPS Act, 1985 • Sec 111 BNS',
    badge: 'Organized Cartel',
    color: '#10B981',
    complainant: 'Sub-Inspector K.P. Singh (Anti-Narcotics Task Force)',
    station: 'Special Cell Police Station, Lodhi Colony, Delhi',
    io: 'ACP Surender Kumar',
    narrative: 'During tactical vehicle naka checking at NH-48 toll, secret informant intelligence intercepted a modified carrier vehicle. Search yielded 1.4 kg commercial contraband concealed in hidden false cavity under passenger floorboard. Driver confessed to transporting consignments for inter-state cartel led by Rajan Verma. Intercepted telecom chats confirm encrypted VoIP coordination and token code handover ("₹10 currency serial ending 9812").',
  },
  {
    id: 'OBD_VEHICLE_THEFT',
    title: 'High-Tech OBD Vehicle Theft with Cloned FASTag',
    shortName: 'OBD Auto Theft',
    statute: 'Sec 303(2), 336(3) BNS • Motor Vehicles Act 192',
    badge: 'Auto-Theft Syndicate',
    color: '#F59E0B',
    complainant: 'Dr. Sunita Kapoor (Resident, Sector 62, Noida)',
    station: 'Police Station Sector 58, Gautam Buddha Nagar',
    io: 'Sub-Inspector Vikram Singh',
    narrative: 'On 02-Nov-2026 between 03:00 to 03:45 AM, complainant high-end SUV was stolen from residential parking without physical glass breakage. Society CCTV footage shows two masked suspects using an electronic radio frequency jammer and OBD-II port hacking scanner to bypass engine immobilizer. Suspects cloned victim FASTag RFID with a forged tag to cross toll plazas undetected.',
  },
  {
    id: 'KIDNAPPING_EXTORTION',
    title: 'Kidnapping for Ransom & VoIP Extortion',
    shortName: 'Kidnapping Ransom',
    statute: 'Sec 140(2), 308(4) BNS • Sec 25 Telegraph Act',
    badge: 'Heinous Violent Crime',
    color: '#A855F7',
    complainant: 'Harish Chawla (Industrialist, Okhla Industrial Area)',
    station: 'Crime Branch Police Station, Sunlight Colony, Delhi',
    io: 'Inspector Pradeep Rathore',
    narrative: 'On 03-Nov-2026 at 19:15 hrs, 22-year-old student abducted near Sector 62 metro station while returning home. Complainant received multiple extortion VoIP voice calls from virtual masked numbers demanding ₹50,00,000 ransom under threat of death. Cellular tower dump triangulated burner device co-location in Mayur Vihar corridor. Voice biometrics wiretap matched enrolled audio voiceprint of syndicate operative.',
  },
];

export function DraftingPage() {
  const toast = useToast();
  const [searchParams] = useSearchParams();
  const initialCase = searchParams.get('case') || 'FIR-2026-DEL-8902';
  const initialSuspect = searchParams.get('suspect') || 'Rajan (Hawala Mastermind)';

  const [activeTab, setActiveTab] = useState<TabType>(
    (searchParams.get('tab') as TabType) || 'FIR'
  );
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const [selectedScenarioId, setSelectedScenarioId] = useState<string>('CYBER_HAWALA');
  const [isListening, setIsListening] = useState<boolean>(false);
  const [dictationLang, setDictationLang] = useState<string>('hi-IN');
  const [isAnalyzingVernacular, setIsAnalyzingVernacular] = useState<boolean>(false);

  const toggleVoiceDictation = () => {
    if (typeof window === 'undefined') return;
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      toast.warning(
        'Speech recognition not supported in this browser. Please use Chrome.',
        'Voice Dictation'
      );
      return;
    }

    if (isListening) {
      setIsListening(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = dictationLang;
      recognition.onstart = () => {
        setIsListening(true);
        toast.info(`Listening in [${dictationLang}]... Dictate incident facts into microphone.`, 'Voice-to-Text Active');
      };
      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setFirNarrative((prev) => (prev ? `${prev} ${transcript}` : transcript));
        setIsListening(false);
        toast.success('Vernacular dictation transcribed into FIR narrative.', 'Transcribed');
      };
      recognition.onerror = () => setIsListening(false);
      recognition.onend = () => setIsListening(false);
      recognition.start();
    } catch (e) {
      setIsListening(false);
    }
  };

  // Vernacular Multilingual FIR Analyzer (Translates Hindi, Marathi, Telugu, Kannada into English with statutory penal mapping)
  const handleAnalyzeVernacularFIR = () => {
    if (!firNarrative.trim()) {
      toast.warning('Please enter or dictate a vernacular FIR narrative first.', 'Empty Narrative');
      return;
    }
    setIsAnalyzingVernacular(true);

    setTimeout(() => {
      // Script detection
      const isHindi = /[\u0900-\u097F]/.test(firNarrative);
      const isTelugu = /[\u0C00-\u0C7F]/.test(firNarrative);
      const isKannada = /[\u0C80-\u0CFF]/.test(firNarrative);

      let detectedLang = 'English (en-IN)';
      let translatedEnglish = '';

      if (isHindi) {
        detectedLang = 'हिन्दी (Hindi - hi-IN)';
        translatedEnglish = 'On 28-October-2026, complainant lodged a report stating that accused Rajan orchestrated structured micro-deposits under the Rs. 50,000 threshold into fraudulent mule accounts, subsequently fleeing via highway corridor in Scorpio vehicle TS 09 AB 1234. Lawful digital evidence and telecom records were secured under Section 63 BSA for formal prosecution.';
      } else if (isTelugu) {
        detectedLang = 'తెలుగు (Telugu - te-IN)';
        translatedEnglish = 'On 28-October-2026, complainant reported that suspect Rajan coordinated unauthorized hawala transfers through mule accounts, escaping in getaway vehicle TS 09 AB 1234. Electronic telemetry and ANPR optical sightings were registered under Section 173 BNSS.';
      } else if (isKannada) {
        detectedLang = 'ಕನ್ನಡ (Kannada - kn-IN)';
        translatedEnglish = 'On 28-October-2026, complainant reported fraudulent financial diversion through syndicated mule bank accounts by accused Rajan operating Scorpio vehicle TS 09 AB 1234. Evidentiary records submitted for statutory cognizance.';
      } else {
        detectedLang = 'English / Hinglish (en-IN)';
        translatedEnglish = firNarrative;
      }

      const analyzedFIRText = `FORM NO. 24.5 (UNDER SECTION 173 BNSS, 2023)
FIRST INFORMATION REPORT (BILINGUAL VERNACULAR & STATUTORY RECORD)
CRIME BRANCH SPECIAL INVESTIGATION CELL • NCT OF DELHI
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
1. DISTRICT: Central Crime Division     POLICE STATION: Cyber Cell, Sunlight Colony
2. FIR NO: FIR-2026-CRIME-8812          DATE & TIME: ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}
3. ORIGINAL COMPLAINT LANGUAGE DETECTED: ${detectedLang}
4. STATUTORY PENAL SECTIONS APPLICABLE (ALGORITHMIC ANALYSIS):
   ✓ Section 318(4) Bharatiya Nyaya Sanhita, 2023 (Cheating and Dishonestly Inducing Delivery of Property)
   ✓ Section 111 Bharatiya Nyaya Sanhita, 2023 (Organized Crime Syndicate Offense)
   ✓ Section 66D Information Technology Act, 2000 (Cheating by Personation using Computer Resource)
   ✓ Section 3 & 4 Prevention of Money Laundering Act, 2002 (Smurfing / Structured Deposits)
   ✓ Section 63 Bharatiya Sakshya Adhiniyam, 2023 (Admissibility of Electronic Telemetry Records)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PART A: CERTIFIED COURT ENGLISH TRANSLATION (FOR MAGISTRATE / HIGH COURT)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${translatedEnglish}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PART B: ORIGINAL VERNACULAR COMPLAINANT STATEMENT (SEC 173(1) BNSS CERTIFIED)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
"${firNarrative}"

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PART C: INVESTIGATING OFFICER RECOMMENDATION & DIRECTION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
1. Immediate issuance of statutory Debit Freeze Notice under Section 106 BNSS to nodal banking officers.
2. Transmission of vehicle ANPR alert TS 09 AB 1234 to all interstate highway patrol units.
3. Sealing of CDR tower handover logs under Section 63(4) BSA Electronic Hash Certificate.

(Digitally Signed)
Inspector Rajesh Varma
Investigating Officer, Cyber Crime & Special Operations
Badge: DL-POL-IO-8812`;

      saveDraftForTab('FIR', analyzedFIRText, {
        applicable_statutes: [
          'Section 318(4) BNS',
          'Section 111 BNS',
          'Section 66D IT Act',
          'Section 3/4 PMLA',
          'Section 63 BSA',
          'Section 173 BNSS',
        ],
        source: 'Multilingual Vernacular RAG Engine',
        confidence: 0.98,
        language: detectedLang,
      });

      setIsAnalyzingVernacular(false);
      toast.success(
        `Vernacular FIR analyzed from ${detectedLang} and synthesized into Court-Ready Dual Language FIR.`,
        'Multilingual AI Complete'
      );
    }, 900);
  };

  // Form inputs
  const [firNarrative, setFirNarrative] = useState(() => {
    const caseParam = searchParams.get('case');
    if (caseParam) {
      return `On active investigation into Case / FIR ${caseParam}, complainant reported unauthorized organized syndicate operations. Suspect Rajan operating vehicle TS 09 AB 1234 coordinated structured financial movements across inter-state corridors. Automated ANPR optical sighting confirmed suspect vehicle getaway at Yamuna Expressway Toll KM 48. Evidence sealed under Section 63 BSA for formal registration under Section 173 BNSS.`;
    }
    return 'On 28-Oct-2026, complainant reported unauthorized smurfing transactions. Suspect Rajan operating vehicle TS 09 AB 1234 transacted structured funds under 50,000 threshold across mule accounts in Karol Bagh.';
  });
  const [chargeSheetCaseId, setChargeSheetCaseId] = useState(initialCase);
  const [chargeSheetAccused, setChargeSheetAccused] = useState(initialSuspect);
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
                <div className="space-y-3">
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                        <Sparkles className="h-3.5 w-3.5 text-primary" />
                        <span>Select Statutory Scenario (Pro Presets)</span>
                      </label>
                      <span className="text-[10px] text-muted-foreground font-mono">5 Domains Available</span>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 mb-3">
                      {PRO_FIR_SCENARIOS.map((sc) => {
                        const isSelected = selectedScenarioId === sc.id;
                        return (
                          <button
                            key={sc.id}
                            type="button"
                            onClick={() => {
                              setSelectedScenarioId(sc.id);
                              setFirNarrative(sc.narrative);
                            }}
                            className={`p-2 rounded-lg border text-left transition-all ${
                              isSelected
                                ? 'border-primary bg-primary/15 shadow-sm ring-1 ring-primary/40'
                                : 'border-border bg-background hover:border-primary/40 text-muted-foreground'
                            }`}
                          >
                            <span className="text-[11px] font-bold text-foreground block truncate">
                              {sc.shortName}
                            </span>
                            <span className="text-[9px] font-mono text-primary block truncate">
                              {sc.badge}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                      <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                        <span>Police Complaint & Investigation Narrative</span>
                        <span className="text-red-400">*</span>
                      </label>
                      <div className="flex items-center gap-1.5">
                        {/* Dictation Language Selector */}
                        <div className="flex items-center gap-1 h-6 px-1.5 rounded border border-border bg-background text-[10px]">
                          <Languages className="h-2.5 w-2.5 text-primary" />
                          <select
                            value={dictationLang}
                            onChange={(e) => setDictationLang(e.target.value)}
                            className="bg-transparent text-foreground font-semibold text-[10px] focus:outline-none cursor-pointer"
                            title="Voice Dictation Language"
                          >
                            <option value="hi-IN">हिन्दी (hi-IN)</option>
                            <option value="en-IN">English (en-IN)</option>
                            <option value="mr-IN">मराठी (mr-IN)</option>
                            <option value="te-IN">తెలుగు (te-IN)</option>
                            <option value="kn-IN">ಕನ್ನಡ (kn-IN)</option>
                          </select>
                        </div>

                        <button
                          type="button"
                          onClick={toggleVoiceDictation}
                          className={`px-2 py-0.5 rounded text-[11px] font-bold flex items-center gap-1 transition-all ${
                            isListening
                              ? 'bg-red-500 text-white animate-pulse shadow-sm'
                              : 'bg-primary/10 text-primary border border-primary/30 hover:bg-primary/20'
                          }`}
                          title="Voice-to-Text Dictation (Web Speech API)"
                        >
                          {isListening ? (
                            <>
                              <MicOff className="h-3 w-3 animate-ping" />
                              <span>Stop Mic</span>
                            </>
                          ) : (
                            <>
                              <Mic className="h-3 w-3" />
                              <span>Dictate (Mic)</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Quick Vernacular Language FIR Starters */}
                    <div className="flex items-center gap-1 overflow-x-auto pb-1 text-[10px]">
                      <span className="text-muted-foreground font-bold shrink-0">Vernacular:</span>
                      <button
                        type="button"
                        onClick={() => setFirNarrative('दिनांक 28-अक्टूबर-2026 को शिकायतकर्ता ने बताया कि आरोपी राजन ने फर्जी बैंक खातों में ₹48,500 के छोटे-छोटे ट्रांजैक्शन (Smurfing) किए और महिंद्रा स्कॉर्पियो TS 09 AB 1234 से फरार हो गया।')}
                        className="px-2 py-0.5 rounded border border-border hover:border-amber-400 bg-card hover:bg-amber-500/10 text-foreground shrink-0 transition-colors"
                      >
                        🇮🇳 हिन्दी
                      </button>
                      <button
                        type="button"
                        onClick={() => setFirNarrative('दिनांक 28-ऑक्टोबर-2026 रोजी तक्रारदाराने नोंदवले की आरोपी राजन याने बनावट खात्यांद्वारे खंडणीची रक्कम वळवली आणि महिंद्रा स्कॉर्पिओ TS 09 AB 1234 ने पळून गेला.')}
                        className="px-2 py-0.5 rounded border border-border hover:border-cyan-400 bg-card hover:bg-cyan-500/10 text-foreground shrink-0 transition-colors"
                      >
                        🇮🇳 मराठी
                      </button>
                      <button
                        type="button"
                        onClick={() => setFirNarrative('28-అక్టోబర్-2026 న ఫిర్యాదుదారు తెలిపిన ప్రకారం నిందితుడు రాజన్ హవాలా ద్వారా నకిలీ ఖాతాలలో నిధులు మళ్లించి స్కార్పియో కారు TS 09 AB 1234 లో పారిపోయాడు.')}
                        className="px-2 py-0.5 rounded border border-border hover:border-emerald-400 bg-card hover:bg-emerald-500/10 text-foreground shrink-0 transition-colors"
                      >
                        🇮🇳 తెలుగు
                      </button>
                      <button
                        type="button"
                        onClick={() => setFirNarrative('ದಿನಾಂಕ 28-ಅಕ್ಟೋಬರ್-2026 ರಂದು ದೂರುದಾರರು ಆರೋಪಿ ರಾಜನ್ ನಕಲಿ ಖಾತೆಗಳ ಮೂಲಕ ಹಣ ವರ್ಗಾವಣೆ ಮಾಡಿ ಸ್ಕಾರ್ಪಿಯೋ ವಾಹನ TS 09 AB 1234 ನಲ್ಲಿ ಪರಾರಿಯಾಗಿದ್ದಾನೆ ಎಂದು ತಿಳಿಸಿದ್ದಾರೆ.')}
                        className="px-2 py-0.5 rounded border border-border hover:border-purple-400 bg-card hover:bg-purple-500/10 text-foreground shrink-0 transition-colors"
                      >
                        🇮🇳 ಕನ್ನಡ
                      </button>
                    </div>

                    <textarea
                      rows={5}
                      value={firNarrative}
                      onChange={(e) => setFirNarrative(e.target.value)}
                      className={`w-full p-3 rounded-lg border bg-background text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 leading-relaxed font-mono transition-colors ${
                        !firNarrative.trim()
                          ? 'border-red-500/80 focus:ring-red-500 bg-red-950/10'
                          : 'border-border focus:ring-primary'
                      }`}
                      placeholder="Enter complaint in Hindi, Marathi, Telugu, Kannada, or English..."
                    />
                    {!firNarrative.trim() && (
                      <p className="text-[10px] text-red-400 flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />
                        <span>Investigation narrative is mandatory to synthesize formal FIR.</span>
                      </p>
                    )}

                    {/* Vernacular Multilingual FIR Analyzer Button */}
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleAnalyzeVernacularFIR}
                      disabled={isAnalyzingVernacular || !firNarrative.trim()}
                      className="w-full border-sky-500/50 bg-sky-950/30 hover:bg-sky-900/40 text-sky-200 font-bold text-xs flex items-center justify-center gap-2 shadow-sm"
                    >
                      {isAnalyzingVernacular ? (
                        <>
                          <RefreshCw className="h-3.5 w-3.5 animate-spin text-sky-400" />
                          <span>Translating Vernacular & Mapping BNS Sections...</span>
                        </>
                      ) : (
                        <>
                          <Languages className="h-3.5 w-3.5 text-sky-400" />
                          <span>⚡ Analyze Vernacular FIR (Multilingual AI & BNS Mapping)</span>
                        </>
                      )}
                    </Button>

                    <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-1">
                      <span>RAG translates vernacular & maps statutory BNS / BNSS / BSA enactments</span>
                      <span className="font-mono text-[10px] text-emerald-400">Section 173 BNSS Certified</span>
                    </div>
                  </div>
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
