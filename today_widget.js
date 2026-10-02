/* 首页/资料中心「今日打卡」提醒条：读取任务清单(kytasks)的今日进度与连续天数。 */
(function () {
  var o = {};
  try { o = JSON.parse(localStorage.getItem('kytasks') || '{}') || {}; } catch (e) {}
  var DU = o.DU || {}, HIST = o.HIST || {};
  function p(n) { return (n < 10 ? '0' : '') + n; }
  function dk(d) { d = d || new Date(); return d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate()); }
  var ids = ['d1', 'd2', 'd3', 'd4'], ds = DU[dk()] || {}, n = 0;
  ids.forEach(function (i) { if (ds[i]) n++; });
  var s = 0, d = new Date();
  if (!HIST[dk(d)]) d.setDate(d.getDate() - 1);
  while (HIST[dk(d)]) { s++; d.setDate(d.getDate() - 1); }
  var done = n === ids.length;
  var link = (location.pathname.indexOf('/study/') === 0) ? 'https://newkan-li.github.io/cet-learn/kaoyan-tasks.html' : 'kaoyan-tasks.html';
  var box = document.createElement('div');
  box.style.cssText = 'margin:14px 0;background:' + (done ? '#eaf6ee' : '#fff7e6') + ';border:1px solid ' + (done ? '#bfe3cc' : '#e8d3a3') + ';border-radius:12px;padding:10px 14px;font-size:13.5px';
  box.innerHTML = '📅 今日学习任务 <b>' + n + '/' + ids.length + '</b> 完成 · 连续打卡 <b>' + s + '</b> 天 ' +
    (done ? '🎉 已全部完成' : '<a href="' + link + '" style="color:#a3341e;font-weight:700;text-decoration:underline">去打卡 →</a>');
  var h = document.querySelector('h1');
  if (h && h.parentNode) h.parentNode.insertBefore(box, h.nextSibling);
  else document.body.insertBefore(box, document.body.firstChild);
})();
