export const agentHue=(name:string)=>[...name].reduce((h,ch)=>(h*31+(ch.codePointAt(0)??0))%360,7);export const agentColor=(name:string)=>`oklch(0.64 0.13 ${agentHue(name)})`;
