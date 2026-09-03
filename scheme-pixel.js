/*
 * 斜め見下ろしのRPG風オフィスを、木目の床、壁の設備、家具、17人の働く人物と足跡で描く。
 * 文字は描かず、指定された5色とその混色だけで、静かな仕事場の密度と奥行きを表現する。
 */
(function () {
  "use strict";
  var W = 640, H = 400, SCALE = 2;
  var C = { black: "#0D0D0D", white: "#FFFFFF", charcoal: "#343541", gray: "#8E8EA0", blue: "#2563EB" };

  function mix(a, b, amount) {
    function ch(i) {
      var av = parseInt(a.slice(i, i + 2), 16), bv = parseInt(b.slice(i, i + 2), 16);
      return Math.round(av + (bv - av) * amount).toString(16).padStart(2, "0");
    }
    return "#" + ch(1) + ch(3) + ch(5);
  }

  var P = {
    dark: mix(C.black, C.charcoal, 0.65), shadow: mix(C.black, C.charcoal, 0.82),
    wall: mix(C.white, C.gray, 0.42), wallShade: mix(C.charcoal, C.gray, 0.58),
    floor: mix(C.charcoal, C.gray, 0.56), floorAlt: mix(C.charcoal, C.gray, 0.48),
    grain: mix(C.charcoal, C.gray, 0.30), woodTop: mix(C.gray, C.white, 0.22),
    woodFront: mix(C.charcoal, C.gray, 0.68), pale: mix(C.white, C.gray, 0.22),
    skin: mix(C.white, C.gray, 0.34), screen: mix(C.blue, C.white, 0.18),
    curtain: mix(C.charcoal, C.gray, 0.72), leaf: mix(C.charcoal, C.gray, 0.42)
  };

  function painter(context) {
    return {
      rect: function (x, y, w, h, color) {
        context.fillStyle = color;
        context.fillRect(Math.round(x) * SCALE, Math.round(y) * SCALE, Math.round(w) * SCALE, Math.round(h) * SCALE);
      },
      poly: function (points, color) {
        context.fillStyle = color; context.beginPath();
        context.moveTo(Math.round(points[0][0]) * SCALE, Math.round(points[0][1]) * SCALE);
        for (var i = 1; i < points.length; i += 1) context.lineTo(Math.round(points[i][0]) * SCALE, Math.round(points[i][1]) * SCALE);
        context.closePath(); context.fill();
      },
      ellipse: function (x, y, rx, ry, color) {
        context.fillStyle = color; context.beginPath();
        context.ellipse(Math.round(x) * SCALE, Math.round(y) * SCALE, Math.round(rx) * SCALE, Math.round(ry) * SCALE, 0, 0, Math.PI * 2);
        context.fill();
      }
    };
  }

  window.mountSchemePixel = function mountSchemePixel(canvas) {
    if (!canvas || typeof canvas.getContext !== "function") throw new TypeError("mountSchemePixel には canvas 要素を渡してください");
    var ctx = canvas.getContext("2d");
    if (!ctx) return { stop: function () {} };
    canvas.width = W * SCALE; canvas.height = H * SCALE; ctx.imageSmoothingEnabled = false;
    var d = painter(ctx), rect = d.rect, poly = d.poly, ellipse = d.ellipse;
    var staticCanvas = document.createElement("canvas");
    staticCanvas.width = W * SCALE; staticCanvas.height = H * SCALE;
    var staticCtx = staticCanvas.getContext("2d"); staticCtx.imageSmoothingEnabled = false;
    var s = painter(staticCtx);
    var stopped = false, visible = false, rafId = 0, startedAt = 0, observer = null;
    var reduceQuery = window.matchMedia("(prefers-reduced-motion: reduce)"), reduced = reduceQuery.matches;

    function windowPane(x, width) {
      s.rect(x - 3, 15, width + 6, 51, P.dark); s.rect(x, 18, width, 43, P.screen);
      s.rect(x + 3, 21, width - 6, 11, mix(C.blue, C.white, 0.38));
      s.rect(x + width / 2 - 1, 18, 3, 43, P.dark); s.rect(x, 43, width, 3, P.dark);
      s.rect(x + 7, 24, 24, 2, C.white); s.rect(x + width - 28, 35, 17, 2, C.white);
      // 矩形だけのカーテンは壁と同化するため、2pxの縦筋でひだを残す。
      s.rect(x - 8, 13, 8, 57, P.curtain); s.rect(x + width, 13, 8, 57, P.curtain);
      s.rect(x - 6, 17, 2, 48, P.wallShade); s.rect(x + width + 3, 17, 2, 48, P.wallShade);
    }

    function plant(x, y) {
      s.rect(x + 10, y + 14, 3, 18, P.dark);
      s.poly([[x + 11, y + 18], [x, y + 10], [x + 4, y + 4], [x + 13, y + 14]], P.leaf);
      s.poly([[x + 11, y + 14], [x + 17, y], [x + 23, y + 4], [x + 14, y + 18]], P.pale);
      s.poly([[x + 13, y + 20], [x + 25, y + 10], [x + 27, y + 17], [x + 15, y + 24]], P.wallShade);
      s.rect(x + 5, y + 28, 17, 5, P.dark);
      s.poly([[x + 7, y + 33], [x + 20, y + 33], [x + 18, y + 43], [x + 9, y + 43]], P.woodFront);
    }

    function bookshelf(x, y) {
      s.rect(x + 4, y + 5, 47, 70, P.shadow); s.rect(x, y, 48, 71, P.dark); s.rect(x + 4, y + 4, 40, 61, P.grain);
      for (var row = 0; row < 3; row += 1) {
        var yy = y + 7 + row * 19;
        for (var b = 0; b < 6; b += 1) {
          var bh = 9 + ((row * 3 + b * 5) % 7);
          s.rect(x + 6 + b * 6, yy + 14 - bh, 4, bh, (b + row) % 3 === 0 ? P.pale : ((b + row) % 2 ? C.gray : P.wallShade));
        }
        s.rect(x + 4, yy + 15, 40, 3, P.woodFront);
      }
    }

    function kitchen(x, y) {
      s.rect(x, y + 27, 67, 43, P.dark); s.rect(x + 4, y + 31, 59, 34, P.wallShade);
      s.rect(x + 32, y + 31, 3, 34, P.dark); s.rect(x + 6, y + 35, 22, 4, P.pale);
      s.rect(x + 12, y + 18, 16, 10, P.shadow); s.rect(x + 15, y + 20, 10, 7, P.pale);
      s.rect(x + 43, y + 1, 17, 29, P.dark); s.rect(x + 46, y, 11, 22, P.screen);
      s.rect(x + 47, y + 4, 9, 5, C.white); s.rect(x + 46, y + 23, 12, 8, P.wallShade);
      s.rect(x + 49, y + 25, 2, 3, C.blue);
    }

    function copier(x, y) {
      s.rect(x + 5, y + 6, 42, 49, P.shadow);
      s.poly([[x, y + 13], [x + 38, y + 13], [x + 43, y + 20], [x + 5, y + 20]], P.pale);
      s.rect(x + 5, y + 20, 38, 31, C.gray); s.rect(x + 10, y + 25, 28, 7, P.dark);
      s.rect(x + 9, y + 37, 29, 10, P.wall); s.rect(x + 34, y + 27, 3, 3, C.blue);
      s.rect(x + 8, y + 8, 27, 6, C.white);
    }

    function sofa(x, y) {
      s.rect(x + 4, y + 7, 75, 35, P.shadow); s.rect(x, y, 77, 26, P.dark);
      s.rect(x + 5, y + 4, 67, 18, C.gray); s.rect(x + 7, y + 9, 29, 11, P.wallShade);
      s.rect(x + 40, y + 9, 29, 11, P.wallShade); s.rect(x, y + 22, 77, 13, P.woodFront);
      s.rect(x + 7, y + 35, 7, 6, P.dark); s.rect(x + 63, y + 35, 7, 6, P.dark);
    }

    function buildStatic() {
      s.rect(0, 0, W, H, C.black); s.rect(8, 8, W - 16, H - 16, P.floor);
      // 継ぎ目を段ごとにずらした横長の床板で、広い単色面と方眼紙のような見え方を避ける。
      for (var y = 90; y < 384; y += 13) {
        s.rect(8, y, W - 16, 2, P.grain);
        var offset = (Math.floor((y - 90) / 13) % 3) * 31;
        for (var x = 8 - offset; x < W - 8; x += 93) {
          s.rect(x, y + 2, 2, 11, P.floorAlt); s.rect(x + 18, y + 6, 27, 1, P.grain);
          s.rect(x + 55, y + 10, 17, 1, P.wallShade);
        }
      }
      s.rect(8, 8, W - 16, 78, P.wall); s.rect(8, 81, W - 16, 7, P.wallShade);
      s.rect(8, 88, W - 16, 4, P.shadow); s.rect(8, 8, 6, H - 16, P.dark);
      s.rect(W - 14, 8, 6, H - 16, P.dark); s.rect(8, H - 14, W - 16, 6, P.dark);
      windowPane(38, 104); windowPane(166, 104); windowPane(494, 105);

      // ボード上は文字ではなく、付箋と図形の痕跡だけに限定する。
      s.rect(303, 15, 116, 49, P.dark); s.rect(307, 19, 108, 41, C.white);
      s.rect(315, 27, 19, 13, mix(C.blue, C.white, 0.62)); s.rect(343, 25, 31, 3, C.gray);
      s.rect(343, 33, 22, 3, P.wallShade); s.rect(381, 28, 23, 18, P.pale); s.rect(311, 56, 23, 4, C.blue);
      s.ellipse(451, 38, 17, 17, P.dark); s.ellipse(451, 38, 13, 13, C.white);
      s.rect(450, 27, 2, 12, C.black); s.rect(450, 37, 8, 2, C.black);
      s.rect(20, 18, 13, 43, P.dark); s.rect(23, 21, 7, 37, P.screen); s.rect(24, 26, 5, 7, C.white);
      s.rect(580, 17, 30, 37, P.dark); s.rect(584, 21, 22, 29, C.white);
      s.poly([[586, 44], [593, 30], [598, 38], [604, 26], [604, 47]], mix(C.blue, C.white, 0.48));
      bookshelf(20, 103); kitchen(548, 99); copier(557, 185);
      plant(64, 45); plant(463, 47); plant(594, 315); sofa(525, 277);
      s.rect(402, 265, 105, 92, P.dark); s.rect(406, 269, 97, 84, mix(C.gray, C.white, 0.05));
      for (var ry = 274; ry < 348; ry += 10) for (var rx = 411; rx < 498; rx += 12) {
        if ((rx + ry) % 3 === 0) s.rect(rx, ry, 4, 2, P.wallShade);
      }
    }

    function monitor(x, y, lit) {
      rect(x + 2, y + 3, 27, 18, P.shadow); rect(x, y, 27, 17, C.black);
      rect(x + 3, y + 3, 21, 10, lit ? C.blue : P.wallShade);
      rect(x + 5, y + 5, 13, 2, lit ? P.screen : C.gray);
      rect(x + 11, y + 17, 5, 5, P.dark); rect(x + 6, y + 22, 15, 3, P.dark);
    }

    function desk(x, y, phase) {
      rect(x + 7, y + 9, 118, 47, P.shadow);
      poly([[x, y + 5], [x + 111, y + 5], [x + 121, y + 15], [x + 10, y + 15]], P.woodTop);
      rect(x + 10, y + 15, 111, 26, P.woodFront); rect(x + 10, y + 15, 111, 4, C.gray);
      rect(x + 61, y + 16, 3, 25, P.dark); rect(x + 16, y + 40, 7, 19, P.dark);
      rect(x + 108, y + 40, 7, 19, P.dark); monitor(x + 20, y - 12, phase % 4 !== 0);
      monitor(x + 77, y - 12, phase % 5 !== 0); rect(x + 49, y + 20, 17, 3, P.pale);
      rect(x + 73, y + 31, 12, 6, P.wall); rect(x + 75, y + 29, 8, 3, C.white);
    }

    function meetingTable(x, y) {
      ellipse(x + 4, y + 8, 51, 26, P.shadow); ellipse(x, y, 51, 25, P.woodTop);
      rect(x - 48, y, 96, 14, P.woodFront); ellipse(x, y, 48, 19, P.woodTop);
      rect(x - 5, y + 20, 10, 22, P.dark); rect(x - 20, y + 40, 40, 5, P.dark);
      rect(x - 15, y - 5, 20, 3, C.white); rect(x + 13, y + 4, 13, 8, P.wall);
    }

    function chair(x, y, flip) {
      rect(x + 4, y + 3, 21, 12, P.shadow);
      poly([[x + 2, y], [x + 22, y], [x + 26, y + 8], [x + 6, y + 8]], P.dark);
      rect(x + 6, y + 7, 20, 15, flip ? P.wallShade : C.gray);
      rect(x + 14, y + 22, 4, 7, P.dark); rect(x + 6, y + 28, 20, 3, P.dark);
    }

    var hairs = [P.dark, C.charcoal, C.gray, P.grain, C.black, P.wallShade];
    var shirts = [C.charcoal, P.wallShade, C.gray, P.dark, mix(C.charcoal, C.white, 0.20)];
    function person(x, y, direction, frame, style, seated) {
      var bob = seated ? frame % 2 : (frame === 1 || frame === 3 ? 1 : 0);
      var hair = hairs[style % hairs.length], shirt = style === 9 ? C.blue : shirts[style % shirts.length];
      var side = direction === "left" || direction === "right", back = direction === "up";
      ellipse(x + 12, y + 30, 11, 4, P.shadow); rect(x + 5, y + 2 + bob, 15, 5, hair);
      if (style % 4 === 0) rect(x + 2, y + 6 + bob, 5, 9, hair);
      if (style % 4 === 1) rect(x + 18, y + 5 + bob, 5, 8, hair);
      if (style % 4 === 2) { rect(x + 3, y + bob, 5, 7, hair); rect(x + 17, y + 3 + bob, 5, 5, hair); }
      rect(x + 4, y + 6 + bob, 17, 11, P.skin); rect(x + 4, y + 5 + bob, 17, 5, hair);
      if (!back && side) rect(x + (direction === "left" ? 5 : 18), y + 11 + bob, 2, 2, C.black);
      if (!back && !side) { rect(x + 8, y + 11 + bob, 2, 2, C.black); rect(x + 16, y + 11 + bob, 2, 2, C.black); }
      if (back) rect(x + 7, y + 7 + bob, 11, 4, hair);
      rect(x + 4, y + 17 + bob, 17, 11, shirt); rect(x + 1, y + 18 + bob, 4, 8, P.skin);
      rect(x + 21, y + 18 + bob, 4, 8, P.skin);
      if (!seated) {
        var stride = frame % 2 ? 2 : 0;
        rect(x + 5 + stride, y + 28 + bob, 6, 6, P.dark); rect(x + 15 - stride, y + 28 + bob, 6, 6, P.dark);
      }
    }

    function worker(x, y, ms, style, direction) {
      var frame = Math.floor((ms + style * 149) / (800 + (style % 6) * 130)) % 2;
      chair(x - 3, y + 16, style % 2); person(x, y, direction, frame, style, true);
      rect(x + (frame ? 1 : 2), y + 23, 5, 2, P.skin); rect(x + (frame ? 20 : 19), y + 22, 5, 2, P.skin);
    }

    function bubble(x, y, kind) {
      rect(x + 4, y, 17, 13, C.white); rect(x + 1, y + 3, 3, 7, C.white);
      rect(x + 21, y + 3, 3, 7, C.white); rect(x + 8, y + 13, 4, 4, C.white);
      rect(x + 4, y - 2, 17, 2, P.dark);
      if (kind === 0) { rect(x + 10, y + 3, 5, 5, C.blue); rect(x + 11, y + 8, 3, 3, P.dark); }
      else if (kind === 1) { rect(x + 8, y + 3, 9, 7, P.wallShade); rect(x + 10, y + 5, 5, 1, C.white); }
      else { rect(x + 8, y + 7, 3, 3, C.blue); rect(x + 11, y + 9, 2, 2, C.blue); rect(x + 13, y + 4, 5, 2, C.blue); }
    }

    var routes = [
      [[364, 108], [477, 108], [477, 181], [382, 181]],
      [[76, 351], [226, 351], [226, 269], [82, 269]],
      [[339, 365], [339, 260], [392, 260], [392, 134]],
      [[519, 244], [444, 244], [444, 151], [520, 151]]
    ];
    var walkTimes = [10000, 12000, 9000, 13500], pauses = [2600, 3400, 2200, 3900], offsets = [0, 4300, 7900, 11200];
    function walkState(ms, route, duration, pause, offset) {
      var count = route.length - 1, travel = duration * count, cycle = travel * 2 + pause * 2;
      var local = (ms + offset) % cycle, forward = local < travel + pause;
      var leg = forward ? local : local - travel - pause, moving = leg < travel;
      var progress = moving ? leg / duration : count, index = Math.min(count - 1, Math.floor(progress));
      var part = moving ? progress - index : 1;
      var a = forward ? route[index] : route[route.length - 1 - index];
      var b = forward ? route[index + 1] : route[route.length - 2 - index];
      var dx = b[0] - a[0], dy = b[1] - a[1];
      return { x: Math.round(a[0] + dx * part), y: Math.round(a[1] + dy * part),
        direction: Math.abs(dx) > Math.abs(dy) ? (dx < 0 ? "left" : "right") : (dy < 0 ? "up" : "down"),
        frame: moving ? Math.floor((ms + offset) / 420) % 4 : 0, moving: moving, progress: progress, forward: forward };
    }

    function routePoint(route, progress, forward) {
      var count = route.length - 1, p = Math.max(0, Math.min(count, progress));
      var index = Math.min(count - 1, Math.floor(p)), part = p - index;
      var a = forward ? route[index] : route[route.length - 1 - index];
      var b = forward ? route[index + 1] : route[route.length - 2 - index];
      return [Math.round(a[0] + (b[0] - a[0]) * part), Math.round(a[1] + (b[1] - a[1]) * part)];
    }

    function footprints(route, state) {
      if (!state.moving) return;
      // 経路全体へ焼き付けず、歩行者の直後だけ4組を描いて少しずつ消える印象にする。
      for (var i = 1; i <= 4; i += 1) {
        var p = routePoint(route, state.progress - i * 0.11, state.forward);
        var color = i < 2 ? P.grain : (i < 4 ? P.floorAlt : P.floor);
        rect(p[0] + 7, p[1] + 31, 3, 5, color); rect(p[0] + 15, p[1] + 34, 3, 5, color);
      }
    }

    buildStatic();
    function draw(ms) {
      ctx.drawImage(staticCanvas, 0, 0);
      var phase = Math.floor(ms / 2400);
      desk(82, 126, phase); desk(233, 126, phase + 2); desk(82, 235, phase + 1); desk(233, 235, phase + 3);
      meetingTable(458, 312);
      var seats = [[101,164,"up"],[158,164,"up"],[252,164,"up"],[309,164,"up"],
        [101,273,"up"],[158,273,"left"],[252,273,"up"],[309,273,"right"],[123,94,"down"],[274,94,"down"]];
      for (var i = 0; i < seats.length; i += 1) worker(seats[i][0], seats[i][1], ms, i, seats[i][2]);
      // 会議席とソファにも人を置き、机の島だけに活動が偏らない構成にする。
      person(414, 282, "right", Math.floor(ms / 1100) % 2, 11, true);
      person(478, 326, "left", Math.floor(ms / 1250) % 2, 12, true);
      person(550, 266, "down", Math.floor(ms / 970) % 2, 13, true);
      var walkers = [];
      for (i = 0; i < routes.length; i += 1) { walkers.push(walkState(ms, routes[i], walkTimes[i], pauses[i], offsets[i])); footprints(routes[i], walkers[i]); }
      for (i = 0; i < walkers.length; i += 1) person(walkers[i].x, walkers[i].y, walkers[i].direction, walkers[i].frame, 14 + i, false);
      // 吹き出しは同時に一つまでとし、記号以外は描かない。
      var bc = ms % 15000;
      if (bc > 2800 && bc < 5200) bubble(320, 142, 0);
      else if (bc > 8200 && bc < 10400) bubble(447, 272, 2);
      else if (bc > 12500 && bc < 14300) bubble(170, 251, 1);
    }

    function frame(now) {
      if (stopped || !visible || reduced) return;
      if (!startedAt) startedAt = now;
      draw(now - startedAt); rafId = window.requestAnimationFrame(frame);
    }
    function pause() { if (rafId) window.cancelAnimationFrame(rafId); rafId = 0; startedAt = 0; }
    function start() {
      if (stopped || !visible) return;
      if (reduced) draw(0); else if (!rafId) rafId = window.requestAnimationFrame(frame);
    }
    function onMotionChange(event) { reduced = event.matches; pause(); if (visible) start(); }

    if (typeof IntersectionObserver === "function") {
      observer = new IntersectionObserver(function (entries) {
        visible = entries[0].isIntersecting && entries[0].intersectionRatio >= 0.5;
        if (visible) start(); else pause();
      }, { threshold: [0, 0.5] });
      observer.observe(canvas);
    } else { visible = true; start(); }
    if (typeof reduceQuery.addEventListener === "function") reduceQuery.addEventListener("change", onMotionChange);
    else if (typeof reduceQuery.addListener === "function") reduceQuery.addListener(onMotionChange);

    return { stop: function stop() {
      if (stopped) return;
      stopped = true; pause(); if (observer) observer.disconnect();
      if (typeof reduceQuery.removeEventListener === "function") reduceQuery.removeEventListener("change", onMotionChange);
      else if (typeof reduceQuery.removeListener === "function") reduceQuery.removeListener(onMotionChange);
    } };
  };
}());
