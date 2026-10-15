export function createSoundscape({music,toggle}){
  const musicVolume=1,effectVolume=.8;
  let context=null,master=null,noiseBuffer=null,activated=false,muted=false;
  let dragPointer=null,lastDragX=0,lastTick=-Infinity;
  const voices=new Set();
  try{muted=localStorage.getItem('unheard-tide-muted')==='true';}catch{}
  music.volume=musicVolume;music.loop=true;music.muted=muted;
  const safe=fn=>{try{return fn();}catch{return null;}};
  function updateToggle(){
    toggle.setAttribute('aria-pressed',String(!muted));
    toggle.setAttribute('aria-label',muted?'Turn sound on':'Mute sound');
    toggle.title=muted?'Turn sound on':'Mute sound';
    toggle.querySelector('span').textContent=muted?'Sound off':'Sound on';
    toggle.classList.toggle('is-muted',muted);
  }
  function ensureContext(){
    if(context)return context;
    return safe(()=>{
      const AudioContext=window.AudioContext||window.webkitAudioContext;
      if(!AudioContext)return null;
      const ctx=new AudioContext(),gain=ctx.createGain();
      gain.gain.value=muted?0:effectVolume;
      if(ctx.createDynamicsCompressor){
        const compressor=ctx.createDynamicsCompressor();
        compressor.threshold.value=-8;compressor.knee.value=8;compressor.ratio.value=5;
        compressor.attack.value=.005;compressor.release.value=.12;
        gain.connect(compressor).connect(ctx.destination);
      }else gain.connect(ctx.destination);
      const buffer=ctx.createBuffer(1,Math.ceil(ctx.sampleRate*.12),ctx.sampleRate);
      const data=buffer.getChannelData(0);
      for(let i=0;i<data.length;i++)data[i]=Math.random()*2-1;
      context=ctx;master=gain;noiseBuffer=buffer;return ctx;
    });
  }
  function activate(){
    activated=true;
    safe(()=>{
      const ctx=ensureContext();
      if(ctx?.state==='suspended')ctx.resume().catch(()=>{});
      if(!muted&&!document.hidden&&music.paused!==false)music.play().catch(()=>{});
    });
  }
  function tactile({frequency=145,duration=.055,weight=.19,texture=.22}={}){
    if(muted||document.hidden)return;
    safe(()=>{
      const ctx=ensureContext();if(!ctx)return;
      const now=ctx.currentTime,oscillator=ctx.createOscillator(),source=ctx.createBufferSource();
      const bodyGain=ctx.createGain(),grainGain=ctx.createGain(),filter=ctx.createBiquadFilter();
      oscillator.type='triangle';oscillator.frequency.setValueAtTime(frequency,now);
      bodyGain.gain.setValueAtTime(.0001,now);bodyGain.gain.exponentialRampToValueAtTime(weight,now+.002);
      bodyGain.gain.exponentialRampToValueAtTime(.0001,now+duration);
      source.buffer=noiseBuffer;filter.type='bandpass';filter.frequency.value=1050;filter.Q.value=.8;
      grainGain.gain.setValueAtTime(.0001,now);grainGain.gain.exponentialRampToValueAtTime(texture,now+.001);
      const grainDuration=Math.min(.03,duration*.55);
      grainGain.gain.exponentialRampToValueAtTime(.0001,now+grainDuration);
      oscillator.connect(bodyGain).connect(master);source.connect(filter).connect(grainGain).connect(master);
      const voice={oscillator,source};voices.add(voice);oscillator.onended=()=>voices.delete(voice);
      oscillator.start(now);source.start(now);oscillator.stop(now+duration+.01);source.stop(now+grainDuration+.01);
    });
  }
  function click(kind='soft'){
    const textures={
      soft:{frequency:145,duration:.055,weight:.19,texture:.22},
      reveal:{frequency:130,duration:.065,weight:.2,texture:.22},
      open:{frequency:115,duration:.075,weight:.22,texture:.25},
      close:{frequency:100,duration:.05,weight:.17,texture:.18},
      navigate:{frequency:135,duration:.055,weight:.19,texture:.2},
      zoom:{frequency:150,duration:.04,weight:.1,texture:.13},
      reset:{frequency:120,duration:.055,weight:.18,texture:.2},
      rotate:{frequency:125,duration:.028,weight:.075,texture:.09}
    };
    tactile(textures[kind]??textures.soft);
  }
  function stopClicks(){
    safe(()=>{
      if(!context)return;
      for(const voice of voices){
        safe(()=>voice.oscillator.stop(context.currentTime+.02));
        safe(()=>voice.source.stop(context.currentTime+.02));
      }
      voices.clear();
    });
  }
  // Scene journeys retain full-volume music and have no sound effects.
  function transition(){music.volume=musicVolume;}
  function transitionStep(){music.volume=musicVolume;}
  function arrive(){music.volume=musicVolume;}
  function feedback(kind='rotate'){
    if(performance.now()-lastTick<140)return;
    lastTick=performance.now();click(kind);
  }
  function toggleSound(){
    if(!muted)click();
    muted=!muted;music.muted=muted;
    safe(()=>master?.gain.setTargetAtTime(muted?0:effectVolume,context.currentTime,.025));
    try{localStorage.setItem('unheard-tide-muted',String(muted));}catch{}
    if(muted)stopClicks();
    updateToggle();
    if(!muted){activate();click();}
  }
  document.addEventListener('pointerdown',activate,{capture:true});
  document.addEventListener('keydown',activate,{capture:true});
  document.addEventListener('click',event=>{
    const button=event.target.closest?.('button');
    if(button===toggle||button?.disabled)return;
    if(!button){
      if(event.target.closest?.('#symbol-turntable'))return;
      if(event.target.closest?.('#app'))click();
      return;
    }
    if(button.matches('.dialog-close,#help-done'))return;
    if(button.matches('.hotspot,.object-chip,#reveal-button')){
      const closing=button.getAttribute('aria-pressed')==='true'||button.getAttribute('aria-expanded')==='true'||button.textContent.startsWith('Close all');
      click(closing?'close':'reveal');
    }else if(button.matches('.symbol-card,.inspector-geometry'))click('open');
    else if(button.matches('.story-close,.inspector-close'))click('close');
    else if(button.matches('.nav-item,#enter-button,#home-button,#story-next,#expectation-island-link,#care-island-link'))click('navigate');
    else if(button.matches('#symbol-zoom-in,#symbol-zoom-out'))click('zoom');
    else if(button.matches('#symbol-reset,#reset-button'))click('reset');
    else click();
  },true);
  for(const id of ['help-dialog','symbol-dialog'])document.getElementById(id)?.addEventListener('close',()=>click('close'));
  const surface=document.getElementById('symbol-turntable');
  surface?.addEventListener('pointerdown',event=>{
    if(event.button!==undefined&&event.button!==0)return;
    dragPointer=event.pointerId;lastDragX=event.clientX;feedback();
  });
  surface?.addEventListener('pointermove',event=>{
    if(dragPointer!==event.pointerId||Math.abs(event.clientX-lastDragX)<8)return;
    lastDragX=event.clientX;feedback();
  });
  const endDrag=()=>{dragPointer=null;};
  surface?.addEventListener('pointerup',endDrag);surface?.addEventListener('pointercancel',endDrag);surface?.addEventListener('lostpointercapture',endDrag);
  surface?.addEventListener('wheel',()=>feedback('zoom'),{passive:true});
  surface?.addEventListener('keydown',event=>{
    if(['ArrowLeft','ArrowRight','Home','+','=','-','_'].includes(event.key))feedback(event.key==='Home'?'reset':event.key.startsWith('Arrow')?'rotate':'zoom');
  });
  document.getElementById('symbol-rotation')?.addEventListener('input',()=>feedback());
  document.addEventListener('visibilitychange',()=>{
    if(document.hidden){
      music.pause();stopClicks();
      safe(()=>context?.suspend().catch(()=>{}));
    }else if(activated)activate();
  });
  toggle.addEventListener('click',toggleSound);updateToggle();
  return {transition,transitionStep,arrive,get muted(){return muted;}};
}
