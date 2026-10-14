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
 function ok(ev){var pt=ev&&ev.pointerType; if(pt==='touch'&&Date.now()-__hwPenT<5000)return false; return !!(pt==='pen'||pt==='mouse'||(window.FINGER_DRAW&&pt==='touch'));}
 var __hwPenT=0;
 document.addEventListener('pointerdown',function(e){if(e.pointerType==='pen')__hwPenT=Date.now();},true);
 function cssInject(){
  if(document.getElementById('hwFixCSS'))return;
  var s=document.createElement('style');s.id='hwFixCSS';
  /* 只在 html 上禁选中（user-select:auto 会向下生效），避免 * 全页样式重算造成卡顿 */
  s.textContent='html.hw-writing{-webkit-user-select:none!important;user-select:none!important;-webkit-touch-callout:none!important}';
  document.head.appendChild(s);
 }
 function setWriting(on){
  window.__hwWriting=!!on;
  try{if(on)document.documentElement.classList.add('hw-writing');else document.documentElement.classList.remove('hw-writing');}catch(e){}
 }
 function clearSel(){try{var s=window.getSelection&&window.getSelection();if(s&&s.rangeCount&&!s.isCollapsed)s.removeAllRanges();}catch(e){}}
 function killPopups(){try{var a=document.getElementById('kxstbtn');if(a)a.remove();}catch(e){}}
 function loc(c,ev){var r=c.getBoundingClientRect();var p=(ev.touches&&ev.touches[0])||ev;return{x:(p.clientX-r.left)*(c.width/r.width),y:(p.clientY-r.top)*(c.height/r.height)};}
 function locA(a,ev){var p=(ev.touches&&ev.touches[0])||ev;return{x:(p.clientX-a.rect.left)*(a.cw/a.rect.width),y:(p.clientY-a.rect.top)*(a.ch/a.rect.height)};}
 function erasing(){return (typeof ERASER!=='undefined')&&ERASER;}
 var act=null;
 /* ---- 防抖合并保存：抬笔后 400ms 才写盘，且多笔合并，避免同步 toDataURL 阻塞下一笔 ---- */
 var dirty=[],saveTimer=null;
 function saveNow(c){var k=keyOf(c);if(!k)return;try{if(typeof wbSave==='function')wbSave(k,c);else localStorage.setItem(((typeof WBK!=='undefined'?WBK:'kxhw:')+k),c.toDataURL('image/jpeg',0.8));}catch(e){try{if(window.__hwQuotaWarn!==1&&String(e&&e.name).indexOf('Quota')>=0){window.__hwQuotaWarn=1;alert('本机存储已满：手写可能无法保存。请导出/清理后可继续（生词本里有「导出手写作品」）。');}}catch(x){}}}
 function markDirty(c){if(dirty.indexOf(c)<0)dirty.push(c);}
 function flushSave(){saveTimer=null;var list=dirty;dirty=[];for(var i=0;i<list.length;i++)saveNow(list[i]);}
 function scheduleSave(){if(saveTimer)clearTimeout(saveTimer);saveTimer=setTimeout(flushSave,400);}
 /* ---- 会话内矢量撤销/重做：保留已恢复的底图，仅撤销本次新写的笔画 ---- */
 function hwVecEnsure(c){if(c._hwVec)return;c._hwVec=[];c._hwRedo=[];try{c._hwBase=c.toDataURL('image/png');}catch(e){c._hwBase=null;}}
 function hwVecRedraw(c){
  var dpr=window.devicePixelRatio||1;var r=c.getBoundingClientRect();if(!r.width)return;
  var w=Math.max(1,Math.round(r.width*dpr)),h=Math.max(1,Math.round(r.height*dpr));
  if(c.width!==w||c.height!==h){c.width=w;c.height=h;}
  var ctx=c.getContext('2d');ctx.setTransform(dpr,0,0,dpr,0,0);ctx.clearRect(0,0,r.width,r.height);
  function vec(){(c._hwVec||[]).forEach(function(s){var pts=s.pts||[];if(!pts.length)return;ctx.globalCompositeOperation='source-over';ctx.globalAlpha=1;ctx.strokeStyle='#123a6b';ctx.lineCap='round';ctx.lineJoin='round';if(pts.length===1){ctx.lineWidth=(pts[0][2]||2);ctx.beginPath();ctx.arc(pts[0][0]*r.width,pts[0][1]*r.height,(pts[0][2]||2)/2,0,7);ctx.fill();return;}for(var i=0;i<pts.length-2;i++){var a=pts[i],b=pts[i+1],cc=pts[i+2];var m1x=(a[0]+b[0])/2*r.width,m1y=(a[1]+b[1])/2*r.height,m2x=(b[0]+cc[0])/2*r.width,m2y=(b[1]+cc[1])/2*r.height;ctx.lineWidth=(b[2]||2);ctx.beginPath();ctx.moveTo(m1x,m1y);ctx.quadraticCurveTo(b[0]*r.width,b[1]*r.height,m2x,m2y);ctx.stroke();}var a2=pts[pts.length-2],b2=pts[pts.length-1];var mx=(a2[0]+b2[0])/2*r.width,my=(a2[1]+b2[1])/2*r.height;ctx.lineWidth=(b2[2]||2);ctx.beginPath();ctx.moveTo(mx,my);ctx.lineTo(b2[0]*r.width,b2[1]*r.height);ctx.stroke();});}
  if(c._hwBase){var im=c._hwImg;if(!im){im=new Image();im.onload=function(){c._hwImg=im;hwVecRedraw(c);};im.src=c._hwBase;return;}try{ctx.globalAlpha=1;ctx.globalCompositeOperation='source-over';ctx.drawImage(im,0,0,r.width,r.height);}catch(e){}}
  vec();
 }
 function hwUndo(redo){
  var c=window._hwLast;if(!c||!c._hwVec)return;
  if(redo){if(c._hwRedo&&c._hwRedo.length){c._hwVec.push(c._hwRedo.pop());hwVecRedraw(c);markDirty(c);scheduleSave();}return;}
  if(!c._hwVec.length)return;c._hwRedo=c._hwRedo||[];c._hwRedo.push(c._hwVec.pop());hwVecRedraw(c);markDirty(c);scheduleSave();
 }
 window.__hwUndo=hwUndo;
 document.addEventListener('click',function(e){var b=e.target&&e.target.closest&&e.target.closest('#inkundo,#inkredo');if(!b)return;e.preventDefault();e.stopImmediatePropagation();hwUndo(b.id==='inkredo');},true);
 document.addEventListener('keydown',function(e){if(!(e.ctrlKey||e.metaKey))return;var k=(e.key||'').toLowerCase();if(k!=='z'||!window._hwLast)return;e.preventDefault();hwUndo(!!e.shiftKey);},true);
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
  var erase=erasing();var _dh=act.dh||120;
  var _sc=(erase||_dh>=90)?1:Math.max(0.6,_dh/90);
  var st=act.st,last=st.length?st[st.length-1]:null;
  for(var i=0;i<evs.length;i++){var p=locA(act,evs[i]);
   var w=erase?Math.min(22,Math.max(8,_dh*0.9)):((typeof pnW==='function')?pnW(evs[i])*_sc:3);
   if(erase){ if(last&&last.length===2)line(ctx,last[0],last[1],p.x,p.y,w);else dot(ctx,p.x,p.y,w); }
   else {
    var nx=p.x/act.cw,ny=p.y/act.ch;
    if(act.pts)act.pts.push([nx,ny,w]);
    var n=act.pts?act.pts.length:0;
    if(n>=3){ lineQ(ctx,act.pts[n-3],act.pts[n-2],act.pts[n-1],act.cw,act.ch,w); }
    else if(n===2){ line(ctx,act.pts[0][0]*act.cw,act.pts[0][1]*act.ch,act.pts[1][0]*act.cw,act.pts[1][1]*act.ch,w); }
    else { dot(ctx,p.x,p.y,w); }
   }
   last=p;st.push([p.x,p.y]);}
 }
 function lineQ(ctx,a,b,c,cw,ch,w){
  try{
   if(erasing()){ctx.globalCompositeOperation='destination-out';ctx.strokeStyle='rgba(0,0,0,1)';ctx.globalAlpha=1;}
   else if(typeof INK!=='undefined'){ctx.globalCompositeOperation='source-over';ctx.strokeStyle=INK.hl?INK.hlC:INK.color;ctx.globalAlpha=INK.hl?0.55:1;}
   else{ctx.globalCompositeOperation='source-over';ctx.strokeStyle='#123a6b';ctx.globalAlpha=1;}
   ctx.lineCap='round';ctx.lineJoin='round';ctx.lineWidth=w;
   var m1x=(a[0]+b[0])/2*cw,m1y=(a[1]+b[1])/2*ch,m2x=(b[0]+c[0])/2*cw,m2y=(b[1]+c[1])/2*ch;
   ctx.beginPath();ctx.moveTo(m1x,m1y);ctx.quadraticCurveTo(b[0]*cw,b[1]*ch,m2x,m2y);ctx.stroke();
  }catch(e){}
 }
 function down(ev){var c=ev.target;if(!isWrite(c)||!ok(ev))return;
  ev.stopImmediatePropagation();      /* 阻止内置引擎重复绘制（不 preventDefault，避免丢下一笔） */
  setWriting(true);clearSel();killPopups();
  if(typeof pnHold==='function')pnHold(c,true);
  var st=c._st||c._wbst||(c._st=[]);
  if(st.length&&st[st.length-1]!==null)st.push(null);
  var r=c.getBoundingClientRect();
  act={c:c,st:st,pid:(ev.pointerId!=null?ev.pointerId:null),rect:r,cw:c.width,ch:c.height,dh:r.height};
  var p=locA(act,ev);st.push([p.x,p.y]);dot(c.getContext('2d'),p.x,p.y,((typeof pnW==='function')?pnW(ev):3));
  hwVecEnsure(c);window._hwLast=c;act.w=((typeof pnW==='function')?pnW(ev):3);act.pts=[[p.x/act.cw,p.y/act.ch,act.w]];
  window.addEventListener('pointermove',move,true);
  window.addEventListener('pointerup',end,true);
  window.addEventListener('pointercancel',end,true);
 }
 function move(ev){if(!act)return;if(act.pid!=null&&ev.pointerId!=null&&ev.pointerId!==act.pid)return;paint(act.c,ev);}
 function end(ev){if(!act)return;if(act.pid!=null&&ev&&ev.pointerId!=null&&ev.pointerId!==act.pid)return;var c=act.c;
  try{if(!erasing()&&act.pts&&act.pts.length>=2){var ctx=c.getContext('2d');var a=act.pts[act.pts.length-2],b=act.pts[act.pts.length-1];line(ctx,((a[0]+b[0])/2)*act.cw,((a[1]+b[1])/2)*act.ch,b[0]*act.cw,b[1]*act.ch,b[2]||3);}}catch(x){}
  if(act.pts&&act.pts.length&&c._hwVec)c._hwVec.push({w:act.w,pts:act.pts});act=null;
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
 /* 内置快照撤销是死代码（被同名 doUndo 覆盖），这里关掉它的同步 toDataURL，改用下方矢量撤销 */
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
