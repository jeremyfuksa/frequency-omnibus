interface ParsedFrequency {
  frequency: number
  transmit_frequency: number | null
  name: string
  description: string | null
  mode: string
  tone_mode: string | null
  tone_freq: string | null
  county: string | null
  state: string | null
  agency: string | null
  callsign: string | null
  service_type: string | null
  tags: string | null
  duplex: string | null
  offset: number | null
  last_verified: string | null
  notes: string | null
  source: string | null
  active: number
  distance_from_kc: number | null
  latitude: number | null
  longitude: number | null
  class_station_code: string | null
}

export function parseFrequencyData(markdown: string): ParsedFrequency[] {
  const frequencies: ParsedFrequency[] = []
  const lines = markdown.split('\n')
  
  let currentFrequency: Partial<ParsedFrequency> | null = null
  
  for (const line of lines) {
    // Skip empty lines
    if (!line.trim()) continue
    
    // Check for frequency line (starts with a number)
    if (/^\d+\.\d+/.test(line)) {
      if (currentFrequency) {
        frequencies.push(currentFrequency as ParsedFrequency)
      }
      
      const [freq, ...rest] = line.split(' ')
      currentFrequency = {
        frequency: parseFloat(freq),
        name: rest.join(' ').trim(),
        mode: 'FM', // Default mode
        active: 1,
        service_type: 'Ham', // Default service type
      }
    } else if (currentFrequency) {
      // Parse additional information
      if (line.startsWith('Description:')) {
        currentFrequency.description = line.replace('Description:', '').trim()
      } else if (line.startsWith('Tone:')) {
        const tone = line.replace('Tone:', '').trim()
        if (tone.startsWith('CTCSS')) {
          currentFrequency.tone_mode = 'CTCSS'
          currentFrequency.tone_freq = tone.replace('CTCSS', '').trim()
        } else if (tone.startsWith('DCS')) {
          currentFrequency.tone_mode = 'DCS'
          currentFrequency.tone_freq = tone.replace('DCS', '').trim()
        }
      } else if (line.startsWith('Location:')) {
        const location = line.replace('Location:', '').trim()
        const [county, state] = location.split(',').map(s => s.trim())
        currentFrequency.county = county
        currentFrequency.state = state
      } else if (line.startsWith('Callsign:')) {
        currentFrequency.callsign = line.replace('Callsign:', '').trim()
      }
    }
  }
  
  // Add the last frequency
  if (currentFrequency) {
    frequencies.push(currentFrequency as ParsedFrequency)
  }
  
  return frequencies
} 
