import {mkdir,writeFile} from 'node:fs/promises';
import {join} from 'node:path';
import {afterEach,beforeEach,describe,expect,it,vi} from 'vitest';
import {startHttpServer,type RunningHttpServer} from '../../src/http/server.js';
import {taskPath} from '../../src/core/paths.js';
import {createWorkspaceContext} from '../../src/core/workspace.js';
import {makeEmptyDir,makeProject,fixedClock} from '../helpers/project.js';
import {openSse,rawRequest} from '../helpers/http.js';

let server:RunningHttpServer;let root:string;let staticDir:string;
beforeEach(async()=>{root=await makeProject();staticDir=join(await makeEmptyDir(),'ui');await mkdir(staticDir);await writeFile(join(staticDir,'index.html'),'<!doctype html><title>desk</title>');server=await startHttpServer({cwd:root,env:{},port:0,staticDir,actor:'http-test',clock:fixedClock()});await server.ready;});
afterEach(async()=>server.close());
const api=(r:Parameters<typeof rawRequest>[1])=>rawRequest(server.port,r);

describe('HTTP API',()=>{
  it('полный CRUD, move и notes',async()=>{expect((await api({path:'/api/board'})).status).toBe(200);const created=await api({method:'POST',path:'/api/tasks',body:{title:'HTTP task',fields:{priority:'p1'}}});expect(created.json()).toMatchObject({ok:true,data:{id:'T-001'}});expect((await api({method:'PATCH',path:'/api/tasks/T-001',body:{title:'Updated'}})).json()).toMatchObject({data:{title:'Updated'}});expect((await api({method:'POST',path:'/api/tasks/T-001/move',body:{to:'in_progress',fields:{assignee:'http-test'}}})).json()).toMatchObject({data:{column:'in_progress'}});expect((await api({method:'POST',path:'/api/tasks/T-001/notes',body:{text:'note'}})).json()).toMatchObject({data:{notes:[{text:'note'}]}});});
  it('project metadata, namespaced routes и legacy aliases',async()=>{const project=await createWorkspaceContext(root,'http-test');expect((await api({path:'/api/project'})).json()).toMatchObject({data:{tenant_id:'local',project_id:project.projectId,legacy:true}});expect((await api({path:'/api/projects'})).json()).toMatchObject({data:{projects:[{project_id:project.projectId}]}});const prefix=`/api/tenants/${project.tenantId}/projects/${project.projectId}`;expect((await api({path:`${prefix}/board`})).status).toBe(200);expect((await api({method:'POST',path:`${prefix}/tasks`,body:{title:'Scoped task'}})).json()).toMatchObject({data:{id:'T-001'}});expect((await api({path:'/api/tenants/other/projects/other/tasks'})).status).toBe(404);});
  it('отдаёт ошибки и защищает Host/Origin',async()=>{expect((await api({path:'/api/nope'})).status).toBe(404);expect((await api({path:'/api/board',headers:{host:'evil.test'}})).status).toBe(403);expect((await api({method:'POST',path:'/api/tasks',body:{title:'x'},headers:{origin:'https://evil.test'}})).status).toBe(403);});
  it('SSE сообщает об изменении задачи и принимает scoped route',async()=>{const project=await createWorkspaceContext(root,'http-test');const prefix=`/api/tenants/${project.tenantId}/projects/${project.projectId}`;const sse=await openSse(server.port,`${prefix}/events`);try{await writeFile(taskPath(root,'T-042'),'bad');await vi.waitFor(()=>expect(sse.text()).toContain('task_changed'),{timeout:3000});}finally{sse.close();}const foreign=await api({path:'/api/tenants/other/projects/other/events'});expect(foreign.status).toBe(404);});
});

describe('static fallback',()=>{it('отдаёт index и CSP',async()=>{const response=await api({path:'/deep/link'});expect(response.status).toBe(200);expect(response.headers['content-security-policy']).toContain("default-src 'self'");});});
