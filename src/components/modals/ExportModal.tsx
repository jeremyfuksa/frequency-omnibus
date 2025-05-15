import { ExportDialog } from '../export/ExportDialog'
import { Frequency, TrunkedSystem } from '../../types/models'

interface ExportModalProps {
  frequencies: Frequency[]
  trunkedSystems: TrunkedSystem[]
  onClose: () => void
}

export function ExportModal({ frequencies, trunkedSystems, onClose }: ExportModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-lg rounded-lg bg-background p-6">
        <ExportDialog
          frequencies={frequencies}
          trunkedSystems={trunkedSystems}
          onClose={onClose}
        />
      </div>
    </div>
  )
} 
