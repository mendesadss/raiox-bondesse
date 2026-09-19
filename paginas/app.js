/* RAIO-X · ENTREGA V3 · interações
   Tudo aqui é progressivo: a página lê inteira sem JS.
   1. menu lateral no celular       2. portões G1-G7 (detalhe no lugar)
   3. drawer de prova (foco preso, Esc, foco de volta)
   4. abas por produto              5. checklist persistente (localStorage)
   6. copiar prompt                 7. sumário da tela acompanha a rolagem
   8. blueprint: escala só os frames de desktop */
(function () {
  'use strict';
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  /* 1. menu lateral (celular) */
  var side = $('.side'), bd = $('.side-bd'), menuBtn = $('.topbar .menu');
  function closeSide() { if (side) side.classList.remove('open'); if (bd) bd.classList.remove('open'); if (menuBtn) menuBtn.setAttribute('aria-expanded', 'false'); }
  if (menuBtn && side) {
    menuBtn.addEventListener('click', function () {
      var open = !side.classList.contains('open');
      side.classList.toggle('open', open); if (bd) bd.classList.toggle('open', open);
      menuBtn.setAttribute('aria-expanded', String(open));
    });
    if (bd) bd.addEventListener('click', closeSide);
    $$('.side nav a').forEach(function (a) { a.addEventListener('click', closeSide); });
  }

  /* 2. portões */
  $$('.gates').forEach(function (row) {
    var gates = $$('.gate', row);
    var detail = document.getElementById(row.getAttribute('data-detail'));
    if (!detail) return;
    var data = {};
    try { data = JSON.parse(detail.getAttribute('data-gates') || '{}'); } catch (e) {}
    function show(id) {
      var g = data[id]; if (!g) return;
      gates.forEach(function (b) { b.setAttribute('aria-selected', String(b.getAttribute('data-gate') === id)); });
      detail.hidden = false;
      $('.q', detail).textContent = g.q;
      $('.o', detail).innerHTML = g.o;
      $('.src', detail).innerHTML = g.src;
      $('.state', detail).innerHTML = g.state;
      $('.gd-code', detail).textContent = id + ' · ' + g.nome;
      if (location.hash !== '#' + id) history.replaceState(null, '', '#' + id);
    }
    gates.forEach(function (b) { b.addEventListener('click', function () { show(b.getAttribute('data-gate')); }); });
    var first = location.hash.slice(1);
    show(data[first] ? first : gates[0].getAttribute('data-gate'));
  });

  /* 3. drawer de prova */
  var drawer = $('#drawer');
  var lastFocus = null;
  function focusables(root) { return $$('button,[href],input,select,textarea,[tabindex]:not([tabindex="-1"])', root).filter(function (el) { return !el.hidden && el.offsetParent !== null; }); }
  function closeDrawer() {
    if (!drawer || !drawer.hasAttribute('open')) return;
    drawer.removeAttribute('open'); document.body.style.overflow = '';
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }
  function openDrawer(html, opener) {
    if (!drawer) return;
    lastFocus = opener || document.activeElement;
    $('.content', drawer).innerHTML = html;
    drawer.setAttribute('open', ''); document.body.style.overflow = 'hidden';
    setTimeout(function () { var f = focusables($('.panel', drawer)); if (f.length) f[0].focus(); }, 30);
  }
  if (drawer) {
    $('.bd', drawer).addEventListener('click', closeDrawer);
    $$('.close', drawer).forEach(function (b) { b.addEventListener('click', closeDrawer); });
    document.addEventListener('keydown', function (e) {
      if (!drawer.hasAttribute('open')) return;
      if (e.key === 'Escape') { e.preventDefault(); closeDrawer(); return; }
      if (e.key === 'Tab') {
        var f = focusables($('.panel', drawer)); if (!f.length) return;
        var first = f[0], last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    });
    document.addEventListener('click', function (e) {
      var b = e.target.closest('[data-proof]'); if (!b) return;
      var tpl = document.getElementById(b.getAttribute('data-proof')); if (!tpl) return;
      openDrawer(tpl.innerHTML, b);
    });
    drawer.addEventListener('click', function (e) { if (e.target.closest('[data-close]')) closeDrawer(); });
  }

  /* 4. abas */
  $$('[role="tablist"]').forEach(function (list) {
    var tabs = $$('[role="tab"]', list);
    function open(id, focus) {
      tabs.forEach(function (t) {
        var on = t.getAttribute('aria-controls') === id;
        t.setAttribute('aria-selected', String(on)); t.tabIndex = on ? 0 : -1;
        var p = document.getElementById(t.getAttribute('aria-controls')); if (p) p.hidden = !on;
        if (on && focus) t.focus();
      });
      if (list.hasAttribute('data-hash') && location.hash !== '#' + id) history.replaceState(null, '', '#' + id);
    }
    tabs.forEach(function (t, i) {
      t.addEventListener('click', function () { open(t.getAttribute('aria-controls')); });
      t.addEventListener('keydown', function (e) {
        var d = e.key === 'ArrowRight' || e.key === 'ArrowDown' ? 1 : e.key === 'ArrowLeft' || e.key === 'ArrowUp' ? -1 : 0;
        if (!d) return; e.preventDefault();
        open(tabs[(i + d + tabs.length) % tabs.length].getAttribute('aria-controls'), true);
      });
    });
    var h = location.hash.slice(1);
    var hit = tabs.filter(function (t) { return t.getAttribute('aria-controls') === h; })[0];
    open((hit || tabs[0]).getAttribute('aria-controls'));
  });

  /* 5. checklist persistente por pesquisa */
  $$('.check[data-key]').forEach(function (ul) {
    var key = 'raiox:' + ul.getAttribute('data-key');
    var saved = {}; try { saved = JSON.parse(localStorage.getItem(key) || '{}'); } catch (e) {}
    var sum = ul.nextElementSibling && ul.nextElementSibling.classList.contains('check-sum') ? ul.nextElementSibling : null;
    var boxes = $$('input[type="checkbox"]', ul);
    function render() {
      var n = 0;
      boxes.forEach(function (b) { b.closest('li').classList.toggle('done', b.checked); if (b.checked) n++; });
      if (sum) sum.textContent = n + ' de ' + boxes.length + ' concluídos' + (n === boxes.length ? ' · lista fechada' : '');
    }
    boxes.forEach(function (b) {
      if (saved[b.value]) b.checked = true;
      b.addEventListener('change', function () {
        saved[b.value] = b.checked; try { localStorage.setItem(key, JSON.stringify(saved)); } catch (e) {}
        render();
      });
    });
    render();
  });

  /* 6. copiar prompt */
  document.addEventListener('click', function (e) {
    var b = e.target.closest('.cp'); if (!b) return;
    var box = b.closest('.pbody'); if (!box) return;
    var text = box.getAttribute('data-text') || box.textContent.replace(/^\s*Copiar\s*/, '').trim();
    var done = function () { var old = b.textContent; b.textContent = 'Copiado'; setTimeout(function () { b.textContent = old; }, 1400); };
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(done, done); else done();
  });

  /* 7. sumário acompanha a rolagem */
  var toc = $('.toc');
  if (toc && 'IntersectionObserver' in window) {
    var links = $$('a[href^="#"]', toc);
    var map = {}; links.forEach(function (a) { map[a.getAttribute('href').slice(1)] = a; });
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        links.forEach(function (a) { a.classList.remove('on'); });
        var a = map[en.target.id]; if (a) a.classList.add('on');
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    Object.keys(map).forEach(function (id) { var el = document.getElementById(id); if (el) io.observe(el); });
  }

  /* 8. blueprint: só os frames desktop escalam (1280 -> coluna) */
  function fit() {
    $$('.bpv .shotf.desk').forEach(function (sh) {
      var base = +sh.getAttribute('data-base'), w = sh.clientWidth, h = sh.clientHeight;
      if (!w || !h) return;
      var s = w / base, ifr = sh.querySelector('iframe'); if (!ifr) return;
      ifr.style.width = base + 'px'; ifr.style.height = Math.ceil(h / s) + 'px';
      ifr.style.transform = 'scale(' + s + ')'; ifr.style.transformOrigin = 'top left';
    });
  }
  window.addEventListener('load', fit); window.addEventListener('resize', fit);
  setTimeout(fit, 250); setTimeout(fit, 900);
})();
