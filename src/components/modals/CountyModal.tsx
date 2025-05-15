import { useEffect, useState } from 'react'
import { useDatabaseStore } from '../../store'
import { DatabaseService } from '../../lib/db-service'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Select } from '../ui/select'
import { County, REGIONS } from '../../types/models'

interface CountyModalProps {
  county?: County
  onClose: () => void
}

export function CountyModal({ county, onClose }: CountyModalProps) {
  const { db } = useDatabaseStore()
  const [formData, setFormData] = useState<Partial<County>>(
    county || {
      name: '',
      state: '',
      fips_code: '',
      region: '',
      distance_from_kc: null,
      notes: '',
      created_at: new Date().toISOString()
    }
  )

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!db) return

    const dbService = new DatabaseService(db)
    if (county) {
      await dbService.updateCounty(county.id, formData)
    } else {
      await dbService.addCounty(formData as Omit<County, 'id'>)
    }

    // Refresh counties
    const counties = await dbService.getCounties()
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-lg rounded-lg bg-background p-6">
        <h2 className="text-xl font-bold mb-4">
          {county ? 'Edit County' : 'Add County'}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Name</label>
              <Input
                value={formData.name || ''}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">State</label>
              <Input
                value={formData.state || ''}
                onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">FIPS Code</label>
              <Input
                value={formData.fips_code || ''}
                onChange={(e) => setFormData({ ...formData, fips_code: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Region</label>
              <Select
                value={formData.region || ''}
                onChange={(e) => setFormData({ ...formData, region: e.target.value })}
              >
                <option value="">Select Region</option>
                {REGIONS.map((region) => (
                  <option key={region} value={region}>
                    {region}
                  </option>
                ))}
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Distance from KC (miles)</label>
            <Input
              type="number"
              step="0.1"
              value={formData.distance_from_kc || ''}
              onChange={(e) => setFormData({ ...formData, distance_from_kc: e.target.value ? parseFloat(e.target.value) : null })}
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
              {county ? 'Save Changes' : 'Add County'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
} 
