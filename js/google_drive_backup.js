/**
 * Google Drive Backup System for MentalIA-3.1
 * Simplified One Tap implementation with encrypted backup
 */

class GoogleDriveBackup {
    constructor() {
        this.clientId = '670002862076-ivoemo399amv728d61llbdqn3fbcr8tk.apps.googleusercontent.com';
        this.scopes = 'https://www.googleapis.com/auth/drive.appdata';
        this.isSignedIn = false;
        this.accessToken = null;
        this.oneTapInitialized = false;

        console.log('☁️ [BACKUP] Inicializando sistema de backup Google Drive...');
        this.initializeGoogleOneTap();
        this.updateBackupStatus(false, 'Inicializando...');
    }

    async initializeGoogleOneTap() {
        try {
            console.log('🚪 [ONE TAP] Inicializando Google One Tap...');

            // Wait for Google Identity Services to load
            await this.waitForGoogleIdentityServices();

            // Initialize One Tap
            google.accounts.id.initialize({
                client_id: this.clientId,
                callback: this.handleGoogleCredential.bind(this),
                auto_select: false,
                cancel_on_tap_outside: true,
                context: 'signin'
            });

            this.oneTapInitialized = true;
            console.log('✅ [ONE TAP] Google One Tap inicializado');

            // Render One Tap button
            this.renderOneTapButton();

            this.updateBackupStatus(false, 'Pronto para login');

        } catch (error) {
            console.error('❌ [ONE TAP] Erro ao inicializar:', error);
            this.updateBackupStatus(false, 'Erro na inicialização');
        }
    }

    async waitForGoogleIdentityServices() {
        return new Promise((resolve, reject) => {
            let attempts = 0;
            const maxAttempts = 50;

            const checkServices = () => {
                attempts++;
                if (typeof google !== 'undefined' && google.accounts && google.accounts.id) {
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

    async handleGoogleCredential(response) {
        try {
            console.log('🔐 [ONE TAP] Credencial recebida');

            // Decode JWT to get user info
            const payload = this.parseJWT(response.credential);
            console.log('✅ [ONE TAP] Usuário autenticado:', payload.email);

            // Get access token for Drive API
            this.accessToken = await this.getAccessToken(response.credential);

            if (this.accessToken) {
                this.isSignedIn = true;
                this.updateBackupStatus(true, `Conectado: ${payload.email}`);
                console.log('✅ [BACKUP] Acesso ao Google Drive autorizado');
            } else {
                throw new Error('Falha ao obter token de acesso');
            }

        } catch (error) {
            console.error('❌ [ONE TAP] Erro ao processar credencial:', error);
            this.updateBackupStatus(false, 'Erro no login');
        }
    }

    async getAccessToken(credential) {
        try {
            console.log('🔑 [TOKEN] Solicitando token de acesso...');

            const response = await fetch('https://oauth2.googleapis.com/token', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: new URLSearchParams({
                    client_id: this.clientId,
                    grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
                    assertion: credential,
                    scope: this.scopes
                })
            });

            const data = await response.json();

            if (data.access_token) {
                console.log('✅ [TOKEN] Token de acesso obtido');
                return data.access_token;
            } else {
                console.error('❌ [TOKEN] Erro na resposta:', data);
                return null;
            }

        } catch (error) {
            console.error('❌ [TOKEN] Erro ao obter token:', error);
            return null;
        }
    }

    parseJWT(token) {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(atob(base64).split('').map(c =>
            '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)
        ).join(''));
        return JSON.parse(jsonPayload);
    }

    async backupToDrive() {
        try {
            console.log('📤 [BACKUP] Iniciando backup...');

            if (!this.isSignedIn || !this.accessToken) {
                throw new Error('Usuário não autenticado');
            }

            this.updateBackupStatus(true, 'Preparando dados...');

            // Get data from storage
            const entries = await window.mentalStorage.getAllMoodEntries();
            if (!entries || entries.length === 0) {
                throw new Error('Nenhum dado para backup');
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
                this.updateBackupStatus(true, 'Backup concluído!');
                this.showToast('Backup realizado com sucesso! ☁️', 'success');
            } else {
                throw new Error('Falha no upload');
            }

        } catch (error) {
            console.error('❌ [BACKUP] Erro no backup:', error);
            this.updateBackupStatus(false, 'Erro no backup');
            this.showToast('Erro no backup: ' + error.message, 'error');
        }
    }

    async encryptData(data) {
        try {
            // Generate key from device fingerprint
            const key = await this.generateEncryptionKey();
            const iv = crypto.getRandomValues(new Uint8Array(12));

            const encrypted = await crypto.subtle.encrypt(
                { name: 'AES-GCM', iv: iv },
                key,
                new TextEncoder().encode(data)
            );

            // Combine IV and encrypted data
            const result = new Uint8Array(iv.length + encrypted.byteLength);
            result.set(iv);
            result.set(new Uint8Array(encrypted), iv.length);

            return btoa(String.fromCharCode.apply(null, result));

        } catch (error) {
            console.error('❌ [ENCRYPT] Erro na criptografia:', error);
            throw new Error('Erro na criptografia');
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
            ['encrypt']
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

    updateBackupStatus(connected, statusText) {
        const statusElement = document.getElementById('google-backup-status');
        if (statusElement) {
            statusElement.className = `backup-status ${connected ? 'connected' : 'error'}`;
            statusElement.textContent = connected ? `🟢 ${statusText}` : `🔴 ${statusText}`;
        }
    }

    showToast(message, type = 'info') {
        // Simple toast implementation
        const toast = document.createElement('div');
        toast.style.cssText = `
            position: fixed; top: 20px; right: 20px; z-index: 9999;
            padding: 12px 20px; border-radius: 8px; color: white;
            font-weight: 500; box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            background: ${type === 'success' ? '#4CAF50' : type === 'error' ? '#f44336' : '#2196F3'};
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
    window.googleDriveBackup = new GoogleDriveBackup();

    // Setup backup button
    const backupBtn = document.getElementById('backup-data');
    if (backupBtn) {
        backupBtn.addEventListener('click', () => {
            window.googleDriveBackup.backupToDrive();
        });
    }
});