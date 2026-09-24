import {join} from 'node:path';
import {describe,expect,it} from 'vitest';
import {createFileDeskRepository} from '../../src/core/repository.js';
import {createWorkspaceContext} from '../../src/core/workspace.js';
import {makeProject} from '../helpers/project.js';

describe('FileDeskRepository',()=>{
  it('keeps board/project/tasks under one workspace root',async()=>{const root=await makeProject();const repo=createFileDeskRepository(await createWorkspaceContext(root,'agent'));const board=await repo.loadBoard();const project=await repo.loadProject();expect(board.name).toBe('test');expect(project.tenantId).toBe('local');expect(await repo.loadTasks(board)).toEqual([]);expect(repo.taskPath('T-001')).toBe(join(root,'.desk','tasks','T-001.md'));expect(repo.lockPath()).toBe(join(root,'.desk','.lock'));});
  it('does not expose paths outside workspace',async()=>{const root=await makeProject();const repo=createFileDeskRepository(await createWorkspaceContext(root,'agent'));expect(()=>repo.taskPath('../../../outside')).toThrow(/за пределы проекта/);});
});
