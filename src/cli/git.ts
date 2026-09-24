import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);

export async function gitUserName(cwd: string): Promise<string | null> {
  try {
    const { stdout } = await execFileAsync('git', ['config', 'user.name'], { cwd });
    return stdout.trim() || null;
  } catch {
    return null;
  }
}

export function toActorName(raw: string | null): string {
  const cleaned = (raw ?? '')
    .replace(/[:·\n\r]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 64)
    .trim();
  return cleaned || 'human';
}
