# 🚨 ERRO GOOGLE OAUTH - SOLUÇÃO DEFINITIVA

## ❌ Problema Atual
```
"Not a valid origin for the client: https://dev-mjbs.github.io has not been registered for client ID ivoemo399amv728d61llbdqn3fbcr8tk.apps.googleusercontent.com"
```

Este erro significa que o Google Cloud Console não reconhece `https://dev-mjbs.github.io` como uma origem autorizada para o seu projeto OAuth.

## ✅ SOLUÇÃO PASSO-A-PASSO

### 📋 Pré-requisitos
- Conta Google com acesso ao Google Cloud Console
- Projeto "mentalia-478819" criado

---

### 🔧 PASSO 1: Acesse o Google Cloud Console

1. Abra seu navegador
2. Vá para: **https://console.cloud.google.com/**
3. Faça login com sua conta Google
4. Selecione o projeto **"mentalia-478819"** (ou crie se não existir)

---

### 🔧 PASSO 2: Ative a Google Drive API

1. No menu lateral esquerdo, clique em **"APIs e Serviços"**
2. Clique em **"Biblioteca"**
3. Na barra de pesquisa, digite **"Google Drive API"**
4. Clique na **"Google Drive API"**
5. Clique em **"Ativar"** (se ainda não estiver ativada)

---

### 🔧 PASSO 3: Configure as Credenciais OAuth

1. No menu lateral, clique em **"APIs e Serviços"** → **"Credenciais"**
2. Na lista de credenciais, clique no seu **Client ID OAuth 2.0**
   - Deve terminar com: `...apps.googleusercontent.com`
   - Client ID: `670002862076-ivoemo399amv728d61llbdqn3fbcr8tk.apps.googleusercontent.com`

---

### 🔧 PASSO 4: Adicione as Origens Autorizadas

#### 📍 Seção "Origens JavaScript autorizadas"
Adicione estas URLs **uma por linha**:

```
https://dev-mjbs.github.io
https://mentalia.app
http://localhost
http://localhost:3000
http://localhost:8000
http://localhost:8080
```

#### 📍 Seção "URIs de redirecionamento autorizados"
Adicione estas URLs **uma por linha**:

```
https://dev-mjbs.github.io
https://mentalia.app
```

---

### 🔧 PASSO 5: Salve e Aguarde

1. Clique no botão **"SALVAR"** no final da página
2. **Aguarde 5-10 minutos** para que as mudanças sejam propagadas
3. Feche e reabra o navegador (ou use modo incógnito)

---

## 🧪 TESTE SE FUNCIONOU

1. Abra: **https://dev-mjbs.github.io**
2. Abra o Console do navegador (F12)
3. Procure por estas mensagens:
   - ✅ `[BACKUP] Google APIs inicializados com sucesso`
   - ❌ Se ainda aparecer erro, continue lendo

---

## 🔍 VERIFICAÇÃO DETALHADA

### 📋 Checklist de Verificação

- [ ] Projeto correto selecionado: "mentalia-478819"
- [ ] Google Drive API ativada
- [ ] Client ID correto: `670002862076-...`
- [ ] `https://dev-mjbs.github.io` nas origens JavaScript
- [ ] `https://dev-mjbs.github.io` nos URIs de redirecionamento
- [ ] Salvou as mudanças
- [ ] Aguardou 5-10 minutos
- [ ] Testou em janela anônima/incógnita

### 🐛 Logs Esperados Após Correção

**Console do navegador deve mostrar:**
```
☁️ [BACKUP] Inicializando Google APIs...
☁️ [BACKUP] Google APIs carregadas
🔧 [BACKUP] Inicializando GAPI client...
✅ [BACKUP] GAPI client inicializado
🚪 [BACKUP] Inicializando One Tap...
✅ [BACKUP] Google One Tap inicializado
✅ [BACKUP] Google APIs inicializados com sucesso
```

---

## 📴 MODO OFFLINE (ENQUANTO ISSO)

Enquanto resolve o problema OAuth, o MentalIA funciona perfeitamente no **modo offline**:

### 💾 Backup Local
1. Clique em **"Fazer Backup"**
2. Escolha **"Backup Local"**
3. Arquivo será baixado automaticamente
4. Dados criptografados e seguros

### ✅ Funcionalidades Offline
- ✅ Registro de humor
- ✅ Análise IA local
- ✅ Relatórios
- ✅ Gráficos
- ✅ Backup local

---

## 🆘 AINDA COM PROBLEMAS?

### 🔍 Verificações Adicionais

1. **Client ID Correto?**
   - Verifique se está usando exatamente: `670002862076-ivoemo399amv728d61llbdqn3fbcr8tk.apps.googleusercontent.com`

2. **Projeto Correto?**
   - Certifique-se de estar no projeto "mentalia-478819"

3. **Cache do Navegador**
   - Teste em **modo incógnito/anônimo**
   - Limpe cache e cookies

4. **Console do Desenvolvedor**
   - Abra F12 e verifique a aba "Console"
   - Procure por erros específicos

### 📞 Suporte

Se ainda não funcionar:

1. **Tire um print** da tela de configuração do Google Cloud Console
2. **Copie os logs** do console do navegador (F12)
3. **Abra uma issue** no GitHub com os detalhes

---

## 🎯 RESUMO EXECUTIVO

**Problema:** Origem não autorizada no Google Cloud Console
**Solução:** Adicionar `https://dev-mjbs.github.io` às origens autorizadas
**Tempo:** 5-10 minutos + espera de propagação
**Alternativa:** Use backup local enquanto isso

**Links Importantes:**
- Google Cloud Console: https://console.cloud.google.com/
- MentalIA: https://dev-mjbs.github.io

---
*Última atualização: 21 de novembro de 2025*</content>
<parameter name="filePath">c:\MentalIA-2\MentalIA-3.1\CORRIGIR_GOOGLE_DRIVE.md