import { useEffect, ChangeEvent, useState } from 'react'
import { useTrunkedSystemsStore } from '../store'
import { DatabaseService } from '../lib/db-service'
import { useDatabaseStore } from '../store'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Select } from '../components/ui/select'
import { SYSTEM_CLASSES, SYSTEM_PROTOCOLS, TrunkedSystem } from '../types/models'
import { TrunkedSystemModal } from '../components/modals/TrunkedSystemModal'

export function TrunkedSystemsPage() {
  const { db } = useDatabaseStore()
  const { systems, setSystems, systemFilter, setSystemFilter } = useTrunkedSystemsStore()
  const [modalOpen, setModalOpen] = useState(false)
  const [editSystem, setEditSystem] = useState<TrunkedSystem | undefined>(undefined)

  useEffect(() => {
    if (!db) return
    const dbService = new DatabaseService(db)
    dbService.getTrunkedSystems(systemFilter).then(setSystems)
  }, [db, systemFilter, setSystems])

  const handleAdd = () => {
    setEditSystem(undefined)
    setModalOpen(true)
  }
  const handleEdit = (sys: TrunkedSystem) => {
    setEditSystem(sys)
    setModalOpen(true)
  }
  const handleDelete = async (sys: TrunkedSystem) => {
    if (!db) return
    if (!window.confirm('Delete this trunked system?')) return
    const dbService = new DatabaseService(db)
    await dbService.deleteTrunkedSystem(sys.id)
    setSystems(await dbService.getTrunkedSystems(systemFilter))
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Trunked Systems</h1>
        <Button onClick={handleAdd}>Add System</Button>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Input
          placeholder="Search systems..."
          value={systemFilter.search || ''}
          onChange={(e: ChangeEvent<HTMLInputElement>) => setSystemFilter({ search: e.target.value })}
        />
        <Select
          value={systemFilter.system_class?.[0] || ''}
          onChange={(e: ChangeEvent<HTMLSelectElement>) => setSystemFilter({ system_class: e.target.value ? [e.target.value] : undefined })}
        >
          <option value="">All Classes</option>
          {SYSTEM_CLASSES.map((cls) => (
            <option key={cls} value={cls}>
              {cls}
            </option>
          ))}
        </Select>
        <Select
          value={systemFilter.active === undefined ? '' : systemFilter.active ? '1' : '0'}
          onChange={(e: ChangeEvent<HTMLSelectElement>) => setSystemFilter({ active: e.target.value === '1' })}
        >
          <option value="">All Status</option>
          <option value="1">Active</option>
          <option value="0">Inactive</option>
        </Select>
      </div>

      {/* System List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {systems.map((sys) => (
          <div key={sys.id} className="p-4 border rounded-lg space-y-2">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">{sys.name}</h2>
              <span className="text-sm text-muted-foreground">
                System ID: {sys.system_id}
              </span>
            </div>
            {sys.description && (
              <p className="text-sm text-muted-foreground">{sys.description}</p>
            )}
            <div className="flex flex-wrap gap-2 text-sm">
              <span className="px-2 py-1 bg-primary/10 rounded">
                {sys.type}
              </span>
              {sys.system_class && (
                <span className="px-2 py-1 bg-primary/10 rounded">
                  {sys.system_class}
                </span>
              )}
              {sys.system_protocol && (
                <span className="px-2 py-1 bg-primary/10 rounded">
                  {sys.system_protocol}
                </span>
              )}
            </div>
            <div className="flex gap-2 mt-2">
              <Button size="sm" variant="outline" onClick={() => handleEdit(sys)}>Edit</Button>
              <Button size="sm" variant="outline" onClick={() => handleDelete(sys)}>Delete</Button>
            </div>
          </div>
        ))}
      </div>
      {modalOpen && (
        <TrunkedSystemModal system={editSystem} onClose={() => setModalOpen(false)} />
      )}
    </div>
  )
} 
