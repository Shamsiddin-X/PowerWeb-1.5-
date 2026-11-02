/** Portable ZIP containers. Store method avoids recompressing images/video and needs no dependency. */
export type ArchiveFiles=Map<string,Uint8Array>;
const encoder=new TextEncoder(),decoder=new TextDecoder();
const MAX_ENTRIES=20000,MAX_UNPACKED=1024*1024*1024;
const crcTable=Uint32Array.from({length:256},(_,index)=>{let crc=index;for(let bit=0;bit<8;bit++)crc=crc&1?0xedb88320^(crc>>>1):crc>>>1;return crc>>>0;});
export function crc32(data:Uint8Array){let crc=0xffffffff;for(const byte of data)crc=crcTable[(crc^byte)&255]^(crc>>>8);return (crc^0xffffffff)>>>0;}
export function archivePath(path:string):string{
  if(!path||path.includes('\\')||path.startsWith('/')||/^[a-z]:/i.test(path)||path.includes('\0')||path.split('/').some(part=>part==='..'||part==='.'))throw new Error('Недопустимый путь в архиве: '+path);
  return path;
}
export const utf8=(value:string)=>encoder.encode(value);
export const textOf=(value:Uint8Array)=>decoder.decode(value);
export function createZip(files:ArchiveFiles):Uint8Array{
  if(files.size>MAX_ENTRIES)throw new Error('Слишком много файлов в архиве.');
  const entries=[...files].map(([path,data])=>({name:encoder.encode(archivePath(path)),data,crc:crc32(data),offset:0}));
  const total=entries.reduce((sum,e)=>sum+30+e.name.length+e.data.length+46+e.name.length,22);
  if(entries.some(entry=>entry.name.length>65535))throw new Error('Слишком длинное имя файла в архиве.');
  if(entries.reduce((sum,entry)=>sum+entry.data.length,0)>MAX_UNPACKED)throw new Error('Распакованный проект превышает 1 ГБ.');
  if(total>0xffffffff)throw new Error('Архив превышает лимит ZIP32 (4 ГБ).');
  const result=new Uint8Array(total),view=new DataView(result.buffer);let position=0;
  const now=new Date(),date=((Math.max(1980,now.getFullYear())-1980)<<9)|((now.getMonth()+1)<<5)|now.getDate(),time=(now.getHours()<<11)|(now.getMinutes()<<5)|(now.getSeconds()>>1);
  for(const entry of entries){
    entry.offset=position;view.setUint32(position,0x04034b50,true);view.setUint16(position+4,20,true);view.setUint16(position+6,0x800,true);
    view.setUint16(position+10,time,true);view.setUint16(position+12,date,true);view.setUint32(position+14,entry.crc,true);
    view.setUint32(position+18,entry.data.length,true);view.setUint32(position+22,entry.data.length,true);view.setUint16(position+26,entry.name.length,true);
    result.set(entry.name,position+30);result.set(entry.data,position+30+entry.name.length);position+=30+entry.name.length+entry.data.length;
  }
  const centralOffset=position;
  for(const entry of entries){
    view.setUint32(position,0x02014b50,true);view.setUint16(position+4,20,true);view.setUint16(position+6,20,true);view.setUint16(position+8,0x800,true);
    view.setUint16(position+12,time,true);view.setUint16(position+14,date,true);view.setUint32(position+16,entry.crc,true);
    view.setUint32(position+20,entry.data.length,true);view.setUint32(position+24,entry.data.length,true);view.setUint16(position+28,entry.name.length,true);
    view.setUint32(position+42,entry.offset,true);result.set(entry.name,position+46);position+=46+entry.name.length;
  }
  const centralSize=position-centralOffset;
  view.setUint32(position,0x06054b50,true);view.setUint16(position+8,entries.length,true);view.setUint16(position+10,entries.length,true);
  view.setUint32(position+12,centralSize,true);view.setUint32(position+16,centralOffset,true);return result;
}
async function inflate(data:Uint8Array,limit:number):Promise<Uint8Array>{
  let stream:DecompressionStream;
  try{stream=new DecompressionStream('deflate-raw' as CompressionFormat);}catch{throw new Error('Эта версия WebView не поддерживает сжатый ZIP. Откройте архив в актуальной версии приложения.');}
  const reader=new Blob([new Uint8Array(data)]).stream().pipeThrough(stream).getReader();
  const chunks:Uint8Array[]=[];let size=0;
  try{while(true){const {done,value}=await reader.read();if(done)break;size+=value.length;if(size>limit){await reader.cancel();throw new Error('Превышен допустимый размер распакованного файла.');}chunks.push(value);}}
  finally{reader.releaseLock();}
  const result=new Uint8Array(size);let offset=0;for(const chunk of chunks){result.set(chunk,offset);offset+=chunk.length;}return result;
}
export async function readZip(data:Uint8Array):Promise<ArchiveFiles>{
  const view=new DataView(data.buffer,data.byteOffset,data.byteLength);
  const bounds=(offset:number,length:number)=>{if(!Number.isSafeInteger(offset)||offset<0||length<0||offset+length>data.length)throw new Error('Повреждённый ZIP: неверные границы файла.');};
  let end=-1;
  for(let i=data.length-22;i>=Math.max(0,data.length-65557);i--){if(view.getUint32(i,true)===0x06054b50&&i+22+view.getUint16(i+20,true)===data.length){end=i;break;}}
  if(end<0)throw new Error('Файл не является ZIP-контейнером.');
  if(view.getUint16(end+4,true)||view.getUint16(end+6,true))throw new Error('Многотомные ZIP не поддерживаются.');
  const count=view.getUint16(end+10,true),centralSize=view.getUint32(end+12,true);let offset=view.getUint32(end+16,true),unpacked=0;
  if(view.getUint16(end+8,true)!==count)throw new Error('Повреждённый каталог ZIP.');
  if(count>MAX_ENTRIES||count===0xffff)throw new Error('Недопустимое количество файлов в ZIP.');
  bounds(offset,centralSize);const centralEnd=offset+centralSize;if(centralEnd>end)throw new Error('Повреждённый каталог ZIP.');
  const files:ArchiveFiles=new Map();
  for(let i=0;i<count;i++){
    bounds(offset,46);if(offset+46>centralEnd||view.getUint32(offset,true)!==0x02014b50)throw new Error('Повреждённый каталог ZIP.');
    const flags=view.getUint16(offset+8,true),method=view.getUint16(offset+10,true),crc=view.getUint32(offset+16,true);
    const compressed=view.getUint32(offset+20,true),size=view.getUint32(offset+24,true),nameLength=view.getUint16(offset+28,true),extra=view.getUint16(offset+30,true),comment=view.getUint16(offset+32,true),local=view.getUint32(offset+42,true);
    bounds(offset+46,nameLength+extra+comment);const path=archivePath(decoder.decode(data.subarray(offset+46,offset+46+nameLength)));offset+=46+nameLength+extra+comment;
    if(offset>centralEnd)throw new Error('Повреждённый каталог ZIP.');
    if(flags&1)throw new Error('Архив с паролем не поддерживается.');
    if(files.has(path))throw new Error('В архиве есть повторяющийся путь: '+path);
    unpacked+=size;if(unpacked>MAX_UNPACKED)throw new Error('Распакованный проект превышает 1 ГБ.');
    bounds(local,30);if(view.getUint32(local,true)!==0x04034b50)throw new Error('Повреждённый файл ZIP.');
    const start=local+30+view.getUint16(local+26,true)+view.getUint16(local+28,true);bounds(start,compressed);
    const packed=data.subarray(start,start+compressed);
    const content=method===0?new Uint8Array(packed):method===8?await inflate(packed,size):null;
    if(!content)throw new Error('Неподдерживаемый метод сжатия ZIP: '+method);
    if(content.length!==size||crc32(content)!==crc)throw new Error('Повреждены данные файла: '+path);
    files.set(path,content);
  }
  if(offset!==centralEnd)throw new Error('Повреждённый каталог ZIP.');
  return files;
}
