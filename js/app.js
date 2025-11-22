/*
  Full clean `app.js` for MentalIA 3.1
*/

class MentalIA {
  constructor() {
    this.currentScreen = 'welcome';
    this.currentMood = 5.0;
    this.selectedFeelings = new Set();
    this.pendingDelete = null;
    this.chart = null; // report chart
    this.historyChart = null; // small chart used on history screen
    this.currentReport = null; // 🔥 NOVO: Armazenar relatório atual para export PDF
    this.currentEntries = null; // 🔥 NOVO: Armazenar entradas atuais
  }

  async init() {
    await this.waitForReady();
    this.setupEventListeners();
    this.initTheme();
    this.updateMoodDisplay(this.currentMood);
    await this.loadData();
    this.showScreen('welcome');
  }

  async waitForReady(timeout = 5000) {
    const start = Date.now();
    while ((typeof window.mentalStorage === 'undefined' || typeof window.aiAnalysis === 'undefined') && (Date.now() - start) < timeout) {
      await new Promise(r => setTimeout(r, 100));
    }
    if (window.mentalStorage && typeof window.mentalStorage.ensureInitialized === 'function') {
      await window.mentalStorage.ensureInitialized();
    }
  }

  setupEventListeners() {
    document.querySelectorAll('[data-screen]').forEach(btn => {
      const screen = btn.dataset.screen;
      const handler = (e) => { e.preventDefault(); this.showScreen(screen); };
      btn.removeEventListener('click', btn._mh);
      btn._mh = handler;
      btn.addEventListener('click', handler);
      btn.addEventListener('touchend', handler);
    });

    const slider = document.getElementById('mood-slider');
    if (slider) {
      slider.addEventListener('input', (e) => this.updateMoodDisplay(parseFloat(e.target.value)));
      slider.addEventListener('change', (e) => this.updateMoodDisplay(parseFloat(e.target.value)));
    }

    // Delegated clicks: handle sub-feelings selection and delete buttons
    document.addEventListener('click', (e) => {
      const item = e.target.closest('.sub-feeling-item');
      if (item) {
        // If the actual input was clicked, let the browser toggle it.
        // If another part of the label was clicked, toggle manually but avoid double-toggle.
        const cb = item.querySelector('input[type="checkbox"]');
        if (cb) {
          const targetTag = (e.target && e.target.tagName) ? e.target.tagName.toLowerCase() : '';
          if (targetTag === 'input') {
            // input already toggled by browser
          } else {
            // toggle manually
            cb.checked = !cb.checked;
          }
        }
        // Update selection UI after a tick to ensure checkbox state is settled
        setTimeout(() => this.updateSelectedFeelings(), 0);
      }

      const del = e.target.closest('.delete-entry-btn');
      if (del) {
        e.preventDefault();
        const id = del.dataset.entryId ? Number(del.dataset.entryId) : null;
        this.showDeleteModal(id, false);
      }
    });

    // Toggle sub-feelings panel when clicking the primary feeling button
    // Initialize feelings wheel (accordion) with delegated handlers
    this.initFeelingsWheel();

    // Clear selected feelings button
    document.getElementById('clear-feelings')?.addEventListener('click', (e) => {
      e?.preventDefault();
      this.clearAllFeelings();
      this.showToast('Seleção de sentimentos limpa', 'info');
    });

    document.getElementById('confirm-delete')?.addEventListener('click', () => this.confirmDelete());
    document.getElementById('cancel-delete')?.addEventListener('click', () => this.hideDeleteModal());
    document.getElementById('mood-form')?.addEventListener('submit', (e) => this.handleMoodSubmit(e));
    document.getElementById('generate-report')?.addEventListener('click', (e) => { e.preventDefault(); this.generateReport(); });
    document.getElementById('export-report')?.addEventListener('click', (e) => { e.preventDefault(); this.exportReportAsPDF(); });
    document.getElementById('export-therapist-pdf')?.addEventListener('click', (e) => { e.preventDefault(); this.exportReportAsPDF(); });
    document.getElementById('share-report')?.addEventListener('click', (e) => { e.preventDefault(); this.shareReport(); });
    document.getElementById('generate-pdf-report')?.addEventListener('click', (e) => { e.preventDefault(); window.aiAnalysis.downloadReport(); });
    document.getElementById('delete-all-data')?.addEventListener('click', (e) => { e.preventDefault(); this.showDeleteModal(null, true); });
    document.getElementById('backup-data')?.addEventListener('click', (e) => { e.preventDefault(); this.backupData(); });
  }

  // Initialize feelings accordion behavior using delegation for better mobile/touch support
  initFeelingsWheel() {
    const container = document.body;
    // Delegate click/touchend to primary feeling buttons and expand icons
    const handler = (e) => {
      const btn = e.target.closest ? e.target.closest('.primary-feeling-btn') : null;
      const icon = e.target.closest ? e.target.closest('.expand-icon') : null;
      if (!btn && !icon) return;
      e.preventDefault();
      e.stopPropagation();
      const card = (btn || icon).closest('.primary-feeling-card');
      if (!card) return;
      // Toggle this card and collapse siblings
      this.toggleFeelingCategory(card);
    };
    // Use both click and touchend for responsiveness on mobile
    container.removeEventListener('click', container._feelingsHandler);
    container.removeEventListener('touchend', container._feelingsHandler);
    container._feelingsHandler = handler;
    container.addEventListener('click', handler, { passive: false });
    container.addEventListener('touchend', handler, { passive: false });
    // Keyboard accessibility: allow Enter/Space to toggle when focused
    document.querySelectorAll('.primary-feeling-btn').forEach(btn => {
      btn.setAttribute('tabindex', '0');
      btn.addEventListener('keydown', (ev) => {
        if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); btn.click(); }
      });
    });
  }

  // Toggle a single category card: expand it, rotate icon, and collapse others
  toggleFeelingCategory(card) {
    try {
      const isExpanded = card.classList.contains('expanded');
      // Collapse all first
      document.querySelectorAll('.primary-feeling-card.expanded').forEach(c => {
        if (c === card && !isExpanded) return; // keep open target if toggling open
        c.classList.remove('expanded');
        const ic = c.querySelector('.expand-icon'); if (ic) ic.classList.remove('rotated');
      });
      // Toggle target
      if (isExpanded) {
        card.classList.remove('expanded');
        const ic = card.querySelector('.expand-icon'); if (ic) ic.classList.remove('rotated');
      } else {
        card.classList.add('expanded');
        const ic = card.querySelector('.expand-icon'); if (ic) ic.classList.add('rotated');
        // ensure the inner panel scrolls into view on mobile
        const panel = card.querySelector('.sub-feelings-panel'); if (panel) panel.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    } catch (err) {
      console.warn('toggleFeelingCategory error:', err);
    }
  }

  // Initialize Chart.js for the report screen (canvas id: report-chart)
  // force: if true, destroy existing chart and recreate
  initChart(force = false) {
    try {
      if (typeof Chart === 'undefined') { console.warn('Chart.js não carregado'); return; }
      const canvas = document.getElementById('report-chart');
      if (!canvas) { console.warn('Canvas do relatório (#report-chart) não encontrado'); return; }

      // If chart exists and force requested or canvas was replaced, destroy it first
      if (this.chart && (force || !this.chart.ctx || !this.chart.ctx.canvas.isConnected)) {
        try { this.chart.destroy(); } catch(e){}
        this.chart = null;
      }

      // If chart already exists after potential destroy, reuse it
      if (this.chart) return;

      // Measure and set canvas backing store size for crisp rendering
      const rect = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      const width = Math.max(300, Math.floor(rect.width));
      const height = Math.max(120, Math.floor(rect.height || 220));
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = width + 'px';
      canvas.style.height = height + 'px';
      const ctx = canvas.getContext('2d');
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      // create gradient (left red -> right blue)
      const grad = ctx.createLinearGradient(0, 0, canvas.width || canvas.clientWidth, 0);
      grad.addColorStop(0, '#d32f2f');
      grad.addColorStop(1, '#06b6d4');

      this.chart = new Chart(ctx, {
        type: 'line',
        data: {
          labels: [],
          datasets: [{
            label: 'Humor',
            data: [],
            borderColor: grad,
            backgroundColor: 'rgba(0,0,0,0)',
            tension: 0.35,
            pointRadius: 3,
            fill: false
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false }
          },
          scales: {
            x: { ticks: { color: getComputedStyle(document.documentElement).getPropertyValue('--text-primary') || '#fff' } },
            y: { beginAtZero: false, min: 1, max: 10, ticks: { stepSize: 1 } }
          }
        }
      });
      // small debug
      console.debug('Chart initialized', { width: canvas.width, height: canvas.height, dpr });
    } catch (err) {
      console.warn('Erro ao inicializar gráfico:', err);
    }
  }

  // Update the report chart with entries: expects array of entries with timestamp and mood
  async updateChart(entries) {
    try {
      if (!this.chart) this.initChart(true);
      // If chart still not created, try again after a frame
      if (!this.chart) { await new Promise(r=>requestAnimationFrame(r)); this.initChart(true); }
      const data = entries && Array.isArray(entries) ? entries.slice().sort((a,b)=>new Date(a.timestamp)-new Date(b.timestamp)) : [];
      const labels = data.map(e => new Date(e.timestamp).toLocaleDateString('pt-BR'));
      const values = data.map(e => Number(e.mood));
      if (!this.chart) return;
      console.debug('Updating chart with', labels.length, 'points');
      // update dataset and labels
      this.chart.data.labels = labels;
      this.chart.data.datasets[0].data = values;
      // update gradient in case canvas resized
      try {
        const canvas = this.chart.ctx.canvas;
        const ctx = this.chart.ctx;
        const grad = ctx.createLinearGradient(0, 0, canvas.width || canvas.clientWidth, 0);
        grad.addColorStop(0, '#d32f2f');
        grad.addColorStop(1, '#06b6d4');
        this.chart.data.datasets[0].borderColor = grad;
      } catch(e) { console.warn('gradient update failed', e); }
      // ensure chart respects current container sizing
      try { this.chart.resize(); } catch(e){}
      this.chart.update('active');
    } catch (err) {
      console.warn('Erro ao atualizar gráfico:', err);
    }
  }

  // Initialize and update a smaller chart for the History screen (canvas id: mood-chart)
  initHistoryChart(force = false) {
    try {
      if (typeof Chart === 'undefined') { console.warn('Chart.js não carregado (history)'); return; }
      const canvas = document.getElementById('mood-chart');
      if (!canvas) { console.warn('Canvas mood-chart não encontrado'); return; }
      if (this.historyChart && (force || !this.historyChart.ctx || !this.historyChart.ctx.canvas.isConnected)) {
        try { this.historyChart.destroy(); } catch(e){}
        this.historyChart = null;
      }
      if (this.historyChart) return;
      const rect = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      const width = Math.max(300, Math.floor(rect.width));
      const height = Math.max(120, Math.floor(rect.height || 140));
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = width + 'px';
      canvas.style.height = height + 'px';
      const ctx = canvas.getContext('2d');
      ctx.setTransform(dpr,0,0,dpr,0,0);
      const grad = ctx.createLinearGradient(0,0,canvas.width,0);
      grad.addColorStop(0,'#7c3aed');
      grad.addColorStop(1,'#06b6d4');
      this.historyChart = new Chart(ctx, {
        type: 'line',
        data: { labels: [], datasets: [{ label: 'Humor', data: [], borderColor: grad, backgroundColor: 'transparent', tension:0.35, pointRadius:2, fill:false }] },
        options: { responsive:true, maintainAspectRatio:false, plugins:{ legend:{ display:false } }, scales: { x:{ display:false }, y:{ min:1, max:10, ticks:{ stepSize:1 } } } }
      });
    } catch(err) { console.warn('initHistoryChart error:', err); }
  }

  async updateHistoryChart(entries) {
    try {
      if (!this.historyChart) this.initHistoryChart(true);
      if (!this.historyChart) { await new Promise(r=>requestAnimationFrame(r)); this.initHistoryChart(true); }
      const data = entries && Array.isArray(entries) ? entries.slice().sort((a,b)=>new Date(a.timestamp)-new Date(b.timestamp)) : [];
      const labels = data.map(e=>new Date(e.timestamp).toLocaleDateString('pt-BR'));
      const values = data.map(e=>Number(e.mood));
      if (!this.historyChart) return;
      this.historyChart.data.labels = labels;
      this.historyChart.data.datasets[0].data = values;
      try { const canvas = this.historyChart.ctx.canvas; const ctx=this.historyChart.ctx; const grad = ctx.createLinearGradient(0,0,canvas.width||canvas.clientWidth,0); grad.addColorStop(0,'#7c3aed'); grad.addColorStop(1,'#06b6d4'); this.historyChart.data.datasets[0].borderColor = grad; } catch(e){}
      try { this.historyChart.resize(); } catch(e){}
      this.historyChart.update();
    } catch(err) { console.warn('updateHistoryChart error:', err); }
  }

  initTheme() { const t = localStorage.getItem('mental-ia-theme') || 'dark'; document.documentElement.setAttribute('data-theme', t); }

  showScreen(name) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    const target = document.getElementById(`${name}-screen`);
    if (target) target.classList.add('active');
    this.currentScreen = name;
    if (name === 'mood') this.updateMoodDisplay(this.currentMood);
    if (name === 'history') this.loadData();
  }

  updateMoodDisplay(value) {
    this.currentMood = Number(value) || 5.0;
    // clamp to 1..10
    this.currentMood = Math.max(1, Math.min(10, this.currentMood));
    const bigEmojiEl = document.getElementById('big-mood-emoji');
    const textEl = document.getElementById('current-mood-text');
    const valueEl = document.getElementById('current-mood-value');
    const mood = this.getMoodData(this.currentMood);
    if (bigEmojiEl) {
      bigEmojiEl.textContent = mood.emoji;
      // subtle animation feedback
      bigEmojiEl.style.transform = 'scale(1.06)';
      setTimeout(() => { try { bigEmojiEl.style.transform = ''; } catch(e){} }, 160);
    }
    if (textEl) textEl.textContent = mood.text;
    if (valueEl) valueEl.textContent = this.currentMood.toFixed(1);
    const slider = document.getElementById('mood-slider'); if (slider) slider.value = this.currentMood;
    document.documentElement.style.setProperty('--current-mood-color', mood.color || '#6366f1');
  }

  getMoodData(value) {
    const v = Number(value);
    if (isNaN(v)) return { emoji: '😐', text: 'Neutro', color: '#64748b' };
    if (v <= 2.0) return { emoji: '😢', text: 'Muito Baixo', color: '#d32f2f' };
    if (v <= 4.0) return { emoji: '😕', text: 'Baixo', color: '#fb923c' };
    if (v <= 6.0) return { emoji: '😊', text: 'Neutro', color: '#f59e0b' };
    if (v <= 8.0) return { emoji: '🤗', text: 'Alto', color: '#10b981' };
    return { emoji: '🥰', text: 'Muito Alto', color: '#06b6d4' };
  }

  updateSelectedFeelings() {
    // Find checked inputs inside .sub-feeling-item
    const checked = Array.from(document.querySelectorAll('.sub-feeling-item input[type="checkbox"]:checked'));
    const arr = checked.map(cb => {
      const container = cb.closest('.sub-feeling-item');
      const labelEl = container?.querySelector('.sub-label');
      const label = labelEl ? labelEl.textContent.trim() : (cb.value || '');
      return { value: cb.value, label };
    });
    // keep a Set of serialized items to maintain uniqueness
    this.selectedFeelings = new Set(arr.map(a => JSON.stringify(a)));
    const list = document.getElementById('selected-feelings-list');
    if (list) list.innerHTML = arr.map(f => `<span class="selected-feeling-tag">${f.label}</span>`).join('');
    // show/hide the summary box
    const summary = document.querySelector('.selected-feelings-summary');
    if (summary) {
      if (arr.length > 0) summary.classList.add('has-selections'); else summary.classList.remove('has-selections');
    }
  }

  clearAllFeelings() { document.querySelectorAll('.sub-feeling-item input').forEach(cb => cb.checked = false); this.selectedFeelings.clear(); this.updateSelectedFeelings(); }

  async handleMoodSubmit(e) {
    e.preventDefault();
    if (this._isSaving) {
      this.showToast('Salvamento em andamento, por favor aguarde...', 'info');
      return;
    }
    this._isSaving = true;
    const submitBtn = document.querySelector('#mood-form button[type="submit"]') || document.querySelector('.mood-continue-btn');
    if (submitBtn) submitBtn.disabled = true;
    try {
      // Build the diary and feelings payload for storage
      const diary = document.getElementById('diary-entry')?.value?.trim() || '';
      const feelingsParsed = Array.from(this.selectedFeelings).map(s => {
        try { return JSON.parse(s); } catch(_) { return s; }
      });

      // Entry object conforms to storage.saveMoodEntry expectations
      const entry = {
        id: Date.now(),
        mood: Math.round(this.currentMood * 10) / 10,
        feelings: feelingsParsed,
        diary,
        timestamp: new Date().toISOString()
      };

      if (!window.mentalStorage) throw new Error('Storage não disponível');

      // Save encrypted entry to IndexedDB via MentalStorage
      await window.mentalStorage.saveMoodEntry(entry);

      this.showToast('Humor registrado com sucesso!', 'success');
      this.resetMoodForm();
      this.showScreen('history');
      await this.loadData();
    } catch (err) {
      console.error('Erro ao salvar:', err);
      this.showToast('Erro ao salvar: ' + (err.message || err), 'error');
    }
    finally {
      this._isSaving = false;
      if (submitBtn) setTimeout(()=>submitBtn.disabled = false, 250);
    }
  }

  resetMoodForm() { this.currentMood = 5.0; this.updateMoodDisplay(5.0); this.clearAllFeelings(); const ta = document.getElementById('diary-entry'); if (ta) ta.value = ''; }

  async loadData() {
    try {
      if (!window.mentalStorage) await this.waitForReady();
      const entries = await window.mentalStorage.getAllMoodEntries();
      const stats = await window.mentalStorage.getStats?.() || {};
      this.updateStats(stats);
      this.updateRecentEntries(entries || []);
      // Update small history chart as well
      try { await this.updateHistoryChart(entries || []); } catch(e) { console.warn('Erro ao atualizar history chart:', e); }
    } catch (err) { console.error('Erro ao carregar dados:', err); }
  }

  updateStats(stats) {
    const avg = document.getElementById('avg-mood'); if (avg) avg.textContent = (stats.averageMood || 0).toFixed ? (stats.averageMood || 0).toFixed(1) : (stats.averageMood || 0);
    const total = document.getElementById('total-entries'); if (total) total.textContent = stats.totalEntries || 0;
    const streak = document.getElementById('streak-days'); if (streak) streak.textContent = stats.streak || 0;
  }

  updateRecentEntries(entries) {
    const container = document.getElementById('recent-list'); if (!container) return;
    container.innerHTML = '';
    if (!entries || entries.length === 0) { container.innerHTML = `<div class=\"empty-state\"><h3> Nenhum registro ainda</h3><p>Registre seu primeiro humor para ver o histórico aqui!</p></div>`; return; }
    entries.slice(0, 10).forEach(entry => {
      const feelings = Array.isArray(entry.feelings) ? entry.feelings.map(f => typeof f === 'string' ? f : (f.label || f.value || '')).filter(Boolean) : [];
      const el = document.createElement('div'); el.className = 'recent-entry'; el.innerHTML = `
        <div class=\"entry-content\">
          <div class=\"entry-date\">${new Date(entry.timestamp).toLocaleDateString('pt-BR')}</div>
          <div class=\"entry-mood\">${this.getMoodEmoji(entry.mood)} ${entry.mood.toFixed(1)}</div>
          <div class=\"entry-feelings\">${feelings.slice(0,3).join(', ') || 'Nenhum sentimento selecionado'}</div>
          ${entry.diary ? `<div class=\"entry-diary\">\"${entry.diary.substring(0,100)}${entry.diary.length>100?'...':''}\"</div>` : ''}
        </div>
          <button class=\"delete-entry-btn\" data-entry-id=\"${entry.id}\" title=\"Excluir registro\">🗑️</button>
      `; container.appendChild(el);
    });
  }

  getMoodEmoji(mood) {
    const v = Number(mood);
    if (isNaN(v)) return '';
    if (v <= 2.0) return '😢';
    if (v <= 4.0) return '😕';
    if (v <= 6.0) return '😊';
    if (v <= 8.0) return '🤗';
    return '🥰';
  }

  showDeleteModal(entryId, isAll) {
    this.pendingDelete = { entryId, isAll };
    const modal = document.getElementById('delete-modal');
    const title = document.getElementById('modal-title');
    const msg = document.getElementById('modal-message');
    if (!modal) return;
    title.textContent = isAll ? 'Apagar Todos os Dados' : 'Excluir Registro';
    // For bulk delete show the requested confirmation message in PT-BR
    msg.textContent = isAll ? 'Tem certeza? Isso não dá pra reverter' : 'Tem certeza que quer excluir este registro? Isso é permanente.';
    modal.classList.remove('hidden');
  }

  hideDeleteModal() { document.getElementById('delete-modal')?.classList.add('hidden'); this.pendingDelete = null; }

  async confirmDelete() {
    if (!this.pendingDelete) return;
    const { entryId, isAll } = this.pendingDelete;
    try {
      if (isAll) { await window.mentalStorage.deleteAllEntries(); this.showToast('Todos os dados foram excluídos.', 'success'); this.showScreen('welcome'); }
      else { await window.mentalStorage.deleteEntry(entryId); this.showToast('Registro excluído', 'success'); await this.loadData(); }
    } catch (err) { console.error('Erro ao excluir:', err); this.showToast('Erro ao excluir: ' + (err.message || err), 'error'); }
    finally { this.hideDeleteModal(); }
  }

  async generateReport() {
    try {
      const btn = document.getElementById('generate-report'); if (btn) { btn.disabled = true; }
      const entries = await window.mentalStorage.getAllMoodEntries();
      if (!entries || entries.length === 0) { this.displayEmptyReport(); this.showToast('Adicione registros para gerar relatório', 'info'); return; }
      const report = await window.aiAnalysis.generateReport(entries);
      await this.displayReport(report, entries);
      this.showToast('Relatório gerado!', 'success');
    } catch (err) {
      console.error('Erro no relatório:', err);
      this.showToast('Erro ao gerar relatório: ' + (err.message || err), 'error');
    } finally {
      const btn = document.getElementById('generate-report'); if (btn) { setTimeout(()=>btn.disabled = false, 800); }
    }
  }

  displayEmptyReport() {
    const content = document.getElementById('report-content');
    if (content) {
      content.classList.remove('hidden');
      content.innerHTML = '<div class="analysis-content">Adicione registros para gerar um relatório.</div>';
    }
  }

  // Render report object into HTML (converts Markdown -> HTML) and updates chart
  async displayReport(report, entries = []) {
    const content = document.getElementById('report-content'); if (!content) return;
    content.classList.remove('hidden');

    // 🔥 NOVO: Armazenar relatório e entradas para export PDF
    this.currentReport = report;
    this.currentEntries = entries;

    // Parse the analysis content and split into sections
    const analysisMd = String(report.analysis || '');
    const analysisHtml = this.markdownToHtml(analysisMd);
    const recommendations = Array.isArray(report.recommendations) ? report.recommendations : [];
    const insights = Array.isArray(report.insights) ? report.insights : [];

    // Extract sections from the analysis HTML
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = analysisHtml;
    const sections = {
      general: '',
      patterns: '',
      triggers: '',
      recommendations: ''
    };

    // Try to extract sections from the content
    const h3Elements = tempDiv.querySelectorAll('h3, h4');
    let currentSection = 'general';
    let sectionContent = [];

    for (const element of tempDiv.children) {
      const text = element.textContent?.toLowerCase() || '';
      if (text.includes('padrão') || text.includes('pattern')) {
        if (sectionContent.length > 0) sections[currentSection] = sectionContent.join('');
        currentSection = 'patterns';
        sectionContent = [element.outerHTML];
      } else if (text.includes('gatilh') || text.includes('trigger')) {
        if (sectionContent.length > 0) sections[currentSection] = sectionContent.join('');
        currentSection = 'triggers';
        sectionContent = [element.outerHTML];
      } else if (text.includes('recomend') || text.includes('recommend')) {
        if (sectionContent.length > 0) sections[currentSection] = sectionContent.join('');
        currentSection = 'recommendations';
        sectionContent = [element.outerHTML];
      } else {
        sectionContent.push(element.outerHTML);
      }
    }
    if (sectionContent.length > 0) sections[currentSection] = sectionContent.join('');

    // If no sections were found, put everything in general
    if (!sections.general && !sections.patterns && !sections.triggers && !sections.recommendations) {
      sections.general = analysisHtml;
    }

    // Update the specific sections
    const generalEl = document.getElementById('general-analysis');
    const patternsEl = document.getElementById('patterns-analysis');
    const triggersEl = document.getElementById('triggers-analysis');
    const recommendationsEl = document.getElementById('recommendations');

    if (generalEl) generalEl.innerHTML = sections.general || 'Análise geral não disponível.';
    if (patternsEl) patternsEl.innerHTML = sections.patterns || 'Padrões não identificados.';
    if (triggersEl) triggersEl.innerHTML = sections.triggers || 'Gatilhos não identificados.';
    if (recommendationsEl) {
      recommendationsEl.innerHTML = sections.recommendations ||
        (recommendations.length > 0 ? recommendations.map(r => `<p>${this.escapeHtml(String(r))}</p>`).join('') : 'Recomendações não disponíveis.');
    }

    // Initialize / update chart with provided entries
    try {
      await this.updateChart(entries || await window.mentalStorage.getAllMoodEntries());
    } catch(e) { console.warn('Erro ao atualizar gráfico após gerar relatório:', e); }
  }

  // Minimal, safe markdown -> HTML converter (supports headings, bold, lists, paragraphs)
  markdownToHtml(md) {
    if (!md) return '';
    const esc = (s) => String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
    const lines = String(md).split('\n');
    let html = '';
    let inList = false;
    for (let i=0;i<lines.length;i++){
      let line = lines[i].trim();
      if (!line) { if (inList) { html += '</ul>'; inList = false; } html += '<p></p>'; continue; }
      const h6 = /^######\s+(.*)/.exec(line);
      const h5 = /^#####\s+(.*)/.exec(line);
      const h4 = /^####\s+(.*)/.exec(line);
      const h3 = /^###\s+(.*)/.exec(line);
      const h2 = /^##\s+(.*)/.exec(line);
      const h1 = /^#\s+(.*)/.exec(line);
      if (h1) { if (inList) { html += '</ul>'; inList=false;} html += `<h1>${esc(h1[1])}</h1>`; continue; }
      if (h2) { if (inList) { html += '</ul>'; inList=false;} html += `<h2>${esc(h2[1])}</h2>`; continue; }
      if (h3) { if (inList) { html += '</ul>'; inList=false;} html += `<h3>${esc(h3[1])}</h3>`; continue; }
      if (h4) { if (inList) { html += '</ul>'; inList=false;} html += `<h4>${esc(h4[1])}</h4>`; continue; }
      if (h5) { if (inList) { html += '</ul>'; inList=false;} html += `<h5>${esc(h5[1])}</h5>`; continue; }
      if (h6) { if (inList) { html += '</ul>'; inList=false;} html += `<h6>${esc(h6[1])}</h6>`; continue; }
      const listMatch = /^([\-\*•])\s+(.*)/.exec(line);
      if (listMatch) {
        if (!inList) { html += '<ul>'; inList = true; }
        html += `<li>${esc(listMatch[2]).replace(/\*\*(.*?)\*\*/g,'<strong>$1</strong>')}</li>`;
        continue;
      }
      const bolded = esc(line).replace(/\*\*(.*?)\*\*/g,'<strong>$1</strong>');
      html += `<p>${bolded}</p>`;
    }
    if (inList) html += '</ul>';
    return html;
  }

  // Extract specific section from markdown analysis
  extractSection(analysis, keywords) {
    if (!analysis) return '';
    const lines = analysis.split('\n');
    let inSection = false;
    let sectionContent = [];

    for (const line of lines) {
      const lowerLine = line.toLowerCase();
      const isHeader = keywords.some(keyword => lowerLine.includes(keyword));
      if (isHeader && (line.startsWith('#') || line.startsWith('##') || line.startsWith('###'))) {
        inSection = true;
        continue;
      }
      if (inSection) {
        if (line.startsWith('#') && !keywords.some(keyword => lowerLine.includes(keyword))) {
          break; // Next section
        }
        if (line.trim()) {
          sectionContent.push(line);
        }
      }
    }

    return sectionContent.join('\n').trim();
  }

  // Export the rendered report area as PDF using jsPDF directly with structured content
  async exportReportAsPDF() {
    try {
      if (!this.currentReport || !this.currentEntries) {
        this.showToast('Gere um relatório primeiro antes de exportar', 'error');
        return;
      }

      this.showToast('Gerando PDF profissional do relatório...', 'info');

      // Create professional PDF for therapists
      const jspdfFactory = (window.jspdf && window.jspdf.jsPDF) ? window.jspdf.jsPDF : (typeof jsPDF !== 'undefined' ? jsPDF : null);
      if (!jspdfFactory) { this.showToast('Biblioteca de PDF não disponível', 'error'); return; }

      const pdf = new jspdfFactory('p', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 20;
      let yPosition = margin;

      // Helper function to add text with word wrapping
      const addWrappedText = (text, x, y, maxWidth, fontSize = 10) => {
        pdf.setFontSize(fontSize);
        const lines = pdf.splitTextToSize(text, maxWidth);
        for (let i = 0; i < lines.length; i++) {
          if (y > pageHeight - margin - 20) {
            pdf.addPage();
            y = margin;
          }
          pdf.text(lines[i], x, y);
          y += fontSize * 0.4;
        }
        return y;
      };

      // Header
      pdf.setFontSize(20);
      pdf.setTextColor(99, 102, 241); // Accent color
      pdf.text('Relatório de Bem-Estar Mental', margin, yPosition);
      yPosition += 15;

      pdf.setFontSize(12);
      pdf.setTextColor(100, 100, 100);
      pdf.text('MentalIA - Análise Personalizada para Profissionais de Saúde', margin, yPosition);
      yPosition += 10;

      // Date and stats
      const now = new Date();
      const dateStr = now.toLocaleDateString('pt-BR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
      pdf.setFontSize(10);
      pdf.setTextColor(0, 0, 0);
      pdf.text(`Gerado em: ${dateStr}`, margin, yPosition);
      yPosition += 8;

      // Stats summary
      const stats = await window.mentalStorage.getStats();
      if (stats) {
        pdf.text(`Total de registros: ${stats.totalEntries || 0}`, margin, yPosition);
        yPosition += 6;
        pdf.text(`Média de humor: ${stats.averageMood ? stats.averageMood.toFixed(1) : 'N/A'}`, margin, yPosition);
        yPosition += 6;
        pdf.text(`Sequência atual: ${stats.streak || 0} dias`, margin, yPosition);
        yPosition += 15;
      }

      // Analysis sections
      const sections = [
        { title: 'Avaliação Geral', content: this.currentReport.analysis || 'Análise não disponível.' },
        { title: 'Padrões Identificados', content: this.extractSection(this.currentReport.analysis, ['padrão', 'pattern']) },
        { title: 'Gatilhos Identificados', content: this.extractSection(this.currentReport.analysis, ['gatilh', 'trigger']) },
        { title: 'Recomendações', content: this.currentReport.recommendations ? this.currentReport.recommendations.join('\n• ') : 'Recomendações não disponíveis.' }
      ];

      for (const section of sections) {
        if (section.content && section.content.trim()) {
          // Section title
          pdf.setFontSize(14);
          pdf.setTextColor(99, 102, 241);
          pdf.text(section.title, margin, yPosition);
          yPosition += 10;

          // Section content
          pdf.setFontSize(10);
          pdf.setTextColor(0, 0, 0);
          yPosition = addWrappedText(section.content, margin, yPosition, pageWidth - (2 * margin));
          yPosition += 10;
        }
      }

      // Recent entries summary
      if (this.currentEntries && this.currentEntries.length > 0) {
        pdf.setFontSize(14);
        pdf.setTextColor(99, 102, 241);
        pdf.text('Registros Recentes', margin, yPosition);
        yPosition += 10;

        const recentEntries = this.currentEntries.slice(0, 10);
        pdf.setFontSize(9);
        pdf.setTextColor(0, 0, 0);

        for (const entry of recentEntries) {
          const date = new Date(entry.timestamp).toLocaleDateString('pt-BR');
          const mood = entry.mood.toFixed(1);
          const feelings = Array.isArray(entry.feelings) ?
            entry.feelings.map(f => typeof f === 'string' ? f : (f.label || f.value || '')).filter(Boolean).slice(0, 3).join(', ') :
            '';
          const diary = entry.diary ? entry.diary.substring(0, 50) + (entry.diary.length > 50 ? '...' : '') : '';

          const entryText = `${date}: Humor ${mood}${feelings ? ` - ${feelings}` : ''}${diary ? ` - "${diary}"` : ''}`;
          yPosition = addWrappedText(entryText, margin + 5, yPosition, pageWidth - (2 * margin) - 10);
          yPosition += 2;
        }
        yPosition += 10;
      }

      // Disclaimer
      pdf.setFontSize(8);
      pdf.setTextColor(150, 150, 150);
      const disclaimer = 'Este relatório foi gerado por IA e deve ser usado como ferramenta de apoio, não como diagnóstico médico profissional. Consulte sempre um especialista qualificado.';
      yPosition = addWrappedText(disclaimer, margin, yPosition, pageWidth - (2 * margin), 8);

      // Footer on all pages
      const pageCount = pdf.internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        pdf.setPage(i);
        pdf.setFontSize(8);
        pdf.setTextColor(150, 150, 150);
        pdf.text('MentalIA - Relatório confidencial para uso profissional', margin, pageHeight - 10);
        pdf.text(`Página ${i} de ${pageCount}`, pageWidth - 40, pageHeight - 10);
      }

      const filename = `Relatorio_MentalIA_Profissional_${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}.pdf`;
      pdf.save(filename);
      this.showToast('PDF profissional exportado com sucesso!', 'success');

    } catch (err) {
      console.error('Erro ao exportar PDF:', err);
      this.showToast('Erro ao exportar PDF profissional', 'error');
    }
  }

  // Share report using Web Share API with clipboard fallback
  async shareReport() {
    try {
      const title = document.querySelector('.report-card h3')?.textContent || 'Meu relatório do MentalIA';
      const contentEl = document.querySelector('.report-card .analysis-section') || document.getElementById('report-content');
      const text = title + '\n\n' + (contentEl ? contentEl.innerText.trim() : window.location.href);
      if (navigator.share) {
        await navigator.share({ title: 'Meu relatório do MentalIA', text, url: window.location.href });
        this.showToast('Relatório compartilhado!', 'success');
        return;
      }
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(text);
        this.showToast('Relatório copiado para a área de transferência!', 'success');
        return;
      }
      this.showToast('Compartilhar não suportado neste navegador', 'warning');
    } catch (err) {
      console.error('Erro no compartilhamento:', err);
      this.showToast('Erro ao compartilhar relatório', 'error');
    }
  }

  async backupData() { this.showToast('Backup (simulado)', 'info'); }

  showToast(msg, type='info', duration=3000) {
    const container = document.getElementById('toast-container');
    if (!container) return console.log(msg);
    const t = document.createElement('div'); t.className = `toast toast-${type}`; t.textContent = msg; container.appendChild(t); setTimeout(()=>t.classList.add('visible'),10); setTimeout(()=>{ t.classList.remove('visible'); setTimeout(()=>t.remove(),300); }, duration);
  }
}

// Avoid creating multiple global instances which can register duplicate event listeners
if (!window.mentalIA) window.mentalIA = new MentalIA();
document.addEventListener('DOMContentLoaded', async () => {
  try {
    // Initialize only if not already initialized (prevents double init when index.html also creates instance)
    if (!window.mentalIA.initialized) await window.mentalIA.init();
  } catch (e) {
    console.error('Erro init MentalIA:', e);
  }
});

console.log(' app.js fully replaced')

// Register service worker if available so the app is installable as a PWA
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then(reg => {
        console.log('[SW] Service worker registrado:', reg);
      })
      .catch(err => {
        console.warn('[SW] Falha ao registrar service worker:', err);
      });
  });
}
