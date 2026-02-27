import { useCallback, useEffect, useState } from 'react'
import { generateSecretKey, getPublicKey, nip19 } from 'nostr-tools'
import { STORAGE_KEYS } from '@/constants/relays'
import { storage } from '@/lib/storage'
import type { NostrKeys } from '@/types'

interface KeyState {
  keys: NostrKeys | null
  saveToStorage: boolean
  isLoading: boolean
}

interface UseKeysReturn {
  keys: NostrKeys | null
  saveToStorage: boolean
  isLoading: boolean
  generateNewKeys: () => void
  importFromNsec: (nsec: string) => { success: boolean; error?: string }
  exportNsec: () => string | null
  toggleStorage: () => void
  clearKeys: () => void
}

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

function hexToBytes(hex: string): Uint8Array {
  if (!/^[0-9a-fA-F]+$/.test(hex) || hex.length % 2 !== 0) {
    throw new Error('Invalid private key hex')
  }

  const bytes = new Uint8Array(hex.length / 2)
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.slice(i, i + 2), 16)
  }
  return bytes
}

function createNostrKeys(secretKey: Uint8Array): NostrKeys {
  const privateKeyHex = bytesToHex(secretKey)
  const publicKey = getPublicKey(secretKey)

  return {
    privateKey: secretKey,
    privateKeyHex,
    publicKey,
    nsec: nip19.nsecEncode(secretKey),
    npub: nip19.npubEncode(publicKey),
  }
}

export default function useKeys(): UseKeysReturn {
  const [state, setState] = useState<KeyState>({
    keys: null,
    saveToStorage: false,
    isLoading: true,
  })

  useEffect(() => {
    const savedPrivateKeyHex = storage.get(STORAGE_KEYS.PRIVATE_KEY)
    const savedPreference = storage.get(STORAGE_KEYS.SAVE_TO_STORAGE)
    const shouldSave = savedPreference === 'true' || (savedPreference === null && Boolean(savedPrivateKeyHex))

    let loadedKeys: NostrKeys | null = null
    if (savedPrivateKeyHex) {
      try {
        loadedKeys = createNostrKeys(hexToBytes(savedPrivateKeyHex))
      } catch {
        storage.remove(STORAGE_KEYS.PRIVATE_KEY)
      }
    }

    setState({
      keys: loadedKeys,
      saveToStorage: shouldSave,
      isLoading: false,
    })
  }, [])

  const generateNewKeys = useCallback(() => {
    const secretKey = generateSecretKey()
    const nextKeys = createNostrKeys(secretKey)

    setState((prev) => {
      if (prev.saveToStorage) {
        storage.set(STORAGE_KEYS.PRIVATE_KEY, nextKeys.privateKeyHex)
      } else {
        storage.remove(STORAGE_KEYS.PRIVATE_KEY)
      }

      return {
        ...prev,
        keys: nextKeys,
      }
    })
  }, [])

  const importFromNsec = useCallback(
    (nsec: string): { success: boolean; error?: string } => {
      const normalizedNsec = nsec.trim()

      if (!normalizedNsec) {
        return { success: false, error: 'Please enter an nsec key.' }
      }

      try {
        const decoded = nip19.decode(normalizedNsec)

        if (decoded.type !== 'nsec') {
          return { success: false, error: 'Invalid nsec key format.' }
        }

        if (!(decoded.data instanceof Uint8Array)) {
          return { success: false, error: 'Invalid nsec key data.' }
        }

        const nextKeys = createNostrKeys(decoded.data)

        setState((prev) => {
          if (prev.saveToStorage) {
            storage.set(STORAGE_KEYS.PRIVATE_KEY, nextKeys.privateKeyHex)
          } else {
            storage.remove(STORAGE_KEYS.PRIVATE_KEY)
          }

          return {
            ...prev,
            keys: nextKeys,
          }
        })

        return { success: true }
      } catch {
        return { success: false, error: 'Invalid nsec key.' }
      }
    },
    [],
  )

  const exportNsec = useCallback((): string | null => {
    return state.keys?.nsec ?? null
  }, [state.keys])

  const toggleStorage = useCallback(() => {
    setState((prev) => {
      const nextSaveToStorage = !prev.saveToStorage
      storage.set(STORAGE_KEYS.SAVE_TO_STORAGE, nextSaveToStorage ? 'true' : 'false')

      if (nextSaveToStorage) {
        if (prev.keys) {
          storage.set(STORAGE_KEYS.PRIVATE_KEY, prev.keys.privateKeyHex)
        }
      } else {
        storage.remove(STORAGE_KEYS.PRIVATE_KEY)
      }

      return {
        ...prev,
        saveToStorage: nextSaveToStorage,
      }
    })
  }, [])

  const clearKeys = useCallback(() => {
    storage.remove(STORAGE_KEYS.PRIVATE_KEY)
    setState((prev) => ({
      ...prev,
      keys: null,
    }))
  }, [])

  return {
    keys: state.keys,
    saveToStorage: state.saveToStorage,
    isLoading: state.isLoading,
    generateNewKeys,
    importFromNsec,
    exportNsec,
    toggleStorage,
    clearKeys,
  }
}
