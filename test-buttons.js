// Teste dos botões do MentalIA 3.1
console.log('🧪 Iniciando testes dos botões...');

// Aguardar a aplicação carregar
setTimeout(() => {
    console.log('🧪 Verificando se a aplicação carregou...');

    if (!window.mentalIA) {
        console.error('❌ MentalIA não foi inicializado!');
        return;
    }

    console.log('✅ MentalIA encontrado, testando botões...');

    // Teste 1: Botão .btn-primary
    const btnPrimary = document.querySelector('.btn-primary');
    if (btnPrimary) {
        console.log('✅ Botão .btn-primary encontrado');
        btnPrimary.style.border = '2px solid green';
    } else {
        console.error('❌ Botão .btn-primary NÃO encontrado');
    }

    // Teste 2: Slider #mood-slider
    const moodSlider = document.getElementById('mood-slider');
    if (moodSlider) {
        console.log('✅ Slider #mood-slider encontrado');
        moodSlider.style.border = '2px solid blue';
    } else {
        console.error('❌ Slider #mood-slider NÃO encontrado');
    }

    // Teste 3: Botão .primary-feeling-btn
    const feelingBtn = document.querySelector('.primary-feeling-btn');
    if (feelingBtn) {
        console.log('✅ Botão .primary-feeling-btn encontrado');
        feelingBtn.style.border = '2px solid orange';
    } else {
        console.error('❌ Botão .primary-feeling-btn NÃO encontrado');
    }

    // Teste 4: Botão #mood-continue-btn
    const continueBtn = document.getElementById('mood-continue-btn');
    if (continueBtn) {
        console.log('✅ Botão #mood-continue-btn encontrado');
        continueBtn.style.border = '2px solid purple';
    } else {
        console.error('❌ Botão #mood-continue-btn NÃO encontrado');
    }

    // Teste 5: Botão #generate-report
    const reportBtn = document.getElementById('generate-report');
    if (reportBtn) {
        console.log('✅ Botão #generate-report encontrado');
        reportBtn.style.border = '2px solid red';
    } else {
        console.error('❌ Botão #generate-report NÃO encontrado');
    }

    // Teste 6: Botão #backup-now-btn
    const backupBtn = document.getElementById('backup-now-btn');
    if (backupBtn) {
        console.log('✅ Botão #backup-now-btn encontrado');
        backupBtn.style.border = '2px solid cyan';
    } else {
        console.error('❌ Botão #backup-now-btn NÃO encontrado');
    }

    console.log('🧪 Testes concluídos! Verifique as bordas coloridas nos botões.');

    // Mostrar resumo
    setTimeout(() => {
        const summary = {
            'btn-primary': !!btnPrimary,
            'mood-slider': !!moodSlider,
            'primary-feeling-btn': !!feelingBtn,
            'mood-continue-btn': !!continueBtn,
            'generate-report': !!reportBtn,
            'backup-now-btn': !!backupBtn
        };

        console.table(summary);

        const working = Object.values(summary).filter(Boolean).length;
        const total = Object.values(summary).length;

        if (working === total) {
            console.log(`🎉 Todos os ${total} botões/elementos foram encontrados!`);
        } else {
            console.warn(`⚠️ ${working}/${total} botões/elementos encontrados.`);
        }
    }, 1000);

}, 3000);