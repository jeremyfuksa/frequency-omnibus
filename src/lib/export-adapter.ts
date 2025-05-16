import { DatabaseService } from './db/database';
import { Database } from 'sql.js';

/**
 * This adapter service provides optimized database view access 
 * using the singleton DatabaseService pattern
 */
export class DatabaseViewAdapter {
  private db: Database;
  private static instance: DatabaseViewAdapter;

  private constructor() {
    // Get the database instance from the singleton
    const dbService = DatabaseService.getInstance();
    // @ts-ignore - accessing private property for optimization
    this.db = dbService.db;
  }

  public static getInstance(): DatabaseViewAdapter {
    if (!DatabaseViewAdapter.instance) {
      DatabaseViewAdapter.instance = new DatabaseViewAdapter();
    }
    return DatabaseViewAdapter.instance;
  }

  private convertSqlValue(value: any): any {
    if (value === null) return null;
    if (typeof value === 'number') return value;
    if (typeof value === 'string') {
      // Try to parse as number if it looks like one
      if (/^-?\d*\.?\d+$/.test(value)) {
        return parseFloat(value);
      }
      return value;
    }
    return value;
  }

  async getChirpExportData(): Promise<any[]> {
    const result = this.db.exec(`
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
      WHERE export_chirp = 1 AND active = 1
    `);
    
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
    })) || [];
  }

  async getUnidenExportData(): Promise<any[]> {
    const result = this.db.exec(`
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
      WHERE export_uniden = 1 AND active = 1
    `);
    
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
    })) || [];
  }

  async getSDRTrunkConventionalData(): Promise<any[]> {
    const result = this.db.exec(`
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
      WHERE export_sdrtrunk = 1 AND active = 1
    `);
    
    return result[0]?.values.map(row => ({
      id: this.convertSqlValue(row[0]) as number,
      frequency: this.convertSqlValue(row[1]) as number,
      name: this.convertSqlValue(row[2]) as string,
      description: this.convertSqlValue(row[3]) as string,
      mode: this.convertSqlValue(row[4]) as string,
      county: this.convertSqlValue(row[5]) as string,
      state: this.convertSqlValue(row[6]) as string,
      service_type: this.convertSqlValue(row[7]) as string
    })) || [];
  }

  async getBusinessTrunkedSystems(): Promise<any[]> {
    const result = this.db.exec(`
      SELECT 
        id,
        system_id,
        name,
        description,
        business_type,
        business_owner
      FROM trunked_systems
      WHERE system_class = 'Business' AND active = 1
    `);
    
    return result[0]?.values.map(row => ({
      id: this.convertSqlValue(row[0]) as number,
      system_id: this.convertSqlValue(row[1]) as string,
      name: this.convertSqlValue(row[2]) as string,
      description: this.convertSqlValue(row[3]) as string,
      business_type: this.convertSqlValue(row[4]) as string,
      business_owner: this.convertSqlValue(row[5]) as string
    })) || [];
  }

  async getOpenGD77ExportData(): Promise<any[]> {
    const result = this.db.exec(`
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
      WHERE export_opengd77 = 1 AND active = 1 AND (mode = 'DMR' OR mode = 'FM' OR mode = 'FMN')
    `);
    
    return result[0]?.values.map(row => ({
      id: this.convertSqlValue(row[0]) as number,
      frequency: this.convertSqlValue(row[1]) as number,
      transmit_frequency: this.convertSqlValue(row[2]) as number,
      name: this.convertSqlValue(row[3]) as string,
      alpha_tag: this.convertSqlValue(row[4]) as string,
      mode: this.convertSqlValue(row[5]) as string,
      tone_mode: this.convertSqlValue(row[6]) as string,
      tone_freq: this.convertSqlValue(row[7]) as string
    })) || [];
  }

  async getKCRepeaters(): Promise<any[]> {
    const result = this.db.exec(`
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
        AND transmit_frequency IS NOT NULL
    `);
    
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
    })) || [];
  }

  async getBusinessFrequencies(): Promise<any[]> {
    const result = this.db.exec(`
      SELECT 
        id,
        frequency,
        name,
        description,
        mode,
        agency,
        service_type
      FROM frequencies
      WHERE service_type = 'Business' AND active = 1
    `);
    
    return result[0]?.values.map(row => ({
      id: this.convertSqlValue(row[0]) as number,
      frequency: this.convertSqlValue(row[1]) as number,
      name: this.convertSqlValue(row[2]) as string,
      description: this.convertSqlValue(row[3]) as string,
      mode: this.convertSqlValue(row[4]) as string,
      agency: this.convertSqlValue(row[5]) as string,
      service_type: this.convertSqlValue(row[6]) as string
    })) || [];
  }
} 
