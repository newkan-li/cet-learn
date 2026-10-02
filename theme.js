/* 统一主题（供不含 auth.js 的页面：资料中心/任务页）*/

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
