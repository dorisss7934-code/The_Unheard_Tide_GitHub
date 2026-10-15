export const wrapAngle=angle=>((angle%360)+360)%360;
export function frameForAngle(angle,frames){return Math.floor(wrapAngle(angle)/360*frames)%frames;}
export class RotationState{
  constructor(){this.reset();}
  reset(){this.angle=0;this.zoom=1;}
  set(angle){this.angle=wrapAngle(angle);return this.angle;}
  rotate(delta){return this.set(this.angle+delta);}
  scale(factor){this.zoom=Math.min(2.5,Math.max(.65,this.zoom*factor));return this.zoom;}
}
