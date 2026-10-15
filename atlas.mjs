// The enlarged viewer scrubs the frames from the uploaded transparent GIFs.
// Keep only a few decoded pages while loading another angle on demand.
export function createFrameAtlas(meta,loadImage){
  const pages=new Map(),limit=3;
  const pageFor=index=>Math.floor(index/meta.frames_per_page);
  function trim(){
    for(const [number,page] of pages){
      if(pages.size<=limit)break;
      if(page.image)pages.delete(number);
    }
  }
  function touch(number,page){pages.delete(number);pages.set(number,page);}
  function load(number){
    if(number<0||number>=meta.files.length)return Promise.resolve(null);
    const existing=pages.get(number);
    if(existing){touch(number,existing);return existing.promise;}
    const page={image:null,promise:null};pages.set(number,page);
    page.promise=loadImage(meta.files[number]).then(image=>{
      page.image=image;if(!image){pages.delete(number);return null;}
      touch(number,page);trim();return image;
    });
    return page.promise;
  }
  function frameAt(index){
    const number=pageFor(index),page=pages.get(number);
    if(!page?.image)return null;
    touch(number,page);
    return {image:page.image,meta,index:index%meta.frames_per_page};
  }
  async function readyFrame(index){
    const number=pageFor(index),image=await load(number);
    if(image){load(number+1);load(number-1);}
    return image;
  }
  return {meta,frameAt,readyFrame,get decodedPages(){return [...pages.values()].filter(page=>page.image).length;}};
}
