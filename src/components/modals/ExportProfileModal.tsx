import { useEffect, useState } from 'react'
import { useExportStore } from '../../store'
import { DatabaseService } from '../../lib/db-service'
import { useDatabaseStore } from '../../store'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Select } from '../ui/select'
import { ExportProfile, Radio } from '../../types/models'

interface ExportProfileModalProps {
  profile?: ExportProfile
  onClose: () => void
}

export function ExportProfileModal({ profile, onClose }: ExportProfileModalProps) {
  const { db } = useDatabaseStore()
  const { setProfiles, setRadios } = useExportStore()
  const [radios, setRadiosList] = useState<Radio[]>([])
  const [formData, setFormData] = useState<Partial<ExportProfile>>(
    profile || {
      name: '',
      radio_id: undefined,
      description: '',
      filter_query: '',
      sort_order: '',
      created_at: new Date().toISOString()
    }
  )

  useEffect(() => {
    const loadRadios = async () => {
      if (!db) return
      const dbService = new DatabaseService(db)
      const radiosList = await dbService.getRadios()
      setRadiosList(radiosList)
    }
    loadRadios()
  }, [db])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!db) return

    const dbService = new DatabaseService(db)
    if (profile) {
      await dbService.updateExportProfile(profile.id, formData)
    } else {
      await dbService.addExportProfile(formData as Omit<ExportProfile, 'id'>)
    }

    // Refresh profiles
    const profiles = await dbService.getExportProfiles()
    setProfiles(profiles)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-lg rounded-lg bg-background p-6">
        <h2 className="text-xl font-bold mb-4">
          {profile ? 'Edit Export Profile' : 'Add Export Profile'}
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
            <label className="text-sm font-medium">Description</label>
            <Input
              value={formData.description || ''}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Radio</label>
            <Select
              value={formData.radio_id?.toString() || ''}
              onChange={(e) => setFormData({ ...formData, radio_id: e.target.value ? parseInt(e.target.value) : undefined })}
            >
              <option value="">Select Radio</option>
              {radios.map((radio) => (
                <option key={radio.id} value={radio.id}>
                  {radio.name}
                </option>
              ))}
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Filter Query</label>
            <Input
              value={formData.filter_query || ''}
              onChange={(e) => setFormData({ ...formData, filter_query: e.target.value })}
              placeholder="e.g., mode = 'FM' AND active = 1"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Sort Order</label>
            <Input
              value={formData.sort_order || ''}
              onChange={(e) => setFormData({ ...formData, sort_order: e.target.value })}
              placeholder="e.g., frequency ASC"
            />
          </div>

          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">
              {profile ? 'Save Changes' : 'Add Profile'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
} 
