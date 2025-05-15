# Kansas City Frequency Omnibus: Project Guide

---

## 1. Project Overview

The Kansas City Frequency Omnibus is a comprehensive, unified database and application for radio frequencies in the Kansas City metropolitan area. It is designed to serve as a single source of truth for radio programming, export, and management, supporting amateur, public safety, business, and trunked systems.

**Core Goals:**
- Centralize all relevant frequency data for the KC area
- Enable easy browsing, filtering, and export to multiple radio formats
- Maintain high data quality, accuracy, and up-to-date information

---

## 2. Technical Stack & Architecture

- **Frontend:** React 18 (TypeScript)
- **Database:** SQLite (via SQL.js in-browser)
- **State Management:** Zustand
- **UI:** Tailwind CSS, shadcn/ui
- **Build System:** Vite

**Supported Browsers:** Chrome 110+, Firefox 110+, Safari 16+, Edge 110+

---

## 3. Database Schema

The following schema is implemented in SQLite. All tables, indexes, and views must be created as specified.

```
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

-- (Other tables: trunked_systems, trunked_sites, trunked_frequencies, talkgroups, radios, export_profiles, counties)
-- (Indexes and views as in sqlite-schema.sql)
```

See `sqlite-schema.sql` for the full schema.

---

## 4. Data Models & TypeScript Interfaces

- See the "Data Models and TypeScript Interfaces" section in the project for all interfaces, including Frequency, TrunkedSystem, TrunkedSite, Talkgroup, Radio, ExportProfile, County, and their input/filter types.
- Constants for modes, service types, tone modes, and regions are defined for validation and UI.

---

## 5. Data Import, Normalization, and Export

### Import Workflow
- Import state and county CSVs, trunked system CSVs, and business frequency lists.
- Apply exclusion filters (hardware compatibility, encryption, unsupported digital modes, etc.).
- Normalize names, technical parameters, and geographic classification.
- Calculate derived fields (duplex, offset, distance from KC).

### Export Formats
- **CHIRP (Baofeng):** CSV, 8-char name limit, FM only
- **Uniden:** CSV, system/group/channel hierarchy
- **SDRTrunk:** JSON, trunked/conventional configs
- **OpenGD77:** CSV, DMR and FM
- **SDR++:** JSON bookmarks

---

## 6. Application Features

- Frequency browser with advanced filtering and search
- Trunked system browser (hierarchical: system → site → talkgroup)
- Add/edit/delete frequencies and trunked system components
- Export tools for all supported radio formats
- Import tools for CSV and custom lists
- Settings and backup/restore

---

## 7. State Management (Zustand)

- **Database Store:** Connection and status
- **Frequencies Store:** State, filters, selection, CRUD
- **Trunked Store:** State for trunked systems
- **UI Store:** UI state (filters, modals, etc.)
- **Export Store:** Export profile and state

---

## 8. Maintenance & Update Procedures

- Quarterly review and update of frequency data
- Field verification and on-air monitoring
- Version control and backup of database
- Automated validation and integrity checks

---

## 9. Reference Materials

- RadioReference documentation
- CHIRP, SDRTrunk, OpenGD77 guides
- FCC frequency allocation charts
- See `KC Frequency Master Doc.md` and `app-spec.md` for additional context

---

## 10. Appendix: Exclusion Logic (Python Example)

```
def should_include_frequency(entry):
    freq = entry.get('Frequency Output', 0)
    if not freq:
        return False
    supported_bands = [
        (25, 54), (108, 174), (225, 380), (400, 520)
    ]
    in_supported_band = any(low <= freq <= high for low, high in supported_bands)
    if not in_supported_band:
        return False
    mode = entry.get('Mode', '')
    unsupported_modes = ['D-STAR', 'YSF', 'TETRA', 'NXDN96']
    if mode in unsupported_modes:
        return False
    if mode == 'DE' or (entry.get('Description', '') and 'encrypted' in entry['Description'].lower()):
        return False
    description = entry.get('Description', '').lower()
    excluded_terms = ['dtr', 'wi-fi', 'wifi', 'frequency hopping', 'fhss', '900 mhz', 'theatro', 'encrypted', 'voice over ip']
    if any(term in description for term in excluded_terms):
        return False
    return True
```

---

## 11. File Structure (Recommended)

```
src/
├── assets/
├── components/
│   ├── common/
│   ├── data-table/
│   ├── export/
│   ├── filters/
│   └── layout/
├── data/
│   ├── models/
│   ├── schema/
│   └── initial-data/
├── db/
│   ├── migrations/
│   ├── queries/
│   └── core/
├── features/
│   ├── frequencies/
│   ├── trunked/
│   ├── export/
│   ├── import/
│   └── settings/
├── hooks/
├── lib/
│   ├── formatters/
│   ├── exporters/
│   └── validators/
├── services/
├── store/
└── App.tsx
```

---

## 12. Project Maintenance
- Keep this guide updated as the project evolves.
- Use this as the reference for all technical, data, and workflow questions.

---

*This document consolidates and supersedes `app-spec.md`, `KC Frequency Master Doc.md`, and `sqlite-schema.sql` as the project's single source of truth.* 
