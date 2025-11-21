// MentalIA 3.1 - Main App JavaScript
// Complete rewrite with all fixes

class MentalIA {
    constructor() {
        this.currentScreen = 'welcome';
        this.currentMood = 3.0;
        this.selectedFeelings = new Set();
        // setupEventListeners() will be called in init() after DOM is ready
    }

    async init() {
        console.log('🧠 MentalIA 3.1 inicializando...');

        // Check dependencies
        if (!window.mentalStorage) {
            console.error('Storage não carregado! Inclua storage.js antes de app.js');
            this.showToast('Erro interno: armazenamento não disponível', 'error');
            return;
        }

        // Setup all event listeners AFTER DOM is ready
        this.setupEventListeners();

        // Initialize components
        this.initTheme();
        this.initNavigation();
        this.initChart();
        this.initPWA();

        // Load data
        await this.loadData();

        // Show initial screen
        this.showScreen('welcome');

        console.log('✅ MentalIA 3.1 pronto!');
        this.showToast('MentalIA 3.1 carregado com sucesso! 🧠', 'success');
    }

    setupEventListeners() {
        console.log('🔧 Configurando event listeners...');

        // Theme toggle
        const themeToggle = document.getElementById('theme-toggle');
        console.log('🎨 Theme toggle encontrado:', !!themeToggle);
        themeToggle?.addEventListener('click', () => this.toggleTheme());

        // Navigation
        const navBtns = document.querySelectorAll('.nav-btn');
        console.log('🧭 Botões de navegação encontrados:', navBtns.length);
        navBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const screen = e.currentTarget.dataset.screen;
                console.log('🧭 Navegando para:', screen);
                this.showScreen(screen);
            });
        });

        // Welcome screen buttons
        const startBtn = document.querySelector('.btn-primary');
        console.log('🚀 Botão começar encontrado:', !!startBtn);
        startBtn?.addEventListener('click', () => {
            console.log('🚀 Botão começar clicado');
            this.showScreen('mood');
        });

        // Mood form submission
        const moodForm = document.getElementById('mood-form');
        console.log('📝 Formulário de humor encontrado:', !!moodForm);
        moodForm?.addEventListener('submit', (e) => this.handleMoodSubmit(e));

        // Report generation
        const reportBtn = document.getElementById('generate-report');
        console.log('📊 Botão relatório encontrado:', !!reportBtn);
        reportBtn?.addEventListener('click', () => {
            console.log('📊 Gerando relatório...');
            this.generateReport();
        });

        // Backup
        const backupBtn = document.getElementById('backup-data');
        console.log('💾 Botão backup encontrado:', !!backupBtn);
        backupBtn?.addEventListener('click', () => {
            console.log('💾 Fazendo backup...');
            this.backupData();
        });

        console.log('✅ Event listeners configurados');
    }

    // ===== MOOD SLIDER =====
    initMoodForm() {
        console.log('🎚️ Inicializando slider de humor...');

        // Setup mood slider with input listener and color gradient
        const slider = document.getElementById('mood-slider');
        console.log('🎚️ Slider encontrado:', !!slider, slider);

        if (slider) {
            // Force enable interaction
            slider.style.pointerEvents = 'auto';
            slider.style.cursor = 'pointer';
            slider.disabled = false;
            slider.style.opacity = '1'; // Make sure it's visible for debugging

            console.log('🎚️ Propriedades do slider:', {
                value: slider.value,
                min: slider.min,
                max: slider.max,
                step: slider.step,
                disabled: slider.disabled,
                style: {
                    pointerEvents: slider.style.pointerEvents,
                    cursor: slider.style.cursor,
                    opacity: slider.style.opacity
                }
            });

            // Remove existing listeners to avoid duplicates
            slider.removeEventListener('input', this.handleSliderInput);
            slider.removeEventListener('change', this.handleSliderChange);
            slider.removeEventListener('touchstart', this.handleTouchStart);
            slider.removeEventListener('touchmove', this.handleTouchMove);
            slider.removeEventListener('touchend', this.handleTouchEnd);

            // Add new listeners
            this.handleSliderInput = (e) => {
                console.log('🎚️ Slider input:', e.target.value);
                this.updateMoodValue(parseFloat(e.target.value));
            };

            this.handleSliderChange = (e) => {
                console.log('🎚️ Slider change:', e.target.value);
                this.updateMoodValue(parseFloat(e.target.value));
            };

            // Touch events for mobile
            this.handleTouchStart = (e) => {
                console.log('🎚️ Touch start');
            };

            this.handleTouchMove = (e) => {
                console.log('🎚️ Touch move');
            };

            this.handleTouchEnd = (e) => {
                console.log('🎚️ Touch end');
            };

            slider.addEventListener('input', this.handleSliderInput);
            slider.addEventListener('change', this.handleSliderChange);
            slider.addEventListener('touchstart', this.handleTouchStart, { passive: true });
            slider.addEventListener('touchmove', this.handleTouchMove, { passive: true });
            slider.addEventListener('touchend', this.handleTouchEnd, { passive: true });

            console.log('🎚️ Event listeners adicionados ao slider');

            // Força repaint do slider (resolve bug em alguns Androids)
            slider.style.display = 'none';
            slider.offsetHeight; // trigger reflow
            slider.style.display = 'block';

            // Set initial value
            this.updateMoodValue(3.0);
        } else {
            console.error('❌ Slider não encontrado!');
        }

        // Setup feelings wheel
        this.initFeelingsWheel();

        // Setup diary textarea
        this.initDiaryTextarea();
    }

    updateMoodValue(value) {
        console.log('🎨 Atualizando valor do humor:', value);
        this.currentMood = Math.max(1, Math.min(5, value));

        // Update slider
        const slider = document.getElementById('mood-slider');
        if (slider) {
            slider.value = this.currentMood;
            console.log('🎚️ Slider value set to:', this.currentMood);

            // Força repaint do slider (resolve bug em alguns Androids)
            slider.style.display = 'none';
            slider.offsetHeight; // trigger reflow
            slider.style.display = 'block';
        }

        // Update color gradient (red to blue)
        const percentage = (this.currentMood - 1) / 4; // 0 to 1
        const red = Math.round(211 - (211 - 0) * percentage);   // #d32f2f to #00bcd4
        const green = Math.round(47 + (188 - 47) * percentage);
        const blue = Math.round(47 + (212 - 47) * percentage);
        const color = `rgb(${red}, ${green}, ${blue})`;

        // Apply color to slider and indicators
        document.documentElement.style.setProperty('--current-mood-color', color);

        // Update display
        const emojiEl = document.getElementById('current-mood-emoji');
        const textEl = document.getElementById('current-mood-text');
        const valueEl = document.getElementById('current-mood-value');

        const moodData = this.getMoodData(this.currentMood);
        if (emojiEl) emojiEl.textContent = moodData.emoji;
        if (textEl) textEl.textContent = moodData.text;
        if (valueEl) valueEl.textContent = this.currentMood.toFixed(1);

        console.log('✅ Display atualizado:', moodData.emoji, moodData.text, this.currentMood.toFixed(1));
    }

    getMoodData(value) {
        if (value <= 1.5) return { emoji: '😢', text: 'Muito Baixo' };
        if (value <= 2.5) return { emoji: '😕', text: 'Baixo' };
        if (value <= 3.5) return { emoji: '😐', text: 'Neutro' };
        if (value <= 4.5) return { emoji: '😊', text: 'Alto' };
        return { emoji: '😄', text: 'Muito Alto' };
    }

    // ===== FEELINGS WHEEL =====
    initFeelingsWheel() {
        document.querySelectorAll('.primary-feeling-card').forEach(card => {
            const header = card.querySelector('.primary-feeling-btn');
            header?.addEventListener('click', () => this.toggleFeelingCategory(card));
        });

        document.querySelectorAll('.sub-feeling-item').forEach(item => {
            item.addEventListener('click', (e) => {
                const checkbox = item.querySelector('input[type="checkbox"]');
                if (checkbox) {
                    checkbox.checked = !checkbox.checked;
                    this.updateSelectedFeelings();
                }
            });
        });

        // Clear button
        const clearBtn = document.getElementById('clear-feelings');
        clearBtn?.addEventListener('click', () => this.clearAllFeelings());
    }

    toggleFeelingCategory(card) {
        const wasExpanded = card.classList.contains('expanded');
        const icon = card.querySelector('.expand-icon');

        // Close all other categories
        document.querySelectorAll('.primary-feeling-card').forEach(c => {
            c.classList.remove('expanded');
            const otherIcon = c.querySelector('.expand-icon');
            if (otherIcon) {
                otherIcon.textContent = '▼';
                otherIcon.style.transform = 'rotate(0deg)';
            }
        });

        // Toggle current category
        if (wasExpanded) {
            card.classList.remove('expanded');
            if (icon) {
                icon.textContent = '▼';
                icon.style.transform = 'rotate(0deg)';
            }
        } else {
            card.classList.add('expanded');
            if (icon) {
                icon.textContent = '▲';
                icon.style.transform = 'rotate(180deg)';
            }
        }
    }

    updateSelectedFeelings() {
        const selected = document.querySelectorAll('.sub-feeling-item input:checked');
        this.selectedFeelings.clear();

        selected.forEach(cb => {
            this.selectedFeelings.add({
                value: cb.value,
                category: cb.dataset.category,
                emoji: cb.parentElement.querySelector('.sub-emoji')?.textContent || '',
                label: cb.parentElement.querySelector('.sub-label')?.textContent || ''
            });
        });

        this.updateFeelingsDisplay();
    }

    updateFeelingsDisplay() {
        const container = document.querySelector('.selected-feelings-summary');
        const list = document.getElementById('selected-feelings-list');

        if (!container || !list) return;

        if (this.selectedFeelings.size > 0) {
            container.classList.add('has-selections');
            list.innerHTML = Array.from(this.selectedFeelings).map(feeling =>
                `<span class="selected-feeling-tag">${feeling.emoji} ${feeling.label}</span>`
            ).join('');
        } else {
            container.classList.remove('has-selections');
            list.innerHTML = '';
        }
    }

    clearAllFeelings() {
        document.querySelectorAll('.sub-feeling-item input').forEach(cb => cb.checked = false);
        this.selectedFeelings.clear();
        this.updateFeelingsDisplay();

        // Close all categories
        document.querySelectorAll('.primary-feeling-card').forEach(card => {
            card.classList.remove('expanded');
            const icon = card.querySelector('.expand-icon');
            if (icon) {
                icon.textContent = '▼';
                icon.style.transform = 'rotate(0deg)';
            }
        });
    }

    // ===== DIARY TEXTAREA =====
    initDiaryTextarea() {
        const textarea = document.getElementById('diary-entry');
        if (!textarea) return;

        // Character counter
        textarea.addEventListener('input', () => {
            this.updateCharCount(textarea.value.length);
            this.autoResizeTextarea(textarea);
        });

        // Initial setup
        this.updateCharCount(0);
        this.autoResizeTextarea(textarea);
    }

    updateCharCount(count) {
        let counter = document.querySelector('.char-count');
        if (!counter) {
            // Create counter if it doesn't exist
            const textarea = document.getElementById('diary-entry');
            if (textarea) {
                counter = document.createElement('div');
                counter.className = 'char-count';
                textarea.parentNode.appendChild(counter);
            }
        }

        if (counter) {
            counter.textContent = `${count} caracteres`;
        }
    }

    autoResizeTextarea(textarea) {
        textarea.style.height = 'auto';
        textarea.style.height = textarea.scrollHeight + 'px';
    }

    // ===== SAVE MOOD =====
    async handleMoodSubmit(e) {
        e.preventDefault();
        console.log('💾 Salvando registro...');

        try {
            // Validate data
            if (this.currentMood < 1 || this.currentMood > 5) {
                throw new Error('Humor inválido');
            }

            // Prepare data
            const moodData = {
                id: Date.now(),
                mood: Math.round(this.currentMood * 10) / 10,
                feelings: Array.from(this.selectedFeelings),
                diary: document.getElementById('diary-entry')?.value?.trim() || '',
                timestamp: new Date().toISOString(),
                version: '3.1'
            };

            // Save to encrypted storage
            if (window.mentalStorage) {
                await window.mentalStorage.saveMoodEntry(moodData);
                console.log('✅ Dados salvos criptografados');
            } else {
                throw new Error('Sistema de armazenamento não disponível');
            }

            // Success feedback
            this.showToast('Humor registrado com sucesso! 🎉', 'success');

            // Reset form and go to history
            this.resetMoodForm();
            setTimeout(() => this.showScreen('history'), 1000);

        } catch (error) {
            console.error('❌ Erro ao salvar:', error);
            this.showToast('Erro ao salvar: ' + error.message, 'error');
        }
    }

    resetMoodForm() {
        // Reset slider
        this.currentMood = 3.0;
        this.updateMoodValue(3.0);

        // Reset feelings
        this.clearAllFeelings();

        // Reset diary
        const textarea = document.getElementById('diary-entry');
        if (textarea) {
            textarea.value = '';
            this.updateCharCount(0);
            this.autoResizeTextarea(textarea);
        }
    }

    // ===== HISTORY =====
    async loadData() {
        try {
            if (window.mentalStorage) {
                const entries = await window.mentalStorage.getAllMoodEntries();
                const stats = await window.mentalStorage.getStats();

                this.updateStats(stats);
                this.updateChart(entries);
                this.updateRecentEntries(entries);
            }
        } catch (error) {
            console.error('Erro ao carregar dados:', error);
        }
    }

    updateStats(stats) {
        const elements = {
            'avg-mood': stats?.averageMood?.toFixed(1) || '0.0',
            'total-entries': stats?.totalEntries || 0,
            'streak-days': stats?.streak || 0
        };

        Object.entries(elements).forEach(([id, value]) => {
            const el = document.getElementById(id);
            if (el) el.textContent = value;
        });
    }

    initChart() {
        console.log('📊 Inicializando gráfico...');
        console.log('📊 Chart.js disponível:', typeof Chart);

        const ctx = document.getElementById('mood-chart');
        console.log('📊 Canvas encontrado:', !!ctx, ctx);

        if (!ctx) {
            console.error('❌ Canvas do gráfico não encontrado!');
            return;
        }

        if (typeof Chart === 'undefined') {
            console.error('❌ Chart.js não carregado!');
            return;
        }

        try {
            this.chart = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: [],
                    datasets: [{
                        label: 'Humor',
                        data: [],
                        borderColor: '#6366f1',
                        backgroundColor: 'rgba(99, 102, 241, 0.1)',
                        tension: 0.4,
                        fill: true
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { display: false } },
                    scales: {
                        y: { beginAtZero: true, max: 5 }
                    }
                }
            });
            console.log('✅ Gráfico inicializado com sucesso');
        } catch (error) {
            console.error('❌ Erro ao inicializar gráfico:', error);
        }
    }

    updateChart(entries) {
        if (!this.chart || !entries?.length) return;

        const recent = entries.slice(-14);
        const labels = recent.map(e => new Date(e.timestamp).toLocaleDateString('pt-BR', { month: 'short', day: 'numeric' }));
        const data = recent.map(e => e.mood);

        this.chart.data.labels = labels;
        this.chart.data.datasets[0].data = data;
        this.chart.update();
    }

    updateRecentEntries(entries) {
        const container = document.getElementById('recent-list');
        if (!container) return;

        if (!entries?.length) {
            container.innerHTML = '<p>Nenhum registro encontrado.</p>';
            return;
        }

        const recent = entries.slice(-5);
        container.innerHTML = recent.map(entry => `
            <div class="entry-item">
                <div class="entry-header">
                    <span class="entry-mood">${this.getMoodData(entry.mood).emoji} ${entry.mood}/5</span>
                    <span class="entry-date">${new Date(entry.timestamp).toLocaleDateString('pt-BR')}</span>
                </div>
                ${entry.diary ? `<div class="entry-text">${entry.diary.substring(0, 100)}${entry.diary.length > 100 ? '...' : ''}</div>` : ''}
            </div>
        `).join('');
    }

    // ===== REPORT =====
    async generateReport() {
        try {
            console.log('📊 Gerando relatório...');

            if (!window.aiAnalysis) {
                throw new Error('Sistema de IA não disponível');
            }

            const entries = await window.mentalStorage.getAllMoodEntries();
            if (!entries?.length) {
                throw new Error('Nenhum dado para analisar');
            }

            const report = await window.aiAnalysis.generateLocalReport(entries);
            this.displayReport(report);

            this.showToast('Relatório gerado! 📋', 'success');

        } catch (error) {
            console.error('Erro no relatório:', error);
            this.showToast('Erro: ' + error.message, 'error');
        }
    }

    displayReport(report) {
        const content = document.getElementById('report-content');
        if (content) {
            content.classList.remove('hidden');

            // Handle different report formats
            let htmlContent = '';
            if (typeof report === 'string') {
                htmlContent = `<div class="report-section"><div class="analysis-content">${report}</div></div>`;
            } else if (report.analysis) {
                htmlContent = `
                    <div class="report-section">
                        <h3>${report.title || 'Análise de Humor'}</h3>
                        <div class="analysis-content">${report.analysis}</div>
                        ${report.recommendations ? `<div class="recommendations"><h4>Recomendações:</h4><ul>${report.recommendations.map(r => `<li>${r}</li>`).join('')}</ul></div>` : ''}
                        ${report.disclaimer ? `<div class="disclaimer">${report.disclaimer}</div>` : ''}
                    </div>
                `;
            } else {
                htmlContent = `<div class="report-section"><div class="analysis-content">${JSON.stringify(report, null, 2)}</div></div>`;
            }

            content.innerHTML = htmlContent;
            console.log('📊 Relatório exibido:', report);
        } else {
            console.error('❌ Elemento report-content não encontrado');
        }
    }

    // ===== BACKUP =====
    async backupData() {
        if (window.googleDriveBackup) {
            await window.googleDriveBackup.handleBackupClick();
        } else {
            this.showToast('Sistema de backup não disponível', 'error');
        }
    }

    // ===== NAVIGATION & THEME =====
    showScreen(screenName) {
        // Hide all screens
        document.querySelectorAll('.screen').forEach(screen => screen.classList.remove('active'));

        // Show target screen
        const target = document.getElementById(`${screenName}-screen`);
        if (target) {
            target.classList.add('active');
            this.currentScreen = screenName;

            // Initialize mood form when mood screen is shown
            if (screenName === 'mood') {
                console.log('🎭 Tela de humor mostrada, inicializando formulário...');
                // Use requestAnimationFrame to ensure DOM is fully rendered
                requestAnimationFrame(() => {
                    this.initMoodForm();
                });
            }
        }

        // Update navigation
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.screen === screenName);
        });

        // Load screen data
        if (screenName === 'history') {
            this.loadData();
        }
    }

    initTheme() {
        const theme = localStorage.getItem('mental-ia-theme') || 'dark';
        this.setTheme(theme);
    }

    toggleTheme() {
        const current = document.documentElement.getAttribute('data-theme');
        const newTheme = current === 'dark' ? 'light' : 'dark';
        this.setTheme(newTheme);
    }

    setTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('mental-ia-theme', theme);

        const toggle = document.getElementById('theme-toggle');
        if (toggle) {
            toggle.querySelector('.theme-icon').textContent = theme === 'dark' ? '🌙' : '☀️';
        }
    }

    // ===== PWA =====
    initPWA() {
        // Register service worker
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('sw.js')
                .then(reg => console.log('✅ SW registrado:', reg.scope))
                .catch(err => console.error('❌ SW erro:', err));
        }
    }

    // ===== UTILITIES =====
    showToast(message, type = 'info') {
        const container = document.getElementById('toast-container') || document.body;
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.innerHTML = `<div class="toast-content">${message}</div>`;
        container.appendChild(toast);

        setTimeout(() => toast.remove(), 4000);
    }
}

// Initialize app
document.addEventListener('DOMContentLoaded', () => {
    window.mentalIA = new MentalIA();

    // ===== API CONFIGURATION FUNCTIONS =====
    // Função global para configurar API keys facilmente
    window.configureGoogleAPI = async (apiKey) => {
        if (!apiKey || typeof apiKey !== 'string' || apiKey.trim() === '') {
            console.error('❌ Erro: API key inválida');
            return false;
        }
        
        try {
            await window.mentalStorage.saveSetting('google-api-key', apiKey.trim());
            console.log('✅ API key do Google Cloud configurada com sucesso!');
            console.log('🔄 Recarregue a página para aplicar as mudanças.');
            return true;
        } catch (error) {
            console.error('❌ Erro ao salvar API key:', error);
            return false;
        }
    };

    window.configureClaudeAPI = async (apiKey) => {
        if (!apiKey || typeof apiKey !== 'string' || apiKey.trim() === '') {
            console.error('❌ Erro: API key inválida');
            return false;
        }
        
        try {
            await window.mentalStorage.saveSetting('claude-api-key', apiKey.trim());
            console.log('✅ API key do Claude configurada com sucesso!');
            console.log('🔄 Recarregue a página para aplicar as mudanças.');
            return true;
        } catch (error) {
            console.error('❌ Erro ao salvar API key:', error);
            return false;
        }
    };

    window.configureGeminiAPI = async (apiKey) => {
        if (!apiKey || typeof apiKey !== 'string' || apiKey.trim() === '') {
            console.error('❌ Erro: API key inválida');
            return false;
        }
        
        try {
            await window.mentalStorage.saveSetting('gemini-api-key', apiKey.trim());
            console.log('✅ API key do Gemini configurada com sucesso!');
            console.log('🔄 Recarregue a página para aplicar as mudanças.');
            return true;
        } catch (error) {
            console.error('❌ Erro ao salvar API key:', error);
            return false;
        }
    };

    // Função para verificar APIs configuradas
    window.checkAPIs = async () => {
        try {
            const googleKey = await window.mentalStorage.getSetting('google-api-key');
            const claudeKey = await window.mentalStorage.getSetting('claude-api-key');
            const geminiKey = await window.mentalStorage.getSetting('gemini-api-key');
            
            console.log('🔍 Status das APIs:');
            console.log('🌐 Google Cloud API:', googleKey ? '✅ Configurada' : '❌ Não configurada');
            console.log('🤖 Claude API:', claudeKey ? '✅ Configurada' : '❌ Não configurada');
            console.log('🤖 Gemini API:', geminiKey ? '✅ Configurada' : '❌ Não configurada');
            
            return {
                google: !!googleKey,
                claude: !!claudeKey,
                gemini: !!geminiKey
            };
        } catch (error) {
            console.error('❌ Erro ao verificar APIs:', error);
            return null;
        }
    };

    // Debug function for testing slider
    window.testSlider = () => {
        console.log('🧪 Testando slider...');
        const slider = document.getElementById('mood-slider');
        if (slider) {
            console.log('🎚️ Slider encontrado:', slider);
            console.log('🎚️ Valor atual:', slider.value);
            console.log('🎚️ Disabled:', slider.disabled);
            console.log('🎚️ Pointer events:', slider.style.pointerEvents);
            console.log('🎚️ Cursor:', slider.style.cursor);

            // Test setting value programmatically
            slider.value = 4.0;
            window.mentalIA.updateMoodValue(4.0);
            console.log('✅ Teste concluído - valor definido para 4.0');
        } else {
            console.error('❌ Slider não encontrado');
        }
    };

    // Add test button to mood screen
    const moodScreen = document.getElementById('mood-screen');
    if (moodScreen) {
        const testBtn = document.createElement('button');
        testBtn.textContent = '🧪 Testar Funcionalidades';
        testBtn.style.cssText = 'position: fixed; top: 10px; right: 10px; z-index: 9999; padding: 10px; background: red; color: white; border: none; border-radius: 5px; cursor: pointer;';
        testBtn.onclick = () => {
            console.log('🧪 Teste: Iniciando testes...');
            
            // Test slider
            const slider = document.getElementById('mood-slider');
            if (slider) {
                console.log('🎚️ Slider test:', {
                    value: slider.value,
                    visible: slider.offsetWidth > 0,
                    events: slider.style.pointerEvents
                });
                // Test setting value
                slider.value = 4.0;
                window.mentalIA.updateMoodValue(4.0);
            }
            
            // Test chart
            if (window.mentalIA.chart) {
                console.log('📊 Chart test: OK');
            } else {
                console.log('📊 Chart test: FAIL - chart not initialized');
            }
            
            // Test feelings text
            const feelings = document.querySelectorAll('.sub-label');
            console.log('😊 Feelings test:', feelings.length, 'items found');
            if (feelings.length > 0) {
                console.log('😊 First feeling font-size:', getComputedStyle(feelings[0]).fontSize);
            }
            
            alert('Testes concluídos! Verifique o console (F12) para detalhes.');
        };
        moodScreen.appendChild(testBtn);
    }
});