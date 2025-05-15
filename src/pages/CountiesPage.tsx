import { useEffect, useState } from 'react'
import { useCountiesStore } from '../store'
import { DatabaseService } from '../lib/db-service'
import { useDatabaseStore } from '../store'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { County } from '../types/models'
import { CountyModal } from '../components/modals/CountyModal'

export function CountiesPage() {
  const { db } = useDatabaseStore()
  const { counties, setCounties } = useCountiesStore()
  const [modalOpen, setModalOpen] = useState(false)
  const [editCounty, setEditCounty] = useState<County | undefined>(undefined)

  useEffect(() => {
    if (!db) return
    const dbService = new DatabaseService(db)
    dbService.getCounties().then(setCounties)
  }, [db, setCounties])

  const handleAdd = () => {
    setEditCounty(undefined)
    setModalOpen(true)
  }
  const handleEdit = (county: County) => {
    setEditCounty(county)
    setModalOpen(true)
  }
  const handleDelete = async (county: County) => {
    if (!db) return
    if (!window.confirm('Delete this county?')) return
    const dbService = new DatabaseService(db)
    await dbService.deleteCounty(county.id)
    setCounties(await dbService.getCounties())
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Counties</h1>
        <Button onClick={handleAdd}>Add County</Button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {counties.map((county) => (
          <div key={county.id} className="p-4 border rounded-lg space-y-2">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">{county.name}</h2>
              <span className="text-sm text-muted-foreground">{county.state}</span>
            </div>
            <div className="flex flex-wrap gap-2 text-sm">
              {county.region && <span className="px-2 py-1 bg-primary/10 rounded">{county.region}</span>}
              {county.fips_code && <span className="px-2 py-1 bg-primary/10 rounded">FIPS: {county.fips_code}</span>}
              {county.distance_from_kc && <span className="px-2 py-1 bg-primary/10 rounded">{county.distance_from_kc} mi</span>}
            </div>
            {county.notes && <p className="text-sm text-muted-foreground">{county.notes}</p>}
            <div className="flex gap-2 mt-2">
              <Button size="sm" variant="outline" onClick={() => handleEdit(county)}>Edit</Button>
              <Button size="sm" variant="outline" onClick={() => handleDelete(county)}>Delete</Button>
            </div>
          </div>
        ))}
      </div>
      {modalOpen && (
        <CountyModal county={editCounty} onClose={() => setModalOpen(false)} />
      )}
    </div>
  )
} 
