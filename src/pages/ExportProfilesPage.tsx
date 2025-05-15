import { useEffect, ChangeEvent, useState } from 'react'
import { useExportStore } from '../store'
import { DatabaseService } from '../lib/db-service'
import { useDatabaseStore } from '../store'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Select } from '../components/ui/select'
import { ExportProfile } from '../types/models'
import { ExportProfileModal } from '../components/modals/ExportProfileModal'

export function ExportProfilesPage() {
  const { db } = useDatabaseStore()
  const { profiles, setProfiles, radios, setRadios } = useExportStore()
  const [modalOpen, setModalOpen] = useState(false)
  const [editProfile, setEditProfile] = useState<ExportProfile | undefined>(undefined)

  useEffect(() => {
    if (!db) return
    const dbService = new DatabaseService(db)
    dbService.getExportProfiles().then(setProfiles)
    dbService.getRadios().then(setRadios)
  }, [db, setProfiles, setRadios])

  const handleAdd = () => {
    setEditProfile(undefined)
    setModalOpen(true)
  }
  const handleEdit = (profile: ExportProfile) => {
    setEditProfile(profile)
    setModalOpen(true)
  }
  const handleDelete = async (profile: ExportProfile) => {
    if (!db) return
    if (!window.confirm('Delete this export profile?')) return
    const dbService = new DatabaseService(db)
    await dbService.deleteExportProfile(profile.id)
    setProfiles(await dbService.getExportProfiles())
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Export Profiles</h1>
        <Button onClick={handleAdd}>Add Profile</Button>
      </div>
      {/* Profile List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {profiles.map((profile) => {
          const radio = radios.find(r => r.id === profile.radio_id)
          return (
            <div key={profile.id} className="p-4 border rounded-lg space-y-2">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">{profile.name}</h2>
                {radio && (
                  <span className="text-sm text-muted-foreground">{radio.name}</span>
                )}
              </div>
              {profile.description && (
                <p className="text-sm text-muted-foreground">{profile.description}</p>
              )}
              <div className="flex flex-wrap gap-2 text-sm">
                {profile.filter_query && (
                  <span className="px-2 py-1 bg-primary/10 rounded">Filter: {profile.filter_query}</span>
                )}
                {profile.sort_order && (
                  <span className="px-2 py-1 bg-primary/10 rounded">Sort: {profile.sort_order}</span>
                )}
              </div>
              <div className="flex gap-2 mt-2">
                <Button size="sm" variant="outline" onClick={() => handleEdit(profile)}>Edit</Button>
                <Button size="sm" variant="outline" onClick={() => handleDelete(profile)}>Delete</Button>
              </div>
            </div>
          )
        })}
      </div>
      {modalOpen && (
        <ExportProfileModal profile={editProfile} onClose={() => setModalOpen(false)} />
      )}
    </div>
  )
} 
