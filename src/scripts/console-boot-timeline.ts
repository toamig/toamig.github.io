/** Shared cue sheet, in seconds. Audio and picture use the same playhead. */
export const BOOT_BURST = 7.4;
export const BOOT_DURATION = 10.2;
export const clamp = (value: number) => Math.min(1, Math.max(0, value));
export const smooth = (value: number) => { const x = clamp(value); return x * x * (3 - 2 * x); };
export const presence = (t: number, from: number, into: number, until: number, out: number) =>
  t < until ? smooth((t - from) / (into - from)) : 1 - smooth((t - until) / (out - until));

export function bootTimeline(t: number) {
  const arrival = presence(t, 8.1, 8.8, 9.2, 9.75);
  return {
    mark: Math.max(presence(t, .5, 1.2, 2.7, 3.3), arrival),
    markScale: 1 - smooth((t - 7.4) / .7) * .22,
    arrival,
    note: presence(t, 3.5, 3.9, 4.7, 5.15),
    overlay: 1 - smooth((t - 9.25) / .95),
    done: t >= BOOT_DURATION,
  };
}
export type BootTimeline = ReturnType<typeof bootTimeline>;
export interface BootRenderer { draw(time: number): void; resize(): void; dispose(): void; }
