(() => {
  if (window.zfChatToolsLoaded) return;
  window.zfChatToolsLoaded = true;
  const plus = document.getElementById('newChat');
  const conversations = document.getElementById('conversations');
  const messages = document.getElementById('messages');
  const input = document.getElementById('input');
  let contactConversation = null;
  const demoMode = new URLSearchParams(location.search).get('demo') === 'bedrijf';
  if (!plus || !conversations || document.getElementById('zfChatTools')) return;

  const escape = value => String(value ?? '').replace(/[&<>'"]/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[character]));
  const notifyDashboard = (title, text) => {
    const key = `chat-${Date.now()}`;
    const notifications = JSON.parse(localStorage.getItem(demoMode ? 'zf_company_notifications' : 'zf_notifications') || '[]');
    notifications.unshift({ id: Date.now(), key, title, text, action: 'chat', target: 'crmSupportSection', read: false });
    localStorage.setItem(demoMode ? 'zf_company_notifications' : 'zf_notifications', JSON.stringify(notifications));
  };
  const addBubble = (text, mine = true) => {
    messages.insertAdjacentHTML('beforeend', `<div class="bubble ${mine ? 'mine' : 'theirs'}">${escape(text)} <span class="ml-2 text-[10px] text-slate-400">${new Date().toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' })}</span></div>`);
    messages.scrollTop = messages.scrollHeight;
  };
  const platformHistoryKey = 'zf_platform_chat_history';
  const defaultPlatformMessages = [
    { text: 'Hoi! Leuk dat je er bent. Waarmee kan ik je helpen?', mine: false },
    { text: 'Je kunt vragen stellen over shifts, solliciteren, accounts, betalingen, planning, groepen of support.', mine: false }
  ];
  const loadPlatformHistory = () => {
    try {
      const history = JSON.parse(localStorage.getItem(platformHistoryKey) || '[]');
      return history.length ? history : defaultPlatformMessages;
    } catch (error) {
      return defaultPlatformMessages;
    }
  };
  const savePlatformMessage = (text, mine) => {
    const history = loadPlatformHistory();
    history.push({ text, mine, time: new Date().toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' }) });
    localStorage.setItem(platformHistoryKey, JSON.stringify(history.slice(-80)));
  };
  const getContactHistoryKey = contactId => `zf_chat_contact_history_${contactId}`;
  const loadContactHistory = contactId => {
    try {
      return JSON.parse(localStorage.getItem(getContactHistoryKey(contactId)) || '[]');
    } catch (error) {
      return [];
    }
  };
  const renderContactMessages = (conversation) => {
    if (!conversation) return;
    messages.innerHTML = conversation.messages.length
      ? conversation.messages.map(item => `<div class="bubble ${item.mine ? 'mine' : 'theirs'}">${escape(item.text)} <span class="ml-2 text-[10px] text-slate-400">${escape(item.time)}</span></div>`).join('')
      : '<div class="bubble theirs">Nieuw gesprek met dit contact.</div>';
    messages.scrollTop = messages.scrollHeight;
  };
  const addMessageActions = () => {
    const closeMessageMenus = () => document.querySelectorAll('#zfMessageActions').forEach(menu => menu.remove());
    closeMessageMenus();
    const bubbles = messages.querySelectorAll('.bubble:not([data-message-ready])');
    if (!bubbles.length && messages.dataset.messageActionsReady === 'true') return;
    const style = document.createElement('style');
    style.id = 'zfMessageActionsStyles';
    style.textContent = '.zf-message-wrap{position:relative;width:fit-content;max-width:78%}.zf-message-wrap.mine{margin-left:auto}.zf-message-wrap.theirs{margin-right:auto}.zf-message-wrap .bubble{max-width:100%}.zf-message-action-trigger{position:absolute;top:50%;left:-30px;width:24px;height:24px;transform:translateY(-50%);border:0;border-radius:50%;background:#fff;color:#64748b;opacity:0;cursor:pointer;box-shadow:0 1px 4px #0002;transition:opacity .15s}.zf-message-wrap:hover .zf-message-action-trigger,.zf-message-action-trigger:focus{opacity:1}.zf-message-menu{position:fixed;z-index:200;width:220px;overflow:hidden;border:1px solid #dfe8e2;border-radius:12px;background:#fff;box-shadow:0 12px 30px #0003}.zf-message-menu button{display:block;width:100%;border:0;background:#fff;color:#334155;padding:9px 12px;text-align:left;font-size:12px;cursor:pointer}.zf-message-menu button:hover{background:#ecfdf5}.zf-message-menu button[data-danger]{color:#be123c}.zf-message-wrap.is-starred .bubble{outline:2px solid #fbbf24}.zf-message-wrap.is-pinned:after{content:"Vastgezet";display:block;color:#a16207;font-size:10px;margin-top:2px}.zf-message-wrap .bubble.is-editing{background:#fff;border:1px solid #10b981}.zf-message-edit{width:100%;border:0;outline:0;background:transparent;font:inherit;resize:none}';
    if (!document.getElementById(style.id)) document.head.appendChild(style);
    bubbles.forEach(bubble => {
      bubble.dataset.messageReady = 'true';
      const wrap = document.createElement('div');
      wrap.className = `zf-message-wrap ${bubble.classList.contains('mine') ? 'mine' : 'theirs'}`;
      bubble.parentNode.insertBefore(wrap, bubble);
      wrap.appendChild(bubble);
      const trigger = document.createElement('button');
      trigger.type = 'button';
      trigger.className = 'zf-message-action-trigger';
      trigger.textContent = '^';
      trigger.title = 'Berichtopties';
      trigger.setAttribute('aria-label', 'Berichtopties');
      wrap.appendChild(trigger);
      wrap.dataset.messageText = bubble.textContent.replace(/\s\d{2}:\d{2}(?:\s.*)?$/, '').trim();
    });
    if (messages.dataset.messageActionsReady === 'true') return;
    messages.dataset.messageActionsReady = 'true';
    const openMenu = (wrap, x, y) => {
      closeMessageMenus();
      const menu = document.createElement('div');
      menu.id = 'zfMessageActions';
      menu.className = 'zf-message-menu';
      const bubble = wrap.querySelector('.bubble');
      menu.innerHTML = '<button data-action="reply">Antwoorden</button><button data-action="copy">Kopieren</button><button data-action="share">Delen</button><button data-action="edit">Bewerken</button><button data-action="delete-me" data-danger>Verwijderen voor mij</button><button data-action="delete-all" data-danger>Verwijderen voor iedereen</button><button data-action="info">Info</button><button data-action="star">Markeren met ster</button><button data-action="more">Meer opties</button>';
      menu.style.left = `${Math.min(x, window.innerWidth - 230)}px`;
      menu.style.top = `${Math.min(y, window.innerHeight - 330)}px`;
      document.body.appendChild(menu);
      menu.addEventListener('click', async event => {
        const button = event.target.closest('[data-action]');
        if (!button) return;
        const action = button.dataset.action;
        const text = wrap.dataset.messageText || '';
        if (action === 'reply') { input.value = `> ${text}\n`; input.focus(); }
        if (action === 'copy') { await navigator.clipboard?.writeText(text); }
        if (action === 'share') { if (navigator.share) await navigator.share({ text }); else { await navigator.clipboard?.writeText(text); alert('Bericht gekopieerd om te delen.'); } }
        if (action === 'edit') { const editor = document.createElement('textarea'); editor.className = 'zf-message-edit'; editor.value = text; bubble.textContent = ''; bubble.appendChild(editor); bubble.classList.add('is-editing'); editor.focus(); editor.onblur = () => { const value = editor.value.trim(); if (value) { wrap.dataset.messageText = value; bubble.textContent = value; } bubble.classList.remove('is-editing'); }; }
        if (action === 'delete-me' || action === 'delete-all') { if (action === 'delete-all' && !window.confirm('Dit bericht voor iedereen verwijderen?')) return; wrap.remove(); }
        if (action === 'info') alert(`Bericht: ${text}\nTijd: ${new Date().toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' })}`);
        if (action === 'star') { wrap.classList.toggle('is-starred'); button.textContent = wrap.classList.contains('is-starred') ? 'Ster verwijderen' : 'Markeren met ster'; }
        if (action === 'more') { button.textContent = 'Vastzetten / vertalen'; button.dataset.action = 'pin'; const translate = document.createElement('button'); translate.dataset.action = 'translate'; translate.textContent = 'Vertalen'; menu.appendChild(translate); }
        if (action === 'pin') wrap.classList.toggle('is-pinned');
        if (action === 'translate') { bubble.insertAdjacentHTML('beforeend', '<small class="block mt-1 text-slate-400">Vertaling: controleer de tekst in je browservertaler.</small>'); }
        if (action !== 'more' && action !== 'star') closeMessageMenus();
      });
    };
    let pressTimer;
    messages.addEventListener('pointerover', event => { if (event.target.closest('.zf-message-action-trigger')) return; const wrap = event.target.closest('.zf-message-wrap'); if (wrap) wrap.querySelector('.zf-message-action-trigger').style.opacity = '1'; });
    messages.addEventListener('pointerdown', event => { const wrap = event.target.closest('.zf-message-wrap'); if (!wrap) return; pressTimer = window.setTimeout(() => openMenu(wrap, event.clientX, event.clientY), 550); });
    messages.addEventListener('pointerup', () => window.clearTimeout(pressTimer));
    messages.addEventListener('pointercancel', () => window.clearTimeout(pressTimer));
    messages.addEventListener('click', event => { const trigger = event.target.closest('.zf-message-action-trigger'); if (!trigger) return; event.stopPropagation(); const wrap = trigger.parentElement; const rect = trigger.getBoundingClientRect(); openMenu(wrap, rect.left, rect.bottom + 6); });
    document.addEventListener('click', event => { if (!event.target.closest('.zf-message-menu') && !event.target.closest('.zf-message-action-trigger')) closeMessageMenus(); });
    document.getElementById('close')?.addEventListener('click', closeMessageMenus);
    document.getElementById('back')?.addEventListener('click', closeMessageMenus);
  };
  const openZekerFlexChat = () => {
    contactConversation = null;
    document.querySelectorAll('.chat-item').forEach(item => item.classList.remove('active'));
    document.getElementById('title').textContent = 'ZekerFlex';
    document.getElementById('status').textContent = 'Admin support beschikbaar';
    document.getElementById('avatar').textContent = 'ZF';
    document.getElementById('chatRoom').classList.remove('hidden');
    document.getElementById('chatRoom').classList.add('flex');
    messages.innerHTML = loadPlatformHistory().map(item => `<div class="bubble ${item.mine ? 'mine' : 'theirs'}"><strong class="block text-xs text-emerald-700">${item.mine ? 'Jij' : 'ZekerFlex bot'}</strong>${escape(item.text)}${item.time ? `<span class="ml-2 text-[10px] text-slate-400">${escape(item.time)}</span>` : ''}</div>`).join('');
    input.focus();
  };
  const getPlatformAnswer = message => {
    const question = message.toLowerCase();
    if (/shift|klus|opdracht/.test(question) && /plaats|maken|publiceer|zoeken|vinden/.test(question)) return 'Voor een shift zoeken ga je naar Klussen zoeken. Als opdrachtgever plaats je een shift via Nieuwe Shift. Je ziet daar functie, locatie, datum en uurtarief.';
    if (/sollic|reageer|aanmeld/.test(question)) return 'Open een shift, bekijk de details en kies Direct solliciteren. Je reactie verschijnt in je overzicht en de opdrachtgever kan daarna contact met je opnemen.';
    if (/inlog|login|wachtwoord|account|registre/.test(question)) return 'Gebruik Inloggen of maak een account aan. Ben je je wachtwoord vergeten, kies dan Wachtwoord vergeten op de loginpagina.';
    if (/betaal|betaling|uitbeta|loon|factuur|uren|verdien/.test(question)) return 'Na je gewerkte shift dien je jouw uren in. De opdrachtgever controleert ze en daarna wordt de betaling verwerkt.';
    if (/planning|agenda|kalender|beschikbaar/.test(question)) return 'Je aangenomen shifts vind je in je planning. Houd je beschikbaarheid en contactgegevens actueel voor betere matches.';
    if (/groep|flexpool|community|contact/.test(question)) return 'Gebruik het plusje voor Nieuwe groep, Nieuwe community, Nieuw contact of de Flexpool. Je kunt contacten bewaren en vanuit de lijst een chat starten.';
    if (/admin|medewerker|help|support|vraag|probleem/.test(question)) return 'Ik help je eerst met een antwoord. Kom je er niet uit, dan zet ik je vraag door naar de admin. Beschrijf kort wat er aan de hand is.';
    return 'Ik kan dit niet direct beantwoorden. Klik op Admin support om je vraag door te zetten naar een medewerker.';
  };
  const addPlatformChat = () => {
    if (document.querySelector('[data-platform-chat]')) return;
    const item = document.createElement('button');
    item.type = 'button';
    item.dataset.platformChat = 'true';
    item.className = 'chat-item active flex w-full items-center gap-3 border-b border-slate-100 p-4 text-left transition hover:bg-emerald-50';
    item.innerHTML = '<span class="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-600 font-bold text-white">ZF</span><span class="min-w-0 flex-1"><strong class="block">ZekerFlex</strong><span class="block text-xs text-slate-500">Admin support</span></span><span class="text-xs text-emerald-600">Online</span>';
    item.onclick = openZekerFlexChat;
    conversations.prepend(item);
  };
  const openFlexpool = () => {
    contactConversation = null;
    document.getElementById('title').textContent = 'ZekerFlex Flexpool';
    document.getElementById('status').textContent = 'Bot actief · groepschat';
    document.getElementById('avatar').textContent = 'ZF';
    document.querySelectorAll('.chat-item').forEach(item => item.classList.remove('active'));
    messages.innerHTML = '<div class="bubble theirs"><strong class="block text-xs text-emerald-700">ZekerFlex bot</strong>Welkom in de Flexpool. Ik kan je helpen met beschikbaarheid, shifts en uitnodigingen.</div>';
    messages.insertAdjacentHTML('beforeend', '<div class="bubble theirs"><strong class="block text-xs text-emerald-700">ZekerFlex bot</strong>Typ bijvoorbeeld: “Ik ben zaterdag beschikbaar” of “nodig mij uit voor een shift”.</div>');
    document.getElementById('chatRoom').classList.remove('hidden');
    document.getElementById('chatRoom').classList.add('flex');
    input.focus();
  };
  const createMenu = () => {
    document.getElementById('zfChatTools')?.remove();
    const menu = document.createElement('div');
    menu.id = 'zfChatTools';
    menu.className = 'fixed inset-y-0 left-0 z-[80] w-[min(420px,100vw)] overflow-hidden border-r border-slate-200 bg-white shadow-2xl';
    menu.innerHTML = '<div class="flex items-center gap-3 border-b border-slate-100 px-4 py-4"><button type="button" data-close-new-chat class="text-2xl leading-none text-slate-600" aria-label="Nieuwe chat sluiten">←</button><strong class="text-lg text-slate-800">Nieuwe chat</strong></div><div class="border-b border-slate-100 bg-white p-3"><label class="flex items-center gap-2 rounded-full border-2 border-emerald-500 px-4 py-2.5 text-sm text-slate-400"><span>⌕</span><input data-new-chat-search class="min-w-0 flex-1 outline-none" placeholder="Zoek op naam, nummer of gebruikersnaam"></label></div><div data-new-chat-options class="max-h-[min(520px,65vh)] overflow-y-auto p-2"><button data-tool="document" class="zf-new-chat-option"><span class="zf-new-chat-icon">▣</span><span>Document</span></button><button data-tool="video" class="zf-new-chat-option"><span class="zf-new-chat-icon">▻</span><span>Video</span></button><button data-tool="location" class="zf-new-chat-option"><span class="zf-new-chat-icon">⌖</span><span>Locatie</span></button><button data-tool="group" class="zf-new-chat-option"><span class="zf-new-chat-icon">●+</span><span>Nieuwe groep</span></button><button data-tool="contact" class="zf-new-chat-option"><span class="zf-new-chat-icon">●</span><span>Nieuw contact</span></button><button data-tool="community" class="zf-new-chat-option"><span class="zf-new-chat-icon">•••</span><span>Nieuwe community</span></button><button data-tool="self" class="zf-new-chat-option"><span class="zf-new-chat-avatar">ZF</span><span><strong class="block">ZekerFlex</strong><small class="font-normal text-slate-500">Bericht naar mezelf verzenden</small></span></button><div data-new-chat-empty class="hidden p-6 text-center text-sm text-slate-500">Geen contacten gevonden.</div></div>';
    if (!document.getElementById('zfNewChatStyles')) { const styles = document.createElement('style'); styles.id = 'zfNewChatStyles'; styles.textContent = '.zf-new-chat-option{display:flex;align-items:center;gap:14px;width:100%;border-radius:12px;padding:14px 12px;text-align:left;font-size:15px;font-weight:700;color:#334155;transition:background .2s}.zf-new-chat-option:hover{background:#f0fdf4}.zf-new-chat-icon,.zf-new-chat-avatar{display:flex;align-items:center;justify-content:center;width:48px;height:48px;flex:0 0 48px;border-radius:999px;background:#25d366;color:white;font-size:20px;font-weight:900}.zf-new-chat-avatar{background:#64748b;font-size:12px}'; document.head.appendChild(styles); }
    const header = plus.closest('header');
    header.style.position = 'relative';
    header.appendChild(menu);
    menu.querySelector('[data-close-new-chat]').onclick = () => menu.remove();
    menu.querySelector('[data-new-chat-search]').oninput = event => { const query = event.target.value.toLowerCase(); let visible = 0; menu.querySelectorAll('.zf-new-chat-option').forEach(option => { const matches = option.textContent.toLowerCase().includes(query); option.classList.toggle('hidden', !matches); if (matches) visible += 1; }); menu.querySelector('[data-new-chat-empty]').classList.toggle('hidden', visible > 0); };
    menu.querySelectorAll('[data-tool]').forEach(button => button.onclick = () => handleTool(button.dataset.tool, menu));
  };
  const handleTool = (tool, menu) => {
    menu.remove();
    if (tool === 'flexpool') return openFlexpool();
    if (tool === 'self') { document.getElementById('title').textContent = 'ZekerFlex'; document.getElementById('status').textContent = 'Bericht naar mezelf'; document.getElementById('avatar').textContent = 'ZF'; document.getElementById('chatRoom').classList.remove('hidden'); document.getElementById('chatRoom').classList.add('flex'); messages.innerHTML = '<div class="bubble theirs">Dit is je persoonlijke chat.</div>'; input.focus(); return; }
    if (tool === 'community') { const name = prompt('Naam van de community:'); if (name?.trim()) { addBubble(`Community “${name.trim()}” is aangemaakt.`); notifyDashboard('Nieuwe community aangemaakt', `${name.trim()} staat klaar in Communicatie.`); } return; }
    if (tool === 'document') { const picker = document.createElement('input'); picker.type = 'file'; picker.accept = '.pdf,.doc,.docx,.xls,.xlsx,.txt'; picker.onchange = () => { if (picker.files?.[0]) input.value = `Document: ${picker.files[0].name}`; }; picker.click(); return; }
    if (tool === 'video') { const picker = document.createElement('input'); picker.type = 'file'; picker.accept = 'video/*'; picker.onchange = () => { if (picker.files?.[0]) input.value = `Video: ${picker.files[0].name}`; }; picker.click(); return; }
    if (tool === 'location') { if (!navigator.geolocation) { alert('Locatie delen wordt niet ondersteund.'); return; } navigator.geolocation.getCurrentPosition(position => { const { latitude, longitude } = position.coords; const map = `https://www.openstreetmap.org/export/embed.html?bbox=${longitude - .01}%2C${latitude - .005}%2C${longitude + .01}%2C${latitude + .005}&layer=mapnik&marker=${latitude}%2C${longitude}`; messages?.insertAdjacentHTML('beforeend', `<div class="bubble mine"><strong class="block text-[10px] text-emerald-700">Jij · locatie</strong><iframe title="Mijn locatie" class="mt-2 h-40 w-full rounded-xl border-0" src="${map}"></iframe></div>`); }, () => alert('Locatietoegang is geweigerd.')); return; }
    if (tool === 'invite') {
      const target = prompt('Nodig wie uit? Vul een naam of e-mailadres in:');
      if (!target?.trim()) return;
      addBubble(`Uitnodiging verstuurd naar ${target.trim()}`);
      notifyDashboard('Flexpool-uitnodiging verstuurd', `${target.trim()} is uitgenodigd voor de Flexpool.`);
      return;
    }
    if (tool === 'group') {
      const name = prompt('Naam van de nieuwe groep:');
      if (!name?.trim()) return;
      const groups = JSON.parse(localStorage.getItem('zf_chat_groups') || '[]');
      groups.push({ id: Date.now(), name: name.trim(), members: [] });
      localStorage.setItem('zf_chat_groups', JSON.stringify(groups));
      addBubble(`Groep “${name.trim()}” is aangemaakt.`);
      notifyDashboard('Nieuwe groep aangemaakt', `De groep ${name.trim()} staat klaar in Communicatie.`);
      return;
    }
    if (tool === 'contact') {
      openContactForm();
      return;
    }
    if (tool === 'contacts') {
      const contacts = JSON.parse(localStorage.getItem('zf_chat_contacts') || '[]');
      if (!contacts.length) { alert('Je hebt nog geen contacten toegevoegd.'); return; }
      const contactList = contacts.map(contact => `<div class="flex items-center gap-3 border-b border-slate-100 px-4 py-3"><span class="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-100 text-xs font-black text-emerald-700">${escape(contact.name.charAt(0).toUpperCase())}</span><span class="min-w-0 flex-1"><strong class="block text-sm text-slate-800">${escape(contact.name)}</strong><small class="block text-xs text-slate-500">${escape(contact.email || 'Geen e-mailadres')} · ${escape(contact.phone || 'Geen telefoonnummer')}</small></span><button type="button" data-contact-chat="${contact.id}" class="mr-2 text-xs font-bold text-emerald-700">Chat</button><button type="button" data-remove-contact="${contact.id}" class="text-xs font-bold text-rose-600">Verwijder</button></div>`).join('');
      const listPanel = document.createElement('div');
      listPanel.className = 'fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/40 p-4';
      listPanel.innerHTML = `<div class="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl"><div class="flex items-center justify-between border-b border-slate-100 px-4 py-3"><strong class="text-sm">Mijn contacten</strong><button type="button" class="text-xl text-slate-400" data-close-contacts>×</button></div><div>${contactList}</div><div class="border-t border-slate-100 p-3 text-right"><button type="button" class="rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white" data-close-contacts>Sluiten</button></div></div>`;
      document.body.appendChild(listPanel);
      listPanel.querySelectorAll('[data-close-contacts]').forEach(button => button.onclick = () => listPanel.remove());
      listPanel.querySelectorAll('[data-remove-contact]').forEach(button => button.onclick = () => { const updated = contacts.filter(contact => String(contact.id) !== button.dataset.removeContact); localStorage.setItem('zf_chat_contacts', JSON.stringify(updated)); listPanel.remove(); handleTool('contacts', document.createElement('div')); });
      listPanel.querySelectorAll('[data-contact-chat]').forEach(button => button.onclick = () => {
        const contact = contacts.find(item => String(item.id) === button.dataset.contactChat);
        if (!contact) return;
        listPanel.remove();
        contactConversation = {
          id: contact.id,
          name: contact.name,
          messages: loadContactHistory(contact.id)
        };
        document.getElementById('title').textContent = contact.name;
        document.getElementById('status').textContent = 'Contact';
        document.getElementById('avatar').textContent = contact.name.charAt(0).toUpperCase();
        document.getElementById('chatRoom').classList.remove('hidden');
        document.getElementById('chatRoom').classList.add('flex');
        renderContactMessages(contactConversation);
        input.focus();
      });
      return;
    }
    if (tool === 'template') {
      const template = prompt('Kies een standaardbericht:\n1. Beschikbaarheid opvragen\n2. Shiftuitnodiging\n3. Herinnering', '1');
      const messagesByTemplate = { '1': 'Hoi! Kun je jouw beschikbaarheid voor deze week doorgeven?', '2': 'Hoi! Je bent uitgenodigd voor een nieuwe shift. Kun je bevestigen?', '3': 'Hoi! Dit is een vriendelijke herinnering voor je geplande shift.' };
      if (messagesByTemplate[template]) { input.value = messagesByTemplate[template]; input.focus(); }
    }
  };
  addPlatformChat();
  addMessageActions();
  new MutationObserver(() => addMessageActions()).observe(messages, { childList: true });
  document.getElementById('form')?.addEventListener('submit', event => {
    if (document.getElementById('title')?.textContent !== 'ZekerFlex') return;
    event.preventDefault();
    event.stopImmediatePropagation();
    const text = input.value.trim();
    if (!text) return;
    addBubble(text);
    savePlatformMessage(text, true);
    input.value = '';
    window.setTimeout(() => { const answer = getPlatformAnswer(text); addBubble(answer, false); savePlatformMessage(answer, false); }, 450);
  }, true);
  const openContactForm = () => {
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 z-[90] flex items-center justify-center bg-slate-950/40 p-4';
    modal.innerHTML = '<form class="w-full max-w-md rounded-2xl bg-white p-5 shadow-2xl"><div class="flex items-center justify-between"><h2 class="text-lg font-black text-slate-900">Nieuw contact</h2><button type="button" data-close-contact class="text-xl text-slate-400">×</button></div><p class="mt-1 text-xs text-slate-500">Sla contactgegevens op om dit contact later snel terug te vinden.</p><label class="mt-4 block text-xs font-bold text-slate-600">Naam<input name="name" required autocomplete="off" class="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm" placeholder="Volledige naam"></label><label class="mt-3 block text-xs font-bold text-slate-600">E-mailadres<input name="email" type="email" autocomplete="off" class="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm" placeholder="naam@voorbeeld.nl"></label><label class="mt-3 block text-xs font-bold text-slate-600">Telefoonnummer<input name="phone" type="tel" autocomplete="off" class="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm" placeholder="06 12345678"></label><p data-contact-error class="mt-3 hidden rounded-lg bg-rose-50 p-2 text-xs font-semibold text-rose-700"></p><div class="mt-5 flex justify-end gap-2"><button type="button" data-close-contact class="rounded-xl bg-slate-100 px-4 py-2.5 text-xs font-bold text-slate-600">Annuleren</button><button type="submit" class="rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white">Contact opslaan</button></div></form>';
    document.body.appendChild(modal);
    modal.querySelectorAll('[data-close-contact]').forEach(button => button.onclick = () => modal.remove());
    modal.querySelector('form').onsubmit = event => {
      event.preventDefault();
      const data = new FormData(event.currentTarget);
      const name = String(data.get('name') || '').trim();
      const email = String(data.get('email') || '').trim();
      const phone = String(data.get('phone') || '').trim();
      const contacts = JSON.parse(localStorage.getItem('zf_chat_contacts') || '[]');
      if (contacts.some(contact => contact.email && email && contact.email.toLowerCase() === email.toLowerCase())) { const error = modal.querySelector('[data-contact-error]'); error.textContent = 'Dit e-mailadres staat al in je contacten.'; error.classList.remove('hidden'); return; }
      contacts.push({ id: Date.now(), name, email, phone, createdAt: new Date().toISOString() });
      localStorage.setItem('zf_chat_contacts', JSON.stringify(contacts));
      addBubble(`${name} is toegevoegd aan je contacten.`);
      notifyDashboard('Nieuw contact toegevoegd', `${name} staat nu in je contacten.`);
      modal.remove();
    };
    modal.querySelector('input[name="name"]').focus();
  };
  document.getElementById('form').addEventListener('submit', event => {
    if (!contactConversation) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    const text = input.value.trim();
    if (!text) return;
    const message = {
      mine: true,
      text,
      time: new Date().toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' })
    };
    contactConversation.messages.push(message);
    localStorage.setItem(getContactHistoryKey(contactConversation.id), JSON.stringify(contactConversation.messages));
    input.value = '';
    renderContactMessages(contactConversation);
  }, true);
  plus.onclick = event => { event.stopPropagation(); createMenu(); };
  document.addEventListener('click', event => { if (!event.target.closest('#zfChatTools') && event.target !== plus) document.getElementById('zfChatTools')?.remove(); });
  const contactButtonObserver = new MutationObserver(() => document.querySelectorAll('[data-contact-chat]').forEach(button => { button.textContent = 'Chat openen'; }));
  contactButtonObserver.observe(document.body, { childList: true, subtree: true });
})();
