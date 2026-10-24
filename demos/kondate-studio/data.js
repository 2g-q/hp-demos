/* All values below are fictional demonstration data, not official food composition values. */
window.DEMO_DATA={version:'demo-2026-10-24-v1',ingredients:{},recipes:[]};
(function(){
const D=window.DEMO_DATA;
// id, name, yen/kg, kcal/100g, protein/100g, fat/100g, salt/100g, yield, group, color
const rows=[
['rice','ご飯（炊飯後）',250,156,2.5,.3,0,1,'staple','white'],['salmon','鮭',1600,190,21,11,.1,.95,'seafood','orange'],['chicken','鶏肉',850,190,19,12,.1,.95,'chicken','brown'],['pork','豚肉',1100,235,19,17,.1,.95,'pork','brown'],['beef','牛肉',1700,250,18,20,.1,.95,'beef','brown'],['mackerel','さば',1000,210,20,14,.2,.9,'seafood','brown'],['cod','たら',1300,75,18,.3,.2,.95,'seafood','white'],['egg','卵',550,145,12,10,.4,.88,'egg','yellow'],['tofu','豆腐',330,70,7,4,0,1,'soy','white'],['atsuage','厚揚げ',600,145,11,11,0,1,'soy','brown'],['natto','納豆',800,190,16,10,0,1,'soy','brown'],['carrot','にんじん',250,35,.7,.1,0,.9,'root','orange'],['spinach','ほうれん草',500,20,2.2,.4,0,.85,'leaf','green'],['komatsuna','小松菜',380,14,1.5,.2,0,.85,'leaf','green'],['cabbage','キャベツ',160,23,1.3,.2,0,.85,'brassica','green'],['hakusai','白菜',180,13,.8,.1,0,.9,'brassica','white'],['pumpkin','かぼちゃ',350,80,1.5,.3,0,.85,'squash','yellow'],['potato','じゃがいも',220,60,1.5,.1,0,.85,'tuber','yellow'],['sweetpotato','さつまいも',350,125,1.2,.2,0,.9,'tuber','yellow'],['daikon','大根',150,18,.5,.1,0,.9,'root','white'],['onion','玉ねぎ',220,33,1,.1,0,.9,'bulb','white'],['broccoli','ブロッコリー',550,35,4,.5,0,.7,'flower','green'],['pepper','ピーマン',550,20,.9,.2,0,.85,'pepper','green'],['cucumber','きゅうり',400,13,1,.1,0,.97,'cucumber','green'],['tomato','トマト',450,20,.7,.1,0,.98,'tomato','red'],['eggplant','なす',450,18,1,.1,0,.9,'eggplant','purple'],['burdock','ごぼう',450,60,1.8,.1,0,.85,'root','brown'],['lotus','れんこん',650,65,1.7,.1,0,.85,'root','white'],['mushroom','しめじ',400,20,2.5,.3,0,.9,'mushroom','brown'],['enoki','えのき',300,25,2.5,.2,0,.9,'mushroom','white'],['corn','コーン',550,90,3,1.5,0,1,'grain','yellow'],['wakame','わかめ（戻し）',650,15,1.5,.2,.5,1,'seaweed','green'],['hijiki','ひじき（戻し）',700,12,.9,.2,.1,1,'seaweed','black'],['radish','かぶ',220,18,.6,.1,0,.9,'root','white'],['peas','いんげん',600,25,2,.2,0,.95,'bean','green'],['sesame','ごま',1200,600,20,50,0,1,'seasoning','brown'],['miso','みそ',500,180,12,6,12,1,'seasoning','brown'],['soy','しょうゆ',350,75,8,0,14,1,'seasoning','brown'],['oil','油',500,900,0,100,0,1,'seasoning','yellow'],['sugar','砂糖',250,390,0,0,0,1,'seasoning','white'],['dashi','だし（希釈済み）',100,3,.2,0,.4,1,'seasoning','white'],['salt','塩',200,0,0,0,100,1,'seasoning','white']];
for(const [id,name,price,kcal,protein,fat,salt,yieldRate,group,color] of rows)D.ingredients[id]={id,name,price,kcal,protein,fat,salt,yieldRate,group,color,source:'試用用の仮値（公式成分表ではありません）'};
const add=(id,name,slot,parts,equipment,photo=null)=>D.recipes.push({id,name,slot,parts:parts.map(([id,g])=>({id,g})),equipment,photo,revision:1});
add('rice','ご飯','rice',[['rice',180]],null,0);
add('salmon-grill','鮭の塩焼き','main',[['salmon',80],['salt',.5]],'oven',1);
add('chicken-teri','鶏の照り焼き','main',[['chicken',90],['soy',7],['sugar',4]],'oven',4);
add('pork-ginger','豚肉のしょうが焼き','main',[['pork',80],['onion',30],['soy',7],['oil',3]],'pan');
add('beef-simmer','牛肉のしぐれ煮','main',[['beef',75],['burdock',30],['soy',7],['sugar',4]],'kettle');
add('saba-miso','さばのみそ煮','main',[['mackerel',85],['miso',9],['sugar',5]],'kettle');
add('cod-steam','たらの蒸し物','main',[['cod',90],['mushroom',25],['soy',5]],'oven');
add('omelet','野菜入り卵焼き','main',[['egg',90],['corn',15],['sugar',4]],'oven');
add('mapo','麻婆豆腐','main',[['tofu',110],['pork',30],['soy',7],['oil',3]],'kettle');
add('atsuage-simmer','厚揚げの含め煮','main',[['atsuage',100],['daikon',30],['soy',7],['sugar',3]],'kettle');
add('chicken-tomato','鶏肉のトマト煮','main',[['chicken',90],['tomato',50],['onion',20],['oil',3]],'kettle');
add('pork-fry','豚肉の野菜炒め','main',[['pork',80],['pepper',25],['cabbage',35],['soy',7],['oil',3]],'pan');
add('egg-tofu','豆腐の卵とじ','main',[['tofu',80],['egg',50],['onion',20],['soy',6]],'kettle');
add('spinach-sesame','ほうれん草のごま和え','side',[['spinach',50],['carrot',15],['sesame',3],['soy',4]],null,2);
add('pumpkin-simmer','かぼちゃの煮物','side',[['pumpkin',65],['soy',4],['sugar',4]],'kettle',5);
add('cabbage-salad','キャベツの和え物','side',[['cabbage',60],['corn',10],['soy',3]],null);
add('hakusai-simmer','白菜の煮びたし','side',[['hakusai',65],['soy',4],['dashi',20]],'kettle');
add('potato-roast','じゃがいもの青のり焼き','side',[['potato',65],['oil',3],['salt',.3]],'oven');
add('daikon-pickle','大根の甘酢和え','side',[['daikon',60],['sugar',3],['salt',.3]],null);
add('broccoli','ブロッコリーのサラダ','side',[['broccoli',55],['corn',10],['oil',2],['salt',.3]],null);
add('sweetpotato','さつまいもの甘煮','side',[['sweetpotato',65],['sugar',4]],'kettle');
add('cucumber','きゅうりの酢の物','side',[['cucumber',55],['wakame',8],['sugar',3],['salt',.3]],null);
add('eggplant','なすの煮びたし','side',[['eggplant',65],['soy',4],['oil',3]],'kettle');
add('kinpira','ごぼうのきんぴら','side',[['burdock',45],['carrot',15],['soy',4],['oil',3],['sugar',3]],'pan');
add('lotus','れんこんの煮物','side',[['lotus',60],['soy',4],['sugar',3]],'kettle');
add('hijiki','ひじきの炒め煮','side',[['hijiki',45],['carrot',15],['soy',4],['sugar',3]],'kettle');
add('komatsuna','小松菜のおひたし','side',[['komatsuna',65],['soy',4]],null);
add('radish','かぶの煮物','side',[['radish',65],['dashi',25],['soy',4]],'kettle');
add('peas','いんげんのごま和え','side',[['peas',55],['sesame',3],['soy',4]],null);
add('tofu-soup','豆腐と野菜のすまし汁','soup',[['tofu',25],['carrot',10],['onion',10],['dashi',140]],'kettle',3);
add('wakame-soup','わかめのみそ汁','soup',[['wakame',10],['miso',10],['dashi',140]],'kettle');
add('daikon-soup','大根のみそ汁','soup',[['daikon',30],['miso',10],['dashi',140]],'kettle');
add('mushroom-soup','きのこのすまし汁','soup',[['enoki',25],['soy',4],['dashi',140]],'kettle');
add('potato-soup','じゃがいものみそ汁','soup',[['potato',30],['miso',10],['dashi',140]],'kettle');
add('hakusai-soup','白菜のすまし汁','soup',[['hakusai',30],['soy',4],['dashi',140]],'kettle');
add('corn-soup','コーンスープ','soup',[['corn',35],['onion',10],['dashi',140],['salt',.3]],'kettle');
add('radish-soup','かぶのすまし汁','soup',[['radish',30],['soy',4],['dashi',140]],'kettle');
D.groups={soy:'大豆製品',brassica:'キャベツ・白菜',seaweed:'海藻',seafood:'魚介',pork:'豚肉',chicken:'鶏肉',beef:'牛肉',egg:'卵'};
D.equipment={oven:'スチコン',kettle:'回転釜',pan:'炒め・揚げ設備'};
D.sourceNotes=[
{time:'対象業務',title:'給食施設の献立計画を、見渡しやすく',text:'朝昼夕の献立を月間カレンダーで管理し、料理を選ぶと、食材・一人量・食数に応じた必要量と原価を確認できます。千食単位の試算をサンプルデータでお試しいただけます。'},
{time:'試せる操作',title:'配置案を作り、気になる部分を直す',text:'月間の配置案を生成し、日ごとの料理差し替えや別日との交換を行えます。行事食は固定でき、再生成でも保持します。候補から注意が少ない配置を探す方式で、全条件の充足や最適性を保証するものではありません。'},
{time:'ルールの見える化',title:'食材・食品群・同じ料理の間隔を確認',text:'間に空ける日数、汁物の少量具の除外条件、一人原価の上限などを変更できます。注意は黄色、上限超過などは赤で表示します。仮の食品群分類を使っており、施設ごとの正式ルールは別途設計します。'},
{time:'計算と出力',title:'食数変更から必要量の集計まで連動',text:'一人量×食数で可食量、歩留まりで購入量、kg単価で原価を算出します。栄養・単価・歩留まりは試用の仮値です。JSONで保存・復元し、献立と食材の確認用CSVを出力できます。'},
{time:'設備と使用期間',title:'確認できる範囲と、判断が必要な範囲を分ける',text:'仮の1日あたり使用料理数と、食材ごとの単一納品ロットの使用期間を簡易検査します。実際の機器容量・時間帯別工程・複数納品・在庫・包装単位の発注は未対応です。'},
{time:'個別導入のご相談',title:'献立計画支援の仕組みを、現場のルールに合わせて',text:'本デモを出発点に、既存の献立表・レシピ・食数表・重複ルールを整理し、必要な範囲を定めて個別導入をご相談いただけます。データ整備、利用人数、共有・承認の要否を確認したうえで、対応範囲とお見積もりをご提案します。'}];
})();
