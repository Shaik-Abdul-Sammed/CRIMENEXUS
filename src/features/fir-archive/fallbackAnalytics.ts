import { InsightItem } from './InsightCard';

export const FALLBACK_25_ANALYTICS: InsightItem[] = [
  {
    analytics_id: 'FIA-001',
    name: 'Modus Operandi Evolution',
    category: 'CRIME PATTERN DISCOVERY',
    result:
      'Syndicate tactics evolved from physical vehicle smash-and-grab (2016-2018) into OTP SIM-swap fraud (2019-2022), and finally crypto-layering USDT mixers (2023-2026).',
    confidence: 0.91,
    evidence_firs: ['FIR-2016-041', 'FIR-2019-210', 'FIR-2023-882'],
    explanation:
      "Temporal keyword progression: 'lock pick' (-78%) vs 'SIM swap' (+145%) vs 'USDT TRC20' (+320%).",
    recommendation:
      'Deploy Cyber Cell cryptocurrency tracking tools rather than physical roadblock stakeouts for current syndicate targets.',
  },
  {
    analytics_id: 'FIA-002',
    name: 'Syndicate DNA Mapping',
    category: 'NETWORK TOPOLOGY',
    result:
      "Shared core mastermind 'Rajan Verma (Kingpin)' identified across 14 FIRs spanning 9 years with 4 key lieutenant conduits.",
    confidence: 0.94,
    evidence_firs: ['FIR-2017-092', 'FIR-2020-551', 'FIR-2024-890'],
    explanation:
      'Neo4j Jaccard coefficient 0.82 across 8 common shell entities and 3 recurring burner IMEI pairs.',
    recommendation:
      'Book case under Section 111 Bharatiya Nyaya Sanhita, 2023 (Organized Crime Syndicate) to preclude statutory bail.',
  },
  {
    analytics_id: 'FIA-003',
    name: 'Linguistic Fingerprint',
    category: 'FORENSIC LINGUISTICS',
    result:
      'Stylometric character n-gram cosine similarity (0.89) indicates complaints in FIR-2021-301 and FIR-2022-412 were authored by the same legal typist rather than independent civilian complainants.',
    confidence: 0.87,
    evidence_firs: ['FIR-2021-301', 'FIR-2022-412'],
    explanation:
      "Identical idiosyncratic typos ('forthwithwith', 'perticulars'), lexical richness (Type-Token Ratio 0.41), and punctuation clustering.",
    recommendation:
      'Interrogate complainant on potential proxy complaint fabrication or corrupt legal conduit drafting.',
  },
  {
    analytics_id: 'FIA-004',
    name: 'Dialect Origin Locator',
    category: 'FORENSIC LINGUISTICS',
    result:
      'Complaint diction and colloquial phonetics isolate suspect dialect origin to Shekhawati / Bagri border region of Rajasthan-Haryana.',
    confidence: 0.84,
    evidence_firs: ['FIR-2023-112', 'FIR-2024-405'],
    explanation:
      "Colloquial morphosyntax markers: 'म्हारी', 'कोनी', 'टाबर', and retroflex nasal substitution in verbatim recorded dialogues.",
    recommendation:
      'Coordinate surveillance with Jhunjhunu and Churu police districts for suspect harbor locations.',
  },
  {
    analytics_id: 'FIA-005',
    name: 'Charge Framing Accuracy',
    category: 'LEGAL STATUTORY COMPLIANCE',
    result:
      '18.4% of historical financial cheating FIRs suffered trial discharge due to charging Section 420 IPC without mandatory Section 406 IPC (Criminal Breach of Trust) in the initial docket.',
    confidence: 0.92,
    evidence_firs: ['FIR-2018-119', 'FIR-2020-004', 'FIR-2022-671'],
    explanation:
      'Cross-referencing 200 trial court judgment dockets: Section 420 requires dishonest inducement at inception, whereas Section 406 requires entrustment.',
    recommendation:
      'Auto-recommend alternate framing under Section 316 / 318 Bharatiya Nyaya Sanhita to eliminate jurisdictional dismissal risk.',
  },
  {
    analytics_id: 'FIA-006',
    name: 'Case Outcome Predictor',
    category: 'PREDICTIVE JURISPRUDENCE',
    result:
      'Estimated Conviction Probability: 84.7% if forensic electronic hash certificates (Sec 63 BSA) are submitted within 30 days of remand.',
    confidence: 0.88,
    evidence_firs: ['FIR-2021-088', 'FIR-2023-419'],
    explanation:
      'Calibrated Random Forest trained on 1,420 Delhi Sessions Court disposals. Key feature importance: Digital chain-of-custody (0.42), Independent panchnama (0.28).',
    recommendation:
      'Expedite Central Forensic Science Laboratory (CFSL) digital forensic imaging certificate.',
  },
  {
    analytics_id: 'FIA-007',
    name: 'Witness Reliability Score',
    category: 'TESTIMONIAL FORENSICS',
    result:
      'Witness statement demonstrates 0.92 consistency index across 3 depositions with zero temporal contradiction.',
    confidence: 0.89,
    evidence_firs: ['FIR-2022-771', 'FIR-2024-012'],
    explanation:
      'Entity-relation alignment analysis shows 94% congruence between Section 161 CrPC (Sec 180 BNSS) police statement and Section 164 CrPC judicial magistrate deposition.',
    recommendation:
      'Designate as Key Star Witness (PW-1) for early trial examination.',
  },
  {
    analytics_id: 'FIA-008',
    name: 'Judicial Precedent Mining',
    category: 'CASE LAW RETRIEVAL',
    result:
      'Identified binding Supreme Court precedent: *P. Chidambaram v. Directorate of Enforcement (2019)* on parity in economic syndicates.',
    confidence: 0.95,
    evidence_firs: ['FIR-2020-001', 'FIR-2023-882'],
    explanation:
      'Cosine similarity match (0.91) against Supreme Court of India legal corpus regarding gravity of systematic hawala conduits.',
    recommendation:
      'Incorporate paragraph 23 citation directly into Special Public Prosecutor bail objection docket.',
  },
  {
    analytics_id: 'FIA-009',
    name: 'Suspect Life-Status Tracker',
    category: 'MORTALITY & JURISDICTION',
    result:
      "Suspect Rajan Verma: ALIVE (High Confidence 94%). Active SIM card cellular telemetry and FASTag toll crossing recorded within past 72 hours.",
    confidence: 0.94,
    evidence_firs: ['FIR-2026-CRIME-890'],
    explanation:
      'Cross-checked National Civil Death Registry (CRS API), Aadhaar biometric authentication logs, and active telecom HLR pings.',
    recommendation:
      'Execute non-bailable warrant at verified Greater Noida residential perimeter.',
  },
  {
    analytics_id: 'FIA-010',
    name: 'Case Aging & Delay Patterns',
    category: 'ADMINISTRATIVE AUDIT',
    result:
      'Average investigation lifecycle for cyber financial fraud is 184 days, exceeding statutory 60-day default bail window by 124 days.',
    confidence: 0.93,
    evidence_firs: ['FIR-2019-332', 'FIR-2022-108', 'FIR-2024-512'],
    explanation:
      'Primary procedural bottleneck: 68% of case delay occurs awaiting bank account debit-freeze reply and telecom CDR dump logs.',
    recommendation:
      'Trigger 1930 / I4C automated API banking freeze workflow to prevent accused seeking default bail under Sec 187 BNSS.',
  },
  {
    analytics_id: 'FIA-011',
    name: 'Officer Performance History',
    category: 'OFFICER REGISTRY',
    result:
      'Inspector Rajesh Varma (IO-8812): 74.2% historical conviction rate across 42 commercial fraud dockets (Top 5% in State).',
    confidence: 0.96,
    evidence_firs: ['FIR-2018-091', 'FIR-2021-301', 'FIR-2023-882'],
    explanation:
      'Strict adherence to panchnama timestamps and zero Section 63 BSA electronic evidence dismissals across 12 trials.',
    recommendation:
      'Assign as Lead Supervising Officer for multi-jurisdictional syndicate charge sheet filing.',
  },
  {
    analytics_id: 'FIA-012',
    name: 'Repeat Offender Network',
    category: 'RECIDIVISM MAPPING',
    result:
      'Accused linked to 7 prior FIRs in 3 districts under 2 alias identities with recurring surety guarantor.',
    confidence: 0.91,
    evidence_firs: ['FIR-2017-042', 'FIR-2020-118', 'FIR-2025-091'],
    explanation:
      'Fuzzy string and biometric token matching resolved aliases to same criminal record ID in CCTNS repository.',
    recommendation:
      'File application for cancellation of previous bail bonds on grounds of habitual repeat offence.',
  },
  {
    analytics_id: 'FIA-013',
    name: 'Victim-Offender Relationship',
    category: 'CRIMINOLOGICAL PROFILING',
    result:
      '68% of victims were recruited through fraudulent telegram work-from-home schemes before extortion phase.',
    confidence: 0.88,
    evidence_firs: ['FIR-2022-441', 'FIR-2023-612'],
    explanation:
      'NLP entity correlation identifies social engineering predatory pipeline targeting students and retirees.',
    recommendation:
      'Issue targeted public advisory via Cyber Crime Portal on fraudulent digital task applications.',
  },
  {
    analytics_id: 'FIA-014',
    name: 'Sentencing Pattern Analysis',
    category: 'JUDICIAL TRENDS',
    result:
      'Patiala House Sessions Court averages 4.2 years rigorous imprisonment for Section 420/120B IPC convictions involving amounts > ₹1 Crore.',
    confidence: 0.89,
    evidence_firs: ['FIR-2018-011', 'FIR-2021-789'],
    explanation:
      'Statutory regression of 84 judicial dispositions in economic offence courts between 2018 and 2024.',
    recommendation:
      'Frame charges under aggravated provisions to prevent plea bargain settlement below statutory threshold.',
  },
  {
    analytics_id: 'FIA-015',
    name: 'Seasonal Crime Waves',
    category: 'TEMPORAL FORECASTING',
    result:
      'Cyber extortion and phishing spikes by +62% during festive shopping seasons (October-December) annually.',
    confidence: 0.86,
    evidence_firs: ['FIR-2020-801', 'FIR-2022-902', 'FIR-2024-955'],
    explanation:
      'Seasonal Fourier decomposition indicates high-volume surge corresponding with festival discounts and corporate bonuses.',
    recommendation:
      'Double cyber cell surveillance rosters during Q4 calendar months.',
  },
  {
    analytics_id: 'FIA-016',
    name: 'Modus Operandi Signature',
    category: 'FORENSIC BEHAVIOR',
    result:
      'Unique digital signature: Syndicate uses specific Singapore AWS jump-boxes and identical malicious APK bundle ID (com.sec.safe.pay).',
    confidence: 0.95,
    evidence_firs: ['FIR-2023-221', 'FIR-2024-118'],
    explanation:
      'Static malware APK decompilation revealed hardcoded C2 IP and certificate fingerprint across multiple victims.',
    recommendation:
      'Issue emergency blocking order under Section 69A IT Act for malicious domain clusters.',
  },
  {
    analytics_id: 'FIA-017',
    name: 'Location Evolution & Crime Displacement',
    category: 'GEOSPATIAL DRIFT',
    result:
      'Operations displaced from Jamtara cluster to Alwar-Bharatpur corridor following intensive police strikes in 2021.',
    confidence: 0.92,
    evidence_firs: ['FIR-2020-310', 'FIR-2022-519', 'FIR-2025-004'],
    explanation:
      'Geospatial density centroid shifted 420 km westward along National Highway 48 over a 4-year timeline.',
    recommendation:
      'Establish joint inter-state border checkposts with Rajasthan and Haryana state police.',
  },
  {
    analytics_id: 'FIA-018',
    name: 'Language & Sentiment Trend',
    category: 'FORENSIC LINGUISTICS',
    result:
      'Intimidation language intensity in extortion transcripts increased by 44% in cases where payments were delayed.',
    confidence: 0.87,
    evidence_firs: ['FIR-2021-654', 'FIR-2023-718'],
    explanation:
      'BERT sentiment lexicon analysis on recorded audio transcripts reveals systematic progression to physical coercion threats.',
    recommendation:
      'Charge Section 351(2) BNS (Aggravated Criminal Intimidation) alongside economic extortion.',
  },
  {
    analytics_id: 'FIA-019',
    name: 'Digitization Shift',
    category: 'EVIDENTIARY AUDIT',
    result:
      'Physical paper record reliance dropped from 88% (2016) to 12% (2025), with 88% of current trial exhibits being electronic recordings.',
    confidence: 0.97,
    evidence_firs: ['FIR-2016-001', 'FIR-2025-888'],
    explanation:
      'Transition metric tracking statutory certificates under former Sec 65B IEA to modern Sec 63 BSA compliance.',
    recommendation:
      'Standardize all police digital evidence vaults with automatic SHA-256 cryptographic hashing at point of seizure.',
  },
  {
    analytics_id: 'FIA-020',
    name: 'Cold Case Resurrection',
    category: 'UNSOLVED CRIMES',
    result:
      'Unsolved 2017 ATM jackpotting case matches current syndicate suspect biometric template with 98.4% similarity.',
    confidence: 0.93,
    evidence_firs: ['FIR-2017-092', 'FIR-2026-CRIME-890'],
    explanation:
      'Automated latent fingerprint matching engine surfaced cold case record from historical CCTNS vault.',
    recommendation:
      'Reopen FIR-2017-092 and serve Section 193 BNSS remand warrant on detained accused.',
  },
  {
    analytics_id: 'FIA-021',
    name: 'Cross-Jurisdiction Matching',
    category: 'INTER-STATE POLICING',
    result:
      'Syndicate is actively wanted in 6 FIRs across Delhi, Mumbai, Bengaluru, and Hyderabad police commissionerates.',
    confidence: 0.94,
    evidence_firs: ['FIR-2022-091', 'FIR-2023-311', 'FIR-2024-704'],
    explanation:
      'Federated search across state crime databases confirmed identical mule bank accounts in ICICI and HDFC branches.',
    recommendation:
      'Convene inter-state police SIT coordination meeting via National Cyber Coordination Centre (NCCC).',
  },
  {
    analytics_id: 'FIA-022',
    name: 'Legal Section Concordance',
    category: 'STATUTORY HARMONIZATION',
    result:
      '100% automated concordance verified between repealed IPC sections (420, 120B, 468) and Bharatiya Nyaya Sanhita, 2023 equivalents (318, 61, 336).',
    confidence: 0.98,
    evidence_firs: ['FIR-2023-882', 'FIR-2026-CRIME-890'],
    explanation:
      'Statutory mapping table verified against Ministry of Home Affairs concordance guidelines.',
    recommendation:
      'Generate hybrid charge sheet referencing both IPC and BNS to satisfy statutory cutover requirements.',
  },
  {
    analytics_id: 'FIA-023',
    name: 'Property Recovery History',
    category: 'ASSET ATTACHMENT',
    result:
      'Historical asset recovery rate stands at ₹4.2 Crore (38.5% of defrauded funds) through prompt Section 106 BNSS attachment.',
    confidence: 0.9,
    evidence_firs: ['FIR-2019-110', 'FIR-2021-402', 'FIR-2024-670'],
    explanation:
      'Analysis of court-ordered bank liens and real estate provisional attachment orders over 5-year span.',
    recommendation:
      'Immediately file provisional attachment petition before Sessions Judge under Sec 107 BNSS for seized crypto assets.',
  },
  {
    analytics_id: 'FIA-024',
    name: 'Appeal/Revision History',
    category: 'APPELLATE JURISPRUDENCE',
    result:
      'High Court upheld 89.2% of convictions where Section 63 BSA electronic hash certificates were formally produced during prosecution examination.',
    confidence: 0.93,
    evidence_firs: ['FIR-2018-022', 'FIR-2021-399'],
    explanation:
      'Appellate case law mining of 37 Delhi High Court criminal appeals in organized cyber and economic offences.',
    recommendation:
      'Ensure cryptographic Merkle root hash certificates are marked as formal Exhibits (Ex. PW-X) during chief examination.',
  },
  {
    analytics_id: 'FIA-025',
    name: 'Bias Detection & Equity Audit',
    category: 'CONSTITUTIONAL EQUITY (ART. 14)',
    result:
      'Disparate Impact Ratio (DIR) stands at 0.94 (conforming to the 0.80-1.25 constitutional equity threshold). Algorithmic recommendations show no demographic or religious bias.',
    confidence: 0.96,
    evidence_firs: ['FIR-2016-010', 'FIR-2024-911'],
    explanation:
      'Audited 200 FIR outcomes against Article 14 equal protection benchmarks, isolating evidentiary merit from suspect socioeconomic background.',
    recommendation:
      'Maintain continuous bias parity checks on all automated link prediction algorithms.',
  },
];
