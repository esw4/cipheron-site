/* CipherON site: small, dependency-free 3D interactions. */
(function () {
  'use strict';
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  /* ---------- reveal on scroll ---------- */
  var rv = $$('.rv');
  if ('IntersectionObserver' in window && !reduce) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
    }, { threshold: 0.12 });
    rv.forEach(function (el) { io.observe(el); });
  } else { rv.forEach(function (el) { el.classList.add('in'); }); }

  /* ---------- counters ---------- */
  var counters = $$('.fact b');
  function runCounter(el) {
    var end = +el.getAttribute('data-n'), suf = el.getAttribute('data-suf') || '';
    if (reduce || end === 0) { el.textContent = end + suf; return; }
    var t0 = null;
    (function step(t) {
      if (t0 === null) t0 = t;
      var p = Math.min(1, (t - t0) / 1100);
      el.textContent = Math.round(end * (1 - Math.pow(1 - p, 3))) + suf;
      if (p < 1) requestAnimationFrame(step);
    })(performance.now());
  }
  if ('IntersectionObserver' in window) {
    var co = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { runCounter(e.target); co.unobserve(e.target); } });
    }, { threshold: 0.6 });
    counters.forEach(function (c) { co.observe(c); });
  } else { counters.forEach(runCounter); }

  /* ---------- hero: tilt with the pointer, drift with scroll ---------- */
  var stack = $('#stack');
  if (stack && !reduce) {
    var stage = stack.parentNode, ry = 0, rx = 0, sc = 0;
    var apply = function () { stack.style.transform = 'rotateX(' + (rx + sc * 0.02) + 'deg) rotateY(' + ry + 'deg) translateY(' + (sc * -0.08) + 'px)'; };
    stage.addEventListener('pointermove', function (e) {
      var b = stage.getBoundingClientRect();
      ry = ((e.clientX - b.left) / b.width - 0.5) * 26;
      rx = ((e.clientY - b.top) / b.height - 0.5) * -14;
      apply();
    });
    stage.addEventListener('pointerleave', function () { ry = 0; rx = 0; apply(); });
    window.addEventListener('scroll', function () { sc = Math.min(window.scrollY, 600); apply(); }, { passive: true });
  }

  /* ---------- tilt cards and figures ---------- */
  $$('[data-tilt]').forEach(function (el) {
    if (reduce) return;
    var target = el.classList.contains('card') ? el : ($('.phone', el) || el);
    el.addEventListener('pointermove', function (e) {
      var b = el.getBoundingClientRect();
      var x = (e.clientX - b.left) / b.width - 0.5, y = (e.clientY - b.top) / b.height - 0.5;
      target.style.transform = 'rotateY(' + (x * 22) + 'deg) rotateX(' + (y * -18) + 'deg) translateZ(14px)';
    });
    el.addEventListener('pointerleave', function () { target.style.transform = ''; });
  });
  $$('[data-tilt-pair]').forEach(function (g) {
    if (reduce) return;
    var ph = $$('.phone', g);
    g.addEventListener('pointermove', function (e) {
      var b = g.getBoundingClientRect(), x = (e.clientX - b.left) / b.width - 0.5;
      ph.forEach(function (p, i) {
        var two = ph.length === 2;
        p.style.transform = 'rotateY(' + (x * 30 + (two ? (i ? -16 : 16) : 0)) + 'deg)' + (two ? ' translateX(' + (i ? -34 : 34) + 'px)' : '');
      });
    });
    g.addEventListener('pointerleave', function () { ph.forEach(function (p) { p.style.transform = ''; }); });
  });

  /* ---------- 3D carousel ---------- */
  var ring = $('#ring'), car = $('#carousel');
  if (ring && car) {
    var items = $$('.phone', ring), n = items.length, step = 360 / n;
    var angle = 0, target = 0, dragging = false, lastX = 0, auto = !reduce, idleT = null;
    var capT = $('#capT'), capD = $('#capD'), dots = $('#dots'), cur = -1;
    // radius so neighbouring phones just clear each other, capped for the container width
    var radius = function () {
      var w = items[0].offsetWidth || 230;
      var r = (w * 1.12) / (2 * Math.tan(Math.PI / n));
      return Math.max(260, Math.min(r, 620));
    };
    var R = radius();
    items.forEach(function (it, i) { var d = document.createElement('i'); d.addEventListener('click', function () { go(i); }); dots.appendChild(d); });
    function place() {
      items.forEach(function (it, i) { it.style.transform = 'rotateY(' + (i * step) + 'deg) translateZ(' + R + 'px)'; });
    }
    function front() { return ((Math.round(-angle / step) % n) + n) % n; }
    function paint() {
      ring.style.transform = 'translateZ(' + (-R) + 'px) rotateY(' + angle + 'deg)';
      var f = front();
      if (f !== cur) {
        cur = f;
        capT.textContent = items[f].getAttribute('data-t');
        capD.textContent = items[f].getAttribute('data-d');
        $$('i', dots).forEach(function (d, i) { d.className = i === f ? 'on' : ''; });
        items.forEach(function (it, i) { it.classList.toggle('dim', i !== f); });
      }
    }
    function kick() {
      auto = false; clearTimeout(idleT);
      if (!reduce) idleT = setTimeout(function () { auto = true; }, 6000);
    }
    function go(i) {
      var cf = front();
      var diff = ((i - cf + n + n / 2) % n) - n / 2;
      target = angle - diff * step;
      kick();
    }
    function loop() {
      if (!dragging) {
        if (auto) { target = angle - 0.08; angle = target; }     // slow drift
        else { angle += (target - angle) * 0.12; }               // ease to the chosen phone
      }
      paint();
      requestAnimationFrame(loop);
    }
    place(); paint(); requestAnimationFrame(loop);
    window.addEventListener('resize', function () { R = radius(); place(); });
    car.addEventListener('pointerdown', function (e) {
      dragging = true; lastX = e.clientX; car.classList.add('drag'); kick();
      try { car.setPointerCapture(e.pointerId); } catch (x) { /* older browsers */ }
    });
    car.addEventListener('pointermove', function (e) {
      if (!dragging) return;
      var dx = e.clientX - lastX; lastX = e.clientX; angle += dx * 0.35; target = angle;
    });
    var up = function () {
      if (!dragging) return;
      dragging = false; car.classList.remove('drag');
      target = Math.round(angle / step) * step; kick();
    };
    car.addEventListener('pointerup', up);
    car.addEventListener('pointercancel', up);
    $('#prev').addEventListener('click', function () { go(front() - 1); });
    $('#next').addEventListener('click', function () { go(front() + 1); });
    car.tabIndex = 0;
    car.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowLeft') { go(front() - 1); e.preventDefault(); }
      if (e.key === 'ArrowRight') { go(front() + 1); e.preventDefault(); }
    });
    car.addEventListener('mouseenter', function () { auto = false; });
    car.addEventListener('mouseleave', function () { kick(); });
  }

  /* ---------- security layers ---------- */
  var layers = $$('.layer'), lis = $$('#slist li');
  function light(i) {
    layers.forEach(function (l) { l.classList.toggle('on', +l.getAttribute('data-i') === i); });
    lis.forEach(function (l) { l.classList.toggle('on', +l.getAttribute('data-i') === i); });
  }
  layers.concat(lis).forEach(function (l) {
    var i = +l.getAttribute('data-i');
    l.addEventListener('pointerenter', function () { light(i); });
    l.addEventListener('click', function () { light(i); });
  });
  var ls = $('#lstack');
  if (ls && !reduce) {
    var box = ls.parentNode;
    box.addEventListener('pointermove', function (e) {
      var b = box.getBoundingClientRect(), x = (e.clientX - b.left) / b.width - 0.5, y = (e.clientY - b.top) / b.height - 0.5;
      ls.style.transform = 'rotateX(' + (58 + y * -14) + 'deg) rotateZ(' + (-34 + x * 24) + 'deg)';
    });
    box.addEventListener('pointerleave', function () { ls.style.transform = ''; });
  }

  /* ---------- colour designs: recolour the whole page ---------- */
  var sw = $$('#sw button'), root = document.documentElement;
  function hexToRgba(h, a) { var v = parseInt(h.slice(1), 16); return 'rgba(' + (v >> 16) + ',' + ((v >> 8) & 255) + ',' + (v & 255) + ',' + a + ')'; }
  function setTheme(a, o, i, silent) {
    root.style.setProperty('--accent', a);
    root.style.setProperty('--on-accent', o);
    root.style.setProperty('--glow', hexToRgba(a, 0.35));
    sw.forEach(function (b, k) { b.setAttribute('aria-pressed', k === i ? 'true' : 'false'); });
    if (!silent) { try { localStorage.setItem('cipheron-theme', String(i)); } catch (e) { /* storage may be blocked */ } }
  }
  sw.forEach(function (b, i) {
    b.addEventListener('click', function () { setTheme(b.getAttribute('data-a'), b.getAttribute('data-o'), i); });
  });
  try {
    var saved = localStorage.getItem('cipheron-theme');
    if (saved !== null && sw[+saved]) { var sb = sw[+saved]; setTheme(sb.getAttribute('data-a'), sb.getAttribute('data-o'), +saved, true); }
  } catch (e) { /* ignore */ }
})();
