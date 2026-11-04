import {test} from 'vitest';
import {gameReducer as reduce,newGame,creditFields,type GameState} from '../src/game/engine';
import {CALLERS,DAYS,SHOP} from '../src/game/content';
import {setLanguage,t} from '../src/i18n';
const han=/[\u3400-\u9fff]/;const bad=new Map<string,string>();const seenS=new Set<string>();
function walk(v:any,path:string,depth=0){if(depth>7)return;if(typeof v==='string'){if(seenS.has(v))return;seenS.add(v);const o=t(v);if(han.test(o))bad.set(v,path+' => '+o);}else if(Array.isArray(v))v.forEach((x,i)=>walk(x,path+'['+i+']',depth+1));else if(v&&typeof v==='object')for(const k of Object.keys(v))walk(v[k],path+'.'+k,depth+1);}
let rnd=1;const R=(n:number)=>{rnd=(rnd*1103515245+12345)&0x7fffffff;return rnd%n;};
test('Korean catalog covers strings generated while playing',()=>{setLanguage('ko');
 for(let seed=1;seed<=12;seed++){rnd=seed;let s:GameState=reduce(newGame(seed),{type:'start'});
  for(let step=0;step<1500&&s.phase!=='won'&&s.phase!=='fired';step++){
   const a=R(14);
   try{
   if(s.phase==='review'){walk(s,'review');s=reduce(s,{type:'next'});continue;}
   if(a<5)s=reduce(s,{type:'tick'});
   else if(a===5)s=reduce(s,{type:'accept'});
   else if(a<9&&s.call){const tones=['warm','confident','playful'] as const;s=reduce(s,{type:'reply',tone:s.call.status==='active'?CALLERS[s.call.person].tone:tones[R(3)]});}
   else if(a===9&&s.call){s=reduce(s,{type:'verify',code:R(2)?s.call.code:'x',file:['mission.txt','x.txt'][R(2)]});s=reduce(s,{type:'verify-credit',field:R(3),value:creditFields(s.call!)[R(3)]});}
   else if(a===10){const it=SHOP[R(SHOP.length)];s={...s,balance:s.balance+500};s=reduce(s,{type:'buy',id:it.id});s=reduce(s,{type:'use-item',id:it.id});}
   else if(a===11&&s.event)s=reduce(s,{type:'fix'});
   else if(a===12)s=reduce(s,{type:'gamble',bet:10});
   else if(a===13){s={...s,earned:Math.max(s.earned,DAYS[Math.min(s.day,7)-1].quota)};if(R(10)===0)s=reduce(s,{type:'review'});}
   }catch(e){}
   walk(s,'seed'+seed+'.s'+step);
  }}
 if(bad.size)throw new Error('Untranslated Chinese in ko: '+[...bad].slice(0,10).join('; '));
},120000);
