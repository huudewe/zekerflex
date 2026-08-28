(() => {
  const microphone = document.getElementById('mic');
  const messages = document.getElementById('messages');
  if (!microphone || !messages || !navigator.mediaDevices?.getUserMedia) return;
  let recorder = null;
  let chunks = [];
  let stream = null;
  const addAudioMessage = blob => {
    const bubble = document.createElement('div');
    bubble.className = 'bubble mine';
    bubble.innerHTML = '<span class="mb-1 block text-[10px] font-bold text-emerald-700">Jij · spraakbericht</span>';
    const audio = document.createElement('audio');
    audio.controls = true;
    audio.className = 'max-w-full';
    audio.src = URL.createObjectURL(blob);
    bubble.appendChild(audio);
    messages.appendChild(bubble);
    messages.scrollTop = messages.scrollHeight;
  };
  const stopRecording = () => {
    if (!recorder || recorder.state === 'inactive') return;
    recorder.stop();
    stream?.getTracks().forEach(track => track.stop());
    microphone.textContent = '🎤';
    microphone.title = 'Spraakbericht opnemen';
  };
  microphone.onclick = async () => {
    if (recorder?.state === 'recording') { stopRecording(); return; }
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      chunks = [];
      recorder = new MediaRecorder(stream);
      recorder.ondataavailable = event => { if (event.data.size) chunks.push(event.data); };
      recorder.onstop = () => { if (chunks.length) addAudioMessage(new Blob(chunks, { type: recorder.mimeType || 'audio/webm' })); };
      recorder.start();
      microphone.textContent = '■';
      microphone.title = 'Opname stoppen';
    } catch { alert('Microfoontoegang is nodig om een spraakbericht op te nemen.'); }
  };
})();
