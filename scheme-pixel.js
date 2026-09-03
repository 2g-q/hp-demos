/*
 * AI社員が静かに働く、RPG風の見下ろしオフィスマップを一枚絵として描く。
 * 図解に見える文字・矢印・接続線は置かず、家具、通路、人物の動きだけで仕事場の気配を出す。
 */
(function () {
  "use strict";

  var W = 550;
  var H = 350;
  var SCALE = 2;
  var C = {
    black: "#0D0D0D",
    white: "#FFFFFF",
    charcoal: "#343541",
    gray: "#8E8EA0",
    blue: "#2563EB"
  };

  function mix(a, b, amount) {
    function channel(offset) {
      var av = parseInt(a.slice(offset, offset + 2), 16);
      var bv = parseInt(b.slice(offset, offset + 2), 16);
      return Math.round(av + (bv - av) * amount).toString(16).padStart(2, "0");
    }
    return "#" + channel(1) + channel(3) + channel(5);
  }

  var floorA = mix(C.charcoal, C.white, 0.16);
  var floorB = mix(C.charcoal, C.gray, 0.38);
  var wall = mix(C.white, C.gray, 0.48);
  var wood = mix(C.charcoal, C.gray, 0.55);
  var shadow = mix(C.black, C.charcoal, 0.55);
  var skin = mix(C.white, C.gray, 0.28);

  window.mountSchemePixel = function mountSchemePixel(canvas) {
    if (!canvas || typeof canvas.getContext !== "function") {
      throw new TypeError("mountSchemePixel には canvas 要素を渡してください");
    }

    var ctx = canvas.getContext("2d");
    if (!ctx) return { stop: function () {} };

    canvas.width = W * SCALE;
    canvas.height = H * SCALE;
    ctx.imageSmoothingEnabled = false;

    var stopped = false;
    var visible = false;
    var rafId = 0;
    var startedAt = 0;
    var reduceQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    var reduced = reduceQuery.matches;
    var observer = null;

    function rect(x, y, width, height, color) {
      ctx.fillStyle = color;
      ctx.fillRect(
        Math.round(x) * SCALE,
        Math.round(y) * SCALE,
        Math.round(width) * SCALE,
        Math.round(height) * SCALE
      );
    }

    function pixelCircle(cx, cy, radius, color) {
      for (var y = -radius; y <= radius; y += 2) {
        var half = Math.floor(Math.sqrt(radius * radius - y * y));
        rect(cx - half, cy + y, half * 2 + 1, 2, color);
      }
    }

    function windowPane(x, y, width) {
      rect(x - 3, y - 3, width + 6, 37, C.charcoal);
      rect(x, y, width, 31, mix(C.white, C.blue, 0.22));
      rect(x + Math.floor(width / 2) - 1, y, 3, 31, C.charcoal);
      rect(x, y + 14, width, 3, C.charcoal);
      rect(x + 5, y + 4, 18, 2, C.white);
    }

    function drawRoom() {
      rect(0, 0, W, H, C.black);
      rect(10, 10, 530, 330, floorA);

      // 床を大粒のドットで塗ると再び粗い図に見えるため、10px格子を薄い市松にした。
      for (var y = 66; y < 340; y += 10) {
        for (var x = 10; x < 540; x += 10) {
          rect(x, y, 10, 10, ((x + y) / 10) % 2 ? floorA : floorB);
        }
      }

      rect(10, 10, 530, 54, wall);
      rect(10, 58, 530, 8, C.charcoal);
      rect(10, 64, 530, 3, shadow);
      rect(10, 10, 6, 330, C.charcoal);
      rect(534, 10, 6, 330, C.charcoal);
      rect(10, 334, 530, 6, C.charcoal);

      windowPane(31, 19, 78);
      windowPane(128, 19, 78);
      windowPane(438, 19, 72);

      rect(241, 15, 108, 40, C.charcoal);
      rect(244, 18, 102, 34, C.white);
      // 文字に見える情報は置かず、消し残し程度の短い画素だけに留める。
      rect(256, 29, 27, 2, C.gray);
      rect(256, 36, 18, 2, C.gray);
      rect(294, 30, 32, 2, mix(C.white, C.gray, 0.6));
      rect(287, 52, 18, 3, C.gray);

      pixelCircle(395, 34, 14, C.charcoal);
      pixelCircle(395, 34, 10, C.white);
      rect(394, 27, 2, 8, C.black);
      rect(395, 34, 6, 2, C.black);
    }

    function monitor(x, y, phase) {
      rect(x, y, 24, 14, C.black);
      rect(x + 3, y + 2, 18, 9, phase % 4 === 0 ? C.blue : C.gray);
      rect(x + 10, y + 14, 4, 4, C.charcoal);
      rect(x + 6, y + 18, 12, 2, C.charcoal);
    }

    function deskIsland(x, y, phase) {
      rect(x + 4, y + 5, 102, 33, shadow);
      rect(x, y, 110, 31, wood);
      rect(x, y, 110, 4, C.white);
      rect(x + 53, y + 4, 4, 27, C.charcoal);
      monitor(x + 16, y + 5, phase);
      monitor(x + 72, y + 5, phase + 1);
      rect(x + 8, y + 27, 7, 13, C.charcoal);
      rect(x + 95, y + 27, 7, 13, C.charcoal);
    }

    function chair(x, y, offset) {
      rect(x + 3, y + offset, 16, 7, C.charcoal);
      rect(x, y + 6 + offset, 22, 13, shadow);
      rect(x + 3, y + 7 + offset, 16, 9, C.gray);
      rect(x + 9, y + 19 + offset, 4, 5, C.charcoal);
      rect(x + 3, y + 23 + offset, 16, 3, C.charcoal);
    }

    function person(x, y, direction, frame, shirt, seated) {
      var bob = frame % 2;
      var side = direction === "left" || direction === "right";
      var step = seated ? 0 : frame % 2;
      rect(x + 5, y + bob, 12, 5, C.charcoal);
      rect(x + 3, y + 5 + bob, 16, 9, skin);
      if (side) {
        rect(x + (direction === "left" ? 3 : 17), y + 8 + bob, 2, 2, C.black);
      } else {
        rect(x + 7, y + 8 + bob, 2, 2, C.black);
        rect(x + 13, y + 8 + bob, 2, 2, C.black);
      }
      rect(x + 4, y + 14 + bob, 14, 9, shirt);
      rect(x + 1, y + 15 + bob, 4, 7, skin);
      rect(x + 17, y + 15 + bob, 4, 7, skin);
      if (!seated) {
        rect(x + 4 + step * 2, y + 23 + bob, 5, 5, C.charcoal);
        rect(x + 13 - step * 2, y + 23 + bob, 5, 5, C.charcoal);
      }
    }

    function seatedWorker(x, y, ms, seed, special) {
      var frame = Math.floor((ms + seed * 173) / (900 + seed * 37)) % 2;
      var shift = frame && seed % 3 === 0 ? 1 : 0;
      chair(x, y + 16, shift);
      person(x, y, "up", frame, special ? C.blue : C.charcoal, true);
      // 打鍵は腕先の1pxだけ。全身を大きく振ると落ち着かないため動きを絞る。
      rect(x + 2, y + 20 + frame, 4, 2, skin);
      rect(x + 16, y + 21 - frame, 4, 2, skin);
    }

    function bookshelf(x, y) {
      rect(x, y, 45, 66, C.charcoal);
      rect(x + 4, y + 5, 37, 55, shadow);
      for (var sy = y + 9; sy < y + 56; sy += 16) {
        rect(x + 5, sy + 10, 35, 3, wood);
        for (var bx = x + 7; bx < x + 38; bx += 7) {
          rect(bx, sy, 4, 10, (bx / 7) % 2 ? C.gray : C.white);
        }
      }
      rect(x + 5, y + 61, 35, 3, C.black);
    }

    function plant(x, y) {
      rect(x + 9, y + 16, 10, 14, C.charcoal);
      rect(x + 7, y + 15, 14, 5, C.gray);
      rect(x + 12, y + 4, 4, 13, C.charcoal);
      rect(x + 2, y + 5, 11, 8, C.gray);
      rect(x + 15, y, 11, 10, C.white);
      rect(x + 10, y + 8, 10, 8, mix(C.gray, C.white, 0.45));
    }

    function kitchen(x, y) {
      rect(x, y, 67, 47, C.charcoal);
      rect(x + 4, y + 5, 59, 37, wall);
      rect(x + 4, y + 27, 59, 4, C.charcoal);
      rect(x + 30, y + 31, 3, 11, C.charcoal);
      rect(x + 45, y + 8, 12, 15, C.black);
      rect(x + 48, y + 11, 6, 7, C.blue);
      rect(x + 10, y + 11, 20, 10, C.gray);
      rect(x + 14, y + 14, 12, 4, C.white);
    }

    function copier(x, y) {
      rect(x + 3, y + 3, 38, 43, shadow);
      rect(x, y, 38, 42, C.gray);
      rect(x + 5, y + 4, 28, 11, C.white);
      rect(x + 8, y + 17, 22, 6, C.charcoal);
      rect(x + 5, y + 28, 28, 10, wall);
      rect(x + 28, y + 19, 3, 3, C.blue);
    }

    function meetingTable(cx, cy) {
      chair(cx - 10, cy - 50, 0);
      chair(cx - 10, cy + 31, 0);
      chair(cx - 52, cy - 9, 0);
      chair(cx + 31, cy - 9, 0);
      pixelCircle(cx, cy, 31, shadow);
      pixelCircle(cx - 3, cy - 3, 30, wood);
      rect(cx - 4, cy + 25, 8, 13, C.charcoal);
    }

    function walkState(ms, route, duration, pause, offset) {
      var cycle = duration + pause;
      var local = (ms + offset) % cycle;
      var moving = local < duration;
      var progress = moving ? local / duration : 1;
      var index = Math.min(route.length - 2, Math.floor(progress * (route.length - 1)));
      var part = progress * (route.length - 1) - index;
      var forward = Math.floor((ms + offset) / cycle) % 2 === 0;
      var from = forward ? route[index] : route[route.length - 1 - index];
      var to = forward ? route[index + 1] : route[route.length - 2 - index];
      var dx = to[0] - from[0];
      var dy = to[1] - from[1];
      return {
        x: Math.round(from[0] + dx * part),
        y: Math.round(from[1] + dy * part),
        direction: Math.abs(dx) > Math.abs(dy) ? (dx < 0 ? "left" : "right") : (dy < 0 ? "up" : "down"),
        frame: moving ? Math.floor((ms + offset) / 650) % 2 : 0
      };
    }

    function draw(ms) {
      drawRoom();
      var phase = Math.floor(ms / 2400);
      deskIsland(75, 101, phase);
      deskIsland(215, 101, phase + 2);
      deskIsland(75, 213, phase + 1);
      deskIsland(215, 213, phase + 3);
      bookshelf(24, 76);
      kitchen(457, 78);
      copier(469, 145);
      meetingTable(455, 264);
      plant(27, 174);
      plant(337, 73);
      plant(505, 298);

      // 机より人物を後に描き、着席中でも頭と手元が読める重なり順にする。
      var seats = [[91, 124], [145, 124], [231, 124], [285, 124],
        [91, 236], [145, 236], [231, 236], [285, 236], [390, 244]];
      for (var i = 0; i < seats.length; i += 1) {
        seatedWorker(seats[i][0], seats[i][1], ms, i + 1, i === 3);
      }

      var walkers = [
        walkState(ms, [[367, 92], [411, 92], [411, 181], [359, 181]], 36000, 3000, 0),
        walkState(ms, [[55, 301], [188, 301], [188, 181], [60, 181]], 42000, 4000, 5200),
        walkState(ms, [[342, 307], [342, 196], [424, 196], [424, 132]], 30000, 2500, 8300)
      ];
      for (i = 0; i < walkers.length; i += 1) {
        person(walkers[i].x, walkers[i].y, walkers[i].direction, walkers[i].frame, C.charcoal, false);
      }
    }

    function frame(now) {
      if (stopped || !visible || reduced) return;
      if (!startedAt) startedAt = now;
      draw(now - startedAt);
      rafId = window.requestAnimationFrame(frame);
    }

    function pause() {
      if (rafId) window.cancelAnimationFrame(rafId);
      rafId = 0;
      startedAt = 0;
    }

    function start() {
      if (stopped || !visible) return;
      if (reduced) {
        draw(0);
      } else if (!rafId) {
        rafId = window.requestAnimationFrame(frame);
      }
    }

    function onMotionChange(event) {
      reduced = event.matches;
      pause();
      if (visible) start();
    }

    if (typeof IntersectionObserver === "function") {
      observer = new IntersectionObserver(function (entries) {
        visible = entries[0].isIntersecting && entries[0].intersectionRatio >= 0.5;
        if (visible) start();
        else pause();
      }, { threshold: [0, 0.5] });
      observer.observe(canvas);
    } else {
      visible = true;
      start();
    }

    if (typeof reduceQuery.addEventListener === "function") {
      reduceQuery.addEventListener("change", onMotionChange);
    } else if (typeof reduceQuery.addListener === "function") {
      reduceQuery.addListener(onMotionChange);
    }

    return {
      stop: function stop() {
        if (stopped) return;
        stopped = true;
        pause();
        if (observer) observer.disconnect();
        if (typeof reduceQuery.removeEventListener === "function") {
          reduceQuery.removeEventListener("change", onMotionChange);
        } else if (typeof reduceQuery.removeListener === "function") {
          reduceQuery.removeListener(onMotionChange);
        }
      }
    };
  };
}());
