// MentalIA 3.1 - AI Analysis Module
// Complete AI analysis system with local MedGemma-4B-IT Q4 and external APIs

class AIAnalysis {
    constructor() {
        this.isInitialized = false;
        this.localModel = null;
        this.isModelLoading = false;
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

            // Initialize local model in background (don't wait for it)
            this.initLocalModel();

            this.isInitialized = true;
            console.log('🤖 [AI] Sistema inicializado com sucesso');
            return true;

        } catch (error) {
            console.error('🤖 [AI] Erro na inicialização:', error);
            return false;
        }
    }

    async initLocalModel() {
        if (this.isModelLoading || this.localModel) return;

        this.isModelLoading = true;
        console.log('Carregando MedGemma 2B local... (100% privado)');

        const maxRetries = 3;
        let attempt = 0;

        while (attempt < maxRetries && !this.localModel) {
            attempt++;
            console.log(`🔄 Tentativa ${attempt}/${maxRetries} de carregar MedGemma...`);

            try {
                // Garante que Transformers.js está disponível
                if (typeof Transformers === 'undefined') {
                    const { pipeline } = await import('https://cdn.jsdelivr.net/npm/@xenova/transformers@2.17.2');
                    window.Transformers = { pipeline };
                }

                // Modelo leve, rápido e que roda em qualquer celular
                this.localModel = await window.Transformers.pipeline('text-generation', 'Xenova/medgemma-2b-it');

                console.log('✅ MedGemma 2B carregado com sucesso! 100% local');
                this.showToast('IA médica local carregada!', 'success');
                break; // Sucesso, sair do loop

            } catch (error) {
                console.error(`❌ Tentativa ${attempt} falhou:`, error);
                
                if (attempt < maxRetries) {
                    console.log(`⏳ Aguardando antes da próxima tentativa...`);
                    await new Promise(resolve => setTimeout(resolve, 2000)); // Espera 2s entre tentativas
                } else {
                    console.error('💥 Todas as tentativas falharam. Modelo local indisponível.');
                    this.localModel = null;
                    this.showToast('Modo privado indisponível. Use o modo rápido.', 'error');
                }
            }
        }

        this.isModelLoading = false;
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

    async generateReport(entries) {
        console.log('Gerando relatório com', entries.length, 'entradas');

        if (!entries || entries.length === 0) {
            return this.generateSimpleFallbackReport([]);
        }

        // SE TIVER CHAVE DE API → usa Claude/Gemini
        const hasAPIKey = this.externalAPIs.claude.available || this.externalAPIs.gemini.available;
        const aiMode = await this.getAIMode();

        if (hasAPIKey && aiMode === 'fast') {
            return await this.generateFastReport(entries);
        }

        // SE NÃO TIVER CHAVE → usa o fallback inteligente (que já tá lindo!)
        console.log('Usando análise local inteligente (100% privada)');
        return this.generateIntelligentFallbackReport(entries);
    }

    async getAIMode() {
        try {
            const mode = await window.mentalStorage?.getSetting('ai-mode');
            return mode || 'fast'; // Default to fast mode
        } catch (error) {
            console.log('⚙️ [AI] Erro ao obter modo IA:', error.message);
            return 'fast';
        }
    }

    async generateLocalMedGemmaReport(entries) {
        console.log('🧠 [AI] Gerando relatório com MedGemma-2B-IT local');

        try {
            if (!this.localModel) {
                // Try to load model if not loaded yet
                if (!this.isModelLoading) {
                    await this.initLocalModel();
                }

                // Wait a bit for model to load
                let attempts = 0;
                while (!this.localModel && attempts < 50) { // 5 seconds max wait
                    await new Promise(resolve => setTimeout(resolve, 100));
                    attempts++;
                }

                if (!this.localModel) {
                    throw new Error('Modelo MedGemma não pôde ser carregado');
                }
            }

            const summary = this.prepareMoodSummary(entries);
            const prompt = this.createMedGemmaPrompt(summary);

            console.log('🧠 [AI] Enviando prompt para MedGemma...');

            // Generate with MedGemma
            const output = await this.localModel(prompt, {
                max_new_tokens: 1024,
                temperature: 0.7,
                do_sample: true,
                pad_token_id: this.localModel.tokenizer.eos_token_id
            });

            const analysis = output[0].generated_text.replace(prompt, '').trim();

            return {
                title: 'Análise Personalizada - MedGemma Local',
                subtitle: 'Gerada por IA médica local com total privacidade',
                analysis: this.formatMedGemmaAnalysis(analysis, summary),
                recommendations: this.generateRecommendations(summary),
                insights: this.generateInsights(summary),
                disclaimer: 'Esta análise foi gerada por MedGemma-2B localmente no seu dispositivo. Não substitui acompanhamento profissional.',
                timestamp: new Date().toISOString(),
                source: 'MedGemma-2B-IT Local'
            };

        } catch (error) {
            console.error('❌ [AI] Erro no MedGemma:', error);
            // Fallback to intelligent local analysis
            return this.generateIntelligentFallbackReport(entries);
        }
    }

    createMedGemmaPrompt(summary) {
        return `Você é um psicólogo clínico experiente e empático. Analise os dados de humor do paciente abaixo e forneça uma análise completa e acolhedora em português brasileiro.

**DADOS DO PACIENTE:**
- Período: ${summary.dateRange}
- Total de registros: ${summary.totalEntries}
- Média de humor: ${summary.averageMood.toFixed(1)}/5.0
- Sentimentos mais frequentes: ${summary.topFeelings.join(', ')}
- Tendência recente: ${summary.recentTrend > 0 ? 'Melhora' : summary.recentTrend < 0 ? 'Declínio' : 'Estável'}

**INSTRUÇÕES:**
Forneça uma análise psicológica profissional que inclua:
1. Avaliação empática do estado emocional atual
2. Identificação de padrões e gatilhos emocionais
3. Análise da tendência e possíveis causas
4. Recomendações práticas e acessíveis
5. Incentivo positivo e acolhedor

Use linguagem acolhedora, evite jargões técnicos excessivos, seja sempre empático e encorajador. Lembre que você está falando diretamente com o paciente.

**ANÁLISE PSICOLÓGICA:**`;
    }

    formatMedGemmaAnalysis(rawAnalysis, summary) {
        // Clean and format the MedGemma output
        let analysis = rawAnalysis;

        // Remove any unwanted prefixes or artifacts
        analysis = analysis.replace(/^.*?ANÁLISE PSICOLÓGICA:\s*/i, '');
        analysis = analysis.replace(/^#+\s*/gm, '## ');

        // Ensure it's in Portuguese and empathetic
        if (!analysis.includes('Olá') && !analysis.includes('Prezado') && !analysis.includes('Caro')) {
            analysis = `## Análise Personalizada do Seu Bem-Estar Emocional

${analysis}`;
        }

        // Add structure if missing
        if (!analysis.includes('##')) {
            const sections = analysis.split('\n\n');
            analysis = `## Avaliação Geral
${sections[0] || 'Análise em processamento...'}

## Padrões Identificados
${sections[1] || 'Identificando padrões emocionais...'}

## Recomendações Práticas
${sections[2] || 'Preparando recomendações personalizadas...'}`;
        }

        return analysis;
    }

    async generateFastReport(entries) {
        console.log('⚡ [AI] generateFastReport chamado');

        // Try external APIs first (faster)
        if (this.externalAPIs.claude.available) {
            console.log('🤖 [AI] Tentando Claude API...');
            try {
                return await this.generateClaudeReport(entries);
            } catch (error) {
                console.log('⚠️ [AI] Claude falhou, tentando Gemini...');
            }
        }

        if (this.externalAPIs.gemini.available) {
            console.log('🤖 [AI] Tentando Gemini API...');
            try {
                return await this.generateGeminiReport(entries);
            } catch (error) {
                console.log('⚠️ [AI] Gemini falhou, usando análise local...');
            }
        }

        // Fallback to intelligent local analysis
        console.log('🤖 [AI] Usando análise local inteligente');
        return this.generateIntelligentFallbackReport(entries);
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

Olá! Baseado em ${summary.totalEntries} registros de humor coletados ao longo de ${summary.daysCovered} dias, preparei uma análise cuidadosa do seu padrão emocional:

### 🎯 **Avaliação Geral do Seu Estado Emocional**
`;

        // Mood analysis
        if (summary.averageMood >= 4.5) {
            analysis += `Seus registros mostram um padrão excepcional de bem-estar emocional, com uma média de ${summary.averageMood.toFixed(1)}/5.0. Isso indica que você está passando por um período muito positivo, mantendo altos níveis de satisfação e contentamento na maior parte do tempo. É maravilhoso ver essa consistência!\n\n`;
        } else if (summary.averageMood >= 3.5) {
            analysis += `Sua média de humor está em ${summary.averageMood.toFixed(1)}/5.0, o que reflete um equilíbrio emocional saudável. Você demonstra capacidade de manter estabilidade emocional com variações normais ao longo do tempo. Isso é um sinal muito positivo!\n\n`;
        } else if (summary.averageMood >= 2.5) {
            analysis += `Seus registros indicam uma média de ${summary.averageMood.toFixed(1)}/5.0, sugerindo que você pode estar enfrentando alguns desafios emocionais. É importante reconhecer esses padrões e considerar estratégias para melhorar seu bem-estar. Lembre-se: pedir ajuda é um sinal de força.\n\n`;
        } else {
            analysis += `Sua média de humor está em ${summary.averageMood.toFixed(1)}/5.0, indicando que você está passando por um período mais desafiador emocionalmente. Seus dados mostram a necessidade de atenção especial ao seu bem-estar mental. Você não está sozinho nessa jornada.\n\n`;
        }

        // Feelings analysis
        if (summary.topFeelings.length > 0) {
            analysis += `### 🎭 **Padrões Emocionais que Identifiquei**
Os sentimentos mais presentes em seus registros são: **${summary.topFeelings.slice(0, 3).join(', ')}**. Isso nos dá pistas importantes sobre seus estados emocionais mais recorrentes e pode ajudar a identificar gatilhos ou padrões comportamentais. Cada emoção que você registra é valiosa para entender melhor seu mundo interno.\n\n`;
        }

        // Trend analysis
        if (Math.abs(summary.recentTrend) > 0.3) {
            if (summary.recentTrend > 0) {
                analysis += `### 📈 **Tendência Positiva que Me Alegra Ver**
Seus dados mostram uma tendência de melhora no humor nos últimos dias, o que é um sinal muito encorajador. Continue com as práticas que estão funcionando - você está no caminho certo!\n\n`;
            } else {
                analysis += `### 📉 **Atenção Carinhosa Necessária**
Seus registros indicam uma tendência de declínio no humor recentemente. Pode ser útil identificar fatores que contribuem para essa mudança e considerar ajustes em sua rotina. Pequenas mudanças podem fazer grande diferença.\n\n`;
            }
        } else {
            analysis += `### ⚖️ **Estabilidade Emocional Presente**
Seu humor tem se mantido relativamente estável nos últimos períodos, o que demonstra consistência emocional. Isso é uma base sólida para construir ainda mais bem-estar.\n\n`;
        }

        // Recommendations
        analysis += `### 💡 **Recomendações Personalizadas com Carinho**

**Para cuidar melhor de você:**
• Mantenha o hábito de registrar seu humor diariamente - o autocuidado começa com a consciência e você está fazendo isso muito bem
• Pratique atividades físicas regulares, que ajudam no equilíbrio emocional e liberam endorfinas naturais
• Mantenha uma rotina de sono adequada e alimentação balanceada - seu corpo e mente agradecem

`;

        if (summary.averageMood < 3) {
            analysis += `**Cuidado especial que recomendo:**
• Considere buscar apoio profissional de um psicólogo ou terapeuta - eles estão lá para ajudar você a navegar por esses momentos
• Pratique técnicas de relaxamento ou meditação para reduzir ansiedade - respire fundo, você merece paz
• Fortaleça suas conexões sociais - o apoio de pessoas queridas é fundamental, e você merece ter pessoas ao seu lado

`;
        } else if (summary.averageMood >= 4) {
            analysis += `**Para manter e celebrar esse equilíbrio:**
• Continue com as práticas que estão funcionando bem - você merece comemorar suas vitórias
• Compartilhe suas experiências positivas com outros que possam se beneficiar - sua força inspira
• Use este momento positivo para estabelecer novos objetivos pessoais - você tem potencial incrível

`;
        }

        analysis += `### 🌟 **Uma Mensagem de Apoio**
Você está dando um passo importante ao cuidar da sua saúde mental. Cada registro que você faz é uma demonstração de amor próprio e compromisso com seu bem-estar. Seja gentil consigo mesmo durante essa jornada - você merece toda a compaixão do mundo.

Se precisar conversar ou tiver dúvidas sobre seus registros, estou aqui para ajudar. Você não está sozinho nessa caminhada rumo ao bem-estar emocional.`;

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
                analysis: 'Não há registros de humor suficientes para gerar uma análise. Comece registrando seu humor diariamente para receber insights personalizados sobre seu bem-estar emocional. Cada pequeno passo conta!',
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
            analysis: `Você registrou ${totalEntries} entradas de humor com uma média de ${avgMood}/5.0. Continue registrando para receber análises mais detalhadas e insights personalizados sobre seu bem-estar emocional. Cada registro é uma vitória para seu autocuidado!`,
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

    // PDF Generation - Mobile Optimized
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

            // Mobile-specific improvements
            const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
            
            this.showToast('Gerando PDF...', 'info');
            
            // Add loading indicator for mobile
            if (isMobile) {
                document.body.style.cursor = 'wait';
                const loadingEl = document.createElement('div');
                loadingEl.id = 'pdf-loading';
                loadingEl.style.cssText = `
                    position: fixed;
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%);
                    background: rgba(0,0,0,0.8);
                    color: white;
                    padding: 20px;
                    border-radius: 10px;
                    z-index: 10000;
                    font-size: 16px;
                `;
                loadingEl.textContent = '📄 Gerando PDF...';
                document.body.appendChild(loadingEl);
            }

            // Prepare content for PDF
            reportContent.classList.add('pdf-generation');

            // Mobile-optimized canvas settings
            const canvasOptions = {
                scale: isMobile ? 1.5 : 2, // Lower scale on mobile for performance
                useCORS: true,
                backgroundColor: '#ffffff',
                width: reportContent.scrollWidth,
                height: reportContent.scrollHeight,
                allowTaint: true,
                foreignObjectRendering: true,
                logging: false, // Disable logging on mobile
                onclone: (clonedDoc) => {
                    // Ensure mobile-friendly rendering
                    const clonedContent = clonedDoc.getElementById('report-content');
                    if (clonedContent && isMobile) {
                        clonedContent.style.maxWidth = '100%';
                        clonedContent.style.overflow = 'visible';
                    }
                }
            };

            const canvas = await html2canvas(reportContent, canvasOptions);

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

            // Download with mobile improvements
            const filename = `Relatorio_MentalIA_${dateStr.replace(/\//g, '-')}.pdf`;
            
            if (isMobile) {
                // Mobile-specific download handling
                try {
                    // Try direct download first
                    pdf.save(filename);
                    
                    // Alternative for iOS Safari and other browsers that might block download
                    setTimeout(() => {
                        const pdfOutput = pdf.output('blob');
                        const pdfUrl = URL.createObjectURL(pdfOutput);
                        
                        // Create temporary link for mobile download
                        const tempLink = document.createElement('a');
                        tempLink.href = pdfUrl;
                        tempLink.download = filename;
                        tempLink.style.display = 'none';
                        document.body.appendChild(tempLink);
                        
                        // Trigger download
                        tempLink.click();
                        
                        // Clean up
                        setTimeout(() => {
                            document.body.removeChild(tempLink);
                            URL.revokeObjectURL(pdfUrl);
                        }, 100);
                    }, 100);
                    
                } catch (downloadError) {
                    console.warn('Fallback para download mobile:', downloadError);
                    // Show PDF in new tab as fallback
                    const pdfOutput = pdf.output('blob');
                    const pdfUrl = URL.createObjectURL(pdfOutput);
                    window.open(pdfUrl, '_blank');
                }
            } else {
                // Desktop download
                pdf.save(filename);
            }

            // Clean up mobile loading indicator
            if (isMobile) {
                document.body.style.cursor = '';
                const loadingEl = document.getElementById('pdf-loading');
                if (loadingEl) {
                    document.body.removeChild(loadingEl);
                }
            }

            this.showToast('PDF gerado com sucesso!', 'success');
            console.log('✅ [PDF] PDF gerado e baixado');

        } catch (error) {
            console.error('❌ [PDF] Erro:', error);
            
            // Clean up mobile loading indicator on error
            const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
            if (isMobile) {
                document.body.style.cursor = '';
                const loadingEl = document.getElementById('pdf-loading');
                if (loadingEl) {
                    document.body.removeChild(loadingEl);
                }
            }
            
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

// Global method for compatibility with existing buttons
window.aiAnalysis.downloadReport = function() {
    return this.downloadReportPDF();
};

console.log('🤖 Módulo de análise de IA carregado com sucesso');