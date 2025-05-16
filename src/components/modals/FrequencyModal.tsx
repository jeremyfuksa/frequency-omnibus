import { useEffect, useState } from 'react'
import { useFrequenciesStore } from '../../store'
import { useDatabaseStore } from '../../store'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Select } from '../ui/select'
import { MODES, SERVICE_TYPES, TONE_MODES } from '../../types/models'
import { Frequency } from '../../types/models'

interface FrequencyModalProps {
  frequency?: Frequency
  onClose: () => void
}

export function FrequencyModal({ frequency, onClose }: FrequencyModalProps) {
  const { db } = useDatabaseStore()
  const { setFrequencies } = useFrequenciesStore()
  const [formData, setFormData] = useState<Partial<Frequency>>(
    frequency || {
      frequency: 0,
      name: '',
      mode: 'FM',
      active: 1,
      created_at: new Date().toISOString(),
      export_chirp: 0,
      export_uniden: 0,
      export_sdrtrunk: 0,
      export_sdrplus: 0,
      export_opengd77: 0
    }
  )

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!db) return

    if (frequency) {
      await db.execute(
        'UPDATE frequencies SET frequency = ?, transmit_frequency = ?, name = ?, description = ?, mode = ?, tone_mode = ?, tone_freq = ?, county = ?, state = ?, service_type = ?, active = ?, export_chirp = ?, export_uniden = ?, export_sdrtrunk = ?, export_sdrplus = ?, export_opengd77 = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [
          formData.frequency,
          formData.transmit_frequency,
          formData.name,
          formData.description,
          formData.mode,
          formData.tone_mode,
          formData.tone_freq,
          formData.county,
          formData.state,
          formData.service_type,
          formData.active ? 1 : 0,
          formData.export_chirp ? 1 : 0,
          formData.export_uniden ? 1 : 0,
          formData.export_sdrtrunk ? 1 : 0,
          formData.export_sdrplus ? 1 : 0,
          formData.export_opengd77 ? 1 : 0,
          frequency.id
        ]
      );
    } else {
      await db.execute(
        'INSERT INTO frequencies (frequency, transmit_frequency, name, description, mode, tone_mode, tone_freq, county, state, service_type, active, export_chirp, export_uniden, export_sdrtrunk, export_sdrplus, export_opengd77, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)',
        [
          formData.frequency,
          formData.transmit_frequency,
          formData.name,
          formData.description,
          formData.mode,
          formData.tone_mode,
          formData.tone_freq,
          formData.county,
          formData.state,
          formData.service_type,
          formData.active ? 1 : 0,
          formData.export_chirp ? 1 : 0,
          formData.export_uniden ? 1 : 0,
          formData.export_sdrtrunk ? 1 : 0,
          formData.export_sdrplus ? 1 : 0,
          formData.export_opengd77 ? 1 : 0
        ]
      );
    }

    // Refresh frequencies
    const frequencies = await db.query<Frequency>('SELECT * FROM frequencies');
    setFrequencies(frequencies);
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-lg rounded-lg bg-background p-6">
        <h2 className="text-xl font-bold mb-4">
          {frequency ? 'Edit Frequency' : 'Add Frequency'}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Frequency (MHz)</label>
              <Input
                type="number"
                step="0.000001"
                value={formData.frequency || ''}
                onChange={(e) => setFormData({ ...formData, frequency: parseFloat(e.target.value) })}
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Transmit Frequency (MHz)</label>
              <Input
                type="number"
                step="0.000001"
                value={formData.transmit_frequency || ''}
                onChange={(e) => setFormData({ ...formData, transmit_frequency: parseFloat(e.target.value) })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Name</label>
            <Input
              value={formData.name || ''}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Description</label>
            <Input
              value={formData.description || ''}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Mode</label>
              <Select
                value={formData.mode || ''}
                onChange={(e) => setFormData({ ...formData, mode: e.target.value })}
                required
              >
                {MODES.map((mode) => (
                  <option key={mode} value={mode}>
                    {mode}
                  </option>
                ))}
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Service Type</label>
              <Select
                value={formData.service_type || ''}
                onChange={(e) => setFormData({ ...formData, service_type: e.target.value })}
              >
                <option value="">Select Type</option>
                {SERVICE_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Tone Mode</label>
              <Select
                value={formData.tone_mode || ''}
                onChange={(e) => setFormData({ ...formData, tone_mode: e.target.value })}
              >
                <option value="">None</option>
                {TONE_MODES.map((mode) => (
                  <option key={mode} value={mode}>
                    {mode}
                  </option>
                ))}
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Tone Frequency</label>
              <Input
                value={formData.tone_freq || ''}
                onChange={(e) => setFormData({ ...formData, tone_freq: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">County</label>
              <Input
                value={formData.county || ''}
                onChange={(e) => setFormData({ ...formData, county: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">State</label>
              <Input
                value={formData.state || ''}
                onChange={(e) => setFormData({ ...formData, state: e.target.value })}
              />
            </div>
          </div>

          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">
              {frequency ? 'Save Changes' : 'Add Frequency'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
} 
