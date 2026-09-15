"""Original vector cover illustrations. Run from the repository root."""
from pathlib import Path
from html import escape
import math

OUT = Path('pf/editorial')
OUT.mkdir(exist_ok=True)
def rect(x,y,w,h,fill,rx=8,extra=''):
    return f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="{rx}" fill="{fill}" {extra}/>'
def line(x,y,X,Y,c,w=3,extra=''):
    return f'<path d="M{x} {y}L{X} {Y}" stroke="{c}" stroke-width="{w}" fill="none" {extra}/>'
def circle(x,y,r,c,extra=''):
    return f'<circle cx="{x}" cy="{y}" r="{r}" fill="{c}" {extra}/>'
def text(x,y,t,size=18,c='#fff',extra=''):
    return f'<text x="{x}" y="{y}" fill="{c}" font-size="{size}" font-family="Arial,sans-serif" {extra}>{escape(t)}</text>'
def paper(x,y,w=190,h=240):
    return rect(x,y,w,h,'#fff',5, 'filter="url(#shadow)"')+rect(x+22,y+25,50,8,'#142f48',2)+''.join(rect(x+22,y+65+i*24,w-44-(i%3)*18,4,'#cbd7db',2) for i in range(5))
def check(x,y,c='#145247'):
    return circle(x,y,27,c)+f'<path d="M{x-12} {y}l9 9 16-19" fill="none" stroke="white" stroke-width="4"/>'
def bars(x,y,colors):
    return ''.join(rect(x+i*46,y-h,30,h,c,4) for i,(h,c) in enumerate(zip([48,85,69,125,157],colors)))
def phone(x,y,c='#fff'):
    return rect(x,y,158,278,'#17252a',23,'filter="url(#shadow)"')+rect(x+7,y+7,144,264,c,18)+rect(x+54,y+14,50,7,'#17252a',4)
def box(x,y,c):
    return f'<path d="M{x} {y}l70-35 70 35v100l-70 35-70-35z" fill="{c}"/><path d="M{x} {y}l70 35 70-35M{x+70} {y+35}v100" fill="none" stroke="#fff" stroke-opacity=".55" stroke-width="2"/>'

scenes={}
scenes['document-intake']=('#ead7be','#c59368','DOCUMENT / REVIEW',
    '<g transform="rotate(-12 335 265)">'+paper(190,104,226,290)+'</g>'+paper(371,148,225,270)+rect(395,311,175,31,'#e3f5eb',3)+check(558,326)+line(130,235,657,235,'#95e0cd',3)+rect(130,225,527,23,'url(#scan)',0))
scenes['data-dashboard']=('#151642','#393779','DATA / INSIGHT',
    ''.join(line(115,150+i*55,705,150+i*55,'#ffffff',1,'opacity=".12"') for i in range(5))+bars(194,381,['#8d92ff','#b1a5ff','#797aff','#c1b5ff','#dbd5ff'])+f'<path d="M140 300Q250 310 310 233T485 200T670 108" fill="none" stroke="#b6efda" stroke-width="5"/>'+circle(670,108,9,'#b6efda')+text(525,349,'CSV',61,'#e4dfff')+text(530,378,'CLEAN. READ. EXPORT.',12,'#b9b4df'))
scenes['workflow']=('#ccf0eb','#85c8c3','WORKFLOW / HANDOFF',
    '<path d="M140 278H275Q315 278 315 235V163Q315 128 350 128H460Q495 128 495 164V297Q495 332 535 332H679" fill="none" stroke="#176567" stroke-width="18"/>'+''.join(circle(x,y,12,'#fff') for x,y in [(150,278),(315,200),(410,128),(495,240),(640,332)])+rect(112,190,140,99,'#fff',15,'filter="url(#shadow)"')+text(134,247,'INBOX',25,'#205759')+rect(522,265,154,120,'#103f47',15)+text(544,316,'ASSIGNED',17,'#fff')+check(600,352,'#3a9484'))
scenes['product-catalog']=('#e8ede1','#bdcdb4','PRODUCT / CATALOG',
    box(166,226,'#486450')+box(340,173,'#869e75')+box(502,239,'#b6ba87')+rect(202,281,58,43,'#f3ebd7',2)+rect(375,227,65,42,'#f3ebd7',2)+rect(537,294,60,40,'#f3ebd7',2)+''.join(line(542+i*5,300,542+i*5,326,'#4b5947',2) for i in range(10))+text(170,125,'A carefully ordered collection.',25,'#34543d'))
scenes['web-watch']=('#171e29','#35475d','MONITOR / CHANGES',
    ''.join(circle(420,265,r,'none',f'stroke="#8aa1bb" stroke-width="1" opacity=".4"') for r in [60,110,160])+line(220,265,625,265,'#819bb4',1)+line(420,90,420,438,'#819bb4',1)+'<path d="M420 265L545 145A170 170 0 0 1 580 330Z" fill="url(#scan)"/>'+circle(491,176,12,'#f2be6c')+circle(325,331,8,'#8cd8cf')+rect(550,204,141,77,'#edc27f',8)+text(568,233,'PRICE CHANGED',12,'#293139')+text(567,266,'− 12%',30,'#293139'))
scenes['case-management']=('#ebe1ef','#baa9ce','SUPPORT / CASE NOTES',
    ''.join(rect(145+i*168,122,145,244,['#dacdea','#fff','#c6b7da'][i],12,'filter="url(#shadow)"')+circle(176+i*168,160,11,['#84689a','#9c759c','#7d5e89'][i])+''.join(rect(166+i*168,202+j*39,101,23,'#f7f3fb',5) for j in range(3)) for i in range(3))+rect(240,290,253,102,'#59456e',14,'filter="url(#shadow)"')+text(264,332,'One conversation.',24)+text(264,364,'Every detail.',24,'#ded2ed'))
scenes['ai-improvement']=('#e6eff9','#b0c5e0','AI / OPPORTUNITY',
    ''.join(f'<ellipse cx="405" cy="262" rx="{r}" ry="{r/2}" transform="rotate({a} 405 262)" fill="none" stroke="#6888ac" stroke-width="2"/>' for r,a in [(190,0),(180,60),(180,-60)])+circle(405,262,73,'url(#metal)','filter="url(#shadow)"')+text(370,277,'AI',46,'#213a58')+''.join(circle(x,y,20,c) for x,y,c in [(223,235,'#243d61'),(490,108,'#bbccd9'),(530,380,'#f6d497')]))
scenes['knowledge-search']=('#eee4ce','#c8b794','KNOWLEDGE / DISCOVERY',
    '<g transform="rotate(-9 350 280)">'+''.join(rect(159+i*62,150,47,228,c,5) for i,c in enumerate(['#826e50','#ac9b78','#ded4ba','#6b766a','#a7b09d']))+'</g>'+circle(517,247,97,'#e6eedfbb','stroke="#344e4d" stroke-width="14"')+line(585,318,673,399,'#344e4d',24)+text(455,251,'Find the',22,'#263f3c')+text(455,283,'answer.',28,'#263f3c'))
scenes['ec-purchase']=('#f0dfd4','#d2b69b','COMMERCE / CHECKOUT',
    '<path d="M286 139H477L491 388H272Z" fill="#bea080" filter="url(#shadow)"/>'+rect(305,223,151,104,'#f8f0e5',2)+text(328,268,'COFFEE',25,'#4b392b')+text(329,297,'DAILY RITUAL',11,'#84664d')+rect(463,304,180,79,'#fff',12,'filter="url(#shadow)"')+check(499,344,'#375c4e')+text(541,350,'CART',20,'#314a40'))
scenes['sns-workflow']=('#f6dce0','#d99bac','SOCIAL / EDITORIAL',
    '<g transform="rotate(-11 288 265)">'+rect(167,116,213,281,'#b25570',8)+circle(274,226,67,'#efd9c6')+text(193,331,'A new story.',25)+'</g><g transform="rotate(9 500 253)">'+rect(400,117,210,280,'#fff',8,'filter="url(#shadow)"')+rect(415,137,180,130,'#c8b5cf',4)+text(422,308,'READY',30,'#714568')+text(422,338,'FOR REVIEW',16,'#714568')+'</g>'+check(594,377,'#713d61'))
scenes['sales-slides']=('#222d43','#465a76','PRESENTATION / STORY',
    rect(126,104,543,310,'#f4f1e8',8,'filter="url(#shadow)"')+rect(126,104,202,310,'#de9f54',8)+text(151,182,'THE',45,'#283449')+text(151,236,'NEXT',45,'#283449')+text(151,290,'STEP.',45,'#283449')+bars(368,357,['#b6c2c4','#859caa','#e2af64','#48637d','#304b6d'])+text(372,151,'A clear story, well told.',18,'#40546b'))

# Secondary samples use separate compositions, not recoloured copies.
scenes['workbench-data']=('#dbe8ef','#a0b9c8','DATA / RECONCILIATION', ''.join(rect(145+(i%5)*95,138+(i//5)*73,78,53,['#fff','#b4c9d4','#678998'][i%3],6) for i in range(15))+circle(581,342,57,'#244e62')+text(550,354,'CSV',27))
scenes['workbench-shipping']=('#ebdfbb','#c1ac73','LOGISTICS / DISPATCH',box(176,222,'#c7a767')+box(331,277,'#a48245')+'<path d="M490 169H637V266H674L709 309V371H490Z" fill="#4f604c"/>'+rect(641,278,37,26,'#d9e4cf',3)+circle(538,375,26,'#273b32')+circle(671,375,26,'#273b32'))
scenes['workbench-review']=('#f0e1d8','#d7b8a7','EDITORIAL / HUMAN REVIEW',paper(169,106,306,299)+''.join(line(192,194+i*47,409,194+i*47,'#d58766',3) for i in range(3))+'<g transform="rotate(38 539 256)">'+rect(526,113,27,269,'#a05238',4)+'<path d="M526 382l13 33 14-33Z" fill="#e4c3a0"/></g>'+check(641,316,'#9f593f'))
scenes['ec-support']=('#d3e3df','#87afa4','CUSTOMER / CARE',circle(411,254,150,'#bed4c8')+rect(197,139,243,112,'#fff',25,'filter="url(#shadow)"')+'<path d="M247 244v34l40-34" fill="#fff"/>'+text(224,189,'How can we help?',23,'#315f51')+rect(377,268,236,112,'#275b51',25)+text(401,318,'Let’s find a way.',23)+''.join(circle(418+i*21,345,4,'#a9d7bd') for i in range(3)))
scenes['cw-api-link']=('#141e2c','#204d63','SYSTEMS / CONNECTED', '<path d="M155 259C300 60 490 455 663 236" stroke="#88dddc" stroke-width="32" fill="none"/><path d="M155 259C300 455 490 60 663 236" stroke="#edb376" stroke-width="9" fill="none"/>'+circle(158,260,56,'#eff3ed')+text(126,269,'API',28,'#274750')+circle(659,239,58,'#eff3ed')+text(626,249,'APP',27,'#274750'))
scenes['cw-gyomu-system']=('#dfd8cb','#b4a58f','OPERATIONS / OVERVIEW', ''.join(f'<g transform="translate({190+i*147} {242-i*47})">'+box(0,0,c)+'</g>' for i,c in enumerate(['#6f7468','#a9a48f','#e3ded2']))+text(176,126,'Everything in its place.',25,'#494d42'))
scenes['cw-automation']=('#24202d','#554660','AUTOMATION / ROUTINE', '<path d="M234 164H555Q627 164 627 250T555 337H234Q161 337 161 250T234 164Z" stroke="#bdadcb" stroke-width="22" fill="none"/>'+''.join(rect(x,y,52,52,c,12) for x,y,c in [(228,138,'#edc093'),(415,138,'#e0d0ed'),(528,311,'#ad9fbd'),(283,311,'#f2e4cc')])+text(304,258,'REPEAT',31,'#f4e8fa')+text(307,287,'WITHOUT THE BUSYWORK',10,'#ccbad8'))
scenes['cw-dashboard']=('#f1ddd1','#d59d83','SALES / AT A GLANCE', '<path d="M180 359V172M180 359H665" stroke="#b28171" stroke-width="2"/>'+''.join(rect(211+i*75,359-h,48,h,c,5) for i,(h,c) in enumerate(zip([62,94,84,147,185,229],['#e3baa2','#d49a7d','#c68264','#b56950','#98583f','#704431'])))+text(184,119,'A clearer view.',31,'#714733'))
scenes['cw-line']=('#ddefda','#a2c69b','MESSAGING / LINE', '<g transform="rotate(-8 305 267)">'+phone(228,113,'#eaf3e2')+rect(247,158,101,48,'#fff',10)+rect(267,218,96,53,'#75a779',10)+rect(247,284,117,80,'#c5dcaf',8)+'</g>'+rect(427,176,231,150,'#2b653d',30,'filter="url(#shadow)"')+text(467,253,'LET’S TALK',27)+'<path d="M457 320v37l41-37" fill="#2b653d"/>')
scenes['cw-sns']=('#eadbea','#bb9cc2','SOCIAL / VISUAL STORIES', '<g transform="rotate(-12 237 260)">'+rect(125,137,202,245,'#775b87',9)+circle(227,244,70,'#dfb2a0')+text(151,351,'SLOW DAYS',22)+'</g><g transform="rotate(9 445 241)">'+rect(341,96,202,265,'#f2eee0',9)+rect(363,122,158,158,'#9ba98c',80)+text(364,323,'FRESH AIR',24,'#4b614b')+'</g><g transform="rotate(20 624 292)">'+rect(526,202,164,199,'#b86d73',9)+text(549,281,'MAKE',30)+text(549,321,'SPACE',30)+'</g>')

for name,(bg,shade,label,art) in scenes.items():
    svg=f'''<svg xmlns="http://www.w3.org/2000/svg" width="800" height="500" viewBox="0 0 800 500"><defs><radialGradient id="bg" cx="75%" cy="75%" r="85%"><stop stop-color="{shade}"/><stop offset="1" stop-color="{bg}"/></radialGradient><linearGradient id="scan"><stop stop-color="#82ebd0" stop-opacity="0"/><stop offset="1" stop-color="#b0ffe6" stop-opacity=".65"/></linearGradient><radialGradient id="metal" cx="25%" cy="20%"><stop stop-color="#fff"/><stop offset=".45" stop-color="#d8e9f2"/><stop offset="1" stop-color="#63839e"/></radialGradient><filter id="shadow" x="-40%" y="-40%" width="180%" height="200%"><feDropShadow dx="0" dy="17" stdDeviation="16" flood-color="#14232a" flood-opacity=".17"/></filter></defs><rect width="800" height="500" fill="url(#bg)"/>{art}</svg>'''
    (OUT/(name+'.svg')).write_text(svg)

if __name__=='__main__':
    print(f'Generated {len(scenes)} distinct vector illustrations')
