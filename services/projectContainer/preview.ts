import { Project, CanvasElement } from '../../types';
import { getSvgPath } from '../../utils/shapeData';
import { dataUrl } from './assets';
import { ArchiveFiles } from '../../utils/zipArchive';
export async function createProjectPreview(project:Project,files:ArchiveFiles,mimes:Map<string,string>):Promise<Uint8Array>{
  const page=project.pages[0],canvas=document.createElement('canvas');
  canvas.width=480;canvas.height=Math.max(1,Math.round(480*page.height/page.width));
  if(canvas.height>320){canvas.height=320;canvas.width=Math.max(1,Math.round(320*page.width/page.height));}
  const ctx=canvas.getContext('2d');if(!ctx)throw new Error('Не удалось создать миниатюру проекта.');
  const scale=canvas.width/page.width;ctx.scale(scale,scale);ctx.fillStyle='#ffffff';ctx.fillStyle=page.backgroundColor;ctx.fillRect(0,0,page.width,page.height);
  const render=async(element:CanvasElement,offsetX=0,offsetY=0)=>{
    const {style,type,width,height}=element,x=offsetX+element.x,y=offsetY+element.y;
    ctx.save();ctx.globalAlpha=style.opacity;
    if(type==='group'){for(const child of element.elements||[])await render(child,x,y);ctx.restore();return;}
    if(type==='image'){
      const bytes=files.get(element.content||'');const source=bytes?dataUrl(bytes,mimes.get(element.content||'')||'image/png'):element.content;
      if(source){await new Promise<void>(resolve=>{
        const image=new Image();let done=false;
        const finish=()=>{if(done)return;done=true;clearTimeout(timer);image.onload=null;image.onerror=null;resolve();};
        const timer=setTimeout(finish,4000);
        image.crossOrigin='anonymous';image.onload=()=>{try{const ratio=Math.max(width/image.naturalWidth,height/image.naturalHeight);ctx.save();ctx.beginPath();ctx.rect(x,y,width,height);ctx.clip();ctx.drawImage(image,x+(width-image.naturalWidth*ratio)/2,y+(height-image.naturalHeight*ratio)/2,image.naturalWidth*ratio,image.naturalHeight*ratio);ctx.restore();}finally{finish();}};image.onerror=finish;image.src=source;
      });}
    }else if(type==='text'||type==='button'){
      if(type==='button'){ctx.fillStyle=style.fill;ctx.fillRect(x,y,width,height);}
      const size=style.fontSize||16;ctx.font=`${style.fontStyle||'normal'} ${style.fontWeight||'normal'} ${size}px ${style.fontFamily||'Arial'}`;
      ctx.fillStyle=style.color||'#111827';ctx.textBaseline='top';ctx.textAlign=type==='button'?'center':style.textAlign||'left';
      const anchor=ctx.textAlign==='center'?x+width/2:ctx.textAlign==='right'?x+width:x;
      const lines:string[]=[];for(const paragraph of (element.content||'').split('\n')){let line='';for(const word of paragraph.split(' ')){if(line&&ctx.measureText(line+' '+word).width>width){lines.push(line);line=word;}else line+=(line?' ':'')+word;}lines.push(line);}
      ctx.save();ctx.beginPath();ctx.rect(x,y,width,height);ctx.clip();lines.forEach((line,index)=>ctx.fillText(line,anchor,y+(type==='button'?(height-size)/2:0)+index*size*1.2));ctx.restore();
    }else{
      ctx.fillStyle=type==='video'?'#111827':style.fill;ctx.strokeStyle=style.stroke;ctx.lineWidth=style.strokeWidth;
      if(type==='circle'){ctx.beginPath();ctx.ellipse(x+width/2,y+height/2,width/2,height/2,0,0,Math.PI*2);ctx.fill();if(style.strokeWidth)ctx.stroke();}
      else if(['rect','roundedRect','line','video'].includes(type)){ctx.beginPath();ctx.roundRect(x,y,width,height,Math.min(style.borderRadius,width/2,height/2));ctx.fill();if(style.strokeWidth)ctx.stroke();if(type==='video'){ctx.fillStyle='#fff';ctx.beginPath();ctx.moveTo(x+width*.43,y+height*.3);ctx.lineTo(x+width*.65,y+height*.5);ctx.lineTo(x+width*.43,y+height*.7);ctx.fill();}}
      else{const path=getSvgPath(type);ctx.save();ctx.translate(x,y);ctx.scale(width/100,height/100);if(type==='heart')ctx.fill(new Path2D(path));else{ctx.beginPath();path.split(' ').forEach((point,index)=>{const [px,py]=point.split(',').map(Number);if(!index)ctx.moveTo(px,py);else ctx.lineTo(px,py);});ctx.closePath();ctx.fill();}ctx.restore();}
    }
    ctx.restore();
  };
  for(const layer of page.layers.filter(layer=>layer.visible))for(const element of layer.elements)await render(element);
  const encode=()=>new Promise<Blob>((resolve,reject)=>canvas.toBlob(value=>value?resolve(value):reject(new Error('Не удалось сохранить миниатюру.')),'image/png'));
  let blob:Blob;
  try{blob=await encode();}catch{
    // A restricted SVG/image must not prevent saving the document itself.
    canvas.width=480;canvas.height=270;ctx.fillStyle='#f1f5f9';ctx.fillRect(0,0,480,270);ctx.fillStyle='#334155';ctx.font='600 24px sans-serif';ctx.fillText(project.name,28,130,424);blob=await encode();
  }
  return new Uint8Array(await blob.arrayBuffer());
}
