# MentalIA - Resolução de Problemas Google OAuth

## 🚫 Erro: "Acesso bloqueado - app não verificado pelo Google"

### Problema
O aplicativo MentalIA está em fase de desenvolvimento/teste e não foi verificado pelo Google. Por isso, apenas usuários específicos podem acessá-lo.

### ✅ Solução: Adicionar Testadores no Google Cloud Console

#### Passo 1: Acesse o Google Cloud Console
1. Vá para [https://console.cloud.google.com/](https://console.cloud.google.com/)
2. Faça login com a conta do desenvolvedor (`mjbs.dev@gmail.com`)

#### Passo 2: Vá para OAuth Consent Screen
1. No menu lateral, clique em **"APIs e Serviços"** > **"OAuth consent screen"**
2. Selecione o projeto correto (MentalIA)

#### Passo 3: Adicione Testadores
1. Na seção **"Test users"**, clique em **"ADD USERS"**
2. Adicione os emails dos testadores:
   - `mjbs.dev@gmail.com` (desenvolvedor)
   - Adicione outros emails conforme necessário
3. Clique em **"SAVE"**

#### Passo 4: Teste Novamente
1. Reinicie o servidor local: `python -m http.server 8000`
2. Acesse `http://localhost:8000/test-google-backup.html`
3. Clique em "Conectar Google Drive"
4. Agora deve funcionar!

### 🔍 Verificação
Após adicionar os testadores, você deve ver:
- ✅ Popup do Google abre normalmente
- ✅ Página de consentimento aparece
- ✅ Botão "Continuar como [Nome]" funciona
- ✅ Status muda para "🟢 Conectado ao Google Drive"

### 📋 Status Atual
- ✅ Google Identity Services carregando
- ✅ Botão de login funcionando
- ✅ Solicitação OAuth gerada corretamente
- ❌ **Bloqueio de verificação do Google** (precisa ser resolvido)

### 🆘 Se Ainda Não Funcionar
1. **Verifique se o email foi adicionado corretamente**
2. **Confirme que está usando o projeto certo no Google Cloud**
3. **Tente fazer logout e login novamente no Google**
4. **Limpe cookies/cache do navegador**

### 📞 Contato
Para mais ajuda, entre em contato com o desenvolvedor: `mjbs.dev@gmail.com`</content>
<parameter name="filePath">c:\MentalIA-2\MentalIA-3.1\GOOGLE_OAUTH_FIX.md