# 🔧 Configuração da API do Google Drive - MentalIA

## 🎯 **O que você precisa fazer:**

### Passo 1: Criar Projeto no Google Cloud Console
1. Acesse: https://console.cloud.google.com/
2. Clique em "Novo Projeto" 
3. Nome: "MentalIA Backup" (ou qualquer nome)
4. Clique "Criar"

### Passo 2: Ativar a API do Google Drive
1. No painel, vá em "APIs e Serviços" → "Biblioteca"
2. Procure por "Google Drive API"
3. Clique na API e depois em "Ativar"

### Passo 3: Criar Credenciais OAuth 2.0
1. Vá em "APIs e Serviços" → "Credenciais"
2. Clique "Criar Credenciais" → "ID do cliente OAuth 2.0"
3. Se aparecer tela de consentimento, configure:
   - **Tipo**: Externo
   - **Nome do app**: MentalIA
   - **Email do desenvolvedor**: seu email
   - **Domínios autorizados**: deixe vazio por enquanto
   - Salve

### Passo 4: Configurar o Cliente OAuth
1. **Tipo de aplicativo**: Aplicativo da Web
2. **Nome**: MentalIA Web Client
3. **Origens JavaScript autorizadas**: Adicione TODAS estas URLs:
   ```
   http://localhost:3000
   http://localhost:3001
   http://localhost:3002
   http://127.0.0.1:3000
   http://127.0.0.1:3001
   http://127.0.0.1:3002
   ```
4. **URIs de redirecionamento autorizados**: (deixe vazio)
5. Clique "Criar"

### Passo 5: Copiar o Client ID
1. Após criar, aparecerá uma janela com:
   - **Client ID**: `1234567890-abcdefg.apps.googleusercontent.com`
   - **Client Secret**: (não precisamos dele)
2. **COPIE O CLIENT ID** (formato longo com números e letras)

### Passo 6: Configurar no MentalIA
1. Abra o MentalIA no navegador
2. Clique no botão "☁️ Backup Seguro"
3. Clique "🔧 Configurar Client ID"
4. Cole o Client ID que você copiou
5. Clique "🔄 Recarregar Página"

## 🔍 **Client ID vs API Key**

**Client ID OAuth 2.0** (o que precisamos):
- ✅ Permite login do usuário
- ✅ Acesso aos dados do usuário
- ✅ Formato: `123456789-abc123.apps.googleusercontent.com`

**API Key** (NÃO é o que precisamos):
- ❌ Só para APIs públicas
- ❌ Não permite acesso a dados privados
- ❌ Formato: `AIza...`

## 🚨 **Problemas Comuns**

### "OAuth client was not found"
- ✅ Certifique-se que copiou o Client ID correto
- ✅ Verifique se adicionou localhost:3002 nas origens

### "This app isn't verified"
- ✅ É normal para apps em desenvolvimento
- ✅ Clique "Advanced" → "Go to MentalIA (unsafe)"
- ✅ Ou adicione seu email como usuário de teste

### "Access blocked"
- ✅ Verifique se a Google Drive API está ativada
- ✅ Confirme as URLs autorizadas

## 🎉 **Após Configurar**

O MentalIA terá:
- ✅ Backup automático no Google Drive
- ✅ Login com sua conta Google
- ✅ Dados sincronizados na nuvem
- ✅ Acesso de qualquer dispositivo

## 💡 **Alternativa Rápida**

Se não quiser configurar agora, use o **Backup Local**:
- Clique "☁️ Backup Seguro" → "OK"
- Arquivo JSON será baixado
- Funciona imediatamente!

---
*Precisa de ajuda? Use o botão 🐛 Debug Logs para capturar erros*