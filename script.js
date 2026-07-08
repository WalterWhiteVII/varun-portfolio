const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const finePointer = window.matchMedia('(pointer: fine)').matches;

// Liquid black background — blue liquid masses drifting through the dark,
// pushed aside by the cursor. Rendered at half resolution; the CSS
// blur+contrast filter fuses the blobs into liquid.
const fluid = document.getElementById('fluid');
if (!prefersReduced) {
  const fctx = fluid.getContext('2d');
  const TAU = 6.2832;
  let fw, fh;
  function fluidResize() {
    fw = fluid.width = Math.max(320, Math.floor(innerWidth / 2));
    fh = fluid.height = Math.max(240, Math.floor(innerHeight / 2));
  }
  fluidResize();
  window.addEventListener('resize', fluidResize);

  // Anchors spread far apart so the masses flow independently
  const anchors = [
    { x: 0.12, y: 0.15 }, { x: 0.88, y: 0.22 },
    { x: 0.50, y: 0.48 }, { x: 0.18, y: 0.82 },
    { x: 0.80, y: 0.80 }
  ];
  const balls = anchors.map(a => ({
    x: a.x, y: a.y,
    ax: Math.random() * TAU, ay: Math.random() * TAU,
    ax2: Math.random() * TAU, ay2: Math.random() * TAU,
    fx: 0.00009 + Math.random() * 0.00007,
    fy: 0.00007 + Math.random() * 0.00007,
    fx2: 0.00014 + Math.random() * 0.0001,
    fy2: 0.00012 + Math.random() * 0.0001,
    fr: 0.00005 + Math.random() * 0.00005,
    r: 0.15 + Math.random() * 0.10
  }));

  // Cursor pushes the liquid aside (eased so the shove feels fluid)
  let cx = -1e5, cy = -1e5, ex = cx, ey = cy;
  if (finePointer) window.addEventListener('mousemove', e => {
    cx = e.clientX * (fw / innerWidth);
    cy = e.clientY * (fh / innerHeight);
  });

  function drawBlob(x, y, r) {
    // Low-red blue: the CSS contrast() filter clips channels past its midpoint,
    // so channel values must sit clear of ~127 or hues drift under contrast
    const g = fctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, 'rgba(15,150,235,.9)');
    g.addColorStop(0.65, 'rgba(15,150,235,.4)');
    g.addColorStop(1, 'rgba(15,150,235,0)');
    fctx.fillStyle = g;
    fctx.beginPath();
    fctx.arc(x, y, r, 0, TAU);
    fctx.fill();
  }

  (function fluidFrame() {
    const now = performance.now();
    fctx.fillStyle = '#000';
    fctx.fillRect(0, 0, fw, fh);
    const base = Math.min(fw, fh);
    ex += (cx - ex) * 0.08;
    ey += (cy - ey) * 0.08;
    // Two-frequency drift gives each mass a wandering, non-repeating path
    const pts = balls.map(b => ({
      x: (b.x + 0.12 * Math.sin(now * b.fx + b.ax) + 0.06 * Math.sin(now * b.fx2 + b.ax2)) * fw,
      y: (b.y + 0.11 * Math.sin(now * b.fy + b.ay) + 0.05 * Math.sin(now * b.fy2 + b.ay2)) * fh,
      r: b.r * base * (1 + 0.18 * Math.sin(now * b.fr + b.ax))
    }));
    // Keep masses from clumping into one stuck shape: ease overlapping pairs apart
    for (let i = 0; i < pts.length; i++) {
      for (let j = i + 1; j < pts.length; j++) {
        const a = pts[i], c = pts[j];
        const dx = c.x - a.x, dy = c.y - a.y;
        const d = Math.hypot(dx, dy) || 1;
        const min = (a.r + c.r) * 0.75;
        if (d < min) {
          const shift = (min - d) * 0.5;
          a.x -= (dx / d) * shift; a.y -= (dy / d) * shift;
          c.x += (dx / d) * shift; c.y += (dy / d) * shift;
        }
      }
    }
    for (const p of pts) {
      let x = p.x, y = p.y;
      const dx = x - ex, dy = y - ey;
      const d = Math.hypot(dx, dy) || 1;
      const push = Math.max(0, 1 - d / (p.r * 2.2));
      x += (dx / d) * push * p.r * 1.1;
      y += (dy / d) * push * p.r * 1.1;
      drawBlob(x, y, p.r);
    }
    requestAnimationFrame(fluidFrame);
  })();
} else {
  fluid.style.display = 'none';
}

// Scroll progress bar
const bar = document.getElementById('progress');
window.addEventListener('scroll', () => {
  const h = document.documentElement;
  bar.style.width = (h.scrollTop / (h.scrollHeight - h.clientHeight) * 100) + '%';
}, { passive: true });

// Rotating hero words
const words = ['make money.', 'win markets.', 'scale globally.', 'users love.'];
const wordEl = document.getElementById('rotator-word');
if (!prefersReduced) {
  let wi = 0;
  setInterval(() => {
    wi = (wi + 1) % words.length;
    wordEl.style.animation = 'none';
    void wordEl.offsetWidth;
    wordEl.textContent = words[wi];
    wordEl.style.animation = '';
  }, 2600);
}

// Scroll-reveal
const els = document.querySelectorAll('.reveal');
if (prefersReduced || !('IntersectionObserver' in window)) {
  els.forEach(el => el.classList.add('in'));
} else {
  const io = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
    });
  }, { threshold: 0.12 });
  els.forEach(el => io.observe(el));
}

// Count-up stats
const nums = document.querySelectorAll('[data-count]');
function renderVal(el, val) {
  const dec = parseInt(el.dataset.decimals || '0', 10);
  el.textContent = (el.dataset.prefix || '') + val.toFixed(dec) + (el.dataset.suffix || '');
}
if (prefersReduced || !('IntersectionObserver' in window)) {
  nums.forEach(el => renderVal(el, parseFloat(el.dataset.count)));
} else {
  const cio = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (!e.isIntersecting) return;
      const el = e.target, target = parseFloat(el.dataset.count), dur = 1400, t0 = performance.now();
      (function tick(now) {
        const p = Math.min((now - t0) / dur, 1);
        renderVal(el, target * (1 - Math.pow(1 - p, 3)));
        if (p < 1) requestAnimationFrame(tick);
      })(t0);
      cio.unobserve(el);
    });
  }, { threshold: 0.4 });
  nums.forEach(el => { renderVal(el, 0); cio.observe(el); });
}

// 3D tilt on case cards (desktop only)
if (!prefersReduced && finePointer) {
  document.querySelectorAll('.tilt').forEach(card => {
    card.addEventListener('mousemove', e => {
      const r = card.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - 0.5;
      const y = (e.clientY - r.top) / r.height - 0.5;
      card.style.transform = 'rotateY(' + (x * 4) + 'deg) rotateX(' + (-y * 4) + 'deg) translateY(-4px)';
    });
    card.addEventListener('mouseleave', () => { card.style.transform = ''; });
  });
}
