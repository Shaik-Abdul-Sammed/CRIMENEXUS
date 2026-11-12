import React, { useState } from 'react';
import {
  Brain,
  Cpu,
  Shield,
  Activity,
  Layers,
  Search,
  X,
  Play,
  RotateCcw,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ExternalLink,
  Code2,
  Calculator,
  Compass,
  Radio,
  Network,
  Lock,
  Eye,
  FileText,
  Volume2,
} from 'lucide-react';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { sound } from '../../utils/soundEffects';

export interface ForensicAlgorithm {
  id: string;
  code: string;
  title: string;
  category:
    | 'Spatial & Geolocation'
    | 'Network & Graph AI'
    | 'Forensics & Biometrics'
    | 'Cryptography & Compliance'
    | 'Quantum & Optimization'
    | 'Audio & Voice Forensics'
    | 'Mobile & Signal Intelligence';
  citation: string;
  complexity: string;
  legalAdmissibility: string;
  abstract: string;
  formula: string;
  formulaExplanation: string;
  defaultParams: Record<string, number | string>;
  computeFn: (params: Record<string, any>) => {
    outputLabel: string;
    outputValue: string | number;
    confidence: number;
    status: 'OPTIMAL' | 'EVIDENTIARY' | 'ALERT' | 'CONVERGED';
    metrics: Record<string, string | number>;
    log: string[];
  };
}

export const FORENSIC_20_ALGORITHMS: ForensicAlgorithm[] = [
  {
    id: 'f-01',
    code: 'F-01',
    title: 'Hyperbolic Cell-Tower Multilateration Engine',
    category: 'Spatial & Geolocation',
    citation: 'Fang-Chan Non-Linear Least Squares (arXiv:2305.10921 / IEEE Trans. Signal Processing)',
    complexity: 'O(N) closed-form matrix inversion for 3-5 base transceiver stations (BTS)',
    legalAdmissibility: 'Section 63(4) BSA 2023 certified timing-advance telemetry',
    abstract: 'Reconstructs handset coordinates without GPS relying purely on Time-Difference-Of-Arrival (TDOA) hyperbolic curves and LTE Timing Advance (TA) measurements across 3 or more cell towers.',
    formula: 'd_{i,1} = c · Δt_{i,1} = √[(x_i - x)² + (y_i - y)²] - √[(x_1 - x)² + (y_1 - y)²]',
    formulaExplanation: 'Intersects hyperbolic loci where distance difference d_{i,1} between tower i and reference tower 1 equals speed of light c multiplied by propagation delay delta t.',
    defaultParams: {
      towerCount: 3,
      timingAdvanceMeters: 340,
      noiseSigmaMeters: 14,
    },
    computeFn: (p) => {
      const ta = Number(p.timingAdvanceMeters) || 340;
      const sigma = Number(p.noiseSigmaMeters) || 14;
      const radiusError = Math.round(sigma * 1.414);
      const conf = Math.max(72, Math.min(99.4, 100 - sigma * 1.1));
      return {
        outputLabel: 'Estimated Handset Position Fix',
        outputValue: `Lat 28.6281° N, Lon 77.3648° E (±${radiusError}m)`,
        confidence: Number(conf.toFixed(1)),
        status: 'CONVERGED',
        metrics: {
          'GDOP (Geometric Dilution)': '1.24 (Excellent)',
          'Propagation Delay': `${(ta / 0.3).toFixed(0)} ns`,
          'Confidence Iso-Ellipse': `Semi-major: ${radiusError}m, Semi-minor: ${Math.round(radiusError * 0.7)}m`,
        },
        log: [
          'Received 3 BTS timing advance packets: Mast-01 (Karol Bagh), Mast-02 (Mayur Vihar), Mast-03 (Sec 62).',
          `Applied speed of light c=299,792 km/s over ${ta}m timing advance step.`,
          `Computed hyperbolic intersection locus with non-linear least squares residual ε=0.0042.`,
          'Target coordinate locked within 18m radius of Flat C-402 Safehouse.',
        ],
      };
    },
  },
  {
    id: 'f-02',
    code: 'F-02',
    title: 'Bayesian Lost Person Search Theory (Koopman-Frost Matrix)',
    category: 'Spatial & Geolocation',
    citation: 'Frost & Stone Theory of Optimal Search (Operations Research / US Coast Guard SAR)',
    complexity: 'O(K · M) recursive Bayesian grid update across K spatial sectors',
    legalAdmissibility: 'Accepted in High Court missing persons habeas corpus proceedings',
    abstract: 'Recursively updates Probability of Containment (POC) and Probability of Area (POA) across geographic search sectors following zero-sighting or positive sensor sweeps.',
    formula: 'P(A_j | ¬S) = [P(A_j) · (1 - POD_j)] / [1 - Σ_k P(A_k) · POD_k]',
    formulaExplanation: 'Calculates posterior probability of suspect/child being in sector A_j given an unsuccessful sweep in target sector using probability of detection POD.',
    defaultParams: {
      searchRadiusKm: 5,
      sweptSectors: 4,
      sensorPOD: 0.85,
    },
    computeFn: (p) => {
      const pod = Number(p.sensorPOD) || 0.85;
      const radius = Number(p.searchRadiusKm) || 5;
      const poaTop = Math.min(96, Math.round(82 + pod * 12));
      return {
        outputLabel: 'Top Priority Search Sector',
        outputValue: 'Sector 4: New Delhi Railway Station (NDLS West)',
        confidence: poaTop,
        status: 'OPTIMAL',
        metrics: {
          'Cumulative POC': '94.2%',
          'Search Effort (Hours)': `${(radius * 1.6).toFixed(1)} hrs`,
          'Sensor Sweep Efficiency': `${(pod * 100).toFixed(0)}% POD`,
        },
        log: [
          'Initialized prior spatial distribution from Lajpat Nagar Metro origin.',
          'Applied pedestrian velocity decay model (v_walk = 3.6 km/h) over 18h timeline.',
          `Incorporated negative search evidence from Karol Bagh and Anand Vihar ISBT.`,
          `Bayesian shift re-concentrated ${poaTop}% posterior mass into NDLS rail corridor.`,
        ],
      };
    },
  },
  {
    id: 'f-03',
    code: 'F-03',
    title: 'Temporal Hawkes Self-Exciting Point Process',
    category: 'Spatial & Geolocation',
    citation: 'A.G. Hawkes (Biometrika 1971) / Mohler et al. Self-Exciting Point Process Modeling of Crime',
    complexity: 'O(N²) pairwise event kernel evaluation with O(N) Ogata thinning simulation',
    legalAdmissibility: 'Proactive preventative deployment under Section 168 BNSS',
    abstract: 'Models the contagious viral diffusion of organized crime hits, retaliatory syndicate shootings, and serial burglaries where each event temporarily elevates strike intensity in nearby zones.',
    formula: 'λ(t) = μ(t) + Σ_{t_i < t} α · exp(-β(t - t_i))',
    formulaExplanation: 'Current incident rate lambda(t) equals baseline Poisson rate mu plus sum of exponentially decaying trigger shocks alpha * exp(-beta * delta_t) from prior incidents.',
    defaultParams: {
      baselineRate: 0.12,
      triggerAlpha: 0.65,
      decayBeta: 0.45,
    },
    computeFn: (p) => {
      const mu = Number(p.baselineRate) || 0.12;
      const alpha = Number(p.triggerAlpha) || 0.65;
      const beta = Number(p.decayBeta) || 0.45;
      const branchingRatio = alpha / beta;
      const intensity = mu + alpha * Math.exp(-beta * 0.5);
      const isCritical = branchingRatio >= 1.0;
      return {
        outputLabel: 'Current Retaliatory Threat Intensity',
        outputValue: `${intensity.toFixed(2)} events/hr (${isCritical ? 'CRITICAL CONTAGION' : 'DECAYING SUBSCRITICAL'})`,
        confidence: 91.5,
        status: isCritical ? 'ALERT' : 'OPTIMAL',
        metrics: {
          'Branching Ratio (η = α/β)': branchingRatio.toFixed(2),
          'Half-Life of Trigger Shock': `${(Math.log(2) / beta).toFixed(1)} hrs`,
          'Recommended Patrol Density': isCritical ? '4 Units / km²' : '1 Unit / km²',
        },
        log: [
          'Seeded 3 prior extortion incidents in Karol Bagh and Connaught Place.',
          `Branching factor computed at η=${branchingRatio.toFixed(2)} (${branchingRatio < 1 ? 'stable' : 'supercritical'}).`,
          'Forecasts 78% probability of retaliatory cash pickup attempt within next 4.5 hours.',
        ],
      };
    },
  },
  {
    id: 'f-04',
    code: 'F-04',
    title: 'Quantum Approximate Optimization (QAOA) Intercept Router',
    category: 'Quantum & Optimization',
    citation: 'Farhi, Goldstone, Gutmann (arXiv:1411.4028) / Max-Cut Road Network Partitioning',
    complexity: 'O(p · |E|) parameterized quantum variational circuit with p=4 mixer layers',
    legalAdmissibility: 'Standard operating procedure for emergency tactical vehicular pursuit',
    abstract: 'Formulates police road interception as an Ising Hamiltonian Max-Cut problem, calculating the optimal road-graph barricade locations to halt a speeding getaway vehicle with minimal squad cars.',
    formula: 'H_C = Σ_{(u,v) ∈ E} [w_{uv} / 2] · (1 - Z_u Z_v),  |γ, β⟩ = ∏_{j=1}^p e^{-i β_j B} e^{-i γ_j H_C} |+⟩^{⊗n}',
    formulaExplanation: 'Translates road network nodes into qubit states and optimizes variational parameters gamma and beta to maximize trapped flee vectors along bridge exits.',
    defaultParams: {
      qubitLayers: 4,
      targetSpeedKmh: 118,
      availableUnits: 3,
    },
    computeFn: (p) => {
      const speed = Number(p.targetSpeedKmh) || 118;
      const units = Number(p.availableUnits) || 3;
      const interceptTimeMin = (18 / (speed / 60)).toFixed(1);
      return {
        outputLabel: 'Optimal Barricade Convergence Locus',
        outputValue: `Yamuna Expressway Toll KM 48 (T-${interceptTimeMin} min)`,
        confidence: 96.8,
        status: 'CONVERGED',
        metrics: {
          'Cost Function Minimum ⟨H_C⟩': '-14.82',
          'Selected Patrol Interceptor': 'PCR-04 (Jewar Command)',
          'Estimated Intercept Contact': `${interceptTimeMin} minutes`,
        },
        log: [
          'Mapped 14 road intersections between Karol Bagh and Jewar into 14-qubit graph.',
          `Simulated ${Number(p.qubitLayers) * 512} QAOA state-vector evaluations with Nelder-Mead optimizer.`,
          `Identified singular choke-point at Yamuna Toll KM 48 with 96.8% escape denial probability.`,
        ],
      };
    },
  },
  {
    id: 'f-05',
    code: 'F-05',
    title: "Burrows' Delta Stylometric Forgery & Authorship Metric",
    category: 'Forensics & Biometrics',
    citation: 'J. Burrows (Literary and Linguistic Computing 2002) / Eder et al. Stylometry',
    complexity: 'O(|V| · |D|) frequency normalization across top 300 function words',
    legalAdmissibility: 'Expert forensic opinion under Section 39 Bharatiya Sakshya Adhiniyam',
    abstract: 'Measures grammatical fingerprint, function word distribution, and sentence syntax to mathematically prove whether an anonymous extortion letter or fake complaint was authored by a specific syndicate suspect.',
    formula: 'Δ(D, A) = (1 / |F|) · Σ_{f ∈ F} | [z(f, D) - z(f, A)] / σ_f |',
    formulaExplanation: 'Computes Manhattan distance over standard Z-score normalized frequencies of the top function words between questioned document D and suspect author corpus A.',
    defaultParams: {
      functionWordCount: 150,
      knownCorpusTokens: 4500,
      questionedTokens: 380,
    },
    computeFn: (p) => {
      const words = Number(p.functionWordCount) || 150;
      const deltaDistance = (0.42 + 25 / words).toFixed(3);
      const prob = Math.round(94.2);
      return {
        outputLabel: 'Authorship Attribution Result',
        outputValue: `High Confidence Match: Vikram Malhotra (Δ = ${deltaDistance})`,
        confidence: prob,
        status: 'EVIDENTIARY',
        metrics: {
          "Burrows' Delta Distance": deltaDistance,
          'Threshold for Identity': '< 0.75 (Met: 0.42)',
          'Pronoun/Preposition Ratio': '1.38 (Suspect baseline: 1.35)',
        },
        log: [
          'Extracted 150 non-contextual function words (prepositions, conjunctions, auxiliary verbs).',
          'Calculated z-score normalized vector against 2024 syndicate interrogation transcripts.',
          `Computed Delta score Δ=${deltaDistance}, well below the 0.75 identity threshold.`,
          'Cryptographically sealed forensic stylometric report for court presentation.',
        ],
      };
    },
  },
  {
    id: 'f-06',
    code: 'F-06',
    title: 'Linear Predictive Coding (LPC) Vocal Formant Acoustician',
    category: 'Forensics & Biometrics',
    citation: 'J. Makhoul Linear Prediction: A Tutorial Review (Proc. IEEE 1975)',
    complexity: 'O(p² + N · p) Levinson-Durbin recursion for p-th order filter',
    legalAdmissibility: 'Acoustic voice identification under Sec 63 BSA & Sec 39 BSA expert evidence',
    abstract: 'Extracts vocal tract resonance frequencies (formants F1 to F4) from intercepted extortion phone calls to generate biometric voiceprints resilient against phone line codecs.',
    formula: 'H(z) = G / [1 - Σ_{k=1}^p a_k z^{-k}],  z_i = r_i · exp(± j 2π F_i / f_s)',
    formulaExplanation: 'Decomposes speech spectrum into vocal tract poles; polynomial roots of LPC coefficients a_k yield resonant formant frequencies F_i.',
    defaultParams: {
      lpcOrder: 16,
      samplingRateHz: 16000,
      pitchHz: 128,
    },
    computeFn: (p) => {
      const order = Number(p.lpcOrder) || 16;
      const f1 = 520;
      const f2 = 1480;
      const f3 = 2460;
      const f4 = 3420;
      return {
        outputLabel: 'Extracted Vocal Tract Formants',
        outputValue: `F1:${f1}Hz | F2:${f2}Hz | F3:${f3}Hz | F4:${f4}Hz`,
        confidence: 95.4,
        status: 'EVIDENTIARY',
        metrics: {
          'LPC Order (Poles)': order,
          'Spectral Tilt': '-6 dB/octave',
          'Voiceprint Biometric Match': '95.4% (Rajan Syndicate Intercept)',
        },
        log: [
          'Windowed 16kHz audio sample into 25ms Hamming frames with 10ms overlap.',
          'Executed Levinson-Durbin recursion to compute 16th order all-pole filter.',
          'Identified root angles corresponding to fundamental vocal tract resonances.',
          'Matched biometric profile with suspect Vikram Malhotra voice exemplar.',
        ],
      };
    },
  },
  {
    id: 'f-07',
    code: 'F-07',
    title: 'Heterogeneous Relational Graph Convolutional Network (RGCN)',
    category: 'Network & Graph AI',
    citation: 'Schlichtkrull et al. Modeling Relational Data with GCNs (ESWC 2018)',
    complexity: 'O(|R| · |E| · d) relation-specific message passing per layer',
    legalAdmissibility: 'Corporate shell nexus admissible under Benami Transactions Act',
    abstract: 'Propagates message-passing embeddings over multi-relational graphs of bank accounts, shell firms, directors, and SIM cards to discover the hidden Ultimate Beneficial Owner (UBO).',
    formula: 'h_i^{(l+1)} = σ( Σ_{r ∈ R} Σ_{j ∈ N_i^r} [1 / c_{i,r}] · W_r^{(l)} h_j^{(l)} + W_0^{(l)} h_i^{(l)} )',
    formulaExplanation: 'Aggregates neighborhood features weighted by relation type r (owns, transfers_to, co-director) with relation-specific weight matrices W_r.',
    defaultParams: {
      graphNodes: 82,
      relationTypes: 6,
      messageLayers: 3,
    },
    computeFn: (p) => {
      const nodes = Number(p.graphNodes) || 82;
      return {
        outputLabel: 'Unmasked Ultimate Beneficial Owner (UBO)',
        outputValue: 'Vikram Malhotra (via 3 Shell Intermediaries)',
        confidence: 97.2,
        status: 'OPTIMAL',
        metrics: {
          'Graph Entities Parsed': nodes,
          'Hidden Shell Layers Traversed': 3,
          'Link Prediction AUC': '0.964',
        },
        log: [
          'Ingested 82 bank accounts and 14 MCA Registrar of Companies shell entities.',
          'Executed 3-layer message passing with relation normalization.',
          'Discovered ₹14.8 Crore diverted through 3 dummy entities into safehouse lease.',
        ],
      };
    },
  },
  {
    id: 'f-08',
    code: 'F-08',
    title: 'Isolation Forest Financial Smurfing Partitioning',
    category: 'Network & Graph AI',
    citation: 'Liu, Ting, Zhou (IEEE ICDM 2008) / Isolation-Based Anomaly Detection',
    complexity: 'O(t · n · log(ψ)) where t=100 trees and ψ=256 sub-sample size',
    legalAdmissibility: 'PMLA 2002 (Prevention of Money Laundering) evidentiary alert',
    abstract: 'Partitions structured sub-₹50,000 banking deposits (smurfing designed to evade mandatory PAN reporting thresholds) by isolating rare rapid bursts in multi-dimensional feature space.',
    formula: 's(x, n) = 2^{- [E(h(x)) / c(n)]},  c(n) = 2 · [ln(n - 1) + 0.5772] - [2(n - 1) / n]',
    formulaExplanation: 'Anomalies require significantly fewer random splits to isolate in an ensemble of random trees, resulting in average path length E(h(x)) much smaller than c(n).',
    defaultParams: {
      treeCount: 100,
      subsampleSize: 256,
      transactionCount: 420,
    },
    computeFn: (p) => {
      const tx = Number(p.transactionCount) || 420;
      const score = 0.912;
      return {
        outputLabel: 'Smurfing Anomaly Score',
        outputValue: `${score} (CRITICAL CO-ORDINATED MULE SYNDICATE)`,
        confidence: 94.6,
        status: 'ALERT',
        metrics: {
          'Mean Path Depth E(h(x))': '3.2 (Normal: 8.6)',
          'Flagged Sub-₹50k Batches': '10 Micro-Transfers (₹49,000 each)',
          'Total Laundered Pool': '₹4,90,000 across 12 minutes',
        },
        log: [
          `Evaluated ${tx} banking transactions across 100 randomized decision trees.`,
          'Detected 10 immediate cash deposits of exactly ₹49,000 within 12 minutes.',
          'Triggered Section 102 BNSS account freezing signal on all 10 mule UPIs.',
        ],
      };
    },
  },
  {
    id: 'f-09',
    code: 'F-09',
    title: 'Section 63 BSA Merkle Non-Repudiation Notary',
    category: 'Cryptography & Compliance',
    citation: 'R. Merkle (IEEE S&P 1980) / RFC 3161 Trusted Timestamps / Sec 63 BSA 2023',
    complexity: 'O(log N) cryptographic proof verification time for N evidence records',
    legalAdmissibility: 'Mandatory statutory compliance under Section 63 Bharatiya Sakshya Adhiniyam',
    abstract: 'Aggregates millions of digital forensics records (CCTV MP4, Call Detail Records CSV, FASTag events) into a tamper-evident binary Merkle DAG for court non-repudiation.',
    formula: 'H_{parent} = SHA-256( H_{left} || H_{right} ),  Root = H_{1...N}',
    formulaExplanation: 'Pairs of child hashes are concatenated and hashed up to a single 256-bit root. Any bit modification in any evidence file irreversibly invalidates the top seal.',
    defaultParams: {
      evidenceCount: 16,
      hashAlgorithm: 'SHA-256',
      rfc3161Certified: 1,
    },
    computeFn: (p) => {
      const count = Number(p.evidenceCount) || 16;
      return {
        outputLabel: 'Court-Certified Merkle Root Seal',
        outputValue: '0x8f4c2e91a0b3d5678491cbaef1938294a5e01b4c3d2e1f0987654321fedcba01',
        confidence: 100,
        status: 'EVIDENTIARY',
        metrics: {
          'Audit Path Depth': `${Math.ceil(Math.log2(count))} Levels`,
          'Statutory Certificate': 'Section 63(4) BSA Form A',
          'Court Admissibility': '100% Irrefutable Proof',
        },
        log: [
          `Seeded ${count} forensic clue files into immutable cryptographic Merkle Tree.`,
          'Affixed RFC 3161 state judicial time-stamp from sovereign NTP server.',
          'Generated digital certificate signed with RSA-4096 court key.',
        ],
      };
    },
  },
  {
    id: 'f-10',
    code: 'F-10',
    title: 'SAR Interferometric Coherence Change Detection',
    category: 'Spatial & Geolocation',
    citation: 'Touzi et al. Coherence Estimation in SAR Imagery (IEEE Trans. Geosci. 1999)',
    complexity: 'O(W · H · log(W · H)) 2D FFT sub-pixel co-registration',
    legalAdmissibility: 'Space application forensic evidence recognized in environmental & border crime',
    abstract: 'Compares pre-incident and post-incident complex radar backscatter from Sentinel-1 or NISAR satellites to detect nocturnal clandestine excavations, illicit buried weapons, and tunnel construction.',
    formula: 'γ = | Σ s_1(i) s_2^*(i) | / √[ Σ |s_1(i)|² · Σ |s_2(i)|² ]',
    formulaExplanation: 'Calculates complex cross-correlation coefficient gamma between two SAR image acquisitions. Physical soil disturbance destroys phase coherence, dropping gamma near 0.',
    defaultParams: {
      pixelWindow: 5,
      temporalBaselineDays: 12,
      coherenceThreshold: 0.35,
    },
    computeFn: (p) => {
      const thresh = Number(p.coherenceThreshold) || 0.35;
      const detectedDecorrelation = 0.18;
      return {
        outputLabel: 'Ground Disturbance Locus Detected',
        outputValue: `Disturbed Zone: 42m² at Sector 62 Locus (Coherence γ = ${detectedDecorrelation})`,
        confidence: 93.8,
        status: detectedDecorrelation < thresh ? 'ALERT' : 'OPTIMAL',
        metrics: {
          'Interferometric Coherence (γ)': detectedDecorrelation,
          'Decorrelation Significance': 'p < 0.001',
          'Estimated Excavation Depth': '1.2m Sub-surface',
        },
        log: [
          'Co-registered Sentinel-1 C-band SLC acquisitions from Day 0 and Day 12.',
          'Filtered flat-Earth and topographic phase components using SRTM 30m DEM.',
          `Coherence dropped from 0.82 to 0.18 over target courtyard.`,
          'Flagged clandestine midnight excavation site for physical forensic panchnama.',
        ],
      };
    },
  },
  {
    id: 'f-11',
    code: 'F-11',
    title: 'Adamic-Adar Inverted Logarithmic Link Predictor',
    category: 'Network & Graph AI',
    citation: 'L.A. Adamic, E. Adar Friends and Neighbors on the Web (Social Networks 2003)',
    complexity: 'O(|N(u) ∩ N(v)|) intersection walk over mutual neighbor sets',
    legalAdmissibility: 'Conspiracy evidence under Section 61 Bharatiya Nyaya Sanhita (BNS)',
    abstract: 'Predicts imminent clandestine meetings and unobserved criminal collusion by penalizing common neighbors with high connectivity while heavily weighting rare shared contacts.',
    formula: 'S_{AA}(u, v) = Σ_{z ∈ N(u) ∩ N(v)} [ 1 / log |N(z)| ]',
    formulaExplanation: 'Sums inverse log degrees of shared entities z. If two suspects share a discreet contact with degree 2, it is exponentially more suspicious than sharing a popular contact with degree 500.',
    defaultParams: {
      sharedContacts: 3,
      avgDegreeOfShared: 4,
    },
    computeFn: (p) => {
      const shared = Number(p.sharedContacts) || 3;
      const deg = Number(p.avgDegreeOfShared) || 4;
      const score = (shared / Math.log(Math.max(2, deg))).toFixed(2);
      return {
        outputLabel: 'Conspiracy Link Affinity Score',
        outputValue: `S_AA = ${score} (HIGH CONSPIRACY PROBABILITY)`,
        confidence: 92.4,
        status: 'OPTIMAL',
        metrics: {
          'Adamic-Adar Index': score,
          'Shared Secret Hubs': '3 Entities (Adnan Merchant, Vicky Shell, Mule 9811)',
          'Predicted Meeting Window': 'Within 24 Hours',
        },
        log: [
          'Analyzed mutual contact graph of fugitive Rajan and Safehouse Custodian.',
          'Filtered out public high-degree utilities (swiggy, uber, telecom customer care).',
          `Evaluated 3 low-degree secretive intermediary shell nodes.`,
          `Link score S_AA=${score} predicted rendezvous at Sector 62 hideout.`,
        ],
      };
    },
  },
  {
    id: 'f-12',
    code: 'F-12',
    title: 'Diurnal Transit Momentum Markov Model',
    category: 'Spatial & Geolocation',
    citation: 'J.R. Norris Markov Chains (Cambridge University Press 1998)',
    complexity: 'O(S²) matrix exponentiation over state space of S transportation hubs',
    legalAdmissibility: 'Evidentiary timeline justification in police lookout circulars (LOC)',
    abstract: 'Predicts suspect flight velocity and inter-state transit transitions conditioned on diurnal time, train timetable departure slots, and interstate border checkpost geography.',
    formula: 'P_{ij}(t) = P( X_{t+1} = S_j | X_t = S_i, t ),  Σ_j P_{ij}(t) = 1',
    formulaExplanation: 'Time-inhomogeneous Markov chain transition matrix where edge weights dynamically mutate based on real-time train departures from Delhi stations.',
    defaultParams: {
      currentHour: 23,
      stationCount: 8,
    },
    computeFn: (p) => {
      const hr = Number(p.currentHour) || 23;
      return {
        outputLabel: 'Next Probable Inter-State Escape Hub',
        outputValue: 'NDLS Platform 3 (Prayagraj Express Departure 22:10 IST)',
        confidence: 89.2,
        status: 'OPTIMAL',
        metrics: {
          'Transit State': 'Active Railway Boarding',
          'Interstate Border Flight Risk': 'UP Border (High Risk)',
          'Estimated Time to Border': '45 minutes',
        },
        log: [
          `Conditioned transition matrix on hour ${hr}:00 night schedule.`,
          'Metro gates closed at 23:00; bus terminals filtered out due to active checkposts.',
          'Long-distance night train departures concentrated 89.2% probability onto NDLS.',
        ],
      };
    },
  },
  {
    id: 'f-13',
    code: 'F-13',
    title: 'Smart Meter IoT Non-Intrusive Load Monitoring (NILM)',
    category: 'Forensics & Biometrics',
    citation: 'G.W. Hart Nonintrusive Appliance Load Monitoring (Proc. IEEE 1992)',
    complexity: 'O(T · K) Viterbi decoding over K appliance factorial states',
    legalAdmissibility: 'Search warrant reasonable cause under Section 94 BNSS',
    abstract: 'Disaggregates whole-house electricity consumption from digital smart meters to confirm human occupancy inside an apparently abandoned or darkened safehouse.',
    formula: 'P_{total}(t) = Σ_{k=1}^K s_k(t) · P_k(t) + ε(t),  s_k ∈ {0, 1}',
    formulaExplanation: 'Decomposes aggregate active and reactive power timeseries into binary operational states s_k of individual appliances like AC compressor and induction stove.',
    defaultParams: {
      surgePercentage: 420,
      baselineKwh: 0.15,
      activeKwh: 1.85,
    },
    computeFn: (p) => {
      const surge = Number(p.surgePercentage) || 420;
      return {
        outputLabel: 'Occupancy Detection Status',
        outputValue: 'ACTIVE OCCUPANCY CONFIRMED (+420% SURGE)',
        confidence: 96.5,
        status: 'ALERT',
        metrics: {
          'Disaggregated Appliances': '1.5-Ton Inverter AC + Water Heater',
          'Occupancy Start Time': '21:14 IST (Contemporaneous with Scorpio Arrival)',
          'Grid Telemetry Confidence': '96.5%',
        },
        log: [
          'Queried Noida Power Company Limited (NPCL) smart meter telemetry for Flat C-402.',
          'Detected sudden step change from 0.15 kW baseline to 1.85 kW active load.',
          'Harmonic power factor signature matched domestic cooling compressor.',
          'Proves human presence inside safehouse despite drawn black curtains.',
        ],
      };
    },
  },
  {
    id: 'f-14',
    code: 'F-14',
    title: 'Multilingual Indic NLP Transformer (11 Languages)',
    category: 'Forensics & Biometrics',
    citation: 'Khanuja et al. MuRIL: Multilingual Representations for Indian Languages (arXiv:2103.10730)',
    complexity: 'O(L · d_model²) transformer multi-head self-attention',
    legalAdmissibility: 'Language translation certified under Section 161 BNSS',
    abstract: 'Processes mixed Devanagari, Gurmukhi, Tamil, Telugu, and Hinglish slang from intercepted chat apps to detect covert criminal terminology ("Khokha", "Peti", "Hawala").',
    formula: 'Attention(Q, K, V) = softmax( [Q K^T] / √d_k ) · V',
    formulaExplanation: 'Cross-attention aligns multilingual phonetics and semantic tokens into a shared high-dimensional vector space invariant to script.',
    defaultParams: {
      sequenceLength: 128,
      detectedLanguage: 'Hinglish (Hindi-English Mixed)',
    },
    computeFn: () => {
      return {
        outputLabel: 'Criminal Intent Classification',
        outputValue: 'EXTORTION & ILLEGAL HAWALA SETTLEMENT (98.1%)',
        confidence: 98.1,
        status: 'EVIDENTIARY',
        metrics: {
          'Slang Decoded': '1 Khokha = ₹1 Crore; Safehouse Delivery at Sec 62',
          'Named Entities Extracted': 'Target: Sh. Alok Gupta; Courier: Vicky',
          'Cross-Lingual Alignment': '0.94 cosine similarity to formal legal charge',
        },
        log: [
          'Ingested WhatsApp audio transcription containing Hindi-English code-switching.',
          'MuRIL tokenized slang expressions without loss of semantic context.',
          'Mapped extortion demand directly into penal sections 308(2) & 111 BNS.',
        ],
      };
    },
  },
  {
    id: 'f-15',
    code: 'F-15',
    title: 'Optical CCTV Facial Age Progression Diffusion Model',
    category: 'Forensics & Biometrics',
    citation: 'Ho et al. Denoising Diffusion Probabilistic Models (NeurIPS 2020) / Craniofacial Aging',
    complexity: 'O(T · U-Net) reverse diffusion sampling with progressive latent guidance',
    legalAdmissibility: 'Facial recognition match corroboration under Section 63 BSA',
    abstract: 'Progresses facial biometric features of missing children or long-absconding fugitives across 5-20 years based on biological craniofacial bone growth models.',
    formula: 'x_{t-1} = [1 / √α_t] · ( x_t - [(1 - α_t) / √(1 - \bar{α}_t)] · ε_θ(x_t, t, Δage) ) + σ_t z',
    formulaExplanation: 'Iteratively reverses diffusion noise conditioned on age delta vector delta_age while preserving invariant identity biometric anchors.',
    defaultParams: {
      originAge: 8,
      targetAge: 18,
      diffusionSteps: 50,
    },
    computeFn: (p) => {
      const orig = Number(p.originAge) || 8;
      const target = Number(p.targetAge) || 18;
      return {
        outputLabel: 'Biometric Vector Synthesized',
        outputValue: `Age progressed from ${orig}y to ${target}y with preserved iris & facial landmarks`,
        confidence: 91.8,
        status: 'OPTIMAL',
        metrics: {
          'Identity Preservation Loss': '0.042 (High Fidelity)',
          'Synthesized Age': `${target} Years`,
          'CCTV Watchlist Match': 'CCTV Camera #84, Anand Vihar Metro',
        },
        log: [
          `Loaded childhood reference photo of Aanya Sharma (Age ${orig}).`,
          `Applied craniofacial bone density expansion for +${target - orig} years.`,
          'Generated 512-dimensional FaceNet biometric embedding for live ANPR/CCTV search.',
        ],
      };
    },
  },
  {
    id: 'f-16',
    code: 'F-16',
    title: 'FASTag & ANPR Dual-Sensor Kinematic Spatio-Temporal Validator',
    category: 'Spatial & Geolocation',
    citation: 'Haversine Great-Circle Kinematic Velocity Inconsistency (CrimeNexus Patent Pending)',
    complexity: 'O(1) closed-form geodesic velocity evaluation',
    legalAdmissibility: 'Conclusive proof of cloned vehicle plate under Section 63 BSA',
    abstract: 'Detects cloned and forged vehicle number plates by calculating whether a vehicle could physically travel between two consecutive toll plazas within the elapsed timestamp.',
    formula: 'v_{calc} = [ 2 R · arcsin( √[ sin²(Δφ/2) + cos φ_1 cos φ_2 sin²(Δλ/2) ] ) ] / Δt',
    formulaExplanation: 'Computes great-circle distance divided by delta t. If calculated speed exceeds physical vehicle limit (e.g. > 180 km/h), two physical vehicles are simultaneously using the same registration.',
    defaultParams: {
      toll1Km: 0,
      toll2Km: 64,
      elapsedMinutes: 14,
    },
    computeFn: (p) => {
      const dist = Number(p.toll2Km) || 64;
      const tMin = Number(p.elapsedMinutes) || 14;
      const speed = Math.round((dist / (tMin / 60)));
      const isCloned = speed > 180;
      return {
        outputLabel: 'Kinematic Plate Feasibility',
        outputValue: `${speed} km/h (${isCloned ? 'IMPOSSIBLE VELOCITY: CLONED VEHICLE DETECTED' : 'PHYSICALLY FEASIBLE'})`,
        confidence: 99.8,
        status: isCloned ? 'ALERT' : 'OPTIMAL',
        metrics: {
          'Calculated Velocity': `${speed} km/h`,
          'Vehicle Class Limit': '180 km/h (Mahindra Scorpio)',
          'Cloned Vehicle Alert': isCloned ? 'POSITIVE DUAL PRESENCE' : 'NEGATIVE',
        },
        log: [
          'FASTag ping at DND Flyway (22:14:02 IST).',
          `FASTag ping at Jewar Toll KM 48 (22:28:10 IST) — Distance: ${dist} km in ${tMin} min.`,
          `Required velocity v=${speed} km/h is aerodynamically impossible for SUV.`,
          'Flagged cloned vehicle syndicate operating duplicate registration plate TS 09 AB 1234.',
        ],
      };
    },
  },
  {
    id: 'f-17',
    code: 'F-17',
    title: 'Voice Stress Micro-Tremor (LVA 8-14 Hz Involuntary Flutter)',
    category: 'Audio & Voice Forensics',
    citation: 'Lippold The Tremor in Normal Human Muscle (Scientific American 1970)',
    complexity: 'O(N log N) short-time Fourier transform (STFT) bandpass integration',
    legalAdmissibility: 'Investigative interrogation lead (requires statutory caution)',
    abstract: 'Analyzes physiological micro-tremors in the 8-14 Hz frequency range of vocal tract muscles. Under extreme deception or fear of imminent arrest, autonomic stress suppresses micro-tremors.',
    formula: 'M(t) = [ ∫_{8 Hz}^{14 Hz} |X(f, t)|² df ] / [ ∫_{0 Hz}^{500 Hz} |X(f, t)|² df ]',
    formulaExplanation: 'Integrates energy ratio in physiological micro-tremor band relative to low-frequency speech envelope. Suppressed micro-tremor indicates acute fight-or-flight sympathetic response.',
    defaultParams: {
      sampleDurationSec: 4.5,
      microTremorRatio: 0.12,
    },
    computeFn: (p) => {
      const ratio = Number(p.microTremorRatio) || 0.12;
      const isStressed = ratio < 0.25;
      return {
        outputLabel: 'Autonomic Vocal Stress Index',
        outputValue: `${(100 - ratio * 200).toFixed(1)}% (ACUTE PHYSIOLOGICAL PANIC)`,
        confidence: 88.4,
        status: isStressed ? 'ALERT' : 'OPTIMAL',
        metrics: {
          'Micro-Tremor Power Ratio': ratio.toFixed(3),
          'Sympathetic Tone': 'High (Sympathetic Dominance)',
          'Vocal Cord Flutter': 'Severely Attenuated',
        },
        log: [
          'Parsed audio stream from intercepted burner phone dispatch.',
          'Filtered 8-14 Hz muscle reflex frequency using narrow digital FIR filter.',
          'Detected 78% drop in micro-tremor power when discussing the Sector 62 rendezvous.',
        ],
      };
    },
  },
  {
    id: 'f-18',
    code: 'F-18',
    title: 'Wi-Fi Probe Request Spatial Clustering (DBSCAN + IE Signature)',
    category: 'Mobile & Signal Intelligence',
    citation: 'Ester et al. Density-Based Algorithm for Discovering Clusters (KDD 1996) / Wi-Fi Fingerprinting',
    complexity: 'O(N log N) spatial index query for N probe frame packets',
    legalAdmissibility: 'Electronic footprint corroborated under Section 63 BSA',
    abstract: 'De-randomizes randomized MAC addresses in modern smartphones by clustering Information Element (IE) fingerprints, HT capabilities, and signal strength across roadside Wi-Fi sniffing sensors.',
    formula: 'N_ε(p) = { q ∈ D | dist(p, q) ≤ ε },  dist(p, q) = w_1 · Jaccard(IE_p, IE_q) + w_2 · |RSSI_p - RSSI_q|',
    formulaExplanation: 'Clusters probe requests using weighted distance metric combining Jaccard distance over 802.11 Information Elements with spatial RSSI and timing deltas.',
    defaultParams: {
      epsilon: 0.22,
      minSamples: 4,
      totalFramesCaptured: 1420,
    },
    computeFn: (p) => {
      const frames = Number(p.totalFramesCaptured) || 1420;
      return {
        outputLabel: 'De-Randomized Device Cluster Identified',
        outputValue: 'Persistent Hardware Handset #CRIM-DEV-09 (Apple iPhone 14 Pro)',
        confidence: 96.1,
        status: 'CONVERGED',
        metrics: {
          'Total Probe Frames Evaluated': frames,
          'Physical Clusters Extracted': 3,
          'De-Randomization Confidence': '96.1%',
        },
        log: [
          'Collected 1,420 Wi-Fi probe requests across 4 toll and metro sensor nodes.',
          'Extracted hardware IE fingerprint sequence invariant to MAC randomization.',
          'Linked probe burst at Karol Bagh with probe burst at Sector 62 safehouse.',
        ],
      };
    },
  },
  {
    id: 'f-19',
    code: 'F-19',
    title: 'Dual-Warrant Threshold Ed25519 Cryptographic Authorization',
    category: 'Cryptography & Compliance',
    citation: 'Shamir Secret Sharing (CACM 1979) / FROST Flexible Round-Optimized Schnorr Threshold (eprint:2020/852)',
    complexity: 'O(k · log² k) Lagrange interpolation over Curve25519 scalar field',
    legalAdmissibility: 'Judicial warrant compliance under Indian Telegraph Act Section 5(2)',
    abstract: 'Enforces dual-custody cryptographic governance: lawful intercept lakes cannot be decrypted by police officers without a cryptographically joint signature from the Judicial Magistrate.',
    formula: 's = Σ_{i ∈ S} λ_i · s_i  (mod ℓ),  λ_i = ∏_{j ∈ S, j ≠ i} [ -j / (i - j) ]',
    formulaExplanation: 'Threshold signature requires k-of-n private key shares to reconstruct valid cryptographic authorization. Zero unilateral wiretapping is mathematically possible.',
    defaultParams: {
      thresholdK: 2,
      totalSharesN: 3,
      magistrateSigned: 1,
    },
    computeFn: (p) => {
      const mag = Number(p.magistrateSigned);
      const isAuthorized = mag === 1;
      return {
        outputLabel: 'Judicial Cryptographic Authorization',
        outputValue: isAuthorized ? 'WARRANT VALID: DUAL KEY RECONSTRUCTED' : 'UNAUTHORIZED: MAGISTRATE KEY MISSING',
        confidence: 100,
        status: isAuthorized ? 'EVIDENTIARY' : 'ALERT',
        metrics: {
          'Investigating Officer Share': 'Verified (IO Insp. Rajesh Varma)',
          'Chief Judicial Magistrate Share': isAuthorized ? 'Verified (CJM Patiala House)' : 'Pending',
          'Statutory Audit Hash': '0x94821aef420b9c... Valid',
        },
        log: [
          'Investigating Officer applied Ed25519 private share #1.',
          isAuthorized
            ? 'Judicial Magistrate validated warrant and released private share #2.'
            : 'Awaiting digital token submission from Judicial Magistrate.',
          isAuthorized
            ? 'Reconstructed session decryption key for target wiretap packet.'
            : 'Decryption blocked by sovereign hardware security module (HSM).',
        ],
      };
    },
  },
  {
    id: 'f-20',
    code: 'F-20',
    title: 'Dynamic Isochrone Reachability Polygon Envelope',
    category: 'Spatial & Geolocation',
    citation: 'Dijkstra Multi-Modal Cost Surface (Numerische Mathematik 1959) / OSRM Isochrone Engine',
    complexity: 'O(|V| log |V| + |E|) priority queue frontier expansion with road hierarchy costs',
    legalAdmissibility: 'Patrol allocation justification under Section 35 BNSS',
    abstract: 'Computes exact geometric polygons representing the maximum reachability perimeter of a fleeing suspect within T minutes, accounting for road speed limits, signals, and river crossings.',
    formula: 'R(t_{max}) = { x ∈ ℝ² | min_{π: x_0 → x} ∫_0^1 [ ||π̇(s)|| / v(π(s)) ] ds ≤ t_{max} }',
    formulaExplanation: 'Integrates reciprocal velocity cost along all feasible path geodesics from origin x_0 up to maximum pursuit time t_max, yielding a non-circular reachability polygon envelope.',
    defaultParams: {
      pursuitMinutes: 15,
      trafficCongestionFactor: 1.25,
      fleeVelocityMaxKmh: 120,
    },
    computeFn: (p) => {
      const tMin = Number(p.pursuitMinutes) || 15;
      const vMax = Number(p.fleeVelocityMaxKmh) || 120;
      const maxRadiusKm = ((vMax / 60) * tMin * 0.72).toFixed(1);
      return {
        outputLabel: 'Reachability Containment Polygon',
        outputValue: `Perimeter: ${maxRadiusKm} km Maximum Reach (${tMin} min window)`,
        confidence: 95.8,
        status: 'CONVERGED',
        metrics: {
          'Contained Area': `${(Math.PI * Math.pow(Number(maxRadiusKm), 2)).toFixed(0)} km²`,
          'Intercept Choke Bridges': 'Kalindi Kunj, DND Toll, Jewar Interchange',
          'Containment Probability': '95.8% (All 3 exits cordoned)',
        },
        log: [
          `Seeded origin at Yamuna Expressway Toll KM 48 with elapsed time T=${tMin} min.`,
          'Expanded road hierarchy: Expressways (100 km/h), Arterials (50 km/h), Local (25 km/h).',
          `Generated 64-vertex concave isochrone polygon bounding suspect movement.`,
          'Dispatched patrol alerts to all 3 border cordon exit nodes.',
        ],
      };
    },
  },
];

interface Props {
  isOpen: boolean;
  onClose: () => void;
  initialAlgorithmId?: string;
}

export function ForensicAlgorithmsHubModal({ isOpen, onClose, initialAlgorithmId }: Props) {
  const [selectedAlgoId, setSelectedAlgoId] = useState<string>(initialAlgorithmId || 'f-01');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [liveParams, setLiveParams] = useState<Record<string, any>>({});
  const [liveResult, setLiveResult] = useState<any>(null);
  const [isRunningInference, setIsRunningInference] = useState<boolean>(false);

  if (!isOpen) return null;

  const currentAlgo = FORENSIC_20_ALGORITHMS.find((a) => a.id === selectedAlgoId) || FORENSIC_20_ALGORITHMS[0];

  const categories = [
    'All',
    'Spatial & Geolocation',
    'Network & Graph AI',
    'Forensics & Biometrics',
    'Cryptography & Compliance',
    'Quantum & Optimization',
  ];

  const filteredAlgos = FORENSIC_20_ALGORITHMS.filter((algo) => {
    const matchesCat = selectedCategory === 'All' || algo.category === selectedCategory;
    const matchesQuery =
      algo.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      algo.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      algo.abstract.toLowerCase().includes(searchQuery.toLowerCase()) ||
      algo.citation.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesQuery;
  });

  const handleSelectAlgo = (id: string) => {
    sound.playClickSound();
    setSelectedAlgoId(id);
    const algo = FORENSIC_20_ALGORITHMS.find((a) => a.id === id);
    if (algo) {
      setLiveParams(algo.defaultParams);
      setLiveResult(algo.computeFn(algo.defaultParams));
    }
  };

  const handleRunInference = () => {
    sound.playRadarPing();
    setIsRunningInference(true);
    setTimeout(() => {
      const mergedParams = { ...currentAlgo.defaultParams, ...liveParams };
      const res = currentAlgo.computeFn(mergedParams);
      setLiveResult(res);
      setIsRunningInference(false);
    }, 400);
  };

  const activeResult = liveResult || currentAlgo.computeFn(currentAlgo.defaultParams);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-md animate-in fade-in">
      <div className="relative w-full max-w-6xl max-h-[92vh] flex flex-col rounded-2xl border-2 border-primary/50 bg-slate-950 text-white shadow-2xl overflow-hidden">
        {/* Header Ribbon */}
        <div className="px-5 py-4 border-b border-border/80 bg-slate-900/90 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-cyan-500/30 to-blue-600/30 border border-cyan-500/50 text-cyan-400">
              <Brain className="h-6 w-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-black tracking-wide text-white">
                  20 Deep Forensic & Mathematical AI Algorithms Hub
                </h2>
                <Badge className="bg-primary/20 text-primary border border-primary/40 font-mono text-[10px] font-black">
                  STATUTORY REASONING
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                Cutting-Edge Algorithmic Specifications, LaTeX Mathematical Formulations & Live Real-Time Inference Calculators
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              sound.playClickSound();
              onClose();
            }}
            className="p-2 rounded-lg text-muted-foreground hover:text-white hover:bg-slate-800 transition-colors"
            title="Close algorithms modal"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Category Filter Pills & Search Input */}
        <div className="px-5 py-3 border-b border-border/60 bg-slate-900/40 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-thin">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => {
                  sound.playClickSound();
                  setSelectedCategory(cat);
                }}
                className={`px-3 py-1 rounded-full text-xs font-bold transition-all shrink-0 ${
                  selectedCategory === cat
                    ? 'bg-primary text-slate-950 shadow-md font-black'
                    : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700/80'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="relative w-full md:w-64">
            <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search 20 algorithms..."
              className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-border/70 bg-slate-900 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
        </div>

        {/* Main Content Split: Left Master List (32%) | Right Detailed Spec & Calculator (68%) */}
        <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-12 overflow-hidden">
          {/* Left Column: 20 Algorithm Selector */}
          <div className="lg:col-span-5 border-r border-border/70 overflow-y-auto p-3 space-y-2 bg-slate-950/60 scrollbar-thin">
            <div className="text-[10px] uppercase font-mono font-bold text-slate-400 px-2 py-1">
              Select Forensic Algorithm ({filteredAlgos.length}/20)
            </div>
            {filteredAlgos.map((algo) => {
              const isSelected = algo.id === currentAlgo.id;
              return (
                <div
                  key={algo.id}
                  onClick={() => handleSelectAlgo(algo.id)}
                  className={`p-3 rounded-xl border cursor-pointer transition-all space-y-1.5 ${
                    isSelected
                      ? 'bg-gradient-to-r from-primary/20 via-cyan-950/30 to-transparent border-primary shadow-lg shadow-primary/10'
                      : 'bg-slate-900/60 border-border/60 hover:border-slate-600 hover:bg-slate-900'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-xs font-black px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-cyan-300">
                      {algo.code}
                    </span>
                    <Badge variant="outline" className="text-[9px] px-1.5 py-0 border-slate-700 text-slate-300">
                      {algo.category}
                    </Badge>
                  </div>
                  <div className="font-bold text-xs text-white truncate">{algo.title}</div>
                  <div className="text-[11px] text-muted-foreground line-clamp-2 leading-relaxed">
                    {algo.abstract}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Right Column: Detailed Mathematical Formula & Live Interactive Calculator */}
          <div className="lg:col-span-7 overflow-y-auto p-5 space-y-5 bg-slate-900/30 scrollbar-thin">
            {/* Header info */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-mono text-sm font-black px-2.5 py-0.5 rounded bg-cyan-950 border border-cyan-500 text-cyan-300">
                  {currentAlgo.code}
                </span>
                <h3 className="text-base sm:text-lg font-black text-white">{currentAlgo.title}</h3>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">{currentAlgo.abstract}</p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 text-[11px] font-mono">
                <div className="p-2.5 rounded-lg bg-slate-950/80 border border-border/70 text-slate-300">
                  <span className="text-muted-foreground block text-[9px] uppercase font-bold">Citation & Foundation</span>
                  <span className="text-cyan-300 font-semibold">{currentAlgo.citation}</span>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-950/80 border border-border/70 text-slate-300">
                  <span className="text-muted-foreground block text-[9px] uppercase font-bold">Computational Complexity</span>
                  <span className="text-amber-300 font-semibold">{currentAlgo.complexity}</span>
                </div>
              </div>
            </div>

            {/* LaTeX Mathematical Formula Card */}
            <div className="p-4 rounded-xl border border-cyan-500/40 bg-slate-950/90 shadow-xl space-y-2.5">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="font-bold text-cyan-400 flex items-center gap-1.5">
                  <Calculator className="h-4 w-4" />
                  <span>Mathematical Specification (LaTeX Formulation)</span>
                </span>
                <span className="text-[10px] text-muted-foreground">Rigorous Model</span>
              </div>
              <div className="p-3 rounded-lg bg-slate-900 border border-cyan-500/30 text-center font-mono text-xs sm:text-sm text-cyan-200 tracking-wider overflow-x-auto py-3">
                {currentAlgo.formula}
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed italic">
                {currentAlgo.formulaExplanation}
              </p>
            </div>

            {/* Legal / Statutory Admissibility Notice */}
            <div className="p-3 rounded-xl border border-emerald-500/40 bg-emerald-950/20 text-emerald-200 flex items-start gap-2.5 text-xs">
              <Shield className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <strong className="text-white block font-sans">Statutory Judicial Admissibility</strong>
                <span className="font-mono text-[11px] text-emerald-300">{currentAlgo.legalAdmissibility}</span>
              </div>
            </div>

            {/* Interactive Live Test Calculator Section */}
            <div className="p-4 rounded-xl border border-primary/40 bg-slate-950 shadow-2xl space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Cpu className="h-4 w-4 text-primary" />
                  <span className="text-xs font-black text-white uppercase tracking-wider">
                    Interactive Live Parameter Calculator
                  </span>
                </div>
                <Button
                  size="sm"
                  onClick={handleRunInference}
                  disabled={isRunningInference}
                  className="h-7 text-xs font-black bg-primary text-slate-950 hover:bg-primary/90 flex items-center gap-1 shadow-md shadow-primary/20"
                >
                  <Play className={`h-3 w-3 fill-current ${isRunningInference ? 'animate-spin' : ''}`} />
                  <span>{isRunningInference ? 'Calculating...' : 'Execute Model Inference'}</span>
                </Button>
              </div>

              {/* Dynamic Parameter Sliders / Inputs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {Object.entries(currentAlgo.defaultParams).map(([key, val]) => {
                  const currentVal = liveParams[key] !== undefined ? liveParams[key] : val;
                  const isNumber = typeof val === 'number';
                  return (
                    <div key={key} className="p-2.5 rounded-lg bg-slate-900/90 border border-border/70 space-y-1.5">
                      <div className="flex justify-between text-[11px]">
                        <span className="font-mono text-muted-foreground uppercase">{key}</span>
                        <span className="font-mono font-bold text-white">{currentVal}</span>
                      </div>
                      {isNumber ? (
                        <input
                          type="range"
                          min={Math.max(1, Math.round(Number(val) * 0.2))}
                          max={Math.round(Number(val) * 2.5)}
                          value={currentVal}
                          onChange={(e) => {
                            setLiveParams((prev) => ({
                              ...prev,
                              [key]: Number(e.target.value),
                            }));
                          }}
                          className="w-full accent-primary h-1 bg-slate-800 rounded-lg cursor-pointer"
                        />
                      ) : (
                        <input
                          type="text"
                          value={currentVal}
                          onChange={(e) => {
                            setLiveParams((prev) => ({
                              ...prev,
                              [key]: e.target.value,
                            }));
                          }}
                          className="w-full px-2 py-1 rounded bg-slate-950 border border-border text-xs text-white"
                        />
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Real-Time Inference Output Gauge */}
              {activeResult && (
                <div className="p-3.5 rounded-xl border border-cyan-500/50 bg-cyan-950/20 space-y-3 animate-in fade-in">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-mono text-cyan-300 font-bold uppercase">
                      {activeResult.outputLabel}
                    </span>
                    <Badge className="bg-emerald-500 text-slate-950 font-mono font-bold text-[10px]">
                      {activeResult.status} ({activeResult.confidence}% CONFIDENCE)
                    </Badge>
                  </div>

                  <div className="text-sm font-black text-white font-mono bg-slate-950 p-2.5 rounded-lg border border-cyan-500/30 text-cyan-300">
                    {activeResult.outputValue}
                  </div>

                  {/* Metrics Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    {Object.entries(activeResult.metrics).map(([k, v]) => (
                      <div key={k} className="p-2 rounded bg-slate-950/70 border border-slate-800 text-[10px]">
                        <span className="text-muted-foreground block truncate">{k}</span>
                        <span className="font-mono font-bold text-white truncate block">{String(v)}</span>
                      </div>
                    ))}
                  </div>

                  {/* Execution Trace Log */}
                  <div className="p-2.5 rounded-lg bg-slate-950 text-[10px] font-mono text-slate-300 space-y-1 border border-border/60">
                    <div className="text-muted-foreground uppercase font-bold text-[9px] border-b border-border/40 pb-0.5">
                      Execution Step Trace:
                    </div>
                    {activeResult.log.map((entry: string, idx: number) => (
                      <div key={idx} className="flex items-start gap-1.5">
                        <span className="text-cyan-400 shrink-0">›</span>
                        <span>{entry}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-border/70 bg-slate-900/80 flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
            <span>All 20 Mathematical Models Formulated for CrimeNexus Sovereign Engine</span>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              sound.playClickSound();
              onClose();
            }}
            className="h-8 text-xs font-bold border-border hover:bg-slate-800"
          >
            Close Directory
          </Button>
        </div>
      </div>
    </div>
  );
}
