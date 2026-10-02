/* 选句翻译：选中英文句子后弹「译这句」；优先用内置参考译文（KXSENT），否则在线翻译。 */
(function () {
  if (window.__kxSentDone) return; window.__kxSentDone = true;
  var PAIRS = window.KXSENT || [];
  function norm(s) {
    return String(s).replace(/\s+/g, ' ').replace(/[“”]/g, '"').replace(/[‘’]/g, "'")
      .replace(/\s+([,.;:!?])/g, '$1').trim().toLowerCase();
  }
  var IDX = PAIRS.map(function (p) { return [norm(p[0]), p[1]]; });

  function localLookup(s) {
    var n = norm(s); if (n.length < 12) return null;
    for (var i = 0; i < IDX.length; i++) if (IDX[i][0] === n) return { cn: IDX[i][1], src: '参考译文' };
    for (var j = 0; j < IDX.length; j++) {
      var e = IDX[j][0];
      if (e.indexOf(n) >= 0 || n.indexOf(e) >= 0) {
        var ratio = Math.min(e.length, n.length) / Math.max(e.length, n.length);
        if (ratio > 0.7) return { cn: IDX[j][1], src: '参考译文' };
      }
    }
    return null;
  }

  function online(s, cb) {
    var u = 'https://api.mymemory.translated.net/get?langpair=en|zh-CN&q=' + encodeURIComponent(s);
    fetch(u).then(function (r) { return r.json(); }).then(function (j) {
      var t = j && j.responseData && j.responseData.translatedText;
      if (t && !/QUERY LENGTH LIMIT|INVALID|MYMEMORY WARNING/i.test(t)) cb({ cn: t, src: '在线翻译 · MyMemory' });
      else google(s, cb);
    }).catch(function () { google(s, cb); });
  }
  function google(s, cb) {
    var u = 'https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=zh-CN&dt=t&q=' + encodeURIComponent(s);
    fetch(u).then(function (r) { return r.json(); }).then(function (j) {
      var t = (j && j[0] || []).map(function (x) { return x[0]; }).join('');
      cb({ cn: t || '（翻译失败，请重试）', src: '在线翻译 · Google' });
    }).catch(function () { cb({ cn: '（在线翻译不可用：请检查网络，或稍后重试）', src: '—' }); });
  }

  var css = ''
    + '.kxstbtn{position:absolute;z-index:9993;background:#123a6b;color:#fff;border:none;border-radius:14px;padding:3px 10px;font-size:12.5px;cursor:pointer;box-shadow:0 3px 10px rgba(0,0,0,.25)}'
    + '.kxstpop{position:absolute;z-index:9994;background:#fff;border:1px solid #cbd5e1;border-radius:12px;box-shadow:0 8px 28px rgba(0,0,0,.24);padding:10px 12px;max-width:420px;font-size:13.5px}'
    + '.kxstpop .o{color:#8a94a3;font-size:12px;margin-bottom:4px}'
    + '.kxstpop .t{color:#123a6b;font-weight:600;line-height:1.6}'
    + '.kxstpop .s{color:#9aa3b0;font-size:11.5px;margin-top:4px}'
    + '.kxstpop .bar{margin-top:8px;display:flex;gap:8px}'
    + '.kxstpop button{border:1px solid #b9c6d2;background:#fff;color:#234f7a;border-radius:12px;padding:2px 10px;font-size:12px;cursor:pointer}'
    + 'html.theme-dark .kxstpop{background:#151b24;border-color:#2c3442;color:#e6e9ef}'
    + 'html.theme-dark .kxstpop .t{color:#9fc3ff}'
    + '@media print{.kxstbtn,.kxstpop{display:none!important}}';

  function inject() { if (document.getElementById('kxSentCSS')) return; var s = document.createElement('style'); s.id = 'kxSentCSS'; s.textContent = css; document.head.appendChild(s); }
  function rm(id) { var e = document.getElementById(id); if (e) e.remove(); }
  function hideAll() { rm('kxstbtn'); rm('kxstpop'); }

  var btn = null;
  function showBtn(rect, text) {
    rm('kxstbtn');            /* 只清按钮，不动已打开的译文弹窗 */
    btn = document.createElement('button'); btn.id = 'kxstbtn'; btn.className = 'kxstbtn'; btn.type = 'button';
    btn.textContent = '译这句 ▸';
    document.body.appendChild(btn);
    var x = Math.min(rect.left + window.scrollX, window.scrollX + window.innerWidth - 110);
    var y = rect.bottom + window.scrollY + 6;
    btn.style.left = Math.max(6, x) + 'px'; btn.style.top = y + 'px';
    btn.onmousedown = function (e) { e.preventDefault(); };
    btn.onclick = function (e) { e.stopPropagation(); doTranslate(rect, text); };
  }

  function doTranslate(rect, text) {
    rm('kxstbtn');
    var pop = document.createElement('div'); pop.id = 'kxstpop'; pop.className = 'kxstpop';
    pop.innerHTML = '<div class="o">' + esc(short(text)) + '</div><div class="t">翻译中…</div><div class="s"></div>'
      + '<div class="bar"><button id="kxstclose">关闭</button></div>';
    document.body.appendChild(pop);
    var x = Math.min(rect.left + window.scrollX, window.scrollX + window.innerWidth - (Math.min(420, window.innerWidth - 30)));
    pop.style.left = Math.max(6, x) + 'px'; pop.style.top = (rect.bottom + window.scrollY + 6) + 'px';
    pop.querySelector('#kxstclose').onclick = hideAll;
    var lo = localLookup(text);
    if (lo) { fill(pop, lo); return; }
    online(text, function (r) { fill(pop, r); });
  }
  function fill(pop, r) {
    var t = pop.querySelector('.t'); if (t) t.textContent = r.cn;
    var s = pop.querySelector('.s'); if (s) s.textContent = '来源：' + r.src;
  }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function short(s) { s = String(s).replace(/\s+/g, ' ').trim(); return s.length > 110 ? s.slice(0, 110) + '…' : s; }

  function checkSel() {
    if (document.getElementById('kxstpop')) return;   /* 译文已打开时不再弹按钮，避免闪烁 */
    var sel = window.getSelection(); if (!sel || sel.isCollapsed) return;
    var txt = sel.toString().trim();
    if (txt.length < 15 || txt.split(/\s+/).length < 3) return;   // 至少 3 个词
    if (txt.length > 600) return;
    // 必须落在正文里
    try {
      var node = sel.anchorNode; var el = node && (node.nodeType === 3 ? node.parentNode : node);
      if (!el || !el.closest || !el.closest('.passage,.q,.stem,.ans,.cn,.tip,.question,.qopt,.sencn,.hint')) return;
    } catch (e) { return; }
    var rect = sel.getRangeAt(0).getBoundingClientRect();
    if (!rect || (!rect.width && !rect.height)) return;
    showBtn(rect, txt);
  }

  document.addEventListener('mouseup', function () { setTimeout(checkSel, 10); });
  document.addEventListener('touchend', function () { setTimeout(checkSel, 150); });
  document.addEventListener('mousedown', function (e) { if (e.target.closest && e.target.closest('#kxstbtn,#kxstpop')) return; rm('kxstpop'); });
  document.addEventListener('scroll', function () { rm('kxstbtn'); }, true);

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', inject); else inject();
})();
