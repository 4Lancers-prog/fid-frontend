import { describe, it, expect } from 'vitest';
import { dictionary } from '../../i18n/dictionary';

describe('i18n dictionary', () => {
  it('has matching keys in English and Kannada', () => {
    const en = Object.keys(dictionary.en).sort();
    const kn = Object.keys(dictionary.kn).sort();
    expect(kn).toEqual(en);
  });
  it('provides Kannada (non-Latin) strings for key labels', () => {
    expect(dictionary.kn['nav.dashboard']).toBe('ಡ್ಯಾಶ್‌ಬೋರ್ಡ್');
    expect(dictionary.kn['common.signIn']).not.toBe(dictionary.en['common.signIn']);
    // Kannada strings should contain Kannada script characters.
    expect(/[\u0C80-\u0CFF]/.test(dictionary.kn['nav.farmers'])).toBe(true);
  });
});
