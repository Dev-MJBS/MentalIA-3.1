// js/checkout.js
async function criarAssinatura(plano) {
  try {
    // 🔥 CORREÇÃO: Detectar se é local ou remoto para o endpoint correto
    const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    const apiUrl = isLocal ? 
      'https://us-central1-mentalia-478819.cloudfunctions.net/api/create-checkout' : 
      '/api/create-checkout';
    
    console.log('🛒 Criando checkout para:', plano, 'em:', apiUrl);
    
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        priceId: plano, 
        userId: window.userId || 'anonymous',
        userEmail: window.currentUser?.email || 'demo@mentalia.com',
        userName: window.currentUser?.name || 'Usuário MentalIA'
      })
    });
    
    if (!response.ok) {
      throw new Error('Erro ao criar checkout');
    }
    
    const session = await response.json();
    // Use a chave pública configurada na página ou fallback seguro
    const stripeKey = window.STRIPE_PUBLIC_KEY || document.querySelector('meta[name="stripe-key"]')?.content;
    if (!stripeKey || stripeKey.includes('YOUR_KEY_HERE')) {
      throw new Error('Chave Stripe não configurada. Configure STRIPE_PUBLIC_KEY.');
    }
    const stripe = Stripe(stripeKey);
    
    await stripe.redirectToCheckout({ sessionId: session.id });
  } catch (error) {
    console.error('Erro no checkout:', error);
    alert('Erro ao processar pagamento. Tente novamente.');
  }
}

// Função para verificar status premium
async function verificarStatusPremium() {
  const userId = window.userId || 'anonymous';
  const premiumStatus = localStorage.getItem(`premium_${userId}`);
  return premiumStatus === 'true';
}

// Função para ativar premium após pagamento
function ativarPremium(userId) {
  localStorage.setItem(`premium_${userId}`, 'true');
  localStorage.setItem(`premium_date_${userId}`, new Date().toISOString());
  
  // Dispara evento customizado para atualizar UI
  window.dispatchEvent(new CustomEvent('premiumActivated', { 
    detail: { userId } 
  }));
}