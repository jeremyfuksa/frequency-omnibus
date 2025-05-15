import { useState } from 'react'
import { Button } from '../ui/button'
import { Select } from '../ui/select'
import { ExportService } from '../../lib/export-service'
import { Frequency, TrunkedSystem } from '../../types/models'

interface ExportDialogProps {
  frequencies: Frequency[]
  trunkedSystems: TrunkedSystem[]
  onClose: () => void
}

export function ExportDialog({ frequencies, trunkedSystems, onClose }: ExportDialogProps) {
  const [format, setFormat] = useState<'chirp' | 'uniden' | 'sdrtrunk' | 'opengd77' | 'sdrplus'>('chirp')

  const handleExport = () => {
    let content = ''
    let filename = ''
    let mimeType = ''

    switch (format) {
      case 'chirp':
        content = ExportService.exportToChirp(frequencies)
        filename = 'chirp_export.csv'
        mimeType = 'text/csv'
        break
      case 'uniden':
        content = ExportService.exportToUniden(frequencies)
        filename = 'uniden_export.csv'
        mimeType = 'text/csv'
        break
      case 'sdrtrunk':
        content = ExportService.exportToSDRTrunk(frequencies, trunkedSystems)
        filename = 'sdrtrunk_export.json'
        mimeType = 'application/json'
        break
      case 'opengd77':
        content = ExportService.exportToOpenGD77(frequencies)
        filename = 'opengd77_export.csv'
        mimeType = 'text/csv'
        break
      case 'sdrplus':
        content = ExportService.exportToSDRPlus(frequencies)
        filename = 'sdrplus_export.json'
        mimeType = 'application/json'
        break
    }

    // Create and trigger download
    const blob = new Blob([content], { type: mimeType })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    onClose()
  }

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Export Data</h2>
      <div className="space-y-2">
        <label className="text-sm font-medium">Export Format</label>
        <Select
          value={format}
          onChange={(e) => setFormat(e.target.value as typeof format)}
        >
          <option value="chirp">CHIRP (CSV)</option>
          <option value="uniden">Uniden (CSV)</option>
          <option value="sdrtrunk">SDRTrunk (JSON)</option>
          <option value="opengd77">OpenGD77 (CSV)</option>
          <option value="sdrplus">SDR++ (JSON)</option>
        </Select>
      </div>
      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={onClose}>Cancel</Button>
        <Button onClick={handleExport}>Export</Button>
      </div>
    </div>
  )
} 
