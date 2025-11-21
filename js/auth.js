/**
 * Authentication System for MentalIA
 * Handles login, registration, and premium payments
 */

class AuthSystem {
    constructor() {
        this.apiUrl = 'https://api-mentalia.herokuapp.com'; // Placeholder - to be implemented
        this.currentUser = null;
        this.isPremium = false;
        
        this.init();
    }
    
    async init() {
        console.log('🔐 [AUTH] Inicializando sistema de autenticação...');
        
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
                    loginTime: Date.now()
                };
                
                localStorage.setItem('mentalia_session', JSON.stringify(sessionData));
                localStorage.setItem('mentalia_premium', response.isPremium ? 'true' : 'false');
                
                this.currentUser = sessionData;
                this.isPremium = response.isPremium;
                
                this.showToast('Login realizado com sucesso! 🎉', 'success');
                
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
            
            if (userEmail) userEmail.textContent = this.currentUser.email;
            if (userPlan) {
                userPlan.textContent = this.isPremium ? 'Premium' : 'Gratuito';
                userPlan.className = `plan-badge ${this.isPremium ? 'premium' : 'free'}`;
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
                unit_price: 79.90
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
            // Mock login validation
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