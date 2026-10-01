/* 点词翻译 + 生词本（用于考研专项练习页）。词典来自本页加载的 CET4D / KYDICT。 */
(function () {
  if (window.__kxDictDone) return; window.__kxDictDone = true;
  var KEY = 'kxvocab';
  function dict() { return Object.assign({}, window.CET4D || {}, window.KYDICT || {}); }
  var D = null;
  function getD() { if (!D) D = dict(); return D; }

  function load() { try { return JSON.parse(localStorage.getItem(KEY) || '[]') || []; } catch (e) { return []; } }
  function save(a) { try { localStorage.setItem(KEY, JSON.stringify(a)); } catch (e) {} }
  var BOOK = load();

  function norm(w) { return (w || '').toLowerCase().replace(/^[^a-z]+|[^a-z'\-]+$/g, ''); }
  function lookup(w) {
    w = norm(w); if (!w) return null; var d = getD();
    if (d[w]) return d[w];
    var c = [];
    if (/ies$/.test(w)) c.push(w.slice(0, -3) + 'y');
    if (/(ches|shes|xes|ses|zes)$/.test(w)) c.push(w.slice(0, -2));
    if (/s$/.test(w)) c.push(w.slice(0, -1));
    if (/ed$/.test(w)) { c.push(w.slice(0, -2)); c.push(w.slice(0, -1)); }
    if (/ing$/.test(w)) { c.push(w.slice(0, -3)); c.push(w.slice(0, -3) + 'e'); }
    if (/(er|est)$/.test(w)) { c.push(w.replace(/(er|est)$/, '')); c.push(w.replace(/est$/, '')); }
    for (var i = 0; i < c.length; i++) if (d[c[i]]) return d[c[i]];
    return null;
  }
  function inBook(w) { w = norm(w); for (var i = 0; i < BOOK.length; i++) if (BOOK[i].w === w) return true; return false; }
  function add(w, cn, ipa) {
    w = norm(w); if (!w || inBook(w)) return false;
    var d = lookup(w);
    BOOK.push({ w: w, cn: cn || (d ? d.cn : '') || '', ipa: ipa || (d ? d.uk : '') || '' });
    save(); refresh(); return true;
  }
  function del(w) { w = norm(w); for (var i = 0; i < BOOK.length; i++) if (BOOK[i].w === w) { BOOK.splice(i, 1); break; } save(); refresh(); }

  var css = ''
    + '.kxfab{position:fixed;right:16px;bottom:16px;z-index:9990;background:#2b6ef2;color:#fff;border:none;border-radius:24px;padding:9px 15px;font-size:14px;font-weight:700;cursor:pointer;box-shadow:0 4px 14px rgba(0,0,0,.28)}'
    + '.kxfab .n{background:#fff;color:#2b6ef2;border-radius:10px;padding:0 6px;margin-left:6px;font-size:12px}'
    + '#kxpanel{position:fixed;right:16px;bottom:64px;z-index:9991;width:min(360px,92vw);max-height:70vh;overflow:auto;background:#fff;border:1px solid #d4dae4;border-radius:14px;box-shadow:0 8px 30px rgba(0,0,0,.28);padding:10px 12px;display:none}'
    + '#kxpanel.hd{font-weight:700;color:#234f7a}'
    + '#kxpanel ul{list-style:none;margin:6px 0 0;padding:0}'
    + '#kxpanel li{display:flex;align-items:baseline;gap:6px;border-bottom:1px dashed #e6ecf3;padding:5px 0;font-size:13px}'
    + '#kxpanel li .w{font-weight:700;color:#123a6b}#kxpanel li .p{color:#8a94a3;font-size:11.5px}#kxpanel li .c{flex:1;color:#39424f}'
    + '#kxpanel li button{border:1px solid #e0c0c0;background:#fff;color:#c0392b;border-radius:8px;padding:0 6px;cursor:pointer;font-size:12px}'
    + '#kxpanel .row{display:flex;gap:8px;margin-top:8px}'
    + '#kxpanel .row button{flex:1;border:1px solid #b9c6d2;background:#fff;color:#234f7a;border-radius:10px;padding:5px;cursor:pointer;font-size:12.5px}'
    + '.kxpop{position:absolute;z-index:9992;background:#fff;border:1px solid #cbd5e1;border-radius:10px;box-shadow:0 6px 24px rgba(0,0,0,.22);padding:8px 10px;max-width:280px;font-size:13px}'
    + '.kxpop .w{font-weight:700;color:#123a6b;font-size:15px}.kxpop .p{color:#8a94a3;font-size:12px;margin-left:6px}'
    + '.kxpop .c{color:#39424f;margin:4px 0 6px}.kxpop button{border:1px solid #b9c6d2;background:#fff;color:#2b6ef2;border-radius:12px;padding:2px 10px;cursor:pointer;font-size:12.5px}'
    + '.kxpop .sp{border:0;background:transparent;font-size:15px;cursor:pointer}'
    + '.kxpop .cl{float:right;border:0;background:transparent;color:#8a94a3;font-size:14px;cursor:pointer;padding:0 2px}'
    + 'mark.kxmark{background:#fff3a3;color:inherit;border-radius:3px;padding:0 1px}'
    + 'details.kxvocab{margin:8px 0;border:1px solid #e4ddcd;border-radius:10px;padding:6px 10px;background:#fffdf8}'
    + 'details.kxvocab summary{cursor:pointer;color:#1b5fa8;font-weight:600;font-size:13.5px}'
    + 'ul.kxlist{list-style:none;margin:6px 0 0;padding:0;columns:2;column-gap:18px}'
    + 'ul.kxlist li{break-inside:avoid;font-size:13px;padding:2px 0;display:flex;align-items:baseline;gap:5px}'
    + 'ul.kxlist .wx{font-weight:700;color:#123a6b}ul.kxlist .ipa{color:#8a94a3;font-size:11.5px}ul.kxlist .cn{color:#39424f;flex:1}'
    + 'ul.kxlist button.kxadd{border:1px solid #b9ddc4;background:#eafaf0;color:#1b7f3b;border-radius:8px;padding:0 6px;font-size:11.5px;cursor:pointer;white-space:nowrap}'
    + 'ul.kxlist button.kxadd.on{background:#1b7f3b;color:#fff;border-color:#1b7f3b}'
    + 'html.theme-dark .kxfab{box-shadow:0 4px 14px rgba(0,0,0,.5)}'
    + 'html.theme-dark #kxpanel,html.theme-dark .kxpop{background:#151b24;border-color:#2c3442;color:#e6e9ef}'
    + 'html.theme-dark #kxpanel .hd,html.theme-dark #kxpanel li .w,html.theme-dark .kxpop .w{color:#9fc3ff}'
    + 'html.theme-dark #kxpanel li .c,html.theme-dark .kxpop .c{color:#dbe3ee}'
    + 'html.theme-dark ul.kxlist .wx{color:#9fc3ff}html.theme-dark ul.kxlist .cn{color:#dbe3ee}'
    + 'html.theme-dark mark.kxmark{background:#6b5a00;color:#fff}'
    + '@media print{.kxfab,#kxpanel,.kxpop{display:none!important}mark.kxmark{background:transparent}}';

  function injectCSS() { if (document.getElementById('kxDictCSS')) return; var s = document.createElement('style'); s.id = 'kxDictCSS'; s.textContent = css; document.head.appendChild(s); }

  function el(tag, cls, html) { var e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function speak(w) { try { var u = new SpeechSynthesisUtterance(w); u.lang = 'en-US'; speechSynthesis.cancel(); speechSynthesis.speak(u); } catch (e) {} }

  var fab, panel;
  function buildUI() {
    fab = el('button', 'kxfab'); fab.type = 'button'; fab.innerHTML = '📖 生词本<span class="n">0</span>';
    fab.onclick = function () { panel.style.display = panel.style.display === 'block' ? 'none' : 'block'; renderPanel(); };
    document.body.appendChild(fab);
    panel = el('div'); panel.id = 'kxpanel';
    document.body.appendChild(panel);
    document.addEventListener('click', function (e) {
      if (panel.style.display !== 'block') return;
      if (e.target === fab || (e.target.closest && e.target.closest('#kxpanel,.kxpop,.kxfab,.kxadd'))) return;
      panel.style.display = 'none';
    });
  }
  function renderPanel() {
    var h = '<div class="hd">📖 我的生词本（' + BOOK.length + '）</div>';
    if (!BOOK.length) h += '<p style="color:#8a94a3;font-size:13px;margin:8px 0">还没有生词。阅读/完形里点单词或点“＋生词本”即可加入。</p>';
    else {
      h += '<ul>';
      for (var i = 0; i < BOOK.length; i++) {
        var b = BOOK[i];
        h += '<li><span class="w">' + esc(b.w) + '</span><span class="p">' + esc(b.ipa) + '</span><span class="c">' + esc(b.cn) + '</span>'
          + '<button data-sp="' + esc(b.w) + '" title="朗读">🔊</button><button data-del="' + esc(b.w) + '" title="移除">✕</button></li>';
      }
      h += '</ul>';
    }
    h += '<div class="row"><button id="kxExp">导出 txt</button><button id="kxClr">清空</button></div>';
    panel.innerHTML = h;
    panel.querySelectorAll('[data-del]').forEach(function (b) { b.onclick = function () { del(b.getAttribute('data-del')); renderPanel(); }; });
    panel.querySelectorAll('[data-sp]').forEach(function (b) { b.onclick = function () { speak(b.getAttribute('data-sp')); }; });
    var ex = panel.querySelector('#kxExp'); if (ex) ex.onclick = exportTxt;
    var cl = panel.querySelector('#kxClr'); if (cl) cl.onclick = function () { if (confirm('清空生词本？')) { BOOK = []; save(); refresh(); renderPanel(); } };
  }
  function exportTxt() {
    var lines = BOOK.map(function (b) { return b.w + '\t' + b.cn; });
    var blob = new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8' });
    var a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = '生词本.txt'; a.click();
    setTimeout(function () { URL.revokeObjectURL(a.href); }, 2000);
  }

  var pop = null;
  function hidePop() { if (pop) { pop.remove(); pop = null; } }
  function showPop(x, y, w, d) {
    hidePop(); pop = el('div', 'kxpop'); pop.id = 'kxpop';
    var ipa = d ? d.uk : ''; var cn = d ? d.cn : '（词典未收录，可手动记录）';
    pop.innerHTML = '<span class="w">' + esc(w) + '</span><span class="p">' + esc(ipa) + '</span>'
      + '<button class="sp" title="朗读">🔊</button><button class="cl" title="关闭">✕</button>'
      + '<div class="c">' + esc(cn) + '</div>';
    var b = el('button', null, inBook(w) ? '已在生词本' : '＋生词本');
    if (inBook(w)) b.disabled = true;
    b.onclick = function () { if (add(w, d ? d.cn : '', ipa)) { b.textContent = '已加入 ✓'; b.disabled = true; } };
    pop.appendChild(b);
    pop.querySelector('.sp').onclick = function () { speak(w); };
    pop.querySelector('.cl').onclick = function () { hidePop(); };
    document.body.appendChild(pop);
    var px = Math.min(x, window.innerWidth - 300), py = y + 12;
    if (py + pop.offsetHeight > window.innerHeight - 10) py = y - pop.offsetHeight - 12;
    pop.style.left = Math.max(8, px) + 'px'; pop.style.top = Math.max(8, py) + window.scrollY + 'px';
  }

  function wordAt(x, y) {
    var r = null;
    if (document.caretRangeFromPoint) r = document.caretRangeFromPoint(x, y);
    else if (document.caretPositionFromPoint) { var p = document.caretPositionFromPoint(x, y); if (p) { r = document.createRange(); r.setStart(p.offsetNode, p.offset); r.setEnd(p.offsetNode, p.offset); } }
    if (!r || !r.startContainer || r.startContainer.nodeType !== 3) return null;
    var t = r.startContainer.textContent, o = r.startOffset, l = o, rr = o;
    while (l > 0 && /[A-Za-z'\-]/.test(t[l - 1])) l--;
    while (rr < t.length && /[A-Za-z'\-]/.test(t[rr])) rr++;
    var w = t.slice(l, rr); return w.length >= 2 ? w : null;
  }
  document.addEventListener('click', function (e) {
    if (e.target.closest('button,a,input,textarea,summary,label,canvas,mark.kxmark,#kxpanel,.kxpop,.kxfab')) return;
    var w = wordAt(e.clientX, e.clientY); if (!w) return;
    var d = lookup(w);
    showPop(e.clientX, e.clientY, norm(w), d);
  });
  /* 点别处 / 滚动 / Esc 关闭单词弹窗 */
  document.addEventListener('mousedown', function (e) {
    if (e.target.closest && e.target.closest('#kxpop,.kxfab,#kxpanel,.kxadd')) return;
    hidePop();
  });
  document.addEventListener('scroll', function () { hidePop(); }, true);
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') hidePop(); });

  function unwrapMarks() {
    document.querySelectorAll('mark.kxmark').forEach(function (m) { var t = document.createTextNode(m.textContent); m.parentNode.replaceChild(t, m); });
  }
  function highlight() {
    unwrapMarks(); if (!BOOK.length) return;
    var set = {}; BOOK.forEach(function (b) { set[b.w] = 1; });
    var re = new RegExp('\\b(' + BOOK.map(function (b) { return b.w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }).join('|') + ')\\b', 'gi');
    document.querySelectorAll('.passage,.stem').forEach(function (p) {
      var walker = document.createTreeWalker(p, NodeFilter.SHOW_TEXT, null);
      var nodes = []; while (walker.nextNode()) nodes.push(walker.currentNode);
      nodes.forEach(function (n) {
        if (n.parentNode && n.parentNode.nodeName === 'MARK') return;
        var txt = n.textContent; if (!re.test(txt)) { re.lastIndex = 0; return; } re.lastIndex = 0;
        var frag = document.createDocumentFragment(), last = 0, m;
        while ((m = re.exec(txt)) !== null) {
          if (m.index > last) frag.appendChild(document.createTextNode(txt.slice(last, m.index)));
          var mk = document.createElement('mark'); mk.className = 'kxmark'; mk.textContent = m[0]; frag.appendChild(mk); last = m.index + m[0].length;
        }
        if (last < txt.length) frag.appendChild(document.createTextNode(txt.slice(last)));
        n.parentNode.replaceChild(frag, n);
      });
    });
  }

  function refresh() {
    if (fab) { var n = fab.querySelector('.n'); if (n) n.textContent = BOOK.length; }
    document.querySelectorAll('button.kxadd').forEach(function (b) {
      var on = inBook(b.getAttribute('data-w')); b.textContent = on ? '已加入 ✓' : '＋生词本'; b.classList.toggle('on', on);
    });
    highlight();
  }
  function bindAddButtons() {
    document.querySelectorAll('button.kxadd').forEach(function (b) {
      if (b._kx) return; b._kx = 1;
      b.onclick = function (e) { e.stopPropagation(); var w = b.getAttribute('data-w'); if (inBook(w)) { del(w); } else { add(w, b.getAttribute('data-cn'), b.getAttribute('data-ipa')); } refresh(); };
    });
  }

  function init() { injectCSS(); buildUI(); bindAddButtons(); refresh(); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
