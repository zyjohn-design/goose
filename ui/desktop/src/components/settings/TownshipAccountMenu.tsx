import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router';
import { ChevronUp, Palette, Settings, UserRound, Bot, Puzzle } from 'lucide-react';
import { defineMessages, useIntl } from '../../i18n';
import { defaultSettings, type TownshipProfile } from '../../utils/settings';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../ui/dialog';
import { Button } from '../ui/button';
import { ThemeCenterDialog } from './ThemeCenter';

const messages = defineMessages({
  account: { id: 'township.account.title', defaultMessage: 'Account and settings' },
  profile: { id: 'township.account.profile', defaultMessage: 'Personal profile' },
  local: { id: 'township.account.local', defaultMessage: 'Local profile · Not signed in' },
  description: {
    id: 'township.account.description',
    defaultMessage:
      'This profile is stored on this device. Organization sign-in has not been connected.',
  },
  name: { id: 'township.account.name', defaultMessage: 'Display name' },
  department: { id: 'township.account.department', defaultMessage: 'Department' },
  organization: { id: 'township.account.organization', defaultMessage: 'Organization' },
  save: { id: 'township.account.save', defaultMessage: 'Save profile' },
  saveFailed: {
    id: 'township.account.saveFailed',
    defaultMessage: 'Could not save the profile. Please try again.',
  },
  loading: { id: 'township.account.loading', defaultMessage: 'Loading profile…' },
  loadFailed: {
    id: 'township.account.loadFailed',
    defaultMessage: 'Could not load the profile. Reopen the menu to try again.',
  },
  themes: { id: 'township.themes.title', defaultMessage: 'Theme center' },
  models: { id: 'township.account.models', defaultMessage: 'Model services' },
  connections: { id: 'township.account.connections', defaultMessage: 'Connections' },
  settings: { id: 'township.account.settings', defaultMessage: 'All settings' },
});

export default function TownshipAccountMenu() {
  const intl = useIntl();
  const navigate = useNavigate();
  const accountTriggerRef = useRef<HTMLButtonElement>(null);
  const [profile, setProfile] = useState<TownshipProfile>(defaultSettings.townshipProfile);
  const [draft, setDraft] = useState(profile);
  const [loaded, setLoaded] = useState(false);
  const [loadFailed, setLoadFailed] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [themesOpen, setThemesOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveFailed, setSaveFailed] = useState(false);

  useEffect(() => {
    let mounted = true;
    window.electron
      .getSetting('townshipProfile')
      .then((value) => {
        if (!mounted) return;
        const next =
          value &&
          typeof value.displayName === 'string' &&
          typeof value.department === 'string' &&
          typeof value.organization === 'string'
            ? value
            : defaultSettings.townshipProfile;
        setProfile(next);
        setLoaded(true);
        setLoadFailed(false);
      })
      .catch(() => {
        if (mounted) setLoadFailed(true);
      });
    return () => {
      mounted = false;
    };
  }, [menuOpen]);

  async function saveProfile(event: React.FormEvent) {
    event.preventDefault();
    const next = {
      displayName: draft.displayName.trim(),
      department: draft.department.trim(),
      organization: draft.organization.trim(),
    };
    if (!next.displayName) return;
    setSaving(true);
    setSaveFailed(false);
    try {
      await window.electron.setSetting('townshipProfile', next);
      setProfile(next);
      setProfileOpen(false);
    } catch {
      setSaveFailed(true);
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <DropdownMenu open={menuOpen} onOpenChange={setMenuOpen}>
        <DropdownMenuTrigger
          ref={accountTriggerRef}
          className="no-drag flex w-full items-center gap-3 rounded-lg p-3 text-left hover:bg-background-tertiary/60 focus-visible:outline-2 focus-visible:outline-ring-primary"
          aria-label={intl.formatMessage(messages.account)}
        >
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-background-inverse text-text-inverse">
            {Array.from(profile.displayName)[0] || <UserRound className="h-5 w-5" />}
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-medium text-text-primary">
              {profile.displayName}
            </span>
            <span className="block truncate text-xs text-text-secondary">{profile.department}</span>
          </span>
          <ChevronUp className="h-4 w-4 text-text-secondary" />
        </DropdownMenuTrigger>
        <DropdownMenuContent side="top" align="start" className="w-64">
          <div className="border-b border-border-primary px-3 py-3">
            <p className="font-medium">{profile.displayName}</p>
            <p className="mt-1 text-xs text-text-secondary">{intl.formatMessage(messages.local)}</p>
          </div>
          {loadFailed && (
            <p role="alert" className="px-3 py-2 text-xs text-text-danger">
              {intl.formatMessage(messages.loadFailed)}
            </p>
          )}
          <DropdownMenuItem
            disabled={!loaded}
            onSelect={() => {
              setDraft(profile);
              setSaveFailed(false);
              setProfileOpen(true);
            }}
          >
            <UserRound className="mr-2 h-4 w-4" />
            {intl.formatMessage(loaded ? messages.profile : messages.loading)}
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => setThemesOpen(true)}>
            <Palette className="mr-2 h-4 w-4" />
            {intl.formatMessage(messages.themes)}
          </DropdownMenuItem>
          <DropdownMenuItem
            onSelect={() => navigate('/settings', { state: { section: 'models' } })}
          >
            <Bot className="mr-2 h-4 w-4" />
            {intl.formatMessage(messages.models)}
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => navigate('/extensions')}>
            <Puzzle className="mr-2 h-4 w-4" />
            {intl.formatMessage(messages.connections)}
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => navigate('/settings')}>
            <Settings className="mr-2 h-4 w-4" />
            {intl.formatMessage(messages.settings)}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <ThemeCenterDialog
        open={themesOpen}
        onOpenChange={setThemesOpen}
        returnFocusRef={accountTriggerRef}
      />
      <Dialog open={profileOpen} onOpenChange={setProfileOpen}>
        <DialogContent
          className="border-border-primary"
          onCloseAutoFocus={(event) => {
            event.preventDefault();
            accountTriggerRef.current?.focus();
          }}
        >
          <DialogHeader>
            <DialogTitle>{intl.formatMessage(messages.profile)}</DialogTitle>
            <DialogDescription>{intl.formatMessage(messages.description)}</DialogDescription>
          </DialogHeader>
          <form onSubmit={saveProfile} className="space-y-4">
            {(['displayName', 'department', 'organization'] as const).map((field) => (
              <label key={field} className="block space-y-2 text-sm text-text-primary">
                <span>
                  {intl.formatMessage(messages[field === 'displayName' ? 'name' : field])}
                </span>
                <input
                  required={field === 'displayName'}
                  maxLength={80}
                  value={draft[field]}
                  onChange={(event) => setDraft({ ...draft, [field]: event.target.value })}
                  className="w-full rounded-md border border-border-primary bg-background-primary px-3 py-2 focus-visible:outline-2 focus-visible:outline-ring-primary"
                />
              </label>
            ))}
            {saveFailed && (
              <p role="alert" className="text-sm text-text-danger">
                {intl.formatMessage(messages.saveFailed)}
              </p>
            )}
            <Button type="submit" disabled={saving || !draft.displayName.trim()}>
              {intl.formatMessage(messages.save)}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
