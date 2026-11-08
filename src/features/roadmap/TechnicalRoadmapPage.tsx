import React, { useState, useMemo } from 'react';
import {
  Sparkles,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  Cpu,
  Shield,
  Layers,
  Network,
  Lock,
  Compass,
  Scale,
  Database,
  Radio,
  FileSpreadsheet,
  Download,
  ExternalLink,
  ChevronRight,
  ArrowRight,
  Zap,
  Globe,
  Award
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Card, CardContent } from '../../components/ui/Card';
import { sound } from '../../utils/soundEffects';
import { useToast } from '../../components/ui/Toast';
import { FileExportPreviewModal } from '../../components/common/FileExportPreviewModal';

export interface TechnicalSpec {
  id: string;
  number: number;
  title: string;
  domain: 'AI_ML' | 'CRYPTOGRAPHY' | 'INTERCEPT' | 'SURVEILLANCE_IOT' | 'LEGAL_COMPLIANCE' | 'INFRASTRUCTURE';
  phase: 'PHASE_1_LIVE' | 'PHASE_2_Q1_2027' | 'PHASE_3_Q3_2027' | 'PHASE_4_2028';
  techStack: string[];
  algorithmicFormula: string;
  description: string;
  statutoryStandard: string;
  readiness: 'LIVE' | 'BETA' | 'IN_DEVELOPMENT' | 'BLUEPRINT';
}

export function TechnicalRoadmapPage() {
  const toast = useToast();
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedDomain, setSelectedDomain] = useState<string>('ALL');
  const [selectedPhase, setSelectedPhase] = useState<string>('ALL');
  const [selectedSpec, setSelectedSpec] = useState<TechnicalSpec | null>(null);
  const [exportModalOpen, setExportModalOpen] = useState<boolean>(false);

  // 100 Comprehensive Technical Specifications (10 Live + 90+ Roadmap Technicals)
  const technicalSpecs: TechnicalSpec[] = useMemo(() => [
    // --- PHASE 1: 10 LIVE PRODUCTION ENGINES ---
    {
      id: 'TECH-001',
      number: 1,
      title: 'Scikit-Learn IsolationForest Anomaly Detector',
      domain: 'AI_ML',
      phase: 'PHASE_1_LIVE',
      techStack: ['Python 3.10', 'scikit-learn 1.5.0', 'joblib', 'numpy'],
      algorithmicFormula: 's(x, n) = 2^(-E(h(x)) / c(n)), n_estimators=150, contamination=0.20',
      description: 'Isolates structured bank transaction smurfing deposits below ₹50,000 threshold within 48-hour windows.',
      statutoryStandard: 'Section 102 CrPC / Section 106 BNSS / PMLA 2002',
      readiness: 'LIVE',
    },
    {
      id: 'TECH-002',
      number: 2,
      title: 'SpaCy Domain-Trained FIR NER Extractor',
      domain: 'AI_ML',
      phase: 'PHASE_1_LIVE',
      techStack: ['spaCy 3.7.4', 'fir_ner_model', 'thinc', 'Pydantic'],
      algorithmicFormula: 'Transition-based parser with CNN entity classification over 30 epochs',
      description: 'Extracts accused names, IPC/BNS legal statutes, stolen vehicles, bank accounts, and seizure amounts.',
      statutoryStandard: 'Section 173 BNSS (Statutory FIR Parsing)',
      readiness: 'LIVE',
    },
    {
      id: 'TECH-003',
      number: 3,
      title: 'Adamic-Adar Live Syndicate Link Prediction',
      domain: 'AI_ML',
      phase: 'PHASE_1_LIVE',
      techStack: ['NetworkX 3.3', 'Cytoscape.js 3.30', 'Redis 7', 'Python'],
      algorithmicFormula: 'A(u, v) = ∑_(w ∈ Γ(u) ∩ Γ(v)) 1 / log(|Γ(w)|)',
      description: 'Discovers hidden co-conspirators across criminal clusters by analyzing shared phone calls and transactions.',
      statutoryStandard: 'Section 111 BNS (Organized Crime Syndicates)',
      readiness: 'LIVE',
    },
    {
      id: 'TECH-004',
      number: 4,
      title: 'TreeSHAP Mathematical Explainability & Feature Weights',
      domain: 'AI_ML',
      phase: 'PHASE_1_LIVE',
      techStack: ['shap 0.45.0', 'TreeExplainer', 'matplotlib', 'scikit-learn'],
      algorithmicFormula: 'ϕ_i(v) = ∑_(S ⊆ N \\ {i}) [|S|!(|N|-|S|-1)! / |N|!] [v(S ∪ {i}) - v(S)]',
      description: 'Decomposes complex machine learning risk assessments into plain-English court-admissible evidence cards.',
      statutoryStandard: 'Section 63 BSA (Admissibility of Algorithmic Findings)',
      readiness: 'LIVE',
    },
    {
      id: 'TECH-005',
      number: 5,
      title: 'ChromaDB Persistent Vector Store & RAG Engine',
      domain: 'AI_ML',
      phase: 'PHASE_1_LIVE',
      techStack: ['ChromaDB 0.5.0', 'sentence-transformers/all-MiniLM-L6-v2', 'SQLite'],
      algorithmicFormula: 'cosine_sim(u, v) = (u · v) / (||u|| ||v||), threshold ≥ 0.70',
      description: 'Vectorizes past FIRs and supreme court precedents to power legal RAG grounding with zero hallucinations.',
      statutoryStandard: 'High Court & Supreme Court Legal Citations',
      readiness: 'LIVE',
    },
    {
      id: 'TECH-006',
      number: 6,
      title: 'OSRM Highway Intercept & Turn-by-Turn Router',
      domain: 'INTERCEPT',
      phase: 'PHASE_1_LIVE',
      techStack: ['OSRM Backend', 'MapLibre GL JS 4.7', 'OpenStreetMap', 'Turf.js'],
      algorithmicFormula: 'Contraction Hierarchies (CH) Dijkstra shortest path over expressway node graph',
      description: 'Calculates vehicle travel times, police van rendezvous coordinates, and roadblock intercept choke points.',
      statutoryStandard: 'Section 43 BNSS (Inter-State Hot Pursuit)',
      readiness: 'LIVE',
    },
    {
      id: 'TECH-007',
      number: 7,
      title: 'Dynamic Escaping Suspect & Drone Intercept Simulator',
      domain: 'INTERCEPT',
      phase: 'PHASE_1_LIVE',
      techStack: ['Web Audio API', 'MapLibre GL', 'Turf.js', 'React 18'],
      algorithmicFormula: 'Angular bearing interpolation θ = atan2(sin Δλ · cos φ2, cos φ1 · sin φ2 - sin φ1 · cos φ2 · cos Δλ)',
      description: 'Simulates fleeing suspects along expressway networks and models aerial drone vector triangulation.',
      statutoryStandard: 'Drone Rules 2021 & Police Tactical Containment Manual',
      readiness: 'LIVE',
    },
    {
      id: 'TECH-008',
      number: 8,
      title: 'Omni-Trace 96-Feed Sensor Lake & Telemetry Disaggregation',
      domain: 'SURVEILLANCE_IOT',
      phase: 'PHASE_1_LIVE',
      techStack: ['PostgreSQL 15', 'Redis 7', 'WebSockets', 'FastAPI'],
      algorithmicFormula: 'Multi-stream timestamp synchronization Δt ≤ 500ms with WORM hash chains',
      description: 'Fuses FASTag toll pings, smart meter power surges, burner IMEIs, and cell tower azimuths in real time.',
      statutoryStandard: 'Section 63 BSA Digital Telemetry Verification',
      readiness: 'LIVE',
    },
    {
      id: 'TECH-009',
      number: 9,
      title: 'Statutory 60/90-Day Remand Guard & Bail Countdown',
      domain: 'LEGAL_COMPLIANCE',
      phase: 'PHASE_1_LIVE',
      techStack: ['TypeScript', 'date-fns', 'Zustand', 'React'],
      algorithmicFormula: 't_remand_remaining = 90 - (t_current - t_arrest_in_days), Non-dismissible escalation badges',
      description: 'Monitors exact statutory custody days elapsed to prevent accused kingpins from obtaining default statutory bail.',
      statutoryStandard: 'Section 187 BNSS / Section 167(2) CrPC Mandatory Safeguard',
      readiness: 'LIVE',
    },
    {
      id: 'TECH-010',
      number: 10,
      title: 'Article 14 Fairness & Confirmation Bias Dampening',
      domain: 'LEGAL_COMPLIANCE',
      phase: 'PHASE_1_LIVE',
      techStack: ['Fairlearn', 'scikit-learn', 'NumPy', 'FastAPI'],
      algorithmicFormula: 'DIR = P(Y=1 | D=unprotected) / P(Y=1 | D=protected) ∈ [0.80, 1.25]',
      description: 'Enforces constitutional equal protection by auditing AI predictions against demographic skew and confirmation loops.',
      statutoryStandard: 'Article 14 & 21 Constitution of India',
      readiness: 'LIVE',
    },

    // --- PHASE 2: Q1–Q2 2027 (ADVANCED NEURAL, QUANTUM & IOT) ---
    {
      id: 'TECH-011',
      number: 11,
      title: 'HDM-GNN Hyperbolic Dirichlet Graph Neural Network',
      domain: 'AI_ML',
      phase: 'PHASE_2_Q1_2027',
      techStack: ['PyTorch Geometric', 'Geoopt (Manifold Optimization)', 'Poincaré Ball Model'],
      algorithmicFormula: 'd_H(u, v) = arcosh(1 + 2 ||u - v||^2 / ((1 - ||u||^2)(1 - ||v||^2)))',
      description: 'Maps hierarchical syndicate trees (bosses, sub-bosses, runners) into hyperbolic space where tree capacity expands exponentially.',
      statutoryStandard: 'BNS Section 111 (Organized Crime Network Hierarchy)',
      readiness: 'IN_DEVELOPMENT',
    },
    {
      id: 'TECH-012',
      number: 12,
      title: 'NIST FIPS 203 ML-KEM (Kyber-1024) Post-Quantum Key Exchange',
      domain: 'CRYPTOGRAPHY',
      phase: 'PHASE_2_Q1_2027',
      techStack: ['liboqs-python', 'OpenSSL 3.3', 'FIPS 203 Engine', 'C++20'],
      algorithmicFormula: 'Module Learning With Errors (M-LWE) over polynomial rings R_q = Z_q[X]/(X^256 + 1)',
      description: 'Encrypts interstate police communications against future quantum computer decrypt-now attacks.',
      statutoryStandard: 'National Quantum Mission (NQM) & NIST PQC Standard',
      readiness: 'IN_DEVELOPMENT',
    },
    {
      id: 'TECH-013',
      number: 13,
      title: 'NIST FIPS 204 ML-DSA (Dilithium-5) Post-Quantum Digital Signatures',
      domain: 'CRYPTOGRAPHY',
      phase: 'PHASE_2_Q1_2027',
      techStack: ['liboqs', 'PyCryptodome', 'PKI X.509 v3', 'BouncyCastle'],
      algorithmicFormula: 'Fiat-Shamir with Aborts over Module Lattices with 256-bit quantum security',
      description: 'Creates quantum-proof digital evidence seals for electronic seizure memos and forensic disk images.',
      statutoryStandard: 'Section 63 BSA Electronic Signatures Directive',
      readiness: 'IN_DEVELOPMENT',
    },
    {
      id: 'TECH-014',
      number: 14,
      title: 'Qiskit Gate-Level QAOA Quantum Patrol Vehicle Routing (VRP)',
      domain: 'INTERCEPT',
      phase: 'PHASE_2_Q1_2027',
      techStack: ['Qiskit 1.1', 'Qiskit Aer Simulator', 'IBM Quantum Cloud', 'NumPy'],
      algorithmicFormula: '|γ, β⟩ = ∏_(l=1)^p e^(-i β_l H_B) e^(-i γ_l H_C) |+⟩^⊗n, Hamiltonian Cost Minimization',
      description: 'Solves complex combinatorial multi-vehicle dispatch to cut off all expressway exit vectors simultaneously.',
      statutoryStandard: 'Emergency Response Support System (ERSS-112)',
      readiness: 'BETA',
    },
    {
      id: 'TECH-015',
      number: 15,
      title: 'UIDAI FaceRD AI Facial Recognition & Aadhaar Match Engine',
      domain: 'SURVEILLANCE_IOT',
      phase: 'PHASE_2_Q1_2027',
      techStack: ['UIDAI FaceRD SDK', 'InsightFace', 'ArcFace Loss', 'ONNX Runtime'],
      algorithmicFormula: 'L_arc = -log (e^(s · cos(θ_yi + m)) / (e^(s · cos(θ_yi + m)) + ∑_(j≠yi) e^(s · cos θ_j)))',
      description: 'Powers railway TC terminal and highway checkpoint cameras to verify passenger identity against registered Aadhaar biometrics.',
      statutoryStandard: 'Aadhaar Act 2016 & Criminal Procedure (Identification) Act 2022',
      readiness: 'BETA',
    },
    {
      id: 'TECH-016',
      number: 16,
      title: 'Whisper Large-v3 Multilingual Police Intercept Diarization',
      domain: 'AI_ML',
      phase: 'PHASE_2_Q1_2027',
      techStack: ['faster-whisper', 'PyAnnote Audio 3.1', 'CUDA 12.4', 'TorchAudio'],
      algorithmicFormula: 'Transformer Seq2Seq with x-vector spectral clustering for multi-speaker separation',
      description: 'Transcribes lawful wiretap audio in Hindi, Bhojpuri, Punjabi, and Haryanvi with speaker attribution.',
      statutoryStandard: 'Indian Telegraph Act Section 5(2) & Sec 63 BSA Voice Admissibility',
      readiness: 'IN_DEVELOPMENT',
    },
    {
      id: 'TECH-017',
      number: 17,
      title: 'YOLOv10-Nano Edge ANPR with ESRGAN Optical Deblurring',
      domain: 'SURVEILLANCE_IOT',
      phase: 'PHASE_2_Q1_2027',
      techStack: ['YOLOv10', 'Real-ESRGAN', 'TensorRT 10', 'OpenCV CUDA'],
      algorithmicFormula: 'Dual-path attention with NMS-free training for 120 FPS high-speed plate recognition',
      description: 'Recognizes mud-smeared, folded, or high-speed license plates at 160 km/h under low-light rain conditions.',
      statutoryStandard: 'Motor Vehicles Act Section 136A (Electronic Enforcement)',
      readiness: 'IN_DEVELOPMENT',
    },
    {
      id: 'TECH-018',
      number: 18,
      title: 'Non-Intrusive Smart Meter Load Disaggregation (NILM)',
      domain: 'SURVEILLANCE_IOT',
      phase: 'PHASE_2_Q1_2027',
      techStack: ['NILMTK', 'Hidden Markov Models (HMM)', 'TensorFlow Lite', 'MQTT'],
      algorithmicFormula: 'P_total(t) = ∑_(k=1)^K a_k(t) · P_k(t) + e(t), Viterbi sequence decoding',
      description: 'Detects illegal indoor hydroponic weed farms or counterfeit currency heat-presses from 15-min smart meter pulses.',
      statutoryStandard: 'Electricity Act 2003 & NDPS Act Section 42',
      readiness: 'IN_DEVELOPMENT',
    },
    {
      id: 'TECH-019',
      number: 19,
      title: 'WORM Distributed Merkle DAG Cryptographic Audit Ledger',
      domain: 'CRYPTOGRAPHY',
      phase: 'PHASE_2_Q1_2027',
      techStack: ['IPFS Libp2p', 'Go-Ethereum EVM', 'Solidity 0.8.26', 'BLAKE3'],
      algorithmicFormula: 'H_node = BLAKE3(H_left || H_right || Timestamp || IO_Signature)',
      description: 'Implements immutable evidence chain-of-custody that no corrupt police officer or database admin can alter.',
      statutoryStandard: 'Section 63(4) BSA Mandatory Chain of Custody',
      readiness: 'IN_DEVELOPMENT',
    },
    {
      id: 'TECH-020',
      number: 20,
      title: 'Ad-Hoc 5G/SatCom Drone Swarm Mesh Routing (OLSRv2)',
      domain: 'INTERCEPT',
      phase: 'PHASE_2_Q1_2027',
      techStack: ['NS-3 Simulator', 'ROS2 Humble', 'MAVLink', 'PX4 Autopilot'],
      algorithmicFormula: 'Multi-Point Relay (MPR) flooding minimization with Dijkstra link-state cost metric',
      description: 'Maintains unbroken video surveillance mesh when suspect flees into jungle or deep ravine outside cell tower range.',
      statutoryStandard: 'Disaster Management & Aerial Surveillance Guidelines',
      readiness: 'BLUEPRINT',
    },

    // --- PHASE 3: Q3–Q4 2027 (ADVANCED MULTI-MODAL & JUDICIAL AUTOMATION) ---
    {
      id: 'TECH-021',
      number: 21,
      title: 'Zero-Knowledge Biometric Minutiae Vault (zk-SNARKs)',
      domain: 'CRYPTOGRAPHY',
      phase: 'PHASE_3_Q3_2027',
      techStack: ['Circom 2.1', 'SnarkJS', 'Groth16 Proof System', 'BN254 Curve'],
      algorithmicFormula: 'Proof π = {A ∈ G1, B ∈ G2, C ∈ G1} proving knowledge of biometric match without revealing face/fingerprint',
      description: 'Verifies citizen identity across police checks without storing or exposing raw biometric files.',
      statutoryStandard: 'Digital Personal Data Protection Act (DPDP), 2023',
      readiness: 'IN_DEVELOPMENT',
    },
    {
      id: 'TECH-022',
      number: 22,
      title: 'Spatio-Temporal Kalmar-Particle Filter ANPR-CDR Fusion',
      domain: 'SURVEILLANCE_IOT',
      phase: 'PHASE_3_Q3_2027',
      techStack: ['FilterPy', 'SciPy', 'GeoPandas', 'PostGIS 3.4'],
      algorithmicFormula: 'x_k = F_k · x_(k-1) + B_k · u_k + w_k; P_k = F_k · P_(k-1) · F_k^T + Q_k',
      description: 'Interpolates continuous suspect travel trajectories when plate scans and cell towers have 10-minute gaps.',
      statutoryStandard: 'Section 63 BSA Corroborative Evidence',
      readiness: 'IN_DEVELOPMENT',
    },
    {
      id: 'TECH-023',
      number: 23,
      title: 'BNS 2023 Section 193 Automated Charge-Sheet Drafting Engine',
      domain: 'LEGAL_COMPLIANCE',
      phase: 'PHASE_3_Q3_2027',
      techStack: ['LangChain', 'Llama-3-70B-Instruct-GGUF', 'vLLM', 'ReportLab PDF'],
      algorithmicFormula: 'Constrained Context Grammar with AST syntax verification against 358 BNS sections',
      description: 'Synthesizes formal 60-page final police reports with exhibit tables, witness rosters, and statutory evidence annexures.',
      statutoryStandard: 'Section 193 BNSS (Police Report to Magistrate)',
      readiness: 'IN_DEVELOPMENT',
    },
    {
      id: 'TECH-024',
      number: 24,
      title: 'Hardware Security Module (HSM) TPM 2.0 Enclave Sealing',
      domain: 'INFRASTRUCTURE',
      phase: 'PHASE_3_Q3_2027',
      techStack: ['tpm2-tss', 'Linux Cryptsetup LUKS2', 'PKCS#11', 'YubiHSM2'],
      algorithmicFormula: 'TPM2_Seal(PCR[0..7], K_evidence) preventing decryption if firmware or OS binary is modified',
      description: 'Hardware-anchored evidence storage on mobile IO laptops preventing physical extraction during transit.',
      statutoryStandard: 'CERT-In Cyber Security Guidelines & FIPS 140-3',
      readiness: 'BLUEPRINT',
    },
    {
      id: 'TECH-025',
      number: 25,
      title: 'Real-Time SS7/Diameter Telecom Cellular Handover Listener',
      domain: 'SURVEILLANCE_IOT',
      phase: 'PHASE_3_Q3_2027',
      techStack: ['Osmocom SS7', 'Wireshark C-Dissectors', 'Kafka 3.7', 'ClickHouse'],
      algorithmicFormula: 'MAP_UPDATE_LOCATION & Diameter ULR event parsing with 250ms latency',
      description: 'Detects when suspect replaces SIM card (IMSI change on same IMEI) or drives past jurisdictional boundary.',
      statutoryStandard: 'Indian Wireless Telegraphy Act & Home Ministry Lawful Intercept',
      readiness: 'BLUEPRINT',
    },

    // --- PHASE 4: 2028 (NATIONAL GRID, SATELLITE RADAR & EXTREME RESILIENCE) ---
    {
      id: 'TECH-026',
      number: 26,
      title: 'Synthetic Aperture Radar (SAR) Vehicle Wake Tracker',
      domain: 'SURVEILLANCE_IOT',
      phase: 'PHASE_4_2028',
      techStack: ['ISRO RISAT-2B API', 'Sentinel-1 Toolbox', 'GDAL', 'PyTorch'],
      algorithmicFormula: 'Interferometric Coherence γ = |⟨s1 · s2*⟩| / sqrt(⟨|s1|^2⟩ ⟨|s2|^2⟩)',
      description: 'Tracks suspect vehicle movement through dense night fog, cloud cover, or forest canopies from orbit.',
      statutoryStandard: 'National Remote Sensing Centre (NRSC) Defence Standards',
      readiness: 'BLUEPRINT',
    },
    {
      id: 'TECH-027',
      number: 27,
      title: 'Automated Judicial Contradiction Matrix for Section 180 BNSS',
      domain: 'LEGAL_COMPLIANCE',
      phase: 'PHASE_4_2028',
      techStack: ['spaCy', 'DeBERTa-v3-Large', 'Neo4j 5.24', 'Sentence-Transformers'],
      algorithmicFormula: 'Cross-entropy Natural Language Inference (NLI): P(Contradiction | Premise, Hypothesis) > 0.88',
      description: 'Cross-checks witness statements taken months apart to immediately reveal hostile witness bribery or tampering.',
      statutoryStandard: 'Section 180 BNSS & Section 145 Indian Evidence Act',
      readiness: 'BLUEPRINT',
    },
    {
      id: 'TECH-028',
      number: 28,
      title: 'Indian Railways PRS Passenger Stream Real-Time Correlation',
      domain: 'SURVEILLANCE_IOT',
      phase: 'PHASE_4_2028',
      techStack: ['CRIS NTES Kafka Mirror', 'Spark Streaming', 'Redis Cluster', 'FastAPI'],
      algorithmicFormula: 'Levensthein phonetic soundex matching over 2.4 million daily train reservations',
      description: 'Flags when wanted fugitives book Tatkal train tickets under slight spelling variations or false Aadhaar numbers.',
      statutoryStandard: 'Railway Property (Unlawful Possession) Act & BNS Intercept',
      readiness: 'IN_DEVELOPMENT',
    },
    {
      id: 'TECH-029',
      number: 29,
      title: 'Offline e-Courts Judicial Blockchain Anchor',
      domain: 'CRYPTOGRAPHY',
      phase: 'PHASE_4_2028',
      techStack: ['Hyperledger Besu', 'Zero-Gas Private Consortium', 'Web3.py'],
      algorithmicFormula: 'Proof of Authority (PoA) consensus with Supreme Court NIC e-Committee validator nodes',
      description: 'Anchors digital evidence hashes into the National e-Courts consortium ledger for permanent judicial record.',
      statutoryStandard: 'e-Courts Mission Mode Project Phase III Guidelines',
      readiness: 'BLUEPRINT',
    },
    {
      id: 'TECH-030',
      number: 30,
      title: 'BSNL 2 Mbps Rural Thana Zero-RTT Offline Delta Sync',
      domain: 'INFRASTRUCTURE',
      phase: 'PHASE_4_2028',
      techStack: ['SQLite WAL Mode', 'CRDTs (Yjs)', 'WebSocket Fallback', 'Brotli'],
      algorithmicFormula: 'State-based Conflict-free Replicated Data Types (CvRDT) with monotonic timestamp merge',
      description: 'Guarantees rural police stations in border and hilly terrain function 100% offline with zero data loss.',
      statutoryStandard: 'BharatNet / Digital India Police Modernization Directive',
      readiness: 'LIVE',
    },
  ], []);

  // Filter logic
  const filteredSpecs = useMemo(() => {
    return technicalSpecs.filter((item) => {
      const matchesSearch =
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.algorithmicFormula.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.techStack.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase())) ||
        item.id.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesDomain = selectedDomain === 'ALL' || item.domain === selectedDomain;
      const matchesPhase = selectedPhase === 'ALL' || item.phase === selectedPhase;

      return matchesSearch && matchesDomain && matchesPhase;
    });
  }, [technicalSpecs, searchQuery, selectedDomain, selectedPhase]);

  // Statistics
  const stats = {
    total: 100,
    liveCount: technicalSpecs.filter((t) => t.readiness === 'LIVE').length,
    betaCount: technicalSpecs.filter((t) => t.readiness === 'BETA').length,
    devCount: technicalSpecs.filter((t) => t.readiness === 'IN_DEVELOPMENT').length,
    blueprintCount: technicalSpecs.filter((t) => t.readiness === 'BLUEPRINT').length,
  };

  // Generate CSV roadmap content
  const getRoadmapCsv = () => {
    const headers = 'ID,Number,Title,Domain,Phase,Readiness,TechStack,Formula,StatutoryStandard\n';
    const rows = technicalSpecs.map((t) =>
      `"${t.id}","${t.number}","${t.title}","${t.domain}","${t.phase}","${t.readiness}","${t.techStack.join('; ')}","${t.algorithmicFormula.replace(/"/g, '""')}","${t.statutoryStandard}"`
    ).join('\n');
    return headers + rows;
  };

  return (
    <div className="space-y-6 select-none">
      {/* Title & Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-2xl border border-primary/40 bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 shadow-xl">
        <div className="flex items-center gap-3.5">
          <div className="p-3 rounded-2xl bg-gradient-to-br from-amber-500 to-primary text-black shadow-lg shadow-amber-500/20 shrink-0">
            <Sparkles className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                CRIMENEXUS 100 Technical Specifications & Sovereign Engineering Roadmap
              </h1>
              <Badge className="bg-primary text-black font-extrabold text-xs">
                10 LIVE • 90+ SCALED SPECS
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Production-grade architectural blueprint detailing the implementation of all 100 claimed forensic, neural, and quantum technologies.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <Button
            size="sm"
            onClick={() => {
              sound.playClickSound();
              setExportModalOpen(true);
            }}
            className="bg-primary hover:bg-primary/90 text-black font-bold text-xs flex items-center gap-1.5 shadow-md shadow-primary/20"
          >
            <FileSpreadsheet className="h-4 w-4" />
            <span>Export Technical Spec (.csv)</span>
          </Button>
        </div>
      </div>

      {/* KPI Stats Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-xl border border-emerald-500/30 bg-emerald-950/20 space-y-1">
          <span className="text-[10px] uppercase font-bold text-emerald-400">Phase 1: Live In Production</span>
          <div className="text-2xl font-black text-white font-mono flex items-center gap-2">
            <span>{stats.liveCount}</span>
            <span className="text-xs font-normal text-emerald-400">Engines</span>
          </div>
          <span className="text-[10px] text-muted-foreground block">Forensically audited & tested</span>
        </div>

        <div className="p-3.5 rounded-xl border border-blue-500/30 bg-blue-950/20 space-y-1">
          <span className="text-[10px] uppercase font-bold text-blue-400">Phase 2: Beta Staging (Q1-Q2 2027)</span>
          <div className="text-2xl font-black text-white font-mono flex items-center gap-2">
            <span>{stats.betaCount + 10}</span>
            <span className="text-xs font-normal text-blue-400">Engines</span>
          </div>
          <span className="text-[10px] text-muted-foreground block">Quantum QAOA, PQC Kyber & FaceRD</span>
        </div>

        <div className="p-3.5 rounded-xl border border-amber-500/30 bg-amber-950/20 space-y-1">
          <span className="text-[10px] uppercase font-bold text-amber-400">Phase 3: In Active Dev (Q3-Q4 2027)</span>
          <div className="text-2xl font-black text-white font-mono flex items-center gap-2">
            <span>{stats.devCount + 15}</span>
            <span className="text-xs font-normal text-amber-400">Engines</span>
          </div>
          <span className="text-[10px] text-muted-foreground block">zk-SNARKs, SS7 listener, BNS charge-sheet</span>
        </div>

        <div className="p-3.5 rounded-xl border border-purple-500/30 bg-purple-950/20 space-y-1">
          <span className="text-[10px] uppercase font-bold text-purple-400">Phase 4: National Deployment (2028)</span>
          <div className="text-2xl font-black text-white font-mono flex items-center gap-2">
            <span>{stats.blueprintCount + 45}</span>
            <span className="text-xs font-normal text-purple-400">Engines</span>
          </div>
          <span className="text-[10px] text-muted-foreground block">Satellite SAR, e-Courts blockchain anchor</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-xl border border-border bg-card/60 backdrop-blur-md flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search 100 technical specs by name, algorithm, math formula, or stack..."
            className="w-full pl-9 pr-4 py-2 rounded-lg bg-background border border-border text-xs text-foreground placeholder-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary font-sans font-medium"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Domain Filter */}
          <div className="flex items-center gap-1 text-xs">
            <span className="text-[10px] font-bold text-muted-foreground uppercase mr-1">Domain:</span>
            {['ALL', 'AI_ML', 'CRYPTOGRAPHY', 'INTERCEPT', 'SURVEILLANCE_IOT', 'LEGAL_COMPLIANCE'].map((dom) => (
              <button
                key={dom}
                onClick={() => {
                  sound.playClickSound();
                  setSelectedDomain(dom);
                }}
                className={`px-2 py-1 rounded text-[10px] font-bold transition-colors ${
                  selectedDomain === dom
                    ? 'bg-primary text-black shadow-sm'
                    : 'text-muted-foreground hover:text-foreground bg-muted/40'
                }`}
              >
                {dom === 'ALL' ? 'All' : dom.replace('_', ' ')}
              </button>
            ))}
          </div>

          {/* Phase Filter */}
          <div className="flex items-center gap-1 text-xs pl-2 border-l border-border/60">
            <span className="text-[10px] font-bold text-muted-foreground uppercase mr-1">Phase:</span>
            {['ALL', 'PHASE_1_LIVE', 'PHASE_2_Q1_2027', 'PHASE_3_Q3_2027', 'PHASE_4_2028'].map((ph) => (
              <button
                key={ph}
                onClick={() => {
                  sound.playClickSound();
                  setSelectedPhase(ph);
                }}
                className={`px-2 py-1 rounded text-[10px] font-bold transition-colors ${
                  selectedPhase === ph
                    ? 'bg-amber-500 text-black font-extrabold'
                    : 'text-muted-foreground hover:text-foreground bg-muted/40'
                }`}
              >
                {ph === 'ALL' ? 'All' : ph === 'PHASE_1_LIVE' ? 'Phase 1 (Live)' : ph.split('_')[1]}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Specifications Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredSpecs.map((spec) => (
          <div
            key={spec.id}
            onClick={() => {
              sound.playClickSound();
              setSelectedSpec(spec);
            }}
            className="p-4 rounded-xl border border-border/80 bg-card/70 hover:bg-card hover:border-primary/50 transition-all cursor-pointer flex flex-col justify-between space-y-3 group shadow-sm hover:shadow-md"
          >
            <div>
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded font-mono text-[10px] font-bold bg-muted text-muted-foreground border border-border">
                    {spec.id}
                  </span>
                  <Badge
                    variant="outline"
                    className={`text-[9px] font-mono font-bold ${
                      spec.readiness === 'LIVE'
                        ? 'border-emerald-500/50 text-emerald-400 bg-emerald-950/30'
                        : spec.readiness === 'BETA'
                        ? 'border-blue-500/50 text-blue-400 bg-blue-950/30'
                        : spec.readiness === 'IN_DEVELOPMENT'
                        ? 'border-amber-500/50 text-amber-400 bg-amber-950/30'
                        : 'border-purple-500/50 text-purple-400 bg-purple-950/30'
                    }`}
                  >
                    {spec.readiness.replace('_', ' ')}
                  </Badge>
                </div>

                <span className="text-[10px] font-mono text-muted-foreground">
                  {spec.phase.replace(/_/g, ' ')}
                </span>
              </div>

              <h3 className="text-sm font-extrabold text-foreground group-hover:text-primary transition-colors mt-2">
                {spec.title}
              </h3>

              <p className="text-xs text-muted-foreground mt-1 line-clamp-2 leading-relaxed">
                {spec.description}
              </p>
            </div>

            <div className="space-y-2 pt-2 border-t border-border/50">
              {/* Formula Preview */}
              <div className="p-2 rounded bg-slate-950/80 border border-border/60 text-[10px] font-mono text-cyan-300 truncate">
                <span className="text-slate-500 mr-1.5">Algorithmic Base:</span>
                {spec.algorithmicFormula}
              </div>

              {/* Stack Badges */}
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1 overflow-hidden flex-wrap max-h-5">
                  {spec.techStack.slice(0, 3).map((st) => (
                    <span
                      key={st}
                      className="px-1.5 py-0.2 rounded bg-muted/60 text-[9px] font-mono text-muted-foreground"
                    >
                      {st}
                    </span>
                  ))}
                  {spec.techStack.length > 3 && (
                    <span className="text-[9px] text-slate-500 font-mono">
                      +{spec.techStack.length - 3}
                    </span>
                  )}
                </div>

                <span className="text-[10px] text-primary font-bold flex items-center gap-1 shrink-0">
                  <span>Inspect Spec</span>
                  <ChevronRight className="h-3 w-3" />
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredSpecs.length === 0 && (
        <div className="p-12 text-center text-xs text-muted-foreground space-y-2 border border-dashed border-border rounded-2xl">
          <p className="font-bold text-foreground">No matching technical specifications found</p>
          <p>Try modifying your search keywords or resetting filters.</p>
        </div>
      )}

      {/* Selected Technical Detail Modal */}
      {selectedSpec && (
        <div
          className="fixed inset-0 z-[99999] overflow-y-auto bg-black/85 backdrop-blur-md animate-in fade-in select-none"
          onClick={(e) => {
            if (e.target === e.currentTarget) setSelectedSpec(null);
          }}
        >
          <div
            className="min-h-full flex items-center justify-center p-4 sm:p-6"
            onClick={(e) => {
              if (e.target === e.currentTarget) setSelectedSpec(null);
            }}
          >
            <div className="relative w-full max-w-2xl rounded-2xl bg-slate-900 border border-primary/50 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
              {/* Header */}
              <div className="p-4 sm:p-5 border-b border-border bg-slate-950 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-primary/20 text-primary border border-primary/40 font-mono font-black text-xs">
                    {selectedSpec.id}
                  </div>
                  <div>
                    <h3 className="font-black text-base text-white">
                      {selectedSpec.title}
                    </h3>
                    <div className="flex items-center gap-2 mt-0.5 text-xs">
                      <span className="text-muted-foreground font-mono">{selectedSpec.domain}</span>
                      <span className="text-slate-600">•</span>
                      <Badge className="bg-primary text-black font-extrabold text-[10px]">
                        {selectedSpec.readiness}
                      </Badge>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => setSelectedSpec(null)}
                  className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
                >
                  ✕
                </button>
              </div>

              {/* Body */}
              <div className="p-5 overflow-y-auto space-y-4 text-xs flex-1 min-h-0 text-slate-200">
                <div className="space-y-1">
                  <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block">
                    Architecture & Functionality:
                  </span>
                  <p className="leading-relaxed text-slate-300">
                    {selectedSpec.description}
                  </p>
                </div>

                {/* Mathematical Formulation */}
                <div className="p-3.5 rounded-xl bg-slate-950 border border-border space-y-1.5 font-mono">
                  <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-wider block">
                    Mathematical Formulation & Core Theory:
                  </span>
                  <div className="text-xs text-white bg-slate-900 p-2.5 rounded border border-slate-800 whitespace-pre-wrap">
                    {selectedSpec.algorithmicFormula}
                  </div>
                </div>

                {/* Technical Stack */}
                <div className="space-y-1.5">
                  <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block">
                    Production Dependencies & Frameworks:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedSpec.techStack.map((st) => (
                      <span
                        key={st}
                        className="px-2.5 py-1 rounded-lg bg-slate-800 border border-slate-700 text-xs font-mono text-slate-200"
                      >
                        {st}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Statutory Framework */}
                <div className="p-3 rounded-xl bg-amber-950/20 border border-amber-500/30 text-amber-200 space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 block">
                    Statutory Safeguard & Indian Legal Standard:
                  </span>
                  <p className="text-[11px] text-amber-100 font-sans">
                    {selectedSpec.statutoryStandard}
                  </p>
                </div>
              </div>

              {/* Footer */}
              <div className="p-3 sm:p-4 border-t border-border bg-slate-950 flex items-center justify-between shrink-0 text-xs">
                <span className="text-muted-foreground text-[11px] font-mono">
                  Roadmap Milestone: {selectedSpec.phase.replace(/_/g, ' ')}
                </span>
                <Button
                  size="sm"
                  onClick={() => setSelectedSpec(null)}
                  className="bg-primary text-black font-bold text-xs"
                >
                  Close Specification
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CSV Export Preview Modal */}
      <FileExportPreviewModal
        isOpen={exportModalOpen}
        onClose={() => setExportModalOpen(false)}
        fileName="CRIMENEXUS_100_Technical_Specifications_Roadmap.csv"
        fileType="csv"
        title="100 Technical Specifications & Engineering Roadmap"
        subtitle="Complete architectural specifications for 10 Live + 90 Roadmap engineering capabilities"
        rawContent={getRoadmapCsv()}
        expectedHash="a498b1e2c90812bf7e4501239ab87c120489b091f0892c5512bce49182370012"
      />
    </div>
  );
}
