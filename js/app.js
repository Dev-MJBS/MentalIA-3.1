// MentalIA 3.0 - Main App JavaScript
// Navigation, Theme Management, and PWA Initialization

class MentalIA {
    constructor() {
        this.currentScreen = 'welcome';
        this.init();
    }

    async init() {
        console.log('🧠 MentalIA 3.0 inicializando...');
        
        // Initialize components
        this.setupEventListeners();
        this.initTheme();
        this.initNavigation();
        this.initMoodForm();
        this.initChart();
        this.initReportGeneration();
        
        // Verificar integridade dos sistemas críticos
        this.verifySystemIntegrity();
        
        // Initialize PWA features
        this.initPWA();
        this.initNotifications();
        
        // Load data and update UI
        await this.loadData();
        
        console.log('✅ MentalIA 3.0 pronto!');
        this.showToast('Bem-vindo ao MentalIA 3.0! 🧠', 'success');
    }

    setupEventListeners() {
        // Theme toggle
        const themeToggle = document.getElementById('theme-toggle');
        themeToggle?.addEventListener('click', () => this.toggleTheme());

        // Navigation buttons
        const navButtons = document.querySelectorAll('.nav-btn');
        navButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const screen = e.currentTarget.getAttribute('data-screen');
                this.showScreen(screen);
            });
        });

        // Mood form
        const moodForm = document.getElementById('mood-form');
        moodForm?.addEventListener('submit', (e) => this.handleMoodSubmit(e));

        // Mood slider
        const moodSlider = document.getElementById('mood-slider');
        moodSlider?.addEventListener('input', (e) => this.updateMoodValue(e.target.value));

        // Feelings wheel initialization
        this.initFeelingsWheel();

        // Diary character count
        const diaryEntry = document.getElementById('diary-entry');
        diaryEntry?.addEventListener('input', (e) => this.updateCharCount(e.target.value.length));

        // Report generation
        const generateReportBtn = document.getElementById('generate-report');
        generateReportBtn?.addEventListener('click', () => this.generateReport());

        // Backup and restore buttons
        // Backup button is handled by GoogleDriveBackup class
        const restoreBtn = document.getElementById('restore-data');
        restoreBtn?.addEventListener('click', () => this.restoreData());

        // Mode switch
        const modeInputs = document.querySelectorAll('input[name="ai-mode"]');
        modeInputs.forEach(input => {
            input.addEventListener('change', (e) => this.setAIMode(e.target.value));
        });
    }

    initTheme() {
        // Get saved theme or default to dark
        const savedTheme = localStorage.getItem('mental-ia-theme') || 'dark';
        this.setTheme(savedTheme);
    }

    toggleTheme() {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        this.setTheme(newTheme);
    }

    setTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('mental-ia-theme', theme);
        
        const themeToggle = document.getElementById('theme-toggle');
        const themeIcon = themeToggle?.querySelector('.theme-icon');
        
        if (themeIcon) {
            themeIcon.textContent = theme === 'dark' ? '🌙' : '☀️';
        }
        
        console.log(`🎨 Tema alterado para: ${theme}`);
    }

    initNavigation() {
        // Set initial screen
        this.showScreen('welcome');
    }

    showScreen(screenName) {
        // Hide all screens
        const screens = document.querySelectorAll('.screen');
        screens.forEach(screen => screen.classList.remove('active'));

        // Show target screen
        const targetScreen = document.getElementById(`${screenName}-screen`);
        if (targetScreen) {
            targetScreen.classList.add('active');
            this.currentScreen = screenName;
        }

        // Update navigation
        const navButtons = document.querySelectorAll('.nav-btn');
        navButtons.forEach(btn => {
            btn.classList.remove('active');
            if (btn.getAttribute('data-screen') === screenName) {
                btn.classList.add('active');
            }
        });

        // Load screen-specific data
        this.onScreenChange(screenName);

        console.log(`📱 Tela alterada para: ${screenName}`);
    }

    async onScreenChange(screenName) {
        switch (screenName) {
            case 'history':
                await this.loadHistoryData();
                break;
            case 'report':
                this.updateReportMode();
                break;
        }
    }

    initMoodForm() {
        this.selectedFeelings = new Set();
        this.currentMood = 3.0;
        
        // Initialize mood slider
        this.initMoodSlider();
        
        // Initialize mood value display
        this.updateMoodValue(3.0);
    }

    initMoodSlider() {
        const slider = document.getElementById('mood-slider');
        const thumb = document.getElementById('slider-thumb');
        
        if (!slider || !thumb) return;
        
        // Mood colors for gradient interpolation
        this.moodColors = [
            { r: 211, g: 47, b: 47 },   // #d32f2f - Muito Baixo
            { r: 244, g: 67, b: 54 },   // #f44336 - Baixo
            { r: 255, g: 152, b: 0 },   // #ff9800 - Neutro
            { r: 76, g: 175, b: 80 },   // #4caf50 - Alto
            { r: 0, g: 188, b: 212 }    // #00bcd4 - Muito Alto
        ];
        
        // Touch and mouse event handlers
        let isDragging = false;
        let startX = 0;
        let currentX = 0;
        
        // Mouse events
        thumb.addEventListener('mousedown', this.startDrag.bind(this));
        document.addEventListener('mousemove', this.onDrag.bind(this));
        document.addEventListener('mouseup', this.endDrag.bind(this));
        
        // Touch events
        thumb.addEventListener('touchstart', this.startDrag.bind(this), { passive: true });
        document.addEventListener('touchmove', this.onDrag.bind(this), { passive: false });
        document.addEventListener('touchend', this.endDrag.bind(this));
        
        // Click on track to jump
        const track = document.querySelector('.slider-track');
        track?.addEventListener('click', this.onTrackClick.bind(this));
        
        // Update position on slider input change
        slider.addEventListener('input', (e) => {
            this.updateMoodValue(parseFloat(e.target.value));
        });
    }

    startDrag(e) {
        this.isDragging = true;
        this.startX = e.type === 'mousedown' ? e.clientX : e.touches[0].clientX;
        
        const thumb = document.getElementById('slider-thumb');
        if (thumb) {
            thumb.style.transition = 'none';
        }
        
        e.preventDefault();
    }

    onDrag(e) {
        if (!this.isDragging) return;
        
        e.preventDefault();
        
        const currentX = e.type === 'mousemove' ? e.clientX : e.touches[0].clientX;
        const track = document.querySelector('.slider-track');
        
        if (!track) return;
        
        const trackRect = track.getBoundingClientRect();
        const trackWidth = trackRect.width;
        const relativeX = Math.max(0, Math.min(trackWidth, currentX - trackRect.left));
        const percentage = relativeX / trackWidth;
        const value = 1 + (percentage * 4); // Scale to 1-5 range
        
        this.updateMoodValue(value);
    }

    endDrag() {
        if (!this.isDragging) return;
        
        this.isDragging = false;
        
        const thumb = document.getElementById('slider-thumb');
        if (thumb) {
            thumb.style.transition = 'all 0.3s ease-out';
        }
    }

    onTrackClick(e) {
        if (this.isDragging) return;
        
        const track = e.currentTarget;
        const trackRect = track.getBoundingClientRect();
        const relativeX = e.clientX - trackRect.left;
        const percentage = Math.max(0, Math.min(1, relativeX / trackRect.width));
        const value = 1 + (percentage * 4);
        
        this.updateMoodValue(value);
    }

    updateMoodValue(value) {
        this.currentMood = Math.max(1, Math.min(5, parseFloat(value)));
        
        // Update slider input
        const slider = document.getElementById('mood-slider');
        if (slider) {
            slider.value = this.currentMood;
        }
        
        // Update thumb position and color
        this.updateThumbPosition();
        this.updateThumbColor();
        
        // Update current mood display
        this.updateCurrentMoodDisplay();
        
        // Update mood indicators
        this.updateMoodIndicators();
    }

    updateThumbPosition() {
        const thumb = document.getElementById('slider-thumb');
        if (!thumb) return;
        
        const percentage = (this.currentMood - 1) / 4; // Convert 1-5 to 0-1
        const leftPosition = percentage * 100;
        
        thumb.style.left = `${leftPosition}%`;
    }

    updateThumbColor() {
        const thumb = document.getElementById('slider-thumb');
        if (!thumb) return;
        
        const color = this.interpolateColor(this.currentMood);
        thumb.style.backgroundColor = color;
        
        // Aplicar variável CSS para compatibilidade com todos os estilos
        document.documentElement.style.setProperty('--current-mood-color', color);
    }

    interpolateColor(value) {
        // Clamp value between 1 and 5
        value = Math.max(1, Math.min(5, value));
        
        // Convert to 0-4 range for array indexing
        const scaledValue = value - 1;
        const index = Math.floor(scaledValue);
        const fraction = scaledValue - index;
        
        // Handle edge cases
        if (index >= this.moodColors.length - 1) {
            const color = this.moodColors[this.moodColors.length - 1];
            return `rgb(${color.r}, ${color.g}, ${color.b})`;
        }
        
        // Interpolate between two colors
        const color1 = this.moodColors[index];
        const color2 = this.moodColors[index + 1];
        
        const r = Math.round(color1.r + (color2.r - color1.r) * fraction);
        const g = Math.round(color1.g + (color2.g - color1.g) * fraction);
        const b = Math.round(color1.b + (color2.b - color1.b) * fraction);
        
        return `rgb(${r}, ${g}, ${b})`;
    }

    updateCurrentMoodDisplay() {
        const emojiEl = document.getElementById('current-mood-emoji');
        const textEl = document.getElementById('current-mood-text');
        const valueEl = document.getElementById('current-mood-value');
        
        const moodData = this.getMoodData(this.currentMood);
        
        if (emojiEl) emojiEl.textContent = moodData.emoji;
        if (textEl) textEl.textContent = moodData.text;
        if (valueEl) valueEl.textContent = this.currentMood.toFixed(1);
    }

    updateMoodIndicators() {
        const indicators = document.querySelectorAll('.mood-indicator');
        indicators.forEach(indicator => {
            const value = parseInt(indicator.getAttribute('data-value'));
            const diff = Math.abs(value - this.currentMood);
            
            if (diff <= 0.5) {
                indicator.classList.add('active');
            } else {
                indicator.classList.remove('active');
            }
        });
    }

    getMoodData(value) {
        if (value <= 1.5) {
            return { emoji: '😢', text: 'Muito Baixo' };
        } else if (value <= 2.5) {
            return { emoji: '😕', text: 'Baixo' };
        } else if (value <= 3.5) {
            return { emoji: '😐', text: 'Neutro' };
        } else if (value <= 4.5) {
            return { emoji: '😊', text: 'Alto' };
        } else {
            return { emoji: '😄', text: 'Muito Alto' };
        }
    }

    initFeelingsWheel() {
        // Primary feelings accordion
        const primaryCards = document.querySelectorAll('.primary-feeling-card');
        primaryCards.forEach(card => {
            const btn = card.querySelector('.primary-feeling-btn');
            btn.addEventListener('click', () => this.togglePrimaryFeeling(card));
        });

        // Sub-feelings checkboxes
        const subFeelingItems = document.querySelectorAll('.sub-feeling-item');
        subFeelingItems.forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                const checkbox = item.querySelector('input[type="checkbox"]');
                checkbox.checked = !checkbox.checked;
                this.updateSelectedFeelings();
            });
        });

        // Clear selection button
        const clearBtn = document.getElementById('clear-feelings');
        clearBtn?.addEventListener('click', () => this.clearAllFeelings());
    }

    togglePrimaryFeeling(card) {
        const isExpanded = card.classList.contains('expanded');
        
        // Close all other cards
        document.querySelectorAll('.primary-feeling-card').forEach(c => {
            if (c !== card) {
                c.classList.remove('expanded');
            }
        });
        
        // Toggle current card
        card.classList.toggle('expanded', !isExpanded);
    }

    updateSelectedFeelings() {
        const selectedCheckboxes = document.querySelectorAll('.sub-feeling-item input[type="checkbox"]:checked');
        const selectedFeelings = Array.from(selectedCheckboxes).map(cb => ({
            value: cb.value,
            category: cb.getAttribute('data-category'),
            emoji: cb.parentElement.querySelector('.sub-emoji').textContent,
            label: cb.parentElement.querySelector('.sub-label').textContent
        }));

        // Update the Set for compatibility
        this.selectedFeelings.clear();
        selectedFeelings.forEach(feeling => {
            this.selectedFeelings.add(feeling.value);
        });

        // Update UI
        this.updateSelectedFeelingsDisplay(selectedFeelings);
    }

    updateSelectedFeelingsDisplay(selectedFeelings) {
        const summaryDiv = document.querySelector('.selected-feelings-summary');
        const listDiv = document.getElementById('selected-feelings-list');
        
        if (selectedFeelings.length > 0) {
            summaryDiv.classList.add('has-selections');
            
            listDiv.innerHTML = selectedFeelings.map(feeling => `
                <span class="selected-feeling-tag">
                    <span>${feeling.emoji}</span>
                    <span>${feeling.label}</span>
                </span>
            `).join('');
        } else {
            summaryDiv.classList.remove('has-selections');
            listDiv.innerHTML = '';
        }
    }

    clearAllFeelings() {
        // Uncheck all checkboxes
        const checkboxes = document.querySelectorAll('.sub-feeling-item input[type="checkbox"]');
        checkboxes.forEach(cb => cb.checked = false);
        
        // Update display
        this.selectedFeelings.clear();
        this.updateSelectedFeelings();
        
        // Close all expanded panels
        document.querySelectorAll('.primary-feeling-card').forEach(card => {
            card.classList.remove('expanded');
        });
    }

    updateCharCount(count) {
        const charCountDisplay = document.getElementById('char-count');
        if (charCountDisplay) {
            charCountDisplay.textContent = `${count} caracteres`;
        }
    }

    async handleMoodSubmit(e) {
        e.preventDefault();
        
        // Show loading for better UX
        this.showLoading('Salvando registro...', 'Criptografando dados localmente...');
        
        try {
            const diaryEntry = document.getElementById('diary-entry')?.value || '';
            
            // Validate mood value
            if (this.currentMood < 1 || this.currentMood > 5) {
                throw new Error('Valor de humor inválido');
            }
            
            // Create mood entry with enhanced metadata
            const moodData = {
                mood: Math.round(this.currentMood * 10) / 10, // Round to 1 decimal
                feelings: Array.from(this.selectedFeelings),
                diary: diaryEntry.trim(),
                timestamp: new Date().toISOString(),
                date: new Date().toDateString(),
                deviceFingerprint: this.generateDeviceFingerprint(),
                version: '3.0',
                moodColor: this.interpolateColor(this.currentMood)
            };

            // Validate required data
            if (!moodData.mood) {
                throw new Error('Selecione um nível de humor');
            }

            // Check entry limits for free users
            if (!this.checkEntryLimit()) {
                this.hideLoading();
                return;
            }

            // Save to encrypted storage
            await window.mentalStorage.saveMoodEntry(moodData);
            
            // Hide loading
            this.hideLoading();
            
            // Success feedback
            this.showToast('Humor registrado com sucesso! 🎉', 'success');
            
            // Show success animation
            this.showSuccessAnimation();
            
            // Reset form after delay
            setTimeout(() => {
                this.resetMoodForm();
            }, 500);
            
            // Navigate to history screen
            setTimeout(() => {
                this.showScreen('history');
            }, 1500);
            
        } catch (error) {
            console.error('Erro ao salvar humor:', error);
            this.hideLoading();
            
            // User-friendly error messages
            let errorMessage = 'Erro ao salvar registro. Tente novamente.';
            if (error.message.includes('humor inválido')) {
                errorMessage = 'Por favor, selecione um nível de humor válido.';
            } else if (error.message.includes('storage')) {
                errorMessage = 'Erro no armazenamento local. Verifique se há espaço disponível.';
            }
            
            this.showToast(errorMessage, 'error');
        }
    }

    generateDeviceFingerprint() {
        // Generate a simple device fingerprint for data integrity
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        ctx.textBaseline = 'top';
        ctx.font = '14px Arial';
        ctx.fillText('Device fingerprint', 2, 2);
        
        return {
            screen: `${screen.width}x${screen.height}`,
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            language: navigator.language,
            platform: navigator.platform,
            canvasFingerprint: canvas.toDataURL().slice(-50), // Last 50 chars
            timestamp: Date.now()
        };
    }

    showSuccessAnimation() {
        // Create success animation
        const continueBtn = document.querySelector('.mood-continue-btn');
        if (continueBtn) {
            continueBtn.style.transform = 'scale(0.95)';
            continueBtn.style.backgroundColor = 'var(--success)';
            
            setTimeout(() => {
                continueBtn.style.transform = 'scale(1.05)';
                setTimeout(() => {
                    continueBtn.style.transform = 'scale(1)';
                    continueBtn.style.backgroundColor = '';
                }, 200);
            }, 100);
        }
        
        // Animate current mood display
        const currentMood = document.querySelector('.current-mood');
        if (currentMood) {
            currentMood.style.transform = 'scale(1.05)';
            currentMood.style.boxShadow = '0 8px 25px rgba(16, 185, 129, 0.3)';
            
            setTimeout(() => {
                currentMood.style.transform = 'scale(1)';
                currentMood.style.boxShadow = '';
            }, 600);
        }
    }

    resetMoodForm() {
        // Reset slider with smooth animation
        const moodSlider = document.getElementById('mood-slider');
        const thumb = document.getElementById('slider-thumb');
        
        if (moodSlider && thumb) {
            // Smooth transition back to center
            thumb.style.transition = 'all 0.5s ease-out';
            this.updateMoodValue(3.0);
        }

        // Reset feelings
        this.clearAllFeelings();

        // Reset diary
        const diaryEntry = document.getElementById('diary-entry');
        if (diaryEntry) {
            diaryEntry.value = '';
            this.updateCharCount(0);
        }

        // Reset continue button
        const continueBtn = document.querySelector('.mood-continue-btn');
        if (continueBtn) {
            continueBtn.style.transform = '';
            continueBtn.style.backgroundColor = '';
        }

        console.log('📝 Formulário de humor resetado');
    }

    async loadData() {
        try {
            await this.loadHistoryData();
        } catch (error) {
            console.error('Erro ao carregar dados:', error);
        }
    }

    async loadHistoryData() {
        try {
            const entries = await window.mentalStorage.getAllMoodEntries();
            
            // Update stats
            this.updateStats(entries);
            
            // Update chart
            this.updateChart(entries);
            
            // Update recent entries
            this.updateRecentEntries(entries);
            
        } catch (error) {
            console.error('Erro ao carregar histórico:', error);
        }
    }

    updateStats(entries) {
        const avgMoodEl = document.getElementById('avg-mood');
        const totalEntriesEl = document.getElementById('total-entries');
        const streakDaysEl = document.getElementById('streak-days');

        if (entries.length === 0) {
            if (avgMoodEl) avgMoodEl.textContent = '0';
            if (totalEntriesEl) totalEntriesEl.textContent = '0';
            if (streakDaysEl) streakDaysEl.textContent = '0';
            return;
        }

        // Calculate average mood
        const avgMood = entries.reduce((sum, entry) => sum + entry.mood, 0) / entries.length;
        if (avgMoodEl) avgMoodEl.textContent = avgMood.toFixed(1);

        // Total entries
        if (totalEntriesEl) totalEntriesEl.textContent = entries.length.toString();

        // Calculate streak (simplified)
        const streak = this.calculateStreak(entries);
        if (streakDaysEl) streakDaysEl.textContent = streak.toString();
    }

    calculateStreak(entries) {
        if (entries.length === 0) return 0;
        
        // Sort entries by date (newest first)
        const sortedEntries = entries.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        
        let streak = 0;
        let currentDate = new Date();
        
        for (const entry of sortedEntries) {
            const entryDate = new Date(entry.timestamp);
            const daysDiff = Math.floor((currentDate - entryDate) / (1000 * 60 * 60 * 24));
            
            if (daysDiff === streak) {
                streak++;
                currentDate = entryDate;
            } else {
                break;
            }
        }
        
        return streak;
    }

    initChart() {
        const ctx = document.getElementById('mood-chart');
        if (!ctx) return;

        this.chart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: [],
                datasets: [{
                    label: 'Humor',
                    data: [],
                    borderColor: '#6366f1',
                    backgroundColor: 'rgba(99, 102, 241, 0.1)',
                    borderWidth: 3,
                    fill: true,
                    tension: 0.4,
                    pointBackgroundColor: '#6366f1',
                    pointBorderColor: '#ffffff',
                    pointBorderWidth: 2,
                    pointRadius: 6
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 5,
                        ticks: {
                            stepSize: 1,
                            callback: function(value) {
                                const moods = ['', '😢', '😕', '😐', '😊', '😄'];
                                return moods[value] || value;
                            }
                        },
                        grid: {
                            color: 'rgba(255, 255, 255, 0.1)'
                        }
                    },
                    x: {
                        grid: {
                            color: 'rgba(255, 255, 255, 0.1)'
                        }
                    }
                },
                elements: {
                    point: {
                        hoverRadius: 8
                    }
                }
            }
        });
    }

    updateChart(entries) {
        if (!this.chart || entries.length === 0) return;

        // Sort entries by date
        const sortedEntries = entries.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
        
        // Get last 14 days or all entries if less
        const recentEntries = sortedEntries.slice(-14);
        
        const labels = recentEntries.map(entry => {
            const date = new Date(entry.timestamp);
            return date.toLocaleDateString('pt-BR', { month: 'short', day: 'numeric' });
        });
        
        const data = recentEntries.map(entry => entry.mood);

        this.chart.data.labels = labels;
        this.chart.data.datasets[0].data = data;
        this.chart.update();
    }

    updateRecentEntries(entries) {
        const recentList = document.getElementById('recent-list');
        if (!recentList) return;

        if (entries.length === 0) {
            recentList.innerHTML = '<p class="text-muted">Nenhum registro encontrado. Comece registrando seu humor!</p>';
            return;
        }

        // Sort by date (newest first) and take top 5
        const recentEntries = entries
            .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
            .slice(0, 5);

        recentList.innerHTML = recentEntries.map(entry => {
            const date = new Date(entry.timestamp);
            const formattedDate = date.toLocaleDateString('pt-BR', {
                day: 'numeric',
                month: 'short',
                hour: '2-digit',
                minute: '2-digit'
            });

            const moodEmoji = ['', '😢', '😕', '😐', '😊', '😄'][entry.mood] || '😐';
            
            const feelingsHtml = entry.feelings?.map(feeling => 
                `<span class="entry-feeling">${this.getFeelingEmoji(feeling)} ${feeling}</span>`
            ).join('') || '';

            const diaryPreview = entry.diary ? 
                entry.diary.length > 100 ? 
                    entry.diary.substring(0, 100) + '...' : 
                    entry.diary 
                : '';

            return `
                <div class="entry-item">
                    <div class="entry-header">
                        <span class="entry-mood">${moodEmoji} ${entry.mood}/5</span>
                        <span class="entry-date">${formattedDate}</span>
                    </div>
                    ${feelingsHtml ? `<div class="entry-feelings">${feelingsHtml}</div>` : ''}
                    ${diaryPreview ? `<div class="entry-text">${diaryPreview}</div>` : ''}
                </div>
            `;
        }).join('');
    }

    getFeelingEmoji(feeling) {
        const emojis = {
            'ansioso': '😰',
            'feliz': '😊',
            'triste': '😢',
            'estressado': '😤',
            'calmo': '😌',
            'motivado': '💪',
            'cansado': '😴',
            'irritado': '😠'
        };
        return emojis[feeling] || '😐';
    }

    initReportGeneration() {
        this.aiMode = 'private'; // Default to private mode (mais confiável)
        console.log('📊 [REPORT DEBUG] Modo padrão definido como:', this.aiMode);
    }

    verifySystemIntegrity() {
        console.log('🔍 [SYSTEM CHECK] Verificando integridade dos sistemas...');
        
        // Check storage
        const storageOk = !!window.mentalStorage;
        console.log('🔍 [SYSTEM CHECK] Storage:', storageOk ? '✅ OK' : '❌ FALHA');
        
        // Check AI Analysis
        const aiExists = !!window.aiAnalysis;
        const aiMethodsOk = aiExists && 
            typeof window.aiAnalysis.generateLocalReport === 'function' &&
            typeof window.aiAnalysis.generateFastReport === 'function';
        
        console.log('🔍 [SYSTEM CHECK] AI Analysis:', aiExists ? '✅ Existe' : '❌ Não existe');
        console.log('🔍 [SYSTEM CHECK] AI Methods:', aiMethodsOk ? '✅ OK' : '❌ FALHA');
        
        // Check backup
        const backupOk = !!window.googleDriveBackup;
        console.log('🔍 [SYSTEM CHECK] Backup:', backupOk ? '✅ OK' : '❌ FALHA');
        
        // Force fix AI if broken
        if (!aiExists || !aiMethodsOk) {
            console.log('🔧 [SYSTEM CHECK] Corrigindo sistema de IA...');
            this.fixAISystem();
        }
        
        console.log('🔍 [SYSTEM CHECK] Verificação concluída');
    }

    fixAISystem() {
        console.log('🔧 [AI FIX] Iniciando correção do sistema de IA...');
        
        if (!window.aiAnalysis) {
            console.log('🔧 [AI FIX] Criando objeto aiAnalysis...');
            window.aiAnalysis = {};
        }
        
        // Ensure all required methods exist
        const requiredMethods = ['generateLocalReport', 'generateFastReport', 'generateSimpleFallbackReport'];
        
        requiredMethods.forEach(method => {
            if (typeof window.aiAnalysis[method] !== 'function') {
                console.log(`🔧 [AI FIX] Adicionando método ${method}...`);
                window.aiAnalysis[method] = (entries) => {
                    console.log(`🔧 [AI FIX] Usando fallback para ${method}`);
                    return this.generateEmergencyReport(entries);
                };
            }
        });
        
        console.log('🔧 [AI FIX] Sistema de IA corrigido');
    }

    setAIMode(mode) {
        this.aiMode = mode;
        console.log(`🤖 Modo de IA alterado para: ${mode}`);
    }

    updateReportMode() {
        const modeInputs = document.querySelectorAll('input[name="ai-mode"]');
        modeInputs.forEach(input => {
            if (input.value === this.aiMode) {
                input.checked = true;
            }
        });
    }

    async generateReport() {
        try {
            // Verificar se os sistemas estão disponíveis
            if (!window.mentalStorage) {
                throw new Error('Sistema de armazenamento não disponível');
            }
            
            // Forçar criação do aiAnalysis se não existir
            if (!window.aiAnalysis) {
                console.log('🤖 [REPORT DEBUG] aiAnalysis não existe, verificando classe...');
                if (typeof AIAnalysis !== 'undefined') {
                    console.log('🤖 [REPORT DEBUG] Criando nova instância de AIAnalysis...');
                    window.aiAnalysis = new AIAnalysis();
                } else {
                    console.log('🤖 [REPORT DEBUG] Classe AIAnalysis não disponível, criando objeto mock...');
                    window.aiAnalysis = {
                        generateLocalReport: (entries) => this.generateEmergencyReport(entries),
                        generateFastReport: (entries) => this.generateEmergencyReport(entries),
                        generateSimpleFallbackReport: (entries) => this.generateEmergencyReport(entries)
                    };
                }
            }
            
            // Verificar se os métodos existem, se não, adicionar fallbacks
            if (!window.aiAnalysis.generateLocalReport) {
                console.log('🤖 [REPORT DEBUG] Adicionando generateLocalReport fallback...');
                window.aiAnalysis.generateLocalReport = (entries) => {
                    return window.aiAnalysis.generateSimpleFallbackReport ? 
                        window.aiAnalysis.generateSimpleFallbackReport(entries) :
                        this.generateEmergencyReport(entries);
                };
            }
            
            if (!window.aiAnalysis.generateFastReport) {
                console.log('🤖 [REPORT DEBUG] Adicionando generateFastReport fallback...');
                window.aiAnalysis.generateFastReport = (entries) => {
                    return window.aiAnalysis.generateSimpleFallbackReport ? 
                        window.aiAnalysis.generateSimpleFallbackReport(entries) :
                        this.generateEmergencyReport(entries);
                };
            }
            
            if (!window.aiAnalysis.generateSimpleFallbackReport) {
                console.log('🤖 [REPORT DEBUG] Adicionando generateSimpleFallbackReport fallback...');
                window.aiAnalysis.generateSimpleFallbackReport = (entries) => {
                    return this.generateEmergencyReport(entries);
                };
            }

            const entries = await window.mentalStorage.getAllMoodEntries();
            
            if (!entries || entries.length === 0) {
                this.showToast('Você precisa ter alguns registros para gerar um relatório. Registre alguns humores primeiro!', 'warning');
                return;
            }

            // Show loading
            this.showLoading('Gerando relatório com IA...', 'Analisando seus dados de humor...');
            
            let report;
            try {
                console.log('🤖 [REPORT DEBUG] Iniciando geração de relatório...');
                console.log('🤖 [REPORT DEBUG] Modo atual:', this.aiMode);
                
                if (this.aiMode === 'private') {
                    // Use local AI with timeout and fallback
                    console.log('🤖 [REPORT DEBUG] Gerando relatório local...');
                    try {
                        const reportPromise = window.aiAnalysis.generateLocalReport(entries);
                        const timeoutPromise = new Promise((_, reject) => 
                            setTimeout(() => reject(new Error('Timeout na geração local')), 30000)
                        );
                        report = await Promise.race([reportPromise, timeoutPromise]);
                    } catch (localError) {
                        console.log('🤖 [REPORT DEBUG] Erro local, usando fallback simples:', localError.message);
                        report = window.aiAnalysis.generateSimpleFallbackReport(entries);
                    }
                } else {
                    // Use external API with timeout and fallback
                    console.log('🤖 [REPORT DEBUG] Gerando relatório online...');
                    try {
                        const reportPromise = window.aiAnalysis.generateFastReport(entries);
                        const timeoutPromise = new Promise((_, reject) => 
                            setTimeout(() => reject(new Error('Timeout na API externa')), 20000)
                        );
                        report = await Promise.race([reportPromise, timeoutPromise]);
                    } catch (externalError) {
                        console.log('🤖 [REPORT DEBUG] Erro API externa, tentando local:', externalError.message);
                        try {
                            report = await window.aiAnalysis.generateLocalReport(entries);
                        } catch (localError) {
                            console.log('🤖 [REPORT DEBUG] Erro local também, usando fallback simples:', localError.message);
                            report = window.aiAnalysis.generateSimpleFallbackReport(entries);
                        }
                    }
                }
            } catch (aiError) {
                console.error('🤖 [REPORT DEBUG] Erro crítico na geração de IA:', aiError);
                console.error('🤖 [REPORT DEBUG] Stack trace:', aiError.stack);
                console.log('🤖 [REPORT DEBUG] Usando fallback de emergência...');
                
                // Último recurso: sempre gerar relatório de emergência
                console.log('🆘 [REPORT DEBUG] Usando relatório de emergência como último recurso');
                report = this.generateEmergencyReport(entries);
            }

            if (!report || typeof report !== 'string') {
                console.log('🤖 [REPORT DEBUG] Relatório inválido, gerando emergência...');
                report = this.generateEmergencyReport(entries);
            }

            // Hide loading
            this.hideLoading();
            
            // Display report
            this.displayReport(report);
            
            this.showToast('Relatório gerado com sucesso! 📋', 'success');
            
        } catch (error) {
            console.error('Erro ao gerar relatório:', error);
            this.hideLoading();
            
            let errorMessage = 'Erro ao gerar relatório. Tente novamente.';
            
            if (error.message.includes('Sistema de armazenamento não disponível')) {
                errorMessage = 'Sistema de dados não inicializado. Recarregue a página.';
            } else if (error.message.includes('Sistema de análise não disponível')) {
                errorMessage = 'Sistema de IA não carregado. Recarregue a página.';
            } else if (error.message.includes('Timeout')) {
                errorMessage = 'Análise demorou muito. Tente novamente.';
            } else if (error.message.includes('Falha na análise de IA')) {
                errorMessage = 'Erro na IA. Tente mudar para modo online/privado.';
            } else if (error.message.includes('Relatório inválido')) {
                errorMessage = 'Resposta inválida da IA. Tente novamente.';
            }
            
            this.showToast(errorMessage, 'error');
        }
    }

    generateEmergencyReport(entries) {
        console.log('🆘 [EMERGENCY] Gerando relatório de emergência');
        
        if (!entries || entries.length === 0) {
            return "Nenhum dado encontrado para análise.";
        }

        const total = entries.length;
        const avg = (entries.reduce((sum, e) => sum + e.mood, 0) / total).toFixed(1);
        const latest = entries[entries.length - 1];
        const latestDate = new Date(latest.timestamp).toLocaleDateString('pt-BR');
        
        return `# Relatório Básico - MentalIA

ℹ️ **Status**: Relatório gerado em modo de emergência

## Resumo Rápido
📈 **Total de registros**: ${total}
📊 **Humor médio**: ${avg}/5.0
📅 **Último registro**: ${latestDate}
😊 **Último humor**: ${latest.mood}/5.0

## Observações
${avg >= 3.5 ? '✅ Seus níveis de humor estão positivos!' : '💭 Considere conversar com um profissional se necessário.'}

Continue registrando seus humores para análises mais detalhadas.

---
*Relatório simplificado gerado automaticamente*`;
    }

    displayReport(report) {
        const reportContent = document.getElementById('report-content');
        const reportDate = document.getElementById('report-date');
        const generalAnalysis = document.getElementById('general-analysis');
        const patternsAnalysis = document.getElementById('patterns-analysis');
        const recommendations = document.getElementById('recommendations');

        if (!reportContent) return;

        // Show report section
        reportContent.classList.remove('hidden');

        // Update date
        if (reportDate) {
            reportDate.textContent = new Date().toLocaleDateString('pt-BR', {
                day: 'numeric',
                month: 'long',
                year: 'numeric'
            });
        }

        // Handle both string and object report formats
        if (typeof report === 'string') {
            // If it's a string, put it all in general analysis
            if (generalAnalysis) {
                generalAnalysis.innerHTML = `<div class="report-text">${report.replace(/\n/g, '<br>')}</div>`;
            }
            
            // Clear other sections
            if (patternsAnalysis) patternsAnalysis.innerHTML = '';
            if (recommendations) recommendations.innerHTML = '';
            
        } else if (typeof report === 'object' && report !== null) {
            // Handle object format
            if (generalAnalysis && report.general) {
                generalAnalysis.innerHTML = `<p>${report.general}</p>`;
            }

            if (patternsAnalysis && report.patterns && Array.isArray(report.patterns)) {
                patternsAnalysis.innerHTML = report.patterns.map(pattern => 
                    `<p>• ${pattern}</p>`
                ).join('');
            }

            if (recommendations && report.recommendations && Array.isArray(report.recommendations)) {
                recommendations.innerHTML = report.recommendations.map(rec => 
                    `<p>• ${rec}</p>`
                ).join('');
            }
        } else {
            // Fallback for invalid report format
            if (generalAnalysis) {
                generalAnalysis.innerHTML = '<p>Erro: Formato de relatório inválido.</p>';
            }
        }
    }

    // Backup is now handled directly by GoogleDriveBackup class
    // This method is kept for backward compatibility if needed
    async backupData() {
        if (window.googleDriveBackup && window.googleDriveBackup.handleBackupClick) {
            await window.googleDriveBackup.handleBackupClick();
        } else {
            this.showToast('Sistema de backup não carregado. Recarregue a página.', 'error');
        }
    }

    async restoreData() {
        try {
            if (!window.googleDriveBackup) {
                throw new Error('Sistema de backup não disponível');
            }
            
            this.showToast('Funcionalidade de restaurar em desenvolvimento', 'info');
            
            // TODO: Implement restore functionality
            // await window.googleDriveBackup.restoreFromGoogleDrive();
            
            // Reload data
            await this.loadData();
            
        } catch (error) {
            console.error('Erro na restauração:', error);
            this.hideLoading();
            this.showToast('Erro ao restaurar dados. Verifique sua conexão.', 'error');
        }
    }

    showLoading(title, message) {
        const overlay = document.getElementById('loading-overlay');
        const loadingMessage = document.getElementById('loading-message');
        const progressFill = document.getElementById('progress-fill');

        if (overlay) {
            overlay.classList.remove('hidden');
        }

        if (loadingMessage) {
            loadingMessage.textContent = message;
        }

        // Simulate progress
        if (progressFill) {
            let progress = 0;
            const interval = setInterval(() => {
                progress += Math.random() * 20;
                if (progress > 90) progress = 90; // Don't complete until actually done
                progressFill.style.width = `${progress}%`;
            }, 500);

            // Store interval to clear later
            this.progressInterval = interval;
        }
    }

    hideLoading() {
        const overlay = document.getElementById('loading-overlay');
        const progressFill = document.getElementById('progress-fill');

        if (overlay) {
            overlay.classList.add('hidden');
        }

        if (progressFill) {
            progressFill.style.width = '100%';
            setTimeout(() => {
                progressFill.style.width = '0%';
            }, 300);
        }

        if (this.progressInterval) {
            clearInterval(this.progressInterval);
            this.progressInterval = null;
        }
    }

    initPWA() {
        // Handle app install prompt
        window.addEventListener('beforeinstallprompt', (e) => {
            e.preventDefault();
            this.deferredPrompt = e;
            this.showInstallPrompt();
        });

        // Handle app installed
        window.addEventListener('appinstalled', () => {
            console.log('PWA foi instalada');
            this.showToast('App instalado com sucesso! 📱', 'success');
        });
    }

    showInstallPrompt() {
        // Create install button (could be added to UI)
        console.log('PWA pode ser instalada');
    }

    initNotifications() {
        // Request notification permission
        if ('Notification' in window && navigator.serviceWorker) {
            Notification.requestPermission().then(permission => {
                if (permission === 'granted') {
                    console.log('Permissão de notificação concedida');
                }
            });
        }
    }

    showNotification(title, options = {}) {
        if ('serviceWorker' in navigator && 'Notification' in window) {
            navigator.serviceWorker.ready.then(registration => {
                registration.showNotification(title, {
                    icon: '/icon-192x192.png',
                    badge: '/icon-72x72.png',
                    ...options
                });
            });
        }
    }

    showToast(message, type = 'info') {
        const container = document.getElementById('toast-container');
        if (!container) return;

        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.innerHTML = `
            <div class="toast-content">
                <p>${message}</p>
            </div>
        `;

        container.appendChild(toast);

        // Auto remove after 5 seconds
        setTimeout(() => {
            toast.style.animation = 'slideOut 0.3s ease forwards';
            setTimeout(() => {
                container.removeChild(toast);
            }, 300);
        }, 5000);
    }
    checkEntryLimit() {
        // Verificar se o usuário está logado e é premium
        const auth = window.mentalIA?.auth;
        
        if (!auth?.isLoggedIn) {
            // Usuário não logado - permitir apenas demonstração
            this.showToast('Faça login para salvar seus registros permanentemente', 'warning');
            if (window.authSystem) {
                setTimeout(() => window.authSystem.showLoginScreen(), 1000);
            }
            return false;
        }
        
        if (auth.isPremium) {
            // Usuário premium - sem limites
            return true;
        }
        
        // Usuário gratuito - verificar limite de 30 registros
        const currentEntries = this.moodData?.length || 0;
        
        if (currentEntries >= 30) {
            this.showPremiumLimitDialog();
            return false;
        }
        
        // Mostrar aviso quando próximo do limite
        if (currentEntries >= 25) {
            this.showToast(`Você tem ${30 - currentEntries} registros restantes no plano gratuito`, 'warning');
        }
        
        return true;
    }
    
    showPremiumLimitDialog() {
        const dialog = document.createElement('div');
        dialog.className = 'premium-limit-dialog';
        dialog.innerHTML = `
            <div class="dialog-overlay">
                <div class="dialog-content">
                    <h3>🔒 Limite Atingido</h3>
                    <p>Você atingiu o limite de 30 registros do plano gratuito.</p>
                    <p><strong>Torne-se Premium</strong> para:</p>
                    <ul>
                        <li>✅ Histórico ilimitado</li>
                        <li>✅ Backup no Google Drive</li>
                        <li>✅ IA avançada local</li>
                        <li>✅ Relatórios em PDF</li>
                    </ul>
                    <div class="dialog-price">
                        <span class="price">R$ 79,90</span>
                        <span class="price-note">Pagamento único</span>
                    </div>
                    <div class="dialog-buttons">
                        <button class="btn-premium" onclick="this.parentElement.parentElement.parentElement.parentElement.remove(); window.authSystem?.handlePremiumUpgrade();">
                            🚀 Adquirir Premium
                        </button>
                        <button class="btn-secondary" onclick="this.parentElement.parentElement.parentElement.parentElement.remove();">
                            Agora Não
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(dialog);
        
        // Add styles if not already present
        if (!document.querySelector('#premium-dialog-styles')) {
            const style = document.createElement('style');
            style.id = 'premium-dialog-styles';
            style.textContent = `
                .premium-limit-dialog {
                    position: fixed;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    z-index: 10000;
                }
                .dialog-overlay {
                    position: absolute;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: rgba(0, 0, 0, 0.8);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    padding: 1rem;
                }
                .dialog-content {
                    background: var(--surface);
                    border-radius: 20px;
                    padding: 2rem;
                    max-width: 400px;
                    text-align: center;
                    box-shadow: var(--shadow);
                }
                .dialog-content h3 {
                    color: var(--primary);
                    margin-bottom: 1rem;
                }
                .dialog-content ul {
                    text-align: left;
                    margin: 1rem 0;
                    padding-left: 1rem;
                }
                .dialog-price {
                    margin: 1.5rem 0;
                }
                .dialog-price .price {
                    font-size: 2rem;
                    font-weight: bold;
                    color: var(--primary);
                    display: block;
                }
                .dialog-price .price-note {
                    font-size: 0.9rem;
                    color: var(--text-secondary);
                }
                .dialog-buttons {
                    display: flex;
                    gap: 1rem;
                    margin-top: 1.5rem;
                }
                .dialog-buttons button {
                    flex: 1;
                }
            `;
            document.head.appendChild(style);
        }
    }
}

// Global functions for onclick handlers
window.showScreen = function(screenName) {
    if (window.mentalIA) {
        window.mentalIA.showScreen(screenName);
    }
};

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.mentalIA = new MentalIA();
});

// Add slideOut animation
const style = document.createElement('style');
style.textContent = `
    @keyframes slideOut {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);