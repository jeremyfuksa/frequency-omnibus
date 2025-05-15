import { useEffect, useState } from 'react'
import { useExportStore } from '../../store'
import { DatabaseService } from '../../lib/db-service'
import { useDatabaseStore } from '../../store'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Select } from '../ui/select'
import { Radio } from '../../types/models'

interface RadioModalProps {
  radio?: Radio
  onClose: () => void
}

export function RadioModal({ radio, onClose }: RadioModalProps) {
  const { db } = useDatabaseStore()
  const { setRadios } = useExportStore()
  const [formData, setFormData] = useState<Partial<Radio>>(
    radio || {
      name: '',
      type: '',
      min_frequency: null,
      max_frequency: null,
      supported_modes: '',
      channel_capacity: null,
      notes: '',
      created_at: new Date().toISOString()
    }
  )

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!db) return

    const dbService = new DatabaseService(db)
    if (radio) {
      await dbService.updateRadio(radio.id, formData)
    } else {
      await dbService.addRadio(formData as Omit<Radio, 'id'>)
    }

    // Refresh radios
    const radios = await dbService.getRadios()
    setRadios(radios)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-lg rounded-lg bg-background p-6">
        <h2 className="text-xl font-bold mb-4">
          {radio ? 'Edit Radio' : 'Add Radio'}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Name</label>
            <Input
              value={formData.name || ''}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Type</label>
            <Input
              value={formData.type || ''}
              onChange={(e) => setFormData({ ...formData, type: e.target.value })}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Min Frequency (MHz)</label>
              <Input
                type="number"
                step="0.000001"
                value={formData.min_frequency || ''}
                onChange={(e) => setFormData({ ...formData, min_frequency: e.target.value ? parseFloat(e.target.value) : null })}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Max Frequency (MHz)</label>
              <Input
                type="number"
                step="0.000001"
                value={formData.max_frequency || ''}
                onChange={(e) => setFormData({ ...formData, max_frequency: e.target.value ? parseFloat(e.target.value) : null })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Supported Modes</label>
            <Input
              value={formData.supported_modes || ''}
              onChange={(e) => setFormData({ ...formData, supported_modes: e.target.value })}
              placeholder="e.g., FM, NFM, AM"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Channel Capacity</label>
            <Input
              type="number"
              value={formData.channel_capacity || ''}
              onChange={(e) => setFormData({ ...formData, channel_capacity: e.target.value ? parseInt(e.target.value) : null })}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Notes</label>
            <Input
              value={formData.notes || ''}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            />
          </div>

          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">
              {radio ? 'Save Changes' : 'Add Radio'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
} 
