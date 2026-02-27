import { useState } from 'react'
import type { RelayStatus } from '@/types'
import Button from '../ui/Button'
import Modal from '../ui/Modal'

interface RelayPanelProps {
  isOpen: boolean
  onClose: () => void
  statuses: RelayStatus[]
  addRelay: (url: string) => void
  removeRelay: (url: string) => void
  resetToDefault: () => void
  onToast?: (message: string, type: 'success' | 'error' | 'info') => void
}

const statusStyles: Record<RelayStatus['status'], string> = {
  connected: 'bg-emerald-500',
  connecting: 'bg-yellow-500',
  disconnected: 'bg-red-500',
  error: 'bg-red-500',
}

export default function RelayPanel({
  isOpen,
  onClose,
  statuses,
  addRelay,
  removeRelay,
  resetToDefault,
  onToast,
}: RelayPanelProps) {
  const [newRelayUrl, setNewRelayUrl] = useState('')

  const handleAddRelay = () => {
    try {
      addRelay(newRelayUrl)
      setNewRelayUrl('')
      onToast?.('Relay added', 'success')
    } catch (error) {
      onToast?.(error instanceof Error ? error.message : 'Failed to add relay', 'error')
    }
  }

  const handleRemoveRelay = (url: string) => {
    try {
      removeRelay(url)
      onToast?.('Relay removed', 'success')
    } catch (error) {
      onToast?.(error instanceof Error ? error.message : 'Failed to remove relay', 'error')
    }
  }

  const handleReset = () => {
    resetToDefault()
    onToast?.('Reset to default relays', 'info')
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Relay Settings" size="md">
      <div className="space-y-4">
        <section className="space-y-2">
          {statuses.map((relay) => (
            <div
              key={relay.url}
              className="flex items-center gap-2 rounded-xl border border-border bg-bg-sidebar px-3 py-2"
            >
              <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${statusStyles[relay.status]}`} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm text-text-primary">{relay.url}</p>
                <p className="text-xs capitalize text-text-secondary">{relay.status}</p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleRemoveRelay(relay.url)}
                disabled={statuses.length <= 1}
              >
                Remove
              </Button>
            </div>
          ))}
        </section>

        <section className="flex items-end gap-2">
          <div className="flex-1">
            <label className="mb-1.5 block text-sm font-medium text-text-primary">Add Relay</label>
            <input
              type="text"
              value={newRelayUrl}
              onChange={(event) => setNewRelayUrl(event.target.value)}
              placeholder="wss://new-relay-url"
              className="w-full rounded-xl border border-border bg-white/90 px-3 py-2.5 text-sm text-text-primary placeholder:text-text-secondary/80 focus:outline-none focus:ring-2 focus:ring-naier-blue/40 dark:bg-zinc-800"
            />
          </div>
          <Button variant="primary" size="md" onClick={handleAddRelay} disabled={!newRelayUrl.trim()}>
            +
          </Button>
        </section>

        <Button variant="secondary" size="md" className="w-full" onClick={handleReset}>
          Reset to Default Relays
        </Button>
      </div>
    </Modal>
  )
}
