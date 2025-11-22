/**
 * Script de Verificação do Google Drive API
 * Execute no console do navegador (F12) para testar a configuração
 */

(function() {
    console.log('🔍 [VERIFICAÇÃO] Iniciando testes do Google Drive API...');

    // Teste 1: Verificar se as bibliotecas estão carregadas
    console.log('📚 [VERIFICAÇÃO] Verificando bibliotecas...');
    console.log('   gapi carregado:', typeof gapi !== 'undefined');
    console.log('   google carregado:', typeof google !== 'undefined');

    // Teste 2: Verificar origem atual
    const currentOrigin = window.location.origin;
    console.log('🌐 [VERIFICAÇÃO] Origem atual:', currentOrigin);

    const supportedOrigins = [
        'http://localhost',
        'http://localhost:3000',
        'http://localhost:8000',
        'http://localhost:8080',
        'https://dev-mjbs.github.io',
        'https://mentalia.app'
    ];

    const isOriginSupported = supportedOrigins.includes(currentOrigin);
    console.log('✅ [VERIFICAÇÃO] Origem suportada:', isOriginSupported);

    if (!isOriginSupported) {
        console.error('❌ [VERIFICAÇÃO] Origem NÃO suportada!');
        console.error('ℹ️ [VERIFICAÇÃO] Origens suportadas:', supportedOrigins);
        console.error('🔧 [VERIFICAÇÃO] Adicione esta origem no Google Cloud Console');
    }

    // Teste 3: Verificar se o MentalIA está carregado
    console.log('🧠 [VERIFICAÇÃO] Verificando MentalIA...');
    console.log('   window.mentalIA:', typeof window.mentalIA !== 'undefined');
    console.log('   window.googleDriveBackup:', typeof window.googleDriveBackup !== 'undefined');

    // Teste 4: Verificar status do backup
    if (window.googleDriveBackup) {
        console.log('☁️ [VERIFICAÇÃO] Status do Google Drive Backup:');
        console.log('   isOfflineMode:', window.googleDriveBackup.isOfflineMode);
        console.log('   isSignedIn:', window.googleDriveBackup.isSignedIn);
        console.log('   clientId:', window.googleDriveBackup.clientId ? 'Configurado' : 'Não configurado');
    }

    // Teste 5: Tentar inicialização manual (se necessário)
    if (typeof gapi !== 'undefined' && !window.googleDriveBackup?.isSignedIn) {
        console.log('🔄 [VERIFICAÇÃO] Tentando inicialização manual...');

        try {
            gapi.load('client:auth2', async () => {
                try {
                    await gapi.client.init({
                        discoveryDocs: ['https://www.googleapis.com/discovery/v1/apis/drive/v3/rest'],
                        clientId: '670002862076-ivoemo399amv728d61llbdqn3fbcr8tk.apps.googleusercontent.com',
                        scope: 'https://www.googleapis.com/auth/drive.appdata'
                    });

                    const authInstance = gapi.auth2.getAuthInstance();
                    const isSignedIn = authInstance.isSignedIn.get();

                    console.log('✅ [VERIFICAÇÃO] GAPI inicializado manualmente');
                    console.log('🔐 [VERIFICAÇÃO] Usuário logado:', isSignedIn);

                    if (isSignedIn) {
                        const user = authInstance.currentUser.get();
                        const email = user.getBasicProfile().getEmail();
                        console.log('👤 [VERIFICAÇÃO] Usuário:', email);
                    }

                } catch (error) {
                    console.error('❌ [VERIFICAÇÃO] Erro na inicialização manual:', error);

                    if (error.message && error.message.includes('origin')) {
                        console.error('🚨 [VERIFICAÇÃO] PROBLEMA CONFIRMADO: Origem não autorizada');
                        console.error('🔧 [VERIFICAÇÃO] SOLUÇÃO: Adicione no Google Cloud Console:');
                        console.error('   https://console.cloud.google.com/');
                        console.error('   → APIs e Serviços → Credenciais');
                        console.error('   → Adicionar origem:', currentOrigin);
                    }
                }
            });
        } catch (error) {
            console.error('❌ [VERIFICAÇÃO] Erro geral na verificação:', error);
        }
    }

    // Resultado final
    console.log('📋 [VERIFICAÇÃO] === RESULTADO FINAL ===');
    if (isOriginSupported && window.googleDriveBackup && !window.googleDriveBackup.isOfflineMode) {
        console.log('✅ [VERIFICAÇÃO] CONFIGURAÇÃO CORRETA - Deve funcionar!');
    } else {
        console.log('❌ [VERIFICAÇÃO] CONFIGURAÇÃO INCORRETA - Verifique os logs acima');
        console.log('📖 [VERIFICAÇÃO] Consulte: CORRIGIR_GOOGLE_DRIVE.md');
    }

    console.log('🔍 [VERIFICAÇÃO] Testes concluídos. Verifique os logs acima.');

    // Mostrar instruções finais
    setTimeout(() => {
        console.log('💡 [VERIFICAÇÃO] Para mais ajuda:');
        console.log('   1. Abra CORRIGIR_GOOGLE_DRIVE.md');
        console.log('   2. Siga o passo-a-passo');
        console.log('   3. Recarregue a página após configurar');
        console.log('   4. Execute este script novamente');
    }, 1000);

})();