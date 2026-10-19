import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

const pkg = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));
const output = execFileSync('npm', ['pack', '--dry-run', '--json', '--ignore-scripts'], { encoding: 'utf8' });
const [archive] = JSON.parse(output);
if (archive.name !== pkg.name || archive.version !== pkg.version) {
  throw new Error('Имя или версия npm-архива не совпадают с package.json');
}

const files = new Map(archive.files.map((file) => [file.path, file]));
const required = ['README.md', 'package.json', 'dist/cli/index.js', 'dist/http/server.js', 'dist/ui/index.html'];
for (const path of required) {
  if (!files.has(path)) throw new Error(`В npm-архиве нет ${path}. Сначала выполни npm run build.`);
}
if (pkg.bin?.desk !== 'dist/cli/index.js' || !(files.get('dist/cli/index.js').mode & 0o111)) {
  throw new Error('Команда desk в npm-архиве не исполняемая');
}
for (const extension of ['.js', '.css']) {
  if (![...files.keys()].some((path) => path.startsWith('dist/ui/assets/') && path.endsWith(extension))) {
    throw new Error(`В npm-архиве нет UI-ресурса ${extension}`);
  }
}
const unexpected = [...files.keys()].filter(
  (path) => !path.startsWith('dist/') && !['README.md', 'LICENSE', 'package.json'].includes(path),
);
if (unexpected.length) throw new Error(`Лишние файлы в npm-архиве: ${unexpected.join(', ')}`);

console.log(`npm-архив ${archive.filename}: ${files.size} файлов, CLI и UI на месте`);
