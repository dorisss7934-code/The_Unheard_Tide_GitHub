import {SCENES,ExperienceState} from './scenes.mjs';
import {transitionPath} from './transitions.mjs';
import {createSymbolViewer} from './viewer.mjs';
import {createFrameAtlas} from './atlas.mjs';
import {createSoundscape} from './audio.mjs';

const $=id=>document.getElementById(id);
const state=new ExperienceState();
const app=$('app'),stage=$('stage'),poster=$('scene-poster');
const hotspotLayer=$('hotspots'),cardLayer=$('cards'),tray=$('object-tray');
const story=$('body-story'),transitionHud=$('transition-hud');
const filmBuffers=[$('transition-film'),$('transition-film-buffer')],filmCleanup=new Map();
let transitionFilm=filmBuffers[0],visibleFilm=null;
const reduceMotion=window.matchMedia('(prefers-reduced-motion: reduce)');
const narrowScreen=window.matchMedia('(max-width: 760px)');
const soundscape=createSoundscape({music:$('ambient-music'),toggle:$('sound-button')});
const activeCanvases=new Map(),spriteImages=new Map();
let spriteManifest={},frameRequest=0,toastTimer=0,inspectedItem=null;
let viewerCache=null;
const symbolViewer=createSymbolViewer({imageFor,onClose:startAnimation});
let navigationToken=0,transitioning=false,pendingTarget=null,stopClip=null;

const spritesReady=fetch('assets/sprites.json').then(r=>{
  if(!r.ok)throw new Error('Sprite manifest unavailable');
  return r.json();
}).then(json=>{spriteManifest=json;return json;}).catch(()=>{
  showToast('Animation could not load. You can still explore the symbol images.');
  return {};
});

const viewerReady=fetch('assets/viewer-sprites.json').then(response=>{
  if(!response.ok)throw new Error('Viewer images unavailable');
  return response.json();
}).catch(()=>({}));

function loadViewerImage(filename){
  return new Promise(resolve=>{
    const image=new Image();image.onload=()=>resolve(image);image.onerror=()=>resolve(null);
    image.src='assets/'+filename;
  });
}

function viewerFor(id){
  if(viewerCache?.id===id)return viewerCache.promise;
  const promise=viewerReady.then(async manifest=>{
    const meta=manifest[id];if(!meta)return null;
    const atlas=createFrameAtlas(meta,loadViewerImage);
    return await atlas.readyFrame(0)?atlas:null;
  });
  viewerCache={id,promise};return promise;
}

function imageFor(id,detail=false){
  if(detail)return viewerFor(id);
  const key=id;
  if(spriteImages.has(key))return spriteImages.get(key);
  const promise=spritesReady.then(()=>new Promise(resolve=>{
    const meta=spriteManifest[id];if(!meta){resolve(null);return;}
    const image=new Image();
    image.onload=()=>resolve({image,meta});image.onerror=()=>resolve(null);
    image.src='assets/'+meta.file;
  }));
  spriteImages.set(key,promise);return promise;
}

function visual(item,key){
  const wrapper=document.createElement('span');wrapper.className='symbol-visual';
  const still=document.createElement('img');still.src='assets/'+item.id+'-still.webp';still.alt='';still.draggable=false;
  const canvas=document.createElement('canvas');canvas.width=192;canvas.height=192;canvas.setAttribute('aria-hidden','true');
  wrapper.append(still,canvas);
  const context=canvas.getContext('2d');
  const entry={canvas,context,start:performance.now(),data:null,last:-1};activeCanvases.set(key,entry);
  imageFor(item.id).then(data=>{
    if(activeCanvases.get(key)!==entry||!canvas.isConnected||!data||!context)return;
    entry.data=data;drawFrame(entry,0);canvas.classList.add('loaded');startAnimation();
  });
  return wrapper;
}

function drawFrame(entry,index){
  const {image,meta}=entry.data;
  entry.context.drawImage(image,(index%meta.columns)*meta.size,Math.floor(index/meta.columns)*meta.size,meta.size,meta.size,0,0,192,192);
  entry.last=index;
}
function animate(time){
  frameRequest=0;let playing=false;
  if(document.hidden||transitioning)return;
  for(const entry of activeCanvases.values()){
    if(!entry.canvas.isConnected||!entry.data)continue;
    const {meta}=entry.data;
    const index=reduceMotion.matches?0:Math.floor((time-entry.start)/1000*meta.fps)%meta.frames;
    if(index!==entry.last)drawFrame(entry,index);
    if(!reduceMotion.matches)playing=true;
  }
  if(playing)frameRequest=requestAnimationFrame(animate);
}
function startAnimation(){if(!frameRequest&&!document.hidden&&!transitioning)frameRequest=requestAnimationFrame(animate);}
function showToast(message){
  const toast=$('toast');toast.textContent=message;toast.classList.add('visible');
  clearTimeout(toastTimer);toastTimer=setTimeout(()=>toast.classList.remove('visible'),3500);
}
function announce(message){$('live-announcement').textContent=message;}

function setMedia(id,alt){
  // Interactive scenes use a still image; camera motion is confined to transitions.
  poster.src='assets/'+id+'-poster.webp';poster.alt=alt;
}

function placeStory(){
  if(narrowScreen.matches)$('experience-controls').insertBefore(story,tray);
  else stage.insertBefore(story,transitionFilm);
}

function makeHotspot(item,onClick=()=>toggleItem(item)){
  const button=document.createElement('button');button.className='hotspot';button.dataset.item=item.id;
  button.style.left=item.hotspot[0]+'%';button.style.top=item.hotspot[1]+'%';
  if(item.hit){button.style.width=item.hit[0]+'%';button.style.height=item.hit[1]+'%';}
  else{button.style.width='28px';button.style.height='28px';}
  button.setAttribute('aria-label',item.object+': '+item.meaning);button.setAttribute('aria-pressed','false');
  const label=document.createElement('span');label.className='hotspot-label';label.textContent=item.object;
  const marker=document.createElement('span');marker.className='hotspot-marker';marker.setAttribute('aria-hidden','true');
  button.append(marker,label);button.addEventListener('click',()=>{if(!transitioning)onClick();});return button;
}

function makeCard(item,index=0,stagger=false){
  const card=document.createElement('button');card.className='symbol-card';card.dataset.item=item.id;
  card.style.left=item.card[0]+'%';card.style.top=item.card[1]+'%';card.style.width=item.width+'%';
  if(stagger)card.style.animationDelay=index*65+'ms';
  card.setAttribute('aria-label',item.meaning+'; enlarge and rotate this symbol');card.title=item.meaning+' · Enlarge and rotate';
  const label=document.createElement('span');label.className='symbol-label';label.textContent=item.label;
  card.append(visual(item,'card-'+item.id),label);card.addEventListener('click',()=>{if(!transitioning)openSymbol(item,card);});return card;
}

function updateControls(){
  const scene=SCENES.find(s=>s.id===state.scene);if(!scene)return;
  const count=state.count(),total=scene.items.length;
  $('scene-count').textContent=total?`Revealed ${String(count).padStart(2,'0')} / ${String(total).padStart(2,'0')}`:'Begin with the body';
  $('reveal-button').hidden=!total;$('reveal-button').firstChild.textContent=count===total?'Close all ':'Reveal all ';
  $('reveal-button').lastElementChild.textContent=count===total?'−':'＋';
  $('reveal-button').disabled=transitioning;$('reset-button').disabled=transitioning||(count===0&&!state.bodyOpen);
  for(const button of hotspotLayer.querySelectorAll('[data-item]')){
    if(button.dataset.item==='body-story'){button.setAttribute('aria-expanded',String(state.bodyOpen));continue;}
    const active=state.revealed.get(state.scene).has(button.dataset.item);
    button.classList.toggle('active',active);button.setAttribute('aria-pressed',String(active));
  }
  for(const button of tray.querySelectorAll('[data-item]')){
    if(button.dataset.item==='body-story')button.setAttribute('aria-expanded',String(state.bodyOpen));
    else button.setAttribute('aria-pressed',String(state.revealed.get(state.scene).has(button.dataset.item)));
  }
  for(const button of $('scene-nav').children){
    const id=button.dataset.scene,sceneData=SCENES.find(s=>s.id===id);
    button.setAttribute('aria-current',id===(transitioning?pendingTarget:state.scene)?'page':'false');
    button.querySelector('.nav-progress').textContent=sceneData.items.length?`${state.count(id)} / ${sceneData.items.length}`:'';
  }
  const destination=SCENES.find(view=>view.id===(transitioning?pendingTarget:state.scene));
  for(const group of document.querySelectorAll('.island-groups [data-island]')){
    group.classList.toggle('is-current',group.dataset.island===destination?.island);
  }
}

function renderCards(stagger=false){
  for(const [key] of activeCanvases)if(key.startsWith('card-'))activeCanvases.delete(key);
  cardLayer.replaceChildren();const scene=SCENES.find(s=>s.id===state.scene);
  if(!scene)return;
  scene.items.filter(item=>state.revealed.get(state.scene).has(item.id)).forEach((item,index)=>cardLayer.append(makeCard(item,index,stagger)));
  startAnimation();
}

function inspect(item){
  const inspector=$('mobile-inspector');activeCanvases.delete('inspector');inspector.replaceChildren();inspectedItem=item?.id??null;
  if(!item){inspector.hidden=true;return;}
  inspector.hidden=false;
  const copy=document.createElement('div'),object=document.createElement('p'),label=document.createElement('p');
  object.className='inspector-title';object.textContent=item.object+' / '+item.meaning;
  label.className='inspector-label';label.textContent=item.label.replaceAll('\n',' ');copy.append(object,label);
  const close=document.createElement('button');close.className='inspector-close';close.textContent='×';
  close.setAttribute('aria-label','Close symbol details');close.addEventListener('click',()=>inspect(null));
  const thumbnail=document.createElement('button');thumbnail.className='inspector-geometry';
  thumbnail.setAttribute('aria-label','Enlarge '+item.meaning);thumbnail.append(visual(item,'inspector'));
  thumbnail.addEventListener('click',()=>openSymbol(item,thumbnail));
  inspector.append(thumbnail,copy,close);
}

function toggleItem(item){
  if(transitioning)return;
  const added=state.toggle(item.id),existing=cardLayer.querySelector(`[data-item="${item.id}"]`);
  if(added){cardLayer.append(makeCard(item));if(narrowScreen.matches)inspect(item);}
  else{existing?.remove();activeCanvases.delete('card-'+item.id);if(inspectedItem===item.id)inspect(null);}
  updateControls();announce(item.object+': '+item.meaning+(added?' revealed.':' closed.'));
}

function toggleBody(){
  if(transitioning||state.scene!=='body')return;
  state.bodyOpen=!state.bodyOpen;story.hidden=!state.bodyOpen;updateControls();
  announce(state.bodyOpen?'The complete story is open.':'The story is closed.');
  if(state.bodyOpen&&narrowScreen.matches)story.scrollIntoView({behavior:reduceMotion.matches?'instant':'smooth',block:'start'});
}

function selectScene(id){
  const scene=SCENES.find(s=>s.id===id);if(!scene)return;
  state.select(id);app.classList.remove('is-home');stage.dataset.scene=id;
  $('home-overlay').hidden=true;$('home-footer').hidden=true;$('experience-controls').hidden=false;
  $('hints-button').disabled=false;story.hidden=true;inspect(null);hotspotLayer.replaceChildren();
  $('scene-index').textContent=scene.number;
  $('scene-title').textContent=scene.title;$('scene-description').textContent=scene.description;
  tray.replaceChildren();
  if(id==='body'){
    const bodyItem={id:'body-story',meaning:'Read the complete story',object:'Metallic uterus',hotspot:[52,40],hit:[53,74]};
    const button=makeHotspot(bodyItem,toggleBody);button.removeAttribute('aria-pressed');
    button.setAttribute('aria-expanded','false');button.setAttribute('aria-controls','body-story');hotspotLayer.append(button);
    const chip=document.createElement('button');chip.className='object-chip';chip.dataset.item='body-story';chip.textContent='Read the story';
    chip.setAttribute('aria-expanded','false');chip.setAttribute('aria-controls','body-story');chip.addEventListener('click',toggleBody);tray.append(chip);
  }else{
    scene.items.forEach(item=>{
      hotspotLayer.append(makeHotspot(item));
      const button=document.createElement('button');button.className='object-chip';button.dataset.item=item.id;
      button.textContent=item.object;button.setAttribute('aria-pressed','false');button.addEventListener('click',()=>toggleItem(item));tray.append(button);
    });
  }
  renderCards();setMedia(id,scene.alt);updateControls();announce('Current scene: '+scene.title);
}

function renderHome(){
  state.scene=null;state.bodyOpen=false;app.classList.add('is-home');stage.dataset.scene='home';
  $('home-overlay').hidden=false;$('home-footer').hidden=false;$('experience-controls').hidden=true;
  story.hidden=true;$('hints-button').disabled=true;
  hotspotLayer.replaceChildren();cardLayer.replaceChildren();activeCanvases.clear();inspect(null);
  setMedia('home','Pink islands and everyday objects floating on a sunset sea');
  for(const button of $('scene-nav').children)button.setAttribute('aria-current','false');
}

const clipStart={
  'transition-entry':'home','transition-entry-back':'body',
  'transition-body-vanity':'body','transition-body-vanity-back':'vanity',
  'transition-vanity-desire':'vanity','transition-vanity-desire-back':'desire',
  'transition-desire-labour':'desire','transition-desire-labour-back':'labour',
  'transition-labour-care':'labour','transition-labour-care-back':'care'
};

function playClip(name,token,step,total){
  const film=filmBuffers.find(buffer=>buffer!==visibleFilm)??filmBuffers[0];
  clearTimeout(filmCleanup.get(film));filmCleanup.delete(film);
  film.classList.remove('is-visible');transitionFilm=film;
  return new Promise(resolve=>{
    let settled=false,timeout=0;
    const finish=result=>{
      if(settled)return;settled=true;clearTimeout(timeout);
      film.removeEventListener('loadeddata',ready);film.removeEventListener('ended',ended);
      film.removeEventListener('error',failed);film.removeEventListener('timeupdate',progress);
      if(stopClip===cancel)stopClip=null;film.pause();resolve(result);
    };
    const cancel=()=>finish('cancelled');
    const ready=()=>{
      if(token!==navigationToken){cancel();return;}
      soundscape.transitionStep(step);
      const previous=visibleFilm;
      if(previous)previous.style.zIndex='50';
      film.style.zIndex='51';film.classList.add('is-visible');visibleFilm=film;
      if(previous&&previous!==film){
        filmCleanup.set(previous,setTimeout(()=>{
          if(visibleFilm!==previous)previous.classList.remove('is-visible');
          filmCleanup.delete(previous);
        },260));
      }
      if(!document.hidden)film.play().catch(()=>finish('unavailable'));
    };
    const ended=()=>finish('complete'),failed=()=>finish('unavailable');
    const progress=()=>{
      if(token!==navigationToken)return;
      const fraction=Number.isFinite(film.duration)&&film.duration>0?Math.min(1,film.currentTime/film.duration):0;
      $('transition-progress-fill').style.width=((step+fraction)/total*100)+'%';
    };
    stopClip=cancel;
    film.addEventListener('loadeddata',ready,{once:true});film.addEventListener('ended',ended,{once:true});
    film.addEventListener('error',failed,{once:true});film.addEventListener('timeupdate',progress);
    film.poster='assets/'+clipStart[name]+'-poster.webp';film.src='assets/'+name+'.mp4';
    timeout=setTimeout(()=>finish('unavailable'),30000);film.load();
    if(film.readyState>=2)ready();
  });
}

async function finishNavigation(id,token){
  if(token!==navigationToken)return;
  // Hold the camera's final frame until the destination poster is decoded.
  if(id===null)renderHome();else selectScene(id);
  try{await poster.decode();}catch{}
  if(token!==navigationToken)return;
  transitioning=false;pendingTarget=null;
  for(const film of filmBuffers){film.pause();film.classList.remove('is-visible');clearTimeout(filmCleanup.get(film));}
  filmCleanup.clear();visibleFilm=null;
  transitionHud.hidden=true;app.classList.remove('is-transitioning');stage.removeAttribute('aria-busy');
  soundscape.arrive();
  updateControls();
  startAnimation();
}

async function navigateTo(id){
  if(id!==null&&!SCENES.some(scene=>scene.id===id))return;
  if(transitioning&&pendingTarget===id)return;
  if(!transitioning&&state.scene===id)return;
  const token=++navigationToken;
  stopClip?.();filmBuffers.forEach(film=>film.pause());
  const route=transitionPath(state.scene,id);
  soundscape.transition(route.length);
  transitioning=true;pendingTarget=id;app.classList.add('is-transitioning');stage.setAttribute('aria-busy','true');
  symbolViewer.close();inspect(null);updateControls();
  $('hints-button').disabled=true;$('reveal-button').disabled=true;$('reset-button').disabled=true;
  if(reduceMotion.matches||!route.length){await finishNavigation(id,token);return;}
  const destination=id===null?'The entrance':SCENES.find(scene=>scene.id===id).en;
  $('transition-label').textContent='Journey to '+destination;
  $('transition-progress-fill').style.width='0%';transitionHud.hidden=false;announce('Travelling to '+destination+'.');
  for(let step=0;step<route.length;step++){
    const result=await playClip(route[step],token,step,route.length);
    if(token!==navigationToken||result==='cancelled')return;
    if(result==='unavailable'){showToast('The camera journey could not play. Opening your scene.');break;}
  }
  await finishNavigation(id,token);
}

function skipTransition(){
  if(!transitioning)return;
  const target=pendingTarget,token=++navigationToken;stopClip?.();
  finishNavigation(target,token);
}

SCENES.forEach((scene,index)=>{
  const button=document.createElement('button');button.className='nav-item';button.dataset.scene=scene.id;
  button.setAttribute('aria-label',`Scene ${index+1}: ${scene.title}`);
  const number=document.createElement('span');number.className='nav-number';number.textContent=scene.number;
  const titles=document.createElement('span'),name=document.createElement('span'),detail=document.createElement('span');
  name.className='nav-en';name.textContent=scene.en;detail.className='nav-detail';detail.textContent=scene.short;titles.append(name,detail);
  const progress=document.createElement('span');progress.className='nav-progress';
  button.append(number,titles,progress);button.addEventListener('click',()=>navigateTo(scene.id));$('scene-nav').append(button);
});

$('enter-button').addEventListener('click',()=>navigateTo('body'));
$('home-button').addEventListener('click',()=>navigateTo(null));
$('story-close').addEventListener('click',()=>{if(state.bodyOpen)toggleBody();});
$('story-next').addEventListener('click',()=>navigateTo('vanity'));
function switchIslandView(island,first){
  const current=SCENES.find(scene=>scene.id===(transitioning?pendingTarget:state.scene));
  navigateTo(current?.island===island?current.paired:first);
}
$('expectation-island-link').addEventListener('click',()=>switchIslandView('expectations','vanity'));
$('care-island-link').addEventListener('click',()=>switchIslandView('care','labour'));
$('transition-skip').addEventListener('click',skipTransition);
$('hints-button').addEventListener('click',()=>{
  state.hints=!state.hints;stage.classList.toggle('hints-visible',state.hints);
  $('hints-button').setAttribute('aria-pressed',String(state.hints));announce('Object labels '+(state.hints?'shown.':'hidden.'));
});
$('reveal-button').addEventListener('click',()=>{
  if(transitioning)return;const shown=state.all();inspect(null);renderCards(shown);updateControls();
  announce(shown?'All symbols in this scene are revealed.':'All symbols in this scene are closed.');
});
$('reset-button').addEventListener('click',()=>{
  if(transitioning)return;state.reset();story.hidden=true;inspect(null);renderCards();updateControls();announce('This scene has been reset.');
});

const dialog=$('help-dialog');
$('help-button').addEventListener('click',()=>dialog.showModal());
$('help-close').addEventListener('click',()=>dialog.close());
$('help-done').addEventListener('click',()=>{dialog.close();if(!state.scene&&!transitioning)navigateTo('body');});
dialog.addEventListener('click',event=>{
  if(event.target===dialog){
    const bounds=dialog.getBoundingClientRect();
    if(event.clientX<bounds.left||event.clientX>bounds.right||event.clientY<bounds.top||event.clientY>bounds.bottom)dialog.close();
  }
});
$('fullscreen-button').addEventListener('click',async()=>{
  try{
    if(document.fullscreenElement)await document.exitFullscreen();
    else if(app.requestFullscreen)await app.requestFullscreen();
    else showToast('Fullscreen is not available in this browser.');
  }catch{showToast('Fullscreen could not open. Try your browser’s fullscreen mode.');}
});
document.addEventListener('fullscreenchange',()=>{
  const label=document.fullscreenElement?'Exit fullscreen':'View fullscreen';
  $('fullscreen-button').setAttribute('aria-label',label);$('fullscreen-button').title=label;
});
document.addEventListener('visibilitychange',()=>{
  if(document.hidden){
    filmBuffers.forEach(film=>film.pause());if(frameRequest)cancelAnimationFrame(frameRequest);frameRequest=0;
  }else{
    if(transitioning)transitionFilm.play().catch(skipTransition);
    startAnimation();
  }
});
reduceMotion.addEventListener('change',()=>{
  if(reduceMotion.matches)skipTransition();
  startAnimation();
});
narrowScreen.addEventListener('change',placeStory);
document.addEventListener('keydown',event=>{
  if(dialog.open||symbolViewer.isOpen)return;
  if(event.key==='Escape'){
    if(transitioning)skipTransition();else if(state.bodyOpen)toggleBody();inspect(null);return;
  }
  if((!state.scene&&!transitioning)||event.altKey||event.metaKey||event.ctrlKey)return;
  if(event.key==='ArrowRight'||event.key==='ArrowLeft'){
    event.preventDefault();
    const current=transitioning?pendingTarget:state.scene;
    const index=SCENES.findIndex(scene=>scene.id===current);
    const next=(index+(event.key==='ArrowRight'?1:-1)+SCENES.length)%SCENES.length;
    navigateTo(SCENES[next].id);
  }
});

function openSymbol(item,origin){
  const entry=activeCanvases.get('card-'+item.id);
  const angle=entry?.data&&entry.last>=0?entry.last/entry.data.meta.frames*360:0;
  symbolViewer.open(item,origin,angle);
}
placeStory();
renderHome();
