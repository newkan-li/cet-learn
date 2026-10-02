/* 作文批改清单：按评分点自查 + 作文字数实时统计（考研/四级写作页通用）。
   页面存在 textarea / 手写作答区(如 .wbline,.wbsheet,canvas[data-key]) 时启用。 */
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
    ['length', '字数达标', '按题目要求（四级约 120–180 词；考研小作文约 100 词、大作文 160–200 词）。']
  ];
  function load() { try { return JSON.parse(localStorage.getItem(KEY) || '{}') || {}; } catch (e) { return {}; } }
  function save(o) { try { localStorage.setItem(KEY, JSON.stringify(o)); } catch (e) {} }
  var ST = load();

  var css = ''
    + '.kxwbtn{position:fixed;left:16px;bottom:66px;z-index:9990;background:#7a2a24;color:#fff;border:none;border-radius:22px;padding:8px 14px;font-size:13px;font-weight:700;cursor:pointer;box-shadow:0 4px 14px rgba(0,0,0,.28)}'
    + '#kxwModal{position:fixed;inset:0;z-index:9996;display:none;align-items:center;justify-content:center;background:rgba(15,22,35,.55);padding:16px}'
    + '#kxwModal .card{background:#fff;border-radius:14px;max-width:640px;width:100%;max-height:88vh;overflow:auto;padding:16px 18px;box-shadow:0 12px 40px rgba(0,0,0,.35)}'
    + '#kxwModal h3{margin:0 0 2px;color:#7a2a24;font-size:18px}'
    + '#kxwModal .lead{color:#6b7280;font-size:12.5px;margin:0 0 8px}'
    + '#kxwModal ul{list-style:none;margin:0;padding:0}'
    + '#kxwModal li{border-bottom:1px dashed #e6ecf3;padding:7px 0;font-size:13.5px}'
    + '#kxwModal li label{display:flex;gap:8px;align-items:flex-start;cursor:pointer}'
    + '#kxwModal li input{margin-top:3px}'
    + '#kxwModal li .tip{display:block;color:#8a94a3;font-size:12px;margin:2px 0 0 24px}'
    + '#kxwModal .wc{background:#f4f7fc;border:1px solid #dbe6f3;border-radius:10px;padding:8px 10px;margin:8px 0;font-size:13px;color:#234f7a}'
    + '#kxwModal .wc b{font-size:18px;color:#123a6b}'
    + '#kxwModal .bar{display:flex;gap:8px;justify-content:flex-end;margin-top:12px;flex-wrap:wrap}'
    + '#kxwModal .bar button{border:1px solid #b9c6d2;background:#fff;color:#234f7a;border-radius:12px;padding:5px 12px;font-size:13px;cursor:pointer}'
    + '#kxwModal .bar .close{background:#7a2a24;color:#fff;border-color:#7a2a24}'
    + 'html.theme-dark #kxwModal .card{background:#151b24;color:#e6e9ef}'
    + 'html.theme-dark #kxwModal .wc{background:#16202b;border-color:#2a3342;color:#9fc3ff}'
    + 'html.theme-dark #kxwModal .wc b{color:#9fc3ff}'
    + '@media print{.kxwbtn,#kxwModal{display:none!important}}';
  function injectCSS() { if (document.getElementById('kxwCSS')) return; var s = document.createElement('style'); s.id = 'kxwCSS'; s.textContent = css; document.head.appendChild(s); }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function wc(t) { var m = String(t).trim().match(/[A-Za-z][A-Za-z'\-]*/g); return m ? m.length : 0; }

  function render(modal) {
    var total = 0; tas.forEach(function (t) { total += wc(t.value); });
    var html = '<div class="card"><h3>✍️ 作文批改清单（按评分点自查）</h3>'
      + '<p class="lead">逐项对照打分；全部勾选基本达线。可随时保存，返回自动恢复。</p>';
    if (tas.length) html += '<div class="wc">当前作文词数：<b>' + total + '</b> 词<br><span style="color:#8a94a3;font-size:12px">四级约 120–180；考研小作文约 100、大作文 160–200（以题目要求为准）。</span></div>';
    else html += '<div class="wc">手写作答区（无文本统计）：请按清单逐项自查。</div>';
    html += '<ul>';
    ITEMS.forEach(function (it) {
      html += '<li><label><input type="checkbox" data-id="' + it[0] + '"' + (ST[it[0]] ? ' checked' : '') + '><span>' + esc(it[1]) + '</span></label><span class="tip">' + esc(it[2]) + '</span></li>';
    });
    html += '</ul><div class="bar"><button id="kxwReset">重置</button><button class="close" id="kxwClose">关闭</button></div></div>';
    modal.innerHTML = html;
    modal.querySelectorAll('input[type=checkbox]').forEach(function (c) {
      c.onchange = function () { ST[c.getAttribute('data-id')] = c.checked; save(ST); };
    });
    modal.querySelector('#kxwReset').onclick = function () { ST = {}; save(ST); render(modal); };
    modal.querySelector('#kxwClose').onclick = function () { modal.style.display = 'none'; };
    modal.addEventListener('click', function (e) { if (e.target === modal) modal.style.display = 'none'; });
  }

  function init() {
    injectCSS();
    var btn = document.createElement('button'); btn.type = 'button'; btn.className = 'kxwbtn'; btn.textContent = '✍️ 作文自查';
    document.body.appendChild(btn);
    var modal = document.createElement('div'); modal.id = 'kxwModal'; document.body.appendChild(modal);
    btn.onclick = function () { modal.style.display = 'flex'; render(modal); };
    if (tas.length) {
      var t0 = tas[0];
      t0.addEventListener('input', function () { if (modal.style.display === 'flex') { var w = modal.querySelector('.wc b'); if (w) w.textContent = wc(tas.map(function (t) { return t.value; }).join(' ')); } });
    }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
