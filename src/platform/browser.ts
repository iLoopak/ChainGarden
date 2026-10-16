/** Replace these adapters for Capacitor/Tauri; the engine never touches browser APIs. */
export function freshSeed(): number {
  return crypto.getRandomValues(new Uint32Array(1))[0];
}
export function freshRunId(): string {
  return crypto.randomUUID();
}
let context: AudioContext | undefined;
export function playNote(chain: number) {
  try {
    context ??= new AudioContext();
    void context.resume();
    const oscillator = context.createOscillator(),
      gain = context.createGain();
    oscillator.type = "sine";
    oscillator.frequency.value = 330 * Math.pow(1.12246, Math.min(chain, 12));
    gain.gain.setValueAtTime(0.045, context.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + 0.28);
    oscillator.connect(gain);
    gain.connect(context.destination);
    oscillator.start();
    oscillator.stop(context.currentTime + 0.3);
  } catch {
    /* Sound is optional on platforms without Web Audio. */
  }
}
