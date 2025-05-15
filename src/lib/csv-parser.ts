export function parseCSV(csv: string): Record<string, string>[] {
  const lines = csv.split(/\r?\n/).filter(Boolean)
  if (lines.length < 2) return []
  const headers = lines[0].split(',').map(h => h.trim())
  return lines.slice(1).map(line => {
    const values = line.split(',')
    const obj: Record<string, string> = {}
    headers.forEach((header, i) => {
      obj[header] = values[i]?.trim() ?? ''
    })
    return obj
  })
} 
