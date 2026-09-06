(() => {
  'use strict';
  // Fixed decorative snippets only. Never read input values or send pointer data.
  const media = matchMedia('(hover:hover) and (pointer:fine) and (prefers-reduced-motion:no-preference)');
  const snippets = ['const task = {}', 'await run()', 'data.map()', '<workflow />', '// human review', '[ input, output ]', 'check(data)', 'return result'];
  let canvas, ctx, frame = 0, previous = 0, lastMove = 0, lastSpawn = 0, index = 0;
  let points = [], mouse = null, glow = null, origin = null;
  function clear() {
    if (frame) cancelAnimationFrame(frame);
    frame = 0; points = []; mouse = null; glow = null; origin = null; lastSpawn = 0;
    if (ctx) ctx.clearRect(0, 0, innerWidth, innerHeight);
  }
  function resize() {
    if (!canvas) return;
    const dpr = Math.min(devicePixelRatio || 1, 2);
    canvas.width = Math.round(innerWidth * dpr); canvas.height = Math.round(innerHeight * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0); clear();
  }
  function sync() {
    clear();
    if (!media.matches) { if (canvas) canvas.remove(); canvas = ctx = null; return; }
    if (!canvas) {
      canvas = document.createElement('canvas'); ctx = canvas.getContext('2d');
      if (!ctx) { canvas = null; return; }
      canvas.id = 'cursor-field'; canvas.setAttribute('aria-hidden', 'true');
      document.body.appendChild(canvas); resize();
    }
  }
  function draw(now) {
    frame = 0;
    if (!ctx || document.hidden || !media.matches) return;
    const dt = Math.min((now - previous) / 1000, .05); previous = now;
    ctx.clearRect(0, 0, innerWidth, innerHeight);
    ctx.globalCompositeOperation = 'source-over';
    const glowAlpha = Math.max(0, 1 - (now - lastMove) / 2600);
    if (glow && mouse && glowAlpha > 0) {
      const follow = 1 - Math.exp(-dt / .85);
      glow.x += (mouse.x - glow.x) * follow; glow.y += (mouse.y - glow.y) * follow;
      const gradient = ctx.createRadialGradient(glow.x, glow.y, 0, glow.x, glow.y, 150);
      gradient.addColorStop(0, `rgba(67,132,239,${.12 * glowAlpha})`);
      gradient.addColorStop(1, 'rgba(67,132,239,0)');
      ctx.fillStyle = gradient; ctx.fillRect(glow.x - 150, glow.y - 150, 300, 300);
    }
    points = points.filter(point => now - point.birth < 3800);
    ctx.font = '12px ui-monospace, SFMono-Regular, Menlo, Consolas, monospace'; ctx.textBaseline = 'middle';
    points.forEach(point => {
      const age = (now - point.birth) / 1000;
      const alpha = Math.min(age / .35, 1) * Math.pow(Math.max(0, 1 - age / 3.8), 1.2) * .4;
      ctx.fillStyle = `rgba(36,94,170,${alpha})`;
      ctx.fillText(point.text, point.x, point.y - age * 3);
    });
    if (points.length || glowAlpha > 0) frame = requestAnimationFrame(draw);
  }
  window.addEventListener('pointermove', event => {
    if (!ctx || document.hidden || event.pointerType === 'touch') return;
    if (event.target instanceof Element && event.target.closest('a,button,input,textarea,select,[contenteditable],iframe')) { clear(); return; }
    const now = performance.now();
    const distance = origin ? Math.hypot(event.clientX - origin.x, event.clientY - origin.y) : 100;
    mouse = {x: event.clientX, y: event.clientY};
    if (!glow) glow = {...mouse};
    lastMove = now;
    // Bound both emission rate and density, independent of event/frame frequency.
    if (now - lastSpawn > 230 && distance > 32) {
      const x = Math.min(Math.max(12, mouse.x + 24), Math.max(12, innerWidth - 175));
      const y = Math.min(Math.max(20, mouse.y + 30), innerHeight - 20);
      if (!points.some(point => Math.abs(point.x - x) < 155 && Math.abs(point.y - y) < 26)) {
        points.push({x, y, text: snippets[index++ % snippets.length], birth: now});
        if (points.length > 8) points.shift(); lastSpawn = now; origin = {...mouse};
      }
    }
    if (!frame) { previous = now; frame = requestAnimationFrame(draw); }
  }, {passive: true});
  document.documentElement.addEventListener('pointerleave', clear, {passive: true});
  window.addEventListener('blur', clear);
  window.addEventListener('pointerdown', clear, {passive: true});
  window.addEventListener('scroll', clear, {passive: true});
  window.addEventListener('resize', resize, {passive: true});
  document.addEventListener('focusin', clear);
  document.addEventListener('visibilitychange', clear);
  media.addEventListener('change', sync);
  sync();
})();
