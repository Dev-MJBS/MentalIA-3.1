# 🎭 Roda de Sentimentos Completa - MentalIA 3.0

## 📋 Visão Geral
Sistema hierárquico de seleção de sentimentos baseado na estrutura da CNV (Comunicação Não Violenta), com interface expansível e seleção múltipla.

## 🏗️ Estrutura Implementada

### 🎨 Categorias Principais (7 grupos)
1. **😊 Alegria** - Sentimentos positivos e elevados
2. **😢 Tristeza** - Sentimentos de baixa energia e melancolia
3. **😠 Raiva** - Sentimentos de irritação e revolta
4. **😨 Medo** - Sentimentos de ansiedade e insegurança
5. **🤢 Nojo** - Sentimentos de aversão e repugnância
6. **😲 Surpresa** - Sentimentos de espanto e admiração
7. **😐 Neutro** - Sentimentos equilibrados ou indefinidos

### 🎯 Sub-sentimentos por Categoria

#### 😊 Alegria
- 😄 Feliz
- 🤩 Animado
- 🙏 Grato
- 😌 Orgulhoso
- ✨ Esperançoso
- 🎉 Eufórico

#### 😢 Tristeza
- 😔 Triste
- 😞 Melancólico
- 😑 Sozinho
- 😰 Desesperado
- 😶 Vazio
- 😓 Desanimado

#### 😠 Raiva
- 😤 Irritado
- 🤬 Furioso
- 😖 Frustrado
- 😡 Revoltado
- 😾 Indignado
- 😒 Impaciente

#### 😨 Medo
- 😰 Ansioso
- 😱 Assustado
- 😟 Inseguro
- 😧 Preocupado
- 😬 Nervoso
- 😣 Tenso

#### 🤢 Nojo
- 🤮 Enojado
- 😝 Repugnado
- 🤧 Aversão
- 😵 Desconforto

#### 😲 Surpresa
- 😳 Chocado
- 😯 Espantado
- 🤯 Admirado
- 😮 Impressionado

#### 😐 Neutro
- 😵‍💫 Confuso
- 😑 Entediado
- 😴 Cansado
- 😶‍🌫️ Apático
- 😌 Calmo

## 💡 Funcionalidades UX

### 🎮 Interação Principal
- **Toque/Click** no sentimento principal → Expande acordeão
- **Seleção múltipla** de sub-sentimentos via checkbox
- **Resumo visual** dos sentimentos selecionados
- **Botão limpar** para reset completo

### 📱 Design Responsivo
- **Mobile**: Grid 2x3 para categorias principais
- **Tablet**: Grid 3x2 com sub-sentimentos em 2 colunas
- **Desktop**: Grid 4x2 com sub-sentimentos em 3 colunas

### 🎨 Estados Visuais
- **Hover**: Elevação suave e destaque de borda
- **Expansão**: Animação smooth com rotação do ícone
- **Seleção**: Checkbox customizado com animação
- **Resumo**: Tags coloridas com emojis

## 🔧 Implementação Técnica

### 🏗️ Arquitetura HTML
```html
<div class="primary-feeling-card" data-category="alegria">
    <div class="primary-feeling-btn">
        <span class="primary-emoji">😊</span>
        <span class="primary-label">Alegria</span>
        <span class="expand-icon">▼</span>
    </div>
    <div class="sub-feelings-panel">
        <!-- Sub-sentimentos em grid -->
    </div>
</div>
```

### 🎨 CSS Highlights
- **CSS Grid** responsivo com breakpoints
- **Transições suaves** para max-height e transform
- **Variáveis CSS** para temas dark/light
- **Prefixos webkit** para compatibilidade Safari

### ⚡ JavaScript Core
```javascript
// Inicialização da roda
initFeelingsWheel()

// Expansão de categorias
togglePrimaryFeeling(card)

// Atualização de seleções
updateSelectedFeelings()

// Limpeza completa
clearAllFeelings()
```

## 📊 Dados Salvos
```javascript
{
    feelings: ['feliz', 'grato', 'animado'], // Array de valores
    // ... outros dados do humor
}
```

## 🎯 Benefícios UX
1. **Precisão emocional** - 37 sentimentos específicos
2. **Facilidade de uso** - Interface intuitiva e familiar
3. **Acessibilidade** - Emojis universais e labels claros
4. **Performance** - Animações suaves e responsivas
5. **Flexibilidade** - Seleção múltipla e personalizada

## 🚀 Próximos Passos
- [ ] Análise de padrões emocionais por categoria
- [ ] Sugestões baseadas em histórico
- [ ] Insights de correlação sentimento-humor
- [ ] Visualizações em gráficos por categoria emocional