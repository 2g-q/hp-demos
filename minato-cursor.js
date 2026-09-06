(() => {
  'use strict';
  // Decorative light only. Never read input values or send pointer data.
  const media = matchMedia('(hover:hover) and (pointer:fine) and (prefers-reduced-motion:no-preference)');
  let canvas, ctx, frame = 0, previous = 0, lastMove = 0, lastSpawn = 0;
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
      // Preserve blue contrast on white; screen blending washes it out.
      canvas.style.mixBlendMode = 'normal'; canvas.style.opacity = '.62';
      document.body.appendChild(canvas); resize();
    }
  }
  function draw(now) {
    frame = 0;
    if (!ctx || document.hidden || !media.matches) return;
    const dt = Math.min((now - previous) / 1000, .05); previous = now;
    ctx.clearRect(0, 0, innerWidth, innerHeight);
    ctx.globalCompositeOperation = 'source-over';
    // No hold: the trailing dots fade immediately, as in the original version.
    const glowAlpha = Math.max(0, 1 - (now - lastMove) / 1200);
    if (glow && mouse && glowAlpha > 0) {
      const follow = 1 - Math.exp(-dt / .95);
      glow.x += (mouse.x - glow.x) * follow; glow.y += (mouse.y - glow.y) * follow;
      const gradient = ctx.createRadialGradient(glow.x, glow.y, 0, glow.x, glow.y, 60);
      gradient.addColorStop(0, `rgba(65,125,235,${.04 * glowAlpha})`);
      gradient.addColorStop(.35, `rgba(80,145,245,${.02 * glowAlpha})`);
      gradient.addColorStop(1, 'rgba(80,145,245,0)');
      ctx.fillStyle = gradient; ctx.fillRect(glow.x - 60, glow.y - 60, 120, 120);
    }
    points = points.filter(point => now - point.birth < 4200);
    points.forEach(point => {
      const age = (now - point.birth) / 1000;
      const fade = Math.max(0, 1 - age / 4.2);
      const radius = point.size * fade;
      // Original small filled dots, without a saturated core or geometric rings.
      ctx.fillStyle = `rgba(105,156,245,${fade * .14})`;
      ctx.beginPath(); ctx.arc(point.x, point.y, radius, 0, Math.PI * 2); ctx.fill();
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
    if (now - lastSpawn > 32 && distance > 4) {
      points.push({x: mouse.x, y: mouse.y, birth: now, size: 5 + Math.random() * 8});
      if (points.length > 120) points.shift(); lastSpawn = now; origin = {...mouse};
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
