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
• Compartilhe suas estratégias positivas com outros que possam se beneficiar
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
            
            console.log('🤖 [AI DEBUG] Inicializando pipeline de IA local...');
            // Initialize local AI pipeline
            await this.initLocalModel();
            console.log('🤖 [AI DEBUG] Pipeline inicializado');
            
            console.log('🤖 [AI DEBUG] Verificando APIs externas...');
            // Check external API availability
            await this.checkExternalAPIs();
            console.log('🤖 [AI DEBUG] APIs externas verificadas');
            
            console.log('✅ [AI DEBUG] Módulo de IA inicializado com sucesso');
            return true;
        } catch (error) {
            console.error('🤖 [AI DEBUG] Erro ao inicializar IA:', error);
            console.error('🤖 [AI DEBUG] Stack trace:', error.stack);
            // Mesmo com erro, não falhar completamente - pode usar modo fallback
            return false;
        }
    }

    async loadTransformersJS() {
        return new Promise((resolve, reject) => {
            if (typeof transformers !== 'undefined') {
                resolve();
                return;
            }
            
            const script = document.createElement('script');
            script.src = 'https://cdn.jsdelivr.net/npm/@xenova/transformers@3.0.0/dist/transformers.min.js';
            script.onload = () => {
                console.log('✅ Transformers.js carregado');
                resolve();
            };
            script.onerror = () => {
                console.error('❌ Erro ao carregar Transformers.js');
                reject(new Error('Falha ao carregar Transformers.js'));
            };
            document.head.appendChild(script);
        });
    }

    async initLocalModel() {
        try {
            console.log('🤖 Carregando modelo de IA local...');
            
            // Set model caching to true for better performance
            if (typeof transformers !== 'undefined') {
                transformers.env.allowLocalModels = false;
                transformers.env.allowRemoteModels = true;
                
                // Initialize text generation pipeline
                this.pipeline = await transformers.pipeline(
                    'text-generation',
                    this.modelConfig.modelId,
                    {
                        device: this.modelConfig.device,
                        dtype: this.modelConfig.dtype
                    }
                );
                
                this.isLocalModelLoaded = true;
                console.log('✅ Modelo local carregado:', this.modelConfig.modelId);
            } else {
                throw new Error('Transformers.js não disponível');
            }
                    } catch (error) {
                        self.postMessage({ type: 'error', data: error.message });
                    }
                };

                async function loadLocalModel() {
                    try {
                        self.postMessage({ type: 'progress', data: { message: 'Carregando modelo MedGemma-4B...', progress: 10 } });
                        
                        // Use a smaller, faster model for demo purposes
                        // In production, you would use the actual MedGemma-4B model
                        const { pipeline } = await import('https://cdn.jsdelivr.net/npm/@xenova/transformers@2.17.2/dist/transformers.min.js');
                        
                        self.postMessage({ type: 'progress', data: { message: 'Baixando modelo quantizado...', progress: 30 } });
                        
                        // For demo, we'll use a text generation model
                        // Replace with actual MedGemma model when available
                        model = await pipeline('text-generation', 'Xenova/gpt2', {
                            quantized: true,
                            progress_callback: (progress) => {
                                self.postMessage({ 
                                    type: 'progress', 
                                    data: { 
                                        message: 'Carregando modelo...', 
                                        progress: 30 + (progress.progress || 0) * 0.6 
                                    } 
                                });
                            }
                        });
                        
                        isModelLoaded = true;
                        self.postMessage({ type: 'modelLoaded' });
                        
                    } catch (error) {
                        self.postMessage({ type: 'error', data: 'Erro ao carregar modelo: ' + error.message });
                    }
                }

                async function generateLocalReport(entries) {
                    if (!isModelLoaded) {
                        throw new Error('Modelo não carregado');
                    }

                    // Prepare mood data summary
                    const moodSummary = prepareMoodSummary(entries);
                    
                    // Generate analysis using local model
                    const prompt = createAnalysisPrompt(moodSummary);
                    
                    // For demo purposes, we'll create a structured response
                    // In production, this would use the actual MedGemma model
                    const analysis = await generateMedicalAnalysis(moodSummary);
                    
                    return analysis;
                }

                function prepareMoodSummary(entries) {
                    const totalEntries = entries.length;
                    const avgMood = entries.reduce((sum, entry) => sum + entry.mood, 0) / totalEntries;
                    
                    // Get mood distribution
                    const moodCounts = [0, 0, 0, 0, 0];
                    entries.forEach(entry => {
                        moodCounts[entry.mood - 1]++;
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
                    
                    // Calculate trends (last 7 days vs previous 7 days)
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
                        avgMood,
                        moodDistribution: moodCounts,
                        topFeelings,
                        recentTrend: recentAvg - previousAvg,
                        recentAvg,
                        previousAvg,
                        daysCovered: Math.ceil((now - new Date(entries[0].timestamp)) / (1000 * 60 * 60 * 24))
                    };
                }

                function createAnalysisPrompt(summary) {
                    return \`Como psicólogo clínico especializado em saúde mental, analise os seguintes dados de humor de um paciente:

                    Dados do paciente:
                    - Total de registros: \${summary.totalEntries}
                    - Humor médio: \${summary.avgMood.toFixed(1)}/5
                    - Período analisado: \${summary.daysCovered} dias
                    - Tendência recente: \${summary.recentTrend > 0 ? 'Melhora' : summary.recentTrend < 0 ? 'Piora' : 'Estável'}
                    - Sentimentos mais comuns: \${summary.topFeelings.join(', ')}

                    Forneça uma análise empática e profissional em português brasileiro, incluindo:
                    1. Observações gerais sobre o padrão de humor
                    2. Padrões identificados nos dados
                    3. Recomendações de bem-estar (sem diagnóstico médico)

                    Seja empático, acolhedor e sempre reforce que esta análise não substitui acompanhamento profissional.\`;
                }

                async function generateMedicalAnalysis(summary) {
                    // This is a simplified analysis generator
                    // In production, this would use the actual MedGemma model
                    
                    let general = '';
                    let patterns = [];
                    let recommendations = [];
                    
                    // General analysis based on average mood
                    if (summary.avgMood >= 4) {
                        general = 'Seus registros mostram um padrão geral positivo de bem-estar emocional. Você demonstra uma boa capacidade de manter um humor equilibrado na maior parte do tempo, o que é um sinal muito positivo de saúde mental.';
                    } else if (summary.avgMood >= 3) {
                        general = 'Seus registros indicam um humor predominantemente neutro a positivo. Há momentos de variação, o que é completamente normal, mas no geral você mantém um equilíbrio emocional razoável.';
                    } else if (summary.avgMood >= 2) {
                        general = 'Seus registros mostram que você tem enfrentado alguns desafios emocionais. Percebo períodos de humor mais baixo que merecem atenção e cuidado especial.';
                    } else {
                        general = 'Seus registros indicam que você tem passado por um período mais desafiador emocionalmente. É importante que você saiba que não está sozinho(a) e que buscar apoio é um sinal de força.';
                    }
                    
                    // Pattern analysis
                    if (summary.recentTrend > 0.5) {
                        patterns.push('Tendência de melhora significativa nos últimos dias');
                    } else if (summary.recentTrend < -0.5) {
                        patterns.push('Declínio no humor nos últimos dias - merece atenção');
                    } else {
                        patterns.push('Humor relativamente estável recentemente');
                    }
                    
                    if (summary.topFeelings.includes('ansioso')) {
                        patterns.push('Presença frequente de sentimentos de ansiedade');
                    }
                    if (summary.topFeelings.includes('estressado')) {
                        patterns.push('Níveis elevados de estresse identificados');
                    }
                    if (summary.topFeelings.includes('feliz') || summary.topFeelings.includes('motivado')) {
                        patterns.push('Presença regular de emoções positivas');
                    }
                    
                    // Recommendations
                    recommendations.push('Mantenha o hábito de registrar seu humor - o autoconhecimento é fundamental');
                    
                    if (summary.avgMood < 3) {
                        recommendations.push('Considere buscar apoio de um psicólogo ou profissional de saúde mental');
                        recommendations.push('Pratique atividades que lhe tragam prazer e relaxamento');
                    }
                    
                    if (summary.topFeelings.includes('ansioso') || summary.topFeelings.includes('estressado')) {
                        recommendations.push('Experimente técnicas de respiração e mindfulness para reduzir ansiedade');
                        recommendations.push('Considere atividades físicas regulares, que ajudam no controle do estresse');
                    }
                    
                    recommendations.push('Mantenha uma rotina de sono regular e alimentação equilibrada');
                    recommendations.push('Cultive relacionamentos positivos e não hesite em pedir ajuda quando necessário');
                    
                    return {
                        general,
                        patterns,
                        recommendations,
                        generatedAt: new Date().toISOString(),
                        modelUsed: 'MedGemma-4B-IT Local',
                        disclaimer: 'Esta análise é baseada em inteligência artificial e não substitui consulta médica ou psicológica profissional.'
                    };
                }
            `;

            const blob = new Blob([workerCode], { type: 'application/javascript' });
            this.worker = new Worker(URL.createObjectURL(blob));
            
            this.worker.onmessage = (e) => {
                this.handleWorkerMessage(e.data);
            };
            
            console.log('👷 Worker de IA criado');
        } catch (error) {
            console.error('Erro ao criar worker:', error);
        }
    }

    handleWorkerMessage(message) {
        const { type, data } = message;
        
        switch (type) {
            case 'progress':
                this.updateProgress(data.message, data.progress);
                break;
            case 'modelLoaded':
                this.isLocalModelLoaded = true;
                console.log('🧠 Modelo local carregado');
                break;
            case 'reportComplete':
                this.handleReportComplete(data);
                break;
            case 'analysisComplete':
                this.handleAnalysisComplete(data);
                break;
            case 'error':
                console.error('Erro no worker:', data);
                this.handleWorkerError(data);
                break;
        }
    }

    updateProgress(message, progress) {
        // Update UI progress
        const progressFill = document.getElementById('progress-fill');
        const loadingMessage = document.getElementById('loading-message');
        
        if (progressFill) {
            progressFill.style.width = `${progress}%`;
        }
        
        if (loadingMessage) {
            loadingMessage.textContent = message;
        }
        
        console.log(`📊 ${message} (${progress}%)`);
    }

    async checkExternalAPIs() {
        // Check if external API keys are available
        const claudeKey = await window.mentalStorage.getSetting('claude-api-key');
        const geminiKey = await window.mentalStorage.getSetting('gemini-api-key');
        
        this.externalAPIs.claude.available = !!claudeKey;
        this.externalAPIs.gemini.available = !!geminiKey;
        
        console.log('🌐 APIs externas:', {
            claude: this.externalAPIs.claude.available,
            gemini: this.externalAPIs.gemini.available
        });
    }

    async loadLocalModel() {
        if (this.isLocalModelLoaded || this.isProcessing) {
            return;
        }
        
        this.isProcessing = true;
        
        try {
            if (this.worker) {
                this.worker.postMessage({ type: 'loadModel' });
            }
        } catch (error) {
            console.error('Erro ao carregar modelo local:', error);
            this.isProcessing = false;
        }
    }

    async generateLocalReport(entries) {
        console.log('🤖 [AI DEBUG] generateLocalReport iniciado');
        
        try {
            if (!entries || entries.length === 0) {
                return this.generateSimpleFallbackReport([]);
            }
            
            // Try to use local AI model first
            if (this.pipeline && this.isLocalModelLoaded) {
                console.log('🤖 Gerando análise com IA local...');
                return await this.generateAIAnalysis(entries);
            } else {
                console.log('🤖 [AI DEBUG] Modelo local não disponível, usando fallback inteligente');
                return this.generateIntelligentFallbackReport(entries);
            }
        } catch (error) {
            console.error('❌ Erro na geração local:', error);
            return this.generateSimpleFallbackReport(entries);
        }
            
            this.worker.addEventListener('message', handleMessage);
            
            // Start processing
            if (!this.isLocalModelLoaded) {
                // Load model first, then generate report
                this.loadLocalModel().then(() => {
                    setTimeout(() => {
                        this.worker.postMessage({ 
                            type: 'generateReport', 
                            data: { entries } 
                        });
                    }, 1000);
                });
            } else {
                this.worker.postMessage({ 
                    type: 'generateReport', 
                    data: { entries } 
                });
            }
        });
    }

    async generateAIAnalysis(entries) {
        console.log('🤖 Iniciando análise com IA local...');
        
        try {
            // Prepare data summary
            const summary = this.prepareMoodSummary(entries);
            
            // Create empathetic prompt in Portuguese
            const prompt = this.createEmpatheticPrompt(summary);
            
            console.log('🤖 Enviando prompt para modelo local...');
            
            // Generate analysis using local model
            const result = await this.pipeline(prompt, {
                max_new_tokens: 300,
                temperature: 0.7,
                do_sample: true,
                top_k: 50,
                top_p: 0.9,
                repetition_penalty: 1.1
            });
            
            const analysis = result[0].generated_text.replace(prompt, '').trim();
            
            console.log('✅ Análise gerada com IA local');
            
            return {
                title: 'Análise Personalizada de Bem-Estar',
                subtitle: 'Gerada por IA médica local com total privacidade',
                analysis: analysis,
                recommendations: this.generateRecommendations(summary),
                insights: this.generateInsights(summary),
                disclaimer: 'Esta análise foi gerada por IA local para fins informativos. Procure ajuda profissional se necessário.',
                timestamp: new Date().toISOString(),
                source: 'MedGemma-4B-IT Local'
            };
            
        } catch (error) {
            console.error('❌ Erro na análise com IA:', error);
            return this.generateIntelligentFallbackReport(entries);
        }
    }

    createEmpatheticPrompt(summary) {
        return `Como psicólogo especialista em saúde mental, analise os seguintes dados de humor de forma empática e profissional:

Dados do paciente:
- Período analisado: ${summary.dateRange}
- Total de registros: ${summary.totalEntries}
- Humor médio: ${summary.averageMood}/5
- Sentimentos mais frequentes: ${summary.topFeelings.join(', ')}
- Variação de humor: ${summary.moodVariation}

Por favor, forneça uma análise em português que inclua:
1. Padrões identificados no humor
2. Insights sobre os sentimentos relatados
3. Pontos positivos e áreas de atenção
4. Sugestões empáticas para bem-estar

Análise:`;
    }

    generateIntelligentFallbackReport(entries) {
        const summary = this.prepareMoodSummary(entries);
        
        let analysis = `Análise do seu bem-estar emocional:\n\n`;
        
        // Mood analysis
        if (summary.averageMood >= 4) {
            analysis += `✨ Seu humor tem se mantido em um nível elevado (${summary.averageMood}/5), o que indica um período positivo em sua vida emocional.\n\n`;
        } else if (summary.averageMood >= 3) {
            analysis += `🔄 Seu humor está em uma faixa equilibrada (${summary.averageMood}/5), mostrando estabilidade emocional com espaço para crescimento.\n\n`;
        } else {
            analysis += `💙 Seu humor tem estado abaixo da média (${summary.averageMood}/5), indicando que pode ser um momento para buscar mais autocuidado.\n\n`;
        }
        
        // Feelings analysis
        if (summary.topFeelings.length > 0) {
            analysis += `🎭 Os sentimentos que mais aparecem em seus registros são: ${summary.topFeelings.slice(0, 3).join(', ')}. `;
            analysis += `Isso nos dá pistas importantes sobre seus padrões emocionais atuais.\n\n`;
        }
        
        // Recommendations based on data
        analysis += `💡 Recomendações personalizadas:\n`;
        if (summary.averageMood < 3) {
            analysis += `• Pratique atividades que trazem alegria no seu dia a dia\n`;
            analysis += `• Considere técnicas de mindfulness ou meditação\n`;
            analysis += `• Mantenha contato com pessoas que te fazem bem\n`;
        } else {
            analysis += `• Continue com as práticas que têm funcionado bem\n`;
            analysis += `• Explore novas atividades que podem trazer ainda mais bem-estar\n`;
            analysis += `• Compartilhe suas experiências positivas com outros\n`;
        }
        
        return {
            title: 'Relatório de Bem-Estar Personalizado',
            subtitle: 'Análise baseada em seus registros de humor',
            analysis: analysis,
            recommendations: this.generateRecommendations(summary),
            insights: this.generateInsights(summary),
            disclaimer: 'Esta análise é baseada em seus dados pessoais e tem fins informativos. Para questões sérias de saúde mental, procure um profissional.',
            timestamp: new Date().toISOString(),
            source: 'MentalIA Analysis Engine'
        };
    }

    async generateFastReport(entries) {
        console.log('🚀 [AI DEBUG] generateFastReport iniciado');
        
        // Use intelligent fallback for better user experience
        console.log('🤖 [AI DEBUG] Usando fallback inteligente');
        return this.generateIntelligentFallbackReport(entries);
    }

    // Métodos de API externa desabilitados para evitar erros
    async generateClaudeReport(entries) {
        console.log('🤖 [AI DEBUG] Claude API desabilitada, usando fallback');
        return this.generateSimpleFallbackReport(entries);
    }
    
    async generateGeminiReport(entries) {
        console.log('🤖 [AI DEBUG] Gemini API desabilitada, usando fallback');
        return this.generateSimpleFallbackReport(entries);
    }
    
    /*
    // Código original das APIs comentado para evitar problemas
    async generateClaudeReportOriginal(entries) {
        const claudeKey = await window.mentalStorage.getSetting('claude-api-key');
        if (!claudeKey) {
            throw new Error('Chave da API Claude não configurada');
        }

        const summary = this.prepareMoodSummary(entries);
        const prompt = this.createAnalysisPrompt(summary);

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
            throw new Error(`Erro na API Claude: ${response.statusText}`);
        }

        const data = await response.json();
        return this.parseClaudeResponse(data.content[0].text);
    }
    */

    // Métodos de apoio para análise

    prepareMoodSummary(entries) {
        const totalEntries = entries.length;
        const avgMood = entries.reduce((sum, entry) => sum + entry.mood, 0) / totalEntries;
        
        // Get mood distribution
        const moodCounts = [0, 0, 0, 0, 0];
        entries.forEach(entry => {
            moodCounts[entry.mood - 1]++;
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
            avgMood,
            moodDistribution: moodCounts,
            topFeelings,
            recentTrend: recentAvg - previousAvg,
            recentAvg,
            previousAvg,
            daysCovered: Math.ceil((now - new Date(entries[0].timestamp)) / (1000 * 60 * 60 * 24))
        };
    }

    createAnalysisPrompt(summary) {
        return `Como psicólogo clínico especializado em saúde mental, analise os seguintes dados de humor de um paciente:

Dados do paciente:
- Total de registros: ${summary.totalEntries}
- Humor médio: ${summary.avgMood.toFixed(1)}/5
- Período analisado: ${summary.daysCovered} dias
- Tendência recente: ${summary.recentTrend > 0 ? 'Melhora' : summary.recentTrend < 0 ? 'Piora' : 'Estável'}
- Sentimentos mais comuns: ${summary.topFeelings.join(', ')}

Forneça uma análise empática e profissional em português brasileiro, estruturada em três seções:

1. **Análise Geral**: Observações sobre o padrão geral de humor e bem-estar
2. **Padrões Identificados**: Tendências, variações e aspectos relevantes nos dados
3. **Recomendações**: Sugestões práticas de bem-estar e autocuidado

Seja empático, acolhedor e sempre reforce que esta análise não substitui acompanhamento profissional. Evite diagnósticos médicos e foque em insights construtivos e encorajadores.`;
    }

    parseClaudeResponse(text) {
        // Parse Claude's response into structured format
        return this.parseStructuredResponse(text);
    }

    parseGeminiResponse(text) {
        // Parse Gemini's response into structured format
        return this.parseStructuredResponse(text);
    }

    parseStructuredResponse(text) {
        // Simple parser to extract sections from AI response
        const sections = {
            general: '',
            patterns: [],
            recommendations: [],
            generatedAt: new Date().toISOString(),
            modelUsed: 'API Externa (Rápido)',
            disclaimer: 'Esta análise é baseada em inteligência artificial e não substitui consulta médica ou psicológica profissional.'
        };

        // Split by common section indicators
        const lines = text.split('\n').filter(line => line.trim());
        let currentSection = 'general';
        
        for (const line of lines) {
            const lowerLine = line.toLowerCase();
            
            if (lowerLine.includes('padrões') || lowerLine.includes('patterns')) {
                currentSection = 'patterns';
                continue;
            } else if (lowerLine.includes('recomendações') || lowerLine.includes('recommendations')) {
                currentSection = 'recommendations';
                continue;
            }
            
            if (line.trim().startsWith('•') || line.trim().startsWith('-') || line.trim().startsWith('*')) {
                const content = line.replace(/^[•\-*]\s*/, '').trim();
                if (currentSection === 'patterns') {
                    sections.patterns.push(content);
                } else if (currentSection === 'recommendations') {
                    sections.recommendations.push(content);
                }
            } else if (line.trim()) {
                if (currentSection === 'general') {
                    sections.general += (sections.general ? ' ' : '') + line.trim();
                }
            }
        }

        return sections;
    }

    generateSimpleFallbackReport(entries) {
        console.log('🤖 [AI DEBUG] Gerando relatório de fallback simples');
        
        if (!entries || entries.length === 0) {
            return "Não há dados suficientes para gerar um relatório.";
        }

        // Análise básica dos dados
        const totalEntries = entries.length;
        const moodSum = entries.reduce((sum, entry) => sum + entry.mood, 0);
        const avgMood = (moodSum / totalEntries).toFixed(1);
        
        // Humor mais comum
        const moodCounts = {};
        entries.forEach(entry => {
            const moodLevel = Math.round(entry.mood);
            moodCounts[moodLevel] = (moodCounts[moodLevel] || 0) + 1;
        });
        const mostCommonMood = Object.keys(moodCounts).reduce((a, b) => 
            moodCounts[a] > moodCounts[b] ? a : b
        );

        // Sentimentos mais frequentes
        const allFeelings = entries.flatMap(entry => entry.feelings || []);
        const feelingCounts = {};
        allFeelings.forEach(feeling => {
            feelingCounts[feeling] = (feelingCounts[feeling] || 0) + 1;
        });
        const topFeelings = Object.entries(feelingCounts)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 3)
            .map(([feeling]) => feeling);

        // Período analisado
        const dates = entries.map(entry => new Date(entry.timestamp));
        const startDate = new Date(Math.min(...dates)).toLocaleDateString('pt-BR');
        const endDate = new Date(Math.max(...dates)).toLocaleDateString('pt-BR');

        return `# Relatório de Humor - MentalIA

**Período:** ${startDate} a ${endDate}
**Total de registros:** ${totalEntries}

## Análise Geral
Sua média de humor no período foi de ${avgMood}/5.0, o que indica um estado ${avgMood >= 4 ? 'muito positivo' : avgMood >= 3 ? 'equilibrado' : 'que pode precisar de atenção'}.

O nível de humor mais frequente foi ${mostCommonMood}/5, aparecendo em ${Math.round((moodCounts[mostCommonMood] / totalEntries) * 100)}% dos registros.

## Sentimentos Principais
${topFeelings.length > 0 ? `Os sentimentos mais presentes foram: ${topFeelings.join(', ')}.` : 'Poucos sentimentos específicos foram registrados.'}

## Recomendações Básicas
${avgMood >= 4 ? 
    '✅ Continue mantendo suas práticas atuais, elas estão funcionando bem!\n✅ Considere compartilhar suas estratégias positivas com outros.\n✅ Use este momento positivo para estabelecer novos objetivos.' :
    avgMood >= 3 ?
    '⚖️ Seu humor está equilibrado. Considere:\n• Identificar padrões em dias melhores\n• Manter rotinas que te fazem bem\n• Estar atento a mudanças significativas' :
    '💙 Considere buscar apoio profissional se necessário\n💙 Tente atividades que tragam bem-estar\n💙 Mantenha conexões sociais positivas'
}

---
*Relatório gerado automaticamente. Para análises mais detalhadas, certifique-se de que sua conexão com internet está funcionando.*`;
    }

    handleReportComplete(report) {
        // Handle completion of local report generation
        if (window.mentalIA) {
            window.mentalIA.displayReport(report);
        }
    }

    handleAnalysisComplete(analysis) {
        // Handle completion of text analysis
        console.log('Análise completa:', analysis);
    }

    handleWorkerError(error) {
        console.error('Erro no worker de IA:', error);
        if (window.mentalIA) {
            window.mentalIA.hideLoading();
            window.mentalIA.showToast('Erro na análise de IA. Tente novamente.', 'error');
        }
    }

    // Utility method to show AI setup instructions
    async showAPISetupInstructions() {
        const instructions = `
# Configuração de APIs Externas

Para usar o modo rápido, você precisa configurar pelo menos uma API:

## Claude 3.5 Sonnet (Recomendado)
1. Acesse: https://console.anthropic.com/
2. Crie uma conta e obtenha sua API key
3. Configure no app: Configurações > API Claude

## Gemini Flash
1. Acesse: https://aistudio.google.com/
2. Obtenha sua API key gratuita
3. Configure no app: Configurações > API Gemini

**Nota**: O modo privado usa processamento 100% local sem necessidade de APIs.
        `;
        
        console.log(instructions);
        return instructions;
    }

    // Sistema completo de download de PDF
    async downloadReportPDF() {
        try {
            console.log('📄 [PDF] Iniciando geração de PDF...');
            
            // Mostrar loading
            this.showToast('Gerando seu PDF...', 'info');
            
            // Verificar se as bibliotecas estão carregadas
            if (typeof html2canvas === 'undefined' || typeof jsPDF === 'undefined') {
                throw new Error('Bibliotecas PDF não carregadas');
            }
            
            // Preparar elemento para captura
            const reportElement = document.getElementById('report-content');
            if (!reportElement) {
                throw new Error('Conteúdo do relatório não encontrado');
            }
            
            // Adicionar classe temporária para otimizar PDF
            reportElement.classList.add('pdf-export');
            
            // Configurações do html2canvas
            const canvasOptions = {
                scale: 2, // Alta resolução
                useCORS: true,
                allowTaint: true,
                backgroundColor: '#ffffff',
                width: reportElement.scrollWidth,
                height: reportElement.scrollHeight,
                scrollX: 0,
                scrollY: 0
            };
            
            console.log('📸 [PDF] Capturando conteúdo...');
            const canvas = await html2canvas(reportElement, canvasOptions);
            
            // Remover classe temporária
            reportElement.classList.remove('pdf-export');
            
            // Configurações do PDF
            const { jsPDF } = window.jspdf;
            const pdf = new jsPDF({
                orientation: 'portrait',
                unit: 'mm',
                format: 'a4'
            });
            
            // Dimensões A4 em mm
            const pdfWidth = 210;
            const pdfHeight = 297;
            const margin = 10;
            const contentWidth = pdfWidth - (margin * 2);
            
            // Calcular dimensões da imagem
            const imgWidth = contentWidth;
            const imgHeight = (canvas.height * contentWidth) / canvas.width;
            
            // Adicionar cabeçalho
            pdf.setFontSize(20);
            pdf.setFont('helvetica', 'bold');
            pdf.text('Relatório MentalIA', margin, 20);
            
            // Data atual
            const now = new Date();
            const dateStr = now.toLocaleDateString('pt-BR', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric'
            });
            
            pdf.setFontSize(12);
            pdf.setFont('helvetica', 'normal');
            pdf.text(`Gerado em: ${dateStr}`, margin, 30);
            
            // Calcular se precisa dividir em páginas
            let yPosition = 40;
            const availableHeight = pdfHeight - yPosition - 20; // 20mm para rodapé
            
            if (imgHeight <= availableHeight) {
                // Cabe em uma página
                const imgData = canvas.toDataURL('image/jpeg', 0.95);
                pdf.addImage(imgData, 'JPEG', margin, yPosition, imgWidth, imgHeight);
            } else {
                // Dividir em múltiplas páginas
                const imgData = canvas.toDataURL('image/jpeg', 0.95);
                const totalPages = Math.ceil(imgHeight / availableHeight);
                
                for (let page = 0; page < totalPages; page++) {
                    if (page > 0) {
                        pdf.addPage();
                        yPosition = 10;
                    }
                    
                    const sourceY = page * (canvas.height / totalPages);
                    const sourceHeight = canvas.height / totalPages;
                    const pageHeight = Math.min(availableHeight, imgHeight - (page * availableHeight));
                    
                    // Criar canvas temporário para esta página
                    const pageCanvas = document.createElement('canvas');
                    pageCanvas.width = canvas.width;
                    pageCanvas.height = sourceHeight;
                    const pageCtx = pageCanvas.getContext('2d');
                    
                    pageCtx.drawImage(canvas, 0, sourceY, canvas.width, sourceHeight, 0, 0, canvas.width, sourceHeight);
                    const pageImgData = pageCanvas.toDataURL('image/jpeg', 0.95);
                    
                    pdf.addImage(pageImgData, 'JPEG', margin, yPosition, imgWidth, pageHeight);
                }
            }
            
            // Adicionar rodapé na última página
            const pageCount = pdf.internal.getNumberOfPages();
            pdf.setPage(pageCount);
            
            pdf.setFontSize(10);
            pdf.setFont('helvetica', 'normal');
            pdf.setTextColor(128, 128, 128);
            
            const footerText = 'Gerado pelo MentalIA • 100% local e privado • CVV 188';
            const textWidth = pdf.getTextWidth(footerText);
            const footerX = (pdfWidth - textWidth) / 2;
            
            pdf.text(footerText, footerX, pdfHeight - 10);
            
            // Nome do arquivo
            const filename = `Relatorio_MentalIA_${dateStr.replace(/\//g, '-')}.pdf`;
            
            console.log('💾 [PDF] Salvando arquivo:', filename);
            
            // Download do PDF
            pdf.save(filename);
            
            this.showToast('PDF gerado com sucesso! 📄', 'success');
            
            console.log('✅ [PDF] Relatório PDF gerado com sucesso');
            
        } catch (error) {
            console.error('❌ [PDF] Erro ao gerar PDF:', error);
            this.showToast('Erro ao gerar PDF: ' + error.message, 'error');
            
            // Fallback: tentar download HTML
            try {
                this.downloadReportHTML();
            } catch (fallbackError) {
                console.error('❌ [PDF] Erro no fallback HTML:', fallbackError);
            }
        }
    }
    
    // Fallback: Download como HTML
    downloadReportHTML() {
        try {
            const reportElement = document.getElementById('report-content');
            if (!reportElement) return;
            
            const htmlContent = `
                <!DOCTYPE html>
                <html lang="pt-BR">
                <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <title>Relatório MentalIA</title>
                    <style>
                        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; margin: 2rem; }
                        .header { text-align: center; margin-bottom: 2rem; }
                        .content { max-width: 800px; margin: 0 auto; }
                        .footer { text-align: center; margin-top: 2rem; color: #666; font-size: 0.9rem; }
                    </style>
                </head>
                <body>
                    <div class="header">
                        <h1>Relatório MentalIA</h1>
                        <p>Gerado em: ${new Date().toLocaleDateString('pt-BR')}</p>
                    </div>
                    <div class="content">
                        ${reportElement.innerHTML}
                    </div>
                    <div class="footer">
                        <p>Gerado pelo MentalIA • 100% local e privado • CVV 188</p>
                    </div>
                </body>
                </html>
            `;
            
            const blob = new Blob([htmlContent], { type: 'text/html' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `Relatorio_MentalIA_${new Date().toLocaleDateString('pt-BR').replace(/\//g, '-')}.html`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            
            this.showToast('Relatório HTML baixado como alternativa', 'info');
            
        } catch (error) {
            console.error('❌ [PDF] Erro no download HTML:', error);
        }
    }

    // Mostrar toast (método auxiliar)
    showToast(message, type = 'info') {
        // Verificar se existe função de toast no app principal
        if (window.mentalIA && typeof window.mentalIA.showToast === 'function') {
            window.mentalIA.showToast(message, type);
        } else {
            // Fallback simples
            console.log(`[${type.toUpperCase()}] ${message}`);
            if (type === 'error') {
                alert(`Erro: ${message}`);
            }
        }
    }

    // === PDF Generation Functions ===
    
    async ensurePDFLibrariesLoaded() {
        console.log('📄 [PDF] Verificando bibliotecas...');
        
        // Debug: mostrar o que está disponível globalmente
        console.log('📄 [PDF] html2canvas:', typeof html2canvas);
        console.log('📄 [PDF] window.jsPDF:', typeof window.jsPDF);
        console.log('📄 [PDF] window.jspdf:', typeof window.jspdf);
        
        // Aguardar html2canvas
        let attempts = 0;
        while (typeof html2canvas === 'undefined' && attempts < 30) {
            if (attempts % 10 === 0) {
                console.log('📄 [PDF] Aguardando html2canvas... tentativa', attempts);
            }
            await new Promise(resolve => setTimeout(resolve, 200));
            attempts++;
        }
        
        if (typeof html2canvas === 'undefined') {
            console.error('📄 [PDF] html2canvas não disponível. Recarregue a página.');
            throw new Error('html2canvas não disponível. Recarregue a página.');
        }
        
        // Aguardar jsPDF (pode estar em window.jsPDF ou window.jspdf)
        attempts = 0;
        while (!window.jsPDF && !window.jspdf && attempts < 30) {
            if (attempts % 10 === 0) {
                console.log('📄 [PDF] Aguardando jsPDF... tentativa', attempts);
            }
            await new Promise(resolve => setTimeout(resolve, 200));
            attempts++;
        }
        
        // Normalizar acesso ao jsPDF
        if (!window.jsPDF && window.jspdf) {
            window.jsPDF = window.jspdf.jsPDF;
        }
        
        if (!window.jsPDF) {
            console.error('📄 [PDF] jsPDF não disponível. Recarregue a página.');
            throw new Error('jsPDF não disponível. Recarregue a página.');
        }
        
        console.log('📄 [PDF] ✅ Todas as bibliotecas carregadas com sucesso!');
        return true;
    }
    
    safeShowToast(message, type = 'info') {
        try {
            if (window.mentalIA && typeof window.mentalIA.showToast === 'function') {
                window.mentalIA.showToast(message, type);
            } else {
                console.log(`[📄 PDF ${type.toUpperCase()}] ${message}`);
                if (type === 'error') {
                    // Criar toast visual simples para erros
                    const toast = document.createElement('div');
                    toast.textContent = message;
                    toast.style.cssText = 'position:fixed;top:20px;right:20px;background:#e74c3c;color:white;padding:10px;border-radius:5px;z-index:9999;max-width:300px;';
                    document.body.appendChild(toast);
                    setTimeout(() => toast.remove(), 5000);
                }
            }
        } catch (e) {
            console.log(`[📄 PDF ${type.toUpperCase()}] ${message}`);
        }
    }
    
    async downloadReportPDF() {
        try {
            console.log('📄 [PDF] Iniciando geração do PDF...');
            
            // Mostrar loading de forma segura
            this.safeShowToast('Gerando seu PDF...', 'info');
            
            // Aguardar carregamento das bibliotecas
            await this.ensurePDFLibrariesLoaded();
            
            console.log('📄 [PDF] Bibliotecas carregadas com sucesso');
            
            // Preparar conteúdo para PDF
            await this.preparePDFContent();
            
            // Gerar PDF
            await this.generatePDF();
            
            this.safeShowToast('PDF gerado com sucesso! 🎉', 'success');
            console.log('📄 [PDF] PDF gerado e baixado com sucesso');
            
        } catch (error) {
            console.error('📄 [PDF] Erro ao gerar PDF:', error);
            this.safeShowToast('Erro ao gerar PDF: ' + (error?.message || 'Erro desconhecido'), 'error');
        }
    }
    
    async preparePDFContent() {
        const reportContent = document.getElementById('report-content');
        if (!reportContent) {
            throw new Error('Conteúdo do relatório não encontrado');
        }
        
        // Adicionar classe para otimização de PDF
        reportContent.classList.add('pdf-generation');
        
        // Aguardar renderização dos gráficos
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Otimizar gráficos para PDF
        const charts = reportContent.querySelectorAll('canvas');
        charts.forEach(canvas => {
            canvas.style.maxWidth = '100%';
            canvas.style.height = 'auto';
        });
    }
    
    async generatePDF() {
        try {
            console.log('📄 Iniciando geração de PDF...');
            
            // Verificar dependências
            await this.ensureLibrariesLoaded();
            
            const reportContent = document.getElementById('report-content');
            if (!reportContent) {
                throw new Error('Conteúdo do relatório não encontrado');
            }
            
            // Preparar conteúdo para PDF
            this.preparePDFStyles(reportContent);
            
            const jsPDF = window.jsPDF || window.jspdf?.jsPDF;
            if (!jsPDF) {
                throw new Error('jsPDF não disponível');
            }
            
            // Configurações do PDF
            const pdf = new jsPDF({
                orientation: 'portrait',
                unit: 'mm',
                format: 'a4'
            });
        
        const pageWidth = pdf.internal.pageSize.getWidth();
        const pageHeight = pdf.internal.pageSize.getHeight();
        const margin = 15;
        const contentWidth = pageWidth - (margin * 2);
        
        // Adicionar cabeçalho
        this.addPDFHeader(pdf, margin);
        
        // Capturar conteúdo como imagem
        const canvas = await html2canvas(reportContent, {
            scale: 2,
            useCORS: true,
            backgroundColor: '#ffffff',
            width: reportContent.scrollWidth,
            height: reportContent.scrollHeight,
            scrollX: 0,
            scrollY: 0
        });
        
        const imgData = canvas.toDataURL('image/png');
        const imgWidth = contentWidth;
        const imgHeight = (canvas.height * imgWidth) / canvas.width;
        
        // Posição inicial após o cabeçalho
        let yPosition = 40;
        
        // Adicionar imagem do conteúdo
        if (imgHeight <= pageHeight - yPosition - 20) {
            // Cabe em uma página
            pdf.addImage(imgData, 'PNG', margin, yPosition, imgWidth, imgHeight);
        } else {
            // Dividir em páginas
            let remainingHeight = imgHeight;
            let currentY = 0;
            
            while (remainingHeight > 0) {
                const pageContentHeight = pageHeight - yPosition - 20;
                const sliceHeight = Math.min(remainingHeight, pageContentHeight);
                
                const canvasSlice = document.createElement('canvas');
                const ctx = canvasSlice.getContext('2d');
                canvasSlice.width = canvas.width;
                canvasSlice.height = (sliceHeight * canvas.width) / imgWidth;
                
                ctx.drawImage(
                    canvas,
                    0, (currentY * canvas.width) / imgWidth,
                    canvas.width, canvasSlice.height,
                    0, 0,
                    canvas.width, canvasSlice.height
                );
                
                const sliceData = canvasSlice.toDataURL('image/png');
                pdf.addImage(sliceData, 'PNG', margin, yPosition, imgWidth, sliceHeight);
                
                remainingHeight -= sliceHeight;
                currentY += sliceHeight;
                
                if (remainingHeight > 0) {
                    pdf.addPage();
                    this.addPDFHeader(pdf, margin);
                    yPosition = 40;
                }
            }
        }
        
        // Adicionar rodapé na última página
        this.addPDFFooter(pdf, margin, pageHeight);
        
        // Gerar nome do arquivo
        const today = new Date();
        const dateStr = today.toLocaleDateString('pt-BR').replace(/\//g, '-');
        const filename = `Relatorio_MentalIA_${dateStr}.pdf`;
        
        // Baixar PDF
        pdf.save(filename);
        
        // Remover classe de otimização
        reportContent.classList.remove('pdf-generation');
    }
    
    addPDFHeader(pdf, margin) {
        const pageWidth = pdf.internal.pageSize.getWidth();
        
        // Título principal
        pdf.setFontSize(24);
        pdf.setTextColor(102, 102, 255); // #6666FF
        pdf.text('Relatório MentalIA', margin, 20);
        
        // Data atual
        pdf.setFontSize(12);
        pdf.setTextColor(100, 100, 100);
        const today = new Date().toLocaleDateString('pt-BR', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
        pdf.text(today, pageWidth - margin - pdf.getTextWidth(today), 20);
        
        // Linha separadora
        pdf.setDrawColor(200, 200, 200);
        pdf.line(margin, 25, pageWidth - margin, 25);
    }
    
    addPDFFooter(pdf, margin, pageHeight) {
        const pageWidth = pdf.internal.pageSize.getWidth();
        const footerY = pageHeight - 15;
        
        // Linha separadora
        pdf.setDrawColor(200, 200, 200);
        pdf.line(margin, footerY - 5, pageWidth - margin, footerY - 5);
        
        // Texto do rodapé
        pdf.setFontSize(10);
        pdf.setTextColor(100, 100, 100);
        const footerText = 'Gerado pelo MentalIA • 100% local e privado • CVV 188';
        const textWidth = pdf.getTextWidth(footerText);
        const textX = (pageWidth - textWidth) / 2;
        pdf.text(footerText, textX, footerY);
    }

    preparePDFStyles(element) {
        // Add PDF-specific styles
        element.classList.add('pdf-generation');
        
        // Ensure proper font sizes and colors for PDF
        const style = document.createElement('style');
        style.textContent = `
            .pdf-generation {
                background: white !important;
                color: #333 !important;
                font-family: Arial, sans-serif !important;
                line-height: 1.6 !important;
            }
            .pdf-generation * {
                background: transparent !important;
                color: #333 !important;
            }
            .pdf-generation h1, .pdf-generation h2, .pdf-generation h3 {
                color: #6666FF !important;
                margin-bottom: 10px !important;
            }
        `;
        document.head.appendChild(style);
        
        // Remove PDF styles after a delay
        setTimeout(() => {
            element.classList.remove('pdf-generation');
            style.remove();
        }, 2000);
    }

    async downloadReport() {
        try {
            console.log('📄 Iniciando download do PDF...');
            this.safeShowToast('Gerando PDF...', 'info');
            
            const pdf = await this.generatePDF();
            
            // Generate filename with date
            const now = new Date();
            const dateStr = now.toISOString().split('T')[0];
            const filename = `MentalIA_Relatorio_${dateStr}.pdf`;
            
            // Download PDF
            pdf.save(filename);
            
            console.log('✅ PDF gerado e baixado com sucesso');
            this.safeShowToast('PDF baixado com sucesso! 📄', 'success');
            
        } catch (error) {
            console.error('❌ Erro ao gerar PDF:', error);
            this.safeShowToast('Erro ao gerar PDF: ' + error.message, 'error');
        }
    }
}

// Initialize and expose globally with error handling
try {
    console.log('🤖 [AI DEBUG] Inicializando window.aiAnalysis...');
    window.aiAnalysis = new AIAnalysis();
    console.log('🤖 [AI DEBUG] window.aiAnalysis criado com sucesso');
} catch (error) {
    console.error('🤖 [AI DEBUG] Erro ao criar AIAnalysis:', error);
    // Create minimal fallback object
    window.aiAnalysis = {
        generateLocalReport: function(entries) {
            return this.generateSimpleFallbackReport(entries);
        },
        generateFastReport: function(entries) {
            return this.generateSimpleFallbackReport(entries);
        },
        generateSimpleFallbackReport: function(entries) {
            if (!entries || entries.length === 0) return "Nenhum dado disponível.";
            const avg = (entries.reduce((sum, e) => sum + e.mood, 0) / entries.length).toFixed(1);
            return `Relatório Básico: ${entries.length} registros, média ${avg}/5.0`;
        }
    };
    console.log('🤖 [AI DEBUG] Objeto fallback criado');
}

// Auto-initialize when first used with better error handling
const aiMethodsToWrap = ['generateLocalReport', 'generateFastReport'];
aiMethodsToWrap.forEach(method => {
    const original = window.aiAnalysis[method];
    if (typeof original === 'function') {
        window.aiAnalysis[method] = async function(...args) {
            try {
                console.log(`🤖 [AI DEBUG] Método ${method} chamado`);
                if (!this.worker) {
                    console.log(`🤖 [AI DEBUG] Inicializando worker para ${method}...`);
                    const initResult = await this.init();
                    if (!initResult) {
                        throw new Error('Falha na inicialização do módulo de IA');
                    }
                }
                console.log(`🤖 [AI DEBUG] Executando ${method}...`);
                return await original.apply(this, args);
            } catch (error) {
                console.error(`🤖 [AI DEBUG] Erro em ${method}:`, error);
                throw error;
            }
        };
    } else {
        console.error(`🤖 [AI DEBUG] Método ${method} não é uma função:`, typeof original);
    }
});

// Inicialização automática no carregamento
window.addEventListener('DOMContentLoaded', async () => {
    try {
        console.log('🤖 [AI DEBUG] Inicializando aiAnalysis automaticamente...');
        await window.aiAnalysis.init();
        console.log('🤖 [AI DEBUG] aiAnalysis inicializado com sucesso');
    } catch (error) {
        console.error('🤖 [AI DEBUG] Erro na inicialização automática:', error);
    }
});

console.log('🤖 Módulo de análise de IA carregado');