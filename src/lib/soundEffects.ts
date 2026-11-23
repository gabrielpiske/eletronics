"use client";

const SOUND_MUTE_STORAGE_KEY = "senai_arena_sound_muted";
const SOUND_MUTE_EVENT = "senai_sound_mute_changed";

let sharedAudioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (isSoundMuted()) return null;

  try {
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext;
    if (!AudioCtx) return null;
    if (!sharedAudioCtx) {
      sharedAudioCtx = new AudioCtx();
    }
    if (sharedAudioCtx.state === "suspended") {
      sharedAudioCtx.resume().catch(() => {});
    }
    return sharedAudioCtx;
  } catch {
    return null;
  }
}

export function isSoundMuted(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return localStorage.getItem(SOUND_MUTE_STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

export function setSoundMuted(muted: boolean): void {
  if (typeof window === "undefined") return;
  try {
    if (muted) {
      localStorage.setItem(SOUND_MUTE_STORAGE_KEY, "1");
    } else {
      localStorage.removeItem(SOUND_MUTE_STORAGE_KEY);
    }
    window.dispatchEvent(new CustomEvent(SOUND_MUTE_EVENT));
  } catch {
    // ignore
  }
}

export function toggleSoundMuted(): boolean {
  const next = !isSoundMuted();
  setSoundMuted(next);
  if (!next) {
    playMultimeterBeep();
  }
  return next;
}

export function subscribeToSoundMute(
  callback: (muted: boolean) => void
): () => void {
  if (typeof window === "undefined") return () => {};
  const emit = () => callback(isSoundMuted());
  emit();
  window.addEventListener(SOUND_MUTE_EVENT, emit);
  window.addEventListener("storage", emit);
  return () => {
    window.removeEventListener(SOUND_MUTE_EVENT, emit);
    window.removeEventListener("storage", emit);
  };
}

/**
 * Bip curto de continuidade de multímetro digital (~2050 Hz) para acertos técnicos.
 */
export function playMultimeterBeep(): void {
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(2050, now);
    osc.frequency.exponentialRampToValueAtTime(2180, now + 0.085);

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.exponentialRampToValueAtTime(0.08, now + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.095);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.1);
  } catch {
    // ignore audio block
  }
}

/**
 * Som grave de desarme de disjuntor / curto-circuito para falhas técnicas.
 */
export function playBreakerTrip(): void {
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(190, now);
    osc.frequency.exponentialRampToValueAtTime(82, now + 0.22);

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.exponentialRampToValueAtTime(0.09, now + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.24);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.25);
  } catch {
    // ignore
  }
}

/**
 * Alerta sonoro duplo de intertravamento de segurança ou proteção anti-autoclique.
 */
export function playSafetyAlert(): void {
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const now = ctx.currentTime;
    [0, 0.14].forEach((offset, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "triangle";
      osc.frequency.setValueAtTime(idx === 0 ? 520 : 370, now + offset);

      gain.gain.setValueAtTime(0.001, now + offset);
      gain.gain.exponentialRampToValueAtTime(0.1, now + offset + 0.012);
      gain.gain.exponentialRampToValueAtTime(0.001, now + offset + 0.11);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + offset);
      osc.stop(now + offset + 0.12);
    });
  } catch {
    // ignore
  }
}
