import { useMemo, useState } from 'react'
import type { NostrKeys } from '@/types'
import Button from '../ui/Button'
import Input from '../ui/Input'
import Modal from '../ui/Modal'

interface KeyPanelProps {
  isOpen: boolean
  onClose: () => void
  keys: NostrKeys | null
  saveToStorage: boolean
  isLoading?: boolean
  onGenerateNewKeys: () => void
  onImportFromNsec: (nsec: string) => { success: boolean; error?: string }
  onToggleStorage: () => void
  onClearKeys: () => void
  onOpenImportModal?: () => void
  onToast?: (message: string, type: 'success' | 'error' | 'info') => void
}

function maskedNsec(nsec: string): string {
  return `${nsec.slice(0, 6)}${'*'.repeat(Math.max(8, nsec.length - 10))}${nsec.slice(-4)}`
}

export default function KeyPanel({
  isOpen,
  onClose,
  keys,
  saveToStorage,
  isLoading = false,
  onGenerateNewKeys,
  onImportFromNsec,
  onToggleStorage,
  onClearKeys,
  onOpenImportModal,
  onToast,
}: KeyPanelProps) {
  const [showPrivate, setShowPrivate] = useState(false)
  const [importValue, setImportValue] = useState('')
  const [importError, setImportError] = useState('')
  const [isConfirmGenerateOpen, setConfirmGenerateOpen] = useState(false)

  const npub = keys?.npub ?? 'No key loaded'
  const nsec = keys?.nsec ?? ''

  const nsecFieldValue = useMemo(() => {
    if (!nsec) {
      return ''
    }

    return showPrivate ? nsec : maskedNsec(nsec)
  }, [nsec, showPrivate])

  const copyToClipboard = async (value: string) => {
    if (!value) {
      onToast?.('No key to copy', 'error')
      return
    }

    try {
      await navigator.clipboard.writeText(value)
      onToast?.('Copied!', 'success')
    } catch {
      onToast?.('Copy failed', 'error')
    }
  }

  const handleImport = () => {
    const result = onImportFromNsec(importValue)
    if (result.success) {
      setImportValue('')
      setImportError('')
      onToast?.('Key imported', 'success')
      return
    }

    setImportError(result.error || 'Import failed.')
  }

  const handleGenerate = () => {
    onGenerateNewKeys()
    setConfirmGenerateOpen(false)
    onToast?.('New key generated', 'success')
  }

  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose} title="Key Management" size="md">
        <div className="space-y-5">
          <section>
            <p className="mb-2 text-sm font-semibold text-text-primary">My Public Key (npub)</p>
            <div className="flex items-center gap-2">
              <div className="flex-1 rounded-xl border border-border bg-bg-sidebar px-3 py-2 text-sm text-text-primary">
                <p className="truncate">{isLoading ? 'Loading keys...' : npub}</p>
              </div>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  void copyToClipboard(npub)
                }}
                disabled={!keys}
              >
                Copy
              </Button>
            </div>
          </section>

          <section>
            <p className="mb-2 text-sm font-semibold text-text-primary">Private Key (nsec)</p>
            <div className="flex items-center gap-2">
              <input
                type={showPrivate ? 'text' : 'password'}
                value={nsecFieldValue}
                readOnly
                placeholder="No private key"
                className="flex-1 rounded-xl border border-border bg-bg-sidebar px-3 py-2 text-sm text-text-primary focus:outline-none"
              />
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setShowPrivate((prev) => !prev)}
                disabled={!keys}
              >
                {showPrivate ? 'Hide' : 'Show'}
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  void copyToClipboard(nsec)
                }}
                disabled={!keys}
              >
                Copy
              </Button>
            </div>
          </section>

          <section>
            <p className="mb-2 text-sm font-semibold text-text-primary">Generate New Key</p>
            <Button
              variant="danger"
              size="md"
              onClick={() => setConfirmGenerateOpen(true)}
              className="w-full"
            >
              Generate New Key
            </Button>
            <p className="mt-2 text-xs text-red-500">This will delete your current key</p>
          </section>

          <section>
            <p className="mb-2 text-sm font-semibold text-text-primary">Import Key</p>
            <div className="flex items-end gap-2">
              <Input
                value={importValue}
                onChange={(value) => {
                  setImportValue(value)
                  if (importError) {
                    setImportError('')
                  }
                }}
                placeholder="nsec1..."
                error={undefined}
              />
              <Button variant="primary" size="md" onClick={handleImport} disabled={!importValue.trim()}>
                Import
              </Button>
            </div>
            <div className="mt-1 min-h-5 text-xs text-red-500">{importError}</div>
            {onOpenImportModal ? (
              <Button variant="ghost" size="sm" onClick={onOpenImportModal}>
                Open Separate Import Modal
              </Button>
            ) : null}
          </section>

          <section className="rounded-xl border border-border bg-bg-sidebar p-3">
            <p className="text-sm font-semibold text-text-primary">Storage Setting</p>
            <div className="mt-2 flex items-center justify-between gap-3">
              <span className="text-sm text-text-primary">Save key in browser</span>
              <button
                type="button"
                onClick={onToggleStorage}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${saveToStorage ? 'bg-naier-blue' : 'bg-zinc-400'}`}
                aria-label="Toggle key storage"
              >
                <span
                  className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${saveToStorage ? 'translate-x-5' : 'translate-x-1'}`}
                />
              </button>
            </div>
            <p className="mt-2 text-xs text-text-secondary">
              Saving keys in browser may be vulnerable to XSS attacks
            </p>
            <div className="mt-3 flex justify-end">
              <Button variant="ghost" size="sm" onClick={onClearKeys} disabled={!keys}>
                Clear Current Key
              </Button>
            </div>
          </section>
        </div>
      </Modal>

      <Modal
        isOpen={isConfirmGenerateOpen}
        onClose={() => setConfirmGenerateOpen(false)}
        title="Confirm Key Generation"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-sm text-text-primary">Are you sure you want to generate a new key?</p>
          <p className="text-sm text-text-secondary">
            If you haven't backed up your private key, you will lose access to your messages.
          </p>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" size="md" onClick={() => setConfirmGenerateOpen(false)}>
              Cancel
            </Button>
            <Button variant="danger" size="md" onClick={handleGenerate}>
              Generate
            </Button>
          </div>
        </div>
      </Modal>
    </>
  )
}

