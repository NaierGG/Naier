export interface NostrKeys {
  privateKey: Uint8Array
  privateKeyHex: string
  publicKey: string   // hex
  nsec: string        // nsec1...
  npub: string        // npub1...
}

export interface Friend {
  pubkey: string      // hex
  npub: string        // npub1...
  nickname: string
  picture?: string
  addedAt: number     // unix timestamp
}

export interface Message {
  id: string
  pubkey: string      // sender hex pubkey
  content: string     // encrypted original
  decrypted: string   // decrypted text
  created_at: number  // unix timestamp
  isMine: boolean
  isImage: boolean
  failed?: boolean    // decryption failure flag
}

export interface Profile {
  pubkey: string
  name?: string
  picture?: string
  about?: string
}

export interface RelayStatus {
  url: string
  status: 'connected' | 'connecting' | 'disconnected' | 'error'
}

export interface ChatState {
  messages: Message[]
  isLoading: boolean
  isSubscribed: boolean
  lastReceivedAt: number | null
  error: string | null
}
