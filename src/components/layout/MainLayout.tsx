import { ReactNode } from 'react'
import { useUIStore } from '../../store'
import { Button } from '../ui/button'
import { Moon, Sun, Menu, Radio, Antenna, FileDown, Settings } from 'lucide-react'

interface MainLayoutProps {
  children: ReactNode
}

export function MainLayout({ children }: MainLayoutProps) {
  const { darkMode, toggleDarkMode, sidebarOpen, toggleSidebar, activeTab, setActiveTab } = useUIStore()

  return (
    <div className={`min-h-screen ${darkMode ? 'dark' : ''}`}>
      <div className="flex h-screen bg-background">
        {/* Sidebar */}
        <aside className={`fixed inset-y-0 left-0 z-50 w-64 transform bg-sidebar transition-transform duration-200 ease-in-out ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}>
          <div className="flex h-16 items-center justify-between px-4">
            <h1 className="text-xl font-bold">Frequency Omnibus</h1>
            <Button variant="ghost" size="icon" onClick={toggleSidebar}>
              <Menu className="h-5 w-5" />
            </Button>
          </div>
          <nav className="space-y-1 px-2">
            <Button
              variant={activeTab === 'frequencies' ? 'default' : 'ghost'}
              className="w-full justify-start"
              onClick={() => setActiveTab('frequencies')}
            >
              <Radio className="mr-2 h-5 w-5" />
              Conventional
            </Button>
            <Button
              variant={activeTab === 'trunked' ? 'default' : 'ghost'}
              className="w-full justify-start"
              onClick={() => setActiveTab('trunked')}
            >
              <Antenna className="mr-2 h-5 w-5" />
              Trunked Systems
            </Button>
            <Button
              variant={activeTab === 'export' ? 'default' : 'ghost'}
              className="w-full justify-start"
              onClick={() => setActiveTab('export')}
            >
              <FileDown className="mr-2 h-5 w-5" />
              Export Profiles
            </Button>
            <Button
              variant={activeTab === 'settings' ? 'default' : 'ghost'}
              className="w-full justify-start"
              onClick={() => setActiveTab('settings')}
            >
              <Settings className="mr-2 h-5 w-5" />
              Settings
            </Button>
          </nav>
        </aside>

        {/* Main content */}
        <main className="flex-1 overflow-auto">
          {/* Header */}
          <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b bg-background px-4">
            <Button variant="ghost" size="icon" onClick={toggleSidebar}>
              <Menu className="h-5 w-5" />
            </Button>
            <div className="flex items-center space-x-4">
              <Button variant="ghost" size="icon" onClick={toggleDarkMode}>
                {darkMode ? (
                  <Sun className="h-5 w-5" />
                ) : (
                  <Moon className="h-5 w-5" />
                )}
              </Button>
            </div>
          </header>

          {/* Page content */}
          <div className="container mx-auto p-4">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
} 
