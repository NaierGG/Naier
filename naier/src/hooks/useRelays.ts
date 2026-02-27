import { useCallback, useEffect, useMemo, useState } from 'react'
import type { SimplePool } from 'nostr-tools'
import { DEFAULT_RELAYS, STORAGE_KEYS } from '@/constants/relays'
import { storage } from '@/lib/storage'
import type { RelayStatus } from '@/types'

interface UseRelaysParams {
  pool: SimplePool
}

export interface UseRelaysReturn {
  relays: string[]
  statuses: RelayStatus[]
  addRelay: (url: string) => void
  removeRelay: (url: string) => void
  resetToDefault: () => void
}

function normalizeRelayUrl(url: string): string {
  return url.trim().replace(/\/+$/, '')
}

function isValidRelayUrl(url: string): boolean {
  if (!url.startsWith('wss://')) {
    return false
  }

  try {
    const parsed = new URL(url)
    return parsed.protocol === 'wss:'
  } catch {
    return false
  }
}

function parseStoredRelays(raw: string | null): string[] {
  if (!raw) {
    return DEFAULT_RELAYS
  }

  try {
    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed)) {
      return DEFAULT_RELAYS
    }

    const normalized = Array.from(
      new Set(
        parsed
          .filter((relay): relay is string => typeof relay === 'string')
          .map((relay) => normalizeRelayUrl(relay))
          .filter((relay) => isValidRelayUrl(relay)),
      ),
    )

    return normalized.length ? normalized : DEFAULT_RELAYS
  } catch {
    return DEFAULT_RELAYS
  }
}

function upsertStatus(statuses: RelayStatus[], next: RelayStatus): RelayStatus[] {
  const found = statuses.some((status) => status.url === next.url)
  if (!found) {
    return [...statuses, next]
  }

  return statuses.map((status) => (status.url === next.url ? next : status))
}

export default function useRelays({ pool }: UseRelaysParams): UseRelaysReturn {
  const [relays, setRelays] = useState<string[]>(() => parseStoredRelays(storage.get(STORAGE_KEYS.RELAYS)))
  const [statuses, setStatuses] = useState<RelayStatus[]>(() =>
    parseStoredRelays(storage.get(STORAGE_KEYS.RELAYS)).map((url) => ({
      url,
      status: 'connecting',
    })),
  )

  useEffect(() => {
    storage.set(STORAGE_KEYS.RELAYS, JSON.stringify(relays))
  }, [relays])

  useEffect(() => {
    let disposed = false

    setStatuses(relays.map((url) => ({ url, status: 'connecting' })))

    relays.forEach((url) => {
      void pool
        .ensureRelay(url)
        .then(() => {
          if (disposed) {
            return
          }

          const isConnected = pool.listConnectionStatus().get(url) ?? false
          setStatuses((prev) =>
            upsertStatus(prev, {
              url,
              status: isConnected ? 'connected' : 'connecting',
            }),
          )
        })
        .catch(() => {
          if (disposed) {
            return
          }

          setStatuses((prev) =>
            upsertStatus(prev, {
              url,
              status: 'disconnected',
            }),
          )
        })
    })

    const interval = window.setInterval(() => {
      if (disposed) {
        return
      }

      const connectionMap = pool.listConnectionStatus()
      setStatuses(
        relays.map((url) => ({
          url,
          status: connectionMap.get(url) ? 'connected' : 'disconnected',
        })),
      )
    }, 5000)

    return () => {
      disposed = true
      window.clearInterval(interval)
    }
  }, [pool, relays])

  const addRelay = useCallback((url: string) => {
    const normalized = normalizeRelayUrl(url)
    if (!isValidRelayUrl(normalized)) {
      throw new Error('Relay URL must start with wss://')
    }

    setRelays((prev) => {
      if (prev.includes(normalized)) {
        return prev
      }
      return [...prev, normalized]
    })
  }, [])

  const removeRelay = useCallback(
    (url: string) => {
      const normalized = normalizeRelayUrl(url)
      if (relays.length <= 1) {
        throw new Error('At least one relay is required')
      }

      const next = relays.filter((relay) => relay !== normalized)
      if (!next.length) {
        throw new Error('At least one relay is required')
      }

      pool.close([normalized])
      setRelays(next)
    },
    [pool, relays],
  )

  const resetToDefault = useCallback(() => {
    setRelays(DEFAULT_RELAYS)
  }, [])

  const value = useMemo<UseRelaysReturn>(
    () => ({
      relays,
      statuses,
      addRelay,
      removeRelay,
      resetToDefault,
    }),
    [addRelay, relays, removeRelay, resetToDefault, statuses],
  )

  return value
}
