import {getLocale,subscribeLanguage,t} from './index';
/**
 * Safety net for display strings that reach the page without passing through t().
 * Only text that still contains Chinese characters (or that was rewritten earlier by this
 * module) is touched, and only exact catalog matches change; unknown text is left alone.
 */
const han=/[\u3400-\u9fff]/;
const attrs=['aria-label','title','placeholder','alt'];
const originals=new WeakMap<Node,{source:string;output:string}>();
const attrOriginals=new WeakMap<Element,Record<string,{source:string;output:string}>>();
const skip=(el:Element|null)=>!!el&&!!el.closest('script,style,textarea,input,[contenteditable="true"],[data-no-translate]');
function fixText(node:Text){
 const record=originals.get(node),value=node.nodeValue||'';
 const source=record&&record.output===value?record.source:value;
 if(record&&record.output!==value)originals.delete(node);
 if(getLocale()==='zh'){if(record&&record.output===value&&value!==source)node.nodeValue=source,originals.delete(node);return;}
 if(!han.test(source)||skip(node.parentElement))return;
 const output=t(source);
 if(output!==source&&output!==value){originals.set(node,{source,output});node.nodeValue=output;}
 else if(output===source&&record&&value!==source){node.nodeValue=source;originals.delete(node);}
}
function fixAttrs(el:Element){
 if(skip(el))return;
 let store=attrOriginals.get(el);
 for(const name of attrs){
  const value=el.getAttribute(name);if(value==null)continue;
  const record=store?.[name];const source=record&&record.output===value?record.source:value;
  if(!han.test(source)||getLocale()==='zh'){if(record&&record.output===value&&value!==source)el.setAttribute(name,source);continue;}
  const output=t(source);
  if(output!==value){store=store||(attrOriginals.set(el,{}),attrOriginals.get(el)!);store[name]={source,output};el.setAttribute(name,output);}
 }
}
function sweep(root:Node){
 if(root.nodeType===Node.TEXT_NODE){fixText(root as Text);return;}
 if(root.nodeType!==Node.ELEMENT_NODE&&root.nodeType!==Node.DOCUMENT_NODE)return;
 if(root.nodeType===Node.ELEMENT_NODE)fixAttrs(root as Element);
 const walker=document.createTreeWalker(root,NodeFilter.SHOW_ELEMENT|NodeFilter.SHOW_TEXT);
 let n=walker.nextNode();
 while(n){if(n.nodeType===Node.TEXT_NODE)fixText(n as Text);else fixAttrs(n as Element);n=walker.nextNode();}
}
export function installDomFallback(){
 if(typeof document==='undefined'||typeof MutationObserver==='undefined')return;
 const observer=new MutationObserver(records=>{
  observer.disconnect();
  try{for(const r of records){
   if(r.type==='characterData')fixText(r.target as Text);
   else if(r.type==='attributes')fixAttrs(r.target as Element);
   else r.addedNodes.forEach(sweep);
  }}finally{start();}
 });
 function start(){observer.observe(document.body,{subtree:true,childList:true,characterData:true,attributes:true,attributeFilter:attrs});}
 sweep(document.body);start();
 subscribeLanguage(()=>queueMicrotask(()=>{observer.disconnect();try{sweep(document.body);}finally{start();}}));
}
