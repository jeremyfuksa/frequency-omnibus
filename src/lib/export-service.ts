import { Frequency, TrunkedSystem, TrunkedSite, Talkgroup } from '../types/models'
import { DatabaseService } from './db-service'

export class ExportService {
  private dbService: DatabaseService

  constructor(dbService: DatabaseService) {
    this.dbService = dbService
  }

  // Use database views for exports
  async exportToChirpFromView(): Promise<string> {
    const data = await this.dbService.getChirpExportData()
    const headers = ['Location', 'Name', 'Frequency', 'Duplex', 'Offset', 'Tone', 'rToneFreq', 'cToneFreq', 'DtcsCode', 'DtcsPolarity', 'Mode', 'TStep', 'Skip', 'Comment', 'URCALL', 'RPT1CALL', 'RPT2CALL']
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
    ])
    return this.generateCSV(headers, rows)
  }

  async exportToUnidenFromView(): Promise<string> {
    const data = await this.dbService.getUnidenExportData()
    const headers = ['Name', 'Frequency', 'Mode', 'Tone', 'Service Type', 'County', 'State', 'Alpha Tag']
    const rows = data.map(freq => [
      freq.name,
      freq.frequency.toFixed(5),
      freq.mode,
      freq.tone_freq || '',
      freq.service_type || '',
      freq.county || '',
      freq.state || '',
      freq.alpha_tag || ''
    ])
    return this.generateCSV(headers, rows)
  }

  async exportToSDRTrunkFromView(): Promise<string> {
    const conventionalData = await this.dbService.getSdrtrunkConventionalData()
    const businessTrunkedData = await this.dbService.getBusinessTrunkedSystems()
    
    const conventional = conventionalData.map(freq => ({
      name: freq.name,
      frequency: freq.frequency,
      description: freq.description || '',
      mode: freq.mode,
      county: freq.county || '',
      state: freq.state || '',
      serviceType: freq.service_type || ''
    }))

    const trunked = businessTrunkedData.map(system => ({
      name: system.name,
      type: 'Business',
      systemClass: 'Business',
      description: system.description || '',
      businessType: system.business_type || '',
      businessOwner: system.business_owner || ''
    }))

    return JSON.stringify({
      conventional,
      trunked
    }, null, 2)
  }

  async exportToOpenGD77FromView(): Promise<string> {
    const data = await this.dbService.getOpenGD77ExportData()
    const headers = ['Name', 'Frequency', 'Transmit Frequency', 'Mode', 'Tone', 'Alpha Tag']
    const rows = data.map(freq => [
      freq.name,
      freq.frequency.toFixed(5),
      freq.transmit_frequency ? freq.transmit_frequency.toFixed(5) : '',
      freq.mode,
      freq.tone_freq || '',
      freq.alpha_tag || ''
    ])
    return this.generateCSV(headers, rows)
  }

  async exportKCRepeaters(): Promise<string> {
    const data = await this.dbService.getKCRepeaters()
    const headers = ['Name', 'Frequency', 'Transmit Frequency', 'Mode', 'Tone', 'County', 'Callsign', 'Description']
    const rows = data.map(freq => [
      freq.name,
      freq.frequency.toFixed(5),
      freq.transmit_frequency ? freq.transmit_frequency.toFixed(5) : '',
      freq.mode,
      freq.tone_freq || '',
      freq.county || '',
      freq.callsign || '',
      freq.description || ''
    ])
    return this.generateCSV(headers, rows)
  }

  async exportBusinessFrequencies(): Promise<string> {
    const data = await this.dbService.getBusinessFrequencies()
    const headers = ['Name', 'Frequency', 'Mode', 'Agency', 'Service Type', 'Description']
    const rows = data.map(freq => [
      freq.name,
      freq.frequency.toFixed(5),
      freq.mode,
      freq.agency || '',
      freq.service_type || '',
      freq.description || ''
    ])
    return this.generateCSV(headers, rows)
  }

  // Legacy methods for backward compatibility
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
    return ExportService.generateCSV(headers, rows)
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
    return ExportService.generateCSV(headers, rows)
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
    return ExportService.generateCSV(headers, rows)
  }

  // SDR++ Export (JSON)
  static exportToSDRPlus(frequencies: Frequency[]): string {
    const bookmarks = frequencies.map(freq => ({
      name: freq.name,
      frequency: freq.frequency,
      description: freq.description || '',
      mode: freq.mode,
      bandwidth: ExportService.getBandwidthForMode(freq.mode)
    }))

    return JSON.stringify({
      bookmarks
    }, null, 2)
  }

  // Helper function to generate CSV
  private generateCSV(headers: string[], rows: any[][]): string {
    const csvRows = [
      headers.join(','),
      ...rows.map(row => row.map(cell => 
        typeof cell === 'string' && cell.includes(',') ? `"${cell}"` : cell
      ).join(','))
    ]
    return csvRows.join('\n')
  }

  // Static helper function to generate CSV
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
