/* 手写修复（iPadOS / Apple Pencil）：
   - 弃用 setPointerCapture，改用 window 级 pointermove/up 跟踪整笔；
   - 不在 pointerdown/move 里 preventDefault（避免 iPadOS 丢掉下一笔），
     用非被动的 touchstart/touchmove 阻止滚动与系统菜单；
   - 仅在整个 html 上临时禁选中（不动 touch-action，避免动态改动干扰下一笔）；
   - 一笔内只认同一 pointerId；保存防抖合并，避免抬笔 toDataURL 卡住下一笔。
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
 function cssInject(){
  if(document.getElementById('hwFixCSS'))return;
  var s=document.createElement('style');s.id='hwFixCSS';
  /* 仅禁选中与系统长按菜单；不改 touch-action（避免动态改动影响落笔） */
  s.textContent='html.hw-writing,html.hw-writing *{-webkit-user-select:none!important;user-select:none!important;-webkit-touch-callout:none!important}';
  document.head.appendChild(s);
 }
 function setWriting(on){
  window.__hwWriting=!!on;
  try{if(on)document.documentElement.classList.add('hw-writing');else document.documentElement.classList.remove('hw-writing');}catch(e){}
 }
 function clearSel(){try{var s=window.getSelection&&window.getSelection();if(s&&s.rangeCount&&!s.isCollapsed)s.removeAllRanges();}catch(e){}}
 function killPopups(){try{var a=document.getElementById('kxstbtn');if(a)a.remove();}catch(e){}}
 function loc(c,ev){var r=c.getBoundingClientRect();var p=(ev.touches&&ev.touches[0])||ev;return{x:(p.clientX-r.left)*(c.width/r.width),y:(p.clientY-r.top)*(c.height/r.height)};}
 function erasing(){return (typeof ERASER!=='undefined')&&ERASER;}
 var act=null;
 /* ---- 防抖合并保存：抬笔后 400ms 才写盘，且多笔合并，避免同步 toDataURL 阻塞下一笔 ---- */
 var dirty=[],saveTimer=null;
 function saveNow(c){var k=keyOf(c);if(!k)return;try{if(typeof wbSave==='function')wbSave(k,c);else localStorage.setItem(((typeof WBK!=='undefined'?WBK:'kxhw:')+k),c.toDataURL('image/jpeg',0.8));}catch(e){}}
 function markDirty(c){if(dirty.indexOf(c)<0)dirty.push(c);}
 function flushSave(){saveTimer=null;var list=dirty;dirty=[];for(var i=0;i<list.length;i++)saveNow(list[i]);}
 function scheduleSave(){if(saveTimer)clearTimeout(saveTimer);saveTimer=setTimeout(flushSave,400);}
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
  ev.stopImmediatePropagation();      /* 阻止内置引擎重复绘制（不 preventDefault，避免丢下一笔） */
  setWriting(true);clearSel();killPopups();
  if(typeof pnHold==='function')pnHold(c,true);
  var st=c._st||c._wbst||(c._st=[]);
  if(st.length&&st[st.length-1]!==null)st.push(null);
  act={c:c,st:st,pid:(ev.pointerId!=null?ev.pointerId:null)};
  var p=loc(c,ev);st.push([p.x,p.y]);dot(c.getContext('2d'),p.x,p.y,((typeof pnW==='function')?pnW(ev):3));
  window.addEventListener('pointermove',move,true);
  window.addEventListener('pointerup',end,true);
  window.addEventListener('pointercancel',end,true);
 }
 function move(ev){if(!act)return;if(act.pid!=null&&ev.pointerId!=null&&ev.pointerId!==act.pid)return;clearSel();paint(act.c,ev);}
 function end(ev){if(!act)return;if(act.pid!=null&&ev&&ev.pointerId!=null&&ev.pointerId!==act.pid)return;var c=act.c;act=null;
  window.removeEventListener('pointermove',move,true);
  window.removeEventListener('pointerup',end,true);
  window.removeEventListener('pointercancel',end,true);
  clearSel();
  setTimeout(function(){if(!act){setWriting(false);clearSel();}},360);
  if(typeof pnHold==='function')pnHold(c,false);
  if(typeof resetCtx==='function')resetCtx(c.getContext('2d'));
  markDirty(c);scheduleSave();
 }
 cssInject();
 /* 关闭内置引擎在每次落笔时的同步 toDataURL 快照（undo 用），避免卡住下一笔 */
 try{if(typeof snapCap==='function')window.snapCap=function(){return null;};}catch(e){}
 /* 非被动 touch 监听：阻止滚动与系统长按菜单（不在 pointer 事件里 preventDefault） */
 document.addEventListener('touchstart',function(e){if(isWrite(e.target)){try{e.preventDefault();}catch(x){}}},{capture:true,passive:false});
 document.addEventListener('touchmove',function(e){if(act){try{e.preventDefault();}catch(x){}}},{capture:true,passive:false});
 document.addEventListener('contextmenu',function(e){if(window.__hwWriting){try{e.preventDefault();}catch(x){}}},true);
 document.addEventListener('selectstart',function(e){if(window.__hwWriting){try{e.preventDefault();}catch(x){}}},true);
 document.addEventListener('pointerdown',down,true);
 window.addEventListener('pagehide',function(){if(saveTimer){clearTimeout(saveTimer);flushSave();}});
 document.addEventListener('visibilitychange',function(){if(document.hidden&&saveTimer){clearTimeout(saveTimer);flushSave();}});
})();
