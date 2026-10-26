import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useMemo,
  useRef,
} from 'react';
import {
  applyThemeTokens,
  buildMcpHostStyles,
  cacheActiveThemePack,
  getThemeDefinition,
  isThemeId,
  registerThemePacks,
  resolveSystemTheme,
  themeFamilyId,
  themes,
} from '../theme/theme-tokens';
import type { ThemeId, ThemeVariant } from '../theme/theme-tokens';
import type { ThemePack, ThemePackImportResult } from '../theme/theme-pack';
import type { McpUiHostStyles } from '@modelcontextprotocol/ext-apps/app-bridge';

type ThemePreference = ThemeId | 'system';
type ResolvedTheme = ThemeVariant;

interface ThemeContextValue {
  userThemePreference: ThemePreference;
  setUserThemePreference: (pref: ThemePreference) => void;
  resolvedThemeId: ThemeId;
  resolvedTheme: ResolvedTheme;
  mcpHostStyles: McpUiHostStyles;
  themePacks: ThemePack[];
  importThemePack: () => Promise<ThemePackImportResult>;
  removeThemePack: (id: string) => Promise<void>;
}

function variantOf(themeId: ThemeId): ThemeVariant {
  return (getThemeDefinition(themeId) ?? themes.light).variant;
}

async function loadThemePacks(): Promise<ThemePack[]> {
  const packs = (await window.electron.listThemePacks?.()) ?? [];
  registerThemePacks(packs);
  return packs;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

function getSystemTheme(): ResolvedTheme {
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

// System appearance preserves a selected township palette across light/dark changes.
function resolveThemeId(preference: ThemePreference, savedTheme: ThemeId): ThemeId {
  if (preference === 'system') {
    return resolveSystemTheme(savedTheme, getSystemTheme());
  }
  return preference;
}

function applyThemeToDocument(theme: ResolvedTheme): void {
  const toRemove = theme === 'dark' ? 'light' : 'dark';
  document.documentElement.classList.add(theme);
  document.documentElement.classList.remove(toRemove);
  document.documentElement.style.colorScheme = theme;
}

interface ThemeProviderProps {
  children: React.ReactNode;
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  const savedThemeRef = useRef<ThemeId>('light');
  // Start with light theme to avoid flash, will update once settings load
  const [userThemePreference, setUserThemePreferenceState] = useState<ThemePreference>('light');
  const [resolvedThemeId, setResolvedThemeId] = useState<ThemeId>('light');
  const [themePacks, setThemePacks] = useState<ThemePack[]>([]);
  const resolvedTheme = variantOf(resolvedThemeId);
  const mcpHostStyles = useMemo(
    () => buildMcpHostStyles(resolvedThemeId),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- pack edits change tokens under the same id
    [resolvedThemeId, themePacks]
  );

  useEffect(() => {
    async function loadThemeFromSettings() {
      try {
        const [useSystemTheme, savedTheme, packs] = await Promise.all([
          window.electron.getSetting('useSystemTheme'),
          window.electron.getSetting('theme'),
          loadThemePacks().catch(() => []),
        ]);
        setThemePacks(packs);

        savedThemeRef.current = isThemeId(savedTheme) ? savedTheme : 'light';
        const preference: ThemePreference = useSystemTheme ? 'system' : savedThemeRef.current;
        localStorage.setItem('theme', savedThemeRef.current);
        localStorage.setItem('use_system_theme', String(!!useSystemTheme));

        setUserThemePreferenceState(preference);
        setResolvedThemeId(resolveThemeId(preference, savedThemeRef.current));
      } catch (error) {
        console.warn('[ThemeContext] Failed to load theme settings:', error);
      }
    }

    loadThemeFromSettings();
  }, []);

  const setUserThemePreference = useCallback(async (preference: ThemePreference) => {
    if (preference !== 'system') savedThemeRef.current = preference;
    setUserThemePreferenceState(preference);

    const resolvedId = resolveThemeId(preference, savedThemeRef.current);
    setResolvedThemeId(resolvedId);

    // Save to settings
    try {
      if (preference === 'system') {
        await window.electron.setSetting('useSystemTheme', true);
      } else {
        await window.electron.setSetting('useSystemTheme', false);
        await window.electron.setSetting('theme', preference);
      }
    } catch (error) {
      console.warn('[ThemeContext] Failed to save theme settings:', error);
    }

    localStorage.setItem('theme', savedThemeRef.current);
    localStorage.setItem('use_system_theme', String(preference === 'system'));

    // Broadcast to other windows via Electron
    window.electron?.broadcastThemeChange({
      mode: variantOf(resolvedId),
      useSystemTheme: preference === 'system',
      theme: resolvedId,
    });
  }, []);

  // Listen for system theme changes when preference is 'system'
  useEffect(() => {
    if (userThemePreference !== 'system') return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    const handleChange = () => {
      setResolvedThemeId(resolveSystemTheme(savedThemeRef.current, getSystemTheme()));
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [userThemePreference]);

  // Listen for theme changes from other windows (via Electron IPC)
  useEffect(() => {
    if (!window.electron) return;

    const handleThemeChanged = (_event: unknown, ...args: unknown[]) => {
      const themeData = args[0] as {
        useSystemTheme: boolean;
        theme: ThemeId;
        tokensUpdated?: boolean;
      };
      if (themeData.tokensUpdated) {
        loadThemePacks()
          .then(setThemePacks)
          .catch(() => undefined);
        return;
      }
      if (!isThemeId(themeData.theme)) return;
      savedThemeRef.current = themeData.theme;
      const newPreference: ThemePreference = themeData.useSystemTheme ? 'system' : themeData.theme;

      setUserThemePreferenceState(newPreference);
      setResolvedThemeId(resolveThemeId(newPreference, savedThemeRef.current));
      localStorage.setItem('theme', savedThemeRef.current);
      localStorage.setItem('use_system_theme', String(themeData.useSystemTheme));

      // Save to settings (don't await, fire and forget)
      if (newPreference === 'system') {
        window.electron.setSetting('useSystemTheme', true);
      } else {
        window.electron.setSetting('useSystemTheme', false);
        window.electron.setSetting('theme', newPreference);
      }
    };

    window.electron.on('theme-changed', handleThemeChanged);
    return () => {
      window.electron.off('theme-changed', handleThemeChanged);
    };
  }, []);

  // Apply theme class and CSS tokens whenever the resolved theme changes
  useEffect(() => {
    applyThemeToDocument(variantOf(resolvedThemeId));
    applyThemeTokens(resolvedThemeId);
    document.documentElement.dataset.theme = resolvedThemeId;
    const family = themeFamilyId(resolvedThemeId);
    cacheActiveThemePack(themePacks.find((pack) => pack.id === family));
  }, [resolvedThemeId, themePacks]);

  const importThemePack = useCallback(async () => {
    const result = await window.electron.importThemePack();
    if (result.status !== 'imported') return result;
    const packs = await loadThemePacks();
    setThemePacks(packs);
    window.electron.broadcastThemeChange({
      mode: variantOf(resolvedThemeId),
      useSystemTheme: userThemePreference === 'system',
      theme: resolvedThemeId,
      tokensUpdated: true,
    });
    return result;
  }, [resolvedThemeId, userThemePreference]);

  const removeThemePack = useCallback(
    async (id: string) => {
      await window.electron.removeThemePack(id);
      const packs = await loadThemePacks();
      setThemePacks(packs);
      if (themeFamilyId(savedThemeRef.current) === id) {
        await setUserThemePreference(variantOf(resolvedThemeId));
      } else {
        setResolvedThemeId((current) => (isThemeId(current) ? current : 'light'));
      }
      window.electron.broadcastThemeChange({
        mode: variantOf(resolvedThemeId),
        useSystemTheme: userThemePreference === 'system',
        theme: resolvedThemeId,
        tokensUpdated: true,
      });
    },
    [resolvedThemeId, setUserThemePreference, userThemePreference]
  );

  const value: ThemeContextValue = {
    userThemePreference,
    setUserThemePreference,
    resolvedThemeId,
    resolvedTheme,
    mcpHostStyles,
    themePacks,
    importThemePack,
    removeThemePack,
  };

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
