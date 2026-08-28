(() => {
  const SUPABASE_URL = 'https://cfkzfdqlcfifrukjdvnj.supabase.co';
  const SUPABASE_KEY = 'sb_publishable_KoGEquVbS_OIsoTWchG8Qw_Q6vJWJS8';
  const visitorId = localStorage.getItem('zekerflex_visitor_id') || crypto.randomUUID();
  localStorage.setItem('zekerflex_visitor_id', visitorId);
  const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY, { global: { headers: { 'x-zf-visitor-id': visitorId } } });
  let ticketId = localStorage.getItem('zekerflex_ticket_id');
  let messageTimer;

  const style = document.createElement('style');
  style.textContent = `
    #zfChatPanel { width: min(380px, calc(100vw - 32px)); }
    #zfChatMessages { max-height: 260px; overflow-y: auto; }
    .zf-message { max-width: 85%; border-radius: 14px; padding: 9px 11px; font-size: 13px; line-height: 1.4; }
    .zf-message.visitor { margin-left: auto; background: #e0e7ff; color: #312e81; }
    .zf-message.admin { background: #ecfdf5; color: #065f46; }
      #zfCookieNotice { width: min(420px, calc(100vw - 32px)); bottom: 88px; right: 20px; left: auto; }
      @media (max-width: 640px) { #zfCookieNotice { right: 16px; bottom: 84px; } }
  `;
  document.head.appendChild(style);

  document.body.insertAdjacentHTML('beforeend', `
    <button id="zfChatButton" type="button" aria-label="Open ZekerFlex chat" aria-expanded="false" class="hidden">💬</button>
    <section id="zfChatPanel" class="fixed bottom-24 right-5 z-50 hidden overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-2xl" role="dialog" aria-labelledby="zfChatTitle">
      <div class="flex items-center justify-between bg-indigo-950 px-5 py-4 text-white">
        <div><p id="zfChatTitle" class="text-sm font-bold">ZekerFlex Support</p><p id="zfChatStatus" class="text-xs text-indigo-200">Berichten worden veilig opgeslagen</p></div>
        <button id="zfChatClose" type="button" class="text-xl text-indigo-200 hover:text-white" aria-label="Chat sluiten">×</button>
      </div>
      <div class="space-y-3 p-4">
        <div id="zfChatMessages" class="space-y-2"><div class="zf-message admin">Hoi! Hoe kan ik je vandaag helpen?</div></div>
        <div id="zfQuickQuestions" class="flex flex-wrap gap-2">
          <button type="button" data-question="Hoe werkt solliciteren?" class="rounded-full bg-indigo-50 px-3 py-1.5 text-xs font-semibold text-indigo-700">Hoe werkt solliciteren?</button>
          <button type="button" data-question="Ik heb hulp nodig met mijn account" class="rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700">Hulp met mijn account</button>
          <button type="button" data-question="Ik wil een shift plaatsen" class="rounded-full bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-700">Een shift plaatsen</button>
        </div>
        <form id="zfChatForm" class="space-y-2">
          <input id="zfName" required placeholder="Je naam" class="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500">
          <input id="zfEmail" required type="email" placeholder="Je e-mailadres voor antwoord" class="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500">
          <textarea id="zfMessage" required rows="2" placeholder="Waar kunnen we mee helpen?" class="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500"></textarea>
          <button id="zfSend" class="w-full rounded-xl bg-indigo-600 py-2.5 text-sm font-bold text-white transition hover:bg-indigo-700">Stuur bericht</button>
        </form>
        <p id="zfChatNotice" class="hidden rounded-xl bg-emerald-50 p-3 text-xs leading-relaxed text-emerald-700"></p>
      </div>
    </section>
      <aside id="zfCookieNotice" role="dialog" aria-labelledby="zfCookieTitle" aria-describedby="zfCookieText" class="fixed z-[60] hidden overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
        <div class="flex gap-3 border-b border-slate-100 bg-slate-950 px-4 py-3 text-white">
          <span class="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-400 text-lg text-slate-950" aria-hidden="true">✓</span>
          <div><h2 id="zfCookieTitle" class="text-sm font-bold">Privacy & chatinstellingen</h2><p class="mt-0.5 text-[11px] text-slate-300">Kleine opslag, duidelijk uitgelegd.</p></div>
        </div>
        <div class="p-4">
          <p id="zfCookieText" class="text-xs leading-relaxed text-gray-600">We bewaren een technische chat-ID op je apparaat, zodat je gesprek kan doorgaan. We gebruiken hiervoor geen advertentiecookies.</p>
          <div class="mt-3 flex flex-wrap items-center justify-between gap-3">
            <a href="support.html#cookies" class="text-xs font-bold text-indigo-600 transition hover:text-indigo-800">Lees meer over privacy</a>
            <button id="zfCookieAccept" type="button" class="rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-bold text-white transition hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-offset-2">Begrepen</button>
          </div>
        </div>
      </aside>
    </div>
  `);

  const panel = document.getElementById('zfChatPanel');
  const messages = document.getElementById('zfChatMessages');
  const messageInput = document.getElementById('zfMessage');
  const notice = document.getElementById('zfChatNotice');
  const chatStatus = document.getElementById('zfChatStatus');
  const savedChatName = localStorage.getItem('zekerflex_chat_name');
  const savedChatEmail = localStorage.getItem('zekerflex_chat_email');
  if (savedChatName) document.getElementById('zfName').value = savedChatName;
  if (savedChatEmail) document.getElementById('zfEmail').value = savedChatEmail;
  supabase.auth.getUser().then(({ data: { user } }) => {
    if (!user) return;
    if (!document.getElementById('zfName').value) document.getElementById('zfName').value = user.user_metadata?.display_name || '';
    if (!document.getElementById('zfEmail').value) document.getElementById('zfEmail').value = user.email || '';
  });

  document.getElementById('zfChatButton').addEventListener('click', () => {
    panel.classList.toggle('hidden');
    document.getElementById('zfChatButton').setAttribute('aria-expanded', String(!panel.classList.contains('hidden')));
    if (!panel.classList.contains('hidden')) messageInput.focus();
  });
  document.querySelectorAll('[data-support-open]').forEach((button) => button.addEventListener('click', () => document.getElementById('zfChatButton').click()));
  document.getElementById('zfChatClose').addEventListener('click', () => panel.classList.add('hidden'));
  document.getElementById('zfCookieAccept').addEventListener('click', () => {
    localStorage.setItem('zekerflex_cookie_notice', 'accepted');
    document.getElementById('zfCookieNotice').classList.add('hidden');
  });
  if (!localStorage.getItem('zekerflex_cookie_notice')) {
    window.setTimeout(() => document.getElementById('zfCookieNotice').classList.remove('hidden'), 3000);
  }

  document.querySelectorAll('#zfQuickQuestions button').forEach((button) => {
    button.addEventListener('click', () => { messageInput.value = button.dataset.question || ''; messageInput.focus(); });
  });

  function renderMessages(items) {
    if (!items.length) return;
    messages.innerHTML = items.map((item) => `<div class="zf-message ${item.sender_role === 'admin' ? 'admin' : 'visitor'}"><span class="mb-0.5 block text-[10px] font-bold opacity-60">${item.sender_role === 'admin' ? 'ZekerFlex' : 'Jij'} · ${formatTime(item.created_at)}</span>${escapeHtml(item.message)}</div>`).join('');
    messages.scrollTop = messages.scrollHeight;
  }

  async function loadMessages() {
    if (!ticketId) return;
    const { data, error } = await supabase.from('support_messages').select('*').eq('ticket_id', ticketId).order('created_at', { ascending: true });
    if (error) {
      chatStatus.textContent = 'Antwoorden tijdelijk niet beschikbaar';
      return;
    }
    chatStatus.textContent = 'Chat verbonden · antwoord wordt automatisch opgehaald';
    if (data) renderMessages(data);
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
    const name = document.getElementById('zfName').value.trim();
    const email = document.getElementById('zfEmail').value.trim();
    const message = messageInput.value.trim();
    if (!message) return;
    localStorage.setItem('zekerflex_chat_name', name);
    localStorage.setItem('zekerflex_chat_email', email);
    button.disabled = true;
    button.textContent = 'Verzenden...';

    if (!ticketId) {
      const { data: { user } } = await supabase.auth.getUser();
      const { data: ticket, error } = await supabase.from('support_tickets').insert([{
        visitor_id: visitorId,
        user_id: user?.id || null,
        name,
        email,
        subject: 'Chatvraag',
        status: 'open',
      }]).select('id').single();
      if (error) {
        showSupportError(error);
        button.disabled = false;
        button.textContent = 'Stuur bericht';
        return;
      }
      ticketId = ticket.id;
      localStorage.setItem('zekerflex_ticket_id', ticketId);
    }

    const { error } = await supabase.from('support_messages').insert([{ ticket_id: ticketId, visitor_id: visitorId, sender_role: 'visitor', message }]);
    if (error) {
      notice.textContent = 'We konden je bericht niet verzenden. Probeer het opnieuw.';
      notice.classList.remove('hidden');
    } else {
      messageInput.value = '';
      chatStatus.textContent = 'Bericht verzonden · we antwoorden hier';
      notice.textContent = 'Je bericht staat in de chat. Zodra ZekerFlex antwoordt, verschijnt het automatisch hier.';
      notice.classList.remove('hidden');
      await loadMessages();
    }
    button.disabled = false;
    button.textContent = 'Stuur bericht';
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
      <article class="border border-gray-100 rounded-2xl p-4 mb-3 bg-gray-50">
        <div class="flex flex-col sm:flex-row justify-between gap-2"><div><h3 class="font-bold text-gray-900">${escapeHtml(ticket.name)} <span class="text-xs font-normal text-gray-500">${escapeHtml(ticket.email)}</span></h3><p class="text-xs text-gray-500 mt-1">${escapeHtml(ticket.subject || 'Chatvraag')}</p></div><span class="text-xs font-bold ${ticket.status === 'closed' ? 'text-gray-500' : 'text-emerald-600'}">${ticket.status === 'closed' ? 'Gesloten' : 'Open'}</span></div>
        <div id="zfAdminMessages-${ticket.id}" class="space-y-2 mt-3"></div>
        <form data-ticket-id="${ticket.id}" class="zfAdminReply flex gap-2 mt-3"><input required name="message" placeholder="Schrijf een antwoord..." class="min-w-0 flex-1 rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm"><button class="rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white">Antwoord</button></form>
        <button data-close-ticket="${ticket.id}" type="button" class="mt-2 text-xs font-semibold text-gray-500 hover:text-gray-900">Ticket sluiten</button>
      </article>
    `).join('');

    tickets.forEach(async (ticket) => {
      const { data: ticketMessages } = await supabase.from('support_messages').select('*').eq('ticket_id', ticket.id).order('created_at', { ascending: true });
      const target = document.getElementById(`zfAdminMessages-${ticket.id}`);
      if (target && ticketMessages) target.innerHTML = ticketMessages.map((item) => `<div class="rounded-xl ${item.sender_role === 'admin' ? 'bg-indigo-50 text-indigo-800' : 'bg-white text-gray-700'} p-3 text-xs"><strong>${item.sender_role === 'admin' ? 'Admin' : escapeHtml(ticket.name)}:</strong> ${escapeHtml(item.message)}</div>`).join('');
    });

    container.querySelectorAll('.zfAdminReply').forEach((form) => form.addEventListener('submit', async (event) => {
      event.preventDefault();
      const formElement = event.currentTarget;
      const ticket = formElement.dataset.ticketId;
      const input = formElement.querySelector('input[name="message"]');
      if (!ticket || !input.value.trim()) return;
      const { error } = await supabase.from('support_messages').insert([{ ticket_id: ticket, sender_role: 'admin', message: input.value.trim() }]);
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
