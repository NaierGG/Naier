export const DEFAULT_RELAYS: string[] = [
  'wss://relay.damus.io',
  'wss://nos.lol',
  'wss://relay.nostr.band',
]

export const STORAGE_KEYS = {
  PRIVATE_KEY: 'naier_privkey',
  SAVE_TO_STORAGE: 'naier_save_key',
  FRIENDS: 'naier_friends_cache',
  RELAYS: 'naier_relays',
  LAST_READ: 'naier_last_read',
  PROFILE: 'naier_profile',
} as const
