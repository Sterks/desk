import {mkdir,writeFile} from 'node:fs/promises';
import {join} from 'node:path';
import {describe,expect,it} from 'vitest';
import {legacyProject,loadProject,parseProject,projectTemplate} from '../../src/core/project.js';
import {makeEmptyDir,makeProject} from '../helpers/project.js';

describe('project metadata',()=>{
  it('сохраняет project.yaml при init template generation',async()=>{
    const root=await makeEmptyDir();
    const parsed=parseProject(projectTemplate(root));
    expect(parsed).toMatchObject({tenantId:'local',legacy:false});
    expect(parsed.projectId).toMatch(/^desk-/);
  });
  it('legacy project fallback не требует project.yaml',async()=>{
    const root=await makeProject();
    await expect(loadProject(root)).resolves.toMatchObject({tenantId:'local',legacy:true});
    expect(legacyProject(root).projectId).toMatch(/^[a-z][a-z0-9_-]*$/);
  });
  it('читает и валидирует tenant/project metadata',async()=>{
    const root=await makeProject();
    await mkdir(join(root,'.desk'),{recursive:true});
    await writeFile(join(root,'.desk','project.yaml'),'version: 1\ntenant_id: acme\nproject_id: desk\nname: Desk\n');
    await expect(loadProject(root)).resolves.toMatchObject({tenantId:'acme',projectId:'desk',name:'Desk',legacy:false});
  });
  it('отклоняет неизвестные поля',()=>expect(()=>parseProject('version: 1\ntenant_id: acme\nproject_id: desk\nowner: x\n')).toThrow(/project\.yaml/));
});
