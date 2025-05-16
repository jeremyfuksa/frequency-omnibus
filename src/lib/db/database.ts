import initSqlJs, { Database, SqlJsStatic } from 'sql.js';

export class DatabaseService {
  private static instance: DatabaseService;
  private db: Database | null = null;
  private sql: SqlJsStatic | null = null;

  private constructor() {}

  public static getInstance(): DatabaseService {
    if (!DatabaseService.instance) {
      DatabaseService.instance = new DatabaseService();
    }
    return DatabaseService.instance;
  }

  public async initialize(): Promise<void> {
    try {
      // Bundle SQL.js with the application instead of loading from CDN
      this.sql = await initSqlJs({
        locateFile: file => `./assets/${file}`
      });
      
      // Load the SQLite database file
      const response = await fetch('./database.sqlite');
      const arrayBuffer = await response.arrayBuffer();
      const data = new Uint8Array(arrayBuffer);
      
      // Create a database using the file data
      this.db = new this.sql.Database(data);
      
      console.log('Database loaded successfully');
    } catch (error) {
      console.error('Failed to initialize database:', error);
      
      // Create a new database if loading fails
      if (this.sql) {
        console.log('Creating a new database');
        this.db = new this.sql.Database();
        await this.initializeSchema();
      } else {
        throw error;
      }
    }
  }

  private async initializeSchema(): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    // Use a transaction for faster schema creation
    this.db.exec('BEGIN TRANSACTION');
    
    try {
      // Create frequencies table
      this.db.exec(`
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
      this.db.exec(`
        CREATE INDEX IF NOT EXISTS idx_frequencies_frequency ON frequencies(frequency);
        CREATE INDEX IF NOT EXISTS idx_frequencies_mode ON frequencies(mode);
        CREATE INDEX IF NOT EXISTS idx_frequencies_county ON frequencies(county);
        CREATE INDEX IF NOT EXISTS idx_frequencies_state ON frequencies(state);
        CREATE INDEX IF NOT EXISTS idx_frequencies_service_type ON frequencies(service_type);
        CREATE INDEX IF NOT EXISTS idx_frequencies_active ON frequencies(active);
      `);

      // Create trunked_systems table
      this.db.exec(`
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
      this.db.exec(`
        CREATE INDEX IF NOT EXISTS idx_trunked_systems_system_id ON trunked_systems(system_id);
        CREATE INDEX IF NOT EXISTS idx_trunked_systems_type ON trunked_systems(type);
        CREATE INDEX IF NOT EXISTS idx_trunked_systems_active ON trunked_systems(active);
      `);

      // Create trunked_sites table
      this.db.exec(`
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
      this.db.exec(`
        CREATE INDEX IF NOT EXISTS idx_trunked_sites_system_id ON trunked_sites(system_id);
      `);

      // Create talkgroups table
      this.db.exec(`
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
      this.db.exec(`
        CREATE INDEX IF NOT EXISTS idx_talkgroups_system_id ON talkgroups(system_id);
        CREATE INDEX IF NOT EXISTS idx_talkgroups_decimal_id ON talkgroups(decimal_id);
        CREATE INDEX IF NOT EXISTS idx_talkgroups_active ON talkgroups(active);
      `);

      // Create counties table
      this.db.exec(`
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
      this.db.exec(`
        CREATE INDEX IF NOT EXISTS idx_counties_name ON counties(name);
        CREATE INDEX IF NOT EXISTS idx_counties_state ON counties(state);
      `);

      // Create radios table
      this.db.exec(`
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
      this.db.exec(`
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
      this.db.exec(`
        CREATE INDEX IF NOT EXISTS idx_export_profiles_radio_id ON export_profiles(radio_id);
      `);

      // Create app_settings table
      this.db.exec(`
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
      this.db.exec(`
        CREATE INDEX IF NOT EXISTS idx_app_settings_key ON app_settings(key);
      `);

      // Create specialized database views
      
      // CHIRP Export View - Conventional frequencies formatted for CHIRP export
      this.db.exec(`
        DROP VIEW IF EXISTS view_chirp_export;
        CREATE VIEW view_chirp_export AS
        SELECT 
          id,
          frequency,
          name,
          alpha_tag,
          duplex,
          offset,
          tone_mode,
          tone_freq,
          mode,
          'KC Frequency Omnibus' AS comment
        FROM frequencies
        WHERE export_chirp = 1 AND active = 1;
      `);
      
      // Uniden Export View - Frequencies formatted for Uniden scanner import
      this.db.exec(`
        DROP VIEW IF EXISTS view_uniden_export;
        CREATE VIEW view_uniden_export AS
        SELECT 
          id,
          frequency,
          name,
          alpha_tag,
          mode,
          tone_mode,
          tone_freq,
          county,
          state,
          service_type
        FROM frequencies
        WHERE export_uniden = 1 AND active = 1;
      `);
      
      // SDRTrunk Conventional View - Conventional systems for SDRTrunk
      this.db.exec(`
        DROP VIEW IF EXISTS view_sdrtrunk_conventional;
        CREATE VIEW view_sdrtrunk_conventional AS
        SELECT 
          id,
          frequency,
          name,
          description,
          mode,
          county,
          state,
          service_type
        FROM frequencies
        WHERE export_sdrtrunk = 1 AND active = 1;
      `);
      
      // OpenGD77 Export View - Frequencies formatted for OpenGD77 DMR radio
      this.db.exec(`
        DROP VIEW IF EXISTS view_opengd77_export;
        CREATE VIEW view_opengd77_export AS
        SELECT 
          id,
          frequency,
          transmit_frequency,
          name,
          alpha_tag,
          mode,
          tone_mode,
          tone_freq
        FROM frequencies
        WHERE export_opengd77 = 1 AND active = 1 AND (mode = 'DMR' OR mode = 'FM' OR mode = 'FMN');
      `);
      
      // KC Repeaters View - All repeaters in KC area
      this.db.exec(`
        DROP VIEW IF EXISTS view_kc_repeaters;
        CREATE VIEW view_kc_repeaters AS
        SELECT 
          id,
          frequency,
          transmit_frequency,
          name,
          description,
          mode,
          tone_mode,
          tone_freq,
          county,
          callsign
        FROM frequencies
        WHERE distance_from_kc <= 50 
          AND active = 1 
          AND (duplex = '+' OR duplex = '-')
          AND transmit_frequency IS NOT NULL;
      `);
      
      // Business Trunked View - Business trunked systems
      this.db.exec(`
        DROP VIEW IF EXISTS view_business_trunked;
        CREATE VIEW view_business_trunked AS
        SELECT 
          ts.id,
          ts.system_id,
          ts.name,
          ts.description,
          ts.business_type,
          ts.business_owner
        FROM trunked_systems ts
        WHERE ts.system_class = 'Business'
          AND ts.active = 1;
      `);
      
      // Business Frequencies View - Conventional business frequencies
      this.db.exec(`
        DROP VIEW IF EXISTS view_business_frequencies;
        CREATE VIEW view_business_frequencies AS
        SELECT 
          id,
          frequency,
          name,
          description,
          mode,
          agency,
          service_type
        FROM frequencies
        WHERE service_type = 'Business'
          AND active = 1;
      `);

      // Commit the transaction
      this.db.exec('COMMIT');
    } catch (error) {
      // Rollback on error
      this.db.exec('ROLLBACK');
      console.error('Failed to initialize schema:', error);
      throw error;
    }
  }

  public async query<T>(sql: string, params: any[] = []): Promise<T[]> {
    if (!this.db) throw new Error('Database not initialized');
    
    const stmt = this.db.prepare(sql);
    
    // Bind parameters consistently
    if (params.length > 0) {
      stmt.bind(params);
    }
    
    const results: T[] = [];
    
    while (stmt.step()) {
      results.push(stmt.getAsObject() as T);
    }
    
    stmt.free();
    return results;
  }

  public async execute(sql: string, params: any[] = []): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    
    if (params.length > 0) {
      const stmt = this.db.prepare(sql);
      stmt.bind(params);
      stmt.step();
      stmt.free();
    } else {
      this.db.exec(sql);
    }
  }

  public async executeTransaction(sqlStatements: string[]): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    
    this.db.exec('BEGIN TRANSACTION');
    
    try {
      for (const sql of sqlStatements) {
        this.db.exec(sql);
      }
      this.db.exec('COMMIT');
    } catch (error) {
      this.db.exec('ROLLBACK');
      throw error;
    }
  }

  public async backup(): Promise<Uint8Array> {
    if (!this.db) throw new Error('Database not initialized');
    return this.db.export();
  }

  public async restore(data: Uint8Array): Promise<void> {
    if (!this.sql) throw new Error('SQL.js not initialized');
    this.db = new this.sql.Database(data);
  }

  public close(): void {
    if (this.db) {
      this.db.close();
      this.db = null;
    }
  }
} 
