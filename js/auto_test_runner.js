(async function(){
  try {
    // Only run when explicitly requested via URL param
    if (!location.search.includes('autotest=1')) return;

    console.log('[auto_test_runner] autotest=1 detected — starting test injection');

    // Wait for mentalStorage and mentalIA to be ready
    const waitFor = async (condFn, timeout=8000) => {
      const start = Date.now();
      while (!condFn() && (Date.now()-start) < timeout) await new Promise(r=>setTimeout(r,100));
      return condFn();
    };

    await waitFor(()=>window.mentalStorage && window.mentalIA && typeof window.mentalStorage.saveMoodEntry === 'function', 10000);
    if (!window.mentalStorage || !window.mentalIA) {
      console.warn('[auto_test_runner] Dependências não disponíveis. Abortando.');
      return;
    }

    // Sample entries (mood on 1..10 scale)
    const now = Date.now();
    const samples = [
      { mood: 7.5, feelings: [{value:'feliz', label:'Feliz'}], diary: 'Consegui terminar o projeto', timestamp: new Date(now - 86400000*6).toISOString() },
      { mood: 6.8, feelings: [{value:'animado', label:'Animado'}], diary: 'Dia produtivo, me senti bem', timestamp: new Date(now - 86400000*5).toISOString() },
      { mood: 4.0, feelings: [{value:'ansioso', label:'Ansioso'}], diary: 'Tive uma reunião estressante', timestamp: new Date(now - 86400000*4).toISOString() },
      { mood: 5.5, feelings: [{value:'grato', label:'Grato'}], diary: 'Apoio da família', timestamp: new Date(now - 86400000*3).toISOString() },
      { mood: 8.2, feelings: [{value:'esperancoso', label:'Esperançoso'}], diary: 'Planejando uma viagem', timestamp: new Date(now - 86400000*2).toISOString() },
      { mood: 6.0, feelings: [{value:'cansado', label:'Cansado'}], diary: 'Noite mal dormida', timestamp: new Date(now - 86400000*1).toISOString() },
      { mood: 7.0, feelings: [{value:'animado', label:'Animado'}], diary: 'Iniciando novos projetos', timestamp: new Date(now).toISOString() }
    ];

    const added = [];
    for (const s of samples) {
      try {
        const res = await window.mentalStorage.saveMoodEntry(s);
        added.push(res);
        console.log('[auto_test_runner] salvo:', res.id);
      } catch (err) {
        console.error('[auto_test_runner] erro ao salvar amostra:', err);
      }
      // small delay so DB transactions settle
      await new Promise(r=>setTimeout(r,200));
    }

    // Refresh internal lists and generate report
    await window.mentalIA.loadData();
    // Generate and display report (wrapped in try)
    try {
      await window.mentalIA.generateReport();
      console.log('[auto_test_runner] relatório gerado com sucesso');
      window.mentalIA.showToast('Dados de teste inseridos e relatório gerado', 'success', 5000);
    } catch (err) {
      console.warn('[auto_test_runner] falha ao gerar relatório:', err);
      window.mentalIA.showToast('Dados inseridos, falha ao gerar relatório', 'warning', 5000);
    }

  } catch (e) {
    console.error('[auto_test_runner] erro fatal:', e);
  }
})();
