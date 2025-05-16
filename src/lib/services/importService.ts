import { DatabaseService } from '../db/database';
import { Frequency, TrunkedSystem, TrunkedSite, Talkgroup } from '../../types/database';

export class ImportService {
  private db: DatabaseService;

  constructor() {
    this.db = DatabaseService.getInstance();
  }

  public async importCsv(csvData: string, type: 'frequency' | 'trunked' | 'talkgroup'): Promise<void> {
    const lines = csvData.split('\n');
    const headers = lines[0].split(',').map(h => h.trim());

    switch (type) {
      case 'frequency':
        await this.importFrequenciesFromCsv(lines.slice(1), headers);
        break;
      case 'trunked':
        await this.importTrunkedFromCsv(lines.slice(1), headers);
        break;
      case 'talkgroup':
        await this.importTalkgroupsFromCsv(lines.slice(1), headers);
        break;
    }
  }

  private async importFrequenciesFromCsv(lines: string[], headers: string[]): Promise<void> {
    const frequencies: Omit<Frequency, 'id' | 'created_at' | 'updated_at'>[] = [];

    for (const line of lines) {
      if (!line.trim()) continue;

      const values = line.split(',').map(v => v.trim());
      const frequency: any = {};

      headers.forEach((header, index) => {
        const value = values[index];
        if (value) {
          switch (header) {
            case 'frequency':
            case 'transmit_frequency':
            case 'offset':
            case 'distance_from_kc':
            case 'latitude':
            case 'longitude':
              frequency[header] = parseFloat(value);
              break;
            case 'active':
            case 'export_chirp':
            case 'export_uniden':
            case 'export_sdrtrunk':
            case 'export_sdrplus':
            case 'export_opengd77':
              frequency[header] = parseInt(value);
              break;
            default:
              frequency[header] = value;
          }
        }
      });

      frequencies.push(frequency);
    }

    await this.db.execute('BEGIN TRANSACTION');
    try {
      for (const frequency of frequencies) {
        const fields = Object.keys(frequency).join(', ');
        const placeholders = Object.keys(frequency).map(() => '?').join(', ');
        const values = Object.values(frequency);

        const sql = `
          INSERT INTO frequencies (${fields})
          VALUES (${placeholders})
        `;

        await this.db.execute(sql, values);
      }
      await this.db.execute('COMMIT');
    } catch (error) {
      await this.db.execute('ROLLBACK');
      throw error;
    }
  }

  private async importTrunkedFromCsv(lines: string[], headers: string[]): Promise<void> {
    const systems: Omit<TrunkedSystem, 'id' | 'created_at' | 'updated_at'>[] = [];
    const sites: Omit<TrunkedSite, 'id' | 'created_at' | 'updated_at'>[] = [];

    for (const line of lines) {
      if (!line.trim()) continue;

      const values = line.split(',').map(v => v.trim());
      const system: any = {};
      const site: any = {};

      headers.forEach((header, index) => {
        const value = values[index];
        if (value) {
          if (header.startsWith('site_')) {
            site[header.replace('site_', '')] = value;
          } else {
            switch (header) {
              case 'active':
                system[header] = parseInt(value);
                break;
              default:
                system[header] = value;
            }
          }
        }
      });

      systems.push(system);
      if (Object.keys(site).length > 0) {
        sites.push(site);
      }
    }

    await this.db.execute('BEGIN TRANSACTION');
    try {
      for (const system of systems) {
        const fields = Object.keys(system).join(', ');
        const placeholders = Object.keys(system).map(() => '?').join(', ');
        const values = Object.values(system);

        const sql = `
          INSERT INTO trunked_systems (${fields})
          VALUES (${placeholders})
        `;

        await this.db.execute(sql, values);
      }

      for (const site of sites) {
        const fields = Object.keys(site).join(', ');
        const placeholders = Object.keys(site).map(() => '?').join(', ');
        const values = Object.values(site);

        const sql = `
          INSERT INTO trunked_sites (${fields})
          VALUES (${placeholders})
        `;

        await this.db.execute(sql, values);
      }

      await this.db.execute('COMMIT');
    } catch (error) {
      await this.db.execute('ROLLBACK');
      throw error;
    }
  }

  private async importTalkgroupsFromCsv(lines: string[], headers: string[]): Promise<void> {
    const talkgroups: Omit<Talkgroup, 'id' | 'created_at' | 'updated_at'>[] = [];

    for (const line of lines) {
      if (!line.trim()) continue;

      const values = line.split(',').map(v => v.trim());
      const talkgroup: any = {};

      headers.forEach((header, index) => {
        const value = values[index];
        if (value) {
          switch (header) {
            case 'decimal_id':
            case 'priority':
            case 'active':
              talkgroup[header] = parseInt(value);
              break;
            default:
              talkgroup[header] = value;
          }
        }
      });

      talkgroups.push(talkgroup);
    }

    await this.db.execute('BEGIN TRANSACTION');
    try {
      for (const talkgroup of talkgroups) {
        const fields = Object.keys(talkgroup).join(', ');
        const placeholders = Object.keys(talkgroup).map(() => '?').join(', ');
        const values = Object.values(talkgroup);

        const sql = `
          INSERT INTO talkgroups (${fields})
          VALUES (${placeholders})
        `;

        await this.db.execute(sql, values);
      }
      await this.db.execute('COMMIT');
    } catch (error) {
      await this.db.execute('ROLLBACK');
      throw error;
    }
  }

  public async importRadioReference(data: any): Promise<void> {
    // Handle RadioReference JSON format
    if (data.systems) {
      await this.importRadioReferenceSystems(data.systems);
    }
    if (data.conventional) {
      await this.importRadioReferenceConventional(data.conventional);
    }
  }

  private async importRadioReferenceSystems(systems: any[]): Promise<void> {
    await this.db.execute('BEGIN TRANSACTION');
    try {
      for (const system of systems) {
        // Import system
        const systemFields = [
          'system_id',
          'name',
          'type',
          'system_class',
          'system_protocol',
          'description',
          'wacn',
          'active'
        ];
        const systemValues = [
          system.id,
          system.name,
          system.type,
          system.systemClass,
          system.protocol,
          system.description,
          system.wacn,
          1
        ];

        const systemSql = `
          INSERT INTO trunked_systems (${systemFields.join(', ')})
          VALUES (${systemFields.map(() => '?').join(', ')})
        `;
        await this.db.execute(systemSql, systemValues);

        // Import sites
        if (system.sites) {
          for (const site of system.sites) {
            const siteFields = [
              'system_id',
              'site_id',
              'name',
              'county',
              'state',
              'latitude',
              'longitude',
              'range_miles'
            ];
            const siteValues = [
              system.id,
              site.id,
              site.name,
              site.county,
              site.state,
              site.latitude,
              site.longitude,
              site.range
            ];

            const siteSql = `
              INSERT INTO trunked_sites (${siteFields.join(', ')})
              VALUES (${siteFields.map(() => '?').join(', ')})
            `;
            await this.db.execute(siteSql, siteValues);
          }
        }

        // Import talkgroups
        if (system.talkgroups) {
          for (const talkgroup of system.talkgroups) {
            const talkgroupFields = [
              'system_id',
              'decimal_id',
              'hex_id',
              'alpha_tag',
              'description',
              'mode',
              'category',
              'priority',
              'active'
            ];
            const talkgroupValues = [
              system.id,
              talkgroup.decimal,
              talkgroup.hex,
              talkgroup.alphaTag,
              talkgroup.description,
              talkgroup.mode,
              talkgroup.category,
              talkgroup.priority || 0,
              1
            ];

            const talkgroupSql = `
              INSERT INTO talkgroups (${talkgroupFields.join(', ')})
              VALUES (${talkgroupFields.map(() => '?').join(', ')})
            `;
            await this.db.execute(talkgroupSql, talkgroupValues);
          }
        }
      }
      await this.db.execute('COMMIT');
    } catch (error) {
      await this.db.execute('ROLLBACK');
      throw error;
    }
  }

  private async importRadioReferenceConventional(conventional: any[]): Promise<void> {
    await this.db.execute('BEGIN TRANSACTION');
    try {
      for (const freq of conventional) {
        const fields = [
          'frequency',
          'name',
          'description',
          'mode',
          'tone_mode',
          'tone_freq',
          'county',
          'state',
          'agency',
          'callsign',
          'service_type',
          'tags',
          'duplex',
          'offset',
          'active'
        ];
        const values = [
          freq.frequency,
          freq.name,
          freq.description,
          freq.mode,
          freq.toneMode,
          freq.toneFreq,
          freq.county,
          freq.state,
          freq.agency,
          freq.callsign,
          freq.serviceType,
          freq.tags?.join(','),
          freq.duplex,
          freq.offset,
          1
        ];

        const sql = `
          INSERT INTO frequencies (${fields.join(', ')})
          VALUES (${fields.map(() => '?').join(', ')})
        `;
        await this.db.execute(sql, values);
      }
      await this.db.execute('COMMIT');
    } catch (error) {
      await this.db.execute('ROLLBACK');
      throw error;
    }
  }

  public async validateImport(data: any, type: string): Promise<string[]> {
    const errors: string[] = [];

    switch (type) {
      case 'frequency':
        if (!data.frequency || isNaN(parseFloat(data.frequency))) {
          errors.push('Invalid frequency value');
        }
        if (!data.name) {
          errors.push('Name is required');
        }
        if (!data.mode) {
          errors.push('Mode is required');
        }
        break;

      case 'trunked':
        if (!data.system_id) {
          errors.push('System ID is required');
        }
        if (!data.name) {
          errors.push('Name is required');
        }
        if (!data.type) {
          errors.push('Type is required');
        }
        break;

      case 'talkgroup':
        if (!data.system_id) {
          errors.push('System ID is required');
        }
        if (!data.decimal_id || isNaN(parseInt(data.decimal_id))) {
          errors.push('Invalid decimal ID');
        }
        if (!data.alpha_tag) {
          errors.push('Alpha tag is required');
        }
        break;
    }

    return errors;
  }
} 
