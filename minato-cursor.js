(() => {
  'use strict';
  // Decorative geometry only. Never read input values or send pointer data.
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
      const follow = 1 - Math.exp(-dt / .95);
      glow.x += (mouse.x - glow.x) * follow; glow.y += (mouse.y - glow.y) * follow;
      const gradient = ctx.createRadialGradient(glow.x, glow.y, 0, glow.x, glow.y, 220);
      gradient.addColorStop(0, `rgba(105,156,245,${.24 * glowAlpha})`);
      gradient.addColorStop(.35, `rgba(105,156,245,${.10 * glowAlpha})`);
      gradient.addColorStop(1, 'rgba(105,156,245,0)');
      ctx.fillStyle = gradient; ctx.fillRect(glow.x - 220, glow.y - 220, 440, 440);
    }
    points = points.filter(point => now - point.birth < 3800);
    points.forEach(point => {
      const age = (now - point.birth) / 1000;
      const progress = age / 3.8;
      const fade = Math.min(age / .35, 1) * Math.pow(1 - progress, 1.2);
      const alpha = fade * .14;
      const radius = 43 * (1 + progress * .12);
      // Soft circular light is the main trail; geometry is only a faint accent.
      const halo = ctx.createRadialGradient(point.x, point.y, 0, point.x, point.y, radius * 2);
      halo.addColorStop(0, `rgba(118,172,255,${fade * .09})`);
      halo.addColorStop(1, 'rgba(118,172,255,0)');
      ctx.fillStyle = halo;
      ctx.fillRect(point.x - radius * 2, point.y - radius * 2, radius * 4, radius * 4);
      // Rounded hexagon: quadratic corners, no spinning or sharp spikes.
      const vertices = Array.from({length: 6}, (_, i) => {
        const angle = i * Math.PI / 3 - Math.PI / 6;
        return {x: point.x + Math.cos(angle) * radius, y: point.y + Math.sin(angle) * radius};
      });
      ctx.beginPath();
      ctx.moveTo((vertices[5].x + vertices[0].x) / 2, (vertices[5].y + vertices[0].y) / 2);
      vertices.forEach((vertex, i) => {
        const next = vertices[(i + 1) % 6];
        ctx.quadraticCurveTo(vertex.x, vertex.y, (vertex.x + next.x) / 2, (vertex.y + next.y) / 2);
      });
      ctx.closePath(); ctx.lineWidth = 1; ctx.strokeStyle = `rgba(45,112,213,${alpha})`; ctx.stroke();
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
    if (now - lastSpawn > 280 && distance > 38) {
      points.push({x: mouse.x, y: mouse.y, birth: now});
      if (points.length > 3) points.shift(); lastSpawn = now; origin = {...mouse};
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
