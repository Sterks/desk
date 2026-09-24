import {fileURLToPath} from 'node:url';
import {Client} from '@modelcontextprotocol/sdk/client/index.js';
import {StdioClientTransport} from '@modelcontextprotocol/sdk/client/stdio.js';
import {describe,expect,it} from 'vitest';
import {makeProject} from '../helpers/project.js';

const repoRoot=fileURLToPath(new URL('../..',import.meta.url));

describe('MCP stdio',()=>{
  it('реальный процесс отвечает на list_tools и create_task',async()=>{
    const root=await makeProject();
    const env:Record<string,string>={};
    for(const [key,value] of Object.entries({...process.env,DESK_ROOT:root})){
      if(value!==undefined) env[key]=value;
    }
    const transport=new StdioClientTransport({command:process.execPath,args:['--import','tsx','src/cli/index.ts','mcp'],cwd:repoRoot,env});
    const client=new Client({name:'stdio-test',version:'1'});
    await client.connect(transport);
    try{
      expect((await client.listTools()).tools).toHaveLength(9);
      const result=await client.callTool({name:'create_task',arguments:{actor:'stdio-test',title:'From stdio',fields:{priority:'p2'}}});
      const content=(result as {content?:Array<{type?:string;text?:string}>}).content?.[0];
      expect(content?.type).toBe('text');
      expect(JSON.parse(content?.type==='text'?(content.text??'{}'):'{}')).toMatchObject({id:'T-001'});
    }finally{await client.close();}
  },30000);
});
