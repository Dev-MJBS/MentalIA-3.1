// MentalIA 3.0 - Encrypted Local Storage
// IndexedDB with AES encryption for maximum privacy

class MentalStorage {
    constructor() {
        this.dbName = 'MentalIA-DB';
        this.dbVersion = 1;
        this.db = null;
        this.encryptionKey = null;
    }

    async init() {
        try {
            // Initialize encryption key
            await this.initEncryption();
            
            // Initialize IndexedDB
            await this.initDatabase();
            
            console.log('🔒 Storage criptografado inicializado');
            return true;
        } catch (error) {
            console.error('Erro ao inicializar storage:', error);
            throw error;
        }
    }

    async initEncryption() {
        try {
            // Check if we have a stored key
            let keyData = localStorage.getItem('mental-ia-key');
            
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
            } else {
                // Generate new key
                this.encryptionKey = await crypto.subtle.generateKey(
                    { name: 'AES-GCM', length: 256 },
                    true,
                    ['encrypt', 'decrypt']
                );
                
                // Export and store key
                const keyBuffer = await crypto.subtle.exportKey('raw', this.encryptionKey);
                const keyB64 = this.arrayBufferToBase64(keyBuffer);
                localStorage.setItem('mental-ia-key', keyB64);
            }
            
            console.log('🔐 Chave de criptografia configurada');
        } catch (error) {
            console.error('Erro na inicialização da criptografia:', error);
            throw error;
        }
    }

    async initDatabase() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, this.dbVersion);
            
            request.onerror = () => {
                console.error('Erro ao abrir IndexedDB:', request.error);
                reject(request.error);
            };
            
            request.onsuccess = () => {
                this.db = request.result;
                resolve();
            };
            
            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                
                // Create mood entries store
                if (!db.objectStoreNames.contains('moodEntries')) {
                    const moodStore = db.createObjectStore('moodEntries', {
                        keyPath: 'id',
                        autoIncrement: true
                    });
                    moodStore.createIndex('timestamp', 'timestamp', { unique: false });
                    moodStore.createIndex('date', 'date', { unique: false });
                }
                
                // Create settings store
                if (!db.objectStoreNames.contains('settings')) {
                    db.createObjectStore('settings', {
                        keyPath: 'key'
                    });
                }
                
                // Create backup store
                if (!db.objectStoreNames.contains('backups')) {
                    const backupStore = db.createObjectStore('backups', {
                        keyPath: 'id',
                        autoIncrement: true
                    });
                    backupStore.createIndex('timestamp', 'timestamp', { unique: false });
                }
                
                console.log('📄 Estrutura do banco criada');
            };
        });
    }

    async encrypt(data) {
        try {
            const jsonString = JSON.stringify(data);
            const textEncoder = new TextEncoder();
            const dataBuffer = textEncoder.encode(jsonString);
            
            // Generate random IV
            const iv = crypto.getRandomValues(new Uint8Array(12));
            
            // Encrypt data
            const encryptedBuffer = await crypto.subtle.encrypt(
                { name: 'AES-GCM', iv: iv },
                this.encryptionKey,
                dataBuffer
            );
            
            // Combine IV and encrypted data
            const combined = new Uint8Array(iv.length + encryptedBuffer.byteLength);
            combined.set(iv);
            combined.set(new Uint8Array(encryptedBuffer), iv.length);
            
            return this.arrayBufferToBase64(combined);
        } catch (error) {
            console.error('Erro na criptografia:', error);
            throw error;
        }
    }

    async decrypt(encryptedData) {
        try {
            const combined = this.base64ToArrayBuffer(encryptedData);
            
            // Extract IV and encrypted data
            const iv = combined.slice(0, 12);
            const encryptedBuffer = combined.slice(12);
            
            // Decrypt data
            const decryptedBuffer = await crypto.subtle.decrypt(
                { name: 'AES-GCM', iv: iv },
                this.encryptionKey,
                encryptedBuffer
            );
            
            // Convert back to string and parse JSON
            const textDecoder = new TextDecoder();
            const jsonString = textDecoder.decode(decryptedBuffer);
            
            return JSON.parse(jsonString);
        } catch (error) {
            console.error('Erro na descriptografia:', error);
            throw error;
        }
    }

    async saveMoodEntry(moodData) {
        try {
            if (!this.db) {
                await this.init();
            }
            
            // Add metadata
            const entryWithMeta = {
                ...moodData,
                id: Date.now() + Math.random(), // Unique ID
                createdAt: new Date().toISOString(),
                version: '3.0'
            };
            
            // Encrypt the data
            const encryptedData = await this.encrypt(entryWithMeta);
            
            // Store encrypted data
            const transaction = this.db.transaction(['moodEntries'], 'readwrite');
            const store = transaction.objectStore('moodEntries');
            
            const request = store.add({
                id: entryWithMeta.id,
                timestamp: entryWithMeta.timestamp,
                date: entryWithMeta.date,
                encryptedData: encryptedData
            });
            
            return new Promise((resolve, reject) => {
                request.onsuccess = () => {
                    console.log('💾 Registro de humor salvo e criptografado');
                    resolve(entryWithMeta);
                };
                request.onerror = () => {
                    console.error('Erro ao salvar registro:', request.error);
                    reject(request.error);
                };
            });
        } catch (error) {
            console.error('Erro ao salvar entrada de humor:', error);
            throw error;
        }
    }

    async getAllMoodEntries() {
        try {
            if (!this.db) {
                await this.init();
            }
            
            const transaction = this.db.transaction(['moodEntries'], 'readonly');
            const store = transaction.objectStore('moodEntries');
            const request = store.getAll();
            
            return new Promise(async (resolve, reject) => {
                request.onsuccess = async () => {
                    try {
                        const encryptedEntries = request.result;
                        const decryptedEntries = [];
                        
                        // Decrypt all entries
                        for (const entry of encryptedEntries) {
                            try {
                                const decryptedData = await this.decrypt(entry.encryptedData);
                                decryptedEntries.push(decryptedData);
                            } catch (decryptError) {
                                console.warn('Erro ao descriptografar entrada, ignorando:', decryptError);
                                // Skip corrupted entries
                            }
                        }
                        
                        console.log(`📊 ${decryptedEntries.length} registros carregados`);
                        resolve(decryptedEntries);
                    } catch (error) {
                        reject(error);
                    }
                };
                request.onerror = () => {
                    console.error('Erro ao carregar registros:', request.error);
                    reject(request.error);
                };
            });
        } catch (error) {
            console.error('Erro ao buscar entradas de humor:', error);
            throw error;
        }
    }

    async getMoodEntriesByDateRange(startDate, endDate) {
        try {
            const allEntries = await this.getAllMoodEntries();
            
            return allEntries.filter(entry => {
                const entryDate = new Date(entry.timestamp);
                return entryDate >= startDate && entryDate <= endDate;
            });
        } catch (error) {
            console.error('Erro ao buscar registros por data:', error);
            throw error;
        }
    }

    async deleteMoodEntry(entryId) {
        try {
            if (!this.db) {
                await this.init();
            }
            
            const transaction = this.db.transaction(['moodEntries'], 'readwrite');
            const store = transaction.objectStore('moodEntries');
            const request = store.delete(entryId);
            
            return new Promise((resolve, reject) => {
                request.onsuccess = () => {
                    console.log('🗑️ Registro removido');
                    resolve();
                };
                request.onerror = () => {
                    console.error('Erro ao remover registro:', request.error);
                    reject(request.error);
                };
            });
        } catch (error) {
            console.error('Erro ao deletar entrada:', error);
            throw error;
        }
    }

    async saveSetting(key, value) {
        try {
            if (!this.db) {
                await this.init();
            }
            
            const encryptedValue = await this.encrypt(value);
            
            const transaction = this.db.transaction(['settings'], 'readwrite');
            const store = transaction.objectStore('settings');
            const request = store.put({
                key: key,
                encryptedValue: encryptedValue,
                updatedAt: new Date().toISOString()
            });
            
            return new Promise((resolve, reject) => {
                request.onsuccess = () => {
                    console.log(`⚙️ Configuração '${key}' salva`);
                    resolve();
                };
                request.onerror = () => {
                    console.error('Erro ao salvar configuração:', request.error);
                    reject(request.error);
                };
            });
        } catch (error) {
            console.error('Erro ao salvar configuração:', error);
            throw error;
        }
    }

    async getSetting(key, defaultValue = null) {
        try {
            if (!this.db) {
                await this.init();
            }
            
            const transaction = this.db.transaction(['settings'], 'readonly');
            const store = transaction.objectStore('settings');
            const request = store.get(key);
            
            return new Promise(async (resolve, reject) => {
                request.onsuccess = async () => {
                    try {
                        if (request.result) {
                            const decryptedValue = await this.decrypt(request.result.encryptedValue);
                            resolve(decryptedValue);
                        } else {
                            resolve(defaultValue);
                        }
                    } catch (error) {
                        console.warn(`Erro ao descriptografar configuração '${key}':`, error);
                        resolve(defaultValue);
                    }
                };
                request.onerror = () => {
                    console.error('Erro ao buscar configuração:', request.error);
                    resolve(defaultValue);
                };
            });
        } catch (error) {
            console.error('Erro ao obter configuração:', error);
            return defaultValue;
        }
    }

    async exportData() {
        try {
            const moodEntries = await this.getAllMoodEntries();
            const settings = await this.getAllSettings();
            
            const exportData = {
                version: '3.0',
                exportDate: new Date().toISOString(),
                moodEntries: moodEntries,
                settings: settings,
                checksum: this.generateChecksum(moodEntries, settings)
            };
            
            // Double encrypt for export
            const encryptedExport = await this.encrypt(exportData);
            
            console.log('📤 Dados exportados e criptografados');
            return encryptedExport;
        } catch (error) {
            console.error('Erro ao exportar dados:', error);
            throw error;
        }
    }

    async importData(encryptedData) {
        try {
            // Decrypt import data
            const importData = await this.decrypt(encryptedData);
            
            // Validate data structure
            if (!importData.version || !importData.moodEntries) {
                throw new Error('Formato de dados inválido');
            }
            
            // Verify checksum
            const calculatedChecksum = this.generateChecksum(importData.moodEntries, importData.settings || {});
            if (importData.checksum !== calculatedChecksum) {
                console.warn('Checksum não confere, dados podem estar corrompidos');
            }
            
            // Clear existing data (with confirmation in real app)
            await this.clearAllData();
            
            // Import mood entries
            for (const entry of importData.moodEntries) {
                await this.saveMoodEntry(entry);
            }
            
            // Import settings
            if (importData.settings) {
                for (const [key, value] of Object.entries(importData.settings)) {
                    await this.saveSetting(key, value);
                }
            }
            
            console.log('📥 Dados importados com sucesso');
            return true;
        } catch (error) {
            console.error('Erro ao importar dados:', error);
            throw error;
        }
    }

    async getAllSettings() {
        try {
            if (!this.db) {
                await this.init();
            }
            
            const transaction = this.db.transaction(['settings'], 'readonly');
            const store = transaction.objectStore('settings');
            const request = store.getAll();
            
            return new Promise(async (resolve, reject) => {
                request.onsuccess = async () => {
                    try {
                        const encryptedSettings = request.result;
                        const settings = {};
                        
                        for (const setting of encryptedSettings) {
                            try {
                                settings[setting.key] = await this.decrypt(setting.encryptedValue);
                            } catch (decryptError) {
                                console.warn(`Erro ao descriptografar configuração '${setting.key}':`, decryptError);
                            }
                        }
                        
                        resolve(settings);
                    } catch (error) {
                        reject(error);
                    }
                };
                request.onerror = () => {
                    reject(request.error);
                };
            });
        } catch (error) {
            console.error('Erro ao buscar configurações:', error);
            throw error;
        }
    }

    async clearAllData() {
        try {
            if (!this.db) {
                await this.init();
            }
            
            const transaction = this.db.transaction(['moodEntries', 'settings', 'backups'], 'readwrite');
            
            const promises = [
                transaction.objectStore('moodEntries').clear(),
                transaction.objectStore('settings').clear(),
                transaction.objectStore('backups').clear()
            ];
            
            await Promise.all(promises);
            
            console.log('🧹 Todos os dados foram limpos');
            return true;
        } catch (error) {
            console.error('Erro ao limpar dados:', error);
            throw error;
        }
    }

    generateChecksum(moodEntries, settings) {
        const data = JSON.stringify({ moodEntries, settings });
        let hash = 0;
        for (let i = 0; i < data.length; i++) {
            const char = data.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32-bit integer
        }
        return hash.toString();
    }

    // Utility functions for base64 conversion
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

    // Database statistics
    async getStorageStats() {
        try {
            const moodEntries = await this.getAllMoodEntries();
            const settings = await this.getAllSettings();
            
            // Estimate storage usage (rough calculation)
            const moodDataSize = JSON.stringify(moodEntries).length;
            const settingsDataSize = JSON.stringify(settings).length;
            
            return {
                totalEntries: moodEntries.length,
                totalSettings: Object.keys(settings).length,
                estimatedSize: moodDataSize + settingsDataSize,
                oldestEntry: moodEntries.length > 0 ? 
                    moodEntries.reduce((oldest, entry) => 
                        new Date(entry.timestamp) < new Date(oldest.timestamp) ? entry : oldest
                    ).timestamp : null,
                newestEntry: moodEntries.length > 0 ? 
                    moodEntries.reduce((newest, entry) => 
                        new Date(entry.timestamp) > new Date(newest.timestamp) ? entry : newest
                    ).timestamp : null
            };
        } catch (error) {
            console.error('Erro ao obter estatísticas:', error);
            throw error;
        }
    }
}

// Initialize and expose globally
window.mentalStorage = new MentalStorage();

// Auto-initialize when storage is first accessed
const originalMethods = ['saveMoodEntry', 'getAllMoodEntries', 'getSetting', 'saveSetting'];
originalMethods.forEach(method => {
    const original = window.mentalStorage[method];
    window.mentalStorage[method] = async function(...args) {
        if (!this.db) {
            await this.init();
        }
        return original.apply(this, args);
    };
});

console.log('🔒 Sistema de storage criptografado carregado');