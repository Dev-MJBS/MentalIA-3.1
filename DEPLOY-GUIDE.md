# 🚀 MentalIA 3.1 Premium - Guia de Deploy

## 📋 Pré-requisitos

1. **Conta Google Cloud** com billing habilitado
2. **Conta Stripe** (test/live)
3. **Firebase CLI** instalado
4. **Node.js 18+** instalado

## 🔧 Configuração Stripe

### 1. Criar Produtos no Stripe Dashboard

```bash
# Produto Mensal - R$ 5,90
Produto: MentalIA Premium Mensal
Preço: R$ 5.90 BRL
Cobrança: Recorrente mensal
Price ID: price_1ABC123... (copiar este ID)

# Produto Anual - R$ 49,90  
Produto: MentalIA Premium Anual
Preço: R$ 49.90 BRL
Cobrança: Recorrente anual
Price ID: price_1XYZ789... (copiar este ID)
```

### 2. Configurar Webhooks Stripe

**URL do Webhook:** `https://YOUR_PROJECT.cloudfunctions.net/api/webhook`

**Eventos para escutar:**
- `checkout.session.completed`
- `customer.subscription.created`
- `customer.subscription.updated` 
- `customer.subscription.deleted`
- `invoice.payment_succeeded`
- `invoice.payment_failed`

### 3. Configurar Chaves

**Chaves de Teste:**
```bash
# Públicas (frontend)
pk_test_51...

# Secretas (backend)
sk_test_51...

# Webhook Secret
whsec_...
```

**Chaves de Produção:**
```bash
# Públicas (frontend) 
pk_live_51...

# Secretas (backend)
sk_live_51...

# Webhook Secret
whsec_...
```

## 🚀 Deploy Firebase

### 1. Instalar Firebase CLI

```bash
npm install -g firebase-tools
firebase login
```

### 2. Inicializar Projeto

```bash
firebase init

# Selecionar:
# - Functions
# - Hosting
# - Use existing project: mentalia-478819
```

### 3. Configurar Variáveis de Ambiente

```bash
# Desenvolvimento
firebase functions:config:set stripe.secret_key="sk_test_..."
firebase functions:config:set stripe.webhook_secret="whsec_..."

# Produção  
firebase functions:config:set stripe.secret_key="sk_live_..."
firebase functions:config:set stripe.webhook_secret="whsec_..."
```

### 4. Instalar Dependências

```bash
cd functions
npm install
```

### 5. Deploy

```bash
# Deploy tudo
firebase deploy

# Deploy só functions
firebase deploy --only functions

# Deploy só hosting  
firebase deploy --only hosting
```

## 📝 Configurar Frontend

### 1. Atualizar Chaves Stripe

**Em `js/premium.js` linha 6:**
```javascript
this.stripePublicKey = 'pk_live_...'; // Produção
// this.stripePublicKey = 'pk_test_...'; // Teste
```

### 2. Atualizar Price IDs

**Em `js/premium.js` linhas 9-12:**
```javascript
this.plans = {
    monthly: 'price_1ABC123...', // ID real do Stripe
    annual: 'price_1XYZ789...'   // ID real do Stripe
};
```

## 🔒 Configurações de Segurança

### 1. CORS

**Em `functions/index.js` linha 8:**
```javascript
app.use(cors({
    origin: [
        'https://mentalia-478819.web.app',
        'https://dev-mjbs.github.io'
    ],
    credentials: true
}));
```

### 2. Domínios Autorizados

**Firebase Console → Authentication → Settings:**
- `https://mentalia-478819.web.app`  
- `https://dev-mjbs.github.io`

### 3. API Keys

**Google Cloud Console → APIs & Services → Credentials:**
- Restringir chaves por domínio
- Configurar OAuth consent screen

## 🧪 Testes

### 1. Stripe Test Mode

```bash
# Cartão de teste que sempre funciona
4242 4242 4242 4242
MM/AA: 12/34
CVC: 123
```

### 2. Webhook Testing

```bash
# Instalar Stripe CLI
stripe listen --forward-to localhost:5001/mentalia-478819/us-central1/api/webhook
```

### 3. Firebase Emulators

```bash
firebase emulators:start --only functions,hosting
```

## 📊 Monitoramento

### 1. Firebase Console
- **Functions → Logs:** Verificar execuções
- **Hosting → Usage:** Tráfego do site
- **Analytics:** Comportamento usuário

### 2. Stripe Dashboard
- **Payments:** Transações
- **Subscriptions:** Assinaturas ativas
- **Events:** Logs de webhook

### 3. Google Cloud Console
- **Cloud Functions:** Performance
- **Cloud Logging:** Logs detalhados
- **Cloud Monitoring:** Métricas

## 🚨 Troubleshooting

### Webhook não funciona
1. Verificar URL endpoint no Stripe
2. Conferir webhook secret nas env vars
3. Testar com `stripe listen`

### Payment failed
1. Verificar chaves Stripe (test vs live)
2. Confirmar Price IDs corretos
3. Checar CORS no backend

### Premium não ativa
1. Verificar localStorage do usuário
2. Confirmar webhook recebido
3. Testar API `/check-premium`

## 📞 Suporte

- **Issues:** https://github.com/Dev-MJBS/MentalIA-3.1/issues
- **WhatsApp:** +55 11 99999-9999 (Premium users)
- **Email:** dev.mjbs@gmail.com

---

## 🎯 URLs Finais

- **App:** https://mentalia-478819.web.app
- **API:** https://us-central1-mentalia-478819.cloudfunctions.net/api
- **Premium:** https://mentalia-478819.web.app/premium.html
- **Privacy:** https://mentalia-478819.web.app/privacy.html

---

✨ **Deploy completo em < 10 minutos!** ✨