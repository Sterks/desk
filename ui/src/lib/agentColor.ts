const HUE_SEED = 7;

export function agentHue(name: string): number {
  return [...name].reduce((hue, ch) => (hue * 31 + (ch.codePointAt(0) ?? 0)) % 360, HUE_SEED);
}

export function agentColor(name: string): string {
  return `oklch(0.64 0.13 ${agentHue(name)})`;
}
