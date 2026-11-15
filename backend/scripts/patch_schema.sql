-- CRIMENEXUS PostgreSQL Schema Migration & Integrity Patch
-- Safely and idempotently adds missing columns and tables to existing database volumes

-- 1. Ensure cases table has historical FIR and forensic linguistic columns
ALTER TABLE cases ADD COLUMN IF NOT EXISTS detected_language VARCHAR(50);
ALTER TABLE cases ADD COLUMN IF NOT EXISTS fir_summary_en TEXT;
ALTER TABLE cases ADD COLUMN IF NOT EXISTS original_text TEXT;
ALTER TABLE cases ADD COLUMN IF NOT EXISTS ocr_confidence FLOAT;
ALTER TABLE cases ADD COLUMN IF NOT EXISTS officer_badge VARCHAR(100);
ALTER TABLE cases ADD COLUMN IF NOT EXISTS officer_name VARCHAR(200);
ALTER TABLE cases ADD COLUMN IF NOT EXISTS court_name VARCHAR(200);
ALTER TABLE cases ADD COLUMN IF NOT EXISTS case_outcome VARCHAR(50);
ALTER TABLE cases ADD COLUMN IF NOT EXISTS outcome_date DATE;
ALTER TABLE cases ADD COLUMN IF NOT EXISTS human_review_status VARCHAR(50) DEFAULT 'NOT_REQUIRED';

-- 1b. Ensure officer_registry has disciplinary tracking columns
ALTER TABLE officer_registry ADD COLUMN IF NOT EXISTS disciplinary_complaints INTEGER DEFAULT 0;
ALTER TABLE officer_registry ADD COLUMN IF NOT EXISTS sustained_complaints INTEGER DEFAULT 0;
ALTER TABLE officer_registry ADD COLUMN IF NOT EXISTS last_incident_date DATE;

-- 2. Create Guardian Trace Missing Person tables if not exist
CREATE TABLE IF NOT EXISTS missing_person_cases (
    id SERIAL PRIMARY KEY,
    case_number VARCHAR UNIQUE,
    person_name VARCHAR NOT NULL,
    age INTEGER,
    gender VARCHAR,
    description TEXT,
    photo_url VARCHAR,
    last_seen_lat FLOAT,
    last_seen_lon FLOAT,
    last_seen_time TIMESTAMP NOT NULL,
    last_seen_location VARCHAR,
    reporter_name VARCHAR,
    reporter_phone VARCHAR,
    reporter_relation VARCHAR,
    mobile_number VARCHAR,
    imei VARCHAR,
    known_contacts JSON DEFAULT '[]'::json,
    frequent_locations JSON DEFAULT '[]'::json,
    medical_conditions JSON DEFAULT '[]'::json,
    status VARCHAR DEFAULT 'ACTIVE',
    priority VARCHAR DEFAULT 'HIGH',
    assigned_officer VARCHAR,
    station_id VARCHAR,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    closed_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS digital_sightings (
    id SERIAL PRIMARY KEY,
    case_id INTEGER,
    source VARCHAR,
    latitude FLOAT NOT NULL,
    longitude FLOAT NOT NULL,
    confidence FLOAT DEFAULT 0.5,
    timestamp TIMESTAMP NOT NULL,
    raw_data JSON DEFAULT '{}'::json,
    verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS search_predictions (
    id SERIAL PRIMARY KEY,
    case_id INTEGER,
    predicted_lat FLOAT NOT NULL,
    predicted_lon FLOAT NOT NULL,
    confidence FLOAT DEFAULT 0.5,
    time_window_start TIMESTAMP,
    time_window_end TIMESTAMP,
    reasoning JSON DEFAULT '{}'::json,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. Create FIR Archive tables if not exist
CREATE TABLE IF NOT EXISTS officer_registry (
    id SERIAL PRIMARY KEY,
    badge_number VARCHAR(100) UNIQUE NOT NULL,
    name VARCHAR(200) NOT NULL,
    rank VARCHAR(100) DEFAULT 'Inspector',
    station_id VARCHAR(100),
    posting_start DATE,
    posting_end DATE,
    total_firs_handled INTEGER DEFAULT 0,
    conviction_count INTEGER DEFAULT 0,
    acquittal_count INTEGER DEFAULT 0,
    status VARCHAR(50) DEFAULT 'ACTIVE'
);

CREATE TABLE IF NOT EXISTS suspect_life_status (
    id SERIAL PRIMARY KEY,
    person_id VARCHAR(100) NOT NULL,
    name VARCHAR(200) NOT NULL,
    aliases JSON DEFAULT '[]'::json,
    status VARCHAR(50) DEFAULT 'UNKNOWN',
    status_source VARCHAR(100) DEFAULT 'UNVERIFIED',
    status_verified_date DATE,
    aadhaar_last_four VARCHAR(10),
    last_known_address VARCHAR(300),
    last_known_contact VARCHAR(100)
);

CREATE TABLE IF NOT EXISTS historical_firs (
    id SERIAL PRIMARY KEY,
    case_number VARCHAR(100) UNIQUE NOT NULL,
    year INTEGER NOT NULL,
    crime_type VARCHAR(100) NOT NULL,
    title VARCHAR(200) NOT NULL,
    location VARCHAR(200),
    incident_date TIMESTAMP,
    detected_language VARCHAR(50) DEFAULT 'en',
    language_confidence FLOAT DEFAULT 0.95,
    original_text TEXT NOT NULL,
    fir_summary_en TEXT NOT NULL,
    ocr_confidence FLOAT DEFAULT 1.0,
    is_handwritten BOOLEAN DEFAULT FALSE,
    officer_badge VARCHAR(100),
    officer_name VARCHAR(200),
    court_name VARCHAR(200),
    case_outcome VARCHAR(50) DEFAULT 'PENDING',
    outcome_date DATE,
    suspects JSON DEFAULT '[]'::json,
    victims JSON DEFAULT '[]'::json,
    legal_sections JSON DEFAULT '[]'::json,
    analytics_cache JSON DEFAULT '{}'::json,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS custody_tracker (
    id SERIAL PRIMARY KEY,
    case_id VARCHAR(100) NOT NULL,
    suspect_id VARCHAR(100) NOT NULL,
    suspect_name VARCHAR(200) NOT NULL,
    investigating_officer VARCHAR(200),
    police_station VARCHAR(200),
    offenses VARCHAR(300),
    arrest_timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    remand_expiry_timestamp TIMESTAMP NOT NULL,
    charge_sheet_deadline TIMESTAMP NOT NULL,
    status VARCHAR(50) DEFAULT 'ACTIVE',
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    closed_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS public_crime_reports (
    id SERIAL PRIMARY KEY,
    report_number VARCHAR UNIQUE,
    reporter_name VARCHAR,
    reporter_phone VARCHAR,
    reporter_email VARCHAR,
    is_anonymous BOOLEAN DEFAULT FALSE,
    crime_type VARCHAR,
    description TEXT NOT NULL,
    location_name VARCHAR,
    latitude FLOAT,
    longitude FLOAT,
    incident_timestamp TIMESTAMP,
    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    evidence_files JSON DEFAULT '[]'::json,
    satellite_verified BOOLEAN DEFAULT FALSE,
    satellite_confidence FLOAT DEFAULT 0.0,
    satellite_analysis JSON DEFAULT '{}'::json,
    exif_verified BOOLEAN DEFAULT FALSE,
    nearest_station_id VARCHAR,
    nearest_station_name VARCHAR,
    distance_to_station_km FLOAT,
    status VARCHAR DEFAULT 'PENDING',
    reviewed_by_officer VARCHAR,
    reviewed_at TIMESTAMP,
    review_notes TEXT,
    rejection_reason VARCHAR,
    converted_case_id VARCHAR
);

-- 4. Brady/Giglio Impeachment Material Disclosure Ledger
CREATE TABLE IF NOT EXISTS officer_disciplinary_records (
    id SERIAL PRIMARY KEY,
    badge_number VARCHAR(100) NOT NULL,
    officer_name VARCHAR(200) NOT NULL,
    incident_date DATE NOT NULL,
    allegation_type VARCHAR(100) NOT NULL,
    investigation_id VARCHAR(100) UNIQUE NOT NULL,
    finding VARCHAR(50) NOT NULL,
    is_brady_material BOOLEAN DEFAULT TRUE,
    summary_of_misconduct TEXT NOT NULL,
    prosecution_disclosure_status VARCHAR(50) DEFAULT 'DISCLOSED',
    sanction_imposed VARCHAR(200),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 5. CPIA 1996 Schedule of Unused Material (MG6C / MG6D)
CREATE TABLE IF NOT EXISTS cpia_unused_materials (
    id SERIAL PRIMARY KEY,
    item_number INTEGER NOT NULL,
    case_id VARCHAR(100) NOT NULL,
    schedule_type VARCHAR(10) DEFAULT 'MG6C',
    description TEXT NOT NULL,
    location_stored VARCHAR(200) NOT NULL,
    relevance_to_case TEXT,
    undermines_prosecution BOOLEAN DEFAULT FALSE,
    assists_defense BOOLEAN DEFAULT FALSE,
    disclosure_decision VARCHAR(50) DEFAULT 'DISCLOSE',
    disclosure_reason TEXT,
    logged_by_badge VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
