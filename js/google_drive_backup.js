/**
 * Google Drive Backup System for MentalIA-3.1
 * Corrected One Tap + OAuth2 token client flow
 * Portuguese messages, auto backup/restore to appDataFolder
 */

class GoogleDriveBackup {
    constructor() {
        // Load credentials dynamically at runtime
        this.loadCredentials();

        this.scopes = 'https://www.googleapis.com/auth/drive.appdata';
        this.isSignedIn = false;
        this.accessToken = null;
        this.tokenClient = null;

        console.log('☁️ [BACKUP] Inicializando sistema de backup Google Drive...');
        this.init();
    }

    loadCredentials() {
        if (window.GOOGLE_CREDENTIALS && window.GOOGLE_CREDENTIALS.client_id) {
            this.clientId = window.GOOGLE_CREDENTIALS.client_id;
            console.log('✅ [BACKUP] Credenciais Google carregadas');
        } else {
            this.clientId = null;
            console.warn('⚠️ [BACKUP] Credenciais Google não configuradas');
            this.showToast('Configure suas credenciais Google no console do Google Cloud', 'warning');
        }
    }

    async init() {
        if (!this.clientId) {
            console.log('☁️ [BACKUP] Client ID não disponível, pulando inicialização');
            window.googleDriveBackup = this;
            this.updateBackupStatus(false, 'Credenciais não configuradas');
            return;
        }

        try {
            // Check if Google Identity Services are available
            if (typeof google === 'undefined' || !google.accounts || !google.accounts.id) {
                console.log('☁️ [BACKUP] Google APIs não disponíveis (offline), pulando inicialização');
                window.googleDriveBackup = this;
                this.updateBackupStatus(false, 'Modo offline - backup indisponível');
                return;
            }

            await this.waitForGoogleIdentityServices();

            // Initialize One Tap to receive credential (ID token)
            google.accounts.id.initialize({
                client_id: this.clientId,
                callback: this.handleCredentialResponse.bind(this),
                auto_select: false,
                cancel_on_tap_outside: true
            });

            // Initialize token client for Drive access
            this.tokenClient = google.accounts.oauth2.initTokenClient({
                client_id: this.clientId,
                scope: this.scopes,
                callback: (tokenResponse) => {
                    if (tokenResponse && tokenResponse.access_token) {
                        this.accessToken = tokenResponse.access_token;
                        this.isSignedIn = true;
                        console.log('✅ [TOKEN] Access token obtido');
                        this.postSignInActions();
                    } else {
                        console.warn('⚠️ [TOKEN] Resposta sem access_token', tokenResponse);
                    }
                }
            });

            // Render One Tap button
            this.renderOneTapButton();

            window.googleDriveBackup = this;
            this.updateBackupStatus(false, 'Pronto para login');
        } catch (error) {
            console.error('❌ [INIT] Erro ao inicializar:', error);
            this.updateBackupStatus(false, 'Erro na inicialização');
        }
    }

    renderOneTapButton() {
        const buttonContainer = document.getElementById('google-backup-btn');
        if (buttonContainer) {
            google.accounts.id.renderButton(buttonContainer, {
                theme: 'outline',
                size: 'large',
                text: 'signin_with',
                shape: 'rectangular'
            });
        }
    }

    async waitForGoogleIdentityServices() {
        return new Promise((resolve, reject) => {
            let attempts = 0;
            const maxAttempts = 50;
            const checkServices = () => {
                attempts++;
                if (typeof google !== 'undefined' && google.accounts && google.accounts.id && google.accounts.oauth2) {
                    resolve();
                } else if (attempts >= maxAttempts) {
                    reject(new Error('Google Identity Services não carregou'));
                } else {
                    setTimeout(checkServices, 100);
                }
            };
            checkServices();
        });
    }

    async handleCredentialResponse(response) {
        try {
            if (!response || !response.credential) {
                console.warn('⚠️ [ONE TAP] Resposta inválida');
                return;
            }

            console.log('🔐 [ONE TAP] Credencial recebida');
            const payload = this.parseJWT(response.credential);
            const email = payload && payload.email ? payload.email : 'usuário';
            console.log('✅ [ONE TAP] Usuário autenticado:', email);

            // Request an OAuth access token for Drive API
            this.tokenClient.requestAccessToken({ prompt: '' });
        } catch (error) {
            console.error('❌ [ONE TAP] Erro ao processar credencial:', error);
        }
    }

    parseJWT(token) {
        try {
            const base64Url = token.split('.')[1];
            const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
            const jsonPayload = decodeURIComponent(atob(base64).split('').map(c =>
                '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)
            ).join(''));
            return JSON.parse(jsonPayload);
        } catch (err) {
            console.warn('⚠️ [JWT] Falha ao decodificar JWT:', err);
            return null;
        }
    }

    async postSignInActions() {
        try {
            this.updateBackupStatus(true, 'Sincronizando...');

            // 🔥 FIX: Always try to restore from Drive first (source of truth)
            console.log('🔄 [SYNC] Tentando restaurar backup da nuvem...');
            const restored = await this.downloadAndRestoreBackup(false); // false = overwrite mode

            if (restored) {
                // Backup restored successfully - local DB now matches cloud
                const entries = await this.getMoodEntries();
                this.showToast(`Restaurado ${entries.length} entradas do backup`, 'success');
                this.updateBackupStatus(true, 'Sincronizado com a nuvem');
                console.log('✅ [SYNC] Dados locais sincronizados com a nuvem');
            } else {
                // No backup found - upload current local entries to cloud
                console.log('🔄 [SYNC] Nenhum backup encontrado, fazendo upload dos dados locais...');
                await this.backupToDrive({ showToasts: false });
                this.showToast('Sincronizado com a nuvem', 'success');
                this.updateBackupStatus(true, 'Sincronizado com a nuvem');
            }
        } catch (err) {
            console.error('❌ [POST SIGNIN] Erro na sincronização:', err);
            this.updateBackupStatus(false, 'Erro na sincronização');
            this.showToast('Erro na sincronização com a nuvem', 'error');
        }
    }

    async backupToDrive(options = { showToasts: false }) {
        try {
            console.log('📤 [BACKUP] Iniciando backup...');

            if (!this.isSignedIn || !this.accessToken) {
                throw new Error('Usuário não autenticado');
            }

            this.updateBackupStatus(true, 'Preparando dados...');

            // Get data from storage
            const entries = await this.getMoodEntries();
            if (!entries || entries.length === 0) {
                if (options.showToasts) this.showToast('Nenhum dado para backup', 'warning');
                return false;
            }

            // Prepare backup data
            const backupData = {
                version: '3.1',
                timestamp: new Date().toISOString(),
                entries: entries,
                totalEntries: entries.length
            };

            this.updateBackupStatus(true, 'Criptografando...');

            // Encrypt data
            const encryptedData = await this.encryptData(JSON.stringify(backupData));

            this.updateBackupStatus(true, 'Enviando para Drive...');

            // Upload to Drive
            const success = await this.uploadEncryptedFile(encryptedData);

            if (success) {
                if (options.showToasts) this.showToast('Backup salvo na nuvem! ☁️', 'success');
                this.updateBackupStatus(true, 'Backup salvo na nuvem');
                return true;
            } else {
                throw new Error('Falha no upload');
            }

        } catch (error) {
            console.error('❌ [BACKUP] Erro no backup:', error);
            this.updateBackupStatus(false, 'Erro no backup');
            if (options.showToasts) this.showToast('Erro no backup: ' + error.message, 'error');
            return false;
        }
    }

    async getMoodEntries() {
        try {
            if (window.mentalStorage && typeof window.mentalStorage.getAllMoodEntries === 'function') {
                return await window.mentalStorage.getAllMoodEntries();
            }
            return [];
        } catch (err) {
            console.error('❌ [STORAGE] Erro ao obter dados:', err);
            return [];
        }
    }

    async encryptData(data) {
        try {
            const key = await this.generateEncryptionKey();
            const iv = crypto.getRandomValues(new Uint8Array(12));
            const encrypted = await crypto.subtle.encrypt(
                { name: 'AES-GCM', iv },
                key,
                new TextEncoder().encode(data)
            );
            const result = new Uint8Array(iv.length + encrypted.byteLength);
            result.set(iv);
            result.set(new Uint8Array(encrypted), iv.length);
            return btoa(String.fromCharCode.apply(null, result));
        } catch (err) {
            console.error('❌ [ENCRYPT] Erro na criptografia:', err);
            throw err;
        }
    }

    async decryptData(encryptedB64) {
        try {
            const combined = Uint8Array.from(atob(encryptedB64), c => c.charCodeAt(0));
            const iv = combined.slice(0, 12);
            const encrypted = combined.slice(12);
            const key = await this.generateEncryptionKey();
            const decrypted = await crypto.subtle.decrypt(
                { name: 'AES-GCM', iv },
                key,
                encrypted
            );
            return new TextDecoder().decode(decrypted);
        } catch (err) {
            console.error('❌ [DECRYPT] Erro na descriptografia:', err);
            throw err;
        }
    }

    async generateEncryptionKey() {
        const fingerprint = this.generateDeviceFingerprint();
        const keyMaterial = await crypto.subtle.importKey(
            'raw',
            new TextEncoder().encode(fingerprint),
            'PBKDF2',
            false,
            ['deriveKey']
        );
        return await crypto.subtle.deriveKey(
            {
                name: 'PBKDF2',
                salt: new TextEncoder().encode('MentalIA-Backup-Salt-2024'),
                iterations: 100000,
                hash: 'SHA-256'
            },
            keyMaterial,
            { name: 'AES-GCM', length: 256 },
            false,
            ['encrypt', 'decrypt']
        );
    }

    generateDeviceFingerprint() {
        const components = [
            navigator.userAgent,
            navigator.language,
            screen.width + 'x' + screen.height,
            new Date().getTimezoneOffset().toString()
        ];
        return 'MentalIA-' + btoa(components.join('|')).substring(0, 32);
    }

    async uploadEncryptedFile(encryptedData) {
        try {
            console.log('☁️ [UPLOAD] Fazendo upload...');

            const metadata = {
                name: 'MentalIA_backup.enc',
                parents: ['appDataFolder']
            };

            const form = new FormData();
            form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
            form.append('file', new Blob([encryptedData], { type: 'application/octet-stream' }));

            const response = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.accessToken}`
                },
                body: form
            });

            if (response.ok) {
                const result = await response.json();
                console.log('✅ [UPLOAD] Upload concluído:', result.id);
                return true;
            } else {
                console.error('❌ [UPLOAD] Erro na resposta:', response.status);
                return false;
            }

        } catch (error) {
            console.error('❌ [UPLOAD] Erro no upload:', error);
            return false;
        }
    }

    async downloadAndRestoreBackup(overwriteMode = false) {
        try {
            console.log('📥 [RESTORE] Iniciando restauração...');

            if (!this.accessToken) {
                console.log('📥 [RESTORE] Sem access token');
                return false;
            }

            // Find existing backup file
            const fileId = await this.findBackupFile();
            if (!fileId) {
                console.log('📥 [RESTORE] Nenhum backup encontrado');
                return false;
            }

            // Download and decrypt
            const encryptedData = await this.downloadFile(fileId);
            const decryptedData = await this.decryptData(encryptedData);
            const backupData = JSON.parse(decryptedData);

            if (!backupData || !backupData.entries || backupData.entries.length === 0) {
                console.log('📥 [RESTORE] Backup vazio ou inválido');
                return false;
            }

            console.log(`📥 [RESTORE] Restaurando ${backupData.entries.length} entradas...`);

            // 🔥 FIX: In overwrite mode (default for first login), clear local DB first
            if (overwriteMode && window.mentalStorage && typeof window.mentalStorage.deleteAllEntries === 'function') {
                await window.mentalStorage.deleteAllEntries();
                console.log('🧹 [RESTORE] Dados locais limpos antes da restauração');
            }

            // Restore entries
            let restoredCount = 0;
            for (const entry of backupData.entries) {
                try {
                    await window.mentalStorage.saveMoodEntry(entry);
                    restoredCount++;
                } catch (error) {
                    console.warn('📥 [RESTORE] Erro ao restaurar entrada:', error);
                }
            }

            console.log(`✅ [RESTORE] ${restoredCount} entradas restauradas`);
            return restoredCount > 0;

        } catch (error) {
            console.error('❌ [RESTORE] Erro na restauração:', error);
            return false;
        }
    }

    async findBackupFile() {
        try {
            const response = await fetch('https://www.googleapis.com/drive/v3/files?q=name="MentalIA_backup.enc"&spaces=appDataFolder', {
                headers: {
                    'Authorization': `Bearer ${this.accessToken}`
                }
            });

            const data = await response.json();
            if (data.files && data.files.length > 0) {
                return data.files[0].id;
            }
            return null;
        } catch (error) {
            console.error('❌ [BACKUP] Erro ao procurar arquivo:', error);
            return null;
        }
    }

    async downloadFile(fileId) {
        const response = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`, {
            headers: {
                'Authorization': `Bearer ${this.accessToken}`
            }
        });

        if (!response.ok) {
            throw new Error('Erro ao baixar arquivo');
        }

        return await response.text();
    }

    updateBackupStatus(connected, statusText) {
        const statusElement = document.getElementById('google-backup-status');
        if (statusElement) {
            statusElement.className = `backup-status ${connected ? 'connected' : 'error'}`;
            statusElement.textContent = connected ? `🟢 ${statusText}` : `🔴 ${statusText}`;
        }
    }

    showToast(message, type = 'info') {
        const toast = document.createElement('div');
        toast.style.cssText = `
            position: fixed; top: 20px; right: 20px; z-index: 9999;
            padding: 12px 20px; border-radius: 8px; color: white;
            font-weight: 500; box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            background: ${type === 'success' ? '#4CAF50' : type === 'error' ? '#f44336' : type === 'warning' ? '#FF9800' : '#2196F3'};
            animation: slideIn 0.3s ease-out;
        `;
        toast.textContent = message;
        document.body.appendChild(toast);

        setTimeout(() => {
            toast.style.animation = 'slideOut 0.3s ease-in';
            setTimeout(() => toast.remove(), 300);
        }, 4000);
    }
}

// Initialize when page loads
window.addEventListener('DOMContentLoaded', () => {
    new GoogleDriveBackup();

    // Setup backup button
    const backupBtn = document.getElementById('backup-data');
    if (backupBtn) {
        backupBtn.addEventListener('click', () => {
            if (window.googleDriveBackup && window.googleDriveBackup.isSignedIn) {
                window.googleDriveBackup.backupToDrive({ showToasts: true });
            } else {
                window.googleDriveBackup.showToast('Conecte-se ao Google Drive primeiro', 'warning');
            }
        });
    }
});