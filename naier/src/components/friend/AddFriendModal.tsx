import { useCallback, useEffect, useRef, useState } from 'react'
import jsQR from 'jsqr'
import { QRCodeSVG } from 'qrcode.react'
import Button from '../ui/Button'
import Input from '../ui/Input'
import Modal from '../ui/Modal'

interface AddFriendModalProps {
  isOpen: boolean
  onClose: () => void
  myNpub: string
  inviteLink: string
  hasKeys: boolean
  addFriend: (input: string) => Promise<{ success: boolean; error?: string }>
  onToast?: (message: string, type: 'success' | 'error' | 'info') => void
}

export default function AddFriendModal({
  isOpen,
  onClose,
  myNpub,
  inviteLink,
  hasKeys,
  addFriend,
  onToast,
}: AddFriendModalProps) {
  const [directInput, setDirectInput] = useState('')
  const [pendingAdd, setPendingAdd] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [scanning, setScanning] = useState(false)

  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const scanFrameRef = useRef<number | null>(null)
  const scanningRef = useRef(false)
  const inviteHandledRef = useRef(false)

  const showToast = useCallback(
    (message: string, type: 'success' | 'error' | 'info') => {
      onToast?.(message, type)
    },
    [onToast],
  )

  const stopCamera = useCallback(() => {
    scanningRef.current = false
    setScanning(false)

    if (scanFrameRef.current) {
      window.cancelAnimationFrame(scanFrameRef.current)
      scanFrameRef.current = null
    }

    const stream = videoRef.current?.srcObject
    if (stream instanceof MediaStream) {
      stream.getTracks().forEach((track) => track.stop())
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null
    }
  }, [])

  const handleQRResult = useCallback(
    (data: string) => {
      const value = data.trim()
      const isNpub = value.startsWith('npub1')
      const isHex = /^[0-9a-f]{64}$/i.test(value)

      if (!isNpub && !isHex) {
        showToast('Not a valid Nostr public key', 'error')
        return
      }

      setPendingAdd(value)
    },
    [showToast],
  )

  const scanFrame = useCallback(() => {
    if (!scanningRef.current) {
      return
    }

    const canvas = canvasRef.current
    const video = videoRef.current

    if (!canvas || !video || video.readyState < 2 || video.videoWidth === 0 || video.videoHeight === 0) {
      scanFrameRef.current = window.requestAnimationFrame(scanFrame)
      return
    }

    const ctx = canvas.getContext('2d')
    if (!ctx) {
      scanFrameRef.current = window.requestAnimationFrame(scanFrame)
      return
    }

    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    ctx.drawImage(video, 0, 0)

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
    const code = jsQR(imageData.data, imageData.width, imageData.height)

    if (code?.data) {
      stopCamera()
      handleQRResult(code.data)
      return
    }

    scanFrameRef.current = window.requestAnimationFrame(scanFrame)
  }, [handleQRResult, stopCamera])

  const startCamera = useCallback(async () => {
    if (!hasKeys) {
      showToast('Generate or import your key first', 'error')
      return
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
      })

      if (!videoRef.current) {
        stream.getTracks().forEach((track) => track.stop())
        throw new Error('Camera not ready')
      }

      videoRef.current.srcObject = stream
      await videoRef.current.play()

      scanningRef.current = true
      setScanning(true)
      scanFrameRef.current = window.requestAnimationFrame(scanFrame)
    } catch {
      showToast('Failed to start camera', 'error')
      stopCamera()
    }
  }, [hasKeys, scanFrame, showToast, stopCamera])

  const handleImageUpload = useCallback(
    (file: File) => {
      const reader = new FileReader()
      reader.onload = (event) => {
        const img = new Image()
        img.onload = () => {
          const canvas = document.createElement('canvas')
          canvas.width = img.width
          canvas.height = img.height

          const ctx = canvas.getContext('2d')
          if (!ctx) {
            showToast('Could not read image', 'error')
            return
          }

          ctx.drawImage(img, 0, 0)
          const imageData = ctx.getImageData(0, 0, img.width, img.height)
          const code = jsQR(imageData.data, imageData.width, imageData.height)

          if (code?.data) {
            handleQRResult(code.data)
          } else {
            showToast('Could not detect a QR code', 'error')
          }
        }

        img.src = event.target?.result as string
      }

      reader.readAsDataURL(file)
    },
    [handleQRResult, showToast],
  )

  const submitAdd = useCallback(
    async (value: string, closeAfter = false) => {
      const input = value.trim()
      if (!input) {
        return
      }

      setIsSubmitting(true)
      let result: { success: boolean; error?: string }
      try {
        result = await addFriend(input)
      } catch {
        result = { success: false, error: 'Failed to add friend' }
      } finally {
        setIsSubmitting(false)
      }

      if (!result.success) {
        showToast(result.error || 'Failed to add friend', 'error')
        return
      }

      setDirectInput('')
      setPendingAdd(null)
      showToast('Friend added', 'success')

      if (closeAfter) {
        onClose()
      }
    },
    [addFriend, onClose, showToast],
  )

  const canShare = myNpub.startsWith('npub1')

  const copyText = useCallback(
    async (value: string, label: string) => {
      if (!value) {
        showToast(`No ${label.toLowerCase()} available`, 'error')
        return
      }

      try {
        await navigator.clipboard.writeText(value)
        showToast(`${label} copied`, 'success')
      } catch {
        showToast(`Failed to copy ${label.toLowerCase()}`, 'error')
      }
    },
    [showToast],
  )

  useEffect(() => {
    const path = window.location.pathname
    const match = path.match(/\/add\/(npub1[a-zA-Z0-9]+)/)
    if (!match || inviteHandledRef.current) {
      return
    }

    inviteHandledRef.current = true

    void addFriend(match[1])
      .then((result) => {
        if (result.success) {
          showToast('Friend added from invite link', 'success')
        } else {
          showToast(result.error || 'Failed to add friend from invite link', 'error')
        }
      })
      .catch(() => {
        showToast('Failed to add friend from invite link', 'error')
      })
      .finally(() => {
        window.history.replaceState({}, '', '/')
      })
  }, [addFriend, showToast])

  useEffect(() => {
    if (!isOpen) {
      stopCamera()
      setPendingAdd(null)
    }
  }, [isOpen, stopCamera])

  useEffect(() => () => stopCamera(), [stopCamera])

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add Friend" size="md">
      <div className="space-y-5">
        <section className="rounded-xl border border-border bg-bg-sidebar p-4">
          <p className="mb-3 text-sm font-semibold text-text-primary">My QR Code</p>
          <div className="flex justify-center rounded-xl border border-border bg-bg-primary p-4">
            <QRCodeSVG value={canShare ? myNpub : 'naier'} size={180} level="M" includeMargin />
          </div>

          <div className="mt-3 space-y-2">
            <div className="flex items-center justify-between gap-2 rounded-lg border border-border bg-bg-primary px-3 py-2">
              <span className="truncate text-xs text-text-secondary">{canShare ? myNpub : 'No key loaded'}</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => copyText(canShare ? myNpub : '', 'npub')}
                disabled={!canShare}
              >
                Copy
              </Button>
            </div>
            <div className="flex items-center justify-between gap-2 rounded-lg border border-border bg-bg-primary px-3 py-2">
              <span className="truncate text-xs text-text-secondary">{inviteLink || 'No invite link available'}</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => copyText(inviteLink, 'Invite link')}
                disabled={!inviteLink}
              >
                Copy
              </Button>
            </div>
          </div>
        </section>

        {pendingAdd ? (
          <section className="space-y-3 rounded-xl border border-border bg-bg-sidebar p-4">
            <p className="text-sm font-semibold text-text-primary">Add this friend?</p>
            <p className="break-all text-xs text-text-secondary">{pendingAdd}</p>
            <div className="flex gap-2">
              <Button
                variant="primary"
                size="md"
                onClick={() => void submitAdd(pendingAdd, true)}
                isLoading={isSubmitting}
              >
                Confirm
              </Button>
              <Button variant="secondary" size="md" onClick={() => setPendingAdd(null)} disabled={isSubmitting}>
                Cancel
              </Button>
            </div>
          </section>
        ) : null}

        <div className="flex items-center gap-3 text-xs text-text-secondary">
          <span className="h-px flex-1 bg-border" />
          <span>or</span>
          <span className="h-px flex-1 bg-border" />
        </div>

        <section className="space-y-3 rounded-xl border border-border bg-bg-sidebar p-4">
          <p className="text-sm font-semibold text-text-primary">QR Scan</p>

          {scanning ? (
            <div className="space-y-2">
              <video ref={videoRef} className="w-full rounded-lg border border-border" playsInline muted />
              <canvas ref={canvasRef} className="hidden" />
              <Button variant="secondary" size="md" onClick={stopCamera}>
                Stop Camera
              </Button>
            </div>
          ) : (
            <div className="grid gap-2 sm:grid-cols-2">
              <Button variant="secondary" size="md" onClick={() => void startCamera()}>
                Scan with Camera
              </Button>
              <Button
                variant="secondary"
                size="md"
                onClick={() => fileInputRef.current?.click()}
                disabled={!hasKeys}
              >
                Upload Image
              </Button>
            </div>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(event) => {
              const file = event.target.files?.[0]
              if (file) {
                handleImageUpload(file)
              }
              event.target.value = ''
            }}
          />
        </section>

        <section className="space-y-2">
          <p className="text-sm font-semibold text-text-primary">Direct Input</p>
          <div className="flex items-end gap-2">
            <Input
              value={directInput}
              onChange={setDirectInput}
              placeholder="Enter npub or hex"
            />
            <Button
              variant="primary"
              size="md"
              onClick={() => void submitAdd(directInput, true)}
              disabled={!directInput.trim() || !hasKeys}
              isLoading={isSubmitting}
            >
              Add
            </Button>
          </div>
        </section>
      </div>
    </Modal>
  )
}
