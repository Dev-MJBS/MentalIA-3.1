// js/premium.js - Sistema de Premium do MentalIA 3.1
class PremiumManager {
    constructor() {
        this.stripePublicKey = 'pk_test_51234567890'; // Substituir pela chave real
        this.stripe = null;
        this.plans = {
            monthly: 'price_monthly_590', // ID do preço mensal no Stripe
            annual: 'price_annual_4990'   // ID do preço anual no Stripe
        };
        this.init();
    }

    async init() {
        // Carrega Stripe SDK se não estiver carregado
        if (!window.Stripe) {
            await this.loadStripeSDK();
        }
        this.stripe = Stripe(this.stripePublicKey);
        
        // Verifica status premium na inicialização
        await this.checkPremiumStatus();
        this.setupEventListeners();
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

    async startCheckout(plan) {
        try {
            this.showLoading('Preparando pagamento...');
            
            const user = await window.app.getGoogleUser();
            if (!user) {
                throw new Error('Faça login com Google primeiro');
            }

            const response = await fetch('/api/create-checkout', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    priceId: this.plans[plan],
                    userId: user.email,
                    userEmail: user.email,
                    userName: user.name
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
            this.showError('Erro no pagamento: ' + error.message);
            console.error('Checkout error:', error);
        }
    }

    async openCustomerPortal() {
        try {
            this.showLoading('Abrindo gerenciamento...');
            
            const user = await window.app.getGoogleUser();
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

            // Verifica no servidor se status local expirou
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
        
        // Recarrega dados se necessário
        if (window.app && window.app.refreshData) {
            window.app.refreshData();
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
        const user = await window.app.getGoogleUser();
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

// Inicializa o gerenciador premium
window.premiumManager = new PremiumManager();

// Export para uso em outros módulos
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PremiumManager;
}