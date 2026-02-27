import { useEffect, useMemo, useState } from 'react'
import type { Profile } from '@/types'
import Avatar from './Avatar'
import Button from '../ui/Button'
import Input from '../ui/Input'
import Modal from '../ui/Modal'

interface ProfilePanelProps {
  isOpen: boolean
  onClose: () => void
  hasKeys: boolean
  myProfile: Profile | null
  updateMyProfile: (name: string, picture?: string) => Promise<void>
  onToast?: (message: string, type: 'success' | 'error' | 'info') => void
}

export default function ProfilePanel({
  isOpen,
  onClose,
  hasKeys,
  myProfile,
  updateMyProfile,
  onToast,
}: ProfilePanelProps) {
  const [name, setName] = useState('')
  const [picture, setPicture] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    if (!isOpen) {
      return
    }

    setName(myProfile?.name || '')
    setPicture(myProfile?.picture || '')
  }, [isOpen, myProfile?.name, myProfile?.picture])

  const previewName = useMemo(() => name.trim() || 'Me', [name])
  const previewPicture = useMemo(() => picture.trim() || undefined, [picture])

  const handleSave = async () => {
    if (!hasKeys) {
      onToast?.('Generate or import your key first', 'error')
      return
    }

    if (!name.trim()) {
      onToast?.('Nickname is required', 'error')
      return
    }

    setIsSaving(true)
    try {
      await updateMyProfile(name, picture || undefined)
      onToast?.('Profile updated', 'success')
      onClose()
    } catch {
      onToast?.('Failed to update profile', 'error')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Profile Settings" size="md">
      <div className="space-y-4">
        <section className="rounded-xl border border-border bg-bg-sidebar p-4">
          <p className="mb-3 text-sm font-semibold text-text-primary">Preview</p>
          <div className="flex items-center gap-3">
            <Avatar src={previewPicture} name={previewName} size="lg" />
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-text-primary">{previewName}</p>
              <p className="truncate text-xs text-text-secondary">{myProfile?.pubkey || 'No key loaded'}</p>
            </div>
          </div>
        </section>

        <Input label="Nickname" value={name} onChange={setName} placeholder="Name" />

        <Input
          label="Profile image URL"
          type="url"
          value={picture}
          onChange={setPicture}
          placeholder="https://..."
        />

        <div className="flex justify-end">
          <Button variant="primary" size="md" onClick={() => void handleSave()} isLoading={isSaving}>
            Save
          </Button>
        </div>
      </div>
    </Modal>
  )
}
