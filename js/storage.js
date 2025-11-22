// MentalIA 3.1 - Encrypted IndexedDB Storage with AES-GCM
// Complete rewrite for maximum reliability and privacy

class MentalStorage {
    constructor() {
        this.dbName = 'MentalIA-DB-v3.1';
        this.dbVersion = 1;
        this.db = null;
        this.encryptionKey = null;
        this.initialized = false;
    }

    async init() {
        if (this.initialized) {
            console.log('ℹ️ [STORAGE] Already initialized, skipping');
            return;
        }

        try {
            console.log('🔒 [STORAGE] Inicializando storage criptografado...');

            // Initialize encryption
            await this.initEncryption();

            // Initialize database
            await this.initDatabase();

            this.initialized = true;
            console.log('✅ [STORAGE] Storage criptografado inicializado com sucesso');
        } catch (error) {
            console.error('❌ [STORAGE] Falha na inicialização do storage:', error);
            throw error;
        }
    }

    async initEncryption() {
        try {
            console.log('🔑 [STORAGE] Checking for existing encryption key...');
            // Check for existing key
            const keyData = localStorage.getItem('mental-ia-encryption-key');

            if (keyData) {
                console.log('🔑 [STORAGE] Existing key found, importing...');
                // Import existing key
                const keyBuffer = this.base64ToArrayBuffer(keyData);
                this.encryptionKey = await crypto.subtle.importKey(
                    'raw',
                    keyBuffer,
                    { name: 'AES-GCM' },
                    false,
                    ['encrypt', 'decrypt']
                );
                console.log('🔑 [STORAGE] Existing encryption key loaded successfully');
            } else {
                console.log('🆕 [STORAGE] No existing key found, generating new one...');
                // Generate new key
                this.encryptionKey = await crypto.subtle.generateKey(
                    { name: 'AES-GCM', length: 256 },
                    true,
                    ['encrypt', 'decrypt']
                );

                // Export and store
                const keyBuffer = await crypto.subtle.exportKey('raw', this.encryptionKey);
                const keyB64 = this.arrayBufferToBase64(keyBuffer);
                localStorage.setItem('mental-ia-encryption-key', keyB64);
                console.log('🆕 [STORAGE] New encryption key generated and saved');
            }
        } catch (error) {
            console.error('❌ [STORAGE] Error in encryption setup:', error);
            throw error;
        }
    }

    async initDatabase() {
        return new Promise((resolve, reject) => {
            console.log('📊 [STORAGE] Opening IndexedDB:', this.dbName, 'version:', this.dbVersion);
            const request = indexedDB.open(this.dbName, this.dbVersion);

            request.onerror = () => {
                console.error('❌ [STORAGE] Error opening IndexedDB:', request.error);
                reject(request.error);
            };

            request.onsuccess = (event) => {
                this.db = event.target.result;
                console.log('📊 [STORAGE] IndexedDB connected successfully');
                resolve();
            };

            request.onupgradeneeded = (event) => {
                console.log('🔄 [STORAGE] Database upgrade needed, creating stores...');
                const db = event.target.result;

                // Mood entries store
                if (!db.objectStoreNames.contains('moodEntries')) {
                    console.log('📊 [STORAGE] Creating moodEntries store...');
                    const moodStore = db.createObjectStore('moodEntries', {
                        keyPath: 'id',
                        autoIncrement: false
                    });
                    moodStore.createIndex('timestamp', 'timestamp', { unique: false });
                    moodStore.createIndex('date', 'date', { unique: false });
                    moodStore.createIndex('mood', 'mood', { unique: false });
                    console.log('📊 [STORAGE] moodEntries store created');
                }

                // Settings store
                if (!db.objectStoreNames.contains('settings')) {
                    console.log('⚙️ [STORAGE] Creating settings store...');
                    db.createObjectStore('settings', { keyPath: 'key' });
                    console.log('⚙️ [STORAGE] settings store created');
                }

                console.log('✅ [STORAGE] Database structure created/updated');
            };
        });
    }

    async encrypt(data) {
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
                version: '3.1'
            };

            console.log('💾 [STORAGE] Prepared entry:', entry);

            const encryptedData = await this.encrypt(entry);
            console.log('💾 [STORAGE] Data encrypted successfully');

            const dbEntry = {
                id: entry.id,
                timestamp: entry.timestamp,
                date: entry.date,
                mood: entry.mood, // Keep unencrypted for queries
                encryptedData: encryptedData
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
                    reject(request.error);
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
                    const entries = [];
                    for (const dbEntry of request.result) {
                        try {
                            console.log('📊 [STORAGE] Decrypting entry ID:', dbEntry.id);
                            const decrypted = await this.decrypt(dbEntry.encryptedData);
                            entries.push(decrypted);
                            console.log('📊 [STORAGE] Successfully decrypted entry:', decrypted.id);
                        } catch (error) {
                            console.warn('⚠️ [STORAGE] Erro ao descriptografar entrada, pulando:', dbEntry.id, error);
                        }
                    }

                    // Sort by timestamp (newest first)
                    entries.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

                    console.log(`✅ [STORAGE] ${entries.length} entradas carregadas e descriptografadas`);
                    resolve(entries);
                };
                request.onerror = (event) => {
                    console.error('❌ [STORAGE] Error getting entries:', request.error, event);
                    reject(request.error);
                };
            });
        } catch (error) {
            console.error('❌ [STORAGE] getAllMoodEntries failed:', error);
            throw error;
        }
    }

    async getStats() {
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
            request.onerror = () => reject(request.error);
        });
    }

    async getSetting(key, defaultValue = null) {
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
                    reject(request.error);
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
                    reject(request.error);
                };
            });
        } catch (error) {
            console.error('❌ [STORAGE] deleteAllEntries failed:', error);
            throw error;
        }
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

// Auto-initialize on first use
const methodsToWrap = ['saveMoodEntry', 'getAllMoodEntries', 'getStats', 'saveSetting', 'getSetting'];

methodsToWrap.forEach(method => {
    const original = window.mentalStorage[method];
    if (original) {
        window.mentalStorage[method] = async function(...args) {
            await this.ensureInitialized();
            return original.apply(this, args);
        };
    }
});

console.log('🔒 MentalStorage 3.1 carregado e pronto');