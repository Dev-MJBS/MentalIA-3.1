// MentalIA 3.0 - Google Drive Encrypted Backup
// Secure backup to Google Drive appDataFolder with end-to-end encryption

class GoogleDriveBackup {
    constructor() {
        this.isInitialized = false;
        this.accessToken = null;
        this.clientId = null;
        this.apiKey = null;
        
        // Google Drive API configuration
        this.discoveryDoc = 'https://www.googleapis.com/discovery/v1/apis/drive/v3/rest';
        this.scopes = 'https://www.googleapis.com/auth/drive.appdata';
        
        // Backup file configuration
        this.backupFileName = 'mental-ia-backup-encrypted.json';
        this.backupMimeType = 'application/json';
    }

    async init() {
        try {
            console.log('☁️ Inicializando módulo de backup...');
            
            // Load Google API credentials from storage
            await this.loadCredentials();
            
            // Initialize Google APIs if credentials are available
            if (this.clientId && this.apiKey) {
                await this.initGoogleApis();
            }
            
            console.log('✅ Módulo de backup inicializado');
            return true;
        } catch (error) {
            console.error('Erro ao inicializar backup:', error);
            return false;
        }
    }

    async loadCredentials() {
        try {
            // Load from secure storage
            this.clientId = await window.mentalStorage.getSetting('google-client-id');
            this.apiKey = await window.mentalStorage.getSetting('google-api-key');
            
            if (!this.clientId || !this.apiKey) {
                console.log('🔧 Credenciais do Google Drive não configuradas');
                return false;
            }
            
            return true;
        } catch (error) {
            console.error('Erro ao carregar credenciais:', error);
            return false;
        }
    }

    async initGoogleApis() {
        return new Promise((resolve, reject) => {
            // Load Google APIs dynamically
            if (typeof gapi === 'undefined') {
                const script = document.createElement('script');
                script.src = 'https://apis.google.com/js/api.js';
                script.onload = () => {
                    this.loadGapi().then(resolve).catch(reject);
                };
                script.onerror = () => reject(new Error('Falha ao carregar Google APIs'));
                document.head.appendChild(script);
            } else {
                this.loadGapi().then(resolve).catch(reject);
            }
        });
    }

    async loadGapi() {
        return new Promise((resolve, reject) => {
            gapi.load('client:auth2', {
                callback: async () => {
                    try {
                        await gapi.client.init({
                            apiKey: this.apiKey,
                            clientId: this.clientId,
                            discoveryDocs: [this.discoveryDoc],
                            scope: this.scopes
                        });
                        
                        this.isInitialized = true;
                        console.log('🔗 Google APIs inicializadas');
                        resolve();
                    } catch (error) {
                        console.error('Erro ao inicializar Google APIs:', error);
                        reject(error);
                    }
                },
                onerror: () => {
                    reject(new Error('Erro ao carregar Google APIs'));
                }
            });
        });
    }

    async authenticate() {
        try {
            if (!this.isInitialized) {
                await this.init();
            }

            const authInstance = gapi.auth2.getAuthInstance();
            
            if (!authInstance.isSignedIn.get()) {
                console.log('🔐 Solicitando autenticação...');
                const user = await authInstance.signIn();
                this.accessToken = user.getAuthResponse().access_token;
            } else {
                this.accessToken = authInstance.currentUser.get().getAuthResponse().access_token;
            }
            
            console.log('✅ Autenticado no Google Drive');
            return true;
        } catch (error) {
            console.error('Erro na autenticação:', error);
            throw new Error('Falha na autenticação com Google Drive');
        }
    }

    async backupToGoogleDrive() {
        try {
            if (!this.clientId || !this.apiKey) {
                throw new Error('Configure as credenciais do Google Drive primeiro');
            }

            // Authenticate user
            await this.authenticate();
            
            // Export encrypted data from storage
            console.log('📤 Exportando dados...');
            const encryptedData = await window.mentalStorage.exportData();
            
            // Create backup metadata
            const backupData = {
                version: '3.0',
                backupDate: new Date().toISOString(),
                deviceInfo: {
                    userAgent: navigator.userAgent,
                    timestamp: Date.now()
                },
                encryptedData: encryptedData
            };
            
            // Check if backup file already exists
            const existingFile = await this.findBackupFile();
            
            if (existingFile) {
                // Update existing file
                await this.updateFile(existingFile.id, backupData);
                console.log('📁 Backup atualizado no Google Drive');
            } else {
                // Create new file
                await this.createFile(backupData);
                console.log('📁 Backup criado no Google Drive');
            }
            
            // Save backup timestamp
            await window.mentalStorage.saveSetting('last-backup', new Date().toISOString());
            
            return true;
        } catch (error) {
            console.error('Erro no backup:', error);
            throw error;
        }
    }

    async restoreFromGoogleDrive() {
        try {
            if (!this.clientId || !this.apiKey) {
                throw new Error('Configure as credenciais do Google Drive primeiro');
            }

            // Authenticate user
            await this.authenticate();
            
            // Find backup file
            console.log('🔍 Procurando backup...');
            const backupFile = await this.findBackupFile();
            
            if (!backupFile) {
                throw new Error('Nenhum backup encontrado no Google Drive');
            }
            
            // Download backup data
            console.log('📥 Baixando backup...');
            const backupData = await this.downloadFile(backupFile.id);
            
            // Validate backup data
            if (!backupData.encryptedData || !backupData.version) {
                throw new Error('Formato de backup inválido');
            }
            
            // Import data to storage
            console.log('📥 Restaurando dados...');
            await window.mentalStorage.importData(backupData.encryptedData);
            
            // Save restore timestamp
            await window.mentalStorage.saveSetting('last-restore', new Date().toISOString());
            
            return true;
        } catch (error) {
            console.error('Erro na restauração:', error);
            throw error;
        }
    }

    async findBackupFile() {
        try {
            const response = await gapi.client.drive.files.list({
                q: `name='${this.backupFileName}' and parents in 'appDataFolder'`,
                spaces: 'appDataFolder',
                fields: 'files(id, name, modifiedTime, size)'
            });
            
            const files = response.result.files;
            return files.length > 0 ? files[0] : null;
        } catch (error) {
            console.error('Erro ao procurar arquivo de backup:', error);
            throw error;
        }
    }

    async createFile(backupData) {
        try {
            const fileMetadata = {
                name: this.backupFileName,
                parents: ['appDataFolder']
            };
            
            const form = new FormData();
            form.append('metadata', new Blob([JSON.stringify(fileMetadata)], {
                type: 'application/json'
            }));
            form.append('file', new Blob([JSON.stringify(backupData)], {
                type: this.backupMimeType
            }));
            
            const response = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.accessToken}`
                },
                body: form
            });
            
            if (!response.ok) {
                throw new Error(`Erro ao criar arquivo: ${response.statusText}`);
            }
            
            return await response.json();
        } catch (error) {
            console.error('Erro ao criar arquivo:', error);
            throw error;
        }
    }

    async updateFile(fileId, backupData) {
        try {
            const response = await fetch(`https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=media`, {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${this.accessToken}`,
                    'Content-Type': this.backupMimeType
                },
                body: JSON.stringify(backupData)
            });
            
            if (!response.ok) {
                throw new Error(`Erro ao atualizar arquivo: ${response.statusText}`);
            }
            
            return await response.json();
        } catch (error) {
            console.error('Erro ao atualizar arquivo:', error);
            throw error;
        }
    }

    async downloadFile(fileId) {
        try {
            const response = await gapi.client.drive.files.get({
                fileId: fileId,
                alt: 'media'
            });
            
            return JSON.parse(response.body);
        } catch (error) {
            console.error('Erro ao baixar arquivo:', error);
            throw error;
        }
    }

    async getBackupInfo() {
        try {
            if (!this.isInitialized) {
                await this.init();
            }

            if (!this.clientId || !this.apiKey) {
                return {
                    hasCredentials: false,
                    lastBackup: await window.mentalStorage.getSetting('last-backup'),
                    lastRestore: await window.mentalStorage.getSetting('last-restore')
                };
            }

            // Try to authenticate silently
            try {
                await this.authenticate();
                const backupFile = await this.findBackupFile();
                
                return {
                    hasCredentials: true,
                    isAuthenticated: !!this.accessToken,
                    hasBackup: !!backupFile,
                    backupDate: backupFile?.modifiedTime,
                    backupSize: backupFile?.size,
                    lastBackup: await window.mentalStorage.getSetting('last-backup'),
                    lastRestore: await window.mentalStorage.getSetting('last-restore')
                };
            } catch (authError) {
                return {
                    hasCredentials: true,
                    isAuthenticated: false,
                    hasBackup: false,
                    lastBackup: await window.mentalStorage.getSetting('last-backup'),
                    lastRestore: await window.mentalStorage.getSetting('last-restore')
                };
            }
        } catch (error) {
            console.error('Erro ao obter informações de backup:', error);
            return {
                hasCredentials: false,
                error: error.message
            };
        }
    }

    async setupCredentials(clientId, apiKey) {
        try {
            // Save credentials securely
            await window.mentalStorage.saveSetting('google-client-id', clientId);
            await window.mentalStorage.saveSetting('google-api-key', apiKey);
            
            // Update instance variables
            this.clientId = clientId;
            this.apiKey = apiKey;
            
            // Reinitialize with new credentials
            await this.initGoogleApis();
            
            console.log('🔧 Credenciais do Google Drive configuradas');
            return true;
        } catch (error) {
            console.error('Erro ao configurar credenciais:', error);
            throw error;
        }
    }

    async removeCredentials() {
        try {
            // Remove stored credentials
            await window.mentalStorage.saveSetting('google-client-id', null);
            await window.mentalStorage.saveSetting('google-api-key', null);
            
            // Clear instance variables
            this.clientId = null;
            this.apiKey = null;
            this.accessToken = null;
            this.isInitialized = false;
            
            // Sign out if authenticated
            if (typeof gapi !== 'undefined' && gapi.auth2) {
                const authInstance = gapi.auth2.getAuthInstance();
                if (authInstance && authInstance.isSignedIn.get()) {
                    await authInstance.signOut();
                }
            }
            
            console.log('🗑️ Credenciais do Google Drive removidas');
            return true;
        } catch (error) {
            console.error('Erro ao remover credenciais:', error);
            throw error;
        }
    }

    // Utility method to show setup instructions
    getSetupInstructions() {
        return `
# Configuração do Google Drive Backup

Para habilitar o backup automático no Google Drive:

## 1. Configurar Google Cloud Project
1. Acesse: https://console.cloud.google.com/
2. Crie um novo projeto ou selecione um existente
3. Habilite a API do Google Drive
4. Vá em "Credenciais" e crie uma "Chave de API"
5. Crie um "ID do cliente OAuth 2.0" para aplicação web

## 2. Configurar no App
1. Acesse: Configurações > Backup
2. Insira o Client ID e API Key
3. Autorize o acesso ao Google Drive

## 3. Domínios Autorizados
Adicione seu domínio (ex: localhost:3000, seusite.com) 
nas "Origens JavaScript autorizadas" do OAuth.

**Nota**: Os dados são criptografados antes do upload.
Apenas você pode descriptografar seus backups.
        `;
    }

    // Method to create a simple backup without Google Drive (for testing)
    async createLocalBackup() {
        try {
            const encryptedData = await window.mentalStorage.exportData();
            
            const backupData = {
                version: '3.0',
                backupDate: new Date().toISOString(),
                encryptedData: encryptedData
            };
            
            // Create download link
            const blob = new Blob([JSON.stringify(backupData, null, 2)], {
                type: 'application/json'
            });
            
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `mental-ia-backup-${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            
            console.log('💾 Backup local criado');
            return true;
        } catch (error) {
            console.error('Erro ao criar backup local:', error);
            throw error;
        }
    }

    // Method to restore from local file
    async restoreFromLocalFile(file) {
        try {
            const text = await file.text();
            const backupData = JSON.parse(text);
            
            if (!backupData.encryptedData || !backupData.version) {
                throw new Error('Formato de backup inválido');
            }
            
            await window.mentalStorage.importData(backupData.encryptedData);
            
            console.log('📥 Backup local restaurado');
            return true;
        } catch (error) {
            console.error('Erro ao restaurar backup local:', error);
            throw error;
        }
    }
}

// Initialize and expose globally
window.googleDriveBackup = new GoogleDriveBackup();

// Auto-initialize when first used
const originalMethods = ['backupToGoogleDrive', 'restoreFromGoogleDrive', 'getBackupInfo'];
originalMethods.forEach(method => {
    const original = window.googleDriveBackup[method];
    window.googleDriveBackup[method] = async function(...args) {
        if (!this.isInitialized && this.clientId && this.apiKey) {
            await this.init();
        }
        return original.apply(this, args);
    };
});

console.log('☁️ Módulo de backup do Google Drive carregado');