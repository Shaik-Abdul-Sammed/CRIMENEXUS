import React, { useState } from 'react';
import axios from 'axios';
import {
  Shield,
  Smartphone,
  Lock,
  FileCheck2,
  AlertTriangle,
  Scale,
  Video,
  FileText,
  Trash2,
  CheckCircle2,
  X
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';

interface MobileExtractionModalProps {
  isOpen: boolean;
  onClose: () => void;
  caseNumber?: string;
  onSuccess?: (gatePass: any) => void;
}

export function MobileExtractionModal({
  isOpen,
  onClose,
  caseNumber = 'FIR-2026-8812',
  onSuccess,
}: MobileExtractionModalProps) {
  const [legalBasis, setLegalBasis] = useState<'WARRANT' | 'CONSENT' | 'SECTION_105_BNSS'>('WARRANT');
  const [deviceImei, setDeviceImei] = useState('860123456789012');
  const [magistrateOrder, setMagistrateOrder] = useState('');
  const [consentUploaded, setConsentUploaded] = useState(false);
  const [videoRecorded, setVideoRecorded] = useState(false);
  const [commAuthorized, setCommAuthorized] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successData, setSuccessData] = useState<any | null>(null);

  if (!isOpen) return null;

  const handleValidateGate = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setIsSubmitting(true);

    try {
      // Local statutory validation check before API dispatch
      if (legalBasis === 'WARRANT' && (!magistrateOrder || magistrateOrder.trim().length < 5)) {
        throw new Error('Valid Magistrate Search Warrant number is mandatory for Warrant basis.');
      }
      if (legalBasis === 'CONSENT' && !consentUploaded) {
        throw new Error('Verified civilian consent form must be uploaded under Section 17(b) DPDP Act.');
      }
      if (legalBasis === 'SECTION_105_BNSS' && !videoRecorded) {
        throw new Error('Section 105 BNSS mandates contemporaneous audio-video recording of device seizure.');
      }

      const baseURL = import.meta.env.VITE_API_BASE_URL || '/api/v1';
      const response = await axios.post(`${baseURL}/forensics/mobile/validate-gate`, {
        legal_basis: legalBasis,
        case_number: caseNumber,
        device_imei: deviceImei,
        magistrate_order: magistrateOrder,
        consent_signed: consentUploaded,
        audio_video_recorded: videoRecorded,
        communications_authorized: commAuthorized,
      });

      setSuccessData(response.data?.gate_pass);
      if (onSuccess) onSuccess(response.data?.gate_pass);
    } catch (err: any) {
      setErrorMsg(err.response?.data?.detail || err.message || 'Legal compliance validation failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-2xl rounded-2xl border border-border bg-slate-950 p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border/70 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
              <Smartphone className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-white">Mobile Device Forensic Ingestion Gate</h3>
              <p className="text-xs text-muted-foreground">
                Statutory Compliance: Section 105 BNSS &bull; Section 17(b) DPDP Act 2023 &bull; Sec 63 BSA
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-white hover:bg-slate-800 transition-colors"
            aria-label="Close modal"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {errorMsg && (
          <div className="p-3 rounded-xl border border-red-500/40 bg-red-950/30 text-red-300 text-xs flex items-start gap-2">
            <AlertTriangle className="h-4 w-4 shrink-0 text-red-400 mt-0.5" />
            <div>
              <strong className="block font-bold">Statutory Gating Rejection:</strong>
              <span>{errorMsg}</span>
            </div>
          </div>
        )}

        {successData ? (
          <div className="p-4 rounded-xl border border-emerald-500/40 bg-emerald-950/20 text-emerald-200 text-xs space-y-3">
            <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
              <CheckCircle2 className="h-5 w-5" />
              <span>Statutory Legal Gate Passed &bull; Extraction Authorized</span>
            </div>
            <div className="space-y-1 font-mono text-[11px] text-slate-300 bg-slate-900/80 p-3 rounded-lg border border-border">
              <div>Legal Basis: <strong className="text-white">{successData.legal_basis}</strong></div>
              <div>Device IMEI: <strong className="text-white">{successData.device_imei}</strong></div>
              <div>Compliance Hash: <span className="text-emerald-400 break-all">{successData.compliance_hash}</span></div>
            </div>
            <Button size="sm" onClick={onClose} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold">
              Done
            </Button>
          </div>
        ) : (
          <form onSubmit={handleValidateGate} className="space-y-4 text-xs">
            {/* Legal Basis Selector */}
            <div className="space-y-1.5">
              <label className="font-bold text-slate-200 flex items-center justify-between">
                <span>Select Statutory Legal Basis (Mandatory):</span>
                <span className="text-[10px] font-mono text-indigo-400">BNSS 2023 Compliant</span>
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'WARRANT', label: 'Judicial Warrant', desc: 'Magistrate Court Order' },
                  { id: 'CONSENT', label: 'Civilian Consent', desc: 'Sec 17(b) DPDP Act' },
                  { id: 'SECTION_105_BNSS', label: 'Sec 105 BNSS', desc: 'Mandatory Video Seizure' },
                ].map((b) => (
                  <button
                    key={b.id}
                    type="button"
                    onClick={() => setLegalBasis(b.id as any)}
                    className={`p-2.5 rounded-xl border text-left transition-all ${
                      legalBasis === b.id
                        ? 'border-indigo-500 bg-indigo-950/40 text-white shadow-sm'
                        : 'border-border/70 bg-slate-900/60 text-slate-400 hover:text-white'
                    }`}
                  >
                    <div className="font-bold">{b.label}</div>
                    <div className="text-[10px] text-muted-foreground">{b.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Device IMEI & Case Number */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="font-bold text-slate-200">Target Device IMEI / Serial:</label>
                <input
                  type="text"
                  value={deviceImei}
                  onChange={(e) => setDeviceImei(e.target.value)}
                  placeholder="e.g. 860123456789012"
                  className="w-full rounded-lg border border-border bg-slate-900 px-3 py-2 text-white font-mono focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  required
                />
              </div>
              <div className="space-y-1">
                <label className="font-bold text-slate-200">FIR / Case Reference:</label>
                <input
                  type="text"
                  value={caseNumber}
                  disabled
                  className="w-full rounded-lg border border-border bg-slate-900/50 px-3 py-2 text-slate-400 font-mono"
                />
              </div>
            </div>

            {/* Basis-Specific Statutory Inputs */}
            {legalBasis === 'WARRANT' && (
              <div className="space-y-1 animate-in fade-in">
                <label className="font-bold text-slate-200">Magistrate Warrant Number (Mandatory):</label>
                <input
                  type="text"
                  value={magistrateOrder}
                  onChange={(e) => setMagistrateOrder(e.target.value)}
                  placeholder="e.g. WAR-CMM-DEL-2026-904"
                  className="w-full rounded-lg border border-indigo-500/40 bg-slate-900 px-3 py-2 text-white font-mono focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  required
                />
              </div>
            )}

            {legalBasis === 'CONSENT' && (
              <div className="p-3 rounded-xl border border-indigo-500/30 bg-indigo-950/20 space-y-2 animate-in fade-in">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={consentUploaded}
                    onChange={(e) => setConsentUploaded(e.target.checked)}
                    className="h-4 w-4 rounded accent-indigo-600"
                    aria-label="Consent form verified"
                  />
                  <span className="text-slate-200 font-semibold">
                    Civilian signed statutory consent form under Section 17(b) DPDP Act 2023.
                  </span>
                </label>
                <p className="text-[10px] text-slate-400">
                  Suspect/Civilian has been informed that password disclosure is voluntary and Class D data will be purged.
                </p>
              </div>
            )}

            {legalBasis === 'SECTION_105_BNSS' && (
              <div className="p-3 rounded-xl border border-indigo-500/30 bg-indigo-950/20 space-y-2 animate-in fade-in">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={videoRecorded}
                    onChange={(e) => setVideoRecorded(e.target.checked)}
                    className="h-4 w-4 rounded accent-indigo-600"
                    aria-label="Contemporaneous video recorded"
                  />
                  <span className="text-slate-200 font-semibold flex items-center gap-1.5">
                    <Video className="h-3.5 w-3.5 text-indigo-400" />
                    <span>Contemporaneous audio-video recording conducted under Section 105 BNSS.</span>
                  </span>
                </label>
                <p className="text-[10px] text-slate-400">
                  Video file will be hashed with SHA-256 and transmitted to the jurisdictional Magistrate.
                </p>
              </div>
            )}

            {/* DPDP 4-Tier Classification & Class D Purge Guarantee */}
            <div className="p-3 rounded-xl border border-slate-800 bg-slate-900/60 space-y-1.5 text-[11px] text-slate-300">
              <div className="flex items-center justify-between text-slate-200 font-bold">
                <span className="flex items-center gap-1.5">
                  <Trash2 className="h-3.5 w-3.5 text-rose-400" />
                  <span>DPDP Proportionality Engine: Automatic Class D Deletion</span>
                </span>
                <span className="text-[10px] text-emerald-400 font-mono">ACTIVE IN CODE</span>
              </div>
              <p className="text-[10.5px] text-slate-400 leading-relaxed">
                Personal family photos, banking passwords, and unrelated contacts will be automatically purged before entering case storage pursuant to the Proportionality Doctrine (*Justice K.S. Puttaswamy*).
              </p>
            </div>

            {/* Submit Action */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-border/60">
              <Button type="button" variant="outline" size="sm" onClick={onClose}>
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={isSubmitting}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold"
              >
                {isSubmitting ? 'Validating Gating...' : 'Authorize Mobile Extraction'}
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
