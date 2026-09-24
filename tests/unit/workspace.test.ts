import {mkdir,writeFile} from 'node:fs/promises';
import {join} from 'node:path';
import {describe,expect,it} from 'vitest';
import {DeskError} from '../../src/core/errors.js';
import {assertWorkspacePath,createWorkspaceContext,loadWorkspace,requireWorkspace} from '../../src/core/workspace.js';
import {catchError} from '../helpers/errors.js';
import {makeProject} from '../helpers/project.js';

describe('workspace context',()=>{
  it('resolves tenant/project and canonical root',async()=>{const root=await makeProject();const context=await createWorkspaceContext(root,'agent');expect(context).toMatchObject({tenantId:'local',actor:'agent',root});expect(context.projectId).toBeTruthy();});
  it('accepts paths inside project and rejects paths outside',async()=>{const root=await makeProject();const context=await createWorkspaceContext(root,'agent');expect(assertWorkspacePath(context,join(root,'.desk','board.yaml'))).toBe(join(root,'.desk','board.yaml'));expect(()=>assertWorkspacePath(context,join(root,'..','other'))).toThrow(/за пределы проекта/);});
});

describe('loadWorkspace',()=>{
  it('возвращает workspace для валидного (в т.ч. legacy) проекта',async()=>{
    const root=await makeProject();
    const result=await loadWorkspace(root,'agent');
    expect(result.workspace).toMatchObject({tenantId:'local',actor:'agent'});
    expect(result.error).toBeUndefined();
  });

  it('ловит DeskError сломанного project.yaml вместо того чтобы бросать наружу',async()=>{
    const root=await makeProject();
    await mkdir(join(root,'.desk'),{recursive:true});
    await writeFile(join(root,'.desk','project.yaml'),'version: 1\ntenant_id: [\n');
    const result=await loadWorkspace(root,'agent');
    expect(result.workspace).toBeUndefined();
    expect(result.error).toBeInstanceOf(DeskError);
    expect(result.error?.code).toBe('INVALID_BOARD');
  });

  it('ловит нарушение схемы (нет tenant_id)',async()=>{
    const root=await makeProject();
    await mkdir(join(root,'.desk'),{recursive:true});
    await writeFile(join(root,'.desk','project.yaml'),'version: 1\nproject_id: demo\n');
    const result=await loadWorkspace(root,'agent');
    expect(result.workspace).toBeUndefined();
    expect(result.error?.code).toBe('INVALID_BOARD');
  });
});

describe('requireWorkspace',()=>{
  it('возвращает workspace, если он есть',async()=>{
    const root=await makeProject();
    const workspace=await createWorkspaceContext(root,'agent');
    expect(requireWorkspace(workspace,undefined)).toBe(workspace);
  });

  it('бросает запомненную ошибку, если workspace нет, а ошибка есть',()=>{
    const remembered=new DeskError('INVALID_BOARD','project.yaml: сломан');
    expect(catchError(()=>requireWorkspace(undefined,remembered))).toBe(remembered);
  });

  it('бросает свежую INVALID_BOARD про project.yaml, если нет ни workspace, ни ошибки',()=>{
    const err=catchError(()=>requireWorkspace(undefined,undefined));
    expect(err.code).toBe('INVALID_BOARD');
    expect(err.message).toContain('project.yaml');
  });
});
