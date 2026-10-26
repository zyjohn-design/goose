import { afterEach, describe, expect, it } from 'vitest';
import {
  applyThemeTokens,
  buildMcpHostStyles,
  isThemeId,
  isThemeIdFormat,
  parseHostThemePack,
  registerThemePacks,
  resolveSystemTheme,
} from './theme-tokens';
import { themePackTemplate } from './theme-pack-template';
import type { ThemePack } from './theme-pack';

function withChanges(changes: Record<string, unknown>) {
  return JSON.parse(JSON.stringify({ ...themePackTemplate, ...changes }));
}

function lightComponents(components: Record<string, string>) {
  return withChanges({ variants: { light: { tokens: {}, components } } });
}

afterEach(() => {
  registerThemePacks([]);
  localStorage.clear();
  document.documentElement.removeAttribute('style');
  delete document.documentElement.dataset.chatSkin;
});

describe('theme pack validation', () => {
  it('accepts the shipped template', () => {
    const result = parseHostThemePack(JSON.parse(JSON.stringify(themePackTemplate)));
    expect(result).toEqual({ ok: true, pack: themePackTemplate });
  });

  it.each([
    ['remote resources', lightComponents({ '--chat-user-bubble-bg': 'url(https://x.test/a.png)' })],
    ['css injection', lightComponents({ '--chat-user-bubble-bg': 'red; } body { display:none' })],
    ['host variable references', lightComponents({ '--chat-composer-shadow': 'var(--secret)' })],
    ['unknown component keys', lightComponents({ '--chat-anything': '#fff' })],
    ['oversized composer', lightComponents({ '--chat-composer-min-height': '900px' })],
    [
      'unknown tokens',
      withChanges({ variants: { light: { tokens: { '--app-internal': '#fff' } } } }),
    ],
    ['built-in ids', withChanges({ id: 'navy' })],
    ['path-like ids', withChanges({ id: '../settings' })],
    ['script fields', withChanges({ script: 'alert(1)' })],
    ['missing variants', withChanges({ variants: {} })],
  ])('rejects %s', (_label, input) => {
    expect(parseHostThemePack(input).ok).toBe(false);
  });
});

describe('theme pack registry', () => {
  const pack = themePackTemplate as ThemePack;

  it('registers pack variants as selectable themes and follows the OS within the pack', () => {
    expect(isThemeId('jinse-dangjian-dark')).toBe(false);
    expect(isThemeIdFormat('jinse-dangjian-dark')).toBe(true);
    registerThemePacks([pack]);
    expect(isThemeId('jinse-dangjian-dark')).toBe(true);
    expect(resolveSystemTheme('jinse-dangjian-light', 'dark')).toBe('jinse-dangjian-dark');
    expect(
      buildMcpHostStyles('jinse-dangjian-light').variables?.['--color-background-secondary']
    ).toBe('#FBF6EC');
  });

  it('falls back to the pack variant that exists when the OS appearance has none', () => {
    registerThemePacks([{ ...pack, variants: { light: pack.variants.light } }]);
    expect(resolveSystemTheme('jinse-dangjian-light', 'dark')).toBe('jinse-dangjian-light');
  });

  it('applies chat component slots only while a theme defines them', () => {
    registerThemePacks([pack]);
    const root = document.documentElement;
    applyThemeTokens('jinse-dangjian-light');
    expect(root.style.getPropertyValue('--chat-composer-min-height')).toBe('110px');
    expect(root.dataset.chatSkin).toBe('');
    applyThemeTokens('light');
    expect(root.style.getPropertyValue('--chat-composer-min-height')).toBe('');
    expect(root.dataset.chatSkin).toBeUndefined();
  });

  it('restores the active pack before first paint from the local cache', () => {
    localStorage.setItem('theme_pack_cache', JSON.stringify(pack));
    localStorage.setItem('theme', 'jinse-dangjian-dark');
    localStorage.setItem('use_system_theme', 'false');
    applyThemeTokens();
    expect(document.documentElement.style.getPropertyValue('--chat-user-bubble-bg')).toBe(
      '#8E2A25'
    );
  });
});
