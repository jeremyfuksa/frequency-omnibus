import { DatabaseViewAdapter } from './export-adapter';
import { DatabaseService } from './db/database';

/**
 * Provides optimized database export functionality using SQL views
 * and direct database queries for improved performance
 */
export class OptimizedExportService {
  private static instance: OptimizedExportService;
  private adapter: DatabaseViewAdapter;

  private constructor() {
    this.adapter = DatabaseViewAdapter.getInstance();
  }

  public static getInstance(): OptimizedExportService {
    if (!OptimizedExportService.instance) {
      OptimizedExportService.instance = new OptimizedExportService();
    }
    return OptimizedExportService.instance;
  }

  async exportToChirp(): Promise<string> {
    const data = await this.adapter.getChirpExportData();
    const headers = ['Location', 'Name', 'Frequency', 'Duplex', 'Offset', 'Tone', 'rToneFreq', 'cToneFreq', 'DtcsCode', 'DtcsPolarity', 'Mode', 'TStep', 'Skip', 'Comment', 'URCALL', 'RPT1CALL', 'RPT2CALL'];
    const rows = data.map(freq => [
      '', // Location
      freq.name.substring(0, 8), // Name (max 8 chars)
      freq.frequency.toFixed(5), // Frequency
      freq.duplex || '', // Duplex
      freq.offset ? freq.offset.toFixed(5) : '', // Offset
      freq.tone_mode || '', // Tone
      freq.tone_freq || '', // rToneFreq
      freq.tone_freq || '', // cToneFreq
      '', // DtcsCode
      '', // DtcsPolarity
      freq.mode, // Mode
      '', // TStep
      '', // Skip
      freq.comment || '', // Comment
      '', // URCALL
      '', // RPT1CALL
      ''  // RPT2CALL
    ]);
    return this.generateCSV(headers, rows);
  }

  async exportToUniden(): Promise<string> {
    const data = await this.adapter.getUnidenExportData();
    const headers = ['Name', 'Frequency', 'Mode', 'Tone', 'Service Type', 'County', 'State', 'Alpha Tag'];
    const rows = data.map(freq => [
      freq.name,
      freq.frequency.toFixed(5),
      freq.mode,
      freq.tone_freq || '',
      freq.service_type || '',
      freq.county || '',
      freq.state || '',
      freq.alpha_tag || ''
    ]);
    return this.generateCSV(headers, rows);
  }

  async exportToSDRTrunk(): Promise<string> {
    const conventionalData = await this.adapter.getSDRTrunkConventionalData();
    const businessTrunkedData = await this.adapter.getBusinessTrunkedSystems();
    
    const conventional = conventionalData.map(freq => ({
      name: freq.name,
      frequency: freq.frequency,
      description: freq.description || '',
      mode: freq.mode,
      county: freq.county || '',
      state: freq.state || '',
      serviceType: freq.service_type || ''
    }));

    const trunked = businessTrunkedData.map(system => ({
      name: system.name,
      type: 'Business',
      systemClass: 'Business',
      description: system.description || '',
      businessType: system.business_type || '',
      businessOwner: system.business_owner || ''
    }));

    return JSON.stringify({
      conventional,
      trunked
    }, null, 2);
  }

  async exportToOpenGD77(): Promise<string> {
    const data = await this.adapter.getOpenGD77ExportData();
    const headers = ['Name', 'Frequency', 'Transmit Frequency', 'Mode', 'Tone', 'Alpha Tag'];
    const rows = data.map(freq => [
      freq.name,
      freq.frequency.toFixed(5),
      freq.transmit_frequency ? freq.transmit_frequency.toFixed(5) : '',
      freq.mode,
      freq.tone_freq || '',
      freq.alpha_tag || ''
    ]);
    return this.generateCSV(headers, rows);
  }

  async exportKCRepeaters(): Promise<string> {
    const data = await this.adapter.getKCRepeaters();
    const headers = ['Name', 'Frequency', 'Transmit Frequency', 'Mode', 'Tone', 'County', 'Callsign', 'Description'];
    const rows = data.map(freq => [
      freq.name,
      freq.frequency.toFixed(5),
      freq.transmit_frequency ? freq.transmit_frequency.toFixed(5) : '',
      freq.mode,
      freq.tone_freq || '',
      freq.county || '',
      freq.callsign || '',
      freq.description || ''
    ]);
    return this.generateCSV(headers, rows);
  }

  async exportBusinessFrequencies(): Promise<string> {
    const data = await this.adapter.getBusinessFrequencies();
    const headers = ['Name', 'Frequency', 'Mode', 'Agency', 'Service Type', 'Description'];
    const rows = data.map(freq => [
      freq.name,
      freq.frequency.toFixed(5),
      freq.mode,
      freq.agency || '',
      freq.service_type || '',
      freq.description || ''
    ]);
    return this.generateCSV(headers, rows);
  }

  private generateCSV(headers: string[], rows: any[][]): string {
    const csvRows = [
      headers.join(','),
      ...rows.map(row => row.map(cell => 
        typeof cell === 'string' && cell.includes(',') ? `"${cell}"` : cell
      ).join(','))
    ];
    return csvRows.join('\n');
  }
} 
