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
      // Preserve blue contrast on white; screen blending washes it out.
      canvas.style.mixBlendMode = 'normal'; canvas.style.opacity = '1';
      document.body.appendChild(canvas); resize();
    }
  }
  function draw(now) {
    frame = 0;
    if (!ctx || document.hidden || !media.matches) return;
    const dt = Math.min((now - previous) / 1000, .05); previous = now;
    ctx.clearRect(0, 0, innerWidth, innerHeight);
    ctx.globalCompositeOperation = 'source-over';
    // Hold the light briefly, then fade over the original 4.2-second lifetime.
    const glowAlpha = Math.max(0, 1 - Math.max(0, now - lastMove - 1200) / 4200);
    if (glow && mouse && glowAlpha > 0) {
      const follow = 1 - Math.exp(-dt / .95);
      glow.x += (mouse.x - glow.x) * follow; glow.y += (mouse.y - glow.y) * follow;
      const gradient = ctx.createRadialGradient(glow.x, glow.y, 0, glow.x, glow.y, 60);
      gradient.addColorStop(0, `rgba(65,125,235,${.10 * glowAlpha})`);
      gradient.addColorStop(.35, `rgba(80,145,245,${.04 * glowAlpha})`);
      gradient.addColorStop(1, 'rgba(80,145,245,0)');
      ctx.fillStyle = gradient; ctx.fillRect(glow.x - 60, glow.y - 60, 120, 120);
    }
    points = points.filter(point => now - point.birth < 5400);
    const accents = points.filter(point => point.accent).slice(-3);
    points.forEach(point => {
      const age = (now - point.birth) / 1000;
      const fade = Math.max(0, 1 - Math.max(0, age - 1.2) / 4.2);
      const radius = point.size * fade;
      // A small blue core remains visible on pale panels; its edge diffuses.
      const light = ctx.createRadialGradient(point.x, point.y, 0, point.x, point.y, radius * 1.5);
      light.addColorStop(0, `rgba(35,100,220,${fade * .48})`);
      light.addColorStop(.25, `rgba(50,120,235,${fade * .38})`);
      light.addColorStop(.6, `rgba(90,165,250,${fade * .16})`);
      light.addColorStop(1, 'rgba(100,175,255,0)');
      ctx.fillStyle = light;
      ctx.beginPath(); ctx.arc(point.x, point.y, radius * 1.5, 0, Math.PI * 2); ctx.fill();
      if (!accents.includes(point)) return;
      const alpha = fade * .12;
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
    if (now - lastSpawn > 32 && distance > 4) {
      points.push({x: mouse.x, y: mouse.y, birth: now, size: 5 + Math.random() * 8,
        accent: !points.length || now - points[points.length - 1].birth > 280});
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
