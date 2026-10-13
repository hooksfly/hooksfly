'use strict';
const enquiry=document.getElementById('enquiry');let previousFocus=null,popupShown=false;
function openEnquiry(){popupShown=true;previousFocus=document.activeElement;document.querySelectorAll('dialog[open]').forEach(dialog=>{if(dialog!==enquiry)dialog.close();});if(!enquiry.open)enquiry.showModal();}
document.querySelectorAll('[data-enquire]').forEach(button=>button.addEventListener('click',openEnquiry));
setTimeout(()=>{if(!popupShown&&!document.querySelector('dialog[open]'))openEnquiry();},10000);
document.querySelectorAll('dialog').forEach(dialog=>{dialog.querySelector('.close').addEventListener('click',()=>dialog.close());dialog.addEventListener('click',event=>{if(event.target!==dialog)return;const r=dialog.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)dialog.close();});dialog.addEventListener('close',()=>previousFocus?.focus());});
document.getElementById('privacyButton').addEventListener('click',()=>{previousFocus=document.activeElement;document.getElementById('privacy').showModal();});
document.getElementById('year').textContent=new Date().getFullYear();
document.querySelectorAll('[data-tab]').forEach(button=>button.addEventListener('click',()=>{document.querySelectorAll('[data-tab]').forEach(b=>b.classList.remove('active'));document.querySelectorAll('.tab-panel').forEach(panel=>panel.classList.remove('active'));button.classList.add('active');document.getElementById(button.dataset.tab).classList.add('active');}));
document.querySelectorAll('.faq-list article button').forEach(button=>button.addEventListener('click',()=>{const article=button.closest('article'),open=article.classList.toggle('open');button.setAttribute('aria-expanded',String(open));}));
const reel=document.querySelector('.video-marquee');
if(reel){
  const track=reel.querySelector('.video-track');
  const originals=[...track.children];
  // Three identical sets allow seamless travel in either direction on wide screens.
  for(let set=0;set<2;set++)originals.forEach(card=>{
    const copy=card.cloneNode(true);
    copy.setAttribute('aria-hidden','true');
    copy.querySelector('video').tabIndex=-1;
    track.append(copy);
  });
  const visibility=new IntersectionObserver(entries=>entries.forEach(entry=>{const video=entry.target;if(entry.isIntersecting&&!document.hidden)video.play().catch(()=>{});else video.pause();}),{root:reel,threshold:.15});
  track.querySelectorAll('video').forEach(video=>{video.controls=true;visibility.observe(video);});
  const reduceMotion=matchMedia('(prefers-reduced-motion: reduce)');
  let period=0,position=0,lastTime=0,pausedUntil=0,manualPause=reduceMotion.matches;
  let pointer=null,startX=0,startScroll=0,dragged=false,touching=false,hovered=false;
  const pause=()=>{pausedUntil=performance.now()+3500;};
  const measure=()=>{
    period=track.children[originals.length].offsetLeft-track.children[0].offsetLeft;
    position=period;reel.scrollLeft=position;
  };
  const normalize=value=>{
    if(!period)return value;
    while(value<period*.5)value+=period;
    while(value>=period*1.5)value-=period;
    return value;
  };
  reduceMotion.addEventListener('change',event=>{manualPause=event.matches;});
  const step=direction=>{pause();position=normalize(reel.scrollLeft+direction*(originals[0].offsetWidth+18));reel.scrollLeft=position;};
  reel.addEventListener('keydown',event=>{
    if(event.target!==reel)return;
    if(event.key==='ArrowLeft'||event.key==='ArrowRight'){event.preventDefault();step(event.key==='ArrowLeft'?-1:1);}
  });
  reel.addEventListener('pointerenter',event=>{if(event.pointerType==='mouse')hovered=true;});
  reel.addEventListener('pointerleave',()=>{hovered=false;});
  reel.addEventListener('pointerdown',event=>{
    pause();
    if(event.pointerType!=='mouse'){touching=true;return;}
    if(event.button!==0)return;
    const video=event.target.closest('video');
    if(video&&event.clientY>video.getBoundingClientRect().bottom-52)return;
    pointer=event.pointerId;startX=event.clientX;startScroll=reel.scrollLeft;dragged=false;
  });
  reel.addEventListener('pointermove',event=>{
    if(pointer!==event.pointerId)return;
    const delta=event.clientX-startX;
    if(!dragged&&Math.abs(delta)<6)return;
    if(!dragged){dragged=true;reel.setPointerCapture(pointer);reel.classList.add('dragging');}
    reel.scrollLeft=startScroll-delta;
  });
  const release=()=>{pointer=null;touching=false;reel.classList.remove('dragging');pause();};
  window.addEventListener('pointerup',release);
  window.addEventListener('pointercancel',release);
  reel.addEventListener('click',event=>{if(dragged){event.preventDefault();event.stopPropagation();dragged=false;}},true);
  reel.addEventListener('wheel',()=>pause(),{passive:true});
  reel.addEventListener('touchend',()=>{touching=false;pause();},{passive:true});
  reel.addEventListener('focusin',pause);
  new ResizeObserver(measure).observe(reel);
  measure();
  const move=time=>{
    const elapsed=lastTime?Math.min(time-lastTime,50):0;lastTime=time;
    const interacting=pointer!==null||touching||hovered||reel.contains(document.activeElement);
    if(interacting||manualPause||time<pausedUntil||document.hidden){position=reel.scrollLeft;}
    else{
      // Decreasing scrollLeft makes the cards travel visibly left to right.
      position=normalize(position-28*elapsed/1000);
      reel.scrollLeft=position;
    }
    requestAnimationFrame(move);
  };
  requestAnimationFrame(move);
}
document.querySelectorAll('input').forEach(input=>input.addEventListener('input',()=>input.setCustomValidity('')));
attachLeadForm(document.getElementById('leadForm'));
const serviceChecks=[...document.querySelectorAll('input[name="services"]')];
function updateServices(){const values=serviceChecks.filter(input=>input.checked).map(input=>input.value);document.getElementById('service-summary').textContent=values.length?values.join(', '):'Select services';}
serviceChecks.forEach(input=>input.addEventListener('change',updateServices));
document.getElementById('leadForm').addEventListener('reset',()=>setTimeout(updateServices,0));
document.getElementById('aboutButton').addEventListener('click',()=>{previousFocus=document.activeElement;document.getElementById('about').showModal();});
document.querySelectorAll('[data-service-link]').forEach(link=>link.addEventListener('click',()=>{document.querySelector('[data-tab="'+link.dataset.serviceLink+'"]').click();}));


