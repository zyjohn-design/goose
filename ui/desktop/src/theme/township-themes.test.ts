import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  buildMcpHostStyles,
  getResolvedTheme,
  isThemeId,
  resolveSystemTheme,
  themes,
} from './theme-tokens';

afterEach(() => {
  localStorage.clear();
  vi.unstubAllGlobals();
});

describe('township themes', () => {
  it('keeps the selected palette when following the OS appearance', () => {
    expect(resolveSystemTheme('navy-light', 'dark')).toBe('navy-dark');
    expect(resolveSystemTheme('forest-dark', 'light')).toBe('forest-light');
    expect(resolveSystemTheme('aura', 'light')).toBe('light');
    localStorage.setItem('theme', 'civic-dark');
    localStorage.setItem('use_system_theme', 'true');
    window.matchMedia = vi.fn().mockReturnValue({ matches: false });
    expect(getResolvedTheme()).toBe('civic-light');
  });

  it('resolves stored custom themes and rejects inherited object properties', () => {
    localStorage.setItem('theme', 'forest-dark');
    localStorage.setItem('use_system_theme', 'false');
    expect(getResolvedTheme()).toBe('forest-dark');
    for (const value of ['__proto__', 'constructor', 'unknown', null])
      expect(isThemeId(value)).toBe(false);
    localStorage.setItem('theme', 'constructor');
    expect(getResolvedTheme()).toBe('light');
  });

  it('sends the concrete custom palette to MCP apps instead of the original light/dark palette', () => {
    const styles = buildMcpHostStyles('navy-dark');
    expect(styles.variables?.['--color-background-primary']).toBe(
      themes['navy-dark'].tokens['--color-background-primary']
    );
    expect(styles.variables?.['--font-sans']).toContain('PingFang SC');
    expect(buildMcpHostStyles('light').variables?.['--color-background-primary']).toContain(
      'light-dark('
    );
  });
});
