import fs from 'node:fs/promises';
import path from 'node:path';
import { parseHostThemePack } from '../theme/theme-tokens';
import { isThemePackId, MAX_THEME_PACK_BYTES, type ThemePack } from '../theme/theme-pack';

export type ThemePackFileResult = { ok: true; pack: ThemePack } | { ok: false; error: string };

export async function readThemePackFile(filePath: string): Promise<ThemePackFileResult> {
  const stat = await fs.stat(filePath);
  if (!stat.isFile()) return { ok: false, error: 'Not a file' };
  if (stat.size > MAX_THEME_PACK_BYTES) {
    return { ok: false, error: `Theme pack exceeds ${MAX_THEME_PACK_BYTES / 1024} KB` };
  }
  try {
    return parseHostThemePack(JSON.parse(await fs.readFile(filePath, 'utf8')));
  } catch {
    return { ok: false, error: 'Theme pack is not valid JSON' };
  }
}

export async function listThemePacks(dir: string): Promise<ThemePack[]> {
  let names: string[];
  try {
    names = await fs.readdir(dir);
  } catch {
    return [];
  }
  const packs: ThemePack[] = [];
  for (const name of names.filter((n) => n.endsWith('.json')).sort()) {
    const result = await readThemePackFile(path.join(dir, name));
    if (result.ok && `${result.pack.id}.json` === name) packs.push(result.pack);
  }
  return packs;
}

export async function saveThemePack(dir: string, pack: ThemePack): Promise<void> {
  await fs.mkdir(dir, { recursive: true });
  const target = path.join(dir, `${pack.id}.json`);
  const temp = `${target}.${process.pid}.tmp`;
  await fs.writeFile(temp, JSON.stringify(pack, null, 2));
  await fs.rename(temp, target);
}

export async function removeThemePack(dir: string, id: string): Promise<boolean> {
  if (!isThemePackId(id)) return false;
  try {
    await fs.unlink(path.join(dir, `${id}.json`));
    return true;
  } catch {
    return false;
  }
}
