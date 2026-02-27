import { useEffect, useState } from 'react'
import { nip04, type SimplePool } from 'nostr-tools'
import { STORAGE_KEYS } from '@/constants/relays'
import { storage } from '@/lib/storage'
import type { Friend, NostrKeys } from '@/types'

interface LastReadMap {
  [peerPubkey: string]: number
}

export interface FriendPreview {
  pubkey: string
  lastMessage: string
  lastMessageAt: number | null
  unread: number
}

interface UseFriendPreviewsParams {
  pool: SimplePool
  relays: string[]
  keys: NostrKeys | null
  friends: Friend[]
}

interface UseFriendPreviewsReturn {
  previews: Map<string, FriendPreview>
}

function parseLastRead(raw: string | null): LastReadMap {
  if (!raw) {
    return {}
  }

  try {
    const parsed = JSON.parse(raw) as Record<string, unknown>
    return Object.entries(parsed).reduce<LastReadMap>((acc, [pubkey, value]) => {
      if (typeof value === 'number') {
        acc[pubkey] = value
      }
      return acc
    }, {})
  } catch {
    return {}
  }
}

function sameLastReadMap(a: LastReadMap, b: LastReadMap): boolean {
  const aKeys = Object.keys(a)
  const bKeys = Object.keys(b)
  if (aKeys.length !== bKeys.length) {
    return false
  }

  for (const key of aKeys) {
    if (a[key] !== b[key]) {
      return false
    }
  }

  return true
}

function createEmptyPreview(pubkey: string): FriendPreview {
  return {
    pubkey,
    lastMessage: '',
    lastMessageAt: null,
    unread: 0,
  }
}

export default function useFriendPreviews({
  pool,
  relays,
  keys,
  friends,
}: UseFriendPreviewsParams): UseFriendPreviewsReturn {
  const [previews, setPreviews] = useState<Map<string, FriendPreview>>(new Map())

  useEffect(() => {
    if (!keys || friends.length === 0) {
      setPreviews(new Map())
      return
    }

    let cancelled = false
    let lastReadMap = parseLastRead(storage.get(STORAGE_KEYS.LAST_READ))

    const friendPubkeys = friends.map((friend) => friend.pubkey)
    const incomingByFriend = new Map<string, Map<string, number>>()
    const subscriptions: Array<{ close: () => void }> = []

    const computeUnread = (friendPubkey: string): number => {
      const incoming = incomingByFriend.get(friendPubkey)
      if (!incoming) {
        return 0
      }

      const lastRead = lastReadMap[friendPubkey] || 0
      let count = 0
      for (const createdAt of incoming.values()) {
        if (createdAt > lastRead) {
          count += 1
        }
      }
      return count
    }

    const upsertPreview = (
      friendPubkey: string,
      patch: Partial<Pick<FriendPreview, 'lastMessage' | 'lastMessageAt'>>,
    ) => {
      setPreviews((prev) => {
        const current = prev.get(friendPubkey) || createEmptyPreview(friendPubkey)
        const nextPreview: FriendPreview = {
          ...current,
          ...patch,
          unread: computeUnread(friendPubkey),
        }

        const next = new Map(prev)
        next.set(friendPubkey, nextPreview)
        return next
      })
    }

    const syncUnreadOnly = () => {
      setPreviews((prev) => {
        const next = new Map(prev)
        for (const friendPubkey of friendPubkeys) {
          const current = next.get(friendPubkey) || createEmptyPreview(friendPubkey)
          next.set(friendPubkey, {
            ...current,
            unread: computeUnread(friendPubkey),
          })
        }
        return next
      })
    }

    setPreviews(() => {
      const initial = new Map<string, FriendPreview>()
      for (const friendPubkey of friendPubkeys) {
        initial.set(friendPubkey, createEmptyPreview(friendPubkey))
      }
      return initial
    })

    const myPubkey = keys.publicKey
    const myPrivkeyHex = keys.privateKeyHex

    for (const friend of friends) {
      const friendPubkey = friend.pubkey
      incomingByFriend.set(friendPubkey, new Map())

      void (async () => {
        try {
          const incomingEvents = await pool.querySync(relays, {
            authors: [friendPubkey],
            kinds: [4],
            '#p': [myPubkey],
            limit: 400,
          })

          if (cancelled) {
            return
          }

          const incoming = incomingByFriend.get(friendPubkey)
          if (!incoming) {
            return
          }

          for (const event of incomingEvents) {
            if (
              event.pubkey === friendPubkey &&
              event.tags.some((tag) => tag[0] === 'p' && tag[1] === myPubkey)
            ) {
              incoming.set(event.id, event.created_at)
            }
          }

          syncUnreadOnly()
        } catch {
          // no-op
        }
      })()

      const filters = [
        {
          authors: [friendPubkey],
          kinds: [4],
          '#p': [myPubkey],
          limit: 1,
        },
        {
          authors: [myPubkey],
          kinds: [4],
          '#p': [friendPubkey],
          limit: 1,
        },
      ]

      const seenIds = new Set<string>()
      const sub = pool.subscribeMany(relays, filters as any, {
        onevent: async (event) => {
          if (cancelled || seenIds.has(event.id)) {
            return
          }
          seenIds.add(event.id)

          const directedToMe =
            event.pubkey === friendPubkey &&
            event.tags.some((tag) => tag[0] === 'p' && tag[1] === myPubkey)
          const directedToPeer =
            event.pubkey === myPubkey &&
            event.tags.some((tag) => tag[0] === 'p' && tag[1] === friendPubkey)

          if (!directedToMe && !directedToPeer) {
            return
          }

          if (directedToMe) {
            const incoming = incomingByFriend.get(friendPubkey)
            if (incoming && !incoming.has(event.id)) {
              incoming.set(event.id, event.created_at)
            }
          }

          const peerKey = event.pubkey === myPubkey ? friendPubkey : event.pubkey
          let decrypted = ''

          try {
            decrypted = await nip04.decrypt(myPrivkeyHex, peerKey, event.content)
          } catch {
            decrypted = '[Decryption failed]'
          }

          setPreviews((prev) => {
            const current = prev.get(friendPubkey) || createEmptyPreview(friendPubkey)
            const shouldUpdateLatest =
              current.lastMessageAt === null || event.created_at >= current.lastMessageAt

            const nextPreview: FriendPreview = shouldUpdateLatest
              ? {
                  ...current,
                  lastMessage: decrypted,
                  lastMessageAt: event.created_at,
                  unread: computeUnread(friendPubkey),
                }
              : {
                  ...current,
                  unread: computeUnread(friendPubkey),
                }

            const next = new Map(prev)
            next.set(friendPubkey, nextPreview)
            return next
          })
        },
        oneose: () => {
          if (cancelled) {
            return
          }

          upsertPreview(friendPubkey, {})
        },
      })

      subscriptions.push(sub)
    }

    const intervalId = window.setInterval(() => {
      const nextLastRead = parseLastRead(storage.get(STORAGE_KEYS.LAST_READ))
      if (!sameLastReadMap(lastReadMap, nextLastRead)) {
        lastReadMap = nextLastRead
        syncUnreadOnly()
      }
    }, 1000)

    return () => {
      cancelled = true
      window.clearInterval(intervalId)
      subscriptions.forEach((sub) => sub.close())
    }
  }, [friends, keys, pool, relays])

  return { previews }
}
