(() => {
  if (!document.getElementById('chatToolsLoader')) {
    const chatToolsLoader = document.createElement('script');
    chatToolsLoader.id = 'chatToolsLoader';
    chatToolsLoader.src = 'chat-tools.js?v=1';
    document.body.appendChild(chatToolsLoader);
  }
  const url = 'https://cfkzfdqlcfifrukjdvnj.supabase.co';
  const key = 'sb_publishable_KoGEquVbS_OIsoTWchG8Qw_Q6vJWJS8';
  const client = window.supabase?.createClient(url, key);
  const demoMode = new URLSearchParams(window.location.search).get('demo') === 'bedrijf';
  const companyMode = !/werknemer-dashboard/i.test(window.location.pathname);
  if (!client || document.getElementById('zfDirectChat')) return;
  document.body.insertAdjacentHTML('beforeend', `<div id="zfDirectChat" class="fixed inset-0 z-[70] hidden items-center justify-center bg-slate-950/40 p-4"><div class="flex max-h-[min(620px,calc(100vh-2rem))] w-full max-w-md flex-col overflow-hidden rounded-3xl bg-white shadow-2xl"><header class="flex items-center justify-between bg-emerald-950 px-5 py-4 text-white"><div><p id="zfDirectChatTitle" class="font-bold">Direct contact</p><p class="text-xs text-emerald-200">Alleen zichtbaar voor jou en de opdrachtgever</p></div><div class="flex items-center gap-2"><button id="zfDirectCall" type="button" class="rounded-lg bg-white/10 px-2 py-1 text-sm" title="Bellen">☎</button><button id="zfDirectChatClose" type="button" class="text-2xl text-emerald-200" aria-label="Chat sluiten">×</button></div></header><div id="zfDirectChatMessages" class="min-h-48 flex-1 space-y-2 overflow-y-auto bg-emerald-50/40 p-4"></div><div class="flex gap-2 border-t border-gray-100 px-4 pt-3"><button id="zfCreatePoll" type="button" class="rounded-xl bg-amber-50 px-3 py-2 text-xs font-bold text-amber-700">Poll maken</button><span class="text-xs self-center text-gray-400">Samen afstemmen over je shift</span></div><form id="zfDirectChatForm" class="flex gap-2 p-4"><input id="zfDirectChatInput" required class="min-w-0 flex-1 rounded-xl border border-gray-200 px-3 py-2.5 text-sm" placeholder="Schrijf een bericht..."><button class="rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-bold text-white">Verstuur</button></form></div></div>`);
  const modal = document.getElementById('zfDirectChat');
  const messages = document.getElementById('zfDirectChatMessages');
  const input = document.getElementById('zfDirectChatInput');
  let conversationId = null;
  let currentUser = null;
  let timer = null;
  let demoMessages = [{ sender_id: 'worker', message: 'Hoi, bedankt voor de uitnodiging!', created_at: new Date().toISOString() }];
  const escape = value => String(value ?? '').replace(/[&<>'"]/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[character]));
  const render = items => { messages.innerHTML = items.map(item => `<div class="max-w-[82%] rounded-2xl p-3 text-xs ${item.sender_id === currentUser?.id ? 'ml-auto bg-indigo-100 text-indigo-900' : 'bg-white text-gray-700'}"><strong class="mb-1 block text-[10px] opacity-60">${item.sender_id === currentUser?.id ? 'Jij' : 'Werkgever'}</strong>${escape(item.message)}</div>`).join('') || '<p class="text-center text-xs text-gray-500">Nog geen berichten.</p>'; messages.scrollTop = messages.scrollHeight; };
  const load = async () => { if (!conversationId) return; if (demoMode) { render(demoMessages); return; } const { data } = await client.from('direct_messages').select('*').eq('conversation_id', conversationId).order('created_at', { ascending: true }); if (data) render(data); await loadPolls(); };
  const loadPolls = async () => { const { data: polls } = await client.from('chat_polls').select('*').eq('conversation_id', conversationId).order('created_at', { ascending: true }); if (!polls?.length) return; polls.forEach(async poll => { const { data: votes } = await client.from('chat_poll_votes').select('option_index, user_id').eq('poll_id', poll.id); const existing = document.getElementById(`zf-poll-${poll.id}`); const options = Array.isArray(poll.options) ? poll.options : []; const counts = options.map((_, index) => (votes || []).filter(vote => vote.option_index === index).length); const html = `<div id="zf-poll-${poll.id}" class="rounded-2xl border border-amber-200 bg-amber-50 p-3 text-xs"><strong class="block text-amber-900">${escape(poll.question)}</strong>${options.map((option, index) => `<button type="button" data-poll-id="${poll.id}" data-poll-option="${index}" class="mt-2 block w-full rounded-lg bg-white px-3 py-2 text-left font-semibold text-gray-700">${escape(option)} <span class="float-right text-gray-400">${counts[index] || 0}</span></button>`).join('')}</div>`; if (existing) existing.outerHTML = html; else messages.insertAdjacentHTML('beforeend', html); }); messages.querySelectorAll('[data-poll-id]').forEach(button => { button.onclick = async () => { await client.from('chat_poll_votes').upsert({ poll_id: button.dataset.pollId, user_id: currentUser.id, option_index: Number(button.dataset.pollOption) }); await loadPolls(); }; }); };
  const triggerPhoneCall = (phone) => {
    const clean = String(phone || '').replace(/[^0-9+]/g, '');
    if (!clean) {
      alert('Er is geen telefoonnummer gekoppeld aan dit contact.');
      return false;
    }
    localStorage.setItem('zf_default_call_number', clean);
    window.location.href = `tel:${clean}`;
    return true;
  };
  const open = async (applicationId, title) => { if (demoMode) { currentUser = { id: 'employer-demo' }; conversationId = 'demo-conversation'; } else { const { data: { user } } = await client.auth.getUser(); if (!user) { alert('Log eerst in om direct te chatten.'); return; } currentUser = user; const { data, error } = await client.rpc('get_or_create_direct_conversation', { application_id_input: applicationId }); if (error) { alert(error.message); return; } conversationId = data; } document.getElementById('zfDirectChatTitle').textContent = title || 'Direct contact'; modal.classList.remove('hidden'); modal.classList.add('flex'); await load(); clearInterval(timer); timer = setInterval(load, 4000); input.focus(); };
  const close = () => { clearInterval(timer); modal.classList.add('hidden'); modal.classList.remove('flex'); conversationId = null; };
  document.getElementById('zfDirectChatClose').onclick = close;
  const inviteButton = document.createElement('button');
  inviteButton.type = 'button';
  inviteButton.className = 'rounded-lg bg-white/10 px-2 py-1 text-xs font-bold';
  inviteButton.textContent = 'Uitnodig';
  inviteButton.title = 'Uitnodiging sturen';
  document.getElementById('zfDirectChatTitle').parentElement.nextElementSibling.prepend(inviteButton);
  inviteButton.onclick = async () => {
    const invitation = 'Je bent uitgenodigd voor deze shift. Laat hier weten of je beschikbaar bent.';
    if (demoMode) demoMessages.push({ sender_id: currentUser.id, message: invitation, created_at: new Date().toISOString() });
    else await client.from('direct_messages').insert({ conversation_id: conversationId, sender_id: currentUser.id, message: invitation });
    await load();
  };
  if (companyMode) {
    const questionButton = document.createElement('button');
    questionButton.type = 'button';
    questionButton.className = 'rounded-lg bg-white/10 px-2 py-1 text-xs font-bold';
    questionButton.textContent = 'Vraag instellen';
    questionButton.title = 'Eigen vraag naar werknemer sturen';
    document.getElementById('zfDirectChatTitle').parentElement.nextElementSibling.prepend(questionButton);
    questionButton.onclick = async () => {
      const savedQuestion = localStorage.getItem('zf_company_chat_question') || '';
      const question = window.prompt('Welke vraag wil je naar deze werknemer sturen?', savedQuestion);
      if (!question?.trim()) return;
      const message = question.trim();
      localStorage.setItem('zf_company_chat_question', message);
      if (demoMode) demoMessages.push({ sender_id: currentUser.id, message, created_at: new Date().toISOString() });
      else {
        const { error } = await client.from('direct_messages').insert({ conversation_id: conversationId, sender_id: currentUser.id, message });
        if (error) { alert(error.message); return; }
      }
      await load();
    };
  }
  document.getElementById('zfDirectCall').onclick = () => {
    const phone = currentUser?.phone || localStorage.getItem('zf_default_call_number') || '+31612345678';
    triggerPhoneCall(phone);
  };
  document.getElementById('zfCreatePoll').onclick = async () => { if (!conversationId) return; const question = window.prompt('Waar wil je over stemmen?'); if (!question?.trim()) return; const options = window.prompt('Antwoorden, gescheiden door komma\'s:', 'Ja,Nee')?.split(',').map(option => option.trim()).filter(Boolean); if (!options || options.length < 2) return; const { error } = await client.from('chat_polls').insert({ conversation_id: conversationId, question: question.trim(), options, created_by: currentUser.id }); if (error) alert(error.message); else alert('Poll geplaatst.'); };
  modal.addEventListener('click', event => { if (event.target === modal) close(); });
  document.getElementById('zfDirectChatForm').onsubmit = async event => { event.preventDefault(); if (!conversationId || !input.value.trim()) return; if (demoMode) demoMessages.push({ sender_id: currentUser.id, message: input.value.trim(), created_at: new Date().toISOString() }); else { const { error } = await client.from('direct_messages').insert({ conversation_id: conversationId, sender_id: currentUser.id, message: input.value.trim() }); if (error) { alert(error.message); return; } } input.value = ''; await load(); };
  document.addEventListener('click', event => { const trigger = event.target.closest('[data-direct-chat]'); if (trigger) open(trigger.dataset.directChat, trigger.dataset.directTitle); });
})();
