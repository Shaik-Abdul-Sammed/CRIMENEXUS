import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

interface MostWantedRecord {
  rank: number;
  name: string;
  role: string;
  risk_score: number;
  status: string;
  phone?: string;
}

interface SmurfAlert {
  id: string;
  beneficiary: string;
  senders_count: number;
  total_amount: number;
  severity: string;
  timestamp: string;
}

interface FIRSummary {
  case_number: string;
  police_station: string;
  sections: string[];
  status: string;
  registration_date: string;
}

const DEFAULT_MOST_WANTED: MostWantedRecord[] = [
  { rank: 1, name: 'Rajan (Rajan Bhai)', role: 'Syndicate Kingpin', risk_score: 0.98, status: 'PROCLAIMED_OFFENDER', phone: '+919999988888' },
  { rank: 2, name: 'Suresh Angadia', role: 'Cash Courier', risk_score: 0.91, status: 'ACTIVE_WARRANT', phone: '+919876543210' },
  { rank: 3, name: 'Vikram Malhotra (Vicky)', role: 'Extortion Leader', risk_score: 0.88, status: 'CHARGESHEET_FILED', phone: '+919123456789' }
];

const DEFAULT_ALERTS: SmurfAlert[] = [
  { id: 'ALT-SMURF-01', beneficiary: 'ACC-HAWALA-MULE-902', senders_count: 5, total_amount: 247500, severity: 'CRITICAL', timestamp: '10 mins ago' },
  { id: 'ALT-SMURF-02', beneficiary: 'ACC-MULE-DELHI-441', senders_count: 4, total_amount: 199996, severity: 'HIGH', timestamp: '42 mins ago' }
];

const DEFAULT_FIRS: FIRSummary[] = [
  { case_number: 'FIR-2026-DEL-8902', police_station: 'Cyber Crime PS, Sector 20', sections: ['111 BNS', '318 BNS', '66D IT Act'], status: 'UNDER_INVESTIGATION', registration_date: '2026-03-20' },
  { case_number: 'FIR-2026-UP-NOIDA-0142', police_station: 'Sector 62 PS', sections: ['420 IPC', '120B IPC'], status: 'ACTIVE_INQUIRY', registration_date: '2026-03-14' },
  { case_number: 'FIR-2026-JEWEL-0101', police_station: 'Karol Bagh PS', sections: ['392 IPC', '397 IPC', '25 Arms Act'], status: 'SPECIAL_CELL_TRANSFERRED', registration_date: '2026-10-28' }
];

export function LightweightDashboard() {
  const [mostWanted, setMostWanted] = useState<MostWantedRecord[]>(DEFAULT_MOST_WANTED);
  const [alerts] = useState<SmurfAlert[]>(DEFAULT_ALERTS);
  const [firs] = useState<FIRSummary[]>(DEFAULT_FIRS);
  const [isCached, setIsCached] = useState<boolean>(false);
  const [cachedTimestamp, setCachedTimestamp] = useState<string>('');
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    async function loadData() {
      const baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1';
      try {
        const res = await fetch(`${baseURL}/threats/most-wanted`, { headers: { Accept: 'application/json' } });
        if (!res.ok) throw new Error('Network error');
        const data = await res.json();
        const records = data.records || data;
        if (Array.isArray(records) && records.length > 0) {
          setMostWanted(records);
          const nowStr = new Date().toLocaleTimeString();
          localStorage.setItem('crimenexus_lite_mw', JSON.stringify({ data: records, time: nowStr }));
          setIsCached(false);
        }
      } catch {
        // Fallback to offline local storage
        const saved = localStorage.getItem('crimenexus_lite_mw');
        if (saved) {
          try {
            const parsed = JSON.parse(saved);
            setMostWanted(parsed.data);
            setCachedTimestamp(parsed.time || 'earlier session');
            setIsCached(true);
          } catch {
            // keep default
          }
        } else {
          setIsCached(true);
          setCachedTimestamp('Station Terminal Pre-seed');
        }
      }
    }

    loadData();

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 font-mono text-xs sm:text-sm">
      {/* Header bar */}
      <div className="border border-slate-700 bg-slate-900 p-3 mb-4 rounded flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-base sm:text-lg font-bold text-amber-400 tracking-wider">
            CRIMENEXUS // THANA LITE TERMINAL (2 Mbps OPTIMIZED)
          </h1>
          <p className="text-slate-400 text-xs">
            Text-only low-bandwidth mode (Zero 3D graphs, Zero WebGL map tiles, Zero heavy assets).
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span
            data-testid="network-status"
            className={`px-2 py-0.5 rounded text-xs font-bold ${
              isOnline ? 'bg-emerald-900/60 text-emerald-400 border border-emerald-600' : 'bg-rose-900/60 text-rose-400 border border-rose-600'
            }`}
          >
            {isOnline ? 'ONLINE // BSNL LINK ACTIVE' : 'OFFLINE // STANDALONE CACHE'}
          </span>
          <Link
            to="/dashboard"
            className="px-2.5 py-1 bg-cyan-900 hover:bg-cyan-800 border border-cyan-500 text-cyan-200 rounded font-semibold text-xs"
          >
            Switch to Full GUI
          </Link>
        </div>
      </div>

      {/* Offline Caching Banner */}
      {isCached && (
        <div
          data-testid="cached-data-badge"
          className="mb-4 bg-amber-950/80 border border-amber-600 text-amber-200 p-2.5 rounded flex items-center justify-between"
        >
          <span>[OFFLINE FIRST] Showing cached data from {cachedTimestamp || 'previous shift'}.</span>
          <span className="text-xs bg-amber-800/80 px-2 py-0.5 rounded font-bold">TERMINAL CACHE</span>
        </div>
      )}

      {/* Grid: 2 Columns for high density */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Most Wanted */}
        <div className="border border-slate-800 bg-slate-900/70 p-3 rounded">
          <div className="flex justify-between items-center mb-2 pb-1 border-b border-slate-800">
            <h2 className="font-bold text-rose-400 text-xs sm:text-sm">MOST WANTED // HIGH FLIGHT RISK SYNDICATE</h2>
            <span className="text-[10px] text-slate-400 font-bold">SEC 82 CrPC // LOC ACTIVE</span>
          </div>
          <table data-testid="lite-most-wanted-table" className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 text-[11px]">
                <th className="py-1">#</th>
                <th className="py-1">NAME</th>
                <th className="py-1">ROLE</th>
                <th className="py-1">SCORE</th>
                <th className="py-1">STATUS</th>
              </tr>
            </thead>
            <tbody>
              {mostWanted.map((mw, i) => (
                <tr key={i} className="border-b border-slate-800/50 hover:bg-slate-800/30">
                  <td className="py-1.5 font-bold text-amber-400">{mw.rank || i + 1}</td>
                  <td className="py-1.5 font-semibold text-white">{mw.name}</td>
                  <td className="py-1.5 text-slate-300">{mw.role}</td>
                  <td className="py-1.5 text-rose-400 font-bold">{((mw.risk_score || 0.85) * 100).toFixed(0)}%</td>
                  <td className="py-1.5">
                    <span className="bg-rose-950 border border-rose-700 text-rose-300 px-1 py-0.5 rounded text-[10px]">
                      {mw.status || 'ACTIVE'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Financial Smurfing Tripwires */}
        <div className="border border-slate-800 bg-slate-900/70 p-3 rounded">
          <div className="flex justify-between items-center mb-2 pb-1 border-b border-slate-800">
            <h2 className="font-bold text-amber-400 text-xs sm:text-sm">FINANCIAL TRIPWIRE // SMURFING DETECTIONS</h2>
            <span className="text-[10px] text-slate-400 font-bold">SEC 102 CrPC FREEZE CANDIDATES</span>
          </div>
          <table data-testid="lite-alerts-table" className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 text-[11px]">
                <th className="py-1">BENEFICIARY ACCOUNT</th>
                <th className="py-1">SENDERS</th>
                <th className="py-1">TOTAL (INR)</th>
                <th className="py-1">STATUS</th>
              </tr>
            </thead>
            <tbody>
              {alerts.map((al) => (
                <tr key={al.id} className="border-b border-slate-800/50 hover:bg-slate-800/30">
                  <td className="py-1.5 font-semibold text-cyan-300">{al.beneficiary}</td>
                  <td className="py-1.5 text-slate-300">{al.senders_count} mules</td>
                  <td className="py-1.5 font-bold text-amber-300">₹{al.total_amount.toLocaleString('en-IN')}</td>
                  <td className="py-1.5">
                    <span className="bg-amber-950 border border-amber-600 text-amber-300 px-1 py-0.5 rounded text-[10px]">
                      {al.severity}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Recent FIRs */}
        <div className="border border-slate-800 bg-slate-900/70 p-3 rounded lg:col-span-2">
          <div className="flex justify-between items-center mb-2 pb-1 border-b border-slate-800">
            <h2 className="font-bold text-cyan-400 text-xs sm:text-sm">REGISTERED FIRST INFORMATION REPORTS (CCTNS GRID)</h2>
            <span className="text-[10px] text-slate-400 font-bold">STATION LOGS</span>
          </div>
          <table data-testid="lite-firs-table" className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 text-[11px]">
                <th className="py-1">CASE NUMBER</th>
                <th className="py-1">POLICE STATION</th>
                <th className="py-1">SECTIONS OF LAW</th>
                <th className="py-1">DATE</th>
                <th className="py-1">STATUS</th>
              </tr>
            </thead>
            <tbody>
              {firs.map((f) => (
                <tr key={f.case_number} className="border-b border-slate-800/50 hover:bg-slate-800/30">
                  <td className="py-1.5 font-bold text-cyan-300">{f.case_number}</td>
                  <td className="py-1.5 text-slate-200">{f.police_station}</td>
                  <td className="py-1.5 text-slate-400">{f.sections.join(', ')}</td>
                  <td className="py-1.5 text-slate-400">{f.registration_date}</td>
                  <td className="py-1.5">
                    <span className="bg-slate-800 border border-slate-600 text-slate-200 px-1 py-0.5 rounded text-[10px]">
                      {f.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default LightweightDashboard;
