/**
 * Google Drive Backup System for MentalIA-3.1
 * Corrected One Tap + OAuth2 token client flow
 * Portuguese messages, auto backup/restore to appDataFolder
 */

class GoogleDriveBackup {
    constructor() {
        this.clientId = '670002862076-ivoemo399amv728d61llbdqn3fbcr8tk.apps.googleusercontent.com';
        this.scopes = 'https://www.googleapis.com/auth/drive.appdata';
        this.isSignedIn = false;
        this.accessToken = null;
        this.tokenClient = null;

        console.log('☁️ [BACKUP] Inicializando sistema de backup Google Drive...');
        this.init();
    }

    async init() {
        try {
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

            // Prompt One Tap UI
            google.accounts.id.prompt();

            window.googleDriveBackup = this;
            this.updateBackupStatus(false, 'Pronto para login');
        } catch (err) {
            console.error('❌ [INIT] Erro inicializando Google Identity Services:', err);
            this.updateBackupStatus(false, 'Erro na inicialização');
        }
    }

    async waitForGoogleIdentityServices() {
        return new Promise((resolve, reject) => {
            let attempts = 0;
            const maxAttempts = 50;
            const check = () => {
                attempts++;
                if (typeof google !== 'undefined' && google.accounts && google.accounts.id && google.accounts.oauth2) {
                    resolve();
                } else if (attempts >= maxAttempts) {
                    reject(new Error('Google Identity Services não carregou'));
                } else {
                    setTimeout(check, 100);
                }
            };
            check();
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

            // Request an OAuth access token for Drive using token client.
            try {
                this.tokenClient.requestAccessToken({ prompt: '' });
            } catch (err) {
                console.warn('⚠️ [TOKEN] Pedido silencioso falhou, solicitando consentimento:', err);
                try { this.tokenClient.requestAccessToken({ prompt: 'consent' }); } catch (err2) { console.error('❌ [TOKEN] Falha ao solicitar token:', err2); this.showToast('Erro no login com Google. Tente novamente.', 'error'); }
            }
        } catch (err) {
            console.error('❌ [ONE TAP] Erro ao processar credencial:', err);
        }
    }

    parseJWT(token) {
        try {
            const base64Url = token.split('.')[1];
            const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
            const jsonPayload = decodeURIComponent(atob(base64).split('').map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join(''));
            return JSON.parse(jsonPayload);
        } catch (err) {
            console.warn('⚠️ [JWT] Falha ao decodificar JWT:', err);
            return null;
        }
    }

    async postSignInActions() {
        try {
            this.updateBackupStatus(true, 'Conectado ao Google Drive');
            // Immediately backup after sign-in
            try { await this.backupToDrive({ showToasts: true }); } catch (err) { console.warn('⚠️ [BACKUP] Backup automático falhou:', err); }
            // If DB empty, try restore
            try {
                const entries = await window.mentalStorage.getAllMoodEntries();
                if (!entries || entries.length === 0) {
                    const restored = await this.downloadAndRestoreBackup();
                    if (restored) this.showToast('Backup restaurado', 'success');
                }
            } catch (err) { console.warn('⚠️ [RESTORE] Falha ao tentar restaurar automaticamente:', err); }
        } catch (err) { console.error('❌ [POST SIGNIN] Erro pós-login:', err); }
    }

    async backupToDrive(options = { showToasts: false }) {
        try {
            if (!this.accessToken) throw new Error('Usuário não autenticado');
            this.updateBackupStatus(true, 'Preparando dados...');
            const entries = await window.mentalStorage.getAllMoodEntries();
            if (!entries || entries.length === 0) { if (options.showToasts) this.showToast('Nenhum dado para backup', 'error'); throw new Error('Nenhum dado para backup'); }
            const backupData = { version: '3.1', timestamp: new Date().toISOString(), entries, totalEntries: entries.length };
            this.updateBackupStatus(true, 'Criptografando...');
            const encryptedData = await this.encryptData(JSON.stringify(backupData));
            this.updateBackupStatus(true, 'Enviando para Drive...');
            const uploaded = await this.uploadEncryptedFile(encryptedData);
            if (uploaded) { if (options.showToasts) this.showToast('Backup salvo na nuvem', 'success'); this.updateBackupStatus(true, 'Backup salvo na nuvem'); return true; }
            if (options.showToasts) this.showToast('Erro ao enviar backup', 'error'); throw new Error('Falha no upload');
        } catch (err) { console.error('❌ [BACKUP] Erro:', err); this.updateBackupStatus(false, 'Erro no backup'); if (options.showToasts) this.showToast('Erro no backup: ' + err.message, 'error'); throw err; }
    }

    async encryptData(data) {
        try {
            const key = await this.generateEncryptionKey();
            const iv = crypto.getRandomValues(new Uint8Array(12));
            const encrypted = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, new TextEncoder().encode(data));
            const result = new Uint8Array(iv.length + encrypted.byteLength); result.set(iv); result.set(new Uint8Array(encrypted), iv.length); return btoa(String.fromCharCode.apply(null, result));
        } catch (err) { console.error('❌ [ENCRYPT] Erro na criptografia:', err); throw err; }
    }

    async generateEncryptionKey() {
        const fingerprint = this.generateDeviceFingerprint();
        const keyMaterial = await crypto.subtle.importKey('raw', new TextEncoder().encode(fingerprint), 'PBKDF2', false, ['deriveKey']);
        return crypto.subtle.deriveKey({ name: 'PBKDF2', salt: new TextEncoder().encode('MentalIA-Backup-Salt-2024'), iterations: 100000, hash: 'SHA-256' }, keyMaterial, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']);
    }

    async decryptData(encryptedB64) {
        const combined = Uint8Array.from(atob(encryptedB64), c => c.charCodeAt(0)); const iv = combined.slice(0, 12); const data = combined.slice(12); const key = await this.generateEncryptionKey(); const decrypted = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, data); return new TextDecoder().decode(decrypted);
    }

    generateDeviceFingerprint() { const components = [navigator.userAgent, navigator.language, screen.width + 'x' + screen.height, new Date().getTimezoneOffset().toString()]; return 'MentalIA-' + btoa(components.join('|')).substring(0, 32); }

    async uploadEncryptedFile(encryptedData) {
        try {
            const metadata = { name: 'MentalIA_backup.enc', parents: ['appDataFolder'] };
            const form = new FormData(); form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' })); form.append('file', new Blob([encryptedData], { type: 'application/octet-stream' }));
            const resp = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id', { method: 'POST', headers: { 'Authorization': `Bearer ${this.accessToken}` }, body: form });
            if (resp.ok) { const data = await resp.json(); console.log('✅ [UPLOAD] Upload concluído:', data.id); return true; } console.warn('⚠️ [UPLOAD] Resposta não OK:', resp.status); return false;
        } catch (err) { console.error('❌ [UPLOAD] Erro:', err); return false; }
    }

    async downloadAndRestoreBackup() {
        try {
            if (!this.accessToken) return false;
            const q = encodeURIComponent("name = 'MentalIA_backup.enc' and trashed = false and 'appDataFolder' in parents");
            const url = `https://www.googleapis.com/drive/v3/files?q=${q}&orderBy=modifiedTime desc&fields=files(id,name)`;
            const listResp = await fetch(url, { headers: { 'Authorization': `Bearer ${this.accessToken}` } }); if (!listResp.ok) return false; const listData = await listResp.json(); if (!listData.files || listData.files.length === 0) return false; const fileId = listData.files[0].id; const fileResp = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`, { headers: { 'Authorization': `Bearer ${this.accessToken}` } }); if (!fileResp.ok) return false; const encryptedB64 = await fileResp.text(); const jsonString = await this.decryptData(encryptedB64); const backup = JSON.parse(jsonString); if (!backup || !backup.entries) return false; for (const entry of backup.entries) { try { await window.mentalStorage.saveMoodEntry(entry); } catch (e) { console.warn('⚠️ [RESTORE]', e); } } console.log('✅ [RESTORE] Backup restaurado com', backup.entries.length, 'entradas'); return true;
        } catch (err) { console.error('❌ [RESTORE] Erro:', err); return false; }
    }

    updateBackupStatus(connected, statusText) {
        const statusElement = document.getElementById('google-backup-status'); if (statusElement) { statusElement.className = `backup-status ${connected ? 'connected' : 'error'}`; statusElement.textContent = connected ? `🟢 ${statusText}` : `🔴 ${statusText}`; }
    }

    showToast(message, type = 'info') { const toast = document.createElement('div'); toast.style.cssText = `position: fixed; top: 20px; right: 20px; z-index: 9999; padding: 12px 20px; border-radius: 8px; color: white; font-weight: 500; box-shadow: 0 4px 12px rgba(0,0,0,0.3); background: ${type === 'success' ? '#4CAF50' : type === 'error' ? '#f44336' : '#2196F3'}; animation: slideIn 0.3s ease-out;`; toast.textContent = message; document.body.appendChild(toast); setTimeout(() => { toast.style.animation = 'slideOut 0.3s ease-in'; setTimeout(() => toast.remove(), 300); }, 4000); }
}

// Initialize when page loads
window.addEventListener('DOMContentLoaded', () => {
    new GoogleDriveBackup();
    const backupBtn = document.getElementById('backup-data');
    if (backupBtn) {
        backupBtn.addEventListener('click', async () => {
            try {
                if (window.googleDriveBackup && window.googleDriveBackup.tokenClient) {
                    window.googleDriveBackup.tokenClient.requestAccessToken({ prompt: 'consent' });
                } else if (window.googleDriveBackup) {
                    await window.googleDriveBackup.backupToDrive({ showToasts: true });
                }
            } catch (err) { console.error('❌ [UI BACKUP] Erro ao iniciar backup manual:', err); }
        });
    }
});