import type {Schema} from './schema'

export type PersistedApi = {
  init(storageKey?: string): Promise<void>
  get<K extends keyof Schema>(key: K, storageKey?: string): Schema[K]
  write<K extends keyof Schema>(key: K, value: Schema[K], storageKey?: string): Promise<void>
  onUpdate<K extends keyof Schema>(
    key: K,
    cb: (v: Schema[K]) => void,
    storageKey?: string,
  ): () => void
  clearStorage(storageKey?: string): Promise<void>
}
