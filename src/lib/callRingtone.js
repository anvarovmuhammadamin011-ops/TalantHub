// Telegram uslubidagi qo'ng'iroq ohanglari — tashqi audio faylsiz, WebAudio bilan.
// incoming: kiruvchi qo'ng'iroq (klassik ikki tonli ring)
// outgoing: chiquvchi qo'ng'iroq (aloqa kutilmoqda — ringback)

let ctx = null;
let timerId = null;
let currentNodes = [];

function ensureCtx() {
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
  }
  if (ctx.state === "suspended") ctx.resume().catch(() => {});
  return ctx;
}

function beep(freqA, freqB, duration) {
  const ac = ensureCtx();
  if (!ac) return;
  const gain = ac.createGain();
  gain.gain.setValueAtTime(0.0001, ac.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.25, ac.currentTime + 0.05);
  gain.gain.setValueAtTime(0.25, ac.currentTime + duration - 0.05);
  gain.gain.exponentialRampToValueAtTime(0.0001, ac.currentTime + duration);
  gain.connect(ac.destination);
  for (const f of [freqA, freqB]) {
    const osc = ac.createOscillator();
    osc.type = "sine";
    osc.frequency.value = f;
    osc.connect(gain);
    osc.start();
    osc.stop(ac.currentTime + duration + 0.05);
    currentNodes.push(osc);
  }
  currentNodes.push(gain);
}

function clearNodes() {
  for (const n of currentNodes) {
    try { n.disconnect(); } catch { /* noop */ }
  }
  currentNodes = [];
}

export function stopRingtone() {
  if (timerId) { clearInterval(timerId); timerId = null; }
  clearNodes();
  if (window.navigator?.vibrate) {
    try { window.navigator.vibrate(0); } catch { /* noop */ }
  }
}

export function playRingtone(type = "incoming") {
  stopRingtone();
  try {
    if (type === "incoming") {
      // 1 soniya ring + 2 soniya pauza, klassik naqsh
      const ring = () => beep(440, 480, 1.0);
      ring();
      timerId = setInterval(ring, 3000);
      if (window.navigator?.vibrate) {
        try { window.navigator.vibrate([500, 500, 500, 1500]); } catch { /* noop */ }
      }
    } else {
      // Ringback: 1 soniya ohang + 4 soniya pauza
      const ring = () => beep(440, 440, 1.0);
      ring();
      timerId = setInterval(ring, 5000);
    }
  } catch { /* audio bloklangan bo'lsa jim */ }
}
