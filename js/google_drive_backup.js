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
        // Inicializar com status claro
        this.updateBackupStatus(false, 'Clique em "Backup Seguro" para conectar ao Google Drive');
        this.updateConnectButtonVisibility();
    }

    async showGoogleOneTap() {
        try {
            console.log('🚪 [ONE TAP] Mostrando Google One Tap...');

            // Check if we're in a secure context (HTTPS or localhost)
            const isSecure = window.location.protocol === 'https:' || window.location.hostname === 'localhost';
            console.log('🚪 [ONE TAP] Contexto seguro:', isSecure);

            // Wait for Google Identity Services to load
            await this.waitForGoogleIdentityServices();

            console.log('🚪 [ONE TAP] Google Identity Services carregado!');

            // Initialize One Tap if not already done
            if (!this.oneTapInitialized) {
                console.log('🚪 [ONE TAP] Inicializando One Tap...');
                google.accounts.id.initialize({
                    client_id: this.clientId,
                    callback: this.handleGoogleCredential.bind(this),
                    auto_select: false,
                    cancel_on_tap_outside: true,
                    context: 'signin',
                    state: 'google_drive_backup_' + Date.now() // Add unique state
                });
                this.oneTapInitialized = true;
                console.log('🚪 [ONE TAP] One Tap inicializado!');
            }

            // Cancel any existing prompt first
            try {
                google.accounts.id.cancel();
                console.log('🚪 [ONE TAP] Prompt anterior cancelado');
            } catch (e) {
                console.log('🚪 [ONE TAP] Nenhum prompt anterior para cancelar');
            }

            // Small delay before showing new prompt
            await new Promise(resolve => setTimeout(resolve, 500));

            // Show One Tap prompt
            console.log('🚪 [ONE TAP] Chamando google.accounts.id.prompt()...');
            google.accounts.id.prompt();
                console.log('🚪 [ONE TAP] Notificação do prompt:', notification);

                if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
                    console.log('🚪 [ONE TAP] Prompt não exibido ou pulado, tentando popup alternativo...');
                    // Fallback to popup authentication
                    this.showGooglePopupAuth();
                }
            });

            this.updateBackupStatus(false, '🔄 Conectando ao Google... Procure a janela de login');

        } catch (error) {
            console.error('❌ [ONE TAP] Erro ao mostrar One Tap:', error);
            console.log('🚪 [ONE TAP] Tentando método alternativo...');
            // Fallback to popup authentication
            this.showGooglePopupAuth();
        }
    }

    async waitForGoogleIdentityServices() {
        return new Promise((resolve, reject) => {
            let attempts = 0;
            const maxAttempts = 100; // Aumentado para 100 tentativas
            const checkInterval = 200; // Aumentado para 200ms entre tentativas

            const checkServices = () => {
                attempts++;
                console.log(`🔄 [WAIT] Tentativa ${attempts}/${maxAttempts} - Verificando Google Identity Services...`);

                if (typeof google !== 'undefined' && google.accounts && google.accounts.id) {
                    console.log('✅ [WAIT] Google Identity Services encontrado!');
                    resolve();
                } else if (attempts >= maxAttempts) {
                    console.error('❌ [WAIT] Google Identity Services não carregou após', maxAttempts, 'tentativas');
                    reject(new Error('Google Identity Services não carregou'));
                } else {
                    setTimeout(checkServices, checkInterval);
                }
            };
            checkServices();
        });
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
                this.updateBackupStatus(true, `🟢 Conectado: ${payload.email}`);
                this.updateConnectButtonVisibility();
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

    async handleBackupClick() {
        console.log('☁️ [BACKUP] Botão backup clicado');

        if (!this.isSignedIn) {
            console.log('🔐 [BACKUP] Usuário não logado, mostrando One Tap...');
            await this.showGoogleOneTap();
            return;
        }

        // User is signed in, proceed with backup
        await this.backupToDrive();
    }

    async backupToDrive() {
        try {
            console.log('☁️ [BACKUP] Iniciando backup...');

            // Get data from mentalStorage
            const data = window.mentalStorage ? await window.mentalStorage.exportAllData() : { test: 'data' };
            console.log('📦 [BACKUP] Dados obtidos:', Object.keys(data).length, 'registros');

            // Encrypt data
            const encryptedData = await this.encryptData(JSON.stringify(data));
            console.log('🔒 [BACKUP] Dados criptografados');

            // Upload to Google Drive
            const success = await this.uploadEncryptedFile(encryptedData);

            if (success) {
                this.showToast('Backup realizado com sucesso!', 'success');
                console.log('✅ [BACKUP] Backup concluído');
            } else {
                throw new Error('Falha no upload');
            }

        } catch (error) {
            console.error('❌ [BACKUP] Erro no backup:', error);
            this.showToast('Erro no backup: ' + error.message, 'error');
        }
    }

    async showGooglePopupAuth() {
        try {
            console.log('🔐 [POPUP] Iniciando autenticação popup...');

            // Create OAuth URL
            const redirectUri = window.location.origin + window.location.pathname;
            const scope = encodeURIComponent('https://www.googleapis.com/auth/drive.appdata');
            const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
                `client_id=${this.clientId}&` +
                `redirect_uri=${encodeURIComponent(redirectUri)}&` +
                `scope=${scope}&` +
                `response_type=code&` +
                `access_type=offline&` +
                `prompt=consent`;

            console.log('🔐 [POPUP] URL de autenticação:', authUrl);

            // Open popup
            const popup = window.open(
                authUrl,
                'google-auth',
                'width=500,height=600,scrollbars=yes,resizable=yes'
            );

            if (!popup) {
                throw new Error('Popup bloqueado pelo navegador');
            }

            // Listen for messages from popup
            return new Promise((resolve, reject) => {
                const messageListener = (event) => {
                    if (event.origin !== window.location.origin) return;

                    if (event.data.type === 'GOOGLE_AUTH_SUCCESS') {
                        console.log('🔐 [POPUP] Autenticação bem-sucedida!');
                        window.removeEventListener('message', messageListener);
                        popup.close();
                        resolve(event.data.code);
                    } else if (event.data.type === 'GOOGLE_AUTH_ERROR') {
                        console.error('🔐 [POPUP] Erro na autenticação:', event.data.error);
                        window.removeEventListener('message', messageListener);
                        popup.close();
                        reject(new Error(event.data.error));
                    }
                };

                window.addEventListener('message', messageListener);

                // Check if popup was closed
                const checkClosed = setInterval(() => {
                    if (popup.closed) {
                        clearInterval(checkClosed);
                        window.removeEventListener('message', messageListener);
                        reject(new Error('Popup fechado pelo usuário'));
                    }
                }, 1000);
            });

        } catch (error) {
            console.error('❌ [POPUP] Erro na autenticação popup:', error);
            this.showToast('Erro na autenticação: ' + error.message, 'error');
            throw error;
        }
    }
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
        this.updateConnectButtonVisibility();
    }

    updateConnectButtonVisibility() {
        const connectBtn = document.getElementById('connect-google-drive');
        if (connectBtn) {
            connectBtn.style.display = this.isSignedIn ? 'none' : 'block';
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

    // ===== BACKUP AUTOMÁTICO =====

    // Habilita backup automático
    async enableAutoBackup() {
        console.log('☁️ [AUTO-BACKUP] Habilitando backup automático...');

        if (!this.isSignedIn) {
            this.showToast('Conecte-se ao Google Drive primeiro', 'error');
            return false;
        }

        try {
            // Envia mensagem para o service worker
            if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
                navigator.serviceWorker.controller.postMessage({
                    type: 'ENABLE_AUTO_BACKUP'
                });
            }

            // Salva configuração local
            localStorage.setItem('autoBackupEnabled', 'true');

            this.showToast('Backup automático habilitado! Executará todos os dias às 7:00', 'success');
            return true;

        } catch (error) {
            console.error('❌ [AUTO-BACKUP] Erro ao habilitar backup automático:', error);
            this.showToast('Erro ao habilitar backup automático', 'error');
            return false;
        }
    }

    // Desabilita backup automático
    async disableAutoBackup() {
        console.log('☁️ [AUTO-BACKUP] Desabilitando backup automático...');

        try {
            // Envia mensagem para o service worker
            if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
                navigator.serviceWorker.controller.postMessage({
                    type: 'DISABLE_AUTO_BACKUP'
                });
            }

            // Remove configuração local
            localStorage.removeItem('autoBackupEnabled');

            this.showToast('Backup automático desabilitado', 'info');
            return true;

        } catch (error) {
            console.error('❌ [AUTO-BACKUP] Erro ao desabilitar backup automático:', error);
            this.showToast('Erro ao desabilitar backup automático', 'error');
            return false;
        }
    }

    // Verifica se backup automático está habilitado
    isAutoBackupEnabled() {
        return localStorage.getItem('autoBackupEnabled') === 'true';
    }

    // Executa backup automático (chamado pelo service worker)
    async performAutoBackup() {
        console.log('☁️ [AUTO-BACKUP] Executando backup automático...');

        try {
            if (!this.isSignedIn) {
                console.log('🔐 [AUTO-BACKUP] Usuário não logado, pulando backup automático');
                return false;
            }

            // Executa backup normalmente
            const success = await this.backupToDrive();

            if (success) {
                console.log('✅ [AUTO-BACKUP] Backup automático concluído com sucesso');
                // Notificação já é mostrada pelo service worker
            } else {
                console.log('❌ [AUTO-BACKUP] Backup automático falhou');
            }

            return success;

        } catch (error) {
            console.error('❌ [AUTO-BACKUP] Erro no backup automático:', error);
            return false;
        }
    }

    // Listener para mensagens do service worker
    setupServiceWorkerListener() {
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.addEventListener('message', (event) => {
                if (event.data && event.data.type === 'AUTO_BACKUP_REQUEST') {
                    console.log('📨 [AUTO-BACKUP] Recebida solicitação de backup automático');

                    // Executa backup e responde
                    this.performAutoBackup().then(success => {
                        // Responde para o service worker
                        if (navigator.serviceWorker.controller) {
                            navigator.serviceWorker.controller.postMessage({
                                type: 'AUTO_BACKUP_RESPONSE',
                                success: success,
                                timestamp: event.data.timestamp
                            });
                        }
                    });
                }
            });
        }
    }
}

// Initialize when page loads
window.addEventListener('DOMContentLoaded', () => {
    window.googleDriveBackup = new GoogleDriveBackup();

    // Setup backup button
    const backupBtn = document.getElementById('backup-data');
    if (backupBtn) {
        backupBtn.addEventListener('click', () => {
            window.googleDriveBackup.handleBackupClick();
        });
    }

    // Setup service worker listener for auto backup
    window.googleDriveBackup.setupServiceWorkerListener();
});