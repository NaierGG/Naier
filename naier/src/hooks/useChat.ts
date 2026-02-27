import { useCallback, useEffect, useRef, useState } from 'react'
import { finalizeEvent, nip04, type SimplePool } from 'nostr-tools'
import { STORAGE_KEYS } from '@/constants/relays'
import { storage } from '@/lib/storage'
import type { Message, NostrKeys } from '@/types'

interface UseChatParams {
  pool: SimplePool
  relays: string[]
  keys: NostrKeys | null
  onError?: (message: string) => void
}

interface LastReadMap {
  [peerPubkey: string]: number
}

export interface UseChatReturn {
  messages: Message[]
  isLoading: boolean
  isSubscribed: boolean
  lastReceivedAt: number | null
  error: string | null
  sendMessage: (text: string) => Promise<void>
  subscribe: (peerPubkey: string) => void
  unsubscribe: () => void
}

function isImageUrl(text: string): boolean {
  const trimmed = text.trim()
  return /^https?:\/\/.+\.(jpg|jpeg|png|gif|webp|svg)(\?.*)?$/i.test(trimmed)
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

function mergeMessages(prev: Message[], next: Message): Message[] {
  if (prev.some((message) => message.id === next.id)) {
    return prev
  }

  const merged = [...prev, next].sort((a, b) => a.created_at - b.created_at)
  return merged.slice(-200)
}

export default function useChat({ pool, relays, keys, onError }: UseChatParams): UseChatReturn {
  const [messages, setMessages] = useState<Message[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isSubscribed, setIsSubscribed] = useState(false)
  const [lastReceivedAt, setLastReceivedAt] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)

  const subRef = useRef<{ close: () => void } | null>(null)
  const peerPubkeyRef = useRef<string | null>(null)
  const sessionRef = useRef(0)
  const lastReadRef = useRef<LastReadMap>(parseLastRead(storage.get(STORAGE_KEYS.LAST_READ)))

  const setLastRead = useCallback((peerPubkey: string, createdAt: number) => {
    const prev = lastReadRef.current[peerPubkey] || 0
    if (createdAt <= prev) {
      return
    }

    // Local only. NOT visible to the other party.
    const nextMap: LastReadMap = {
      ...lastReadRef.current,
      [peerPubkey]: createdAt,
    }
    lastReadRef.current = nextMap
    storage.set(STORAGE_KEYS.LAST_READ, JSON.stringify(nextMap))
  }, [])

  const unsubscribe = useCallback(() => {
    subRef.current?.close()
    subRef.current = null
    peerPubkeyRef.current = null
    sessionRef.current += 1
    setIsSubscribed(false)
    setIsLoading(false)
  }, [])

  const subscribe = useCallback(
    (peerPubkey: string) => {
      unsubscribe()
      setError(null)
      setIsLoading(true)
      setMessages([])
      setLastReceivedAt(null)
      peerPubkeyRef.current = peerPubkey

      if (!keys) {
        setIsLoading(false)
        setIsSubscribed(false)
        setError('No key loaded')
        return
      }

      const myPubkey = keys.publicKey
      const myPrivkeyHex = keys.privateKeyHex
      const filter = {
        authors: [peerPubkey, myPubkey],
        kinds: [4],
        '#p': [myPubkey, peerPubkey],
        limit: 400,
      }

      const seenIds = new Set<string>()
      const buffer: Message[] = []
      let eoseReceived = false
      const currentSession = sessionRef.current

      const sub = pool.subscribeMany(relays, filter, {
        onevent: async (event) => {
          if (currentSession !== sessionRef.current) {
            return
          }

          if (seenIds.has(event.id)) {
            return
          }
          seenIds.add(event.id)

          const directedToMe =
            event.pubkey === peerPubkey &&
            event.tags.some((tag) => tag[0] === 'p' && tag[1] === myPubkey)
          const directedToPeer =
            event.pubkey === myPubkey &&
            event.tags.some((tag) => tag[0] === 'p' && tag[1] === peerPubkey)

          if (!directedToMe && !directedToPeer) {
            return
          }

          const isMine = event.pubkey === myPubkey
          const peerKey = isMine ? peerPubkey : event.pubkey
          let decrypted = ''
          let failed = false

          try {
            decrypted = await nip04.decrypt(myPrivkeyHex, peerKey, event.content)
          } catch {
            decrypted = '[Decryption failed]'
            failed = true
          }

          const message: Message = {
            id: event.id,
            pubkey: event.pubkey,
            content: event.content,
            decrypted,
            created_at: event.created_at,
            isMine,
            isImage: isImageUrl(decrypted),
            failed,
          }

          if (!eoseReceived) {
            buffer.push(message)
            return
          }

          setMessages((prev) => mergeMessages(prev, message))
          setLastReceivedAt(Date.now())
          setLastRead(peerPubkey, event.created_at)
        },
        oneose: () => {
          if (currentSession !== sessionRef.current) {
            return
          }

          eoseReceived = true
          const sorted = buffer.sort((a, b) => a.created_at - b.created_at).slice(-200)
          setMessages(sorted)
          setIsLoading(false)
          setIsSubscribed(true)

          if (sorted.length) {
            setLastRead(peerPubkey, sorted[sorted.length - 1].created_at)
          }
        },
      })

      subRef.current = sub
    },
    [keys, pool, relays, setLastRead, unsubscribe],
  )

  const sendMessage = useCallback(
    async (text: string): Promise<void> => {
      const trimmed = text.trim()
      const peerPubkey = peerPubkeyRef.current

      if (!trimmed || !keys || !peerPubkey) {
        return
      }

      setError(null)

      try {
        const encrypted = await nip04.encrypt(keys.privateKeyHex, peerPubkey, trimmed)
        const event = finalizeEvent(
          {
            kind: 4,
            content: encrypted,
            tags: [['p', peerPubkey]],
            created_at: Math.floor(Date.now() / 1000),
          },
          keys.privateKey,
        )

        setMessages((prev) =>
          mergeMessages(prev, {
            id: event.id,
            pubkey: event.pubkey,
            content: event.content,
            decrypted: trimmed,
            created_at: event.created_at,
            isMine: true,
            isImage: isImageUrl(trimmed),
          }),
        )

        await Promise.any(pool.publish(relays, event))
        setLastRead(peerPubkey, event.created_at)
      } catch {
        const nextError = 'Failed to send message'
        setError(nextError)
        onError?.(nextError)
      }
    },
    [keys, onError, pool, relays, setLastRead],
  )

  useEffect(() => {
    return () => {
      unsubscribe()
    }
  }, [unsubscribe])

  return {
    messages,
    isLoading,
    isSubscribed,
    lastReceivedAt,
    error,
    sendMessage,
    subscribe,
    unsubscribe,
  }
}
