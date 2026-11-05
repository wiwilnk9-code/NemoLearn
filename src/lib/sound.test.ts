import { describe, it, beforeEach } from "node:test";
import assert from "node:assert";
import {
  getSoundSettings,
  setSoundSettings,
  subscribeSoundSettings,
  playSound,
  SoundType,
} from "./sound";

describe("NemoLearn Sound Effects & Gamification Audio Suite (Tahap 7)", () => {
  let mockStore: Record<string, string> = {};

  beforeEach(() => {
    mockStore = {};
    const mockLocalStorage = {
      getItem: (key: string) => mockStore[key] ?? null,
      setItem: (key: string, val: string) => {
        mockStore[key] = String(val);
      },
      removeItem: (key: string) => {
        delete mockStore[key];
      },
      clear: () => {
        mockStore = {};
      },
    };

    (globalThis as any).window = globalThis;
    (globalThis as any).localStorage = mockLocalStorage;

    // Reset default state
    setSoundSettings({ enabled: false, volume: 0.5 });
  });

  it("1. Pengaturan Default: Suara wajib NONAKTIF (false) dengan volume awal 0.5", () => {
    const settings = getSoundSettings();
    assert.strictEqual(settings.enabled, false);
    assert.strictEqual(settings.volume, 0.5);
  });

  it("2. Persistensi: Menyimpan perubahan pengaturan ke localStorage", () => {
    setSoundSettings({ enabled: true, volume: 0.8 });
    const settings = getSoundSettings();
    assert.strictEqual(settings.enabled, true);
    assert.strictEqual(settings.volume, 0.8);

    const stored = JSON.parse(mockStore["nemolearn_sound_settings"] || "{}");
    assert.strictEqual(stored.enabled, true);
    assert.strictEqual(stored.volume, 0.8);
  });

  it("3. Boundary Clamping: Membatasi volume agar selalu berada di antara 0.0 dan 1.0", () => {
    setSoundSettings({ volume: 1.5 });
    assert.strictEqual(getSoundSettings().volume, 1.0);

    setSoundSettings({ volume: -0.5 });
    assert.strictEqual(getSoundSettings().volume, 0.0);
  });

  it("4. Subscription: Memberi notifikasi kepada komponen UI reaktif saat pengaturan berubah", () => {
    let notifiedSettings: any = null;
    let callCount = 0;

    const unsubscribe = subscribeSoundSettings((settings) => {
      notifiedSettings = settings;
      callCount++;
    });

    setSoundSettings({ enabled: true, volume: 0.75 });
    assert.strictEqual(callCount, 1);
    assert.deepStrictEqual(notifiedSettings, { enabled: true, volume: 0.75 });

    unsubscribe();
    setSoundSettings({ volume: 0.4 });
    // Setelah unsubscribe, callback tidak boleh dipanggil lagi
    assert.strictEqual(callCount, 1);
  });

  it("5. Guard Keamanan: Tidak memutar suara jika enabled bernilai false", () => {
    let oscillatorCreated = false;

    (globalThis as any).AudioContext = class {
      state = "running";
      currentTime = 0;
      destination = {};
      createGain() {
        return {
          gain: { setValueAtTime() {}, exponentialRampToValueAtTime() {} },
          connect() {},
        };
      }
      createOscillator() {
        oscillatorCreated = true;
        return {
          type: "sine",
          frequency: { setValueAtTime() {}, exponentialRampToValueAtTime() {} },
          connect() {},
          start() {},
          stop() {},
        };
      }
      resume() {
        return Promise.resolve();
      }
    };

    setSoundSettings({ enabled: false });
    playSound("click");
    playSound("select");
    playSound("correct");
    assert.strictEqual(oscillatorCreated, false);
  });

  it("6. Sintesis Web Audio API: Memutar seluruh kategori suara dengan oscillator sintetis", () => {
    let createdTypes: string[] = [];

    (globalThis as any).AudioContext = class {
      state = "running";
      currentTime = 0;
      destination = {};
      createGain() {
        return {
          gain: {
            setValueAtTime() {},
            exponentialRampToValueAtTime() {},
            linearRampToValueAtTime() {},
          },
          connect() {},
        };
      }
      createOscillator() {
        const osc = {
          type: "sine",
          frequency: {
            setValueAtTime() {},
            exponentialRampToValueAtTime() {},
            linearRampToValueAtTime() {},
          },
          connect() {},
          start() {
            createdTypes.push(osc.type);
          },
          stop() {},
        };
        return osc;
      }
      resume() {
        return Promise.resolve();
      }
    };

    setSoundSettings({ enabled: true, volume: 0.8 });

    const soundTypes: SoundType[] = [
      "click",
      "select",
      "correct",
      "wrong",
      "complete",
      "milestone",
      "notification",
    ];

    for (const type of soundTypes) {
      assert.doesNotThrow(() => playSound(type));
    }

    assert.ok(createdTypes.length > 0);
  });
});
