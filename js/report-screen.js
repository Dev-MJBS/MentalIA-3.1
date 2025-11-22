/**
 * MentalIA 3.1 - Report Screen JavaScript
 * Modern animations and interactions for the report screen
 */

class ReportScreenManager {
    constructor() {
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.setupAnimations();
        this.updateReportDate();
    }

    setupEventListeners() {
        console.log('🎯 ReportScreenManager: Configurando event listeners...');

        // Generate new report button
        const generateNewBtn = document.getElementById('generate-new-report');
        if (generateNewBtn) {
            generateNewBtn.addEventListener('click', () => {
                this.generateNewReport();
            });
        }

        // Back to history button
        const backBtn = document.getElementById('back-to-history');
        if (backBtn) {
            backBtn.addEventListener('click', () => {
                if (window.mentalIA) {
                    window.mentalIA.showScreen('history');
                }
            });
        }

        // Share report button
        const shareBtn = document.getElementById('share-report');
        if (shareBtn) {
            console.log('🎯 ReportScreenManager: Botão share-report encontrado, adicionando listener');
            shareBtn.addEventListener('click', () => {
                console.log('🎯 ReportScreenManager: Botão share-report clicado!');
                this.shareReport();
            });
        } else {
            console.log('❌ ReportScreenManager: Botão share-report NÃO encontrado');
        }

        // Export PDF button
        const exportPdfBtn = document.getElementById('export-pdf');
        if (exportPdfBtn) {
            console.log('🎯 ReportScreenManager: Botão export-pdf encontrado, adicionando listener');
            exportPdfBtn.addEventListener('click', () => {
                console.log('🎯 ReportScreenManager: Botão export-pdf clicado!');
                this.exportPdf();
            });
        } else {
            console.log('❌ ReportScreenManager: Botão export-pdf NÃO encontrado');
        }

        console.log('✅ ReportScreenManager: Event listeners configurados');
    }

    setupAnimations() {
        // Add card index for staggered animations
        const cards = document.querySelectorAll('.report-card');
        cards.forEach((card, index) => {
            card.style.setProperty('--card-index', index);
        });

        // Observe when report content becomes visible
        const reportContent = document.getElementById('report-content');
        if (reportContent) {
            const observer = new MutationObserver((mutations) => {
                mutations.forEach((mutation) => {
                    if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
                        if (!reportContent.classList.contains('hidden')) {
                            this.onReportVisible();
                        }
                    }
                });
            });

            observer.observe(reportContent, {
                attributes: true,
                attributeFilter: ['class']
            });
        }
    }

    onReportVisible() {
        // Trigger entrance animations
        this.animateCards();
        this.animateMoodCircle();
    }

    animateCards() {
        const cards = document.querySelectorAll('.report-card');
        cards.forEach((card, index) => {
            setTimeout(() => {
                card.style.animationPlayState = 'running';
            }, index * 100);
        });
    }

    animateMoodCircle() {
        const moodCircle = document.querySelector('.mood-circle');
        if (moodCircle) {
            // Add a subtle pulse animation
            moodCircle.style.animation = 'moodPulse 2s ease-in-out infinite';
        }
    }

    updateReportDate() {
        const dateElement = document.getElementById('report-date-display');
        if (dateElement) {
            const now = new Date();
            const options = {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            };
            dateElement.textContent = now.toLocaleDateString('pt-BR', options);
        }
    }

    generateNewReport() {
        const generateBtn = document.getElementById('generate-report');
        if (generateBtn) {
            // Trigger the existing generate report functionality
            generateBtn.click();
        }
    }

    shareReport() {
        if (navigator.share) {
            // Use Web Share API if available
            navigator.share({
                title: 'Meu Relatório MentalIA',
                text: 'Confira meu relatório de bem-estar emocional gerado pelo MentalIA!',
                url: window.location.href
            }).catch(console.error);
        } else {
            // Fallback: copy URL to clipboard
            navigator.clipboard.writeText(window.location.href).then(() => {
                this.showToast('Link copiado para a área de transferência!', 'success');
            }).catch(() => {
                this.showToast('Compartilhamento não suportado neste navegador', 'warning');
            });
        }
    }

    exportPdf() {
        // Trigger existing PDF export functionality
        if (window.aiAnalysis && window.aiAnalysis.downloadReportPDF) {
            window.aiAnalysis.downloadReportPDF();
        } else {
            this.showToast('Funcionalidade de PDF não disponível', 'error');
        }
    }

    showToast(message, type = 'info') {
        if (window.mentalIA && window.mentalIA.showToast) {
            window.mentalIA.showToast(message, type);
        } else {
            // Fallback toast
            console.log(`[${type.toUpperCase()}] ${message}`);
        }
    }

    // Utility method to format report data for display
    formatReportData(data) {
        if (!data) return;

        // Update mood circle
        const moodCircle = document.querySelector('.mood-circle');
        if (moodCircle && data.mood) {
            const moodValue = moodCircle.querySelector('.mood-value');
            const moodLabel = moodCircle.querySelector('.mood-label');

            if (moodValue) moodValue.textContent = data.mood.toFixed(1);

            // Determine mood label based on value
            let label = 'Neutro';
            if (data.mood <= 1.5) label = 'Muito Baixo';
            else if (data.mood <= 2.5) label = 'Baixo';
            else if (data.mood <= 3.5) label = 'Neutro';
            else if (data.mood <= 4.5) label = 'Alto';
            else label = 'Muito Alto';

            if (moodLabel) moodLabel.textContent = label;
        }

        // Update general analysis
        const generalAnalysis = document.getElementById('general-analysis');
        if (generalAnalysis && data.general) {
            generalAnalysis.innerHTML = this.formatMarkdown(data.general);
        }

        // Update patterns
        const patternsAnalysis = document.getElementById('patterns-analysis');
        if (patternsAnalysis && data.patterns) {
            patternsAnalysis.innerHTML = this.formatPatterns(data.patterns);
        }

        // Update triggers
        const triggersAnalysis = document.getElementById('triggers-analysis');
        if (triggersAnalysis && data.triggers) {
            triggersAnalysis.innerHTML = this.formatTriggers(data.triggers);
        }

        // Update recommendations
        const recommendations = document.getElementById('recommendations');
        if (recommendations && data.recommendations) {
            recommendations.innerHTML = this.formatRecommendations(data.recommendations);
        }
    }

    formatMarkdown(text) {
        if (!text) return '';
        // Simple markdown formatting
        return text
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            .replace(/\n/g, '<br>');
    }

    formatPatterns(patterns) {
        if (!Array.isArray(patterns)) return '';

        return patterns.map(pattern => `
            <div class="pattern-item">
                <span class="pattern-emoji">📊</span>
                <span class="pattern-text">${this.formatMarkdown(pattern)}</span>
            </div>
        `).join('');
    }

    formatTriggers(triggers) {
        if (!Array.isArray(triggers)) return '';

        return triggers.map(trigger => `
            <div class="trigger-item">
                <span class="trigger-emoji">⚠️</span>
                <span class="trigger-text">${this.formatMarkdown(trigger)}</span>
            </div>
        `).join('');
    }

    formatRecommendations(recommendations) {
        if (!Array.isArray(recommendations)) return '';

        return recommendations.map((rec, index) => `
            <div class="recommendation-item">
                <span class="recommendation-number">${index + 1}</span>
                <span class="recommendation-text">${this.formatMarkdown(rec)}</span>
            </div>
        `).join('');
    }
}

// CSS Animations (added via JavaScript for dynamic control)
const style = document.createElement('style');
style.textContent = `
    @keyframes moodPulse {
        0%, 100% { transform: scale(1); }
        50% { transform: scale(1.05); }
    }

    .report-card {
        animation-play-state: paused;
    }

    .report-card.animate {
        animation-play-state: running;
    }
`;
document.head.appendChild(style);

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    // Initialize report screen manager after MentalIA is ready
    const initReportScreen = () => {
        if (window.mentalIA) {
            window.reportScreenManager = new ReportScreenManager();
            console.log('📊 Report Screen Manager initialized');
        } else {
            setTimeout(initReportScreen, 100);
        }
    };

    initReportScreen();
});

// Export for global access
window.ReportScreenManager = ReportScreenManager;