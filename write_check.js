/* 作文批改：评分点自评（0–5）+ 可选打字区（词数/重复词/连接词/句长自动检查）+ 自查清单。
   考研/四级写作页通用；手写画布保持不变，打字区用于自查与自动检查。 */
(function () {
  if (window.__kxWriteDone) return; window.__kxWriteDone = true;
  var tas = Array.prototype.slice.call(document.querySelectorAll('textarea'));
  var canv = document.querySelector('.wbline,.wbsheet,canvas.wbline,canvas[data-hwkey],.inlwc');
  if (!tas.length && !canv) return;

  var KEY = 'kxwritechk:' + location.pathname;
  var ITEMS = [
    ['content', '内容完整、不跑题', '审题：文体、写作对象、提纲要点是否都覆盖；有无偏题/漏点。'],
    ['struct', '结构清晰（三段/分层）', '引言—主体—结尾；每段有主题句，段落之间不重复。'],
    ['link', '衔接自然', '使用连接词/过渡（however, moreover, therefore…），逻辑顺畅。'],
    ['grammar', '语法准确', '时态一致、主谓一致、单复数、冠词、介词搭配。'],
    ['vary', '句式有变化', '长短句结合、适当从句/非谓语，避免通篇简单句。'],
    ['vocab', '词汇准确且多样', '避免重复用词，用同义替换；拼写正确。'],
    ['format', '格式规范', '书信/通知/图表等格式：称呼、落款、标题、图表描述等。'],
    ['clean', '卷面/书写清楚', '字迹工整、少涂改（手写作答同样适用）。'],
    ['length', '字数达标', '按题目要求（四级约 120–180 词；考研小作文约 100、大作文 160–200 词）。']
  ];
  var RUB = [
    ['content', '内容', '要点齐全、扣题'],
    ['struct', '结构', '段落与逻辑'],
    ['language', '语言', '语法与句子'],
    ['vocab', '词汇', '用词与拼写'],
    ['format', '格式与卷面', '格式规范、书写清楚']
  ];
  var TYPES = { big: ['考研大作文', 20], small: ['考研小作文', 10], cet4: ['四级写作', 15] };
  var CONN = ['however', 'therefore', 'moreover', 'furthermore', 'in addition', 'besides', 'for example', 'for instance', 'as a result', 'on the contrary', 'first', 'second', 'finally', 'in conclusion', 'what is more', 'meanwhile'];

  var ST = {};
  try { ST = JSON.parse(localStorage.getItem(KEY) || '{}') || {}; } catch (e) { ST = {}; }
  if (!ST.chk) ST.chk = {};
  if (!ST.r) ST.r = {};
  if (!ST.type) ST.type = (location.pathname.indexOf('cet4-') === 0) ? 'cet4' : 'big';
  function save() { try { localStorage.setItem(KEY, JSON.stringify(ST)); } catch (e) {} }

  var css = ''
    + '.kxwbtn{position:fixed;left:16px;bottom:66px;z-index:9990;background:#7a2a24;color:#fff;border:none;border-radius:22px;padding:8px 14px;font-size:13px;font-weight:700;cursor:pointer;box-shadow:0 4px 14px rgba(0,0,0,.28)}'
    + '#kxwModal{position:fixed;inset:0;z-index:9996;display:none;align-items:center;justify-content:center;background:rgba(15,22,35,.55);padding:16px}'
    + '#kxwModal .card{background:#fff;border-radius:14px;max-width:680px;width:100%;max-height:90vh;overflow:auto;padding:16px 18px;box-shadow:0 12px 40px rgba(0,0,0,.35)}'
    + '#kxwModal h3{margin:0 0 2px;color:#7a2a24;font-size:18px}'
    + '#kxwModal .lead{color:#6b7280;font-size:12.5px;margin:0 0 8px}'
    + '#kxwModal .box{background:#f4f7fc;border:1px solid #dbe6f3;border-radius:10px;padding:8px 10px;margin:8px 0;font-size:13px;color:#234f7a}'
    + '#kxwModal .box b{font-size:16px;color:#123a6b}'
    + '#kxwModal textarea{width:100%;min-height:110px;border:1px solid #cdd8e6;border-radius:8px;padding:8px;font-size:13px;line-height:1.6;font-family:inherit}'
    + '#kxwModal .rub{display:grid;grid-template-columns:auto 1fr;gap:6px 10px;align-items:center;font-size:13px;margin:4px 0}'
    + '#kxwModal select{border:1px solid #b9c6d2;border-radius:8px;padding:2px 6px}'
    + '#kxwModal ul{list-style:none;margin:0;padding:0}'
    + '#kxwModal li{border-bottom:1px dashed #e6ecf3;padding:6px 0;font-size:13.5px}'
    + '#kxwModal li label{display:flex;gap:8px;align-items:flex-start;cursor:pointer}'
    + '#kxwModal li .tip{display:block;color:#8a94a3;font-size:12px;margin:2px 0 0 24px}'
    + '#kxwModal .bar{display:flex;gap:8px;justify-content:flex-end;margin-top:12px;flex-wrap:wrap}'
    + '#kxwModal .bar button{border:1px solid #b9c6d2;background:#fff;color:#234f7a;border-radius:12px;padding:5px 12px;font-size:13px;cursor:pointer}'
    + '#kxwModal .bar .close{background:#7a2a24;color:#fff;border-color:#7a2a24}'
    + '#kxwModal .grade{font-weight:700;color:#1b7f3b}'
    + 'html.theme-dark #kxwModal .card{background:#151b24;color:#e6e9ef}'
    + 'html.theme-dark #kxwModal .box{background:#16202b;border-color:#2a3342;color:#9fc3ff}'
    + 'html.theme-dark #kxwModal .box b{color:#9fc3ff}'
    + 'html.theme-dark #kxwModal textarea{background:#12181f;color:#e6e9ef;border-color:#2c3442}'
    + '@media print{.kxwbtn,#kxwModal{display:none!important}}';
  function injectCSS() { if (document.getElementById('kxwCSS')) return; var s = document.createElement('style'); s.id = 'kxwCSS'; s.textContent = css; document.head.appendChild(s); }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function words(t) { var m = String(t).trim().match(/[A-Za-z][A-Za-z'\-]*/g); return m ? m : []; }

  function autoCheck(text) {
    var ws = words(text); var n = ws.length;
    var lower = ws.map(function (w) { return w.toLowerCase(); });
    var freq = {}; lower.forEach(function (w) { if (w.length > 3) freq[w] = (freq[w] || 0) + 1; });
    var repeats = Object.keys(freq).filter(function (w) { return freq[w] >= 3; }).sort(function (a, b) { return freq[b] - freq[a]; }).slice(0, 6);
    var conn = CONN.filter(function (c) { return new RegExp('\\b' + c.replace(/ /g, '\\s+') + '\\b', 'i').test(text); });
    var sents = String(text).split(/[.!?]+/).filter(function (s) { return s.trim().length > 0; });
    var avg = sents.length ? Math.round(n / sents.length) : 0;
    return { n: n, repeats: repeats, conn: conn, sents: sents.length, avg: avg };
  }

  function render(modal) {
    var T = TYPES[ST.type] || TYPES.big;
    var text = ST.text || tas.map(function (t) { return t.value; }).join('\n');
    var ac = autoCheck(text);
    var rsum = 0; RUB.forEach(function (r) { rsum += (ST.r[r[0]] || 0); });
    var pctScore = Math.round(rsum / (RUB.length * 5) * 100);
    var grade = pctScore >= 85 ? '优秀' : pctScore >= 70 ? '良好' : pctScore >= 60 ? '及格' : '待提高';
    var est = (pctScore / 100 * T[1]).toFixed(1);

    var html = '<div class="card"><h3>✍️ 作文批改（自评 + 自动检查）</h3>'
      + '<p class="lead">选题型 → 打分（每项 0–5）→ 看估分；可把手写作文打进下方“打字区”做词数/重复/连接词检查。状态自动保存。</p>'
      + '<div class="box">题型 <select id="kxwType">'
      + Object.keys(TYPES).map(function (k) { return '<option value="' + k + '"' + (ST.type === k ? ' selected' : '') + '>' + TYPES[k][0] + '（满分 ' + TYPES[k][1] + '）</option>'; }).join('')
      + '</select>　字数：<b id="kxwN">' + ac.n + '</b> 词（建议 ' + wordRange(ST.type) + '）</div>'
      + '<textarea id="kxwText" placeholder="（可选）在此输入你的作文，用于自动检查…">' + esc(ST.text || '') + '</textarea>'
      + '<div class="box" id="kxwChk">' + checkHTML(ac) + '</div>'
      + '<div class="rub">';
    RUB.forEach(function (r) {
      html += '<span title="' + esc(r[2]) + '">' + esc(r[1]) + '</span><select data-r="' + r[0] + '">'
        + [0, 1, 2, 3, 4, 5].map(function (v) { return '<option value="' + v + '"' + ((ST.r[r[0]] || 0) === v ? ' selected' : '') + '>' + v + '</option>'; }).join('')
        + '</select>';
    });
    html += '</div>'
      + '<div class="box">评分合计：<b id="kxwSum">' + rsum + '</b>/' + (RUB.length * 5)
      + ' · 百分制 <b>' + pctScore + '</b> · 等级 <span class="grade">' + grade + '</span> · 估分 <b>' + est + '</b>/' + T[1] + '</div>'
      + '<ul>';
    ITEMS.forEach(function (it) {
      html += '<li><label><input type="checkbox" data-id="' + it[0] + '"' + (ST.chk[it[0]] ? ' checked' : '') + '><span>' + esc(it[1]) + '</span></label><span class="tip">' + esc(it[2]) + '</span></li>';
    });
    html += '</ul><div class="bar"><button id="kxwReset">重置</button><button id="kxwSave">保存</button><button class="close" id="kxwClose">关闭</button></div></div>';
    modal.innerHTML = html;

    function recompute() {
      var rs = 0; RUB.forEach(function (r) { rs += (ST.r[r[0]] || 0); });
      var pc = Math.round(rs / (RUB.length * 5) * 100);
      var g = pc >= 85 ? '优秀' : pc >= 70 ? '良好' : pc >= 60 ? '及格' : '待提高';
      var TT = TYPES[ST.type] || TYPES.big;
      modal.querySelector('#kxwSum').textContent = rs;
      var bx = modal.querySelectorAll('.box');
      var last = bx[bx.length - 1];
      last.innerHTML = '评分合计：<b>' + rs + '</b>/' + (RUB.length * 5) + ' · 百分制 <b>' + pc + '</b> · 等级 <span class="grade">' + g + '</span> · 估分 <b>' + (pc / 100 * TT[1]).toFixed(1) + '</b>/' + TT[1];
    }
    modal.querySelector('#kxwType').onchange = function () { ST.type = this.value; save(); render(modal); };
    modal.querySelectorAll('select[data-r]').forEach(function (s) { s.onchange = function () { ST.r[s.getAttribute('data-r')] = parseInt(s.value, 10); save(); recompute(); }; });
    modal.querySelectorAll('input[type=checkbox]').forEach(function (c) { c.onchange = function () { ST.chk[c.getAttribute('data-id')] = c.checked; save(); }; });
    var ta = modal.querySelector('#kxwText');
    ta.addEventListener('input', function () {
      ST.text = ta.value; save();
      var a = autoCheck(ta.value);
      modal.querySelector('#kxwN').textContent = a.n;
      modal.querySelector('#kxwChk').innerHTML = checkHTML(a);
    });
    modal.querySelector('#kxwReset').onclick = function () { ST = { chk: {}, r: {}, type: ST.type, text: '' }; save(); render(modal); };
    modal.querySelector('#kxwSave').onclick = function () {
      save();
      try { if (window.KXLOG && window.KXLOG.push) window.KXLOG.push({ d: window.KXLOG.dstr(), t: Date.now(), type: 'write', mod: (location.pathname.indexOf('cet4-') === 0 ? '四级' : '专项·写作'), ok: pctScore }); } catch (e) {}
      var b = modal.querySelector('#kxwSave'); b.textContent = '已保存 ✓'; setTimeout(function () { b.textContent = '保存'; }, 1200);
    };
    modal.querySelector('#kxwClose').onclick = function () { modal.style.display = 'none'; };
    modal.addEventListener('click', function (e) { if (e.target === modal) modal.style.display = 'none'; });
  }
  function wordRange(t) { return t === 'cet4' ? '120–180 词' : t === 'small' ? '约 100 词' : '160–200 词'; }
  function checkHTML(a) {
    var h = '自动检查：词数 <b>' + a.n + '</b> · 句数 <b>' + a.sents + '</b> · 平均句长 <b>' + a.avg + '</b> 词';
    if (a.repeats.length) h += '<br>⚠ 重复用词：' + esc(a.repeats.join('、'));
    if (a.conn.length) h += '<br>✓ 连接词：' + esc(a.conn.join('、')); else h += '<br>⚠ 未见常见连接词，注意段落衔接';
    return h;
  }

  function init() {
    injectCSS();
    var btn = document.createElement('button'); btn.type = 'button'; btn.className = 'kxwbtn'; btn.textContent = '✍️ 作文批改';
    document.body.appendChild(btn);
    var modal = document.createElement('div'); modal.id = 'kxwModal'; document.body.appendChild(modal);
    btn.onclick = function () { modal.style.display = 'flex'; render(modal); };
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
