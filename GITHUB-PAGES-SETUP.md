# 🔧 Como Configurar GitHub Pages para MentalIA-3.1

## ❌ Problema Relatado
```
There isn't a GitHub Pages site here.
If you're trying to publish one, read the full documentation...
```

## ✅ Soluções Implementadas

### 1. **Correção de Redirecionamento**
- **Arquivo:** `js/premium.js`
- **Problema:** URL `/premium.html` não funciona no GitHub Pages
- **Solução:** Detecção automática de ambiente
```javascript
const isGitHubPages = window.location.hostname.includes('github.io');
const premiumUrl = isGitHubPages ? 
    `${window.location.origin}/MentalIA-3.1/premium.html` : 
    './premium.html';
```

### 2. **Configuração Jekyll**
- **Arquivo:** `_config.yml` criado
- **Função:** Configura GitHub Pages corretamente
- **URL Base:** `/MentalIA-3.1`

### 3. **Arquivo .nojekyll**
- **Arquivo:** `.nojekyll` criado
- **Função:** Garante que todos os arquivos sejam servidos (incluindo CSS/JS)

## 🚀 Como Ativar GitHub Pages

### **Passo 1: Verificar Repositório**
1. Acesse: https://github.com/Dev-MJBS/MentalIA-3.1
2. Vá em **Settings** → **Pages**
3. Em **Source**, selecione **Deploy from a branch**
4. Escolha **main** branch
5. Escolha **/ (root)** folder
6. Clique **Save**

### **Passo 2: Aguardar Deploy**
- O GitHub Pages demora 5-10 minutos para atualizar
- Verifique em **Actions** se o deploy foi bem-sucedido

### **Passo 3: URLs Corretas**
- **Site principal:** https://dev-mjbs.github.io/MentalIA-3.1/
- **Página Premium:** https://dev-mjbs.github.io/MentalIA-3.1/premium.html

## 🔍 Verificações

### **Se ainda não funcionar:**

1. **Repositório Público?**
   - GitHub Pages gratuito só funciona em repos públicos
   - Vá em Settings → General → Change repository visibility

2. **Branch Correto?**
   - Certifique-se que está na branch **main**
   - Os arquivos estão na raiz do repositório

3. **Cache do Navegador**
   - Limpe o cache: Ctrl+Shift+R
   - Teste em aba anônima

4. **Status do GitHub**
   - Verifique: https://githubstatus.com/
   - Pode haver problemas temporários

## 🎯 Teste Final

Após configurar, teste estas URLs:

1. ✅ **Index:** https://dev-mjbs.github.io/MentalIA-3.1/
2. ✅ **Premium:** https://dev-mjbs.github.io/MentalIA-3.1/premium.html  
3. ✅ **Login Admin:** mjbs.dev@gmail.com (senha: !Band9al7)

## 📞 Se Precisar de Ajuda

- **WhatsApp Suporte:** +55 64 98138-1981
- **GitHub Issues:** https://github.com/Dev-MJBS/MentalIA-3.1/issues
- **Email:** mjbs.dev@gmail.com

---

## 🔥 Status das Correções

- ✅ Redirecionamento GitHub Pages corrigido
- ✅ Configuração Jekyll implementada  
- ✅ Arquivo .nojekyll criado
- ✅ URLs dinâmicas implementadas
- ✅ Detecção de ambiente automática

**O problema de "There isn't a GitHub Pages site here" deve estar resolvido!**