import { useEffect, useState } from 'react'
import { useTrunkedSystemsStore } from '../../store'
import { DatabaseService } from '../../lib/db-service'
import { useDatabaseStore } from '../../store'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Select } from '../ui/select'
import { SYSTEM_CLASSES, SYSTEM_PROTOCOLS } from '../../types/models'
import { TrunkedSystem } from '../../types/models'

interface TrunkedSystemModalProps {
  system?: TrunkedSystem
  onClose: () => void
}

export function TrunkedSystemModal({ system, onClose }: TrunkedSystemModalProps) {
  const { db } = useDatabaseStore()
  const { setSystems } = useTrunkedSystemsStore()
  const [formData, setFormData] = useState<Partial<TrunkedSystem>>(
    system || {
      system_id: '',
      name: '',
      type: 'P25',
      system_class: 'Public Safety',
      system_protocol: 'P25',
      active: 1,
      created_at: new Date().toISOString()
    }
  )

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!db) return

    const dbService = new DatabaseService(db)
    if (system) {
      await dbService.updateTrunkedSystem(system.id, formData)
    } else {
      await dbService.addTrunkedSystem(formData as Omit<TrunkedSystem, 'id'>)
    }

    // Refresh systems
    const systems = await dbService.getTrunkedSystems()
    setSystems(systems)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-lg rounded-lg bg-background p-6">
        <h2 className="text-xl font-bold mb-4">
          {system ? 'Edit Trunked System' : 'Add Trunked System'}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">System ID</label>
              <Input
                value={formData.system_id || ''}
                onChange={(e) => setFormData({ ...formData, system_id: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Name</label>
              <Input
                value={formData.name || ''}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>
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
              <label className="text-sm font-medium">System Class</label>
              <Select
                value={formData.system_class || ''}
                onChange={(e) => setFormData({ ...formData, system_class: e.target.value })}
                required
              >
                {SYSTEM_CLASSES.map((cls) => (
                  <option key={cls} value={cls}>
                    {cls}
                  </option>
                ))}
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">System Protocol</label>
              <Select
                value={formData.system_protocol || ''}
                onChange={(e) => setFormData({ ...formData, system_protocol: e.target.value })}
                required
              >
                {SYSTEM_PROTOCOLS.map((protocol) => (
                  <option key={protocol} value={protocol}>
                    {protocol}
                  </option>
                ))}
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Business Type</label>
              <Input
                value={formData.business_type || ''}
                onChange={(e) => setFormData({ ...formData, business_type: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Business Owner</label>
              <Input
                value={formData.business_owner || ''}
                onChange={(e) => setFormData({ ...formData, business_owner: e.target.value })}
              />
            </div>
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
              {system ? 'Save Changes' : 'Add System'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
} 
