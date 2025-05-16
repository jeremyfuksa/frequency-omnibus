import { useEffect } from 'react'
import { MainLayout } from './components/layout/MainLayout'
import { useDatabaseStore, useUIStore } from './store'
import { DatabaseService } from './lib/db/database'
import { FrequenciesPage } from './pages/FrequenciesPage'
import { TrunkedSystemsPage } from './pages/TrunkedSystemsPage'
import { ExportProfilesPage } from './pages/ExportProfilesPage'
import { SettingsPage } from './pages/SettingsPage'

// Note: We'd need to refactor page components to use default exports for lazy loading
// For now, we'll use direct imports

function App() {
  const { setDb, setLoading, setError } = useDatabaseStore()
  const { activeTab } = useUIStore()

  useEffect(() => {
    async function initDatabase() {
      try {
        setLoading(true)
        
        // Initialize the database service which will load the SQLite file
        const dbService = DatabaseService.getInstance();
        await dbService.initialize();
        
        // Set the database in the store for other components to use
        setDb(dbService);
        
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
