'use strict';
(() => {
 const sky=document.createElement('div');
 sky.className='cosmic-backdrop';sky.setAttribute('aria-hidden','true');
 sky.innerHTML='<div class="aurora"></div><div class="aurora second"></div><div class="sky-orbit"></div>';
 // Fixed decorative coordinates: no moving markers on scientific imagery.
 for(let i=0;i<48;i++){
  const star=document.createElement('i');star.className='sky-star';
  star.style.cssText=`left:${(i*37.71)%100}%;top:${(i*23.13+7)%100}%;--size:${i%7===0?2:1}px;--duration:${4+i%5}s;--delay:-${i%8}s`;
  sky.append(star);
 }
 document.body.prepend(sky);
 const reduced=window.matchMedia('(prefers-reduced-motion: reduce)');
 let paused=false;
 try{paused=localStorage.getItem('atlas-effects-paused')==='true';}catch{}
 const control=document.createElement('button');control.className='motion-control';control.type='button';
 document.querySelector('footer').append(control);
 function sync(){
  const off=paused||reduced.matches;
  document.body.classList.toggle('effects-paused',off);
  control.setAttribute('aria-pressed',String(!off));
  control.textContent=off?'Ambient motion: off':'Ambient motion: on';
  control.title=reduced.matches?'Your device prefers reduced motion':'Toggle decorative background motion';
 }
 control.onclick=()=>{paused=!paused;try{localStorage.setItem('atlas-effects-paused',String(paused));}catch{}sync();};
 if(reduced.addEventListener)reduced.addEventListener('change',sync);
 sync();
 document.addEventListener('visibilitychange',()=>{sky.hidden=document.hidden;});
 const icons=[
  '<circle cx="12" cy="12" r="7"/><path d="M12 2v5m0 10v5M2 12h5m10 0h5"/><circle cx="12" cy="12" r="2"/>',
  '<circle cx="8" cy="16" r="4"/><path d="m11 13 9-9M6 9l7-7m2 16 7-7"/>',
  '<path d="M3 5c4-1 6 0 9 2 3-2 5-3 9-2v15c-4-1-6 0-9 1-3-1-5-2-9-1ZM12 7v14"/>'
 ];
 let observer;
 function decorate(){
  if(observer)observer.disconnect();
  document.querySelectorAll('.card').forEach((card,i)=>{
   if(card.querySelector('.number,.card-icon'))return;
   const icon=document.createElementNS('http://www.w3.org/2000/svg','svg');
   icon.setAttribute('viewBox','0 0 24 24');icon.setAttribute('class','card-icon');icon.setAttribute('aria-hidden','true');icon.setAttribute('fill','none');icon.setAttribute('stroke','currentColor');icon.setAttribute('stroke-width','1.3');icon.innerHTML=icons[i%icons.length];card.prepend(icon);
  });
  if(reduced.matches||paused||!('IntersectionObserver' in window))return;
  observer=new IntersectionObserver(entries=>entries.forEach(entry=>{
   if(entry.isIntersecting){entry.target.classList.add('reveal-in');observer.unobserve(entry.target);}
  }),{threshold:.08});
  document.querySelectorAll('.hero article,.hero-image,.stat,.section-head,.card,.lab-header,.callout,.prose').forEach((el,i)=>{el.style.setProperty('--reveal-delay',`${i%3*70}ms`);observer.observe(el);});
 }
 new MutationObserver(decorate).observe(document.getElementById('app'),{childList:true});
 decorate();
})();
