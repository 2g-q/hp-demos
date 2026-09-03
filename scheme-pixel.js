/*
 * RPGの見下ろしマップで「困っている人の相談→整理→試作→人が確認→改善／納品」を描く。
 * 0〜2秒: 相談、2〜6秒: 整理へ移動、6〜10秒: 試作、10〜14秒: 人が確認、
 * 14〜17秒: 2経路を表示、17〜21秒: 改善または納品へ移動、21〜24秒: 完了。
 * 24秒ごとに月額と単発を交互に通し、月額線だけは相談へ戻る循環線として常に閉じる。
 */
(function () {
  "use strict";

  var W = 220;
  var H = 140;
  var SCALE = 5;
  var LOOP_MS = 24000;
  var C = {
    black: "#0D0D0D",
    white: "#FFFFFF",
    charcoal: "#343541",
    gray: "#8E8EA0",
    blue: "#2563EB"
  };

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function mix(a, b, amount) {
    function channel(offset) {
      var av = parseInt(a.slice(offset, offset + 2), 16);
      var bv = parseInt(b.slice(offset, offset + 2), 16);
      return Math.round(av + (bv - av) * amount).toString(16).padStart(2, "0");
    }
    return "#" + channel(1) + channel(3) + channel(5);
  }

  window.mountSchemePixel = function mountSchemePixel(canvas) {
    if (!canvas || typeof canvas.getContext !== "function") {
      throw new TypeError("mountSchemePixel には canvas 要素を渡してください");
    }

    var ctx = canvas.getContext("2d");
    if (!ctx) {
      return { stop: function () {} };
    }

    // 低解像度のcanvasへ日本語を描くと、CSS拡大時に文字まで潰れる。
    // 描画バッファは表示サイズに合わせ、図形だけを5倍のドットとして描く。
    canvas.width = W * SCALE;
    canvas.height = H * SCALE;
    ctx.imageSmoothingEnabled = false;

    var stopped = false;
    var visible = false;
    var rafId = 0;
    var elapsed = 0;
    var startedAt = 0;
    var reduceQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    var reduced = reduceQuery.matches;
    var observer = null;

    function rect(x, y, width, height, color) {
      ctx.fillStyle = color;
      ctx.fillRect(
        Math.round(x * SCALE),
        Math.round(y * SCALE),
        Math.round(width * SCALE),
        Math.round(height * SCALE)
      );
    }

    function text(value, x, y, color, align) {
      // 文字までドット座標で描くと判読できないため、実バッファへ直接描画する。
      ctx.fillStyle = color;
      ctx.font = "bold 20px system-ui, sans-serif";
      ctx.textAlign = align || "center";
      ctx.textBaseline = "top";
      ctx.fillText(value, Math.round(x * SCALE), Math.round(y * SCALE));
    }

    function line(points, color, reveal) {
      var lengths = [];
      var total = 0;
      var i;
      for (i = 1; i < points.length; i += 1) {
        var dx = points[i][0] - points[i - 1][0];
        var dy = points[i][1] - points[i - 1][1];
        lengths.push(Math.sqrt(dx * dx + dy * dy));
        total += lengths[lengths.length - 1];
      }
      var remaining = total * clamp(reveal === undefined ? 1 : reveal, 0, 1);
      ctx.strokeStyle = color;
      ctx.lineWidth = 2 * SCALE;
      ctx.setLineDash([]);
      ctx.beginPath();
      ctx.moveTo(points[0][0] * SCALE, points[0][1] * SCALE);
      for (i = 1; i < points.length && remaining > 0; i += 1) {
        var ratio = Math.min(1, remaining / lengths[i - 1]);
        ctx.lineTo(
          Math.round((points[i - 1][0] + (points[i][0] - points[i - 1][0]) * ratio) * SCALE),
          Math.round((points[i - 1][1] + (points[i][1] - points[i - 1][1]) * ratio) * SCALE)
        );
        remaining -= lengths[i - 1];
      }
      ctx.stroke();
    }

    function pointOnPath(points, progress) {
      var lengths = [];
      var total = 0;
      var i;
      for (i = 1; i < points.length; i += 1) {
        var dx = points[i][0] - points[i - 1][0];
        var dy = points[i][1] - points[i - 1][1];
        lengths.push(Math.sqrt(dx * dx + dy * dy));
        total += lengths[lengths.length - 1];
      }
      var distance = total * clamp(progress, 0, 1);
      for (i = 1; i < points.length; i += 1) {
        if (distance <= lengths[i - 1]) {
          var ratio = distance / lengths[i - 1];
          return [
            Math.round(points[i - 1][0] + (points[i][0] - points[i - 1][0]) * ratio),
            Math.round(points[i - 1][1] + (points[i][1] - points[i - 1][1]) * ratio)
          ];
        }
        distance -= lengths[i - 1];
      }
      return points[points.length - 1];
    }

    function arrow(x, y, direction, color) {
      var sx = direction === "left" ? -1 : 1;
      rect(x, y, 3 * sx, 2, color);
      rect(x + 2 * sx, y - 2, 2 * sx, 6, color);
    }

    function person(x, y, shirt, frame, worried) {
      // 全キャラを同じ12px高に固定し、家具との縮尺が崩れないようにする。
      var leg = frame % 2;
      rect(x + 3, y, 6, 2, C.charcoal);
      rect(x + 2, y + 2, 8, 4, C.white);
      rect(x + 3, y + 3, 1, 1, C.black);
      rect(x + 8, y + 3, 1, 1, C.black);
      rect(x + 2, y + 6, 8, 4, shirt);
      rect(x, y + 7, 2, 3, C.white);
      rect(x + 10, y + 7, 2, 3, C.white);
      rect(x + 2 + leg, y + 10, 3, 2, C.gray);
      rect(x + 7 - leg, y + 10, 3, 2, C.gray);
      if (worried) {
        text("?", x + 14, y - 5, C.blue, "left");
        rect(x + 13, y + 4, 1, 3, C.white);
        rect(x + 13, y + 8, 1, 1, C.white);
      }
    }

    function reviewer(x, y) {
      // 全身を白にすると頭・胴・腕の境界が消えて白い塊に見える。
      // 他キャラと同じ骨格を使い、青い服と虫めがねで確認役を示す。
      person(x, y, C.blue, 0, false);
      rect(x + 10, y + 5, 3, 3, C.white);
      rect(x + 11, y + 6, 1, 1, C.black);
      rect(x + 13, y + 8, 1, 3, C.blue);
    }

    function desk(x, y, active) {
      rect(x, y, 20, 8, C.charcoal);
      rect(x + 2, y + 2, 7, 4, active ? C.blue : C.gray);
      rect(x + 3, y + 3, 5, 2, C.black);
      rect(x + 2, y + 8, 3, 4, C.gray);
      rect(x + 15, y + 8, 3, 4, C.gray);
      rect(x + 7, y + 13, 6, 4, C.charcoal);
    }

    function plant(x, y) {
      rect(x + 3, y + 6, 6, 5, C.gray);
      rect(x + 5, y + 2, 2, 5, C.white);
      rect(x + 1, y + 1, 4, 3, C.gray);
      rect(x + 7, y, 4, 4, C.gray);
    }

    function sign(label, x, y, active) {
      var width = label.length * 6 + 6;
      rect(x - width / 2, y, width, 10, active ? C.blue : C.charcoal);
      text(label, x, y + 2, C.white);
    }

    function mapBase() {
      rect(0, 0, W, H, C.black);

      // 床は8px単位のタイル。道具もキャラ基準で収まる小さな室内にまとめる。
      rect(52, 12, 124, 82, mix(C.black, C.charcoal, 0.72));
      for (var x = 54; x < 176; x += 8) {
        for (var y = 14; y < 94; y += 8) {
          rect(x, y, 6, 6, (x + y) % 16 ? C.charcoal : mix(C.charcoal, C.gray, 0.3));
        }
      }
      rect(52, 12, 124, 2, C.white);
      rect(52, 92, 124, 2, C.white);
      rect(52, 12, 2, 82, C.white);
      rect(174, 12, 2, 82, C.white);
      rect(52, 57, 2, 18, C.black);
      rect(49, 57, 3, 18, C.gray);

      // 相談者から入口へ続く石畳。港や建物で相談者を代用しない。
      for (var px = 8; px < 50; px += 8) {
        rect(px, 62, 6, 8, px % 16 ? C.charcoal : C.gray);
      }
      plant(58, 18);
      plant(160, 18);
      desk(76, 36, false);
      desk(119, 36, false);
      rect(99, 65, 18, 6, C.charcoal);
      rect(101, 71, 4, 5, C.gray);
      rect(111, 71, 4, 5, C.gray);
      text("自動化のミナト", 114, 17, C.white);
    }

    function draw(ms, forcedComplete) {
      var cycle = Math.floor(ms / LOOP_MS);
      var t = forcedComplete ? 22 : (ms % LOOP_MS) / 1000;
      var monthly = forcedComplete || cycle % 2 === 0;
      var walkFrame = Math.floor(ms / 320) % 4;
      var inPath = [[31, 66], [52, 66], [72, 66], [86, 51]];
      var checkPath = [[137, 51], [143, 62], [133, 72]];
      var monthlyPath = [[133, 72], [168, 72], [194, 65]];
      var oncePath = [[133, 72], [150, 91], [174, 111]];
      var returnPath = [[194, 65], [207, 65], [207, 126], [18, 126], [18, 77]];
      var grayLine = mix(C.black, C.gray, 0.62);

      mapBase();
      line(inPath, grayLine, 1);
      line(checkPath, grayLine, 1);
      line(monthlyPath, grayLine, 1);
      line(returnPath, grayLine, 1);
      line(oncePath, grayLine, 1);
      arrow(202, 124, "left", C.gray);
      arrow(16, 82, "left", C.gray);

      var consultActive = t < 2;
      var sortActive = t >= 2 && t < 6;
      var prototypeActive = t >= 6 && t < 10;
      var checkActive = t >= 10 && t < 14;
      var destinationActive = t >= 17;

      sign("相談", 24, 43, consultActive);
      sign("整理", 86, 26, sortActive);
      sign("試作", 129, 26, prototypeActive);
      sign("人が確認", 108, 79, checkActive);
      sign("改善", 194, 43, destinationActive && monthly);
      sign("納品", 177, 99, destinationActive && !monthly);

      person(18, 59, consultActive ? C.blue : C.charcoal, walkFrame, true);
      reviewer(102, 61);
      desk(76, 36, sortActive);
      desk(119, 36, prototypeActive);

      if (t < 2) {
        var bubbleWidth = Math.round(18 * clamp(t, 0, 1));
        rect(8, 28, bubbleWidth, 9, C.white);
        if (bubbleWidth > 12) text("…", 17, 29, C.black);
      }

      if (t >= 2 && t < 6) {
        var inPoint = pointOnPath(inPath, (t - 2) / 4);
        rect(inPoint[0] - 2, inPoint[1] - 2, 4, 4, C.blue);
      }

      if (t >= 6 && t < 10) {
        var glow = clamp((t - 6) / 2, 0, 1);
        rect(121, 38, Math.round(6 * glow), 2, C.blue);
      }

      if (t >= 10 && t < 14) {
        // 自動処理の直後に確認者を置く。両ルートがここを共有するのが主題。
        var cursorProgress = (t - 10) / 4;
        var cursorX = 102 + Math.round(12 * (cursorProgress < 0.5 ? cursorProgress * 2 : (1 - cursorProgress) * 2));
        rect(cursorX, 58, 2, 4, C.blue);
        rect(cursorX + 2, 60, 2, 2, C.blue);
      }

      if (t >= 14) {
        var branchReveal = clamp((t - 14) / 3, 0, 1);
        line(monthlyPath, monthly && t < 21 ? C.blue : C.white, branchReveal);
        line(returnPath, C.white, branchReveal);
        line(oncePath, !monthly && t < 21 ? C.blue : C.white, clamp(branchReveal * 2 - 1, 0, 1));
      }

      if (t >= 17 && t < 21) {
        var destination = pointOnPath(monthly ? monthlyPath : oncePath, (t - 17) / 4);
        rect(destination[0] - 2, destination[1] - 2, 4, 4, C.blue);
      }

      if (destinationActive) {
        person(monthly ? 188 : 171, monthly ? 58 : 105, C.blue, 0, false);
      }

      text("月額・循環", 58, 119, C.gray);
      text("単発・納品", 176, 119, C.gray);
      rect(69, 133, 3, 3, C.blue);
      text("処理中", 75, 131, C.gray, "left");
      rect(106, 133, 3, 3, C.white);
      text("人が確認", 112, 131, C.gray, "left");
      rect(158, 133, 3, 3, C.gray);
      text("待機", 164, 131, C.gray, "left");
    }

    function frame(now) {
      if (stopped || reduced || !visible) return;
      elapsed += now - startedAt;
      startedAt = now;
      draw(elapsed, false);
      rafId = window.requestAnimationFrame(frame);
    }

    function play() {
      if (stopped || reduced || !visible || rafId) return;
      startedAt = performance.now();
      rafId = window.requestAnimationFrame(frame);
    }

    function pause() {
      if (rafId) window.cancelAnimationFrame(rafId);
      rafId = 0;
    }

    function motionChanged(event) {
      reduced = event.matches;
      pause();
      if (reduced && visible) draw(22000, true);
      else play();
    }

    if (typeof IntersectionObserver === "function") {
      observer = new IntersectionObserver(function (entries) {
        visible = entries[0].isIntersecting && entries[0].intersectionRatio >= 0.5;
        if (visible && reduced) draw(22000, true);
        else if (visible) play();
        else pause();
      }, { threshold: [0, 0.5, 1] });
      observer.observe(canvas);
    } else {
      visible = true;
    }

    if (typeof reduceQuery.addEventListener === "function") {
      reduceQuery.addEventListener("change", motionChanged);
    } else if (typeof reduceQuery.addListener === "function") {
      reduceQuery.addListener(motionChanged);
    }

    if (reduced && visible) draw(22000, true);
    else if (visible) play();

    return {
      stop: function stop() {
        if (stopped) return;
        stopped = true;
        pause();
        if (observer) observer.disconnect();
        if (typeof reduceQuery.removeEventListener === "function") {
          reduceQuery.removeEventListener("change", motionChanged);
        } else if (typeof reduceQuery.removeListener === "function") {
          reduceQuery.removeListener(motionChanged);
        }
      }
    };
  };
}());
