/**
 * STATUTORY RULES & POLICE JURISPRUDENCE ENGINE (CRIMENEXUS)
 * Codifies 15 Critical Statutory Rules governing Indian Criminal Law,
 * Digital Evidence Admissibility, and Constitutional Detention Safeguards.
 * 
 * References:
 * - Bharatiya Nyaya Sanhita, 2023 (BNS) [formerly IPC]
 * - Bharatiya Nagarik Suraksha Sanhita, 2023 (BNSS) [formerly CrPC]
 * - Bharatiya Sakshya Adhiniyam, 2023 (BSA) [formerly IEA]
 * - Constitution of India (Articles 21 & 22)
 * - Supreme Court Precedents (D.K. Basu, Arnesh Kumar, Anvar P.V., Arjun Panditrao)
 */

export interface StatutoryRule {
  id: string;
  ruleNumber: number;
  title: string;
  statutoryReference: string;
  category: 'CONSTITUTIONAL' | 'EVIDENCE_BSA' | 'PROCEDURAL_BNSS' | 'FINANCIAL_AML' | 'HUMAN_RIGHTS';
  mandatoryRequirement: string;
  nonComplianceConsequence: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM';
  validationCheck: (context: Record<string, any>) => { valid: boolean; warning?: string };
}

export const STATUTORY_RULES: StatutoryRule[] = [
  {
    id: 'rule-1',
    ruleNumber: 1,
    title: 'Mandatory 24-Hour Magistrate Production',
    statutoryReference: 'Article 22(2) Constitution of India & Sec 58 BNSS (Sec 57 CrPC)',
    category: 'CONSTITUTIONAL',
    mandatoryRequirement: 'Every arrested person must be produced before the nearest Judicial Magistrate within 24 hours of arrest, excluding travel time.',
    nonComplianceConsequence: 'Detention beyond 24 hours without magistrate remand constitutes illegal confinement (Habeas Corpus violation) rendering IO liable under Sec 198 BNS.',
    severity: 'CRITICAL',
    validationCheck: (ctx) => {
      const hours = ctx.custodyDurationHours ?? 0;
      if (hours > 24 && !ctx.hasMagistrateRemand) {
        return {
          valid: false,
          warning: `UNLAWFUL DETENTION: Suspect detained for ${hours.toFixed(1)}h without judicial remand order.`
        };
      }
      return { valid: true };
    }
  },
  {
    id: 'rule-2',
    ruleNumber: 2,
    title: 'Cryptographic SHA-256 Electronic Evidence Sealing',
    statutoryReference: 'Section 63 Bharatiya Sakshya Adhiniyam, 2023 (Sec 65B IEA)',
    category: 'EVIDENCE_BSA',
    mandatoryRequirement: 'Digital media (CCTV, CDR, ANPR, database logs) must bear a strict 64-hexadecimal SHA-256 hash generated at seizure time with device provenance certificate.',
    nonComplianceConsequence: 'Electronic evidence is strictly inadmissible in court; trial judge must reject exhibit under Arjun Panditrao v. Kailash Kushan (2020).',
    severity: 'CRITICAL',
    validationCheck: (ctx) => {
      const hash = ctx.evidenceHash || '';
      const isValidSha256 = /^[a-fA-F0-9]{64}$/.test(hash);
      if (!isValidSha256) {
        return {
          valid: false,
          warning: 'INVALID HASH: Electronic evidence lacks a valid 64-character SHA-256 cryptographic seal.'
        };
      }
      return { valid: true };
    }
  },
  {
    id: 'rule-3',
    ruleNumber: 3,
    title: 'Unbroken Chain of Custody (WORM Audit Trail)',
    statutoryReference: 'ISO/IEC 27037 & Delhi Police Standing Order No. 444/2016',
    category: 'EVIDENCE_BSA',
    mandatoryRequirement: 'Every evidence transfer, inspection, or extraction must be immutably recorded with officer badge, timestamp, and purpose without retroactive mutation.',
    nonComplianceConsequence: 'Evidentiary weight diluted; defense can argue evidence tampering or fabrication.',
    severity: 'HIGH',
    validationCheck: (ctx) => {
      if (!ctx.custodyHistory || ctx.custodyHistory.length === 0) {
        return { valid: false, warning: 'CHAIN OF CUSTODY DEFECT: No verified transfer history recorded.' };
      }
      return { valid: true };
    }
  },
  {
    id: 'rule-4',
    ruleNumber: 4,
    title: 'FIU-IND Anti-Smurfing Threshold Alert (<₹50,000 Structuring)',
    statutoryReference: 'Prevention of Money Laundering Act (PMLA) 2002 & RBI AML Master Directions',
    category: 'FINANCIAL_AML',
    mandatoryRequirement: 'Multiple transfers intentionally structured between ₹40,000 and ₹49,999 to bypass the ₹50,000 Cash Transaction Report (CTR) threshold must trigger instant freezing notices.',
    nonComplianceConsequence: 'Syndicate launders extortion funds through unregulated mule networks without FIU interception.',
    severity: 'HIGH',
    validationCheck: (ctx) => {
      const amount = ctx.transactionAmount ?? 0;
      if (amount >= 40000 && amount < 50000 && ctx.isStructuredMule) {
        return { valid: false, warning: 'PMLA STRUCTURING ALERT: Transaction structured below ₹50k to evade CTR threshold.' };
      }
      return { valid: true };
    }
  },
  {
    id: 'rule-5',
    ruleNumber: 5,
    title: 'Juvenile Identity Redaction Safeguard',
    statutoryReference: 'Section 74 Juvenile Justice (Care and Protection of Children) Act, 2015',
    category: 'HUMAN_RIGHTS',
    mandatoryRequirement: 'The name, photograph, address, or school of any child in conflict with law (<18 years) must never be disclosed publicly or in police watchlists.',
    nonComplianceConsequence: 'Violation punishable with imprisonment up to 6 months or fine up to ₹2 Lakhs under Sec 74(2) JJ Act.',
    severity: 'CRITICAL',
    validationCheck: (ctx) => {
      if (ctx.age !== undefined && ctx.age < 18 && !ctx.isMasked) {
        return { valid: false, warning: 'JUVENILE PROTECTION BREACH: Suspect under 18 must have identity masked.' };
      }
      return { valid: true };
    }
  },
  {
    id: 'rule-6',
    ruleNumber: 6,
    title: 'Sunset-to-Sunrise Female Arrest Prohibition',
    statutoryReference: 'Section 43(5) BNSS, 2023 (Section 46(4) CrPC)',
    category: 'PROCEDURAL_BNSS',
    mandatoryRequirement: 'Except in exceptional circumstances with prior written permission of Judicial Magistrate First Class, no woman shall be arrested after sunset and before sunrise.',
    nonComplianceConsequence: 'Arrest is deemed illegal, violating fundamental liberty; IO subject to disciplinary action and contempt.',
    severity: 'CRITICAL',
    validationCheck: (ctx) => {
      if (ctx.gender === 'FEMALE' && ctx.isNightTime && !ctx.hasMagistrateNightPermission) {
        return { valid: false, warning: 'STATUTORY NIGHT ARREST BAR: Female arrest between sunset and sunrise requires prior JMFC order.' };
      }
      return { valid: true };
    }
  },
  {
    id: 'rule-7',
    ruleNumber: 7,
    title: 'Mandatory Registration of Zero FIR',
    statutoryReference: 'Section 173(1) BNSS, 2023 & Lalita Kumari v. Govt of UP (2014)',
    category: 'PROCEDURAL_BNSS',
    mandatoryRequirement: 'Police station MUST register a Zero FIR for any cognizable offense regardless of territorial jurisdiction, and immediately transfer it to the jurisdictional station.',
    nonComplianceConsequence: 'Refusal to register FIR is a criminal offense under Section 199 BNS (punishable with up to 2 years imprisonment).',
    severity: 'HIGH',
    validationCheck: (ctx) => {
      if (ctx.isCognizable && ctx.isRefusedDueToJurisdiction) {
        return { valid: false, warning: 'ZERO FIR MANDATE: Cognizable offense cannot be refused on territorial grounds.' };
      }
      return { valid: true };
    }
  },
  {
    id: 'rule-8',
    ruleNumber: 8,
    title: 'Statutory 48-Hour Bail Opposition Reply Deadline',
    statutoryReference: 'Section 480 BNSS (Section 437/439 CrPC) & High Court Rules',
    category: 'PROCEDURAL_BNSS',
    mandatoryRequirement: 'Police prosecution must submit formal reply opposing bail with previous criminal history within 48 hours of court notice.',
    nonComplianceConsequence: 'Court may grant default interim bail to dangerous syndicate kingpins due to non-representation of prosecution.',
    severity: 'HIGH',
    validationCheck: (ctx) => {
      if (ctx.bailApplicationHours > 48 && !ctx.hasBailOppositionFiled) {
        return { valid: false, warning: 'BAIL OPPOSITION OVERDUE: Exceeded 48h deadline without submitting grounds of opposition.' };
      }
      return { valid: true };
    }
  },
  {
    id: 'rule-9',
    ruleNumber: 9,
    title: '15-Day Maximum Police Custody Limit',
    statutoryReference: 'Section 187(2) BNSS, 2023 (Section 167(2) CrPC)',
    category: 'CONSTITUTIONAL',
    mandatoryRequirement: 'Police remand shall not exceed 15 days in whole. Remand may be taken in parts during the initial 40 or 60 days under BNSS, but total police custody cannot exceed 15 days.',
    nonComplianceConsequence: 'Excess custody is unlawful detention; magistrate must reject remand extension application.',
    severity: 'CRITICAL',
    validationCheck: (ctx) => {
      const days = ctx.totalPoliceCustodyDays ?? 0;
      if (days > 15) {
        return { valid: false, warning: 'EXCEEDED 15-DAY POLICE REMAND: Suspect must be remanded to Judicial Custody only.' };
      }
      return { valid: true };
    }
  },
  {
    id: 'rule-10',
    ruleNumber: 10,
    title: 'Digital Device Faraday Bag & Write-Blocker Protocol',
    statutoryReference: 'NCRB Cyber Crime Investigation Manual & ISO/IEC 27037',
    category: 'EVIDENCE_BSA',
    mandatoryRequirement: 'Seized mobile phones and laptops must immediately be isolated in RF Faraday bags or airplane mode, and cloned exclusively using hardware write-blockers.',
    nonComplianceConsequence: 'Risk of remote wipe by syndicate; evidence tampering defense successfully raised in court.',
    severity: 'HIGH',
    validationCheck: (ctx) => {
      if (ctx.isDeviceEvidence && (!ctx.isFaradayIsolated || !ctx.isWriteBlocked)) {
        return { valid: false, warning: 'EVIDENCE CORRUPTION RISK: Seized device not marked as Faraday isolated or write-blocked.' };
      }
      return { valid: true };
    }
  },
  {
    id: 'rule-11',
    ruleNumber: 11,
    title: 'Superintendent of Police Approval for Telecom CDR Seizure',
    statutoryReference: 'Section 5(2) Indian Telegraph Act & MHA Surveillance Guidelines',
    category: 'PROCEDURAL_BNSS',
    mandatoryRequirement: 'Obtaining Call Detail Records (CDR) and tower dump logs requires written authorization from an officer not below the rank of Superintendent of Police (SP) or DCP.',
    nonComplianceConsequence: 'Unlawful surveillance violation; CDR evidence suppressed under Section 63 BSA in trial.',
    severity: 'HIGH',
    validationCheck: (ctx) => {
      if (ctx.isCdrEvidence && !ctx.hasSpAuthorization) {
        return { valid: false, warning: 'UNAUTHORIZED CDR: Lacks mandatory Superintendent of Police (SP/DCP) requisition approval.' };
      }
      return { valid: true };
    }
  },
  {
    id: 'rule-12',
    ruleNumber: 12,
    title: '1-Year Statutory Expiry of Lookout Circulars (LOC)',
    statutoryReference: 'Ministry of Home Affairs LOC Guidelines 2021 (No. 25016/31/2010-Imm)',
    category: 'PROCEDURAL_BNSS',
    mandatoryRequirement: 'A Look Out Circular (LOC) issued to airport immigration expires automatically after 1 year unless the originator issues a written extension before expiry.',
    nonComplianceConsequence: 'Fugitive permitted to board international flights without immigration interception.',
    severity: 'HIGH',
    validationCheck: (ctx) => {
      if (ctx.isLoc && ctx.locAgeDays > 365 && !ctx.isLocRenewed) {
        return { valid: false, warning: 'EXPIRED LOC: Lookout circular exceeded 365 days without mandatory annual renewal.' };
      }
      return { valid: true };
    }
  },
  {
    id: 'rule-13',
    ruleNumber: 13,
    title: 'Non-Bailable Warrant (NBW) Court Returnable Date Enforcement',
    statutoryReference: 'Section 72 BNSS (Section 70 CrPC)',
    category: 'PROCEDURAL_BNSS',
    mandatoryRequirement: 'Non-Bailable Warrants must be executed or returned to issuing court with reasons for non-execution prior to the returnable date.',
    nonComplianceConsequence: 'Show cause notice and contempt proceedings issued against Station House Officer (SHO).',
    severity: 'MEDIUM',
    validationCheck: (ctx) => {
      if (ctx.isNbw && ctx.isPastReturnableDate && !ctx.isExecuted && !ctx.isReturnReportFiled) {
        return { valid: false, warning: 'COURT CONTEMPT RISK: NBW unexecuted past returnable date without court report.' };
      }
      return { valid: true };
    }
  },
  {
    id: 'rule-14',
    ruleNumber: 14,
    title: '14-Day Mandatory Case Diary Entry Rule',
    statutoryReference: 'Section 192 BNSS, 2023 (Section 172 CrPC)',
    category: 'PROCEDURAL_BNSS',
    mandatoryRequirement: 'Investigating Officer must record daily proceedings in the Case Diary. An investigation showing zero entries for >14 days requires mandatory SHO explanation.',
    nonComplianceConsequence: 'Adverse judicial presumption against prosecution under Section 119 BSA (withholding best evidence).',
    severity: 'MEDIUM',
    validationCheck: (ctx) => {
      if (ctx.daysSinceLastDiaryEntry > 14) {
        return { valid: false, warning: 'STALLED CASE DIARY: Zero entries recorded for over 14 days in ongoing investigation.' };
      }
      return { valid: true };
    }
  },
  {
    id: 'rule-15',
    ruleNumber: 15,
    title: 'Statutory 60/90-Day Charge-Sheet Default Bail Rule',
    statutoryReference: 'Section 187(3) BNSS, 2023 (Section 167(2) CrPC)',
    category: 'CONSTITUTIONAL',
    mandatoryRequirement: 'Charge-sheet must be filed within 60 days (for offenses punishable up to 10 years) or 90 days (for death, life imprisonment, or offenses >10 years).',
    nonComplianceConsequence: 'Accused gets an indefeasible constitutional right to Default Statutory Bail immediately upon expiry of 60/90 days.',
    severity: 'CRITICAL',
    validationCheck: (ctx) => {
      const maxDays = ctx.isHeinousOffense ? 90 : 60;
      if (ctx.investigationDays > maxDays && !ctx.hasChargeSheetFiled) {
        return {
          valid: false,
          warning: `DEFAULT BAIL TRIGGERED: Investigation exceeded ${maxDays} days without filing charge-sheet under Sec 193 BNSS.`
        };
      }
      return { valid: true };
    }
  }
];

export function validateCaseCompliance(caseContext: Record<string, any>): {
  passed: StatutoryRule[];
  failed: Array<{ rule: StatutoryRule; warning: string }>;
  complianceScore: number;
} {
  const passed: StatutoryRule[] = [];
  const failed: Array<{ rule: StatutoryRule; warning: string }> = [];

  for (const rule of STATUTORY_RULES) {
    const result = rule.validationCheck(caseContext);
    if (result.valid) {
      passed.push(rule);
    } else {
      failed.push({ rule, warning: result.warning || 'Statutory compliance violation.' });
    }
  }

  const score = Math.round((passed.length / STATUTORY_RULES.length) * 100);
  return { passed, failed, complianceScore: score };
}
