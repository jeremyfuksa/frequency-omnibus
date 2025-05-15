```sql
-- Main table for conventional frequencies
CREATE TABLE frequencies (
    id INTEGER PRIMARY KEY,
    frequency REAL NOT NULL,           -- Primary frequency in MHz (output/rx)
    transmit_frequency REAL,           -- Secondary frequency in MHz (input/tx) for repeaters
    name TEXT NOT NULL,                -- Short display name
    description TEXT,                  -- Longer description
    alpha_tag TEXT,                    -- Alpha tag from RadioReference
    mode TEXT NOT NULL,                -- FM, NFM, AM, DMR, P25, etc.
    tone_mode TEXT,                    -- CTCSS, DCS, or NULL
    tone_freq TEXT,                    -- Tone value (e.g., "107.2" or "D023")
    county TEXT,                       -- County name
    state TEXT,                        -- Two-letter state code (MO, KS, etc.)
    agency TEXT,                       -- Agency/Category from RadioReference
    callsign TEXT,                     -- FCC Callsign if available
    service_type TEXT,                 -- Ham, Public Safety, Business, etc.
    tags TEXT,                         -- Comma-separated tags for filtering
    duplex TEXT,                       -- +, -, or blank (calculated field)
    offset REAL,                       -- Offset in MHz (calculated field)
    last_verified TEXT,                -- Date of last verification
    notes TEXT,                        -- Additional notes
    source TEXT,                       -- Where this info came from
    active INTEGER DEFAULT 1,          -- 1=active, 0=inactive
    distance_from_kc REAL,             -- Distance from KC center in miles
    latitude REAL,                     -- Station latitude if known
    longitude REAL,                    -- Station longitude if known
    class_station_code TEXT,           -- Original class station code
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT,                   -- Last modification timestamp
    export_chirp INTEGER DEFAULT 0,    -- 1=export to CHIRP, 0=don't export
    export_uniden INTEGER DEFAULT 0,   -- 1=export to Uniden, 0=don't export
    export_sdrtrunk INTEGER DEFAULT 0, -- 1=export to SDRTrunk, 0=don't export
    export_sdrplus INTEGER DEFAULT 0,  -- 1=export to SDR++, 0=don't export
    export_opengd77 INTEGER DEFAULT 0  -- 1=export to OpenGD77, 0=don't export
);

-- Create indexes for common queries
CREATE INDEX idx_freq ON frequencies(frequency);
CREATE INDEX idx_mode ON frequencies(mode);
CREATE INDEX idx_county_state ON frequencies(county, state);
CREATE INDEX idx_service ON frequencies(service_type);
CREATE INDEX idx_active ON frequencies(active);
CREATE INDEX idx_distance ON frequencies(distance_from_kc);

-- Trunked system definitions
CREATE TABLE trunked_systems (
    id INTEGER PRIMARY KEY,
    system_id TEXT NOT NULL,           -- System ID from RadioReference
    name TEXT NOT NULL,                -- System name
    type TEXT NOT NULL,                -- System type (MARRS, MOSWIN, etc.)
    system_class TEXT,                 -- "Public Safety", "Business", "Mixed"
    business_type TEXT,                -- For business systems: Industry category
    business_owner TEXT,               -- For business systems: Owning company/entity
    description TEXT,                  -- Description of the system
    wacn TEXT,                         -- Wide Area Communications Network ID for P25
    system_protocol TEXT,              -- "P25", "LTR", "MPT-1327", "DMR", etc.
    notes TEXT,                        -- Additional notes
    active INTEGER DEFAULT 1,          -- 1=active, 0=inactive
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT                    -- Last modification timestamp
);

-- Sites belonging to trunked systems
CREATE TABLE trunked_sites (
    id INTEGER PRIMARY KEY,
    system_id INTEGER NOT NULL,        -- Foreign key to trunked_systems
    site_id TEXT NOT NULL,             -- Site ID from RadioReference
    name TEXT NOT NULL,                -- Site name
    description TEXT,                  -- Description of site
    county TEXT,                       -- County where site is located
    state TEXT,                        -- State where site is located
    latitude REAL,                     -- Site latitude
    longitude REAL,                    -- Site longitude
    range_miles REAL,                  -- Approximate coverage radius in miles
    nac TEXT,                          -- Network Access Code for P25 sites
    active INTEGER DEFAULT 1,          -- 1=active, 0=inactive
    distance_from_kc REAL,             -- Distance from KC center in miles
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT,                   -- Last modification timestamp
    FOREIGN KEY (system_id) REFERENCES trunked_systems(id)
);

-- Control channels and voice channels for trunked sites
CREATE TABLE trunked_frequencies (
    id INTEGER PRIMARY KEY,
    site_id INTEGER NOT NULL,          -- Foreign key to trunked_sites
    frequency REAL NOT NULL,           -- Frequency in MHz
    channel_type TEXT NOT NULL,        -- "control" or "voice"
    primary_control INTEGER DEFAULT 0, -- 1=primary control channel, 0=alternate
    notes TEXT,                        -- Additional notes
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT,                   -- Last modification timestamp
    FOREIGN KEY (site_id) REFERENCES trunked_sites(id)
);

-- Talkgroups for trunked systems
CREATE TABLE talkgroups (
    id INTEGER PRIMARY KEY,
    system_id INTEGER NOT NULL,        -- Foreign key to trunked_systems
    decimal_id INTEGER NOT NULL,       -- Decimal talkgroup ID
    hex_id TEXT,                       -- Hexadecimal talkgroup ID
    alpha_tag TEXT NOT NULL,           -- Alpha tag for display
    description TEXT,                  -- Description of talkgroup
    mode TEXT,                         -- D, DE, etc. (digital, encrypted)
    category TEXT,                     -- Category from RadioReference
    tag TEXT,                          -- Tag for sorting (Law Dispatch, Fire-Tac, etc.)
    priority INTEGER DEFAULT 0,        -- 1-5 priority (5=highest)
    active INTEGER DEFAULT 1,          -- 1=active, 0=inactive
    notes TEXT,                        -- Additional notes
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT,                   -- Last modification timestamp
    FOREIGN KEY (system_id) REFERENCES trunked_systems(id)
);

-- Radio definitions (for export profiles)
CREATE TABLE radios (
    id INTEGER PRIMARY KEY,
    name TEXT NOT NULL,                -- Radio name (e.g., "Baofeng UV-5R")
    type TEXT NOT NULL,                -- Radio type (e.g., "CHIRP", "Uniden", "SDRTrunk")
    min_frequency REAL,                -- Minimum tunable frequency in MHz
    max_frequency REAL,                -- Maximum tunable frequency in MHz
    supported_modes TEXT,              -- Comma-separated list of supported modes
    channel_capacity INTEGER,          -- Maximum number of channels
    notes TEXT,                        -- Additional notes
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT                    -- Last modification timestamp
);

-- Export profiles for radios
CREATE TABLE export_profiles (
    id INTEGER PRIMARY KEY,
    radio_id INTEGER NOT NULL,         -- Foreign key to radios
    name TEXT NOT NULL,                -- Profile name (e.g., "KC Metro Emergency")
    description TEXT,                  -- Description of the profile
    filter_query TEXT,                 -- SQL WHERE clause for filtering
    sort_order TEXT,                   -- SQL ORDER BY clause for sorting
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT,                   -- Last modification timestamp
    FOREIGN KEY (radio_id) REFERENCES radios(id)
);

-- Counties info for geographic filtering
CREATE TABLE counties (
    id INTEGER PRIMARY KEY,
    name TEXT NOT NULL,                -- County name
    state TEXT NOT NULL,               -- Two-letter state code
    fips_code TEXT,                    -- FIPS code for county
    region TEXT,                       -- Region label (e.g., "KC Core", "KC Metro", "Regional")
    distance_from_kc REAL,             -- Distance from KC center in miles
    notes TEXT,                        -- Additional notes
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT                    -- Last modification timestamp
);

-- View for CHIRP export
CREATE VIEW view_chirp_export AS
SELECT 
    id,
    name, 
    frequency, 
    duplex, 
    offset, 
    tone_mode, 
    tone_freq,
    mode,
    description
FROM frequencies
WHERE 
    export_chirp = 1 AND
    active = 1 AND
    ((frequency >= 136 AND frequency <= 174) OR 
     (frequency >= 400 AND frequency <= 520)) AND
    mode IN ('FM', 'NFM');

-- View for Uniden export
CREATE VIEW view_uniden_export AS
SELECT 
    id,
    name,
    frequency,
    mode,
    tone_mode,
    tone_freq,
    service_type,
    county,
    state,
    agency
FROM frequencies
WHERE 
    export_uniden = 1 AND
    active = 1;

-- View for SDRTrunk export (conventional channels)
CREATE VIEW view_sdrtrunk_conventional AS
SELECT 
    id,
    name,
    frequency,
    description,
    mode,
    county,
    state,
    agency,
    service_type
FROM frequencies
WHERE 
    export_sdrtrunk = 1 AND
    active = 1 AND
    mode IN ('DMR', 'P25', 'Project 25', 'NXDN');

-- View for OpenGD77 export
CREATE VIEW view_opengd77_export AS
SELECT 
    id,
    name,
    frequency,
    transmit_frequency,
    mode,
    tone_mode,
    tone_freq,
    duplex,
    offset,
    county,
    state,
    service_type
FROM frequencies
WHERE 
    export_opengd77 = 1 AND
    active = 1 AND
    ((frequency >= 136 AND frequency <= 174) OR 
     (frequency >= 400 AND frequency <= 470));

-- View for Kansas City area repeaters
CREATE VIEW view_kc_repeaters AS
SELECT 
    f.*
FROM frequencies f
JOIN counties c ON f.county = c.name AND f.state = c.state
WHERE 
    c.region IN ('KC Core', 'KC Metro') AND
    f.duplex != '' AND
    f.active = 1
ORDER BY f.frequency;

-- View for business trunked systems
CREATE VIEW view_business_trunked AS
SELECT 
    ts.id as system_id,
    ts.name as system_name,
    ts.business_type,
    ts.business_owner,
    ts.system_protocol,
    COUNT(DISTINCT s.id) as site_count,
    COUNT(DISTINCT tg.id) as talkgroup_count
FROM trunked_systems ts
LEFT JOIN trunked_sites s ON ts.id = s.system_id
LEFT JOIN talkgroups tg ON ts.id = tg.system_id
WHERE ts.system_class = 'Business'
GROUP BY ts.id, ts.name, ts.business_type, ts.business_owner, ts.system_protocol;

-- View for business frequencies
CREATE VIEW view_business_frequencies AS
SELECT 
    f.*
FROM frequencies f
WHERE 
    f.agency LIKE '%Business%' OR
    f.service_type = 'Business' OR
    f.tags LIKE '%business%' OR
    f.description LIKE '%business%' OR
    f.description LIKE '%commercial%'
ORDER BY f.frequency;
```