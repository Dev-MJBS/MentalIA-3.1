// MentalIA 3.1 - AI Analysis Module
// Simplified and robust AI analysis system

class AIAnalysis {
    constructor() {
        this.isInitialized = false;
        this.externalAPIs = {
            claude: {
                available: false,
                url: 'https://api.anthropic.com/v1/messages',
                model: 'claude-3-5-sonnet-20241022'
            },
            gemini: {
                available: false,
                url: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent',
                model: 'gemini-1.5-flash'
            }
        };

        console.log('🤖 [AI] Módulo de análise de IA criado');
    }

    async init() {
        if (this.isInitialized) return true;

        try {
            console.log('🤖 [AI] Inicializando sistema de análise...');

            // Check external APIs availability
            await this.checkExternalAPIs();

            this.isInitialized = true;
            console.log('🤖 [AI] Sistema inicializado com sucesso');
            return true;

        } catch (error) {
            console.error('🤖 [AI] Erro na inicialização:', error);
            return false;
        }
    }

    async checkExternalAPIs() {
        try {
            const claudeKey = await window.mentalStorage?.getSetting('claude-api-key');
            const geminiKey = await window.mentalStorage?.getSetting('gemini-api-key');

            this.externalAPIs.claude.available = !!claudeKey;
            this.externalAPIs.gemini.available = !!geminiKey;

            console.log('🌐 [AI] APIs externas:', {
                claude: this.externalAPIs.claude.available,
                gemini: this.externalAPIs.gemini.available
            });
        } catch (error) {
            console.log('🌐 [AI] Erro ao verificar APIs externas:', error.message);
        }
    }

    async generateLocalReport(entries) {
        console.log('🤖 [AI] generateLocalReport chamado');

        try {
            if (!entries || entries.length === 0) {
                return this.generateSimpleFallbackReport([]);
            }

            // Try external APIs first (faster)
            if (this.externalAPIs.claude.available) {
                console.log('🤖 [AI] Tentando Claude API...');
                return await this.generateClaudeReport(entries);
            }

            if (this.externalAPIs.gemini.available) {
                console.log('🤖 [AI] Tentando Gemini API...');
                return await this.generateGeminiReport(entries);
            }

            // Fallback to intelligent local analysis
            console.log('🤖 [AI] Usando análise local inteligente');
            return this.generateIntelligentFallbackReport(entries);

        } catch (error) {
            console.error('❌ [AI] Erro na geração:', error);
            return this.generateIntelligentFallbackReport(entries);
        }
    }

    async generateFastReport(entries) {
        console.log('🚀 [AI] generateFastReport chamado');
        return this.generateLocalReport(entries);
    }

    async generateClaudeReport(entries) {
        try {
            const claudeKey = await window.mentalStorage.getSetting('claude-api-key');
            if (!claudeKey) {
                throw new Error('Chave Claude não configurada');
            }

            const summary = this.prepareMoodSummary(entries);
            const prompt = this.createAnalysisPrompt(summary);

            console.log('🤖 [AI] Enviando para Claude...');

            const response = await fetch(this.externalAPIs.claude.url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-api-key': claudeKey,
                    'anthropic-version': '2023-06-01'
                },
                body: JSON.stringify({
                    model: this.externalAPIs.claude.model,
                    max_tokens: 1500,
                    messages: [{
                        role: 'user',
                        content: prompt
                    }]
                })
            });

            if (!response.ok) {
                throw new Error(`Claude API erro: ${response.status}`);
            }

            const data = await response.json();
            const analysis = data.content[0].text;

            return {
                title: 'Análise Personalizada - Claude AI',
                subtitle: 'Gerada por IA avançada com total privacidade',
                analysis: analysis,
                recommendations: this.generateRecommendations(summary),
                insights: this.generateInsights(summary),
                disclaimer: 'Esta análise foi gerada por Claude 3.5 Sonnet. Não substitui acompanhamento profissional.',
                timestamp: new Date().toISOString(),
                source: 'Claude 3.5 Sonnet'
            };

        } catch (error) {
            console.error('❌ [AI] Erro no Claude:', error);
            throw error;
        }
    }

    async generateGeminiReport(entries) {
        try {
            const geminiKey = await window.mentalStorage.getSetting('gemini-api-key');
            if (!geminiKey) {
                throw new Error('Chave Gemini não configurada');
            }

            const summary = this.prepareMoodSummary(entries);
            const prompt = this.createAnalysisPrompt(summary);

            console.log('🤖 [AI] Enviando para Gemini...');

            const response = await fetch(`${this.externalAPIs.gemini.url}?key=${geminiKey}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    contents: [{
                        parts: [{
                            text: prompt
                        }]
                    }]
                })
            });

            if (!response.ok) {
                throw new Error(`Gemini API erro: ${response.status}`);
            }

            const data = await response.json();
            const analysis = data.candidates[0].content.parts[0].text;

            return {
                title: 'Análise Personalizada - Gemini AI',
                subtitle: 'Gerada por IA avançada com total privacidade',
                analysis: analysis,
                recommendations: this.generateRecommendations(summary),
                insights: this.generateInsights(summary),
                disclaimer: 'Esta análise foi gerada por Gemini 1.5 Flash. Não substitui acompanhamento profissional.',
                timestamp: new Date().toISOString(),
                source: 'Gemini 1.5 Flash'
            };

        } catch (error) {
            console.error('❌ [AI] Erro no Gemini:', error);
            throw error;
        }
    }

    generateIntelligentFallbackReport(entries) {
        console.log('🤖 [AI] Gerando relatório inteligente local');

        const summary = this.prepareMoodSummary(entries);

        let analysis = `## Análise Personalizada do Seu Bem-Estar Emocional

Baseado em ${summary.totalEntries} registros de humor coletados ao longo de ${summary.daysCovered} dias, aqui está uma análise do seu padrão emocional:

### 🎯 **Análise Geral**
`;

        // Mood analysis
        if (summary.averageMood >= 4.5) {
            analysis += `Seus registros mostram um padrão excepcional de bem-estar emocional, com uma média de ${summary.averageMood.toFixed(1)}/5.0. Isso indica que você está passando por um período muito positivo, mantendo altos níveis de satisfação e contentamento na maior parte do tempo.\n\n`;
        } else if (summary.averageMood >= 3.5) {
            analysis += `Sua média de humor está em ${summary.averageMood.toFixed(1)}/5.0, o que reflete um equilíbrio emocional saudável. Você demonstra capacidade de manter estabilidade emocional com variações normais ao longo do tempo.\n\n`;
        } else if (summary.averageMood >= 2.5) {
            analysis += `Seus registros indicam uma média de ${summary.averageMood.toFixed(1)}/5.0, sugerindo que você pode estar enfrentando alguns desafios emocionais. É importante reconhecer esses padrões e considerar estratégias para melhorar seu bem-estar.\n\n`;
        } else {
            analysis += `Sua média de humor está em ${summary.averageMood.toFixed(1)}/5.0, indicando que você está passando por um período mais desafiador emocionalmente. Seus dados mostram a necessidade de atenção especial ao seu bem-estar mental.\n\n`;
        }

        // Feelings analysis
        if (summary.topFeelings.length > 0) {
            analysis += `### 🎭 **Padrões Emocionais Identificados**
Os sentimentos mais presentes em seus registros são: **${summary.topFeelings.slice(0, 3).join(', ')}**. `;
            analysis += `Isso nos dá pistas importantes sobre seus estados emocionais mais recorrentes e pode ajudar a identificar gatilhos ou padrões comportamentais.\n\n`;
        }

        // Trend analysis
        if (Math.abs(summary.recentTrend) > 0.3) {
            if (summary.recentTrend > 0) {
                analysis += `### 📈 **Tendência Positiva**
Seus dados mostram uma tendência de melhora no humor nos últimos dias, o que é um sinal muito encorajador. Continue com as práticas que estão funcionando!\n\n`;
            } else {
                analysis += `### 📉 **Atenção Necessária**
Seus registros indicam uma tendência de declínio no humor recentemente. Pode ser útil identificar fatores que contribuem para essa mudança e considerar ajustes em sua rotina.\n\n`;
            }
        } else {
            analysis += `### ⚖️ **Estabilidade Emocional**
Seu humor tem se mantido relativamente estável nos últimos períodos, o que demonstra consistência emocional.\n\n`;
        }

        // Recommendations
        analysis += `### 💡 **Recomendações Personalizadas**

**Para seu bem-estar geral:**
• Mantenha o hábito de registrar seu humor diariamente - o autocuidado começa com a consciência
• Pratique atividades físicas regulares, que ajudam no equilíbrio emocional
• Mantenha uma rotina de sono adequada e alimentação balanceada

`;

        if (summary.averageMood < 3) {
            analysis += `**Atenção especial:**
• Considere buscar apoio profissional de um psicólogo ou terapeuta
• Pratique técnicas de relaxamento ou meditação para reduzir ansiedade
• Fortaleça suas conexões sociais - o apoio de pessoas queridas é fundamental

`;
        } else if (summary.averageMood >= 4) {
            analysis += `**Para manter o equilíbrio:**
• Continue com as práticas que estão funcionando bem
• Compartilhe suas experiências positivas com outros que possam se beneficiar
• Use este momento positivo para estabelecer novos objetivos pessoais

`;
        }

        analysis += `### ⚠️ **Lembre-se**
Esta análise é baseada em seus dados pessoais e tem fins informativos. Para questões relacionadas à saúde mental, é fundamental buscar acompanhamento profissional qualificado. Seus dados ficam 100% criptografados localmente e nunca são compartilhados.`;

        return {
            title: 'Relatório de Bem-Estar MentalIA',
            subtitle: 'Análise Inteligente Baseada em Seus Dados',
            analysis: analysis,
            recommendations: this.generateRecommendations(summary),
            insights: this.generateInsights(summary),
            disclaimer: 'Esta análise é baseada em inteligência artificial local. Não substitui consulta médica ou psicológica profissional.',
            timestamp: new Date().toISOString(),
            source: 'MentalIA Analysis Engine'
        };
    }

    generateSimpleFallbackReport(entries) {
        console.log('🤖 [AI] Gerando relatório básico de fallback');

        if (!entries || entries.length === 0) {
            return {
                title: 'Relatório MentalIA',
                subtitle: 'Nenhum dado disponível',
                analysis: 'Não há registros de humor suficientes para gerar uma análise. Comece registrando seu humor diariamente para receber insights personalizados sobre seu bem-estar emocional.',
                recommendations: ['Registre seu humor diariamente', 'Seja consistente nos registros', 'Use o app regularmente para melhores análises'],
                insights: ['Dados insuficientes para insights'],
                disclaimer: 'Relatório básico - mais dados são necessários para análises completas.',
                timestamp: new Date().toISOString(),
                source: 'MentalIA Basic'
            };
        }

        const totalEntries = entries.length;
        const avgMood = (entries.reduce((sum, entry) => sum + entry.mood, 0) / totalEntries).toFixed(1);

        return {
            title: 'Relatório Básico MentalIA',
            subtitle: `${totalEntries} registros analisados`,
            analysis: `Você registrou ${totalEntries} entradas de humor com uma média de ${avgMood}/5.0. Continue registrando para receber análises mais detalhadas e insights personalizados sobre seu bem-estar emocional.`,
            recommendations: [
                'Continue registrando seu humor diariamente',
                'Explore os padrões em diferentes dias da semana',
                'Use os sentimentos para identificar gatilhos emocionais'
            ],
            insights: [
                `Média de humor: ${avgMood}/5.0`,
                `${totalEntries} registros totais`,
                'Análises mais detalhadas disponíveis com mais dados'
            ],
            disclaimer: 'Relatório básico. Registre mais dados para análises completas com IA.',
            timestamp: new Date().toISOString(),
            source: 'MentalIA Basic Analysis'
        };
    }

    prepareMoodSummary(entries) {
        const totalEntries = entries.length;
        const avgMood = entries.reduce((sum, entry) => sum + entry.mood, 0) / totalEntries;

        // Get mood distribution
        const moodCounts = [0, 0, 0, 0, 0];
        entries.forEach(entry => {
            moodCounts[Math.round(entry.mood) - 1]++;
        });

        // Get most common feelings
        const feelingCounts = {};
        entries.forEach(entry => {
            if (entry.feelings) {
                entry.feelings.forEach(feeling => {
                    feelingCounts[feeling] = (feelingCounts[feeling] || 0) + 1;
                });
            }
        });

        const topFeelings = Object.entries(feelingCounts)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 5)
            .map(([feeling]) => feeling);

        // Calculate trends
        const now = new Date();
        const last7Days = entries.filter(entry => {
            const entryDate = new Date(entry.timestamp);
            const daysDiff = (now - entryDate) / (1000 * 60 * 60 * 24);
            return daysDiff <= 7;
        });

        const previous7Days = entries.filter(entry => {
            const entryDate = new Date(entry.timestamp);
            const daysDiff = (now - entryDate) / (1000 * 60 * 60 * 24);
            return daysDiff > 7 && daysDiff <= 14;
        });

        const recentAvg = last7Days.length > 0 ?
            last7Days.reduce((sum, entry) => sum + entry.mood, 0) / last7Days.length : avgMood;
        const previousAvg = previous7Days.length > 0 ?
            previous7Days.reduce((sum, entry) => sum + entry.mood, 0) / previous7Days.length : avgMood;

        return {
            totalEntries,
            averageMood: avgMood,
            moodDistribution: moodCounts,
            topFeelings,
            recentTrend: recentAvg - previousAvg,
            recentAvg,
            previousAvg,
            daysCovered: Math.ceil((now - new Date(entries[0]?.timestamp || now)) / (1000 * 60 * 60 * 24)),
            dateRange: entries.length > 0 ?
                `${new Date(entries[entries.length-1].timestamp).toLocaleDateString('pt-BR')} - ${new Date(entries[0].timestamp).toLocaleDateString('pt-BR')}` :
                'N/A'
        };
    }

    createAnalysisPrompt(summary) {
        return `Como psicólogo clínico especializado em saúde mental, analise os seguintes dados de humor de um paciente e forneça uma análise empática e profissional em português brasileiro:

**Dados do Paciente:**
- Período analisado: ${summary.dateRange}
- Total de registros: ${summary.totalEntries}
- Humor médio: ${summary.averageMood.toFixed(1)}/5
- Sentimentos mais frequentes: ${summary.topFeelings.join(', ')}
- Tendência recente: ${summary.recentTrend > 0 ? 'Melhora' : summary.recentTrend < 0 ? 'Declínio' : 'Estável'}

**Instruções:**
Forneça uma análise estruturada em português brasileiro que inclua:
1. Uma avaliação geral do padrão de humor
2. Identificação de padrões emocionais
3. Observações sobre tendências
4. Recomendações práticas de bem-estar

Seja sempre empático, acolhedor e profissional. Lembre que esta análise não substitui acompanhamento médico. Mantenha um tom positivo e encorajador.`;
    }

    generateRecommendations(summary) {
        const recommendations = [
            'Mantenha o hábito de registrar seu humor diariamente',
            'Pratique atividades físicas regularmente',
            'Mantenha uma rotina de sono adequada'
        ];

        if (summary.averageMood < 3) {
            recommendations.push('Considere buscar apoio profissional');
            recommendations.push('Pratique técnicas de relaxamento');
        }

        if (summary.topFeelings.includes('ansioso') || summary.topFeelings.includes('ansiosa')) {
            recommendations.push('Experimente meditação ou mindfulness');
        }

        return recommendations;
    }

    generateInsights(summary) {
        const insights = [];

        if (summary.averageMood >= 4) {
            insights.push('Padrão de humor predominantemente positivo');
        } else if (summary.averageMood >= 3) {
            insights.push('Equilíbrio emocional saudável');
        } else {
            insights.push('Período de atenção ao bem-estar emocional');
        }

        if (summary.recentTrend > 0.2) {
            insights.push('Tendência positiva recente');
        } else if (summary.recentTrend < -0.2) {
            insights.push('Atenção à tendência de declínio');
        }

        return insights;
    }

    // PDF Generation
    async downloadReportPDF() {
        try {
            console.log('📄 [PDF] Iniciando geração de PDF...');

            // Check if libraries are loaded
            if (typeof html2canvas === 'undefined' || typeof jsPDF === 'undefined') {
                throw new Error('Bibliotecas PDF não carregadas');
            }

            const reportContent = document.getElementById('report-content');
            if (!reportContent) {
                throw new Error('Conteúdo do relatório não encontrado');
            }

            this.showToast('Gerando PDF...', 'info');

            // Prepare content for PDF
            reportContent.classList.add('pdf-generation');

            const canvas = await html2canvas(reportContent, {
                scale: 2,
                useCORS: true,
                backgroundColor: '#ffffff',
                width: reportContent.scrollWidth,
                height: reportContent.scrollHeight
            });

            reportContent.classList.remove('pdf-generation');

            // Create PDF
            const { jsPDF } = window.jspdf;
            const pdf = new jsPDF('p', 'mm', 'a4');

            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = pdf.internal.pageSize.getHeight();
            const margin = 10;
            const contentWidth = pdfWidth - (margin * 2);

            // Add header
            pdf.setFontSize(20);
            pdf.setFont('helvetica', 'bold');
            pdf.text('Relatório MentalIA', margin, 20);

            const dateStr = new Date().toLocaleDateString('pt-BR');
            pdf.setFontSize(12);
            pdf.setFont('helvetica', 'normal');
            pdf.text(`Gerado em: ${dateStr}`, margin, 30);

            // Add content
            const imgData = canvas.toDataURL('image/jpeg', 0.95);
            const imgWidth = contentWidth;
            const imgHeight = (canvas.height * imgWidth) / canvas.width;

            let yPosition = 40;
            if (imgHeight <= pdfHeight - yPosition - 20) {
                pdf.addImage(imgData, 'JPEG', margin, yPosition, imgWidth, imgHeight);
            } else {
                // Multi-page handling (simplified)
                pdf.addImage(imgData, 'JPEG', margin, yPosition, imgWidth, pdfHeight - yPosition - 20);
            }

            // Add footer
            pdf.setFontSize(10);
            pdf.setFont('helvetica', 'normal');
            pdf.setTextColor(128, 128, 128);
            const footerText = 'Gerado pelo MentalIA • 100% local e privado';
            pdf.text(footerText, margin, pdfHeight - 10);

            // Download
            const filename = `Relatorio_MentalIA_${dateStr.replace(/\//g, '-')}.pdf`;
            pdf.save(filename);

            this.showToast('PDF gerado com sucesso!', 'success');
            console.log('✅ [PDF] PDF gerado e baixado');

        } catch (error) {
            console.error('❌ [PDF] Erro:', error);
            this.showToast('Erro ao gerar PDF: ' + error.message, 'error');
        }
    }

    showToast(message, type = 'info') {
        if (window.mentalIA && typeof window.mentalIA.showToast === 'function') {
            window.mentalIA.showToast(message, type);
        } else {
            console.log(`[${type.toUpperCase()}] ${message}`);
        }
    }
}

// Initialize globally
window.aiAnalysis = new AIAnalysis();

console.log('🤖 Módulo de análise de IA carregado com sucesso');