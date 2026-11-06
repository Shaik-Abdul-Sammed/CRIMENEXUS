import React, { useState } from 'react';

export const POLICE_GLOSSARY: Record<string, { full: string; desc: string; statute?: string }> = {
  ANPR: {
    full: 'Automated Number Plate Recognition',
    desc: 'High-speed optical camera system utilizing IR strobes and character segmentation to extract license plates from moving vehicles.',
    statute: 'Sec 136A Motor Vehicles Act'
  },
  CDR: {
    full: 'Call Detail Record',
    desc: 'Telephony metadata including calling/called party MSISDN, IMSI, IMEI, timestamp, duration, and cell tower azimuth sector.',
    statute: 'Sec 5(2) Indian Telegraph Act'
  },
  HSRP: {
    full: 'High-Security Registration Plate',
    desc: 'Tamper-evident aluminum license plate with laser-etched 9-digit PIN, chromium-based hologram, and non-reusable snap lock.',
    statute: 'Rule 50 Central Motor Vehicles Rules'
  },
  BNS: {
    full: 'Bharatiya Nyaya Sanhita, 2023',
    desc: 'The substantive criminal code of India, replacing the Indian Penal Code (IPC) of 1860.',
    statute: 'Act No. 45 of 2023'
  },
  BNSS: {
    full: 'Bharatiya Nagarik Suraksha Sanhita, 2023',
    desc: 'The procedural criminal code governing police powers, arrests, remands, and bail, replacing the Code of Criminal Procedure (CrPC) 1973.',
    statute: 'Act No. 46 of 2023'
  },
  BSA: {
    full: 'Bharatiya Sakshya Adhiniyam, 2023',
    desc: 'The national law of evidence regulating court admissibility, electronic records, and expert witnesses, replacing the Indian Evidence Act 1872.',
    statute: 'Act No. 47 of 2023'
  },
  IO: {
    full: 'Investigating Officer',
    desc: 'The designated police officer (typically Sub-Inspector or Inspector) authorized to lead the criminal investigation and file charge-sheets.',
    statute: 'Sec 175 BNSS'
  },
  SHO: {
    full: 'Station House Officer',
    desc: 'The commanding officer in charge of a Police Station (Thana), responsible for law enforcement, custody management, and case diaries.',
    statute: 'Sec 2(1)(v) BNSS'
  },
  LOC: {
    full: 'Look Out Circular',
    desc: 'Interdiction directive distributed to immigration checkpoints, international airports, and seaports to prevent fugitives from fleeing the country.',
    statute: 'MHA Guidelines 2021'
  },
  WORM: {
    full: 'Write-Once Read-Many',
    desc: 'Cryptographic immutable storage architecture preventing retroactive tampering, modification, or deletion of digital evidence logs.',
    statute: 'Sec 63 BSA & ISO/IEC 27037'
  },
  PMLA: {
    full: 'Prevention of Money Laundering Act, 2002',
    desc: 'Indian legislation combating illicit concealment, acquisition, and laundering of proceeds of crime through shell companies and cash structuring.',
    statute: 'Act No. 15 of 2003'
  },
  CJM: {
    full: 'Chief Judicial Magistrate',
    desc: 'The senior judicial officer heading the magistracy in a district with authority to remand suspects and commit heinous trials to Sessions Court.',
    statute: 'Sec 12 BNSS'
  }
};

interface GlossaryTooltipProps {
  term: keyof typeof POLICE_GLOSSARY | string;
  children?: React.ReactNode;
}

export const GlossaryTooltip: React.FC<GlossaryTooltipProps> = ({ term, children }) => {
  const [show, setShow] = useState(false);
  const info = POLICE_GLOSSARY[term.toUpperCase()];

  if (!info) {
    return <>{children || term}</>;
  }

  return (
    <span
      className="relative inline-block"
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
      onFocus={() => setShow(true)}
      onBlur={() => setShow(false)}
    >
      <span className="underline decoration-dotted decoration-amber-400/60 cursor-help font-semibold text-inherit hover:text-amber-300 transition-colors">
        {children || term}
      </span>

      {show && (
        <span
          role="tooltip"
          className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 p-3 rounded-xl bg-slate-950 border border-amber-500/40 text-left text-xs shadow-2xl z-50 pointer-events-none animate-in fade-in zoom-in-95 duration-150"
        >
          <span className="font-extrabold text-amber-400 block text-[11px] mb-0.5">
            {term.toUpperCase()}: {info.full}
          </span>
          <span className="text-slate-300 text-[11px] leading-relaxed block">{info.desc}</span>
          {info.statute && (
            <span className="mt-1.5 pt-1.5 border-t border-slate-800 text-[10px] text-slate-400 font-mono block">
              Authority: {info.statute}
            </span>
          )}
        </span>
      )}
    </span>
  );
};
