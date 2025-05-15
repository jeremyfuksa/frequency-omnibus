import { Frequency, TrunkedSystem, TrunkedSite, Talkgroup } from '../types/models'

export class ExportService {
  // CHIRP Export (CSV)
  static exportToChirp(frequencies: Frequency[]): string {
    const headers = ['Location', 'Name', 'Frequency', 'Duplex', 'Offset', 'Tone', 'rToneFreq', 'cToneFreq', 'DtcsCode', 'DtcsPolarity', 'Mode', 'TStep', 'Skip', 'Comment', 'URCALL', 'RPT1CALL', 'RPT2CALL']
    const rows = frequencies.map(freq => [
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
      freq.description || '', // Comment
      '', // URCALL
      '', // RPT1CALL
      ''  // RPT2CALL
    ])
    return this.generateCSV(headers, rows)
  }

  // Uniden Export (CSV)
  static exportToUniden(frequencies: Frequency[]): string {
    const headers = ['Name', 'Frequency', 'Mode', 'Tone', 'Service Type', 'County', 'State', 'Agency']
    const rows = frequencies.map(freq => [
      freq.name,
      freq.frequency.toFixed(5),
      freq.mode,
      freq.tone_freq || '',
      freq.service_type || '',
      freq.county || '',
      freq.state || '',
      freq.agency || ''
    ])
    return this.generateCSV(headers, rows)
  }

  // SDRTrunk Export (JSON)
  static exportToSDRTrunk(frequencies: Frequency[], trunkedSystems: TrunkedSystem[]): string {
    const conventional = frequencies.map(freq => ({
      name: freq.name,
      frequency: freq.frequency,
      description: freq.description || '',
      mode: freq.mode,
      county: freq.county || '',
      state: freq.state || '',
      agency: freq.agency || '',
      serviceType: freq.service_type || ''
    }))

    const trunked = trunkedSystems.map(system => ({
      name: system.name,
      type: system.type,
      systemClass: system.system_class || '',
      protocol: system.system_protocol || '',
      description: system.description || '',
      sites: [] // Sites will be populated separately
    }))

    return JSON.stringify({
      conventional,
      trunked
    }, null, 2)
  }

  // OpenGD77 Export (CSV)
  static exportToOpenGD77(frequencies: Frequency[]): string {
    const headers = ['Name', 'Frequency', 'Transmit Frequency', 'Mode', 'Tone', 'Duplex', 'Offset', 'County', 'State', 'Service Type']
    const rows = frequencies.map(freq => [
      freq.name,
      freq.frequency.toFixed(5),
      freq.transmit_frequency ? freq.transmit_frequency.toFixed(5) : '',
      freq.mode,
      freq.tone_freq || '',
      freq.duplex || '',
      freq.offset ? freq.offset.toFixed(5) : '',
      freq.county || '',
      freq.state || '',
      freq.service_type || ''
    ])
    return this.generateCSV(headers, rows)
  }

  // SDR++ Export (JSON)
  static exportToSDRPlus(frequencies: Frequency[]): string {
    const bookmarks = frequencies.map(freq => ({
      name: freq.name,
      frequency: freq.frequency,
      description: freq.description || '',
      mode: freq.mode,
      bandwidth: this.getBandwidthForMode(freq.mode)
    }))

    return JSON.stringify({
      bookmarks
    }, null, 2)
  }

  // Helper function to generate CSV
  private static generateCSV(headers: string[], rows: any[][]): string {
    const csvRows = [
      headers.join(','),
      ...rows.map(row => row.map(cell => 
        typeof cell === 'string' && cell.includes(',') ? `"${cell}"` : cell
      ).join(','))
    ]
    return csvRows.join('\n')
  }

  // Helper function to get bandwidth for SDR++ export
  private static getBandwidthForMode(mode: string): number {
    switch (mode.toUpperCase()) {
      case 'FM':
        return 12500
      case 'NFM':
        return 12500
      case 'AM':
        return 10000
      case 'USB':
      case 'LSB':
        return 3000
      default:
        return 12500
    }
  }
} 
