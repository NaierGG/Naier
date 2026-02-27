import { useCallback, useEffect, useRef, useState } from 'react'
import { finalizeEvent, type SimplePool } from 'nostr-tools'
import { STORAGE_KEYS } from '@/constants/relays'
import { storage } from '@/lib/storage'
import type { NostrKeys, Profile } from '@/types'

interface UseProfileParams {
  pool: SimplePool
  relays: string[]
  keys: NostrKeys | null
}

export interface UseProfileReturn {
  myProfile: Profile | null
  getProfile: (pubkey: string) => Promise<Profile | null>
  updateMyProfile: (name: string, picture?: string) => Promise<void>
  profileCache: Map<string, Profile>
}

function normalizeProfile(pubkey: string, content: string): Profile | null {
  try {
    const parsed = JSON.parse(content) as Record<string, unknown>
    return {
      pubkey,
      name: typeof parsed.name === 'string' ? parsed.name : undefined,
      picture: typeof parsed.picture === 'string' ? parsed.picture : undefined,
      about: typeof parsed.about === 'string' ? parsed.about : undefined,
    }
  } catch {
    return null
  }
}

function parseStoredProfile(raw: string | null): Profile | null {
  if (!raw) {
    return null
  }

  try {
    const parsed = JSON.parse(raw) as Record<string, unknown>
    if (typeof parsed.pubkey !== 'string') {
      return null
    }

    return {
      pubkey: parsed.pubkey,
      name: typeof parsed.name === 'string' ? parsed.name : undefined,
      picture: typeof parsed.picture === 'string' ? parsed.picture : undefined,
      about: typeof parsed.about === 'string' ? parsed.about : undefined,
    }
  } catch {
    return null
  }
}

export default function useProfile({ pool, relays, keys }: UseProfileParams): UseProfileReturn {
  const profileCacheRef = useRef<Map<string, Profile>>(new Map())
  const [myProfile, setMyProfile] = useState<Profile | null>(null)

  useEffect(() => {
    const stored = parseStoredProfile(storage.get(STORAGE_KEYS.PROFILE))
    if (!stored) {
      return
    }

    profileCacheRef.current.set(stored.pubkey, stored)

    if (keys?.publicKey === stored.pubkey) {
      setMyProfile(stored)
    }
  }, [keys?.publicKey])

  const getProfile = useCallback(
    async (pubkey: string): Promise<Profile | null> => {
      const cached = profileCacheRef.current.get(pubkey)
      if (cached) {
        return cached
      }

      try {
        const events = await pool.querySync(relays, {
          authors: [pubkey],
          kinds: [0],
          limit: 1,
        })

        if (!events.length) {
          return null
        }

        const latest = events.reduce((prev, next) =>
          next.created_at > prev.created_at ? next : prev,
        )
        const profile = normalizeProfile(pubkey, latest.content)

        if (!profile) {
          return null
        }

        profileCacheRef.current.set(pubkey, profile)
        if (keys?.publicKey === pubkey) {
          setMyProfile(profile)
          storage.set(STORAGE_KEYS.PROFILE, JSON.stringify(profile))
        }

        return profile
      } catch {
        return null
      }
    },
    [keys?.publicKey, pool, relays],
  )

  const updateMyProfile = useCallback(
    async (name: string, picture?: string): Promise<void> => {
      if (!keys) {
        throw new Error('No key loaded')
      }

      const event = finalizeEvent(
        {
          kind: 0,
          content: JSON.stringify({
            name: name.trim(),
            picture: picture?.trim() || undefined,
          }),
          tags: [],
          created_at: Math.floor(Date.now() / 1000),
        },
        keys.privateKey,
      )

      await Promise.any(pool.publish(relays, event))

      const nextProfile: Profile = {
        pubkey: keys.publicKey,
        name: name.trim(),
        picture: picture?.trim() || undefined,
      }

      profileCacheRef.current.set(keys.publicKey, nextProfile)
      setMyProfile(nextProfile)
      storage.set(STORAGE_KEYS.PROFILE, JSON.stringify(nextProfile))
    },
    [keys, pool, relays],
  )

  useEffect(() => {
    if (!keys) {
      setMyProfile(null)
      return
    }

    const cached = profileCacheRef.current.get(keys.publicKey)
    if (cached) {
      setMyProfile(cached)
      return
    }

    void getProfile(keys.publicKey)
  }, [getProfile, keys])

  return {
    myProfile,
    getProfile,
    updateMyProfile,
    profileCache: profileCacheRef.current,
  }
}
