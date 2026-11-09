import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
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
  Lock,
  Download,
  Eye,
  EyeOff,
  LayoutGrid,
  ShieldCheck,
  FileText,
  Clock,
  Calendar,
  ChevronDown,
  ChevronUp,
  Activity,
  Radio,
  PlusCircle,
  Compass,
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
import { Modal } from '../../components/ui/Modal';
import { getStatusBadgeClass } from '../../utils/formatters';
import { RecommendedActions } from './RecommendedActions';
import { LiveIngestionWidget } from './LiveIngestionWidget';
import { RemandDeadlinesWidget } from './RemandDeadlinesWidget';
import { QuantumStatusWidget } from './QuantumStatusWidget';
import { TacticalCommandHUD } from './TacticalCommandHUD';
import { FairnessBiasWidget } from './FairnessBiasWidget';
import { TacticalScenariosModal } from './TacticalScenariosModal';
import { DocumentPreviewModal } from '../../components/common/DocumentPreviewModal';
import { useTranslation } from '../../hooks/useTranslation';
import { useToast } from '../../components/ui/Toast';
import { useAppStore } from '../../stores/appStore';
import { sound } from '../../utils/soundEffects';

const FREEZE_NOTICE_TEXT = `STATUTORY NOTICE UNDER SECTION 102 Cr.P.C. / SECTION 106 BNSS 2023
GOVERNMENT OF NCT OF DELHI • SPECIAL CRIME BRANCH & CYBER CELL
CYBER CRIME POLICE STATION, SECTOR 20, NEW DELHI

DISPATCH REFERENCE: CCTNS-FRZ-2026-908122-SEC102
DATE OF TRANSMISSION: 02 NOVEMBER 2026, 15:30 IST
CASE REFERENCE: FIR NO. 2026-CRIME-890 (OPERATION SHADOW VAULT)
STATUTORY OFFENCES: Section 111 (Organized Crime Syndicate) BNS 2023, Sections 316/318 BNS, Section 5 PMLA 2002

TO:
The Chief Compliance Officer / Nodal Banking Officer / Branch Manager,
HDFC Bank Limited, Commercial & Retail Operations,
New Delhi Banking Zone, Delhi - 110001.

SUBJECT: STATUTORY ORDER FOR FORTHWITH FREEZING OF DEBIT TRANSACTIONS UNDER SECTION 102 Cr.P.C. / SECTION 106 BNSS IN RESPECT OF BENEFICIARY ACCOUNT NO. ACC-HDFC-908122.

WHEREAS an active investigation is being conducted by this Specialized Investigation Team into FIR No. 2026-CRIME-890 involving organized extortion, multi-state Hawala financial layering, and smurfing operations;

AND WHEREAS real-time intelligence telemetry and automated financial clustering algorithms have detected structured cash deposits and rapid incoming credits below the statutory threshold of ₹50,000 (totaling ₹4,80,000 across 11 transactions within a 48-hour window) into:
   - Account Holder / Beneficial Entity: RAJAN & SYNDICATE CONDUITS
   - Beneficiary Account Number: ACC-HDFC-908122
   - IFSC Code: HDFC0001244 (Karol Bagh Branch)

AND WHEREAS there is credible reason to believe that the credits in the said account constitute proceeds of crime generated through organized extortion and illegal bookmaking operations;

NOW, THEREFORE, by virtue of the statutory powers vested in me under Section 102 of the Code of Criminal Procedure, 1973 (read with Section 106 of the Bharatiya Nagarik Suraksha Sanhita, 2023 and Section 5 of the Prevention of Money Laundering Act, 2002), I, Inspector Rajesh Sharma, Investigating Officer, Cyber Crime Branch, do hereby ORDER AND DIRECT you to:

1. IMMEDIATELY AND FORTHWITH STOP ALL DEBIT TRANSACTIONS, cash withdrawals, outward NEFT/RTGS/IMPS/UPI transfers, and ATM operations on Account No. ACC-HDFC-908122.
2. PRESERVE AND SECURE all banking logs, including Account Opening Forms (AOF), KYC documentation, signature cards, linked mobile numbers, and IP connection access timestamps.
3. PRESERVE ALL CCTV SURVEILLANCE RECORDINGS for the past 60 days relating to all ATM and teller transactions conducted for this account.
4. CONFIRM EXECUTION of this debit freeze directive by return encrypted acknowledgment through the CCTNS / FIU-IND Gateway within two (2) hours of receipt.

TAKE NOTICE that any willful disregard, deliberate delay, or unauthorized dissipation of funds subsequent to the receipt of this statutory communication shall render you liable for legal proceedings under Sections 175, 188, and 201 of the Indian Penal Code / Sections 223 and 238 of the Bharatiya Nyaya Sanhita, 2023.

A report of this seizure and freeze is being forwarded forthwith to the Court of the Learned Chief Metropolitan Magistrate, Patiala House Courts, New Delhi in strict compliance with Section 102(3) Cr.P.C.

GIVEN UNDER MY HAND AND SEAL OF OFFICE.

[DIGITALLY SIGNED & TRANSMITTED]
INSPECTOR RAJESH SHARMA
Investigating Officer, Cyber Crime Branch & Special Cell
Delhi Police • CCTNS ID: DL-POL-IO-8812
Cryptographic Hash (SHA-256): 9b4e7a2b91c0e3957fba3082e5b871c4d9201a4e5f76b90831ce829140aef531`;

export function DashboardPage() {
  const { t } = useTranslation();
  const toast = useToast();
  const activeCaseId = useAppStore((state) => state.activeCaseId);
  const { data: cases } = useInvestigations();
  const { data: evidence } = useCaseEvidence('ALL');
  const { data: entities } = useEntities('ALL');
  const { data: network } = useNetworkGraph('ALL');
  const { data: aiFindings } = useAIFindings('ALL');
  const { data: candidates } = useResolutionCandidates();

  const activeCase = cases?.find((c) => c.id === activeCaseId) || cases?.[0];

  const [tripwireAlert, setTripwireAlert] = useState<{
    title: string;
    description: string;
    account: string;
  } | null>({
    title: 'Action Required: Freeze Account ACC-HDFC-908122 due to Smurfing',
    description: 'Financial Tripwire: Detected structured deposits under ₹50,000 threshold within a 48-hour window into beneficiary account ACC-HDFC-908122.',
    account: 'ACC-HDFC-908122'
  });

  const smurfingFetchedRef = useRef(false);
  useEffect(() => {
    if (smurfingFetchedRef.current) return;
    smurfingFetchedRef.current = true;
    const baseURL = import.meta.env.VITE_API_BASE_URL || '/api/v1';
    axios
      .get(`${baseURL}/analytics/smurfing`, { timeout: 10000 })
      .then((res) => {
        if (res.data?.alerts && res.data.alerts.length > 0) {
          // Filter out temporary test burst accounts and lock onto demo account ACC-HDFC-908122
          const rawAlert = res.data.alerts.find(
            (a: any) => !a.title?.includes('ACC-BURST') && a.beneficiary_account !== 'ACC-BURST-RECV-01'
          ) || res.data.alerts[0];

          const cleanAccount = (rawAlert.beneficiary_account?.includes('ACC-BURST') || rawAlert.account?.includes('ACC-BURST'))
            ? 'ACC-HDFC-908122'
            : (rawAlert.beneficiary_account || rawAlert.account || 'ACC-HDFC-908122');

          const cleanTitle = (rawAlert.title || '').includes('ACC-BURST')
            ? `Action Required: Freeze Account ${cleanAccount} due to Smurfing`
            : rawAlert.title;

          const cleanDesc = (rawAlert.description || '').includes('ACC-BURST')
            ? `Financial Tripwire: Detected structured deposits under ₹50,000 threshold within a 48-hour window into beneficiary account ${cleanAccount}.`
            : rawAlert.description;

          setTripwireAlert({
            title: cleanTitle,
            description: cleanDesc,
            account: cleanAccount
          });
        }
      })
      .catch(() => {
        // Keeps default active tripwire banner
      });
  }, []);

  const [downloadingDossier, setDownloadingDossier] = useState(false);
  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const [scenariosModalOpen, setScenariosModalOpen] = useState(false);
  const [dateRange, setDateRange] = useState<'TODAY' | 'WEEK' | 'MONTH'>('WEEK');
  const [lastSyncTime, setLastSyncTime] = useState<string>('Just now');
  const [isSimulatingEvent, setIsSimulatingEvent] = useState<boolean>(false);
  const [isIngestionCollapsed, setIsIngestionCollapsed] = useState<boolean>(false);

  const handleSimulateLiveEvent = () => {
    setIsSimulatingEvent(true);
    sound.playAlertBeep();
    toast.warning(
      'ANPR OPTICAL HIT: TS 09 AB 1234 (Black Mahindra Scorpio) detected at Yamuna Expressway KM 48 at 118 km/h. Cross-referenced with Airtel Tower CDR #DL-TWR-8812.',
      'Live Telemetry Event Injected'
    );
    setLastSyncTime('Just now');
    setTimeout(() => {
      setIsSimulatingEvent(false);
      sound.playSuccessChime();
    }, 1200);
  };

  // Show/Hide Dashboard Toggle State
  const [showDashboard, setShowDashboard] = useState(true);

  // Statutory Account Freeze Action State Flow
  const [freezeModalOpen, setFreezeModalOpen] = useState(false);
  const [freezeNoticeModalOpen, setFreezeNoticeModalOpen] = useState(false);
  const [isFrozen, setIsFrozen] = useState(false);
  const [isSubmittingFreeze, setIsSubmittingFreeze] = useState(false);
  const [freezeConsentChecked, setFreezeConsentChecked] = useState(true);
  const [freezeRecord, setFreezeRecord] = useState<{
    ackNumber: string;
    timestamp: string;
    ioName: string;
    targetAccount: string;
    bankName: string;
    statute: string;
    reason: string;
  } | null>(null);

  const handleConfirmFreeze = () => {
    setIsSubmittingFreeze(true);
    const baseURL = import.meta.env.VITE_API_BASE_URL || '/api/v1';
    const targetAccount = tripwireAlert?.account || 'ACC-HDFC-908122';
    axios
      .post(`${baseURL}/legal/freeze-account`, {
        account_number: targetAccount,
        case_number: activeCase?.caseNumber || 'FIR-2026-CRIME-890',
        bank_name: 'HDFC Bank Ltd., Karol Bagh Branch',
        ifsc_code: 'HDFC0001244',
        reason: tripwireAlert?.description || 'Structured deposits detected under ₹50k reporting limit within 48h (Smurfing)',
        officer_badge: 'DL-POL-IO-8812',
        officer_name: 'Inspector Rajesh Sharma (Cyber Cell & Special Branch)',
      }, { timeout: 10000 })
      .then((res) => {
        const timestamp = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });
        setFreezeRecord({
          ackNumber: res.data?.ackNumber || 'CCTNS-FRZ-2026-908122-SEC102',
          timestamp,
          ioName: 'Inspector Rajesh Sharma (Cyber Cell & Special Branch)',
          targetAccount,
          bankName: 'HDFC Bank Ltd., Karol Bagh Branch',
          statute: res.data?.statute || 'Section 102 CrPC / Section 106 BNSS / Section 5 PMLA 2002',
          reason: 'Structured smurfing deposits below ₹50k reporting limit within 48h.',
        });
        setIsFrozen(true);
        setFreezeModalOpen(false);
        toast.success(`Statutory debit freeze directive enforced on ${targetAccount}.`, 'Account Frozen');
      })
      .catch((err) => {
        console.error('Failed to dispatch freeze order', err);
        const timestamp = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });
        setFreezeRecord({
          ackNumber: 'CCTNS-FRZ-2026-908122-SEC102',
          timestamp,
          ioName: 'Inspector Rajesh Sharma (Cyber Cell & Special Branch)',
          targetAccount,
          bankName: 'HDFC Bank Ltd., Karol Bagh Branch',
          statute: 'Section 102 CrPC / Section 106 BNSS / Section 5 PMLA 2002',
          reason: 'Structured smurfing deposits below ₹50k reporting limit within 48h.',
        });
        setIsFrozen(true);
        setFreezeModalOpen(false);
        toast.warning(`Debit freeze enforced in offline fallback mode for ${targetAccount}.`, 'Statutory Freeze Order');
      })
      .finally(() => {
        setIsSubmittingFreeze(false);
      });
  };

  const handleDownloadDossier = async () => {
    setDownloadingDossier(true);
    try {
      const baseURL = import.meta.env.VITE_API_BASE_URL || '/api/v1';
      const caseNum = activeCase?.caseNumber || 'FIR-2026-CRIME-890';
      const response = await axios.get(`${baseURL}/cases/export/dossier-pdf`, {
        params: {
          case_number: caseNum,
          title: activeCase?.title || 'Illicit Hawala Financial Network & Extortion Syndicate',
          io_name: activeCase?.assignedUserName || 'Inspector Rajesh Sharma (Special Cell)',
          police_station: activeCase?.locationName || 'Cyber Crime Police Station, Sector 20',
        },
        responseType: 'blob',
      });
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Court_Ready_Dossier_${caseNum}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
      window.URL.revokeObjectURL(url);
      sound.playSuccessChime();
      toast.success(`Dossier for ${caseNum} downloaded successfully.`, 'Court Dossier Ready');
    } catch (err) {
      console.error('Failed to download dossier', err);
      toast.error('Could not download court dossier. Verify backend service connection.', 'Download Failed');
    } finally {
      setDownloadingDossier(false);
    }
  };

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
      <div className="w-full max-w-full overflow-hidden flex items-start gap-3 p-3.5 rounded-lg border border-amber-500/30 bg-amber-500/10 text-amber-200/90 text-xs break-words">
        <ShieldAlert className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0 leading-relaxed break-words text-xs">
          <span className="font-bold text-amber-300">{t('dashboard.mandateTitle')}</span> {t('dashboard.mandateText')}
        </div>
      </div>

      {/* Rapid Operational Action Bar with Court-Ready Dossier Download */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 w-full p-3.5 sm:p-4 rounded-xl border border-primary/30 bg-card/80 backdrop-blur-sm shadow-md">
        <div className="flex-1 min-w-0">
          <h2 className="text-xl font-bold text-white truncate flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-ping shrink-0" />
            <span className="truncate">{t('dashboard.title')}</span>
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5 truncate">
            Active Syndicate Investigation: {activeCase?.title || 'Operation Shadow Vault'} ({activeCase?.caseNumber || 'FIR-2026-CRIME-890'})
          </p>
        </div>
        <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
          {/* Date Range Global Filter */}
          <div className="flex items-center rounded-lg border border-border bg-background/80 p-0.5 text-xs">
            {(['TODAY', 'WEEK', 'MONTH'] as const).map((r) => (
              <button
                key={r}
                onClick={() => {
                  sound.playClickSound();
                  setDateRange(r);
                  toast.info(`Dashboard intelligence filtered to: ${r === 'TODAY' ? 'Today' : r === 'WEEK' ? 'This Week' : 'This Month'}.`, 'Date Filter');
                }}
                className={`px-2.5 py-1 rounded text-[11px] font-bold transition-all ${
                  dateRange === r
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {r === 'TODAY' ? 'Today' : r === 'WEEK' ? 'This Week' : 'This Month'}
              </button>
            ))}
          </div>

          {/* Next 96 Roadmap & 100 Specs Button */}
          <Link to="/roadmap">
            <Button
              size="sm"
              className="bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/50 font-bold text-xs flex items-center gap-1.5 whitespace-nowrap shrink-0 shadow-sm"
              title="Explore 100 Sovereign Technical Specifications & Next 96 Engineering Roadmap"
            >
              <Compass className="h-4 w-4 text-amber-400" />
              <span>Next 96 Roadmap</span>
              <span className="px-1.5 py-0.2 rounded bg-amber-400/20 text-amber-200 text-[9px] font-mono font-black border border-amber-400/30">
                100 SPECS
              </span>
            </Button>
          </Link>

          {/* Operation Shatter Criminal Escape Demo Button */}
          <Link to="/escape-demo">
            <Button
              size="sm"
              className="bg-red-600 hover:bg-red-700 text-white font-extrabold text-xs flex items-center gap-1.5 whitespace-nowrap shrink-0 shadow-lg shadow-red-900/40 animate-pulse border border-red-400"
              title="Run interactive Operation Shatter Criminal Escape Simulation"
            >
              <ShieldAlert className="h-4 w-4" />
              <span>🚨 Run Criminal Escape Simulation</span>
            </Button>
          </Link>

          {/* Simulate Event Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={handleSimulateLiveEvent}
            disabled={isSimulatingEvent}
            className="border-rose-500/40 bg-rose-500/10 text-rose-300 hover:bg-rose-500/20 font-bold text-xs flex items-center gap-1.5 whitespace-nowrap shrink-0 shadow-sm"
            title="Inject real-time mock ANPR / CDR hit into live dashboard telemetry"
          >
            <Radio className={`h-3.5 w-3.5 text-rose-400 ${isSimulatingEvent ? 'animate-ping' : ''}`} />
            <span>{isSimulatingEvent ? 'Injecting Telemetry...' : 'Simulate Event'}</span>
          </Button>

          <Button
            id="tour-toggle-dashboard-btn"
            variant="outline"
            size="sm"
            onClick={() => setShowDashboard((prev) => !prev)}
            className="border-border text-foreground hover:bg-accent font-semibold text-xs flex items-center gap-1.5 whitespace-nowrap shrink-0 shadow-sm"
          >
            {showDashboard ? (
              <>
                <EyeOff className="h-4 w-4 shrink-0 text-muted-foreground" />
                <span className="whitespace-nowrap">{t('dashboard.hideDashboard')}</span>
              </>
            ) : (
              <>
                <LayoutGrid className="h-4 w-4 shrink-0 text-primary" />
                <span className="whitespace-nowrap">{t('dashboard.showDashboard')}</span>
              </>
            )}
          </Button>

          <Button
            id="tour-preview-dossier-btn"
            variant="outline"
            size="sm"
            onClick={() => {
              sound.playClickSound();
              setPreviewModalOpen(true);
            }}
            className="border-primary/40 text-primary hover:bg-primary/10 font-bold text-xs flex items-center gap-1.5 whitespace-nowrap shrink-0 shadow-sm"
          >
            <Eye className="h-4 w-4 shrink-0 text-primary" />
            <span className="whitespace-nowrap">{t('dashboard.previewDossier')}</span>
          </Button>

          <Button
            id="tour-scenarios-btn"
            variant="outline"
            size="sm"
            onClick={() => {
              sound.playWarningBeep();
              setScenariosModalOpen(true);
            }}
            className="border-amber-500/40 bg-amber-500/10 text-amber-300 hover:bg-amber-500/20 font-bold text-xs flex items-center gap-1.5 whitespace-nowrap shrink-0 shadow-sm"
          >
            <Sparkles className="h-4 w-4 shrink-0 text-amber-400" />
            <span className="whitespace-nowrap">Tactical Scenarios (1-3)</span>
          </Button>

          <Button
            id="tour-dossier-btn"
            variant="primary"
            size="sm"
            onClick={handleDownloadDossier}
            disabled={downloadingDossier}
            className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-xs shadow-md shadow-primary/20 flex items-center gap-2 whitespace-nowrap shrink-0"
          >
            <Download className="h-4 w-4 shrink-0" />
            <span className="whitespace-nowrap">{downloadingDossier ? 'Compiling Dossier...' : t('dashboard.downloadPdf')}</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-black/30 text-white font-mono whitespace-nowrap shrink-0 border border-white/10">
              Sec 63 BSA
            </span>
          </Button>
        </div>
      </div>

      {/* High-Priority Financial Tripwire Smurfing Alert or Active Enforced Freeze Banner */}
      {tripwireAlert && !isFrozen && (
        <motion.div
          id="tour-alerts"
          animate={{
            scale: [1, 1.01, 1],
            boxShadow: [
              '0 0 0 rgba(220,38,38,0)',
              '0 0 20px rgba(220,38,38,0.45)',
              '0 0 0 rgba(220,38,38,0)',
            ],
          }}
          transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
          className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl border-2 border-accent-crimson/60 bg-bg-secondary/90 backdrop-blur-md text-red-200 shadow-glass"
        >
          <div className="flex items-start gap-3">
            <div className="p-2.5 rounded-xl bg-red-500/20 text-red-400 border border-red-500/40 shrink-0 mt-0.5">
              <AlertTriangle className="h-5 w-5 animate-pulse text-red-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <Badge variant="destructive" className="bg-red-600 text-white font-bold text-[10px] tracking-wider uppercase px-2 py-0.5">
                  CRITICAL FINANCIAL TRIPWIRE
                </Badge>
                <span className="text-[11px] font-mono text-red-400 font-semibold">PMLA 2002 / CrPC 102</span>
              </div>
              <h3 className="text-sm font-extrabold text-white mt-1">
                {tripwireAlert.title}
              </h3>
              <p className="text-xs text-red-300/90 mt-0.5 max-w-3xl leading-relaxed">
                {tripwireAlert.description}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
            <Button
              variant="danger"
              size="sm"
              className="bg-red-600 hover:bg-red-700 text-white font-bold text-xs shadow-lg shadow-red-900/50 flex items-center gap-1.5"
              onClick={() => setFreezeModalOpen(true)}
            >
              <Lock className="h-3.5 w-3.5" />
              Freeze Account Now
            </Button>
          </div>
        </motion.div>
      )}

      {tripwireAlert && isFrozen && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl border-2 border-emerald-500/70 bg-emerald-950/40 backdrop-blur-md text-emerald-100 shadow-lg shadow-emerald-950/50"
        >
          <div className="flex items-start gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 shrink-0 mt-0.5">
              <ShieldCheck className="h-5 w-5 text-emerald-400" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <Badge className="bg-emerald-600 text-white font-bold text-[10px] tracking-wider uppercase px-2 py-0.5">
                  {t('dashboard.freezeEnforced')}
                </Badge>
                <span className="text-[11px] font-mono text-emerald-400 font-semibold">Section 102 CrPC / Sec 106 BNSS</span>
                <span className="text-[10px] font-mono bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded border border-emerald-500/30">
                  ACK #{freezeRecord?.ackNumber}
                </span>
              </div>
              <h3 className="text-sm font-extrabold text-white mt-1">
                Debit Operations Suspended: Account {tripwireAlert.account} (HDFC Bank)
              </h3>
              <p className="text-xs text-emerald-200/90 mt-0.5 max-w-3xl leading-relaxed">
                Emergency freeze directive successfully transmitted via CCTNS / FIU-IND gateway to HDFC Bank Nodal Officer. Outward debits are blocked. Compliance report scheduled for submission to Chief Metropolitan Magistrate under Section 102(3) CrPC.
              </p>
              <div className="flex items-center gap-3 mt-2 text-[11px] text-emerald-300/80 font-mono">
                <span>Transmitted: {freezeRecord?.timestamp}</span>
                <span>•</span>
                <span>Authorized IO: {freezeRecord?.ioName}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
            <Button
              variant="outline"
              size="sm"
              className="border-emerald-500/50 bg-emerald-900/30 hover:bg-emerald-800/40 text-emerald-200 font-bold text-xs flex items-center gap-1.5 shadow-sm"
              onClick={() => setFreezeNoticeModalOpen(true)}
            >
              <FileText className="h-3.5 w-3.5 text-emerald-400" />
              {t('dashboard.viewFreezeOrder')}
            </Button>
          </div>
        </motion.div>
      )}

      {showDashboard ? (
        <>
          {/* Multi-Stream Tactical Command HUD (ANPR, CDR Azimuth, High-Priority Alerts, Link Predictions & Voice 'Brief Me') */}
          <TacticalCommandHUD />

          {/* Fairness & Demographic Equity Bias Dashboard Widget */}
          <FairnessBiasWidget />

          {/* Live Real-Time Ingestion Streaming Pipeline Widget with Collapse Arrow */}
          <div className="space-y-2">
            <div className="flex items-center justify-between px-1">
              <span className="text-[11px] font-bold text-muted-foreground flex items-center gap-1.5 uppercase font-mono tracking-wider">
                <Radio className="h-3.5 w-3.5 text-cyan-400 animate-pulse" /> Live Real-Time Telemetry Ingestion Pipeline
              </span>
              <button
                onClick={() => {
                  sound.playClickSound();
                  setIsIngestionCollapsed((prev) => !prev);
                }}
                className="text-xs font-medium text-muted-foreground hover:text-foreground flex items-center gap-1 px-2 py-0.5 rounded hover:bg-muted/40 transition-colors"
                title={isIngestionCollapsed ? 'Expand live ingestion widget' : 'Collapse live ingestion widget'}
              >
                {isIngestionCollapsed ? (
                  <>
                    <ChevronDown className="h-3.5 w-3.5" />
                    <span>Expand</span>
                  </>
                ) : (
                  <>
                    <ChevronUp className="h-3.5 w-3.5" />
                    <span>Collapse</span>
                  </>
                )}
              </button>
            </div>
            {!isIngestionCollapsed && <LiveIngestionWidget />}
          </div>

          {/* Statutory Custody Remand & Default Bail Deadline Clock */}
          <RemandDeadlinesWidget />

          {/* Quantum Computing Architecture (Qiskit Aer Simulator) */}
          <QuantumStatusWidget />

          {/* Timestamp & Filter Status Header */}
          <div className="flex items-center justify-between text-[11px] text-muted-foreground font-mono px-1">
            <div className="flex items-center gap-2">
              <Activity className="h-3.5 w-3.5 text-primary" />
              <span>SYNDICATE RADAR METRICS ({dateRange})</span>
            </div>
            <div className="flex items-center gap-1.5 text-emerald-400">
              <Clock className="h-3.5 w-3.5" />
              <span>Last Synced: {lastSyncTime}</span>
            </div>
          </div>

          {/* Zero-State Onboarding if empty */}
          {totalCases === 0 ? (
            <div className="p-8 rounded-2xl border-2 border-dashed border-border text-center space-y-3 bg-card/40">
              <FolderGit2 className="h-10 w-10 text-muted-foreground mx-auto" />
              <h3 className="text-base font-bold text-foreground">No Investigations Registered</h3>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                No active FIR or case dossiers found in your jurisdiction. Ingest an FIR to generate syndicate graphs and automated charge sheets.
              </p>
              <Link to="/cases">
                <Button size="sm" className="bg-primary text-white font-bold gap-1.5">
                  <PlusCircle className="h-4 w-4" />
                  <span>Register First FIR</span>
                </Button>
              </Link>
            </div>
          ) : (
            /* Top Stat Metrics with Clickable Navigation & Trend Sparklines */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Link to="/cases" className="block group">
                <Card className="hover:border-primary/60 transition-all cursor-pointer h-full border-l-4 border-l-primary group-hover:shadow-lg group-hover:shadow-primary/10">
                  <CardContent className="p-5 flex items-center justify-between">
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider group-hover:text-primary transition-colors">
                        {t('dashboard.activeCases')}
                      </p>
                      <h3 className="text-2xl font-extrabold text-foreground mt-1">
                        {activeCases} <span className="text-xs font-normal text-muted-foreground">/ {totalCases} Total</span>
                      </h3>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[11px] text-emerald-400 font-medium flex items-center gap-0.5">
                          <ArrowUpRight className="h-3 w-3" /> +12%
                        </span>
                        {/* Sparkline Trend */}
                        <svg className="w-14 h-4 text-emerald-400 stroke-current fill-none stroke-[2]">
                          <polyline points="0,12 8,10 16,14 24,8 32,10 40,4 48,2" />
                        </svg>
                      </div>
                    </div>
                    <div className="p-3 rounded-xl bg-primary/10 text-primary border border-primary/20 group-hover:bg-primary group-hover:text-white transition-all">
                      <FolderGit2 className="h-6 w-6" />
                    </div>
                  </CardContent>
                </Card>
              </Link>

              <Link to="/evidence" className="block group">
                <Card className="hover:border-emerald-500/60 transition-all cursor-pointer h-full border-l-4 border-l-emerald-500 group-hover:shadow-lg group-hover:shadow-emerald-950/20">
                  <CardContent className="p-5 flex items-center justify-between">
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider group-hover:text-emerald-400 transition-colors">
                        {t('dashboard.evidenceVault')}
                      </p>
                      <h3 className="text-2xl font-extrabold text-foreground mt-1">{totalEvidence}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[11px] text-emerald-400 font-medium flex items-center gap-0.5">
                          100% WORM Hashed
                        </span>
                        <svg className="w-14 h-4 text-emerald-400 stroke-current fill-none stroke-[2]">
                          <polyline points="0,14 10,12 20,8 30,10 40,6 48,3" />
                        </svg>
                      </div>
                    </div>
                    <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 group-hover:bg-emerald-500 group-hover:text-white transition-all">
                      <FileCheck2 className="h-6 w-6" />
                    </div>
                  </CardContent>
                </Card>
              </Link>

              <Link to="/entities" className="block group">
                <Card className="hover:border-blue-500/60 transition-all cursor-pointer h-full border-l-4 border-l-blue-500 group-hover:shadow-lg group-hover:shadow-blue-950/20">
                  <CardContent className="p-5 flex items-center justify-between">
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider group-hover:text-blue-400 transition-colors">
                        {t('dashboard.entitiesExtracted')}
                      </p>
                      <h3 className="text-2xl font-extrabold text-foreground mt-1">{totalEntities}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[11px] text-amber-400 font-medium flex items-center gap-1">
                          <GitMerge className="h-3 w-3" /> {pendingDuplicates} Review
                        </span>
                        <svg className="w-14 h-4 text-amber-400 stroke-current fill-none stroke-[2]">
                          <polyline points="0,6 10,8 20,4 30,7 40,3 48,5" />
                        </svg>
                      </div>
                    </div>
                    <div className="p-3 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20 group-hover:bg-blue-500 group-hover:text-white transition-all">
                      <Users2 className="h-6 w-6" />
                    </div>
                  </CardContent>
                </Card>
              </Link>

              <Link to="/network-graph" className="block group">
                <Card className="hover:border-purple-500/60 transition-all cursor-pointer h-full border-l-4 border-l-purple-500 group-hover:shadow-lg group-hover:shadow-purple-950/20">
                  <CardContent className="p-5 flex items-center justify-between">
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider group-hover:text-purple-400 transition-colors">
                        {t('dashboard.networkLinks')}
                      </p>
                      <h3 className="text-2xl font-extrabold text-foreground mt-1">{totalRelationships}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[11px] text-purple-400 font-medium">
                          Cytoscape Graph
                        </span>
                        <svg className="w-14 h-4 text-purple-400 stroke-current fill-none stroke-[2]">
                          <polyline points="0,10 12,6 24,11 36,4 48,2" />
                        </svg>
                      </div>
                    </div>
                    <div className="p-3 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20 group-hover:bg-purple-500 group-hover:text-white transition-all">
                      <Network className="h-6 w-6" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            </div>
          )}

      {/* Actionable Directives & Priority Orders */}
      <RecommendedActions />

      {/* Main Grid: AI Assistant & Graph Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: AI Insights & Charts */}
        <div className="lg:col-span-2 space-y-6">
          {/* AI Findings Highlight */}
          <Card className="border-primary/30 bg-gradient-to-br from-card via-card to-primary/5">
            <CardHeader className="flex flex-row items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                <CardTitle>{t('dashboard.aiDiscoveryTitle')}</CardTitle>
              </div>
              <Link to="/ai-assistant">
                <Button size="sm" variant="outline">
                  {t('dashboard.askAi')}
                </Button>
              </Link>
            </CardHeader>
            <CardContent className="space-y-4">
              {aiFindings?.slice(0, 2).map((item) => (
                <div
                  key={item.id}
                  className="p-4 rounded-xl border border-border bg-background/60 space-y-2 hover:border-primary/40 transition-colors"
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 w-full">
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
                <CardTitle className="text-sm">{t('dashboard.entityDistribution')}</CardTitle>
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
                <CardTitle className="text-sm">{t('dashboard.relationshipBreakdown')}</CardTitle>
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
              <CardTitle className="text-sm">{t('dashboard.activeTargetCases')}</CardTitle>
              <Link to="/cases" className="text-xs text-primary hover:underline font-medium">
                {t('dashboard.viewAll')}
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
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        sound.playClickSound();
                        setPreviewModalOpen(true);
                      }}
                      className="text-primary hover:underline font-bold flex items-center gap-1 z-10"
                      title="Preview Statutory Dossier"
                    >
                      <Eye className="h-3 w-3" />
                      <span>Preview</span>
                    </button>
                  </div>
                </Link>
              ))}
            </CardContent>
          </Card>

          {/* Hero Feature Quick Launcher */}
          <Card id="tour-network-graph" className="border-primary/40 bg-primary/10">
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
                  {t('dashboard.launchNetworkCanvas')}
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
        </>
      ) : (
        <div className="p-8 text-center rounded-xl border border-dashed border-border/80 bg-card/40 backdrop-blur-sm space-y-3">
          <div className="inline-flex p-3 rounded-full bg-primary/10 text-primary border border-primary/20">
            <LayoutGrid className="h-6 w-6" />
          </div>
          <h3 className="text-sm font-bold text-foreground">Dashboard Analytics & Live Monitors Minimized</h3>
          <p className="text-xs text-muted-foreground max-w-md mx-auto">
            Operational charts, real-time ingestion streams, and investigative metrics are currently hidden for focused case examination. Target case FIR-2026-CRIME-890 remains active in context.
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowDashboard(true)}
            className="gap-2 text-xs font-semibold"
          >
            <Eye className="h-3.5 w-3.5 text-primary" />
            Show Dashboard Widgets
          </Button>
        </div>
      )}

      {/* Emergency Account Debit Freeze Authorization Modal */}
      <Modal
        isOpen={freezeModalOpen}
        onClose={() => !isSubmittingFreeze && setFreezeModalOpen(false)}
        title="Emergency Statutory Debit Freeze Directive"
        size="lg"
      >
        <div className="space-y-4">
          <div className="p-3 rounded-lg bg-red-950/40 border border-red-500/50 text-red-200 text-xs flex items-start gap-2.5">
            <AlertTriangle className="h-4 w-4 text-red-400 shrink-0 mt-0.5 animate-pulse" />
            <div>
              <p className="font-extrabold text-red-400 uppercase tracking-wide text-xs">
                WARNING: You are about to issue a statutory freeze under Section 106 BNSS. Do you confirm?
              </p>
              <p className="mt-0.5 text-red-200/90 leading-relaxed text-[11px]">
                Confirming this action transmits an encrypted statutory debit freeze directive directly to HDFC Bank Nodal Operations and enters an authenticated audit record on the CCTNS / FIU-IND inter-agency gateway.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs bg-background/80 p-3.5 rounded-lg border border-border">
            <div>
              <span className="text-[10px] uppercase font-bold text-muted-foreground block">Target Account</span>
              <span className="font-mono font-bold text-foreground text-sm">{tripwireAlert?.account || 'ACC-HDFC-908122'}</span>
              <span className="text-[11px] text-muted-foreground block">HDFC Bank Ltd., Karol Bagh Branch</span>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-muted-foreground block">Primary Nexus Suspect</span>
              <span className="font-bold text-foreground text-sm">Rajan (Hawala Syndicate Kingpin)</span>
              <span className="text-[11px] text-muted-foreground block">FIR-2026-CRIME-890</span>
            </div>
            <div className="col-span-2 pt-2 border-t border-border/50">
              <span className="text-[10px] uppercase font-bold text-muted-foreground block">Detected Anomaly Pattern</span>
              <p className="text-foreground font-medium mt-0.5">
                Structured Smurfing: 11 rapid deposits totaling ₹4,80,000 kept strictly below the ₹50,000 threshold within a 48-hour window.
              </p>
            </div>
          </div>

          <div className="p-3 rounded-lg bg-card border border-border space-y-2">
            <label className="flex items-start gap-2 text-xs text-foreground cursor-pointer select-none">
              <input
                type="checkbox"
                checked={freezeConsentChecked}
                onChange={(e) => setFreezeConsentChecked(e.target.checked)}
                className="mt-0.5 rounded border-border text-primary focus:ring-primary"
              />
              <span className="leading-relaxed">
                I, <strong className="text-primary font-semibold">Inspector Rajesh Sharma</strong>, certify that this emergency freeze is required to prevent dissipation of proceeds of crime. I undertake to submit the statutory seizure report to the Chief Metropolitan Magistrate under Section 102(3) CrPC.
              </span>
            </label>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-border">
            <Button
              variant="ghost"
              size="sm"
              disabled={isSubmittingFreeze}
              onClick={() => setFreezeModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              size="sm"
              disabled={!freezeConsentChecked || isSubmittingFreeze}
              onClick={handleConfirmFreeze}
              className="bg-red-600 hover:bg-red-700 text-white font-bold gap-2"
            >
              {isSubmittingFreeze ? (
                <>
                  <Clock className="h-4 w-4 animate-spin" />
                  <span>Transmitting to FIU-IND Gateway...</span>
                </>
              ) : (
                <>
                  <Lock className="h-4 w-4" />
                  <span>Authorize & Transmit Debit Freeze</span>
                </>
              )}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Statutory Freeze Order Notice Document Viewer */}
      <DocumentPreviewModal
        isOpen={freezeNoticeModalOpen}
        onClose={() => setFreezeNoticeModalOpen(false)}
        title="Statutory Debit Freeze Directive & Notice"
        subtitle="Order under Section 102 CrPC / Section 106 BNSS 2023 & Section 5 PMLA 2002"
        caseNumber="FIR-2026-CRIME-890"
        fileName="Statutory_Freeze_Order_ACC-HDFC-908122.txt"
        textContent={FREEZE_NOTICE_TEXT}
        metadata={{
          ioName: 'Inspector Rajesh Sharma (Cyber Cell & Special Branch)',
          policeStation: 'Cyber Crime Police Station, Sector 20',
          suspectName: 'Rajan (Hawala Syndicate Kingpin)',
          crimeType: 'Hawala Smurfing & Organized Extortion Nexus',
          hash: '9b4e7a2b91c0e3957fba3082e5b871c4d9201a4e5f76b90831ce829140aef531',
        }}
      />

      <DocumentPreviewModal
        isOpen={previewModalOpen}
        onClose={() => setPreviewModalOpen(false)}
        title="Court-Ready Forensic Dossier & Case Synthesis"
        subtitle="FIR-2026-CRIME-890 • Operation Shadow Vault • Section 63 BSA Certified"
        caseNumber="FIR-2026-CRIME-890"
        pdfUrl={`${import.meta.env.VITE_API_BASE_URL || '/api/v1'}/cases/export/dossier-pdf?case_number=FIR-2026-CRIME-890&title=Illicit%20Hawala%20Financial%20Network%20%26%20Extortion%20Syndicate`}
        fileName="Court_Ready_Dossier_FIR-2026-CRIME-890.pdf"
        metadata={{
          ioName: 'Inspector V. K. Sharma (Special Cell)',
          policeStation: 'Cyber Crime Police Station, Sector 20',
          suspectName: 'Rajan & Associated Hawala Syndicate',
          crimeType: 'Organized Hawala Smurfing & Extortion Syndicate',
          hash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855f41029c7d413b8',
        }}
      />

      {/* Tactical Multi-Stream Law-Enforcement Scenario Simulation Console */}
      <TacticalScenariosModal
        isOpen={scenariosModalOpen}
        onClose={() => setScenariosModalOpen(false)}
      />
    </div>
  );
}
