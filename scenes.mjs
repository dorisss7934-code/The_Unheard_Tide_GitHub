// Keep the original scene compositions and small-card coordinates.
import {SYMBOLS} from './symbols.mjs';
const icon=(id,label,meaning,object,hotspot,card,width=9.6)=>({id,label,meaning,object,hotspot,card,width});
export const SCENES=[
  {id:'body',en:'THE BODY',title:'The voice of the body',short:'Bodily experience',description:'Click the metallic uterus to read the story behind The Unheard Tide.',alt:'Pink hands and human heads surrounding a floating metallic uterus',items:[]},
  {id:'vanity',en:'EXPECTATIONS',title:'External expectations',short:'External expectations',description:'Explore the dressing table and let the hidden symbols emerge.',alt:'A dressing table with a mirror, jewellery, perfume and cosmetic objects',items:[
    icon('joint','Joint','Joint','Drawer lock',[77,66],[83,70.3]),
    icon('fracture','Fracture','Fracture','Perfume bottle',[75.5,43],[83,39]),
    icon('expansion','Expansion /\nAccumulation','Expansion and accumulation','Bottle cap',[71.5,21],[77,1]),
    icon('closure','Closure /\nContraction','Closure and contraction','Mirror',[49,17],[7.5,8.2]),
    icon('menstruation','Menstruation','Menstruation','Pendant',[47,30],[20,25]),
    icon('night-sweats','Night sweats','Night sweats','Necklace',[40,41],[23,53.6]),
    icon('exclusion','Exclusion /\nDiscrimination','Exclusion and discrimination','Glasses',[30,89],[6.9,76.7]),
    icon('mental','Mental','Mental experience','Jewellery stand',[43.5,59],[44.6,50.4]),
    icon('decrease','Decrease /\nReduction','Decrease and reduction','Cosmetics',[61.5,79],[47.1,76.7]),
    icon('rise','Rise / Surge','Rise and surge','Drawer handle',[78,78],[67.6,76.7]),
  ]},
  {id:'desire',en:'INNER DESIRE',title:'Selfhood and desire',short:'Selfhood and desire',description:'Find attention, desire and flow among the comb, curling iron and high heels.',alt:'A giant decorated comb, metallic curling iron and golden high-heeled shoes',items:[
    icon('attention','Attention','Attention','High heels',[81,66],[72.6,70],9),
    icon('flow','Flow /\nDiffusion','Flow and diffusion','Comb',[74.5,27],[62.7,8.8],9),
    icon('sexual-desire','Sexual desire','Sexual desire','Curling iron',[47,46],[45.5,41.4],9),
    icon('dry-up','Dry Up /\nHollow Out','Dry Up / Hollow Out','Curling iron hinge',[34.8,44.5],[12.7,53.3],9),
    icon('vagina','Vagina','Vagina','Curling iron tip',[27.3,59.2],[25.5,74.5],9),
  ]},
  {id:'labour',en:'DAILY LABOUR',title:'The unpaid work of everyday life',short:'Unpaid labour',description:'Explore the broom, cooking pot and tea set to uncover bodily experiences.',alt:'A pink island holding a tea set, broom, moka pot and cooking pot',items:[
    icon('vibration','Vibration','Vibration','Broom',[58.5,56.5],[41.1,61.2],10.9),
    icon('sleep','Sleep','Sleep','Cooking pot',[76,50],[77.1,54.2],10.9),
    icon('hot-flushes','Hot flushes','Hot flushes','Moka pot',[50.2,18],[65.1,4.3],10.9),
    icon('brain-fog','Clouds and fog /\nShadows','Clouds, fog and shadows','Teapot',[25,27],[36.1,13],10.9),
  ]},
  {id:'care',en:'CARE & SELF',title:'Caring for others, seeing ourselves',short:'Care and selfhood',description:'Explore the feeding bottle, cup and teapot, where care meets personal experience.',alt:'A close view of a feeding bottle, porcelain cup, teapot and broom',items:[
    icon('connect','Connect /\nSupport','Connection and support','Feeding bottle',[28,49],[10.3,39.7],9),
    icon('bone-density','Bone density','Bone density','Porcelain cup',[51,70],[62.7,70.3],9),
    icon('head','Head','Head','Bottle teat',[26.5,37],[30.8,9.1],9),
    icon('emotion','Emotion','Emotion','Teapot',[67,45],[55.6,24.2],9),
    icon('weight','Weight','Weight','Teapot lid',[64,24],[70.9,5.8],9),
  ]},
];
const views={
  body:{number:'01',island:'body',paired:null},
  vanity:{number:'02',island:'expectations',paired:'desire'},
  desire:{number:'03',island:'expectations',paired:'vanity'},
  labour:{number:'04',island:'care',paired:'care'},
  care:{number:'05',island:'care',paired:'labour'}
};
SCENES.forEach(scene=>{
  Object.assign(scene,views[scene.id]);
  scene.items.forEach(item=>{item.description=SYMBOLS[item.id].description;});
});
export const TOTAL_SYMBOLS=SCENES.reduce((n,s)=>n+s.items.length,0);

export class ExperienceState{
  constructor(){this.scene=null;this.revealed=new Map(SCENES.map(s=>[s.id,new Set()]));this.bodyOpen=false;this.hints=false;}
  select(id){if(!SCENES.some(s=>s.id===id))throw new Error('Unknown scene');this.scene=id;this.bodyOpen=false;}
  toggle(id){const scene=SCENES.find(s=>s.id===this.scene);if(!scene?.items.some(x=>x.id===id))throw new Error('Unknown symbol in this scene');const set=this.revealed.get(this.scene);if(set.has(id)){set.delete(id);return false;}set.add(id);return true;}
  all(){const scene=SCENES.find(s=>s.id===this.scene);if(!scene)return false;const set=this.revealed.get(this.scene);const show=set.size<scene.items.length;set.clear();if(show)scene.items.forEach(x=>set.add(x.id));return show;}
  reset(){this.revealed.get(this.scene)?.clear();this.bodyOpen=false;}
  count(id=this.scene){return this.revealed.get(id)?.size??0;}
  total(){return [...this.revealed.values()].reduce((n,set)=>n+set.size,0);}
}
