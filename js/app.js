// MentalIA 3.1 - Main App JavaScript
// Complete rewrite with all fixes

console.log('🚀 MentalIA app.js carregado!');

class MentalIA {
    constructor() {
        this.currentScreen = 'welcome';
        this.currentMood = 3.0;
        this.selectedFeelings = new Set();
        // setupEventListeners() will be called in init() after DOM is ready
    }

    async init() {
        console.log('🧠 MentalIA 3.1 inicializando...');

        // Setup all event listeners AFTER DOM is ready
        this.setupEventListeners();

        // Initialize components
        this.initTheme();
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
        try {
            console.log('🔧 Configurando event listeners...');

        // Theme toggle
        const themeToggle = document.getElementById('theme-toggle');
        console.log('🎨 Theme toggle encontrado:', !!themeToggle);
        themeToggle?.addEventListener('click', () => this.toggleTheme());

        // All screen navigation buttons
        const screenBtns = document.querySelectorAll('[data-screen]');
        console.log('🧭 Botões de navegação encontrados:', screenBtns.length, screenBtns);
        screenBtns.forEach(btn => {
            console.log('🧭 Configurando event listener para botão:', btn.dataset.screen, btn);
            btn.addEventListener('click', (e) => {
                console.log('🧭 Botão clicado! Event:', e);
                console.log('🧭 Target:', e.currentTarget);
                console.log('🧭 Dataset screen:', e.currentTarget.dataset.screen);
                const screen = e.currentTarget.dataset.screen;
                console.log('🧭 Navegando para:', screen);
                this.showScreen(screen);
            });
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

        // AI mode toggle
        const modeLabels = document.querySelectorAll('.mode-label');
        console.log('🤖 Labels de modo AI encontrados:', modeLabels.length);
        modeLabels.forEach(label => {
            label.addEventListener('click', (e) => {
                console.log('🤖 Label clicado:', label);
                const forAttr = label.getAttribute('for');
                console.log('🤖 For attribute:', forAttr);
                const radio = document.getElementById(forAttr);
                if (radio) {
                    radio.checked = true;
                    console.log('🤖 Modo AI alterado para:', radio.value);
                }
            });
        });

        console.log('✅ Event listeners configurados');
        } catch (error) {
            console.error('❌ Erro ao configurar event listeners:', error);
        }
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
                const newValue = parseFloat(e.target.value);
                this.updateMoodValue(newValue);
            };

            this.handleSliderChange = (e) => {
                console.log('🎚️ Slider change:', e.target.value);
                const newValue = parseFloat(e.target.value);
                this.updateMoodValue(newValue);
            };

            // Touch events for mobile
            this.handleTouchStart = (e) => {
                console.log('🎚️ Touch start on slider');
                e.preventDefault(); // Prevent default touch behavior
            };

            this.handleTouchMove = (e) => {
                console.log('🎚️ Touch move on slider');
                e.preventDefault(); // Prevent scrolling while dragging
            };

            this.handleTouchEnd = (e) => {
                console.log('🎚️ Touch end on slider');
            };

            slider.addEventListener('input', this.handleSliderInput);
            slider.addEventListener('change', this.handleSliderChange);
            slider.addEventListener('touchstart', this.handleTouchStart, { passive: false });
            slider.addEventListener('touchmove', this.handleTouchMove, { passive: false });
            slider.addEventListener('touchend', this.handleTouchEnd, { passive: true });

            console.log('🎚️ Event listeners adicionados ao slider');

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
        }

        // Update color gradient (red to blue)
        const percentage = (this.currentMood - 1) / 4; // 0 to 1
        const red = Math.round(211 - (211 - 0) * percentage);   // #d32f2f to #00bcd4
        const green = Math.round(47 + (188 - 47) * percentage);
        const blue = Math.round(47 + (212 - 47) * percentage);
        const color = `rgb(${red}, ${green}, ${blue})`;

        // Apply color to slider thumb
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

        // Check if more than 5 feelings selected
        if (selected.length > 5) {
            alert('Você pode selecionar no máximo 5 sentimentos. Os extras foram removidos automaticamente.');
            
            // Keep only the first 5 checked items and uncheck the rest
            selected.forEach((cb, index) => {
                if (index >= 5) {
                    cb.checked = false;
                }
            });
            
            // Update selected to only include the first 5
            const limitedSelected = Array.from(selected).slice(0, 5);
            
            limitedSelected.forEach(cb => {
                this.selectedFeelings.add({
                    value: cb.value,
                    category: cb.dataset.category,
                    emoji: cb.parentElement.querySelector('.sub-emoji')?.textContent || '',
                    label: cb.parentElement.querySelector('.sub-label')?.textContent || ''
                });
            });
        } else {
            selected.forEach(cb => {
                this.selectedFeelings.add({
                    value: cb.value,
                    category: cb.dataset.category,
                    emoji: cb.parentElement.querySelector('.sub-emoji')?.textContent || '',
                    label: cb.parentElement.querySelector('.sub-label')?.textContent || ''
                });
            });
        }

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
            console.log('📊 Carregando dados do storage...');

            if (!window.mentalStorage) {
                console.error('❌ Storage não disponível');
                return;
            }

            const entries = await window.mentalStorage.getAllMoodEntries();
            const stats = await window.mentalStorage.getStats();

            console.log('📊 Dados carregados:', {
                entriesCount: entries?.length || 0,
                stats: stats
            });

            this.updateStats(stats);
            this.updateChart(entries);
            this.updateRecentEntries(entries);

            console.log('✅ Dados carregados e exibidos');
        } catch (error) {
            console.error('❌ Erro ao carregar dados:', error);
            this.showToast('Erro ao carregar dados: ' + error.message, 'error');
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

        // Destroy existing chart if it exists
        if (this.chart) {
            this.chart.destroy();
            this.chart = null;
        }

        const ctx = document.getElementById('mood-chart');
        console.log('📊 Canvas encontrado:', !!ctx);

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
                        label: 'Humor Diário',
                        data: [],
                        borderColor: '#6366f1',
                        backgroundColor: 'rgba(99, 102, 241, 0.1)',
                        borderWidth: 3,
                        pointBackgroundColor: '#6366f1',
                        pointBorderColor: '#ffffff',
                        pointBorderWidth: 2,
                        pointRadius: 6,
                        pointHoverRadius: 8,
                        tension: 0.4,
                        fill: true
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    interaction: {
                        intersect: false,
                        mode: 'index'
                    },
                    plugins: {
                        legend: { display: false },
                        tooltip: {
                            backgroundColor: 'rgba(0, 0, 0, 0.8)',
                            titleColor: '#ffffff',
                            bodyColor: '#ffffff',
                            callbacks: {
                                title: function(context) {
                                    return 'Data: ' + context[0].label;
                                },
                                label: function(context) {
                                    return 'Humor: ' + context.parsed.y + '/5';
                                }
                            }
                        }
                    },
                    scales: {
                        x: {
                            display: true,
                            title: {
                                display: true,
                                text: 'Data'
                            },
                            grid: {
                                display: false
                            }
                        },
                        y: {
                            beginAtZero: true,
                            max: 5,
                            ticks: {
                                stepSize: 1,
                                callback: function(value) {
                                    return value + '/5';
                                }
                            },
                            title: {
                                display: true,
                                text: 'Nível de Humor'
                            }
                        }
                    }
                },
                plugins: [{
                    id: 'emptyChart',
                    afterDraw: function(chart) {
                        if (chart.data.datasets[0].data.length === 0) {
                            const { ctx, chartArea: { left, top, right, bottom, width, height } } = chart;

                            // Draw demo line with sample points
                            ctx.save();
                            ctx.strokeStyle = 'rgba(99, 102, 241, 0.4)';
                            ctx.lineWidth = 3;
                            ctx.setLineDash([8, 4]);
                            
                            // Create a curved demo line
                            const points = [
                                { x: left + width * 0.1, y: top + height * 0.7 },
                                { x: left + width * 0.3, y: top + height * 0.5 },
                                { x: left + width * 0.5, y: top + height * 0.3 },
                                { x: left + width * 0.7, y: top + height * 0.4 },
                                { x: left + width * 0.9, y: top + height * 0.2 }
                            ];
                            
                            ctx.beginPath();
                            ctx.moveTo(points[0].x, points[0].y);
                            for (let i = 1; i < points.length; i++) {
                                const cp1x = points[i-1].x + (points[i].x - points[i-1].x) * 0.3;
                                const cp1y = points[i-1].y;
                                const cp2x = points[i].x - (points[i].x - points[i-1].x) * 0.3;
                                const cp2y = points[i].y;
                                ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, points[i].x, points[i].y);
                            }
                            ctx.stroke();
                            
                            // Draw sample points
                            ctx.fillStyle = 'rgba(99, 102, 241, 0.6)';
                            points.forEach(point => {
                                ctx.beginPath();
                                ctx.arc(point.x, point.y, 4, 0, 2 * Math.PI);
                                ctx.fill();
                            });
                            ctx.restore();

                            // Draw main placeholder text
                            ctx.save();
                            ctx.fillStyle = 'rgba(99, 102, 241, 0.8)';
                            ctx.font = 'bold 18px Arial, sans-serif';
                            ctx.textAlign = 'center';
                            ctx.textBaseline = 'middle';
                            ctx.fillText('📊 Registre seu primeiro humor', left + width / 2, top + height / 2 - 40);
                            
                            // Draw subtitle
                            ctx.fillStyle = 'rgba(107, 114, 128, 0.8)';
                            ctx.font = '14px Arial, sans-serif';
                            ctx.fillText('Seu gráfico de progresso emocional aparecerá aqui', left + width / 2, top + height / 2 - 15);
                            
                            // Draw call to action
                            ctx.fillStyle = 'rgba(99, 102, 241, 0.6)';
                            ctx.font = '12px Arial, sans-serif';
                            ctx.fillText('👆 Clique em "Humor" para começar', left + width / 2, top + height / 2 + 10);
                            ctx.restore();
                        }
                    }
                }]
            });

            console.log('✅ Gráfico inicializado com sucesso');
            return true;
        } catch (error) {
            console.error('❌ Erro ao inicializar gráfico:', error);
            return false;
        }
    }

    updateChart(entries) {
        console.log('📊 Atualizando gráfico com', entries?.length || 0, 'entradas');

        if (!this.chart) {
            console.warn('⚠️ Gráfico não inicializado, inicializando...');
            if (!this.initChart()) {
                console.error('❌ Falha ao inicializar gráfico');
                return;
            }
        }

        if (!entries || !Array.isArray(entries) || entries.length === 0) {
            console.log('📊 Nenhum dado para exibir no gráfico');
            this.chart.data.labels = [];
            this.chart.data.datasets[0].data = [];
            this.chart.update('none');
            return;
        }

        try {
            // Sort entries by date (oldest first for chart)
            const sortedEntries = entries.sort((a, b) =>
                new Date(a.timestamp) - new Date(b.timestamp)
            );

            // Take last 30 days or all if less
            const recentEntries = sortedEntries.slice(-30);

            // Create labels and data
            const labels = recentEntries.map(entry => {
                const date = new Date(entry.timestamp);
                return date.toLocaleDateString('pt-BR', {
                    month: 'short',
                    day: 'numeric'
                });
            });

            const data = recentEntries.map(entry => parseFloat(entry.mood) || 0);

            console.log('📊 Labels:', labels);
            console.log('📊 Data:', data);

            // Update chart data
            this.chart.data.labels = labels;
            this.chart.data.datasets[0].data = data;

            // Update chart
            this.chart.update();

            console.log('✅ Gráfico atualizado com sucesso');
        } catch (error) {
            console.error('❌ Erro ao atualizar gráfico:', error);
        }
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
    initNavigation() {
        console.log('🧭 Inicializando navegação...');
        // Navigation is already handled in setupEventListeners
        // This method ensures navigation is ready when app initializes
        console.log('✅ Navegação inicializada');
    }

    showScreen(screenName) {
        console.log('🧭 showScreen chamado com:', screenName);

        // Hide all screens
        document.querySelectorAll('.screen').forEach(screen => screen.classList.remove('active'));

        // Show target screen
        const target = document.getElementById(`${screenName}-screen`);
        console.log('🧭 Tela alvo encontrada:', !!target, `${screenName}-screen`);

        if (target) {
            target.classList.add('active');
            this.currentScreen = screenName;
            console.log('✅ Tela ativada:', screenName);

            // Initialize mood form when mood screen is shown
            if (screenName === 'mood') {
                console.log('🎭 Tela de humor mostrada, inicializando formulário...');
                // Use requestAnimationFrame to ensure DOM is fully rendered
                requestAnimationFrame(() => {
                    this.initMoodForm();
                });
            }
        } else {
            console.error('❌ Tela não encontrada:', `${screenName}-screen`);
        }

        // Update navigation
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.screen === screenName);
        });

        // Load screen data
        if (screenName === 'history') {
            console.log('📊 Carregando dados do histórico...');
            // Ensure chart is initialized before loading data
            if (!this.chart) {
                console.log('📊 Inicializando gráfico na navegação...');
                this.initChart();
            }
            // Load data after a short delay to ensure chart is ready
            setTimeout(() => this.loadData(), 100);
        }

        console.log('🧭 Navegação concluída para:', screenName);
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
        // Create toast container if it doesn't exist
        let container = document.getElementById('toast-container');
        if (!container) {
            container = document.createElement('div');
            container.id = 'toast-container';
            container.className = 'toast-container';
            document.body.appendChild(container);
        }

        // Create toast element
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;

        // Add icon based on type
        const iconMap = {
            success: '✅',
            error: '❌',
            warning: '⚠️',
            info: 'ℹ️'
        };

        toast.innerHTML = `
            <div class="toast-content">
                <span class="toast-icon">${iconMap[type] || iconMap.info}</span>
                <span class="toast-message">${message}</span>
                <button class="toast-close" onclick="this.parentElement.parentElement.remove()">×</button>
            </div>
        `;

        // Add to container
        container.appendChild(toast);

        // Trigger animation
        setTimeout(() => toast.classList.add('toast-show'), 10);

        // Auto remove after 4 seconds
        setTimeout(() => {
            toast.classList.remove('toast-show');
            setTimeout(() => {
                if (toast.parentElement) {
                    toast.remove();
                }
            }, 300); // Wait for fade out animation
        }, 4000);

        // Return toast element for manual control if needed
        return toast;
    }
}

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