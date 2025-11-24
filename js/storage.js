// MentalIA 3.1 - Encrypted IndexedDB Storage with AES-GCM
// Complete rewrite for maximum reliability and privacy

class MentalStorage {
    constructor() {
        this.dbName = 'MentalIA-DB-v3.1';
        this.dbVersion = 3; // Incrementado para forçar upgrade e persistência
        this.db = null;
        this.encryptionKey = null;
        this.initialized = false;
        this.saveMutex = false;
    }

    async init() {
        if (this.initialized) return;

        try {
            console.log('🔒 Inicializando storage criptografado...');

            // Initialize encryption
            await this.initEncryption();

            // Initialize database
            await this.initDatabase();

            this.initialized = true;
            console.log('✅ Storage criptografado inicializado com sucesso');
        } catch (error) {
            console.error('❌ Falha na inicialização do storage:', error);
            throw error;
        }
    }

    async initEncryption() {
        try {
            // Check for existing key
            const keyData = localStorage.getItem('mental-ia-encryption-key');

            if (keyData) {
                // Import existing key
                const keyBuffer = this.base64ToArrayBuffer(keyData);
                this.encryptionKey = await crypto.subtle.importKey(
                    'raw',
                    keyBuffer,
                    { name: 'AES-GCM' },
                    false,
                    ['encrypt', 'decrypt']
                );
                console.log('🔑 Chave de criptografia existente carregada');
            } else {
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
                console.log('🆕 Nova chave de criptografia gerada e salva');
            }
        } catch (error) {
            console.error('❌ Erro na configuração da criptografia:', error);
            throw error;
        }
    }

    async initDatabase() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, this.dbVersion);

            request.onerror = () => {
                console.error('❌ Erro ao abrir IndexedDB:', request.error);
                reject(request.error);
            };

            request.onsuccess = (event) => {
                this.db = event.target.result;
                console.log('📊 IndexedDB conectado');
                resolve();
            };

            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                console.log('🔄 Atualizando estrutura do banco...');

                // Mood entries store
                if (!db.objectStoreNames.contains('moodEntries')) {
                    const moodStore = db.createObjectStore('moodEntries', {
                        keyPath: 'id',
                        autoIncrement: false
                    });
                    moodStore.createIndex('timestamp', 'timestamp', { unique: false });
                    moodStore.createIndex('date', 'date', { unique: false });
                    moodStore.createIndex('mood', 'mood', { unique: false });
                }

                // Settings store
                if (!db.objectStoreNames.contains('settings')) {
                    db.createObjectStore('settings', { keyPath: 'key' });
                }

                console.log('✅ Estrutura do banco criada/atualizada');
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
        await this.ensureInitialized();

        // Mutex para prevenir saves simultâneos
        if (this.saveMutex) {
            console.log('🔒 Save em andamento, aguardando...');
            while (this.saveMutex) {
                await new Promise(resolve => setTimeout(resolve, 100));
            }
        }
        this.saveMutex = true;

        try {
            // Validate input
            if (typeof moodData.mood !== 'number' || moodData.mood < 1 || moodData.mood > 10) {
                throw new Error('Valor de humor deve ser um número entre 1 e 10');
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

            console.log('💾 Salvando entrada de humor:', { id: entry.id, mood: entry.mood });

            // 🔥 FIX: Enhanced duplicate detection to prevent mixed data
            try {
                const existing = await this.getAllMoodEntries();
                const found = existing.find(e => {
                    // Exact timestamp match
                    if (e.timestamp === entry.timestamp) return true;
                    // Close timestamp match (within 5 seconds) with same mood and diary
                    try {
                        const t1 = new Date(e.timestamp).getTime();
                        const t2 = new Date(entry.timestamp).getTime();
                        if (Math.abs(t1 - t2) <= 5000 && Number(e.mood) === Number(entry.mood) && (e.diary || '') === (entry.diary || '')) return true;
                    } catch (err) {}
                    return false;
                });
                if (found) {
                    console.log('⚠️ Entrada duplicada detectada — ignorando novo insert', { existingId: found.id });
                    return found;
                }
            } catch (err) {
                console.warn('Erro ao checar duplicados (seguindo com insert):', err);
            }

            const encryptedData = await this.encrypt(entry);

            const dbEntry = {
                id: entry.id,
                timestamp: entry.timestamp,
                date: entry.date,
                mood: entry.mood,
                encryptedData: encryptedData
            };

            const transaction = this.db.transaction(['moodEntries'], 'readwrite');
            const store = transaction.objectStore('moodEntries');

            return new Promise((resolve, reject) => {
                const request = store.put(dbEntry);
                request.onsuccess = () => {
                    console.log('✅ Entrada salva com ID:', entry.id);
                    resolve(entry);
                };
                request.onerror = () => {
                    console.error('❌ Erro ao salvar entrada:', request.error);
                    reject(request.error);
                };
            });
        } finally {
            this.saveMutex = false;
        }
    }

    async deleteEntry(entryId) {
        await this.ensureInitialized();

        console.log('🗑️ Deletando entrada:', entryId);

        const transaction = this.db.transaction(['moodEntries'], 'readwrite');
        const store = transaction.objectStore('moodEntries');

        return new Promise((resolve, reject) => {
            const request = store.delete(entryId);
            request.onsuccess = () => {
                console.log('✅ Entrada deletada com ID:', entryId);
                resolve();
            };
            request.onerror = () => {
                console.error('❌ Erro ao deletar entrada:', request.error);
                reject(request.error);
            };
        });
    }

    async deleteAllEntries() {
        await this.ensureInitialized();

        console.log('🗑️ Deletando todas as entradas...');

        const transaction = this.db.transaction(['moodEntries'], 'readwrite');
        const store = transaction.objectStore('moodEntries');

        return new Promise((resolve, reject) => {
            const request = store.clear();
            request.onsuccess = () => {
                console.log('✅ Todas as entradas deletadas');
                resolve();
            };
            request.onerror = () => {
                console.error('❌ Erro ao deletar todas as entradas:', request.error);
                reject(request.error);
            };
        });
    }

    async getAllMoodEntries() {
        await this.ensureInitialized();

        const transaction = this.db.transaction(['moodEntries'], 'readonly');
        const store = transaction.objectStore('moodEntries');
        const request = store.getAll();

        return new Promise(async (resolve, reject) => {
            request.onsuccess = async () => {
                const entries = [];
                for (const dbEntry of request.result) {
                    try {
                        const decrypted = await this.decrypt(dbEntry.encryptedData);
                        entries.push(decrypted);
                    } catch (error) {
                        console.warn('⚠️ Erro ao descriptografar entrada, pulando:', error);
                    }
                }

                // Sort by timestamp (newest first)
                entries.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

                console.log(`📊 ${entries.length} entradas carregadas`);
                resolve(entries);
            };
            request.onerror = () => reject(request.error);
        });
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

        let streak = 0;
        const today = new Date().toDateString();

        for (const entry of entries) {
            const entryDate = new Date(entry.timestamp).toDateString();
            if (entryDate === today) {
                streak++;
                break;
            }
        }

        return streak;
    }

    calculateTrend(entries) {
        if (entries.length < 2) return 'neutral';

        const recent = entries.slice(0, 7); // Last 7 entries
        const avgRecent = recent.reduce((sum, e) => sum + e.mood, 0) / recent.length;

        const older = entries.slice(7, 14);
        if (older.length === 0) return 'neutral';

        const avgOlder = older.reduce((sum, e) => sum + e.mood, 0) / older.length;

        const diff = avgRecent - avgOlder;
        if (diff > 0.5) return 'improving';
        if (diff < -0.5) return 'declining';
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

    async ensureInitialized() {
        if (!this.initialized) {
            await this.init();
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
const methodsToWrap = ['saveMoodEntry', 'getAllMoodEntries', 'getStats', 'saveSetting', 'getSetting', 'deleteEntry', 'deleteAllEntries'];

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