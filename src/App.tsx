import React, { useEffect } from 'react'
import { MainLayout } from './components/layout/MainLayout'
import { useDatabaseStore, useUIStore } from './store'
import { DatabaseService } from './lib/database/DatabaseService'
import { FrequenciesPage } from './pages/FrequenciesPage'
import { TrunkedSystemsPage } from './pages/TrunkedSystemsPage'
import { ExportProfilesPage } from './pages/ExportProfilesPage'
import { SettingsPage } from './pages/SettingsPage'
import { Dashboard } from './pages/Dashboard'

// Note: We'd need to refactor page components to use default exports for lazy loading
// For now, we'll use direct imports

function App() {
  const { activeTab } = useUIStore()
  const { initialize: initializeDatabase } = useDatabaseStore()

  useEffect(() => {
    const init = async () => {
      const dbService = DatabaseService.getInstance()
      await dbService.initialize()
      await initializeDatabase(dbService)
    }

    init()
  }, [initializeDatabase])

  const renderPage = () => {
    switch (activeTab) {
      case 'frequencies':
        return <FrequenciesPage />
      case 'trunked':
        return <TrunkedSystemsPage />
      case 'export':
        return <ExportProfilesPage />
      case 'settings':
        return <SettingsPage />
      case 'dashboard':
        return <Dashboard />
      default:
        return <Dashboard />
    }
  }

  return (
    <MainLayout>
      {renderPage()}
    </MainLayout>
  )
}

export default App 
