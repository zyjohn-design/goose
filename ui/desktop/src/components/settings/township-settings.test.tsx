import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import { IntlTestWrapper } from '../../i18n/test-utils';
import { ThemeProvider } from '../../contexts/ThemeContext';
import { defaultSettings } from '../../utils/settings';
import { ThemeCenter } from './ThemeCenter';
import TownshipAccountMenu from './TownshipAccountMenu';

function renderSettings(children: React.ReactNode) {
  return render(
    <IntlTestWrapper>
      <MemoryRouter>
        <ThemeProvider>{children}</ThemeProvider>
      </MemoryRouter>
    </IntlTestWrapper>
  );
}

beforeEach(() => {
  localStorage.clear();
  vi.clearAllMocks();
  vi.mocked(window.electron.getSetting).mockImplementation(async (key) => defaultSettings[key]);
  vi.mocked(window.electron.setSetting).mockResolvedValue(undefined);
  window.electron.broadcastThemeChange = vi.fn();
  window.matchMedia = vi
    .fn()
    .mockReturnValue({ matches: false, addEventListener: vi.fn(), removeEventListener: vi.fn() });
});

describe('township theme and account settings', () => {
  it('applies and persists a palette, then follows the system without losing it', async () => {
    const user = userEvent.setup();
    renderSettings(<ThemeCenter />);
    await waitFor(() => expect(window.electron.getSetting).toHaveBeenCalledWith('theme'));
    await user.click(screen.getByRole('button', { name: 'Dark · 深蓝政务' }));
    await waitFor(() => expect(document.documentElement.dataset.theme).toBe('navy-dark'));
    expect(window.electron.setSetting).toHaveBeenCalledWith('theme', 'navy-dark');
    expect(localStorage.getItem('theme')).toBe('navy-dark');
    await user.click(
      screen.getByRole('button', { name: 'Follow system with the current palette' })
    );
    await waitFor(() => expect(document.documentElement.dataset.theme).toBe('navy-light'));
    expect(window.electron.setSetting).toHaveBeenCalledWith('useSystemTheme', true);
    expect(window.electron.broadcastThemeChange).toHaveBeenLastCalledWith({
      mode: 'light',
      useSystemTheme: true,
      theme: 'navy-light',
    });
  });

  it('opens the account popup, edits local profile data and returns focus when closed', async () => {
    const user = userEvent.setup();
    renderSettings(<TownshipAccountMenu />);
    const trigger = screen.getByRole('button', { name: 'Account and settings' });
    await user.click(trigger);
    expect(await screen.findByText('Local profile · Not signed in')).toBeInTheDocument();
    await user.click(await screen.findByRole('menuitem', { name: 'Personal profile' }));
    const name = await screen.findByLabelText('Display name');
    await user.clear(name);
    await user.type(name, '李主任');
    await user.click(screen.getByRole('button', { name: 'Save profile' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(window.electron.setSetting).toHaveBeenCalledWith('townshipProfile', {
      ...defaultSettings.townshipProfile,
      displayName: '李主任',
    });
    expect(screen.getByRole('button', { name: 'Account and settings' })).toHaveTextContent(
      '李主任'
    );
    await waitFor(() => expect(trigger).toHaveFocus());
  });

  it('keeps the profile form open and shows an error if saving fails', async () => {
    const user = userEvent.setup();
    renderSettings(<TownshipAccountMenu />);
    await user.click(screen.getByRole('button', { name: 'Account and settings' }));
    await user.click(await screen.findByRole('menuitem', { name: 'Personal profile' }));
    await screen.findByLabelText('Display name');
    vi.mocked(window.electron.setSetting).mockRejectedValueOnce(new Error('write failed'));
    await user.click(screen.getByRole('button', { name: 'Save profile' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Could not save the profile');
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });
});
