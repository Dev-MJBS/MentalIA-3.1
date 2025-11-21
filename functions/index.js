// functions/index.js - Backend MentalIA 3.1 Premium
const functions = require('firebase-functions/v2');
const express = require('express');
const cors = require('cors');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY); // nunca hardcode aqui

const app = express();

// Configuração CORS
app.use(cors({
    origin: ['https://mentalia-478819.web.app', 'https://dev-mjbs.github.io', 'http://localhost:3000'],
    credentials: true
}));

// Middleware para webhook (raw body)
app.use('/webhook', express.raw({ type: 'application/json' }));

// Middleware JSON para outras rotas
app.use(express.json());

// Endpoint de teste
app.get('/', (req, res) => {
    res.json({ 
        message: 'MentalIA 3.1 Premium API ativa! 🧠',
        timestamp: new Date().toISOString()
    });
});

// Criar sessão de checkout Stripe
app.post('/create-checkout', async (req, res) => {
    try {
        const { priceId, userId, userEmail, userName, trial, trialDays } = req.body;

        if (!priceId || !userId || !userEmail) {
            return res.status(400).json({ 
                error: 'Dados obrigatórios: priceId, userId, userEmail' 
            });
        }

        console.log('Criando checkout para:', { priceId, userEmail, trial, trialDays });

        // Configuração base da sessão
        const sessionConfig = {
            mode: 'subscription',
            payment_method_types: ['card'],
            line_items: [{
                price: priceId,
                quantity: 1,
            }],
            success_url: `${req.headers.origin || 'https://mentalia-478819.web.app'}/?premium=success&session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${req.headers.origin || 'https://mentalia-478819.web.app'}/?premium=cancelled`,
            client_reference_id: userId,
            customer_email: userEmail,
            metadata: {
                userId: userId,
                userEmail: userEmail,
                userName: userName || 'Usuário MentalIA',
                trial: trial ? 'true' : 'false',
                trialDays: trialDays || '0'
            },
            subscription_data: {
                metadata: {
                    userId: userId,
                    userEmail: userEmail
                }
            },
            locale: 'pt-BR'
        };

        // Adiciona trial se solicitado
        if (trial && trialDays > 0) {
            sessionConfig.subscription_data.trial_period_days = trialDays;
            console.log(`Trial configurado: ${trialDays} dias`);
        }

        const session = await stripe.checkout.sessions.create(sessionConfig);

        console.log('Checkout criado:', session.id);

        res.json({ 
            sessionId: session.id,
            url: session.url 
        });

    } catch (error) {
        console.error('Erro no checkout:', error);
        res.status(500).json({ 
            error: 'Erro interno no servidor',
            details: error.message 
        });
    }
});

// Portal do cliente Stripe
app.post('/create-portal-session', async (req, res) => {
    try {
        const { userEmail } = req.body;

        if (!userEmail) {
            return res.status(400).json({ error: 'Email obrigatório' });
        }

        // Busca o cliente pelo email
        const customers = await stripe.customers.list({
            email: userEmail,
            limit: 1
        });

        if (customers.data.length === 0) {
            return res.status(404).json({ 
                error: 'Nenhuma assinatura encontrada para este email' 
            });
        }

        const customer = customers.data[0];

        const session = await stripe.billingPortal.sessions.create({
            customer: customer.id,
            return_url: req.headers.origin || 'https://mentalia-478819.web.app'
        });

        res.json({ url: session.url });

    } catch (error) {
        console.error('Erro no portal:', error);
        res.status(500).json({ 
            error: 'Erro ao abrir portal',
            details: error.message 
        });
    }
});

// Verificar status premium
app.post('/check-premium', async (req, res) => {
    try {
        const { userEmail } = req.body;

        if (!userEmail) {
            return res.status(400).json({ error: 'Email obrigatório' });
        }

        // Busca assinaturas ativas do usuário
        const customers = await stripe.customers.list({
            email: userEmail,
            limit: 1
        });

        if (customers.data.length === 0) {
            return res.json({ isPremium: false });
        }

        const customer = customers.data[0];
        const subscriptions = await stripe.subscriptions.list({
            customer: customer.id,
            status: 'active',
            limit: 1
        });

        if (subscriptions.data.length > 0) {
            const subscription = subscriptions.data[0];
            res.json({
                isPremium: true,
                expiresAt: new Date(subscription.current_period_end * 1000).toISOString(),
                plan: subscription.items.data[0].price.id,
                status: subscription.status
            });
        } else {
            res.json({ isPremium: false });
        }

    } catch (error) {
        console.error('Erro na verificação premium:', error);
        res.status(500).json({ 
            error: 'Erro na verificação',
            details: error.message 
        });
    }
});

// Webhook Stripe para eventos de pagamento
app.post('/webhook', (req, res) => {
    const sig = req.headers['stripe-signature'];
    // Webhook
    const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

    let event;

    try {
        event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
    } catch (err) {
        console.error('Webhook signature verification failed:', err.message);
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    console.log('Webhook recebido:', event.type);

    // Processa diferentes tipos de evento
    switch (event.type) {
        case 'checkout.session.completed':
            handleCheckoutCompleted(event.data.object);
            break;

        case 'customer.subscription.created':
            handleSubscriptionCreated(event.data.object);
            break;

        case 'customer.subscription.updated':
            handleSubscriptionUpdated(event.data.object);
            break;

        case 'customer.subscription.deleted':
            handleSubscriptionDeleted(event.data.object);
            break;

        case 'invoice.payment_succeeded':
            handlePaymentSucceeded(event.data.object);
            break;

        case 'invoice.payment_failed':
            handlePaymentFailed(event.data.object);
            break;

        default:
            console.log(`Evento não tratado: ${event.type}`);
    }

    res.json({ received: true });
});

// Handlers dos webhooks
async function handleCheckoutCompleted(session) {
    console.log('✅ Checkout completado:', {
        sessionId: session.id,
        customerId: session.customer,
        email: session.customer_email,
        userId: session.client_reference_id
    });

    // Aqui você pode salvar no Firestore, enviar email, etc.
    // Por enquanto só logamos
}

async function handleSubscriptionCreated(subscription) {
    console.log('✅ Assinatura criada:', {
        subscriptionId: subscription.id,
        customerId: subscription.customer,
        status: subscription.status,
        currentPeriodEnd: new Date(subscription.current_period_end * 1000)
    });
}

async function handleSubscriptionUpdated(subscription) {
    console.log('🔄 Assinatura atualizada:', {
        subscriptionId: subscription.id,
        status: subscription.status,
        currentPeriodEnd: new Date(subscription.current_period_end * 1000)
    });
}

async function handleSubscriptionDeleted(subscription) {
    console.log('❌ Assinatura cancelada:', {
        subscriptionId: subscription.id,
        customerId: subscription.customer
    });
}

async function handlePaymentSucceeded(invoice) {
    console.log('💰 Pagamento aprovado:', {
        invoiceId: invoice.id,
        customerId: invoice.customer,
        amount: invoice.amount_paid / 100,
        currency: invoice.currency
    });
}

async function handlePaymentFailed(invoice) {
    console.log('❌ Falha no pagamento:', {
        invoiceId: invoice.id,
        customerId: invoice.customer,
        amount: invoice.amount_due / 100
    });
}

// Error handler global
app.use((error, req, res, next) => {
    console.error('Erro na API:', error);
    res.status(500).json({
        error: 'Erro interno do servidor',
        message: error.message
    });
});

// Export para Firebase Functions v2
exports.api = functions.https.onRequest({
    timeoutSeconds: 60,
    memory: '512MB',
    region: 'us-central1'
}, app);