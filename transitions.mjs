const order=['body','vanity','desire','labour','care'];
const links=['transition-body-vanity','transition-vanity-desire','transition-desire-labour','transition-labour-care'];
export function transitionPath(from,to){
  if(from!==null&&!order.includes(from))throw new Error('Unknown starting scene');
  if(to!==null&&!order.includes(to))throw new Error('Unknown destination scene');
  if(from===to)return [];
  const route=[];
  if(from===null)route.push('transition-entry');
  let current=from===null?0:order.indexOf(from);
  const destination=to===null?0:order.indexOf(to);
  while(current!==destination){
    if(current<destination){route.push(links[current]);current++;}
    else{route.push(links[current-1]+'-back');current--;}
  }
  if(to===null)route.push('transition-entry-back');
  return route;
}
