// MentalIA 3.1 - Enhanced Encrypted IndexedDB Storage with AES-GCM
// Complete rewrite for maximum reliability and persistence

class MentalStorage {
    constructor() {
        this.dbName = 'MentalIA-DB-v3.1';
        this.dbVersion = 2; // 🔥 CORREÇÃO: Incrementado para forçar upgrade
        this.db = null;
        this.encryptionKey = null;
        this.initialized = false;
        this.initPromise = null;
        this.retryCount = 0;
        this.maxRetries = 3;
    }

    async init() {
        if (this.initPromise) {
            console.log('🔄 [STORAGE] Init já em andamento, aguardando...');
            return this.initPromise;
        }

        this.initPromise = this._initInternal();
        return this.initPromise;
    }

    async _initInternal() {
        if (this.initialized) {
            console.log('ℹ️ [STORAGE] Já inicializado, pulando');
            return;
        }

        try {
            console.log('🔒 [STORAGE] Inicializando storage criptografado v3.1...');

            // Initialize encryption first
            await this.initEncryption();

            // Initialize database
            await this.initDatabase();

            this.initialized = true;
            this.retryCount = 0;
            console.log('✅ [STORAGE] Storage criptografado inicializado com sucesso');
        } catch (error) {
            console.error('❌ [STORAGE] Falha na inicialização:', error);
            this.initPromise = null;

            // Retry logic
            if (this.retryCount < this.maxRetries) {
                this.retryCount++;
                console.log(`🔄 [STORAGE] Tentando novamente (${this.retryCount}/${this.maxRetries})...`);
                await new Promise(resolve => setTimeout(resolve, 1000 * this.retryCount));
                return this._initInternal();
            }

            throw error;
        }
    }

    async ensureInitialized() {
        if (!this.initialized) {
            console.log('🔄 [STORAGE] ensureInitialized: inicializando...');
            await this.init();
        }
        return this.initialized;
    }

    async initEncryption() {
        try {
            console.log('🔑 [STORAGE] Checking for existing encryption key...');
            let keyData = localStorage.getItem('mental-ia-encryption-key');

            if (!keyData) {
                console.log('🔑 [STORAGE] Checking legacy key locations...');
                // Check for legacy key locations
                keyData = localStorage.getItem('mental-encryption-key') ||
                          sessionStorage.getItem('mental-ia-encryption-key');
            }

            if (keyData) {
                console.log('🔑 [STORAGE] Existing key found, importing...');
                try {
                    const keyBuffer = this.base64ToArrayBuffer(keyData);
                    this.encryptionKey = await crypto.subtle.importKey(
                        'raw',
                        keyBuffer,
                        { name: 'AES-GCM' },
                        false,
                        ['encrypt', 'decrypt']
                    );
                    console.log('🔑 [STORAGE] Existing encryption key loaded successfully');
                } catch (importError) {
                    console.warn('⚠️ [STORAGE] Failed to import existing key, generating new one:', importError);
                    await this.generateNewKey();
                }
            } else {
                console.log('🆕 [STORAGE] No existing key found, generating new one...');
                await this.generateNewKey();
            }
        } catch (error) {
            console.error('❌ [STORAGE] Error in encryption setup:', error);
            throw error;
        }
    }

    async generateNewKey() {
        this.encryptionKey = await crypto.subtle.generateKey(
            { name: 'AES-GCM', length: 256 },
            true,
            ['encrypt', 'decrypt']
        );

        const keyBuffer = await crypto.subtle.exportKey('raw', this.encryptionKey);
        const keyB64 = this.arrayBufferToBase64(keyBuffer);
        localStorage.setItem('mental-ia-encryption-key', keyB64);
        console.log('🆕 [STORAGE] New encryption key generated and saved');
    }

    async initDatabase() {
        return new Promise((resolve, reject) => {
            console.log('📊 [STORAGE] Opening IndexedDB:', this.dbName, 'version:', this.dbVersion);

            const request = indexedDB.open(this.dbName, this.dbVersion);

            request.onerror = (event) => {
                console.error('❌ [STORAGE] IndexedDB open error:', request.error, event);
                reject(new Error(`IndexedDB error: ${request.error.message}`));
            };

            request.onsuccess = (event) => {
                this.db = event.target.result;
                console.log('📊 [STORAGE] IndexedDB connected successfully');

                // Add error handler to database
                this.db.onerror = (event) => {
                    console.error('❌ [STORAGE] Database error:', event.target.error);
                };

                resolve();
            };

            request.onblocked = (event) => {
                console.warn('⚠️ [STORAGE] Database blocked, waiting...');
                // Auto-resolve after timeout
                setTimeout(() => {
                    if (!this.db) {
                        console.error('❌ [STORAGE] Database still blocked after timeout');
                        reject(new Error('Database blocked'));
                    }
                }, 5000);
            };

            request.onupgradeneeded = (event) => {
                console.log('🔄 [STORAGE] Database upgrade needed, creating stores...');
                const db = event.target.result;

                // Mood entries store with improved structure
                if (!db.objectStoreNames.contains('moodEntries')) {
                    console.log('📊 [STORAGE] Creating moodEntries store...');
                    const moodStore = db.createObjectStore('moodEntries', {
                        keyPath: 'id',
                        autoIncrement: false
                    });
                    moodStore.createIndex('timestamp', 'timestamp', { unique: false });
                    moodStore.createIndex('date', 'date', { unique: false });
                    moodStore.createIndex('mood', 'mood', { unique: false });
                    moodStore.createIndex('version', 'version', { unique: false });
                    console.log('📊 [STORAGE] moodEntries store created');
                } else {
                    console.log('📊 [STORAGE] moodEntries store already exists');
                }

                // Settings store
                if (!db.objectStoreNames.contains('settings')) {
                    console.log('⚙️ [STORAGE] Creating settings store...');
                    db.createObjectStore('settings', { keyPath: 'key' });
                    console.log('⚙️ [STORAGE] settings store created');
                } else {
                    console.log('⚙️ [STORAGE] settings store already exists');
                }

                console.log('✅ [STORAGE] Database structure ready');
            };
        });
    }

    async encrypt(data) {
        if (!this.encryptionKey) {
            throw new Error('Encryption key not initialized');
        }

        const jsonString = JSON.stringify(data);
        const encoder = new TextEncoder();
        const dataBuffer = encoder.encode(jsonString);

        const iv = crypto.getRandomValues(new Uint8Array(12));

        const encrypted = await crypto.subtle.encrypt(
            { name: 'AES-GCM', iv: iv },
            this.encryptionKey,
            dataBuffer
        );

        // Combine IV + encrypted data
        const combined = new Uint8Array(iv.length + encrypted.byteLength);
        combined.set(iv);
        combined.set(new Uint8Array(encrypted), iv.length);

        return this.arrayBufferToBase64(combined);
    }

    async decrypt(encryptedData) {
        if (!this.encryptionKey) {
            throw new Error('Encryption key not initialized');
        }

        try {
            const combined = this.base64ToArrayBuffer(encryptedData);
            const iv = combined.slice(0, 12);
            const encrypted = combined.slice(12);

            const decrypted = await crypto.subtle.decrypt(
                { name: 'AES-GCM', iv: iv },
                this.encryptionKey,
                encrypted
            );

            const decoder = new TextDecoder();
            const jsonString = decoder.decode(decrypted);
            return JSON.parse(jsonString);
        } catch (error) {
            console.error('❌ [STORAGE] Decryption failed:', error);
            throw new Error('Failed to decrypt data - data may be corrupted');
        }
    }

    async saveMoodEntry(moodData) {
        try {
            console.log('💾 [STORAGE] saveMoodEntry called with:', moodData);
            await this.ensureInitialized();
            console.log('💾 [STORAGE] Storage initialized, proceeding...');

            // Validate input
            if (typeof moodData.mood !== 'number' || moodData.mood < 1 || moodData.mood > 5) {
                throw new Error('Valor de humor deve ser um número entre 1 e 5');
            }

            const entry = {
                id: moodData.id || Date.now(),
                mood: parseFloat(moodData.mood),
                feelings: Array.isArray(moodData.feelings) ? moodData.feelings : [],
                diary: (moodData.diary || '').trim(),
                timestamp: moodData.timestamp || new Date().toISOString(),
                date: moodData.date || new Date().toDateString(),
                version: '3.1',
                created: new Date().toISOString()
            };

            console.log('💾 [STORAGE] Prepared entry:', entry);

            const encryptedData = await this.encrypt(entry);
            console.log('💾 [STORAGE] Data encrypted successfully');

            const dbEntry = {
                id: entry.id,
                timestamp: entry.timestamp,
                date: entry.date,
                mood: entry.mood, // Keep unencrypted for queries
                version: entry.version,
                encryptedData: encryptedData,
                created: entry.created
            };

            console.log('💾 [STORAGE] Saving to database...');
            const transaction = this.db.transaction(['moodEntries'], 'readwrite');
            const store = transaction.objectStore('moodEntries');

            return new Promise((resolve, reject) => {
                const request = store.put(dbEntry);

                request.onsuccess = () => {
                    console.log('✅ [STORAGE] Entry saved successfully with ID:', entry.id);
                    resolve(entry);
                };

                request.onerror = (event) => {
                    console.error('❌ [STORAGE] Error saving entry:', request.error, event);
                    reject(new Error(`Database save failed: ${request.error.message}`));
                };
            });
        } catch (error) {
            console.error('❌ [STORAGE] saveMoodEntry failed:', error);
            throw error;
        }
    }

    async getAllMoodEntries() {
        try {
            console.log('📊 [STORAGE] getAllMoodEntries called');
            await this.ensureInitialized();
            console.log('📊 [STORAGE] Storage initialized, opening transaction...');

            const transaction = this.db.transaction(['moodEntries'], 'readonly');
            const store = transaction.objectStore('moodEntries');
            const request = store.getAll();

            return new Promise(async (resolve, reject) => {
                request.onsuccess = async () => {
                    console.log('📊 [STORAGE] Retrieved', request.result.length, 'raw entries from database');

                    if (request.result.length === 0) {
                        console.log('📊 [STORAGE] No entries found');
                        resolve([]);
                        return;
                    }

                    const entries = [];
                    const decryptionPromises = request.result.map(async (dbEntry) => {
                        try {
                            console.log('📊 [STORAGE] Decrypting entry ID:', dbEntry.id);
                            const decrypted = await this.decrypt(dbEntry.encryptedData);
                            entries.push(decrypted);
                            console.log('📊 [STORAGE] Successfully decrypted entry:', decrypted.id);
                        } catch (error) {
                            console.warn('⚠️ [STORAGE] Error decrypting entry, skipping:', dbEntry.id, error);
                            // Don't add corrupted entries
                        }
                    });

                    await Promise.all(decryptionPromises);

                    // Sort by timestamp (newest first)
                    entries.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

                    console.log(`✅ [STORAGE] ${entries.length} entries loaded and decrypted`);
                    resolve(entries);
                };

                request.onerror = (event) => {
                    console.error('❌ [STORAGE] Error getting entries:', request.error, event);
                    reject(new Error(`Database read failed: ${request.error.message}`));
                };
            });
        } catch (error) {
            console.error('❌ [STORAGE] getAllMoodEntries failed:', error);
            throw error;
        }
    }

    async getStats() {
        try {
            const entries = await this.getAllMoodEntries();

            if (entries.length === 0) {
                return {
                    totalEntries: 0,
                    averageMood: 0,
                    streak: 0,
                    lastEntry: null,
                    moodTrend: 'neutral'
                };
            }

            const totalEntries = entries.length;
            const averageMood = entries.reduce((sum, entry) => sum + entry.mood, 0) / totalEntries;

            // Calculate streak
            const streak = this.calculateStreak(entries);

            // Calculate trend
            const moodTrend = this.calculateTrend(entries);

            return {
                totalEntries,
                averageMood: Math.round(averageMood * 10) / 10,
                streak,
                lastEntry: entries[0],
                moodTrend
            };
        } catch (error) {
            console.error('❌ [STORAGE] getStats failed:', error);
            // Return safe defaults
            return {
                totalEntries: 0,
                averageMood: 0,
                streak: 0,
                lastEntry: null,
                moodTrend: 'neutral'
            };
        }
    }

    calculateStreak(entries) {
        if (entries.length === 0) return 0;

        const dates = new Set(entries.map(e => new Date(e.timestamp).toDateString()));
        const today = new Date();
        let streak = 0;

        for (let i = 0; ; i++) {
            const date = new Date(today);
            date.setDate(today.getDate() - i);
            if (dates.has(date.toDateString())) {
                streak++;
            } else {
                break;
            }
        }

        return streak;
    }

    calculateTrend(entries) {
        if (entries.length < 7) return 'neutral';

        const recent = entries.slice(0, 7);
        const older = entries.slice(7, 14);

        if (older.length === 0) return 'neutral';

        const recentAvg = recent.reduce((sum, e) => sum + e.mood, 0) / recent.length;
        const olderAvg = older.reduce((sum, e) => sum + e.mood, 0) / older.length;

        const diff = recentAvg - olderAvg;

        if (diff > 0.3) return 'improving';
        if (diff < -0.3) return 'declining';
        return 'stable';
    }

    async saveSetting(key, value) {
        try {
            await this.ensureInitialized();

            const encryptedValue = await this.encrypt(value);

            const transaction = this.db.transaction(['settings'], 'readwrite');
            const store = transaction.objectStore('settings');

            return new Promise((resolve, reject) => {
                const request = store.put({
                    key,
                    encryptedValue,
                    updatedAt: new Date().toISOString()
                });
                request.onsuccess = () => resolve();
                request.onerror = () => reject(new Error(`Settings save failed: ${request.error.message}`));
            });
        } catch (error) {
            console.error('❌ [STORAGE] saveSetting failed:', error);
            throw error;
        }
    }

    async getSetting(key, defaultValue = null) {
        try {
            await this.ensureInitialized();

            const transaction = this.db.transaction(['settings'], 'readonly');
            const store = transaction.objectStore('settings');
            const request = store.get(key);

            return new Promise(async (resolve, reject) => {
                request.onsuccess = async () => {
                    if (request.result) {
                        try {
                            const decrypted = await this.decrypt(request.result.encryptedValue);
                            resolve(decrypted);
                        } catch (error) {
                            console.warn(`Erro ao descriptografar configuração ${key}:`, error);
                            resolve(defaultValue);
                        }
                    } else {
                        resolve(defaultValue);
                    }
                };
                request.onerror = () => resolve(defaultValue);
            });
        } catch (error) {
            console.error('❌ [STORAGE] getSetting failed:', error);
            return defaultValue;
        }
    }

    async deleteEntry(entryId) {
        try {
            console.log('🗑️ [STORAGE] deleteEntry called for ID:', entryId);
            await this.ensureInitialized();

            const transaction = this.db.transaction(['moodEntries'], 'readwrite');
            const store = transaction.objectStore('moodEntries');

            return new Promise((resolve, reject) => {
                const request = store.delete(entryId);
                request.onsuccess = () => {
                    console.log('✅ [STORAGE] Entry deleted successfully:', entryId);
                    resolve(true);
                };
                request.onerror = (event) => {
                    console.error('❌ [STORAGE] Error deleting entry:', request.error, event);
                    reject(new Error(`Delete failed: ${request.error.message}`));
                };
            });
        } catch (error) {
            console.error('❌ [STORAGE] deleteEntry failed:', error);
            throw error;
        }
    }

    async deleteAllEntries() {
        try {
            console.log('🗑️ [STORAGE] deleteAllEntries called - DELETING ALL DATA');
            await this.ensureInitialized();

            const transaction = this.db.transaction(['moodEntries'], 'readwrite');
            const store = transaction.objectStore('moodEntries');

            return new Promise((resolve, reject) => {
                const request = store.clear();
                request.onsuccess = () => {
                    console.log('✅ [STORAGE] All entries deleted successfully');
                    resolve(true);
                };
                request.onerror = (event) => {
                    console.error('❌ [STORAGE] Error deleting all entries:', request.error, event);
                    reject(new Error(`Clear failed: ${request.error.message}`));
                };
            });
        } catch (error) {
            console.error('❌ [STORAGE] deleteAllEntries failed:', error);
            throw error;
        }
    }

    // 🔥 CORREÇÃO: Método para verificar integridade dos dados
    async verifyDataIntegrity() {
        try {
            console.log('🔍 [STORAGE] Verifying data integrity...');
            await this.ensureInitialized();

            const entries = await this.getAllMoodEntries();
            let validEntries = 0;
            let corruptedEntries = 0;

            for (const entry of entries) {
                if (this.isValidEntry(entry)) {
                    validEntries++;
                } else {
                    corruptedEntries++;
                    console.warn('⚠️ [STORAGE] Corrupted entry found:', entry.id);
                }
            }

            console.log(`🔍 [STORAGE] Integrity check: ${validEntries} valid, ${corruptedEntries} corrupted`);
            return { validEntries, corruptedEntries, totalEntries: entries.length };
        } catch (error) {
            console.error('❌ [STORAGE] Integrity check failed:', error);
            return { validEntries: 0, corruptedEntries: 0, totalEntries: 0 };
        }
    }

    isValidEntry(entry) {
        return entry &&
               typeof entry.id === 'number' &&
               typeof entry.mood === 'number' &&
               entry.mood >= 1 && entry.mood <= 5 &&
               typeof entry.timestamp === 'string' &&
               typeof entry.date === 'string';
    }

    arrayBufferToBase64(buffer) {
        const bytes = new Uint8Array(buffer);
        let binary = '';
        for (let i = 0; i < bytes.byteLength; i++) {
            binary += String.fromCharCode(bytes[i]);
        }
        return btoa(binary);
    }

    base64ToArrayBuffer(base64) {
        const binary = atob(base64);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) {
            bytes[i] = binary.charCodeAt(i);
        }
        return bytes.buffer;
    }
}

// Initialize globally
window.mentalStorage = new MentalStorage();

// 🔥 CORREÇÃO: Auto-initialize mais robusto com retry
const methodsToWrap = ['saveMoodEntry', 'getAllMoodEntries', 'getStats', 'saveSetting', 'getSetting', 'deleteEntry', 'deleteAllEntries', 'verifyDataIntegrity'];

methodsToWrap.forEach(method => {
    const original = window.mentalStorage[method];
    if (original) {
        window.mentalStorage[method] = async function(...args) {
            try {
                await this.ensureInitialized();
                return await original.apply(this, args);
            } catch (error) {
                console.error(`❌ [STORAGE] Auto-init failed for ${method}:`, error);
                throw error;
            }
        };
    }
});

// 🔥 CORREÇÃO: Inicialização automática mais agressiva e com verificação
console.log('🔒 MentalStorage 3.1 Enhanced carregado, iniciando auto-init...');

// Function to check if storage is working
async function checkStorageHealth() {
    try {
        console.log('🏥 [STORAGE] Checking storage health...');
        const stats = await window.mentalStorage.getStats();
        console.log('🏥 [STORAGE] Health check passed:', stats);
        return true;
    } catch (error) {
        console.error('🏥 [STORAGE] Health check failed:', error);
        return false;
    }
}

// Try to initialize immediately
setTimeout(async () => {
    try {
        console.log('🔄 [STORAGE] Auto-init: tentando inicialização automática...');
        await window.mentalStorage.init();

        // Verify storage is working
        const isHealthy = await checkStorageHealth();
        if (isHealthy) {
            console.log('✅ [STORAGE] Auto-init: inicialização e verificação bem-sucedidas');
        } else {
            console.warn('⚠️ [STORAGE] Auto-init: inicialização ok, mas verificação falhou');
        }
    } catch (error) {
        console.error('❌ [STORAGE] Auto-init: falha na inicialização automática:', error);

        // Try one more time after a delay
        setTimeout(async () => {
            try {
                console.log('🔄 [STORAGE] Auto-init: segunda tentativa...');
                await window.mentalStorage.init();
                const isHealthy = await checkStorageHealth();
                if (isHealthy) {
                    console.log('✅ [STORAGE] Auto-init: segunda tentativa bem-sucedida');
                }
            } catch (secondError) {
                console.error('❌ [STORAGE] Auto-init: segunda tentativa também falhou:', secondError);
            }
        }, 2000);
    }
}, 100);