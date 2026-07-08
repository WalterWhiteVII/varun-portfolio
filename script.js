const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const finePointer = window.matchMedia('(pointer: fine)').matches;

// Liquid black background — green metaballs drifting and merging through the dark.
// Rendered at half resolution; the CSS blur+contrast filter fuses the blobs into liquid.
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

  // A few very large masses anchored near the edges, slowly flowing —
  // reads as liquid moving through the black, not floating bubbles
  const anchors = [
    { x: 0.12, y: 0.15 }, { x: 0.88, y: 0.25 },
    { x: 0.20, y: 0.85 }, { x: 0.82, y: 0.78 }
  ];
  const balls = anchors.map(a => ({
    x: a.x, y: a.y,
    ax: Math.random() * TAU, ay: Math.random() * TAU,
    fx: 0.00008 + Math.random() * 0.00008,
    fy: 0.00006 + Math.random() * 0.00008,
    fr: 0.00005 + Math.random() * 0.00005,
    r: 0.30 + Math.random() * 0.14
  }));

  function drawBlob(x, y, r) {
    // Low-red green: the CSS contrast() filter clips channels past its midpoint,
    // so red above ~127 would turn blob cores yellow instead of green
    const g = fctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, 'rgba(84,225,40,.9)');
    g.addColorStop(0.65, 'rgba(84,225,40,.4)');
    g.addColorStop(1, 'rgba(84,225,40,0)');
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
    for (const b of balls) {
      const x = (b.x + 0.16 * Math.sin(now * b.fx + b.ax)) * fw;
      const y = (b.y + 0.14 * Math.sin(now * b.fy + b.ay)) * fh;
      const r = b.r * base * (1 + 0.18 * Math.sin(now * b.fr + b.ax));
      drawBlob(x, y, r);
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
