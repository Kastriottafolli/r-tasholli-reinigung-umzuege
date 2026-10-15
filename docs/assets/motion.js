(() => {
  'use strict';
  const reduced=window.matchMedia('(prefers-reduced-motion: reduce)');
  let paused=document.body.classList.contains('motion-paused');
  const stages=[...document.querySelectorAll('canvas[data-cgi]')].map(c=>new window.RTCGI.Stage(c));
  const hero=stages.find(s=>s.canvas.dataset.cgi==='hero');
  const story=stages.find(s=>s.canvas.dataset.cgi==='story');
  const tabs=[...document.querySelectorAll('.scene-tab')];
  const chapters=[...document.querySelectorAll('.motion-chapter')];
  const names=['Reinigung','Umzüge','Gartenpflege'];
  const titles=['Sauber bis ins Detail.','Einpacken. Einladen. Ankommen.','Draußen gepflegt.'];
  const descriptions=['Fenster, Wohnräume und Gewerbe: Sorgfalt für jede Fläche.','Vom einzelnen Möbelstück bis zum ganzen Hausrat.','Rasen mähen, Hecken pflegen und Außenbereiche aufräumen.'];
  let manual=false,autoTime=0,lastAuto=0,scrollFrame=0,current=0;
  function selectScene(index,byUser=false) {
    index=((index%3)+3)%3;current=index;manual ||= byUser;
    hero?.setMode(index);
    tabs.forEach((tab,i)=>{tab.setAttribute('aria-selected',String(i===index));tab.tabIndex=i===index?0:-1;});
    const panel=document.querySelector('#hero-scene');panel?.setAttribute('aria-labelledby','scene-tab-'+index);
    const counter=document.querySelector('.scene-index');if(counter)counter.textContent='0'+(index+1)+' / '+names[index];
    const title=document.querySelector('.scene-caption strong');if(title)title.textContent=titles[index];
    const description=document.querySelector('.scene-caption p');if(description)description.textContent=descriptions[index];
  }
  tabs.forEach((tab,i)=>{
    tab.addEventListener('click',()=>selectScene(i,true));
    tab.addEventListener('keydown',e=>{let next=i;if(e.key==='ArrowRight')next=i+1;else if(e.key==='ArrowLeft')next=i-1;else if(e.key==='Home')next=0;else if(e.key==='End')next=2;else return;e.preventDefault();next=(next+3)%3;selectScene(next,true);tabs[next].focus();});
  });
  if(tabs.length)selectScene(0);
  const progress=document.querySelector('.page-progress');
  const header=document.querySelector('.site-header');
  function onScroll() {
    scrollFrame=0;
    const total=document.documentElement.scrollHeight-window.innerHeight;
    if(progress)progress.style.transform='scaleX('+(total>0?Math.max(0,Math.min(1,window.scrollY/total)):0)+')';
    header?.classList.toggle('is-scrolled',window.scrollY>30);
    if(!chapters.length)return;
    const pivot=window.innerHeight*.6;
    let closest=0,distance=Infinity;
    chapters.forEach((chapter,i)=>{
      const b=chapter.getBoundingClientRect(),d=Math.abs(b.top+b.height/2-pivot);
      if(d<distance){distance=d;closest=i;}
      const p=Math.max(0,Math.min(1,(pivot-b.top)/Math.max(1,b.height)));
      chapter.style.setProperty('--chapter-progress',String(p));
    });
    story?.setMode(closest);
    chapters.forEach((chapter,i)=>chapter.classList.toggle('chapter-active',i===closest));
    document.querySelectorAll('.story-dot').forEach((dot,i)=>{dot.classList.toggle('active',i===closest);dot.setAttribute('aria-current',i===closest?'step':'false');});
    const count=document.querySelector('.story-current');if(count)count.textContent='0'+(closest+1)+' / '+names[closest];
  }
  window.addEventListener('scroll',()=>{if(!scrollFrame)scrollFrame=requestAnimationFrame(onScroll);},{passive:true});
  window.addEventListener('resize',()=>{stages.forEach(s=>s.resize());onScroll();},{passive:true});
  onScroll();
  const revealTargets=document.querySelectorAll('.section-heading,.service-card,.feature-content,.combination,.steps article,.about-grid>div,.faq details,.cta-section .container,.offering,.check-panel,.contact-item,.form-panel');
  if(typeof IntersectionObserver==='function') {
    const observer=new IntersectionObserver(entries=>{for(const entry of entries){if(entry.isIntersecting){entry.target.classList.add('is-revealed');observer.unobserve(entry.target);}}},{threshold:.08,rootMargin:'0px 0px -25px 0px'});
    revealTargets.forEach((el,i)=>{el.classList.add('motion-reveal');el.style.setProperty('--reveal-delay',Math.min(i%3*.07,.14)+'s');observer.observe(el);});
    document.body.classList.add('motion-ready');
  }
  const fine=window.matchMedia('(hover: hover) and (pointer: fine)');
  if(fine.matches)document.querySelectorAll('.service-card,.brand-stage').forEach(card=>{
    let frame=0;
    card.addEventListener('pointermove',e=>{if(paused)return;if(frame)cancelAnimationFrame(frame);frame=requestAnimationFrame(()=>{const b=card.getBoundingClientRect();const x=(e.clientX-b.left)/b.width-.5,y=(e.clientY-b.top)/b.height-.5;card.style.setProperty('--tilt-x',(-y*3)+'deg');card.style.setProperty('--tilt-y',(x*3)+'deg');card.style.setProperty('--gloss-x',((x+.5)*100)+'%');});});
    card.addEventListener('pointerleave',()=>{if(frame)cancelAnimationFrame(frame);card.style.setProperty('--tilt-x','0deg');card.style.setProperty('--tilt-y','0deg');});
  });
  let autoFrame=0;
  function auto(now) {
    autoFrame=0;
    if(paused||manual||document.hidden||!hero||!tabs.length)return;
    if(lastAuto)autoTime+=Math.min((now-lastAuto)/1000,.1)*(hero.visible?1:0);
    lastAuto=now;
    if(autoTime>15){autoTime=0;selectScene(current+1);}
    autoFrame=requestAnimationFrame(auto);
  }
  function startAuto(){if(!autoFrame&&!paused&&!manual&&hero&&!document.hidden){lastAuto=0;autoFrame=requestAnimationFrame(auto);}}
  document.addEventListener('rt:motion',e=>{
    paused=e.detail.paused;stages.forEach(stage=>stage.setPaused(paused));
    if(paused){if(autoFrame)cancelAnimationFrame(autoFrame);autoFrame=0;}else startAuto();
  });
  document.addEventListener('visibilitychange',()=>{if(document.hidden){stages.forEach(stage=>stage.stop());if(autoFrame)cancelAnimationFrame(autoFrame);autoFrame=0;}else{stages.forEach(stage=>stage.start());startAuto();}});
  startAuto();
  window.RTMotion={stages,selectScene,onScroll};
})();
