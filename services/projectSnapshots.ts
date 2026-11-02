import { Project } from '../types';
const DATABASE='powerweb.documents.v2',STORE='snapshots';
let connection:Promise<IDBDatabase>|undefined;
function database(){
  if(!connection)connection=new Promise<IDBDatabase>((resolve,reject)=>{
    const request=indexedDB.open(DATABASE,1);
    request.onupgradeneeded=()=>request.result.createObjectStore(STORE);
    request.onsuccess=()=>resolve(request.result);request.onerror=()=>{connection=undefined;reject(request.error);};request.onblocked=()=>{connection=undefined;reject(new Error('Хранилище проектов занято другим окном.'));};
  });
  return connection;
}
export async function putSnapshot(key:string,project:Project):Promise<void>{
  const db=await database();await new Promise<void>((resolve,reject)=>{
    const transaction=db.transaction(STORE,'readwrite');transaction.objectStore(STORE).put(project,key);
    transaction.oncomplete=()=>resolve();transaction.onabort=transaction.onerror=()=>reject(transaction.error);
  });
}
export async function getSnapshot(key:string):Promise<Project|undefined>{
  const db=await database();return new Promise((resolve,reject)=>{const request=db.transaction(STORE).objectStore(STORE).get(key);request.onsuccess=()=>resolve(request.result);request.onerror=()=>reject(request.error);});
}
export async function deleteSnapshot(key:string):Promise<void>{
  const db=await database();await new Promise<void>((resolve,reject)=>{const transaction=db.transaction(STORE,'readwrite');transaction.objectStore(STORE).delete(key);transaction.oncomplete=()=>resolve();transaction.onabort=transaction.onerror=()=>reject(transaction.error);});
}
