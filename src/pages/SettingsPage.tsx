import { useUIStore } from '../store'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Select } from '../components/ui/select'
import { REGIONS } from '../types/models'

export function SettingsPage() {
  const { darkMode, toggleDarkMode } = useUIStore()

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold mb-4">Settings</h1>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold">Dark Mode</h2>
              <p className="text-sm text-muted-foreground">
                Toggle between light and dark theme
              </p>
            </div>
            <Button onClick={toggleDarkMode}>
              {darkMode ? 'Disable Dark Mode' : 'Enable Dark Mode'}
            </Button>
          </div>

          <div className="space-y-2">
            <h2 className="text-lg font-semibold">Default Region</h2>
            <p className="text-sm text-muted-foreground">
              Set the default region for filtering frequencies
            </p>
            <Select>
              <option value="">Select Region</option>
              {REGIONS.map((region) => (
                <option key={region} value={region}>
                  {region}
                </option>
              ))}
            </Select>
          </div>

          <div className="space-y-2">
            <h2 className="text-lg font-semibold">Database Backup</h2>
            <p className="text-sm text-muted-foreground">
              Export your database for backup
            </p>
            <Button>Export Database</Button>
          </div>

          <div className="space-y-2">
            <h2 className="text-lg font-semibold">Database Restore</h2>
            <p className="text-sm text-muted-foreground">
              Import a database backup
            </p>
            <div className="flex gap-4">
              <Input type="file" accept=".db,.sqlite" />
              <Button>Import Database</Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 
