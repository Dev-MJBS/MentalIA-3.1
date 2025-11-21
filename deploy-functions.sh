#!/bin/bash
# deploy-functions.sh - Script para deploy das Firebase Functions com variáveis de ambiente

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}🚀 DEPLOY FIREBASE FUNCTIONS - MentalIA 3.1${NC}"
echo "================================================"

# Verificar se as variáveis estão configuradas
if [ -z "$STRIPE_SECRET_KEY" ] || [ -z "$STRIPE_WEBHOOK_SECRET" ]; then
    echo -e "${RED}❌ ERRO: Variáveis de ambiente não configuradas!${NC}"
    echo ""
    echo "Configure as variáveis antes do deploy:"
    echo "export STRIPE_SECRET_KEY='SUA_CHAVE_SECRETA_STRIPE'"
    echo "export STRIPE_WEBHOOK_SECRET='SEU_WEBHOOK_SECRET'"
    echo ""
    echo "Ou use o arquivo .env:"
    echo "source .env"
    exit 1
fi

echo -e "${YELLOW}📋 Configurando variáveis de ambiente...${NC}"

# Deploy com variáveis de ambiente
echo -e "${GREEN}🔧 Executando deploy...${NC}"

gcloud functions deploy api \
  --gen2 \
  --runtime=nodejs18 \
  --region=us-central1 \
  --source=./functions \
  --entry-point=api \
  --trigger-http \
  --allow-unauthenticated \
  --set-env-vars="STRIPE_SECRET_KEY=${STRIPE_SECRET_KEY},STRIPE_WEBHOOK_SECRET=${STRIPE_WEBHOOK_SECRET},FIREBASE_PROJECT_ID=${FIREBASE_PROJECT_ID:-mentalia-478819}" \
  --memory=512MB \
  --timeout=60s

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Deploy concluído com sucesso!${NC}"
    echo ""
    echo "🔗 Function URL: https://us-central1-${FIREBASE_PROJECT_ID:-mentalia-478819}.cloudfunctions.net/api"
    echo ""
    echo -e "${YELLOW}📝 Próximos passos:${NC}"
    echo "1. Configure o webhook URL no Stripe Dashboard"
    echo "2. Teste os endpoints de checkout"
    echo "3. Verifique os logs com: gcloud functions logs read api"
else
    echo -e "${RED}❌ Erro no deploy!${NC}"
    exit 1
fi