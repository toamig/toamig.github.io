import { BOOT_BURST } from './console-boot-timeline';
type Cue = 'move' | 'category' | 'confirm' | 'back';

/** A small synthesized sound palette. All startup and interface audio is generated locally. */
export function createConsoleAudio(enabled: boolean, volume: number) {
  let context: AudioContext | null = null;
  let master: GainNode;
  let dry: GainNode;
  let wet: GainNode;
  let hidden = false;
  let lastCue = 0;
  const startupVoices = new Set<AudioScheduledSourceNode>();
  let startupBus: GainNode | null = null;

  function create() {
    if (context) return context;
    context = new AudioContext();
    master = context.createGain();
    master.gain.value = enabled ? volume : 0;
    const limiter = context.createDynamicsCompressor();
    limiter.threshold.value = -12;
    limiter.knee.value = 18;
    limiter.ratio.value = 6;
    master.connect(limiter).connect(context.destination);
    dry = context.createGain();
    dry.gain.value = .74;
    dry.connect(master);
    wet = context.createGain();
    wet.gain.value = .34;
    const reverb = context.createConvolver();
    const length = Math.floor(context.sampleRate * 3.2);
    const impulse = context.createBuffer(2, length, context.sampleRate);
    let seed = 187;
    for (let channel = 0; channel < 2; channel++) {
      const samples = impulse.getChannelData(channel);
      for (let i = 0; i < length; i++) {
        seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
        samples[i] = ((seed / 4294967296) * 2 - 1) * Math.pow(1 - i / length, 3.6);
      }
    }
    reverb.buffer = impulse;
    wet.connect(reverb).connect(master);
    context.addEventListener('statechange', () => { document.documentElement.dataset.audioState = context!.state; });
    document.documentElement.dataset.audioState = context.state;
    return context;
  }

  function connect(node: AudioNode, gain: GainNode, startup: boolean) {
    node.connect(gain);
    gain.connect(dry);
    gain.connect(wet);
    if (startup) startupVoices.add(node as AudioScheduledSourceNode);
    (node as AudioScheduledSourceNode).onended = () => { startupVoices.delete(node as AudioScheduledSourceNode); node.disconnect(); gain.disconnect(); };
  }

  function voice(frequency: number, start: number, duration: number, level: number, attack: number, startup = false, detune = 0) {
    if (!context) return;
    const oscillator = context.createOscillator();
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(frequency, start);
    oscillator.detune.value = detune;
    const gain = context.createGain();
    gain.gain.setValueAtTime(0, start);
    gain.gain.linearRampToValueAtTime(level, start + attack);
    gain.gain.exponentialRampToValueAtTime(.0001, start + duration);
    connect(oscillator, gain, startup);
    oscillator.start(start);
    oscillator.stop(start + duration + .1);
  }

  /** A short breath of filtered air that swells into the burst. */
  function swell(start: number, bus: GainNode) {
    if (!context) return;
    const buffer = context.createBuffer(1, context.sampleRate * 2, context.sampleRate);
    const samples = buffer.getChannelData(0);
    let smooth = 0;
    let seed = 501;
    for (let i = 0; i < samples.length; i++) {
      seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
      smooth = (smooth + ((seed / 4294967296) * 2 - 1) * .03) / 1.03;
      samples[i] = smooth;
    }
    const source = context.createBufferSource();
    source.buffer = buffer;
    const filter = context.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(200, start);
    filter.frequency.exponentialRampToValueAtTime(3200, start + .8);
    const gain = context.createGain();
    gain.gain.setValueAtTime(0, start);
    gain.gain.linearRampToValueAtTime(.3, start + .8);
    gain.gain.exponentialRampToValueAtTime(.0001, start + 1.7);
    source.connect(filter).connect(gain).connect(bus);
    startupVoices.add(source);
    source.onended = () => { startupVoices.delete(source); source.disconnect(); filter.disconnect(); gain.disconnect(); };
    source.start(start);
    source.stop(start + 1.8);
  }

  return {
    get enabled() { return enabled; },
    get ready() { return context?.state === 'running'; },
    async unlock() {
      if (!enabled) return true;
      try {
        const ctx = create();
        if (ctx.state === 'running') return true;
        return await Promise.race([ctx.resume().then(() => ctx.state === 'running'), new Promise<boolean>(resolve => setTimeout(() => resolve(false), 180))]);
      } catch { document.documentElement.dataset.audioState = 'unavailable'; return false; }
    },
    setEnabled(value: boolean) { enabled = value; if (context) master.gain.setTargetAtTime(enabled && !hidden ? volume : 0, context.currentTime, .06); },
    setVolume(value: number) { volume = Math.max(0, Math.min(1, value)); if (context) master.gain.setTargetAtTime(enabled && !hidden ? volume : 0, context.currentTime, .04); },
    setHidden(value: boolean) { hidden = value; if (context) master.gain.setTargetAtTime(enabled && !hidden ? volume : 0, context.currentTime, .1); },
    cue(type: Cue) {
      if (!enabled || context?.state !== 'running' || hidden) return;
      const now = context.currentTime;
      if (now - lastCue < .055) return;
      lastCue = now;
      if (type === 'move') { voice(740, now, .1, .025, .004); voice(1480, now, .09, .008, .002); }
      if (type === 'category') { voice(440, now, .28, .04, .015); voice(880, now + .025, .3, .018, .008); }
      if (type === 'confirm') { voice(554.37, now, .48, .044, .008); voice(830.61, now + .065, .55, .024, .01); }
      if (type === 'back') { voice(587.33, now, .24, .035, .006); voice(391.99, now + .045, .3, .02, .006); }
    },
    startup() {
      if (!enabled || context?.state !== 'running') return;
      const ctx = context;
      const bus = ctx.createGain();
      bus.connect(dry);
      bus.connect(wet);
      startupBus = bus;
      const t0 = ctx.currentTime + .05;
      // One long, dreamy note that swells beneath the mark and holds until the burst.
      const pad = (frequency: number, detune: number, type: OscillatorType, level: number) => {
        const oscillator = ctx.createOscillator();
        oscillator.type = type;
        oscillator.frequency.value = frequency;
        oscillator.detune.value = detune;
        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.Q.value = .6;
        filter.frequency.setValueAtTime(240, t0 + 2.4);
        filter.frequency.exponentialRampToValueAtTime(2600, t0 + BOOT_BURST);
        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0, t0 + 2.4);
        gain.gain.linearRampToValueAtTime(level, t0 + 5.4);
        gain.gain.setValueAtTime(level, t0 + 7.6);
        gain.gain.exponentialRampToValueAtTime(.0001, t0 + 10);
        oscillator.connect(filter).connect(gain).connect(bus);
        startupVoices.add(oscillator);
        oscillator.onended = () => { startupVoices.delete(oscillator); oscillator.disconnect(); filter.disconnect(); gain.disconnect(); };
        oscillator.start(t0 + 2.4);
        oscillator.stop(t0 + 10.1);
      };
      pad(329.63, -7, 'triangle', .05);
      pad(329.63, 7, 'triangle', .05);
      pad(493.88, 0, 'sine', .03);
      pad(164.81, 0, 'sawtooth', .014);
      // Four bright notes as the field bursts, the last one left to ring.
      const pluck = (frequency: number, start: number, duration: number) => {
        for (const harmonic of [1, 2]) {
          const oscillator = ctx.createOscillator();
          oscillator.type = 'sine';
          oscillator.frequency.value = frequency * harmonic;
          const gain = ctx.createGain();
          gain.gain.setValueAtTime(0, start);
          gain.gain.linearRampToValueAtTime(harmonic === 1 ? .085 : .03, start + .008);
          gain.gain.exponentialRampToValueAtTime(.0001, start + duration);
          oscillator.connect(gain).connect(bus);
          startupVoices.add(oscillator);
          oscillator.onended = () => { startupVoices.delete(oscillator); oscillator.disconnect(); gain.disconnect(); };
          oscillator.start(start);
          oscillator.stop(start + duration + .05);
        }
      };
      for (const [frequency, at, hold] of [[659.25, 0, .5], [830.61, .17, .5], [987.77, .34, .5], [1318.51, .52, 2.2]]) pluck(frequency, t0 + BOOT_BURST + at, hold);
      swell(t0 + BOOT_BURST - .8, bus);
      document.documentElement.dataset.startupAudio = 'played';
      // AudioContext is the master clock, including browser suspension and output latency.
      return () => {
        const timestamp = ctx.getOutputTimestamp?.();
        return (timestamp?.contextTime ? timestamp.contextTime : ctx.currentTime) - t0;
      };
    },
    stopStartup() {
      const bus = startupBus;
      startupBus = null;
      const voices = [...startupVoices];
      voices.forEach(node => startupVoices.delete(node));
      if (bus && context) bus.gain.setTargetAtTime(0, context.currentTime, .04);
      setTimeout(() => { for (const node of voices) { try { node.stop(); } catch { /* Already stopped. */ } } bus?.disconnect(); }, 220);
    },
  };
}
