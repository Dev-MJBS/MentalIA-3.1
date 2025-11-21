/**
 * Google Drive Backup System for MentalIA-3.1
 * Handles encrypted backup and restore with mandatory Google login
 */

class GoogleDriveBackup {
    constructor() {
        // Fixed Client ID for MentalIA
        this.clientId = 'ivoemo399amv728d61llbdqn3fbcr8tk.apps.googleusercontent.com';
        this.discoveryDoc = 'https://www.googleapis.com/discovery/v1/apis/drive/v3/rest';
        this.scopes = 'https://www.googleapis.com/auth/drive.appdata';
        
        this.isSignedIn = false;
        this.gapi = null;
        this.currentUser = null;
        this.oneTapInitialized = false;
        this.isOfflineMode = false;
        
        console.log('☁️ [BACKUP] Inicializando sistema de backup Google Drive...');
        this.initializeGoogleAPIs();
        
        // Initialize UI
        this.updateDriveStatus(false, 'Conectando...');
    }
    
    getConfiguredClientId() {
        // Permitir configuração via localStorage ou usar null para modo offline
        const storedClientId = localStorage.getItem('google-client-id');
        
        // Client IDs válidos conhecidos para diferentes domínios
        const validClientIds = {
            'localhost': null, // Usar modo offline para localhost
            'mentalyia.app': null, // Configurar quando domínio estiver disponível
            'custom': storedClientId
        };
        
        const hostname = window.location.hostname;
        return validClientIds[hostname] || validClientIds['localhost'];
    }
    
    setupOfflineMode() {
        console.log('📴 [BACKUP] Ativando modo offline devido a erro de OAuth');
        this.isOfflineMode = true;

        // Update UI to show offline mode
        this.updateDriveStatus(false, 'Modo Offline - Backup Local');

        // Show detailed offline instructions
        this.showOfflineInstructions();

        // Log helpful information
        console.warn('⚠️ [BACKUP] Modo Offline Ativado');
        console.warn('ℹ️ [BACKUP] Possíveis causas:');
        console.warn('   - Origem não autorizada no Google Cloud Console');
        console.warn('   - Client ID incorreto ou expirado');
        console.warn('   - Problemas de rede ou CORS');
        console.warn('ℹ️ [BACKUP] Soluções:');
        console.warn('   1. Verifique as origens autorizadas no Google Cloud Console');
        console.warn('   2. Adicione https://dev-mjbs.github.io às origens JavaScript');
        console.warn('   3. Use backup local como alternativa');
    }
    
    showOfflineInstructions() {
        const loginPrompt = document.getElementById('login-prompt');
        if (loginPrompt) {
            loginPrompt.innerHTML = `
                <div class="offline-instructions">
                    <h4>📴 Backup no Google Drive</h4>
                    <p><strong>Credenciais da API do Google Drive detectadas automaticamente!</strong></p>
                    <div class="auto-config-info">
                        <p>✅ <strong>Arquivo de credenciais encontrado</strong></p>
                        <p>Clique no botão abaixo para configurar automaticamente.</p>
                    </div>
                    <div class="config-buttons">
                        <button id="auto-config" class="btn-primary">🚀 Configurar Google Drive Automaticamente</button>
                        <button id="open-instructions" class="btn-secondary">📚 Instruções Completas (Opcional)</button>
                    </div>
                    <hr style="margin: 1rem 0; border-color: var(--border);">
                    <p><strong>💾 Alternativa Rápida:</strong> Backup local (sem Google Drive)</p>
                    <button id="local-backup" class="btn-secondary">💾 Fazer Backup Local</button>
                </div>
            `;
            
            // Event listeners para botões com bind correto
            const autoConfigBtn = document.getElementById('auto-config');
            const instructionsBtn = document.getElementById('open-instructions');
            const localBtn = document.getElementById('local-backup');
            
            if (autoConfigBtn) {
                autoConfigBtn.addEventListener('click', () => {
                    console.log('🔍 [BACKUP] Tentando configuração automática');
                    this.tryAutoConfig();
                });
            }
            
            if (instructionsBtn) {
                instructionsBtn.addEventListener('click', () => {
                    console.log('📚 [BACKUP] Abrindo instruções');
                    this.openInstructions();
                });
            }
            
            // Botão de configuração manual removido - usando apenas detecção automática
            
            if (localBtn) {
                localBtn.addEventListener('click', () => {
                    console.log('💾 [BACKUP] Botão backup local clicado');
                    this.performLocalBackup();
                });
            }
        }
    }

    async tryAutoConfig() {
        try {
            console.log('🔍 [BACKUP] Tentando configuração automática...');
            this.showToast('Procurando credenciais...', 'info');
            
            const clientId = await this.loadCredentialsFromFile();
            
            if (clientId) {
                // Reinicializar sistema com as novas credenciais
                await this.initializeGoogleAPIs();
                this.showToast('Configuração automática concluída! 🎉', 'success');
                
                // Atualizar interface
                setTimeout(() => {
                    location.reload();
                }, 1500);
            } else {
                this.showToast('Arquivo de credenciais não encontrado. Use configuração manual.', 'warning');
            }
            
        } catch (error) {
            console.error('🔍 [BACKUP] Erro na configuração automática:', error);
            this.showToast('Erro na configuração automática. Tente manualmente.', 'error');
        }
    }

    openInstructions() {
        try {
            console.log('📚 [BACKUP] Abrindo instruções de configuração');
            
            // Tentar abrir em nova aba
            const instructionsUrl = './COMO_CONFIGURAR_GOOGLE_DRIVE.md';
            const newWindow = window.open('about:blank', '_blank');
            
            if (newWindow) {
                // Criar página HTML com as instruções
                newWindow.document.write(`
                    <!DOCTYPE html>
                    <html lang="pt-BR">
                    <head>
                        <meta charset="UTF-8">
                        <meta name="viewport" content="width=device-width, initial-scale=1.0">
                        <title>Configurar Google Drive API - MentalIA</title>
                        <style>
                            body { 
                                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                                max-width: 800px; margin: 2rem auto; padding: 2rem; 
                                background: #1a1a2e; color: #eee; line-height: 1.6;
                            }
                            h1, h2, h3 { color: #6366f1; }
                            code { background: #16213e; padding: 0.2rem 0.4rem; border-radius: 4px; }
                            ol, ul { padding-left: 2rem; }
                            li { margin: 0.5rem 0; }
                            a { color: #6366f1; text-decoration: none; }
                            a:hover { text-decoration: underline; }
                            .warning { background: #f39c12; color: white; padding: 1rem; border-radius: 8px; margin: 1rem 0; }
                            .success { background: #27ae60; color: white; padding: 1rem; border-radius: 8px; margin: 1rem 0; }
                            .step { background: #16213e; padding: 1rem; margin: 1rem 0; border-radius: 8px; border-left: 4px solid #6366f1; }
                        </style>
                    </head>
                    <body>
                        <h1>🔧 Como Configurar Google Drive API</h1>
                        
                        <div class="success">
                            <strong>✅ Configuração Automática Disponível!</strong> O MentalIA detectou suas credenciais automaticamente.
                            <br><br>
                            <strong>Use o botão "🚀 Configurar Automaticamente"</strong> na tela principal!
                            <br><br>
                            As instruções abaixo são apenas para referência ou configuração manual.
                        </div>
                        
                        <div class="step">
                            <h3>Passo 1: Google Cloud Console</h3>
                            <ol>
                                <li>Acesse: <a href="https://console.cloud.google.com/" target="_blank">console.cloud.google.com</a></li>
                                <li>Clique "Novo Projeto" ou selecione existente</li>
                                <li>Nome: "MentalIA Backup" (ou qualquer nome)</li>
                                <li>Clique "Criar"</li>
                            </ol>
                        </div>
                        
                        <div class="step">
                            <h3>Passo 2: Ativar Google Drive API</h3>
                            <ol>
                                <li>No painel, vá "APIs e Serviços" → "Biblioteca"</li>
                                <li>Procure "Google Drive API"</li>
                                <li>Clique na API e depois "Ativar"</li>
                            </ol>
                        </div>
                        
                        <div class="step">
                            <h3>Passo 3: Criar Credenciais OAuth</h3>
                            <ol>
                                <li>Vá "APIs e Serviços" → "Credenciais"</li>
                                <li>Clique "Criar Credenciais" → "ID do cliente OAuth 2.0"</li>
                                <li>Se aparecer tela de consentimento:
                                    <ul>
                                        <li>Tipo: <strong>Externo</strong></li>
                                        <li>Nome: MentalIA</li>
                                        <li>Email: seu email</li>
                                        <li>Domínios: deixe vazio</li>
                                    </ul>
                                </li>
                            </ol>
                        </div>
                        
                        <div class="step">
                            <h3>Passo 4: Configurar Cliente Web</h3>
                            <ol>
                                <li>Tipo: <strong>Aplicativo da Web</strong></li>
                                <li>Nome: MentalIA Web Client</li>
                                <li>Origens JavaScript autorizadas:
                                    <ul>
                                        <li><code>${window.location.origin}</code></li>
                                        <li><code>http://localhost:3000</code></li>
                                        <li><code>http://localhost:3001</code></li>
                                        <li><code>http://localhost:3001</code></li>
                                    </ul>
                                </li>
                                <li>URIs de redirecionamento: <em>deixe vazio</em></li>
                                <li>Clique "Criar"</li>
                            </ol>
                        </div>
                        
                        <div class="success">
                            <h3>✅ Copiar Client ID</h3>
                            <p>Após criar, aparecerá uma janela com:</p>
                            <ul>
                                <li><strong>Client ID:</strong> <code>123456789-abcdef.apps.googleusercontent.com</code></li>
                                <li><strong>Client Secret:</strong> (não precisamos)</li>
                            </ul>
                            <p><strong>COPIE o Client ID</strong> (formato longo com números e letras)</p>
                        </div>
                        
                        <div class="step">
                            <h3>Passo 5: Configurar no MentalIA</h3>
                            <ol>
                                <li>Volte para o MentalIA</li>
                                <li>Clique "🔧 Já Tenho Client ID"</li>
                                <li>Cole o Client ID que você copiou</li>
                                <li>Recarregue a página</li>
                                <li>Teste o backup!</li>
                            </ol>
                        </div>
                        
                        <div class="warning">
                            <h3>🚨 Problemas Comuns</h3>
                            <ul>
                                <li><strong>"OAuth client not found":</strong> Verifique se copiou o Client ID correto</li>
                                <li><strong>"This app isn't verified":</strong> Normal para apps em desenvolvimento, clique "Advanced" → "Go to MentalIA"</li>
                                <li><strong>"Access blocked":</strong> Confirme que adicionou as URLs nas origens autorizadas</li>
                            </ul>
                        </div>
                        
                        <div class="success">
                            <h3>🎉 Após Configurar</h3>
                            <p>Você terá:</p>
                            <ul>
                                <li>✅ Backup automático no Google Drive</li>
                                <li>✅ Login com sua conta Google</li>
                                <li>✅ Dados sincronizados na nuvem</li>
                                <li>✅ Acesso de qualquer dispositivo</li>
                            </ul>
                        </div>
                        
                        <p><strong>💡 Alternativa:</strong> Se não quiser configurar agora, use o Backup Local!</p>
                        
                        <script>
                            console.log('📚 Instruções de configuração carregadas');
                        </script>
                    </body>
                    </html>
                `);
                newWindow.document.close();
                this.showToast('Instruções abertas em nova aba! 📚', 'info');
            } else {
                // Se não conseguir abrir nova aba, mostrar alerta
                alert(`📚 INSTRUÇÕES DE CONFIGURAÇÃO\\n\\n1. Acesse: console.cloud.google.com\\n2. Crie projeto "MentalIA Backup"\\n3. Ative "Google Drive API"\\n4. Crie "ID cliente OAuth 2.0"\\n5. Tipo: Aplicativo da Web\\n6. Origens: ${window.location.origin}\\n7. Copie o Client ID\\n8. Configure no MentalIA\\n\\nConsulte COMO_CONFIGURAR_GOOGLE_DRIVE.md para detalhes`);
            }
            
        } catch (error) {
            console.error('📚 [BACKUP] Erro ao abrir instruções:', error);
            this.showToast('Erro ao abrir instruções. Consulte COMO_CONFIGURAR_GOOGLE_DRIVE.md', 'error');
        }
    }

    promptClientIdSetup() {
        try {
            console.log('🔧 [BACKUP] Iniciando configuração de Client ID...');
            
            const clientId = prompt(`🔑 GOOGLE DRIVE CLIENT ID\n\nCole o Client ID da API do Google Drive:\n\nFormato: 123456789-abc123def.apps.googleusercontent.com\n\n📄 Consulte as instruções completas se necessário.`);
            
            if (clientId && clientId.includes('.apps.googleusercontent.com')) {
                console.log('🔧 [BACKUP] Client ID válido fornecido');
                localStorage.setItem('google-client-id', clientId);
                this.showToast('Client ID configurado! Recarregue a página.', 'success');
                
                // Botão para recarregar
                const reloadBtn = document.createElement('button');
                reloadBtn.textContent = '🔄 Recarregar Página';
                reloadBtn.className = 'btn-secondary';
                reloadBtn.onclick = () => window.location.reload();
                
                const loginPrompt = document.getElementById('login-prompt');
                if (loginPrompt) {
                    loginPrompt.appendChild(reloadBtn);
                }
            } else if (clientId) {
                console.log('🔧 [BACKUP] Client ID inválido fornecido');
                this.showToast('Client ID inválido. Use o formato correto.', 'error');
            } else {
                console.log('🔧 [BACKUP] Configuração cancelada pelo usuário');
            }
        } catch (error) {
            console.error('🔧 [BACKUP] Erro na configuração:', error);
            this.showToast('Erro na configuração: ' + error.message, 'error');
        }
    }

    async performLocalBackup() {
        try {
            console.log('💾 [LOCAL BACKUP] Iniciando backup local...');
            
            // Verificar se storage está disponível
            if (!window.mentalStorage) {
                throw new Error('Sistema de armazenamento não disponível');
            }
            
            // Obter dados
            console.log('💾 [LOCAL BACKUP] Obtendo dados do storage...');
            const entries = await window.mentalStorage.getAllMoodEntries();
            console.log('💾 [LOCAL BACKUP] Dados obtidos:', entries ? entries.length : 0, 'entradas');
            
            if (!entries || entries.length === 0) {
                this.showToast('Nenhum dado para fazer backup.', 'warning');
                return;
            }
            
            // Criar arquivo de backup
            const backupData = {
                version: '3.1',
                timestamp: new Date().toISOString(),
                type: 'local-backup',
                entries: entries,
                totalEntries: entries.length
            };
            
            // Download do arquivo
            const dataStr = JSON.stringify(backupData, null, 2);
            const dataBlob = new Blob([dataStr], {type: 'application/json'});
            const url = URL.createObjectURL(dataBlob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `MentalIA-Backup-${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
            
            this.showToast('Backup local criado! Arquivo baixado. 💾', 'success');
            
        } catch (error) {
            console.error('💾 [LOCAL BACKUP] Erro:', error);
            this.showToast('Erro no backup local: ' + error.message, 'error');
        }
    }

    async loadCredentialsFromFile() {
        try {
            console.log('🔍 [BACKUP] Procurando arquivo de credenciais...');
            
            // Lista de possíveis arquivos de credenciais
            const possibleFiles = [
                'client_secret_670002862076-ivoemo399amv728d61llbdqn3fbcr8tk.apps.googleusercontent.com.json',
                'credentials.json',
                'client_secret.json',
                'oauth_credentials.json',
                'google_credentials.json'
            ];
            
            // Tentar carregar cada arquivo possível
            for (const filename of possibleFiles) {
                try {
                    const response = await fetch('./' + filename);
                    
                    if (response.ok) {
                        const credentials = await response.json();
                        const clientId = credentials.web?.client_id;
                        
                        if (clientId) {
                            console.log(`✅ [BACKUP] Credenciais encontradas em: ${filename}`);
                            localStorage.setItem('google-client-id', clientId);
                            this.clientId = clientId;
                            this.isOfflineMode = false;
                            this.showToast('Credenciais Google configuradas automaticamente! 🎉', 'success');
                            return clientId;
                        }
                    }
                } catch (fileError) {
                    console.log(`📄 [BACKUP] ${filename} não encontrado`);
                }
            }
            
            console.log('📄 [BACKUP] Credenciais não encontradas - modo offline ativo');
            console.log('💡 [BACKUP] Use "Login com Google" para backup automático ou backup local');
            console.log('📁 [BACKUP] Ou configure manualmente:');
            console.log('   1. Renomeie credentials_EXEMPLO.json → credentials.json');
            console.log('   2. Adicione suas credenciais do Google Cloud Console');
            return null;
            
        } catch (error) {
            console.log('📄 [BACKUP] Não foi possível carregar credenciais automaticamente:', error.message);
            return null;
        }
    }

    async initializeGoogleAPIs() {
        try {
            console.log('☁️ [BACKUP] Inicializando Google APIs...');

            // Check if we're on a supported origin
            const currentOrigin = window.location.origin;
            const supportedOrigins = [
                'http://localhost',
                'http://localhost:3000',
                'http://localhost:8000',
                'http://localhost:8080',
                'https://dev-mjbs.github.io',
                'https://mentalia.app'
            ];

            if (!supportedOrigins.includes(currentOrigin)) {
                console.warn(`⚠️ [BACKUP] Origem não suportada: ${currentOrigin}`);
                console.warn(`⚠️ [BACKUP] Origens suportadas: ${supportedOrigins.join(', ')}`);
                this.setupOfflineMode();
                return;
            }

            // Wait for Google APIs to load
            await this.waitForGoogleAPIs();

            // Initialize GAPI client
            await this.initializeGapiClient();

            // Initialize Google One Tap
            await this.initializeOneTap();

            // Setup event listeners
            this.setupEventListeners();

            console.log('✅ [BACKUP] Google APIs inicializados com sucesso');
            this.updateDriveStatus(false, 'Pronto para login');

        } catch (error) {
            console.error('❌ [BACKUP] Erro ao inicializar Google APIs:', error);

            // Check for specific OAuth errors
            if (error.message && error.message.includes('OAuth')) {
                console.warn('⚠️ [BACKUP] Erro de OAuth detectado, ativando modo offline');
                this.setupOfflineMode();
            } else if (error.message && error.message.includes('origin')) {
                console.warn('⚠️ [BACKUP] Erro de origem detectado, ativando modo offline');
                this.setupOfflineMode();
            } else {
                console.error('❌ [BACKUP] Erro genérico, ativando modo offline');
                this.setupOfflineMode();
            }
        }
    }

    async waitForGoogleAPIs() {
        console.log('⏳ [BACKUP] Aguardando Google APIs...');
        
        return new Promise((resolve, reject) => {
            let attempts = 0;
            const maxAttempts = 50; // 5 seconds timeout
            
            const checkAPIs = () => {
                attempts++;
                
                if (typeof gapi !== 'undefined' && typeof google !== 'undefined') {
                    console.log('✅ [BACKUP] Google APIs carregadas');
                    resolve();
                } else if (attempts >= maxAttempts) {
                    console.error('❌ [BACKUP] Timeout aguardando Google APIs');
                    reject(new Error('Timeout loading Google APIs'));
                } else {
                    setTimeout(checkAPIs, 100);
                }
            };
            
            checkAPIs();
        });
    }
    
    async initializeGapiClient() {
        console.log('🔧 [BACKUP] Inicializando GAPI client...');

        return new Promise((resolve, reject) => {
            gapi.load('client:auth2', async () => {
                try {
                    // Check if client ID is available
                    if (!this.clientId) {
                        throw new Error('Client ID não configurado');
                    }

                    console.log('🔧 [BACKUP] Client ID:', this.clientId.substring(0, 20) + '...');

                    await gapi.client.init({
                        discoveryDocs: [this.discoveryDoc],
                        clientId: this.clientId,
                        scope: this.scopes,
                        ux_mode: 'popup',
                        redirect_uri: undefined // Let Google handle redirect
                    });

                    // Check if user is already signed in
                    const authInstance = gapi.auth2.getAuthInstance();
                    this.isSignedIn = authInstance.isSignedIn.get();

                    if (this.isSignedIn) {
                        this.currentUser = authInstance.currentUser.get();
                        const email = this.currentUser.getBasicProfile().getEmail();
                        console.log('✅ [BACKUP] Usuário já conectado:', email);
                        this.updateDriveStatus(true, `Conectado: ${email}`);
                    } else {
                        console.log('ℹ️ [BACKUP] Usuário não conectado');
                    }

                    console.log('✅ [BACKUP] GAPI client inicializado');
                    resolve();

                } catch (error) {
                    console.error('❌ [BACKUP] Erro ao inicializar GAPI:', error);

                    // Check for specific OAuth errors
                    if (error.error && error.error === 'idpiframe_initialization_failed') {
                        console.error('❌ [BACKUP] Falha na inicialização do iframe OAuth');
                        reject(new Error('OAuth iframe initialization failed'));
                    } else if (error.error && error.error === 'popup_closed_by_user') {
                        console.warn('⚠️ [BACKUP] Popup fechado pelo usuário');
                        reject(new Error('Login cancelado pelo usuário'));
                    } else if (error.details && error.details.includes('origin')) {
                        console.error('❌ [BACKUP] Erro de origem não autorizada');
                        reject(new Error('Origin not authorized'));
                    } else {
                        reject(error);
                    }
                }
            });
        });
    }
    
    async initializeOneTap() {
        if (this.oneTapInitialized) return;

        try {
            console.log('🚪 [BACKUP] Inicializando One Tap...');

            // Check if google.accounts is available
            if (!google || !google.accounts || !google.accounts.id) {
                throw new Error('Google One Tap API não disponível');
            }

            // Configure Google One Tap
            google.accounts.id.initialize({
                client_id: this.clientId,
                callback: this.handleOneTapResponse.bind(this),
                auto_select: false,
                cancel_on_tap_outside: true,
                context: 'signin',
                ux_mode: 'popup'
            });

            this.oneTapInitialized = true;
            console.log('✅ [BACKUP] Google One Tap inicializado');

        } catch (error) {
            console.error('❌ [BACKUP] Erro ao inicializar One Tap:', error);
            // Don't throw - One Tap is optional, we can still use popup login
            console.warn('⚠️ [BACKUP] One Tap falhou, usando apenas popup login');
        }
    }

    setupEventListeners() {
        console.log('🔗 [BACKUP] Configurando event listeners...');
        
        // Backup button
        const backupBtn = document.getElementById('backup-data');
        if (backupBtn) {
            backupBtn.removeEventListener('click', this.handleBackupClick.bind(this)); // Remove existing
            backupBtn.addEventListener('click', this.handleBackupClick.bind(this));
        }

        // Disconnect button
        const disconnectBtn = document.getElementById('disconnect-drive');
        if (disconnectBtn) {
            disconnectBtn.addEventListener('click', this.disconnect.bind(this));
        }

        console.log('✅ [BACKUP] Event listeners configurados');
    }

    async handleBackupClick() {
        console.log('☁️ [BACKUP] Botão backup clicado');
        
        if (!this.isSignedIn) {
            console.log('🔐 [BACKUP] Usuário não logado, iniciando login...');
            await this.signIn();
        } else {
            console.log('📤 [BACKUP] Usuário logado, iniciando backup...');
            await this.performBackup();
        }
    }

    async signIn() {
        try {
            console.log('🚪 [BACKUP] Iniciando processo de login...');
            this.updateDriveStatus(false, 'Fazendo login...');
            
            // Try One Tap first
            if (this.oneTapInitialized) {
                google.accounts.id.prompt((notification) => {
                    if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
                        console.log('⚠️ [BACKUP] One Tap não exibido, usando popup tradicional');
                        this.signInWithPopup();
                    }
                });
            } else {
                await this.signInWithPopup();
            }
        } catch (error) {
            console.error('❌ [BACKUP] Erro no login:', error);
            this.updateDriveStatus(false, 'Erro no login');
            this.showToast('Erro ao fazer login. Tente novamente.', 'error');
        }
    }

    async signInWithPopup() {
        try {
            console.log('🪟 [BACKUP] Abrindo popup de login...');
            const authInstance = gapi.auth2.getAuthInstance();
            const user = await authInstance.signIn();
            
            this.currentUser = user;
            this.isSignedIn = true;
            
            const email = user.getBasicProfile().getEmail();
            console.log('✅ [BACKUP] Login realizado:', email);
            
            this.updateDriveStatus(true, `Conectado: ${email}`);
            this.showToast(`Conectado ao Google Drive! ${email}`, 'success');
            
        } catch (error) {
            console.error('❌ [BACKUP] Erro no popup de login:', error);
            this.updateDriveStatus(false, 'Erro no login');
            throw error;
        }
    }

    async performBackup() {
        try {
            console.log('📤 [BACKUP] Iniciando backup para Google Drive...');
            this.updateDriveStatus(true, 'Fazendo backup...');
            
            // Get data from storage
            if (!window.mentalStorage) {
                throw new Error('Sistema de storage não disponível');
            }

            const backupData = await this.prepareBackupData();
            console.log('📊 [BACKUP] Dados preparados:', Object.keys(backupData));

            // Encrypt backup data
            const encryptedData = await this.encryptBackupData(backupData);
            console.log('🔐 [BACKUP] Dados criptografados');

            // Upload to Google Drive
            const fileId = await this.uploadToGoogleDrive(encryptedData);
            console.log('☁️ [BACKUP] Upload concluído, File ID:', fileId);

            // Update UI
            const email = this.currentUser.getBasicProfile().getEmail();
            this.updateDriveStatus(true, `Backup realizado: ${email}`);
            this.showToast('Backup realizado com sucesso! ☁️', 'success');

        } catch (error) {
            console.error('❌ [BACKUP] Erro no backup:', error);
            const email = this.currentUser?.getBasicProfile()?.getEmail() || 'Usuário';
            this.updateDriveStatus(true, `Conectado: ${email}`);
            this.showToast('Erro no backup: ' + error.message, 'error');
        }
    }

    async prepareBackupData() {
        console.log('📋 [BACKUP] Preparando dados para backup...');
        
        // Get all data from storage
        const entries = await window.mentalStorage.getAllMoodEntries();
        const stats = await window.mentalStorage.getStats();
        
        const backupData = {
            version: '3.1',
            timestamp: new Date().toISOString(),
            deviceId: await this.getDeviceId(),
            entries: entries,
            stats: stats,
            totalEntries: entries.length
        };

        console.log(`📊 [BACKUP] ${backupData.totalEntries} entradas preparadas`);
        return backupData;
    }

    async encryptBackupData(data) {
        console.log('🔐 [BACKUP] Criptografando dados...');
        
        // Use the same encryption as the storage system
        if (window.mentalStorage && typeof window.mentalStorage.encrypt === 'function') {
            return await window.mentalStorage.encrypt(data);
        } else {
            // Fallback: JSON stringify
            console.warn('⚠️ [BACKUP] Sistema de criptografia não disponível, usando JSON');
            return JSON.stringify(data);
        }
    }

    async uploadToGoogleDrive(encryptedData) {
        console.log('☁️ [BACKUP] Fazendo upload para Google Drive...');
        
        const fileName = 'MentalIA_backup.enc';
        const boundary = '-------314159265358979323846';
        const delimiter = "\r\n--" + boundary + "\r\n";
        const close_delim = "\r\n--" + boundary + "--";

        let metadata = JSON.stringify({
            'name': fileName,
            'parents': ['appDataFolder']
        });

        let multipartRequestBody =
            delimiter +
            'Content-Type: application/json\r\n\r\n' +
            metadata +
            delimiter +
            'Content-Type: application/octet-stream\r\n\r\n' +
            (typeof encryptedData === 'string' ? encryptedData : JSON.stringify(encryptedData)) +
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
        console.log('✅ [BACKUP] Upload response:', response);
        
        return response.result.id;
    }

    async getDeviceId() {
        // Generate or get device ID
        let deviceId = localStorage.getItem('mental-ia-device-id');
        if (!deviceId) {
            deviceId = 'device-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
            localStorage.setItem('mental-ia-device-id', deviceId);
        }
        return deviceId;
    }

    disconnect() {
        try {
            console.log('🚪 [BACKUP] Desconectando do Google Drive...');
            
            const authInstance = gapi.auth2.getAuthInstance();
            authInstance.signOut();
            
            this.isSignedIn = false;
            this.currentUser = null;
            
            this.updateDriveStatus(false, 'Desconectado');
            this.showToast('Desconectado do Google Drive', 'info');
            
        } catch (error) {
            console.error('❌ [BACKUP] Erro ao desconectar:', error);
        }
    }

    updateDriveStatus(connected, statusText = '') {
        console.log(`🔄 [BACKUP] Atualizando status: ${connected ? 'Conectado' : 'Desconectado'} - ${statusText}`);
        
        // Update status indicators
        const statusIndicators = document.querySelectorAll('.drive-status');
        statusIndicators.forEach(indicator => {
            indicator.className = `drive-status ${connected ? 'connected' : 'disconnected'}`;
            indicator.textContent = connected ? '🟢' : '🔴';
            indicator.title = statusText || (connected ? 'Conectado ao Google Drive' : 'Desconectado do Google Drive');
        });

        // Update status text elements
        const statusTexts = document.querySelectorAll('.drive-status-text');
        statusTexts.forEach(text => {
            text.textContent = statusText || (connected ? 'Conectado' : 'Desconectado');
        });

        // Update button states
        const backupButtons = document.querySelectorAll('.backup-btn');
        backupButtons.forEach(btn => {
            btn.disabled = !connected;
            btn.textContent = connected ? '☁️ Fazer Backup' : '🔒 Fazer Login';
        });

        // Update disconnect buttons  
        const disconnectButtons = document.querySelectorAll('.disconnect-btn');
        disconnectButtons.forEach(btn => {
            btn.style.display = connected ? 'inline-block' : 'none';
        });

        // Update specific elements by ID
        const statusIndicator = document.getElementById('status-indicator');
        if (statusIndicator) {
            if (connected) {
                statusIndicator.className = 'status-indicator online';
                statusIndicator.innerHTML = `
                    <span class="status-icon">🟢</span>
                    <span class="status-text">Conectado ao Drive${statusText ? ` (${statusText})` : ''}</span>
                `;
            } else {
                statusIndicator.className = 'status-indicator offline';
                statusIndicator.innerHTML = `
                    <span class="status-icon">🔴</span>
                    <span class="status-text">${statusText || 'Faça login primeiro'}</span>
                `;
            }
        }

        const disconnectBtn = document.getElementById('disconnect-drive');
        if (disconnectBtn) {
            disconnectBtn.style.display = connected ? 'inline-block' : 'none';
        }

        const loginPrompt = document.getElementById('login-prompt');
        if (loginPrompt) {
            loginPrompt.style.display = connected ? 'none' : 'block';
        }
    }

    showToast(message, type = 'info') {
        console.log(`🍞 [TOAST] ${type.toUpperCase()}: ${message}`);
        
        // Remove existing toasts
        const existingToasts = document.querySelectorAll('.toast-notification');
        existingToasts.forEach(toast => toast.remove());

        // Create toast element
        const toast = document.createElement('div');
        toast.className = `toast-notification toast-${type}`;
        toast.innerHTML = `
            <div class="toast-content">
                ${this.getToastIcon(type)} ${message}
            </div>
        `;

        // Add styles if not already present
        if (!document.querySelector('#toast-styles')) {
            const styles = document.createElement('style');
            styles.id = 'toast-styles';
            styles.textContent = `
                .toast-notification {
                    position: fixed;
                    top: 20px;
                    right: 20px;
                    z-index: 9999;
                    padding: 12px 20px;
                    border-radius: 8px;
                    color: white;
                    font-weight: 500;
                    box-shadow: 0 4px 12px rgba(0,0,0,0.3);
                    animation: toastSlideIn 0.3s ease-out;
                    max-width: 300px;
                    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                }
                .toast-success { background: #4CAF50; }
                .toast-error { background: #f44336; }
                .toast-info { background: #2196F3; }
                .toast-warning { background: #FF9800; }
                @keyframes toastSlideIn {
                    from { transform: translateX(100%); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
                @keyframes toastSlideOut {
                    from { transform: translateX(0); opacity: 1; }
                    to { transform: translateX(100%); opacity: 0; }
                }
            `;
            document.head.appendChild(styles);
        }

        // Add to page
        document.body.appendChild(toast);

        // Auto remove after 4 seconds
        setTimeout(() => {
            toast.style.animation = 'toastSlideOut 0.3s ease-in';
            setTimeout(() => toast.remove(), 300);
        }, 4000);
    }

    getToastIcon(type) {
        const icons = {
            success: '✅',
            error: '❌',
            info: 'ℹ️',
            warning: '⚠️'
        };
        return icons[type] || 'ℹ️';
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



    async performBackup() {
        try {
            console.log('📤 [BACKUP DEBUG] Iniciando backup...');
            console.log('📤 [BACKUP DEBUG] isSignedIn:', this.isSignedIn);
            console.log('📤 [BACKUP DEBUG] isInitialized:', this.isInitialized);
            
            if (!this.isSignedIn) {
                throw new Error('Usuário não está logado');
            }

            console.log('📤 [BACKUP DEBUG] Usuário logado, continuando...');
            this.setBackupLoading(true);

            // Get all mood entries from storage
            console.log('📤 [BACKUP DEBUG] Buscando dados do storage...');
            console.log('📤 [BACKUP DEBUG] window.mentalStorage existe:', !!window.mentalStorage);
            
            const entries = await window.mentalStorage.getAllMoodEntries();
            console.log('📤 [BACKUP DEBUG] Dados obtidos:', entries ? entries.length : 0, 'entradas');
            
            if (!entries || entries.length === 0) {
                throw new Error('Nenhum dado para fazer backup');
            }

            // Create backup data
            console.log('📤 [BACKUP DEBUG] Criando dados de backup...');
            const backupData = {
                version: '3.1',
                timestamp: new Date().toISOString(),
                deviceFingerprint: this.generateDeviceFingerprint(),
                entries: entries,
                totalEntries: entries.length
            };
            console.log('📤 [BACKUP DEBUG] Dados criados, tamanho:', JSON.stringify(backupData).length, 'chars');

            // Encrypt backup data
            console.log('📤 [BACKUP DEBUG] Iniciando criptografia...');
            const encryptedData = await this.encryptBackupData(JSON.stringify(backupData));
            console.log('📤 [BACKUP DEBUG] Dados criptografados, tamanho:', encryptedData.length, 'chars');
            
            // Upload to Google Drive
            console.log('📤 [BACKUP DEBUG] Iniciando upload para Google Drive...');
            const fileId = await this.uploadToDrive(encryptedData);
            console.log('📤 [BACKUP DEBUG] Upload concluído, file ID:', fileId);
            
            console.log('✅ Backup realizado com sucesso:', fileId);
            this.showToast('Backup realizado com sucesso! 🎉', 'success');
            
            return fileId;
            
        } catch (error) {
            console.error('❌ [BACKUP DEBUG] Erro no backup:', error);
            console.error('❌ [BACKUP DEBUG] Tipo do erro:', typeof error);
            console.error('❌ [BACKUP DEBUG] Stack trace:', error.stack);
            console.error('❌ [BACKUP DEBUG] Mensagem completa:', error.message);
            
            let errorMessage = 'Erro ao fazer backup. Tente novamente.';
            if (error.message.includes('não está logado')) {
                errorMessage = 'Faça login no Google Drive primeiro.';
            } else if (error.message.includes('Nenhum dado')) {
                errorMessage = 'Nenhum dado encontrado para backup.';
            } else if (error.message.includes('criptografia')) {
                errorMessage = 'Erro na criptografia dos dados.';
            } else if (error.message.includes('GAPI não está inicializado')) {
                errorMessage = 'Google APIs não carregadas. Recarregue a página.';
            } else if (error.message.includes('Failed to fetch')) {
                errorMessage = 'Erro de conexão. Verifique sua internet.';
            }
            
            this.showToast(errorMessage + ' (Detalhes no console)', 'error');
            throw error;
            
        } finally {
            this.setBackupLoading(false);
        }
    }

    async uploadToDrive(encryptedData) {
        console.log('☁️ [BACKUP DEBUG] Preparando upload para Drive...');
        const boundary = '-------314159265358979323846';
        const delimiter = "\r\n--" + boundary + "\r\n";
        const close_delim = "\r\n--" + boundary + "--";

        const fileName = `MentalIA_Backup_${new Date().toISOString().split('T')[0]}.json`;
        console.log('☁️ [BACKUP DEBUG] Nome do arquivo:', fileName);
        
        const metadata = {
            'name': fileName,
            'parents': ['appDataFolder'], // Hidden from user
            'description': 'MentalIA encrypted backup'
        };
        console.log('☁️ [BACKUP DEBUG] Metadata:', metadata);

        const multipartRequestBody =
            delimiter +
            'Content-Type: application/json\r\n\r\n' +
            JSON.stringify(metadata) +
            delimiter +
            'Content-Type: application/json\r\n\r\n' +
            encryptedData +
            close_delim;

        console.log('☁️ [BACKUP DEBUG] Verificando GAPI...');
        if (typeof gapi === 'undefined' || !gapi.client) {
            throw new Error('GAPI não está inicializado');
        }
        
        console.log('☁️ [BACKUP DEBUG] Criando requisição...');
        const request = gapi.client.request({
            'path': 'https://www.googleapis.com/upload/drive/v3/files',
            'method': 'POST',
            'params': {'uploadType': 'multipart'},
            'headers': {
                'Content-Type': 'multipart/related; boundary="' + boundary + '"'
            },
            'body': multipartRequestBody
        });

        console.log('☁️ [BACKUP DEBUG] Executando requisição...');
        const response = await request;
        console.log('☁️ [BACKUP DEBUG] Resposta recebida:', response);
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
                
                // Verificar se está em modo offline
                if (this.isOfflineMode) {
                    console.log('📴 [BACKUP] Modal em modo offline, fazendo backup local');
                    await this.performLocalBackup();
                } else {
                    console.log('☁️ [BACKUP] Modal em modo online, fazendo backup no Drive');
                    await this.performBackup();
                }
            });
        }

        if (cancelBackupBtn) {
            cancelBackupBtn.addEventListener('click', () => {
                modal.classList.remove('show');
            });
        }
    }

    async handleBackupClick() {
        console.log('🔘 [BACKUP DEBUG] handleBackupClick chamado');
        console.log('🔘 [BACKUP DEBUG] Modo offline:', this.isOfflineMode);
        
        if (this.isOfflineMode) {
            // Modo offline - oferecer opções
            try {
                const choice = confirm('📴 Modo Offline Ativo\n\nEscolha uma opção:\nOK = Backup Local (baixar arquivo)\nCancelar = Configurar Google Drive');
                
                if (choice) {
                    console.log('💾 [BACKUP] Usuário escolheu backup local');
                    await this.performLocalBackup();
                } else {
                    console.log('🔧 [BACKUP] Usuário escolheu configurar Google Drive');
                    this.promptClientIdSetup();
                }
            } catch (error) {
                console.error('📴 [BACKUP] Erro no modo offline:', error);
                this.showToast('Erro no modo offline: ' + error.message, 'error');
            }
            return;
        }
        
        console.log('🔘 [BACKUP DEBUG] Estado atual - isSignedIn:', this.isSignedIn, 'isInitialized:', this.isInitialized);
        
        // Check if user is signed in
        if (!this.isSignedIn) {
            console.log('🔘 [BACKUP DEBUG] Usuário não logado, solicitando login...');
            // Request login first
            const loginSuccess = await this.requestLogin();
            console.log('🔘 [BACKUP DEBUG] Resultado do login:', loginSuccess);
            if (!loginSuccess) {
                console.log('🔘 [BACKUP DEBUG] Login falhou, abortando backup');
                return; // Login failed, abort backup
            }
        }

        console.log('🔘 [BACKUP DEBUG] Mostrando modal de confirmação...');
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