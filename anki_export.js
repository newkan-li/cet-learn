/* Build a real Anki .apkg (SQLite collection.anki2 + store ZIP). Works in browser and Node. */
var KX_ANKI_BUILD = (function () {
  var SCHEMA = "CREATE TABLE col (id integer primary key, crt integer not null, mod integer not null, scm integer not null, ver integer not null, dty integer not null, usn integer not null, ls integer not null, conf text not null, models text not null, decks text not null, dconf text not null, tags text not null);\n"
    + "CREATE TABLE notes (id integer primary key, guid text not null, mid integer not null, mod integer not null, usn integer not null, tags text not null, flds text not null, sfld integer not null, csum integer not null, flags integer not null, data text not null);\n"
    + "CREATE TABLE cards (id integer primary key, nid integer not null, did integer not null, ord integer not null, mod integer not null, usn integer not null, type integer not null, queue integer not null, due integer not null, ivl integer not null, factor integer not null, reps integer not null, lapses integer not null, left integer not null, odue integer not null, odid integer not null, flags integer not null, data text not null);\n"
    + "CREATE TABLE revlog (id integer primary key, cid integer not null, usn integer not null, ease integer not null, ivl integer not null, lastIvl integer not null, factor integer not null, time integer not null, type integer not null);\n"
    + "CREATE TABLE graves (usn integer not null, oid integer not null, type integer not null);\n"
    + "CREATE INDEX ix_notes_usn on notes (usn); CREATE INDEX ix_cards_usn on cards (usn); CREATE INDEX ix_revlog_usn on revlog (usn); CREATE INDEX ix_cards_nid on cards (nid); CREATE INDEX ix_cards_sched on cards (did, queue, due); CREATE INDEX ix_revlog_cid on revlog (cid); CREATE INDEX ix_notes_csum on notes (csum);";

  var CONF = '{"activeDecks":[1],"addToCur":true,"collapseTime":1200,"curDeck":1,"curModel":"1700000000002","dueCounts":true,"estTimes":true,"newBury":true,"newSpread":0,"nextPos":1,"sortBackwards":false,"sortType":"noteFld","timeLim":0}';
  var DCONF = '{"1":{"autoplay":true,"id":1,"lapse":{"delays":[10],"leechAction":0,"leechFails":8,"minInt":1,"mult":0},"maxTaken":60,"mod":0,"name":"Default","new":{"bury":true,"delays":[1,10],"initialFactor":2500,"ints":[1,4,7],"order":1,"perDay":20,"separate":true},"replayq":true,"rev":{"bury":true,"ease4":1.3,"fuzz":0.05,"ivlFct":1,"maxIvl":36500,"minSpace":1,"perDay":100},"timer":0,"usn":0}}';
  var LATEX_PRE = "\\documentclass[12pt]{article}\\special{papersize=3in,5in}\\usepackage[utf8]{inputenc}\\usepackage{amssymb,amsmath}\\pagestyle{empty}\\setlength{\\parindent}{0in}\\begin{document}";
  var LATEX_POST = "\\end{document}";

  function esc(s) { return String(s).replace(/'/g, "''"); }

  function buildApkg(SQL, entries, deckName, modelName) {
    var ts = Math.floor(Date.now() / 1000);
    var deckId = 1700000000001, modelId = "1700000000002";
    var db = new SQL.Database();
    db.run(SCHEMA);
    var colSql = "INSERT INTO col VALUES(null,1411124400,1425279151694,1425279151690,11,0,0,0,'" + esc(CONF) + "','{}','{}','" + esc(DCONF) + "','{}');";
    db.run(colSql);
    var deck = { collapsed: false, conf: 1, desc: "", dyn: 0, extendNew: 0, extendRev: 50, id: deckId, lrnToday: [0, 0], mod: ts, name: deckName, newToday: [0, 0], revToday: [0, 0], timeToday: [0, 0], usn: -1 };
    db.run("UPDATE col SET decks=?", [JSON.stringify((function(){var o={};o[String(deckId)]=deck;return o;})())]);
    function fld(name, ord) { return { name: name, ord: ord, sticky: false, rtl: false, font: "Liberation Sans", size: 20, media: [] }; }
    var tmpl = { name: "Card 1", ord: 0, qfmt: "{{Front}}", afmt: "{{FrontSide}}\n\n<hr id=answer>\n\n{{Back}}", bafmt: "", bqfmt: "", bfont: "", bsize: 0, did: null };
    var model = { css: ".card{font-family:arial;font-size:18px;text-align:left;color:black;background:white}", did: deckId, flds: [fld("Front", 0), fld("Back", 1)], id: modelId, latexPost: LATEX_POST, latexPre: LATEX_PRE, latexsvg: false, mod: ts, name: modelName, req: [[0, "all", [0]]], sortf: 0, tags: [], tmpls: [tmpl], type: 0, usn: -1, vers: [] };
    db.run("UPDATE col SET models=?", [JSON.stringify((function(){var o={};o[modelId]=model;return o;})())]);
    var base = Date.now() * 1000, due = 1;
    entries.forEach(function (e, i) {
      var front = e.w + (e.ipa ? (" [" + e.ipa + "]") : "");
      var back = e.cn || "";
      var flds = front + "\x1f" + back;
      var nid = base + i * 2;
      var cid = nid + 1;
      var guid = "kx" + i + "_" + Math.random().toString(36).slice(2, 10);
      db.run("INSERT INTO notes VALUES(?,?,?,?,?,?,?,?,?,?,?)", [nid, guid, Number(modelId), ts, -1, " ", flds, front, 0, 0, ""]);
      db.run("INSERT INTO cards VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)", [cid, nid, deckId, 0, ts, -1, 0, 0, due, 0, 0, 0, 0, 0, 0, 0, 0, ""]);
      due++;
    });
    var bytes = db.export();
    db.close();
    return zipStore([
      { name: "collection.anki2", data: bytes },
      { name: "media", data: utf8("{}") }
    ]);
  }

  function utf8(s) { return new TextEncoder().encode(s); }
  var CRC = (function () { var t = []; for (var n = 0; n < 256; n++) { var c = n; for (var k = 0; k < 8; k++) c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1); t[n] = c >>> 0; } return t; })();
  function crc32(buf) { var c = 0xFFFFFFFF; for (var i = 0; i < buf.length; i++) c = CRC[(c ^ buf[i]) & 0xFF] ^ (c >>> 8); return (c ^ 0xFFFFFFFF) >>> 0; }
  function u16(n) { return [n & 255, (n >> 8) & 255]; }
  function u32(n) { return [n & 255, (n >>> 8) & 255, (n >>> 16) & 255, (n >>> 24) & 255]; }

  function zipStore(files) {
    var parts = [], central = [], offset = 0;
    files.forEach(function (f) {
      var name = utf8(f.name), data = f.data, crc = crc32(data);
      var lh = [].concat(u32(0x04034b50), u16(20), u16(0), u16(0), u16(0), u16(0), u32(crc), u32(data.length), u32(data.length), u16(name.length), u16(0));
      parts.push(new Uint8Array(lh), name, data);
      central.push({ name: name, crc: crc, len: data.length, offset: offset });
      offset += lh.length + name.length + data.length;
    });
    var cdStart = offset, cdParts = [];
    central.forEach(function (c) {
      var h = [].concat(u32(0x02014b50), u16(20), u16(20), u16(0), u16(0), u16(0), u16(0), u32(c.crc), u32(c.len), u32(c.len), u16(c.name.length), u16(0), u16(0), u16(0), u16(0), u32(0), u32(c.offset));
      cdParts.push(new Uint8Array(h), c.name);
      cdStart += h.length + c.name.length;
    });
    var cdSize = cdStart - offset;
    var eocd = new Uint8Array([].concat(u32(0x06054b50), u16(0), u16(0), u16(central.length), u16(central.length), u32(cdSize), u32(offset), u16(0)));
    var all = parts.concat(cdParts, [eocd]);
    var total = all.reduce(function (s, a) { return s + a.length; }, 0);
    var out = new Uint8Array(total), p = 0;
    all.forEach(function (a) { out.set(a, p); p += a.length; });
    return out;
  }

  return { buildApkg: buildApkg };
})();
if (typeof module !== 'undefined' && module.exports) module.exports = KX_ANKI_BUILD;

/* 浏览器入口：window.KX_ANKI.export(book, opts) → 生成并下载 .apkg */
(function () {
  if (typeof window === 'undefined') return;
  var SQLP = null;
  function init() {
    if (SQLP) return SQLP;
    SQLP = new Promise(function (res, rej) {
      function go() { window.initSqlJs({ locateFile: function (f) { return f; } }).then(res, rej); }
      if (window.initSqlJs) { go(); return; }
      var s = document.createElement('script'); s.src = 'sql-wasm.js';
      s.onload = go; s.onerror = function () { rej(new Error('sql-wasm.js 加载失败')); };
      document.head.appendChild(s);
    });
    return SQLP;
  }
  window.KX_ANKI = {
    export: function (book, opts) {
      opts = opts || {};
      return init().then(function (SQL) {
        var bytes = KX_ANKI_BUILD.buildApkg(SQL, book, opts.deck || '考研英语生词', opts.model || '英语生词');
        var blob = new Blob([bytes], { type: 'application/octet-stream' });
        var a = document.createElement('a'); a.href = URL.createObjectURL(blob);
        a.download = opts.name || '英语生词.apkg'; document.body.appendChild(a); a.click();
        setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 5000);
        return bytes.length;
      });
    }
  };
})();
