// Synthesized sound effects using the Web Audio API (no audio files needed).
const Sound = (() => {
  let ctx = null;
  let muted = false;
  let marchStep = 0;
  const MARCH_NOTES = [98, 87, 78, 73]; // classic four-note descending bass

  // Browsers only allow audio after a user gesture, so call this from a key handler.
  function init() {
    if (!ctx) {
      ctx = new AudioContext();
      say(""); // iOS only allows speech after it is first used inside a user gesture
    }
    if (ctx.state !== "running") ctx.resume(); // "suspended", or "interrupted" on iOS
  }

  // Speak a word with the browser's built-in voice. Without `interrupt`,
  // the word is skipped if something is still being said, so words never pile up.
  function say(text, { interrupt = false } = {}) {
    if (!("speechSynthesis" in window) || muted) return;
    if (speechSynthesis.speaking) {
      if (!interrupt) return;
      speechSynthesis.cancel();
    }
    const u = new SpeechSynthesisUtterance(text);
    u.lang = "en-US";
    u.rate = 0.85;
    u.pitch = 1.2;
    speechSynthesis.speak(u);
  }

  function stopSpeech() {
    if ("speechSynthesis" in window) speechSynthesis.cancel();
  }

  function tone(freq, dur, { type = "square", vol = 0.1, endFreq = freq, delay = 0 } = {}) {
    if (!ctx || muted) return;
    const t = ctx.currentTime + delay;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t);
    osc.frequency.exponentialRampToValueAtTime(endFreq, t + dur);
    gain.gain.setValueAtTime(vol, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + dur);
    osc.connect(gain).connect(ctx.destination);
    osc.start(t);
    osc.stop(t + dur);
  }

  function noise(dur, vol) {
    if (!ctx || muted) return;
    const t = ctx.currentTime;
    const buffer = ctx.createBuffer(1, Math.floor(ctx.sampleRate * dur), ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    const src = ctx.createBufferSource();
    src.buffer = buffer;
    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.setValueAtTime(3000, t);
    filter.frequency.exponentialRampToValueAtTime(200, t + dur);
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(vol, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + dur);
    src.connect(filter).connect(gain).connect(ctx.destination);
    src.start(t);
  }

  return {
    init,
    say,
    stopSpeech,
    toggleMute() {
      muted = !muted;
      if (muted) stopSpeech();
      return muted;
    },
    shoot: () => tone(880, 0.12, { vol: 0.05, endFreq: 220 }),
    alienHit: () => noise(0.25, 0.25),
    playerHit() {
      noise(0.6, 0.35);
      tone(200, 0.6, { type: "sawtooth", vol: 0.08, endFreq: 40 });
    },
    march() {
      tone(MARCH_NOTES[marchStep], 0.09, { vol: 0.12 });
      marchStep = (marchStep + 1) % MARCH_NOTES.length;
    },
    levelUp() {
      [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.15, { vol: 0.06, delay: i * 0.1 }));
    },
    gameOver() {
      [392, 330, 262, 196].forEach((f, i) =>
        tone(f, 0.3, { type: "triangle", vol: 0.12, delay: i * 0.25 })
      );
    },
  };
})();
