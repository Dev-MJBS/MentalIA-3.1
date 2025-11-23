// Chat com IA — Privado (armazenamento apenas local). Português BR.
(() => {
  const chatMain = document.getElementById('chat-main');
  const input = document.getElementById('input');
  const sendBtn = document.getElementById('send');
  const typingEl = document.getElementById('typing');
  const emptyState = document.getElementById('empty-state');
  const premiumToggle = document.getElementById('premium-toggle');
  const backBtn = document.getElementById('back-btn');
  const genEntryBtn = document.getElementById('generate-entry');

  // In-memory chat history — will be lost when tab closes
  const history = [];

  // Basic feelings dictionary (PT-BR)
  const feelingsKeywords = {
    alegria: ['feliz','alegre','contente','satisfeito','animado','grato'],
    tristeza: ['triste','deprimido','melancol','infeliz','desanimado'],
    ansiedade: ['ansioso','ansiedade','preocupad','tenso','nervoso'],
    raiva: ['raiva','irritado','zangado','furioso','irritação'],
    medo: ['medo','assustad','apreensivo','temor'],
    alivio: ['aliviado','alívio','tranquilo','relaxado']
  };

  function detectFeelingsFromText(text){
    const found = new Set();
    const t = text.toLowerCase();
    for(const [feeling, words] of Object.entries(feelingsKeywords)){
      for(const w of words){ if(t.includes(w)) found.add(feeling); }
    }
    return Array.from(found);
  }

  function estimateMoodFromText(text){
    // crude heuristic: positive words increase, negative decrease
    const positive = ['bom','bem','feliz','alegre','grato','calmo','tranquilo','satisfeito','orgulhoso','animado'];
    const negative = ['mal','triste','deprimido','ansioso','cansado','sofrendo','raiva','irritado','preocupado','chateado'];
    let score = 5;
    const t = text.toLowerCase();
    for(const w of positive) if(t.includes(w)) score += 1;
    for(const w of negative) if(t.includes(w)) score -= 1;
    // clamp and map to 1..10
    score = Math.max(1, Math.min(10, Math.round(score)));
    return score;
  }

  function empathicSummary(text){
    // Short empathetic summary in PT-BR
    const feelings = detectFeelingsFromText(text);
    const mood = estimateMoodFromText(text);
    const feelStr = feelings.length ? feelings.slice(0,4).join(', ') : 'sentimentos mistos';
    // A few template variations
    const templates = [
      `Parece que você está sentindo ${feelStr} e hoje sua energia está em torno de ${mood}/10. Estou aqui para ouvir e apoiar você.`,
      `Vejo ${feelStr}. No momento seu humor parece ${mood}/10. Obrigado por compartilhar — isso já é um passo importante.`,
      `Obrigado por dividir. Detectei ${feelStr} e estimaria seu humor em ${mood}/10. Vamos cuidar disso com calma.`
    ];
    return templates[Math.floor(Math.random()*templates.length)];
  }

  // Render helpers — messages are ephemeral (in-memory)
  function appendMessage(text, who='ai'){
    if(emptyState) emptyState.style.display='none';
    const wrapper = document.createElement('div');
    wrapper.className = `message ${who}`;
    wrapper.textContent = text;
    chatMain.appendChild(wrapper);
    chatMain.scrollTop = chatMain.scrollHeight;
    return wrapper;
  }

  function showTyping(show=true){
    typingEl.style.display = show ? 'block' : 'none';
  }

  async function onSend(){
    const txt = (input.value||'').trim();
    if(!txt) return;
    history.push({role:'user',text:txt});
    appendMessage(txt,'user');
    input.value='';

    showTyping(true);

    // On-device (MedGemma / Transformers.js) placeholder: synchronous pseudo-AI
    const aiResponse = await localModelReply(txt);

    showTyping(false);
    history.push({role:'ai',text:aiResponse});
    appendMessage(aiResponse,'ai');
  }

  async function localModelReply(userText){
    // Simulate a short processing time
    await new Promise(r=>setTimeout(r, 700 + Math.random()*600));
    // If user enabled premium, warn that cloud model is needed for better responses
    if(premiumToggle && premiumToggle.checked){
      return 'Você ativou o modo premium. No momento o modelo de nuvem não está conectado; habilite a integração premium nas configurações para usar modelos externos.';
    }
    // On-device reply: use simple reflection + empathy
    const feelings = detectFeelingsFromText(userText);
    const mood = estimateMoodFromText(userText);

    const feelStr = feelings.length ? feelings.slice(0,4).join(', ') : 'sentimentos mistos';
    const replies = [
      `Entendo — percebo ${feelStr}. Obrigado por contar. Como isso tem afetado seu dia hoje?`,
      `Sinto que há ${feelStr} aqui. Parece que seu humor está em torno de ${mood}/10. Quer falar mais sobre isso?`,
      `Obrigado por compartilhar. Vejo ${feelStr} — se quiser, descreva um momento específico para explorarmos juntos.`
    ];
    return replies[Math.floor(Math.random()*replies.length)];
  }

  // Gerar registro: AI cria entrada de humor e salva via mentalStorage
  async function generateMoodEntryFromChat(){
    // Use last user message as source, or entire history
    const lastUser = [...history].reverse().find(h=>h.role==='user');
    const text = lastUser ? lastUser.text : '';
    // Create detection
    const feelings = detectFeelingsFromText(text);
    const estimatedMood = estimateMoodFromText(text);
    const summary = empathicSummary(text || 'Obrigado por compartilhar.');

    // Build mood entry object compatible with mentalStorage
    const entry = {
      id: Date.now(),
      mood: estimatedMood,
      feelings: feelings,
      diary: summary,
      timestamp: new Date().toISOString(),
      date: new Date().toDateString()
    };

    // Save securely (encrypted) via existing storage API
    if(window.mentalStorage && typeof window.mentalStorage.saveMoodEntry==='function'){
      try{
        await window.mentalStorage.saveMoodEntry(entry);
        // small toast
        showInlineToast('Registro gerado e salvo com sucesso');
      }catch(err){
        console.error('Erro ao salvar registro:',err);
        showInlineToast('Erro ao salvar registro', true);
      }
    }else{
      showInlineToast('Armazenamento não disponível', true);
    }
  }

  function showInlineToast(msg, isError=false){
    // small ephemeral message near composer
    const t = document.createElement('div');
    t.textContent = msg;
    t.className = 'message ai';
    t.style.maxWidth='60%';
    t.style.opacity='0.95';
    t.style.position='fixed';
    t.style.right='20px';
    t.style.bottom='110px';
    t.style.zIndex='9999';
    if(isError) t.style.background='#7a2b2b';
    document.body.appendChild(t);
    setTimeout(()=>{ t.remove(); },3000);
  }

  // Wire events
  sendBtn.addEventListener('click', onSend);
  input.addEventListener('keydown', (e)=>{ if(e.key==='Enter' && !e.shiftKey){ e.preventDefault(); onSend(); } });
  backBtn && backBtn.addEventListener('click', ()=>{ window.location.href='index.html'; });
  genEntryBtn && genEntryBtn.addEventListener('click', ()=>{ generateMoodEntryFromChat(); });

  // Ensure chat cleared when tab closes — in-memory only, nothing persisted here
  window.addEventListener('beforeunload', ()=>{
    // Explicitly clear history
    history.length = 0;
  });

  // Typing indicator control exposed to localModelReply
  // Already used via showTyping

  // Accessibility: focus input on load
  setTimeout(()=>{ input && input.focus(); },300);
})();