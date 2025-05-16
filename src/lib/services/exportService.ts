import { DatabaseService } from '../db/database';
import { Frequency, Radio, ExportProfile } from '../../types/database';

export interface ChirpFrequency {
  Location: number;
  Name: string;
  Frequency: string;
  Duplex: string;
  Offset: string;
  Tone: string;
  rToneFreq: string;
  cToneFreq: string;
  DtcsCode: string;
  DtcsPolarity: string;
  Mode: string;
  TStep: string;
  Skip: string;
  Comment: string;
  URCALL: string;
  RPT1CALL: string;
  RPT2CALL: string;
}

export interface SDRTrunkConventional {
  version: number;
  type: string;
  configs: {
    control_channel_count: number;
    frequency: number;
    name: string;
    site: string;
    system: string;
    decoder: string;
    record: boolean;
    enabled: boolean;
  }[];
}

export class ExportService {
  private db: DatabaseService;

  constructor() {
    this.db = DatabaseService.getInstance();
  }

  public async getExportProfiles(): Promise<ExportProfile[]> {
    return this.db.query<ExportProfile>(
      'SELECT * FROM export_profiles ORDER BY name ASC'
    );
  }

  public async getProfileById(id: number): Promise<ExportProfile | null> {
    const results = await this.db.query<ExportProfile>(
      'SELECT * FROM export_profiles WHERE id = ?',
      [id]
    );
    return results[0] || null;
  }

  public async addProfile(profile: Omit<ExportProfile, 'id' | 'created_at' | 'updated_at'>): Promise<ExportProfile> {
    const fields = Object.keys(profile).join(', ');
    const placeholders = Object.keys(profile).map(() => '?').join(', ');
    const values = Object.values(profile);

    const sql = `
      INSERT INTO export_profiles (${fields})
      VALUES (${placeholders})
    `;

    await this.db.execute(sql, values);
    const results = await this.db.query<ExportProfile>(
      'SELECT * FROM export_profiles WHERE id = last_insert_rowid()'
    );
    return results[0];
  }

  public async updateProfile(id: number, profile: Partial<ExportProfile>): Promise<ExportProfile | null> {
    const updates = Object.entries(profile)
      .filter(([key]) => key !== 'id' && key !== 'created_at')
      .map(([key]) => `${key} = ?`);
    
    if (updates.length === 0) return null;

    const sql = `
      UPDATE export_profiles
      SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `;

    const values = [
      ...Object.values(profile).filter((_, i) => 
        Object.keys(profile)[i] !== 'id' && 
        Object.keys(profile)[i] !== 'created_at'
      ),
      id
    ];

    await this.db.execute(sql, values);
    return this.getProfileById(id);
  }

  public async deleteProfile(id: number): Promise<void> {
    await this.db.execute('DELETE FROM export_profiles WHERE id = ?', [id]);
  }

  public async getRadioModels(): Promise<Radio[]> {
    return this.db.query<Radio>(
      'SELECT * FROM radios ORDER BY name ASC'
    );
  }

  public async exportToChirp(frequencies: Frequency[]): Promise<ChirpFrequency[]> {
    return frequencies.map((freq, index) => ({
      Location: index + 1,
      Name: freq.name.substring(0, 16), // CHIRP has a 16-character limit
      Frequency: freq.frequency.toFixed(6),
      Duplex: freq.duplex || '',
      Offset: freq.offset ? freq.offset.toFixed(6) : '',
      Tone: freq.tone_mode || '',
      rToneFreq: freq.tone_freq || '',
      cToneFreq: freq.tone_freq || '',
      DtcsCode: '',
      DtcsPolarity: '',
      Mode: freq.mode,
      TStep: '5.00',
      Skip: '',
      Comment: freq.description || '',
      URCALL: freq.callsign || '',
      RPT1CALL: '',
      RPT2CALL: ''
    }));
  }

  public async exportToSDRTrunk(frequencies: Frequency[]): Promise<SDRTrunkConventional> {
    return {
      version: 1,
      type: 'conventional',
      configs: frequencies.map(freq => ({
        control_channel_count: 0,
        frequency: freq.frequency,
        name: freq.name,
        site: freq.county || 'Unknown',
        system: freq.agency || 'Unknown',
        decoder: freq.mode === 'DMR' ? 'DMR' : 'FM',
        record: false,
        enabled: true
      }))
    };
  }

  public async exportToUniden(frequencies: Frequency[]): Promise<{
    systems: any[];
    groups: any[];
    channels: any[];
  }> {
    // Group frequencies by service type
    const serviceGroups = frequencies.reduce((acc, freq) => {
      const type = freq.service_type || 'Other';
      if (!acc[type]) acc[type] = [];
      acc[type].push(freq);
      return acc;
    }, {} as Record<string, Frequency[]>);

    // Create systems
    const systems = Object.entries(serviceGroups).map(([type, freqs], index) => ({
      id: index + 1,
      name: type,
      type: 'conventional',
      quickKey: index + 1
    }));

    // Create groups
    const groups = Object.entries(serviceGroups).map(([type, freqs], index) => ({
      id: index + 1,
      systemId: index + 1,
      name: type,
      quickKey: index + 1
    }));

    // Create channels
    const channels = frequencies.map((freq, index) => ({
      id: index + 1,
      systemId: systems.find(s => s.name === (freq.service_type || 'Other'))?.id || 1,
      groupId: groups.find(g => g.name === (freq.service_type || 'Other'))?.id || 1,
      name: freq.name,
      frequency: freq.frequency,
      modulation: freq.mode,
      ctcss: freq.tone_freq || '',
      dcs: '',
      delay: 2,
      priority: false,
      lockout: false
    }));

    return { systems, groups, channels };
  }

  public async exportToOpenGD77(frequencies: Frequency[]): Promise<any[]> {
    return frequencies.map((freq, index) => ({
      channelNumber: index + 1,
      name: freq.name.substring(0, 16), // OpenGD77 has a 16-character limit
      rxFrequency: freq.frequency,
      txFrequency: freq.transmit_frequency || freq.frequency,
      mode: freq.mode === 'DMR' ? 'DMR' : 'FM',
      colorCode: 1,
      timeSlot: 1,
      groupList: 1,
      contactName: freq.agency || '',
      zone: Math.floor(index / 16) + 1,
      scanList: 1
    }));
  }

  public async validateExport(frequencies: Frequency[], radio: Radio): Promise<string[]> {
    const errors: string[] = [];

    // Check frequency range
    frequencies.forEach(freq => {
      if (freq.frequency < radio.min_frequency || freq.frequency > radio.max_frequency) {
        errors.push(`Frequency ${freq.frequency} MHz is outside the supported range for ${radio.name}`);
      }
    });

    // Check supported modes
    const supportedModes = radio.supported_modes.split(',');
    frequencies.forEach(freq => {
      if (!supportedModes.includes(freq.mode)) {
        errors.push(`Mode ${freq.mode} is not supported by ${radio.name}`);
      }
    });

    return errors;
  }
} 
