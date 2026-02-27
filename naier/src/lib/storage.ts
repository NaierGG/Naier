import { STORAGE_KEYS } from '@/constants/relays'

type StorageKey = (typeof STORAGE_KEYS)[keyof typeof STORAGE_KEYS] | string

export const storage = {
  get: (key: StorageKey): string | null => {
    try {
      return localStorage.getItem(key)
    } catch {
      return null
    }
  },
  set: (key: StorageKey, value: string): void => {
    try {
      localStorage.setItem(key, value)
    } catch {
      // eslint-disable-next-line no-console
      console.error('localStorage save failed')
    }
  },
  remove: (key: StorageKey): void => {
    try {
      localStorage.removeItem(key)
    } catch {
      // no-op
    }
  },
}
