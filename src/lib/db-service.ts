import { Database } from 'sql.js'
import { 
  Frequency, 
  TrunkedSystem, 
  TrunkedSite, 
  Talkgroup,
  Radio,
  ExportProfile,
  County,
  FrequencyFilter,
  TrunkedSystemFilter,
  TalkgroupFilter
} from '../types/models'

export class DatabaseService {
  private db: Database

  constructor(db: Database) {
    this.db = db
  }

  async initSchema(): Promise<void> {
    const schema = `
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
        active INTEGER NOT NULL DEFAULT 1,
        distance_from_kc REAL,
        latitude REAL,
        longitude REAL,
        class_station_code TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT,
        export_chirp INTEGER NOT NULL DEFAULT 0,
        export_uniden INTEGER NOT NULL DEFAULT 0,
        export_sdrtrunk INTEGER NOT NULL DEFAULT 0,
        export_sdrplus INTEGER NOT NULL DEFAULT 0,
        export_opengd77 INTEGER NOT NULL DEFAULT 0
      );

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
        active INTEGER NOT NULL DEFAULT 1,
        created_at TEXT NOT NULL,
        updated_at TEXT
      );

      CREATE TABLE IF NOT EXISTS trunked_sites (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        system_id INTEGER NOT NULL,
        site_id TEXT NOT NULL,
        name TEXT NOT NULL,
        description TEXT,
        county TEXT,
        state TEXT,
        latitude REAL,
        longitude REAL,
        range_miles REAL,
        nac TEXT,
        active INTEGER NOT NULL DEFAULT 1,
        distance_from_kc REAL,
        created_at TEXT NOT NULL,
        updated_at TEXT,
        FOREIGN KEY (system_id) REFERENCES trunked_systems(id)
      );

      CREATE TABLE IF NOT EXISTS talkgroups (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        system_id INTEGER NOT NULL,
        talkgroup_id TEXT NOT NULL,
        name TEXT NOT NULL,
        description TEXT,
        alpha_tag TEXT,
        mode TEXT,
        priority INTEGER,
        active INTEGER NOT NULL DEFAULT 1,
        created_at TEXT NOT NULL,
        updated_at TEXT,
        FOREIGN KEY (system_id) REFERENCES trunked_systems(id)
      );

      CREATE TABLE IF NOT EXISTS radios (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        model TEXT NOT NULL,
        manufacturer TEXT NOT NULL,
        description TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT
      );

      CREATE TABLE IF NOT EXISTS export_profiles (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        description TEXT,
        radio_id INTEGER,
        created_at TEXT NOT NULL,
        updated_at TEXT,
        FOREIGN KEY (radio_id) REFERENCES radios(id)
      );

      CREATE TABLE IF NOT EXISTS counties (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        state TEXT NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT
      );

      -- Create specialized database views
      
      -- CHIRP Export View - Conventional frequencies formatted for CHIRP export
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
      
      -- Uniden Export View - Frequencies formatted for Uniden scanner import
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
      
      -- SDRTrunk Conventional View - Conventional systems for SDRTrunk
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
      
      -- OpenGD77 Export View - Frequencies formatted for OpenGD77 DMR radio
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
      
      -- KC Repeaters View - All repeaters in KC area
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
      
      -- Business Trunked View - Business trunked systems
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
      
      -- Business Frequencies View - Conventional business frequencies
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
    `
    this.db.exec(schema)
  }

  // Helper function to convert SQL values to appropriate types
  private convertSqlValue(value: any): any {
    if (value === null) return null
    if (typeof value === 'number') return value
    if (typeof value === 'string') {
      // Try to parse as number if it looks like one
      if (/^-?\d*\.?\d+$/.test(value)) {
        return parseFloat(value)
      }
      return value
    }
    return value
  }

  // Frequency Operations
  async getFrequencies(filter?: FrequencyFilter): Promise<Frequency[]> {
    let query = 'SELECT * FROM frequencies'
    const params: any[] = []
    
    if (filter) {
      const conditions = []
      if (filter.mode) {
        conditions.push('mode = ?')
        params.push(filter.mode)
      }
      if (filter.service_type) {
        conditions.push('service_type = ?')
        params.push(filter.service_type)
      }
      if (filter.county) {
        conditions.push('county = ?')
        params.push(filter.county)
      }
      if (filter.state) {
        conditions.push('state = ?')
        params.push(filter.state)
      }
      if (filter.active !== undefined) {
        conditions.push('active = ?')
        params.push(filter.active ? 1 : 0)
      }
      if (filter.distance_from_kc) {
        conditions.push('distance_from_kc <= ?')
        params.push(filter.distance_from_kc)
      }
      if (filter.search) {
        conditions.push('(name LIKE ? OR description LIKE ? OR alpha_tag LIKE ?)')
        const searchTerm = `%${filter.search}%`
        params.push(searchTerm, searchTerm, searchTerm)
      }
      if (conditions.length > 0) {
        query += ' WHERE ' + conditions.join(' AND ')
      }
    }

    const result = this.db.exec(query, params)
    return result[0]?.values.map(row => ({
      id: this.convertSqlValue(row[0]) as number,
      frequency: this.convertSqlValue(row[1]) as number,
      transmit_frequency: this.convertSqlValue(row[2]),
      name: this.convertSqlValue(row[3]) as string,
      description: this.convertSqlValue(row[4]),
      alpha_tag: this.convertSqlValue(row[5]),
      mode: this.convertSqlValue(row[6]) as string,
      tone_mode: this.convertSqlValue(row[7]),
      tone_freq: this.convertSqlValue(row[8]),
      county: this.convertSqlValue(row[9]),
      state: this.convertSqlValue(row[10]),
      agency: this.convertSqlValue(row[11]),
      callsign: this.convertSqlValue(row[12]),
      service_type: this.convertSqlValue(row[13]),
      tags: this.convertSqlValue(row[14]),
      duplex: this.convertSqlValue(row[15]),
      offset: this.convertSqlValue(row[16]),
      last_verified: this.convertSqlValue(row[17]),
      notes: this.convertSqlValue(row[18]),
      source: this.convertSqlValue(row[19]),
      active: this.convertSqlValue(row[20]) as number,
      distance_from_kc: this.convertSqlValue(row[21]),
      latitude: this.convertSqlValue(row[22]),
      longitude: this.convertSqlValue(row[23]),
      class_station_code: this.convertSqlValue(row[24]),
      created_at: this.convertSqlValue(row[25]) as string,
      updated_at: this.convertSqlValue(row[26]),
      export_chirp: this.convertSqlValue(row[27]) as number,
      export_uniden: this.convertSqlValue(row[28]) as number,
      export_sdrtrunk: this.convertSqlValue(row[29]) as number,
      export_sdrplus: this.convertSqlValue(row[30]) as number,
      export_opengd77: this.convertSqlValue(row[31]) as number
    })) || []
  }

  async addFrequency(frequency: Omit<Frequency, 'id'>): Promise<number> {
    const query = `
      INSERT INTO frequencies (
        frequency, transmit_frequency, name, description, alpha_tag, mode, 
        tone_mode, tone_freq, county, state, agency, callsign, service_type, 
        tags, duplex, offset, last_verified, notes, source, active, 
        distance_from_kc, latitude, longitude, class_station_code, created_at, 
        updated_at, export_chirp, export_uniden, export_sdrtrunk, export_sdrplus, 
        export_opengd77
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `
    const params = [
      frequency.frequency,
      frequency.transmit_frequency,
      frequency.name,
      frequency.description,
      frequency.alpha_tag,
      frequency.mode,
      frequency.tone_mode,
      frequency.tone_freq,
      frequency.county,
      frequency.state,
      frequency.agency,
      frequency.callsign,
      frequency.service_type,
      frequency.tags,
      frequency.duplex,
      frequency.offset,
      frequency.last_verified,
      frequency.notes,
      frequency.source,
      frequency.active,
      frequency.distance_from_kc,
      frequency.latitude,
      frequency.longitude,
      frequency.class_station_code,
      frequency.created_at,
      frequency.updated_at,
      frequency.export_chirp,
      frequency.export_uniden,
      frequency.export_sdrtrunk,
      frequency.export_sdrplus,
      frequency.export_opengd77
    ]

    this.db.run(query, params)
    return this.convertSqlValue(this.db.exec('SELECT last_insert_rowid()')[0].values[0][0]) as number
  }

  async updateFrequency(id: number, frequency: Partial<Frequency>): Promise<void> {
    const updates = []
    const params: any[] = []
    
    for (const [key, value] of Object.entries(frequency)) {
      if (key !== 'id' && value !== undefined) {
        updates.push(`${key} = ?`)
        params.push(value)
      }
    }

    if (updates.length > 0) {
      params.push(id)
      const query = `UPDATE frequencies SET ${updates.join(', ')} WHERE id = ?`
      this.db.run(query, params)
    }
  }

  async deleteFrequency(id: number): Promise<void> {
    this.db.run('DELETE FROM frequencies WHERE id = ?', [id])
  }

  // Trunked System Operations
  async getTrunkedSystems(filter?: TrunkedSystemFilter): Promise<TrunkedSystem[]> {
    let query = 'SELECT * FROM trunked_systems'
    const params: any[] = []
    
    if (filter) {
      const conditions = []
      if (filter.type) {
        conditions.push('type = ?')
        params.push(filter.type)
      }
      if (filter.system_class) {
        conditions.push('system_class = ?')
        params.push(filter.system_class)
      }
      if (filter.active !== undefined) {
        conditions.push('active = ?')
        params.push(filter.active ? 1 : 0)
      }
      if (filter.search) {
        conditions.push('(name LIKE ? OR description LIKE ?)')
        const searchTerm = `%${filter.search}%`
        params.push(searchTerm, searchTerm)
      }
      if (conditions.length > 0) {
        query += ' WHERE ' + conditions.join(' AND ')
      }
    }

    const result = this.db.exec(query, params)
    return result[0]?.values.map(row => ({
      id: this.convertSqlValue(row[0]) as number,
      system_id: this.convertSqlValue(row[1]) as string,
      name: this.convertSqlValue(row[2]) as string,
      type: this.convertSqlValue(row[3]) as string,
      system_class: this.convertSqlValue(row[4]),
      business_type: this.convertSqlValue(row[5]),
      business_owner: this.convertSqlValue(row[6]),
      description: this.convertSqlValue(row[7]),
      wacn: this.convertSqlValue(row[8]),
      system_protocol: this.convertSqlValue(row[9]),
      notes: this.convertSqlValue(row[10]),
      active: this.convertSqlValue(row[11]) as number,
      created_at: this.convertSqlValue(row[12]) as string,
      updated_at: this.convertSqlValue(row[13])
    })) || []
  }

  async getSites(systemId: number): Promise<TrunkedSite[]> {
    const result = this.db.exec('SELECT * FROM trunked_sites WHERE system_id = ?', [systemId])
    return result[0]?.values.map(row => ({
      id: this.convertSqlValue(row[0]) as number,
      system_id: this.convertSqlValue(row[1]) as number,
      site_id: this.convertSqlValue(row[2]) as string,
      name: this.convertSqlValue(row[3]) as string,
      description: this.convertSqlValue(row[4]),
      county: this.convertSqlValue(row[5]),
      state: this.convertSqlValue(row[6]),
      latitude: this.convertSqlValue(row[7]),
      longitude: this.convertSqlValue(row[8]),
      range_miles: this.convertSqlValue(row[9]),
      nac: this.convertSqlValue(row[10]),
      active: this.convertSqlValue(row[11]) as number,
      distance_from_kc: this.convertSqlValue(row[12]),
      created_at: this.convertSqlValue(row[13]) as string,
      updated_at: this.convertSqlValue(row[14])
    })) || []
  }

  async getTalkgroups(systemId: number, filter?: TalkgroupFilter): Promise<Talkgroup[]> {
    let query = 'SELECT * FROM talkgroups WHERE system_id = ?'
    const params: any[] = [systemId]
    
    if (filter) {
      if (filter.category) {
        query += ' AND category = ?'
        params.push(filter.category)
      }
      if (filter.mode) {
        query += ' AND mode = ?'
        params.push(filter.mode)
      }
      if (filter.active !== undefined) {
        query += ' AND active = ?'
        params.push(filter.active ? 1 : 0)
      }
      if (filter.search) {
        query += ' AND (alpha_tag LIKE ? OR description LIKE ?)'
        const searchTerm = `%${filter.search}%`
        params.push(searchTerm, searchTerm)
      }
    }

    const result = this.db.exec(query, params)
    return result[0]?.values.map(row => ({
      id: this.convertSqlValue(row[0]) as number,
      system_id: this.convertSqlValue(row[1]) as number,
      decimal_id: this.convertSqlValue(row[2]) as number,
      hex_id: this.convertSqlValue(row[3]),
      alpha_tag: this.convertSqlValue(row[4]) as string,
      description: this.convertSqlValue(row[5]),
      mode: this.convertSqlValue(row[6]),
      category: this.convertSqlValue(row[7]),
      tag: this.convertSqlValue(row[8]),
      priority: this.convertSqlValue(row[9]) as number,
      active: this.convertSqlValue(row[10]) as number,
      notes: this.convertSqlValue(row[11]),
      created_at: this.convertSqlValue(row[12]) as string,
      updated_at: this.convertSqlValue(row[13])
    })) || []
  }

  // Radio Operations
  async getRadios(): Promise<Radio[]> {
    const result = this.db.exec('SELECT * FROM radios')
    return result[0]?.values.map(row => ({
      id: this.convertSqlValue(row[0]) as number,
      name: this.convertSqlValue(row[1]) as string,
      type: this.convertSqlValue(row[2]) as string,
      min_frequency: this.convertSqlValue(row[3]),
      max_frequency: this.convertSqlValue(row[4]),
      supported_modes: this.convertSqlValue(row[5]),
      channel_capacity: this.convertSqlValue(row[6]),
      notes: this.convertSqlValue(row[7]),
      created_at: this.convertSqlValue(row[8]) as string,
      updated_at: this.convertSqlValue(row[9])
    })) || []
  }

  // Export Profile Operations
  async getExportProfiles(): Promise<ExportProfile[]> {
    const result = this.db.exec('SELECT * FROM export_profiles')
    return result[0]?.values.map(row => ({
      id: this.convertSqlValue(row[0]) as number,
      radio_id: this.convertSqlValue(row[1]) as number,
      name: this.convertSqlValue(row[2]) as string,
      description: this.convertSqlValue(row[3]),
      filter_query: this.convertSqlValue(row[4]),
      sort_order: this.convertSqlValue(row[5]),
      created_at: this.convertSqlValue(row[6]) as string,
      updated_at: this.convertSqlValue(row[7])
    })) || []
  }

  // County Operations
  async getCounties(): Promise<County[]> {
    const result = this.db.exec('SELECT * FROM counties')
    return result[0]?.values.map(row => ({
      id: this.convertSqlValue(row[0]) as number,
      name: this.convertSqlValue(row[1]) as string,
      state: this.convertSqlValue(row[2]) as string,
      fips_code: this.convertSqlValue(row[3]),
      region: this.convertSqlValue(row[4]),
      distance_from_kc: this.convertSqlValue(row[5]),
      notes: this.convertSqlValue(row[6]),
      created_at: this.convertSqlValue(row[7]) as string,
      updated_at: this.convertSqlValue(row[8])
    })) || []
  }

  // Import/Export Operations
  async importFrequencies(frequencies: Omit<Frequency, 'id'>[]): Promise<void> {
    const query = `
      INSERT INTO frequencies (
        frequency, transmit_frequency, name, description, alpha_tag, mode, 
        tone_mode, tone_freq, county, state, agency, callsign, service_type, 
        tags, duplex, offset, last_verified, notes, source, active, 
        distance_from_kc, latitude, longitude, class_station_code, created_at, 
        updated_at, export_chirp, export_uniden, export_sdrtrunk, export_sdrplus, 
        export_opengd77
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `
    
    for (const freq of frequencies) {
      const params = [
        freq.frequency,
        freq.transmit_frequency,
        freq.name,
        freq.description,
        freq.alpha_tag,
        freq.mode,
        freq.tone_mode,
        freq.tone_freq,
        freq.county,
        freq.state,
        freq.agency,
        freq.callsign,
        freq.service_type,
        freq.tags,
        freq.duplex,
        freq.offset,
        freq.last_verified,
        freq.notes,
        freq.source,
        freq.active,
        freq.distance_from_kc,
        freq.latitude,
        freq.longitude,
        freq.class_station_code,
        freq.created_at,
        freq.updated_at,
        freq.export_chirp,
        freq.export_uniden,
        freq.export_sdrtrunk,
        freq.export_sdrplus,
        freq.export_opengd77
      ]
      this.db.run(query, params)
    }
  }

  async importTrunkedSystem(system: Omit<TrunkedSystem, 'id'>, sites: Omit<TrunkedSite, 'id'>[], talkgroups: Omit<Talkgroup, 'id'>[]): Promise<number> {
    // Insert system
    const systemQuery = `
      INSERT INTO trunked_systems (
        system_id, name, type, system_class, business_type, business_owner,
        description, wacn, system_protocol, notes, active, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `
    const systemParams = [
      system.system_id,
      system.name,
      system.type,
      system.system_class,
      system.business_type,
      system.business_owner,
      system.description,
      system.wacn,
      system.system_protocol,
      system.notes,
      system.active,
      system.created_at,
      system.updated_at
    ]
    this.db.run(systemQuery, systemParams)
    const systemId = this.convertSqlValue(this.db.exec('SELECT last_insert_rowid()')[0].values[0][0]) as number

    // Insert sites
    const siteQuery = `
      INSERT INTO trunked_sites (
        system_id, site_id, name, description, county, state, latitude,
        longitude, range_miles, nac, active, distance_from_kc, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `
    for (const site of sites) {
      const siteParams = [
        systemId,
        site.site_id,
        site.name,
        site.description,
        site.county,
        site.state,
        site.latitude,
        site.longitude,
        site.range_miles,
        site.nac,
        site.active,
        site.distance_from_kc,
        site.created_at,
        site.updated_at
      ]
      this.db.run(siteQuery, siteParams)
    }

    // Insert talkgroups
    const talkgroupQuery = `
      INSERT INTO talkgroups (
        system_id, decimal_id, hex_id, alpha_tag, description, mode,
        category, tag, priority, active, notes, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `
    for (const talkgroup of talkgroups) {
      const talkgroupParams = [
        systemId,
        talkgroup.decimal_id,
        talkgroup.hex_id,
        talkgroup.alpha_tag,
        talkgroup.description,
        talkgroup.mode,
        talkgroup.category,
        talkgroup.tag,
        talkgroup.priority,
        talkgroup.active,
        talkgroup.notes,
        talkgroup.created_at,
        talkgroup.updated_at
      ]
      this.db.run(talkgroupQuery, talkgroupParams)
    }

    return systemId
  }

  async exportFrequencies(filter?: FrequencyFilter): Promise<Frequency[]> {
    return this.getFrequencies(filter)
  }

  async exportTrunkedSystem(systemId: number): Promise<{
    system: TrunkedSystem,
    sites: TrunkedSite[],
    talkgroups: Talkgroup[]
  }> {
    const result = this.db.exec('SELECT * FROM trunked_systems WHERE id = ?', [systemId])
    const system = result[0]?.values.map(row => ({
      id: this.convertSqlValue(row[0]) as number,
      system_id: this.convertSqlValue(row[1]) as string,
      name: this.convertSqlValue(row[2]) as string,
      type: this.convertSqlValue(row[3]) as string,
      system_class: this.convertSqlValue(row[4]),
      business_type: this.convertSqlValue(row[5]),
      business_owner: this.convertSqlValue(row[6]),
      description: this.convertSqlValue(row[7]),
      wacn: this.convertSqlValue(row[8]),
      system_protocol: this.convertSqlValue(row[9]),
      notes: this.convertSqlValue(row[10]),
      active: this.convertSqlValue(row[11]) as number,
      created_at: this.convertSqlValue(row[12]) as string,
      updated_at: this.convertSqlValue(row[13])
    }))[0]
    const sites = await this.getSites(systemId)
    const talkgroups = await this.getTalkgroups(systemId)
    return { system, sites, talkgroups }
  }

  async importTrunkedSystems(csvText: string): Promise<void> {
    const lines = csvText.split('\n')
    const headers = lines[0].split(',').map(h => h.trim())
    
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim()
      if (!line) continue
      
      const values = line.split(',').map(v => v.trim())
      const system: Omit<TrunkedSystem, 'id'> = {
        system_id: values[headers.indexOf('system_id')],
        name: values[headers.indexOf('name')],
        type: values[headers.indexOf('type')],
        system_class: values[headers.indexOf('system_class')] || null,
        business_type: values[headers.indexOf('business_type')] || null,
        business_owner: values[headers.indexOf('business_owner')] || null,
        description: values[headers.indexOf('description')] || null,
        wacn: values[headers.indexOf('wacn')] || null,
        system_protocol: values[headers.indexOf('system_protocol')] || null,
        notes: values[headers.indexOf('notes')] || null,
        active: 1,
        created_at: new Date().toISOString(),
        updated_at: null
      }
      
      await this.importTrunkedSystem(system, [], [])
    }
  }

  async addTrunkedSystem(system: Omit<TrunkedSystem, 'id'>): Promise<number> {
    const query = `
      INSERT INTO trunked_systems (
        system_id, name, type, system_class, business_type, business_owner,
        description, wacn, system_protocol, notes, active, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `
    const params = [
      system.system_id,
      system.name,
      system.type,
      system.system_class,
      system.business_type,
      system.business_owner,
      system.description,
      system.wacn,
      system.system_protocol,
      system.notes,
      system.active,
      system.created_at
    ]

    this.db.exec(query, params)
    const result = this.db.exec('SELECT last_insert_rowid()')
    return this.convertSqlValue(result[0].values[0][0]) as number
  }

  async updateTrunkedSystem(id: number, system: Partial<TrunkedSystem>): Promise<void> {
    const updates: string[] = []
    const params: any[] = []

    if (system.system_id !== undefined) {
      updates.push('system_id = ?')
      params.push(system.system_id)
    }
    if (system.name !== undefined) {
      updates.push('name = ?')
      params.push(system.name)
    }
    if (system.type !== undefined) {
      updates.push('type = ?')
      params.push(system.type)
    }
    if (system.system_class !== undefined) {
      updates.push('system_class = ?')
      params.push(system.system_class)
    }
    if (system.business_type !== undefined) {
      updates.push('business_type = ?')
      params.push(system.business_type)
    }
    if (system.business_owner !== undefined) {
      updates.push('business_owner = ?')
      params.push(system.business_owner)
    }
    if (system.description !== undefined) {
      updates.push('description = ?')
      params.push(system.description)
    }
    if (system.wacn !== undefined) {
      updates.push('wacn = ?')
      params.push(system.wacn)
    }
    if (system.system_protocol !== undefined) {
      updates.push('system_protocol = ?')
      params.push(system.system_protocol)
    }
    if (system.notes !== undefined) {
      updates.push('notes = ?')
      params.push(system.notes)
    }
    if (system.active !== undefined) {
      updates.push('active = ?')
      params.push(system.active)
    }
    if (system.updated_at !== undefined) {
      updates.push('updated_at = ?')
      params.push(system.updated_at)
    }

    if (updates.length === 0) return

    const query = `UPDATE trunked_systems SET ${updates.join(', ')} WHERE id = ?`
    params.push(id)

    this.db.exec(query, params)
  }

  async addExportProfile(profile: Omit<ExportProfile, 'id'>): Promise<number> {
    const query = `
      INSERT INTO export_profiles (
        name, description, radio_id, filter_query, sort_order, created_at
      ) VALUES (?, ?, ?, ?, ?, ?)
    `
    const params = [
      profile.name,
      profile.description,
      profile.radio_id,
      profile.filter_query,
      profile.sort_order,
      profile.created_at
    ]

    this.db.exec(query, params)
    const result = this.db.exec('SELECT last_insert_rowid()')
    return this.convertSqlValue(result[0].values[0][0]) as number
  }

  async updateExportProfile(id: number, profile: Partial<ExportProfile>): Promise<void> {
    const updates: string[] = []
    const params: any[] = []

    if (profile.name !== undefined) {
      updates.push('name = ?')
      params.push(profile.name)
    }
    if (profile.description !== undefined) {
      updates.push('description = ?')
      params.push(profile.description)
    }
    if (profile.radio_id !== undefined) {
      updates.push('radio_id = ?')
      params.push(profile.radio_id)
    }
    if (profile.filter_query !== undefined) {
      updates.push('filter_query = ?')
      params.push(profile.filter_query)
    }
    if (profile.sort_order !== undefined) {
      updates.push('sort_order = ?')
      params.push(profile.sort_order)
    }
    if (profile.updated_at !== undefined) {
      updates.push('updated_at = ?')
      params.push(profile.updated_at)
    }

    if (updates.length === 0) return

    const query = `UPDATE export_profiles SET ${updates.join(', ')} WHERE id = ?`
    params.push(id)

    this.db.exec(query, params)
  }

  async deleteExportProfile(id: number): Promise<void> {
    this.db.run('DELETE FROM export_profiles WHERE id = ?', [id])
  }

  async addRadio(radio: Omit<Radio, 'id'>): Promise<number> {
    const query = `
      INSERT INTO radios (
        name, type, min_frequency, max_frequency, supported_modes,
        channel_capacity, notes, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `
    const params = [
      radio.name,
      radio.type,
      radio.min_frequency,
      radio.max_frequency,
      radio.supported_modes,
      radio.channel_capacity,
      radio.notes,
      radio.created_at
    ]

    this.db.exec(query, params)
    const result = this.db.exec('SELECT last_insert_rowid()')
    return this.convertSqlValue(result[0].values[0][0]) as number
  }

  async updateRadio(id: number, radio: Partial<Radio>): Promise<void> {
    const updates: string[] = []
    const params: any[] = []

    if (radio.name !== undefined) {
      updates.push('name = ?')
      params.push(radio.name)
    }
    if (radio.type !== undefined) {
      updates.push('type = ?')
      params.push(radio.type)
    }
    if (radio.min_frequency !== undefined) {
      updates.push('min_frequency = ?')
      params.push(radio.min_frequency)
    }
    if (radio.max_frequency !== undefined) {
      updates.push('max_frequency = ?')
      params.push(radio.max_frequency)
    }
    if (radio.supported_modes !== undefined) {
      updates.push('supported_modes = ?')
      params.push(radio.supported_modes)
    }
    if (radio.channel_capacity !== undefined) {
      updates.push('channel_capacity = ?')
      params.push(radio.channel_capacity)
    }
    if (radio.notes !== undefined) {
      updates.push('notes = ?')
      params.push(radio.notes)
    }
    if (radio.updated_at !== undefined) {
      updates.push('updated_at = ?')
      params.push(radio.updated_at)
    }

    if (updates.length === 0) return

    const query = `UPDATE radios SET ${updates.join(', ')} WHERE id = ?`
    params.push(id)

    this.db.exec(query, params)
  }

  async addCounty(county: Omit<County, 'id'>): Promise<number> {
    const query = `
      INSERT INTO counties (
        name, state, fips_code, region, distance_from_kc,
        notes, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `
    const params = [
      county.name,
      county.state,
      county.fips_code,
      county.region,
      county.distance_from_kc,
      county.notes,
      county.created_at
    ]

    this.db.exec(query, params)
    const result = this.db.exec('SELECT last_insert_rowid()')
    return this.convertSqlValue(result[0].values[0][0]) as number
  }

  async updateCounty(id: number, county: Partial<County>): Promise<void> {
    const updates: string[] = []
    const params: any[] = []

    if (county.name !== undefined) {
      updates.push('name = ?')
      params.push(county.name)
    }
    if (county.state !== undefined) {
      updates.push('state = ?')
      params.push(county.state)
    }
    if (county.fips_code !== undefined) {
      updates.push('fips_code = ?')
      params.push(county.fips_code)
    }
    if (county.region !== undefined) {
      updates.push('region = ?')
      params.push(county.region)
    }
    if (county.distance_from_kc !== undefined) {
      updates.push('distance_from_kc = ?')
      params.push(county.distance_from_kc)
    }
    if (county.notes !== undefined) {
      updates.push('notes = ?')
      params.push(county.notes)
    }
    if (county.updated_at !== undefined) {
      updates.push('updated_at = ?')
      params.push(county.updated_at)
    }

    if (updates.length === 0) return

    const query = `UPDATE counties SET ${updates.join(', ')} WHERE id = ?`
    params.push(id)

    this.db.exec(query, params)
  }

  async deleteCounty(id: number): Promise<void> {
    this.db.run('DELETE FROM counties WHERE id = ?', [id])
  }

  async deleteTrunkedSystem(id: number): Promise<void> {
    this.db.run('DELETE FROM trunked_systems WHERE id = ?', [id])
  }

  async deleteRadio(id: number): Promise<void> {
    this.db.run('DELETE FROM radios WHERE id = ?', [id])
  }

  // Database View Query Methods

  async getChirpExportData(): Promise<any[]> {
    const result = this.db.exec('SELECT * FROM view_chirp_export')
    return result[0]?.values.map(row => ({
      id: this.convertSqlValue(row[0]) as number,
      frequency: this.convertSqlValue(row[1]) as number,
      name: this.convertSqlValue(row[2]) as string,
      alpha_tag: this.convertSqlValue(row[3]) as string,
      duplex: this.convertSqlValue(row[4]) as string,
      offset: this.convertSqlValue(row[5]) as number,
      tone_mode: this.convertSqlValue(row[6]) as string,
      tone_freq: this.convertSqlValue(row[7]) as string,
      mode: this.convertSqlValue(row[8]) as string,
      comment: this.convertSqlValue(row[9]) as string
    })) || []
  }

  async getUnidenExportData(): Promise<any[]> {
    const result = this.db.exec('SELECT * FROM view_uniden_export')
    return result[0]?.values.map(row => ({
      id: this.convertSqlValue(row[0]) as number,
      frequency: this.convertSqlValue(row[1]) as number,
      name: this.convertSqlValue(row[2]) as string,
      alpha_tag: this.convertSqlValue(row[3]) as string,
      mode: this.convertSqlValue(row[4]) as string,
      tone_mode: this.convertSqlValue(row[5]) as string,
      tone_freq: this.convertSqlValue(row[6]) as string,
      county: this.convertSqlValue(row[7]) as string,
      state: this.convertSqlValue(row[8]) as string,
      service_type: this.convertSqlValue(row[9]) as string
    })) || []
  }

  async getSdrtrunkConventionalData(): Promise<any[]> {
    const result = this.db.exec('SELECT * FROM view_sdrtrunk_conventional')
    return result[0]?.values.map(row => ({
      id: this.convertSqlValue(row[0]) as number,
      frequency: this.convertSqlValue(row[1]) as number,
      name: this.convertSqlValue(row[2]) as string,
      description: this.convertSqlValue(row[3]) as string,
      mode: this.convertSqlValue(row[4]) as string,
      county: this.convertSqlValue(row[5]) as string,
      state: this.convertSqlValue(row[6]) as string,
      service_type: this.convertSqlValue(row[7]) as string
    })) || []
  }

  async getOpenGD77ExportData(): Promise<any[]> {
    const result = this.db.exec('SELECT * FROM view_opengd77_export')
    return result[0]?.values.map(row => ({
      id: this.convertSqlValue(row[0]) as number,
      frequency: this.convertSqlValue(row[1]) as number,
      transmit_frequency: this.convertSqlValue(row[2]) as number,
      name: this.convertSqlValue(row[3]) as string,
      alpha_tag: this.convertSqlValue(row[4]) as string,
      mode: this.convertSqlValue(row[5]) as string,
      tone_mode: this.convertSqlValue(row[6]) as string,
      tone_freq: this.convertSqlValue(row[7]) as string
    })) || []
  }

  async getKCRepeaters(): Promise<any[]> {
    const result = this.db.exec('SELECT * FROM view_kc_repeaters')
    return result[0]?.values.map(row => ({
      id: this.convertSqlValue(row[0]) as number,
      frequency: this.convertSqlValue(row[1]) as number,
      transmit_frequency: this.convertSqlValue(row[2]) as number,
      name: this.convertSqlValue(row[3]) as string,
      description: this.convertSqlValue(row[4]) as string,
      mode: this.convertSqlValue(row[5]) as string,
      tone_mode: this.convertSqlValue(row[6]) as string,
      tone_freq: this.convertSqlValue(row[7]) as string,
      county: this.convertSqlValue(row[8]) as string,
      callsign: this.convertSqlValue(row[9]) as string
    })) || []
  }

  async getBusinessTrunkedSystems(): Promise<any[]> {
    const result = this.db.exec('SELECT * FROM view_business_trunked')
    return result[0]?.values.map(row => ({
      id: this.convertSqlValue(row[0]) as number,
      system_id: this.convertSqlValue(row[1]) as string,
      name: this.convertSqlValue(row[2]) as string,
      description: this.convertSqlValue(row[3]) as string,
      business_type: this.convertSqlValue(row[4]) as string,
      business_owner: this.convertSqlValue(row[5]) as string
    })) || []
  }

  async getBusinessFrequencies(): Promise<any[]> {
    const result = this.db.exec('SELECT * FROM view_business_frequencies')
    return result[0]?.values.map(row => ({
      id: this.convertSqlValue(row[0]) as number,
      frequency: this.convertSqlValue(row[1]) as number,
      name: this.convertSqlValue(row[2]) as string,
      description: this.convertSqlValue(row[3]) as string,
      mode: this.convertSqlValue(row[4]) as string,
      agency: this.convertSqlValue(row[5]) as string,
      service_type: this.convertSqlValue(row[6]) as string
    })) || []
  }
} 
