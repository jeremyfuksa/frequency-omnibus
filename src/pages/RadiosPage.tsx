import { useEffect, useState } from 'react'
import { useExportStore } from '../store'
import { DatabaseService } from '../lib/db-service'
import { useDatabaseStore } from '../store'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Radio } from '../types/models'
import { RadioModal } from '../components/modals/RadioModal'

export function RadiosPage() {
  const { db } = useDatabaseStore()
  const { radios, setRadios } = useExportStore()
  const [modalOpen, setModalOpen] = useState(false)
  const [editRadio, setEditRadio] = useState<Radio | undefined>(undefined)

  useEffect(() => {
    if (!db) return
    const dbService = new DatabaseService(db)
    dbService.getRadios().then(setRadios)
  }, [db, setRadios])

  const handleAdd = () => {
    setEditRadio(undefined)
    setModalOpen(true)
  }
  const handleEdit = (radio: Radio) => {
    setEditRadio(radio)
    setModalOpen(true)
  }
  const handleDelete = async (radio: Radio) => {
    if (!db) return
    if (!window.confirm('Delete this radio?')) return
    const dbService = new DatabaseService(db)
    await dbService.deleteRadio(radio.id)
    setRadios(await dbService.getRadios())
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Radios</h1>
        <Button onClick={handleAdd}>Add Radio</Button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {radios.map((radio) => (
          <div key={radio.id} className="p-4 border rounded-lg space-y-2">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">{radio.name}</h2>
              <span className="text-sm text-muted-foreground">{radio.type}</span>
            </div>
            <div className="flex flex-wrap gap-2 text-sm">
              {radio.min_frequency && <span className="px-2 py-1 bg-primary/10 rounded">Min: {radio.min_frequency} MHz</span>}
              {radio.max_frequency && <span className="px-2 py-1 bg-primary/10 rounded">Max: {radio.max_frequency} MHz</span>}
              {radio.supported_modes && <span className="px-2 py-1 bg-primary/10 rounded">Modes: {radio.supported_modes}</span>}
              {radio.channel_capacity && <span className="px-2 py-1 bg-primary/10 rounded">Channels: {radio.channel_capacity}</span>}
            </div>
            {radio.notes && <p className="text-sm text-muted-foreground">{radio.notes}</p>}
            <div className="flex gap-2 mt-2">
              <Button size="sm" variant="outline" onClick={() => handleEdit(radio)}>Edit</Button>
              <Button size="sm" variant="outline" onClick={() => handleDelete(radio)}>Delete</Button>
            </div>
          </div>
        ))}
      </div>
      {modalOpen && (
        <RadioModal radio={editRadio} onClose={() => setModalOpen(false)} />
      )}
    </div>
  )
} 
