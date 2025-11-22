// MentalIA 3.1 - Main App JavaScript
// Complete rewrite with all fixes

console.log('🚀 MentalIA app.js carregado!');

// 🔥 DEBUG: Adicionar listener global para capturar todos os cliques
document.addEventListener('click', (e) => {
    console.log('🔥 CLICK GLOBAL capturado:', {
        target: e.target,
        targetTag: e.target.tagName,
        targetClass: e.target.className,
        targetId: e.target.id,
        dataScreen: e.target.dataset?.screen,
        parentDataScreen: e.target.closest('[data-screen]')?.dataset?.screen,
        timestamp: Date.now()
    });
}, true); // Use capture phase

document.addEventListener('touchend', (e) => {
    console.log('🔥 TOUCH GLOBAL capturado:', {
        target: e.target,
        targetTag: e.target.tagName,
        targetClass: e.target.className,
        targetId: e.target.id,
        dataScreen: e.target.dataset?.screen,
        parentDataScreen: e.target.closest('[data-screen]')?.dataset?.screen,
        touches: e.touches?.length,
        changedTouches: e.changedTouches?.length,
        timestamp: Date.now()
    });
}, true); // Use capture phase

class MentalIA {
    constructor() {
        this.currentScreen = 'welcome';
        this.currentMood = 3.0;
        this.selectedFeelings = new Set();
        this.currentUser = null;
        this.isPremium = true; // Todos os recursos gratuitos
        this.moodFormInitialized = false; // Flag to prevent double initialization
        // setupEventListeners() will be called in init() after DOM is ready
    }

    async init() {
        console.log('🧠 MentalIA 3.1 inicializando...');

        // Check admin status and setup admin features
        this.initAdminFeatures();

        // Initialize premium system
        await this.initPremium();

        // Initialize AI Analysis system
        if (window.aiAnalysis && typeof window.aiAnalysis.init === 'function') {
            console.log('🤖 Inicializando sistema de análise IA...');
            await window.aiAnalysis.init();
            console.log('✅ Sistema de análise IA inicializado');
        } else {
            console.warn('⚠️ Sistema de análise IA não disponível');
        }

        // Setup all event listeners AFTER DOM is ready
        this.setupEventListeners();

        // Initialize components
        this.initTheme();
        this.initChart();
        this.initPWA();

        // Update auto backup status
        this.updateAutoBackupStatus();

        // Load data
        await this.loadData();

        // Show initial screen
        this.showScreen('welcome');

        console.log('✅ MentalIA 3.1 pronto! Timestamp final:', Date.now());
        this.showToast('MentalIA 3.1 carregado com sucesso! 🧠', 'success');
    }

    // ===== PREMIUM FEATURES =====
    async initPremium() {
        console.log('💎 Todos os recursos liberados gratuitamente!');
        
        // Definir como premium permanentemente (todos os recursos gratuitos)
        this.isPremium = true;
        this.updatePremiumUI();
    }

    updatePremiumUI() {
        // Atualiza classe no body
        document.body.classList.toggle('premium-user', this.isPremium);
        
        // Mostra/esconde elementos premium
        const premiumOnlyElements = document.querySelectorAll('[data-premium-only]');
        premiumOnlyElements.forEach(el => {
            el.style.display = this.isPremium ? '' : 'none';
        });

        // Mostra/esconde elementos free
        const freeOnlyElements = document.querySelectorAll('[data-free-only]');
        freeOnlyElements.forEach(el => {
            el.style.display = this.isPremium ? 'none' : '';
        });

        // Atualiza botões de upgrade
        const upgradeButtons = document.querySelectorAll('[data-show-premium]');
        upgradeButtons.forEach(btn => {
            btn.style.display = this.isPremium ? 'none' : '';
        });

        // Remove watermarks se premium
        if (this.isPremium) {
            const watermarks = document.querySelectorAll('.mentalia-watermark');
            watermarks.forEach(w => w.style.display = 'none');
        }

        console.log('💎 UI Premium atualizada. Status:', this.isPremium);
    }

    // Função removida - todos os recursos são gratuitos

    // Método para obter usuário Google (usado pelo premium)
    async getGoogleUser() {
        // Se já temos o usuário cached, retorna
        if (this.currentUser) {
            return this.currentUser;
        }

        // Tenta obter do storage ou Google API
        try {
            // Implementar integração com Google OAuth aqui
            // Por agora, simula um usuário para desenvolvimento
            if (localStorage.getItem('google_user')) {
                this.currentUser = JSON.parse(localStorage.getItem('google_user'));
                return this.currentUser;
            }
            
            // Se não tem usuário, retorna null (usuário precisa fazer login)
            return null;
            
        } catch (error) {
            console.error('Erro ao obter usuário Google:', error);
            return null;
        }
    }

    // Método para refresh de dados (usado pelo premium)
    async refreshData() {
        console.log('🔄 Refreshing data...');
        await this.loadData();
        if (this.chart) {
            this.updateChart();
        }
    }

    // ===== STORAGE INITIALIZATION =====
    async ensureStorageReady() {
        console.log('🗄️ Verificando storage...');
        
        // Wait for storage to be available
        let attempts = 0;
        while (!window.mentalStorage && attempts < 50) {
            await new Promise(resolve => setTimeout(resolve, 100));
            attempts++;
        }
        
        if (!window.mentalStorage) {
            throw new Error('Storage não disponível após aguardar');
        }
        
        // Ensure storage is initialized
        await window.mentalStorage.ensureInitialized();
        console.log('✅ Storage pronto e inicializado');
    }

    // ===== ADMIN FEATURES =====
    initAdminFeatures() {
        console.log('👑 Verificando status de administrador...');
        
        // Simple admin detection - can be improved later
        const isAdmin = this.checkAdminStatus();
        
        if (isAdmin) {
            console.log('👑 Usuário administrador detectado - mostrando funcionalidades admin');
            this.showAdminElements();
        } else {
            console.log('👤 Usuário normal - escondendo funcionalidades admin');
            this.hideAdminElements();
        }
    }

    checkAdminStatus() {
        // Method 1: Check URL parameter
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.get('admin') === 'true') {
            console.log('👑 Admin mode ativado via URL parameter');
            return true;
        }

        // Method 2: Check localStorage
        if (localStorage.getItem('mentalIA_admin') === 'true') {
            console.log('👑 Admin mode ativado via localStorage');
            return true;
        }

        // Method 3: Check for special key combination (Ctrl+Shift+A+D+M)
        // This will be set up in setupEventListeners

        // Method 4: Check if running on localhost/development
        if (window.location.hostname === 'localhost' || 
            window.location.hostname === '127.0.0.1' ||
            window.location.hostname.includes('dev-mjbs.github.io')) {
            console.log('👑 Admin mode ativado - desenvolvimento/GitHub Pages');
            return true;
        }

        return false;
    }

    showAdminElements() {
        const adminElements = document.querySelectorAll('.admin-only');
        console.log('👑 Mostrando elementos admin:', adminElements.length);
        
        adminElements.forEach(element => {
            element.classList.remove('hidden');
            element.classList.add('admin-visible');
        });
    }

    hideAdminElements() {
        const adminElements = document.querySelectorAll('.admin-only');
        console.log('👤 Escondendo elementos admin:', adminElements.length);
        
        adminElements.forEach(element => {
            element.classList.add('hidden');
            element.classList.remove('admin-visible');
        });
    }

    // Toggle admin mode (for testing)
    toggleAdminMode() {
        const isCurrentlyAdmin = localStorage.getItem('mentalIA_admin') === 'true';
        
        if (isCurrentlyAdmin) {
            localStorage.removeItem('mentalIA_admin');
            this.hideAdminElements();
            this.showToast('👤 Modo usuário ativado', 'info');
            console.log('👤 Modo admin desativado');
        } else {
            localStorage.setItem('mentalIA_admin', 'true');
            this.showAdminElements();
            this.showToast('👑 Modo admin ativado', 'success');
            console.log('👑 Modo admin ativado');
        }
    }

    setupEventListeners() {
        try {
            console.log('🔧 setupEventListeners() INICIADO - Timestamp:', Date.now());
            console.log('🔧 DOM readyState:', document.readyState);
            console.log('🔧 Window loaded:', window.mentalIA ? 'Sim' : 'Não');

        // Admin key combination (Ctrl+Shift+D+E+V)
        this.setupAdminKeyListener();

        // Theme toggle
        const themeToggle = document.getElementById('theme-toggle');
        console.log('🎨 Theme toggle encontrado:', !!themeToggle);
        themeToggle?.addEventListener('click', () => this.toggleTheme());

        // All screen navigation buttons
        const screenBtns = document.querySelectorAll('[data-screen]');
        console.log('🧭 Botões de navegação encontrados:', screenBtns.length, screenBtns);
        screenBtns.forEach(btn => {
            console.log('🧭 Configurando event listener para botão:', btn.dataset.screen, btn);
            console.log('🧭 Botão tem pointer-events:', window.getComputedStyle(btn).pointerEvents);
            console.log('🧭 Botão tem touch-action:', window.getComputedStyle(btn).touchAction);
            
            // Remove existing listeners to avoid duplicates
            btn.removeEventListener('click', btn._screenClickHandler);
            btn.removeEventListener('touchend', btn._screenTouchHandler);
            
            // Create handlers
            btn._screenClickHandler = (e) => {
                console.log('🖱️ CLICK EVENT disparado no botão:', e.currentTarget.dataset.screen);
                console.log('🖱️ Event details:', {
                    type: e.type,
                    target: e.target,
                    currentTarget: e.currentTarget,
                    screen: e.currentTarget.dataset.screen
                });
                e.preventDefault();
                e.stopPropagation();
                const screen = e.currentTarget.dataset.screen;
                console.log('🧭 Navegando para (click):', screen);
                this.showScreen(screen);
            };
            
            btn._screenTouchHandler = (e) => {
                console.log('👆 TOUCH EVENT disparado no botão:', e.currentTarget.dataset.screen);
                console.log('👆 Touch event details:', {
                    type: e.type,
                    target: e.target,
                    currentTarget: e.currentTarget,
                    touches: e.touches?.length,
                    changedTouches: e.changedTouches?.length
                });
                e.preventDefault();
                e.stopPropagation();
                const screen = e.currentTarget.dataset.screen;
                console.log('🧭 Navegando para (touch):', screen);
                this.showScreen(screen);
            };
            
            // Add listeners
            btn.addEventListener('click', btn._screenClickHandler);
            btn.addEventListener('touchend', btn._screenTouchHandler);
            
            console.log('✅ Event listeners anexados ao botão:', btn.dataset.screen);
        });

        // Mood form submission
        const moodForm = document.getElementById('mood-form');
        console.log('📝 Formulário de humor encontrado:', !!moodForm);
        moodForm?.addEventListener('submit', (e) => {
            console.log('📝 Mood form submit event triggered');
            this.handleMoodSubmit(e);
        });

        // Report generation with mobile optimization
        const reportBtn = document.getElementById('generate-report');
        console.log('📊 Botão relatório encontrado:', !!reportBtn);
        
        if (reportBtn) {
            // 🔥 CORREÇÃO: Múltiplos event listeners para melhor compatibilidade mobile
            const generateReportHandler = (e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('📊 Gerando relatório...');
                this.generateReport();
            };
            
            // Event listeners para diferentes tipos de interação
            reportBtn.addEventListener('click', generateReportHandler);
            reportBtn.addEventListener('touchend', generateReportHandler);
            
            // Prevenção de double-tap zoom no iOS
            reportBtn.addEventListener('touchstart', (e) => {
                e.preventDefault();
            });
            
            // Feedback visual para touch
            reportBtn.addEventListener('touchstart', () => {
                reportBtn.style.transform = 'scale(0.98)';
                reportBtn.style.opacity = '0.8';
            });
            
            reportBtn.addEventListener('touchend', () => {
                setTimeout(() => {
                    reportBtn.style.transform = 'scale(1)';
                    reportBtn.style.opacity = '1';
                }, 150);
            });
            
            reportBtn.addEventListener('touchcancel', () => {
                reportBtn.style.transform = 'scale(1)';
                reportBtn.style.opacity = '1';
            });
        }

        // PDF generation button
        const pdfBtn = document.getElementById('generate-pdf-report');
        console.log('📄 Botão PDF encontrado:', !!pdfBtn);
        
        if (pdfBtn) {
            const generatePDFHandler = async (e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('📄 Gerando PDF...');
                
                try {
                    // Disable button during generation
                    pdfBtn.disabled = true;
                    pdfBtn.textContent = '📄 Gerando PDF...';
                    
                    await window.aiAnalysis.downloadReportPDF();
                    
                } catch (error) {
                    console.error('Erro ao gerar PDF:', error);
                    this.showToast('Erro ao gerar PDF: ' + error.message, 'error');
                } finally {
                    // Re-enable button
                    pdfBtn.disabled = false;
                    pdfBtn.textContent = '📄 Baixar Relatório em PDF';
                }
            };
            
            // Event listeners for PDF button
            pdfBtn.addEventListener('click', generatePDFHandler);
            pdfBtn.addEventListener('touchend', generatePDFHandler);
            
            // Touch feedback for PDF button
            pdfBtn.addEventListener('touchstart', (e) => {
                e.preventDefault();
                pdfBtn.style.transform = 'scale(0.98)';
                pdfBtn.style.opacity = '0.8';
            });
            
            pdfBtn.addEventListener('touchend', () => {
                setTimeout(() => {
                    pdfBtn.style.transform = 'scale(1)';
                    pdfBtn.style.opacity = '1';
                }, 150);
            });
            
            pdfBtn.addEventListener('touchcancel', () => {
                pdfBtn.style.transform = 'scale(1)';
                pdfBtn.style.opacity = '1';
            });
        }

        // ===== FLOATING ACTION BAR BUTTONS =====
        // Share Report Button
        const shareReportBtn = document.getElementById('share-report');
        console.log('📤 Botão compartilhar relatório encontrado:', !!shareReportBtn);
        
        if (shareReportBtn) {
            const shareReportHandler = async (e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('📤 Compartilhando relatório...');
                
                try {
                    // Check if Web Share API is available
                    if (navigator.share) {
                        const reportContent = document.getElementById('report-content');
                        if (reportContent && reportContent.textContent.trim()) {
                            await navigator.share({
                                title: 'Relatório MentalIA - Análise de Bem-Estar',
                                text: 'Confira minha análise de bem-estar emocional gerada pelo MentalIA',
                                url: window.location.href
                            });
                            this.showToast('✅ Relatório compartilhado!', 'success');
                        } else {
                            this.showToast('📝 Gere um relatório primeiro para compartilhar', 'warning');
                        }
                    } else {
                        // Fallback: copy to clipboard
                        const reportContent = document.getElementById('report-content');
                        if (reportContent && reportContent.textContent.trim()) {
                            await navigator.clipboard.writeText(reportContent.textContent);
                            this.showToast('📋 Relatório copiado para área de transferência!', 'success');
                        } else {
                            this.showToast('📝 Gere um relatório primeiro para copiar', 'warning');
                        }
                    }
                } catch (error) {
                    console.error('Erro ao compartilhar relatório:', error);
                    this.showToast('Erro ao compartilhar relatório', 'error');
                }
            };
            
            shareReportBtn.addEventListener('click', shareReportHandler);
            shareReportBtn.addEventListener('touchend', shareReportHandler);
            
            // Touch feedback
            shareReportBtn.addEventListener('touchstart', (e) => {
                e.preventDefault();
                shareReportBtn.style.transform = 'scale(0.95)';
            });
            
            shareReportBtn.addEventListener('touchend', () => {
                setTimeout(() => {
                    shareReportBtn.style.transform = 'scale(1)';
                }, 150);
            });
            
            shareReportBtn.addEventListener('touchcancel', () => {
                shareReportBtn.style.transform = 'scale(1)';
            });
        }

        // Export Data Button
        const exportDataBtn = document.getElementById('export-data');
        console.log('💾 Botão exportar dados encontrado:', !!exportDataBtn);
        
        if (exportDataBtn) {
            const exportDataHandler = async (e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('💾 Exportando dados...');
                
                try {
                    // Show loading state
                    exportDataBtn.disabled = true;
                    exportDataBtn.innerHTML = '<span class="btn-icon">⏳</span> Exportando...';
                    
                    // Get all entries
                    const entries = await window.mentalStorage.getAllMoodEntries();
                    
                    if (!entries || entries.length === 0) {
                        this.showToast('📝 Nenhum dado para exportar', 'warning');
                        return;
                    }
                    
                    // Create export data
                    const exportData = {
                        version: 'MentalIA-3.1',
                        exportDate: new Date().toISOString(),
                        totalEntries: entries.length,
                        entries: entries
                    };
                    
                    // Convert to JSON and download
                    const dataStr = JSON.stringify(exportData, null, 2);
                    const dataBlob = new Blob([dataStr], { type: 'application/json' });
                    
                    const link = document.createElement('a');
                    link.href = URL.createObjectURL(dataBlob);
                    link.download = `mentalIA_backup_${new Date().toISOString().split('T')[0]}.json`;
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                    
                    this.showToast('✅ Dados exportados com sucesso!', 'success');
                    
                } catch (error) {
                    console.error('Erro ao exportar dados:', error);
                    this.showToast('Erro ao exportar dados', 'error');
                } finally {
                    // Restore button
                    exportDataBtn.disabled = false;
                    exportDataBtn.innerHTML = '<span class="btn-icon">💾</span> Exportar Dados';
                }
            };
            
            exportDataBtn.addEventListener('click', exportDataHandler);
            exportDataBtn.addEventListener('touchend', exportDataHandler);
            
            // Touch feedback
            exportDataBtn.addEventListener('touchstart', (e) => {
                e.preventDefault();
                exportDataBtn.style.transform = 'scale(0.95)';
            });
            
            exportDataBtn.addEventListener('touchend', () => {
                setTimeout(() => {
                    exportDataBtn.style.transform = 'scale(1)';
                }, 150);
            });
            
            exportDataBtn.addEventListener('touchcancel', () => {
                exportDataBtn.style.transform = 'scale(1)';
            });
        }

        // Print Report Button
        const printReportBtn = document.getElementById('print-report');
        console.log('🖨️ Botão imprimir relatório encontrado:', !!printReportBtn);
        
        if (printReportBtn) {
            const printReportHandler = (e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('🖨️ Imprimindo relatório...');
                
                try {
                    const reportContent = document.getElementById('report-content');
                    if (reportContent && reportContent.textContent.trim()) {
                        // Create print-friendly version
                        const printWindow = window.open('', '_blank');
                        printWindow.document.write(`
                            <!DOCTYPE html>
                            <html>
                            <head>
                                <title>Relatório MentalIA</title>
                                <meta charset="UTF-8">
                                <style>
                                    body {
                                        font-family: system-ui, -apple-system, sans-serif;
                                        line-height: 1.6;
                                        color: #1a1a2e;
                                        max-width: 800px;
                                        margin: 0 auto;
                                        padding: 20px;
                                    }
                                    h1, h2, h3 {
                                        color: #6366f1;
                                        margin-top: 30px;
                                        margin-bottom: 15px;
                                    }
                                    .report-header {
                                        text-align: center;
                                        border-bottom: 2px solid #6366f1;
                                        padding-bottom: 20px;
                                        margin-bottom: 30px;
                                    }
                                    .report-date {
                                        color: #666;
                                        font-size: 0.9em;
                                    }
                                    ul {
                                        padding-left: 20px;
                                    }
                                    li {
                                        margin-bottom: 8px;
                                    }
                                    .disclaimer {
                                        background: #f8f9fa;
                                        padding: 15px;
                                        border-left: 4px solid #ffc107;
                                        margin-top: 30px;
                                    }
                                    @media print {
                                        body { margin: 0; }
                                    }
                                </style>
                            </head>
                            <body>
                                <div class="report-header">
                                    <h1>Relatório MentalIA</h1>
                                    <p>Análise de Bem-Estar Emocional</p>
                                    <div class="report-date">Gerado em: ${new Date().toLocaleDateString('pt-BR')}</div>
                                </div>
                                ${reportContent.innerHTML}
                            </body>
                            </html>
                        `);
                        printWindow.document.close();
                        printWindow.print();
                        
                        this.showToast('🖨️ Relatório enviado para impressão!', 'success');
                    } else {
                        this.showToast('📝 Gere um relatório primeiro para imprimir', 'warning');
                    }
                } catch (error) {
                    console.error('Erro ao imprimir relatório:', error);
                    this.showToast('Erro ao imprimir relatório', 'error');
                }
            };
            
            printReportBtn.addEventListener('click', printReportHandler);
            printReportBtn.addEventListener('touchend', printReportHandler);
            
            // Touch feedback
            printReportBtn.addEventListener('touchstart', (e) => {
                e.preventDefault();
                printReportBtn.style.transform = 'scale(0.95)';
            });
            
            printReportBtn.addEventListener('touchend', () => {
                setTimeout(() => {
                    printReportBtn.style.transform = 'scale(1)';
                }, 150);
            });
            
            printReportBtn.addEventListener('touchcancel', () => {
                printReportBtn.style.transform = 'scale(1)';
            });
        }

        // Backup
        const backupBtn = document.getElementById('backup-data');
        console.log('💾 Botão backup encontrado:', !!backupBtn);
        backupBtn?.addEventListener('click', () => {
            console.log('💾 Fazendo backup...');
            this.backupData();
        });

        // Connect Google Drive button
        const connectBtn = document.getElementById('connect-google-drive');
        console.log('🔗 Botão conectar Google Drive encontrado:', !!connectBtn);
        connectBtn?.addEventListener('click', () => {
            console.log('🔗 [BOTÃO] Botão "Conectar Google Drive" clicado!');
            if (window.googleDriveBackup) {
                console.log('🔗 [BOTÃO] Chamando showGoogleOneTap...');
                window.googleDriveBackup.showGoogleOneTap();
            } else {
                console.error('🔗 [BOTÃO] Sistema de backup não disponível');
                this.showToast('Sistema de backup não disponível', 'error');
            }
        });

        // Auto backup toggle
        const autoBackupToggle = document.getElementById('auto-backup-toggle');
        console.log('🔄 Toggle backup automático encontrado:', !!autoBackupToggle);
        autoBackupToggle?.addEventListener('change', async (e) => {
            console.log('🔄 Toggle backup automático alterado:', e.target.checked);
            const enabled = e.target.checked;

            if (enabled) {
                // Verificar se está conectado ao Google Drive
                if (!window.googleDriveBackup?.isSignedIn) {
                    this.showToast('Conecte-se ao Google Drive primeiro', 'warning');
                    e.target.checked = false;
                    return;
                }

                const success = await window.googleDriveBackup.enableAutoBackup();
                if (!success) {
                    e.target.checked = false;
                }
            } else {
                await window.googleDriveBackup.disableAutoBackup();
            }

            // Atualizar status na UI
            this.updateAutoBackupStatus();
        });

        // Manual backup button
        const manualBackupBtn = document.getElementById('backup-now-btn');
        console.log('💾 Botão backup manual encontrado:', !!manualBackupBtn);
        manualBackupBtn?.addEventListener('click', async () => {
            console.log('💾 Botão backup manual clicado');

            // Verificar se o sistema de backup está disponível
            if (!window.googleDriveBackup) {
                this.showToast('Sistema de backup não disponível', 'error');
                return;
            }

            // Verificar se o usuário está conectado ao Google Drive
            if (!window.googleDriveBackup.isSignedIn) {
                this.showToast('🔗 Conecte-se ao Google Drive primeiro usando o botão "Conectar Google Drive"', 'warning');
                return;
            }

            // Mostrar feedback visual - botão em loading
            const btn = document.getElementById('backup-now-btn');
            const btnText = btn.querySelector('.btn-text');
            const btnLoading = btn.querySelector('.btn-loading');

            if (btn && btnText && btnLoading) {
                btn.classList.add('loading');
                btn.disabled = true;
            }

            try {
                // Mostrar feedback
                this.showToast('🔄 Fazendo backup manual...', 'info');

                // Executar backup
                await window.googleDriveBackup.backupToDrive();

                // Feedback de sucesso
                this.showToast('✅ Backup manual realizado com sucesso!', 'success');

                // Atualizar status do último backup
                this.updateAutoBackupStatus();

            } catch (error) {
                console.error('❌ Erro no backup manual:', error);
                this.showToast('❌ Erro no backup manual: ' + error.message, 'error');
            } finally {
                // Restaurar botão
                if (btn && btnText && btnLoading) {
                    btn.classList.remove('loading');
                    btn.disabled = false;
                }
            }
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

        // 🔥 CORREÇÃO: Premium Actions - Análise Avançada e Export PDF
        const advancedAnalysisBtn = document.getElementById('advanced-analysis');
        const exportPdfBtn = document.getElementById('export-pdf');
        
        console.log('🧠 Botão análise avançada encontrado:', !!advancedAnalysisBtn);
        console.log('📄 Botão export PDF encontrado:', !!exportPdfBtn);
        
        advancedAnalysisBtn?.addEventListener('click', async () => {
            console.log('🧠 Análise avançada clicada!');
            
            try {
                this.showToast('🤖 Gerando análise avançada...', 'info');
                
                // Usar o sistema de análise IA
                if (window.aiAnalysis) {
                    const analysis = await window.aiAnalysis.generateFullAnalysis(this.data);
                    this.displayAdvancedAnalysis(analysis);
                } else {
                    throw new Error('Sistema de IA não disponível');
                }
            } catch (error) {
                console.error('Erro na análise avançada:', error);
                this.showToast('Erro ao gerar análise. Tente novamente.', 'error');
            }
        });
        
        exportPdfBtn?.addEventListener('click', async () => {
            console.log('📄 Export PDF clicado!');
            
            try {
                this.showToast('📄 Gerando PDF...', 'info');
                
                // Usar o sistema de análise IA para PDF
                if (window.aiAnalysis) {
                    await window.aiAnalysis.downloadReportPDF();
                } else {
                    throw new Error('Sistema de PDF não disponível');
                }
            } catch (error) {
                console.error('Erro no export PDF:', error);
                this.showToast('Erro ao gerar PDF. Tente novamente.', 'error');
            }
        });

        // Delete buttons
        const deleteAllBtn = document.getElementById('delete-all-data');
        const confirmDeleteEntryBtn = document.getElementById('confirm-delete-entry');
        const cancelDeleteEntryBtn = document.getElementById('cancel-delete-entry');
        const confirmDeleteAllBtn = document.getElementById('confirm-delete-all');
        const cancelDeleteAllBtn = document.getElementById('cancel-delete-all');

        deleteAllBtn?.addEventListener('click', () => {
            console.log('🗑️ Botão "Apagar Todos os Dados" clicado');
            this.showDeleteAllDataModal();
        });

        confirmDeleteEntryBtn?.addEventListener('click', async () => {
            const modal = document.getElementById('delete-entry-modal');
            const entryId = modal?._entryId;
            if (entryId) {
                await this.deleteEntry(entryId);
                this.hideDeleteModals();
            }
        });

        cancelDeleteEntryBtn?.addEventListener('click', () => {
            this.hideDeleteModals();
        });

        confirmDeleteAllBtn?.addEventListener('click', async () => {
            await this.deleteAllData();
            this.hideDeleteModals();
        });

        cancelDeleteAllBtn?.addEventListener('click', () => {
            this.hideDeleteModals();
        });
        } catch (error) {
            console.error('❌ Erro ao configurar event listeners:', error);
        }
    }

    setupAdminKeyListener() {
        let keySequence = [];
        const adminSequence = ['Control', 'Shift', 'd', 'e', 'v'];
        
        document.addEventListener('keydown', (e) => {
            // Add current key to sequence
            keySequence.push(e.key);
            
            // Keep only last 5 keys
            if (keySequence.length > adminSequence.length) {
                keySequence.shift();
            }
            
            // Check if sequence matches admin pattern
            const sequenceString = keySequence.join(',').toLowerCase();
            const adminString = adminSequence.join(',').toLowerCase();
            
            if (sequenceString === adminString) {
                console.log('👑 Sequência admin detectada! Ativando modo desenvolvedor...');
                localStorage.setItem('mentalIA_admin', 'true');
                this.showAdminElements();
                this.showToast('🚀 Modo Desenvolvedor Ativado!', 'success');
                keySequence = []; // Reset sequence
            }
        });
    }

    // ===== MOOD SLIDER =====
    initMoodForm() {
        if (this.moodFormInitialized) return;
        this.moodFormInitialized = true;

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

            // Touch events for mobile - Improved
            this.handleTouchStart = (e) => {
                console.log('🎚️ Touch start on slider');
                slider.focus(); // Ensure slider gets focus
                // Don't prevent default to allow native slider behavior
            };

            this.handleTouchMove = (e) => {
                console.log('🎚️ Touch move on slider');
                // Allow native touch behavior for better responsiveness
                // Only prevent if we need to stop page scrolling
                if (Math.abs(e.touches[0].clientY - e.target.getBoundingClientRect().top) < 50) {
                    e.preventDefault();
                }
            };

            this.handleTouchEnd = (e) => {
                console.log('🎚️ Touch end on slider');
                // Force update after touch
                const currentValue = parseFloat(slider.value);
                this.updateMoodValue(currentValue);
            };

            // Add pointer events for better touch support
            this.handlePointerDown = (e) => {
                console.log('🎚️ Pointer down on slider');
                slider.setPointerCapture(e.pointerId);
            };

            this.handlePointerMove = (e) => {
                console.log('🎚️ Pointer move on slider');
                if (slider.hasPointerCapture(e.pointerId)) {
                    const currentValue = parseFloat(slider.value);
                    this.updateMoodValue(currentValue);
                }
            };

            this.handlePointerUp = (e) => {
                console.log('🎚️ Pointer up on slider');
                slider.releasePointerCapture(e.pointerId);
                const currentValue = parseFloat(slider.value);
                this.updateMoodValue(currentValue);
            };

            // Event listener principal para input contínuo
            slider.addEventListener('input', (e) => {
                const value = parseFloat(e.target.value);
                this.updateMoodValue(value);
                console.log('🎚️ Slider input:', value);
            });
            
            slider.addEventListener('change', this.handleSliderChange);
            
            // Touch events with improved handling
            slider.addEventListener('touchstart', this.handleTouchStart, { passive: true });
            slider.addEventListener('touchmove', this.handleTouchMove, { passive: false });
            slider.addEventListener('touchend', this.handleTouchEnd, { passive: true });
            
            // Pointer events for modern touch devices
            if (window.PointerEvent) {
                slider.addEventListener('pointerdown', this.handlePointerDown);
                slider.addEventListener('pointermove', this.handlePointerMove);
                slider.addEventListener('pointerup', this.handlePointerUp);
            }

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
        console.log('🎭 Inicializando feelings wheel...');

        // Primary feeling cards with expand icons
        const primaryCards = document.querySelectorAll('.primary-feeling-card');
        console.log('🎭 Primary feeling cards encontrados:', primaryCards.length);

        primaryCards.forEach((card, index) => {
            const header = card.querySelector('.primary-feeling-btn');
            const expandIcon = card.querySelector('.expand-icon');
            
            console.log(`🎭 Card ${index}:`, !!header, !!expandIcon);
            
            if (header) {
                header.addEventListener('click', (e) => {
                    e.preventDefault();
                    console.log(`🎭 Primary card clicado:`, card);
                    this.toggleFeelingCategory(card);
                });
            }
            
            // Event listener específico para a seta de expansão
            if (expandIcon) {
                expandIcon.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    console.log(`🎭 Expand icon clicado:`, card);
                    this.toggleFeelingCategory(card);
                });
            }
        });

        // Sub feeling items
        const subFeelings = document.querySelectorAll('.sub-feeling-item');
        console.log('🎭 Sub feeling items encontrados:', subFeelings.length);

        subFeelings.forEach((item, index) => {
            console.log(`🎭 Sub feeling ${index}:`, item);
            item.addEventListener('click', (e) => {
                console.log(`🎭 Sub feeling clicado:`, item);
                const checkbox = item.querySelector('input[type="checkbox"]');
                if (checkbox) {
                    console.log('🎭 Checkbox encontrado, toggling:', checkbox.checked);
                    checkbox.checked = !checkbox.checked;
                    item.classList.toggle('selected', checkbox.checked);
                    console.log('🎭 Checkbox novo estado:', checkbox.checked);
                    this.updateSelectedFeelings();
                } else {
                    console.error('🎭 Checkbox não encontrado em:', item);
                }
            });
        });

        // Clear button
        const clearBtn = document.getElementById('clear-feelings');
        console.log('🎭 Clear button encontrado:', !!clearBtn);
        if (clearBtn) {
            clearBtn.addEventListener('click', () => {
                console.log('🎭 Clear button clicado');
                this.clearAllFeelings();
            });
        }

        console.log('✅ Feelings wheel inicializado');
    }

    toggleFeelingCategory(card) {
        const wasExpanded = card.classList.contains('expanded');
        const icon = card.querySelector('.expand-icon');
        const subPanel = card.querySelector('.sub-feelings-panel');

        console.log('🎭 Toggle category:', { wasExpanded, hasIcon: !!icon, hasPanel: !!subPanel });

        // Close all other categories
        document.querySelectorAll('.primary-feeling-card').forEach(c => {
            if (c !== card) {
                c.classList.remove('expanded');
                const otherIcon = c.querySelector('.expand-icon');
                const otherPanel = c.querySelector('.sub-feelings-panel');
                if (otherIcon) {
                    otherIcon.textContent = '▼';
                    otherIcon.style.transform = 'rotate(0deg)';
                }
                if (otherPanel) {
                    otherPanel.style.display = 'none';
                }
            }
        });

        // Toggle current category
        if (wasExpanded) {
            card.classList.remove('expanded');
            if (icon) {
                icon.textContent = '▼';
                icon.style.transform = 'rotate(0deg)';
            }
            if (subPanel) {
                subPanel.style.display = 'none';
            }
        } else {
            card.classList.add('expanded');
            if (icon) {
                icon.textContent = '▲';
                icon.style.transform = 'rotate(180deg)';
            }
            if (subPanel) {
                subPanel.style.display = 'block';
            }
        }
        
        console.log('🎭 Category toggled:', card.classList.contains('expanded'));
    }

    updateSelectedFeelings() {
        console.log('🎭 Atualizando sentimentos selecionados...');
        const selected = document.querySelectorAll('.sub-feeling-item input:checked');
        console.log('🎭 Sentimentos checados encontrados:', selected.length, selected);
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
        if (!textarea) {
            console.warn('⚠️ Textarea diary-entry não encontrado');
            return;
        }

        console.log('📝 Inicializando diary textarea...');

        // Character counter and auto-resize
        textarea.addEventListener('input', (e) => {
            const length = e.target.value.length;
            this.updateCharCount(length);
            this.autoResizeTextarea(textarea);
            console.log('📝 Diary input:', length, 'chars');
        });

        // Initial setup
        this.updateCharCount(textarea.value.length);
        this.autoResizeTextarea(textarea);
        
        console.log('✅ Diary textarea inicializado');
    }

    updateCharCount(count) {
        let counter = document.querySelector('.char-count');
        if (!counter) {
            // Create counter if it doesn't exist
            const textarea = document.getElementById('diary-entry');
            if (textarea && textarea.parentNode) {
                counter = document.createElement('div');
                counter.className = 'char-count';
                counter.style.cssText = `
                    font-size: 0.8rem;
                    color: var(--text-secondary);
                    text-align: right;
                    margin-top: 0.5rem;
                    opacity: 0.7;
                `;
                textarea.parentNode.appendChild(counter);
            }
        }
        
        if (counter) {
            const maxChars = 2000;
            counter.textContent = `${count}/${maxChars} caracteres`;
            
            // Color coding based on character count
            if (count > maxChars * 0.9) {
                counter.style.color = 'var(--danger)';
            } else if (count > maxChars * 0.75) {
                counter.style.color = 'var(--warning)';
            } else {
                counter.style.color = 'var(--text-secondary)';
            }
        }
    }
    
    autoResizeTextarea(textarea) {
        if (!textarea) return;
        
        // Reset height to auto to get the correct scrollHeight
        textarea.style.height = 'auto';
        
        // Set height based on content, with min and max constraints
        const minHeight = 120; // minimum height in pixels
        const maxHeight = 400; // maximum height in pixels
        const scrollHeight = textarea.scrollHeight;
        
        const newHeight = Math.max(minHeight, Math.min(maxHeight, scrollHeight));
        textarea.style.height = newHeight + 'px';
        
        // Add scrollbar if content exceeds max height
        if (scrollHeight > maxHeight) {
            textarea.style.overflowY = 'auto';
        } else {
            textarea.style.overflowY = 'hidden';
        }
    }

    // ===== SAVE MOOD =====
    async saveMoodEntry(mood, feelings, diary) {
        console.log('💾 [APP] saveMoodEntry called with:', { mood, feelingsCount: feelings?.size || 0, diaryLength: diary?.length || 0 });

        try {
            // Validate data
            if (mood < 1 || mood > 5) {
                throw new Error('Humor inválido: ' + mood);
            }

            // Prepare data
            const moodData = {
                id: Date.now(),
                mood: Math.round(mood * 10) / 10,
                feelings: Array.from(feelings || []),
                diary: diary?.trim() || '',
                timestamp: new Date().toISOString(),
                date: new Date().toDateString(),
                version: '3.1'
            };

            console.log('📊 [APP] Prepared moodData:', {
                id: moodData.id,
                mood: moodData.mood,
                feelingsCount: moodData.feelings.length,
                diaryLength: moodData.diary.length
            });

            // Ensure storage is ready
            if (!window.mentalStorage) {
                console.log('🔄 [APP] Storage not ready, initializing...');
                await this.ensureStorageReady();
            }

            // Save to encrypted storage
            console.log('💾 [APP] Calling window.mentalStorage.saveMoodEntry...');
            const result = await window.mentalStorage.saveMoodEntry(moodData);
            console.log('✅ [APP] Save result:', result);

            return result;
        } catch (error) {
            console.error('❌ [APP] saveMoodEntry failed:', error);
            console.error('❌ [APP] Error details:', {
                name: error.name,
                message: error.message,
                stack: error.stack
            });
            throw error;
        }
    }

    async handleMoodSubmit(e) {
        console.log('💾 [APP] handleMoodSubmit triggered');
        e.preventDefault();
        console.log('💾 [APP] Form submission prevented, processing...');

        try {
            // Get form data
            const mood = this.currentMood;
            const feelings = this.selectedFeelings;
            const diary = document.getElementById('diary-entry')?.value?.trim() || '';

            console.log('📝 [APP] Form data collected:', {
                mood: mood,
                feelingsCount: feelings?.size || 0,
                diaryLength: diary?.length || 0
            });

            // Validate data
            if (!mood || mood < 1 || mood > 5) {
                throw new Error('Por favor, selecione um nível de humor válido (1-5)');
            }

            // Save using the extracted function
            console.log('💾 [APP] Calling saveMoodEntry...');
            await this.saveMoodEntry(mood, feelings, diary);

            // Success feedback
            console.log('✅ [APP] Save successful, showing success toast');
            this.showToast('Humor registrado com sucesso! 🎉', 'success');

            // Reset form and go to history
            console.log('🔄 [APP] Resetting form and navigating to history...');
            this.resetMoodForm();
            setTimeout(() => {
                console.log('🧭 [APP] Navigating to history screen');
                this.showScreen('history');
            }, 1000);

        } catch (error) {
            console.error('❌ [APP] handleMoodSubmit failed:', error);
            console.error('❌ [APP] Error details:', {
                name: error.name,
                message: error.message,
                stack: error.stack
            });
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
            console.log('📊 [APP] loadData() iniciado - Carregando dados do storage...');

            // 🔥 CORREÇÃO: Aguardar storage estar completamente pronto
            if (!window.mentalStorage) {
                console.error('❌ [APP] Sistema de armazenamento não encontrado!');
                throw new Error('Sistema de armazenamento não disponível');
            }

            // Aguardar inicialização com timeout
            let initAttempts = 0;
            const maxInitAttempts = 10;

            while (!window.mentalStorage.initialized && initAttempts < maxInitAttempts) {
                console.log(`🔄 [APP] Aguardando inicialização do storage (tentativa ${initAttempts + 1}/${maxInitAttempts})...`);
                try {
                    await window.mentalStorage.ensureInitialized();
                    break;
                } catch (initError) {
                    console.warn(`⚠️ [APP] Tentativa ${initAttempts + 1} falhou:`, initError);
                    initAttempts++;
                    if (initAttempts < maxInitAttempts) {
                        await new Promise(resolve => setTimeout(resolve, 500));
                    }
                }
            }

            if (!window.mentalStorage.initialized) {
                throw new Error('Falha ao inicializar sistema de armazenamento após múltiplas tentativas');
            }

            console.log('📊 [APP] Storage pronto, buscando entradas...');

            // 🔥 CORREÇÃO: Timeout para getAllMoodEntries
            const entriesPromise = window.mentalStorage.getAllMoodEntries();
            const timeoutPromise = new Promise((_, reject) =>
                setTimeout(() => reject(new Error('Timeout ao carregar dados')), 10000)
            );

            const entries = await Promise.race([entriesPromise, timeoutPromise]);
            console.log('📊 [APP] Calculando estatísticas...');

            const statsPromise = window.mentalStorage.getStats();
            const statsTimeoutPromise = new Promise((_, reject) =>
                setTimeout(() => reject(new Error('Timeout ao calcular estatísticas')), 5000)
            );

            const stats = await Promise.race([statsPromise, statsTimeoutPromise]);

            console.log('📊 [APP] Dados carregados:', {
                entriesCount: entries?.length || 0,
                firstEntry: entries?.[0] ? {
                    id: entries[0].id,
                    mood: entries[0].mood,
                    date: entries[0].date
                } : null,
                stats: {
                    total: stats?.totalEntries || 0,
                    average: stats?.averageMood || 0,
                    streak: stats?.streak || 0
                }
            });

            this.updateStats(stats);
            this.updateChart(entries);
            this.updateRecentEntries(entries);

            console.log('✅ [APP] Dados carregados e exibidos com sucesso');

            // 🔥 CORREÇÃO: Verificar integridade dos dados periodicamente
            if (entries && entries.length > 0) {
                setTimeout(async () => {
                    try {
                        const integrity = await window.mentalStorage.verifyDataIntegrity();
                        if (integrity.corruptedEntries > 0) {
                            console.warn(`⚠️ [APP] ${integrity.corruptedEntries} entradas corrompidas encontradas`);
                            this.showToast(`${integrity.corruptedEntries} entrada(s) corrompida(s) encontrada(s) e removida(s)`, 'warning', 5000);
                        }
                    } catch (error) {
                        console.warn('⚠️ [APP] Erro ao verificar integridade:', error);
                    }
                }, 2000);
            }

        } catch (error) {
            console.error('❌ [APP] Erro ao carregar dados:', error);
            console.error('❌ [APP] Stack trace:', error.stack);
            console.error('❌ [APP] Error details:', {
                name: error.name,
                message: error.message,
                cause: error.cause
            });

            // 🔥 CORREÇÃO: Tratamento mais específico de erros
            let errorMessage = 'Erro ao carregar dados';
            let errorType = 'error';

            if (error.message.includes('Timeout')) {
                errorMessage = 'Timeout ao carregar dados. Verifique sua conexão.';
            } else if (error.message.includes('armazenamento')) {
                errorMessage = 'Erro no sistema de armazenamento. Tente recarregar a página.';
                errorType = 'warning';
            } else if (error.message.includes('criptografar') || error.message.includes('decrypt')) {
                errorMessage = 'Erro de criptografia. Seus dados podem estar corrompidos.';
            }

            // Show error toast
            this.showToast(errorMessage, errorType);

            // Show empty state if no data
            this.updateStats({ totalEntries: 0, averageMood: 0, streak: 0 });
            this.updateChart([]);
            this.updateRecentEntries([]);

            // 🔥 CORREÇÃO: Tentar recarregar dados após erro
            if (!error.message.includes('Timeout')) {
                setTimeout(() => {
                    console.log('🔄 [APP] Tentando recarregar dados após erro...');
                    this.loadData();
                }, 3000);
            }
        }
    }

    updateStats(stats) {
        console.log('📊 Atualizando estatísticas:', stats);
        const elements = {
            'avg-mood': stats?.averageMood?.toFixed(1) || '0.0',
            'total-entries': stats?.totalEntries || 0,
            'streak-days': stats?.streak || 0
        };

        Object.entries(elements).forEach(([id, value]) => {
            const el = document.getElementById(id);
            if (el) {
                el.textContent = value;
                console.log(`📊 Atualizado ${id}: ${value}`);
            } else {
                console.warn(`⚠️ Elemento não encontrado: ${id}`);
            }
        });
    }





    getMoodEmoji(mood) {
        if (mood <= 1.5) return '😢';
        if (mood <= 2.5) return '😕';
        if (mood <= 3.5) return '😐';
        if (mood <= 4.5) return '😊';
        return '😁';
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
            this.showChartFallback();
            return false;
        }

        if (typeof Chart === 'undefined') {
            console.error('❌ Chart.js não carregado!');
            this.showChartFallback();
            return false;
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
                        pointBorderWidth: 3,
                        pointRadius: 7,
                        pointHoverRadius: 10,
                        pointHoverBorderWidth: 4,
                        tension: 0.4,
                        fill: true,
                        cubicInterpolationMode: 'monotone'
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    interaction: {
                        intersect: false,
                        mode: 'index'
                    },
                    elements: {
                        point: {
                            hoverBorderWidth: 4
                        }
                    },
                    plugins: {
                        legend: { 
                            display: false 
                        },
                        tooltip: {
                            backgroundColor: 'rgba(26, 26, 46, 0.95)',
                            titleColor: '#ffffff',
                            bodyColor: '#ffffff',
                            borderColor: '#6366f1',
                            borderWidth: 1,
                            cornerRadius: 8,
                            displayColors: false,
                            callbacks: {
                                title: function(context) {
                                    return '📅 ' + context[0].label;
                                },
                                label: function(context) {
                                    const value = context.parsed.y;
                                    const emoji = value <= 1.5 ? '😢' : value <= 2.5 ? '😕' : value <= 3.5 ? '😐' : value <= 4.5 ? '😊' : '😁';
                                    return `${emoji} Humor: ${value.toFixed(1)}/5`;
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

                            // Draw background gradient
                            ctx.save();
                            const gradient = ctx.createLinearGradient(left, top, left, bottom);
                            gradient.addColorStop(0, 'rgba(99, 102, 241, 0.05)');
                            gradient.addColorStop(1, 'rgba(99, 102, 241, 0.02)');
                            ctx.fillStyle = gradient;
                            ctx.fillRect(left, top, width, height);

                            // Draw demo line with sample points
                            ctx.strokeStyle = 'rgba(99, 102, 241, 0.3)';
                            ctx.lineWidth = 3;
                            ctx.setLineDash([10, 5]);
                            
                            // Create a more realistic mood curve
                            const points = [
                                { x: left + width * 0.1, y: top + height * 0.8 },  // Low mood
                                { x: left + width * 0.25, y: top + height * 0.6 }, // Improving
                                { x: left + width * 0.4, y: top + height * 0.3 },  // Good mood
                                { x: left + width * 0.55, y: top + height * 0.4 }, // Slight dip
                                { x: left + width * 0.7, y: top + height * 0.25 }, // Very good
                                { x: left + width * 0.85, y: top + height * 0.35 } // Stable
                            ];
                            
                            ctx.beginPath();
                            ctx.moveTo(points[0].x, points[0].y);
                            for (let i = 1; i < points.length; i++) {
                                const cp1x = points[i-1].x + (points[i].x - points[i-1].x) * 0.4;
                                const cp1y = points[i-1].y;
                                const cp2x = points[i].x - (points[i].x - points[i-1].x) * 0.4;
                                const cp2y = points[i].y;
                                ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, points[i].x, points[i].y);
                            }
                            ctx.stroke();
                            
                            // Draw sample points with gradient
                            points.forEach((point, index) => {
                                const pointGradient = ctx.createRadialGradient(point.x, point.y, 0, point.x, point.y, 6);
                                pointGradient.addColorStop(0, '#6366f1');
                                pointGradient.addColorStop(1, 'rgba(99, 102, 241, 0.6)');
                                ctx.fillStyle = pointGradient;
                                ctx.beginPath();
                                ctx.arc(point.x, point.y, 5, 0, 2 * Math.PI);
                                ctx.fill();
                                
                                // Add white border
                                ctx.strokeStyle = '#ffffff';
                                ctx.lineWidth = 2;
                                ctx.setLineDash([]);
                                ctx.stroke();
                            });
                            
                            ctx.restore();

                            // Draw main placeholder text with better styling
                            ctx.save();
                            ctx.fillStyle = '#6366f1';
                            ctx.font = 'bold 20px system-ui, -apple-system, sans-serif';
                            ctx.textAlign = 'center';
                            ctx.textBaseline = 'middle';
                            ctx.fillText('📊 Registre seu primeiro humor', left + width / 2, top + height / 2 - 35);
                            
                            // Draw subtitle
                            ctx.fillStyle = 'rgba(107, 114, 128, 0.9)';
                            ctx.font = '15px system-ui, -apple-system, sans-serif';
                            ctx.fillText('Seu gráfico de progresso emocional aparecerá aqui', left + width / 2, top + height / 2 - 8);
                            
                            // Draw call to action
                            ctx.fillStyle = 'rgba(99, 102, 241, 0.7)';
                            ctx.font = '13px system-ui, -apple-system, sans-serif';
                            ctx.fillText('👆 Clique em "Registrar Humor" para começar', left + width / 2, top + height / 2 + 18);
                            
                            // Draw small help text
                            ctx.fillStyle = 'rgba(107, 114, 128, 0.6)';
                            ctx.font = '11px system-ui, -apple-system, sans-serif';
                            ctx.fillText('Os últimos 30 registros aparecerão neste gráfico', left + width / 2, top + height / 2 + 38);
                            
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
            console.log('📊 Nenhum dado para exibir no gráfico - mostrando fallback');
            this.chart.data.labels = [];
            this.chart.data.datasets[0].data = [];
            this.chart.update('none'); // No animation for empty state
            return;
        }

        try {
            // Sort entries by date (oldest first for chart)
            const sortedEntries = entries.sort((a, b) => {
                const dateA = new Date(a.timestamp || a.date);
                const dateB = new Date(b.timestamp || b.date);
                return dateA - dateB;
            });

            // Take last 30 entries or all if less
            const recentEntries = sortedEntries.slice(-30);

            // 🔥 CORREÇÃO: Calcular trend baseado nos últimos 7 dias
            const last7Days = recentEntries.slice(-7);
            let trend = 'stable';
            if (last7Days.length >= 2) {
                const firstHalf = last7Days.slice(0, Math.floor(last7Days.length / 2));
                const secondHalf = last7Days.slice(Math.floor(last7Days.length / 2));

                const firstAvg = firstHalf.reduce((sum, e) => sum + e.mood, 0) / firstHalf.length;
                const secondAvg = secondHalf.reduce((sum, e) => sum + e.mood, 0) / secondHalf.length;

                const diff = secondAvg - firstAvg;
                if (diff > 0.3) trend = 'improving';
                else if (diff < -0.3) trend = 'declining';
                else trend = 'stable';
            }

            console.log('📊 Trend calculado (últimos 7 dias):', trend);

            // 🔥 CORREÇÃO: Placeholder para poucos dados
            if (entries.length < 3) {
                console.log('📊 Poucos dados - mostrando placeholder');
                this.chart.data.labels = ['Registre mais pra ver padrões'];
                this.chart.data.datasets[0].data = [3.0]; // Valor neutro
                this.chart.update('active');

                // Mostrar toast informativo
                this.showToast('📊 Registre mais alguns humores para ver padrões no gráfico!', 'info', 4000);
                return;
            }

            // Create labels with better date formatting (PT-BR)
            const labels = recentEntries.map(entry => {
                const date = new Date(entry.timestamp || entry.date);

                // Handle invalid dates
                if (isNaN(date.getTime())) {
                    console.warn('⚠️ Data inválida encontrada:', entry);
                    return 'Data inválida';
                }

                const now = new Date();
                const diffTime = Math.abs(now - date);
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

                // Show different formats based on how recent the date is
                if (diffDays === 0) {
                    return 'Hoje';
                } else if (diffDays === 1) {
                    return 'Ontem';
                } else if (diffDays <= 7) {
                    return date.toLocaleDateString('pt-BR', { weekday: 'short' });
                } else {
                    return date.toLocaleDateString('pt-BR', {
                        month: 'short',
                        day: 'numeric'
                    });
                }
            });

            // Process mood data with validation
            const data = recentEntries.map(entry => {
                const mood = parseFloat(entry.mood);
                if (isNaN(mood) || mood < 1 || mood > 5) {
                    console.warn('⚠️ Valor de humor inválido:', entry.mood, 'na entrada:', entry);
                    return 3; // Default to neutral mood
                }
                return Math.round(mood * 10) / 10; // Round to 1 decimal place
            });

            console.log('📊 Labels PT-BR:', labels.slice(0, 5), '... (total:', labels.length, ')');
            console.log('📊 Data:', data.slice(0, 5), '... (total:', data.length, ')');

            // Update chart data
            this.chart.data.labels = labels;
            this.chart.data.datasets[0].data = data;

            // Update chart with smooth animation
            this.chart.update('active');

            console.log('✅ Gráfico atualizado com', data.length, 'pontos de dados');
            console.log('📈 Tendência identificada:', trend);

            // Show success toast for significant updates
            if (data.length >= 5 && data.length % 5 === 0) {
                this.showToast(`📊 Gráfico atualizado com ${data.length} registros!`, 'success', 3000);
            }

        } catch (error) {
            console.error('❌ Erro ao atualizar gráfico:', error);
            this.showToast('Erro ao atualizar gráfico: ' + error.message, 'error');
        }
    }
    
    // Helper function for when chart canvas is not available
    showChartFallback() {
        const chartContainer = document.querySelector('.chart-container') || 
                              document.querySelector('#mood-chart')?.parentElement;
        
        if (chartContainer) {
            chartContainer.innerHTML = `
                <div class="chart-fallback" style="
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    height: 300px;
                    background: linear-gradient(135deg, rgba(99, 102, 241, 0.05), rgba(99, 102, 241, 0.02));
                    border-radius: 12px;
                    border: 2px dashed rgba(99, 102, 241, 0.2);
                    text-align: center;
                    padding: 20px;
                ">
                    <div style="font-size: 3rem; margin-bottom: 1rem;">📊</div>
                    <h3 style="color: #6366f1; margin-bottom: 0.5rem;">Gráfico Não Disponível</h3>
                    <p style="color: rgba(107, 114, 128, 0.9); margin-bottom: 1rem;">Chart.js não foi carregado ou canvas não encontrado</p>
                    <button onclick="location.reload()" style="
                        background: #6366f1;
                        color: white;
                        border: none;
                        padding: 8px 16px;
                        border-radius: 6px;
                        cursor: pointer;
                        font-size: 0.9rem;
                    ">Recarregar Página</button>
                </div>
            `;
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
                    <button class="btn-delete-entry" data-entry-id="${entry.id}" title="Excluir este registro">
                        🗑️
                    </button>
                </div>
                ${entry.diary ? `<div class="entry-text">${entry.diary.substring(0, 100)}${entry.diary.length > 100 ? '...' : ''}</div>` : ''}
            </div>
        `).join('');

        // Adicionar event listeners para os botões de delete
        container.querySelectorAll('.btn-delete-entry').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const entryId = parseInt(btn.dataset.entryId);
                this.showDeleteEntryModal(entryId);
            });
        });
    }

    // ===== REPORT =====
    async generateReport() {
        try {
            console.log('📊 Gerando relatório...');
            
            // 🔥 CORREÇÃO: Feedback visual imediato para mobile
            const reportBtn = document.getElementById('generate-report');
            const originalText = reportBtn?.textContent;
            
            if (reportBtn) {
                reportBtn.disabled = true;
                reportBtn.textContent = '⏳ Gerando...';
                reportBtn.style.opacity = '0.7';
            }

            if (!window.aiAnalysis) {
                throw new Error('Sistema de IA não disponível');
            }

            // 🔥 CORREÇÃO: Garantir que o storage esteja inicializado
            if (!window.mentalStorage) {
                throw new Error('Sistema de armazenamento não disponível');
            }
            
            // Forçar inicialização se necessário
            if (!window.mentalStorage.initialized) {
                console.log('🔄 Inicializando storage antes de gerar relatório...');
                await window.mentalStorage.init();
            }

            const entries = await window.mentalStorage.getAllMoodEntries();
            
            // 🔥 CORREÇÃO: Tratar caso sem dados de forma amigável
            if (!entries?.length) {
                this.displayEmptyReport();
                this.showToast('📝 Adicione alguns registros de humor para gerar um relatório completo!', 'info', 6000);
                return;
            }

            const report = await window.aiAnalysis.generateReport(entries);
            this.displayReport(report);

            this.showToast('Relatório gerado! 📋', 'success');
            
            // Scroll suave para o relatório (melhor no mobile)
            setTimeout(() => {
                const reportContent = document.getElementById('report-content');
                if (reportContent) {
                    reportContent.scrollIntoView({ 
                        behavior: 'smooth', 
                        block: 'start',
                        inline: 'nearest'
                    });
                }
            }, 500);

        } catch (error) {
            console.error('❌ Erro no relatório:', error);
            
            // Display a fallback report
            this.displayReport({
                title: 'Relatório MentalIA - Modo Seguro',
                subtitle: 'Análise básica disponível',
                analysis: '⚠️ Houve um problema técnico ao gerar seu relatório completo, mas seus dados estão seguros. Continue registrando seu humor regularmente para obter insights valiosos sobre seu bem-estar emocional.',
                recommendations: [
                    'Continue registrando seu humor diariamente',
                    'Tente gerar o relatório novamente em alguns minutos',
                    'Verifique se tem uma conexão estável com a internet'
                ],
                insights: [
                    'Sistema funcionando em modo seguro',
                    'Seus dados estão protegidos'
                ],
                disclaimer: 'Relatório gerado em modo seguro devido a erro técnico temporário.',
                error: true
            });
            
            this.showToast('⚠️ Relatório em modo seguro gerado', 'warning');
        } finally {
            // 🔥 CORREÇÃO: Restaurar botão sempre
            const reportBtn = document.getElementById('generate-report');
            if (reportBtn && originalText) {
                setTimeout(() => {
                    reportBtn.disabled = false;
                    reportBtn.textContent = originalText;
                    reportBtn.style.opacity = '1';
                }, 1000);
            }
        }
    }

    // Convert markdown to HTML
    markdownToHtml(markdown) {
        if (!markdown) return '';
        
        let html = markdown
            // Headers
            .replace(/^### (.*$)/gim, '<h3>$1</h3>')
            .replace(/^## (.*$)/gim, '<h2>$1</h2>')
            .replace(/^# (.*$)/gim, '<h1>$1</h1>')
            
            // Bold text
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/__(.*?)__/g, '<strong>$1</strong>')
            
            // Italic text
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            .replace(/_(.*?)_/g, '<em>$1</em>')
            
            // Lists
            .replace(/^\• (.*$)/gim, '<li>$1</li>')
            .replace(/^- (.*$)/gim, '<li>$1</li>')
            .replace(/^\* (.*$)/gim, '<li>$1</li>')
            
            // Line breaks
            .replace(/\n\n/g, '</p><p>')
            .replace(/\n/g, '<br>');
            
        // Wrap lists in ul tags
        html = html.replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>');
        
        // Wrap paragraphs
        if (!html.includes('<p>') && !html.includes('<h')) {
            html = `<p>${html}</p>`;
        }
        
        return html;
    }

    displayReport(report) {
        const content = document.getElementById('report-content');
        if (content) {
            content.classList.remove('hidden');

            // Handle different report formats
            let htmlContent = '';
            if (typeof report === 'string') {
                // Convert markdown string to HTML
                const convertedContent = this.markdownToHtml(report);
                htmlContent = `<div class="report-section"><div class="analysis-content">${convertedContent}</div></div>`;
            } else if (report.analysis) {
                // Convert markdown analysis to HTML
                const convertedAnalysis = this.markdownToHtml(report.analysis);
                
                htmlContent = `
                    <div class="report-section">
                        <div class="report-header">
                            <h2 class="report-title">${report.title || 'Análise de Humor'}</h2>
                            ${report.subtitle ? `<p class="report-subtitle">${report.subtitle}</p>` : ''}
                        </div>
                        <div class="analysis-content">${convertedAnalysis}</div>
                        ${report.recommendations && report.recommendations.length > 0 ? `
                            <div class="recommendations">
                                <h3>💡 Recomendações Personalizadas</h3>
                                <ul class="recommendation-list">
                                    ${report.recommendations.map(r => `<li>${this.markdownToHtml(r)}</li>`).join('')}
                                </ul>
                            </div>
                        ` : ''}
                        ${report.insights && report.insights.length > 0 ? `
                            <div class="insights">
                                <h3>🌟 Insights Importantes</h3>
                                <ul class="insight-list">
                                    ${report.insights.map(i => `<li>${this.markdownToHtml(i)}</li>`).join('')}
                                </ul>
                            </div>
                        ` : ''}
                        ${report.disclaimer ? `
                            <div class="disclaimer">
                                <h4>⚠️ Importante</h4>
                                <p>${this.markdownToHtml(report.disclaimer)}</p>
                            </div>
                        ` : ''}
                    </div>
                `;
            } else {
                htmlContent = `<div class="report-section"><div class="analysis-content">${JSON.stringify(report, null, 2)}</div></div>`;
            }

            content.innerHTML = htmlContent;
            console.log('📊 Relatório exibido e formatado:', report);
        } else {
            console.error('❌ Elemento report-content não encontrado');
        }
    }

    // ===== MODALS =====
    showDeleteEntryModal(entryId) {
        const modal = document.getElementById('delete-entry-modal');
        if (!modal) return;

        modal.classList.add('active');
        modal._entryId = entryId; // Store entry ID for confirmation
    }

    showDeleteAllDataModal() {
        const modal = document.getElementById('delete-all-modal');
        if (!modal) return;

        modal.classList.add('active');
    }

    hideDeleteModals() {
        document.querySelectorAll('.delete-modal').forEach(modal => {
            modal.classList.remove('active');
        });
    }

    async deleteEntry(entryId) {
        try {
            console.log('🗑️ Deletando entrada:', entryId);
            await window.mentalStorage.deleteEntry(entryId);

            this.showToast('Dados excluídos com sucesso. Respeitamos seu direito à privacidade.', 'success', 5000);

            // Reload data and update UI
            await this.loadData();

        } catch (error) {
            console.error('❌ Erro ao deletar entrada:', error);
            this.showToast('Erro ao excluir dados. Tente novamente.', 'error');
        }
    }

    async deleteAllData() {
        try {
            console.log('🗑️ Deletando TODOS os dados...');

            // Show loading state
            this.showToast('Excluindo todos os dados...', 'info');

            await window.mentalStorage.deleteAllEntries();

            this.showToast('Todos os dados foram excluídos permanentemente. Respeitamos seu direito à privacidade.', 'success', 6000);

            // Clear chart and reload data (will show empty state)
            if (this.chart) {
                this.chart.destroy();
                this.chart = null;
            }

            await this.loadData();

            // Redirect to welcome screen
            setTimeout(() => {
                this.showScreen('welcome');
            }, 2000);

        } catch (error) {
            console.error('❌ Erro ao deletar todos os dados:', error);
            this.showToast('Erro ao excluir dados. Tente novamente.', 'error');
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
        console.log('🧭 showScreen chamado com:', screenName, 'Timestamp:', Date.now());
        console.log('🧭 Estado atual da aplicação:', {
            currentScreen: this.currentScreen,
            isPremium: this.isPremium,
            dataLoaded: !!this.data
        });

        // Hide all screens
        document.querySelectorAll('.screen').forEach(screen => {
            console.log('🧭 Escondendo tela:', screen.id);
            screen.classList.remove('active');
        });

        // Show target screen
        const target = document.getElementById(`${screenName}-screen`);
        console.log('🧭 Tela alvo encontrada:', !!target, `${screenName}-screen`, target);

        if (target) {
            console.log('🧭 Ativando tela:', screenName);
            target.classList.add('active');
            this.currentScreen = screenName;
            console.log('✅ Tela ativada:', screenName);
        } else {
            console.error('❌ Tela não encontrada:', `${screenName}-screen`);
            console.log('🧭 Telas disponíveis no DOM:', Array.from(document.querySelectorAll('.screen')).map(s => s.id));
        }

        // Update navigation
        document.querySelectorAll('.nav-btn').forEach(btn => {
            const isActive = btn.dataset.screen === screenName;
            console.log('🧭 Atualizando botão nav:', btn.dataset.screen, 'ativo:', isActive);
            btn.classList.toggle('active', isActive);
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
    showToast(message, type = 'info', duration = 5000) {
        console.log('🔥 showToast chamado:', { message, type, duration });
        
        // Create toast container if it doesn't exist
        let container = document.getElementById('toast-container');
        if (!container) {
            console.log('📦 Criando container de toast...');
            container = document.createElement('div');
            container.id = 'toast-container';
            container.className = 'toast-container';
            document.body.appendChild(container);
            console.log('✅ Container criado e adicionado ao body');
        } else {
            console.log('📦 Container já existe');
        }

        // Create toast element
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        
        // Unique ID for each toast
        const toastId = 'toast-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
        toast.id = toastId;

        // Add icon based on type
        const iconMap = {
            success: '✅',
            error: '❌',
            warning: '⚠️',
            info: '💬'
        };

        toast.innerHTML = `
            <div class="toast-content">
                <span class="toast-icon">${iconMap[type] || iconMap.info}</span>
                <span class="toast-message">${message}</span>
                <button class="toast-close" aria-label="Fechar mensagem">×</button>
                <div class="toast-progress"></div>
            </div>
            <div class="toast-swipe-indicator">← Arraste para dispensar</div>
        `;

        // Add to container (newest on top)
        container.insertBefore(toast, container.firstChild);

        // Setup drag functionality and other interactions
        this.setupToastInteractions(toast, duration);

        // Trigger show animation
        requestAnimationFrame(() => {
            console.log('🎬 Adicionando classe toast-show ao toast:', toastId);
            toast.classList.add('toast-show');
            console.log('✅ Classe toast-show adicionada, toast deve estar visível');
            
            // Debug: verificar se o toast está visível após adicionar a classe
            setTimeout(() => {
                const computedStyle = window.getComputedStyle(toast);
                console.log('🔍 Debug toast visibility:', {
                    id: toastId,
                    display: computedStyle.display,
                    visibility: computedStyle.visibility,
                    opacity: computedStyle.opacity,
                    transform: computedStyle.transform,
                    classes: toast.className,
                    containerExists: !!document.getElementById('toast-container')
                });
            }, 100);
        });

        console.log('💬 Toast exibido:', { message, type, id: toastId });
        return toast;
    }

    setupToastInteractions(toast, duration) {
        let startX = 0;
        let currentX = 0;
        let isDragging = false;
        let autoRemoveTimer = null;
        let progressTimer = null;
        
        const progressBar = toast.querySelector('.toast-progress');
        const closeBtn = toast.querySelector('.toast-close');
        const swipeIndicator = toast.querySelector('.toast-swipe-indicator');
        
        // Progress bar animation
        if (progressBar && duration > 0) {
            progressBar.style.animationDuration = duration + 'ms';
        }
        
        // Auto remove timer
        if (duration > 0) {
            autoRemoveTimer = setTimeout(() => {
                this.removeToast(toast);
            }, duration);
        }
        
        // Close button
        closeBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            if (autoRemoveTimer) clearTimeout(autoRemoveTimer);
            this.removeToast(toast);
        });
        
        // Touch/Mouse drag events
        const startDrag = (e) => {
            const clientX = e.touches ? e.touches[0].clientX : e.clientX;
            startX = clientX;
            currentX = clientX;
            isDragging = true;
            
            toast.classList.add('toast-dragging');
            swipeIndicator.style.opacity = '1';
            
            // Pause auto-remove while dragging
            if (autoRemoveTimer) {
                clearTimeout(autoRemoveTimer);
                autoRemoveTimer = null;
            }
            
            e.preventDefault();
        };
        
        const doDrag = (e) => {
            if (!isDragging) return;
            
            const clientX = e.touches ? e.touches[0].clientX : e.clientX;
            currentX = clientX;
            const deltaX = currentX - startX;
            
            // Only allow left swipe (negative delta)
            if (deltaX <= 0) {
                const opacity = Math.max(0.3, 1 + deltaX / 200);
                toast.style.transform = `translateX(${deltaX}px)`;
                toast.style.opacity = opacity;
                
                // Show swipe progress
                const swipeProgress = Math.min(100, Math.abs(deltaX) / 2);
                swipeIndicator.style.background = `linear-gradient(90deg, 
                    rgba(255,0,0,0.3) 0%, 
                    rgba(255,0,0,0.3) ${swipeProgress}%, 
                    transparent ${swipeProgress}%)`;
            }
        };
        
        const endDrag = (e) => {
            if (!isDragging) return;
            
            const deltaX = currentX - startX;
            isDragging = false;
            
            toast.classList.remove('toast-dragging');
            swipeIndicator.style.opacity = '0';
            
            // If swiped far enough (more than 100px), remove
            if (deltaX < -100) {
                toast.style.transform = 'translateX(-100%)';
                toast.style.opacity = '0';
                setTimeout(() => this.removeToast(toast), 200);
            } else {
                // Snap back
                toast.style.transform = 'translateX(0)';
                toast.style.opacity = '1';
                
                // Resume auto-remove timer if duration was set
                if (duration > 0) {
                    const remainingTime = duration * 0.7; // Give some extra time
                    autoRemoveTimer = setTimeout(() => {
                        this.removeToast(toast);
                    }, remainingTime);
                }
            }
            
            swipeIndicator.style.background = '';
        };
        
        // Mouse events
        toast.addEventListener('mousedown', startDrag);
        document.addEventListener('mousemove', doDrag);
        document.addEventListener('mouseup', endDrag);
        
        // Touch events
        toast.addEventListener('touchstart', startDrag, { passive: false });
        toast.addEventListener('touchmove', doDrag, { passive: false });
        toast.addEventListener('touchend', endDrag);
        
        // Hover pause
        toast.addEventListener('mouseenter', () => {
            if (autoRemoveTimer) {
                clearTimeout(autoRemoveTimer);
                autoRemoveTimer = null;
            }
            progressBar?.style.setProperty('animation-play-state', 'paused');
        });
        
        toast.addEventListener('mouseleave', () => {
            if (duration > 0 && !isDragging) {
                const remainingTime = duration * 0.5;
                autoRemoveTimer = setTimeout(() => {
                    this.removeToast(toast);
                }, remainingTime);
            }
            progressBar?.style.setProperty('animation-play-state', 'running');
        });
        
        // Clean up function
        toast._cleanup = () => {
            if (autoRemoveTimer) clearTimeout(autoRemoveTimer);
            if (progressTimer) clearTimeout(progressTimer);
            
            // Remove event listeners
            document.removeEventListener('mousemove', doDrag);
            document.removeEventListener('mouseup', endDrag);
        };
    }
    
    removeToast(toast) {
        console.log('🗑️ Removendo toast:', toast.id);
        
        if (!toast || !toast.parentElement) {
            console.log('❌ Toast já foi removido ou não existe');
            return;
        }
        
        // Clean up timers and events
        if (toast._cleanup) {
            toast._cleanup();
        }
        
        // Animate out
        toast.classList.remove('toast-show');
        toast.classList.add('toast-hide');
        
        setTimeout(() => {
            if (toast.parentElement) {
                toast.remove();
                console.log('✅ Toast removido do DOM:', toast.id);
            }
        }, 300);
        
        console.log('💬 Toast removido:', toast.id);
    }

    // 🔥 CORREÇÃO: Função para exibir relatório quando não há dados
    displayEmptyReport() {
        console.log('📝 Exibindo relatório vazio...');
        
        const reportContent = document.getElementById('report-content');
        if (!reportContent) {
            console.error('❌ Container de relatório não encontrado');
            return;
        }
        
        // Limpar conteúdo anterior
        reportContent.innerHTML = '';
        
        // Criar relatório vazio amigável
        const emptyReport = document.createElement('div');
        emptyReport.className = 'empty-report';
        emptyReport.innerHTML = `
            <div class="empty-report-header">
                <h3>📝 Seu Relatório de Bem-Estar</h3>
                <p class="empty-report-subtitle">Comece registrando seu humor para receber análises personalizadas</p>
                <span class="empty-report-date">${new Date().toLocaleDateString('pt-BR')}</span>
            </div>
            
            <div class="empty-report-content">
                <div class="empty-state">
                    <div class="empty-icon">🌟</div>
                    <h4>Primeiro passo para uma vida mais equilibrada</h4>
                    <p>Registre como você está se sentindo hoje para começar a construir seu histórico de bem-estar mental.</p>
                    
                    <div class="quick-start-guide">
                        <h5>Como funciona:</h5>
                        <ol>
                            <li><strong>Registre seu humor</strong> - Use a tela inicial para anotar como está se sentindo</li>
                            <li><strong>Adicione detalhes</strong> - Descreva o que aconteceu no seu dia</li>
                            <li><strong>Receba análises</strong> - Nossa IA criará relatórios personalizados para você</li>
                        </ol>
                    </div>
                    
                    <div class="empty-actions">
                        <button class="btn-primary" onclick="window.mentalIA?.showScreen('welcome')" style="margin: 10px;">
                            📊 Registrar Primeiro Humor
                        </button>
                    </div>
                </div>
            </div>
            
            <div class="empty-report-footer">
                <p><small>💡 <strong>Dica:</strong> Registre seu humor regularmente para obter insights mais precisos sobre seus padrões emocionais.</small></p>
            </div>
        `;
        
        // Adicionar estilos inline para garantir boa aparência
        const style = document.createElement('style');
        style.textContent = `
            .empty-report {
                padding: 20px;
                text-align: center;
                background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
                border-radius: 12px;
                margin: 10px 0;
                box-shadow: 0 4px 6px rgba(0,0,0,0.1);
            }
            
            .empty-report-header h3 {
                color: #2c3e50;
                margin-bottom: 5px;
            }
            
            .empty-report-subtitle {
                color: #7f8c8d;
                margin-bottom: 10px;
            }
            
            .empty-state {
                background: white;
                padding: 30px 20px;
                border-radius: 8px;
                margin: 20px 0;
                box-shadow: 0 2px 4px rgba(0,0,0,0.05);
            }
            
            .empty-icon {
                font-size: 48px;
                margin-bottom: 15px;
            }
            
            .quick-start-guide {
                text-align: left;
                max-width: 400px;
                margin: 20px auto;
                padding: 15px;
                background: #f8f9fa;
                border-radius: 6px;
            }
            
            .quick-start-guide ol {
                margin: 10px 0;
                padding-left: 20px;
            }
            
            .quick-start-guide li {
                margin: 8px 0;
                line-height: 1.4;
            }
            
            .empty-actions {
                margin: 20px 0;
            }
            
            .empty-report-footer {
                margin-top: 20px;
                padding-top: 15px;
                border-top: 1px solid rgba(0,0,0,0.1);
            }
            
            @media (max-width: 768px) {
                .empty-report {
                    padding: 15px;
                    margin: 5px 0;
                }
                
                .empty-state {
                    padding: 20px 15px;
                }
                
                .quick-start-guide {
                    max-width: none;
                }
            }
        `;
        
        // Adicionar estilo e conteúdo
        document.head.appendChild(style);
        reportContent.appendChild(emptyReport);
        
        // Mostrar o container
        reportContent.classList.remove('hidden');
        
        console.log('📝 Relatório vazio exibido com sucesso');
    }

    // 🔥 CORREÇÃO: Função para exibir análise avançada
    displayAdvancedAnalysis(analysis) {
        console.log('🧠 Exibindo análise avançada:', analysis);
        
        const reportContent = document.getElementById('report-content');
        if (!reportContent) {
            console.error('❌ Container de relatório não encontrado');
            return;
        }
        
        // Limpar conteúdo anterior
        reportContent.innerHTML = '';
        
        // Criar header da análise
        const header = document.createElement('div');
        header.className = 'analysis-header';
        header.innerHTML = `
            <h3>🧠 Análise Avançada por IA</h3>
            <p class="analysis-subtitle">${analysis.subtitle || 'Relatório Personalizado'}</p>
            <span class="analysis-date">${new Date().toLocaleDateString('pt-BR')}</span>
        `;
        
        // Criar conteúdo da análise
        const content = document.createElement('div');
        content.className = 'analysis-content';
        content.innerHTML = analysis.content || analysis.analysis || 'Análise em processamento...';
        
        // Adicionar disclaimer
        const disclaimer = document.createElement('div');
        disclaimer.className = 'analysis-disclaimer';
        disclaimer.innerHTML = `
            <p><strong>⚠️ Importante:</strong> ${analysis.disclaimer || 'Esta análise foi gerada por IA e não substitui acompanhamento profissional de saúde mental.'}</p>
        `;
        
        // Montar tudo
        reportContent.appendChild(header);
        reportContent.appendChild(content);
        reportContent.appendChild(disclaimer);
        
        // Mostrar o container
        reportContent.classList.remove('hidden');
        
        // Scroll para o relatório
        reportContent.scrollIntoView({ behavior: 'smooth' });
        
        this.showToast('✅ Análise avançada gerada com sucesso!', 'success');
    }

    // ===== BACKUP SYSTEM =====
    async backupData() {
        try {
            console.log('💾 Iniciando backup de dados...');

            // Verificar se o sistema de backup está disponível
            if (!window.googleDriveBackup) {
                throw new Error('Sistema de backup não disponível');
            }

            // Verificar se o usuário está conectado ao Google Drive
            if (!window.googleDriveBackup.isSignedIn) {
                this.showToast('🔗 Conecte-se ao Google Drive primeiro usando o botão "Conectar Google Drive"', 'warning');
                return;
            }

            // Mostrar feedback visual
            this.showToast('🔄 Fazendo backup seguro...', 'info');

            // Iniciar backup
            await window.googleDriveBackup.backupToDrive();

            // Salvar timestamp do backup manual
            localStorage.setItem('lastManualBackup', new Date().toISOString());

            // Feedback de sucesso
            this.showToast('✅ Backup realizado com sucesso!', 'success');

        } catch (error) {
            console.error('❌ Erro no backup:', error);

            // Feedback de erro
            this.showToast('❌ Erro no backup: ' + error.message, 'error');
        }
    }

    // Update auto backup status in UI
    updateAutoBackupStatus() {
        if (!window.googleDriveBackup) return;

        const toggle = document.getElementById('auto-backup-toggle');
        const lastBackupText = document.getElementById('last-backup-text');
        const nextBackupText = document.getElementById('next-backup-text');
        const lastManualBackupInfo = document.getElementById('last-manual-backup-info');

        if (toggle) {
            toggle.checked = window.googleDriveBackup.isAutoBackupEnabled();
        }

        // Atualizar informações de backup automático
        if (lastBackupText) {
            const lastBackup = localStorage.getItem('lastAutoBackup');
            if (lastBackup) {
                const date = new Date(lastBackup);
                lastBackupText.textContent = `Último backup automático: ${date.toLocaleDateString('pt-BR')} às ${date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;
            } else {
                lastBackupText.textContent = 'Último backup automático: Nunca';
            }
        }

        if (nextBackupText) {
            const nextBackup = new Date();
            nextBackup.setHours(7, 0, 0, 0);
            if (nextBackup <= new Date()) {
                nextBackup.setDate(nextBackup.getDate() + 1);
            }
            nextBackupText.textContent = `Próximo backup automático: ${nextBackup.toLocaleDateString('pt-BR')} às 07:00`;
        }

        // Atualizar informações de backup manual
        if (lastManualBackupInfo) {
            const lastManualBackup = localStorage.getItem('lastManualBackup');
            const infoIcon = lastManualBackupInfo.querySelector('.info-icon');
            const infoText = lastManualBackupInfo.querySelector('.info-text');

            if (lastManualBackup) {
                const date = new Date(lastManualBackup);
                if (infoIcon) infoIcon.textContent = '✅';
                if (infoText) infoText.textContent = `Último backup manual: ${date.toLocaleDateString('pt-BR')} às ${date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;
                lastManualBackupInfo.style.display = 'flex';
            } else {
                if (infoIcon) infoIcon.textContent = '⏳';
                if (infoText) infoText.textContent = 'Nenhum backup manual realizado ainda';
                lastManualBackupInfo.style.display = 'flex';
            }
        }
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

// Tratamento global de promises rejeitadas
window.addEventListener('unhandledrejection', function(event) {
    console.warn('⚠️ Promise rejeitada não tratada:', event.reason);
    // Previne que o erro apareça no console como não tratado
    event.preventDefault();
});

// Tratamento global de erros não capturados
window.addEventListener('error', function(event) {
    console.error('❌ Erro não capturado:', event.error);
});