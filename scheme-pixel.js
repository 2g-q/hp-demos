/*
 * 斜め見下ろしのRPG風オフィス(1.5倍スケール版)。
 * 配色は指定5色(#0D0D0D/#FFFFFF/#343541/#8E8EA0/#2563EB)とその混色だけ
 * (茶系3段は廃止=依頼主「最初の色味に戻す」対応)。床は暗めのスレート調の板張りで、
 * 継ぎ目と木目状の筋の質感は保ち、色だけ寒色の濃淡に置き換えた。青は差し色のみ。
 * スマホ対応: 内部座標(640x400)は変えず、UNIT=51(旧34の1.5倍)で描くものを大きくする。
 * キャラは14体(エンジニア島を向かい合わせの4人に増設+右側でコーヒーブレイク中の2人)。
 * 仕事のギミックは「動き」で見せる。歩行は約22px/s(旧14px/sの1.6倍=依頼主指示で増速。
 * 深夜の歩きだけ約15px/sのゆっくりのまま)。経路は部屋を大きく回る(右の通路x=429/470・
 * 下の通路y=318/330・左の通路x=188。走者ごとに
 * レーンを分け、向かい合って詰まる形が構造的に起きないようにしてある):
 *  - 書類運搬(62秒周期を偶奇で交互): 偶数周期=書類を届け、承認済みの綴りを持ち帰る/
 *    奇数周期=手ぶらで受け取りにいき、帰りに書類を運ぶ。卓上の紙の山は運搬と処理で
 *    1段ずつ増減し、持ち物が消える瞬間と山が増える瞬間を一致させてある
 *  - コーヒー(52秒周期): 朝は2往復・昼はカップを持ってソファ脇を配って回る・
 *    夕方21時半に画面右端へ歩いて退勤し、朝6時半に歩いて戻る
 *  - ディスカッション(64秒周期): 開発席の1体が下の通路経由でボード前へ行き
 *    書き手と吹き出しを交互に出して帰席(夕・深夜の周期は席で作業=立たない)
 *  - 席の会話(100秒の予定表で同時に1組だけ): 監査⇄経理が横を向いて話す/
 *    向かい合わせのエンジニアが話す/CIOがフロアを見渡して考える。考え中の
 *    吹き出しは点3つ・ひらめきは電球=記号だけ(文字は入れない)
 *  - ボードの線は書き手の腕の動きに合わせ10秒ごとに1本ずつ増える(30秒で戻る)
 *  - コーヒーブレイクの2人はカップを上げ下げしながら8秒周期で交互に吹き出しを出す
 *  - ソファの2人(96秒の予定表=sofaScene): 会話⇄正面を向いて資料/タブレットに目を
 *    落とす⇄片方が資料を持ってボード脇へ歩いて確認し戻る、を織り交ぜる。姿勢の
 *    変わり目は10〜30秒間隔・吹き出しは会話の時間だけ(話していない時間を作る)。
 *    離席は帰宅組が歩いている時間帯なら見送る=同時に動く人数を増やさない
 *  - 歩く人は持ち物を持つ(heldItem: 書類/承認綴り/ノートPC/通勤鞄+コーヒーのカップ)。
 *    向きに応じて体の手前側へ持ち替え、行き先と一致させる(届け=書類・帰宅=鞄など)
 * 3D投影は全家具で統一(DEPTH_K): 天面=実奥行き×0.6・前面=実高さ1:1・側面は描かない・
 * 丸い天板は横半径rx/縦半径dTop(rx)の楕円。壁の物とラグ・薄板(モニタ面)だけは例外。
 * 24時間: 時間帯(朝6-10/昼10-18/夕18-22/深夜22-6)は hourOfDay だけから決める。
 * 深夜はCIO・コーヒー係・休憩の2人が帰宅する(依頼主指示 2稿目。21時台に歩いて
 * 画面端へ出て消え、朝6時前後に歩いて戻って着席する=いきなり消えない/現れない。
 * 空いた席は椅子だけが残る)。エンジニア・業務島・運搬・書き手・ソファの2人は残って
 * 働き続ける=「夜も動いている」は維持。天井の照明の暗幕はα最大0.28(旧0.45=
 * 「もう少し明るく」対応。窓の外には重ねない=星を沈めない)。モニタの画面と
 * クリップ式デスクライトだけを明るいまま描き直す。所作は1.5倍ゆっくり(止まらない)。
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
  // ---- 投影ルール(依頼主「3D描画は統一してくれ。全部」対応。全家具で共通) ----
  //   ①天面=実奥行き×DEPTH_K で圧縮して描く ②前面(手前の面)=実高さ1:1
  //   ③左右の側面は描かない ④接地=下端1pxの濃い線(丸物・人物は楕円影)
  //   丸い天板・口は横半径rx・縦半径dTop(rx)の楕円(真円にしない)。
  //   例外=壁の物(窓/時計/ポスター)とラグ(床面そのもの)と薄板の面(モニタ/ボードの
  //   盤面。厚みが1px未満)。寸法は全てUNIT比→dTop()経由で、ピクセル直打ちしない。
  var DEPTH_K = 0.6;
  function dTop(real) { return Math.max(2, Math.round(real * DEPTH_K)); }
  var DESK_H = Math.round(UNIT * 0.42);       // 21 机の天板の高さ(床→天板前縁)
  var DESK_D = dTop(UNIT * 0.5);              // 15 天板の見かけ奥行き(実0.5H×DEPTH_K)
  var SLOT_W = Math.round(UNIT * 0.9);        // 46 机の幅/人(スプライト幅38が収まる)
  var DESK_W = SLOT_W * 2;                    // 92 2人がけの机
  var SEAT_H = Math.round(UNIT * 0.25);       // 13 椅子の座面の高さ
  var BACK_H = Math.round(UNIT * 0.55);       // 28 背もたれ上端
  // 着席の持ち上げ量2種(着席時に隠れるバグの修正で+7px)。肩(スプライトのy+26)が
  // 背もたれ上端(BACK_H=28)やモニタ上端より上に出る高さにする。
  var SIT_RISE = SEAT_H + 49;                 // 62 前列(奥向き)の床アンカーからの持ち上げ
  var SIT_FRONT = 77;                         // 机の奥(手前向き)の床アンカーからの持ち上げ(旧70)
  var SHELF_H = Math.round(UNIT * 1.1);       // 56 本棚
  var COUNTER_H = Math.round(UNIT * 0.5);     // 26 カフェカウンター
  var SOFA_BACK = Math.round(UNIT * 0.6);     // 31 ソファ背もたれ
  var BIN_H = Math.round(UNIT * 0.35);        // 18 ゴミ箱
  var WB_H = Math.round(UNIT * 1.15);         // 59 床置きホワイトボード(脚込み全高)
  var CAFE_W = Math.round(UNIT * 1.35);       // 69 カフェカウンター幅
  // 天面の見かけ奥行き(全て 実寸(UNIT比)×DEPTH_K。投影ルール①)
  var SHELF_D = dTop(UNIT * 0.25);            // 8 本棚(実0.25H)
  var COUNTER_D = dTop(UNIT * 0.4);           // 12 カフェカウンター(実0.4H)
  var SEAT_D = dTop(UNIT * 0.35);             // 11 椅子の座面(実0.35H)
  var SOFA_D = dTop(UNIT * 0.4);              // 12 ソファ座面(実0.4H)
  var ARM_D = dTop(UNIT * 0.5);               // 15 ソファ肘掛け(実0.5H=奥行きいっぱい)
  var SOFA_BACK_D = dTop(UNIT * 0.2);         // 6 ソファ背もたれの笠木(実0.2H)
  var TOWER_D = dTop(UNIT * 0.18);            // 6 サーバ塔(実0.18H)
  var MAKER_D = dTop(UNIT * 0.12);            // 4 コーヒーメーカー(実0.12H)
  var PAPER_D = dTop(UNIT * 0.2);             // 6 卓上の紙の山の一番上の紙(実0.2H)
  var BOARD_T = dTop(UNIT * 0.06);            // 2 ホワイトボードの板厚の天端
  // 高さ・半径もUNIT比(投影ルール②の1:1で描く実寸)
  var TABLE_H = Math.round(UNIT * 0.3);       // 15 丸テーブルの高さ
  var TABLE_R = Math.round(UNIT * 0.41);      // 21 丸テーブルの天板半径
  var TOWER_H = Math.round(UNIT * 0.65);      // 33 サーバ塔の高さ
  var MAKER_H = Math.round(UNIT * 0.31);      // 16 コーヒーメーカーの高さ

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

  // ---- だ円の輪郭表: 半径(rx,ry)ごとに各行の半幅を整数で1度だけ決めて共有する ----
  // 幅は round(rx*sqrt(1-t^2)) を基準に、rxとの差を2の倍数へ丸める=輪郭の段差を
  // 2px以上にまとめ、1px刻みの不定な階段を消す(粒の見かけを他の物に揃える)。
  // 同じ半径は中心がどこでも常に同じ輪郭=同じ物が動いても形が変わらない。
  // ryかrxが小さい潰れただ円(接地影・ゴミ箱の口など)は2px段が物理的に組めないので
  // 素の丸めのまま(1px刻みを許す)。
  var ellipseRowsCache = {};
  function ellipseRows(rx, ry) {
    var key = rx + "x" + ry;
    if (!ellipseRowsCache[key]) {
      var rows = [];
      for (var dy = -ry; dy <= ry; dy += 1) {
        var t = dy / (ry + 0.5);
        var hw = Math.round(rx * Math.sqrt(Math.max(0, 1 - t * t)));
        if (rx >= 6 && ry >= 6) hw = Math.max(0, rx - 2 * Math.round((rx - hw) / 2));
        rows.push(hw);
      }
      ellipseRowsCache[key] = rows;
    }
    return ellipseRowsCache[key];
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
      // だ円も走査線方式。各行の半幅は半径ごとの表(ellipseRows)から引く=
      // 同じ半径なら中心がどこでも常に同じ輪郭(位置で階段の割れ方が変わらない)。
      ellipse: function (cx, cy, rx, ry, color) {
        cx = Math.round(cx); cy = Math.round(cy); rx = Math.round(rx); ry = Math.round(ry);
        var rows = ellipseRows(rx, ry);
        for (var dy = -ry; dy <= ry; dy += 1) {
          var hw = rows[dy + ry];
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
  var ST_COFFEE = { shape: 0, hairC: C.black, shirtC: mix(C.white, C.gray, 0.22), tie: true };
  var ST_SOFA = { shape: 1, hairC: C.charcoal, shirtC: mix(C.gray, C.white, 0.32), female: true };
  var ST_SOFA2 = { shape: 2, hairC: mix(C.black, C.charcoal, 0.5), shirtC: mix(C.white, C.gray, 0.20), papers: true };
  // ソファ2の離席(歩き)用: 同じ見た目でpapersなし=持ち物はheldItemが向きに応じて描く
  var ST_SOFA2W = { shape: 2, hairC: mix(C.black, C.charcoal, 0.5), shirtC: mix(C.white, C.gray, 0.20) };
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
  // CIOデスクと休憩の2人の矩形は名前を持つ=帰宅の歩き出し/帰着で「自分の席の矩形」
  // だけを衝突対象から除くため(席の中から歩き出す以上、自席との重なりは構造上必然)。
  var CIO_DESK_RECT = [272, 158, 114, 48]; // CIOデスク
  var BREAK_RECT = [464, 348, 76, 14];     // コーヒーブレイクの2人(カフェ寄りの立ち話)
  var FURNITURE_RECTS = [
    [20, 136, 72, 14],   // 本棚
    [588, 138, 36, 14],  // 観葉植物(右上)
    [96, 158, 92, 48],   // 業務島(机+奥の椅子)
    CIO_DESK_RECT,
    [64, 232, 92, 33],   // エンジニアの向かい机(北側の増設島)
    BREAK_RECT,
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
  function exceptRect(skip) {
    var out = [], i;
    for (i = 0; i < FURNITURE_RECTS.length; i += 1) {
      if (FURNITURE_RECTS[i] !== skip) out.push(FURNITURE_RECTS[i]);
    }
    return out.concat([ENG_RECT, WRITER_RECT]);
  }
  var OBST_CIO_AWAY = exceptRect(CIO_DESK_RECT); // CIOの退勤/出社路(自席の矩形だけ除く)
  var OBST_DUO_AWAY = exceptRect(BREAK_RECT);    // 休憩の2人の退勤/出社路(自分達の立ち位置だけ除く)

  // ---- 歩行キャラ。状態は全て経過時間だけから決める。歩行速度は約22px/s
  //      (旧14px/sの1.6倍=依頼主指示で増速。1区間の所要時間はその分短い。
  //      深夜の直帰だけ約15px/s=ゆっくりのまま) ----
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

  // ---- 帰宅する4人(CIO・コーヒー係・休憩の2人)の退勤/出社ルート ----
  // いずれも既存の誰も使わない足元帯を通り、画面端(x=700=右枠の外)で消える。
  //   CIO=壁ぎわy=135(足元177-187。運搬の最北y=178の足元220-230と交わらない)
  //   コーヒー係=自分の定位置の行y=152(足元194-204。他の誰も来ない)
  //   休憩の2人=y=296の横帯(足元338-348。ローテーブル342-357はx<392で通らない・
  //     カフェ348-383とは1px差で接しない)。2人は同時に出て50px差の縦列=衝突しない
  // dep/retはmsOfDay(0=8:00)の定数。21:00=97500 21:12=99000 21:30=101250 /
  // 5:36=162000 6:12=166500 6:30=168750 6:36=169500。durは経路長÷22.4px/s。
  var CIO_AWAY = { home: { x: 306, y: 135, dir: "down" }, dep: 97500, ret: 162000, dur: 17600,
    route: pathMeta([[306, 135], [700, 135]]) };   // 394px
  var COFFEE_AWAY = { home: { x: 560, y: 152, dir: "down" }, dep: 101250, ret: 168750, dur: 6250,
    route: pathMeta([[560, 152], [700, 152]]) };   // 140px
  var DUOA_AWAY = { home: { x: 458, y: 308, dir: "right" }, dep: 99000, ret: 166500, dur: 11300,
    route: pathMeta([[458, 308], [458, 296], [700, 296]]) }; // 254px
  var DUOB_AWAY = { home: { x: 508, y: 308, dir: "left" }, dep: 99000, ret: 169500, dur: 9100,
    route: pathMeta([[508, 308], [508, 296], [700, 296]]) }; // 204px

  function msOfDayC(ms) { return ((ms % DAY_MS) + DAY_MS) % DAY_MS; }
  // 帰宅の局面: present(定位置)→out(歩いて退勤)→away(不在)→in(歩いて出社)。
  // 位置は連続(経路の補間)なので、いきなり消えたり現れたりしない。
  function awayMode(cfg, ms) {
    var md = msOfDayC(ms);
    if (md >= cfg.dep && md < cfg.dep + cfg.dur) return { mode: "out", k: (md - cfg.dep) / cfg.dur };
    if (md >= cfg.dep + cfg.dur && md < cfg.ret) return { mode: "away" };
    if (md >= cfg.ret && md < cfg.ret + cfg.dur) return { mode: "in", k: (md - cfg.ret) / cfg.dur };
    return { mode: "present" };
  }
  function awayActor(cfg, ms) {
    var ph = awayMode(cfg, ms), p;
    if (ph.mode === "out") { p = pathPoint(cfg.route, ph.k); p.moving = true; p.mode = "out"; return p; }
    if (ph.mode === "in") {
      p = pathPoint(cfg.route, 1 - ph.k); p.dir = flipDir(p.dir); p.moving = true; p.mode = "in"; return p;
    }
    var end = cfg.route.path[cfg.route.path.length - 1];
    if (ph.mode === "away") return { mode: "away", x: end[0], y: end[1], dir: "down", moving: false };
    return { mode: "present", x: cfg.home.x, y: cfg.home.y, dir: cfg.home.dir, moving: false };
  }

  // ---- ソファの2人の予定表(96秒)。「ずっと横を向き合ったまま」をやめる:
  //      会話(互いに2px乗り出す)⇄正面を向いて資料/タブレットに目を落とす⇄片方が
  //      資料を持ってボード脇へ歩いて確認し戻る、を織り交ぜる。姿勢の変わり目は
  //      14/10/14/10/22/14/12秒=10〜30秒間隔。吹き出しは会話フェーズだけ。
  //      離席の足元レーンはy=323〜333(ソファ矩形の下端323・ローテーブル342・
  //      書き手の足元334のどれとも重ならない専用帯)。歩みは86px/3.8s=22.6px/s。
  //      離席は帰宅組(CIO/コーヒー係/休憩の2人)が歩く時間帯なら見送り、
  //      その回は着席で資料を読む=同時に動く人数を増やさない。 ----
  var SOFA_CYCLE = 96000;
  var SOFA_WALK = pathMeta([[386, 281], [300, 281]]); // ソファ前→ボード脇 86px
  function sofaAwayBlocked(ws) { // 離席の22秒と帰宅組の歩き(out/in)が重なるか
    // 2.75秒刻みで両端を含む全点を見る(端点2つだけだと、22秒の内側に完全に
    // 収まる最短6.25秒の歩きを見逃す)。2.75秒<最短の歩き時間なので取りこぼさない。
    var cfgs = [CIO_AWAY, COFFEE_AWAY, DUOA_AWAY, DUOB_AWAY];
    for (var i = 0; i < cfgs.length; i += 1) {
      for (var q = 0; q <= 22000; q += 2750) {
        var m = awayMode(cfgs[i], ws + q).mode;
        if (m === "out" || m === "in") return true;
      }
    }
    return false;
  }
  function sofaScene(ms) {
    var t = ((ms % SOFA_CYCLE) + SOFA_CYCLE) % SOFA_CYCLE;
    var sc = { aDir: "right", bDir: "left", talking: false, aTablet: false, away: false, walk: null };
    if (t < 14000) sc.talking = true;              // 0-14s: 向き合って会話
    else if (t < 24000) { sc.aDir = "down"; sc.bDir = "down"; sc.aTablet = true; } // 14-24s: 資料に目を落とす
    else if (t < 38000) sc.talking = true;         // 24-38s: 会話
    else if (t < 48000) { sc.aDir = "down"; sc.bDir = "down"; } // 38-48s: 背もたれに寄りかかる
    else if (t < 70000) {                          // 48-70s: 片方がボード脇へ(往復)
      var ws = ms - (t - 48000);                   // この離席セグメントの開始時刻(決定は開始時刻で固定)
      if (sofaAwayBlocked(ws)) { sc.aDir = "down"; sc.bDir = "down"; sc.aTablet = true; }
      else {
        sc.away = true; sc.aDir = "down"; sc.aTablet = true;
        if (t < 51800) { sc.walk = pathPoint(SOFA_WALK, (t - 48000) / 3800); sc.walk.moving = true; sc.walk.mode = "go"; }
        else if (t < 66200) sc.walk = { x: 300, y: 281, dir: "left", moving: false, mode: "board" };
        else {
          sc.walk = pathPoint(SOFA_WALK, 1 - (t - 66200) / 3800);
          sc.walk.dir = flipDir(sc.walk.dir); sc.walk.moving = true; sc.walk.mode = "back";
        }
      }
    } else if (t < 84000) sc.talking = true;       // 70-84s: 戻ってきて共有の会話
    else { sc.aDir = "down"; sc.bDir = "down"; sc.aTablet = true; } // 84-96s: 静かに読む
    return sc;
  }

  // その周期の振る舞いは「周期の開始時刻の時間帯」で決める。周期の境界では全員が
  // 定位置に戻っているので、時間帯が切り替わっても位置が飛ばない(ワープしない)。
  function cycleStartBand(ms, offset, cycle) {
    var t = (((ms + offset) % cycle) + cycle) % cycle;
    return bandOf(hourOfDay(ms - t));
  }

  // 書類運搬(62秒周期): 拾う2秒→届ける6.3秒(142px/6.3s=22.5px/s)→渡す4秒→帰りは
  // 右→下→左と部屋を大回り28.7秒(644px/28.7s=22.4px/s)→残りは自席脇で資料整理。
  // 深夜の周期だけ直帰(142px/9.4s=15px/s=夜はゆっくりのまま)し、残りは資料整理。
  function carrierState(ms) {
    var band = cycleStartBand(ms, 0, CARRY_CYCLE);
    var t = ((ms % CARRY_CYCLE) + CARRY_CYCLE) % CARRY_CYCLE, p;
    if (t < 2000) p = { x: 188, y: 178, dir: "down", moving: false };
    else if (t < 8300) { p = pathPoint(CARRY_OUT, (t - 2000) / 6300); p.moving = true; }
    else if (t < 12300) p = { x: 330, y: 178, dir: "down", moving: false };
    else if (band === 3) {
      if (t < 21700) { p = pathPoint(CARRY_BACK, (t - 12300) / 9400); p.moving = true; }
      else p = { x: 188, y: 178, dir: "down", moving: false, sorting: true };
    } else if (t < 41000) { p = pathPoint(CARRY_LOOP, (t - 12300) / 28700); p.moving = true; p.patrol = true; }
    else p = { x: 188, y: 178, dir: "down", moving: false, sorting: true };
    // 持ち物(行き先と一致させる): 偶数周期=行きは書類を届け(CIOの山が+1)、帰りは
    // 承認済みの綴り(消えるt=41000に自席の山stackAが+1=「置いた」が見える)/
    // 奇数周期=行きは手ぶらで受け取りにいき(CIOの山が-1)、帰りに書類を運んで
    // 自席で整理して片づける(山は増やさない=モニタ上に紙がはみ出て人を隠さない高さを保つ)。
    p.fetch = Math.floor(ms / CARRY_CYCLE) % 2 === 1;
    if (p.fetch) p.carry = (t >= 12000 && t < 41000) ? "papers" : null;
    else p.carry = (t >= 1000 && t < 12000) ? "papers" : (t >= 12000 && t < 41000) ? "folder" : null;
    return p;
  }
  // コーヒー(52秒周期): 朝はまっすぐの往復を2回(コーヒーを取りにいく人が増える朝)。
  // 昼はカップを持ってソファ脇(x=470の縦通路)を配って回る(324px/18.1s=17.9px/s)。
  // 21時半で退勤するため、退勤までに終わらない周期は自席で待つ(coffeeFull側で制御)。
  function coffeeState(ms) {
    var band = cycleStartBand(ms, 9000, COFFEE_CYCLE);
    var t = (((ms + 9000) % COFFEE_CYCLE) + COFFEE_CYCLE) % COFFEE_CYCLE, p, u;
    if (band === 0) {
      u = t % 26000;
      if (u < 3000) p = { x: 560, y: 152, dir: "down", moving: false, home: true };
      else if (u < 9400) { p = pathPoint(COFFEE_DOWN, (u - 3000) / 6400); p.moving = true; }
      else if (u < 19600) p = { x: 560, y: 296, dir: "down", moving: false, atCounter: true };
      else { p = pathPoint(COFFEE_DOWN, 1 - (u - 19600) / 6400); p.dir = flipDir(p.dir); p.moving = true; p.cup = true; }
      return p;
    }
    if (t < 5000) p = { x: 560, y: 152, dir: "down", moving: false, home: true };
    else if (t < 11400) { p = pathPoint(COFFEE_DOWN, (t - 5000) / 6400); p.moving = true; }
    else if (t < 19000) p = { x: 560, y: 296, dir: "down", moving: false, atCounter: true };
    else if (band === 3) {
      if (t < 28600) { p = pathPoint(COFFEE_DOWN, 1 - (t - 19000) / 9600); p.dir = flipDir(p.dir); p.moving = true; p.cup = true; }
      else p = { x: 560, y: 152, dir: "down", moving: false, cup: true, home: true };
    } else if (t < 37100) { p = pathPoint(COFFEE_LOOP, (t - 19000) / 18100); p.moving = true; p.cup = true; p.serving = true; }
    else p = { x: 560, y: 152, dir: "down", moving: false, cup: true, home: true };
    return p;
  }
  // コーヒー係の全体状態: 帰宅の局面(out/away/in)を先に見て、在席中だけ周期で働く。
  // 出社直後・退勤直前の「途中までしか回れない周期」は自席で待つ=周期の途中へ
  // ワープ出社しない・持ち場を離れたまま退勤時刻を迎えない。
  function coffeeFull(ms) {
    var ph = awayMode(COFFEE_AWAY, ms), p;
    if (ph.mode === "out") { p = pathPoint(COFFEE_AWAY.route, ph.k); p.moving = true; p.leaving = true; return p; }
    if (ph.mode === "in") {
      p = pathPoint(COFFEE_AWAY.route, 1 - ph.k); p.dir = flipDir(p.dir); p.moving = true; p.arriving = true;
      return p;
    }
    if (ph.mode === "away") return { x: 700, y: 152, dir: "down", moving: false, gone: true };
    var t = (((ms + 9000) % COFFEE_CYCLE) + COFFEE_CYCLE) % COFFEE_CYCLE;
    var q = (msOfDayC(ms - t) - (COFFEE_AWAY.ret + COFFEE_AWAY.dur) + DAY_MS * 2) % DAY_MS;
    var span = (COFFEE_AWAY.dep - COFFEE_AWAY.ret - COFFEE_AWAY.dur + DAY_MS) % DAY_MS;
    if (q + COFFEE_CYCLE > span) return { x: 560, y: 152, dir: "down", moving: false, home: true };
    return coffeeState(ms);
  }
  // ディスカッション(64秒周期): 着席10秒→下の通路(y=318)経由で10秒歩き(230px/10s=23px/s)→
  // ボード前で12秒会話→同じ道を10秒で帰席→残り22秒着席。夕・深夜の周期は席を立たない。
  function discussState(ms) {
    var band = cycleStartBand(ms, 27000, TALK_CYCLE);
    var t = (((ms + 27000) % TALK_CYCLE) + TALK_CYCLE) % TALK_CYCLE, p;
    if (band >= 2 || t < 10000 || t >= 42000) return { mode: "seat", t: t };
    if (t < 20000) { p = pathPoint(TALK_META, (t - 10000) / 10000); p.mode = "out"; p.moving = true; return p; }
    if (t < 32000) return { mode: "talk", x: 272, y: 296, dir: "left", moving: false, t: t - 20000 };
    p = pathPoint(TALK_META, 1 - (t - 32000) / 10000); p.dir = flipDir(p.dir);
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
      // 縁は3px(枠の太さの統一=ベゼル・額縁は3px)。輪郭はellipseRowsの表で
      // 格子に乗る=壁の遠景なのに一番細かい、を解消。針だけは動きが要るので不変。
      ellipse(320, 54, 24, 24, P.wallShade); ellipse(320, 54, 21, 21, C.white);
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
      // 横棒グラフのポスター(文字は描かない)。旧・折れ線polyは斜めの1px階段が
      // 壁で一番細かく見えたのでやめ、横棒の帯だけにする(遠景は簡素に)。
      // 額は3px(枠の太さの統一)。
      s.rect(228, 26, 42, 52, P.dark); s.rect(231, 29, 36, 46, C.white);
      s.rect(235, 34, 1, 36, C.gray); // 軸(縦1px=面の境目の線は1px)
      s.rect(237, 35, 20, 5, mix(C.blue, C.white, 0.48));
      s.rect(237, 44, 26, 5, mix(C.blue, C.white, 0.48));
      s.rect(237, 53, 11, 5, mix(C.blue, C.white, 0.48));
      s.rect(237, 62, 23, 5, mix(C.blue, C.white, 0.48));
      s.rect(370, 30, 40, 44, P.dark); s.rect(373, 33, 34, 38, C.white);
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
      // 座面の天面(実0.35H×DEPTH_K)。人はこの上に後から描かれて重なる=隠さない
      rect(x + 2, yc - SEAT_H - SEAT_D, 34, SEAT_D, C.charcoal);
      rect(x + 2, yc - SEAT_H, 34, 3, P.dark); // 座面の前縁
    }
    function chairBack(x, yc) { // 前列の背もたれ。肩幅より狭く=腕が横に見える
      rect(x + 8, yc - BACK_H, 22, BACK_H - SEAT_H + 2, P.dark);
      rect(x + 11, yc - BACK_H + 2, 16, 12, C.charcoal);
    }

    // ---- モニタ ----
    // 背面(画面が奥を向く)。y=画面上端。本体は高さ14(旧18)=着席者の肩・胸元が
    // モニタの上に出る低さにする(「着席時に隠れる」バグ修正の一部)。
    function monitorBack(x, y, lit) {
      rect(x, y, 37, 14, C.charcoal);
      rect(x + 3, y + 3, 31, 3, P.wallShade); rect(x + 3, y + 8, 31, 3, P.wallShade);
      rect(x + 26, y - 4, 9, 3, P.dark);       // クリップ式デスクライトの笠(常設)
      rect(x + 29, y - 1, 3, 1, C.charcoal);   // 留め具
      if (lit) rect(x + 2, y - 1, 24, 1, P.screen);
      rect(x + 15, y + 14, 7, 4, P.dark); rect(x + 9, y + 18, 19, 3, P.dark);
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
    // 前面=1段4px(高さ1:1)+一番上の紙の天面=実0.2H×DEPTH_K(投影ルール共通)。
    // 高さは最大3段に保つ(それ以上はモニタの帯を越えて着席者の胸元を隠す)。
    function paperStack(x, yb, h) {
      if (h <= 0) return;
      rect(x, yb - h * 4 - PAPER_D, 18, PAPER_D, C.white);
      rect(x, yb - h * 4 - PAPER_D, 18, 1, P.pale);
      for (var i = 0; i < h; i += 1) {
        rect(x, yb - (i + 1) * 4, 18, 4, i % 2 ? P.pale : C.white);
        rect(x, yb - i * 4 - 1, 18, 1, P.wallShade);
      }
    }

    function tower(x, ya, phase) { // 床置きの小型サーバ(開発島の目印)。天面=実0.18H×DEPTH_K
      rect(x, ya - TOWER_H - TOWER_D, 18, TOWER_D, P.slateL);
      rect(x, ya - TOWER_H - TOWER_D, 18, 1, P.slateD);
      rect(x, ya - TOWER_H, 18, TOWER_H, C.charcoal);
      rect(x + 3, ya - 28, 12, 2, P.wallShade); rect(x + 3, ya - 23, 12, 2, P.wallShade);
      rect(x + 1, ya - 1, 16, 1, P.slateD); // 接地
      if (phase % 2 === 0) rect(x + 12, ya - 9, 3, 3, C.blue);
    }

    // 手前向きの机: 人は机の奥。裾(py+42)が天板の帯(yd-36〜yd-21)に重なり、
    // 頭と肩・胸元はモニタ上端(yd-42)より上に出る(py=yd-77)。
    function deskTowards(x, yd, ms, phase) {
      var f1 = Math.floor(ms / (950 * SLOW)) % 2, f2 = Math.floor((ms + 430) / (1250 * SLOW)) % 2;
      var py = yd - SIT_FRONT;
      var chat = chatNow.pair === "audit"; // 相談タイム: 隣同士が横を向いて話す
      chairTop(x + 5, py); person(x + 5, py, chat ? "right" : "down", f1, ST_AUDIT, true);
      chairTop(x + 51, py); person(x + 51, py, chat ? "left" : "down", f2, ST_KEIRI, true);
      deskBlock(x, yd, DESK_W);
      monitorBack(x + 4, yd - 42, phase % 4 !== 0);
      monitorBack(x + 51, yd - 42, phase % 5 !== 0);
      if (nightT > 0.3) glows.push(function () { // 深夜: 画面の明かりが顔に当たる
        ctx.globalAlpha = 0.14 * nightT;
        if (phase % 4 !== 0) rect(x + 11, py + 9, 26, 17, P.screen);
        if (phase % 5 !== 0) rect(x + 57, py + 9, 26, 17, P.screen);
        ctx.globalAlpha = 1;
      });
      // 経理の電卓(職種の描き分け)。下端yd-22=天板の帯の中に収める
      // (旧yd-19は前面へ3pxはみ出し=机の縁に貼りついて見えた。2026-09-04目視監査)
      rect(x + 38, yd - 33, 9, 11, P.pale); rect(x + 39, yd - 31, 7, 3, C.charcoal);
      rect(x + 39, yd - 27, 2, 2, P.dark); rect(x + 43, yd - 27, 2, 2, P.dark);
      rect(x + 39, yd - 24, 2, 2, P.dark);
    }

    // 奥向きの机(手前列): 人は机の手前に座り背中が見える。椅子は支柱・台座で床に接地。
    function deskAway(x, yd, ms, phase, hideSecond) {
      var f1 = Math.floor(ms / (1050 * SLOW)) % 2, f2 = Math.floor((ms + 520) / (1350 * SLOW)) % 2;
      var yc = yd + 18, py = yc - SIT_RISE;
      deskBlock(x, yd, DESK_W);
      // 開発席は端末風とエディタ風。seedはxから決めて行の長さを変える。消灯させない。
      // モニタはyd-60(旧-55)=引き上げた着席者の頭(py+3)と画面の中身が重ならない高さ。
      monitorFront(x + 3, yd - 60, true, ms, "term", (x + 3) % 7);
      monitorFront(x + 49, yd - 60, true, ms, "edit", (x + 5) % 7);
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
      var py = yd - SIT_FRONT;
      chairTop(x + 5, py); person(x + 5, py, "down", f1, ST_ENG3, true);
      chairTop(x + 51, py); person(x + 51, py, "down", f2, ST_ENG4, true);
      deskBlock(x, yd, DESK_W);
      monitorBack(x + 4, yd - 42, true);   // 開発席なので消灯させない
      monitorBack(x + 51, yd - 42, true);
      if (nightT > 0.3) glows.push(function () { // 深夜: 画面の明かりが顔に当たる
        ctx.globalAlpha = 0.14 * nightT;
        rect(x + 11, py + 9, 26, 17, P.screen); rect(x + 57, py + 9, 26, 17, P.screen);
        ctx.globalAlpha = 1;
      });
    }

    // コーヒーブレイクの2人(カフェカウンター寄りの立ち話)。向かい合って立ち、
    // カップを持つ手が交互に上下する(吹き出しはdraw側で8秒周期の交互)。
    // 21時台に2人とも退勤する=在席している側だけ描く(立ち姿なので椅子は残らない)。
    function breakDuo(ms, aHere, bHere) {
      var y = 308;
      var gA = Math.floor(ms / (1150 * SLOW)) % 2, gB = Math.floor((ms + 600) / (1300 * SLOW)) % 2;
      if (aHere) { person(458, y, "right", 0, ST_BREAK1, false); coffeeCup(487, y + 25 - gA * 2); }
      if (bHere) { person(508, y, "left", 0, ST_BREAK2, false); coffeeCup(503, y + 25 - gB * 2); }
    }

    // CIOの席: 上壁の中央。机の幅だけ広く(114px)、高さ・奥行きの比は共通。
    // present=false(帰宅中〜出社前)は人を描かない=ハイバックの椅子だけが残る。
    function cioUnit(ms, phase, present) {
      var x = 272, yd = 205, f = Math.floor(ms / (1350 * SLOW)) % 2;
      var py = yd - SIT_FRONT;
      // CIOの見渡しタイム: 左→正面(考え中)→右→正面(ひらめき)と顔の向きを変える
      var lookDir = "down";
      if (chatNow.pair === "cio") lookDir = chatNow.t < 3000 ? "left" : chatNow.t < 6000 ? "down" : chatNow.t < 9000 ? "right" : "down";
      rect(302, py - 6, 46, 44, P.dark); rect(305, py - 3, 40, 38, C.charcoal); // ハイバック
      if (present) person(306, py, lookDir, f, ST_CIO, true);
      deskBlock(x, yd, 114);
      monitorBack(x + 4, yd - 42, present && phase % 4 !== 0);
      monitorBack(x + 73, yd - 42, present && (phase + 1) % 4 !== 0);
      if (present && nightT > 0.3) glows.push(function () { // 深夜: 画面の明かりが顔に当たる
        ctx.globalAlpha = 0.14 * nightT; rect(312, py + 9, 26, 17, P.screen);
        ctx.globalAlpha = 1;
      });
      // 決裁書類(下端1pxの縁=paperStack等の紙物と同じ流儀に揃える)
      rect(x + 46, yd - 30, 18, 4, C.white); rect(x + 46, yd - 27, 18, 1, C.gray);
      rect(x + 48, yd - 33, 18, 4, P.pale);
    }

    // ---- 壁ぎわ・床置きの家具(高さは全てUNIT比) ----
    function bookshelf(x, ya) { // 高さ=SHELF_H(1.1H)・天面=実0.25H×DEPTH_K
      rect(x, ya - SHELF_H - SHELF_D, 72, SHELF_D, P.slateL);
      rect(x, ya - SHELF_H - SHELF_D, 72, 1, P.slateD); // 天面の奥縁
      rect(x, ya - SHELF_H, 72, SHELF_H, P.slateD);
      rect(x + 1, ya - 1, 70, 1, P.slateD); // 接地
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

    function trashBin(x, ya) { // ゴミ箱: 高さ=0.35H。丸い口=rx7/縦dTop(7)の楕円(投影共通)
      ellipse(x + 7, ya - 1, 8, 3, P.slateD); // 接地影
      rect(x, ya - BIN_H, 15, BIN_H, C.gray);
      ellipse(x + 7, ya - BIN_H, 7, dTop(7), P.wallShade); // 口の縁(天面)
      ellipse(x + 7, ya - BIN_H, 5, dTop(5), P.dark);      // 口の内側
      rect(x + 4, ya - 11, 2, 6, P.wallShade); rect(x + 9, ya - 11, 2, 6, P.wallShade);
    }

    // 床置きホワイトボード: 全高=1.15H。図形だけの面。線は10秒ごとに1本増える(30秒で戻る)。
    function floorBoard(x, ya, ms) {
      rect(x + 6, ya - 2, 9, 2, P.dark); rect(x + 54, ya - 2, 9, 2, P.dark);
      rect(x + 7, ya - 7, 6, 5, C.charcoal); rect(x + 55, ya - 7, 6, 5, C.charcoal);
      rect(x + 9, ya - 22, 3, 15, C.gray); rect(x + 57, ya - 22, 3, 15, C.gray);
      rect(x, ya - WB_H - BOARD_T, 69, BOARD_T, P.slateL); // 板厚の天端(垂直板は厚みのみ)
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

    function sofa(x, ya) { // 投影共通: 座面天面=実0.4H・肘掛け天面=実0.5H・笠木=実0.2H×DEPTH_K
      var seatY = ya - 11 - SOFA_D;   // 座面天面の上端(ya-23)
      var backY = ya - SOFA_BACK - 9; // 背もたれ前面の上端(ya-40)
      rect(x + 5, ya - 2, 92, 2, P.slateD);                           // 接地影
      rect(x + 9, backY - SOFA_BACK_D, 84, SOFA_BACK_D, P.wallShade); // 背もたれの笠木(天面)
      rect(x + 9, backY, 84, seatY - backY, P.dark);                  // 背もたれの前面
      rect(x + 12, backY + 4, 78, 11, mix(C.gray, C.white, 0.16));    // 背クッション
      rect(x, ya - 24 - ARM_D, 9, ARM_D, P.wallShade);                // 肘掛けの天面(左)
      rect(x + 93, ya - 24 - ARM_D, 9, ARM_D, P.wallShade);           // 肘掛けの天面(右)
      rect(x, ya - 24, 9, 18, P.dark); rect(x + 93, ya - 24, 9, 18, P.dark); // 肘掛けの前面
      rect(x + 9, seatY, 84, SOFA_D, P.wallShade);                    // 座面の天面
      rect(x + 9, ya - 11, 84, 8, C.gray);                            // 座面の前面
      rect(x + 12, ya - 3, 9, 3, P.slateD); rect(x + 81, ya - 3, 9, 3, P.slateD);
    }

    function lowTable(x, ya) { // ソファ前の丸テーブル(高さ0.3H)。天板=横TABLE_R/縦dTop(TABLE_R)の楕円
      var cx = x + TABLE_R, cy = ya - TABLE_H - dTop(TABLE_R); // 天板楕円の中心(前縁=ya-TABLE_H)
      ellipse(cx, ya - 2, 13, 4, P.slateD);                    // 接地影
      rect(cx - 3, cy, 6, ya - cy - 2, P.dark);                // 支柱
      rect(cx - 8, ya - 4, 16, 3, C.charcoal);                 // 台座
      ellipse(cx, cy + 2, TABLE_R, dTop(TABLE_R), P.slateD);   // 天板の厚み
      ellipse(cx, cy, TABLE_R, dTop(TABLE_R), P.slateL);       // 天板(真円にしない)
      rect(cx - 9, cy - 3, 14, 4, C.white);                    // 雑誌
    }

    function plant(x, ya) { // 全高≈1.0H。鉢の口=rx11/縦dTop(11)の楕円(投影共通)
      ellipse(x + 18, ya, 13, 4, P.slateD);
      poly([[x + 6, ya - 23], [x + 31, ya - 23], [x + 33, ya - 18], [x + 4, ya - 18]], P.wallShade);
      poly([[x + 7, ya - 18], [x + 30, ya - 18], [x + 25, ya - 2], [x + 12, ya - 2]], C.gray);
      ellipse(x + 18, ya - 23, 11, dTop(11), P.slateD); // 鉢の口(土の面)
      rect(x + 16, ya - 39, 4, 18, P.dark);
      // 葉は葉色(charcoal-gray混色)の3段。旧pale/wallShadeはほぼ白で、
      // 鉢に紙が刺さっているように見えていた(2026-09-04目視監査で修正)
      poly([[x + 18, ya - 33], [x + 3, ya - 42], [x + 9, ya - 50], [x + 21, ya - 36]], P.leaf);
      poly([[x + 18, ya - 38], [x + 26, ya - 51], [x + 33, ya - 45], [x + 23, ya - 33]], mix(C.charcoal, C.gray, 0.8));
      poly([[x + 20, ya - 30], [x + 36, ya - 39], [x + 38, ya - 32], [x + 23, ya - 26]], mix(C.charcoal, C.gray, 0.62));
    }

    function coffeeCup(x, y) {
      // 湯気の1px針は削除(小物で唯一の1px粒=粒の大きさを2px以上に統一。
      // 手持ちのカップでは針が持ち主の顔に重なってもいた。2026-09-04目視監査)
      rect(x, y, 10, 7, C.white); rect(x + 10, y + 1, 3, 4, C.white);
    }

    // 歩行者の持ち物。向き(dir)に応じて体の手前側へ持ち替える=左右で持ち手が入れ替わる。
    // 上向き(背中)は右脇に少しだけ見せる。種類は行き先と一致させる:
    // papers=書類を届ける/運ぶ・folder=承認済みの綴りを持ち帰る・laptop=打ち合わせへ・
    // bag=退勤/出社の通勤鞄。カップだけは既存のcoffeeCupを使う。
    function heldItem(kind, x, y, dir, frame) {
      var bob = (frame === 1 || frame === 3 ? 1 : 0) * 2; // personの歩行と同じ上下
      var ix = dir === "left" ? x - 4 : dir === "right" ? x + 27 : dir === "up" ? x + 28 : x + 10;
      var iy = y + 28 + bob;
      if (kind === "papers") {
        var pw = dir === "down" ? 18 : 15;
        rect(ix, iy, pw, 9, C.white); rect(ix, iy, pw, 2, P.pale);
        rect(ix, iy + 8, pw, 1, C.gray);
      } else if (kind === "folder") { // 綴り(青いラベル)
        rect(ix, iy, 15, 10, P.pale); rect(ix, iy, 15, 2, C.gray);
        rect(ix + 3, iy + 4, 8, 3, P.codeB);
      } else if (kind === "laptop") { // 閉じたノートPCを小脇に抱える
        rect(ix, iy, 16, 2, P.pale); rect(ix, iy + 2, 16, 7, C.charcoal);
        rect(ix + 2, iy + 3, 12, 3, P.wallShade);
      } else if (kind === "bag") { // 通勤鞄(手から提げる)
        rect(ix + 4, iy + 4, 5, 3, P.dark);
        rect(ix, iy + 7, 13, 11, C.charcoal); rect(ix + 1, iy + 8, 11, 2, P.dark);
      }
    }

    function cafeCounter(x, ya) { // 右下の行き止まり。天面=実0.4H×DEPTH_K(投影共通)
      rect(x, ya - COUNTER_H - COUNTER_D, CAFE_W, COUNTER_D, P.slateL);
      rect(x, ya - COUNTER_H - COUNTER_D, CAFE_W, 1, P.slateD); // 天面の奥縁
      // 前面はcharcoal(旧slateM=床の地色と同色でカウンター全体が床に同化し、
      // カップとメーカーだけが床に浮いて見えていた。2026-09-04目視監査で修正)
      rect(x, ya - COUNTER_H, CAFE_W, COUNTER_H, C.charcoal);
      rect(x, ya - COUNTER_H, CAFE_W, 1, P.slateD);             // 前縁
      rect(x + 23, ya - COUNTER_H + 3, 1, COUNTER_H - 6, P.dark);
      rect(x + 46, ya - COUNTER_H + 3, 1, COUNTER_H - 6, P.dark); // 面板の継ぎ目
      rect(x + 1, ya - 1, CAFE_W - 2, 1, P.slateD);             // 接地
      // コーヒーメーカー(高さMAKER_H・天面=実0.12H×DEPTH_K。天面の帯の中に置く)
      rect(x + 6, ya - COUNTER_H - 6 - MAKER_H - MAKER_D, 21, MAKER_D, P.wallShade);
      rect(x + 6, ya - COUNTER_H - 6 - MAKER_H, 21, MAKER_H, C.charcoal);
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

      // 歩行キャラの状態(先に置いた者から順に衝突を解決する)。帰宅組は最後=全員に譲る。
      var caps = [];
      var carrier = resolveActor(carrierState, ms, OBST_MAIN);
      var feet = [footOf(carrier.x, carrier.y)];
      caps.push({ foot: feet[0], obst: OBST_MAIN, moving: !!carrier.moving });
      var coffee = resolveActor(coffeeFull, ms, OBST_MAIN.concat(feet));
      if (!coffee.gone) {
        feet.push(footOf(coffee.x, coffee.y));
        caps.push({ foot: footOf(coffee.x, coffee.y), obst: OBST_MAIN, moving: !!coffee.moving });
      }
      var talk = discussState(ms), talkOut = talk.mode !== "seat";
      if (talkOut) {
        talk = resolveActor(function (m) {
          var st = discussState(m);
          return st.mode === "seat" ? { x: 115, y: 267, dir: "down", mode: "out", moving: false } : st;
        }, ms, OBST_NO_ENG.concat(feet));
        feet.push(footOf(talk.x, talk.y));
        caps.push({ foot: footOf(talk.x, talk.y), obst: OBST_NO_ENG, moving: !!talk.moving });
      }
      // ソファ2の離席(ボード脇の確認)。帰宅組が歩く時間帯は予定表(sofaScene)側で見送る。
      var sofaSc = sofaScene(ms), sofaWalk = null;
      if (sofaSc.away) {
        sofaWalk = resolveActor(function (m) {
          var sc2 = sofaScene(m);
          return sc2.away && sc2.walk ? sc2.walk : { x: 386, y: 281, dir: "left", moving: false, mode: "go" };
        }, ms, OBST_MAIN.concat(feet));
        feet.push(footOf(sofaWalk.x, sofaWalk.y));
        caps.push({ foot: footOf(sofaWalk.x, sofaWalk.y), obst: OBST_MAIN, moving: !!sofaWalk.moving });
      }
      // 帰宅する3組(CIO・休憩の2人)。モードは巻き戻し前の値で確定し、位置だけ
      // resolveActorで譲らせる(巻き戻しても経路沿いに連続=ワープしない)。
      var cioMode = awayMode(CIO_AWAY, ms).mode;
      var cio = awayActor(CIO_AWAY, ms);
      if (cioMode === "out" || cioMode === "in") {
        cio = resolveActor(function (m) { return awayActor(CIO_AWAY, m); }, ms, OBST_CIO_AWAY.concat(feet));
        feet.push(footOf(cio.x, cio.y));
        caps.push({ foot: footOf(cio.x, cio.y), obst: OBST_CIO_AWAY, moving: !!cio.moving });
      }
      var duoAMode = awayMode(DUOA_AWAY, ms).mode;
      var duoA = awayActor(DUOA_AWAY, ms);
      if (duoAMode === "out" || duoAMode === "in") {
        duoA = resolveActor(function (m) { return awayActor(DUOA_AWAY, m); }, ms, OBST_DUO_AWAY.concat(feet));
        feet.push(footOf(duoA.x, duoA.y));
        caps.push({ foot: footOf(duoA.x, duoA.y), obst: OBST_DUO_AWAY, moving: !!duoA.moving });
      }
      var duoBMode = awayMode(DUOB_AWAY, ms).mode;
      var duoB = awayActor(DUOB_AWAY, ms);
      if (duoBMode === "out" || duoBMode === "in") {
        duoB = resolveActor(function (m) { return awayActor(DUOB_AWAY, m); }, ms, OBST_DUO_AWAY.concat(feet));
        feet.push(footOf(duoB.x, duoB.y));
        caps.push({ foot: footOf(duoB.x, duoB.y), obst: OBST_DUO_AWAY, moving: !!duoB.moving });
      }
      var cioHere = cioMode === "present";
      var duoAHere = duoAMode === "present", duoBHere = duoBMode === "present";
      // オフライン検証用フック(通常運転では未定義=何もしない)
      if (typeof window.__SPX_CAPTURE === "function") window.__SPX_CAPTURE(ms, caps);

      // 書類の山: 運搬と処理で1段ずつ増減する。偶数周期=届ける(自席-1→CIO+1→CIOが
      // 処理-1→持ち帰った綴りで自席+1)/奇数周期=受け取る(CIO-1→新しい決裁が+1)。
      // どちらも周期末に初期値へ戻る(境界で山が飛ばない)。最大3段(人を隠さない高さ)。
      var ct = ms % CARRY_CYCLE, stackA, stackB;
      if (Math.floor(ms / CARRY_CYCLE) % 2 === 1) {
        stackA = 3;
        stackB = 2 - (ct >= 12000 ? 1 : 0) + (ct >= 30000 ? 1 : 0);
      } else {
        stackA = 3 - (ct >= 1000 ? 1 : 0) + (ct >= 41000 ? 1 : 0);
        stackB = 2 + (ct >= 12000 ? 1 : 0) - (ct >= 30000 ? 1 : 0);
      }

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
        cioUnit(ms + 700, phase + 1, cioHere);
        // 決裁待ちの山: モニタの帯(x276-313)の手前に置く=天面つきでもCIOの胸元を隠さない
        paperStack(290, 183, stackB);
      });
      add(331, function () { floorBoard(230, 330, ms); });
      add(343, function () { boardWriter(ms, talk.mode === "talk"); });
      add(265, function () { deskFacing(64, 264, ms + 150); });
      add(319, function () { deskAway(64, 300, ms + 300, phase + 1, talkOut); });
      add(359, function () { breakDuo(ms, duoAHere, duoBHere); });
      add(323, function () { sofaUnit(ms, sofaSc); });
      add(357, function () { lowTable(350, 356); });
      add(383, function () { cafeCounter(548, 382); });
      add(381, function () { trashBin(24, 380); });
      var walkFrame = Math.floor(ms / (520 * SLOW)) % 4;
      add(carrier.y + UNIT, function () {
        person(carrier.x, carrier.y, carrier.dir, carrier.moving ? walkFrame : 0, ST_CARRY, false);
        if (carrier.carry) heldItem(carrier.carry, carrier.x, carrier.y, carrier.dir, carrier.moving ? walkFrame : 0);
      });
      if (!coffee.gone) {
        add(coffee.y + UNIT, function () {
          person(coffee.x, coffee.y, coffee.dir, coffee.moving ? walkFrame : 0, ST_COFFEE, false);
          // カップも向きに応じて体の手前側へ持ち替える
          if (coffee.cup) coffeeCup(coffee.dir === "left" ? coffee.x - 5 : coffee.x + 28, coffee.y + 27);
          if (coffee.leaving || coffee.arriving) heldItem("bag", coffee.x, coffee.y, coffee.dir, coffee.moving ? walkFrame : 0);
        });
      }
      // 帰宅組の退勤/出社の歩き(不在=away中は描かない。位置は経路の連続補間)。
      // 行き先=家なので通勤鞄を持つ(持ち物と行き先の一致)。
      if (cioMode === "out" || cioMode === "in") {
        add(cio.y + UNIT, function () {
          person(cio.x, cio.y, cio.dir, walkFrame, ST_CIO, false);
          heldItem("bag", cio.x, cio.y, cio.dir, walkFrame);
        });
      }
      if (duoAMode === "out" || duoAMode === "in") {
        add(duoA.y + UNIT, function () {
          person(duoA.x, duoA.y, duoA.dir, walkFrame, ST_BREAK1, false);
          heldItem("bag", duoA.x, duoA.y, duoA.dir, walkFrame);
        });
      }
      if (duoBMode === "out" || duoBMode === "in") {
        add(duoB.y + UNIT, function () {
          person(duoB.x, duoB.y, duoB.dir, walkFrame, ST_BREAK2, false);
          heldItem("bag", duoB.x, duoB.y, duoB.dir, walkFrame);
        });
      }
      if (talkOut) {
        add(talk.y + UNIT, function () {
          person(talk.x, talk.y, talk.dir,
            talk.moving ? walkFrame : Math.floor(ms / 1300) % 2, ST_ENG2, false);
          // ノートPCを持って相談へ(行きも帰りも小脇に抱える)
          heldItem("laptop", talk.x, talk.y, talk.dir, talk.moving ? walkFrame : 0);
        });
      }
      if (sofaSc.away) {
        add(sofaWalk.y + UNIT, function () {
          person(sofaWalk.x, sofaWalk.y, sofaWalk.dir,
            sofaWalk.moving ? walkFrame : Math.floor(ms / 1300) % 2, ST_SOFA2W, false);
          heldItem("papers", sofaWalk.x, sofaWalk.y, sofaWalk.dir, sofaWalk.moving ? walkFrame : 0);
        });
      }
      ents.sort(function (a, b) { return a.y - b.y; });
      for (i = 0; i < ents.length; i += 1) ents[i].f();

      // ソファの会話: 予定表の会話フェーズだけ8秒で左右1往復(交互)+間=話していない
      // 時間を作る。深夜は3周期に1回だけ吹き出す(静かだが止まらない)。
      var quiet = nightT >= 0.6;
      var tb = convTurn(ms, 3700);
      if (sofaSc.talking && tb >= 0 && (!quiet || Math.floor((ms + 3700) / CONV_MS) % 3 === 0)) {
        bubble(tb === 0 ? 344 : 390, 228, (Math.floor((ms + 3700) / CONV_MS) * 2 + tb + 1) % 3);
      }
      if (talk.mode === "talk") {
        var turn = Math.floor(talk.t / 4000) % 2;
        bubble(turn === 0 ? 232 : 280, turn === 0 ? 260 : 264, (Math.floor(talk.t / 4000) + 1) % 3);
      }
      // コーヒーブレイクの2人: 既存と同じ8秒周期で交互に出す(2人が揃っているときだけ)。
      var td = convTurn(ms, 6100);
      if (duoAHere && duoBHere && td >= 0 && (!quiet || Math.floor((ms + 6100) / CONV_MS) % 3 === 1)) {
        bubble(td === 0 ? 452 : 506, 276, (Math.floor((ms + 6100) / CONV_MS) * 2 + td) % 3);
      }
      // 席の会話(予定表=chatStateで同時に1組だけ)と考え中の吹き出し。
      if (chatNow.pair === "audit") { // 監査⇄経理: 横を向いて3.5秒交代で1往復
        var ca = Math.floor(chatNow.t / 3500) % 2;
        bubble(ca === 0 ? 95 : 141, 104, (Math.floor(chatNow.t / 3500) + 1) % 3);
      } else if (chatNow.pair === "engv") { // 向かい合わせのエンジニア(上下の席)
        var ce = Math.floor(chatNow.t / 3500) % 2;
        bubble(66, ce === 0 ? 166 : 236, (Math.floor(chatNow.t / 3500) + ce) % 3);
      } else if (chatNow.pair === "cio" && cioHere && ((chatNow.t >= 3000 && chatNow.t < 6000) || chatNow.t >= 9000)) {
        thinkBubble(348, 104, chatNow.t >= 9000, ms); // 見渡しの合間に考え中→最後にひらめき
      } else if (chatNow.pair === "think") { // 書き手→エンジニアの順に考え中
        if (chatNow.t < 3500) thinkBubble(238, 258, false, ms);
        else thinkBubble(112, 166, chatNow.t >= 5500, ms);
      }
      // 深夜: 天井の照明を落とす(窓の外には重ねない=星と夜空はそのまま)。
      // 暗幕はα最大0.28(旧0.45=依頼主「もう少し明るく」対応。何が起きているか見える)。
      // そのあとでモニタの画面・デスクライトなどglowsに積んだものだけを明るく描き直す。
      if (nightT > 0.02) {
        ctx.globalAlpha = 0.28 * nightT;
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
      // 帰宅組: 在席=通常の文言/退勤・出社の歩き=歩いている位置に「帰宅中/出社中」/
      // 不在=ホバーの対象から外す(hitbox自体を作らない)。
      if (cioHere) {
        addHit("cio", 306, 128, 46, 206,
          chatNow.pair === "cio"
            ? (chatNow.t >= 9000 ? "今 ひらめきました"
              : chatNow.t >= 3000 && chatNow.t < 6000 ? "今 考えています" : "今 フロアを見渡しています")
            : "今 全体を見ています");
      } else if (cioMode === "out" || cioMode === "in") {
        addHit("cio", cio.x, cio.y, UNIT, cio.y + UNIT, cioMode === "out" ? "今 帰宅中" : "今 出社中");
      }
      addHit("audit", 101, 128, 46, 206,
        chatNow.pair === "audit" ? "今 隣と相談しています"
          : late ? "今 夜通し見直しています" : "今 見直しています");
      addHit("keiri", 147, 128, 46, 206,
        chatNow.pair === "audit" ? "今 隣と相談しています"
          : late ? "今 夜通し数字を合わせています" : "今 数字を合わせています");
      addHit("eng", 69, 256, 48, 319,
        chatNow.pair === "engv" ? "今 向かいと認識合わせ中"
          : late ? "今 夜通しコードを書いています"
            : (ms % 42000 < 21000 ? "今 コードを書いています" : "今 テスト中"));
      addHit("eng3", 69, 187, 46, 265,
        chatNow.pair === "engv" ? "今 向かいと認識合わせ中"
          : late ? "今 夜通し実装中" : (ms % 36000 < 18000 ? "今 実装中" : "今 デバッグ中"));
      addHit("eng4", 115, 187, 46, 265,
        chatNow.pair === "think" && chatNow.t >= 3500 ? "今 考えています"
          : ms % 38000 < 19000 ? "今 レビュー中" : "今 コードを書いています");
      if (duoAHere) addHit("break1", 458, 308, UNIT, 359, "今 コーヒーブレイク中");
      else if (duoAMode === "out" || duoAMode === "in") {
        addHit("break1", duoA.x, duoA.y, UNIT, duoA.y + UNIT, duoAMode === "out" ? "今 帰宅中" : "今 出社中");
      }
      if (duoBHere) addHit("break2", 508, 308, UNIT, 359, "今 アイデアを出し合っています");
      else if (duoBMode === "out" || duoBMode === "in") {
        addHit("break2", duoB.x, duoB.y, UNIT, duoB.y + UNIT, duoBMode === "out" ? "今 帰宅中" : "今 出社中");
      }
      if (talkOut) {
        addHit("eng2", talk.x, talk.y, UNIT, talk.y + UNIT,
          talk.mode === "talk" ? "今 打ち合わせ中"
            : talk.mode === "out" ? "今 PCを持って相談にいきます" : "今 席に戻ります");
      } else {
        addHit("eng2", 115, 256, 48, 319, late ? "今 夜通し設計中" : "今 設計中");
      }
      addHit("writer", 234, 292, UNIT, 343,
        talk.mode === "talk" ? "今 打ち合わせ中"
          : chatNow.pair === "think" && chatNow.t < 3500 ? "今 考えています" : "今 構想を練っています");
      addHit("carrier", carrier.x, carrier.y, UNIT, carrier.y + UNIT,
        carrier.sorting ? "今 資料を整理しています"
          : carrier.carry === "folder" ? "今 承認済みの資料を持ち帰っています"
            : carrier.carry === "papers" ? (carrier.fetch ? "今 受け取った資料を運んでいます" : "今 資料を届けています")
              : carrier.fetch ? "今 資料を受け取りにいきます" : "今 次の資料を取りにいきます");
      if (!coffee.gone) {
        addHit("coffee", coffee.x, coffee.y, UNIT, coffee.y + UNIT,
          coffee.leaving ? "今 帰宅中"
            : coffee.arriving ? "今 出社中"
              : coffee.serving ? "今 コーヒーを配っています"
                : coffee.home ? "今 商談の作戦を練っています"
                  : coffee.atCounter ? "今 コーヒーを淹れています"
                    : coffee.cup ? "今 コーヒーを運んでいます" : "今 コーヒーを淹れにいきます");
      }
      addHit("sofa1", 339, 260, 44, 324,
        sofaSc.talking ? "今 採用の相談中"
          : sofaSc.aTablet ? "今 資料に目を通しています" : "今 ひと息ついています");
      if (sofaSc.away) {
        addHit("sofa2", sofaWalk.x, sofaWalk.y, UNIT, sofaWalk.y + UNIT,
          sofaWalk.mode === "board" ? "今 ボードを確認しています"
            : sofaWalk.mode === "back" ? "今 ソファに戻ります" : "今 ボードを確認しにいきます");
      } else {
        addHit("sofa2", 386, 260, 44, 324,
          sofaSc.talking ? "今 打ち合わせ中" : "今 資料を確認しています");
      }
      drawTips(ms);
    }

    function sofaUnit(ms, sc) { // ソファの2人: 姿勢は予定表(sofaScene)から決める
      var x = 330, ya = 322;
      var f1 = Math.floor(ms / (1450 * SLOW)) % 2, f2 = Math.floor((ms + 700) / (1250 * SLOW)) % 2;
      sofa(x, ya);
      var py = ya - 62; // 腰(py+42)=座クッション上面
      var lean = sc.talking ? 2 : 0; // 会話中は互いに2px乗り出す
      person(x + 9 + lean, py, sc.aDir, f1, ST_SOFA, true);
      if (sc.aTablet) { // 手元のタブレットに目を落とす(ベゼル3px=枠の太さの統一)
        rect(x + 13 + lean, py + 30, 14, 10, C.charcoal);
        rect(x + 16 + lean, py + 33, 8, 4, P.screen);
      }
      rect(x + 18 + lean, py + 42, 7, 12, P.dark); rect(x + 30 + lean, py + 42, 7, 12, P.dark); // 垂れる足
      if (!sc.away) { // 離席中は空いた座面だけが残る
        person(x + 56 - lean, py, sc.bDir, f2, ST_SOFA2, true);
        rect(x + 65 - lean, py + 42, 7, 12, P.dark); rect(x + 77 - lean, py + 42, 7, 12, P.dark);
      }
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
  // オフライン検証用(__SPX_CAPTUREと同じ流儀。描画経路では使わない):
  // 「同じ半径のだ円が位置によらず同じ輪郭になる」ことをNode側で機械照合する。
  window.mountSchemePixel.__testPainter = painter;
}());
