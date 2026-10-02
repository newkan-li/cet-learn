/* 翻译评分：对照参考译文 + 字数/漏译提示 + 每句自评估分（考研英译中每句 2 分）。
   作用于含 textarea[data-tk] 且同块内有 .ans .cn 参考译文的题块。 */
(function () {
  if (window.__kxTransl) return; window.__kxTransl = true;
  var KS = 'kxscore';
  function load(k, d) { try { var v = JSON.parse(localStorage.getItem(k) || 'null'); return v == null ? d : v; } catch (e) { return d; } }
  function save(k, o) { try { localStorage.setItem(k, JSON.stringify(o)); } catch (e) {} }
  var SC = load(KS, {}) || {};
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function cnLen(s) { return (String(s).match(/[\u4e00-\u9fa5]/g) || []).length; }

  var css = ''
    + '.kxts-bar{background:#eef4ff;border:1px solid #c9dcff;border-radius:10px;padding:8px 12px;margin:10px 0;font-size:13px;color:#2b4059}.kxts-bar b{color:#123a6b}'
    + '.kxts-btn{margin:6px 6px 0 0;border:1px solid #b9c6d2;background:#fff;color:#1f5c8b;border-radius:12px;padding:4px 12px;cursor:pointer;font-size:12.5px}'
    + '.kxts-panel{border:1px solid #dbe6f3;background:#fbfdff;border-radius:10px;padding:10px 12px;margin:6px 0;font-size:13px}'
    + '.kxts-panel .row{display:flex;gap:12px;flex-wrap:wrap}.kxts-panel .col{flex:1;min-width:220px}'
    + '.kxts-panel .txt{border:1px dashed #cdd8e6;border-radius:8px;padding:6px 8px;margin-top:3px;white-space:pre-wrap;line-height:1.6;color:#33456a}'
    + '.kxts-panel .meta{color:#6b7280;font-size:12.5px}'
    + '.kxts-panel select{border:1px solid #b9c6d2;border-radius:8px;padding:2px 6px}'
    + '.kxts-panel .kxts-save{border:1px solid #b9c6d2;background:#fff;color:#1f5c8b;border-radius:10px;padding:2px 10px;cursor:pointer}'
    + '.kxts-msg{color:#1b7f3b}'
    + 'html.theme-dark .kxts-bar{background:#16202b;border-color:#2a3342;color:#9fc3ff}'
    + 'html.theme-dark .kxts-panel{background:#141b24;border-color:#2a3342;color:#dbe3ee}'
    + 'html.theme-dark .kxts-panel .txt{color:#dbe3ee;border-color:#2a3342}'
    + '@media print{.kxts-btn,.kxts-bar{display:none}}';
  function injectCSS() { if (document.getElementById('kxtsCSS')) return; var s = document.createElement('style'); s.id = 'kxtsCSS'; s.textContent = css; document.head.appendChild(s); }

  function summary() {
    var tot = 0, n = 0;
    document.querySelectorAll('textarea[data-tk]').forEach(function (ta) {
      var s = SC[ta.getAttribute('data-tk')]; if (s && s.s != null) { n++; tot += s.s; }
    });
    var el = document.getElementById('kxtsSum'); if (el) el.textContent = '本页已评分 ' + n + ' 句 · 估分 ' + tot + ' 分（满分 ' + n * 2 + '）';
  }

  function build(q) {
    if (q.getAttribute('data-kxs')) return;
    var ta = q.querySelector('textarea[data-tk]'); if (!ta) return;
    q.setAttribute('data-kxs', '1');
    var cnEl = q.querySelector('.ans .cn');
    var stem = (q.querySelector('.stem') || {}).textContent || '';
    var tk = ta.getAttribute('data-tk');
    var btn = document.createElement('button'); btn.type = 'button'; btn.className = 'kxts-btn'; btn.textContent = '📊 对照评分';
    (ta.parentNode).insertBefore(btn, ta.nextSibling);
    var panel = document.createElement('div'); panel.className = 'kxts-panel'; panel.style.display = 'none';
    (btn.parentNode).insertBefore(panel, btn.nextSibling);
    btn.addEventListener('click', function () {
      panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
      if (panel.style.display === 'none') return;
      var ref = cnEl ? (cnEl.textContent || '').trim() : '（无参考译文）';
      var mine = (ta.value || '').trim();
      var myn = cnLen(mine), refn = cnLen(ref), ratio = refn ? Math.round(myn * 100 / refn) : 0;
      var nums = stem.match(/\b\d[\d.,%]*\b/g) || [];
      var miss = nums.filter(function (n) { return mine.indexOf(n) < 0; });
      var cur = (SC[tk] && SC[tk].s != null) ? String(SC[tk].s) : '';
      var opt = function (v, label) { return '<option value="' + v + '"' + (cur === String(v) ? ' selected' : '') + '>' + label + '</option>'; };
      panel.innerHTML =
        '<div class="row"><div class="col"><b>你的译文</b><div class="txt">' + esc(mine || '（空）') + '</div></div>'
        + '<div class="col"><b>参考译文</b><div class="txt">' + esc(ref) + '</div></div></div>'
        + '<p class="meta">字数：你 ' + myn + ' 字 / 参考 ' + refn + ' 字（' + ratio + '%）' + (miss.length ? ('　⚠ 可能漏译：' + esc(miss.join('、'))) : '') + '</p>'
        + '<p>本句自评（每句满分 2 分）：<select class="kxts-s">' + opt('', '—') + opt(2, '2 准确通顺') + opt(1, '1 基本达意') + opt(0, '0 明显错误/漏译') + '</select> '
        + '<button type="button" class="kxts-save">保存</button> <span class="kxts-msg"></span></p>';
      panel.querySelector('.kxts-save').onclick = function () {
        var v = panel.querySelector('.kxts-s').value; if (v === '') return;
        SC[tk] = SC[tk] || {}; SC[tk].s = parseInt(v, 10); save(KS, SC);
        panel.querySelector('.kxts-msg').textContent = '已保存 ✓';
        try { if (window.KXLOG && window.KXLOG.push) window.KXLOG.push({ d: window.KXLOG.dstr(), t: Date.now(), type: 'transl', mod: '专项·翻译', ok: parseInt(v, 10) }); } catch (e) {}
        summary();
      };
    });
  }

  function init() {
    injectCSS();
    var wrap = document.querySelector('.wrap') || document.body;
    var bar = document.createElement('div'); bar.className = 'kxts-bar'; bar.innerHTML = '📝 翻译评分：逐句点「对照评分」看参考译文、查漏译并自评估分。 <span id="kxtsSum"></span>';
    wrap.insertBefore(bar, wrap.firstChild);
    document.querySelectorAll('.q').forEach(build);
    summary();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
