/**
 * Theme tokens — the single source of truth for all MCP semantic token values.
 *
 * Every key in McpUiStyleVariableKey must be present in both lightTokens and
 * darkTokens. The TypeScript compiler enforces this: if the SDK adds a new key,
 * the build breaks until both maps are updated.
 *
 * Values are applied to :root via style.setProperty() before first paint
 * (see renderer.tsx). main.css only registers the variable names for Tailwind
 * class generation — it does NOT define values.
 *
 * These tokens serve two purposes:
 *  1. Goose desktop — applied to :root per resolved theme.
 *  2. MCP apps — encoded as light-dark() in hostContext.styles.variables.
 */
import type {
  McpUiHostStyles,
  McpUiStyleVariableKey,
  McpUiStyles,
} from '@modelcontextprotocol/ext-apps/app-bridge';
import {
  chatComponentKeys,
  isThemePackId,
  parseThemePack,
  type ChatComponentKey,
  type ChatComponentTokens,
  type ThemePack,
  type ThemeVariant,
} from './theme-pack';
import civicPack from './packs/civic.json';
import forestPack from './packs/forest.json';
import navyPack from './packs/navy.json';

export type { ThemeVariant } from './theme-pack';

type ThemeTokens = Record<McpUiStyleVariableKey, string>;

// Subset of keys that are the same across both themes.
type BaseTokenKey = Extract<
  McpUiStyleVariableKey,
  `--font-${string}` | `--border-radius-${string}` | `--border-width-${string}`
>;

type ColorTokenKey = Exclude<McpUiStyleVariableKey, BaseTokenKey>;

// ---------------------------------------------------------------------------
// Base tokens — shared across light and dark themes
// ---------------------------------------------------------------------------
const baseTokens: Pick<ThemeTokens, BaseTokenKey> = {
  // Typography — families
  '--font-sans': "'Cash Sans', sans-serif",
  '--font-mono': 'monospace',

  // Typography — weights
  '--font-weight-normal': '400',
  '--font-weight-medium': '500',
  '--font-weight-semibold': '600',
  '--font-weight-bold': '700',

  // Typography — text sizes
  '--font-text-xs-size': '0.75rem',
  '--font-text-sm-size': '0.875rem',
  '--font-text-md-size': '1rem',
  '--font-text-lg-size': '1.125rem',

  // Typography — heading sizes
  '--font-heading-xs-size': '1rem',
  '--font-heading-sm-size': '1.125rem',
  '--font-heading-md-size': '1.25rem',
  '--font-heading-lg-size': '1.5rem',
  '--font-heading-xl-size': '1.875rem',
  '--font-heading-2xl-size': '2.25rem',
  '--font-heading-3xl-size': '3rem',

  // Typography — text line heights
  '--font-text-xs-line-height': '1rem',
  '--font-text-sm-line-height': '1.25rem',
  '--font-text-md-line-height': '1.5rem',
  '--font-text-lg-line-height': '1.75rem',

  // Typography — heading line heights
  '--font-heading-xs-line-height': '1.5rem',
  '--font-heading-sm-line-height': '1.75rem',
  '--font-heading-md-line-height': '1.75rem',
  '--font-heading-lg-line-height': '2rem',
  '--font-heading-xl-line-height': '2.25rem',
  '--font-heading-2xl-line-height': '2.5rem',
  '--font-heading-3xl-line-height': '3.5rem',

  // Border radius
  '--border-radius-xs': '2px',
  '--border-radius-sm': '4px',
  '--border-radius-md': '8px',
  '--border-radius-lg': '12px',
  '--border-radius-xl': '16px',
  '--border-radius-full': '9999px',

  // Border width
  '--border-width-regular': '1px',
};

// Theme-specific color/shadow tokens only.
type ColorTokens = Pick<ThemeTokens, ColorTokenKey>;

// ---------------------------------------------------------------------------
// Light theme — colors & shadows
// ---------------------------------------------------------------------------
const lightColorTokens: ColorTokens = {
  // Backgrounds
  '--color-background-primary': '#ffffff',
  '--color-background-secondary': '#f4f6f7',
  '--color-background-tertiary': '#e3e6ea',
  '--color-background-inverse': '#000000',
  '--color-background-ghost': 'transparent',
  '--color-background-info': '#5c98f9',
  '--color-background-danger': '#f94b4b',
  '--color-background-success': '#91cb80',
  '--color-background-warning': '#fbcd44',
  '--color-background-disabled': '#e3e6ea',

  // Text
  '--color-text-primary': '#3f434b',
  '--color-text-secondary': '#878787',
  '--color-text-tertiary': '#a7b0b9',
  '--color-text-inverse': '#ffffff',
  '--color-text-ghost': '#878787',
  '--color-text-info': '#5c98f9',
  '--color-text-danger': '#f94b4b',
  '--color-text-success': '#91cb80',
  '--color-text-warning': '#fbcd44',
  '--color-text-disabled': '#cbd1d6',

  // Borders
  '--color-border-primary': '#e3e6ea',
  '--color-border-secondary': '#e3e6ea',
  '--color-border-tertiary': '#cbd1d6',
  '--color-border-inverse': '#000000',
  '--color-border-ghost': 'transparent',
  '--color-border-info': '#5c98f9',
  '--color-border-danger': '#f94b4b',
  '--color-border-success': '#91cb80',
  '--color-border-warning': '#fbcd44',
  '--color-border-disabled': '#e3e6ea',

  // Rings
  '--color-ring-primary': '#e3e6ea',
  '--color-ring-secondary': '#cbd1d6',
  '--color-ring-inverse': '#ffffff',
  '--color-ring-info': '#5c98f9',
  '--color-ring-danger': '#f94b4b',
  '--color-ring-success': '#91cb80',
  '--color-ring-warning': '#fbcd44',

  // Shadows
  '--shadow-hairline': '0 0 0 1px rgba(0, 0, 0, 0.05)',
  '--shadow-sm': '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
  '--shadow-md': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1)',
  '--shadow-lg': '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1)',
};

// ---------------------------------------------------------------------------
// Dark theme — colors & shadows
// ---------------------------------------------------------------------------
const darkColorTokens: ColorTokens = {
  // Backgrounds
  '--color-background-primary': '#22252a',
  '--color-background-secondary': '#3f434b',
  '--color-background-tertiary': '#474e57',
  '--color-background-inverse': '#cbd1d6',
  '--color-background-ghost': 'transparent',
  '--color-background-info': '#7cacff',
  '--color-background-danger': '#ff6b6b',
  '--color-background-success': '#a3d795',
  '--color-background-warning': '#ffd966',
  '--color-background-disabled': '#474e57',

  // Text
  '--color-text-primary': '#ffffff',
  '--color-text-secondary': '#878787',
  '--color-text-tertiary': '#606c7a',
  '--color-text-inverse': '#000000',
  '--color-text-ghost': '#878787',
  '--color-text-info': '#7cacff',
  '--color-text-danger': '#ff6b6b',
  '--color-text-success': '#a3d795',
  '--color-text-warning': '#ffd966',
  '--color-text-disabled': '#525b68',

  // Borders
  '--color-border-primary': '#3f434b',
  '--color-border-secondary': '#525b68',
  '--color-border-tertiary': '#474e57',
  '--color-border-inverse': '#ffffff',
  '--color-border-ghost': 'transparent',
  '--color-border-info': '#7cacff',
  '--color-border-danger': '#ff6b6b',
  '--color-border-success': '#a3d795',
  '--color-border-warning': '#ffd966',
  '--color-border-disabled': '#3f434b',

  // Rings
  '--color-ring-primary': '#525b68',
  '--color-ring-secondary': '#474e57',
  '--color-ring-inverse': '#000000',
  '--color-ring-info': '#7cacff',
  '--color-ring-danger': '#ff6b6b',
  '--color-ring-success': '#a3d795',
  '--color-ring-warning': '#ffd966',

  // Shadows (darker for dark mode)
  '--shadow-hairline': '0 0 0 1px rgba(0, 0, 0, 0.2)',
  '--shadow-sm': '0 1px 2px 0 rgba(0, 0, 0, 0.2)',
  '--shadow-md': '0 4px 6px -1px rgba(0, 0, 0, 0.3), 0 2px 4px -2px rgba(0, 0, 0, 0.2)',
  '--shadow-lg': '0 10px 15px -3px rgba(0, 0, 0, 0.3), 0 4px 6px -4px rgba(0, 0, 0, 0.2)',
};

// ---------------------------------------------------------------------------
// Aura theme — colors & shadows (dark variant)
// Ported from OpenChamber's Aura preset: purple-black surfaces, purple accent,
// mint/peach/cyan/coral status colors, monospace typography.
// ---------------------------------------------------------------------------
const auraColorTokens: ColorTokens = {
  // Backgrounds
  '--color-background-primary': '#15141b',
  '--color-background-secondary': '#1a1921',
  '--color-background-tertiary': '#201e2b',
  '--color-background-inverse': '#a277ff',
  '--color-background-ghost': 'transparent',
  '--color-background-info': '#82e2ff',
  '--color-background-danger': '#ff6767',
  '--color-background-success': '#61ffca',
  '--color-background-warning': '#ffca85',
  '--color-background-disabled': '#25232f',

  // Text
  '--color-text-primary': '#edecee',
  '--color-text-secondary': '#8a8282',
  '--color-text-tertiary': '#6d6d6d',
  '--color-text-inverse': '#15141b',
  '--color-text-ghost': '#8a8282',
  '--color-text-info': '#82e2ff',
  '--color-text-danger': '#ff6767',
  '--color-text-success': '#61ffca',
  '--color-text-warning': '#ffca85',
  '--color-text-disabled': '#525b68',

  // Borders
  '--color-border-primary': '#2d2b38',
  '--color-border-secondary': '#47415a',
  '--color-border-tertiary': '#4e496c',
  '--color-border-inverse': '#edecee',
  '--color-border-ghost': 'transparent',
  '--color-border-info': '#82e2ff',
  '--color-border-danger': '#ff6767',
  '--color-border-success': '#61ffca',
  '--color-border-warning': '#ffca85',
  '--color-border-disabled': '#2d2b38',

  // Rings
  '--color-ring-primary': '#47415a',
  '--color-ring-secondary': '#2d2b38',
  '--color-ring-inverse': '#15141b',
  '--color-ring-info': '#82e2ff',
  '--color-ring-danger': '#ff6767',
  '--color-ring-success': '#61ffca',
  '--color-ring-warning': '#ffca85',

  // Shadows (dark)
  '--shadow-hairline': '0 0 0 1px rgba(0, 0, 0, 0.2)',
  '--shadow-sm': '0 1px 2px 0 rgba(0, 0, 0, 0.2)',
  '--shadow-md': '0 4px 6px -1px rgba(0, 0, 0, 0.3), 0 2px 4px -2px rgba(0, 0, 0, 0.2)',
  '--shadow-lg': '0 10px 15px -3px rgba(0, 0, 0, 0.3), 0 4px 6px -4px rgba(0, 0, 0, 0.2)',
};

// Aura is monospace-first — override the shared sans family.
const auraFontTokens: Partial<Pick<ThemeTokens, BaseTokenKey>> = {
  '--font-sans':
    'ui-monospace, "SFMono-Regular", "Menlo", "Cascadia Mono", "Segoe UI Mono", monospace',
  '--font-mono':
    'ui-monospace, "SFMono-Regular", "Menlo", "Cascadia Mono", "Segoe UI Mono", monospace',
};

// ---------------------------------------------------------------------------
// Merged token maps — used by applyThemeTokens() and buildMcpHostStyles()
// ---------------------------------------------------------------------------
export const lightTokens: ThemeTokens = { ...baseTokens, ...lightColorTokens };
export const darkTokens: ThemeTokens = { ...baseTokens, ...darkColorTokens };
export const auraTokens: ThemeTokens = { ...baseTokens, ...auraFontTokens, ...auraColorTokens };

// ---------------------------------------------------------------------------
// Theme registry — the set of selectable named themes.
// `variant` drives the .dark/.light class and colorScheme for anything outside
// the token system; `tokens` is the map applied to :root. Adding a future theme
// is a single entry here plus its token map above.
// ---------------------------------------------------------------------------
export type TownshipThemeFamily = 'civic' | 'navy' | 'forest';
export type BuiltinThemeId = 'light' | 'dark' | 'aura' | `${TownshipThemeFamily}-${ThemeVariant}`;
// Imported theme packs register `${packId}-${variant}` ids at runtime.
export type ThemeId = BuiltinThemeId | (string & {});

export interface ThemeDefinition {
  variant: ThemeVariant;
  tokens: ThemeTokens;
  components: ChatComponentTokens;
}

export const themeTokenKeys: ReadonlySet<string> = new Set(Object.keys(lightTokens));

export const townshipThemePacks: readonly ThemePack[] = [civicPack, navyPack, forestPack].map(
  (raw) => {
    const result = parseThemePack(raw, themeTokenKeys, { builtin: true });
    if (!result.ok) throw new Error(`Invalid built-in theme pack: ${result.error}`);
    return result.pack;
  }
);

export const townshipThemeFamilies = townshipThemePacks.map(
  ({ id, name, description, accent }) => ({
    id: id as TownshipThemeFamily,
    name,
    description: description ?? '',
    accent,
  })
);

export const themes = {
  light: { variant: 'light', tokens: lightTokens, components: {} },
  dark: { variant: 'dark', tokens: darkTokens, components: {} },
  aura: { variant: 'dark', tokens: auraTokens, components: {} },
  ...Object.fromEntries(townshipThemePacks.flatMap(packThemeDefinitions)),
} as Record<BuiltinThemeId, ThemeDefinition>;

const packThemes = new Map<string, ThemeDefinition>();
const ACTIVE_PACK_CACHE_KEY = 'theme_pack_cache';

export function themeIdsForPack(pack: ThemePack): string[] {
  return (['light', 'dark'] as const)
    .filter((variant) => pack.variants[variant])
    .map((variant) => `${pack.id}-${variant}`);
}

function packThemeDefinitions(pack: ThemePack): [string, ThemeDefinition][] {
  return (['light', 'dark'] as const).flatMap((variant) => {
    const definition = pack.variants[variant];
    if (!definition) return [];
    return [
      [
        `${pack.id}-${variant}`,
        {
          variant,
          tokens: { ...(variant === 'light' ? lightTokens : darkTokens), ...definition.tokens },
          components: definition.components,
        },
      ],
    ];
  });
}

export function registerThemePacks(packs: ThemePack[]): void {
  packThemes.clear();
  for (const pack of packs) {
    for (const [id, definition] of packThemeDefinitions(pack)) packThemes.set(id, definition);
  }
}

export function parseHostThemePack(input: unknown) {
  return parseThemePack(input, themeTokenKeys);
}

// The active pack is cached so the pre-paint path can apply it before IPC is available.
export function cacheActiveThemePack(pack: ThemePack | undefined): void {
  if (pack) localStorage.setItem(ACTIVE_PACK_CACHE_KEY, JSON.stringify(pack));
  else localStorage.removeItem(ACTIVE_PACK_CACHE_KEY);
}

function registerCachedThemePack(): void {
  if (packThemes.size > 0) return;
  const cached = localStorage.getItem(ACTIVE_PACK_CACHE_KEY);
  if (!cached) return;
  try {
    const result = parseHostThemePack(JSON.parse(cached));
    if (result.ok) registerThemePacks([result.pack]);
  } catch {
    localStorage.removeItem(ACTIVE_PACK_CACHE_KEY);
  }
}

export function getThemeDefinition(id: unknown): ThemeDefinition | undefined {
  if (typeof id !== 'string') return undefined;
  if (Object.hasOwn(themes, id)) return themes[id as BuiltinThemeId];
  return packThemes.get(id);
}

export function isThemeId(value: unknown): value is ThemeId {
  return getThemeDefinition(value) !== undefined;
}

export function isThemeIdFormat(value: unknown): value is ThemeId {
  if (isThemeId(value)) return true;
  if (typeof value !== 'string') return false;
  const match = /^(.+)-(light|dark)$/.exec(value);
  return !!match && isThemePackId(match[1]);
}

export function themeFamilyId(themeId: ThemeId): string | undefined {
  const match = /^(.+)-(light|dark)$/.exec(themeId);
  return match?.[1];
}

export function resolveSystemTheme(savedTheme: ThemeId, variant: ThemeVariant): ThemeId {
  const family = themeFamilyId(savedTheme);
  if (!family) return variant;
  const candidate = `${family}-${variant}`;
  if (isThemeId(candidate)) return candidate;
  return isThemeId(savedTheme) ? savedTheme : variant;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

// @font-face rules passed to MCP apps so sandboxed iframes can load host fonts.
const HOST_FONT_CSS = `
@font-face {
  font-family: 'Cash Sans';
  src: url(https://cash-f.squarecdn.com/static/fonts/cashsans/woff2/CashSans-Light.woff2) format('woff2'),
       url(https://cash-f.squarecdn.com/static/fonts/cashsans/woff/CashSans-Light.woff) format('woff');
  font-weight: 300;
  font-style: normal;
}
@font-face {
  font-family: 'Cash Sans';
  src: url(https://cash-f.squarecdn.com/static/fonts/cashsans/woff2/CashSans-Regular.woff2) format('woff2'),
       url(https://cash-f.squarecdn.com/static/fonts/cashsans/woff/CashSans-Regular.woff) format('woff');
  font-weight: 400;
  font-style: normal;
}
@font-face {
  font-family: 'Cash Sans';
  src: url(https://cash-f.squarecdn.com/static/fonts/cashsans/woff2/CashSans-Medium.woff2) format('woff2'),
       url(https://cash-f.squarecdn.com/static/fonts/cashsans/woff/CashSans-Medium.woff) format('woff');
  font-weight: 500;
  font-style: normal;
}
@font-face {
  font-family: 'Cash Sans';
  src: url(https://cash-f.squarecdn.com/static/fonts/cashsans/woff2/CashSans-Bold.woff2) format('woff2'),
       url(https://cash-f.squarecdn.com/static/fonts/cashsans/woff/CashSans-Bold.woff) format('woff');
  font-weight: 700;
  font-style: normal;
}
`.trim();

/**
 * Build the McpUiHostStyles object for MCP apps.
 *
 * For the built-in light/dark pair, color keys use light-dark() so a single
 * payload resolves correctly against the guest's color-scheme. Custom themes
 * (e.g. aura) share a variant with dark but carry their own palette and fonts,
 * so light-dark() can't express them — emit that theme's concrete token values
 * instead. Non-color keys always use the theme's own values so overrides like
 * Aura's monospace font family reach the guest.
 * css.fonts provides @font-face rules so sandboxed apps can load host fonts.
 */
export function buildMcpHostStyles(themeId: ThemeId = 'light'): McpUiHostStyles {
  const tokens = (getThemeDefinition(themeId) ?? themes.light).tokens;
  const isBuiltinVariant = themeId === 'light' || themeId === 'dark';
  const variables: McpUiStyles = {} as McpUiStyles;
  for (const key of Object.keys(lightTokens) as McpUiStyleVariableKey[]) {
    if (key.startsWith('--color-') && isBuiltinVariant) {
      variables[key] = `light-dark(${lightTokens[key]}, ${darkTokens[key]})`;
    } else {
      variables[key] = tokens[key];
    }
  }
  return { variables, css: { fonts: HOST_FONT_CSS } };
}

/**
 * Resolve the current theme id from localStorage / system preference.
 * Best-effort pre-paint resolution; the authoritative preference lives in the
 * Electron settings store and is applied by ThemeContext once loaded.
 */
export function getResolvedTheme(): ThemeId {
  registerCachedThemePack();
  const stored = localStorage.getItem('theme');
  const savedTheme = isThemeId(stored) ? stored : 'light';
  const useSystem = localStorage.getItem('use_system_theme') !== 'false';
  if (useSystem) {
    return resolveSystemTheme(
      savedTheme,
      window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
    );
  }
  return savedTheme;
}

/**
 * Apply a theme's tokens to the document root as CSS custom properties.
 * When called without an argument, resolves the theme from localStorage.
 */
export function applyThemeTokens(theme?: ThemeId): void {
  const resolved = theme ?? getResolvedTheme();
  const { tokens, components } = getThemeDefinition(resolved) ?? themes.light;
  const root = document.documentElement;
  for (const [key, value] of Object.entries(tokens)) {
    root.style.setProperty(key, value);
  }
  for (const key of Object.keys(chatComponentKeys) as ChatComponentKey[]) {
    const value = components[key];
    if (value) root.style.setProperty(key, value);
    else root.style.removeProperty(key);
  }
  if (Object.keys(components).length > 0) root.dataset.chatSkin = '';
  else delete root.dataset.chatSkin;
}
