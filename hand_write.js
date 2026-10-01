/* iPad/手写引擎（考研写作）：canvas.hwcanvas[data-key] 支持触控笔/手指书写，笔迹本地保存。 */
(function () {
  if (window.__hwDone) return; window.__hwDone = true;
  var KEY = 'kxhw:';
  function save(k, c) { try { localStorage.setItem(KEY + k, c.toDataURL('image/png')); } catch (e) {} }
  function load(k) { try { return localStorage.getItem(KEY + k) || ''; } catch (e) { return ''; } }
  function restore(k, c) {
    var d = load(k); if (!d) return; var im = new Image();
    im.onload = function () { try { var x = c.getContext('2d'); x.drawImage(im, 0, 0, c.width, c.height); } catch (e) {} };
    im.src = d;
  }
  function bind(c) {
    var k = c.getAttribute('data-key'); if (!k) return;
    var drawing = false, last = null, eraser = false, ctx = c.getContext('2d');
    c._hwEraser = false;
    function pos(ev) { var r = c.getBoundingClientRect(); return { x: (ev.clientX - r.left) * c.width / r.width, y: (ev.clientY - r.top) * c.height / r.height }; }
    function style() { ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.lineWidth = eraser ? Math.max(18, c.height / 12) : Math.max(2, c.height / 90); ctx.strokeStyle = eraser ? '#fffdf7' : '#123a6b'; }
    c.addEventListener('pointerdown', function (ev) {
      if (ev.button !== undefined && ev.button > 0) return;
      drawing = true; style(); last = pos(ev);
      try { c.setPointerCapture(ev.pointerId); } catch (e) {}
      ev.preventDefault();
    });
    c.addEventListener('pointermove', function (ev) {
      if (!drawing) return; var p = pos(ev); ctx.beginPath(); ctx.moveTo(last.x, last.y); ctx.lineTo(p.x, p.y); ctx.stroke(); last = p; ev.preventDefault();
    });
    function up(ev) { if (!drawing) return; drawing = false; save(k, c); try { if (ev && ev.pointerId != null) c.releasePointerCapture(ev.pointerId); } catch (e) {} }
    c.addEventListener('pointerup', up); c.addEventListener('pointercancel', up); c.addEventListener('pointerleave', up);
    c._hwClear = function () { ctx.clearRect(0, 0, c.width, c.height); save(k, c); };
    c._hwSetEraser = function (on) { eraser = !!on; };
    restore(k, c);
  }

  var css = ''
    + '.hw{margin:10px 0;border:1px solid #e4ddcd;border-radius:10px;padding:8px 12px;background:#fffdf8}'
    + '.hw .hwstep{font-weight:700;color:#123a6b;margin:0 0 4px}'
    + '.hw .hwtpl{color:#6b7280;font-size:13px;margin:0 0 6px}'
    + 'canvas.hwcanvas{display:block;width:100%;height:auto;border:1.5px dashed #b9c6d2;border-radius:8px;background:#fffdf7;touch-action:none;cursor:crosshair}'
    + 'canvas.hwcanvas.tall{min-height:340px}'
    + '.hw .hwtool{display:flex;gap:8px;margin-top:6px;flex-wrap:wrap}'
    + '.hw .hwtool button{border:1px solid #b9c6d2;background:#fff;color:#234f7a;border-radius:14px;padding:3px 12px;font-size:12.5px;cursor:pointer}'
    + '.hw .hwtool button.on{background:#c0392b;color:#fff;border-color:#c0392b}'
    + 'html.theme-dark .hw{background:#151b24;border-color:#2c3442}'
    + 'html.theme-dark .hw .hwstep{color:#9fc3ff}'
    + 'html.theme-dark canvas.hwcanvas{background:#f6f3e9}'
    + 'html.theme-dark .hw .hwtool button{background:#1a212b;color:#dbe3ee;border-color:#2c3442}'
    + '@media print{.hw .hwtool{display:none}canvas.hwcanvas{background:#fff!important}}';

  function injectCSS() { if (document.getElementById('hwCSS')) return; var s = document.createElement('style'); s.id = 'hwCSS'; s.textContent = css; document.head.appendChild(s); }
  function init() {
    injectCSS();
    document.querySelectorAll('canvas.hwcanvas[data-key]').forEach(bind);
    document.querySelectorAll('.hw').forEach(function (box) {
      var c = box.querySelector('canvas.hwcanvas'); if (!c) return;
      box.querySelectorAll('.hwtool button').forEach(function (b) {
        var act = b.getAttribute('data-act');
        b.onclick = function () {
          if (act === 'clear') c._hwClear();
          else if (act === 'eraser') { var on = !c._hwEraser; c._hwEraser = on; c._hwSetEraser(on); b.classList.toggle('on', on); b.textContent = '橡皮：' + (on ? '开' : '关'); }
        };
      });
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
