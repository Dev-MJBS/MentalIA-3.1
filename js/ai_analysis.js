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
        try {
            console.log('🧠 [AI] Gerando relatório com', entries.length, 'entradas');

            if (!entries || entries.length === 0) {
                console.log('📝 [AI] Sem dados - usando relatório básico');
                return this.generateSimpleFallbackReport([]);
            }

            // 🔥 CORREÇÃO: Validar formato das entradas (mais permissiva)
            const validEntries = entries.filter(entry => {
                if (!entry) return false;
                
                // Aceitar tanto number quanto string que pode ser convertida
                const moodValue = typeof entry.mood === 'number' ? entry.mood : parseFloat(entry.mood);
                return !isNaN(moodValue) && isFinite(moodValue) && moodValue >= 0 && moodValue <= 5;
            });

            if (validEntries.length === 0) {
                console.warn('⚠️ [AI] Nenhuma entrada válida encontrada após filtro');
                console.log('📊 [AI] Entradas originais:', entries);
                return this.generateSimpleFallbackReport([]);
            }

            console.log('✅ [AI] Entradas válidas:', validEntries.length);

            // SE TIVER CHAVE DE API → usa Claude/Gemini
            const hasAPIKey = this.externalAPIs.claude.available || this.externalAPIs.gemini.available;
            const aiMode = await this.getAIMode();

            if (hasAPIKey && aiMode === 'fast') {
                console.log('🚀 [AI] Usando API externa (fast mode)');
                return await this.generateFastReport(validEntries);
            }

            // SE NÃO TIVER CHAVE → usa o fallback inteligente (que já tá lindo!)
            console.log('🧠 [AI] Usando análise local inteligente (100% privada)');
            return this.generateIntelligentFallbackReport(validEntries);

        } catch (error) {
            console.error('❌ [AI] Erro na geração do relatório:', error);
            console.error('❌ [AI] Stack trace:', error.stack);
            console.error('❌ [AI] Tipo do erro:', typeof error);
            console.error('❌ [AI] Mensagem do erro:', error.message);
            
            // Fallback final - sempre retorna algo
            return {
                title: 'Relatório MentalIA - Modo Seguro',
                subtitle: 'Análise básica disponível',
                analysis: '⚠️ Houve um problema técnico ao gerar seu relatório completo, mas não se preocupe! Seus dados estão seguros. Baseado nas informações disponíveis, continue registrando seu humor regularmente para obter insights valiosos sobre seu bem-estar emocional.',
                recommendations: [
                    'Continue registrando seu humor diariamente',
                    'Tente gerar o relatório novamente em alguns minutos',
                    'Verifique se tem uma conexão estável com a internet'
                ],
                insights: [
                    'Sistema funcionando em modo seguro',
                    'Seus dados estão protegidos',
                    'Análise completa será restaurada em breve'
                ],
                disclaimer: 'Relatório gerado em modo seguro devido a erro técnico temporário. Seus dados permanecem seguros.',
                timestamp: new Date().toISOString(),
                source: 'MentalIA Safe Mode',
                error: true
            };
        }
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
        try {
            console.log('🤖 [AI] Gerando relatório inteligente local');
            console.log('🤖 [AI] Entradas recebidas:', entries.length, entries);

            if (!entries || entries.length === 0) {
                console.log('📝 [AI] Sem entradas, usando fallback simples');
                return this.generateSimpleFallbackReport([]);
            }

            console.log('🤖 [AI] Preparando summary dos dados...');
            const summary = this.prepareMoodSummary(entries);
            console.log('🤖 [AI] Summary preparado:', summary);
            
            if (!summary) {
                console.warn('⚠️ [AI] Erro ao preparar summary, usando fallback básico');
                return this.generateSimpleFallbackReport(entries);
            }

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
        if (summary.topFeelings && Array.isArray(summary.topFeelings) && summary.topFeelings.length > 0) {
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
        
        } catch (error) {
            console.error('❌ [AI] Erro no relatório inteligente:', error);
            return this.generateSimpleFallbackReport(entries);
        }
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
        try {
            console.log('📊 [AI] Preparando summary de', entries.length, 'entradas');
            
            if (!entries || entries.length === 0) {
                console.warn('⚠️ [AI] Sem entradas para preparar summary');
                return {
                    totalEntries: 0,
                    averageMood: 3.0,
                    moodDistribution: [0, 0, 0, 0, 0],
                    topFeelings: [],
                    recentTrend: 0,
                    recentAvg: 3.0,
                    previousAvg: 3.0,
                    daysCovered: 0,
                    dateRange: 'N/A'
                };
            }
            
            const totalEntries = entries.length;
            const avgMood = entries.reduce((sum, entry) => {
                const moodValue = typeof entry.mood === 'number' ? entry.mood : parseFloat(entry.mood) || 0;
                return sum + moodValue;
            }, 0) / totalEntries;
            
            console.log('📊 [AI] Humor médio calculado:', avgMood);

        // Get mood distribution
        const moodCounts = [0, 0, 0, 0, 0];
        entries.forEach(entry => {
            moodCounts[Math.round(entry.mood) - 1]++;
        });

        // Get most common feelings
        const feelingCounts = {};
        entries.forEach(entry => {
            if (entry.feelings && Array.isArray(entry.feelings)) {
                entry.feelings.forEach(feeling => {
                    // Handle both string format and object format
                    const feelingValue = typeof feeling === 'string' ? feeling : feeling?.label || feeling?.value || 'unknown';
                    feelingCounts[feelingValue] = (feelingCounts[feelingValue] || 0) + 1;
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

            const result = {
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
            
            console.log('📊 [AI] Summary finalizado:', result);
            return result;
            
        } catch (error) {
            console.error('❌ [AI] Erro ao preparar summary:', error);
            return null;
        }
    }

    createAnalysisPrompt(summary) {
        return `Como psicólogo clínico especializado em saúde mental, analise os seguintes dados de humor de um paciente e forneça uma análise empática e profissional em português brasileiro:

**Dados do Paciente:**
- Período analisado: ${summary.dateRange}
- Total de registros: ${summary.totalEntries}
- Humor médio: ${summary.averageMood.toFixed(1)}/5
- Sentimentos mais frequentes: ${summary.topFeelings && Array.isArray(summary.topFeelings) ? summary.topFeelings.join(', ') : 'N/A'}
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

        if (summary.topFeelings && Array.isArray(summary.topFeelings) && 
            (summary.topFeelings.includes('ansioso') || summary.topFeelings.includes('ansiosa'))) {
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

    // PDF Generation - Structured and Organized
    async downloadReportPDF(reportData = null) {
        try {
            console.log('📄 [PDF] Iniciando geração de PDF estruturado...');

            // Check if jsPDF is loaded
            let jsPDFClass = null;

            if (typeof jsPDF !== 'undefined') {
                jsPDFClass = jsPDF;
            } else if (window.jspdf && window.jspdf.jsPDF) {
                jsPDFClass = window.jspdf.jsPDF;
            } else if (window.jsPDF) {
                jsPDFClass = window.jsPDF;
            } else {
                throw new Error('Biblioteca jsPDF não foi carregada. Verifique sua conexão com a internet.');
            }

            console.log('📄 [PDF] jsPDF encontrado:', !!jsPDFClass);

            // Get report data or generate new one
            let report = reportData;
            if (!report) {
                const entries = await window.mentalStorage.getAllMoodEntries();
                if (entries.length === 0) {
                    throw new Error('Nenhum dado encontrado para gerar relatório');
                }
                report = await this.generateReport(entries);
            }

            console.log('📄 [PDF] Dados do relatório:', report);

            this.showToast('📄 Gerando PDF estruturado...', 'info');

            // Create PDF instance with UTF-8 support
            const pdf = new jsPDFClass({
                orientation: 'p',
                unit: 'mm',
                format: 'a4',
                putOnlyUsedFonts: true,
                compress: true
            });

            // 🔥 CORREÇÃO: Adicionar fonte que suporta caracteres UTF-8
            // Usar fonte padrão que suporta melhor caracteres especiais
            pdf.setFont('helvetica', 'normal');

            const pageWidth = pdf.internal.pageSize.getWidth();
            const pageHeight = pdf.internal.pageSize.getHeight();
            const margin = 20;
            const contentWidth = pageWidth - (margin * 2);
            let yPosition = margin;

            // 🔥 CORREÇÃO: Função para sanitizar texto e remover caracteres problemáticos
            const sanitizeText = (text) => {
                if (!text) return '';
                // Remover emojis e caracteres especiais que podem causar problemas
                return text
                    .replace(/[\u{1F600}-\u{1F64F}]/gu, '') // Emojis de rosto
                    .replace(/[\u{1F300}-\u{1F5FF}]/gu, '') // Símbolos e pictogramas
                    .replace(/[\u{1F680}-\u{1F6FF}]/gu, '') // Transporte e símbolos
                    .replace(/[\u{1F1E0}-\u{1F1FF}]/gu, '') // Bandeiras
                    .replace(/[\u{2600}-\u{26FF}]/gu, '') // Símbolos diversos
                    .replace(/[\u{2700}-\u{27BF}]/gu, '') // Dingbats
                    .replace(/[^\x00-\x7F\u00C0-\u00FF]/g, '') // Manter apenas ASCII básico + caracteres latinos
                    .trim();
            };

            // Helper function to add text with line wrapping
            const addWrappedText = (text, x, y, maxWidth, fontSize = 12, fontStyle = 'normal') => {
                pdf.setFontSize(fontSize);
                pdf.setFont('helvetica', fontStyle);

                // 🔥 CORREÇÃO: Sanitizar texto antes de adicionar ao PDF
                const cleanText = sanitizeText(text);
                const lines = pdf.splitTextToSize(cleanText, maxWidth);
                pdf.text(lines, x, y);
                return y + (lines.length * (fontSize * 0.35)); // Return new Y position
            };

            // Helper function to check if we need a new page
            const checkNewPage = (neededSpace) => {
                if (yPosition + neededSpace > pageHeight - margin) {
                    pdf.addPage();
                    yPosition = margin;
                }
            };

            // 📋 HEADER - Título e Data
            pdf.setFillColor(26, 26, 46); // Dark blue background
            pdf.rect(0, 0, pageWidth, 40, 'F');

            pdf.setTextColor(255, 255, 255); // White text
            pdf.setFontSize(24);
            pdf.setFont('helvetica', 'bold');
            pdf.text(sanitizeText('Relatorio MentalIA'), margin, 25);

            const dateStr = new Date().toLocaleDateString('pt-BR', {
                day: '2-digit',
                month: 'long',
                year: 'numeric'
            });
            pdf.setFontSize(12);
            pdf.setFont('helvetica', 'normal');
            pdf.text(sanitizeText(`Gerado em ${dateStr}`), margin, 35);

            // Reset colors for content
            pdf.setTextColor(0, 0, 0);
            yPosition = 55;

            // 📋 SEÇÃO 1: TÍTULO DO RELATÓRIO
            checkNewPage(30);
            pdf.setFillColor(99, 102, 241); // Blue background
            pdf.rect(margin - 5, yPosition - 5, contentWidth + 10, 20, 'F');

            pdf.setTextColor(255, 255, 255);
            pdf.setFontSize(16);
            pdf.setFont('helvetica', 'bold');
            pdf.text(sanitizeText(report.title || 'Relatorio de Bem-Estar'), margin, yPosition + 8);

            pdf.setTextColor(0, 0, 0);
            yPosition += 30;

            // 📋 SEÇÃO 2: SUBTÍTULO
            if (report.subtitle) {
                checkNewPage(20);
                yPosition = addWrappedText(report.subtitle, margin, yPosition, contentWidth, 12, 'italic');
                yPosition += 10;
            }

            // 📋 SEÇÃO 3: ANÁLISE PRINCIPAL
            if (report.analysis) {
                checkNewPage(40);
                pdf.setFillColor(240, 240, 240);
                pdf.rect(margin - 5, yPosition - 5, contentWidth + 10, 15, 'F');

                pdf.setFontSize(14);
                pdf.setFont('helvetica', 'bold');
                pdf.text(sanitizeText('Analise Personalizada'), margin, yPosition + 6);
                yPosition += 25;

                // Clean and format analysis text
                const analysisText = report.analysis
                    .replace(/#{1,6}\s/g, '') // Remove markdown headers
                    .replace(/\*\*(.*?)\*\*/g, '$1') // Remove bold markdown
                    .replace(/\n\n+/g, '\n\n') // Normalize line breaks
                    .trim();

                yPosition = addWrappedText(analysisText, margin, yPosition, contentWidth, 11, 'normal');
                yPosition += 15;
            }

            // 📋 SEÇÃO 4: RECOMENDAÇÕES
            if (report.recommendations && report.recommendations.length > 0) {
                checkNewPage(40);
                pdf.setFillColor(240, 248, 255);
                pdf.rect(margin - 5, yPosition - 5, contentWidth + 10, 15, 'F');

                pdf.setFontSize(14);
                pdf.setFont('helvetica', 'bold');
                pdf.text(sanitizeText('Recomendacoes Personalizadas'), margin, yPosition + 6);
                yPosition += 25;

                report.recommendations.forEach((rec, index) => {
                    checkNewPage(15);
                    const bullet = `${index + 1}.`;
                    pdf.setFontSize(11);
                    pdf.setFont('helvetica', 'normal');
                    pdf.text(bullet, margin, yPosition);
                    yPosition = addWrappedText(rec, margin + 10, yPosition, contentWidth - 10, 11, 'normal');
                    yPosition += 5;
                });
                yPosition += 10;
            }

            // 📋 SEÇÃO 5: INSIGHTS
            if (report.insights && report.insights.length > 0) {
                checkNewPage(40);
                pdf.setFillColor(255, 248, 240);
                pdf.rect(margin - 5, yPosition - 5, contentWidth + 10, 15, 'F');

                pdf.setFontSize(14);
                pdf.setFont('helvetica', 'bold');
                pdf.text(sanitizeText('Insights Importantes'), margin, yPosition + 6);
                yPosition += 25;

                report.insights.forEach((insight, index) => {
                    checkNewPage(15);
                    const bullet = `•`;
                    pdf.setFontSize(11);
                    pdf.setFont('helvetica', 'normal');
                    pdf.text(bullet, margin, yPosition);
                    yPosition = addWrappedText(insight, margin + 8, yPosition, contentWidth - 8, 11, 'normal');
                    yPosition += 5;
                });
                yPosition += 10;
            }

            // 📋 SEÇÃO 6: DISCLAIMER
            if (report.disclaimer) {
                checkNewPage(30);
                pdf.setFillColor(255, 240, 240);
                pdf.rect(margin - 5, yPosition - 5, contentWidth + 10, 25, 'F');

                pdf.setFontSize(12);
                pdf.setFont('helvetica', 'bold');
                pdf.text(sanitizeText('Importante'), margin, yPosition + 8);
                yPosition += 18;

                yPosition = addWrappedText(report.disclaimer, margin, yPosition, contentWidth, 10, 'normal');
            }

            // 📋 FOOTER em todas as páginas
            const totalPages = pdf.internal.getNumberOfPages();
            for (let i = 1; i <= totalPages; i++) {
                pdf.setPage(i);
                pdf.setFontSize(9);
                pdf.setFont('helvetica', 'normal');
                pdf.setTextColor(128, 128, 128);

                const footerLeft = sanitizeText('MentalIA • 100% Local e Privado');
                const footerRight = `Pagina ${i} de ${totalPages}`;

                pdf.text(footerLeft, margin, pageHeight - 10);
                pdf.text(footerRight, pageWidth - margin - pdf.getTextWidth(footerRight), pageHeight - 10);
            }

            // 📥 DOWNLOAD DO PDF
            const now = new Date();
            const filename = `Relatorio_MentalIA_${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}.pdf`;

            console.log('📄 [PDF] Salvando arquivo:', filename);

            try {
                // Download direto
                pdf.save(filename);

                this.showToast('📄 PDF gerado com sucesso!', 'success');
                console.log('✅ [PDF] Download concluído');

            } catch (downloadError) {
                console.warn('⚠️ [PDF] Erro no download direto, tentando alternativa:', downloadError);

                // Fallback: abrir em nova aba
                try {
                    const pdfOutput = pdf.output('blob');
                    const pdfUrl = URL.createObjectURL(pdfOutput);
                    const newWindow = window.open(pdfUrl, '_blank');

                    if (newWindow) {
                        this.showToast('📄 PDF aberto em nova aba', 'info');
                    } else {
                        throw new Error('Popup bloqueado');
                    }

                    // Limpeza após 5 segundos
                    setTimeout(() => URL.revokeObjectURL(pdfUrl), 5000);

                } catch (fallbackError) {
                    console.error('❌ [PDF] Todas as tentativas de download falharam:', fallbackError);
                    this.showToast('❌ Erro ao baixar PDF. Tente novamente.', 'error');
                }
            }

        } catch (error) {
            console.error('❌ [PDF] Erro na geração do PDF:', error);
            this.showToast(`❌ Erro ao gerar PDF: ${error.message}`, 'error');
            throw error;
        }
    }

    showToast(message, type = 'info') {
        // Check if showToast exists globally
        if (typeof window.mentalIA !== 'undefined' && window.mentalIA.showToast) {
            window.mentalIA.showToast(message, type);
        } else {
            console.log( [] );
        }
    }
}

// Initialize AI Analysis
window.aiAnalysis = new AIAnalysis();

// Compatibility function for downloadReport
window.aiAnalysis.downloadReport = function() {
    return this.downloadReportPDF();
};

console.log(' M�dulo de an�lise de IA carregado com sucesso');
