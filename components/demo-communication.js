(function () {
  const workerMode = new URLSearchParams(location.search).get('from') === 'werknemer' || new URLSearchParams(location.search).get('demo') === 'werknemer';
  const conversationList = document.getElementById('conversations');
  const chatRoom = document.getElementById('chatRoom');
  const messages = document.getElementById('messages');
  const form = document.getElementById('form');
  if (!conversationList || !chatRoom || !messages || !form) return;

  const storageKey = 'zf_demo_two_way_messages';
  const defaultMessages = [{ role: 'bedrijf', name: 'Demo Horeca BV', text: 'Hoi Sophie, kun je zaterdag om 17:00 starten?', time: '09:20' }, { role: 'werknemer', name: 'Sophie de Vries', text: 'Hoi! Ja, dat lukt. Ik ben er om 16:45.', time: '09:22' }];
  const readMessages = () => JSON.parse(localStorage.getItem(storageKey) || 'null') || defaultMessages;
  const writeMessages = (items) => localStorage.setItem(storageKey, JSON.stringify(items));
  const continuationMessages = [{ role: 'bedrijf', name: 'Demo Horeca BV', text: 'Dank je, de dienst staat nu definitief in de planning.', time: '09:24' }, { role: 'werknemer', name: 'Sophie de Vries', text: 'Top, moet ik nog iets meenemen naar de locatie?', time: '09:25' }, { role: 'bedrijf', name: 'Demo Horeca BV', text: 'Neem je legitimatie mee. De teamleider wacht je bij de ingang op.', time: '09:27' }, { role: 'werknemer', name: 'Sophie de Vries', text: 'Komt goed. Tot zaterdag!', time: '09:28' }, { role: 'bedrijf', name: 'Demo Horeca BV', text: 'Tot dan, en bedankt voor je snelle reactie.', time: '09:29' }];
  if (!localStorage.getItem(storageKey)) writeMessages(defaultMessages.concat(continuationMessages));
  else if (readMessages().length < defaultMessages.length + continuationMessages.length) writeMessages(defaultMessages.concat(continuationMessages, readMessages().slice(defaultMessages.length + continuationMessages.length)));

  const testButton = document.createElement('button');
  testButton.type = 'button';
  testButton.className = 'demo-two-way-chat';
  testButton.innerHTML = '<span class="demo-two-way-avatar">↔</span><span><strong>Testgesprek tussen demo accounts</strong><small>Berichten delen tussen werkgever en werknemer</small></span><b>Demo</b>';
  conversationList.prepend(testButton);

  const render = () => {
    const items = readMessages();
    messages.innerHTML = items.map((item) => `<div class="bubble ${item.role === (workerMode ? 'werknemer' : 'bedrijf') ? 'mine' : 'theirs'}"><strong>${item.name}</strong><br>${item.text}<span class="ml-2 text-[10px] text-slate-400">${item.time}</span></div>`).join('');
    messages.scrollTop = messages.scrollHeight;
  };
  const openTestChat = () => {
    document.querySelectorAll('.chat-item').forEach((item) => item.classList.remove('active'));
    testButton.classList.add('active');
    chatRoom.classList.remove('hidden');
    chatRoom.classList.add('mobile-open');
    document.getElementById('title').textContent = workerMode ? 'Demo Horeca BV' : 'Sophie de Vries';
    document.getElementById('status').textContent = workerMode ? 'Werkgever-demo · online' : 'Werknemer-demo · online';
    document.getElementById('avatar').textContent = workerMode ? 'H' : 'S';
    render();
  };
  testButton.addEventListener('click', openTestChat);
  form.addEventListener('submit', (event) => {
    if (!testButton.classList.contains('active')) return;
    event.preventDefault();
    const input = document.getElementById('input');
    const text = input.value.trim();
    if (!text) return;
    const items = readMessages();
    items.push({ role: workerMode ? 'werknemer' : 'bedrijf', name: workerMode ? 'Sophie de Vries' : 'Demo Horeca BV', text, time: new Date().toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' }) });
    writeMessages(items);
    input.value = '';
    render();
  });
  window.addEventListener('storage', (event) => { if (event.key === storageKey && testButton.classList.contains('active')) render(); });
  const style = document.createElement('style');
  style.textContent = '.demo-two-way-chat{display:flex;align-items:center;gap:10px;width:100%;padding:11px 12px;border:0;border-bottom:1px solid #eef0f2;background:#fff;text-align:left;color:#202027}.demo-two-way-chat:hover,.demo-two-way-chat.active{background:#f2fbf9}.demo-two-way-chat>span:nth-child(2){min-width:0;flex:1}.demo-two-way-chat strong,.demo-two-way-chat small{display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.demo-two-way-chat small{margin-top:4px;color:#888;font-size:11px}.demo-two-way-chat>b{padding:4px 6px;border-radius:3px;background:#eafaf4;color:#168d87;font-size:10px}.demo-two-way-avatar{display:grid;place-items:center;flex:0 0 34px;width:34px;height:34px;border-radius:50%;background:#11145f;color:#fff;font-weight:700}.demo-two-way-chat .demo-two-way-avatar{font-size:18px}.demo-two-way-chat.active .demo-two-way-avatar{background:#19c5b6}.bubble strong{font-size:11px;color:#168d87}';
  document.head.appendChild(style);
}());
