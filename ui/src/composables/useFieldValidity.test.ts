import { describe, expect, it } from 'vitest';
import { useFieldValidity } from './useFieldValidity';

describe('useFieldValidity', () => {
  it('невалидна, пока хотя бы одно поле невалидно', () => {
    const { hasInvalid, setInvalid } = useFieldValidity();
    expect(hasInvalid.value).toBe(false);
    setInvalid('estimate', true);
    setInvalid('score', true);
    expect(hasInvalid.value).toBe(true);
    setInvalid('estimate', false);
    expect(hasInvalid.value).toBe(true);
    setInvalid('score', false);
    expect(hasInvalid.value).toBe(false);
  });

  it('повторные сообщения о том же состоянии ничего не меняют', () => {
    const { hasInvalid, setInvalid } = useFieldValidity();
    setInvalid('estimate', false);
    expect(hasInvalid.value).toBe(false);
    setInvalid('estimate', true);
    setInvalid('estimate', true);
    setInvalid('estimate', false);
    expect(hasInvalid.value).toBe(false);
  });
});
