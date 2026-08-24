import { STORAGE_MODE } from '@/lib/env';
import { DexieStorageProvider } from './dexie-storage-provider';
import { ApiStorageProvider } from './api-storage-provider';

export const StorageProvider =
    STORAGE_MODE === 'api' ? ApiStorageProvider : DexieStorageProvider;
