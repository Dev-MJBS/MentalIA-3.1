# 🔑 Configuração das Chaves Stripe - MentalIA 3.1

## 📋 Passo a passo para obter suas chaves:

### 1. Acesse o Stripe Dashboard:
https://dashboard.stripe.com/test/apikeys

### 2. Copie as chaves abaixo:

**Chave Pública (Publishable key):**
```
pk_test_51...
```

**Chave Secreta (Secret key):**
```  
sk_test_51...
```

### 3. Configure no Firebase:

```bash
# 1. Instalar Firebase CLI (se não tiver)
npm install -g firebase-tools

# 2. Fazer login
firebase login

# 3. Configurar as chaves (substitua pelas suas)
firebase functions:config:set stripe.secret_key="sk_test_SUA_CHAVE_AQUI"
firebase functions:config:set stripe.webhook_secret="whsec_SUA_WEBHOOK_SECRET"

# 4. Deploy
firebase deploy --only functions
```

### 4. Configure no Frontend:

**Arquivo: `js/premium.js` (linha 8)**
```javascript
this.stripePublicKey = 'pk_test_SUA_CHAVE_PUBLICA_AQUI';
```

### 5. Para Webhook Local (desenvolvimento):

```bash
# Na pasta do projeto
cd C:\MentalIA-2\MentalIA-3.1\stripe-cli

# Escutar webhooks (mantenha rodando durante desenvolvimento)
.\stripe.exe listen --forward-to localhost:5001/mentalia-478819/us-central1/api/webhook
```

### 6. Para Produção:

1. **Mude para Live keys:** https://dashboard.stripe.com/apikeys
2. **Configure webhook endpoint:** 
   - URL: `https://dev-mjbs.github.io/MentalIA-3.1/api/webhook` (GitHub Pages)
   - OU `https://catolia.web.app/api/webhook` (Firebase - requer plano Blaze)
   - Eventos: `checkout.session.completed`, `customer.subscription.*`, `invoice.payment_*`

---

## 🎯 Arquivo de configuração rápida:

Copie e cole suas chaves aqui para não esquecer:

**Teste:**
- Chave Pública: `pk_test_`
- Chave Secreta_test_`  
- Webhook Secret: `whsec_`

**Produção:**
- Chave Pública: `pk_live_`
- Chave Secreta: `sk_live_`
- Webhook Secret: `whsec_`: `sk