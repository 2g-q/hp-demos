(function(){
if(location.pathname.endsWith('/cases.html') && ['#tools','#design'].includes(location.hash)){location.replace(location.hash==='#tools'?'./tools.html':'./designs.html');return;}
var items=document.querySelectorAll('.sec-head,.card,.reason,.flow-item');
if(!items.length||!('IntersectionObserver' in window))return;
document.documentElement.classList.add('reveal-ready');
var observer=new IntersectionObserver(function(entries){entries.forEach(function(entry){if(entry.isIntersecting){entry.target.classList.add('is-visible');observer.unobserve(entry.target);}});},{rootMargin:'0px 0px -8% 0px',threshold:.08});
items.forEach(function(item){observer.observe(item);});

if(matchMedia('(hover:hover) and (pointer:fine) and (prefers-reduced-motion:no-preference)').matches){
var canvas=document.createElement('canvas'),ctx=canvas.getContext('2d'),points=[],mouse={x:-500,y:-500,active:false},glowPos={x:-500,y:-500},dpr=1;
canvas.id='cursor-field';canvas.setAttribute('aria-hidden','true');document.body.appendChild(canvas);
function resize(){dpr=Math.min(window.devicePixelRatio||1,2);canvas.width=innerWidth*dpr;canvas.height=innerHeight*dpr;ctx.setTransform(dpr,0,0,dpr,0,0);}
function addPoint(x,y){points.push({x:x,y:y,life:1,size:5+Math.random()*8});if(points.length>120)points.shift();}
window.addEventListener('resize',resize,{passive:true});
window.addEventListener('pointermove',function(e){mouse.x=e.clientX;mouse.y=e.clientY;mouse.active=true;addPoint(e.clientX,e.clientY);},{passive:true});
window.addEventListener('pointerleave',function(){mouse.active=false;},{passive:true});
var previous=performance.now();
function draw(now){now=now||performance.now();var dt=Math.min((now-previous)/1000,.05);previous=now;ctx.clearRect(0,0,innerWidth,innerHeight);ctx.globalCompositeOperation='lighter';
if(mouse.active){glowPos.x+=(mouse.x-glowPos.x)*(1-Math.exp(-dt/.95));glowPos.y+=(mouse.y-glowPos.y)*(1-Math.exp(-dt/.95));var glow=ctx.createRadialGradient(glowPos.x,glowPos.y,0,glowPos.x,glowPos.y,220);glow.addColorStop(0,'rgba(130,165,255,.2)');glow.addColorStop(.35,'rgba(108,120,255,.1)');glow.addColorStop(1,'rgba(88,92,255,0)');ctx.fillStyle=glow;ctx.beginPath();ctx.arc(glowPos.x,glowPos.y,220,0,Math.PI*2);ctx.fill();}
points=points.filter(function(p){p.life-=dt/4.2;return p.life>0;});points.forEach(function(p){ctx.fillStyle='rgba(170,205,255,'+(p.life*.14)+')';ctx.beginPath();ctx.arc(p.x,p.y,p.size*p.life,0,Math.PI*2);ctx.fill();});requestAnimationFrame(draw);}
resize();draw();
}
})();
