const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const csv = require('csv-parser');
const initSqlJs = require('sql.js');

// Paths
const DATA_DIR = path.join(__dirname, '..', 'data');
const DB_FILE = path.join(__dirname, '..', 'public', 'database.sqlite');
const ASSETS_DIR = path.join(__dirname, '..', 'public', 'assets');

async function main() {
  console.log('Initializing database...');
  
  // Make sure assets directory exists
  if (!fs.existsSync(ASSETS_DIR)) {
    fs.mkdirSync(ASSETS_DIR, { recursive: true });
  }
  
  // Initialize SQL.js
  console.log('Loading SQL.js...');
  const SQL = await initSqlJs();
  const db = new SQL.Database();
  
  // Create database schema
  console.log('Creating schema...');
  createSchema(db);
  
  // Import data
  console.log('Importing data...');
  await importData(db);
  
  // Save database to file
  console.log('Saving database...');
  const data = db.export();
  const buffer = Buffer.from(data);
  fs.writeFileSync(DB_FILE, buffer);
  
  console.log(`Database successfully created at ${DB_FILE}`);
}

function createSchema(db) {
  // Use transactions for better performance
  db.exec('BEGIN TRANSACTION');
  
  try {
    // Create frequencies table
    db.exec(`
      CREATE TABLE IF NOT EXISTS frequencies (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        frequency REAL NOT NULL,
        transmit_frequency REAL,
        name TEXT NOT NULL,
        description TEXT,
        alpha_tag TEXT,
        mode TEXT NOT NULL,
        tone_mode TEXT,
        tone_freq TEXT,
        county TEXT,
        state TEXT,
        agency TEXT,
        callsign TEXT,
        service_type TEXT,
        tags TEXT,
        duplex TEXT,
        offset REAL,
        last_verified TEXT,
        notes TEXT,
        source TEXT,
        active INTEGER DEFAULT 1,
        distance_from_kc REAL,
        latitude REAL,
        longitude REAL,
        class_station_code TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT,
        export_chirp INTEGER DEFAULT 0,
        export_uniden INTEGER DEFAULT 0,
        export_sdrtrunk INTEGER DEFAULT 0,
        export_sdrplus INTEGER DEFAULT 0,
        export_opengd77 INTEGER DEFAULT 0
      );
    `);

    // Create indices for commonly queried fields on frequencies table
    db.exec(`
      CREATE INDEX IF NOT EXISTS idx_frequencies_frequency ON frequencies(frequency);
      CREATE INDEX IF NOT EXISTS idx_frequencies_mode ON frequencies(mode);
      CREATE INDEX IF NOT EXISTS idx_frequencies_county ON frequencies(county);
      CREATE INDEX IF NOT EXISTS idx_frequencies_state ON frequencies(state);
      CREATE INDEX IF NOT EXISTS idx_frequencies_service_type ON frequencies(service_type);
      CREATE INDEX IF NOT EXISTS idx_frequencies_active ON frequencies(active);
    `);

    // Create trunked_systems table
    db.exec(`
      CREATE TABLE IF NOT EXISTS trunked_systems (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        system_id TEXT NOT NULL,
        name TEXT NOT NULL,
        type TEXT NOT NULL,
        system_class TEXT,
        business_type TEXT,
        business_owner TEXT,
        description TEXT,
        wacn TEXT,
        system_protocol TEXT,
        notes TEXT,
        active INTEGER DEFAULT 1,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT
      );
    `);

    // Create index for trunked_systems
    db.exec(`
      CREATE INDEX IF NOT EXISTS idx_trunked_systems_system_id ON trunked_systems(system_id);
      CREATE INDEX IF NOT EXISTS idx_trunked_systems_type ON trunked_systems(type);
      CREATE INDEX IF NOT EXISTS idx_trunked_systems_active ON trunked_systems(active);
    `);

    // Create trunked_sites table
    db.exec(`
      CREATE TABLE IF NOT EXISTS trunked_sites (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        system_id INTEGER NOT NULL,
        site_id TEXT NOT NULL,
        name TEXT NOT NULL,
        county TEXT,
        state TEXT,
        latitude REAL,
        longitude REAL,
        range_miles REAL,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT,
        FOREIGN KEY (system_id) REFERENCES trunked_systems(id)
      );
    `);

    // Create index for trunked_sites
    db.exec(`
      CREATE INDEX IF NOT EXISTS idx_trunked_sites_system_id ON trunked_sites(system_id);
    `);

    // Create talkgroups table
    db.exec(`
      CREATE TABLE IF NOT EXISTS talkgroups (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        system_id INTEGER NOT NULL,
        decimal_id INTEGER NOT NULL,
        hex_id TEXT,
        alpha_tag TEXT NOT NULL,
        description TEXT,
        mode TEXT,
        category TEXT,
        tag TEXT,
        priority INTEGER DEFAULT 0,
        active INTEGER DEFAULT 1,
        notes TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT,
        FOREIGN KEY (system_id) REFERENCES trunked_systems(id)
      );
    `);

    // Create index for talkgroups
    db.exec(`
      CREATE INDEX IF NOT EXISTS idx_talkgroups_system_id ON talkgroups(system_id);
      CREATE INDEX IF NOT EXISTS idx_talkgroups_decimal_id ON talkgroups(decimal_id);
      CREATE INDEX IF NOT EXISTS idx_talkgroups_active ON talkgroups(active);
    `);

    // Create counties table
    db.exec(`
      CREATE TABLE IF NOT EXISTS counties (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        state TEXT NOT NULL,
        region TEXT NOT NULL,
        distance_from_kc REAL NOT NULL,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT
      );
    `);

    // Create index for counties
    db.exec(`
      CREATE INDEX IF NOT EXISTS idx_counties_name ON counties(name);
      CREATE INDEX IF NOT EXISTS idx_counties_state ON counties(state);
    `);

    // Create radios table
    db.exec(`
      CREATE TABLE IF NOT EXISTS radios (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        type TEXT NOT NULL,
        min_frequency REAL NOT NULL,
        max_frequency REAL NOT NULL,
        supported_modes TEXT NOT NULL,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT
      );
    `);

    // Create export_profiles table
    db.exec(`
      CREATE TABLE IF NOT EXISTS export_profiles (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        radio_id INTEGER NOT NULL,
        name TEXT NOT NULL,
        filter_query TEXT NOT NULL,
        sort_order TEXT NOT NULL,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT,
        FOREIGN KEY (radio_id) REFERENCES radios(id)
      );
    `);

    // Create index for export_profiles
    db.exec(`
      CREATE INDEX IF NOT EXISTS idx_export_profiles_radio_id ON export_profiles(radio_id);
    `);

    // Create app_settings table
    db.exec(`
      CREATE TABLE IF NOT EXISTS app_settings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        key TEXT NOT NULL UNIQUE,
        value TEXT NOT NULL,
        type TEXT NOT NULL,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT
      );
    `);

    // Create index for app_settings
    db.exec(`
      CREATE INDEX IF NOT EXISTS idx_app_settings_key ON app_settings(key);
    `);

    // Commit the transaction
    db.exec('COMMIT');
  } catch (error) {
    // Rollback on error
    db.exec('ROLLBACK');
    console.error('Failed to create schema:', error);
    throw error;
  }
}

async function importData(db) {
  // Import trunked systems data
  await importTrunkedSystems(db);
  
  // Import frequencies data
  await importFrequencies(db);
  
  // Import counties data
  await importCounties(db);
  
  // Insert default radio models
  insertDefaultRadios(db);
  
  // Insert default settings
  insertDefaultSettings(db);
}

async function importTrunkedSystems(db) {
  console.log('Importing trunked systems...');
  
  // Get all trunked system files
  const tgFiles = fs.readdirSync(DATA_DIR).filter(file => file.startsWith('trs_tg_'));
  const siteFiles = fs.readdirSync(DATA_DIR).filter(file => file.startsWith('trs_sites_'));
  
  // Create a map of system IDs to track systems we've added
  const systems = new Map();
  
  // Process each system
  for (const tgFile of tgFiles) {
    // Extract system ID from filename (e.g., trs_tg_11761.csv -> 11761)
    const systemId = tgFile.replace('trs_tg_', '').replace('.csv', '');
    
    // Find corresponding site file
    const siteFile = siteFiles.find(file => file === `trs_sites_${systemId}.csv`);
    if (!siteFile) {
      console.warn(`No site file found for system ${systemId}, skipping...`);
      continue;
    }
    
    // Create system if not already in database
    if (!systems.has(systemId)) {
      const stmt = db.prepare(`
        INSERT INTO trunked_systems (system_id, name, type, active, created_at)
        VALUES (?, ?, ?, 1, CURRENT_TIMESTAMP)
      `);
      
      stmt.run([systemId, `System ${systemId}`, 'Unknown']);
      stmt.free();
      
      // Get the ID of the inserted system
      const result = db.exec(`SELECT last_insert_rowid() as id`);
      const sysDbId = result[0].values[0][0];
      
      systems.set(systemId, sysDbId);
      
      console.log(`Added system ${systemId} with database ID ${sysDbId}`);
    }
    
    const sysDbId = systems.get(systemId);
    
    // Process sites
    const sitesPath = path.join(DATA_DIR, siteFile);
    const sites = await parseCsvFile(sitesPath);
    
    for (const site of sites) {
      const stmt = db.prepare(`
        INSERT INTO trunked_sites (
          system_id, site_id, name, county, state, 
          latitude, longitude, range_miles, created_at
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      `);
      
      stmt.run([
        sysDbId,
        site.SiteID || site['Site ID'] || 'Unknown',
        site.Name || site.Description || 'Unknown',
        site.County || null,
        site.State || null,
        parseFloat(site.Latitude || 0),
        parseFloat(site.Longitude || 0),
        parseFloat(site.Range || 0),
      ]);
      
      stmt.free();
    }
    
    console.log(`Added ${sites.length} sites for system ${systemId}`);
    
    // Process talkgroups
    const tgPath = path.join(DATA_DIR, tgFile);
    const talkgroups = await parseCsvFile(tgPath);
    
    for (const tg of talkgroups) {
      const stmt = db.prepare(`
        INSERT INTO talkgroups (
          system_id, decimal_id, hex_id, alpha_tag, 
          description, mode, category, tag, priority, active, created_at
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1, CURRENT_TIMESTAMP)
      `);
      
      stmt.run([
        sysDbId,
        parseInt(tg.Dec || tg.ID || tg.DecID || 0),
        tg.Hex || null,
        tg.Alpha || tg.Name || tg.Description || 'Unknown',
        tg.Description || tg.Name || null,
        tg.Mode || 'D',
        tg.Category || tg.Tag || null,
        tg.Tag || tg.Category || null,
        parseInt(tg.Priority || 0),
      ]);
      
      stmt.free();
    }
    
    console.log(`Added ${talkgroups.length} talkgroups for system ${systemId}`);
  }
}

async function importFrequencies(db) {
  console.log('Importing frequencies...');
  
  // Parse the Common Frequencies markdown file if it exists
  const mdPath = path.join(DATA_DIR, 'Common Frequencies.md');
  if (fs.existsSync(mdPath)) {
    const mdContent = fs.readFileSync(mdPath, 'utf8');
    const frequencies = parseFrequenciesMd(mdContent);
    
    // Insert frequencies into the database
    for (const freq of frequencies) {
      const stmt = db.prepare(`
        INSERT INTO frequencies (
          frequency, name, description, mode, 
          tone_mode, tone_freq, county, state, 
          service_type, active, created_at
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1, CURRENT_TIMESTAMP)
      `);
      
      stmt.run([
        freq.frequency,
        freq.name,
        freq.description || null,
        freq.mode || 'FM',
        freq.toneMode || null,
        freq.toneFreq || null,
        freq.county || null,
        freq.state || 'MO',
        freq.serviceType || null,
      ]);
      
      stmt.free();
    }
    
    console.log(`Added ${frequencies.length} frequencies from markdown file`);
  }
  
  // Process various frequency CSV files
  const stationFiles = fs.readdirSync(DATA_DIR).filter(file => file.startsWith('stid_'));
  const countyFiles = fs.readdirSync(DATA_DIR).filter(file => file.startsWith('ctid_'));
  const areaFiles = fs.readdirSync(DATA_DIR).filter(file => file.startsWith('aid_'));
  
  // Import station frequencies
  for (const file of stationFiles) {
    const filePath = path.join(DATA_DIR, file);
    const stations = await parseCsvFile(filePath);
    
    for (const station of stations) {
      if (!station.Frequency) continue;
      
      const stmt = db.prepare(`
        INSERT INTO frequencies (
          frequency, transmit_frequency, name, description, 
          alpha_tag, mode, tone_mode, tone_freq, 
          county, state, agency, service_type, 
          active, created_at
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, CURRENT_TIMESTAMP)
      `);
      
      stmt.run([
        parseFloat(station.Frequency || 0),
        station.InputFreq ? parseFloat(station.InputFreq) : null,
        station.Name || station.Description || 'Unknown',
        station.Description || station.Comment || null,
        station.Alpha || station.Name || null,
        station.Mode || 'FM',
        station.ToneMode || null,
        station.ToneFreq || null,
        station.County || null,
        station.State || null,
        station.Agency || null,
        station.Service || station.Type || null,
      ]);
      
      stmt.free();
    }
    
    console.log(`Added ${stations.length} frequencies from ${file}`);
  }
  
  // Import county frequencies
  for (const file of countyFiles) {
    const filePath = path.join(DATA_DIR, file);
    const frequencies = await parseCsvFile(filePath);
    
    for (const freq of frequencies) {
      if (!freq.Frequency) continue;
      
      const stmt = db.prepare(`
        INSERT INTO frequencies (
          frequency, transmit_frequency, name, description, 
          alpha_tag, mode, tone_mode, tone_freq, 
          county, state, agency, service_type, 
          active, created_at
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, CURRENT_TIMESTAMP)
      `);
      
      stmt.run([
        parseFloat(freq.Frequency || 0),
        freq.InputFreq ? parseFloat(freq.InputFreq) : null,
        freq.Name || freq.Description || 'Unknown',
        freq.Description || freq.Comment || null,
        freq.Alpha || freq.Name || null,
        freq.Mode || 'FM',
        freq.ToneMode || null,
        freq.ToneFreq || null,
        freq.County || null,
        freq.State || null,
        freq.Agency || null,
        freq.Service || freq.Type || null,
      ]);
      
      stmt.free();
    }
    
    console.log(`Added ${frequencies.length} frequencies from ${file}`);
  }
}

async function importCounties(db) {
  console.log('Importing counties...');
  
  // Define KC metro counties
  const counties = [
    { name: 'Jackson', state: 'MO', region: 'KC Core', distance_from_kc: 0 },
    { name: 'Clay', state: 'MO', region: 'KC Core', distance_from_kc: 5 },
    { name: 'Platte', state: 'MO', region: 'KC Core', distance_from_kc: 7 },
    { name: 'Johnson', state: 'KS', region: 'KC Core', distance_from_kc: 8 },
    { name: 'Wyandotte', state: 'KS', region: 'KC Core', distance_from_kc: 3 },
    { name: 'Cass', state: 'MO', region: 'KC Metro', distance_from_kc: 20 },
    { name: 'Lafayette', state: 'MO', region: 'KC Metro', distance_from_kc: 35 },
    { name: 'Ray', state: 'MO', region: 'KC Metro', distance_from_kc: 25 },
    { name: 'Clinton', state: 'MO', region: 'KC Metro', distance_from_kc: 30 },
    { name: 'Leavenworth', state: 'KS', region: 'KC Metro', distance_from_kc: 25 },
    { name: 'Miami', state: 'KS', region: 'KC Metro', distance_from_kc: 40 },
    { name: 'Douglas', state: 'KS', region: 'Regional', distance_from_kc: 45 },
    { name: 'Franklin', state: 'KS', region: 'Regional', distance_from_kc: 50 },
    { name: 'Buchanan', state: 'MO', region: 'Regional', distance_from_kc: 55 },
    { name: 'Pettis', state: 'MO', region: 'Regional', distance_from_kc: 70 },
    { name: 'Johnson', state: 'MO', region: 'Regional', distance_from_kc: 50 },
  ];
  
  for (const county of counties) {
    const stmt = db.prepare(`
      INSERT INTO counties (name, state, region, distance_from_kc, created_at)
      VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
    `);
    
    stmt.run([
      county.name,
      county.state,
      county.region,
      county.distance_from_kc,
    ]);
    
    stmt.free();
  }
  
  console.log(`Added ${counties.length} counties`);
}

function insertDefaultRadios(db) {
  console.log('Adding default radio models...');
  
  const radios = [
    { 
      name: 'Baofeng UV-5R', 
      type: 'CHIRP',
      min_frequency: 136.0,
      max_frequency: 174.0,
      supported_modes: 'FM,FMN'
    },
    { 
      name: 'Uniden SDS100', 
      type: 'Uniden',
      min_frequency: 25.0,
      max_frequency: 1300.0,
      supported_modes: 'FM,FMN,AM,DMR,P25'
    },
    { 
      name: 'SDRTrunk', 
      type: 'SDRTrunk',
      min_frequency: 24.0,
      max_frequency: 1800.0,
      supported_modes: 'FM,FMN,AM,DMR,P25'
    },
    { 
      name: 'SDR++', 
      type: 'SDRPlus',
      min_frequency: 0.5,
      max_frequency: 2000.0,
      supported_modes: 'FM,FMN,AM,DMR,P25,WFM,USB,LSB'
    },
    { 
      name: 'OpenGD77', 
      type: 'OpenGD77',
      min_frequency: 136.0,
      max_frequency: 174.0,
      supported_modes: 'FM,DMR'
    },
  ];
  
  for (const radio of radios) {
    const stmt = db.prepare(`
      INSERT INTO radios (name, type, min_frequency, max_frequency, supported_modes, created_at)
      VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `);
    
    stmt.run([
      radio.name,
      radio.type,
      radio.min_frequency,
      radio.max_frequency,
      radio.supported_modes,
    ]);
    
    stmt.free();
  }
  
  console.log(`Added ${radios.length} radio models`);
}

function insertDefaultSettings(db) {
  console.log('Adding default settings...');
  
  const settings = [
    { key: 'darkMode', value: 'false', type: 'boolean' },
    { key: 'sidebarOpen', value: 'true', type: 'boolean' },
    { key: 'activeTab', value: 'frequencies', type: 'string' },
    { key: 'defaultCounty', value: 'Jackson', type: 'string' },
    { key: 'defaultState', value: 'MO', type: 'string' },
    { 
      key: 'modals', 
      value: JSON.stringify({
        frequency: false,
        trunkedSystem: false,
        export: false,
        settings: false
      }), 
      type: 'json' 
    },
  ];
  
  for (const setting of settings) {
    const stmt = db.prepare(`
      INSERT INTO app_settings (key, value, type, created_at)
      VALUES (?, ?, ?, CURRENT_TIMESTAMP)
    `);
    
    stmt.run([
      setting.key,
      setting.value,
      setting.type,
    ]);
    
    stmt.free();
  }
  
  console.log(`Added ${settings.length} settings`);
}

// Helper function to parse CSV files
async function parseCsvFile(filePath) {
  return new Promise((resolve, reject) => {
    const results = [];
    
    fs.createReadStream(filePath)
      .pipe(csv())
      .on('data', (data) => results.push(data))
      .on('end', () => resolve(results))
      .on('error', (error) => reject(error));
  });
}

// Helper function to parse frequencies from markdown
function parseFrequenciesMd(mdContent) {
  const frequencies = [];
  const lines = mdContent.split('\n');
  
  let inTable = false;
  let headers = [];
  
  for (const line of lines) {
    // Check for table start
    if (line.includes('|') && line.includes('---')) {
      inTable = true;
      
      // Get the headers from the previous line
      const headerLine = lines[lines.indexOf(line) - 1];
      headers = headerLine.split('|')
        .map(h => h.trim())
        .filter(h => h);
        
      continue;
    }
    
    // Process table rows
    if (inTable && line.includes('|')) {
      const cells = line.split('|')
        .map(c => c.trim())
        .filter(c => c);
      
      // Skip if not enough cells
      if (cells.length < 2) continue;
      
      // Create frequency object
      const freq = {};
      
      // Match headers to cells
      for (let i = 0; i < Math.min(headers.length, cells.length); i++) {
        const header = headers[i].toLowerCase();
        const cell = cells[i];
        
        if (header.includes('freq') && !header.includes('tone')) {
          freq.frequency = parseFloat(cell.replace('MHz', ''));
        } else if (header.includes('name') || header.includes('alpha')) {
          freq.name = cell;
        } else if (header.includes('desc')) {
          freq.description = cell;
        } else if (header.includes('mode')) {
          freq.mode = cell;
        } else if (header.includes('tone')) {
          if (cell && cell !== 'None') {
            freq.toneMode = 'TONE';
            freq.toneFreq = cell;
          }
        } else if (header.includes('county')) {
          freq.county = cell;
        } else if (header.includes('state')) {
          freq.state = cell;
        } else if (header.includes('service')) {
          freq.serviceType = cell;
        }
      }
      
      // Only add if we have a frequency and name
      if (freq.frequency && freq.name) {
        frequencies.push(freq);
      }
    }
    
    // Check for table end (blank line after table)
    if (inTable && line.trim() === '') {
      inTable = false;
    }
  }
  
  return frequencies;
}

// Run the script
main().catch(console.error); 
