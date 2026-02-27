import { useEffect, useMemo, useState } from 'react'
import Button from '../ui/Button'
import Input from '../ui/Input'
import Modal from '../ui/Modal'

interface KeyImportModalProps {
  isOpen: boolean
  onClose: () => void
  onImportFromNsec: (nsec: string) => { success: boolean; error?: string }
  onToast?: (message: string, type: 'success' | 'error' | 'info') => void
}

export default function KeyImportModal({
  isOpen,
  onClose,
  onImportFromNsec,
  onToast,
}: KeyImportModalProps) {
  const [nsec, setNsec] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    if (!isOpen) {
      setNsec('')
      setError('')
    }
  }, [isOpen])

  const realtimeError = useMemo(() => {
    if (!nsec) {
      return ''
    }

    if (!nsec.startsWith('nsec1')) {
      return 'nsec should start with nsec1'
    }

    return ''
  }, [nsec])

  const handleImport = () => {
    if (realtimeError) {
      setError(realtimeError)
      return
    }

    const result = onImportFromNsec(nsec)
    if (result.success) {
      onToast?.('Key imported', 'success')
      onClose()
      return
    }

    setError(result.error || 'Import failed.')
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Import nsec" size="sm">
      <div className="space-y-4">
        <Input
          label="nsec"
          type="password"
          value={nsec}
          onChange={(value) => {
            setNsec(value)
            setError('')
          }}
          placeholder="nsec1..."
          error={error || realtimeError}
        />
        <div className="flex justify-end gap-2">
          <Button variant="ghost" size="md" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="primary"
            size="md"
            disabled={!nsec.trim() || Boolean(realtimeError)}
            onClick={handleImport}
          >
            Import
          </Button>
        </div>
      </div>
    </Modal>
  )
}
