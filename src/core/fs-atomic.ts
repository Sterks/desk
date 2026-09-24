import { rename, writeFile } from 'node:fs/promises';

/** Пишет во временный файл и переименовывает: читатель видит либо старую, либо новую версию. Вызывать под withLock. */
export async function writeFileAtomic(path: string, content: string): Promise<void> {
  const tmp = `${path}.tmp`;
  await writeFile(tmp, content, 'utf8');
  await rename(tmp, path);
}
