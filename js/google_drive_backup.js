/**
 * Google Drive Backup System for MentalIA-3.1
 * Handles encrypted backup and restore with mandatory Google login
 */

class GoogleDriveBackup {
    constructor() {
        this.clientId = 'ivoemo399amv728d61llbdqn3fbcr8tk.apps.googleusercontent.com';
        this.discoveryDoc = 'https://www.googleapis.com/discovery/v1/apis/drive/v3/rest';
        this.scopes = 'https://www.googleapis.com/auth/drive.appdata';
        
        this.isSignedIn = false;
        this.gapi = null;
        this.currentUser = null;
        this.oneTapInitialized = false;
        
        this.initializeGoogleAPIs();
    }

    async initializeGoogleAPIs() {
        try {
            // Wait for both Google APIs and One Tap to be available
            await this.waitForGoogleAPIs();
            
            // Initialize GAPI client
            await this.initializeGapiClient();
            
            // Initialize Google One Tap
            await this.initializeOneTap();
            
            // Update UI status
            this.updateDriveStatus();
            
            console.log('✅ Google APIs initialized successfully');
            
        } catch (error) {
            console.error('❌ Erro ao inicializar Google APIs:', error);
            this.updateDriveStatus(false, 'Erro na inicialização');
        }
    }

    async waitForGoogleAPIs() {
        // Wait for GAPI
        return new Promise((resolve) => {
            const checkGapi = () => {
                if (typeof gapi !== 'undefined' && typeof google !== 'undefined') {
                    resolve();
                } else {
                    setTimeout(checkGapi, 100);
                }
            };
            checkGapi();
        });
    }
    
    async initializeGapiClient() {
        return new Promise((resolve, reject) => {
            gapi.load('client:auth2', async () => {
                try {
                    await gapi.client.init({
                        discoveryDocs: [this.discoveryDoc],
                        clientId: this.clientId,
                        scope: this.scopes
                    });
                    
                    // Check if user is already signed in
                    const authInstance = gapi.auth2.getAuthInstance();
                    this.isSignedIn = authInstance.isSignedIn.get();
                    
                    if (this.isSignedIn) {
                        this.currentUser = authInstance.currentUser.get();
                        console.log('✅ Usuário já conectado ao Google Drive');
                    }
                    
                    resolve();
                } catch (error) {
                    reject(error);
                }
            });
        });
    }
    
    async initializeOneTap() {
        if (this.oneTapInitialized) return;
        
        try {
            // Configure Google One Tap
            google.accounts.id.initialize({
                client_id: this.clientId,
                callback: this.handleOneTapResponse.bind(this),
                auto_select: false,
                cancel_on_tap_outside: false
            });
            
            this.oneTapInitialized = true;
            console.log('✅ Google One Tap initialized');
            
        } catch (error) {
            console.error('❌ Erro ao inicializar One Tap:', error);
        }
    }
    
    handleOneTapResponse(response) {
        console.log('🔐 One Tap response received');
        
        // Decode the JWT token to get user info
        try {
            const payload = this.parseJWT(response.credential);
            console.log('✅ Login realizado via One Tap:', payload.email);
            
            // Now authenticate with GAPI
            this.completeAuthentication(response.credential);
            
        } catch (error) {
            console.error('❌ Erro ao processar One Tap:', error);
            this.showToast('Erro no login. Tente novamente.', 'error');
        }
    }
    
    parseJWT(token) {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));
        return JSON.parse(jsonPayload);
    }
    
    async completeAuthentication(credential) {
        try {
            // Set the credential for GAPI
            const authInstance = gapi.auth2.getAuthInstance();
            
            // Sign in with Google
            const user = await authInstance.signIn({
                scope: this.scopes
            });
            
            this.isSignedIn = true;
            this.currentUser = user;
            
            // Update UI
            this.updateDriveStatus(true, user.getBasicProfile().getEmail());
            
            console.log('✅ Autenticação completa realizada');
            
        } catch (error) {
            console.error('❌ Erro na autenticação completa:', error);
            // Fallback to basic authentication
            await this.fallbackAuthentication();
        }
    }

    async fallbackAuthentication() {
        try {
            const authInstance = gapi.auth2.getAuthInstance();
            const user = await authInstance.signIn({
                scope: this.scopes
            });
            
            this.isSignedIn = true;
            this.currentUser = user;
            
            this.updateDriveStatus(true, user.getBasicProfile().getEmail());
            console.log('✅ Autenticação fallback realizada');
            
        } catch (error) {
            console.error('❌ Erro na autenticação fallback:', error);
            this.showToast('Erro ao fazer login. Tente novamente.', 'error');
        }
    }

    // Public method to trigger login (called by backup button)
    async requestLogin() {
        if (this.isSignedIn) {
            return true; // Already logged in
        }

        try {
            console.log('🔐 Solicitando login do usuário...');
            
            // Try One Tap first
            if (this.oneTapInitialized) {
                google.accounts.id.prompt((notification) => {
                    if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
                        // One Tap failed, use traditional popup
                        this.fallbackAuthentication();
                    }
                });
            } else {
                // Direct fallback to popup
                await this.fallbackAuthentication();
            }
            
            return this.isSignedIn;
            
        } catch (error) {
            console.error('❌ Erro ao solicitar login:', error);
            this.showToast('Erro ao fazer login. Tente novamente.', 'error');
            return false;
        }
    }

    async signOut() {
        try {
            if (this.isSignedIn) {
                const authInstance = gapi.auth2.getAuthInstance();
                await authInstance.signOut();
                
                this.isSignedIn = false;
                this.currentUser = null;
                
                this.updateDriveStatus(false);
                this.showToast('Desconectado do Google Drive', 'info');
                
                console.log('✅ Usuário desconectado');
            }
        } catch (error) {
            console.error('❌ Erro ao desconectar:', error);
            this.showToast('Erro ao desconectar', 'error');
        }
    }

    updateDriveStatus(isOnline = null, userEmail = null) {
        const statusIndicator = document.getElementById('status-indicator');
        const disconnectBtn = document.getElementById('disconnect-drive');
        const loginPrompt = document.getElementById('login-prompt');
        
        if (isOnline === null) {
            isOnline = this.isSignedIn;
        }
        
        if (statusIndicator) {
            if (isOnline) {
                statusIndicator.className = 'status-indicator online';
                statusIndicator.innerHTML = `
                    <span class="status-icon">🟢</span>
                    <span class="status-text">Conectado ao Drive${userEmail ? ` (${userEmail})` : ''}</span>
                `;
                
                if (disconnectBtn) {
                    disconnectBtn.classList.add('show');
                }
                
                if (loginPrompt) {
                    loginPrompt.style.display = 'none';
                }
                
            } else {
                statusIndicator.className = 'status-indicator offline';
                statusIndicator.innerHTML = `
                    <span class="status-icon">🔴</span>
                    <span class="status-text">Faça login primeiro</span>
                `;
                
                if (disconnectBtn) {
                    disconnectBtn.classList.remove('show');
                }
                
                if (loginPrompt) {
                    loginPrompt.style.display = 'block';
                }
            }
        }
    }

    async performBackup() {
        try {
            if (!this.isSignedIn) {
                throw new Error('Usuário não está logado');
            }

            console.log('📤 Iniciando backup...');
            this.setBackupLoading(true);

            // Get all mood entries from storage
            const entries = await window.mentalStorage.getAllMoodEntries();
            
            if (!entries || entries.length === 0) {
                throw new Error('Nenhum dado para fazer backup');
            }

            // Create backup data
            const backupData = {
                version: '3.1',
                timestamp: new Date().toISOString(),
                deviceFingerprint: this.generateDeviceFingerprint(),
                entries: entries,
                totalEntries: entries.length
            };

            // Encrypt backup data
            const encryptedData = await this.encryptBackupData(JSON.stringify(backupData));
            
            // Upload to Google Drive
            const fileId = await this.uploadToDrive(encryptedData);
            
            console.log('✅ Backup realizado com sucesso:', fileId);
            this.showToast('Backup realizado com sucesso! 🎉', 'success');
            
            return fileId;
            
        } catch (error) {
            console.error('❌ Erro no backup:', error);
            
            let errorMessage = 'Erro ao fazer backup. Tente novamente.';
            if (error.message.includes('não está logado')) {
                errorMessage = 'Faça login no Google Drive primeiro.';
            } else if (error.message.includes('Nenhum dado')) {
                errorMessage = 'Nenhum dado encontrado para backup.';
            } else if (error.message.includes('criptografia')) {
                errorMessage = 'Erro na criptografia dos dados.';
            }
            
            this.showToast(errorMessage, 'error');
            throw error;
            
        } finally {
            this.setBackupLoading(false);
        }
    }

    async uploadToDrive(encryptedData) {
        const boundary = '-------314159265358979323846';
        const delimiter = "\r\n--" + boundary + "\r\n";
        const close_delim = "\r\n--" + boundary + "--";

        const fileName = `MentalIA_Backup_${new Date().toISOString().split('T')[0]}.json`;
        
        const metadata = {
            'name': fileName,
            'parents': ['appDataFolder'], // Hidden from user
            'description': 'MentalIA encrypted backup'
        };

        const multipartRequestBody =
            delimiter +
            'Content-Type: application/json\r\n\r\n' +
            JSON.stringify(metadata) +
            delimiter +
            'Content-Type: application/json\r\n\r\n' +
            encryptedData +
            close_delim;

        const request = gapi.client.request({
            'path': 'https://www.googleapis.com/upload/drive/v3/files',
            'method': 'POST',
            'params': {'uploadType': 'multipart'},
            'headers': {
                'Content-Type': 'multipart/related; boundary="' + boundary + '"'
            },
            'body': multipartRequestBody
        });

        const response = await request;
        return response.result.id;
    }

    async encryptBackupData(data) {
        try {
            // Generate encryption key from device fingerprint
            const fingerprint = this.generateDeviceFingerprint();
            const keyMaterial = await crypto.subtle.importKey(
                "raw",
                new TextEncoder().encode(fingerprint),
                "PBKDF2",
                false,
                ["deriveBits", "deriveKey"]
            );

            const key = await crypto.subtle.deriveKey(
                {
                    "name": "PBKDF2",
                    salt: new TextEncoder().encode("MentalIA-Salt-2024"),
                    "iterations": 100000,
                    "hash": "SHA-256"
                },
                keyMaterial,
                { "name": "AES-GCM", "length": 256},
                false,
                ["encrypt", "decrypt"]
            );

            const iv = crypto.getRandomValues(new Uint8Array(12));
            const encrypted = await crypto.subtle.encrypt(
                {
                    name: "AES-GCM",
                    iv: iv
                },
                key,
                new TextEncoder().encode(data)
            );

            // Combine IV and encrypted data
            const result = new Uint8Array(iv.length + encrypted.byteLength);
            result.set(iv);
            result.set(new Uint8Array(encrypted), iv.length);

            return btoa(String.fromCharCode.apply(null, result));
            
        } catch (error) {
            console.error('❌ Erro na criptografia:', error);
            throw new Error('Erro na criptografia dos dados');
        }
    }

    generateDeviceFingerprint() {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        ctx.textBaseline = 'top';
        ctx.font = '14px Arial';
        ctx.fillText('MentalIA Device Fingerprint', 2, 2);
        
        const fingerprint = [
            navigator.userAgent,
            navigator.language,
            screen.width + 'x' + screen.height,
            new Date().getTimezoneOffset(),
            canvas.toDataURL()
        ].join('|');
        
        // Simple hash
        let hash = 0;
        for (let i = 0; i < fingerprint.length; i++) {
            const char = fingerprint.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        
        return 'MentalIA-' + Math.abs(hash).toString(36);
    }

    setBackupLoading(loading) {
        const backupBtn = document.getElementById('backup-data');
        if (backupBtn) {
            if (loading) {
                backupBtn.classList.add('loading');
                backupBtn.disabled = true;
            } else {
                backupBtn.classList.remove('loading');
                backupBtn.disabled = false;
            }
        }
    }

    showToast(message, type = 'info') {
        if (window.app && window.app.showToast) {
            window.app.showToast(message, type);
        } else {
            console.log(`${type.toUpperCase()}: ${message}`);
        }
    }

    // Initialize event listeners
    initEventListeners() {
        // Backup button
        const backupBtn = document.getElementById('backup-data');
        if (backupBtn) {
            backupBtn.addEventListener('click', async () => {
                await this.handleBackupClick();
            });
        }

        // Disconnect button
        const disconnectBtn = document.getElementById('disconnect-drive');
        if (disconnectBtn) {
            disconnectBtn.addEventListener('click', async () => {
                await this.signOut();
            });
        }

        // Modal buttons
        const confirmBackupBtn = document.getElementById('confirm-backup');
        const cancelBackupBtn = document.getElementById('cancel-backup');
        const modal = document.getElementById('backup-modal');

        if (confirmBackupBtn) {
            confirmBackupBtn.addEventListener('click', async () => {
                modal.classList.remove('show');
                await this.performBackup();
            });
        }

        if (cancelBackupBtn) {
            cancelBackupBtn.addEventListener('click', () => {
                modal.classList.remove('show');
            });
        }
    }

    async handleBackupClick() {
        // Check if user is signed in
        if (!this.isSignedIn) {
            // Request login first
            const loginSuccess = await this.requestLogin();
            if (!loginSuccess) {
                return; // Login failed, abort backup
            }
        }

        // Show confirmation modal
        this.showBackupModal();
    }

    showBackupModal() {
        const modal = document.getElementById('backup-modal');
        if (modal) {
            modal.classList.add('show');
        }
    }
}

// Initialize Google Drive Backup when page loads
window.addEventListener('DOMContentLoaded', () => {
    window.googleDriveBackup = new GoogleDriveBackup();
    
    // Initialize event listeners after DOM is ready
    setTimeout(() => {
        window.googleDriveBackup.initEventListeners();
    }, 1000);
});