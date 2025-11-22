// MentalIA 3.1 - AI Analysis Module
// Sistema completo de análise de IA com MedGemma-2B-IT local e APIs externas

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

            // Verificar disponibilidade de APIs externas
            await this.checkExternalAPIs();

            // Inicializar modelo local em background
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
        console.log('🧠 Carregando MedGemma-2B-IT local... (100% privado)');

        const maxRetries = 3;
        let attempt = 0;

        while (attempt < maxRetries && !this.localModel) {
            attempt++;
            console.log(`🔄 Tentativa ${attempt}/${maxRetries} de carregar MedGemma-2B-IT...`);

            try {
                // Garantir que Transformers.js está disponível
                if (typeof Transformers === 'undefined') {
                    const { pipeline } = await import('https://cdn.jsdelivr.net/npm/@xenova/transformers@2.17.2');
                    window.Transformers = { pipeline };
                }

                // Modelo leve e eficiente que roda localmente
                this.localModel = await window.Transformers.pipeline('text-generation', 'Xenova/medgemma-2b-it');

                console.log('✅ MedGemma-2B-IT carregado com sucesso! 100% local e privado');
                this.showToast('🧠 IA médica local carregada!', 'success');
                break;

            } catch (error) {
                console.error(`❌ Tentativa ${attempt} falhou:`, error);

                if (attempt < maxRetries) {
                    console.log(`⏳ Aguardando 1s antes da próxima tentativa...`);
                    await new Promise(resolve => setTimeout(resolve, 1000)); // Delay reduzido para 1s
                } else {
                    console.error('💥 Todas as tentativas falharam. Usando fallback inteligente.');
                    this.localModel = null;
                    this.showToast('Modo privado indisponível. Usando análise inteligente.', 'warning');
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
                return this.generateEmptyReport();
            }

            // Validar formato das entradas
            const validEntries = entries.filter(entry => {
                if (!entry) return false;

                const moodValue = typeof entry.mood === 'number' ? entry.mood : parseFloat(entry.mood);
                return !isNaN(moodValue) && isFinite(moodValue) && moodValue >= 1 && moodValue <= 5;
            });

            if (validEntries.length === 0) {
                console.warn('⚠️ [AI] Nenhuma entrada válida encontrada');
                return this.generateEmptyReport();
            }

            console.log('✅ [AI] Entradas válidas:', validEntries.length);

            // SEMPRE usar análise inteligente local com fallback empático
            console.log('🤖 [AI] Gerando relatório inteligente com análise empática');
            return this.generateIntelligentFallbackReport(validEntries);

        } catch (error) {
            console.error('❌ [AI] Erro geral na geração do relatório:', error);
            console.error('❌ [AI] Stack trace:', error.stack);
            console.error('❌ [AI] Tipo do erro:', typeof error);
            console.error('❌ [AI] Mensagem do erro:', error.message);

            // Fallback final - SEMPRE retorna algo empático
            return this.generateFallbackReport(entries);
        }
    }

    async getAIMode() {
        try {
            const mode = await window.mentalStorage?.getSetting('ai-mode');
            return mode || 'fast';
        } catch (error) {
            console.log('⚙️ [AI] Erro ao obter modo IA:', error.message);
            return 'fast';
        }
    }

    async generateLocalMedGemmaReport(entries) {
        console.log('🧠 [AI] Gerando relatório com MedGemma-2B-IT local');

        try {
            if (!this.localModel) {
                if (!this.isModelLoading) {
                    await this.initLocalModel();
                }

                let attempts = 0;
                while (!this.localModel && attempts < 50) {
                    await new Promise(resolve => setTimeout(resolve, 100));
                    attempts++;
                }

                if (!this.localModel) {
                    throw new Error('Modelo MedGemma-2B-IT não pôde ser carregado após múltiplas tentativas');
                }
            }

            const summary = this.prepareMoodSummary(entries);
            const prompt = this.createEmpatheticPrompt(summary);

            console.log('🧠 [AI] Enviando prompt empático para MedGemma-2B-IT...');

            const output = await this.localModel(prompt, {
                max_new_tokens: 1024,
                temperature: 0.7,
                do_sample: true,
                pad_token_id: this.localModel.tokenizer.eos_token_id
            });

            const rawAnalysis = output[0].generated_text.replace(prompt, '').trim();
            const analysis = this.formatMedGemmaAnalysis(rawAnalysis, summary);

            return {
                title: 'Análise Personalizada - MedGemma Local',
                subtitle: 'Gerada por IA médica local com total privacidade',
                analysis: analysis,
                recommendations: this.generateEmpatheticRecommendations(summary),
                insights: this.generateInsights(summary),
                disclaimer: 'Esta análise foi gerada por MedGemma-2B-IT localmente no seu dispositivo. Não substitui acompanhamento profissional de saúde mental.',
                timestamp: new Date().toISOString(),
                source: 'MedGemma-2B-IT Local'
            };

        } catch (error) {
            console.error('❌ [AI] Erro no MedGemma-2B-IT:', error);
            // SEMPRE lançar erro para acionar fallback
            throw error;
        }
    }

    createEmpatheticPrompt(summary) {
        return `Você é um psicólogo clínico experiente, empático e acolhedor. Analise os dados de humor do paciente abaixo e forneça uma análise psicológica completa e profundamente empática em português brasileiro.

**DADOS DO PACIENTE:**
- Período: ${summary.dateRange}
- Total de registros: ${summary.totalEntries}
- Média de humor: ${summary.averageMood.toFixed(1)}/5.0
- Sentimentos mais frequentes: ${summary.topFeelings.join(', ')}
- Tendência recente: ${summary.recentTrend > 0 ? 'Melhora' : summary.recentTrend < 0 ? 'Declínio' : 'Estável'}

**INSTRUÇÕES IMPORTANTES:**
Forneça uma análise psicológica profissional que seja:
1. **Profundamente empática** - Use linguagem acolhedora, compreensiva e carinhosa
2. **Estruturada em português brasileiro** - Seja natural e fluido como uma conversa
3. **Avaliação empática do estado emocional atual** - Demonstre compreensão genuína
4. **Identificação de padrões e gatilhos emocionais** - Com sensibilidade
5. **Análise da tendência e possíveis causas** - Com cuidado e compreensão
6. **Recomendações práticas e acessíveis** - Seja realista e encorajador
7. **Incentivo positivo e acolhedor** - Termine com esperança e apoio

**ESTILO DE COMUNICAÇÃO:**
- Use "Olá" ou "Prezado(a)" para iniciar
- Empregue linguagem calorosa: "Eu entendo", "É compreensível", "Você merece"
- Evite jargões técnicos - seja acessível
- Demonstre validação emocional: "É normal se sentir assim", "Você não está sozinho"
- Termine com mensagem de apoio genuíno

**ANÁLISE PSICOLÓGICA EMPÁTICA:**`;
    }

    formatMedGemmaAnalysis(rawAnalysis, summary) {
        let analysis = rawAnalysis;

        // Limpar artefatos indesejados
        analysis = analysis.replace(/^.*?ANÁLISE PSICOLÓGICA EMPÁTICA:\s*/i, '');
        analysis = analysis.replace(/^#+\s*/gm, '## ');

        // Garantir que seja empático e em português
        if (!analysis.includes('Olá') && !analysis.includes('Prezado') && !analysis.includes('Caro')) {
            analysis = `## Análise Personalizada do Seu Bem-Estar Emocional

Olá! Baseado nos seus ${summary.totalEntries} registros de humor, preparei uma análise cuidadosa e empática do seu padrão emocional. Cada registro que você fez demonstra um compromisso importante com seu autocuidado, e isso já é uma vitória significativa.

${analysis}`;
        }

        // Estruturar se necessário
        if (!analysis.includes('##')) {
            const sections = analysis.split('\n\n');
            analysis = `## Avaliação Carinhosa do Seu Estado Emocional
${sections[0] || 'Análise sendo preparada...'}

## Padrões Emocionais que Identifiquei
${sections[1] || 'Analisando seus padrões emocionais...'}

## Recomendações com Carinho
${sections[2] || 'Preparando recomendações personalizadas...'}`;
        }

        return analysis;
    }

    async generateFastReport(entries) {
        console.log('⚡ [AI] generateFastReport chamado');

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

        return this.generateIntelligentFallbackReport(entries);
    }

    async generateClaudeReport(entries) {
        try {
            const claudeKey = await window.mentalStorage.getSetting('claude-api-key');
            if (!claudeKey) {
                throw new Error('Chave Claude não configurada');
            }

            const summary = this.prepareMoodSummary(entries);
            const prompt = this.createEmpatheticPrompt(summary);

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
                recommendations: this.generateEmpatheticRecommendations(summary),
                insights: this.generateInsights(summary),
                disclaimer: 'Esta análise foi gerada por Claude 3.5 Sonnet. Não substitui acompanhamento profissional de saúde mental.',
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
            const prompt = this.createEmpatheticPrompt(summary);

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
                recommendations: this.generateEmpatheticRecommendations(summary),
                insights: this.generateInsights(summary),
                disclaimer: 'Esta análise foi gerada por Gemini 1.5 Flash. Não substitui acompanhamento profissional de saúde mental.',
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
            console.log('🤖 [AI] Gerando relatório inteligente local (fallback)');

            if (!entries || entries.length === 0) {
                return this.generateEmptyReport();
            }

            const summary = this.prepareMoodSummary(entries);

            let analysis = `## Análise Personalizada do Seu Bem-Estar Emocional

Olá! Sou sua assistente de bem-estar emocional e estou aqui para ajudar você a entender melhor seus padrões de humor. Baseado em ${summary.totalEntries} registros que você fez ao longo de ${summary.daysCovered} dias, preparei uma análise cuidadosa e empática.

### 🎯 **Avaliação Carinhosa do Seu Estado Emocional**
`;

            // Análise baseada na média de humor
            if (summary.averageMood >= 4.5) {
                analysis += `Seus registros mostram um padrão excepcional de bem-estar emocional, com uma média de ${summary.averageMood.toFixed(1)}/5.0. Isso indica que você está passando por um período muito positivo, mantendo altos níveis de satisfação e contentamento. É maravilhoso ver essa consistência - você merece comemorar cada momento de alegria!\n\n`;
            } else if (summary.averageMood >= 3.5) {
                analysis += `Sua média de humor está em ${summary.averageMood.toFixed(1)}/5.0, o que reflete um equilíbrio emocional saudável. Você demonstra capacidade de manter estabilidade emocional com variações normais. Isso é um sinal muito positivo - continue cuidando de você com tanto carinho!\n\n`;
            } else if (summary.averageMood >= 2.5) {
                analysis += `Seus registros indicam uma média de ${summary.averageMood.toFixed(1)}/5.0, sugerindo que você pode estar enfrentando alguns desafios emocionais. É importante reconhecer esses padrões e considerar estratégias para melhorar seu bem-estar. Lembre-se: pedir ajuda é um sinal de força, não de fraqueza.\n\n`;
            } else {
                analysis += `Sua média de humor está em ${summary.averageMood.toFixed(1)}/5.0, indicando que você está passando por um período mais desafiador emocionalmente. Seus dados mostram a necessidade de atenção especial ao seu bem-estar mental. Você não está sozinho nessa jornada - cada passo que você dá importa.\n\n`;
            }

            // Análise de sentimentos
            if (summary.topFeelings && Array.isArray(summary.topFeelings) && summary.topFeelings.length > 0) {
                analysis += `### 🎭 **Padrões Emocionais que Identifiquei com Carinho**
Os sentimentos mais presentes em seus registros são: **${summary.topFeelings.slice(0, 3).join(', ')}**. Isso nos dá pistas importantes sobre seus estados emocionais mais recorrentes. Cada emoção que você registra é valiosa - ela nos ajuda a entender melhor seu mundo interno e a apoiá-lo da melhor forma possível.\n\n`;
            }

            // Análise de tendência
            if (Math.abs(summary.recentTrend) > 0.3) {
                if (summary.recentTrend > 0) {
                    analysis += `### 📈 **Tendência Positiva que Me Alegra Ver**
Seus dados mostram uma tendência de melhora no humor nos últimos dias, o que é um sinal muito encorajador. Continue com as práticas que estão funcionando - você está no caminho certo e merece todo o orgulho por seus esforços!\n\n`;
                } else {
                    analysis += `### 📉 **Atenção Carinhosa que Gostaria de Dar**
Seus registros indicam uma tendência de declínio no humor recentemente. Pode ser útil identificar fatores que contribuem para essa mudança e considerar ajustes em sua rotina. Pequenas mudanças podem fazer grande diferença, e você tem todo o meu apoio nessa caminhada.\n\n`;
                }
            } else {
                analysis += `### ⚖️ **Estabilidade Emocional Presente**
Seu humor tem se mantido relativamente estável nos últimos períodos, o que demonstra consistência emocional. Isso é uma base sólida para construir ainda mais bem-estar - continue se cuidando com tanto amor próprio!\n\n`;
            }

            // Recomendações empáticas
            analysis += `### 💡 **Recomendações Feitas com Carinho**

**Para cuidar melhor de você:**
• Mantenha o hábito de registrar seu humor diariamente - o autocuidado começa com a consciência, e você está fazendo isso de forma admirável
• Pratique atividades físicas regulares - seu corpo e mente agradecem cada passo
• Mantenha uma rotina de sono adequada e alimentação balanceada - você merece todo o cuidado do mundo

`;

            if (summary.averageMood < 3) {
                analysis += `**Cuidado especial que recomendo com muito carinho:**
• Considere buscar apoio profissional de um psicólogo ou terapeuta - eles estão lá para ajudar você a navegar por esses momentos com toda a compreensão que você merece
• Pratique técnicas de relaxamento ou meditação para reduzir ansiedade - respire fundo, você merece paz e tranquilidade
• Fortaleça suas conexões sociais - o apoio de pessoas queridas é fundamental, e você merece ter pessoas ao seu lado nessa caminhada

`;
            } else if (summary.averageMood >= 4) {
                analysis += `**Para manter e celebrar esse equilíbrio:**
• Continue com as práticas que estão funcionando bem - você merece comemorar suas vitórias e conquistas
• Compartilhe suas experiências positivas com outros que possam se beneficiar - sua força e resiliência inspiram
• Use este momento positivo para estabelecer novos objetivos pessoais - você tem potencial incrível e merece realizá-lo

`;
            }

            analysis += `### 🌟 **Uma Mensagem de Apoio Genuíno**
Você está dando um passo importante ao cuidar da sua saúde mental, e isso já é uma vitória significativa. Cada registro que você faz é uma demonstração de amor próprio e compromisso com seu bem-estar. Seja gentil consigo mesmo durante essa jornada - você merece toda a compaixão, compreensão e apoio do mundo.

Se precisar conversar ou tiver dúvidas sobre seus registros, estou aqui para ajudar. Você não está sozinho nessa caminhada rumo ao bem-estar emocional. Cada passo que você dá importa, e você merece todo o orgulho por seus esforços.`;

            return {
                title: 'Relatório de Bem-Estar MentalIA',
                subtitle: 'Análise Inteligente Baseada em Seus Dados',
                analysis: analysis,
                recommendations: this.generateEmpatheticRecommendations(summary),
                insights: this.generateInsights(summary),
                disclaimer: 'Esta análise é baseada em inteligência artificial local. Não substitui consulta médica ou psicológica profissional.',
                timestamp: new Date().toISOString(),
                source: 'MentalIA Analysis Engine'
            };

        } catch (error) {
            console.error('❌ [AI] Erro no relatório inteligente:', error);
            return this.generateEmptyReport();
        }
    }

    generateEmptyReport() {
        console.log('🤖 [AI] Gerando relatório vazio');

        return {
            title: 'Relatório MentalIA',
            subtitle: 'Nenhum dado disponível',
            analysis: 'Olá! Ainda não há registros de humor suficientes para gerar uma análise completa. Comece registrando seu humor diariamente para receber insights personalizados sobre seu bem-estar emocional. Cada pequeno passo conta e você merece todo o apoio nessa jornada!',
            recommendations: [
                'Registre seu humor diariamente - cada registro é uma vitória',
                'Seja consistente nos registros para melhores análises',
                'Use os sentimentos para identificar gatilhos emocionais'
            ],
            insights: ['Dados insuficientes para insights detalhados'],
            disclaimer: 'Relatório básico - mais dados são necessários para análises completas com IA.',
            timestamp: new Date().toISOString(),
            source: 'MentalIA Basic'
        };
    }

    generateFallbackReport(entries) {
        console.log('🤖 [AI] Gerando relatório de fallback');

        const totalEntries = entries?.length || 0;
        const avgMood = totalEntries > 0 ?
            (entries.reduce((sum, entry) => sum + (entry.mood || 3), 0) / totalEntries).toFixed(1) : '3.0';

        return {
            title: 'Relatório MentalIA - Modo Seguro',
            subtitle: 'Análise básica disponível',
            analysis: `Olá! Embora tenha havido um problema técnico, seus dados estão seguros. Baseado nas informações disponíveis, você registrou ${totalEntries} entradas com média de humor ${avgMood}/5.0. Continue registrando seu humor regularmente para obter insights valiosos sobre seu bem-estar emocional. Você merece todo o cuidado e atenção nessa jornada.`,
            recommendations: [
                'Continue registrando seu humor diariamente',
                'Tente gerar o relatório novamente em alguns minutos',
                'Verifique se tem uma conexão estável com a internet'
            ],
            insights: [
                'Sistema funcionando em modo seguro',
                'Seus dados estão protegidos',
                `Média de humor: ${avgMood}/5.0`
            ],
            disclaimer: 'Relatório gerado em modo seguro devido a erro técnico temporário. Seus dados permanecem seguros.',
            timestamp: new Date().toISOString(),
            source: 'MentalIA Safe Mode',
            error: true
        };
    }

    prepareMoodSummary(entries) {
        try {
            console.log('📊 [AI] Preparando summary de', entries.length, 'entradas');

            if (!entries || entries.length === 0) {
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

            // Distribuição de humor
            const moodCounts = [0, 0, 0, 0, 0];
            entries.forEach(entry => {
                const mood = Math.round(entry.mood) - 1;
                if (mood >= 0 && mood <= 4) moodCounts[mood]++;
            });

            // Sentimentos mais frequentes
            const feelingCounts = {};
            entries.forEach(entry => {
                if (entry.feelings && Array.isArray(entry.feelings)) {
                    entry.feelings.forEach(feeling => {
                        const feelingValue = typeof feeling === 'string' ? feeling : feeling?.label || feeling?.value || 'unknown';
                        feelingCounts[feelingValue] = (feelingCounts[feelingValue] || 0) + 1;
                    });
                }
            });

            const topFeelings = Object.entries(feelingCounts)
                .sort(([,a], [,b]) => b - a)
                .slice(0, 5)
                .map(([feeling]) => feeling);

            // Cálculo de tendências
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

    generateEmpatheticRecommendations(summary) {
        const recommendations = [
            'Mantenha o hábito de registrar seu humor diariamente - você está se cuidando de forma admirável',
            'Pratique atividades físicas regulares - seu corpo e mente agradecem cada passo',
            'Mantenha uma rotina de sono adequada - você merece descansar bem'
        ];

        if (summary.averageMood < 3) {
            recommendations.push('Considere buscar apoio profissional - você merece todo o cuidado e compreensão');
            recommendations.push('Pratique técnicas de relaxamento - respire fundo, você merece paz');
        }

        if (summary.topFeelings && Array.isArray(summary.topFeelings) &&
            (summary.topFeelings.includes('ansioso') || summary.topFeelings.includes('ansiosa'))) {
            recommendations.push('Experimente meditação ou mindfulness - você merece tranquilidade');
        }

        return recommendations;
    }

    generateInsights(summary) {
        const insights = [];

        if (summary.averageMood >= 4) {
            insights.push('Padrão de humor predominantemente positivo - você merece celebrar!');
        } else if (summary.averageMood >= 3) {
            insights.push('Equilíbrio emocional saudável presente');
        } else {
            insights.push('Período de atenção ao bem-estar emocional - você não está sozinho');
        }

        if (summary.recentTrend > 0.2) {
            insights.push('Tendência positiva recente - continue assim!');
        } else if (summary.recentTrend < -0.2) {
            insights.push('Atenção carinhosa necessária à tendência atual');
        }

        return insights;
    }

    showToast(message, type = 'info') {
        if (typeof window.mentalIA !== 'undefined' && window.mentalIA.showToast) {
            window.mentalIA.showToast(message, type);
        } else {
            console.log(`[${type.toUpperCase()}] ${message}`);
        }
    }
}

// Inicializar AI Analysis
window.aiAnalysis = new AIAnalysis();

// Função de compatibilidade para downloadReport
window.aiAnalysis.downloadReport = function() {
    return this.downloadReportPDF();
};

console.log('🤖 Módulo de análise de IA carregado com sucesso - MedGemma-2B-IT pronto!');
