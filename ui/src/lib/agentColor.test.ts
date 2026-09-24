import { describe, expect, it } from 'vitest';
import { agentColor, agentHue } from './agentColor';

describe('agentColor', () => {
  it('детерминирован и в диапазоне 0–359', () => {
    expect(agentHue('backend-agent')).toBe(agentHue('backend-agent'));
    for (const name of ['a', 'planner', 'Denis Runov', 'очень-длинное-имя-агента']) {
      const hue = agentHue(name);
      expect(hue).toBeGreaterThanOrEqual(0);
      expect(hue).toBeLessThan(360);
    }
  });
  it('возвращает oklch-цвет', () => expect(agentColor('qa')).toMatch(/^oklch\(0\.64 0\.13 \d+\)$/));
});
