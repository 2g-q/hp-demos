(function(){
var items=document.querySelectorAll('.sec-head,.card,.reason,.flow-item');
if(!items.length||!('IntersectionObserver' in window))return;
document.documentElement.classList.add('reveal-ready');
var observer=new IntersectionObserver(function(entries){entries.forEach(function(entry){if(entry.isIntersecting){entry.target.classList.add('is-visible');observer.unobserve(entry.target);}});},{rootMargin:'0px 0px -8% 0px',threshold:.08});
items.forEach(function(item){observer.observe(item);});
})();
