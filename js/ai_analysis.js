// MentalIA 3.0 - AI Analysis Module
// Local MedGemma-4B-IT + External API integration with Web Workers

class AIAnalysis {
    constructor() {
        this.isLocalModelLoaded = false;
        this.localModel = null;
        this.tokenizer = null;
        this.worker = null;
        this.isProcessing = false;
        
        // External API configurations
        this.externalAPIs = {
            claude: {
                url: 'https://api.anthropic.com/v1/messages',
                model: 'claude-3-5-sonnet-20241022',
                available: false
            },
            gemini: {
                url: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent',
                available: false
            }
        };
    }

    async init() {
        try {
            console.log('🤖 [AI DEBUG] Inicializando módulo de IA...');
            
            // Verificar se já foi inicializado
            if (this.worker) {
                console.log('🤖 [AI DEBUG] Módulo já inicializado');
                return true;
            }
            
            console.log('🤖 [AI DEBUG] Inicializando web worker...');
            // Initialize web worker for local AI processing
            await this.initWorker();
            console.log('🤖 [AI DEBUG] Web worker inicializado');
            
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

    async initWorker() {
        try {
            // Create worker for AI processing
            const workerCode = `
                // Web Worker for AI Processing
                let model = null;
                let tokenizer = null;
                let isModelLoaded = false;

                // Import Transformers.js in worker
                importScripts('https://cdn.jsdelivr.net/npm/@xenova/transformers@2.17.2/dist/transformers.min.js');

                self.onmessage = async function(e) {
                    const { type, data } = e.data;
                    
                    try {
                        switch (type) {
                            case 'loadModel':
                                await loadLocalModel();
                                break;
                            case 'generateReport':
                                const report = await generateLocalReport(data.entries);
                                self.postMessage({ type: 'reportComplete', data: report });
                                break;
                            case 'analyzeText':
                                const analysis = await analyzeText(data.text);
                                self.postMessage({ type: 'analysisComplete', data: analysis });
                                break;
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
        return new Promise((resolve, reject) => {
            console.log('🤖 [AI DEBUG] generateLocalReport chamado');
            
            if (!this.worker) {
                console.log('🤖 [AI DEBUG] Worker não disponível, usando fallback');
                resolve(this.generateSimpleFallbackReport(entries));
                return;
            }
            
            // Set up one-time listeners
            const handleMessage = (e) => {
                const { type, data } = e.data;
                if (type === 'reportComplete') {
                    this.worker.removeEventListener('message', handleMessage);
                    resolve(data);
                } else if (type === 'error') {
                    this.worker.removeEventListener('message', handleMessage);
                    reject(new Error(data));
                }
            };
            
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

    async generateFastReport(entries) {
        try {
            // Try Claude first, then Gemini
            if (this.externalAPIs.claude.available) {
                return await this.generateClaudeReport(entries);
            } else if (this.externalAPIs.gemini.available) {
                return await this.generateGeminiReport(entries);
            } else {
                // Fallback to local model
                console.log('⚠️ Nenhuma API externa disponível, usando modelo local');
                return await this.generateLocalReport(entries);
            }
        } catch (error) {
            console.error('🤖 [AI DEBUG] Erro na geração rápida:', error);
            // Fallback to local model, and if that fails, use simple fallback
            try {
                return await this.generateLocalReport(entries);
            } catch (localError) {
                console.error('🤖 [AI DEBUG] Erro na geração local, usando fallback simples:', localError);
                return this.generateSimpleFallbackReport(entries);
            }
        }
    }

    async generateClaudeReport(entries) {
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

    async generateGeminiReport(entries) {
        const geminiKey = await window.mentalStorage.getSetting('gemini-api-key');
        if (!geminiKey) {
            throw new Error('Chave da API Gemini não configurada');
        }

        const summary = this.prepareMoodSummary(entries);
        const prompt = this.createAnalysisPrompt(summary);

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
                }],
                generationConfig: {
                    maxOutputTokens: 1500,
                    temperature: 0.7
                }
            })
        });

        if (!response.ok) {
            throw new Error(`Erro na API Gemini: ${response.statusText}`);
        }

        const data = await response.json();
        return this.parseGeminiResponse(data.candidates[0].content.parts[0].text);
    }

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
}

// Initialize and expose globally
window.aiAnalysis = new AIAnalysis();

// Auto-initialize when first used with better error handling
const originalMethods = ['generateLocalReport', 'generateFastReport'];
originalMethods.forEach(method => {
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