/*
 * 斜め見下ろしのRPG風オフィス。木目の床(茶系3段階)の上に、向きの違う机の島、
 * フロアを見渡すCIOの大型デスク、職種ごとに小物で描き分けた働く人物を置く。
 * 家具の寸法は基準単位 UNIT(=キャラ立ち姿の全高H=34px) からの比で一元的に算出する
 * (個別の手打ち座標でサイズ感が崩れるのを構造的に防ぐ)。
 * 時計の針と窓の外の明るさは hourOfDay(ms) の1変数だけから計算し、
 * 60秒で24時間が1回りする(朝→昼→夕→夜)。時刻の数字は描かない(針と明るさだけ)。
 * 会話ペア2組(立ち話=開発×監査/ソファ=人事×秘書)は8秒で吹き出しが左右交互に出る。
 * 全ての家具と人物は足元のY座標で毎フレーム並べ替えてから描く(depth sort)。
 * ドットは全て内部座標(640x400)の整数格子に乗せ、fillRectの横帯だけで塗る
 * (arc/ellipse/lineToは使わない=アンチエイリアスの中間色が出ない)。時計の針も
 * 回転した細い四角形を走査線polyで塗る。
 * 例外は各AI社員の頭上の役割ラベルだけ: SCALE倍(1280x800)の座標系でfillTextし、
 * ドットは粗いまま文字だけ鮮明に読めるようにする。
 * 色は床と木製家具の茶3段のほかは指定5色とその混色だけを使う。
 * 朝焼け・夕焼けの暖色も新しい色相は作らず茶3段(woodL/woodM)をそのまま使う。
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
    // 茶系はここだけ。床と木製家具(+朝夕の窓の暖色帯)に限り3段階まで使う(依頼主の許可済み)。
    woodL: "#BCA284", woodM: "#9C8365", woodD: "#71583F",
    sky: mix(C.blue, C.white, 0.45), skyLight: mix(C.blue, C.white, 0.68),
    night: mix(C.black, C.charcoal, 0.50), nightBldg: mix(C.black, C.charcoal, 0.85),
    curtain: mix(C.gray, C.white, 0.34), curtainShade: C.gray,
    pale: mix(C.white, C.gray, 0.16), skin: mix(C.white, C.gray, 0.28),
    screen: mix(C.blue, C.white, 0.24), leaf: mix(C.charcoal, C.gray, 0.55),
    rug: mix(C.gray, C.white, 0.30), rugDot: mix(C.gray, C.white, 0.06)
  };

  // ---- 基準単位: 全家具の寸法はキャラの立ち姿の全高 UNIT からの比で決める ----
  var UNIT = 34;                              // キャラ立ち姿の全高(頭頂y+0〜足先y+34)
  var DESK_H = Math.round(UNIT * 0.42);       // 14 机の天板の高さ(床→天板前縁)
  var DESK_D = Math.round(UNIT * 0.5 * 0.6);  // 10 天板の奥行き(実0.5Hを俯瞰の圧縮0.6で)
  var SLOT_W = Math.round(UNIT * 0.9);        // 31 机の幅/人(スプライト幅25px=0.74Hが収まる最小限)
  var DESK_W = SLOT_W * 2;                    // 62 2人がけの机
  var SEAT_H = Math.round(UNIT * 0.25);       // 9  椅子の座面の高さ
  var BACK_H = Math.round(UNIT * 0.55);       // 19 背もたれ上端(着席時の肩=床+20の1px下=肩より下)
  var SIT_RISE = SEAT_H + 28;                 // 37 着席時の頭頂は床アンカーの37px上(腰=座面に載る)
  var SHELF_H = Math.round(UNIT * 1.1);       // 37 本棚
  var TABLE_R = Math.round(UNIT * 1.2 / 2);   // 20 丸テーブル半径(直径41=1.2H)
  var COUNTER_H = Math.round(UNIT * 0.5);     // 17 給湯カウンター
  var COPIER_H = Math.round(UNIT * 0.6);      // 20 コピー機
  var SOFA_BACK = Math.round(UNIT * 0.6);     // 20 ソファ背もたれ
  var VENDING_H = Math.round(UNIT * 1.1);     // 37 自販機

  // ---- 時刻: 窓と時計は hourOfDay(ms) の1変数だけから計算する(2箇所に時刻を持たない) ----
  var DAY_MS = 60000, START_HOUR = 8;         // 60秒で24時間が1回り。開始は朝8時
  var NOON_MS = Math.round(((12 - START_HOUR + 24) % 24) / 24 * DAY_MS); // reduced時は昼(12時)で静止
  function hourOfDay(ms) { return (START_HOUR + (((ms % DAY_MS) + DAY_MS) % DAY_MS) / DAY_MS * 24) % 24; }
  function daylight(h) { // 0=夜,1=昼。5:30-7:00で明け、18:00-19:30で暮れる
    return Math.max(0, Math.min(1, (h - 5.5) / 1.5, (19.5 - h) / 1.5));
  }
  function horizonGlow(h) { // 朝焼け(6:15前後)と夕焼け(18:45前後)の強さ
    return Math.max(0, 1 - Math.abs(h - 6.25) / 1.25, 1 - Math.abs(h - 18.75) / 1.25);
  }

  // ---- 会話: 吹き出しは8秒で「左→間→右→間」の1往復。0=左が話す/1=右が話す/-1=間 ----
  var CONV_MS = 8000;
  function convTurn(ms, offset) {
    var t = (((ms + offset) % CONV_MS) + CONV_MS) % CONV_MS / CONV_MS;
    if (t < 0.27) return 0;
    if (t >= 0.5 && t < 0.77) return 1;
    return -1;
  }

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
  var ST_SOFA2 = { shape: 2, hairC: mix(C.black, C.charcoal, 0.5), shirtC: mix(C.white, C.gray, 0.20), papers: true };
  var ST_TALK1 = { shape: 1, hairC: C.charcoal, shirtC: mix(C.charcoal, C.white, 0.20), hoodie: true };
  var ST_TALK2 = { shape: 0, hairC: mix(C.black, C.charcoal, 0.6), shirtC: mix(C.gray, C.white, 0.28), paper: true };
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

    // 窓は「枠とカーテン」だけ静的レイヤに置き、空(時刻で変わる)は毎フレーム描き直す。
    function windowPane(x, width) {
      s.rect(x - 3, 15, width + 6, 51, P.dark);
      s.rect(x - 8, 13, 8, 57, P.curtain); s.rect(x + width, 13, 8, 57, P.curtain);
      s.rect(x - 6, 17, 2, 48, P.curtainShade); s.rect(x + width + 3, 17, 2, 48, P.curtainShade);
    }

    // 窓の外: hourOfDay からの明るさだけで朝→昼→夕→夜を表す(時刻の数字は描かない)。
    // 暖色(朝焼け/夕焼け)は茶3段のwoodL/woodMをそのまま使い、新しい色相を作らない。
    function windowSky(x, width, h) {
      var t = daylight(h), g = horizonGlow(h), i, sx, k;
      rect(x, 18, width, 43, mix(P.night, P.sky, t));
      rect(x + 3, 21, width - 6, 12, mix(P.night, P.skyLight, t));
      if (g > 0.25) { // 地平線の暖色帯(茶3段の範囲内のみ)
        rect(x + 2, 52, width - 4, 9, P.woodM);
        rect(x + 2, 56, width - 4, 5, P.woodL);
      }
      if (t < 0.5) { // 夜: 星と街のシルエット+窓明かり
        for (i = 0; i < 7; i += 1) {
          sx = x + 6 + (i * 17 + (i * i * 5) % 9) % (width - 12);
          rect(sx, 20 + (i * 7) % 16, 1, 1, C.white);
        }
        for (i = 0; i < 5; i += 1) {
          sx = x + 4 + i * Math.floor((width - 10) / 5);
          k = (i * 3 + 4) % 7;
          rect(sx, 49 - k, 13, 12 + k, P.nightBldg);
          rect(sx + 3, 52, 2, 2, P.screen); rect(sx + 8, 55, 2, 2, mix(C.white, C.gray, 0.2));
        }
      } else { // 昼: 雲
        rect(x + 10, 26, 22, 4, C.white); rect(x + 16, 23, 12, 3, C.white);
        rect(x + width - 34, 36, 18, 3, C.white);
      }
      rect(x + Math.floor(width / 2) - 1, 18, 3, 43, P.dark); // 桟は空の上に描き直す
      rect(x, 42, width, 3, P.dark);
    }

    // 時計の針: 回転した細い四角形を走査線polyで塗る(arcは使わない)。
    function clockHand(cx, cy, turns, len, wHalf, color) {
      var a = turns * Math.PI * 2, dx = Math.sin(a), dy = -Math.cos(a);
      var nx = -dy * wHalf, ny = dx * wHalf;
      poly([[cx - nx, cy - ny], [cx + nx, cy + ny],
        [cx + dx * len + nx, cy + dy * len + ny], [cx + dx * len - nx, cy + dy * len - ny]], color);
    }
    function clockFace(h) { // 短針=(h%12)/12周・長針=h%1周。hはwindowSkyと同じ変数
      ellipse(225, 38, 17, 17, P.dark); ellipse(225, 38, 13, 13, C.white);
      rect(224, 27, 3, 2, C.black); rect(224, 48, 3, 2, C.black);
      rect(213, 37, 2, 3, C.black); rect(236, 37, 2, 3, C.black);
      clockHand(225, 38, (h % 12) / 12, 7, 1, C.black);
      clockHand(225, 38, h % 1, 11, 1, C.black);
      rect(224, 37, 3, 3, C.black);
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
      // 折れ線のポスター
      s.rect(512, 18, 28, 36, P.dark); s.rect(515, 21, 22, 30, C.white);
      s.poly([[517, 46], [524, 32], [529, 40], [535, 27], [535, 48]], mix(C.blue, C.white, 0.48));
      // ミーティングコーナーのラグ(床の一部なので静的側に描く)
      s.rect(416, 236, 108, 62, P.wallShade);
      s.rect(420, 240, 100, 54, P.rug);
      for (var ry = 246; ry < 290; ry += 10) for (var rx = 426; rx < 514; rx += 12) {
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
      if (!seated) ellipse(x + 12, y + 30, 11, 4, P.woodD); // 床の影(座る人は椅子側が接地を示す)
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

    // ---- 椅子(全て床アンカーycから比で算出。座面=yc-SEAT_H・背もたれ上端=yc-BACK_H) ----
    function chairTop(x, py) { // 奥側(手前向きに座る人)の背後に見える背もたれの縁
      rect(x + 1, py + 13, 23, 10, P.dark); rect(x + 3, py + 15, 19, 8, C.charcoal);
    }
    function chairFront(x, yc) { // 前列の椅子: 座面から下(支柱・台座)を床yc まで降ろして接地させる
      ellipse(x + 12, yc, 11, 3, P.woodD);              // 接地影
      rect(x + 11, yc - SEAT_H + 2, 4, SEAT_H - 3, P.dark); // 支柱
      rect(x + 5, yc - 2, 15, 2, P.dark);               // 台座(床に接地)
      rect(x + 3, yc - 1, 3, 2, C.charcoal); rect(x + 19, yc - 1, 3, 2, C.charcoal); // キャスター
      rect(x + 1, yc - SEAT_H, 23, 3, C.charcoal);      // 座面(上端=yc-SEAT_H)
    }
    function chairBack(x, yc) { // 前列の背もたれ。上端=yc-BACK_H(肩の1px下)。肩幅より狭く=腕が横に見える
      rect(x + 5, yc - BACK_H, 15, BACK_H - SEAT_H + 1, P.dark);
      rect(x + 7, yc - BACK_H + 1, 11, 8, C.charcoal);
    }

    // ---- モニタ ----
    function monitorBack(x, y, lit) { // 背面(画面が奥を向く)。y=画面上端。全高17
      rect(x, y, 25, 12, C.charcoal);
      rect(x + 2, y + 2, 21, 2, P.wallShade); rect(x + 2, y + 6, 21, 2, P.wallShade);
      if (lit) rect(x + 1, y - 1, 23, 1, P.screen);
      rect(x + 10, y + 12, 5, 3, P.dark); rect(x + 6, y + 15, 13, 2, P.dark);
    }
    function monitorFront(x, y, lit, code) { // 画面がこちらを向く。y=画面上端。全高21
      rect(x, y, 27, 15, C.black);
      rect(x + 2, y + 2, 23, 11, lit ? C.blue : P.wallShade);
      if (lit && code) {
        rect(x + 4, y + 4, 9, 1, P.screen); rect(x + 4, y + 6, 13, 1, mix(C.blue, C.white, 0.6));
        rect(x + 6, y + 8, 8, 1, P.screen); rect(x + 4, y + 10, 11, 1, P.screen);
      } else if (lit) { rect(x + 4, y + 4, 13, 2, P.screen); rect(x + 4, y + 8, 9, 1, P.screen); }
      rect(x + 11, y + 15, 5, 4, P.dark); rect(x + 7, y + 19, 13, 2, P.dark);
    }

    // ---- 机(共通ブロック): 前面の高さ=DESK_H・天板の奥行き=DESK_D。全ての机がこれを使う ----
    function deskBlock(x, yd, w) {
      rect(x, yd - DESK_H - DESK_D, w, DESK_D, P.woodL); // 天板
      rect(x, yd - DESK_H, w, DESK_H, P.woodM);          // 前面
      rect(x, yd - DESK_H, w, 1, P.woodD);               // 天板前縁
      rect(x + 1, yd - DESK_H + 2, 1, DESK_H - 4, P.woodD);
      rect(x + w - 2, yd - DESK_H + 2, 1, DESK_H - 4, P.woodD);
      rect(x, yd - 2, 3, 2, P.woodD); rect(x + w - 3, yd - 2, 3, 2, P.woodD); // 脚元
      rect(x + 1, yd, w - 2, 1, P.woodD);                // 接地影
    }

    function roleProps(role, x, yd) { // 卓上小物はモニタ台座の間(x+22〜x+39)の帯に置く
      if (role === "audit") { // チェック入りの書類と虫めがね
        rect(x + 24, yd - 20, 7, 5, C.white); rect(x + 25, yd - 19, 3, 1, C.gray);
        rect(x + 25, yd - 17, 2, 1, C.blue);
        ellipse(x + 36, yd - 18, 2, 2, C.charcoal); rect(x + 38, yd - 17, 3, 1, C.charcoal);
      }
      if (role === "keiri") { // 電卓と書類の山
        rect(x + 23, yd - 21, 6, 7, P.pale); rect(x + 24, yd - 20, 4, 2, C.charcoal);
        rect(x + 24, yd - 17, 1, 1, P.dark); rect(x + 26, yd - 17, 1, 1, P.dark);
        rect(x + 24, yd - 15, 1, 1, P.dark);
        rect(x + 31, yd - 18, 8, 2, C.white); rect(x + 32, yd - 20, 7, 2, P.pale);
      }
    }

    function tower(x, ya, phase) { // 床置きの小型サーバ(エンジニア島の目印)
      rect(x, ya - 22, 12, 22, C.charcoal);
      rect(x + 2, ya - 19, 8, 1, P.wallShade); rect(x + 2, ya - 16, 8, 1, P.wallShade);
      if (phase % 2 === 0) rect(x + 8, ya - 6, 2, 2, C.blue);
    }

    // 手前向きの机: 人は机の奥。腰(py+28=yd-19)が天板の帯(yd-24〜yd-14)に隠れ、
    // 頭頂(yd-47)と上半身が天板の上に出る。目(py+11=yd-36)はモニタ上端(yd-33)より上。
    function deskTowards(x, yd, ms, phase, role) {
      var st = ROLE_STYLES[role];
      var f1 = Math.floor(ms / 950) % 2, f2 = Math.floor((ms + 430) / 1250) % 2;
      var py = yd - 47;
      chairTop(x + 3, py); person(x + 3, py, "down", f1, st[0], true);
      chairTop(x + 34, py); person(x + 34, py, "down", f2, st[1], true);
      deskBlock(x, yd, DESK_W);
      monitorBack(x + 2, yd - 33, phase % 4 !== 0);
      monitorBack(x + 34, yd - 33, phase % 5 !== 0);
      roleProps(role, x, yd);
      label(ROLE_LABELS[role], x + 31, py - 12); // 頭上。モニタ(上端yd-33)とは重ならない
    }

    // 奥向きの机(手前列): 人は机の手前に座り背中が見える。椅子は支柱・台座で床に接地。
    // 頭頂(yc-37=yd-25)は天板前縁(yd-14)より11px上。背もたれ上端(yc-19)は肩(yc-20)の下。
    function deskAway(x, yd, ms, phase, role) {
      var st = ROLE_STYLES[role];
      var f1 = Math.floor(ms / 1050) % 2, f2 = Math.floor((ms + 520) / 1350) % 2;
      var yc = yd + 12, py = yc - SIT_RISE;
      deskBlock(x, yd, DESK_W);
      monitorFront(x + 2, yd - 37, phase % 4 !== 0, true);
      monitorFront(x + 33, yd - 37, phase % 5 !== 0, true);
      if (role === "eng4") tower(x + DESK_W + 3, yd, phase);
      chairFront(x + 3, yc); person(x + 3, py, "up", f1, st[0], true); chairBack(x + 3, yc);
      chairFront(x + 34, yc); person(x + 34, py, "up", f2, st[1], true); chairBack(x + 34, yc);
      label(ROLE_LABELS[role], x + 31, yd - 48); // モニタ上端(yd-37)より上に逃がす
    }

    // CIOの席: 奥の中央。机の幅だけ広く(76px)、高さ・奥行きの比は共通。
    function cioUnit(ms, phase) {
      var x = 282, yd = 152, f = Math.floor(ms / 1350) % 2;
      var py = yd - 47;
      rect(305, py - 4, 31, 30, P.dark); rect(307, py - 2, 27, 26, C.charcoal); // ハイバックチェア
      person(308, py, "down", f, ST_CIO, true);
      label("CIO", 320, py - 16);
      deskBlock(x, yd, 76);
      monitorBack(x + 1, yd - 33, phase % 4 !== 0);
      monitorBack(x + 50, yd - 33, (phase + 1) % 4 !== 0);
      rect(x + 33, yd - 20, 12, 3, C.white); rect(x + 34, yd - 22, 12, 3, P.pale); // 決裁書類
    }

    // ---- 壁ぎわの家具(高さは全てUNIT比) ----
    function bookshelf(x, ya) { // 高さ=SHELF_H(1.1H)
      rect(x, ya - SHELF_H - 5, 48, 5, P.woodL);
      rect(x, ya - SHELF_H, 48, SHELF_H, P.woodD);
      rect(x + 3, ya - SHELF_H + 3, 42, SHELF_H - 6, P.woodM);
      for (var row = 0; row < 2; row += 1) {
        var yy = ya - SHELF_H + 3 + row * 16;
        for (var b = 0; b < 6; b += 1) {
          var bh = 8 + ((row * 3 + b * 5) % 5);
          var col = (b + row) % 4 === 3 ? mix(C.blue, C.white, 0.4) : ((b + row) % 3 === 0 ? P.pale : ((b + row) % 2 ? C.gray : P.wallShade));
          rect(x + 5 + b * 6, yy + 13 - bh, 5, bh, col);
        }
        rect(x + 3, yy + 13, 42, 3, P.woodL);
      }
    }

    function kitchen(x, ya) { // カウンター=0.5H・自販機=1.1H
      rect(x + 8, ya - 44, 18, 9, P.woodD); rect(x + 10, ya - 42, 14, 5, P.pale); // 吊り棚
      rect(x + 42, ya - VENDING_H, 17, VENDING_H, P.dark); // 自販機
      rect(x + 44, ya - VENDING_H + 2, 13, 18, P.screen);
      rect(x + 45, ya - VENDING_H + 4, 11, 4, C.white);
      rect(x + 45, ya - VENDING_H + 10, 11, 4, mix(C.blue, C.white, 0.5));
      rect(x + 44, ya - 8, 13, 5, P.wallShade);            // 取り出し口
      rect(x, ya - COUNTER_H - 5, 40, 5, P.pale);          // カウンター天面
      rect(x, ya - COUNTER_H, 40, COUNTER_H, P.woodM);
      rect(x, ya - COUNTER_H, 40, 1, P.woodL);
      rect(x + 18, ya - COUNTER_H + 2, 1, COUNTER_H - 4, P.woodD);
      rect(x + 6, ya - COUNTER_H - 9, 8, 5, C.white); rect(x + 13, ya - COUNTER_H - 8, 2, 3, C.white); // ケトル
      rect(x + 26, ya - COUNTER_H - 7, 4, 3, P.screen);    // カップ
    }

    function copier(x, ya) { // 高さ=0.6H
      rect(x + 2, ya - 1, 26, 1, P.dark);
      rect(x, ya - COPIER_H - 5, 30, 5, P.pale);
      rect(x, ya - COPIER_H, 30, COPIER_H, C.gray);
      rect(x + 3, ya - COPIER_H + 3, 18, 4, P.dark);
      rect(x + 23, ya - COPIER_H + 3, 3, 2, C.blue);
      rect(x + 4, ya - 10, 22, 5, P.wall);
    }

    function sofa(x, ya) { // 背もたれ上端=床+SOFA_BACK+奥行き6・座面=床+SEAT_H+4
      rect(x + 3, ya - 4, 62, 4, P.woodD);                 // 接地影
      rect(x, ya - SOFA_BACK - 6, 68, 12, P.dark);         // 背もたれ(奥側)
      rect(x + 3, ya - SOFA_BACK - 3, 62, 7, mix(C.gray, C.white, 0.16));
      rect(x, ya - 16, 6, 12, P.dark); rect(x + 62, ya - 16, 6, 12, P.dark); // 肘掛け
      rect(x + 4, ya - 13, 60, 6, P.wallShade);            // 座クッション
      rect(x + 4, ya - 7, 60, 5, C.gray);                  // 座の前面
      rect(x + 8, ya - 2, 6, 2, P.woodD); rect(x + 54, ya - 2, 6, 2, P.woodD); // 脚(床まで)
    }

    function lowTable(x, ya) { // ソファ前のローテーブル(高さ≈0.3H)
      rect(x + 2, ya - 6, 3, 6, P.woodD); rect(x + 23, ya - 6, 3, 6, P.woodD); // 脚(接地)
      rect(x, ya - 10, 28, 4, P.woodL); rect(x, ya - 7, 28, 1, P.woodD);       // 天板
      rect(x + 8, ya - 12, 9, 3, C.white);                                     // 雑誌
    }

    function plant(x, ya) { // 全高≈1.0H
      ellipse(x + 12, ya, 9, 3, P.woodD);
      poly([[x + 4, ya - 15], [x + 21, ya - 15], [x + 22, ya - 12], [x + 3, ya - 12]], P.wallShade);
      poly([[x + 5, ya - 12], [x + 20, ya - 12], [x + 17, ya - 1], [x + 8, ya - 1]], C.gray);
      rect(x + 11, ya - 26, 3, 12, P.dark);
      poly([[x + 12, ya - 22], [x + 2, ya - 28], [x + 6, ya - 33], [x + 14, ya - 24]], P.leaf);
      poly([[x + 12, ya - 25], [x + 17, ya - 34], [x + 22, ya - 30], [x + 15, ya - 22]], P.pale);
      poly([[x + 13, ya - 20], [x + 24, ya - 26], [x + 25, ya - 21], [x + 15, ya - 17]], P.wallShade);
    }

    // 丸テーブル: 直径=TABLE_R*2+1=41(1.2H)・高さ=DESK_H。支柱と台座を床(cy)まで降ろす。
    function meetingTable(cx, cy) {
      ellipse(cx, cy, TABLE_R + 1, 10, P.woodD);           // 接地影
      rect(cx - 3, cy - DESK_H + 2, 6, DESK_H - 3, P.woodD); // 支柱
      rect(cx - 8, cy - 1, 16, 2, P.woodD);                // 台座
      ellipse(cx, cy - DESK_H + 2, TABLE_R, 10, P.woodM);  // 天板の厚み
      ellipse(cx, cy - DESK_H, TABLE_R, 10, P.woodL);      // 天板
      rect(cx - 12, cy - DESK_H - 3, 12, 4, C.white);      // 資料
      rect(cx + 2, cy - DESK_H - 2, 9, 6, P.pale); rect(cx + 3, cy - DESK_H - 1, 7, 3, P.screen); // タブレット
    }

    function stool(x, ya) { // 丸椅子: 座面=床+SEAT_H。脚を床まで降ろし影で接地
      ellipse(x + 12, ya, 8, 3, P.woodD);
      rect(x + 10, ya - SEAT_H + 2, 4, SEAT_H - 2, P.dark);
      ellipse(x + 12, ya - SEAT_H, 8, 3, C.charcoal);
    }

    function meetingUnit(ms) { // 4人が囲める丸テーブル(着席2+空き丸椅子2)
      var cx = 470, cy = 268;
      var f1 = Math.floor(ms / 1100) % 2, f2 = Math.floor((ms + 470) / 1300) % 2;
      stool(cx - 12, cy - 14);                             // 奥の空き席
      stool(cx - 41, cy + 4); person(cx - 41, cy + 4 - SIT_RISE, "right", f1, ST_MEET1, true);
      label("営業", cx - 29, cy + 4 - SIT_RISE - 12);
      meetingTable(cx, cy);
      stool(cx + 17, cy + 6); person(cx + 17, cy + 6 - SIT_RISE, "left", f2, ST_MEET2, true);
      label("企画", cx + 29, cy + 6 - SIT_RISE - 12);
      stool(cx - 12, cy + 18);                             // 手前の空き席
    }

    function sofaUnit(ms) { // 会話ペア(座り): ソファで向かい合う人事×秘書
      var x = 310, ya = 356;
      var f1 = Math.floor(ms / 1450) % 2, f2 = Math.floor((ms + 700) / 1250) % 2;
      sofa(x, ya);
      var py = ya - 40; // 腰(py+28)=座クッション上面
      person(x + 6, py, "right", f1, ST_SOFA, true);
      person(x + 37, py, "left", f2, ST_SOFA2, true);
      rect(x + 12, py + 28, 5, 8, P.dark); rect(x + 20, py + 28, 5, 8, P.dark); // 座面から垂れる足
      rect(x + 43, py + 28, 5, 8, P.dark); rect(x + 51, py + 28, 5, 8, P.dark);
      label("人事", x + 18, py - 12);
      label("秘書", x + 49, py - 12);
    }

    // 会話ペア(立ち話): 通路(会議コーナーとソファの間の床)で向かい合う開発×監査。
    // 体の揺れは着席キャラと同程度(1.2〜1.3秒でbob 1px)。歩行はしない。
    function talkPair(ms) {
      var ax = 505, bx = 555, ty = 300; // 2体の間隔=25px(ほぼ1体ぶん)
      var f1 = Math.floor(ms / 1200) % 2, f2 = Math.floor((ms + 600) / 1300) % 2;
      person(ax, ty, "right", f1, ST_TALK1, false);
      person(bx, ty, "left", f2, ST_TALK2, false);
      label("開発", ax + 12, ty - 12);
      label("監査", bx + 12, ty - 12);
    }

    function bubble(x, y, kind) {
      rect(x + 4, y, 17, 13, C.white); rect(x + 1, y + 3, 3, 7, C.white);
      rect(x + 21, y + 3, 3, 7, C.white); rect(x + 8, y + 13, 4, 4, C.white);
      rect(x + 4, y - 2, 17, 2, P.dark);
      if (kind === 0) { rect(x + 10, y + 3, 5, 5, C.blue); rect(x + 11, y + 8, 3, 3, P.dark); }
      else if (kind === 1) { rect(x + 8, y + 3, 9, 7, P.wallShade); rect(x + 10, y + 5, 5, 1, C.white); }
      else { rect(x + 8, y + 7, 3, 3, C.blue); rect(x + 11, y + 9, 2, 2, C.blue); rect(x + 13, y + 4, 5, 2, C.blue); }
    }

    // ---- 歩行者(速度・停止時間は従来のまま) ----
    var routes = [
      [[40, 232], [386, 232]],
      [[254, 150], [254, 320]],
      [[24, 140], [24, 330]],
      [[420, 160], [560, 160], [560, 205]]
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
      var hour = hourOfDay(ms); // 時計と窓はこの1変数だけから計算する
      windowSky(84, 104, hour); windowSky(400, 104, hour);
      clockFace(hour);
      var phase = Math.floor(ms / 2400);
      var walkers = [], i;
      for (i = 0; i < routes.length; i += 1) {
        walkers.push(walkState(ms, routes[i], walkTimes[i], pauses[i], offsets[i]));
        footprints(routes[i], walkers[i]); // 足あとは床の直上=全エンティティの下
      }
      // 全ての描画対象を足元のYで昇順に並べてから描く(奥→手前)。
      var ents = [];
      function add(sortY, fn) { ents.push({ y: sortY, f: fn }); }
      add(131, function () { bookshelf(20, 130); });
      add(131, function () { kitchen(550, 130); });
      add(136, function () { plant(235, 135); });
      add(136, function () { plant(395, 135); });
      add(153, function () { cioUnit(ms, phase); });
      add(249, function () { deskTowards(60, 248, ms, phase, "audit"); });
      add(249, function () { deskTowards(170, 248, ms + 900, phase + 2, "keiri"); });
      add(249, function () { copier(584, 248); });
      add(251, function () { plant(350, 250); });
      add(290, function () { meetingUnit(ms); });
      add(334, function () { talkPair(ms); }); // 立ち話ペアも足元Yで並べ替えに参加
      add(353, function () { plant(594, 352); });
      add(355, function () { lowTable(388, 354); });
      add(357, function () { sofaUnit(ms); });
      add(364, function () { deskAway(60, 348, ms + 300, phase + 1, "eng4"); });
      add(364, function () { deskAway(190, 348, ms + 1200, phase + 3, "eng2"); });
      function addWalker(w, st, roleText) {
        add(w.y + 34, function () {
          person(w.x, w.y, w.direction, w.frame, st, false);
          label(roleText, w.x + 12, w.y - 10); // キャラ座標に追従=歩くと文字も一緒に動く
        });
      }
      for (i = 0; i < walkers.length; i += 1) addWalker(walkers[i], WALKER_STYLES[i], WALKER_ROLES[i]);
      ents.sort(function (a, b) { return a.y - b.y; });
      for (i = 0; i < ents.length; i += 1) ents[i].f();
      // 会話2組の吹き出し: 8秒で左右1往復(交互)+間。中身は記号だけ(数字は入れない)。
      var ta = convTurn(ms, 0), tb = convTurn(ms, 3700);
      if (ta >= 0) bubble(ta === 0 ? 511 : 561, 266, (Math.floor(ms / CONV_MS) * 2 + ta) % 3);
      if (tb >= 0) bubble(tb === 0 ? 322 : 352, 280, (Math.floor((ms + 3700) / CONV_MS) * 2 + tb + 1) % 3);
      // 単発の吹き出し(装飾)。記号以外は描かない。
      var bc = ms % 15000;
      if (bc > 2800 && bc < 5200) bubble(110, 180, 1);
      else if (bc > 8200 && bc < 10400) bubble(432, 200, 0);
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
      if (reduced) draw(NOON_MS); // 静止画は昼(12時)で描く
      else if (!rafId) rafId = window.requestAnimationFrame(frame);
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
