export type ThemeVariant = 'light' | 'dark';

export const THEME_PACK_SCHEMA_VERSION = 1;
export const MAX_THEME_PACK_BYTES = 256 * 1024;

type ValueKind = 'color' | 'length' | 'spacing' | 'shadow' | 'font' | 'weight' | 'composerHeight';

export const chatComponentKeys = {
  '--brand-accent': 'color',
  '--brand-accent-soft': 'color',
  '--brand-secondary': 'color',
  '--nav-bg': 'color',
  '--nav-text': 'color',
  '--nav-active-bg': 'color',
  '--nav-active-text': 'color',
  '--nav-active-indicator': 'color',
  '--chat-user-bubble-bg': 'color',
  '--chat-user-bubble-text': 'color',
  '--chat-user-bubble-radius': 'spacing',
  '--chat-agent-bubble-bg': 'color',
  '--chat-agent-bubble-border': 'color',
  '--chat-agent-bubble-radius': 'spacing',
  '--chat-agent-bubble-padding': 'spacing',
  '--chat-tool-card-bg': 'color',
  '--chat-tool-card-border': 'color',
  '--chat-tool-card-radius': 'spacing',
  '--chat-composer-bg': 'color',
  '--chat-composer-border': 'color',
  '--chat-composer-radius': 'spacing',
  '--chat-composer-shadow': 'shadow',
  '--chat-composer-min-height': 'composerHeight',
} as const satisfies Record<string, ValueKind>;

export type ChatComponentKey = keyof typeof chatComponentKeys;
export type ChatComponentTokens = Partial<Record<ChatComponentKey, string>>;

export interface ThemePackVariant {
  tokens: Partial<Record<string, string>>;
  components: ChatComponentTokens;
}

export interface ThemePack {
  schemaVersion: typeof THEME_PACK_SCHEMA_VERSION;
  id: string;
  name: string;
  version: string;
  author?: string;
  description?: string;
  accent: string;
  variants: Partial<Record<ThemeVariant, ThemePackVariant>>;
}

export type ThemePackParseResult = { ok: true; pack: ThemePack } | { ok: false; error: string };

export type ThemePackImportResult =
  | { status: 'imported'; pack: ThemePack }
  | { status: 'canceled' }
  | { status: 'invalid'; error: string };

const reservedPackIds = new Set(['light', 'dark', 'aura', 'civic', 'navy', 'forest', 'system']);
const packIdPattern = /^[a-z0-9][a-z0-9-]{1,47}$/;
const lengthPattern = /^(0|\d{1,4}(\.\d{1,3})?(px|rem|em|%))$/;
const colorPatterns = [
  /^#([0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})$/i,
  /^(rgb|rgba|hsl|hsla)\(\s*[\d.%\s,/-]+\)$/i,
  /^(transparent|currentcolor)$/i,
];

export function isThemePackId(value: unknown): value is string {
  return typeof value === 'string' && packIdPattern.test(value) && !reservedPackIds.has(value);
}

function isColor(value: string): boolean {
  return colorPatterns.some((pattern) => pattern.test(value));
}

// Values reach the DOM only through style.setProperty, but the allowlist also keeps
// packs from loading remote resources (url(), @import) or referencing host internals.
function isValidValue(kind: ValueKind, value: string): boolean {
  if (value.length > 200) return false;
  switch (kind) {
    case 'color':
      return isColor(value);
    case 'length':
      return lengthPattern.test(value);
    case 'spacing': {
      const parts = value.split(/\s+/);
      return parts.length <= 4 && parts.every((part) => lengthPattern.test(part));
    }
    case 'shadow':
      return (
        value === 'none' ||
        (/^[a-z0-9#(),.%\s-]+$/i.test(value) && !/url|var|expression|image/i.test(value))
      );
    case 'font':
      return /^[\p{L}\p{N}\s"',-]+$/u.test(value);
    case 'weight':
      return /^[1-9]00$/.test(value);
    case 'composerHeight': {
      const match = /^(\d{2,3})px$/.exec(value);
      return !!match && Number(match[1]) >= 38 && Number(match[1]) <= 240;
    }
  }
}

function tokenKind(key: string): ValueKind {
  if (key.startsWith('--color-')) return 'color';
  if (key.startsWith('--shadow-')) return 'shadow';
  if (key === '--font-sans' || key === '--font-mono') return 'font';
  if (key.startsWith('--font-weight-')) return 'weight';
  return 'length';
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function optionalText(value: unknown, field: string, max: number): string | undefined {
  if (value === undefined) return undefined;
  if (typeof value !== 'string' || value.length > max) {
    throw new Error(`"${field}" must be a string of at most ${max} characters`);
  }
  return value;
}

function rejectUnknownFields(record: Record<string, unknown>, allowed: string[], where: string) {
  const unknown = Object.keys(record).find((key) => !allowed.includes(key));
  if (unknown) throw new Error(`Unknown field "${unknown}" in ${where}`);
}

function parseValues<K extends string>(
  value: unknown,
  where: string,
  kindOf: (key: string) => ValueKind | undefined
): Partial<Record<K, string>> {
  if (value === undefined) return {};
  if (!isRecord(value)) throw new Error(`${where} must be an object`);
  const result: Partial<Record<K, string>> = {};
  for (const [key, raw] of Object.entries(value)) {
    const kind = kindOf(key);
    if (!kind) throw new Error(`Unsupported key "${key}" in ${where}`);
    if (typeof raw !== 'string' || !isValidValue(kind, raw.trim())) {
      throw new Error(`Invalid ${kind} value for "${key}" in ${where}`);
    }
    result[key as K] = raw.trim();
  }
  return result;
}

export function parseThemePack(
  input: unknown,
  allowedTokenKeys: ReadonlySet<string>,
  { builtin = false }: { builtin?: boolean } = {}
): ThemePackParseResult {
  try {
    if (!isRecord(input)) throw new Error('Theme pack must be a JSON object');
    rejectUnknownFields(
      input,
      [
        '$schema',
        'schemaVersion',
        'id',
        'name',
        'version',
        'author',
        'description',
        'accent',
        'variants',
      ],
      'theme pack'
    );
    if (input.schemaVersion !== THEME_PACK_SCHEMA_VERSION) {
      throw new Error(`"schemaVersion" must be ${THEME_PACK_SCHEMA_VERSION}`);
    }
    const id = input.id;
    const validId =
      typeof id === 'string' && (builtin ? packIdPattern.test(id) : isThemePackId(id));
    if (!validId) {
      throw new Error(
        '"id" must be 2-48 lowercase letters, digits or hyphens and not a built-in name'
      );
    }
    const name = optionalText(input.name, 'name', 40);
    if (!name?.trim()) throw new Error('"name" is required');
    const version = optionalText(input.version, 'version', 20) ?? '1.0.0';
    if (!/^[\w.+-]+$/.test(version))
      throw new Error('"version" may only contain letters, digits, . + -');
    if (typeof input.accent !== 'string' || !isColor(input.accent)) {
      throw new Error('"accent" must be a color');
    }
    if (!isRecord(input.variants)) throw new Error('"variants" must be an object');
    rejectUnknownFields(input.variants, ['light', 'dark'], 'variants');

    const variants: ThemePack['variants'] = {};
    for (const variant of ['light', 'dark'] as const) {
      const raw = input.variants[variant];
      if (raw === undefined) continue;
      if (!isRecord(raw)) throw new Error(`variants.${variant} must be an object`);
      rejectUnknownFields(raw, ['tokens', 'components'], `variants.${variant}`);
      variants[variant] = {
        tokens: parseValues<string>(raw.tokens, `variants.${variant}.tokens`, (key) =>
          allowedTokenKeys.has(key) ? tokenKind(key) : undefined
        ),
        components: parseValues<ChatComponentKey>(
          raw.components,
          `variants.${variant}.components`,
          (key) =>
            Object.hasOwn(chatComponentKeys, key)
              ? chatComponentKeys[key as ChatComponentKey]
              : undefined
        ),
      };
    }
    if (!variants.light && !variants.dark) {
      throw new Error('At least one of variants.light or variants.dark is required');
    }

    return {
      ok: true,
      pack: {
        schemaVersion: THEME_PACK_SCHEMA_VERSION,
        id,
        name: name.trim(),
        version,
        author: optionalText(input.author, 'author', 120),
        description: optionalText(input.description, 'description', 120),
        accent: input.accent,
        variants,
      },
    };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : String(error) };
  }
}
