// 効果音と音声実況の読み上げ
'use strict';

/* ============ AUDIO ============ */
const AU = {
  ctx: null,
  init() {
    if (this.ctx) { if (this.ctx.state === 'suspended') this.ctx.resume(); return; }
    try {
      const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return;
      const x = this.ctx = new AC();
      this.master = x.createGain(); this.master.gain.value = S.muted ? 0 : 0.55; this.master.connect(x.destination);
      const len = x.sampleRate * 2, b = x.createBuffer(1, len, x.sampleRate), d = b.getChannelData(0);
      for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1; this.nb = b;
      const src = x.createBufferSource(); src.buffer = b; src.loop = true;
      const bp = x.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 550; bp.Q.value = 0.7;
      this.crowd = x.createGain(); this.crowd.gain.value = 0; const lp = x.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 1200; src.connect(bp); bp.connect(lp); lp.connect(this.crowd); this.crowd.connect(this.master); src.start();
      const rs = x.createBufferSource(); rs.buffer = b; rs.loop = true; const hp = x.createBiquadFilter(); hp.type = 'lowpass'; hp.frequency.value = 950; this.rainG = x.createGain(); this.rainG.gain.value = this.rainV || 0; rs.connect(hp); hp.connect(this.rainG); this.rainG.connect(this.master); rs.start(0, 0.7);
    } catch (e) { this.ctx = null; }
  },
  now() { return this.ctx ? this.ctx.currentTime : 0; },
  setMute(m) { if (this.master) this.master.gain.setTargetAtTime(m ? 0 : 0.55, this.now(), 0.05); },
  crowdLvl(v) { if (this.crowd) this.crowd.gain.setTargetAtTime(v * 0.12, this.now(), 0.35); },
  rainLvl(v) { this.rainV = v; if (this.rainG) this.rainG.gain.setTargetAtTime(v, this.now(), 0.6); },
  thunder() { if (!this.ctx) return; const t = this.now(); this.noise(t, 2.6, 180, 0.45, 'lowpass', 40); this.noise(t + 0.05, 0.5, 600, 0.12, 'lowpass', 120); },
  tone(f, t, dur, type = 'triangle', vol = 0.15, f2) {
    const x = this.ctx; if (!x) return;
    const o = x.createOscillator(), g = x.createGain(); o.type = type; o.frequency.setValueAtTime(f, t); if (f2) o.frequency.exponentialRampToValueAtTime(f2, t + dur);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + 0.012); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(this.master); o.start(t); o.stop(t + dur + 0.05);
  },
  noise(t, dur, freq, vol, type = 'lowpass', f2) {
    const x = this.ctx; if (!x) return;
    const s = x.createBufferSource(); s.buffer = this.nb; const f = x.createBiquadFilter(); f.type = type; f.frequency.setValueAtTime(freq, t); if (f2) f.frequency.exponentialRampToValueAtTime(f2, t + dur);
    const g = x.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + Math.min(0.015, dur * 0.2)); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    s.connect(f); f.connect(g); g.connect(this.master); s.start(t, Math.random()); s.stop(t + dur + 0.05);
  },
  fanfare() {
    if (!this.ctx) return; const t = this.now() + 0.05;
    [[392, 0, 0.16], [523, 0.18, 0.16], [659, 0.36, 0.16], [784, 0.54, 0.46], [659, 1.08, 0.14], [784, 1.26, 0.14], [1047, 1.44, 0.9]].forEach(([f, d, l]) => { this.tone(f, t + d, l + 0.12, 'triangle', 0.06); this.tone(f * 1.5, t + d, l + 0.12, 'triangle', 0.035); this.tone(f / 2, t + d, l + 0.12, 'triangle', 0.09); });
  },
  beep(hi) { this.tone(hi ? 1320 : 880, this.now(), hi ? 0.55 : 0.18, 'triangle', 0.07); },
  thump(v) { const t = this.now(); this.tone(rand(80, 105), t, 0.09, 'sine', v, 45); this.noise(t, 0.05, 450, v * 0.2); },
  whoosh() { const t = this.now(); this.noise(t, 0.6, 300, 0.16, 'bandpass', 1800); },
  // 電車の警笛：少しずれた2音を重ねて「ファーン」と伸ばす
  horn() { const t = this.now(); [[311, 0.1], [370, 0.08]].forEach(([f, vol]) => { this.tone(f, t, 0.9, 'sawtooth', vol * 0.5); this.tone(f * 1.003, t + 0.02, 0.85, 'square', vol * 0.25); }); },
  // 主要駅の回復：発車メロディ風の短いフレーズ
  station(notes = [784, 988, 1175, 988, 1568]) { const t = this.now(); notes.forEach((f, i) => this.tone(f, t + i * 0.11, i === notes.length - 1 ? 0.45 : 0.16, 'triangle', 0.06)); },
  chime() { const t = this.now(); [1047, 1319, 1568, 2093].forEach((f, i) => this.tone(f, t + i * 0.06, 0.4, 'sine', 0.09)); },
  pop() { const t = this.now(); this.tone(500, t, 0.15, 'triangle', 0.14, 1400); this.tone(1800, t + 0.05, 0.2, 'sine', 0.05); },
  coin() { const t = this.now(); this.tone(1976, t, 0.07, 'triangle', 0.035); this.tone(2637, t + 0.05, 0.2, 'triangle', 0.035); },
  jackpot() { const t = this.now(); [523, 659, 784, 1047, 1319, 1568, 2093].forEach((f, i) => { this.tone(f, t + i * 0.07, 0.35, 'triangle', 0.05); this.tone(f / 2, t + i * 0.07, 0.35, 'triangle', 0.07); }); this.tone(2093, t + 0.55, 1.2, 'triangle', 0.08); },
  sad() { const t = this.now(); [523, 494, 466, 440].forEach((f, i) => this.tone(f, t + i * 0.22, 0.3, 'triangle', 0.08)); },
  heart() { const t = this.now(); this.tone(60, t, 0.12, 'sine', 0.3, 40); this.tone(60, t + 0.18, 0.12, 'sine', 0.22, 40); }
};

/* ============ SPOKEN COMMENTARY ============ */
const VO = {
  active: null, pending: null, voice: null,
  init() {
    if (!('speechSynthesis' in window) || !('SpeechSynthesisUtterance' in window)) return;
    const refresh = () => {
      try { this.voice = window.speechSynthesis.getVoices().find(v => /^ja(?:-|$)/i.test(v.lang)) || null; } catch (e) { this.voice = null; }
    };
    refresh();
    window.speechSynthesis.addEventListener('voiceschanged', refresh);
  },
  stop() {
    this.active = null; this.pending = null;
    try { if ('speechSynthesis' in window) window.speechSynthesis.cancel(); } catch (e) { /* Text commentary remains available. */ }
  },
  say(text, priority = false) {
    if (S.muted || document.hidden || !('speechSynthesis' in window) || !('SpeechSynthesisUtterance' in window)) return;
    if (priority) this.stop();
    if (this.active) { this.pending = text; return; }
    try {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'ja-JP'; utterance.rate = 1.1; utterance.volume = 0.85;
      if (this.voice) utterance.voice = this.voice;
      this.active = utterance;
      utterance.onend = () => {
        if (this.active !== utterance) return;
        this.active = null;
        const next = this.pending; this.pending = null;
        if (next) this.say(next);
      };
      utterance.onerror = () => { if (this.active === utterance) { this.active = null; this.pending = null; } };
      window.speechSynthesis.speak(utterance);
    } catch (e) { this.active = null; this.pending = null; }
  }
};
VO.init();
document.addEventListener('visibilitychange', () => { if (document.hidden) VO.stop(); if (S.playType === 'crash') last = performance.now(); });
window.addEventListener('pagehide', () => VO.stop());
