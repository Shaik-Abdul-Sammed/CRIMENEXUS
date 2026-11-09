#!/usr/bin/env python3
"""
CRIMENEXUS FIR Intelligence Archive Demo Seeder
Seeds 200 realistic historical FIRs (2015-2025) across 11 Indic and national languages:
English (30), Hindi (40), Marathi (25), Kannada (20), Telugu (15), Tamil (15),
Bengali (20), Gujarati (15), Punjabi (10), Urdu (10).
Seeds 50 Officers in OfficerRegistry and 100 Suspects in SuspectLifeStatus.
"""

import os
import sys
import random
from datetime import datetime, date, timedelta

# Ensure backend root is on sys.path
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)

from app.database.postgres import SessionLocal, Base, engine
from app.models.fir_archive_models import HistoricalFIR, OfficerRegistry, SuspectLifeStatus

# -----------------------------------------------------------------------------
# Multilingual Sample Corpus Templates
# -----------------------------------------------------------------------------
LANGUAGE_SAMPLES = {
    "en": [
        ("Commercial fraud and unauthorized diversion of bank funds totaling ₹1.4 Crores using forged board resolution.", "Financial Fraud", "Section 420/467/471 IPC (Sec 318/336 BNS)"),
        ("Armed robbery at national highway petrol pump by four masked motorcycle assailants.", "Highway Robbery", "Section 392/397 IPC (Sec 309 BNS)"),
        ("Extortion calls demanding ₹50 Lakhs threatening physical harm to factory owner.", "Extortion", "Section 384/506 IPC (Sec 308/351 BNS)"),
        ("Organized vehicle theft syndicate dismantling stolen commercial SUVs in illegal godowns.", "Vehicle Theft", "Section 379/411 IPC (Sec 303/317 BNS)"),
    ],
    "hi": [
        ("दुकान का शटर काटकर तिजोरी से ₹85,000 नकद व सोने के आभूषण की चोरी की गई। आरोपी रात्रि में फरार हो गए।", "दुकान में चोरी (Theft)", "धारा 380/457 भा.दं.सं."),
        ("फर्जी कॉल सेंटर द्वारा पीड़ितों को बैंक लॉटरी का झांसा देकर ₹4.5 लाख की ऑनलाइन ठगी की गई।", "साइबर धोखाधड़ी (Cyber Fraud)", "धारा 420 भा.दं.सं. व 66D आईटी एक्ट"),
        ("जमीनी विवाद में लाठी-डंडों से जानलेवा हमला कर गंभीर चोट पहुंचाई गई व जान से मारने की धमकी दी।", "जानलेवा हमला (Assault)", "धारा 307/323 भा.दं.सं."),
        ("हवाला रैकेट के जरिए गैरकानूनी वित्तीय लेनदेन व ₹50,000 से कम राशि के संरचित जमा (स्मर्फिंग)।", "हवाला वित्तीय अपराध", "धारा 120B/420 भा.दं.सं."),
    ],
    "mr": [
        ("व्यापारी संकुलात जबरी चोरी करून रोख रक्कम आणि लॅपटॉप चोरून नेल्याची फिर्याद दाखल.", "घरफोडी (Housebreaking)", "कलम 454/380 भा.दं.वि."),
        ("बनावट कागदपत्रांच्या आधारे पतसंस्थेकडून ₹25 लाखांचे कर्ज काढून फसवणूक केल्याचा गुन्हा.", "आर्थिक फसवणूक (Cheating)", "कलम 420/465 भा.दं.वि."),
        ("औद्योगिक वसाहतीतील खंडणी वसुली आणि कामगारांना धमकावल्या प्रकरणी टोळीवर गुन्हा नोंद.", "खंडणी (Extortion)", "कलम 384/506 भा.दं.वि."),
    ],
    "kn": [
        ("ವಾಣಿಜ್ಯ ಮಳಿಗೆಯ ಬೀಗ ಮುರಿದು ನಗದು ಮತ್ತು ಚಿನ್ನಾಭರಣ ಕಳ್ಳತನ ಮಾಡಿರುವ ಬಗ್ಗೆ ದೂರು ದಾಖಲು.", "ಕಳ್ಳತನ (Theft)", "ಕಲಂ 380/457 ಐ.ಪಿ.ಸಿ."),
        ("ನಕಲಿ ಕ್ರಿಪ್ಟೋ ಕರೆನ್ಸಿ ವೆಬ್‌ಸೈಟ್ ಮೂಲಕ ಸಾರ್ವಜನಿಕರಿಂದ ₹12 ಲಕ್ಷ ಹಣ ವಂಚಿಸಿ ಪರಾರಿಯಾಗಿರುವ ಜಾಲ.", "ಸೈಬರ್ ವಂಚನೆ (Cyber Fraud)", "ಕಲಂ 420 ಐ.ಪಿ.ಸಿ. ಮತ್ತು 66D ಐಟಿ ಕಾಯ್ದೆ"),
    ],
    "te": [
        ("వ్యాపార భాగస్వామ్యం పేరుతో నకిలీ పత్రాలు సృష్టించి ₹18 లక్షల నిధులు దారిమళ్లించిన కేసు.", "ఆర్థిక మోసం (Financial Fraud)", "సెక్షన్ 420/468 ఐ.పి.సి."),
        ("రాత్రి సమయంలో తాళం వేసిన నివాసంలో చొరబడి నగదు మరియు వెండి వస్తువుల దొంగతనం.", "ఇంటి దొంగతనం (Burglary)", "సెక్షన్ 380 ఐ.పి.సి."),
    ],
    "ta": [
        ("வணிக வளாகத்தில் பூட்டை உடைத்து ₹65,000 ரொக்கம் மற்றும் மின்னணு சாதனங்கள் திருட்டு.", "திருட்டு (Theft)", "பிரிவு 380/457 இ.த.ச."),
        ("வெளிநாட்டு வேலை வாங்கித் தருவதாகக் கூறி ₹8 லட்சம் மோசடி செய்த நபர் மீது புகார்.", "வேலைவாய்ப்பு மோசடி (Job Fraud)", "பிரிவு 420 இ.த.ச."),
    ],
    "bn": [
        ("জাল নথি ও ভুয়ো কোম্পানির মাধ্যমে রাষ্ট্রায়ত্ত ব্যাঙ্ক থেকে কোটি টাকার ঋণ তছরুপের অভিযোগ।", "ব্যাঙ্ক জালিয়াতি (Bank Fraud)", "ধারা 420/409 ভাঃ দঃ বিঃ"),
        ("রাতের অন্ধকারে সোনার দোকানে তালা ভেঙে নগদ টাকা ও গয়না লুঠ করে চম্পট দুষ্কৃতী দল।", "ডাকাতি (Robbery)", "ধারা 392 ভাঃ দঃ বিঃ"),
    ],
    "gu": [
        ("વેપારી પાસેથી ખંડણી માંગી ધાકધમકી આપવા તથા હથિયાર બતાવી લૂંટ ચલાવવા અંગે ગુનો નોંધાયો.", "ખંડણી / લૂંટ (Extortion)", "કલમ 384/392 ઈ.પી.કો."),
        ("શેરબજારમાં ઊંચા વળતરની લાલચ આપી રોકાણકારો સાથે ₹30 લાખની ઠગાઈ કરનાર ટોળકી.", "ચિટફંડ છેતરપિંડી (Fraud)", "કલમ 420 ઈ.પી.કો."),
    ],
    "pa": [
        ("ਗੈਰ-ਕਾਨੂੰਨੀ ਹਥਿਆਰਾਂ ਦੀ ਨੋਕ 'ਤੇ ਪੈਟਰੋਲ ਪੰਪ ਮੁਲਾਜ਼ਮਾਂ ਕੋਲੋਂ ਲੱਖਾਂ ਰੁਪਏ ਦੀ ਲੁੱਟ ਦਾ ਮਾਮਲਾ ਦਰਜ।", "ਡਕੈਤੀ (Armed Dacoity)", "ਧਾਰਾ 395/397 ਆਈ.ਪੀ.ਸੀ."),
        ("ਨਸ਼ਾ ਤਸਕਰੀ ਅਤੇ ਹਵਾਲਾ ਰਾਹੀਂ ਪੈਸੇ ਦੀ ਹੇਰਾਫੇਰੀ ਕਰਨ ਵਾਲੇ ਅੰਤਰਰਾਜੀ ਗਿਰੋਹ 'ਤੇ ਕਾਰਵਾਈ।", "ਨਸ਼ਾ ਤੇ ਹਵਾਲਾ ਸਿੰਡੀਕੇਟ", "ਐਨ.ਡੀ.ਪੀ.ਐਸ. ਤੇ 420 ਆਈ.ਪੀ.ਸੀ."),
    ],
    "ur": [
        ("جعلی دستاویزات اور بینک مہر کے ذریعے تجارتی مرکز میں لاکھوں روپے کی خرد برد کا مقدمہ۔", "دھوکہ دہی (Commercial Fraud)", "دفعہ 420/468 مجموعہ تعزیرات ہند"),
        ("مسلح افراد کی جانب سے رات کے وقت دکان کا تالا توڑ کر نقد رقم چرانے کی رپورٹ درج۔", "چوری و نقب زنی (Burglary)", "دفعہ 380/457 تعزیرات ہند"),
    ],
}

OFFICER_NAMES = [
    "Rajesh Varma", "Vikram Rathore", "Sunil Deshmukh", "Anil Kulkarni", "Prakash Shetty",
    "Suresh Babu", "Ranganathan Iyer", "Debabrata Sen", "Bhupinder Gill", "Kishore Patel",
    "Mukesh Sharma", "Pooja Hegde", "Siddharth Roy", "Amitabh Jha", "Harinder Sandhu",
    "Syed Aslam", "Deepak Rawat", "Praveen Kumar", "Manjunath Gowda", "Arvind Swamy"
]

STATIONS = [
    "PS-CENTRAL-DELHI", "PS-KAROL-BAGH", "PS-SECTOR-20-NOIDA", "PS-DHARAVI-MUMBAI",
    "PS-INDIRANAGAR-BLR", "PS-BANJARA-HILLS-HYD", "PS-PARK-STREET-KOLKATA",
    "PS-CIVIL-LINES-ASR", "PS-ASHRAM-RD-AMD", "PS-T-NAGAR-CHENNAI"
]

COURTS = [
    "Patiala House Courts, New Delhi", "Tis Hazari Courts, Delhi",
    "City Civil and Sessions Court, Mumbai", "City Civil Court, Bengaluru",
    "Nampally Criminal Court, Hyderabad", "Calcutta Sessions Court, Kolkata",
    "Ahmedabad District & Sessions Court", "Chennai Metropolitan Court"
]


def seed_officer_registry(db):
    """Seeds 50 officers across stations with realistic career statistics."""
    print("Seeding 50 Officers in OfficerRegistry...")
    existing = db.query(OfficerRegistry).count()
    if existing >= 50:
        print(f"OfficerRegistry already contains {existing} records. Skipping.")
        return

    officers = []
    for i in range(1, 51):
        badge = f"DL-POL-IO-{8800 + i}"
        name = f"Insp. {OFFICER_NAMES[(i - 1) % len(OFFICER_NAMES)]} {chr(65 + (i % 26))}"
        rank = "DSP" if i <= 5 else "Inspector" if i <= 35 else "Sub-Inspector"
        station = STATIONS[i % len(STATIONS)]
        posting_start = date(2014 + (i % 8), 1 + (i % 12), 1 + (i % 25))
        is_retired = (i % 10 == 0)
        posting_end = date(2023, 12, 31) if is_retired else None
        firs_count = random.randint(15, 65)
        convictions = int(firs_count * random.uniform(0.55, 0.82))
        acquittals = firs_count - convictions - random.randint(1, 5)

        officer = OfficerRegistry(
            badge_number=badge,
            name=name,
            rank=rank,
            station_id=station,
            posting_start=posting_start,
            posting_end=posting_end,
            total_firs_handled=firs_count,
            conviction_count=convictions,
            acquittal_count=max(0, acquittals),
            status="RETIRED" if is_retired else "ACTIVE"
        )
        officers.append(officer)

    db.bulk_save_objects(officers)
    db.commit()
    print("Successfully seeded 50 officers.")


def seed_suspect_life_status(db):
    """Seeds 100 suspect life-statuses with mixed verified states."""
    print("Seeding 100 Suspects in SuspectLifeStatus...")
    existing = db.query(SuspectLifeStatus).count()
    if existing >= 100:
        print(f"SuspectLifeStatus already contains {existing} records. Skipping.")
        return

    statuses = []
    suspect_names = [
        "Rajan Verma", "Suresh Kumar", "Adnan Merchant", "Balwinder Dhillon", "Iqbal Ansari",
        "Ramesh Chandra Sharma", "Harishankar Tiwari", "Devendra Yadav", "Kishore Malvankar",
        "Vikramaditya Rao", "Jaspal Bawa", "Aslam Pehlwan", "Pranab Mukherjee Deb", "Bhavesh Patel"
    ]

    for i in range(1, 101):
        pid = f"P-SUSPECT-{2000 + i}"
        base_name = suspect_names[(i - 1) % len(suspect_names)]
        name = f"{base_name} #{i}" if i > len(suspect_names) else base_name
        
        # Distribution: 60% ALIVE, 20% DECEASED, 15% ABSCONDING, 5% UNKNOWN
        rand_val = random.random()
        if rand_val < 0.60:
            status = "ALIVE"
            source = "LAST_KNOWN_FIR"
            v_date = date(2024, random.randint(1, 12), random.randint(1, 28))
        elif rand_val < 0.80:
            status = "DECEASED"
            source = "AADHAAR_DEATH" if i % 2 == 0 else "NCRB_DEATH"
            v_date = date(random.randint(2016, 2022), random.randint(1, 12), random.randint(1, 28))
        elif rand_val < 0.95:
            status = "ABSCONDING"
            source = "COURT_RECORD"
            v_date = date(2023, random.randint(1, 12), random.randint(1, 28))
        else:
            status = "UNKNOWN"
            source = "UNVERIFIED"
            v_date = None

        suspect = SuspectLifeStatus(
            person_id=pid,
            name=name,
            aliases=[f"{name.split()[0]} Bhai", f"{name.split()[0]} Shooter"],
            status=status,
            status_source=source,
            status_verified_date=v_date,
            aadhaar_last_four=f"{1000 + (i * 37) % 9000}",
            last_known_address=f"House {i * 12}, Sector {10 + (i % 50)}, New Delhi",
            last_known_contact=f"+91 98{10000000 + i * 491}"
        )
        statuses.append(suspect)

    db.bulk_save_objects(statuses)
    db.commit()
    print("Successfully seeded 100 suspect life-status records.")


def seed_200_historical_firs(db):
    """Seeds 200 FIRs with exact language distribution spanning 2015-2025."""
    print("Seeding 200 Historical FIRs across 11 Languages (2015-2025)...")
    existing = db.query(HistoricalFIR).count()
    if existing >= 200:
        print(f"HistoricalFIR archive already contains {existing} records. Skipping.")
        return

    # Language quota breakdown
    quotas = {
        "en": 30,
        "hi": 40,
        "mr": 25,
        "kn": 20,
        "te": 15,
        "ta": 15,
        "bn": 20,
        "gu": 15,
        "pa": 10,
        "ur": 10,
    }

    firs = []
    fir_counter = 1

    for lang, count in quotas.items():
        sample_tuples = LANGUAGE_SAMPLES[lang]
        for c in range(count):
            sample_text, crime_type, sections = sample_tuples[c % len(sample_tuples)]
            year = random.randint(2015, 2025)
            case_num = f"FIR-{year}-{lang.upper()}-{100 + fir_counter}"
            title = f"{crime_type} Case Docket ({case_num})"
            is_handwritten = (year <= 2018 and random.random() < 0.70)
            ocr_conf = round(random.uniform(0.72, 0.99), 2)
            
            officer_idx = (fir_counter - 1) % 50
            officer_badge = f"DL-POL-IO-{8801 + officer_idx}"
            officer_name = f"Insp. {OFFICER_NAMES[officer_idx % len(OFFICER_NAMES)]}"
            court = COURTS[fir_counter % len(COURTS)]

            outcomes = ["CONVICTED", "ACQUITTED", "PENDING", "CLOSED", "UNDERTRIAL"]
            outcome = outcomes[fir_counter % len(outcomes)]
            outcome_date = date(year + random.randint(1, 3), random.randint(1, 12), random.randint(1, 28)) if outcome != "PENDING" else None

            summary_en = (
                f"(a) Incident: {crime_type} reported in district jurisdiction.\n"
                f"(b) Accused: Primary target suspect and unidentified accomplices.\n"
                f"(c) Statutory Charge: {sections}"
            )

            fir = HistoricalFIR(
                case_number=case_num,
                year=year,
                crime_type=crime_type,
                title=title,
                location=f"Sector {10 + (fir_counter % 80)}, Urban District",
                incident_date=datetime(year, random.randint(1, 12), random.randint(1, 28), random.randint(8, 22), 0),
                detected_language=lang,
                language_confidence=round(random.uniform(0.92, 0.99), 2),
                original_text=sample_text,
                fir_summary_en=summary_en,
                ocr_confidence=ocr_conf,
                is_handwritten=is_handwritten,
                officer_badge=officer_badge,
                officer_name=officer_name,
                court_name=court,
                case_outcome=outcome,
                outcome_date=outcome_date,
                suspects=[f"Suspect {fir_counter}", "Rajan Verma" if fir_counter % 5 == 0 else "Adnan Merchant"],
                victims=[f"Victim Complainant {fir_counter}"],
                legal_sections=[sections],
            )
            firs.append(fir)
            fir_counter += 1

    db.bulk_save_objects(firs)
    db.commit()
    print("Successfully seeded 200 historical FIR records into HistoricalFIR archive.")


def main():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        seed_officer_registry(db)
        seed_suspect_life_status(db)
        seed_200_historical_firs(db)
        print("All FIR Intelligence Archive demo data seeded successfully!")
    finally:
        db.close()


if __name__ == "__main__":
    main()
