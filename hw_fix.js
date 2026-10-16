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
 function saveNow(c){var k=keyOf(c);if(!k)return;try{if(typeof wbSave==='function')wbSave(k,c);else hwSaveCanvas(c);}catch(e){quotaWarn();}}
 function markDirty(c){if(dirty.indexOf(c)<0)dirty.push(c);}
 function flushSave(){saveTimer=null;var list=dirty;dirty=[];for(var i=0;i<list.length;i++)saveNow(list[i]);}
 function scheduleSave(){if(saveTimer)clearTimeout(saveTimer);saveTimer=setTimeout(flushSave,400);}
 /* ---- 矢量存储（体积小、无配额压力）：键值 = JSON {v:2,b:底图,s:笔画}；旧位图自动兼容 ---- */
 function storeKey(k){return (typeof WBK!=='undefined'?WBK:'wbcanvas:')+k;}
 function hwClearAll(){
  var pref=(typeof WBK!=='undefined'?WBK:'wbcanvas:'), dels=[];
  try{for(var i=localStorage.length-1;i>=0;i--){var k=localStorage.key(i);if(k&&k.indexOf(pref)===0)dels.push(k);}}catch(e){}
  var n=0;dels.forEach(function(k){try{localStorage.removeItem(k);n++;}catch(e){}});
  /* 清空内存中的笔迹并重绘为空白 */
  try{document.querySelectorAll('canvas').forEach(function(c){ if(c._hwVec||c._hwBase!==undefined){c._hwVec=[];c._hwRedo=[];c._hwBase='';c._hwImg=undefined;if(c._redraw)c._redraw();} });}catch(e){}
  return n;
 }
 window.__hwClearAll=function(){return hwClearAll();};
 function quotaWarn(){
  if(window.__hwQuotaWarn)return;
  window.__hwQuotaWarn=1;
  try{
   var box=document.createElement('div');
   box.id='hwQuotaBox';
   box.style.cssText='position:fixed;inset:0;z-index:100000;display:flex;align-items:center;justify-content:center;background:rgba(15,22,35,.6);padding:16px';
   box.innerHTML='<div style="background:#fff;border-radius:14px;max-width:430px;width:100%;padding:18px 20px;box-shadow:0 12px 40px rgba(0,0,0,.35);font-size:14px;line-height:1.75;color:#23303f">'
    +'<h3 style="margin:0 0 6px;color:#c0392b">⚠️ 手写存储已满</h3>'
    +'<p style="margin:0 0 12px">本机（Safari）存储空间已满，手写/生词可能无法继续保存。建议先<b>导出手写作品</b>备份，再<b>清除手写</b>释放空间。</p>'
    +'<div style="display:flex;gap:8px;flex-wrap:wrap;justify-content:flex-end">'
    +'<button id="hwqExp" type="button" style="border:1px solid #b9c6d2;background:#fff;color:#234f7a;border-radius:12px;padding:6px 14px;font-size:13px;cursor:pointer">💾 导出手写作品</button>'
    +'<button id="hwqClr" type="button" style="border:none;background:#c0392b;color:#fff;border-radius:12px;padding:6px 14px;font-size:13px;cursor:pointer">🧹 清除手写</button>'
    +'<button id="hwqNo" type="button" style="border:1px solid #b9c6d2;background:#fff;color:#234f7a;border-radius:12px;padding:6px 14px;font-size:13px;cursor:pointer">稍后</button>'
    +'</div></div>';
   document.body.appendChild(box);
   var ex=document.getElementById('hwqExp'); if(ex)ex.onclick=function(){try{if(typeof wbExportAll==='function')wbExportAll();}catch(e){}};
   var no=document.getElementById('hwqNo'); if(no)no.onclick=function(){box.remove();window.__hwQuotaWarn=0;};
   var cl=document.getElementById('hwqClr'); if(cl)cl.onclick=function(){
    if(!confirm('确定清除本机全部手写笔迹吗？此操作不可撤销（建议先「导出手写作品」备份）。'))return;
    var n=hwClearAll(); box.remove(); window.__hwQuotaWarn=0;
    try{alert('已清除手写 '+n+' 项，空间已释放，可继续书写。');}catch(e){}
   };
  }catch(e){ try{alert('本机存储已满：请到「生词本」里「导出手写作品」备份后清理手写，再继续。');}catch(x){} }
 }
 function hwVecEnsure(c){if(c._hwVec)return;c._hwVec=[];c._hwRedo=[];}
 function hwVecRedraw(c){
  var CW=c.width||600,CH=c.height||200;var ctx=c.getContext('2d');if(!ctx)return;
  ctx.setTransform(1,0,0,1,0,0);ctx.clearRect(0,0,CW,CH);
  function vec(){(c._hwVec||[]).forEach(function(s){var pts=s.pts||[];if(!pts.length)return;ctx.globalCompositeOperation='source-over';ctx.globalAlpha=1;ctx.strokeStyle='#123a6b';ctx.lineCap='round';ctx.lineJoin='round';if(pts.length===1){ctx.lineWidth=(pts[0][2]||2);ctx.beginPath();ctx.arc(pts[0][0]*CW,pts[0][1]*CH,(pts[0][2]||2)/2,0,7);ctx.fill();return;}for(var i=0;i<pts.length-2;i++){var a=pts[i],b=pts[i+1],cc=pts[i+2];var m1x=(a[0]+b[0])/2*CW,m1y=(a[1]+b[1])/2*CH,m2x=(b[0]+cc[0])/2*CW,m2y=(b[1]+cc[1])/2*CH;ctx.lineWidth=(b[2]||2);ctx.beginPath();ctx.moveTo(m1x,m1y);ctx.quadraticCurveTo(b[0]*CW,b[1]*CH,m2x,m2y);ctx.stroke();}var a2=pts[pts.length-2],b2=pts[pts.length-1];var mx=(a2[0]+b2[0])/2*CW,my=(a2[1]+b2[1])/2*CH;ctx.lineWidth=(b2[2]||2);ctx.beginPath();ctx.moveTo(mx,my);ctx.lineTo(b2[0]*CW,b2[1]*CH);ctx.stroke();});}
  if(c._hwBase){var im=c._hwImg;if(!im){im=new Image();im.onload=function(){c._hwImg=im;hwVecRedraw(c);};im.src=c._hwBase;return;}try{ctx.globalAlpha=1;ctx.globalCompositeOperation='source-over';ctx.drawImage(im,0,0,CW,CH);}catch(e){}}
  vec();
 }
 function hwSaveCanvas(c){
  var k=keyOf(c);if(!k)return;var val;
  if(c._hwVec||c._hwBase!==undefined){ val=JSON.stringify({v:2,b:(c._hwBase||''),s:(c._hwVec||[])}); }
  else{ try{var tmp=document.createElement('canvas');var dw=600;tmp.width=dw;tmp.height=Math.max(1,Math.round(c.height*dw/c.width));var tc=tmp.getContext('2d');tc.fillStyle='#fffdf7';tc.fillRect(0,0,tmp.width,tmp.height);tc.drawImage(c,0,0,tmp.width,tmp.height);val=tmp.toDataURL('image/png');}catch(e){return;} }
  try{localStorage.setItem(storeKey(k),val);}catch(e){quotaWarn();}
 }
 function hwRestoreCanvas(c){
  var k=keyOf(c);if(!k)return;var raw=null;try{raw=localStorage.getItem(storeKey(k));}catch(e){}
  if(!raw){c._hwVec=c._hwVec||[];c._hwRedo=c._hwRedo||[];return;}
  if(raw.charAt(0)==='{'){try{var o=JSON.parse(raw);if(o&&o.v){c._hwVec=o.s||[];c._hwRedo=[];c._hwBase=o.b||'';c._hwImg=undefined;hwVecRedraw(c);return;}}catch(e){}}
  c._hwVec=[];c._hwRedo=[];c._hwBase=raw;c._hwImg=undefined;hwVecRedraw(c);
 }
 /* ---- 覆盖内置栅格持久化：改存矢量（旧位图兼容读取） ---- */
 try{window.wbSave=function(k,c){if(c)hwSaveCanvas(c);};}catch(e){}
 try{window.wbRestoreLine=function(c){hwRestoreCanvas(c);};}catch(e){}
 try{window.wbRestoreAll=function(){try{document.querySelectorAll('.wb').forEach(function(wb){var c=wb.querySelector('canvas.wc');if(c)hwRestoreCanvas(c);});}catch(e){}};}catch(e){}
 try{window.commit=function(c){if(c)hwSaveCanvas(c);};}catch(e){}
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
