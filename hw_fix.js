/* 手写修复（iPadOS / Apple Pencil）：不再依赖 setPointerCapture，
   改用 window 级 pointermove/up 跟踪整笔，抬笔后再落笔也能正常书写。
   覆盖：.wbline / .grfill / .inlwc / .pmshort / canvas.wc(.wb 板) / 全屏手写层。 */
(function(){
 if(window.__hwFix)return;window.__hwFix=true;
 if(!window.PointerEvent)return;
 function isWrite(el){
  if(!el||el.tagName!=='CANVAS')return false;
  if(el.id==='sCanvas')return false;
  var cl=el.classList;
  if(cl.contains('pmow'))return false;
  if(cl.contains('wbline')||cl.contains('grfill')||cl.contains('inlwc')||cl.contains('pmshort')||cl.contains('wc'))return true;
  if(el.closest&&(el.closest('.wb')||el.closest('.wbsheet')||el.closest('#czOverlay')||el.closest('#zzbox')))return true;
  return false;
 }
 function keyOf(c){var k=c.getAttribute('data-key');if(k)return k;var p=c.closest&&(c.closest('.wb')||c.closest('.wbsheet'));return p?p.getAttribute('data-key'):null;}
 function ok(ev){return !!(ev&&ev.pointerType&&(ev.pointerType==='pen'||ev.pointerType==='mouse'||(window.FINGER_DRAW&&ev.pointerType==='touch')));}
 function loc(c,ev){var r=c.getBoundingClientRect();var p=(ev.touches&&ev.touches[0])||ev;return{x:(p.clientX-r.left)*(c.width/r.width),y:(p.clientY-r.top)*(c.height/r.height)};}
 function erasing(){return (typeof ERASER!=='undefined')&&ERASER;}
 var act=null;
 function dot(ctx,x,y,w){
  try{
   if(erasing()){ctx.globalCompositeOperation='destination-out';ctx.lineCap='round';ctx.lineJoin='round';ctx.lineWidth=w;ctx.strokeStyle='rgba(0,0,0,1)';ctx.globalAlpha=1;ctx.beginPath();ctx.arc(x,y,w/2,0,6.2832);ctx.fill();}
   else if(typeof inkSeg==='function'){inkSeg(ctx,x,y,x,y,w);}
   else{ctx.globalCompositeOperation='source-over';ctx.strokeStyle='#123a6b';ctx.fillStyle='#123a6b';ctx.lineCap='round';ctx.lineJoin='round';ctx.lineWidth=w;ctx.beginPath();ctx.arc(x,y,w/2,0,6.2832);ctx.fill();}
  }catch(e){}
 }
 function line(ctx,x0,y0,x1,y1,w){
  try{
   if(erasing()){ctx.globalCompositeOperation='destination-out';ctx.lineCap='round';ctx.lineJoin='round';ctx.lineWidth=w;ctx.strokeStyle='rgba(0,0,0,1)';ctx.globalAlpha=1;ctx.beginPath();ctx.moveTo(x0,y0);ctx.lineTo(x1,y1);ctx.stroke();}
   else if(typeof inkSeg==='function'){inkSeg(ctx,x0,y0,x1,y1,w);}
   else{ctx.globalCompositeOperation='source-over';ctx.strokeStyle='#123a6b';ctx.lineCap='round';ctx.lineJoin='round';ctx.lineWidth=w;ctx.beginPath();ctx.moveTo(x0,y0);ctx.lineTo(x1,y1);ctx.stroke();}
  }catch(e){}
 }
 function paint(c,ev){var ctx=c.getContext('2d');if(!ctx||!act)return;
  var evs=[ev];try{if(ev.getCoalescedEvents){var ce=ev.getCoalescedEvents();if(ce&&ce.length)evs=ce;}}catch(e){}
  var erase=erasing();var _dh=120;try{_dh=c.getBoundingClientRect().height;}catch(e){}
  var _sc=(erase||_dh>=90)?1:Math.max(0.6,_dh/90);
  var w=erase?Math.min(22,Math.max(8,_dh*0.9)):((typeof pnW==='function')?pnW(ev)*_sc:3);
  var st=act.st,last=st.length?st[st.length-1]:null;
  for(var i=0;i<evs.length;i++){var p=loc(c,evs[i]);
   if(last&&last.length===2)line(ctx,last[0],last[1],p.x,p.y,w);else dot(ctx,p.x,p.y,w);
   last=p;st.push([p.x,p.y]);}
 }
 function down(ev){var c=ev.target;if(!isWrite(c)||!ok(ev))return;
  ev.stopImmediatePropagation();
  if(typeof pnHold==='function')pnHold(c,true);
  var st=c._st||c._wbst||(c._st=[]);
  if(st.length&&st[st.length-1]!==null)st.push(null);
  act={c:c,st:st};
  var p=loc(c,ev);st.push([p.x,p.y]);dot(c.getContext('2d'),p.x,p.y,((typeof pnW==='function')?pnW(ev):3));
  window.addEventListener('pointermove',move,true);
  window.addEventListener('pointerup',end,true);
  window.addEventListener('pointercancel',end,true);
  try{ev.preventDefault();}catch(e){}
 }
 function move(ev){if(!act||!ok(ev))return;paint(act.c,ev);try{ev.preventDefault();}catch(e){}}
 function end(ev){if(!act)return;var c=act.c;act=null;
  window.removeEventListener('pointermove',move,true);
  window.removeEventListener('pointerup',end,true);
  window.removeEventListener('pointercancel',end,true);
  if(typeof pnHold==='function')pnHold(c,false);
  if(typeof resetCtx==='function')resetCtx(c.getContext('2d'));
  var k=keyOf(c);
  if(k){try{if(typeof wbSave==='function')wbSave(k,c);else localStorage.setItem(((typeof WBK!=='undefined'?WBK:'kxhw:')+k),c.toDataURL('image/jpeg',0.8));}catch(e){}}
 }
 document.addEventListener('pointerdown',down,true);
})();
