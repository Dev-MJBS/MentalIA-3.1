// js/mock-api.js - Mock Stripe API para desenvolvimento e demonstração
// Simula o comportamento da API Stripe para testes locais

class MockStripeAPI {
    constructor() {
        this.isInitialized = false;
        this.sessions = new Map();
        this.customers = new Map();
        this.subscriptions = new Map();
        this.init();
    }

    init() {
        console.log('🧪 Mock Stripe API inicializada');
        this.isInitialized = true;
    }

    // Simula criação de checkout session com suporte a trial
    async createCheckout(priceId, userEmail, isTrial = false) {
        console.log('🧪 Mock: Criando checkout session...', { priceId, userEmail, isTrial });
        
        // Simula delay da API
        await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 1000));
        
        const sessionId = 'mock_session_' + Math.random().toString(36).substring(7);
        const customerId = this.getOrCreateCustomer(userEmail);
        
        const session = {
            id: sessionId,
            customer: customerId,
            priceId: priceId,
            userEmail: userEmail,
            trial: isTrial,
            trialDays: isTrial ? 7 : 0,
            status: 'open',
            created: new Date().getTime(),
            url: `https://checkout.stripe.com/pay/${sessionId}` // Mock URL
        };
        
        this.sessions.set(sessionId, session);
        
        console.log('✅ Mock checkout session criada:', sessionId);
        
        // Auto-simulate success after a short delay (for demo purposes)
        setTimeout(() => {
            this.simulateSuccessfulPayment(sessionId);
        }, 3000);
        
        return {
            sessionId: sessionId,
            url: session.url
        };
    }

    // Simula criação de portal session
    async createPortalSession(userEmail) {
        console.log('🧪 Mock: Criando portal session...', { userEmail });
        
        await new Promise(resolve => setTimeout(resolve, 500));
        
        const portalSessionId = 'mock_portal_' + Math.random().toString(36).substring(7);
        
        return {
            url: `https://billing.stripe.com/session/${portalSessionId}`
        };
    }

    // Simula verificação de status premium
    async verifyPremiumStatus(userEmail) {
        console.log('🧪 Mock: Verificando status premium...', { userEmail });
        
        await new Promise(resolve => setTimeout(resolve, 300));
        
        // Verifica localStorage para status mock
        const mockPremium = localStorage.getItem('mock_premium');
        const mockTrial = localStorage.getItem('mock_trial');
        
        let status = {
            isPremium: mockPremium === 'true',
            trial: false,
            trialDaysLeft: 0,
            subscription: null
        };
        
        if (mockTrial) {
            try {
                const trialData = JSON.parse(mockTrial);
                const now = new Date().getTime();
                const trialEnd = trialData.endDate;
                
                if (trialEnd > now) {
                    status.trial = true;
                    status.trialDaysLeft = Math.ceil((trialEnd - now) / (1000 * 60 * 60 * 24));
                    status.isPremium = true;
                    
                    status.subscription = {
                        id: 'mock_sub_trial_' + Math.random().toString(36).substring(7),
                        status: 'trialing',
                        current_period_end: trialEnd,
                        trial_end: trialEnd,
                        plan: trialData.plan
                    };
                } else {
                    // Trial expirado
                    localStorage.removeItem('mock_trial');
                    if (!mockPremium) {
                        localStorage.removeItem('mock_premium');
                        status.isPremium = false;
                    }
                }
            } catch (error) {
                console.error('Erro ao processar trial mock:', error);
                localStorage.removeItem('mock_trial');
            }
        }
        
        if (status.isPremium && !status.trial) {
            status.subscription = {
                id: 'mock_sub_' + Math.random().toString(36).substring(7),
                status: 'active',
                current_period_end: new Date().getTime() + (30 * 24 * 60 * 60 * 1000), // 30 dias
                plan: 'monthly'
            };
        }
        
        console.log('✅ Mock status premium:', status);
        return status;
    }

    // Simula webhook de pagamento bem-sucedido
    simulateSuccessfulPayment(sessionId) {
        const session = this.sessions.get(sessionId);
        if (!session) return;
        
        console.log('🧪 Mock: Simulando pagamento bem-sucedido...', sessionId);
        
        session.status = 'complete';
        
        // Ativa premium no localStorage
        localStorage.setItem('mock_premium', 'true');
        
        if (session.trial) {
            const trialData = {
                startDate: new Date().getTime(),
                endDate: new Date().getTime() + (session.trialDays * 24 * 60 * 60 * 1000),
                plan: session.priceId.includes('annual') ? 'annual' : 'monthly'
            };
            localStorage.setItem('mock_trial', JSON.stringify(trialData));
            
            console.log('🎯 Mock trial ativado:', trialData);
        }
        
        // Dispatch evento de ativação premium
        window.dispatchEvent(new CustomEvent('premiumActivated', {
            detail: {
                sessionId: sessionId,
                trial: session.trial,
                trialDays: session.trialDays,
                userEmail: session.userEmail
            }
        }));
        
        console.log('✅ Mock premium ativado!');
    }

    // Gerencia clientes mock
    getOrCreateCustomer(email) {
        if (this.customers.has(email)) {
            return this.customers.get(email);
        }
        
        const customerId = 'mock_cus_' + Math.random().toString(36).substring(7);
        const customer = {
            id: customerId,
            email: email,
            created: new Date().getTime()
        };
        
        this.customers.set(email, customerId);
        return customerId;
    }

    // Simula cancelamento de assinatura
    async cancelSubscription(userEmail) {
        console.log('🧪 Mock: Cancelando assinatura...', { userEmail });
        
        await new Promise(resolve => setTimeout(resolve, 500));
        
        localStorage.removeItem('mock_premium');
        localStorage.removeItem('mock_trial');
        
        window.dispatchEvent(new CustomEvent('premiumCancelled', {
            detail: { userEmail: userEmail }
        }));
        
        console.log('✅ Mock assinatura cancelada');
        return { success: true };
    }

    // Utilitários para desenvolvimento
    reset() {
        console.log('🧪 Mock: Reset completo');
        localStorage.removeItem('mock_premium');
        localStorage.removeItem('mock_trial');
        this.sessions.clear();
        this.customers.clear();
        this.subscriptions.clear();
    }

    activatePremium(trialDays = 0) {
        console.log('🧪 Mock: Ativando premium manualmente', { trialDays });
        localStorage.setItem('mock_premium', 'true');
        
        if (trialDays > 0) {
            const trialData = {
                startDate: new Date().getTime(),
                endDate: new Date().getTime() + (trialDays * 24 * 60 * 60 * 1000),
                plan: 'monthly'
            };
            localStorage.setItem('mock_trial', JSON.stringify(trialData));
        }
        
        window.dispatchEvent(new CustomEvent('premiumActivated', {
            detail: {
                trial: trialDays > 0,
                trialDays: trialDays
            }
        }));
    }

    deactivatePremium() {
        console.log('🧪 Mock: Desativando premium manualmente');
        this.reset();
        
        window.dispatchEvent(new CustomEvent('premiumCancelled', {
            detail: {}
        }));
    }

    getStatus() {
        const mockPremium = localStorage.getItem('mock_premium');
        const mockTrial = localStorage.getItem('mock_trial');
        
        return {
            premium: mockPremium === 'true',
            trial: mockTrial ? JSON.parse(mockTrial) : null,
            sessions: this.sessions.size,
            customers: this.customers.size
        };
    }
}

// Inicializa Mock API
window.mockStripeAPI = new MockStripeAPI();

// Utilitários globais para desenvolvimento
window.mockStripe_reset = () => window.mockStripeAPI.reset();
window.mockStripe_activatePremium = (days = 0) => window.mockStripeAPI.activatePremium(days);
window.mockStripe_deactivatePremium = () => window.mockStripeAPI.deactivatePremium();
window.mockStripe_status = () => {
    const status = window.mockStripeAPI.getStatus();
    console.table(status);
    return status;
};

// Log comandos disponíveis
console.log(`
🧪 Mock Stripe API Comandos Disponíveis:
• mockStripe_reset() - Reset completo
• mockStripe_activatePremium(days) - Ativar premium (com trial opcional)
• mockStripe_deactivatePremium() - Desativar premium
• mockStripe_status() - Ver status atual

Exemplo: mockStripe_activatePremium(7) para ativar trial de 7 dias
`);

// Export para módulos
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MockStripeAPI;
}