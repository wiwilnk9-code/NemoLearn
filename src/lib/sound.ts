/**
 * NemoLearn Sound Effects & Gamification Audio Engine
 * Menggunakan Web Audio API (AudioContext) murni tanpa dependensi file eksternal:
 * - 0 network download, 100% offline & instan
 * - Sintesis gelombang harmonik (sine/triangle) dengan envelope ADSR
 * - Mengikuti preferensi pengguna (Default OFF per spesifikasi)
 * - Persistensi aman di localStorage
 */

export type SoundType =
  | "click"
  | "select"
  | "correct"
  | "wrong"
  | "complete"
  | "milestone"
  | "notification";

export interface SoundSettings {
  enabled: boolean;
  volume: number; // 0.0 - 1.0
}

const STORAGE_KEY = "nemolearn_sound_settings";
const DEFAULT_SETTINGS: SoundSettings = {
  enabled: false, // Default OFF sesuai ketentuan
  volume: 0.5,
};

let audioCtx: AudioContext | null = null;
let activeMasterGain: GainNode | null = null;
const listeners = new Set<(settings: SoundSettings) => void>();

// Anti-stacking timestamp map for throttling rapid successive audio triggers
const lastSoundTimes: Partial<Record<SoundType, number>> = {};
const MIN_SOUND_INTERVALS: Record<SoundType, number> = {
  click: 45,
  select: 60,
  correct: 250,
  wrong: 200,
  complete: 600,
  milestone: 500,
  notification: 200,
};

/**
 * Mengambil pengaturan suara dari localStorage dengan fallback default.
 */
export function getSoundSettings(): SoundSettings {
  if (typeof window === "undefined") return DEFAULT_SETTINGS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    const parsed = JSON.parse(raw);
    return {
      enabled: typeof parsed.enabled === "boolean" ? parsed.enabled : DEFAULT_SETTINGS.enabled,
      volume: typeof parsed.volume === "number" ? Math.max(0, Math.min(1, parsed.volume)) : DEFAULT_SETTINGS.volume,
    };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

/**
 * Menyimpan pembaruan pengaturan suara ke localStorage dan memicu subscriber.
 */
export function setSoundSettings(update: Partial<SoundSettings>): SoundSettings {
  const current = getSoundSettings();
  const next: SoundSettings = {
    enabled: typeof update.enabled === "boolean" ? update.enabled : current.enabled,
    volume: typeof update.volume === "number" ? Math.max(0, Math.min(1, update.volume)) : current.volume,
  };

  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      // Ignored if storage is restricted
    }
  }

  listeners.forEach((listener) => listener(next));
  return next;
}

/**
 * Berlangganan perubahan pengaturan audio (untuk UI reactive update).
 */
export function subscribeSoundSettings(callback: (settings: SoundSettings) => void): () => void {
  listeners.add(callback);
  return () => {
    listeners.delete(callback);
  };
}

/**
 * Inisialisasi AudioContext secara aman saat ada interaksi pengguna (user gesture).
 */
function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;

  try {
    if (!audioCtx) {
      const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtxClass) return null;
      audioCtx = new AudioCtxClass();
    }

    if (audioCtx.state === "suspended") {
      audioCtx.resume().catch(() => {});
    }

    return audioCtx;
  } catch {
    return null;
  }
}

/**
 * Sintesis suara secara matematis menggunakan AudioContext Oscillator.
 */
export function playSound(type: SoundType): void {
  if (typeof window === "undefined") return;

  const settings = getSoundSettings();
  if (!settings.enabled || settings.volume <= 0) return;

  // Anti-stacking / throttle check: cegah penumpukan suara beruntun yang menyebabkan distorsi
  const nowMs = Date.now();
  const lastTime = lastSoundTimes[type] || 0;
  const minInterval = MIN_SOUND_INTERVALS[type] || 50;
  if (nowMs - lastTime < minInterval) {
    return;
  }
  lastSoundTimes[type] = nowMs;

  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const now = ctx.currentTime;

    // Master volume node
    const masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(settings.volume * 0.8, now);
    masterGain.connect(ctx.destination);
    activeMasterGain = masterGain;

    switch (type) {
      case "click": {
        // Subtle tactile button click (transient chirp 18ms)
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(440, now);
        osc.frequency.exponentialRampToValueAtTime(110, now + 0.018);

        gain.gain.setValueAtTime(0.3, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.018);

        osc.connect(gain);
        gain.connect(masterGain);
        osc.start(now);
        osc.stop(now + 0.018);
        break;
      }

      case "select": {
        // Playful option select pop (sine 260Hz -> 480Hz in 60ms)
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(260, now);
        osc.frequency.exponentialRampToValueAtTime(480, now + 0.06);

        gain.gain.setValueAtTime(0.4, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);

        osc.connect(gain);
        gain.connect(masterGain);
        osc.start(now);
        osc.stop(now + 0.06);
        break;
      }

      case "correct": {
        // Uplifting major chord arpeggio (C5: 523.25Hz -> E5: 659.25Hz -> G5: 783.99Hz)
        const notes = [523.25, 659.25, 783.99];
        notes.forEach((freq, idx) => {
          const noteTime = now + idx * 0.08;
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = "triangle";
          osc.frequency.setValueAtTime(freq, noteTime);

          gain.gain.setValueAtTime(0.35, noteTime);
          gain.gain.exponentialRampToValueAtTime(0.001, noteTime + 0.18);

          osc.connect(gain);
          gain.connect(masterGain);
          osc.start(noteTime);
          osc.stop(noteTime + 0.18);
        });
        break;
      }

      case "wrong": {
        // Soft descending warm buzz (220Hz -> 160Hz in 120ms, non-punishing)
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(220, now);
        osc.frequency.exponentialRampToValueAtTime(160, now + 0.12);

        gain.gain.setValueAtTime(0.3, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

        osc.connect(gain);
        gain.connect(masterGain);
        osc.start(now);
        osc.stop(now + 0.12);
        break;
      }

      case "complete": {
        // Celebratory victory fanfare (C5 -> E5 -> G5 -> C6 arpeggio)
        const notes = [523.25, 659.25, 783.99, 1046.5];
        notes.forEach((freq, idx) => {
          const noteTime = now + idx * 0.1;
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = "triangle";
          osc.frequency.setValueAtTime(freq, noteTime);

          gain.gain.setValueAtTime(0.4, noteTime);
          gain.gain.exponentialRampToValueAtTime(0.001, noteTime + 0.35);

          osc.connect(gain);
          gain.connect(masterGain);
          osc.start(noteTime);
          osc.stop(noteTime + 0.35);
        });
        break;
      }

      case "milestone": {
        // Sparkle shimmer chime (E5 -> G#5 -> B5 -> E6)
        const notes = [659.25, 830.61, 987.77, 1318.51];
        notes.forEach((freq, idx) => {
          const noteTime = now + idx * 0.07;
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = "sine";
          osc.frequency.setValueAtTime(freq, noteTime);

          gain.gain.setValueAtTime(0.3, noteTime);
          gain.gain.exponentialRampToValueAtTime(0.001, noteTime + 0.25);

          osc.connect(gain);
          gain.connect(masterGain);
          osc.start(noteTime);
          osc.stop(noteTime + 0.25);
        });
        break;
      }

      case "notification": {
        // Gentle bell ping (880Hz decaying in 100ms)
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(880, now);

        gain.gain.setValueAtTime(0.25, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);

        osc.connect(gain);
        gain.connect(masterGain);
        osc.start(now);
        osc.stop(now + 0.1);
        break;
      }
    }
  } catch (err) {
    // Graceful no-op if audio fails to play
    console.debug("Audio play failed:", err);
  }
}
