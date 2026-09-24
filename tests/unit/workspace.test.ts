import {join} from 'node:path';
import {describe,expect,it} from 'vitest';
import {assertWorkspacePath,createWorkspaceContext} from '../../src/core/workspace.js';
import {makeProject} from '../helpers/project.js';

describe('workspace context',()=>{
  it('resolves tenant/project and canonical root',async()=>{const root=await makeProject();const context=await createWorkspaceContext(root,'agent');expect(context).toMatchObject({tenantId:'local',actor:'agent',root});expect(context.projectId).toBeTruthy();});
  it('accepts paths inside project and rejects paths outside',async()=>{const root=await makeProject();const context=await createWorkspaceContext(root,'agent');expect(assertWorkspacePath(context,join(root,'.desk','board.yaml'))).toBe(join(root,'.desk','board.yaml'));expect(()=>assertWorkspacePath(context,join(root,'..','other'))).toThrow(/за пределы проекта/);});
});
