/* 考研作答保存 + 错误统计（错题本）。选择题按 data-qid 记录，译文书写作答按 data-tk 记录。 */
(function () {
  if (window.__kxStatDone) return; window.__kxStatDone = true;
  var AKEY = 'kxans', TKEY = 'kxtxt';
  function load(k) { try { var o = JSON.parse(localStorage.getItem(k) || '{}'); return (o && typeof o === 'object') ? o : {}; } catch (e) { return {}; } }
  function save(k, o) { try { localStorage.setItem(k, JSON.stringify(o)); } catch (e) {} }
  var ANS = load(AKEY), TXT = load(TKEY);

  function qs() { return Array.prototype.slice.call(document.querySelectorAll('.q[data-qid]')); }
  function aOf(id) { var v = ANS[id]; if (typeof v === 'string') return { l: v, ok: undefined }; return v || null; }

  function paint(q) {
    var id = q.getAttribute('data-qid'), ans = q.getAttribute('data-ans'), rec = aOf(id);
    q.querySelectorAll('.op').forEach(function (b) {
      b.classList.remove('right', 'wrong');
      if (b.getAttribute('data-l') === ans) b.classList.add('right');
      if (rec && rec.l === b.getAttribute('data-l') && rec.l !== ans) b.classList.add('wrong');
    });
    var res = q.querySelector('.res');
    if (res) {
      if (!rec) { res.className = 'res'; res.textContent = ''; }
      else { res.className = 'res ' + (rec.l === ans ? 'ok' : 'no'); res.textContent = (rec.l === ans ? '答对了（' + ans + '）' : '再想想：你的选择 ' + rec.l + '，正确答案 ' + ans); }
    }
  }
  function record(q, l) {
    var id = q.getAttribute('data-qid'); if (!id) return;
    ANS[id] = { l: l, ok: (l === q.getAttribute('data-ans')) }; save(AKEY, ANS); paint(q); updFab();
  }
  function stat(list) { var a = 0, r = 0; list.forEach(function (q) { var rec = aOf(q.getAttribute('data-qid')); if (!rec) return; a++; if (rec.l === q.getAttribute('data-ans')) r++; }); return { a: a, r: r, w: a - r }; }
  function globalStat() { var a = 0, r = 0; for (var k in ANS) { if (!ANS.hasOwnProperty(k)) continue; var rec = aOf(k); if (!rec) continue; a++; if (rec.ok) r++; } return { a: a, r: r, w: a - r }; }
  function yearOf(id) { var m = /-(\d{4})-/.exec(id); return m ? m[1] : '其他'; }

  var fab;
  function updFab() {
    var s = stat(qs());
    if (fab) fab.innerHTML = '📊 作答统计 ' + s.a + ' 答 / ' + s.r + ' 对';
  }

  var css = ''
    + '.kxstatbtn{position:fixed;left:16px;bottom:16px;z-index:9990;background:#123a6b;color:#fff;border:none;border-radius:22px;padding:8px 14px;font-size:13px;font-weight:700;cursor:pointer;box-shadow:0 4px 14px rgba(0,0,0,.28)}'
    + '#kxstatModal{position:fixed;inset:0;z-index:9995;display:none;align-items:center;justify-content:center;background:rgba(15,22,35,.55);padding:16px}'
    + '#kxstatModal .card{background:#fff;border-radius:14px;max-width:640px;width:100%;max-height:86vh;overflow:auto;padding:16px 18px;box-shadow:0 12px 40px rgba(0,0,0,.35)}'
    + '#kxstatModal h3{margin:0 0 4px;color:#234f7a;font-size:18px}'
    + '#kxstatModal .grid{display:flex;gap:10px;flex-wrap:wrap;margin:10px 0}'
    + '#kxstatModal .kpi{flex:1;min-width:120px;background:#f4f7fc;border:1px solid #dbe6f3;border-radius:10px;padding:8px 10px}'
    + '#kxstatModal .kpi b{font-size:20px;color:#123a6b;display:block}'
    + '#kxstatModal .kpi span{font-size:12px;color:#6b7280}'
    + '#kxstatModal h4{margin:12px 0 4px;font-size:14px;color:#234f7a}'
    + '#kxstatModal ul{list-style:none;margin:0;padding:0}'
    + '#kxstatModal li{border-bottom:1px dashed #e6ecf3;padding:6px 0;font-size:13px}'
    + '#kxstatModal li .goto{color:#2b6ef2;cursor:pointer;text-decoration:underline;margin-right:6px}'
    + '#kxstatModal li .y{color:#c0392b}#kxstatModal li .c{color:#1b7f3b;font-weight:700}'
    + '#kxstatModal .bar{display:flex;gap:8px;margin-top:12px;justify-content:flex-end;flex-wrap:wrap}'
    + '#kxstatModal .bar button{border:1px solid #b9c6d2;background:#fff;color:#234f7a;border-radius:12px;padding:5px 12px;font-size:13px;cursor:pointer}'
    + '#kxstatModal .bar .close{background:#2b6ef2;color:#fff;border-color:#2b6ef2}'
    + 'html.theme-dark #kxstatModal .card{background:#151b24;color:#e6e9ef}'
    + 'html.theme-dark #kxstatModal h3,html.theme-dark #kxstatModal h4{color:#9fc3ff}'
    + 'html.theme-dark #kxstatModal .kpi{background:#16202b;border-color:#2a3342}'
    + 'html.theme-dark #kxstatModal .kpi b{color:#9fc3ff}'
    + '@media print{.kxstatbtn,#kxstatModal{display:none!important}}';

  function injectCSS() { if (document.getElementById('kxStatCSS')) return; var s = document.createElement('style'); s.id = 'kxStatCSS'; s.textContent = css; document.head.appendChild(s); }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function stemOf(q) { var e = q.querySelector('.stem'); var t = e ? e.textContent.replace(/\s+/g, ' ').trim() : (q.getAttribute('data-qid') || ''); return t.length > 80 ? t.slice(0, 80) + '…' : t; }

  function render() {
    injectCSS();
    var modal = document.getElementById('kxstatModal'); if (!modal) return;
    var list = qs(), s = stat(list), g = globalStat();
    var pct = function (x) { return x.a ? Math.round(x.r * 100 / x.a) + '%' : '—'; };
    var yg = {};
    list.forEach(function (q) { var y = yearOf(q.getAttribute('data-qid')); var rec = aOf(q.getAttribute('data-qid')); if (!rec) return; yg[y] = yg[y] || { a: 0, r: 0 }; yg[y].a++; if (rec.l === q.getAttribute('data-ans')) yg[y].r++; });
    var yhtml = Object.keys(yg).sort().map(function (y) { return '<li>' + y + ' 年：对 ' + yg[y].r + ' / 答 ' + yg[y].a + '</li>'; }).join('');
    var wrongs = list.filter(function (q) { var rec = aOf(q.getAttribute('data-qid')); return rec && rec.l !== q.getAttribute('data-ans'); });
    var wrongHtml = wrongs.length ? wrongs.map(function (q) {
      var id = q.getAttribute('data-qid'), rec = aOf(id), ans = q.getAttribute('data-ans');
      return '<li><span class="goto" data-goto="' + esc(id) + '">跳转</span>' + esc(stemOf(q)) +
        '　正确 <span class="c">' + esc(ans) + '</span>　你的 <span class="y">' + esc(rec.l) + '</span></li>';
    }).join('') : '<li style="color:#8a94a3">本页暂无错题 🎉</li>';

    modal.innerHTML = '<div class="card"><h3>📊 作答统计与错题</h3>'
      + '<div class="grid">'
      + '<div class="kpi"><b>' + s.a + '</b><span>本页已答 / ' + list.length + ' 题</span></div>'
      + '<div class="kpi"><b>' + s.r + '</b><span>本页答对</span></div>'
      + '<div class="kpi"><b>' + s.w + '</b><span>本页答错</span></div>'
      + '<div class="kpi"><b>' + pct(s) + '</b><span>本页正确率</span></div>'
      + '</div>'
      + '<div class="grid"><div class="kpi"><b>' + g.a + '</b><span>全站累计已答</span></div>'
      + '<div class="kpi"><b>' + g.r + '</b><span>全站答对</span></div>'
      + '<div class="kpi"><b>' + pct(g) + '</b><span>全站正确率</span></div></div>'
      + (yhtml ? '<h4>按年份</h4><ul>' + yhtml + '</ul>' : '')
      + '<h4>本页错题（' + wrongs.length + '）</h4><ul>' + wrongHtml + '</ul>'
      + '<div class="bar"><button id="kxStatResetPage">重置本页作答</button><button id="kxStatClearAll">清空全部作答</button><button class="close" id="kxStatClose">关闭</button></div>'
      + '</div>';
    modal.querySelector('#kxStatClose').onclick = function () { modal.style.display = 'none'; };
    modal.addEventListener('click', function (e) { if (e.target === modal) modal.style.display = 'none'; });
    modal.querySelector('#kxStatResetPage').onclick = function () {
      list.forEach(function (q) { delete ANS[q.getAttribute('data-qid')]; });
      save(AKEY, ANS); list.forEach(clearPaint); render(); updFab();
    };
    modal.querySelector('#kxStatClearAll').onclick = function () {
      if (!confirm('清空全部作答记录？（含其它页面）')) return;
      ANS = {}; save(AKEY, ANS); list.forEach(clearPaint); render(); updFab();
    };
    modal.querySelectorAll('[data-goto]').forEach(function (b) {
      b.onclick = function () {
        var q = document.querySelector('.q[data-qid="' + b.getAttribute('data-goto') + '"]');
        if (q) { modal.style.display = 'none'; q.scrollIntoView({ behavior: 'smooth', block: 'center' }); q.style.transition = 'background .3s'; var old = q.style.background; q.style.background = '#fff7cc'; setTimeout(function () { q.style.background = old; }, 1200); }
      };
    });
  }
  function clearPaint(q) { q.querySelectorAll('.op').forEach(function (b) { b.classList.remove('right', 'wrong'); }); var r = q.querySelector('.res'); if (r) { r.className = 'res'; r.textContent = ''; } }

  function init() {
    injectCSS();
    /* 选择题：恢复 + 记录 */
    qs().forEach(function (q) {
      paint(q);
      q.querySelectorAll('.op').forEach(function (b) {
        b.addEventListener('click', function () { record(q, b.getAttribute('data-l')); });
      });
    });
    /* 译文书写作答：恢复 + 保存 */
    document.querySelectorAll('textarea[data-tk]').forEach(function (t) {
      var k = t.getAttribute('data-tk'); if (TXT[k] != null) t.value = TXT[k];
      t.addEventListener('input', function () { TXT[k] = t.value; save(TKEY, TXT); });
    });
    /* 悬浮按钮 + 弹窗 */
    fab = document.createElement('button'); fab.type = 'button'; fab.className = 'kxstatbtn'; document.body.appendChild(fab);
    var modal = document.createElement('div'); modal.id = 'kxstatModal'; document.body.appendChild(modal);
    fab.onclick = function () { modal.style.display = 'flex'; render(); };
    updFab();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
