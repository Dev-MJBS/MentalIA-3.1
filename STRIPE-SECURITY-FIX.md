# 🔐 CORREÇÃO DE SEGURANÇA STRIPE - MentalIA 3.1

## 🚨 PROBLEMA IDENTIFICADO
GitHub bloqueou push por detectar **Stripe Test API Restricted Key** (chave de teste detectada)

## ✅ CORREÇÕES IMPLEMENTADAS

### 1. **Removidas todas as chaves hardcoded**
- ❌ Stripe keys removidas de todos os arquivos de código
- ✅ Implementado sistema de variáveis de ambiente
- ✅ Placeholders seguros em arquivos exemplo

### 2. **Arquivos corrigidos:**

#### **`.env.example`** - Variáveis principais
```env
# STRIPE - Sistema de Pagamento
STRIPE_PUBLIC_KEY=CONFIGURE_SUA_CHAVE_PUBLICA_STRIPE_AQUI
STRIPE_SECRET_KEY=CONFIGURE_SUA_CHAVE_SECRETA_STRIPE_AQUI
STRIPE_WEBHOOK_SECRET=CONFIGURE_SEU_WEBHOOK_SECRET_AQUI
```

#### **`functions/.env.example`** - Variáveis do backend
```env
# Firebase Functions Environment Variables
STRIPE_SECRET_KEY=CONFIGURE_SUA_CHAVE_SECRETA_STRIPE
STRIPE_WEBHOOK_SECRET=CONFIGURE_SEU_WEBHOOK_SECRET
```

#### **`functions/index.js`** - ✅ JÁ CORRETO
```javascript
// ✅ Usando variável de ambiente
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;
```

#### **`js/checkout.js`** - ✅ CORRIGIDO
```javascript
// ✅ Validação de chave configurada
const stripeKey = window.STRIPE_PUBLIC_KEY || document.querySelector('meta[name="stripe-key"]')?.content;
if (!stripeKey || stripeKey.includes('YOUR_KEY_HERE')) {
  throw new Error('Chave Stripe não configurada. Configure STRIPE_PUBLIC_KEY.');
}
const stripe = Stripe(stripeKey);
```

### 3. **`.gitignore` atualizado**
```ignore
# Environment variables e secrets
functions/.env
.env
.env.local
.env.development
.env.production
```

## 🚀 SETUP PARA DESENVOLVIMENTO

### **1. Configurar variáveis locais:**
```bash
# Copiar templates
cp .env.example .env
cp functions/.env.example functions/.env

# Editar com suas chaves reais
nano .env
nano functions/.env
```

### **2. Deploy Google Cloud Functions:**
```bash
# Método 1: Usando script automatizado
chmod +x deploy-functions.sh
./deploy-functions.sh

# Método 2: Comando direto
gcloud functions deploy api \
  --gen2 \
  --runtime=nodejs18 \
  --region=us-central1 \
  --source=./functions \
  --entry-point=api \
  --trigger-http \
  --allow-unauthenticated \
  --set-env-vars="STRIPE_SECRET_KEY=SUA_CHAVE,STRIPE_WEBHOOK_SECRET=SEU_SECRET"
```

### **3. Configurar frontend:**
```html
<!-- Em premium.html ou index.html -->
<meta name="stripe-key" content="SUA_CHAVE_PUBLICA_STRIPE">
<script>
  window.STRIPE_PUBLIC_KEY = 'SUA_CHAVE_PUBLICA_STRIPE';
</script>
```

## 🔒 SEGURANÇA GARANTIDA

### ✅ **O que está seguro agora:**
- ❌ Zero chaves hardcoded no código
- ✅ Todas as chaves via variáveis de ambiente
- ✅ Arquivos .env ignorados pelo git
- ✅ Validação de chaves no frontend
- ✅ Deploy com env vars no Cloud Functions

### 🚨 **Importante para produção:**
1. **Use Firebase Functions secrets** para chaves de produção
2. **Rotacione chaves** se foram expostas
3. **Configure webhook URL** no Stripe Dashboard
4. **Monitore logs** após deploy

## 📝 COMANDOS ÚTEIS

```bash
# Verificar deploy
gcloud functions describe api --region=us-central1

# Ver logs em tempo real
gcloud functions logs tail api --region=us-central1

# Testar webhook
curl -X POST https://us-central1-PROJECT.cloudfunctions.net/api/webhook

# Verificar variáveis configuradas
gcloud functions describe api --region=us-central1 --format="value(serviceConfig.environmentVariables)"
```

## ✅ STATUS FINAL
🔐 **REPOSITÓRIO SEGURO PARA COMMIT**
- Todas as chaves removidas
- Sistema de env vars implementado
- Deploy automatizado configurado
- Webhook funcional após configuração

**Agora você pode fazer commit sem detectar secrets!** 🎉