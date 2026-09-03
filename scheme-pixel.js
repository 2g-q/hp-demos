/*
 * 斜め見下ろしのRPG風オフィス。木目の床(茶系3段階)の上に、向きの違う机の島、
 * フロアを見渡すCIOの大型デスク、職種ごとに小物で描き分けた働く人物を置く。
 * 全ての家具と人物は足元のY座標で毎フレーム並べ替えてから描く(depth sort)。
 * ドットは全て内部座標(640x400)の整数格子に乗せ、fillRectの横帯だけで塗る
 * (arc/ellipse/lineToは使わない=アンチエイリアスの中間色が出ない)。
 * 例外は各AI社員の頭上の役割ラベルだけ: SCALE倍(1280x800)の座標系でfillTextし、
 * ドットは粗いまま文字だけ鮮明に読めるようにする。
 * 色は床と木製家具の茶3段のほかは指定5色とその混色だけを使う。
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
    dark: mix(C.black, C.charcoal, 0.65),
    wall: mix(C.white, C.gray, 0.30), wallShade: mix(C.gray, C.white, 0.28),
    // 茶系はここだけ。床と木製家具に限り3段階まで使う(依頼主の許可済み)。
    woodL: "#BCA284", woodM: "#9C8365", woodD: "#71583F",
    sky: mix(C.blue, C.white, 0.45), skyLight: mix(C.blue, C.white, 0.68),
    curtain: mix(C.gray, C.white, 0.34), curtainShade: C.gray,
    pale: mix(C.white, C.gray, 0.16), skin: mix(C.white, C.gray, 0.28),
    screen: mix(C.blue, C.white, 0.24), leaf: mix(C.charcoal, C.gray, 0.55),
    rug: mix(C.gray, C.white, 0.30), rugDot: mix(C.gray, C.white, 0.06)
  };

  function painter(context) {
    // 内部座標の整数格子に乗せた fillRect だけで描く。パスAPIは一切使わない。
    function band(x, y, w, h, color) {
      context.fillStyle = color;
      context.fillRect(x * SCALE, y * SCALE, w * SCALE, h * SCALE);
    }
    return {
      rect: function (x, y, w, h, color) {
        band(Math.round(x), Math.round(y), Math.round(w), Math.round(h), color);
      },
      // 多角形も走査線方式: 1行(内部1px)ごとに辺との交点を整数へ丸め、
      // fillRectの横帯を積む。斜めの辺は自然に階段状になる。
      poly: function (points, color) {
        var n = points.length, minY = Infinity, maxY = -Infinity, i;
        for (i = 0; i < n; i += 1) {
          if (points[i][1] < minY) minY = points[i][1];
          if (points[i][1] > maxY) maxY = points[i][1];
        }
        for (var y = Math.round(minY); y < Math.round(maxY); y += 1) {
          var sy = y + 0.5, xs = [];
          for (i = 0; i < n; i += 1) {
            var a = points[i], b = points[(i + 1) % n];
            if ((a[1] <= sy && b[1] > sy) || (b[1] <= sy && a[1] > sy)) {
              xs.push(a[0] + (sy - a[1]) / (b[1] - a[1]) * (b[0] - a[0]));
            }
          }
          xs.sort(function (p, q) { return p - q; });
          for (i = 0; i + 1 < xs.length; i += 2) {
            var x0 = Math.round(xs[i]), x1 = Math.round(xs[i + 1]);
            if (x1 > x0) band(x0, y, x1 - x0, 1, color);
          }
        }
      },
      // だ円も走査線方式: 行ごとに半幅 round(rx*sqrt(1-t^2)) を整数で求めて横帯を塗る。
      // 行の標本を ry+0.5 で割ることで最上段・最下段が1pxの尖りにならず平らに納まる。
      ellipse: function (cx, cy, rx, ry, color) {
        cx = Math.round(cx); cy = Math.round(cy); rx = Math.round(rx); ry = Math.round(ry);
        for (var dy = -ry; dy <= ry; dy += 1) {
          var t = dy / (ry + 0.5);
          var hw = Math.round(rx * Math.sqrt(Math.max(0, 1 - t * t)));
          band(cx - hw, cy + dy, hw * 2 + 1, 1, color);
        }
      }
    };
  }

  // 職種の描き分けは色でなく、髪型(shape)・フード・ネクタイ・持ち物・卓上小物で行う。
  var ROLE_STYLES = {
    audit: [
      { shape: 0, hairC: mix(C.black, C.charcoal, 0.65), shirtC: mix(C.gray, C.white, 0.24), paper: true },
      { shape: 2, hairC: C.charcoal, shirtC: mix(C.charcoal, C.white, 0.30) }
    ],
    keiri: [
      { shape: 1, hairC: mix(C.black, C.charcoal, 0.5), shirtC: mix(C.gray, C.white, 0.36) },
      { shape: 2, hairC: C.gray, shirtC: mix(C.charcoal, C.white, 0.22) }
    ],
    eng4: [
      { shape: 3, hairC: C.charcoal, shirtC: C.charcoal, hoodie: true },
      { shape: 0, hairC: mix(C.black, C.charcoal, 0.65), shirtC: mix(C.charcoal, C.blue, 0.35), hoodie: true }
    ],
    eng2: [
      { shape: 1, hairC: C.black, shirtC: mix(C.charcoal, C.white, 0.14), hoodie: true },
      { shape: 3, hairC: C.gray, shirtC: C.gray }
    ]
  };
  var ST_CIO = { shape: 3, hairC: mix(C.gray, C.white, 0.45), shirtC: C.white, tie: true };
  var WALKER_STYLES = [
    { shape: 1, hairC: C.charcoal, shirtC: mix(C.charcoal, C.white, 0.26) },
    { shape: 3, hairC: mix(C.black, C.charcoal, 0.65), shirtC: C.charcoal, hoodie: true },
    { shape: 0, hairC: C.gray, shirtC: mix(C.gray, C.white, 0.20) },
    { shape: 2, hairC: C.black, shirtC: mix(C.white, C.gray, 0.16), papers: true }
  ];
  var ST_MEET1 = { shape: 2, hairC: C.charcoal, shirtC: mix(C.gray, C.white, 0.30) };
  var ST_MEET2 = { shape: 1, hairC: mix(C.black, C.charcoal, 0.6), shirtC: mix(C.charcoal, C.white, 0.26) };
  var ST_SOFA = { shape: 0, hairC: C.charcoal, shirtC: mix(C.gray, C.white, 0.32) };
  // 役割ラベル(頭上に出す短い日本語)。数値・件数・時刻は書かない=役割名だけ。
  var ROLE_LABELS = { audit: "監査", keiri: "経理", eng4: "エンジニア", eng2: "エンジニア" };
  var WALKER_ROLES = ["営業", "開発", "企画", "秘書"];

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

    // 役割ラベル: ドットは内部座標で粗いまま、文字だけSCALE倍(1280x800)の座標系で
    // fillTextして鮮明に描く。フォントはOS標準ゴシックのみ(外部フォントなし)。
    // 帯は単色(半透明にしない)・角丸なしの矩形。描画は毎フレーム最後にまとめて行う。
    var labels = [];
    function label(text, cx, top) { labels.push({ t: text, x: cx, y: top }); }
    function drawLabels() {
      ctx.font = "bold 13px 'Hiragino Kaku Gothic ProN', 'Hiragino Sans', 'Yu Gothic', 'Meiryo', sans-serif";
      ctx.textAlign = "center"; ctx.textBaseline = "middle";
      for (var i = 0; i < labels.length; i += 1) {
        var la = labels[i], cx = Math.round(la.x * SCALE), top = Math.round(la.y * SCALE);
        var w = Math.ceil(ctx.measureText(la.t).width) + 10, h = 18;
        ctx.fillStyle = C.charcoal; ctx.fillRect(cx - Math.round(w / 2), top, w, h);
        ctx.fillStyle = C.white; ctx.fillText(la.t, cx, top + 10);
      }
      labels.length = 0;
    }

    function windowPane(x, width) {
      s.rect(x - 3, 15, width + 6, 51, P.dark); s.rect(x, 18, width, 43, P.sky);
      s.rect(x + 3, 21, width - 6, 12, P.skyLight);
      s.rect(x + 10, 26, 22, 4, C.white); s.rect(x + 16, 23, 12, 3, C.white);
      s.rect(x + width - 34, 36, 18, 3, C.white);
      s.rect(x + width / 2 - 1, 18, 3, 43, P.dark); s.rect(x, 42, width, 3, P.dark);
      s.rect(x - 8, 13, 8, 57, P.curtain); s.rect(x + width, 13, 8, 57, P.curtain);
      s.rect(x - 6, 17, 2, 48, P.curtainShade); s.rect(x + width + 3, 17, 2, 48, P.curtainShade);
    }

    function buildStatic() {
      s.rect(0, 0, W, H, C.black);
      // 床: 明るい茶の板張り。継ぎ目を段ごとにずらし、木目の筋を散らす。
      s.rect(8, 86, W - 16, H - 94, P.woodM);
      for (var py = 90; py < 384; py += 13) {
        s.rect(8, py, W - 16, 1, P.woodD);
        var off = (Math.floor((py - 90) / 13) % 3) * 31;
        for (var px = 8 - off; px < W - 8; px += 93) {
          s.rect(px + 2, py + 1, 1, 12, P.woodD);
          s.rect(px + 20, py + 5, 26, 2, P.woodL);
          s.rect(px + 58, py + 9, 15, 1, P.woodD);
        }
      }
      // 壁と幅木。床との境に薄い影を落として接地感を出す。
      s.rect(8, 8, W - 16, 72, P.wall); s.rect(8, 78, W - 16, 6, P.wallShade);
      s.rect(8, 84, W - 16, 3, P.woodD);
      windowPane(84, 104); windowPane(400, 104);
      // ホワイトボード(中央・CIO席の後ろ)。付箋と図形だけで文字は描かない。
      s.rect(252, 15, 116, 49, P.dark); s.rect(256, 19, 108, 41, C.white);
      s.rect(264, 27, 19, 13, mix(C.blue, C.white, 0.62)); s.rect(292, 25, 31, 3, C.gray);
      s.rect(292, 33, 22, 3, P.wallShade); s.rect(330, 28, 23, 18, P.pale);
      s.rect(260, 54, 23, 4, C.blue);
      // 時計
      s.ellipse(225, 38, 17, 17, P.dark); s.ellipse(225, 38, 13, 13, C.white);
      s.rect(224, 27, 2, 12, C.black); s.rect(224, 37, 8, 2, C.black);
      // 折れ線のポスター
      s.rect(512, 18, 28, 36, P.dark); s.rect(515, 21, 22, 30, C.white);
      s.poly([[517, 46], [524, 32], [529, 40], [535, 27], [535, 48]], mix(C.blue, C.white, 0.48));
      // ミーティングコーナーのラグ(床の一部なので静的側に描く)
      s.rect(392, 250, 114, 106, P.wallShade);
      s.rect(396, 254, 106, 98, P.rug);
      for (var ry = 260; ry < 346; ry += 10) for (var rx = 402; rx < 494; rx += 12) {
        if ((rx + ry) % 3 === 0) s.rect(rx, ry, 4, 2, P.rugDot);
      }
      // 外枠は最後に描いて床の板が縁へはみ出さないようにする。
      s.rect(8, 8, 6, H - 16, P.dark); s.rect(W - 14, 8, 6, H - 16, P.dark);
      s.rect(8, H - 14, W - 16, 6, P.dark);
    }

    // ---- 人物 ----
    function person(x, y, dir, frame, st, seated) {
      var bob = seated ? frame % 2 : (frame === 1 || frame === 3 ? 1 : 0);
      var side = dir === "left" || dir === "right", back = dir === "up";
      if (!seated) ellipse(x + 12, y + 30, 11, 4, P.woodD); // 床の影(座る人は椅子・ソファが接地を示す)
      rect(x + 5, y + 2 + bob, 15, 5, st.hairC);
      if (st.shape === 0) rect(x + 2, y + 6 + bob, 5, 9, st.hairC);
      if (st.shape === 1) rect(x + 18, y + 5 + bob, 5, 8, st.hairC);
      if (st.shape === 2) { rect(x + 3, y + bob, 5, 7, st.hairC); rect(x + 17, y + 3 + bob, 5, 5, st.hairC); }
      rect(x + 4, y + 6 + bob, 17, 11, P.skin);
      rect(x + 4, y + 5 + bob, 17, 4, st.hairC);
      if (back) rect(x + 5, y + 7 + bob, 15, 8, st.hairC);
      else if (side) rect(x + (dir === "left" ? 5 : 18), y + 11 + bob, 2, 2, C.black);
      else { rect(x + 8, y + 11 + bob, 2, 2, C.black); rect(x + 15, y + 11 + bob, 2, 2, C.black); }
      rect(x + 4, y + 17 + bob, 17, 11, st.shirtC);
      if (st.hoodie) {
        var hood = mix(st.shirtC, C.white, 0.30);
        if (back) { rect(x + 6, y + 15 + bob, 13, 7, hood); rect(x + 8, y + 17 + bob, 9, 4, st.shirtC); }
        else {
          rect(x + 4, y + 16 + bob, 4, 4, hood); rect(x + 17, y + 16 + bob, 4, 4, hood);
          rect(x + 11, y + 20 + bob, 1, 6, hood); rect(x + 13, y + 20 + bob, 1, 6, hood);
        }
      }
      if (st.tie && !back) { rect(x + 10, y + 17 + bob, 5, 2, C.white); rect(x + 11, y + 18 + bob, 3, 7, C.blue); }
      rect(x + 1, y + 18 + bob, 4, 8, P.skin); rect(x + 21, y + 18 + bob, 4, 8, P.skin);
      if (st.papers && !back) { // 抱えた書類の束(秘書)
        rect(x + 4, y + 20 + bob, 13, 7, C.white); rect(x + 4, y + 20 + bob, 13, 2, P.pale);
        rect(x + 4, y + 26 + bob, 13, 1, C.gray);
      }
      if (st.paper && !back) { // 片手にかざした1枚の書類(監査)
        rect(x + 16, y + 12 + bob, 10, 12, C.white);
        rect(x + 18, y + 15 + bob, 6, 1, C.gray); rect(x + 18, y + 18 + bob, 6, 1, C.gray);
        rect(x + 18, y + 21 + bob, 3, 2, C.blue);
      }
      if (!seated) {
        var stride = frame % 2 ? 2 : 0;
        rect(x + 5 + stride, y + 28 + bob, 6, 6, P.dark); rect(x + 14 - stride, y + 28 + bob, 6, 6, P.dark);
      }
    }

    function chairTop(x, y) { // 手前向きに座る人の後ろへ見える背もたれ
      rect(x + 2, y - 4, 21, 9, P.dark); rect(x + 4, y - 2, 17, 6, C.charcoal);
    }
    // 手前のPCデスク(deskAway)の椅子。高さ関係(内部座標・deskY基準):
    //   机の天板前縁 = deskY+15 / 座面 = deskY+26 / キャラの腰(胴の下端) = deskY+32(座面に重なる)
    //   頭頂 = deskY+6 = 天板より9px上 → 上半身が天板の上に出てモニタを見る姿勢になる。
    function chairSeat(x, py) { // 座面と脚。人より先に描き、その上に人を乗せる
      rect(x - 1, py + 22, 27, 7, C.charcoal);
      rect(x + 10, py + 29, 5, 8, P.dark);
      rect(x + 5, py + 36, 15, 2, P.dark);
    }
    function chairBack(x, py) { // 手前側の低い背もたれ。人の後に重ねる
      rect(x + 1, py + 25, 23, 9, P.dark); rect(x + 3, py + 26, 19, 7, C.charcoal);
    }

    // ---- モニタ ----
    function monitorBack(x, y, lit) { // 背面(画面が奥を向く)
      rect(x, y, 25, 17, C.charcoal);
      rect(x + 2, y + 3, 21, 2, P.wallShade); rect(x + 2, y + 7, 21, 2, P.wallShade);
      if (lit) rect(x + 1, y - 1, 23, 1, P.screen);
      rect(x + 10, y + 17, 5, 4, P.dark); rect(x + 6, y + 21, 13, 2, P.dark);
    }
    function monitorFront(x, y, lit, code) { // 画面がこちらを向く
      rect(x, y, 27, 17, C.black);
      rect(x + 3, y + 3, 21, 10, lit ? C.blue : P.wallShade);
      if (lit && code) {
        rect(x + 5, y + 5, 9, 1, P.screen); rect(x + 5, y + 7, 13, 1, mix(C.blue, C.white, 0.6));
        rect(x + 7, y + 9, 8, 1, P.screen); rect(x + 5, y + 11, 11, 1, P.screen);
      } else if (lit) { rect(x + 5, y + 5, 13, 2, P.screen); rect(x + 5, y + 9, 9, 1, P.screen); }
      rect(x + 11, y + 17, 5, 5, P.dark); rect(x + 6, y + 22, 15, 3, P.dark);
    }

    // ---- 机(共通の天板+前面。斜め見下ろしを全家具で統一) ----
    function deskBody(x, y) {
      rect(x + 7, y + 9, 120, 48, P.woodD);
      poly([[x, y + 5], [x + 111, y + 5], [x + 121, y + 15], [x + 10, y + 15]], P.woodL);
      rect(x + 10, y + 15, 111, 26, P.woodM); rect(x + 10, y + 15, 111, 2, P.woodL);
      rect(x + 61, y + 17, 3, 24, P.woodD);
      rect(x + 16, y + 41, 7, 17, P.woodD); rect(x + 108, y + 41, 7, 17, P.woodD);
    }

    function roleProps(role, x, y) {
      if (role === "audit") { // 虫めがねと、青いチェックの入った書類
        ellipse(x + 51, y + 9, 4, 3, C.charcoal); ellipse(x + 51, y + 9, 2, 1, P.screen);
        rect(x + 55, y + 11, 6, 2, C.charcoal);
        rect(x + 98, y + 2, 16, 11, C.white); rect(x + 100, y + 4, 8, 1, C.gray);
        rect(x + 101, y + 8, 2, 2, C.blue); rect(x + 103, y + 10, 2, 2, C.blue);
        rect(x + 105, y + 8, 2, 2, C.blue); rect(x + 107, y + 6, 2, 2, C.blue);
      }
      if (role === "keiri") { // 電卓と書類の山
        rect(x + 46, y + 2, 12, 11, P.pale); rect(x + 47, y + 3, 10, 3, C.charcoal);
        rect(x + 47, y + 8, 2, 2, P.dark); rect(x + 51, y + 8, 2, 2, P.dark); rect(x + 55, y + 8, 2, 2, P.dark);
        rect(x + 47, y + 11, 2, 2, P.dark); rect(x + 51, y + 11, 2, 2, P.dark);
        rect(x + 98, y + 7, 17, 4, P.wallShade); rect(x + 99, y + 3, 17, 4, C.white);
        rect(x + 100, y, 17, 4, P.pale); rect(x + 100, y - 1, 17, 1, C.white);
      }
    }

    function tower(x, y, phase) { // エンジニア席の小型サーバ
      rect(x, y, 12, 22, C.charcoal);
      rect(x + 2, y + 3, 8, 1, P.wallShade); rect(x + 2, y + 6, 8, 1, P.wallShade);
      if (phase % 2 === 0) rect(x + 8, y + 16, 2, 2, C.blue);
    }

    // 手前を向いた机: モニタの背面が見え、人は奥側に座って顔が見える。
    function deskTowards(x, y, ms, phase, role) {
      var st = ROLE_STYLES[role];
      var f1 = Math.floor(ms / 950) % 2, f2 = Math.floor((ms + 430) / 1250) % 2;
      chairTop(x + 16, y - 26); person(x + 16, y - 26, "down", f1, st[0], true);
      chairTop(x + 68, y - 26); person(x + 68, y - 26, "down", f2, st[1], true);
      label(ROLE_LABELS[role], x + 28, y - 36); label(ROLE_LABELS[role], x + 80, y - 36);
      deskBody(x, y);
      monitorBack(x + 16, y - 6, phase % 4 !== 0);
      monitorBack(x + 68, y - 6, phase % 5 !== 0);
      roleProps(role, x, y);
    }

    // 奥を向いた机: 画面が見え、人は手前側に座って背中が見える。
    function deskAway(x, y, ms, phase, role) {
      var st = ROLE_STYLES[role];
      var f1 = Math.floor(ms / 1050) % 2, f2 = Math.floor((ms + 520) / 1350) % 2;
      deskBody(x, y);
      if (role === "eng4") { // 多モニタのエンジニア島
        monitorFront(x + 12, y - 12, phase % 4 !== 0, true);
        monitorFront(x + 40, y - 12, phase % 6 !== 0, true);
        monitorFront(x + 68, y - 12, phase % 5 !== 0, true);
        monitorFront(x + 96, y - 12, (phase + 2) % 5 !== 0, true);
      } else {
        monitorFront(x + 20, y - 12, phase % 4 !== 0, true);
        monitorFront(x + 77, y - 12, phase % 5 !== 0, true);
        tower(x + 104, y - 6, phase);
      }
      // 座面(y+26)に腰を乗せ、頭頂(y+6)が天板前縁(y+15)より上に出る高さ。
      // 旧実装は py = y+30 で頭頂が天板より17px下=床に座って見えた。
      var py = y + 4;
      chairSeat(x + 16, py); person(x + 16, py, "up", f1, st[0], true); chairBack(x + 16, py);
      chairSeat(x + 68, py); person(x + 68, py, "up", f2, st[1], true); chairBack(x + 68, py);
      label(ROLE_LABELS[role], x + 28, py - 10); label(ROLE_LABELS[role], x + 80, py - 10);
    }

    // CIOの席: 奥の中央。大きな机とワイドモニタ3枚でフロア全体を見渡す。
    function cioUnit(ms, phase) {
      var x = 250, y = 98, f = Math.floor(ms / 1350) % 2;
      rect(303, 60, 32, 32, P.dark); rect(306, 63, 26, 27, C.charcoal); // ハイバックチェア
      person(307, 74, "down", f, ST_CIO, true);
      label("CIO", 319, 62);
      rect(x + 9, y + 9, 138, 48, P.woodD);
      poly([[x, y + 4], [x + 130, y + 4], [x + 142, y + 16], [x + 12, y + 16]], P.woodL);
      rect(x + 12, y + 16, 130, 28, P.woodM); rect(x + 12, y + 16, 130, 2, P.woodL);
      rect(x + 20, y + 44, 8, 12, P.woodD); rect(x + 126, y + 44, 8, 12, P.woodD);
      monitorBack(x + 14, y - 4, phase % 4 !== 0);
      rect(x + 48, y - 8, 44, 20, C.charcoal); // 中央のワイドモニタ(背面)
      rect(x + 51, y - 4, 38, 2, P.wallShade); rect(x + 51, y, 38, 2, P.wallShade);
      if (phase % 3 !== 0) rect(x + 49, y - 9, 42, 1, P.screen);
      rect(x + 66, y + 12, 7, 4, P.dark); rect(x + 60, y + 16, 19, 2, P.dark);
      monitorBack(x + 104, y - 4, (phase + 1) % 4 !== 0);
      rect(x + 118, y + 20, 15, 4, C.white); rect(x + 119, y + 18, 15, 3, P.pale); // 決裁書類
    }

    // ---- 壁ぎわの家具 ----
    function bookshelf(x, y) {
      rect(x + 5, y + 8, 48, 72, P.woodD);
      rect(x, y, 48, 76, P.woodD);
      poly([[x + 3, y - 4], [x + 45, y - 4], [x + 48, y], [x, y]], P.woodL);
      rect(x + 3, y + 3, 42, 69, P.woodM);
      for (var row = 0; row < 3; row += 1) {
        var yy = y + 6 + row * 22;
        for (var b = 0; b < 6; b += 1) {
          var bh = 10 + ((row * 3 + b * 5) % 6);
          var col = (b + row) % 4 === 3 ? mix(C.blue, C.white, 0.4) : ((b + row) % 3 === 0 ? P.pale : ((b + row) % 2 ? C.gray : P.wallShade));
          rect(x + 5 + b * 6, yy + 16 - bh, 5, bh, col);
        }
        rect(x + 3, yy + 16, 42, 4, P.woodL);
      }
    }

    function kitchen(x, y) {
      rect(x + 10, y + 16, 18, 11, P.woodD); rect(x + 13, y + 18, 12, 7, P.pale); // 吊り棚
      rect(x + 43, y, 17, 30, P.dark); rect(x + 46, y + 2, 11, 20, P.screen); // 自販機
      rect(x + 47, y + 5, 9, 4, C.white); rect(x + 47, y + 11, 9, 4, mix(C.blue, C.white, 0.5));
      rect(x + 46, y + 23, 12, 6, P.wallShade);
      poly([[x, y + 27], [x + 62, y + 27], [x + 67, y + 34], [x + 4, y + 34]], P.pale);
      rect(x + 12, y + 21, 9, 6, C.white); rect(x + 20, y + 22, 3, 3, C.white); // ケトル
      rect(x + 4, y + 34, 63, 31, P.woodM); rect(x + 4, y + 34, 63, 2, P.woodL);
      rect(x + 34, y + 36, 2, 28, P.woodD);
      rect(x + 12, y + 42, 6, 2, P.dark); rect(x + 46, y + 42, 6, 2, P.dark);
    }

    function copier(x, y) {
      rect(x + 4, y + 10, 44, 48, P.woodD);
      rect(x + 8, y + 4, 27, 9, C.white);
      poly([[x, y + 12], [x + 38, y + 12], [x + 43, y + 19], [x + 5, y + 19]], P.pale);
      rect(x + 5, y + 19, 38, 32, C.gray);
      rect(x + 10, y + 24, 28, 7, P.dark);
      rect(x + 9, y + 37, 29, 10, P.wall);
      rect(x + 34, y + 26, 3, 3, C.blue);
    }

    function sofa(x, y) {
      rect(x + 4, y + 7, 75, 35, P.woodD);
      rect(x, y, 77, 26, P.dark);
      rect(x + 5, y + 4, 67, 18, mix(C.gray, C.white, 0.16));
      rect(x + 7, y + 9, 29, 11, P.wallShade); rect(x + 40, y + 9, 29, 11, P.wallShade);
      rect(x, y + 22, 77, 13, C.gray);
      rect(x + 7, y + 35, 7, 6, P.woodD); rect(x + 63, y + 35, 7, 6, P.woodD);
    }

    function plant(x, y) {
      rect(x + 10, y + 14, 3, 16, P.dark);
      poly([[x + 11, y + 18], [x, y + 10], [x + 4, y + 4], [x + 13, y + 14]], P.leaf);
      poly([[x + 11, y + 14], [x + 17, y], [x + 23, y + 4], [x + 14, y + 18]], P.pale);
      poly([[x + 13, y + 20], [x + 25, y + 10], [x + 27, y + 17], [x + 15, y + 24]], P.wallShade);
      poly([[x + 4, y + 27], [x + 21, y + 27], [x + 23, y + 31], [x + 2, y + 31]], P.wallShade);
      poly([[x + 3, y + 31], [x + 22, y + 31], [x + 19, y + 43], [x + 6, y + 43]], C.gray);
    }

    function meetingTable(x, y) {
      // 丸テーブル: 影→支柱・台座→厚み→縁→天板の順。全て走査線だ円=行ごとの
      // 整数幅の横帯なので、上面のだ円は階段状の自然な円形になる。
      ellipse(x + 2, y + 9, 52, 23, P.woodD);
      rect(x - 4, y + 16, 9, 22, P.woodD); rect(x - 17, y + 36, 35, 5, P.woodD);
      ellipse(x, y + 5, 50, 22, P.woodD);
      ellipse(x, y, 50, 22, P.woodM);
      ellipse(x, y - 1, 46, 19, P.woodL);
      rect(x - 16, y - 6, 20, 4, C.white); rect(x - 20, y - 2, 20, 1, P.pale);
      rect(x + 12, y + 2, 14, 9, P.pale); rect(x + 13, y + 3, 12, 5, P.screen);
    }

    function meetingUnit(ms) {
      var f1 = Math.floor(ms / 1100) % 2, f2 = Math.floor((ms + 470) / 1300) % 2;
      rect(424, 286, 19, 7, P.dark); // 奥側の丸椅子(座面。人を上に重ねる)
      person(420, 262, "right", f1, ST_MEET1, true);
      label("営業", 432, 252);
      meetingTable(447, 296);
      rect(463, 340, 19, 7, P.dark); // 手前側の丸椅子
      person(460, 316, "left", f2, ST_MEET2, true);
      label("企画", 472, 306);
    }

    function sofaUnit(ms) {
      sofa(506, 290);
      person(524, 282, "down", Math.floor(ms / 1450) % 2, ST_SOFA, true);
      label("人事", 536, 272);
    }

    function bubble(x, y, kind) {
      rect(x + 4, y, 17, 13, C.white); rect(x + 1, y + 3, 3, 7, C.white);
      rect(x + 21, y + 3, 3, 7, C.white); rect(x + 8, y + 13, 4, 4, C.white);
      rect(x + 4, y - 2, 17, 2, P.dark);
      if (kind === 0) { rect(x + 10, y + 3, 5, 5, C.blue); rect(x + 11, y + 8, 3, 3, P.dark); }
      else if (kind === 1) { rect(x + 8, y + 3, 9, 7, P.wallShade); rect(x + 10, y + 5, 5, 1, C.white); }
      else { rect(x + 8, y + 7, 3, 3, C.blue); rect(x + 11, y + 9, 2, 2, C.blue); rect(x + 13, y + 4, 5, 2, C.blue); }
    }

    // ---- 歩行者 ----
    var routes = [
      [[40, 252], [360, 252]],
      [[352, 158], [352, 330]],
      [[22, 140], [22, 346]],
      [[426, 150], [544, 150], [544, 198]]
    ];
    var walkTimes = [11000, 12500, 9500, 13500], pauses = [2600, 3400, 2200, 3900], offsets = [0, 4300, 7900, 11200];
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
      // 歩行者の直後だけに描き、古い足あとほど小さくして消えていく印象にする。
      for (var i = 1; i <= 3; i += 1) {
        var p = routePoint(route, state.progress - i * 0.11, state.forward);
        var size = i < 3 ? 3 : 2;
        rect(p[0] + 7, p[1] + 31, size, size + 2, P.woodD);
        rect(p[0] + 15, p[1] + 34, size, size + 2, P.woodD);
      }
    }

    buildStatic();
    function draw(ms) {
      ctx.drawImage(staticCanvas, 0, 0);
      var phase = Math.floor(ms / 2400);
      var walkers = [], i;
      for (i = 0; i < routes.length; i += 1) {
        walkers.push(walkState(ms, routes[i], walkTimes[i], pauses[i], offsets[i]));
        footprints(routes[i], walkers[i]); // 足あとは床の直上=全エンティティの下
      }
      // 全ての描画対象を足元のYで昇順に並べてから描く(奥→手前)。
      var ents = [];
      function add(sortY, fn) { ents.push({ y: sortY, f: fn }); }
      add(122, function () { bookshelf(18, 48); });
      add(122, function () { kitchen(555, 55); });
      add(135, function () { plant(222, 92); });
      add(135, function () { plant(396, 92); });
      add(154, function () { cioUnit(ms, phase); });
      add(233, function () { copier(577, 178); });
      add(254, function () { deskTowards(48, 196, ms, phase, "audit"); });
      add(254, function () { deskTowards(200, 196, ms + 900, phase + 2, "keiri"); });
      add(336, function () { sofaUnit(ms); });
      add(341, function () { meetingUnit(ms); });
      add(349, function () { plant(596, 306); });
      add(364, function () { deskAway(48, 306, ms + 300, phase + 1, "eng4"); });
      add(364, function () { deskAway(200, 306, ms + 1200, phase + 3, "eng2"); });
      function addWalker(w, st, roleText) {
        add(w.y + 34, function () {
          person(w.x, w.y, w.direction, w.frame, st, false);
          label(roleText, w.x + 12, w.y - 10); // キャラ座標に追従=歩くと文字も一緒に動く
        });
      }
      for (i = 0; i < walkers.length; i += 1) addWalker(walkers[i], WALKER_STYLES[i], WALKER_ROLES[i]);
      ents.sort(function (a, b) { return a.y - b.y; });
      for (i = 0; i < ents.length; i += 1) ents[i].f();
      // 吹き出しは同時に一つまで。記号以外は描かない。
      var bc = ms % 15000;
      if (bc > 2800 && bc < 5200) bubble(60, 138, 1);
      else if (bc > 8200 && bc < 10400) bubble(424, 230, 0);
      else if (bc > 12500 && bc < 14300) bubble(222, 304, 2);
      drawLabels(); // 役割ラベルは最前面。ここだけSCALE座標系のfillText
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
