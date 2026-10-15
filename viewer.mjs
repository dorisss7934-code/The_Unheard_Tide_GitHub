import {SYMBOLS} from './symbols.mjs';
import {RotationState,frameForAngle} from './turntable.mjs';

export function createSymbolViewer({imageFor,onClose=()=>{}}){
  const $=id=>document.getElementById(id);
  const dialog=$('symbol-dialog'),surface=$('symbol-turntable'),canvas=$('symbol-canvas');
  $('app').append(dialog);
  const context=canvas.getContext('2d'),rotation=new RotationState();
  let data=null,token=0,frameToken=0,drag=null,origin=null;
  function draw(){
    if(!data||!context||!dialog.open)return;
    const active=data,{meta}=active,index=frameForAngle(rotation.angle,meta.frames),request=++frameToken;
    $('symbol-rotation').value=String(Math.round(rotation.angle)%360);
    $('symbol-angle').textContent=String(Math.round(rotation.angle)%360).padStart(3,'0')+'°';
    $('symbol-zoom-level').textContent=Math.round(rotation.zoom*100)+'%';
    function paint(frame){
      if(data!==active||request!==frameToken||!dialog.open)return;
      const {image,meta,index}=frame,size=canvas.width*.88*rotation.zoom,offset=(canvas.width-size)/2;
      context.clearRect(0,0,canvas.width,canvas.height);
      context.imageSmoothingEnabled=true;context.imageSmoothingQuality='high';
      context.drawImage(image,(index%meta.columns)*meta.size,Math.floor(index/meta.columns)*meta.size,meta.size,meta.size,offset,offset,size,size);
    }
    if(!active.frameAt){paint({image:active.image,meta,index});return;}
    const frame=active.frameAt(index);
    if(frame){paint(frame);return;}
    active.readyFrame(index).then(image=>{
      if(image)paint({image,meta,index:index%meta.frames_per_page});
    });
  }
  function clear(){
    token++;frameToken++;data=null;drag=null;surface.classList.remove('is-dragging');
    context?.clearRect(0,0,canvas.width,canvas.height);
    if(origin?.isConnected)origin.focus({preventScroll:true});origin=null;onClose();
  }
  function close(){if(dialog.open)dialog.close();}
  async function open(item,button,angle=0){
    const request=++token,definition=SYMBOLS[item.id];
    data=null;origin=button;rotation.reset();rotation.set(angle);
    context?.clearRect(0,0,canvas.width,canvas.height);
    $('symbol-number').textContent=String(definition.index).padStart(2,'0')+' / 24';
    $('symbol-title').textContent=definition.title;
    $('symbol-description').textContent=definition.description;
    $('symbol-rotation').value=String(Math.round(rotation.angle)%360);
    $('symbol-angle').textContent=String(Math.round(rotation.angle)%360).padStart(3,'0')+'°';
    $('symbol-zoom-level').textContent='100%';
    surface.setAttribute('aria-label',definition.title+'. Drag left or right to rotate.');
    if(!dialog.open)dialog.showModal();surface.focus({preventScroll:true});
    const loaded=await imageFor(item.id,true);
    if(request!==token||!dialog.open)return;
    if(loaded){data=loaded;draw();return;}
    const still=new Image();
    still.onload=()=>{
      if(request!==token||!dialog.open)return;
      data={image:still,meta:{size:still.naturalWidth||640,columns:1,frames:1}};draw();
      $('symbol-loading').textContent='Rotation is unavailable. The original still image is shown.';
    };
    still.src='assets/'+item.id+'-viewer-still.webp';
  }
  $('symbol-close').addEventListener('click',close);dialog.addEventListener('close',clear);
  dialog.addEventListener('click',event=>{
    if(event.target!==dialog)return;
    const bounds=dialog.getBoundingClientRect();
    if(event.clientX<bounds.left||event.clientX>bounds.right||event.clientY<bounds.top||event.clientY>bounds.bottom)close();
  });
  surface.addEventListener('pointerdown',event=>{
    if(!data||event.button!==undefined&&event.button!==0)return;
    event.preventDefault();drag={id:event.pointerId,x:event.clientX,angle:rotation.angle};
    surface.setPointerCapture(event.pointerId);surface.classList.add('is-dragging');
  });
  surface.addEventListener('pointermove',event=>{
    if(!drag||drag.id!==event.pointerId)return;
    rotation.set(drag.angle+(event.clientX-drag.x)*.7);draw();
  });
  function endDrag(event){
    if(!drag||drag.id!==event.pointerId)return;
    drag=null;surface.classList.remove('is-dragging');
    if(surface.hasPointerCapture(event.pointerId))surface.releasePointerCapture(event.pointerId);
  }
  surface.addEventListener('pointerup',endDrag);surface.addEventListener('pointercancel',endDrag);
  surface.addEventListener('lostpointercapture',()=>{drag=null;surface.classList.remove('is-dragging');});
  surface.addEventListener('wheel',event=>{
    if(!data)return;event.preventDefault();rotation.scale(Math.exp(-event.deltaY*.0015));draw();
  },{passive:false});
  surface.addEventListener('keydown',event=>{
    const step=360/(data?.meta.frames??32);
    if(event.key==='ArrowLeft')rotation.rotate(-step);
    else if(event.key==='ArrowRight')rotation.rotate(step);
    else if(event.key==='Home')rotation.reset();
    else if(event.key==='+'||event.key==='=')rotation.scale(1.15);
    else if(event.key==='-'||event.key==='_')rotation.scale(1/1.15);
    else return;
    event.preventDefault();draw();
  });
  $('symbol-rotation').addEventListener('input',()=>{rotation.set(Number($('symbol-rotation').value));draw();});
  $('symbol-reset').addEventListener('click',()=>{rotation.reset();draw();});
  $('symbol-zoom-in').addEventListener('click',()=>{rotation.scale(1.15);draw();});
  $('symbol-zoom-out').addEventListener('click',()=>{rotation.scale(1/1.15);draw();});
  return {open:(...args)=>{$('symbol-loading').textContent='';return open(...args);},close,get isOpen(){return dialog.open;}};
}
