/**
 * Authentication System for MentalIA
 * Handles login, registration, and premium payments
 */

class AuthSystem {
    constructor() {
        this.apiUrl = 'https://api-mentalia.herokuapp.com'; // Placeholder - to be implemented
        this.currentUser = null;
        this.isPremium = false;
        this.googleAuth = null;
        this.isGoogleReady = false;
        
        this.init();
    }
    
    async init() {
        console.log('🔐 [AUTH] Inicializando sistema de autenticação...');

        // Initialize Google OAuth with delay to ensure script is loaded
        setTimeout(() => {
            this.initGoogleAuth();
        }, 1000);

        // Check if user is already logged in
        await this.checkAuthStatus();

        // Setup event listeners
        this.setupEventListeners();

        // Update UI based on auth status
        this.updateUI();

        console.log('🔐 [AUTH] Sistema de autenticação inicializado');
    }
    
    setupEventListeners() {
        // Login toggle button
        const loginToggle = document.getElementById('login-toggle');
        if (loginToggle) {
            loginToggle.addEventListener('click', () => this.showLoginScreen());
        }
        
        // Logout button
        const logoutBtn = document.getElementById('logout-btn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => this.logout());
        }
        
        // Tab switching
        const tabBtns = document.querySelectorAll('.tab-btn');
        tabBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const tab = e.target.dataset.tab;
                this.switchTab(tab);
            });
        });
        
        // Login form
        const loginForm = document.getElementById('login-form');
        if (loginForm) {
            loginForm.addEventListener('submit', (e) => this.handleLogin(e));
        }
        
        // Register form
        const registerForm = document.getElementById('register-form');
        if (registerForm) {
            registerForm.addEventListener('submit', (e) => this.handleRegister(e));
        }
        
        // Premium upgrade button
        const upgradeBtn = document.getElementById('upgrade-btn');
        if (upgradeBtn) {
            upgradeBtn.addEventListener('click', () => this.handlePremiumUpgrade());
        }
        
        // Google Sign-In buttons
        const googleSignInBtn = document.getElementById('google-signin-btn');
        if (googleSignInBtn) {
            googleSignInBtn.addEventListener('click', () => this.handleGoogleSignIn());
        }
        
        const googleSignUpBtn = document.getElementById('google-signup-btn');
        if (googleSignUpBtn) {
            googleSignUpBtn.addEventListener('click', () => this.handleGoogleSignIn());
        }
    }
    
    async initGoogleAuth() {
        console.log('🔐 [GOOGLE] Inicializando Google OAuth...');

        try {
            // Wait for Google API to be loaded
            if (typeof google === 'undefined') {
                console.warn('🔐 [GOOGLE] Google API não carregada ainda, aguardando...');

                // Try to initialize anyway after a delay
                setTimeout(() => {
                    if (window.google && window.google.accounts) {
                        console.log('🔐 [GOOGLE] Google API carregada após delay');
                        this.initializeGIS();
                    } else {
                        console.warn('🔐 [GOOGLE] Google API ainda não disponível');
                    }
                }, 2000);

                return;
            }

            // Check if Google API is available
            if (window.google && window.google.accounts) {
                this.isGoogleReady = true;
                console.log('🔐 [GOOGLE] Google API disponível');

                // Initialize Google Identity Services
                this.initializeGIS();
            } else {
                console.log('🔐 [GOOGLE] Google API não disponível - tentando novamente em 2s...');

                // Retry after delay
                setTimeout(() => {
                    this.initGoogleAuth();
                }, 2000);
            }

        } catch (error) {
            console.error('🔐 [GOOGLE] Erro ao inicializar OAuth:', error);
        }
    }
    
    initializeGIS() {
        try {
            console.log('🔐 [GOOGLE] Inicializando Google Identity Services...');
            
            // Initialize Google Identity Services
            google.accounts.id.initialize({
                client_id: '1014430012172-v8qq7daet33ug7cg2en7di05o77e4vbs.apps.googleusercontent.com',
                callback: (response) => this.handleGoogleCallback(response),
                auto_select: false,
                cancel_on_tap_outside: true
            });
            
            console.log('🔐 [GOOGLE] GIS inicializado com sucesso');
            
        } catch (error) {
            console.error('🔐 [GOOGLE] Erro ao inicializar GIS:', error);
        }
    }
    
    async handleGoogleCallback(response) {
        try {
            console.log('🔐 [GOOGLE] Login callback recebido');
            
            // Decode JWT token
            const payload = this.parseJWT(response.credential);
            
            if (payload) {
                // Create user session
                const user = {
                    id: payload.sub,
                    name: payload.name,
                    email: payload.email,
                    picture: payload.picture,
                    provider: 'google',
                    token: response.credential,
                    googleAccessToken: null // Will be obtained later for Drive access
                };
                
                // Save session
                this.currentUser = user;
                localStorage.setItem('mentalia_session', JSON.stringify(user));
                
                console.log('🔐 [GOOGLE] Login realizado:', user.email);
                
                // Update UI
                this.updateUI();
                
                // Hide login screen and show main app
                this.hideLoginScreen();
                
                // Setup Google Drive backup automatically
                this.setupGoogleDriveBackupForUser(user);
                
                this.showToast('Login realizado com sucesso! 🎉', 'success');
                
            } else {
                throw new Error('Token inválido');
            }
            
        } catch (error) {
            console.error('🔐 [GOOGLE] Erro no login:', error);
            this.showToast('Erro no login com Google', 'error');
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
    
    setupGoogleDriveBackupForUser(user) {
        try {
            console.log('📁 [BACKUP] Configurando backup automático para usuário...');
            
            if (window.googleDriveBackup) {
                // Set user info for backup system
                window.googleDriveBackup.userEmail = user.email;
                window.googleDriveBackup.userName = user.name;
                
                console.log('📁 [BACKUP] Usuário configurado no sistema de backup:', user.email);
                
                // Show info about backup being available
                setTimeout(() => {
                    this.showToast('Backup no Google Drive disponível! Clique em "Backup" para salvar seus dados 📁', 'info');
                }, 2000);
            } else {
                console.warn('📁 [BACKUP] Sistema de backup não disponível');
            }
            
        } catch (error) {
            console.error('📁 [BACKUP] Erro ao configurar backup:', error);
        }
    }
    
    handleGoogleSignIn() {
        try {
            console.log('🔐 [GOOGLE] Iniciando processo de login...');

            if (this.isGoogleReady && window.google && window.google.accounts && window.google.accounts.id) {
                console.log('🔐 [GOOGLE] Usando Google Identity Services diretamente');

                // Use renderButton to create a proper sign-in button
                const tempContainer = document.createElement('div');
                tempContainer.style.position = 'fixed';
                tempContainer.style.top = '-1000px';
                document.body.appendChild(tempContainer);

                google.accounts.id.renderButton(tempContainer, {
                    theme: 'outline',
                    size: 'large',
                    type: 'standard',
                    text: 'signin_with',
                    shape: 'rectangular',
                    logo_alignment: 'left'
                });

                // Click the rendered button
                const button = tempContainer.querySelector('div[role="button"]');
                if (button) {
                    button.click();
                } else {
                    // Fallback: try prompt
                    google.accounts.id.prompt();
                }

                // Clean up
                setTimeout(() => {
                    if (tempContainer.parentNode) {
                        tempContainer.parentNode.removeChild(tempContainer);
                    }
                }, 1000);

            } else {
                console.log('🔐 [GOOGLE] GIS não disponível, tentando inicializar...');
                this.tryInitializeAndSignIn();
            }
        } catch (error) {
            console.error('🔐 [GOOGLE] Erro no login:', error);
            this.showToast('Erro no login com Google. Tente novamente.', 'error');
        }
    }

    async tryInitializeAndSignIn() {
        try {
            console.log('🔐 [GOOGLE] Tentando inicializar GIS...');

            // Wait a bit for Google script to load
            let attempts = 0;
            const maxAttempts = 50;

            const checkAndInit = () => {
                attempts++;
                console.log(`🔄 [GOOGLE] Tentativa ${attempts}/${maxAttempts} de inicialização`);

                if (window.google && window.google.accounts && window.google.accounts.id) {
                    console.log('✅ [GOOGLE] GIS carregado, inicializando...');

                    // Initialize GIS
                    google.accounts.id.initialize({
                        client_id: '1014430012172-v8qq7daet33ug7cg2en7di05o77e4vbs.apps.googleusercontent.com',
                        callback: (response) => this.handleGoogleCallback(response),
                        auto_select: false,
                        cancel_on_tap_outside: true
                    });

                    this.isGoogleReady = true;

                    // Now try to sign in
                    this.handleGoogleSignIn();

                } else if (attempts >= maxAttempts) {
                    console.warn('⚠️ [GOOGLE] GIS não carregou após tentativas, mostrando diálogo alternativo');
                    this.showGoogleSetupDialog();
                } else {
                    setTimeout(checkAndInit, 200);
                }
            };

            checkAndInit();

        } catch (error) {
            console.error('🔐 [GOOGLE] Erro ao tentar inicializar:', error);
            this.showGoogleSetupDialog();
        }
    }
    
    showGoogleSetupDialog() {
        const dialog = document.createElement('div');
        dialog.className = 'google-setup-dialog';
        dialog.innerHTML = `
            <div class="dialog-overlay">
                <div class="dialog-content">
                    <h3>🔐 Login com Google</h3>
                    <p>Para fazer login com sua conta Google, você precisa:</p>
                    <ol>
                        <li>Ter uma conta Google</li>
                        <li>Autorizar o acesso ao MentalIA</li>
                        <li>Permitir o uso de dados básicos (nome, email)</li>
                    </ol>
                    <div class="dialog-info">
                        <strong>🔒 Privacidade:</strong>
                        <ul>
                            <li>✅ Apenas nome e email são usados</li>
                            <li>✅ Dados ficam apenas no seu dispositivo</li>
                            <li>✅ Backup opcional no Google Drive</li>
                        </ul>
                    </div>
                    <div class="dialog-buttons">
                        <button class="btn-primary" onclick="window.authSystem.startGoogleFlow()">
                            🚀 Continuar com Google
                        </button>
                        <button class="btn-secondary" onclick="this.parentElement.parentElement.parentElement.parentElement.remove();">
                            Cancelar
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(dialog);
        
        // Add styles if not already present
        if (!document.querySelector('#google-dialog-styles')) {
            const style = document.createElement('style');
            style.id = 'google-dialog-styles';
            style.textContent = `
                .google-setup-dialog {
                    position: fixed;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    z-index: 10000;
                }
                .google-setup-dialog .dialog-overlay {
                    position: absolute;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: rgba(0, 0, 0, 0.8);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    padding: 1rem;
                }
                .google-setup-dialog .dialog-content {
                    background: var(--surface);
                    border-radius: 20px;
                    padding: 2rem;
                    max-width: 500px;
                    max-height: 80vh;
                    overflow-y: auto;
                    box-shadow: var(--shadow);
                }
                .google-setup-dialog h3 {
                    color: var(--primary);
                    margin-bottom: 1rem;
                    text-align: center;
                }
                .google-setup-dialog ol, .google-setup-dialog ul {
                    text-align: left;
                    margin: 1rem 0;
                    padding-left: 1.5rem;
                }
                .google-setup-dialog .dialog-info {
                    background: var(--bg-secondary);
                    padding: 1rem;
                    border-radius: 10px;
                    margin: 1rem 0;
                }
                .google-setup-dialog .dialog-buttons {
                    display: flex;
                    gap: 1rem;
                    margin-top: 1.5rem;
                }
                .google-setup-dialog .dialog-buttons button {
                    flex: 1;
                }
            `;
            document.head.appendChild(style);
        }
    }
    
    startGoogleFlow() {
        // Close dialog
        document.querySelector('.google-setup-dialog')?.remove();

        // Show message that Google login is being initialized
        this.showToast('Iniciando login com Google...', 'info');

        // Try to trigger Google Sign-In using the same logic as handleGoogleSignIn
        if (this.isGoogleReady && window.google && window.google.accounts && window.google.accounts.id) {
            console.log('🔐 [GOOGLE] GIS pronto, iniciando login...');

            // Use renderButton to create a proper sign-in button
            const tempContainer = document.createElement('div');
            tempContainer.style.position = 'fixed';
            tempContainer.style.top = '-1000px';
            document.body.appendChild(tempContainer);

            google.accounts.id.renderButton(tempContainer, {
                theme: 'outline',
                size: 'large',
                type: 'standard',
                text: 'signin_with',
                shape: 'rectangular',
                logo_alignment: 'left'
            });

            // Click the rendered button
            const button = tempContainer.querySelector('div[role="button"]');
            if (button) {
                button.click();
            } else {
                // Fallback: try prompt
                google.accounts.id.prompt();
            }

            // Clean up
            setTimeout(() => {
                if (tempContainer.parentNode) {
                    tempContainer.parentNode.removeChild(tempContainer);
                }
            }, 1000);

        } else {
            console.log('🔐 [GOOGLE] GIS não pronto, tentando inicializar...');
            this.tryInitializeAndSignIn();
        }
    }
    
    async checkAuthStatus() {
        try {
            // Check localStorage for session
            const sessionData = localStorage.getItem('mentalia_session');
            const premiumStatus = localStorage.getItem('mentalia_premium');
            
            if (sessionData) {
                const session = JSON.parse(sessionData);
                
                // Validate session (simplified - in production, verify with server)
                if (session.email && session.token) {
                    this.currentUser = session;
                    this.isPremium = premiumStatus === 'true';
                    
                    console.log('🔐 [AUTH] Usuário logado:', session.email);
                    return true;
                }
            }
            
            return false;
        } catch (error) {
            console.error('🔐 [AUTH] Erro ao verificar status:', error);
            return false;
        }
    }
    
    // Admin account pre-registered
    getAdminAccounts() {
        return [
            {
                email: 'mjbs.dev@gmail.com',
                password: '!Band9al7',
                name: 'Administrador MJBS',
                role: 'admin',
                isPremium: true,
                created: new Date().toISOString()
            }
        ];
    }
    
    isAdminAccount(email) {
        const adminAccounts = this.getAdminAccounts();
        return adminAccounts.some(admin => admin.email === email);
    }
    
    showLoginScreen() {
        // Hide all screens
        document.querySelectorAll('.screen').forEach(screen => {
            screen.classList.remove('active');
        });
        
        // Show login screen
        const loginScreen = document.getElementById('login-screen');
        if (loginScreen) {
            loginScreen.classList.add('active');
        }
        
        // Update navigation
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.classList.remove('active');
        });
    }
    
    hideLoginScreen() {
        // Hide login screen
        const loginScreen = document.getElementById('login-screen');
        if (loginScreen) {
            loginScreen.classList.remove('active');
        }
        
        // Show welcome screen
        const welcomeScreen = document.getElementById('welcome-screen');
        if (welcomeScreen) {
            welcomeScreen.classList.add('active');
        }
        
        // Update navigation to welcome
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        
        const welcomeBtn = document.querySelector('[data-screen="welcome"]');
        if (welcomeBtn) {
            welcomeBtn.classList.add('active');
        }
    }
    
    switchTab(tab) {
        // Update tab buttons
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-tab=\"${tab}\"]`).classList.add('active');
        
        // Update forms
        document.querySelectorAll('.auth-form').forEach(form => {
            form.classList.remove('active');
        });
        document.getElementById(`${tab}-form`).classList.add('active');
    }
    
    async handleLogin(e) {
        e.preventDefault();
        
        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;
        
        if (!email || !password) {
            this.showToast('Por favor, preencha todos os campos', 'error');
            return;
        }
        
        try {
            this.setLoading(true);
            
            // Simulate API call (replace with real authentication)
            const response = await this.mockAuthRequest('login', { email, password });
            
            if (response.success) {
                // Store session
                const sessionData = {
                    email: email,
                    token: response.token,
                    loginTime: Date.now(),
                    name: response.name || email.split('@')[0],
                    role: response.role || 'user',
                    isAdmin: response.isAdmin || false
                };
                
                localStorage.setItem('mentalia_session', JSON.stringify(sessionData));
                localStorage.setItem('mentalia_premium', response.isPremium ? 'true' : 'false');
                
                this.currentUser = sessionData;
                this.isPremium = response.isPremium;
                
                const welcomeMsg = response.isAdmin ? 
                    'Bem-vindo, Administrador! 👑' : 
                    'Login realizado com sucesso! 🎉';
                
                this.showToast(welcomeMsg, 'success');
                
                // Return to welcome screen
                setTimeout(() => {
                    this.showWelcomeScreen();
                    this.updateUI();
                }, 1500);
                
            } else {
                this.showToast(response.message || 'Erro no login. Verifique suas credenciais.', 'error');
            }
            
        } catch (error) {
            console.error('🔐 [AUTH] Erro no login:', error);
            this.showToast('Erro de conexão. Tente novamente.', 'error');
        } finally {
            this.setLoading(false);
        }
    }
    
    async handleRegister(e) {
        e.preventDefault();
        
        const email = document.getElementById('register-email').value;
        const password = document.getElementById('register-password').value;
        const confirm = document.getElementById('register-confirm').value;
        
        if (!email || !password || !confirm) {
            this.showToast('Por favor, preencha todos os campos', 'error');
            return;
        }
        
        if (password !== confirm) {
            this.showToast('As senhas não coincidem', 'error');
            return;
        }
        
        if (password.length < 6) {
            this.showToast('A senha deve ter pelo menos 6 caracteres', 'error');
            return;
        }
        
        try {
            this.setLoading(true);
            
            // Simulate API call
            const response = await this.mockAuthRequest('register', { email, password });
            
            if (response.success) {
                // Store session
                const sessionData = {
                    email: email,
                    token: response.token,
                    loginTime: Date.now()
                };
                
                localStorage.setItem('mentalia_session', JSON.stringify(sessionData));
                localStorage.setItem('mentalia_premium', 'false'); // New users start as free
                
                this.currentUser = sessionData;
                this.isPremium = false;
                
                this.showToast('Conta criada com sucesso! Bem-vindo! 🎉', 'success');
                
                // Return to welcome screen
                setTimeout(() => {
                    this.showWelcomeScreen();
                    this.updateUI();
                }, 1500);
                
            } else {
                this.showToast(response.message || 'Erro ao criar conta. Email já pode estar em uso.', 'error');
            }
            
        } catch (error) {
            console.error('🔐 [AUTH] Erro no registro:', error);
            this.showToast('Erro de conexão. Tente novamente.', 'error');
        } finally {
            this.setLoading(false);
        }
    }
    
    async logout() {
        try {
            localStorage.removeItem('mentalia_session');
            localStorage.removeItem('mentalia_premium');
            
            this.currentUser = null;
            this.isPremium = false;
            
            this.showToast('Logout realizado com sucesso', 'success');
            this.updateUI();
            
        } catch (error) {
            console.error('🔐 [AUTH] Erro no logout:', error);
        }
    }
    
    showWelcomeScreen() {
        // Hide all screens
        document.querySelectorAll('.screen').forEach(screen => {
            screen.classList.remove('active');
        });
        
        // Show welcome screen
        const welcomeScreen = document.getElementById('welcome-screen');
        if (welcomeScreen) {
            welcomeScreen.classList.add('active');
        }
        
        // Update navigation
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector('[data-screen=\"welcome\"]').classList.add('active');
    }
    
    updateUI() {
        const loginToggle = document.getElementById('login-toggle');
        const userStatus = document.getElementById('user-status');
        const userEmail = document.getElementById('user-email');
        const userPlan = document.getElementById('user-plan');
        const premiumSection = document.getElementById('premium-section');
        
        if (this.currentUser) {
            // User is logged in
            if (loginToggle) loginToggle.classList.add('hidden');
            if (userStatus) userStatus.classList.remove('hidden');
            
            if (userEmail) {
                const displayName = this.currentUser.name || this.currentUser.email;
                userEmail.textContent = displayName;
            }
            
            if (userPlan) {
                let planText = '';
                let planClass = '';
                
                if (this.currentUser.isAdmin) {
                    planText = 'Administrador';
                    planClass = 'admin';
                } else if (this.isPremium) {
                    planText = 'Premium';
                    planClass = 'premium';
                } else {
                    planText = 'Gratuito';
                    planClass = 'free';
                }
                
                if (this.currentUser.provider === 'google' && this.currentUser.googleAccessToken) {
                    planText += ' + Drive';
                }
                
                userPlan.textContent = planText;
                userPlan.className = `plan-badge ${planClass}`;
            }
            
            // Show premium upgrade section if not premium
            if (premiumSection) {
                if (this.isPremium) {
                    premiumSection.classList.add('hidden');
                } else {
                    premiumSection.classList.remove('hidden');
                }
            }
            
        } else {
            // User is not logged in
            if (loginToggle) loginToggle.classList.remove('hidden');
            if (userStatus) userStatus.classList.add('hidden');
            if (premiumSection) premiumSection.classList.add('hidden');
        }
        
        // Update feature availability
        this.updateFeatureAvailability();
    }
    
    updateFeatureAvailability() {
        // This will be used to limit features for free users
        const isLoggedIn = !!this.currentUser;
        const isPremium = this.isPremium;
        
        // Store in global state for other modules to use
        window.mentalIA = window.mentalIA || {};
        window.mentalIA.auth = {
            isLoggedIn,
            isPremium,
            user: this.currentUser
        };
        
        console.log('🔐 [AUTH] Status atualizado:', { isLoggedIn, isPremium });
    }
    
    async handlePremiumUpgrade() {
        if (!this.currentUser) {
            this.showToast('Faça login primeiro para adquirir o Premium', 'error');
            this.showLoginScreen();
            return;
        }
        
        try {
            this.showToast('Redirecionando para pagamento...', 'info');
            
            // Initialize Mercado Pago checkout
            await this.initMercadoPagoCheckout();
            
        } catch (error) {
            console.error('🔐 [AUTH] Erro no upgrade:', error);
            this.showToast('Erro ao processar pagamento. Tente novamente.', 'error');
        }
    }
    
    async initMercadoPagoCheckout() {
        // Simulate Mercado Pago integration
        // In production, this would create a preference and redirect to checkout
        
        const preferenceData = {
            items: [{
                title: 'MentalIA Premium - Acesso Vitalício',
                quantity: 1,
                unit_price: 19.90
            }],
            back_urls: {
                success: `${window.location.origin}/payment-success`,
                failure: `${window.location.origin}/payment-failure`,
                pending: `${window.location.origin}/payment-pending`
            },
            auto_return: 'approved',
            external_reference: this.currentUser.email
        };
        
        // Mock checkout URL (replace with real Mercado Pago integration)
        const checkoutUrl = `https://www.mercadopago.com.br/checkout/v1/redirect?pref_id=mock_${Date.now()}`;
        
        // Open checkout in new tab
        window.open(checkoutUrl, '_blank');
        
        this.showToast('Janela de pagamento aberta. Complete o pagamento para ativar o Premium.', 'info');
    }
    
    // Mock authentication (replace with real API calls)
    async mockAuthRequest(action, data) {
        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        if (action === 'login') {
            // Check admin accounts first
            const adminAccounts = this.getAdminAccounts();
            const adminAccount = adminAccounts.find(admin => 
                admin.email === data.email && admin.password === data.password
            );
            
            if (adminAccount) {
                return {
                    success: true,
                    token: 'admin_token_' + Date.now(),
                    isPremium: true,
                    isAdmin: true,
                    name: adminAccount.name,
                    role: adminAccount.role
                };
            }
            
            // Mock login validation for other users
            if (data.email === 'demo@mentalia.com' && data.password === '123456') {
                return {
                    success: true,
                    token: 'mock_token_' + Date.now(),
                    isPremium: true
                };
            } else if (data.email.includes('@') && data.password.length >= 6) {
                return {
                    success: true,
                    token: 'mock_token_' + Date.now(),
                    isPremium: false
                };
            } else {
                return {
                    success: false,
                    message: 'Credenciais inválidas'
                };
            }
        }
        
        if (action === 'register') {
            // Mock registration
            if (data.email.includes('@') && data.password.length >= 6) {
                return {
                    success: true,
                    token: 'mock_token_' + Date.now(),
                    isPremium: false
                };
            } else {
                return {
                    success: false,
                    message: 'Dados inválidos'
                };
            }
        }
        
        return { success: false, message: 'Ação não reconhecida' };
    }
    
    setLoading(loading) {
        const forms = document.querySelectorAll('.auth-form');
        forms.forEach(form => {
            if (loading) {
                form.classList.add('loading-auth');
            } else {
                form.classList.remove('loading-auth');
            }
        });
    }
    
    showToast(message, type = 'info') {
        // Remove existing toasts
        document.querySelectorAll('.auth-toast').forEach(toast => {
            toast.remove();
        });
        
        // Create new toast
        const toast = document.createElement('div');
        toast.className = `auth-toast ${type}`;
        toast.textContent = message;
        
        document.body.appendChild(toast);
        
        // Show toast
        setTimeout(() => {
            toast.classList.add('show');
        }, 100);
        
        // Remove toast after 4 seconds
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => {
                if (toast.parentNode) {
                    toast.parentNode.removeChild(toast);
                }
            }, 300);
        }, 4000);
    }
    
    // Utility methods for other modules
    isLoggedIn() {
        return !!this.currentUser;
    }
    
    isPremiumUser() {
        // 🔥 CORREÇÃO: Administrador sempre é premium
        const currentUser = this.getCurrentUser();
        if (currentUser && currentUser.isAdmin) {
            return true;
        }
        return this.isPremium;
    }
    
    getCurrentUser() {
        return this.currentUser;
    }
    
    requireAuth(callback) {
        if (this.isLoggedIn()) {
            callback();
        } else {
            this.showToast('É necessário fazer login para usar esta funcionalidade', 'error');
            this.showLoginScreen();
        }
    }
    
    requirePremium(callback) {
        if (!this.isLoggedIn()) {
            this.showToast('É necessário fazer login primeiro', 'error');
            this.showLoginScreen();
            return;
        }
        
        if (this.isPremiumUser()) {
            callback();
        } else {
            this.showToast('Esta funcionalidade é exclusiva para usuários Premium', 'error');
            // Show premium upgrade section
            const premiumSection = document.getElementById('premium-section');
            if (premiumSection) {
                premiumSection.scrollIntoView({ behavior: 'smooth' });
            }
        }
    }
}

// Initialize authentication system
document.addEventListener('DOMContentLoaded', () => {
    window.authSystem = new AuthSystem();
});

console.log('🔐 Sistema de autenticação carregado');