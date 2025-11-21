# deploy-functions.ps1 - Script PowerShell para deploy das Firebase Functions
# MentalIA 3.1 - Deploy seguro com variáveis de ambiente

Write-Host "🚀 DEPLOY FIREBASE FUNCTIONS - MentalIA 3.1" -ForegroundColor Green
Write-Host "================================================" -ForegroundColor Green

# Verificar se gcloud está instalado
if (!(Get-Command "gcloud" -ErrorAction SilentlyContinue)) {
    Write-Host "❌ ERRO: Google Cloud SDK não encontrado!" -ForegroundColor Red
    Write-Host "Instale em: https://cloud.google.com/sdk/docs/install" -ForegroundColor Yellow
    exit 1
}

# Verificar se as variáveis estão configuradas
$stripeSecret = $env:STRIPE_SECRET_KEY
$webhookSecret = $env:STRIPE_WEBHOOK_SECRET
$projectId = $env:FIREBASE_PROJECT_ID

if (-not $stripeSecret -or -not $webhookSecret) {
    Write-Host "❌ ERRO: Variáveis de ambiente não configuradas!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Configure as variáveis antes do deploy:" -ForegroundColor Yellow
    Write-Host '$env:STRIPE_SECRET_KEY = "SUA_CHAVE_SECRETA_STRIPE"' -ForegroundColor White
    Write-Host '$env:STRIPE_WEBHOOK_SECRET = "SEU_WEBHOOK_SECRET"' -ForegroundColor White
    Write-Host ""
    Write-Host "Ou carregue do arquivo .env:" -ForegroundColor Yellow
    Write-Host "Get-Content .env | ForEach-Object { if ($_ -match '^([^=]+)=(.*)$') { [System.Environment]::SetEnvironmentVariable($matches[1], $matches[2]) } }" -ForegroundColor White
    exit 1
}

if (-not $projectId) {
    $projectId = "mentalia-478819"
    Write-Host "⚠️  Usando projeto padrão: $projectId" -ForegroundColor Yellow
}

Write-Host "📋 Configurando variáveis de ambiente..." -ForegroundColor Yellow
Write-Host "📁 Projeto: $projectId" -ForegroundColor Cyan
Write-Host "🔑 Stripe Secret: ***" -ForegroundColor Cyan
Write-Host "📡 Webhook Secret: ***" -ForegroundColor Cyan

# Executar deploy
Write-Host ""
Write-Host "🔧 Executando deploy..." -ForegroundColor Green

$deployCommand = @"
gcloud functions deploy api --gen2 --runtime=nodejs18 --region=us-central1 --source=./functions --entry-point=api --trigger-http --allow-unauthenticated --set-env-vars="STRIPE_SECRET_KEY=$stripeSecret,STRIPE_WEBHOOK_SECRET=$webhookSecret,FIREBASE_PROJECT_ID=$projectId" --memory=512MB --timeout=60s
"@

try {
    Invoke-Expression $deployCommand
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Host "✅ Deploy concluído com sucesso!" -ForegroundColor Green
        Write-Host ""
        Write-Host "🔗 Function URL: https://us-central1-$projectId.cloudfunctions.net/api" -ForegroundColor Cyan
        Write-Host ""
        Write-Host "📝 Próximos passos:" -ForegroundColor Yellow
        Write-Host "1. Configure o webhook URL no Stripe Dashboard" -ForegroundColor White
        Write-Host "2. Teste os endpoints de checkout" -ForegroundColor White
        Write-Host "3. Verifique os logs com: gcloud functions logs read api --region=us-central1" -ForegroundColor White
    }
    else {
        throw "Deploy falhou com código: $LASTEXITCODE"
    }
}
catch {
    Write-Host "❌ Erro no deploy: $_" -ForegroundColor Red
    exit 1
}