/*
 * 斜め見下ろしのRPG風オフィス(1.5倍スケール版)。
 * 配色は指定5色(#0D0D0D/#FFFFFF/#343541/#8E8EA0/#2563EB)とその混色だけ
 * (茶系3段は廃止=依頼主「最初の色味に戻す」対応)。床は暗めのスレート調の板張りで、
 * 継ぎ目と木目状の筋の質感は保ち、色だけ寒色の濃淡に置き換えた。青は差し色のみ。
 * スマホ対応: 内部座標(640x400)は変えず、UNIT=51(旧34の1.5倍)で描くものを大きくする。
 * キャラは14体(エンジニア島を向かい合わせの4人に増設+右側でコーヒーブレイク中の2人)。
 * 仕事のギミックは「動き」で見せる。歩行の速度は従来のまま(約14px/s)で、経路は
 * 部屋を大きく回る(右の通路x=429/470・下の通路y=318/330・左の通路x=188。走者ごとに
 * レーンを分け、向かい合って詰まる形が構造的に起きないようにしてある):
 *  - 書類運搬(62秒周期): 業務島→CIOデスクへ届け、帰りは部屋を大回りして戻る。
 *    卓上の紙の山は運搬と処理で1段ずつ増減する
 *  - コーヒー(52秒周期): 朝は2往復・昼夕はカップを持ってソファ脇を配って回る・
 *    深夜はまっすぐ戻って一服
 *  - ディスカッション(64秒周期): 開発席の1体が下の通路経由でボード前へ行き
 *    書き手と吹き出しを交互に出して帰席(夕・深夜の周期は席で作業=立たない)
 *  - 席の会話(100秒の予定表で同時に1組だけ): 監査⇄経理が横を向いて話す/
 *    向かい合わせのエンジニアが話す/CIOがフロアを見渡して考える。考え中の
 *    吹き出しは点3つ・ひらめきは電球=記号だけ(文字は入れない)
 *  - ボードの線は書き手の腕の動きに合わせ10秒ごとに1本ずつ増える(30秒で戻る)
 *  - コーヒーブレイクの2人はカップを上げ下げしながら8秒周期で交互に吹き出しを出す
 * 24時間: 時間帯(朝6-10/昼10-18/夕18-22/深夜22-6)は hourOfDay だけから決める。
 * 深夜も全員が残って働く(人数は減らさない)。天井の照明を落とし(黒の半透明を重ねる。
 * 窓の外には重ねない=星を沈めない)、モニタの画面とクリップ式デスクライトだけを
 * 明るいまま描き直す=暗い室内に画面の明かりが浮かぶ。所作は1.5倍ゆっくり(止まらない)。
 * 歩行キャラと家具は足元の占有矩形(フットプリント)を持つ。経路は占有と重ならないよう
 * 設計したうえで、毎フレーム衝突判定し、重なるなら経路上で手前に止まる(resolveActor)。
 * ホバー/タップのギミック: キャラに乗せると「今〜〜中」をドット文字で頭上に出す。
 * ドット文字はオフスクリーンcanvasに小さくfillTextし、getImageDataのアルファを
 * 二値化して1/0の格子を作り、本編にはfillRectの整数ドットだけで描く(本編の
 * canvasに直接fillTextしない=これ以外の文字・数字は一切描かない)。
 * 家具の寸法は基準単位 UNIT(=キャラ立ち姿の全高H=51px) からの比で一元的に算出する。
 * 時計の針と窓の外の明るさは hourOfDay(ms) の1変数だけから計算し、
 * 3分で24時間が1回りする(朝→昼→夕→夜)。時刻の数字は描かない(針と明るさだけ)。
 * 全ての家具と人物は足元のY座標で毎フレーム並べ替えてから描く(depth sort)。
 * ドットは全て内部座標(640x400)の整数格子に乗せ、fillRectの横帯だけで塗る
 * (arc/ellipse/lineToは使わない=丸と斜め辺は走査線方式。時計の針も走査線poly)。
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
    // 床と大型家具のスレート3段(旧・茶3段の置き換え。全て5色の混色)
    slateL: mix(C.charcoal, C.gray, 0.62),
    slateM: mix(C.charcoal, C.gray, 0.30),
    slateD: mix(C.black, C.charcoal, 0.60),
    // 朝焼け/夕焼けの地平線の帯(旧・木目色の置き換え=淡い灰白。新しい色相は作らない)
    glowM: mix(C.gray, C.white, 0.45), glowL: mix(C.white, C.gray, 0.18),
    sky: mix(C.blue, C.white, 0.45), skyLight: mix(C.blue, C.white, 0.68),
    night: mix(C.black, C.charcoal, 0.50), nightBldg: mix(C.black, C.charcoal, 0.85),
    curtain: mix(C.gray, C.white, 0.34), curtainShade: C.gray,
    pale: mix(C.white, C.gray, 0.16), skin: mix(C.white, C.gray, 0.28),
    screen: mix(C.blue, C.white, 0.24), leaf: mix(C.charcoal, C.gray, 0.55),
    rug: mix(C.gray, C.white, 0.30), rugDot: mix(C.gray, C.white, 0.06),
    termBg: mix(C.black, C.charcoal, 0.35), gutter: mix(C.black, C.charcoal, 0.5),
    prompt: mix(C.blue, C.white, 0.6), lineDim: mix(C.gray, C.white, 0.42),
    lineMid: mix(C.gray, C.white, 0.5), codeB: mix(C.blue, C.white, 0.62),
    tipBg: mix(C.black, C.charcoal, 0.30),
    handH: mix(C.charcoal, C.gray, 0.55), handM: mix(C.gray, C.white, 0.35),
    tick: mix(C.gray, C.white, 0.45)
  };

  // ---- 基準単位: 全家具の寸法はキャラの立ち姿の全高 UNIT からの比で決める ----
  var UNIT = 51;                              // キャラ立ち姿の全高(旧34の1.5倍)
  var DESK_H = Math.round(UNIT * 0.42);       // 21 机の天板の高さ(床→天板前縁)
  var DESK_D = Math.round(UNIT * 0.5 * 0.6);  // 15 天板の奥行き(実0.5Hを俯瞰の圧縮0.6で)
  var SLOT_W = Math.round(UNIT * 0.9);        // 46 机の幅/人(スプライト幅38が収まる)
  var DESK_W = SLOT_W * 2;                    // 92 2人がけの机
  var SEAT_H = Math.round(UNIT * 0.25);       // 13 椅子の座面の高さ
  var BACK_H = Math.round(UNIT * 0.55);       // 28 背もたれ上端
  var SIT_RISE = SEAT_H + 42;                 // 55 着席時の頭頂は床アンカーの55px上(腰=座面)
  var SHELF_H = Math.round(UNIT * 1.1);       // 56 本棚
  var COUNTER_H = Math.round(UNIT * 0.5);     // 26 カフェカウンター
  var SOFA_BACK = Math.round(UNIT * 0.6);     // 31 ソファ背もたれ
  var BIN_H = Math.round(UNIT * 0.35);        // 18 ゴミ箱
  var WB_H = Math.round(UNIT * 1.15);         // 59 床置きホワイトボード(脚込み全高)
  var CAFE_W = Math.round(UNIT * 1.35);       // 69 カフェカウンター幅

  // ---- 時刻: 窓と時計は hourOfDay(ms) の1変数だけから計算する(2箇所に時刻を持たない) ----
  var DAY_MS = 180000, START_HOUR = 8;        // 3分で24時間が1回り。開始は朝8時
  var NOON_MS = Math.round(((12 - START_HOUR + 24) % 24) / 24 * DAY_MS); // reduced時は昼で静止
  function hourOfDay(ms) {
    // 毎フレーム時刻を進めると針が回り続けるため、秒未満を捨ててチクタク動かす。
    var tickMs = Math.floor(ms / 1000) * 1000;
    return (START_HOUR + (((tickMs % DAY_MS) + DAY_MS) % DAY_MS) / DAY_MS * 24) % 24;
  }
  function daylight(h) { // 0=夜,1=昼。5:30-7:00で明け、18:00-19:30で暮れる
    return Math.max(0, Math.min(1, (h - 5.5) / 1.5, (19.5 - h) / 1.5));
  }
  function horizonGlow(h) { // 朝焼け(6:15前後)と夕焼け(18:45前後)の強さ
    return Math.max(0, 1 - Math.abs(h - 6.25) / 1.25, 1 - Math.abs(h - 18.75) / 1.25);
  }
  function bandOf(h) { // 時間帯: 0=朝(6-10) 1=昼(10-18) 2=夕(18-22) 3=深夜(22-6)
    return (h >= 22 || h < 6) ? 3 : h < 10 ? 0 : h < 18 ? 1 : 2;
  }
  function nightLevel(h) { // 室内の照明: 0=点いている(昼)→1=落とした深夜。
    if (h >= 20) return Math.min(1, (h - 20) / 2);   // 20時→22時で暗くなり
    if (h < 6.5) return Math.min(1, (6.5 - h) / 1.5); // 5時→6時半で明ける
    return 0;
  }

  // ---- 会話: 吹き出しは8秒で「左→間→右→間」の1往復。0=左が話す/1=右が話す/-1=間 ----
  var CONV_MS = 8000;
  function convTurn(ms, offset) {
    var t = (((ms + offset) % CONV_MS) + CONV_MS) % CONV_MS / CONV_MS;
    if (t < 0.27) return 0;
    if (t >= 0.5 && t < 0.77) return 1;
    return -1;
  }

  // ---- 席の会話・考え事: 100秒の予定表で同時に1組だけ動かす(頻度は控えめ)。
  //      深夜は会話せず「考え中」だけ・夕は席仕事中心=エンジニアの雑談を抜く。 ----
  var CHAT_CYCLE = 100000;
  function chatState(ms, band) {
    var t = ((ms % CHAT_CYCLE) + CHAT_CYCLE) % CHAT_CYCLE, p = null;
    if (t >= 10000 && t < 18000) p = { pair: "audit", t: t - 10000 };     // 監査⇄経理が横を向く
    else if (t >= 35000 && t < 43000) p = { pair: "engv", t: t - 35000 }; // 向かい合わせのエンジニア
    else if (t >= 60000 && t < 72000) p = { pair: "cio", t: t - 60000 };  // CIOがフロアを見渡して考える
    else if (t >= 85000 && t < 91000) p = { pair: "think", t: t - 85000 }; // 考え中の吹き出し
    if (!p) return { pair: null, t: 0 };
    if (band === 3 && p.pair !== "think") return { pair: null, t: 0 };
    if (band === 2 && p.pair === "engv") return { pair: null, t: 0 };
    return p;
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

  // 職種の描き分けは色でなく、髪型(shape)・フード・ネクタイ・持ち物で行う。女性7/14。
  var ST_CIO = { shape: 3, hairC: mix(C.gray, C.white, 0.45), shirtC: C.white, tie: true };
  var ST_AUDIT = { shape: 0, hairC: mix(C.black, C.charcoal, 0.65), shirtC: mix(C.gray, C.white, 0.24), paper: true };
  var ST_KEIRI = { shape: 1, hairC: mix(C.black, C.charcoal, 0.5), shirtC: mix(C.gray, C.white, 0.36), female: true };
  var ST_ENG = { shape: 3, hairC: C.charcoal, shirtC: C.charcoal, hoodie: true };
  var ST_ENG2 = { shape: 0, hairC: mix(C.black, C.charcoal, 0.65), shirtC: mix(C.charcoal, C.blue, 0.35), hoodie: true, female: true };
  var ST_ENG3 = { shape: 1, hairC: mix(C.black, C.charcoal, 0.4), shirtC: mix(C.charcoal, C.gray, 0.25), hoodie: true };
  var ST_ENG4 = { shape: 2, hairC: mix(C.black, C.charcoal, 0.7), shirtC: mix(C.charcoal, C.blue, 0.2), hoodie: true, female: true };
  var ST_WRITER = { shape: 2, hairC: mix(C.black, C.charcoal, 0.45), shirtC: mix(C.blue, C.white, 0.75), female: true };
  var ST_CARRY = { shape: 2, hairC: C.black, shirtC: mix(C.white, C.gray, 0.16), female: true };
  var ST_CARRY_LOADED = { shape: 2, hairC: C.black, shirtC: mix(C.white, C.gray, 0.16), female: true, papers: true };
  var ST_COFFEE = { shape: 0, hairC: C.black, shirtC: mix(C.white, C.gray, 0.22), tie: true };
  var ST_SOFA = { shape: 1, hairC: C.charcoal, shirtC: mix(C.gray, C.white, 0.32), female: true };
  var ST_SOFA2 = { shape: 2, hairC: mix(C.black, C.charcoal, 0.5), shirtC: mix(C.white, C.gray, 0.20), papers: true };
  var ST_BREAK1 = { shape: 1, hairC: mix(C.black, C.charcoal, 0.55), shirtC: mix(C.gray, C.white, 0.4), female: true };
  var ST_BREAK2 = { shape: 0, hairC: mix(C.black, C.charcoal, 0.7), shirtC: mix(C.white, C.gray, 0.26), tie: true };

  // ---- フットプリント(足元の占有矩形 [x,y,w,h])と衝突判定 ----
  function footOf(px, py) { return [px + 6, py + 42, 26, 10]; }
  function hitRect(a, b) {
    return a[0] < b[0] + b[2] && b[0] < a[0] + a[2] && a[1] < b[1] + b[3] && b[1] < a[1] + a[3];
  }
  function hitsAny(r, list) {
    for (var i = 0; i < list.length; i += 1) if (hitRect(r, list[i])) return true;
    return false;
  }
  // 家具の接地矩形。歩行経路はここへ入らないよう設計し、毎フレームの判定は保険。
  var FURNITURE_RECTS = [
    [20, 136, 72, 14],   // 本棚
    [588, 138, 36, 14],  // 観葉植物(右上)
    [96, 158, 92, 48],   // 業務島(机+奥の椅子)
    [272, 158, 114, 48], // CIOデスク
    [64, 232, 92, 33],   // エンジニアの向かい机(北側の増設島)
    [464, 348, 76, 14],  // コーヒーブレイクの2人(カフェ寄りの立ち話)
    [230, 306, 69, 25],  // 床置きホワイトボード
    [330, 290, 102, 33], // ソファ
    [350, 342, 42, 15],  // ローテーブル
    [161, 289, 18, 12],  // 小型サーバ
    [548, 348, 69, 35],  // カフェカウンター
    [24, 371, 15, 10]    // ゴミ箱(左下)
  ];
  var ENG_RECT = [64, 274, 92, 46];    // 開発島(ディスカッション役の自席=本人だけ通過可)
  var WRITER_RECT = [240, 334, 26, 10]; // ボード書き手(定位置)
  var OBST_MAIN = FURNITURE_RECTS.concat([ENG_RECT, WRITER_RECT]);
  var OBST_NO_ENG = FURNITURE_RECTS.concat([WRITER_RECT]);

  // ---- 歩行キャラ3体。状態は全て経過時間だけから決める(立ち話2体・ボード書き手と
  //      合わせて同時に動くのは最大6体。歩行の1区間は8〜14秒のまま=速度は上げない) ----
  function pathMeta(path) {
    var lens = [], total = 0;
    for (var i = 0; i + 1 < path.length; i += 1) {
      var l = Math.abs(path[i + 1][0] - path[i][0]) + Math.abs(path[i + 1][1] - path[i][1]);
      lens.push(l); total += l;
    }
    return { path: path, lens: lens, total: total };
  }
  function pathPoint(meta, part) {
    var dist = Math.max(0, Math.min(1, part)) * meta.total, i = 0;
    while (i < meta.lens.length - 1 && dist > meta.lens[i]) { dist -= meta.lens[i]; i += 1; }
    var a = meta.path[i], b = meta.path[i + 1], f = meta.lens[i] ? dist / meta.lens[i] : 1;
    var dx = b[0] - a[0], dy = b[1] - a[1];
    return { x: Math.round(a[0] + dx * f), y: Math.round(a[1] + dy * f),
      dir: Math.abs(dx) > Math.abs(dy) ? (dx < 0 ? "left" : "right") : (dy < 0 ? "up" : "down") };
  }
  function flipDir(dir) {
    return dir === "left" ? "right" : dir === "right" ? "left" : dir === "up" ? "down" : "up";
  }

  // 運搬の起点は業務島の右端(x=188)。向かい机の増設で島のx帯(64-156)を通れないため、
  // 経路全体を増設島の右側に置く(書類の山x=166も立ち姿で隠さない)。
  // 経路のレーン割り(足元の占有が走者間で重ならない設計。交差は左レーンx=188と
  // 下レーンy=318の1点だけで、そこはresolveActorの巻き戻しで先着優先にする):
  //   運搬=右x=429・下y=330・左x=188 / コーヒー=右x=470・横y=296/200 / 相談=下y=318
  var CARRY_OUT = pathMeta([[188, 178], [330, 178]]);   // 業務島の脇 → CIOデスクの前 142px
  var CARRY_LOOP = pathMeta([[330, 178], [429, 178], [429, 330], [188, 330], [188, 178]]); // 大回りの帰り 644px
  var CARRY_BACK = pathMeta([[330, 178], [188, 178]]);  // 深夜の直帰 142px
  var COFFEE_DOWN = pathMeta([[560, 152], [560, 296]]); // 右上 → カフェカウンターの前 144px
  var COFFEE_LOOP = pathMeta([[560, 296], [470, 296], [470, 200], [560, 200], [560, 152]]); // 配って回る帰り 324px
  var TALK_META = pathMeta([[115, 267], [115, 318], [188, 318], [272, 318], [272, 296]]);   // 自席→下の通路→ボード前 230px
  var CARRY_CYCLE = 62000, COFFEE_CYCLE = 52000, TALK_CYCLE = 64000;

  // その周期の振る舞いは「周期の開始時刻の時間帯」で決める。周期の境界では全員が
  // 定位置に戻っているので、時間帯が切り替わっても位置が飛ばない(ワープしない)。
  function cycleStartBand(ms, offset, cycle) {
    var t = (((ms + offset) % cycle) + cycle) % cycle;
    return bandOf(hourOfDay(ms - t));
  }

  // 書類運搬(62秒周期): 拾う2秒→届ける10秒(142px/10s)→渡す4秒→帰りは右→下→左と
  // 部屋を大回り46秒(644px/46s=14px/s=速度は従来のまま)。深夜の周期だけ直帰し、
  // 残り時間は自席脇で資料整理(歩き回らない=静かな夜)。
  function carrierState(ms) {
    var band = cycleStartBand(ms, 0, CARRY_CYCLE);
    var t = ((ms % CARRY_CYCLE) + CARRY_CYCLE) % CARRY_CYCLE, p;
    if (t < 2000) p = { x: 188, y: 178, dir: "down", moving: false };
    else if (t < 12000) { p = pathPoint(CARRY_OUT, (t - 2000) / 10000); p.moving = true; }
    else if (t < 16000) p = { x: 330, y: 178, dir: "down", moving: false };
    else if (band === 3) {
      if (t < 26000) { p = pathPoint(CARRY_BACK, (t - 16000) / 10000); p.moving = true; }
      else p = { x: 188, y: 178, dir: "down", moving: false, sorting: true };
    } else { p = pathPoint(CARRY_LOOP, (t - 16000) / 46000); p.moving = true; p.patrol = true; }
    p.loaded = t >= 1000 && t < 12000;
    return p;
  }
  // コーヒー(52秒周期): 朝はまっすぐの往復を2回(コーヒーを取りにいく人が増える朝)。
  // 昼・夕はカップを持ってソファ脇(x=470の縦通路)を配って回る(324px/29s=11px/s)。
  // 深夜はまっすぐ戻って自分の席で一服(歩き回らない)。
  function coffeeState(ms) {
    var band = cycleStartBand(ms, 9000, COFFEE_CYCLE);
    var t = (((ms + 9000) % COFFEE_CYCLE) + COFFEE_CYCLE) % COFFEE_CYCLE, p, u;
    if (band === 0) {
      u = t % 26000;
      if (u < 3000) p = { x: 560, y: 152, dir: "down", moving: false, home: true };
      else if (u < 13000) { p = pathPoint(COFFEE_DOWN, (u - 3000) / 10000); p.moving = true; }
      else if (u < 16000) p = { x: 560, y: 296, dir: "down", moving: false, atCounter: true };
      else { p = pathPoint(COFFEE_DOWN, 1 - (u - 16000) / 10000); p.dir = flipDir(p.dir); p.moving = true; p.cup = true; }
      return p;
    }
    if (t < 5000) p = { x: 560, y: 152, dir: "down", moving: false, home: true };
    else if (t < 15000) { p = pathPoint(COFFEE_DOWN, (t - 5000) / 10000); p.moving = true; }
    else if (t < 19000) p = { x: 560, y: 296, dir: "down", moving: false, atCounter: true };
    else if (band === 3) {
      if (t < 29000) { p = pathPoint(COFFEE_DOWN, 1 - (t - 19000) / 10000); p.dir = flipDir(p.dir); p.moving = true; p.cup = true; }
      else p = { x: 560, y: 152, dir: "down", moving: false, cup: true, home: true };
    } else if (t < 48000) { p = pathPoint(COFFEE_LOOP, (t - 19000) / 29000); p.moving = true; p.cup = true; p.serving = true; }
    else p = { x: 560, y: 152, dir: "down", moving: false, cup: true, home: true };
    return p;
  }
  // ディスカッション(64秒周期): 着席10秒→下の通路(y=318)経由で16秒歩き(230px/16s)→
  // ボード前で12秒会話→同じ道を16秒で帰席→10秒着席。夕・深夜の周期は席を立たない。
  function discussState(ms) {
    var band = cycleStartBand(ms, 27000, TALK_CYCLE);
    var t = (((ms + 27000) % TALK_CYCLE) + TALK_CYCLE) % TALK_CYCLE, p;
    if (band >= 2 || t < 10000) return { mode: "seat", t: t };
    if (t < 26000) { p = pathPoint(TALK_META, (t - 10000) / 16000); p.mode = "out"; p.moving = true; return p; }
    if (t < 38000) return { mode: "talk", x: 272, y: 296, dir: "left", moving: false, t: t - 26000 };
    p = pathPoint(TALK_META, 1 - (t - 38000) / 16000); p.dir = flipDir(p.dir);
    p.mode = "back"; p.moving = true; return p;
  }
  // 衝突したら経路上で手前に止まる(時間を最大4秒巻き戻す=位置は経路沿いに連続)。
  function resolveActor(stateFn, ms, obstacles) {
    var s = stateFn(ms), back = 0;
    while (back < 4000 && hitsAny(footOf(s.x, s.y), obstacles)) {
      back += 250;
      s = stateFn(Math.max(0, ms - back));
    }
    return s;
  }

  // ---- ホバー/タップの「今〜〜中」ドット文字 ----
  // オフスクリーンに10pxでfillTextし、アルファ>=110で二値化した1/0格子をキャッシュする。
  // 本編には2x2の整数ドット(fillRect)だけで描く=本編のcanvasには文字APIを使わない。
  var TIP_FONT = 10, TIP_ALPHA_MIN = 110, TIP_DOT = 2;
  var glyphCache = {};
  function rasterText(text) {
    if (glyphCache[text]) return glyphCache[text];
    var cw = text.length * (TIP_FONT + 2) + 8, chh = TIP_FONT + 8;
    var off = document.createElement("canvas");
    off.width = cw; off.height = chh;
    var g = off.getContext("2d");
    var out = { dots: [], w: 0, h: 0 };
    if (g && typeof g.getImageData === "function") {
      g.font = TIP_FONT + "px 'Hiragino Kaku Gothic ProN', 'Yu Gothic', sans-serif";
      g.textBaseline = "top";
      g.fillStyle = "#FFFFFF";
      g.fillText(text, 2, 2);
      var data = g.getImageData(0, 0, cw, chh).data;
      var minX = cw, maxX = -1, minY = chh, maxY = -1, x, y;
      for (y = 0; y < chh; y += 1) for (x = 0; x < cw; x += 1) {
        if (data[(y * cw + x) * 4 + 3] >= TIP_ALPHA_MIN) {
          out.dots.push([x, y]);
          if (x < minX) minX = x; if (x > maxX) maxX = x;
          if (y < minY) minY = y; if (y > maxY) maxY = y;
        }
      }
      if (out.dots.length) {
        out.w = maxX - minX + 1; out.h = maxY - minY + 1;
        for (var i = 0; i < out.dots.length; i += 1) {
          out.dots[i][0] -= minX; out.dots[i][1] -= minY;
        }
      }
    }
    glyphCache[text] = out;
    return out;
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
    // 時間帯の共有状態(毎フレームdrawの冒頭でhourOfDayだけから再計算する。ここ以外に
    // 時刻を持たない)。glowsは「照明を落とした後も明るいまま描き直すもの」の再描画列。
    var nightT = 0, SLOW = 1, chatNow = { pair: null, t: 0 }, glows = [];

    // 窓は「枠とカーテン」だけ静的レイヤに置き、空(時刻で変わる)は毎フレーム描き直す。
    function windowPane(x, width) {
      s.rect(x - 4, 18, width + 8, 72, P.dark);
      s.rect(x - 12, 16, 12, 78, P.curtain); s.rect(x + width, 16, 12, 78, P.curtain);
      s.rect(x - 9, 21, 3, 66, P.curtainShade); s.rect(x + width + 5, 21, 3, 66, P.curtainShade);
    }

    // 窓の外: hourOfDay からの明るさだけで朝→昼→夕→夜を表す(時刻の数字は描かない)。
    // 朝焼け/夕焼けの帯は淡い灰白(glowM/glowL)=5色の混色のみで、暖色の色相は作らない。
    function windowSky(x, width, h) {
      var t = daylight(h), g = horizonGlow(h), i, sx, k;
      // 建物は昼夜で分岐させない。同じ算式で形を決め、空に対する明るさだけを変える。
      var buildingColor = mix(P.nightBldg, P.wallShade, t * 0.72);
      rect(x, 22, width, 62, mix(P.night, P.sky, t));
      rect(x + 4, 26, width - 8, 18, mix(P.night, P.skyLight, t));
      if (g > 0.25) { // 地平線の明るい帯(混色のみ)
        rect(x + 3, 71, width - 6, 13, P.glowM);
        rect(x + 3, 77, width - 6, 7, P.glowL);
      }
      if (t < 0.5) { // 夜: 星
        for (i = 0; i < 8; i += 1) {
          sx = x + 8 + (i * 23 + (i * i * 7) % 13) % (width - 16);
          rect(sx, 26 + (i * 9) % 22, 2, 2, C.white);
        }
      } else { // 昼: 雲
        rect(x + 14, 32, 32, 6, C.white); rect(x + 22, 28, 18, 4, C.white);
        rect(x + width - 48, 48, 26, 4, C.white);
      }
      for (i = 0; i < 5; i += 1) {
        sx = x + 6 + i * Math.floor((width - 14) / 5);
        k = (i * 4 + 6) % 10;
        rect(sx, 66 - k, 19, 18 + k, buildingColor);
        if (t < 0.5) {
          rect(sx + 4, 71, 3, 3, P.screen); rect(sx + 11, 76, 3, 3, mix(C.white, C.gray, 0.2));
        }
      }
      rect(x + Math.floor(width / 2) - 2, 22, 4, 62, P.dark); // 桟は空の上に描き直す
      rect(x, 56, width, 4, P.dark);
    }

    // 時計の針: 回転した細い四角形を走査線polyで塗る(arcは使わない)。
    function clockHand(cx, cy, turns, len, wHalf, color) {
      var a = turns * Math.PI * 2, dx = Math.sin(a), dy = -Math.cos(a);
      var nx = -dy * wHalf, ny = dx * wHalf;
      poly([[cx - nx, cy - ny], [cx + nx, cy + ny],
        [cx + dx * len + nx, cy + dy * len + ny], [cx + dx * len - nx, cy + dy * len - ny]], color);
    }
    function clockFace(h) { // 短針=(h%12)/12周・長針=h%1周。hはwindowSkyと同じ変数
      // 針・縁・目盛りは灰系の細い描画で控えめに(目立たせない)。
      ellipse(320, 54, 24, 24, P.wallShade); ellipse(320, 54, 20, 20, C.white);
      rect(318, 38, 5, 3, P.tick); rect(318, 68, 5, 3, P.tick);
      rect(303, 52, 3, 5, P.tick); rect(335, 52, 3, 5, P.tick);
      clockHand(320, 54, (h % 12) / 12, 10, 1, P.handH);
      clockHand(320, 54, h % 1, 16, 0.8, P.handM);
      rect(319, 53, 3, 3, P.handH);
    }

    function buildStatic() {
      s.rect(0, 0, W, H, C.black);
      // 床: 暗めのスレート調の板張り。継ぎ目を段ごとにずらし、木目状の筋を散らす
      // (質感は旧・木目床のまま、色だけ寒色=slate3段に置き換え)。
      s.rect(8, 100, W - 16, H - 108, P.slateM);
      for (var py = 112; py < H - 20; py += 20) {
        s.rect(8, py, W - 16, 1, P.slateD);
        var off = (Math.floor((py - 112) / 20) % 3) * 47;
        for (var px = 8 - off; px < W - 8; px += 140) {
          s.rect(px + 3, py + 1, 1, 19, P.slateD);
          s.rect(px + 30, py + 7, 40, 2, P.slateL);
          s.rect(px + 88, py + 13, 22, 1, P.slateD);
        }
      }
      // 壁と幅木。床との境に薄い影を落として接地感を出す。
      s.rect(8, 8, W - 16, 92, P.wall); s.rect(8, 100, W - 16, 6, P.wallShade);
      s.rect(8, 106, W - 16, 3, P.slateD);
      windowPane(56, 150); windowPane(434, 150);
      // 折れ線のポスター(文字は描かない)
      s.rect(228, 26, 42, 52, P.dark); s.rect(232, 30, 34, 44, C.white);
      s.poly([[235, 66], [245, 46], [252, 58], [262, 38], [262, 70], [235, 70]], mix(C.blue, C.white, 0.48));
      s.rect(370, 30, 40, 44, P.dark); s.rect(374, 34, 32, 36, C.white);
      s.rect(378, 40, 14, 10, mix(C.blue, C.white, 0.62)); s.rect(378, 56, 24, 3, C.gray);
      s.rect(378, 62, 18, 3, P.wallShade);
      // ソファコーナーのラグ(床の一部なので静的側。点描はまばらに=うるささを抑える)
      s.rect(316, 296, 132, 76, P.wallShade);
      s.rect(320, 300, 124, 68, P.rug);
      for (var ry = 308; ry < 360; ry += 16) for (var rx = 328; rx < 436; rx += 20) {
        if ((rx + ry) % 3 === 0) s.rect(rx, ry, 5, 3, P.rugDot);
      }
      // 外枠は最後に描いて床の板が縁へはみ出さないようにする。
      s.rect(8, 8, 6, H - 16, P.dark); s.rect(W - 14, 8, 6, H - 16, P.dark);
      s.rect(8, H - 14, W - 16, 6, P.dark);
    }

    // ---- 人物(全高UNIT=51px・幅38px。旧スプライトの各寸法を1.5倍) ----
    function person(x, y, dir, frame, st, seated) {
      // 着席時の振り幅は3px(歩行時は2pxのまま)=「せかせか働いている」動きを読みやすく。
      var bob = seated ? (frame % 2) * 3 : (frame === 1 || frame === 3 ? 1 : 0) * 2;
      var side = dir === "left" || dir === "right", back = dir === "up";
      if (!seated) ellipse(x + 19, y + 46, 16, 6, P.slateD); // 床の影
      rect(x + 8, y + 3 + bob, 22, 8, st.hairC);
      if (st.shape === 0) rect(x + 3, y + 9 + bob, 8, 14, st.hairC);
      if (st.shape === 1) rect(x + 27, y + 8 + bob, 8, 12, st.hairC);
      if (st.shape === 2) { rect(x + 4, y + bob, 8, 10, st.hairC); rect(x + 26, y + 4 + bob, 8, 8, st.hairC); }
      rect(x + 6, y + 9 + bob, 26, 17, P.skin);
      rect(x + 6, y + 8 + bob, 26, 6, st.hairC);
      if (back) rect(x + 8, y + 11 + bob, 22, 12, st.hairC);
      else if (side) rect(x + (dir === "left" ? 8 : 27), y + 17 + bob, 3, 3, C.black);
      else { rect(x + 12, y + 17 + bob, 3, 3, C.black); rect(x + 23, y + 17 + bob, 3, 3, C.black); }
      rect(x + 6, y + 26 + bob, 26, 16, st.shirtC);
      if (st.female) {
        // 配色を増やさず、肩までの後ろ髪と腰の輪郭だけで差を付ける。
        rect(x + 3, y + 12 + bob, 6, 21, st.hairC); rect(x + 29, y + 12 + bob, 6, 21, st.hairC);
        rect(x + 9, y + 38 + bob, 20, 6, st.shirtC);
      }
      if (st.hoodie) {
        var hood = mix(st.shirtC, C.white, 0.30);
        if (back) { rect(x + 9, y + 23 + bob, 20, 10, hood); rect(x + 12, y + 26 + bob, 14, 6, st.shirtC); }
        else {
          rect(x + 6, y + 24 + bob, 6, 6, hood); rect(x + 26, y + 24 + bob, 6, 6, hood);
          rect(x + 17, y + 30 + bob, 2, 9, hood); rect(x + 20, y + 30 + bob, 2, 9, hood);
        }
      }
      if (st.tie && !back) { rect(x + 15, y + 26 + bob, 8, 3, C.white); rect(x + 17, y + 28 + bob, 5, 10, C.blue); }
      var armY = y + 27 + bob + (seated && frame % 2 ? 2 : 0); // 腕は体より大きく上下する
      rect(x + 2, armY, 6, 12, P.skin); rect(x + 32, armY, 6, 12, P.skin);
      if (st.papers && !back) { // 抱えた書類の束
        rect(x + 6, y + 30 + bob, 20, 10, C.white); rect(x + 6, y + 30 + bob, 20, 3, P.pale);
        rect(x + 6, y + 39 + bob, 20, 2, C.gray);
      }
      if (st.paper && !back) { // 片手にかざした1枚の書類(監査)
        rect(x + 24, y + 18 + bob, 15, 18, C.white);
        rect(x + 27, y + 22 + bob, 9, 2, C.gray); rect(x + 27, y + 27 + bob, 9, 2, C.gray);
        rect(x + 27, y + 32 + bob, 5, 3, C.blue);
      }
      if (!seated) {
        var stride = frame % 2 ? 3 : 0;
        rect(x + 8 + stride, y + 42 + bob, 9, 9, P.dark);
        rect(x + 21 - stride, y + 42 + bob, 9, 9, P.dark);
      }
    }

    // ---- 椅子(全て床アンカーycから比で算出。座面=yc-SEAT_H・背もたれ上端=yc-BACK_H) ----
    function chairTop(x, py) { // 奥側(手前向きに座る人)の背後に見える背もたれの縁
      rect(x + 2, py + 20, 34, 15, P.dark); rect(x + 5, py + 23, 28, 12, C.charcoal);
    }
    function chairFront(x, yc) { // 前列の椅子: 座面から下(支柱・台座)を床ycまで降ろす
      ellipse(x + 18, yc, 16, 4, P.slateD);
      rect(x + 16, yc - SEAT_H + 3, 6, SEAT_H - 4, P.dark);
      rect(x + 8, yc - 3, 22, 3, P.dark);
      rect(x + 4, yc - 2, 5, 3, C.charcoal); rect(x + 29, yc - 2, 5, 3, C.charcoal);
      rect(x + 2, yc - SEAT_H, 34, 4, C.charcoal);
    }
    function chairBack(x, yc) { // 前列の背もたれ。肩幅より狭く=腕が横に見える
      rect(x + 8, yc - BACK_H, 22, BACK_H - SEAT_H + 2, P.dark);
      rect(x + 11, yc - BACK_H + 2, 16, 12, C.charcoal);
    }

    // ---- モニタ ----
    function monitorBack(x, y, lit) { // 背面(画面が奥を向く)。y=画面上端
      rect(x, y, 37, 18, C.charcoal);
      rect(x + 3, y + 3, 31, 3, P.wallShade); rect(x + 3, y + 9, 31, 3, P.wallShade);
      rect(x + 26, y - 4, 9, 3, P.dark);       // クリップ式デスクライトの笠(常設)
      rect(x + 29, y - 1, 3, 1, C.charcoal);   // 留め具
      if (lit) rect(x + 2, y - 1, 24, 1, P.screen);
      rect(x + 15, y + 18, 7, 4, P.dark); rect(x + 9, y + 22, 19, 3, P.dark);
      if (nightT > 0.3) glows.push(function () { // 深夜: デスクライトと画面の縁明かり
        rect(x + 27, y - 3, 7, 1, P.glowL);
        ctx.globalAlpha = 0.45 * nightT;
        ellipse(x + 30, y + 2, 8, 3, P.glowL); // 手元の明かりだまり
        if (lit) { ctx.globalAlpha = 0.3 * nightT; rect(x + 2, y - 2, 24, 2, P.screen); }
        ctx.globalAlpha = 1;
      });
    }
    // 画面がこちらを向く。エンジニア席は端末風/エディタ風の抽象画面(記号と横線だけ。
    // 文字・数字は描かない)。行はterm=2.6秒/edit=3.1秒間隔で1本ずつ増えて流れる。
    // カーソルの点滅は2.4秒トグル(1周期4.8秒)。
    function monitorFront(x, y, lit, ms, kind, seed) {
      function content() { // 画面の中身。深夜は照明を落とした後にもう一度これを描く
        rect(x + 3, y + 3, 34, 16, lit ? (kind === "term" ? P.termBg : C.charcoal) : P.wallShade);
        if (lit && kind === "term") {
          var tn = 2 + Math.floor((ms + seed * 1700) / 2600) % 3, tw = 0, ti;
          for (ti = 0; ti < tn; ti += 1) {
            tw = 6 + (seed * 3 + ti * 5) % 13;
            rect(x + 6, y + 6 + ti * 3, 2, 2, P.prompt);
            rect(x + 9, y + 6 + ti * 3, tw, 2, ti % 3 === 1 ? P.screen : P.lineDim);
          }
          if (Math.floor(ms / 2400) % 2 === 0) rect(x + 10 + tw, y + 6 + (tn - 1) * 3, 3, 2, C.white);
        } else if (lit && kind === "edit") {
          rect(x + 3, y + 3, 4, 16, P.gutter);
          var en = 3 + Math.floor((ms + seed * 2100) / 3100) % 3, ei;
          for (ei = 0; ei < en; ei += 1) {
            rect(x + 4, y + 6 + ei * 3, 2, 2, C.gray);
            rect(x + 9 + [0, 1, 2, 1][(ei + seed) % 4] * 4, y + 6 + ei * 3,
              7 + (seed * 5 + ei * 7) % 12, 2,
              [P.screen, P.codeB, P.lineMid][(ei + seed) % 3]);
          }
        } else if (lit) { rect(x + 6, y + 6, 19, 3, P.screen); rect(x + 6, y + 12, 13, 2, P.screen); }
      }
      rect(x, y, 40, 22, C.black);
      content();
      rect(x + 16, y + 22, 8, 5, P.dark); rect(x + 10, y + 27, 20, 3, P.dark);
      if (lit && nightT > 0.15) glows.push(function () { // 深夜: 画面の光だけが浮かぶ
        ctx.globalAlpha = 0.3 * nightT; rect(x + 1, y + 1, 38, 20, P.screen);
        ctx.globalAlpha = 0.16 * nightT; rect(x + 6, y + 27, 28, 8, P.screen); // 机への照り返し
        ctx.globalAlpha = 1; content();
      });
    }

    // ---- 机(共通ブロック): 前面の高さ=DESK_H・天板の奥行き=DESK_D ----
    function deskBlock(x, yd, w) {
      rect(x, yd - DESK_H - DESK_D, w, DESK_D, P.slateL); // 天板
      rect(x, yd - DESK_H, w, DESK_H, P.slateM);          // 前面
      rect(x, yd - DESK_H, w, 1, P.slateD);               // 天板前縁
      rect(x + 1, yd - DESK_H + 3, 1, DESK_H - 6, P.slateD);
      rect(x + w - 2, yd - DESK_H + 3, 1, DESK_H - 6, P.slateD);
      rect(x, yd - 3, 4, 3, P.slateD); rect(x + w - 4, yd - 3, 4, 3, P.slateD); // 脚元
      rect(x + 1, yd, w - 2, 1, P.slateD);                // 接地影
    }

    // 卓上の書類の山: 高さh段。運搬と処理で時間とともに増減する。
    function paperStack(x, yb, h) {
      for (var i = 0; i < h; i += 1) {
        rect(x, yb - (i + 1) * 4, 18, 4, i % 2 ? P.pale : C.white);
        rect(x, yb - i * 4 - 1, 18, 1, P.wallShade);
      }
    }

    function tower(x, ya, phase) { // 床置きの小型サーバ(開発島の目印)
      rect(x, ya - 33, 18, 33, C.charcoal);
      rect(x + 3, ya - 28, 12, 2, P.wallShade); rect(x + 3, ya - 23, 12, 2, P.wallShade);
      if (phase % 2 === 0) rect(x + 12, ya - 9, 3, 3, C.blue);
    }

    // 手前向きの机: 人は机の奥。腰(py+42)が天板の帯(yd-36〜yd-21)に隠れ、上半身が出る。
    function deskTowards(x, yd, ms, phase) {
      var f1 = Math.floor(ms / (950 * SLOW)) % 2, f2 = Math.floor((ms + 430) / (1250 * SLOW)) % 2;
      var py = yd - 70;
      var chat = chatNow.pair === "audit"; // 相談タイム: 隣同士が横を向いて話す
      chairTop(x + 5, py); person(x + 5, py, chat ? "right" : "down", f1, ST_AUDIT, true);
      chairTop(x + 51, py); person(x + 51, py, chat ? "left" : "down", f2, ST_KEIRI, true);
      deskBlock(x, yd, DESK_W);
      monitorBack(x + 4, yd - 49, phase % 4 !== 0);
      monitorBack(x + 51, yd - 49, phase % 5 !== 0);
      if (nightT > 0.3) glows.push(function () { // 深夜: 画面の明かりが顔に当たる
        ctx.globalAlpha = 0.14 * nightT;
        if (phase % 4 !== 0) rect(x + 11, py + 9, 26, 17, P.screen);
        if (phase % 5 !== 0) rect(x + 57, py + 9, 26, 17, P.screen);
        ctx.globalAlpha = 1;
      });
      // 経理の電卓(職種の描き分け)
      rect(x + 38, yd - 30, 9, 11, P.pale); rect(x + 39, yd - 28, 7, 3, C.charcoal);
      rect(x + 39, yd - 24, 2, 2, P.dark); rect(x + 43, yd - 24, 2, 2, P.dark);
      rect(x + 39, yd - 21, 2, 2, P.dark);
    }

    // 奥向きの机(手前列): 人は机の手前に座り背中が見える。椅子は支柱・台座で床に接地。
    function deskAway(x, yd, ms, phase, hideSecond) {
      var f1 = Math.floor(ms / (1050 * SLOW)) % 2, f2 = Math.floor((ms + 520) / (1350 * SLOW)) % 2;
      var yc = yd + 18, py = yc - SIT_RISE;
      deskBlock(x, yd, DESK_W);
      // 開発席は端末風とエディタ風。seedはxから決めて行の長さを変える。消灯させない。
      monitorFront(x + 3, yd - 55, true, ms, "term", (x + 3) % 7);
      monitorFront(x + 49, yd - 55, true, ms, "edit", (x + 5) % 7);
      tower(x + DESK_W + 5, yd, phase);
      chairFront(x + 5, yc); person(x + 5, py, "up", f1, ST_ENG, true); chairBack(x + 5, yc);
      chairFront(x + 51, yc);
      if (!hideSecond) person(x + 51, py, "up", f2, ST_ENG2, true); // 離席中は椅子だけ
      chairBack(x + 51, yc);
    }

    // エンジニアの向かい机(北側の増設島): 既存の島(deskAway)と天板を背中合わせに接し、
    // 4人が向かい合って座る形にする。こちら側の2人は机の奥で手前向き=顔が見える。
    // モニタは2人へ向く=背面(monitorBack)が見え、既存側のモニタと背中合わせに並ぶ。
    function deskFacing(x, yd, ms) {
      var f1 = Math.floor(ms / (900 * SLOW)) % 2, f2 = Math.floor((ms + 460) / (1150 * SLOW)) % 2;
      var py = yd - 70;
      chairTop(x + 5, py); person(x + 5, py, "down", f1, ST_ENG3, true);
      chairTop(x + 51, py); person(x + 51, py, "down", f2, ST_ENG4, true);
      deskBlock(x, yd, DESK_W);
      monitorBack(x + 4, yd - 49, true);   // 開発席なので消灯させない
      monitorBack(x + 51, yd - 49, true);
      if (nightT > 0.3) glows.push(function () { // 深夜: 画面の明かりが顔に当たる
        ctx.globalAlpha = 0.14 * nightT;
        rect(x + 11, py + 9, 26, 17, P.screen); rect(x + 57, py + 9, 26, 17, P.screen);
        ctx.globalAlpha = 1;
      });
    }

    // コーヒーブレイクの2人(カフェカウンター寄りの立ち話)。向かい合って立ち、
    // カップを持つ手が交互に上下する(吹き出しはdraw側で8秒周期の交互)。
    function breakDuo(ms) {
      var y = 308;
      var gA = Math.floor(ms / (1150 * SLOW)) % 2, gB = Math.floor((ms + 600) / (1300 * SLOW)) % 2;
      person(458, y, "right", 0, ST_BREAK1, false);
      person(508, y, "left", 0, ST_BREAK2, false);
      coffeeCup(487, y + 25 - gA * 2);
      coffeeCup(503, y + 25 - gB * 2);
    }

    // CIOの席: 上壁の中央。机の幅だけ広く(114px)、高さ・奥行きの比は共通。
    function cioUnit(ms, phase) {
      var x = 272, yd = 205, f = Math.floor(ms / (1350 * SLOW)) % 2;
      var py = yd - 70;
      // CIOの見渡しタイム: 左→正面(考え中)→右→正面(ひらめき)と顔の向きを変える
      var lookDir = "down";
      if (chatNow.pair === "cio") lookDir = chatNow.t < 3000 ? "left" : chatNow.t < 6000 ? "down" : chatNow.t < 9000 ? "right" : "down";
      rect(302, py - 6, 46, 44, P.dark); rect(305, py - 3, 40, 38, C.charcoal); // ハイバック
      person(306, py, lookDir, f, ST_CIO, true);
      deskBlock(x, yd, 114);
      monitorBack(x + 4, yd - 49, phase % 4 !== 0);
      monitorBack(x + 73, yd - 49, (phase + 1) % 4 !== 0);
      if (nightT > 0.3) glows.push(function () { // 深夜: 画面の明かりが顔に当たる
        ctx.globalAlpha = 0.14 * nightT; rect(312, py + 9, 26, 17, P.screen);
        ctx.globalAlpha = 1;
      });
      rect(x + 46, yd - 30, 18, 4, C.white); rect(x + 48, yd - 33, 18, 4, P.pale); // 決裁書類
    }

    // ---- 壁ぎわ・床置きの家具(高さは全てUNIT比) ----
    function bookshelf(x, ya) { // 高さ=SHELF_H(1.1H)
      rect(x, ya - SHELF_H - 7, 72, 7, P.slateL);
      rect(x, ya - SHELF_H, 72, SHELF_H, P.slateD);
      rect(x + 4, ya - SHELF_H + 4, 64, SHELF_H - 8, P.slateM);
      for (var row = 0; row < 2; row += 1) {
        var yy = ya - SHELF_H + 4 + row * 24;
        for (var b = 0; b < 7; b += 1) {
          var bh = 12 + ((row * 3 + b * 5) % 7);
          var col = (b + row) % 4 === 3 ? mix(C.blue, C.white, 0.4) : ((b + row) % 3 === 0 ? P.pale : ((b + row) % 2 ? C.gray : P.wallShade));
          rect(x + 7 + b * 8, yy + 20 - bh, 7, bh, col);
        }
        rect(x + 4, yy + 20, 64, 4, P.slateL);
      }
    }

    function trashBin(x, ya) { // ゴミ箱: 高さ=0.35H
      rect(x + 1, ya - 1, 13, 1, P.dark);
      rect(x, ya - BIN_H, 15, BIN_H, C.gray);
      rect(x + 2, ya - BIN_H + 2, 11, 3, P.wallShade);
      rect(x + 4, ya - 11, 2, 6, P.wallShade); rect(x + 9, ya - 11, 2, 6, P.wallShade);
    }

    // 床置きホワイトボード: 全高=1.15H。図形だけの面。線は10秒ごとに1本増える(30秒で戻る)。
    function floorBoard(x, ya, ms) {
      rect(x + 6, ya - 2, 9, 2, P.dark); rect(x + 54, ya - 2, 9, 2, P.dark);
      rect(x + 7, ya - 7, 6, 5, C.charcoal); rect(x + 55, ya - 7, 6, 5, C.charcoal);
      rect(x + 9, ya - 22, 3, 15, C.gray); rect(x + 57, ya - 22, 3, 15, C.gray);
      rect(x, ya - WB_H, 69, WB_H - 19, P.dark);
      rect(x + 3, ya - WB_H + 3, 63, WB_H - 25, C.white);
      rect(x + 8, ya - WB_H + 8, 18, 3, C.blue);
      rect(x + 8, ya - WB_H + 14, 24, 3, C.gray);
      rect(x + 39, ya - WB_H + 8, 18, 13, P.codeB);
      var n = Math.floor((ms % 30000) / 10000) + 1;
      for (var wi = 0; wi < n; wi += 1) {
        rect(x + 8, ya - WB_H + 24 + wi * 5, 14 + (wi * 10) % 16, 3,
          wi % 2 ? P.wallShade : mix(C.blue, C.white, 0.55));
      }
      rect(x + 3, ya - 19, 63, 3, P.pale);
    }

    // ボードの書き手: 定位置で腕を1.2秒周期で動かす(書いている動き)。
    function boardWriter(ms, talking) {
      var x = 234, y = 292;
      var f = Math.floor(ms / ((talking ? 1200 : 1400) * SLOW)) % 2;
      person(x, y, "up", f, ST_WRITER, false);
      var arm = Math.floor(ms / (1200 * SLOW)) % 2;
      rect(x + 30, y + 14 + arm, 4, 6, P.skin); // ボードへ伸ばした腕
    }

    function sofa(x, ya) { // 背もたれ上端=床+SOFA_BACK+奥行き9・座面=床+SEAT_H+7
      rect(x + 5, ya - 6, 92, 6, P.slateD);
      rect(x, ya - SOFA_BACK - 9, 102, 18, P.dark);
      rect(x + 5, ya - SOFA_BACK - 5, 92, 11, mix(C.gray, C.white, 0.16));
      rect(x, ya - 24, 9, 18, P.dark); rect(x + 93, ya - 24, 9, 18, P.dark);
      rect(x + 6, ya - 20, 90, 9, P.wallShade);
      rect(x + 6, ya - 11, 90, 8, C.gray);
      rect(x + 12, ya - 3, 9, 3, P.slateD); rect(x + 81, ya - 3, 9, 3, P.slateD);
    }

    function lowTable(x, ya) { // ソファ前のローテーブル(高さ≈0.3H)
      rect(x + 3, ya - 9, 4, 9, P.slateD); rect(x + 35, ya - 9, 4, 9, P.slateD);
      rect(x, ya - 15, 42, 6, P.slateL); rect(x, ya - 10, 42, 1, P.slateD);
      rect(x + 12, ya - 18, 14, 4, C.white); // 雑誌
    }

    function plant(x, ya) { // 全高≈1.0H
      ellipse(x + 18, ya, 13, 4, P.slateD);
      poly([[x + 6, ya - 23], [x + 31, ya - 23], [x + 33, ya - 18], [x + 4, ya - 18]], P.wallShade);
      poly([[x + 7, ya - 18], [x + 30, ya - 18], [x + 25, ya - 2], [x + 12, ya - 2]], C.gray);
      rect(x + 16, ya - 39, 4, 18, P.dark);
      poly([[x + 18, ya - 33], [x + 3, ya - 42], [x + 9, ya - 50], [x + 21, ya - 36]], P.leaf);
      poly([[x + 18, ya - 38], [x + 26, ya - 51], [x + 33, ya - 45], [x + 23, ya - 33]], P.pale);
      poly([[x + 20, ya - 30], [x + 36, ya - 39], [x + 38, ya - 32], [x + 23, ya - 26]], P.wallShade);
    }

    function coffeeCup(x, y) {
      rect(x, y, 10, 7, C.white); rect(x + 10, y + 1, 3, 4, C.white);
      rect(x + 3, y - 3, 1, 3, P.wallShade);
    }

    function cafeCounter(x, ya) { // 右下の行き止まり。寸法はUNIT比の定数から算出する。
      rect(x, ya - COUNTER_H - 6, CAFE_W, 6, P.slateL);
      rect(x, ya - COUNTER_H, CAFE_W, COUNTER_H, P.slateM);
      rect(x + 3, ya - COUNTER_H + 3, CAFE_W - 6, 1, P.slateD);
      rect(x + 6, ya - COUNTER_H - 22, 21, 16, C.charcoal);  // コーヒーメーカー
      rect(x + 9, ya - COUNTER_H - 19, 15, 7, P.wallShade);
      rect(x + 12, ya - COUNTER_H - 10, 9, 4, P.dark);
      coffeeCup(x + 38, ya - COUNTER_H - 13);
      coffeeCup(x + 53, ya - COUNTER_H - 11);
    }

    function bubble(x, y, kind) { // 会話の吹き出し。中身は記号だけ(数字は入れない)
      rect(x + 6, y, 26, 19, C.white); rect(x + 2, y + 4, 4, 11, C.white);
      rect(x + 32, y + 4, 4, 11, C.white); rect(x + 12, y + 19, 6, 6, C.white);
      rect(x + 6, y - 2, 26, 2, P.dark);
      if (kind === 0) { rect(x + 15, y + 4, 8, 8, C.blue); rect(x + 17, y + 12, 4, 4, P.dark); }
      else if (kind === 1) { rect(x + 12, y + 4, 14, 10, P.wallShade); rect(x + 15, y + 7, 8, 2, C.white); }
      else { rect(x + 12, y + 10, 4, 4, C.blue); rect(x + 16, y + 13, 3, 3, C.blue); rect(x + 20, y + 5, 8, 3, C.blue); }
    }

    // 考え中の吹き出し: しっぽの代わりに小さな泡2つ。中身は点3つ(0.7秒ごとに増える)か
    // ひらめきの電球。どちらも記号だけ(文字・数字は入れない)。
    function thinkBubble(x, y, bulb, ms) {
      rect(x + 4, y, 24, 15, C.white); rect(x + 2, y + 3, 2, 9, C.white);
      rect(x + 28, y + 3, 2, 9, C.white); rect(x + 4, y - 2, 24, 2, P.dark);
      rect(x + 9, y + 17, 5, 4, C.white); rect(x + 5, y + 23, 3, 3, C.white); // 思考の泡
      if (bulb) {
        rect(x + 12, y + 2, 8, 7, mix(C.blue, C.white, 0.55));
        rect(x + 14, y + 9, 4, 2, P.wallShade); rect(x + 14, y + 11, 4, 1, P.dark);
      } else {
        var dn = 1 + Math.floor(ms / 700) % 3;
        for (var di = 0; di < dn; di += 1) rect(x + 8 + di * 6, y + 6, 3, 3, P.dark);
      }
    }

    // ---- ホバー/タップ状態(表示だけの状態。アニメの位置は常に経過時間から決める) ----
    var hitboxes = [], cursor = null, pinnedId = null;
    var shownId = null, shownSince = 0, prevTip = null, prevOff = 0, lastMs = 0;
    function addHit(id, x, y, hgt, sortY, label) {
      hitboxes.push({ id: id, x: x + 2, y: y, w: 34, h: hgt, sy: sortY, label: label });
    }
    function pickAt(px, py) { // 重なったら手前(足元Yが大きい方)を優先
      var best = null;
      for (var i = 0; i < hitboxes.length; i += 1) {
        var hb = hitboxes[i];
        if (px >= hb.x && px < hb.x + hb.w && py >= hb.y && py < hb.y + hb.h) {
          if (!best || hb.sy > best.sy) best = hb;
        }
      }
      return best;
    }
    function findHit(id) {
      for (var i = 0; i < hitboxes.length; i += 1) if (hitboxes[i].id === id) return hitboxes[i];
      return null;
    }
    function drawTip(hb, alpha) {
      var g = rasterText(hb.label);
      if (!g.w) return;
      var bw = g.w * TIP_DOT + 12, bh = g.h * TIP_DOT + 10;
      var bx = Math.round(Math.min(Math.max(hb.x + hb.w / 2 - bw / 2, 12), W - 12 - bw)); // 端で切らない
      var by = Math.round(hb.y - bh - 8);
      if (by < 12) by = Math.round(hb.y + hb.h + 8);
      ctx.globalAlpha = Math.max(0, Math.min(1, alpha));
      rect(bx - 1, by - 1, bw + 2, bh + 2, P.dark);
      rect(bx, by, bw, bh, P.tipBg);
      rect(bx, by, bw, 1, C.gray);
      rect(bx + Math.round(bw / 2) - 3, by + bh + 1, 6, 3, P.dark); // しっぽ
      for (var i = 0; i < g.dots.length; i += 1) {
        rect(bx + 6 + g.dots[i][0] * TIP_DOT, by + 5 + g.dots[i][1] * TIP_DOT, TIP_DOT, TIP_DOT, C.white);
      }
      ctx.globalAlpha = 1;
    }
    function drawTips(ms) {
      var target = pinnedId ? findHit(pinnedId) : (cursor ? pickAt(cursor.x, cursor.y) : null);
      if (shownSince > ms) shownSince = ms; // 再開でmsが巻き戻ったときの保険
      if (prevOff > ms) prevOff = ms;
      if (target && shownId !== target.id) {
        if (shownId) { prevTip = findHit(shownId); prevOff = ms; }
        shownId = target.id; shownSince = ms;
      } else if (!target && shownId) {
        prevTip = findHit(shownId); prevOff = ms; shownId = null;
      }
      // 出入りは0.2秒のフェード。reduced時は静止画なのでフェードせず即時表示。
      if (!reduced && prevTip && ms - prevOff < 200) drawTip(prevTip, 1 - (ms - prevOff) / 200);
      if (target) drawTip(target, reduced ? 1 : (ms - shownSince) / 200);
    }

    buildStatic();
    function draw(ms) {
      lastMs = ms;
      ctx.drawImage(staticCanvas, 0, 0);
      var hour = hourOfDay(ms); // 時計・窓・室内の明かり・人の様子は全てこの1変数から
      nightT = nightLevel(hour);
      SLOW = 1 + 0.5 * nightT;  // 深夜は所作が1.5倍ゆっくり(止まらない)
      chatNow = chatState(ms, bandOf(hour));
      glows = [];
      windowSky(56, 150, hour); windowSky(434, 150, hour);
      clockFace(hour);
      var phase = Math.floor(ms / 2400);

      // 歩行キャラ3体の状態(先に置いた者から順に衝突を解決する)。
      var carrier = resolveActor(carrierState, ms, OBST_MAIN);
      var feet = [footOf(carrier.x, carrier.y)];
      var coffee = resolveActor(coffeeState, ms, OBST_MAIN.concat(feet));
      feet.push(footOf(coffee.x, coffee.y));
      var talk = discussState(ms), talkOut = talk.mode !== "seat";
      if (talkOut) {
        talk = resolveActor(function (m) {
          var st = discussState(m);
          return st.mode === "seat" ? { x: 115, y: 267, dir: "down", mode: "out", moving: false } : st;
        }, ms, OBST_NO_ENG.concat(feet));
        feet.push(footOf(talk.x, talk.y));
      }
      // オフライン検証用フック(通常運転では未定義=何もしない)
      if (typeof window.__SPX_CAPTURE === "function") {
        window.__SPX_CAPTURE(ms, [
          { foot: footOf(carrier.x, carrier.y), obst: OBST_MAIN, moving: !!carrier.moving },
          { foot: footOf(coffee.x, coffee.y), obst: OBST_MAIN, moving: !!coffee.moving },
          talkOut ? { foot: footOf(talk.x, talk.y), obst: OBST_NO_ENG, moving: !!talk.moving } : null
        ]);
      }

      // 書類の山: 運搬(持ち出し/届け)と処理(新着/消化)で1段ずつ増減する。
      var ct = ms % CARRY_CYCLE;
      var stackA = 3 - (ct >= 1000 ? 1 : 0) + (ct >= 40000 ? 1 : 0);
      var stackB = 2 + (ct >= 12000 ? 1 : 0) - (ct >= 30000 ? 1 : 0);

      // 全ての描画対象を足元のYで昇順に並べてから描く(奥→手前)。
      var ents = [], i;
      function add(sortY, fn) { ents.push({ y: sortY, f: fn }); }
      add(150, function () { bookshelf(20, 148); });
      add(152, function () { plant(588, 150); });
      add(206, function () {
        deskTowards(96, 205, ms, phase);
        paperStack(166, 183, stackA); // 業務島の書類の山
      });
      add(206, function () {
        cioUnit(ms + 700, phase + 1);
        paperStack(322, 183, stackB); // CIOデスクの決裁待ちの山
      });
      add(331, function () { floorBoard(230, 330, ms); });
      add(343, function () { boardWriter(ms, talk.mode === "talk"); });
      add(265, function () { deskFacing(64, 264, ms + 150); });
      add(319, function () { deskAway(64, 300, ms + 300, phase + 1, talkOut); });
      add(359, function () { breakDuo(ms); });
      add(323, function () { sofaUnit(ms); });
      add(357, function () { lowTable(350, 356); });
      add(383, function () { cafeCounter(548, 382); });
      add(381, function () { trashBin(24, 380); });
      var walkFrame = Math.floor(ms / (520 * SLOW)) % 4;
      add(carrier.y + UNIT, function () {
        person(carrier.x, carrier.y, carrier.dir, carrier.moving ? walkFrame : 0,
          carrier.loaded ? ST_CARRY_LOADED : ST_CARRY, false);
      });
      add(coffee.y + UNIT, function () {
        person(coffee.x, coffee.y, coffee.dir, coffee.moving ? walkFrame : 0, ST_COFFEE, false);
        if (coffee.cup) coffeeCup(coffee.x + 28, coffee.y + 27);
      });
      if (talkOut) {
        add(talk.y + UNIT, function () {
          person(talk.x, talk.y, talk.dir,
            talk.moving ? walkFrame : Math.floor(ms / 1300) % 2, ST_ENG2, false);
        });
      }
      ents.sort(function (a, b) { return a.y - b.y; });
      for (i = 0; i < ents.length; i += 1) ents[i].f();

      // ソファの会話: 8秒で左右1往復(交互)+間。ボード前は合流中だけ4秒交代で交互に出す。
      // 深夜は3周期に1回だけ吹き出す(静かだが止まらない)。
      var quiet = nightT >= 0.6;
      var tb = convTurn(ms, 3700);
      if (tb >= 0 && (!quiet || Math.floor((ms + 3700) / CONV_MS) % 3 === 0)) {
        bubble(tb === 0 ? 344 : 390, 228, (Math.floor((ms + 3700) / CONV_MS) * 2 + tb + 1) % 3);
      }
      if (talk.mode === "talk") {
        var turn = Math.floor(talk.t / 4000) % 2;
        bubble(turn === 0 ? 232 : 280, turn === 0 ? 260 : 264, (Math.floor(talk.t / 4000) + 1) % 3);
      }
      // コーヒーブレイクの2人: 既存と同じ8秒周期で交互に出す(位相だけずらす)。
      var td = convTurn(ms, 6100);
      if (td >= 0 && (!quiet || Math.floor((ms + 6100) / CONV_MS) % 3 === 1)) {
        bubble(td === 0 ? 452 : 506, 276, (Math.floor((ms + 6100) / CONV_MS) * 2 + td) % 3);
      }
      // 席の会話(予定表=chatStateで同時に1組だけ)と考え中の吹き出し。
      if (chatNow.pair === "audit") { // 監査⇄経理: 横を向いて3.5秒交代で1往復
        var ca = Math.floor(chatNow.t / 3500) % 2;
        bubble(ca === 0 ? 95 : 141, 104, (Math.floor(chatNow.t / 3500) + 1) % 3);
      } else if (chatNow.pair === "engv") { // 向かい合わせのエンジニア(上下の席)
        var ce = Math.floor(chatNow.t / 3500) % 2;
        bubble(66, ce === 0 ? 166 : 236, (Math.floor(chatNow.t / 3500) + ce) % 3);
      } else if (chatNow.pair === "cio" && ((chatNow.t >= 3000 && chatNow.t < 6000) || chatNow.t >= 9000)) {
        thinkBubble(348, 104, chatNow.t >= 9000, ms); // 見渡しの合間に考え中→最後にひらめき
      } else if (chatNow.pair === "think") { // 書き手→エンジニアの順に考え中
        if (chatNow.t < 3500) thinkBubble(238, 258, false, ms);
        else thinkBubble(112, 166, chatNow.t >= 5500, ms);
      }
      // 深夜: 天井の照明を落とす(窓の外には重ねない=星と夜空はそのまま)。
      // そのあとでモニタの画面・デスクライトなどglowsに積んだものだけを明るく描き直す。
      if (nightT > 0.02) {
        ctx.globalAlpha = 0.45 * nightT;
        rect(8, 8, 624, 14, C.black);
        rect(8, 22, 48, 62, C.black); rect(206, 22, 228, 62, C.black); rect(584, 22, 48, 62, C.black);
        rect(8, 84, 624, 308, C.black);
        ctx.globalAlpha = 1;
        for (i = 0; i < glows.length; i += 1) glows[i]();
      }

      // ---- 当たり判定(体の見た目に合わせる)と「今〜〜中」の文言。動作と時間帯で
      //      出し分ける(深夜は「夜通し」の言い回しに変わる=24時間回っている口ぶり) ----
      hitboxes = [];
      var late = bandOf(hour) === 3;
      addHit("cio", 306, 135, 46, 206,
        chatNow.pair === "cio"
          ? (chatNow.t >= 9000 ? "今 ひらめきました"
            : chatNow.t >= 3000 && chatNow.t < 6000 ? "今 考えています" : "今 フロアを見渡しています")
          : late ? "今 夜も全体を見ています" : "今 全体を見ています");
      addHit("audit", 101, 135, 46, 206,
        chatNow.pair === "audit" ? "今 隣と相談しています"
          : late ? "今 夜通し見直しています" : "今 見直しています");
      addHit("keiri", 147, 135, 46, 206,
        chatNow.pair === "audit" ? "今 隣と相談しています"
          : late ? "今 夜通し数字を合わせています" : "今 数字を合わせています");
      addHit("eng", 69, 263, 48, 319,
        chatNow.pair === "engv" ? "今 向かいと認識合わせ中"
          : late ? "今 夜通しコードを書いています"
            : (ms % 42000 < 21000 ? "今 コードを書いています" : "今 テスト中"));
      addHit("eng3", 69, 194, 46, 265,
        chatNow.pair === "engv" ? "今 向かいと認識合わせ中"
          : late ? "今 夜通し実装中" : (ms % 36000 < 18000 ? "今 実装中" : "今 デバッグ中"));
      addHit("eng4", 115, 194, 46, 265,
        chatNow.pair === "think" && chatNow.t >= 3500 ? "今 考えています"
          : ms % 38000 < 19000 ? "今 レビュー中" : "今 コードを書いています");
      addHit("break1", 458, 308, UNIT, 359, late ? "今 夜中のコーヒー休憩中" : "今 コーヒーブレイク中");
      addHit("break2", 508, 308, UNIT, 359, "今 アイデアを出し合っています");
      if (talkOut) {
        addHit("eng2", talk.x, talk.y, UNIT, talk.y + UNIT,
          talk.mode === "talk" ? "今 打ち合わせ中"
            : talk.mode === "out" ? "今 相談しにいきます" : "今 席に戻ります");
      } else {
        addHit("eng2", 115, 263, 48, 319, late ? "今 夜通し設計中" : "今 設計中");
      }
      addHit("writer", 234, 292, UNIT, 343,
        talk.mode === "talk" ? "今 打ち合わせ中"
          : chatNow.pair === "think" && chatNow.t < 3500 ? "今 考えています" : "今 構想を練っています");
      addHit("carrier", carrier.x, carrier.y, UNIT, carrier.y + UNIT,
        carrier.sorting ? "今 資料を整理しています"
          : carrier.loaded ? "今 資料を届けています"
            : carrier.patrol ? "今 フロアを一回りしています" : "今 次の資料を取りにいきます");
      addHit("coffee", coffee.x, coffee.y, UNIT, coffee.y + UNIT,
        coffee.serving ? "今 コーヒーを配っています"
          : coffee.home ? "今 商談の作戦を練っています"
            : coffee.atCounter ? "今 コーヒーを淹れています"
              : coffee.cup ? "今 コーヒーを運んでいます" : "今 コーヒーを淹れにいきます");
      addHit("sofa1", 339, 260, 44, 324, "今 採用の相談中");
      addHit("sofa2", 386, 260, 44, 324, "今 打ち合わせ中");
      drawTips(ms);
    }

    function sofaUnit(ms) { // 会話ペア(座り): ソファで向かい合う2人
      var x = 330, ya = 322;
      var f1 = Math.floor(ms / (1450 * SLOW)) % 2, f2 = Math.floor((ms + 700) / (1250 * SLOW)) % 2;
      sofa(x, ya);
      var py = ya - 62; // 腰(py+42)=座クッション上面
      person(x + 9, py, "right", f1, ST_SOFA, true);
      person(x + 56, py, "left", f2, ST_SOFA2, true);
      rect(x + 18, py + 42, 7, 12, P.dark); rect(x + 30, py + 42, 7, 12, P.dark); // 垂れる足
      rect(x + 65, py + 42, 7, 12, P.dark); rect(x + 77, py + 42, 7, 12, P.dark);
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

    // ---- マウス/タップ: 座標は毎回getBoundingClientRectを取り直して内部座標へ変換する
    // (起動時に1回だけだとリサイズ・スマホで必ずズレる)。タップはclickで拾う=
    // touchstartを握らないのでスクロールを一切邪魔しない。もう一度タップか他所で消える。
    function toInternal(e) {
      var r = canvas.getBoundingClientRect();
      if (!r.width || !r.height) return null;
      return { x: (e.clientX - r.left) * W / r.width, y: (e.clientY - r.top) * H / r.height };
    }
    function renderIfStatic() { if (reduced && visible && !stopped) draw(NOON_MS); }
    function onMouseMove(e) {
      if (pinnedId) return;
      cursor = toInternal(e);
      renderIfStatic();
    }
    function onMouseLeave() { cursor = null; if (!pinnedId) renderIfStatic(); }
    function onClick(e) {
      var pt = toInternal(e);
      var hb = pt ? pickAt(pt.x, pt.y) : null;
      if (hb && pinnedId !== hb.id) { pinnedId = hb.id; cursor = pt; }
      else { pinnedId = null; cursor = pt; }
      renderIfStatic();
    }
    canvas.addEventListener("mousemove", onMouseMove);
    canvas.addEventListener("mouseleave", onMouseLeave);
    canvas.addEventListener("click", onClick);

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
      canvas.removeEventListener("mousemove", onMouseMove);
      canvas.removeEventListener("mouseleave", onMouseLeave);
      canvas.removeEventListener("click", onClick);
      if (typeof reduceQuery.removeEventListener === "function") reduceQuery.removeEventListener("change", onMotionChange);
      else if (typeof reduceQuery.removeListener === "function") reduceQuery.removeListener(onMotionChange);
    } };
  };
}());
