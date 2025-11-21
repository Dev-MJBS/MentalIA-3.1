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
        
        // Check authentication status and show appropriate screen
        this.checkAuthenticationStatus();
        
        console.log('✅ MentalIA 3.0 pronto!');
        this.showToast('Bem-vindo ao MentalIA 3.0! 🧠', 'success');
        
        // Remove any old privacy badges that might exist
        this.removeOldPrivacyBadges();
        
        // Initialize status indicator
        this.updateStatusIndicator('offline');
        
        // Log successful initialization
        console.log('🔘 Indicador de status inicializado');
        
        // Make showScreen available globally for onclick handlers
        window.showScreen = (screenName) => this.showScreen(screenName);
        window.mentalIA = this; // Make the whole instance available globally
    }

    updateStatusIndicator(status) {
        const statusDot = document.getElementById('status-dot');
        const statusText = document.getElementById('status-text');
        
        if (!statusDot || !statusText) return;
        
        // Remove previous status classes
        statusDot.classList.remove('online', 'connecting', 'offline');
        
        // Add current status
        statusDot.classList.add(status);
        
        // Update text
        const statusTexts = {
            'online': 'Online',
            'connecting': 'Conectando...',
            'offline': 'Offline'
        };
        
        statusText.textContent = statusTexts[status] || 'Desconhecido';
        
        console.log(`🔘 Status atualizado para: ${status}`);
    }

    checkOnlineStatus() {
        if (navigator.onLine) {
            // Test actual connectivity
            this.updateStatusIndicator('connecting');
            
            // Try to fetch a small resource to verify real connectivity
            fetch('https://www.google.com/favicon.ico', { 
                mode: 'no-cors',
                cache: 'no-cache'
            })
            .then(() => {
                this.updateStatusIndicator('online');
            })
            .catch(() => {
                this.updateStatusIndicator('offline');
            });
        } else {
            this.updateStatusIndicator('offline');
        }
    }

    setupEventListeners() {
        // Theme toggle
        const themeToggle = document.getElementById('theme-toggle');
        themeToggle?.addEventListener('click', () => this.toggleTheme());
        
        // Online/Offline status listeners
        window.addEventListener('online', () => {
            console.log('🌐 Conexão restaurada');
            this.checkOnlineStatus();
        });
        
        window.addEventListener('offline', () => {
            console.log('📴 Conexão perdida');
            this.updateStatusIndicator('offline');
        });
        
        // Check initial status
        setTimeout(() => this.checkOnlineStatus(), 1000);

        // Navigation buttons (nav bar)
        const navButtons = document.querySelectorAll('.nav-btn');
        navButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const screen = e.currentTarget.getAttribute('data-screen');
                this.showScreen(screen);
            });
        });

        // Welcome screen buttons (CTA buttons)
        this.setupWelcomeScreenButtons();

        // Mood form
        const moodForm = document.getElementById('mood-form');
        moodForm?.addEventListener('submit', (e) => this.handleMoodSubmit(e));

        // Mood slider with enhanced interaction
        this.setupMoodSlider();

        // Feelings wheel initialization
        this.initFeelingsWheel();

        // Diary character count with real-time updates
        this.setupDiaryTextarea();

        // Report generation
        const generateReportBtn = document.getElementById('generate-report');
        generateReportBtn?.addEventListener('click', () => this.generateReport());

        // Backup and restore buttons
        // Backup button is handled by GoogleDriveBackup class
        const restoreBtn = document.getElementById('restore-data');
        restoreBtn?.addEventListener('click', () => this.restoreData());

        // AI Mode switch
        const modeInputs = document.querySelectorAll('input[name="ai-mode"]');
        modeInputs.forEach(input => {
            input.addEventListener('change', (e) => this.setAIMode(e.target.value));
        });

        // Save button with enhanced functionality
        this.setupSaveButton();
    }

    setupWelcomeScreenButtons() {
        // "Registrar Humor Agora" button
        const startMoodBtn = document.querySelector('button[onclick*="showScreen(\'mood\')"]');
        if (startMoodBtn) {
            // Remove inline onclick and add proper event listener
            startMoodBtn.removeAttribute('onclick');
            startMoodBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.showScreen('mood');
                console.log('🎯 Botão "Registrar Humor" clicado');
            });
        }

        // "Ver Histórico" button
        const historyBtn = document.querySelector('button[onclick*="showScreen(\'history\')"]');
        if (historyBtn) {
            // Remove inline onclick and add proper event listener
            historyBtn.removeAttribute('onclick');
            historyBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.showScreen('history');
                console.log('🎯 Botão "Ver Histórico" clicado');
            });
        }
    }

    setupMoodSlider() {
        const moodSlider = document.getElementById('mood-slider');
        if (!moodSlider) return;

        // Multiple event listeners for better responsiveness
        ['input', 'change', 'mousemove', 'touchmove'].forEach(eventType => {
            moodSlider.addEventListener(eventType, (e) => {
                const value = parseFloat(e.target.value);
                this.updateMoodValue(value);
            });
        });

        // Initial value setup
        this.updateMoodValue(parseFloat(moodSlider.value));
        console.log('🎚️ Mood slider configurado');
    }

    setupDiaryTextarea() {
        const diaryEntry = document.getElementById('diary-entry');
        if (!diaryEntry) return;

        // Real-time character count
        diaryEntry.addEventListener('input', (e) => {
            const length = e.target.value.length;
            this.updateCharCount(length);
        });

        // Also update on paste and cut
        diaryEntry.addEventListener('paste', (e) => {
            setTimeout(() => {
                const length = e.target.value.length;
                this.updateCharCount(length);
            }, 10);
        });

        diaryEntry.addEventListener('cut', (e) => {
            setTimeout(() => {
                const length = e.target.value.length;
                this.updateCharCount(length);
            }, 10);
        });

        // Initial count
        this.updateCharCount(diaryEntry.value.length);
        console.log('📝 Textarea do diário configurado');
    }

    setupSaveButton() {
        // Find save button in mood form
        const saveBtn = document.querySelector('#mood-form button[type="submit"], .btn-save, button:contains("Salvar")');
        
        if (saveBtn) {
            // Ensure it's properly configured for form submission
            saveBtn.addEventListener('click', (e) => {
                console.log('💾 Botão salvar clicado');
                // The form submission will be handled by handleMoodSubmit
            });
        }
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
        console.log('🎭 Inicializando roda dos sentimentos...');
        
        // Primary feelings accordion with arrow toggle
        const primaryCards = document.querySelectorAll('.primary-feeling-card');
        primaryCards.forEach(card => {
            const btn = card.querySelector('.primary-feeling-btn');
            const expandIcon = card.querySelector('.expand-icon');
            
            if (btn) {
                btn.addEventListener('click', (e) => {
                    e.preventDefault();
                    this.togglePrimaryFeeling(card);
                    console.log('🎭 Sentimento primário clicado:', card.dataset.category);
                });
                
                // Make the entire button area clickable
                btn.style.cursor = 'pointer';
            }
        });

        // Sub-feelings checkboxes with enhanced interaction
        const subFeelingItems = document.querySelectorAll('.sub-feeling-item');
        subFeelingItems.forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                const checkbox = item.querySelector('input[type="checkbox"]');
                if (checkbox) {
                    checkbox.checked = !checkbox.checked;
                    this.updateSelectedFeelings();
                    
                    // Visual feedback
                    if (checkbox.checked) {
                        item.classList.add('selected');
                    } else {
                        item.classList.remove('selected');
                    }
                    
                    console.log('✅ Sub-sentimento selecionado:', checkbox.value, checkbox.checked);
                }
            });
            
            // Make it clear it's clickable
            item.style.cursor = 'pointer';
        });

        // Clear selection button
        const clearBtn = document.getElementById('clear-feelings');
        clearBtn?.addEventListener('click', () => {
            this.clearAllFeelings();
            console.log('🧹 Sentimentos limpos');
        });
        
        console.log('✅ Roda dos sentimentos configurada');
    }

    togglePrimaryFeeling(card) {
        const isExpanded = card.classList.contains('expanded');
        const expandIcon = card.querySelector('.expand-icon');
        
        // Close all other cards and reset their arrows
        document.querySelectorAll('.primary-feeling-card').forEach(c => {
            if (c !== card) {
                c.classList.remove('expanded');
                const otherIcon = c.querySelector('.expand-icon');
                if (otherIcon) {
                    otherIcon.textContent = '▼';
                    otherIcon.style.transform = 'rotate(0deg)';
                }
            }
        });
        
        // Toggle current card
        if (isExpanded) {
            card.classList.remove('expanded');
            if (expandIcon) {
                expandIcon.textContent = '▼';
                expandIcon.style.transform = 'rotate(0deg)';
                expandIcon.style.transition = 'transform 0.3s ease';
            }
        } else {
            card.classList.add('expanded');
            if (expandIcon) {
                expandIcon.textContent = '▲';
                expandIcon.style.transform = 'rotate(180deg)';
                expandIcon.style.transition = 'transform 0.3s ease';
            }
        }
        
        console.log(`🎭 Sentimento ${isExpanded ? 'fechado' : 'aberto'}:`, card.dataset.category);
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
        // Try multiple selectors to find character count display
        const selectors = [
            '#char-count',
            '.char-count',
            '[id*="char"]',
            '.character-count',
            '.diary-counter'
        ];
        
        let charCountDisplay = null;
        for (const selector of selectors) {
            charCountDisplay = document.querySelector(selector);
            if (charCountDisplay) break;
        }
        
        if (charCountDisplay) {
            charCountDisplay.textContent = `${count} caracteres`;
        } else {
            // If no display element found, create one
            const diaryEntry = document.getElementById('diary-entry');
            if (diaryEntry && !document.querySelector('.char-count-created')) {
                const countDiv = document.createElement('div');
                countDiv.className = 'char-count char-count-created';
                countDiv.style.cssText = 'text-align: right; font-size: 0.8rem; color: var(--text-muted); margin-top: 5px;';
                countDiv.textContent = `${count} caracteres`;
                diaryEntry.parentNode.appendChild(countDiv);
            }
        }
        
        console.log(`📝 Contador atualizado: ${count} caracteres`);
    }

    async handleMoodSubmit(e) {
        e.preventDefault();
        console.log('💾 Iniciando salvamento do humor...');
        
        // Show loading for better UX
        this.showLoading('Salvando registro...', 'Criptografando dados localmente...');
        
        try {
            const diaryEntry = document.getElementById('diary-entry')?.value || '';
            
            // Validate mood value
            if (this.currentMood < 1 || this.currentMood > 5) {
                throw new Error('Valor de humor inválido');
            }
            
            // Get selected feelings
            const selectedFeelings = Array.from(document.querySelectorAll('.sub-feeling-item input[type="checkbox"]:checked'))
                .map(cb => ({
                    value: cb.value,
                    category: cb.getAttribute('data-category'),
                    emoji: cb.parentElement.querySelector('.sub-emoji')?.textContent || '',
                    label: cb.parentElement.querySelector('.sub-label')?.textContent || ''
                }));
            
            // Create mood entry with enhanced metadata
            const moodData = {
                id: Date.now(), // Simple ID generation
                mood: Math.round(this.currentMood * 10) / 10, // Round to 1 decimal
                feelings: selectedFeelings,
                diary: diaryEntry.trim(),
                timestamp: new Date().toISOString(),
                date: new Date().toDateString(),
                deviceFingerprint: this.generateDeviceFingerprint(),
                version: '3.0',
                moodColor: this.interpolateColor(this.currentMood)
            };

            console.log('💾 Dados preparados para salvamento:', moodData);

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
            if (window.mentalStorage) {
                // Ensure storage is initialized
                if (!window.mentalStorage.db) {
                    await window.mentalStorage.init();
                }
                
                await window.mentalStorage.saveMoodEntry(moodData);
                console.log('✅ Dados salvos no storage criptografado IndexedDB');
            } else {
                // Fallback to localStorage if encrypted storage is not available
                const existingData = JSON.parse(localStorage.getItem('mental-ia-mood-data') || '[]');
                existingData.push(moodData);
                localStorage.setItem('mental-ia-mood-data', JSON.stringify(existingData));
                console.log('⚠️ Dados salvos no localStorage (fallback - storage não disponível)');
            }
            
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

    resetMoodForm() {
        console.log('🔄 Resetando formulário de humor...');
        
        // Reset mood slider to neutral
        this.currentMood = 3.0;
        const moodSlider = document.getElementById('mood-slider');
        if (moodSlider) {
            moodSlider.value = 3.0;
        }
        this.updateMoodValue(3.0);
        
        // Clear selected feelings
        this.selectedFeelings = new Set();
        document.querySelectorAll('.sub-feeling-item input[type="checkbox"]').forEach(cb => {
            cb.checked = false;
            cb.parentElement.classList.remove('selected');
        });
        
        // Close all expanded primary feeling cards
        document.querySelectorAll('.primary-feeling-card').forEach(card => {
            card.classList.remove('expanded');
            const icon = card.querySelector('.expand-icon');
            if (icon) {
                icon.textContent = '▼';
                icon.style.transform = 'rotate(0deg)';
            }
        });
        
        // Clear diary entry
        const diaryEntry = document.getElementById('diary-entry');
        if (diaryEntry) {
            diaryEntry.value = '';
        }
        
        // Reset character count
        this.updateCharCount(0);
        
        console.log('✅ Formulário resetado');
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
            // Initialize storage if needed
            if (window.mentalStorage && !window.mentalStorage.db) {
                await window.mentalStorage.init();
            }
            
            const entries = await window.mentalStorage.getAllMoodEntries();
            console.log(`📊 ${entries.length} registros carregados`);
            
            // Get comprehensive stats
            const stats = await window.mentalStorage.getStats();
            
            // Update UI with stats and entries
            this.updateStats(stats);
            this.updateChart(entries);
            this.updateRecentEntries(entries);
            
        } catch (error) {
            console.error('❌ Erro ao carregar histórico:', error);
            // Show fallback empty state
            this.updateStats({
                totalEntries: 0,
                averageMood: 0,
                streak: 0,
                moodTrend: 'neutral'
            });
        }
    }

    updateStats(data) {
        const avgMoodEl = document.getElementById('avg-mood');
        const totalEntriesEl = document.getElementById('total-entries');
        const streakDaysEl = document.getElementById('streak-days');
        const moodTrendEl = document.getElementById('mood-trend');

        // Handle both stats object and entries array for backward compatibility
        let stats;
        if (Array.isArray(data)) {
            // Legacy: calculate stats from entries array
            if (data.length === 0) {
                stats = { totalEntries: 0, averageMood: 0, streak: 0, moodTrend: 'neutral' };
            } else {
                const avgMood = data.reduce((sum, entry) => sum + entry.mood, 0) / data.length;
                stats = {
                    totalEntries: data.length,
                    averageMood: avgMood,
                    streak: 0, // Would need calculation
                    moodTrend: 'neutral'
                };
            }
        } else {
            // New: use stats object directly
            stats = data;
        }

        // Update UI elements
        if (avgMoodEl) avgMoodEl.textContent = stats.averageMood.toFixed(1);
        if (totalEntriesEl) totalEntriesEl.textContent = stats.totalEntries.toString();
        if (streakDaysEl) streakDaysEl.textContent = stats.streak.toString();
        
        // Update mood trend if element exists
        if (moodTrendEl) {
            const trendText = {
                'improving': '📈 Melhorando',
                'declining': '📉 Declinando',
                'stable': '➡️ Estável',
                'neutral': '➡️ Neutro'
            };
            moodTrendEl.textContent = trendText[stats.moodTrend] || '➡️ Neutro';
        }
        
        console.log('📊 Stats atualizadas na UI:', stats);

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
        
        // Check auth system
        const authOk = !!window.authSystem;
        console.log('🔍 [SYSTEM CHECK] Auth System:', authOk ? '✅ OK' : '❌ FALHA');
        
        // Check auth system
        const authOk = !!window.authSystem;
        console.log('🔍 [SYSTEM CHECK] Auth System:', authOk ? '✅ OK' : '❌ FALHA');
        
        // Check backup
        const backupOk = !!window.googleDriveBackup;
        let backupStatus = '❌ FALHA';
        
        if (backupOk) {
            // Verificar se tem credenciais configuradas
            const hasCredentials = localStorage.getItem('google-client-id') || window.googleDriveBackup.isOfflineMode === false;
            backupStatus = hasCredentials ? '✅ OK' : '⚠️ OFFLINE';
        }
        
        console.log('🔍 [SYSTEM CHECK] Backup:', backupStatus);
        
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
            console.log('📊 Iniciando geração de relatório...');
            
            // Show loading
            this.showLoading('Gerando relatório...', 'Analisando seus dados com IA médica local...');
            
            // Verificar se os sistemas estão disponíveis
            if (!window.mentalStorage) {
                throw new Error('Sistema de armazenamento não disponível');
            }
            
            // Initialize AI Analysis if needed
            if (!window.aiAnalysis) {
                console.log('🤖 Inicializando módulo de IA...');
                if (typeof AIAnalysis !== 'undefined') {
                    window.aiAnalysis = new AIAnalysis();
                    await window.aiAnalysis.init();
                } else {
                    throw new Error('Módulo de IA não disponível');
                }
            }
            
            // Get mood entries
            const entries = await window.mentalStorage.getAllMoodEntries();
            
            if (!entries || entries.length === 0) {
                this.hideLoading();
                this.showToast('Você precisa ter alguns registros para gerar um relatório. Registre alguns humores primeiro!', 'warning');
                return;
            }

            console.log(`📊 Gerando relatório com ${entries.length} entradas`);
            
            // Generate report based on selected mode
            let report;
            const aiMode = this.getSelectedAIMode();
            
            if (aiMode === 'private') {
                console.log('🤖 Usando modo privado (IA local)');
                report = await window.aiAnalysis.generateLocalReport(entries);
            } else {
                console.log('🚀 Usando modo rápido');
                report = await window.aiAnalysis.generateFastReport(entries);
            }

            // Hide loading and display report
            this.hideLoading();
            
            if (report) {
                this.displayReport(report);
                this.showToast('Relatório gerado com sucesso! 🎉', 'success');
            } else {
                throw new Error('Não foi possível gerar o relatório');
            }

        } catch (error) {
            console.error('❌ Erro ao gerar relatório:', error);
            this.hideLoading();
            this.showToast('Erro ao gerar relatório: ' + error.message, 'error');
        }
    }

    getSelectedAIMode() {
        const modeInputs = document.querySelectorAll('input[name="ai-mode"]');
        for (const input of modeInputs) {
            if (input.checked) {
                return input.value;
            }
        }
        return 'private'; // Default to private mode
    }

    displayReport(report) {
        console.log('📊 Exibindo relatório:', report);
        
        // Show report content container
        const reportContent = document.getElementById('report-content');
        if (reportContent) {
            reportContent.classList.remove('hidden');
        }

        // Update report date
        const reportDate = document.getElementById('report-date');
        if (reportDate) {
            reportDate.textContent = new Date().toLocaleDateString('pt-BR');
        }

        // Update general analysis
        const generalAnalysis = document.getElementById('general-analysis');
        if (generalAnalysis && report.analysis) {
            generalAnalysis.innerHTML = `<p>${report.analysis.replace(/\n/g, '</p><p>')}</p>`;
        }

        // Update patterns analysis
        const patternsAnalysis = document.getElementById('patterns-analysis');
        if (patternsAnalysis && report.insights) {
            if (Array.isArray(report.insights)) {
                patternsAnalysis.innerHTML = report.insights.map(insight => `<p>• ${insight}</p>`).join('');
            } else {
                patternsAnalysis.innerHTML = `<p>${report.insights}</p>`;
            }
        }

        // Update recommendations
        const recommendations = document.getElementById('recommendations');
        if (recommendations && report.recommendations) {
            if (Array.isArray(report.recommendations)) {
                recommendations.innerHTML = report.recommendations.map(rec => `<p>• ${rec}</p>`).join('');
            } else {
                recommendations.innerHTML = `<p>${report.recommendations}</p>`;
            }
        }

        console.log('✅ Relatório exibido na interface');
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
    checkAuthenticationStatus() {
        // Wait for auth system to be available
        setTimeout(() => {
            if (window.authSystem) {
                const isLoggedIn = window.authSystem.isLoggedIn();
                console.log('🔐 Status de autenticação:', isLoggedIn ? 'Logado' : 'Não logado');
                
                if (!isLoggedIn) {
                    console.log('🔐 Redirecionando para tela de login...');
                    window.authSystem.showLoginScreen();
                } else {
                    // Update auth reference for the app
                    this.auth = {
                        isLoggedIn: true,
                        isPremium: window.authSystem.isPremium(),
                        user: window.authSystem.getCurrentUser()
                    };
                    console.log('🔐 Usuário autenticado:', this.auth.user?.name);
                }
            } else {
                console.warn('⚠️ Sistema de autenticação não disponível');
            }
        }, 100);
    }

    checkEntryLimit() {
        // Verificar se o usuário está logado e é premium
        const auth = this.auth || window.mentalIA?.auth;
        
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
                        <span class="price">R$ 19,90</span>
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
    // Initialize auth system first
    if (typeof AuthSystem !== 'undefined') {
        window.authSystem = new AuthSystem();
        console.log('🔐 Sistema de autenticação inicializado');
    } else {
        console.warn('⚠️ AuthSystem não encontrado');
    }
    
    // Then initialize main app
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