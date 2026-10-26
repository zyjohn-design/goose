import { Check, Download, Monitor, Moon, Sun, Trash2, Upload } from 'lucide-react';
import { useState, type RefObject } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import {
  getThemeDefinition,
  themes,
  townshipThemeFamilies,
  type ThemeId,
  type ThemeVariant,
} from '../../theme/theme-tokens';
import { themePackTemplate } from '../../theme/theme-pack-template';
import { defineMessages, useIntl } from '../../i18n';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../ui/dialog';

const messages = defineMessages({
  title: { id: 'township.themes.title', defaultMessage: 'Theme center' },
  description: {
    id: 'township.themes.description',
    defaultMessage:
      'Three civic palettes, each with light and dark appearances. Changes are saved automatically.',
  },
  light: { id: 'township.themes.light', defaultMessage: 'Light' },
  dark: { id: 'township.themes.dark', defaultMessage: 'Dark' },
  system: {
    id: 'township.themes.system',
    defaultMessage: 'Follow system with the current palette',
  },
  active: { id: 'township.themes.active', defaultMessage: 'In use' },
  original: { id: 'township.themes.original', defaultMessage: 'Original Goose themes' },
  imported: { id: 'township.themes.imported', defaultMessage: 'Imported theme packs' },
  importPack: { id: 'township.themes.importPack', defaultMessage: 'Import theme pack' },
  downloadTemplate: {
    id: 'township.themes.downloadTemplate',
    defaultMessage: 'Download pack template',
  },
  removePack: { id: 'township.themes.removePack', defaultMessage: 'Remove {name}' },
  noPacks: {
    id: 'township.themes.noPacks',
    defaultMessage:
      'No imported packs yet. Packs are JSON files that set colors and chat component styles.',
  },
  importedNotice: { id: 'township.themes.importedNotice', defaultMessage: 'Imported {name}' },
  invalidPack: { id: 'township.themes.invalidPack', defaultMessage: 'Could not import: {error}' },
  packMeta: { id: 'township.themes.packMeta', defaultMessage: 'v{version} · {author}' },
});

function ThemePreview({ themeId }: { themeId: ThemeId }) {
  const { tokens, components } = getThemeDefinition(themeId) ?? themes.light;
  return (
    <div
      aria-hidden="true"
      className="flex h-24 overflow-hidden rounded-md border"
      style={{
        background: tokens['--color-background-secondary'],
        borderColor: tokens['--color-border-primary'],
      }}
    >
      <div
        className="w-1/4 space-y-2 p-2"
        style={{ background: tokens['--color-background-primary'] }}
      >
        {[1, 2, 3].map((line) => (
          <div
            key={line}
            className="h-1.5 rounded"
            style={{
              background:
                line === 1
                  ? tokens['--color-background-inverse']
                  : tokens['--color-border-primary'],
            }}
          />
        ))}
      </div>
      <div className="flex-1 space-y-2 p-3">
        <div className="h-2 w-2/3 rounded" style={{ background: tokens['--color-text-primary'] }} />
        <div className="flex justify-end">
          <div
            className="h-3 w-1/3"
            style={{
              background: components['--chat-user-bubble-bg'] ?? tokens['--color-text-primary'],
              borderRadius: components['--chat-user-bubble-radius'] ?? '6px',
            }}
          />
        </div>
        <div
          className="h-7 border"
          style={{
            background: components['--chat-composer-bg'] ?? tokens['--color-background-primary'],
            borderColor: components['--chat-composer-border'] ?? tokens['--color-border-primary'],
            borderRadius: components['--chat-composer-radius'] ?? '6px',
          }}
        />
      </div>
    </div>
  );
}

function VariantButton({
  themeId,
  variant,
  familyName,
  accent,
}: {
  themeId: ThemeId;
  variant: ThemeVariant;
  familyName: string;
  accent: string;
}) {
  const intl = useIntl();
  const { resolvedThemeId, setUserThemePreference } = useTheme();
  return (
    <button
      type="button"
      aria-label={`${intl.formatMessage(messages[variant])} · ${familyName}`}
      aria-pressed={resolvedThemeId === themeId}
      onClick={() => setUserThemePreference(themeId)}
      className="w-full rounded-lg border-2 p-2 text-left outline-offset-2 focus-visible:outline-2 focus-visible:outline-ring-primary"
      style={{ borderColor: resolvedThemeId === themeId ? accent : 'transparent' }}
    >
      <ThemePreview themeId={themeId} />
      <span className="mt-2 flex items-center gap-2 text-sm">
        {variant === 'light' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        {intl.formatMessage(messages[variant])}
        <span className="sr-only"> · {familyName}</span>
      </span>
    </button>
  );
}

function downloadTemplate() {
  const blob = new Blob([JSON.stringify(themePackTemplate, null, 2)], {
    type: 'application/json',
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${themePackTemplate.id}.json`;
  link.click();
  URL.revokeObjectURL(url);
}

function ImportedThemePacks() {
  const intl = useIntl();
  const { themePacks, importThemePack, removeThemePack, resolvedThemeId } = useTheme();
  const [notice, setNotice] = useState<string | null>(null);

  const onImport = async () => {
    const result = await importThemePack();
    if (result.status === 'imported') {
      setNotice(intl.formatMessage(messages.importedNotice, { name: result.pack.name }));
    } else if (result.status === 'invalid') {
      setNotice(intl.formatMessage(messages.invalidPack, { error: result.error }));
    }
  };

  return (
    <section className="space-y-3 border-t border-border-primary pt-4">
      <div className="flex flex-wrap items-center gap-2">
        <h3 className="mr-auto font-semibold">{intl.formatMessage(messages.imported)}</h3>
        <button
          type="button"
          onClick={downloadTemplate}
          className="flex items-center gap-2 rounded-md border border-border-primary px-3 py-2 text-sm hover:bg-background-secondary"
        >
          <Download className="h-4 w-4" />
          {intl.formatMessage(messages.downloadTemplate)}
        </button>
        <button
          type="button"
          onClick={onImport}
          className="flex items-center gap-2 rounded-md bg-background-inverse px-3 py-2 text-sm text-text-inverse hover:opacity-90"
        >
          <Upload className="h-4 w-4" />
          {intl.formatMessage(messages.importPack)}
        </button>
      </div>
      {notice && (
        <p role="status" className="text-sm text-text-secondary">
          {notice}
        </p>
      )}
      {themePacks.length === 0 ? (
        <p className="text-sm text-text-secondary">{intl.formatMessage(messages.noPacks)}</p>
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          {themePacks.map((pack) => (
            <section
              key={pack.id}
              className="rounded-lg border border-border-primary bg-background-primary p-4"
            >
              <div className="mb-3 flex items-start gap-2">
                <div className="mr-auto min-w-0">
                  <h4 className="truncate font-semibold">{pack.name}</h4>
                  <p className="truncate text-xs text-text-secondary">
                    {intl.formatMessage(messages.packMeta, {
                      version: pack.version,
                      author: pack.author ?? pack.id,
                    })}
                  </p>
                </div>
                {resolvedThemeId.startsWith(`${pack.id}-`) && (
                  <Check className="h-4 w-4" aria-label={intl.formatMessage(messages.active)} />
                )}
                <button
                  type="button"
                  aria-label={intl.formatMessage(messages.removePack, { name: pack.name })}
                  onClick={() => removeThemePack(pack.id)}
                  className="rounded p-1 text-text-secondary hover:bg-background-secondary hover:text-text-danger"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
              <div className="space-y-3">
                {(['light', 'dark'] as const)
                  .filter((variant) => pack.variants[variant])
                  .map((variant) => (
                    <VariantButton
                      key={variant}
                      themeId={`${pack.id}-${variant}`}
                      variant={variant}
                      familyName={pack.name}
                      accent={pack.accent}
                    />
                  ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </section>
  );
}

export function ThemeCenter() {
  const intl = useIntl();
  const { resolvedThemeId, userThemePreference, setUserThemePreference } = useTheme();
  const variants: ThemeVariant[] = ['light', 'dark'];
  return (
    <div className="space-y-6 text-text-primary">
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {townshipThemeFamilies.map((family) => (
          <section
            key={family.id}
            className="rounded-lg border border-border-primary bg-background-primary p-4"
          >
            <div className="mb-3 flex items-center justify-between gap-2">
              <h3 className="font-semibold">{family.name}</h3>
              {resolvedThemeId.startsWith(`${family.id}-`) && (
                <Check className="h-4 w-4" aria-label={intl.formatMessage(messages.active)} />
              )}
            </div>
            <div className="space-y-3">
              {variants.map((variant) => (
                <VariantButton
                  key={variant}
                  themeId={`${family.id}-${variant}`}
                  variant={variant}
                  familyName={family.name}
                  accent={family.accent}
                />
              ))}
            </div>
          </section>
        ))}
      </div>
      <ImportedThemePacks />
      <button
        type="button"
        aria-pressed={userThemePreference === 'system'}
        onClick={() => setUserThemePreference('system')}
        className="flex items-center gap-2 rounded-md border border-border-primary px-4 py-3 text-sm hover:bg-background-secondary focus-visible:outline-2 focus-visible:outline-ring-primary"
      >
        <Monitor className="h-4 w-4" />
        {intl.formatMessage(messages.system)}
        {userThemePreference === 'system' && <Check className="h-4 w-4" />}
      </button>
      <div className="flex flex-wrap items-center gap-2 border-t border-border-primary pt-4 text-sm">
        <span className="mr-2 text-text-secondary">{intl.formatMessage(messages.original)}</span>
        {(['light', 'dark', 'aura'] as const).map((id) => (
          <button
            type="button"
            key={id}
            aria-pressed={resolvedThemeId === id}
            onClick={() => setUserThemePreference(id)}
            className="rounded border border-border-primary px-3 py-2 hover:bg-background-secondary"
          >
            {id === 'aura' ? 'Aura' : intl.formatMessage(messages[id])}
          </button>
        ))}
      </div>
    </div>
  );
}

export function ThemeCenterDialog({
  open,
  onOpenChange,
  returnFocusRef,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  returnFocusRef?: RefObject<HTMLButtonElement | null>;
}) {
  const intl = useIntl();
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-h-[85vh] overflow-y-auto border-border-primary sm:max-w-4xl"
        onCloseAutoFocus={(event) => {
          if (returnFocusRef?.current) {
            event.preventDefault();
            returnFocusRef.current.focus();
          }
        }}
      >
        <DialogHeader>
          <DialogTitle>{intl.formatMessage(messages.title)}</DialogTitle>
          <DialogDescription>{intl.formatMessage(messages.description)}</DialogDescription>
        </DialogHeader>
        <ThemeCenter />
      </DialogContent>
    </Dialog>
  );
}
