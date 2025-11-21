# 🐛 Sistema de Debug - MentalIA 3.1

## Mudanças Implementadas

### 1. **Logs Detalhados Adicionados**
- ✅ Inicialização das Google APIs
- ✅ Processo de backup completo
- ✅ Verificação de estado (login, inicialização)
- ✅ Criptografia de dados
- ✅ Upload para Google Drive
- ✅ Tratamento de erros específicos

### 2. **Sistema de Debug Avançado**
- 🔧 Script `debug.js` que captura todos os logs
- 🔧 Botão "Debug Logs" na interface para baixar logs
- 🔧 Captura de erros globais e promises rejeitadas
- 🔧 Verificação automática de objetos críticos

### 3. **Identificação de Erros Melhorada**
- 📋 Stack traces completos
- 📋 Verificação de GAPI antes do uso
- 📋 Logs específicos para cada etapa do backup
- 📋 Mensagens de erro mais descritivas

## Como Usar o Sistema de Debug

### 1. **Reproduzir o Erro**
1. Acesse http://localhost:3000
2. Tente fazer o backup que está dando erro
3. Abra o Console do Navegador (F12)

### 2. **Capturar Logs Detalhados**
- Os logs agora mostram exatamente onde o erro ocorre
- Procure por mensagens com `[BACKUP DEBUG]`
- Todos os erros incluem stack traces completos

### 3. **Exportar Debug**
- Clique no botão vermelho "🐛 Debug Logs"
- Um arquivo .txt será baixado com todos os logs
- Envie este arquivo para análise completa

### 4. **Verificar No Console**
Execute estes comandos no console:
```javascript
// Ver todos os logs capturados
window.getDebugLogs()

// Verificar objetos críticos
console.log('Storage:', !!window.mentalStorage)
console.log('Backup:', !!window.googleDriveBackup)  
console.log('GAPI:', typeof gapi !== 'undefined')

// Limpar logs para novo teste
window.clearDebugLogs()
```

## Erros Mais Prováveis

### 1. **Google APIs não carregaram**
- Mensagem: "GAPI não está inicializado"
- Causa: Problemas de conectividade ou CSP
- Solução: Verificar conexão com internet

### 2. **Usuário não autenticado**
- Mensagem: "Usuário não está logado"
- Causa: Token expirado ou login não realizado
- Solução: Fazer login novamente

### 3. **Erro na criptografia**
- Mensagem: Erros relacionados a crypto.subtle
- Causa: Browser não suporta Web Crypto API
- Solução: Usar browser moderno (Chrome, Firefox, Edge)

### 4. **Falha na requisição**
- Mensagem: "Failed to fetch"
- Causa: Problema de rede ou CORS
- Solução: Verificar conectividade

## Próximos Passos

1. **Acesse a aplicação** e tente reproduzir o erro
2. **Observe o console** para ver os logs detalhados
3. **Capture os logs** usando o botão de debug
4. **Reporte** exatamente onde o erro aparece

O sistema agora fornecerá informações precisas sobre onde e por que o backup está falhando! 🎯