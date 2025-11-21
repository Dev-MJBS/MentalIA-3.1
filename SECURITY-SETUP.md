# 🔐 CONFIGURAÇÃO DE SEGURANÇA - MentalIA 3.1

## ⚠️ IMPORTANTE: SECRETS REMOVIDOS

Este repositório teve **secrets expostos removidos** por questões de segurança.

## 🛠️ CONFIGURAÇÃO PARA DESENVOLVIMENTO

### 1. Variáveis de Ambiente
```bash
# Copie o arquivo de exemplo
cp .env.example .env

# Configure suas chaves reais no arquivo .env
```

### 2. Credenciais do Google
```bash
# Copie o arquivo de exemplo
cp credentials.example.json credentials.json

# Configure suas credenciais reais do Google OAuth
```

### 3. Stripe (Sistema de Pagamento)
Configure no arquivo `.env`:
- `STRIPE_PUBLIC_KEY`: Chave pública (inicia com pk_)
- `STRIPE_SECRET_KEY`: Chave secreta (inicia com sk_)
- `STRIPE_WEBHOOK_SECRET`: Secret do webhook do Stripe

### 4. Google OAuth (Backup Drive)
Configure no arquivo `credentials.json`:
- `client_id`: ID do cliente OAuth
- `client_secret`: Secret do cliente OAuth
- `project_id`: ID do projeto Google Cloud

## 🚨 REGRAS DE SEGURANÇA

### ✅ PERMITIDO:
- Usar chaves de **teste** durante desenvolvimento
- Commitar arquivos `.example` com placeholders
- Usar variáveis de ambiente para configuração

### ❌ NUNCA FAÇA:
- ❌ Commitar chaves reais de produção
- ❌ Hardcoding de secrets no código
- ❌ Compartilhar arquivos `.env` reais
- ❌ Expor `client_secret` em repositórios públicos

## 📁 ARQUIVOS IGNORADOS (.gitignore)
```
.env
credentials.json
*.key
functions/.env
```

## 🔄 ROTAÇÃO DE CHAVES

Se você suspeita que alguma chave foi exposta:

1. **Stripe**: Gere novas chaves no dashboard
2. **Google OAuth**: Regenere client_secret no Console
3. **Firebase**: Rotacione chaves do projeto
4. **Atualize** todos os ambientes (dev/prod)

## 💡 DESENVOLVIMENTO SEGURO

```javascript
// ✅ CORRETO: Usar variáveis de ambiente
const stripe = Stripe(process.env.STRIPE_PUBLIC_KEY);

// ❌ ERRADO: Hardcoding
const stripe = Stripe('SUA_CHAVE_HARDCODED');
```

## 📞 SUPORTE

Dúvidas sobre configuração de segurança:
- WhatsApp: +55 64 98138-1981
- Email: dev@mentalia.app

---
**Última atualização**: Novembro 2024  
**Versão**: MentalIA 3.1