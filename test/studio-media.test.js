import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,writeFileSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {openProject} from '../cli/lib/project.js';
import {startStudio} from '../cli/lib/server.js';

test('native media metadata, suffix and seek requests receive only their byte range',async()=>{
 const dir=mkdtempSync(join(tmpdir(),'om-media-'));
 writeFileSync(join(dir,'index.html'),'<!doctype html><html><body></body></html>');
 const data=Buffer.from('0123456789');writeFileSync(join(dir,'clip.mp4'),data);
 const app=await startStudio(openProject(dir),{port:0});
 try {
  for(const [range,body,contentRange] of [['bytes=0-1','01','bytes 0-1/10'],['bytes=4-','456789','bytes 4-9/10'],['bytes=-3','789','bytes 7-9/10'],['bytes=8-99','89','bytes 8-9/10']]){
   const r=await fetch(app.url+'p/clip.mp4',{headers:{Range:range}});
   assert.equal(r.status,206);assert.equal(r.headers.get('content-range'),contentRange);
   assert.equal(r.headers.get('content-length'),String(body.length));assert.equal(await r.text(),body);
  }
  for(const range of ['bytes=12-','bytes=9-2','bytes=-0','bytes=','bytes=0-1,4-5']){
   const r=await fetch(app.url+'p/clip.mp4',{headers:{Range:range}});assert.equal(r.status,416);assert.equal(r.headers.get('content-range'),'bytes */10');assert.equal(await r.text(),'');
  }
  const head=await fetch(app.url+'p/clip.mp4',{method:'HEAD'});assert.equal(head.status,200);assert.equal(head.headers.get('content-length'),'10');assert.equal(await head.text(),'');
  const full=await fetch(app.url+'p/clip.mp4');assert.equal(full.status,200);assert.equal(full.headers.get('accept-ranges'),'bytes');assert.equal(await full.text(),'0123456789');
 } finally {app.close();rmSync(dir,{recursive:true,force:true});}
});
