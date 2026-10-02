(function(){
  if(window.__authGate)return;window.__authGate=true;
  try{ if(!document.getElementById('kxIndentCSS')){ var _s=document.createElement('style'); _s.id='kxIndentCSS'; _s.textContent='p.passage,div.passage{text-indent:2em}'; document.head.appendChild(_s);} }catch(e){}

  /* ===== 学习统计：统一活动日志 kxlog（type: ans/word/write/checkin）===== */
  try{ (function(){
    var LKEY='kxlog';
    function _load(){ try{ var a=JSON.parse(localStorage.getItem(LKEY)||'[]'); return Array.isArray(a)?a:[]; }catch(e){ return []; } }
    function _save(a){ try{ localStorage.setItem(LKEY,JSON.stringify(a)); }catch(e){} }
    function _dstr(){ var d=new Date(); return d.getFullYear()+'-'+('0'+(d.getMonth()+1)).slice(-2)+'-'+('0'+d.getDate()).slice(-2); }
    function _mod(){ var p=(location.pathname.split('/').pop()||'').replace('.html','');
      if(/^kaoyan-20\d\d$/.test(p)) return '真题'+p.slice(-4);
      if(p==='kaoyan-r100') return '阅读100篇';
      if(p.indexOf('kaoyan-g001-sprint')===0) return '考虫冲刺';
      if(p.indexOf('kaoyan-g001-intensive')===0) return '考虫强化';
      if(p.indexOf('kaoyan-drill-')===0) return '专项·'+p.replace('kaoyan-drill-','');
      if(p.indexOf('cet4-')===0) return '四级';
      if(p.indexOf('kaoyan-vocab')===0) return '词汇';
      return p||'其他';
    }
    function _typ(q){ try{ var t=(q.textContent||''); var m=t.match(/(细节题|推断题|主旨题|标题题|态度题|词义题|句意题|例证题|写作手法题)/); return m?m[1]:''; }catch(e){ return ''; } }
    function _push(ev){ var a=_load(); a.push(ev); if(a.length>8000)a=a.slice(-8000); _save(a); }
    window.KXLOG={push:_push,load:_load,dstr:_dstr,mod:_mod};
    document.addEventListener('click',function(e){
      var b=e.target && e.target.closest && e.target.closest('.op,.mcb,.mcs'); if(!b) return;
      var q=b.closest('.q[data-qid],.mcq[data-q]'); if(!q) return;
      var ans=q.getAttribute('data-ans'), l=b.getAttribute('data-l'); if(!ans || !l) return;
      var qid=q.getAttribute('data-qid');
      var se=q.querySelector('.stem') || q.querySelector('p');
      var stem=String(se?se.textContent:q.textContent||'').replace(/\s+/g,' ').trim().slice(0,180);
      var key=qid || ('mcq|'+(location.pathname.split('/').pop()||'')+'|'+(q.getAttribute('data-q')||''));
      _push({d:_dstr(),t:Date.now(),type:'ans',mod:_mod(),typ:_typ(q),ok:(l===ans)?1:0,key:key,stem:stem,my:l,ans:ans,p:(location.pathname.split('/').pop()||'')});
    },true);
    window.addEventListener('kx:word',function(){ _push({d:_dstr(),t:Date.now(),type:'word',mod:'词汇'}); });
    window.addEventListener('kx:checkin',function(){ _push({d:_dstr(),t:Date.now(),type:'checkin',mod:'打卡'}); });
    document.addEventListener('input',function(e){
      var t=e.target; if(t && t.matches && t.matches('textarea[data-tk]') && !t._kxLogged){ t._kxLogged=1; _push({d:_dstr(),t:Date.now(),type:'write',mod:_mod()}); }
    },true);
  })(); }catch(e){}
  var SALT_B64="YSU7EFtFw59g7Bgp6dzAeQ==";
  var ITER=600000;
  var DK_B64="fpaePhZm/FUUMO06eRbyqecSqKtOz9iUGMbnWNPjmN0=";
  var KEY="cet_auth";
  function b64(s){return Uint8Array.from(atob(s),function(c){return c.charCodeAt(0);});}
  function bytesEqual(a,b){if(a.length!==b.length)return false;var d=0;for(var i=0;i<a.length;i++){d|=a[i]^b[i];}return d===0;}
  function derive(pw){
    var enc=new TextEncoder();
    return crypto.subtle.importKey("raw",enc.encode(pw),{name:"PBKDF2"},false,["deriveBits"])
      .then(function(k){return crypto.subtle.deriveBits({name:"PBKDF2",salt:b64(SALT_B64),iterations:ITER,hash:"SHA-256"},k,256);})
      .then(function(bits){return new Uint8Array(bits);});
  }
  function boot(){
    if(document.getElementById("gate"))return;
    var authed=false;
    try{authed=sessionStorage.getItem(KEY)==="1";}catch(e){}
    var st=document.createElement("style");
    st.textContent="#gate{position:fixed;inset:0;z-index:99999;display:flex;align-items:center;justify-content:center;background:linear-gradient(160deg,#2b6ef2,#173a82);padding:20px}"
      +"#gate.hide{display:none}#gate .gatebox{background:#fff;color:#1f2430;border-radius:14px;box-shadow:0 18px 50px rgba(0,0,0,.35);padding:28px 26px;width:100%;max-width:360px}"
      +"#gate h2{margin:0 0 4px;font-size:19px}#gate p.sub{margin:0 0 18px;font-size:13px;color:#5a6172}"
      +"#gate input[type=password]{width:100%;box-sizing:border-box;padding:11px 12px;font-size:16px;border:1px solid #cbd5e1;border-radius:9px;outline:none}"
      +"#gate input[type=password]:focus{border-color:#2b6ef2;box-shadow:0 0 0 3px rgba(43,110,242,.15)}"
      +"#gate button{width:100%;margin-top:14px;padding:11px;font-size:16px;border:0;border-radius:9px;background:#2b6ef2;color:#fff;cursor:pointer}"
      +"#gate button:disabled{opacity:.6;cursor:default}#gate .err{margin-top:12px;font-size:13px;color:#c0392b;min-height:18px}"
      +"#gate .hint{margin-top:10px;font-size:12px;color:#94a3b8;text-align:center}body.locked{overflow:hidden}";
    document.head.appendChild(st);
    var gate=document.createElement("div");gate.id="gate";
    gate.innerHTML='<form class="gatebox" id="gateform" autocomplete="off"><h2>🔒 '+(document.title||"需要密码")+'</h2><p class="sub">请输入访问密码</p><input type="password" id="gatepw" placeholder="密码" autofocus><button type="submit" id="gatebtn">进入</button><div class="err" id="gateerr"></div><div class="hint">本站仅限授权访问</div></form>';
    document.body.appendChild(gate);
    document.body.classList.add("locked");
    if(authed){gate.classList.add("hide");document.body.classList.remove("locked");return;}
    var form=document.getElementById("gateform"),pw=document.getElementById("gatepw"),err=document.getElementById("gateerr"),btn=document.getElementById("gatebtn");
    form.addEventListener("submit",function(e){
      e.preventDefault();err.textContent="";
      if(!window.crypto||!crypto.subtle){err.textContent="当前环境不支持加密校验，请用 localhost 或 https 打开。";return;}
      if(!pw.value){err.textContent="请输入密码";return;}
      btn.disabled=true;btn.textContent="验证中…";
      derive(pw.value).then(function(got){
        if(bytesEqual(got,b64(DK_B64))){try{sessionStorage.setItem(KEY,"1");}catch(e){}gate.classList.add("hide");document.body.classList.remove("locked");}
        else{err.textContent="密码错误，请重试";pw.value="";pw.focus();}
        btn.disabled=false;btn.textContent="进入";
      }).catch(function(){err.textContent="验证失败，请重试";btn.disabled=false;btn.textContent="进入";});
    });
  }
  if(document.body)boot();else document.addEventListener("DOMContentLoaded",boot);
})();

/* ===== 统一主题：浅色/暗色/护眼/高对比（key=cet4theme，默认护眼，全站生效） ===== */
(function(){
  if(window.__kxTheme) return; window.__kxTheme=true;
  var KEY='cet4theme', DEF='sepia';
  var T=[['light','浅色'],['dark','暗色'],['sepia','护眼'],['contrast','高对比']];
  function get(){ try{ var t=localStorage.getItem(KEY); if(t&&['light','dark','sepia','contrast'].indexOf(t)>=0)return t; }catch(e){} return DEF; }
  function apply(t){
    var h=document.documentElement, i;
    for(i=0;i<T.length;i++) h.classList.remove('theme-'+T[i][0]);
    if(t!=='light') h.classList.add('theme-'+t);
    var b=document.getElementById('themeBtn');
    if(b){ var lab='主题'; for(i=0;i<T.length;i++) if(T[i][0]===t)lab=T[i][1]; b.textContent='🎨 '+lab; }
  }
  function inject(){
    if(document.getElementById('kxThemeCSS')) return;
    if(document.documentElement.innerHTML.indexOf('theme-sepia')>=0) return; /* 页面已自带配色则不覆盖 */
    var css='html.theme-sepia{--bg:#f7f2e4;--card:#fdf9ee;--ink:#3a3326;--sub:#7a6f5a;--line:#e2d8c0}'
      +'html.theme-contrast{--bg:#ffffff;--card:#ffffff;--ink:#000000;--sub:#333333;--line:#000000}'
      +'html.theme-sepia body{background:#f7f2e4}';
    var s=document.createElement('style'); s.id='kxThemeCSS'; s.textContent=css; document.head.appendChild(s);
  }
  var menu=null;
  function build(){
    var btn=document.createElement('button'); btn.id='themeBtn'; btn.type='button';
    btn.style.cssText='position:fixed;right:12px;bottom:64px;z-index:9996;background:#fff;border:1px solid #ccd3dd;border-radius:18px;padding:5px 12px;font-size:12.5px;box-shadow:0 2px 8px rgba(20,30,60,.18);cursor:pointer';
    btn.onclick=function(ev){ ev.stopPropagation(); if(!menu)return; menu.style.display=(menu.style.display==='block')?'none':'block'; };
    document.body.appendChild(btn);
    menu=document.createElement('div'); menu.id='themeMenu';
    menu.style.cssText='display:none;position:fixed;right:12px;bottom:100px;z-index:9996;background:#fff;border:1px solid #d4dae4;border-radius:12px;box-shadow:0 4px 16px rgba(20,30,60,.22);padding:6px;min-width:120px';
    T.forEach(function(x){
      var b=document.createElement('button'); b.type='button'; b.textContent=x[1];
      b.style.cssText='display:block;width:100%;text-align:left;border:0;background:transparent;padding:5px 8px;border-radius:8px;cursor:pointer;font-size:13px';
      b.onclick=function(e){ e.stopPropagation(); apply(x[0]); try{localStorage.setItem(KEY,x[0]);}catch(_e){} menu.style.display='none'; };
      menu.appendChild(b);
    });
    document.body.appendChild(menu);
    document.addEventListener('click',function(){ if(menu)menu.style.display='none'; });
  }
  function init(){
    inject();
    var ex=document.getElementById('themeBtn');
    if(ex){ ex.style.bottom='64px'; ex.style.right='12px'; ex.style.zIndex='9996'; }
    else build();
    apply(get());
  }
  apply(get());
  try{ window.addEventListener('storage',function(e){ if(e.key===KEY) apply(get()); }); }catch(e){}
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',init); else init();
})();
