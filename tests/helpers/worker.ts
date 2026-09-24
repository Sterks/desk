import { loadBoard } from '../../src/core/board-loader.js';
import { addNote, createTask } from '../../src/core/task-store.js';

const [op, root, n] = process.argv.slice(2);
if (!op || !root || !n) throw new Error('usage: worker.ts <create|note> <root> <n>');

const board = await loadBoard(root);
if (op === 'create') {
  await createTask(root, board, { title: `Задача ${n}` }, `worker-${n}`);
} else if (op === 'note') {
  await addNote(root, board, 'T-001', `заметка ${n}`, `worker-${n}`);
} else {
  throw new Error(`неизвестная операция ${op}`);
}
