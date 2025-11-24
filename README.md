# MentalIA 3.1 - Diário Emocional com IA

## Configuração do Google Drive Backup

Para habilitar o backup automático no Google Drive, siga estes passos:

### 1. Criar Credenciais OAuth no Google Cloud Console

1. Acesse [Google Cloud Console](https://console.cloud.google.com/)
2. Crie um novo projeto ou selecione um existente
3. Vá para "APIs e Serviços" > "Credenciais"
4. Clique em "Criar Credenciais" > "ID do cliente OAuth"
5. Configure:
   - **Tipo**: Aplicação Web
   - **Origens JavaScript autorizadas**:
     - `http://localhost:8000` (para desenvolvimento local)
     - `https://dev-mjbs.github.io` (para produção)
   - **URIs de redirecionamento autorizadas**:
     - `http://localhost:8000` (para desenvolvimento local)
     - `https://dev-mjbs.github.io/MentalIA-3.1` (para produção)
6. Baixe o arquivo JSON das credenciais

### ⚠️ **Importante para Desenvolvimento Local:**

- Adicione `http://localhost:8000` às origens JavaScript autorizadas
- Adicione `http://localhost:8000` aos URIs de redirecionamento autorizados
- Use `python -m http.server 8000` para testar localmente

### 2. Configurar no MentalIA

**IMPORTANTE:** Nunca commite o arquivo de credenciais reais no Git! Use apenas o `client_id` publicamente.

1. Copie `js/google-credentials-example.json` para `js/google-credentials.json`
2. Edite o arquivo e coloque apenas o `client_id` (o `client_secret` fica no servidor ou local):
   ```json
   {
     "web": {
       "client_id": "SEU_CLIENT_ID_AQUI",
       "client_secret": "SEU_CLIENT_SECRET_AQUI"
     }
   }
   ```
3. No `index.html`, injete as credenciais via script (antes de carregar `google_drive_backup.js`):
   ```html
   <script>
     window.GOOGLE_CREDENTIALS = {
       client_id: '\''SEU_CLIENT_ID_REAL_AQUI'\''
     };
   </script>
   ```

### 3. Funcionalidades do Backup

-  Backup automático após login
-  Restauração automática se DB local vazio
-  Criptografia AES-256 end-to-end
-  Dados armazenados na pasta appDataFolder do Google Drive
-  Toasts em português

### 4. Segurança

- 🔒 Dados criptografados antes do envio
- 🔒 Chave de criptografia derivada do dispositivo
- 🔒 Client Secret nunca exposto no frontend
- 🔒 Apenas Client ID público necessário

## 🔧 Troubleshooting

### Erro "405 Not Allowed" no login

Se você receber "405 Not Allowed" ao fazer login:

1. **Verifique a configuração do Google Cloud Console**:
   - As origens JavaScript devem incluir `http://localhost:8000`
   - Os URIs de redirecionamento devem incluir `http://localhost:8000`

2. **Certifique-se de estar rodando na porta correta**:
   ```bash
   python -m http.server 8000
   ```

3. **Verifique se o Client ID está correto**:
   - Deve ser injetado via `window.GOOGLE_CREDENTIALS.client_id`
   - Não deve conter o client_secret

4. **Teste em produção**:
   - Para GitHub Pages, use apenas URLs HTTPS
   - Certifique-se de que o domínio está na lista de origens autorizadas

Para mais detalhes, consulte `CORREÇÕES-IMPLEMENTADAS.md`.
