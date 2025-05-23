import { FrequencyData, Category, AnalysisResult, ImportResult, ExportConfig } from '../../types/database';
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
      if (!this.sql) throw new Error('SQL.js not initialized');
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
        )
      `);

      // Create indices for commonly queried fields on frequencies table
      this.db.exec(`
        CREATE INDEX IF NOT EXISTS idx_frequencies_frequency ON frequencies(frequency);
        CREATE INDEX IF NOT EXISTS idx_frequencies_mode ON frequencies(mode);
        CREATE INDEX IF NOT EXISTS idx_frequencies_county ON frequencies(county);
        CREATE INDEX IF NOT EXISTS idx_frequencies_state ON frequencies(state);
        CREATE INDEX IF NOT EXISTS idx_frequencies_service_type ON frequencies(service_type);
        CREATE INDEX IF NOT EXISTS idx_frequencies_active ON frequencies(active)
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
        )
      `);

      // Create index for trunked_systems
      this.db.exec(`
        CREATE INDEX IF NOT EXISTS idx_trunked_systems_system_id ON trunked_systems(system_id);
        CREATE INDEX IF NOT EXISTS idx_trunked_systems_type ON trunked_systems(type);
        CREATE INDEX IF NOT EXISTS idx_trunked_systems_active ON trunked_systems(active)
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
        )
      `);

      // Create index for trunked_sites
      this.db.exec(`
        CREATE INDEX IF NOT EXISTS idx_trunked_sites_system_id ON trunked_sites(system_id)
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
        )
      `);

      // Create index for talkgroups
      this.db.exec(`
        CREATE INDEX IF NOT EXISTS idx_talkgroups_system_id ON talkgroups(system_id);
        CREATE INDEX IF NOT EXISTS idx_talkgroups_decimal_id ON talkgroups(decimal_id);
        CREATE INDEX IF NOT EXISTS idx_talkgroups_active ON talkgroups(active)
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
        )
      `);

      // Create index for counties
      this.db.exec(`
        CREATE INDEX IF NOT EXISTS idx_counties_name ON counties(name);
        CREATE INDEX IF NOT EXISTS idx_counties_state ON counties(state)
      `);

      // Create radios table
      this.db.exec(`
        CREATE TABLE IF NOT EXISTS radios (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          model TEXT NOT NULL,
          manufacturer TEXT NOT NULL,
          type TEXT NOT NULL,
          description TEXT,
          notes TEXT,
          created_at TEXT DEFAULT CURRENT_TIMESTAMP,
          updated_at TEXT
        )
      `);

      // Create index for radios
      this.db.exec(`
        CREATE INDEX IF NOT EXISTS idx_radios_name ON radios(name);
        CREATE INDEX IF NOT EXISTS idx_radios_model ON radios(model);
        CREATE INDEX IF NOT EXISTS idx_radios_manufacturer ON radios(manufacturer)
      `);

      // Create frequency_data table for our new functionality
      this.db.exec(`
        CREATE TABLE IF NOT EXISTS frequency_data (
          id TEXT PRIMARY KEY,
          timestamp DATETIME,
          value REAL,
          category TEXT,
          metadata TEXT
        )
      `);

      this.db.exec(`
        CREATE INDEX IF NOT EXISTS idx_frequency_data_category ON frequency_data(category);
        CREATE INDEX IF NOT EXISTS idx_frequency_data_timestamp ON frequency_data(timestamp)
      `);

      this.db.exec('COMMIT');
    } catch (error) {
      if (this.db) {
        this.db.exec('ROLLBACK');
      }
      throw error;
    }
  }

  public async addFrequencyData(data: FrequencyData): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    
    const stmt = this.db.prepare(`
      INSERT INTO frequency_data (id, timestamp, value, category, metadata)
      VALUES (?, ?, ?, ?, ?)
    `);
    
    stmt.run([
      data.id,
      data.timestamp.toISOString(),
      data.value,
      data.category,
      JSON.stringify(data.metadata)
    ]);
    
    stmt.free();
  }

  public async getFrequencyData(category?: string, startDate?: Date, endDate?: Date): Promise<FrequencyData[]> {
    if (!this.db) throw new Error('Database not initialized');
    
    let query = 'SELECT * FROM frequency_data WHERE 1=1';
    const params: (string | number)[] = [];
    
    if (category) {
      query += ' AND category = ?';
      params.push(category);
    }
    
    if (startDate) {
      query += ' AND timestamp >= ?';
      params.push(startDate.toISOString());
    }
    
    if (endDate) {
      query += ' AND timestamp <= ?';
      params.push(endDate.toISOString());
    }
    
    const stmt = this.db.prepare(query);
    const results = stmt.getAsObject(params);
    stmt.free();
    
    return Object.values(results).map((row: any) => ({
      id: row.id,
      timestamp: new Date(row.timestamp),
      value: row.value,
      category: row.category,
      metadata: JSON.parse(row.metadata)
    }));
  }

  public async addCategory(category: Category): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    
    const stmt = this.db.prepare(`
      INSERT INTO categories (id, name, description, color)
      VALUES (?, ?, ?, ?)
    `);
    
    stmt.run([
      category.id,
      category.name,
      category.description || null,
      category.color || null
    ]);
    
    stmt.free();
  }

  public async getCategories(): Promise<Category[]> {
    if (!this.db) throw new Error('Database not initialized');
    
    const stmt = this.db.prepare('SELECT * FROM categories');
    const results = stmt.getAsObject();
    stmt.free();
    
    return Object.values(results).map((row: any) => ({
      id: row.id,
      name: row.name,
      description: row.description || undefined,
      color: row.color || undefined
    }));
  }

  public async saveAnalysisResult(result: AnalysisResult): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    
    const stmt = this.db.prepare(`
      INSERT INTO analysis_results (id, category, average, min, max, standard_deviation, timestamp)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    
    stmt.run([
      result.id,
      result.category,
      result.average,
      result.min,
      result.max,
      result.standardDeviation,
      result.timestamp.toISOString()
    ]);
    
    stmt.free();
  }

  public async exportData(config: ExportConfig): Promise<string> {
    if (!this.db) throw new Error('Database not initialized');
    
    const data = await this.getFrequencyData(
      config.categories?.[0],
      config.dateRange.start,
      config.dateRange.end
    );
    
    switch (config.format) {
      case 'json':
        return JSON.stringify(data, null, 2);
      case 'csv':
        return this.convertToCSV(data);
      default:
        throw new Error('Unsupported export format');
    }
  }

  private convertToCSV(data: FrequencyData[]): string {
    const headers = ['id', 'timestamp', 'value', 'category', 'metadata'];
    const rows = data.map(item => [
      item.id,
      item.timestamp.toISOString(),
      item.value,
      item.category,
      JSON.stringify(item.metadata)
    ]);
    
    return [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');
  }

  public async importData(data: string, format: 'csv' | 'json'): Promise<ImportResult> {
    if (!this.db) throw new Error('Database not initialized');
    
    const result: ImportResult = {
      success: true,
      totalRecords: 0,
      importedRecords: 0,
      errors: []
    };
    
    try {
      let records: any[];
      
      if (format === 'json') {
        records = JSON.parse(data);
      } else {
        records = this.parseCSV(data);
      }
      
      result.totalRecords = records.length;
      
      for (let i = 0; i < records.length; i++) {
        try {
          const record = records[i];
          await this.addFrequencyData({
            id: record.id || crypto.randomUUID(),
            timestamp: new Date(record.timestamp),
            value: Number(record.value),
            category: record.category,
            metadata: record.metadata || {}
          });
          result.importedRecords++;
        } catch (error) {
          result.errors.push({
            row: i + 1,
            message: error instanceof Error ? error.message : 'Unknown error'
          });
        }
      }
    } catch (error) {
      result.success = false;
      result.errors.push({
        row: 0,
        message: error instanceof Error ? error.message : 'Failed to parse data'
      });
    }
    
    return result;
  }

  private parseCSV(csv: string): any[] {
    const lines = csv.split('\n');
    const headers = lines[0].split(',');
    
    return lines.slice(1).map(line => {
      const values = line.split(',');
      const record: any = {};
      
      headers.forEach((header, index) => {
        record[header.trim()] = values[index]?.trim();
      });
      
      return record;
    });
  }

  public async query<T>(sql: string, params: any[] = []): Promise<T[]> {
    if (!this.db) throw new Error('Database not initialized');
    
    const stmt = this.db.prepare(sql);
    const results = stmt.getAsObject(params);
    stmt.free();
    
    return Object.values(results) as unknown as T[];
  }

  public async execute(sql: string, params: any[] = []): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    
    const stmt = this.db.prepare(sql);
    stmt.run(params);
    stmt.free();
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
    if (!this.db) throw new Error('Database not initialized');
    if (!this.sql) throw new Error('SQL.js not initialized');
    
    this.db.close();
    this.db = new this.sql.Database(data);
  }

  public close(): void {
    if (this.db) {
      this.db.close();
      this.db = null;
    }
  }
} 
