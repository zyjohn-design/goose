import { Check, Monitor, Moon, Sun } from 'lucide-react';
import type { RefObject } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import {
  themes,
  townshipThemeFamilies,
  type ThemeId,
  type ThemeVariant,
} from '../../theme/theme-tokens';
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
});

function ThemePreview({ themeId }: { themeId: ThemeId }) {
  const { tokens } = themes[themeId];
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
        <div
          className="h-7 rounded border"
          style={{
            background: tokens['--color-background-primary'],
            borderColor: tokens['--color-border-primary'],
          }}
        />
        <div className="flex gap-1">
          {[1, 2, 3].map((tile) => (
            <div
              key={tile}
              className="h-4 flex-1 rounded"
              style={{ background: tokens['--color-background-tertiary'] }}
            />
          ))}
        </div>
      </div>
    </div>
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
              {variants.map((variant) => {
                const themeId: ThemeId = `${family.id}-${variant}`;
                return (
                  <button
                    key={themeId}
                    type="button"
                    aria-label={`${intl.formatMessage(messages[variant])} · ${family.name}`}
                    aria-pressed={resolvedThemeId === themeId}
                    onClick={() => setUserThemePreference(themeId)}
                    className="w-full rounded-lg border-2 p-2 text-left outline-offset-2 focus-visible:outline-2 focus-visible:outline-ring-primary"
                    style={{
                      borderColor: resolvedThemeId === themeId ? family.accent : 'transparent',
                    }}
                  >
                    <ThemePreview themeId={themeId} />
                    <span className="mt-2 flex items-center gap-2 text-sm">
                      {variant === 'light' ? (
                        <Sun className="h-4 w-4" />
                      ) : (
                        <Moon className="h-4 w-4" />
                      )}
                      {intl.formatMessage(messages[variant])}
                      <span className="sr-only"> · {family.name}</span>
                    </span>
                  </button>
                );
              })}
            </div>
          </section>
        ))}
      </div>
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
