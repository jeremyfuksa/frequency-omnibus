import { useEffect, ChangeEvent, useState } from 'react'
import { useFrequenciesStore } from '../store'
import { DatabaseService } from '../lib/db-service'
import { useDatabaseStore } from '../store'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Select } from '../components/ui/select'
import { MODES, SERVICE_TYPES, Frequency } from '../types/models'
import { FrequencyModal } from '../components/modals/FrequencyModal'
import { ExportModal } from '../components/modals/ExportModal'
import { useTrunkedSystemsStore } from '../store'

export function FrequenciesPage() {
  const { db } = useDatabaseStore()
  const { frequencies, setFrequencies, filter, setFilter } = useFrequenciesStore()
  const { systems } = useTrunkedSystemsStore()
  const [modalOpen, setModalOpen] = useState(false)
  const [exportModalOpen, setExportModalOpen] = useState(false)
  const [editFrequency, setEditFrequency] = useState<Frequency | undefined>(undefined)

  useEffect(() => {
    if (!db) return

    const dbService = new DatabaseService(db)
    dbService.getFrequencies(filter).then(setFrequencies)
  }, [db, filter, setFrequencies])

  const handleAdd = () => {
    setEditFrequency(undefined)
    setModalOpen(true)
  }
  const handleEdit = (freq: Frequency) => {
    setEditFrequency(freq)
    setModalOpen(true)
  }
  const handleDelete = async (freq: Frequency) => {
    if (!db) return
    if (!window.confirm('Delete this frequency?')) return
    const dbService = new DatabaseService(db)
    await dbService.deleteFrequency(freq.id)
    setFrequencies(await dbService.getFrequencies(filter))
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Conventional Frequencies</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setExportModalOpen(true)}>Export</Button>
          <Button onClick={handleAdd}>Add Frequency</Button>
        </div>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Input
          placeholder="Search frequencies..."
          value={filter.search || ''}
          onChange={(e: ChangeEvent<HTMLInputElement>) => setFilter({ search: e.target.value })}
        />
        <Select
          value={filter.mode?.[0] || ''}
          onChange={(e: ChangeEvent<HTMLSelectElement>) => setFilter({ mode: e.target.value ? [e.target.value] : undefined })}
        >
          <option value="">All Modes</option>
          {MODES.map((mode) => (
            <option key={mode} value={mode}>
              {mode}
            </option>
          ))}
        </Select>
        <Select
          value={filter.service_type?.[0] || ''}
          onChange={(e: ChangeEvent<HTMLSelectElement>) => setFilter({ service_type: e.target.value ? [e.target.value] : undefined })}
        >
          <option value="">All Service Types</option>
          {SERVICE_TYPES.map((type) => (
            <option key={type} value={type}>
              {type}
            </option>
          ))}
        </Select>
        <Select
          value={filter.active === undefined ? '' : filter.active ? '1' : '0'}
          onChange={(e: ChangeEvent<HTMLSelectElement>) => setFilter({ active: e.target.value === '1' })}
        >
          <option value="">All Status</option>
          <option value="1">Active</option>
          <option value="0">Inactive</option>
        </Select>
      </div>

      {/* Frequency List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {frequencies.map((freq) => (
          <div key={freq.id} className="p-4 border rounded-lg space-y-2">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">{freq.name}</h2>
              <span className="text-sm text-muted-foreground">
                {freq.frequency} MHz
              </span>
            </div>
            {freq.description && (
              <p className="text-sm text-muted-foreground">{freq.description}</p>
            )}
            <div className="flex flex-wrap gap-2 text-sm">
              <span className="px-2 py-1 bg-primary/10 rounded">
                {freq.mode}
              </span>
              {freq.tone_mode && freq.tone_freq && (
                <span className="px-2 py-1 bg-primary/10 rounded">
                  {freq.tone_mode}: {freq.tone_freq}
                </span>
              )}
              {freq.county && (
                <span className="px-2 py-1 bg-primary/10 rounded">
                  {freq.county}
                </span>
              )}
              {freq.state && (
                <span className="px-2 py-1 bg-primary/10 rounded">
                  {freq.state}
                </span>
              )}
            </div>
            <div className="flex gap-2 mt-2">
              <Button size="sm" variant="outline" onClick={() => handleEdit(freq)}>Edit</Button>
              <Button size="sm" variant="outline" onClick={() => handleDelete(freq)}>Delete</Button>
            </div>
          </div>
        ))}
      </div>
      {modalOpen && (
        <FrequencyModal frequency={editFrequency} onClose={() => setModalOpen(false)} />
      )}
      {exportModalOpen && (
        <ExportModal
          frequencies={frequencies}
          trunkedSystems={systems}
          onClose={() => setExportModalOpen(false)}
        />
      )}
    </div>
  )
} 
