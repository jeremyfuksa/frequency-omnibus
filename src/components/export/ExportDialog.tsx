import { useState } from 'react'
import { Button } from '../ui/button'
import { Select } from '../ui/select'
import { ExportService } from '../../lib/export-service'
import { Frequency, TrunkedSystem } from '../../types/models'
import { OptimizedExportService } from '../../lib/optimized-export-service'

interface ExportDialogProps {
  frequencies: Frequency[]
  trunkedSystems: TrunkedSystem[]
  onClose: () => void
}

export function ExportDialog({ frequencies, trunkedSystems, onClose }: ExportDialogProps) {
  const [format, setFormat] = useState<'chirp' | 'uniden' | 'sdrtrunk' | 'opengd77' | 'sdrplus' | 'kc_repeaters' | 'business_frequencies'>('chirp')
  const [isExporting, setIsExporting] = useState(false)

  const handleExport = async () => {
    setIsExporting(true)
    let content = ''
    let filename = ''
    let mimeType = ''

    try {
      // Use the optimized export service singleton
      const exportService = OptimizedExportService.getInstance();

      switch (format) {
        case 'chirp':
          content = await exportService.exportToChirp()
          filename = 'chirp_export.csv'
          mimeType = 'text/csv'
          break
        case 'uniden':
          content = await exportService.exportToUniden()
          filename = 'uniden_export.csv'
          mimeType = 'text/csv'
          break
        case 'sdrtrunk':
          content = await exportService.exportToSDRTrunk()
          filename = 'sdrtrunk_export.json'
          mimeType = 'application/json'
          break
        case 'opengd77':
          content = await exportService.exportToOpenGD77()
          filename = 'opengd77_export.csv'
          mimeType = 'text/csv'
          break
        case 'kc_repeaters':
          content = await exportService.exportKCRepeaters()
          filename = 'kc_repeaters.csv'
          mimeType = 'text/csv'
          break
        case 'business_frequencies':
          content = await exportService.exportBusinessFrequencies()
          filename = 'business_frequencies.csv'
          mimeType = 'text/csv'
          break
        case 'sdrplus':
          // Keep using the legacy service for SDR+ which doesn't have a database view
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
      setIsExporting(false)
      onClose()
    } catch (error) {
      console.error('Export failed:', error)
      alert('Export failed. See console for details.')
      setIsExporting(false)
    }
  }

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Export Data</h2>
      <div className="space-y-2">
        <label className="text-sm font-medium">Export Format</label>
        <Select
          value={format}
          onChange={(e) => setFormat(e.target.value as typeof format)}
          disabled={isExporting}
        >
          <option value="chirp">CHIRP (CSV)</option>
          <option value="uniden">Uniden (CSV)</option>
          <option value="sdrtrunk">SDRTrunk (JSON)</option>
          <option value="opengd77">OpenGD77 (CSV)</option>
          <option value="sdrplus">SDR++ (JSON)</option>
          <option value="kc_repeaters">KC Repeaters (CSV)</option>
          <option value="business_frequencies">Business Frequencies (CSV)</option>
        </Select>
      </div>
      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={onClose} disabled={isExporting}>Cancel</Button>
        <Button onClick={handleExport} disabled={isExporting}>
          {isExporting ? 'Exporting...' : 'Export'}
        </Button>
      </div>
    </div>
  )
} 
