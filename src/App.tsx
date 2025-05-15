import { useEffect } from 'react'
import { MainLayout } from './components/layout/MainLayout'
import { useDatabaseStore, useUIStore } from './store'
import { DatabaseService } from './lib/db-service'
import initSqlJs from 'sql.js'
import { FrequenciesPage } from './pages/FrequenciesPage'
import { TrunkedSystemsPage } from './pages/TrunkedSystemsPage'
import { ExportProfilesPage } from './pages/ExportProfilesPage'
import { SettingsPage } from './pages/SettingsPage'

function App() {
  const { setDb, setLoading, setError } = useDatabaseStore()
  const { activeTab } = useUIStore()

  useEffect(() => {
    async function initDatabase() {
      try {
        setLoading(true)
        const SQL = await initSqlJs()
        const db = new SQL.Database()
        setDb(db)

        // Initialize database schema
        const dbService = new DatabaseService(db)
        await dbService.initSchema()

        // Import trunked system data
        const response = await fetch('/data/trunked-systems.csv')
        const csvText = await response.text()
        await dbService.importTrunkedSystems(csvText)

        setLoading(false)
      } catch (error) {
        setError(error instanceof Error ? error.message : 'Failed to initialize database')
        setLoading(false)
      }
    }

    initDatabase()
  }, [setDb, setLoading, setError])

  const renderContent = () => {
    switch (activeTab) {
      case 'frequencies':
        return <FrequenciesPage />
      case 'trunked':
        return <TrunkedSystemsPage />
      case 'export':
        return <ExportProfilesPage />
      case 'settings':
        return <SettingsPage />
      default:
        return <FrequenciesPage />
    }
  }

  return (
    <MainLayout>
      {renderContent()}
    </MainLayout>
  )
}

export default App 
