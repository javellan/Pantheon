import AsyncStorage from '@react-native-async-storage/async-storage'

import {logger} from '#/logger'
import {
  defaults,
  Schema,
  tryParse,
  tryStringify,
} from '#/state/persisted/schema'
import {PersistedApi} from './types'
import {normalizeData} from './util'

export type {PersistedAccount, Schema} from '#/state/persisted/schema'
export {defaults} from '#/state/persisted/schema'

const BSKY_STORAGE = 'BSKY_STORAGE'
const TAO_STORAGE = 'TAO_STORAGE'

let _state: Record<string, Schema> = {
  [BSKY_STORAGE]: defaults,
}

export async function init(storageKey: string = BSKY_STORAGE) {
  const stored = await readFromStorage(storageKey)
  if (stored) {
    _state[storageKey] = stored
  } else {
    _state[storageKey] = defaults
  }
}
init satisfies PersistedApi['init']

export function get<K extends keyof Schema>(key: K, storageKey: string = BSKY_STORAGE): Schema[K] {
  return (_state[storageKey] || defaults)[key]
}
get satisfies PersistedApi['get']

export async function write<K extends keyof Schema>(
  key: K,
  value: Schema[K],
  storageKey: string = BSKY_STORAGE,
): Promise<void> {
  const prev = _state[storageKey] || defaults
  _state[storageKey] = normalizeData({
    ...prev,
    [key]: value,
  })
  await writeToStorage(_state[storageKey], storageKey)
}
write satisfies PersistedApi['write']

export function onUpdate<K extends keyof Schema>(
  _key: K,
  _cb: (v: Schema[K]) => void,
  _storageKey: string = BSKY_STORAGE,
): () => void {
  return () => {}
}
onUpdate satisfies PersistedApi['onUpdate']

export async function clearStorage(storageKey: string = BSKY_STORAGE) {
  try {
    await AsyncStorage.removeItem(storageKey)
    delete _state[storageKey]
  } catch (e: any) {
    logger.error(`persisted store: failed to clear`, {message: e.toString()})
  }
}
clearStorage satisfies PersistedApi['clearStorage']

async function writeToStorage(value: Schema, storageKey: string) {
  const rawData = tryStringify(value)
  if (rawData) {
    try {
      await AsyncStorage.setItem(storageKey, rawData)
    } catch (e) {
      logger.error(`persisted state: failed writing root state to storage`, {
        message: e,
      })
    }
  }
}

async function readFromStorage(storageKey: string): Promise<Schema | undefined> {
  let rawData: string | null = null
  try {
    rawData = await AsyncStorage.getItem(storageKey)
  } catch (e) {
    logger.error(`persisted state: failed reading root state from storage`, {
      message: e,
    })
  }
  if (rawData) {
    const parsed = tryParse(rawData)
    if (parsed) {
      return normalizeData(parsed)
    }
  }
}

export function getTaoStorageKeyForDid(did: string) {
  return `${TAO_STORAGE}_${did}`
}
