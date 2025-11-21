// Mock API para demonstração - MentalIA 3.1
// Em produção, usar Firebase Functions ou Vercel

// Simula checkout Stripe (desenvolvimento)
window.mockStripeAPI = {
    async createCheckout(priceId, userEmail) {
        console.log('🔄 Mock Checkout:', { priceId, userEmail });
        
        // Simula delay da API
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Simula resposta do Stripe
        return {
            sessionId: 'cs_test_mock_' + Date.now(),
            url: 'https://checkout.stripe.com/pay/mock-session'
        };
    },

    async checkPremium(userEmail) {
        console.log('🔄 Mock Check Premium:', userEmail);
        
        // Simula usuário premium se email contém "premium"
        const isPremium = userEmail.includes('premium') || 
                         localStorage.getItem('mock_premium') === 'true';
        
        return {
            isPremium,
            expiresAt: isPremium ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() : null,
            plan: isPremium ? 'monthly' : null
        };
    },

    async createPortalSession(userEmail) {
        console.log('🔄 Mock Portal Session:', userEmail);
        
        return {
            url: 'https://billing.stripe.com/p/session/mock-portal'
        };
    }
};

// Ativa mock premium para demonstração
function activateMockPremium() {
    localStorage.setItem('mock_premium', 'true');
    if (window.premiumManager) {
        window.premiumManager.showSuccess('Mock Premium ativado! 🎉');
        window.premiumManager.checkPremiumStatus();
    }
}