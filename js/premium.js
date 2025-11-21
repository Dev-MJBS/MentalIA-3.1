// js/premium.js - Sistema de Premium do MentalIA 3.1
class PremiumManager {
    constructor() {
        this.stripePublicKey = window.STRIPE_PUBLIC_KEY || 'CONFIGURE_SUA_CHAVE_PUBLICA_STRIPE'; // Configure no .env
        this.stripe = null;
        this.plans = {
            monthly: 'price_1SW1Y1ABSqS06Hy4BElLP4ai', // ID do preço mensal no Stripe - R$ 5,90/mês
            annual: 'price_1SW1YHABSqS06Hy4xDgkezV7'   // ID do preço anual no Stripe - R$ 49,90/ano
        };
        this.init();
    }

    async init() {
        console.log('🚀 Inicializando PremiumManager...');
        
        try {
            // Carrega Stripe SDK primeiro (independente do MentalIA)
            if (!window.Stripe) {
                console.log('📦 Carregando Stripe SDK...');
                await this.loadStripeSDK();
            }
            this.stripe = Stripe(this.stripePublicKey);
            console.log('✅ Stripe SDK carregado');
            
            // Setup básico sempre funciona
            this.setupEventListeners();
            console.log('✅ Event listeners configurados');
            
            // Aguarda MentalIA (sem bloquear se falhar)
            const mentalIAReady = await this.waitForMentalIA();
            
            if (mentalIAReady) {
                // Se MentalIA estiver pronto, verifica status premium
                await this.checkPremiumStatus();
                console.log('✅ Status premium verificado');
            } else {
                // Se MentalIA não estiver pronto, configura inicialização tardia
                console.log('⏳ Configurando inicialização tardia...');
                this.setupLateInitialization();
            }
            
            console.log('✅ PremiumManager inicializado com sucesso!');
            
        } catch (error) {
            console.error('❌ Erro na inicialização do Premium:', error);
            // Não falha completamente, permite funcionalidade básica
            this.setupEventListeners();
            this.setupLateInitialization();
        }
    }
    
    // Configura inicialização tardia para quando MentalIA estiver pronto
    setupLateInitialization() {
        console.log('🔄 Configurando inicialização tardia...');
        
        // Verifica periodicamente se MentalIA ficou disponível
        const checkInterval = setInterval(async () => {
            if (window.mentalIA && typeof window.mentalIA.getGoogleUser === 'function') {
                console.log('🎉 MentalIA agora disponível! Finalizando inicialização...');
                clearInterval(checkInterval);
                
                try {
                    await this.checkPremiumStatus();
                    console.log('✅ Inicialização tardia concluída');
                } catch (error) {
                    console.error('❌ Erro na inicialização tardia:', error);
                }
            }
        }, 500);
        
        // Para de verificar após 30 segundos
        setTimeout(() => {
            clearInterval(checkInterval);
            console.log('⏱️ Timeout da inicialização tardia');
        }, 30000);
    }

    async waitForMentalIA() {
        console.log('🔄 Aguardando MentalIA inicializar...');
        
        let attempts = 0;
        const maxAttempts = 100; // 10 segundos máximo
        
        while (attempts < maxAttempts) {
            // Verifica se MentalIA existe e está inicializado
            if (window.mentalIA && 
                typeof window.mentalIA.getGoogleUser === 'function' &&
                window.mentalIA.isInitialized !== false) {
                console.log('✅ MentalIA carregado com sucesso!');
                return true;
            }
            
            // Verifica se DOM ainda está carregando
            if (document.readyState !== 'complete') {
                console.log('⏳ Aguardando DOM completar...');
            }
            
            await new Promise(resolve => setTimeout(resolve, 100));
            attempts++;
            
            // Log de progresso a cada segundo
            if (attempts % 10 === 0) {
                console.log(`⏳ Tentativa ${attempts}/${maxAttempts} - Aguardando MentalIA...`);
            }
        }
        
        console.warn('⚠️ MentalIA não foi carregado a tempo. Usando modo fallback.');
        return false;
    }

    // Helper method to safely get Google user with multiple fallback strategies
    async getGoogleUser() {
        try {
            console.log('🔍 Tentando obter usuário Google...');
            
            // Estratégia 1: Tentar aguardar MentalIA
            if (!window.mentalIA) {
                console.log('⏳ MentalIA não encontrado, aguardando...');
                const mentalIAReady = await this.waitForMentalIA();
                
                if (!mentalIAReady) {
                    // Estratégia 2: Fallback para auth direta
                    return await this.getGoogleUserFallback();
                }
            }
            
            // Verifica se método existe
            if (typeof window.mentalIA.getGoogleUser !== 'function') {
                console.warn('⚠️ Método getGoogleUser não disponível, usando fallback');
                return await this.getGoogleUserFallback();
            }
            
            // Estratégia principal: usar MentalIA
            const user = await window.mentalIA.getGoogleUser();
            console.log('✅ Usuário obtido via MentalIA:', user ? user.email : 'não logado');
            return user;
            
        } catch (error) {
            console.error('❌ Erro ao obter usuário via MentalIA:', error.message);
            
            // Estratégia 3: Último fallback
            try {
                return await this.getGoogleUserFallback();
            } catch (fallbackError) {
                console.error('❌ Todos os métodos falharam:', fallbackError.message);
                throw new Error('Não foi possível obter usuário. Tente recarregar a página.');
            }
        }
    }
    
    // Método de fallback para obter usuário diretamente do localStorage ou auth
    async getGoogleUserFallback() {
        console.log('🔄 Usando método de fallback para obter usuário...');
        
        try {
            // Verifica localStorage primeiro
            const sessionData = localStorage.getItem('mentalia_session');
            if (sessionData) {
                const user = JSON.parse(sessionData);
                if (user && user.email) {
                    console.log('✅ Usuário obtido via localStorage:', user.email);
                    return user;
                }
            }
            
            // Verifica se auth está disponível
            if (window.mentalIA && window.mentalIA.auth && typeof window.mentalIA.auth.getCurrentUser === 'function') {
                const user = await window.mentalIA.auth.getCurrentUser();
                if (user) {
                    console.log('✅ Usuário obtido via auth:', user.email);
                    return user;
                }
            }
            
            // Sem usuário logado
            console.log('ℹ️ Nenhum usuário logado encontrado');
            return null;
            
        } catch (error) {
            console.error('❌ Erro no fallback:', error);
            return null;
        }
    }

    async loadStripeSDK() {
        return new Promise((resolve, reject) => {
            if (window.Stripe) {
                resolve();
                return;
            }
            
            const script = document.createElement('script');
            script.src = 'https://js.stripe.com/v3/';
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
        });
    }

    setupEventListeners() {
        // Botões de assinatura
        document.addEventListener('click', (e) => {
            if (e.target.matches('[data-premium-plan]')) {
                const plan = e.target.dataset.premiumPlan;
                this.startCheckout(plan);
            }
            
            if (e.target.matches('[data-manage-subscription]')) {
                this.openCustomerPortal();
            }
            
            if (e.target.matches('[data-show-premium]')) {
                this.showPremiumScreen();
            }
        });

        // Escuta evento de ativação premium
        window.addEventListener('premiumActivated', (e) => {
            this.onPremiumActivated(e.detail);
        });
    }

    async startCheckout(plan, retryCount = 0) {
        return this.startCheckoutInternal(plan, retryCount, false);
    }
    
    async startTrialCheckout(plan = 'monthly', retryCount = 0) {
        return this.startCheckoutInternal(plan, retryCount, true);
    }
    
    async startCheckoutInternal(plan, retryCount = 0, isTrial = false) {
        const maxRetries = 3;
        
        try {
            const loadingMsg = isTrial ? 
                `Preparando teste grátis... ${retryCount > 0 ? `(Tentativa ${retryCount + 1})` : ''}` :
                `Preparando pagamento... ${retryCount > 0 ? `(Tentativa ${retryCount + 1})` : ''}`;
                
            this.showLoading(loadingMsg);
            
            const user = await this.getGoogleUser();
            if (!user) {
                // Se não conseguiu o usuário, mostra opção de login
                this.hideLoading();
                this.showError('É necessário fazer login primeiro. Redirecionando...');
                
                // Tenta abrir tela de login se disponível
                setTimeout(() => {
                    if (window.mentalIA && typeof window.mentalIA.showScreen === 'function') {
                        window.mentalIA.showScreen('welcome');
                    } else {
                        window.location.reload();
                    }
                }, 2000);
                
                return;
            }

            // Modo desenvolvimento - usa mock API
            if (window.location.hostname === 'localhost' || 
                window.location.hostname.includes('github.io')) {
                
                console.log('🧪 Modo desenvolvimento - usando Mock API');
                
                const mockResult = await window.mockStripeAPI.createCheckout(
                    this.plans[plan], 
                    user.email,
                    isTrial
                );
                
                this.hideLoading();
                
                // Simula sucesso após 2 segundos
                setTimeout(() => {
                    if (isTrial) {
                        this.showSuccess('Trial de 7 dias ativado! Bem-vindo ao Premium! 🎉');
                        localStorage.setItem('mock_premium', 'true');
                        localStorage.setItem('mock_trial', JSON.stringify({
                            startDate: new Date().getTime(),
                            endDate: new Date().getTime() + (7 * 24 * 60 * 60 * 1000),
                            plan: plan
                        }));
                        
                        // Dispatch trial activation event
                        window.dispatchEvent(new CustomEvent('premiumActivated', {
                            detail: { trial: true, plan: plan }
                        }));
                    } else {
                        this.showSuccess('Checkout simulado! Ativando premium... 🎉');
                        localStorage.setItem('mock_premium', 'true');
                    }
                    this.checkPremiumStatus();
                }, 2000);
                
                return;
            }

            // Modo produção - usa API real
            const response = await fetch('/api/create-checkout', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    priceId: this.plans[plan],
                    userId: user.email,
                    userEmail: user.email,
                    userName: user.name,
                    trial: isTrial,
                    trialDays: isTrial ? 7 : 0
                })
            });

            if (!response.ok) {
                throw new Error('Erro ao criar checkout');
            }

            const { sessionId } = await response.json();
            
            this.hideLoading();
            
            // Redireciona para checkout Stripe
            const { error } = await this.stripe.redirectToCheckout({
                sessionId: sessionId
            });

            if (error) {
                throw new Error(error.message);
            }

        } catch (error) {
            this.hideLoading();
            console.error('Checkout error:', error);
            
            // Se o erro é de inicialização e ainda temos tentativas
            if (error.message.includes('MentalIA ainda não foi inicializado') && retryCount < maxRetries) {
                console.log(`🔄 Tentando novamente em 2 segundos... (${retryCount + 1}/${maxRetries})`);
                
                this.showLoading('MentalIA carregando... Tentando novamente...');
                
                setTimeout(() => {
                    this.hideLoading();
                    if (isTrial) {
                        this.startTrialCheckout(plan, retryCount + 1);
                    } else {
                        this.startCheckout(plan, retryCount + 1);
                    }
                }, 2000);
                
                return;
            }
            
            // Erro final ou outros tipos de erro
            let errorMessage = error.message;
            
            // Mensagens mais amigáveis
            if (error.message.includes('MentalIA ainda não foi inicializado')) {
                errorMessage = 'Sistema ainda carregando. Tente recarregar a página.';
            } else if (error.message.includes('Não foi possível obter usuário')) {
                errorMessage = 'Problema de conexão. Tente recarregar a página.';
            }
            
            this.showError('Erro no pagamento: ' + errorMessage);
            
            // Oferece opção de recarregar página
            setTimeout(() => {
                if (confirm('Deseja recarregar a página para tentar novamente?')) {
                    window.location.reload();
                }
            }, 3000);
        }
    }

    async openCustomerPortal() {
        try {
            this.showLoading('Abrindo gerenciamento...');
            
            const user = await this.getGoogleUser();
            if (!user) {
                throw new Error('Faça login primeiro');
            }

            const response = await fetch('/api/create-portal-session', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    userEmail: user.email
                })
            });

            if (!response.ok) {
                throw new Error('Erro ao abrir portal');
            }

            const { url } = await response.json();
            window.open(url, '_blank');
            
            this.hideLoading();

        } catch (error) {
            this.hideLoading();
            this.showError('Erro: ' + error.message);
        }
    }

    async checkPremiumStatus() {
        try {
            const user = await window.app.getGoogleUser();
            if (!user) return false;

            // Verifica no IndexedDB local primeiro
            const localStatus = await this.getLocalPremiumStatus(user.email);
            if (localStatus && localStatus.expires > Date.now()) {
                this.updatePremiumUI(true);
                return true;
            }

            // Modo desenvolvimento - usa mock API
            if (window.location.hostname === 'localhost' || 
                window.location.hostname.includes('github.io')) {
                
                const mockResult = await window.mockStripeAPI.checkPremium(user.email);
                
                if (mockResult.isPremium) {
                    await this.setLocalPremiumStatus(user.email, mockResult.expiresAt);
                    this.updatePremiumUI(true);
                    return true;
                }
                
                this.updatePremiumUI(false);
                return false;
            }

            // Modo produção - verifica no servidor
            const response = await fetch('/api/check-premium', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    userEmail: user.email
                })
            });

            if (response.ok) {
                const { isPremium, expiresAt } = await response.json();
                
                if (isPremium) {
                    await this.setLocalPremiumStatus(user.email, expiresAt);
                    this.updatePremiumUI(true);
                    return true;
                }
            }

            this.updatePremiumUI(false);
            return false;

        } catch (error) {
            console.error('Error checking premium status:', error);
            return false;
        }
    }

    async getLocalPremiumStatus(userEmail) {
        try {
            const encrypted = localStorage.getItem(`premium_${userEmail}`);
            if (!encrypted) return null;

            const decrypted = await window.storage.decrypt(encrypted);
            return JSON.parse(decrypted);
        } catch (error) {
            console.error('Error getting local premium status:', error);
            return null;
        }
    }

    async setLocalPremiumStatus(userEmail, expiresAt) {
        try {
            const premiumData = {
                isPremium: true,
                expires: new Date(expiresAt).getTime(),
                activatedAt: Date.now()
            };

            const encrypted = await window.storage.encrypt(JSON.stringify(premiumData));
            localStorage.setItem(`premium_${userEmail}`, encrypted);
            
        } catch (error) {
            console.error('Error setting local premium status:', error);
        }
    }

    updatePremiumUI(isPremium) {
        // Atualiza classe no body
        document.body.classList.toggle('premium-user', isPremium);
        
        // Mostra/esconde elementos premium
        const premiumElements = document.querySelectorAll('[data-premium-only]');
        premiumElements.forEach(el => {
            el.style.display = isPremium ? '' : 'none';
        });

        // Mostra/esconde elementos free
        const freeElements = document.querySelectorAll('[data-free-only]');
        freeElements.forEach(el => {
            el.style.display = isPremium ? 'none' : '';
        });

        // Atualiza botões
        const upgradeButtons = document.querySelectorAll('[data-show-premium]');
        upgradeButtons.forEach(btn => {
            btn.style.display = isPremium ? 'none' : '';
        });

        const manageButtons = document.querySelectorAll('[data-manage-subscription]');
        manageButtons.forEach(btn => {
            btn.style.display = isPremium ? '' : 'none';
        });

        // Remove watermarks se premium
        if (isPremium) {
            const watermarks = document.querySelectorAll('.mentalia-watermark');
            watermarks.forEach(w => w.style.display = 'none');
        }
    }

    showPremiumScreen() {
        // Implementar modal ou página de premium
        const premiumModal = document.getElementById('premium-modal');
        if (premiumModal) {
            premiumModal.style.display = 'flex';
        } else {
            // Se não existe modal, navega para página
            window.location.href = '/premium.html';
        }
    }

    onPremiumActivated(data) {
        this.showSuccess('Premium ativado com sucesso! 🎉');
        this.updatePremiumUI(true);
        
        // Atualiza interface se necessário
        if (window.mentalIA && typeof window.mentalIA.init === 'function') {
            // Força recarregamento da interface
            setTimeout(() => {
                window.location.reload();
            }, 2000);
        }
    }

    showLoading(message = 'Carregando...') {
        // Remove loading anterior se existir
        this.hideLoading();
        
        const loading = document.createElement('div');
        loading.id = 'premium-loading';
        loading.className = 'premium-loading';
        loading.innerHTML = `
            <div class="loading-backdrop">
                <div class="loading-content">
                    <div class="loading-spinner"></div>
                    <p>${message}</p>
                </div>
            </div>
        `;
        
        document.body.appendChild(loading);
    }

    hideLoading() {
        const loading = document.getElementById('premium-loading');
        if (loading) {
            loading.remove();
        }
    }

    showSuccess(message) {
        this.showToast(message, 'success');
    }

    showError(message) {
        this.showToast(message, 'error');
    }

    showToast(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `premium-toast premium-toast-${type}`;
        toast.innerHTML = `
            <div class="toast-content">
                <span class="toast-icon">${type === 'success' ? '✅' : type === 'error' ? '❌' : 'ℹ️'}</span>
                <span class="toast-message">${message}</span>
                <button class="toast-close" onclick="this.parentElement.parentElement.remove()">×</button>
            </div>
        `;
        
        document.body.appendChild(toast);
        
        // Auto remove após 5 segundos
        setTimeout(() => {
            if (toast.parentElement) {
                toast.remove();
            }
        }, 5000);
    }

    // Métodos utilitários para verificação premium
    async isPremium() {
        const user = await this.getGoogleUser();
        if (!user) return false;
        
        const status = await this.getLocalPremiumStatus(user.email);
        return status && status.expires > Date.now();
    }

    async requirePremium(feature = 'Esta funcionalidade') {
        const isPremium = await this.isPremium();
        if (!isPremium) {
            this.showError(`${feature} está disponível apenas no Premium. Faça upgrade!`);
            setTimeout(() => this.showPremiumScreen(), 2000);
            return false;
        }
        return true;
    }
}

// Sistema de inicialização inteligente do Premium
(function() {
    'use strict';
    
    console.log('🎯 Carregando sistema Premium...');
    
    // Função para inicializar premium de forma segura
    async function initializePremium() {
        try {
            if (window.premiumManager) {
                console.log('✅ PremiumManager já existe');
                return;
            }
            
            console.log('🚀 Criando PremiumManager...');
            window.premiumManager = new PremiumManager();
            console.log('✅ PremiumManager criado com sucesso');
            
        } catch (error) {
            console.error('❌ Erro ao criar PremiumManager:', error);
            
            // Retry após 1 segundo
            setTimeout(() => {
                console.log('🔄 Tentando criar PremiumManager novamente...');
                initializePremium();
            }, 1000);
        }
    }
    
    // Estratégia 1: Se DOM já está pronto
    if (document.readyState === 'complete' || document.readyState === 'interactive') {
        console.log('📋 DOM já pronto, inicializando Premium...');
        initializePremium();
    } else {
        // Estratégia 2: Aguardar DOM ficar pronto
        console.log('⏳ Aguardando DOM ficar pronto...');
        document.addEventListener('DOMContentLoaded', () => {
            console.log('📋 DOM pronto, inicializando Premium...');
            initializePremium();
        });
    }
    
    // Estratégia 3: Fallback com timeout
    setTimeout(() => {
        if (!window.premiumManager) {
            console.log('⏰ Timeout - forçando inicialização Premium...');
            initializePremium();
        }
    }, 2000);
    
})();

// Export para uso em outros módulos
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PremiumManager;
}