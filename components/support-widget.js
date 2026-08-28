(() => {
  const SUPABASE_URL = 'https://cfkzfdqlcfifrukjdvnj.supabase.co';
  const SUPABASE_KEY = 'sb_publishable_KoGEquVbS_OIsoTWchG8Qw_Q6vJWJS8';
  const adminOnlyMode = document.body.dataset.supportAdminOnly === 'true';
  const visitorId = localStorage.getItem('zekerflex_visitor_id') || crypto.randomUUID();
  localStorage.setItem('zekerflex_visitor_id', visitorId);
  const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY, { global: { headers: { 'x-zf-visitor-id': visitorId } } });
  let ticketId = sessionStorage.getItem('zf_ticket_id');
  let conversationStep = sessionStorage.getItem('zf_conversation_step') || 'question';
  let pendingQuestion = sessionStorage.getItem('zf_pending_question') || '';
  let collectedName = sessionStorage.getItem('zf_collected_name') || '';
  let localBotMessages = JSON.parse(sessionStorage.getItem('zf_bot_messages') || '[]');
  let localUserMessages = JSON.parse(sessionStorage.getItem('zf_user_messages') || '[]');
  let conversationLanguage = sessionStorage.getItem('zf_conversation_language') || 'nl';
  let messageTimer;
  let waitingTimer;
  let humanReplySeen = false;

  const style = document.createElement('style');
  style.textContent = `
    #zfChatPanel { width: min(380px, calc(100vw - 32px)); max-height: min(650px, calc(100dvh - 110px)); right: clamp(12px, 3vw, 24px); bottom: clamp(80px, 10vh, 120px); }
    #zfChatPanel > div:last-of-type { min-height: 0; overflow: hidden; }
    #zfChatMessages { max-height: 380px; min-height: 120px; overflow-y: auto; padding-right: 4px; scrollbar-width: thin; scrollbar-color: #a5b4fc transparent; }
    #zfChatMessages::-webkit-scrollbar { width: 6px; }
    #zfChatMessages::-webkit-scrollbar-thumb { border-radius: 999px; background: #a5b4fc; }
    .zf-message-row { display: flex; width: 100%; align-items: flex-end; gap: 8px; }
    .zf-message-row.admin { justify-content: flex-start; }
    .zf-message-row.visitor { justify-content: flex-end; }
    .zf-message { max-width: 85%; border-radius: 14px; padding: 9px 11px; font-size: 13px; line-height: 1.4; }
    .zf-message.visitor { background: #e0e7ff; color: #312e81; }
    .zf-message.admin { background: #ecfdf5; color: #065f46; }
    .zf-agent-avatar { width: 32px; height: 32px; flex: 0 0 32px; border-radius: 999px; object-fit: cover; background: #c7d2fe; color: #3730a3; display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: 800; }
    .zf-agent-name { margin-bottom: 3px; color: #047857; font-size: 10px; font-weight: 800; }
    .zf-send-row { display: flex; align-items: flex-end; gap: 8px; }
    .zf-send-button { width: 42px; height: 42px; flex: 0 0 42px; border-radius: 12px; background: #4f46e5; color: white; font-size: 19px; line-height: 1; transition: background .2s, transform .2s; }
    .zf-send-button:hover { background: #4338ca; transform: translateY(-1px); }
    .zf-faq summary { cursor: pointer; color: #4f46e5; font-size: 11px; font-weight: 800; }
    .zf-faq-list { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 8px; }
    .zf-faq-list button { border: 1px solid #e0e7ff; border-radius: 999px; background: #f8faff; color: #4338ca; padding: 6px 9px; font-size: 11px; font-weight: 700; }
    .zf-faq-list button:hover { background: #eef2ff; }
    #supportAdminContainer .zf-admin-ticket { border: 1px solid #d9f0e5; border-radius: 18px; background: #f7fffb; padding: 14px; }
    #supportAdminContainer .zf-admin-message { max-width: 82%; margin-top: 7px; border-radius: 14px; padding: 9px 11px; font-size: 12px; line-height: 1.45; }
    #supportAdminContainer .zf-admin-message.visitor { margin-right: auto; background: white; color: #334155; }
    #supportAdminContainer .zf-admin-message.admin { margin-left: auto; background: #dcfce7; color: #166534; }
  `;
  document.head.appendChild(style);

  document.body.insertAdjacentHTML('beforeend', `
    <button id="zfChatButton" type="button" aria-label="Open ZekerFlex chat" aria-expanded="false" class="${adminOnlyMode ? 'hidden' : 'fixed bottom-5 right-5 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-indigo-600 text-2xl text-white shadow-xl transition hover:scale-105 hover:bg-indigo-700'}">💬</button>
    <section id="zfChatPanel" class="fixed bottom-24 right-5 z-50 hidden overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-2xl" role="dialog" aria-labelledby="zfChatTitle">
      <div class="flex items-center justify-between bg-indigo-950 px-5 py-4 text-white">
        <div><p id="zfChatTitle" class="text-sm font-bold">Chat met ZekerFlex</p><p id="zfChatStatus" class="text-xs text-indigo-200">We denken graag met je mee</p></div>
        <div class="flex items-center gap-3"><button id="zfNewChatHeader" type="button" class="text-xs font-bold text-indigo-200 hover:text-white" title="Nieuwe conversatie">Nieuwe chat</button><button id="zfChatClose" type="button" class="text-xl text-indigo-200 hover:text-white" aria-label="Chat sluiten">×</button></div>
      </div>
      <div class="space-y-3 p-4">
        <div id="zfChatMessages" class="space-y-2" aria-live="polite" aria-atomic="false"><div class="zf-message-row admin"><span class="zf-agent-avatar" aria-hidden="true">ZF</span><div class="zf-message admin"><div class="zf-agent-name">ZekerFlex medewerker</div>Hoi! Leuk dat je er bent. Waar kan ik je mee helpen?</div></div></div>
        <details class="zf-faq"><summary>Veelgestelde vragen</summary><div id="zfQuickQuestions" class="zf-faq-list"><button type="button" data-question="Hoe werkt solliciteren?">Solliciteren</button><button type="button" data-question="Hoe plaats ik een shift?">Shift plaatsen</button><button type="button" data-question="Ik kan niet inloggen.">Inloggen</button><button type="button" data-question="Wanneer krijg ik betaald?">Betaling</button><button type="button" data-question="Ik wil mijn profiel aanpassen.">Profiel aanpassen</button><button type="button" data-question="Ik heb een vraag over mijn planning.">Planning</button></div></details>
          <form id="zfChatForm" class="space-y-2">
            <div class="zf-send-row"><textarea id="zfMessage" required rows="2" placeholder="Typ hier je vraag..." class="min-w-0 flex-1 rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500"></textarea><button id="zfSend" type="submit" class="zf-send-button" aria-label="Bericht versturen" title="Bericht versturen">➤</button></div>
        </form>
        <p id="zfChatNotice" class="hidden rounded-xl bg-emerald-50 p-3 text-xs leading-relaxed text-emerald-700"></p>
      </div>
      </section>
    </div>
  `);

  const panel = document.getElementById('zfChatPanel');
  const messages = document.getElementById('zfChatMessages');
  const messageInput = document.getElementById('zfMessage');
  const notice = document.getElementById('zfChatNotice');
  const chatStatus = document.getElementById('zfChatStatus');
  document.getElementById('zfChatButton').addEventListener('click', () => {
    panel.classList.toggle('hidden');
    document.getElementById('zfChatButton').setAttribute('aria-expanded', String(!panel.classList.contains('hidden')));
    if (!panel.classList.contains('hidden')) messageInput.focus();
  });
  document.querySelectorAll('[data-support-open]').forEach((button) => button.addEventListener('click', () => document.getElementById('zfChatButton').click()));
  document.getElementById('zfChatClose').addEventListener('click', closeChat);
  document.getElementById('zfNewChatHeader').addEventListener('click', startNewChat);
  document.querySelectorAll('#zfQuickQuestions button').forEach((button) => {
    button.addEventListener('click', () => { messageInput.value = button.dataset.question || ''; messageInput.focus(); });
  });

  function renderMessages(items) {
    if (!items.length) return;
    const welcomeMessage = '<div class="zf-message-row admin"><span class="zf-agent-avatar" aria-hidden="true">ZF</span><div class="zf-message admin"><div class="zf-agent-name">ZekerFlex medewerker</div>Hoi! Leuk dat je er bent. Waar kan ik je mee helpen?</div></div>';
    const agentTypes = ['admin', 'employee', 'medewerker', 'agent', 'support'];
    const isAgentMessage = (item) => [item.sender_role, item.sender_type, item.sender].some((type) => agentTypes.includes(String(type || '').toLowerCase()));
    const isHumanAgentMessage = (item) => isAgentMessage(item) && String(item.sender_name || '').toLowerCase() !== 'zekerflex bot';
    const hasAgentReply = items.some(isHumanAgentMessage);
    const visibleLocalMessages = ticketId ? [] : localUserMessages;
    messages.innerHTML = [...items, ...visibleLocalMessages, ...localBotMessages].sort((first, second) => new Date(first.created_at || 0) - new Date(second.created_at || 0)).map((item) => {
      const isAgent = isAgentMessage(item);
      const senderName = item.sender_name || item.agent_name || item.employee_name || item.display_name || 'ZekerFlex medewerker';
      const avatarUrl = item.sender_avatar_url || item.agent_avatar_url || item.employee_avatar_url || item.avatar_url || item.profile_photo_url || '';
      const avatar = avatarUrl
        ? `<img class="zf-agent-avatar" src="${escapeHtml(avatarUrl)}" alt="Profielfoto van ${escapeHtml(senderName)}" loading="lazy">`
        : '<span class="zf-agent-avatar" aria-hidden="true">ZF</span>';
      const content = `<span class="mb-0.5 block text-[10px] font-bold opacity-60">${isAgent ? escapeHtml(senderName) : 'Jij'} · ${formatTime(item.created_at)}</span>${escapeHtml(item.message)}`;
      return isAgent ? `<div class="zf-message-row admin">${avatar}<div class="zf-message admin"><div class="zf-agent-name">${escapeHtml(senderName)}</div>${content}</div></div>` : `<div class="zf-message-row visitor"><div class="zf-message visitor">${content}</div></div>`;
    }).join('');
    messages.insertAdjacentHTML('afterbegin', welcomeMessage);
    if (hasAgentReply) showChatCompletionPrompt();
    messages.scrollTop = messages.scrollHeight;
  }

  function showChatCompletionPrompt() {
    notice.innerHTML = '<span class="block">Is je vraag beantwoord?</span><div class="mt-2 flex gap-2"><button id="zfCloseChat" type="button" class="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white">Ja, chat sluiten</button><button id="zfNewChat" type="button" class="rounded-lg bg-indigo-100 px-3 py-1.5 text-xs font-bold text-indigo-700">Nieuwe chat</button></div>';
    notice.classList.remove('hidden');
    document.getElementById('zfCloseChat').onclick = closeChat;
    document.getElementById('zfNewChat').onclick = startNewChat;
  }

  function resetChat() {
    ticketId = null;
    humanReplySeen = false;
    conversationStep = 'question';
    pendingQuestion = '';
    collectedName = '';
    sessionStorage.removeItem('zf_ticket_id');
    sessionStorage.removeItem('zf_conversation_step');
    sessionStorage.removeItem('zf_pending_question');
    sessionStorage.removeItem('zf_collected_name');
    sessionStorage.removeItem('zf_bot_messages');
    sessionStorage.removeItem('zf_user_messages');
    sessionStorage.removeItem('zf_last_bot_intent');
    sessionStorage.removeItem('zf_conversation_language');
    localBotMessages = [];
    localUserMessages = [];
    messages.innerHTML = '<div class="zf-message-row admin"><span class="zf-agent-avatar" aria-hidden="true">ZF</span><div class="zf-message admin"><div class="zf-agent-name">ZekerFlex medewerker</div>Hoi! Leuk dat je er bent. Waar kan ik je mee helpen?</div></div>';
    notice.classList.add('hidden');
  }

  function closeChat() {
    window.clearTimeout(waitingTimer);
    resetChat();
    panel.classList.add('hidden');
    document.getElementById('zfChatButton').setAttribute('aria-expanded', 'false');
  }

  function startNewChat() {
    resetChat();
    messageInput.focus();
  }

  function appendUserMessage(message) {
    localUserMessages.push({ sender_role: 'visitor', message, created_at: new Date().toISOString() });
    sessionStorage.setItem('zf_user_messages', JSON.stringify(localUserMessages));
    messages.insertAdjacentHTML('beforeend', `<div class="zf-message-row visitor"><div class="zf-message visitor"><span class="mb-0.5 block text-[10px] font-bold opacity-60">Jij</span>${escapeHtml(message)}</div></div>`);
    messages.scrollTop = messages.scrollHeight;
  }

  function showBotPrompt(message) {
    localBotMessages.push({ sender_role: 'admin', sender_name: 'ZekerFlex bot', message, created_at: new Date().toISOString() });
    sessionStorage.setItem('zf_bot_messages', JSON.stringify(localBotMessages));
    messages.insertAdjacentHTML('beforeend', `<div class="zf-message-row admin"><span class="zf-agent-avatar" aria-hidden="true">ZF</span><div class="zf-message admin"><div class="zf-agent-name">ZekerFlex bot</div>${escapeHtml(message)}</div></div>`);
    messages.scrollTop = messages.scrollHeight;
  }

  function askToCloseAfterWaiting() {
    if (document.getElementById('zfWaitingPrompt')) return;
    messages.insertAdjacentHTML('beforeend', '<div id="zfWaitingPrompt" class="zf-message-row admin"><span class="zf-agent-avatar" aria-hidden="true">ZF</span><div class="zf-message admin"><div class="zf-agent-name">ZekerFlex bot</div>Ik heb na 30 seconden nog geen medewerkerantwoord ontvangen. Wil je de chat sluiten?<div class="mt-2 flex gap-2"><button id="zfWaitingYes" type="button" class="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white">Ja, sluiten</button><button id="zfWaitingNo" type="button" class="rounded-lg bg-indigo-100 px-3 py-1.5 text-xs font-bold text-indigo-700">Nee, openhouden</button></div></div></div>');
    messages.scrollTop = messages.scrollHeight;
    document.getElementById('zfWaitingYes').onclick = closeChat;
    document.getElementById('zfWaitingNo').onclick = startNewChat;
  }

  function startWaitingTimer() {
    window.clearTimeout(waitingTimer);
    waitingTimer = window.setTimeout(() => {
      if (ticketId && conversationStep === 'active' && !humanReplySeen) askToCloseAfterWaiting();
    }, 30000);
  }

  function getBotAnswer(message) {
    const question = message.toLowerCase().replace(/[!?.,]/g, ' ').replace(/\s+/g, ' ').trim();
    const english = /\b(what|where|how|when|can|please|help|login|password|apply|payment|profile|schedule|shift|post|create|work|email|name)\b/.test(question) && !/\b(hoe|waar|wanneer|kan|help|wachtwoord|sollic|betaling|profiel|planning|plaats|maken)\b/.test(question);
    if (english) {
      if (/login|password|account/.test(question)) return 'You can log in with the Login button. Forgot your password? Choose Forgot password on the login page.';
      if (/apply|application|job|work/.test(question)) return 'Open a shift, review the details and choose Apply now. Your application will appear in your employee dashboard.';
      if (/shift|job|assignment/.test(question) && /post|create|place|publish/.test(question)) return 'To post a shift, open the Employer Dashboard, choose New Shift and add the role, company, location, date, category and hourly rate.';
      if (/pay|payment|paid|invoice|hours|earn/.test(question)) return 'After your shift, submit your worked hours. The employer reviews them before payment is processed.';
      if (/profile|phone|photo|skill|cv/.test(question)) return 'Open My Profile to update your contact details, skills, availability and profile photo.';
      if (/schedule|calendar|availability|when/.test(question)) return 'Accepted shifts can be found in My Planning. Keep your availability up to date for better matches.';
      return 'I can’t help with that directly yet. I’ll pass your question to a team member who will be with you as soon as possible.';
    }
    const previousIntent = sessionStorage.getItem('zf_last_bot_intent');
    if (/helpt niet|werkt niet|snap het niet|geen antwoord|onduidelijk|probleem/.test(question)) return 'Ik zie dat ik je hier niet direct verder mee kan helpen. Ik zet je vraag door naar een medewerker, die staat zo snel mogelijk voor je klaar.';
    const intents = [
      { key: 'login', words: /inlog|login|wachtwoord|account|registr|aanmeld/, answer: 'Je kunt inloggen via de knop Inloggen. Ben je je wachtwoord vergeten? Kies dan Wachtwoord vergeten. Lukt het daarna nog niet, dan kijkt een medewerker met je mee.' },
      { key: 'application', words: /sollic|reageer|aanmeld|kandidaat|meedoen/, answer: 'Open een shift, bekijk de details en kies Direct solliciteren. Je reactie verschijnt daarna in je werknemersdashboard bij Mijn klussen.' },
      { key: 'post_shift', words: /shift|klus|opdracht/, extra: /plaats|aanmaak|publiceer|invoer|zetten|zoeken/, answer: 'Een shift plaatsen is eenvoudig: ga naar het Opdrachtgever Dashboard, kies Nieuwe Shift Plaatsen en vul functie, bedrijf, locatie, datum, categorie en uurtarief in. Daarna verschijnt de shift bij de openstaande klussen.' },
      { key: 'payment', words: /betaal|betaling|uitbeta|loon|geld|factuur|uren|verdien/, answer: 'Na je shift vul je jouw gewerkte uren in. De opdrachtgever controleert ze, waarna de betaling kan worden verwerkt. Je verwachte inkomen en facturen vind je bij Administratie.' },
      { key: 'profile', words: /profiel|gegevens|telefoon|foto|vaardig|cv/, answer: 'Ga naar Mijn profiel om je naam, telefoonnummer, vaardigheden, beschikbaarheid en profielfoto bij te werken. Een compleet profiel helpt bij betere matches.' },
      { key: 'planning', words: /planning|agenda|kalender|beschikbaar|shift.*wanneer|werktijd/, answer: 'Je aangenomen shifts vind je in Mijn planning of Agenda & planning. Zet je beschikbaarheid duidelijk in je profiel en controleer altijd datum, locatie en tijd.' },
    ];
    const matched = intents.find((intent) => intent.words.test(question) && (!intent.extra || intent.extra.test(question)));
    if (matched) {
      sessionStorage.setItem('zf_last_bot_intent', matched.key);
      return matched.answer;
    }
    if (/^(hoe dan|waar|en nu|vertel meer|wat nu)$/.test(question) && previousIntent) {
      const context = intents.find((intent) => intent.key === previousIntent);
      if (context) return context.answer;
    }
    return 'Ik zie dat ik je hier niet direct verder mee kan helpen. Ik zet je vraag door naar een medewerker, die staat zo snel mogelijk voor je klaar.';
  }

  function showBotResponse() {
    const typing = '<div id="zfBotTyping" class="zf-message-row admin"><span class="zf-agent-avatar" aria-hidden="true">ZF</span><div class="zf-message admin"><div class="zf-agent-name">ZekerFlex bot</div>● ● ●</div></div>';
    messages.insertAdjacentHTML('beforeend', typing);
    messages.scrollTop = messages.scrollHeight;
    window.setTimeout(() => {
      const typingMessage = document.getElementById('zfBotTyping');
      if (!typingMessage) return;
      typingMessage.outerHTML = '<div class="zf-message-row admin"><span class="zf-agent-avatar" aria-hidden="true">ZF</span><div class="zf-message admin"><div class="zf-agent-name">ZekerFlex bot</div>Bedankt voor je bericht. Vul je gegevens in, dan kan een medewerker je zo goed mogelijk helpen. Zodra iemand beschikbaar is, verschijnt het antwoord hier automatisch.</div></div>';
      messages.scrollTop = messages.scrollHeight;
    }, 850);
  }

  async function loadMessages() {
    if (!ticketId) return;
    const { data, error } = await supabase.from('support_messages').select('*').eq('ticket_id', ticketId).order('created_at', { ascending: true });
    if (error) {
      chatStatus.textContent = 'Antwoorden tijdelijk niet beschikbaar';
      return;
    }
    chatStatus.textContent = 'Chat verbonden · antwoord wordt automatisch opgehaald';
    if (data) {
      humanReplySeen = data.some((item) => isHumanAgentMessage(item));
      if (humanReplySeen) window.clearTimeout(waitingTimer);
      if (humanReplySeen) document.getElementById('zfWaitingPrompt')?.remove();
      renderMessages(data);
    }
  }

  function showSupportError(error) {
    chatStatus.textContent = 'Chat niet verbonden';
    notice.textContent = error?.code === 'PGRST205'
      ? 'De supportchat is nog niet geactiveerd. Voer support-schema.sql uit in de Supabase SQL Editor.'
      : 'De chat is tijdelijk niet beschikbaar. Controleer je verbinding en probeer het opnieuw.';
    notice.classList.remove('hidden');
  }

  document.getElementById('zfChatForm').addEventListener('submit', async (event) => {
    event.preventDefault();
    const button = document.getElementById('zfSend');
    const message = messageInput.value.trim();
    if (!message) return;
    appendUserMessage(message);
    messageInput.value = '';

    if (conversationStep === 'active' && /^(nee|nee bedankt|hoeft niet|niet nodig|dat is alles)[.! ]*$/i.test(message)) {
      startNewChat();
      return;
    }

    if (conversationStep === 'question') {
      pendingQuestion = message;
      conversationStep = 'name';
      conversationLanguage = /\b(what|where|how|when|can|please|help|login|password|apply|payment|profile|schedule|shift|post|create|work|email|name)\b/i.test(message) ? 'en' : 'nl';
      sessionStorage.setItem('zf_pending_question', pendingQuestion);
      sessionStorage.setItem('zf_conversation_step', conversationStep);
      sessionStorage.setItem('zf_conversation_language', conversationLanguage);
      showBotPrompt(conversationLanguage === 'en' ? `${getBotAnswer(message)} Can I help you with anything else? What is your full name?` : `${getBotAnswer(message)} Kan ik je ergens anders nog mee helpen? Wat is je volledige naam en achternaam?`);
      return;
    }
    if (conversationStep === 'name') {
      collectedName = message;
      conversationStep = 'email';
      sessionStorage.setItem('zf_collected_name', collectedName);
      sessionStorage.setItem('zf_conversation_step', conversationStep);
      showBotPrompt(conversationLanguage === 'en' ? 'Thank you. What is your email address?' : 'Dank je. Wat is je e-mailadres?');
      return;
    }
    if (conversationStep === 'email') {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(message)) {
        showBotPrompt('Dat e-mailadres lijkt niet helemaal juist. Kun je het nog eens proberen?');
        return;
      }
      button.disabled = true;
      button.textContent = '...';
      const { data: { user } } = await supabase.auth.getUser();
      const { data: ticket, error: ticketError } = await supabase.from('support_tickets').insert([{ visitor_id: visitorId, user_id: user?.id || null, name: collectedName, email: message, subject: 'Chatvraag', status: 'open' }]).select('id').single();
      if (ticketError) { showSupportError(ticketError); button.disabled = false; button.textContent = '➤'; return; }
      ticketId = ticket.id;
      sessionStorage.setItem('zf_ticket_id', ticketId);
      const { error: messageError } = await supabase.from('support_messages').insert([
        { ticket_id: ticketId, conversation_id: ticketId, visitor_id: visitorId, sender_role: 'visitor', sender_type: 'visitor', message: pendingQuestion },
        { ticket_id: ticketId, conversation_id: ticketId, visitor_id: visitorId, sender_role: 'visitor', sender_type: 'visitor', message: collectedName },
        { ticket_id: ticketId, conversation_id: ticketId, visitor_id: visitorId, sender_role: 'visitor', sender_type: 'visitor', message },
      ]);
      if (messageError) { showSupportError(messageError); button.disabled = false; button.textContent = '➤'; return; }
      localUserMessages = [];
      sessionStorage.removeItem('zf_user_messages');
      conversationStep = 'active';
      sessionStorage.setItem('zf_conversation_step', conversationStep);
      showBotPrompt(conversationLanguage === 'en' ? 'Thank you for sharing your details! A team member can assist you at any moment.' : 'Bedankt voor de gegevens! Een medewerker kan je ieder moment te woord staan.');
      startWaitingTimer();
      button.disabled = false;
      button.textContent = '➤';
      return;
    }
    button.disabled = true;
    button.textContent = '...';
    const { error } = await supabase.from('support_messages').insert([{ ticket_id: ticketId, conversation_id: ticketId, visitor_id: visitorId, sender_role: 'visitor', sender_type: 'visitor', message }]);
    if (error) showSupportError(error);
    else { chatStatus.textContent = conversationLanguage === 'en' ? 'Message sent · we are here' : 'Bericht verzonden · we antwoorden hier'; const answer = getBotAnswer(message); const fallback = conversationLanguage === 'en' ? 'I can’t help with that directly yet.' : 'Ik zie dat ik je hier niet direct verder mee kan helpen.'; showBotPrompt(answer.includes(fallback) ? answer : `${answer} ${conversationLanguage === 'en' ? 'Can I help you with anything else?' : 'Kan ik je ergens anders nog mee helpen?'}`); startWaitingTimer(); await loadMessages(); }
    button.disabled = false;
    button.textContent = '➤';
  });

  messageInput.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      document.getElementById('zfChatForm').requestSubmit();
    }
  });

  function escapeHtml(value) {
    return String(value).replace(/[&<>'"]/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[character]));
  }

  function formatTime(value) {
    if (!value) return '';
    return new Intl.DateTimeFormat('nl-NL', { hour: '2-digit', minute: '2-digit' }).format(new Date(value));
  }

  async function loadAdminTickets() {
    const container = document.getElementById('supportAdminContainer');
    if (!container) return;
    const { data: { user } } = await supabase.auth.getUser();
    const isAdmin = user && (user.email === 'adminbriando@zekerflex.nl' || user.app_metadata?.role === 'admin');
    if (!isAdmin) {
      container.innerHTML = '<p class="text-sm text-gray-500">Supportbeheer is alleen beschikbaar voor admins.</p>';
      return;
    }
    const { data: tickets, error } = await supabase.from('support_tickets').select('*').order('created_at', { ascending: false });
    if (error) {
      container.innerHTML = '<p class="text-sm text-red-600">Supporttickets konden niet worden geladen.</p>';
      return;
    }
    if (!tickets?.length) {
      container.innerHTML = '<p class="text-sm text-gray-500">Nog geen supporttickets.</p>';
      return;
    }
    container.innerHTML = tickets.map((ticket) => `
      <article class="zf-admin-ticket mb-3">
        <div class="flex flex-col sm:flex-row justify-between gap-2"><div><h3 class="font-bold text-gray-900">${escapeHtml(ticket.name)} <span class="text-xs font-normal text-gray-500">${escapeHtml(ticket.email)}</span></h3><p class="text-xs text-gray-500 mt-1">${escapeHtml(ticket.subject || 'Chatvraag')}</p></div><span class="text-xs font-bold ${ticket.status === 'closed' ? 'text-gray-500' : 'text-emerald-600'}">${ticket.status === 'closed' ? 'Gesloten' : 'Open'}</span></div>
        <div id="zfAdminMessages-${ticket.id}" class="mt-3 space-y-2"></div>
        <form data-ticket-id="${ticket.id}" class="zfAdminReply flex gap-2 mt-3"><input required name="message" placeholder="Schrijf een antwoord..." class="min-w-0 flex-1 rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm"><button class="rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white">Antwoord</button></form>
        <button data-close-ticket="${ticket.id}" type="button" class="mt-2 text-xs font-semibold text-gray-500 hover:text-gray-900">Ticket sluiten</button>
      </article>
    `).join('');

    tickets.forEach(async (ticket) => {
      const { data: ticketMessages } = await supabase.from('support_messages').select('*').eq('ticket_id', ticket.id).order('created_at', { ascending: true });
      const target = document.getElementById(`zfAdminMessages-${ticket.id}`);
      if (target && ticketMessages) target.innerHTML = ticketMessages.map((item) => `<div class="zf-admin-message ${item.sender_role === 'admin' ? 'admin' : 'visitor'}"><strong>${item.sender_role === 'admin' ? 'ZekerFlex' : escapeHtml(ticket.name)}:</strong> ${escapeHtml(item.message)}</div>`).join('');
    });

    container.querySelectorAll('.zfAdminReply').forEach((form) => form.addEventListener('submit', async (event) => {
      event.preventDefault();
      const formElement = event.currentTarget;
      const ticket = formElement.dataset.ticketId;
      const input = formElement.querySelector('input[name="message"]');
      if (!ticket || !input.value.trim()) return;
      const { error } = await supabase.from('support_messages').insert([{ ticket_id: ticket, conversation_id: ticket, sender_role: 'admin', sender_type: 'admin', sender_name: user.user_metadata?.display_name || 'ZekerFlex medewerker', sender_avatar_url: user.user_metadata?.avatar_url || null, message: input.value.trim() }]);
      if (error) return;
      input.value = '';
      loadAdminTickets();
    }));
    container.querySelectorAll('[data-close-ticket]').forEach((button) => button.addEventListener('click', async () => {
      await supabase.from('support_tickets').update({ status: 'closed' }).eq('id', button.dataset.closeTicket);
      loadAdminTickets();
    }));
  }

  loadMessages();
  loadAdminTickets();
  messageTimer = window.setInterval(loadMessages, 3000);
})();
