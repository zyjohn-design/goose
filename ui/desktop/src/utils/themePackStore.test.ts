import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  listThemePacks,
  readThemePackFile,
  removeThemePack,
  saveThemePack,
} from './themePackStore';
import { themePackTemplate } from '../theme/theme-pack-template';

let dir: string;

beforeEach(async () => {
  dir = await fs.mkdtemp(path.join(os.tmpdir(), 'goose-theme-packs-'));
});

afterEach(async () => {
  await fs.rm(dir, { recursive: true, force: true });
});

describe('theme pack store', () => {
  it('saves, lists and removes packs by id', async () => {
    await saveThemePack(dir, themePackTemplate);
    await fs.writeFile(path.join(dir, 'renamed.json'), JSON.stringify(themePackTemplate));
    await fs.writeFile(path.join(dir, 'broken.json'), '{');
    expect(await listThemePacks(dir)).toEqual([themePackTemplate]);
    expect(await removeThemePack(dir, '../settings')).toBe(false);
    expect(await removeThemePack(dir, themePackTemplate.id)).toBe(true);
    expect(await listThemePacks(dir)).toEqual([]);
  });

  it('rejects oversized and malformed files', async () => {
    const big = path.join(dir, 'big.json');
    await fs.writeFile(big, ' '.repeat(300 * 1024));
    expect((await readThemePackFile(big)).ok).toBe(false);
    const bad = path.join(dir, 'bad.json');
    await fs.writeFile(bad, 'not json');
    expect(await readThemePackFile(bad)).toEqual({
      ok: false,
      error: 'Theme pack is not valid JSON',
    });
  });
});
