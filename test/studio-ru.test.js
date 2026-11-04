import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createSaveQueue} from '../studio/save-queue.js';
import {mkdtempSync,writeFileSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {openProject} from '../cli/lib/project.js';
import {startStudio} from '../cli/lib/server.js';

test('rapid edits use the latest source version and never overlap', async()=>{
  let token=0, active=0, maximum=0;
  const seen=[];
  const save=createSaveQueue(async value=>{
    active++;maximum=Math.max(maximum,active);const previous=token;
    await new Promise(resolve=>setTimeout(resolve,5));
    assert.equal(token,previous);seen.push(value);token++;active--;
  });
  await Promise.all([save('Название'),save('Цвет'),save('Призыв')]);
  assert.equal(maximum,1);assert.equal(token,3);assert.deepEqual(seen,['Название','Цвет','Призыв']);
});

test('a rejected stale save leaves subsequent saves available',async()=>{
  let i=0;const save=createSaveQueue(async()=>{if(i++===0)throw Error('stale');return 'saved';});
  await assert.rejects(save({}),/stale/);assert.equal(await save({}),'saved');
});

test('Russian studio exposes saving, export and comment actions without untranslated Han text',()=>{
  const html=readFileSync(new URL('../studio/index.html',import.meta.url),'utf8');
  const script=readFileSync(new URL('../studio/studio.js',import.meta.url),'utf8');
  assert.match(html,/<html lang="ru">/);assert.match(html,/id="save"/);
  for(const value of ['Сохранить','Экспорт видео','Параметры','Комментарии'])assert.ok(html.includes(value));
  assert.doesNotMatch(html+script,/[\u4e00-\u9fff]/);
  assert.match(script,/await saveValues\(\{ \[v.id\]: value \}\)/);
  assert.match(script,/await saveValues\(\{ \[v.id\]: input.value \}\)/);
});

test('live Russian studio serves its queue, persists two edits and restores history',async()=>{
  const dir=mkdtempSync(join(tmpdir(),'om-ru-studio-'));
  writeFileSync(join(dir,'index.html'),`<!doctype html><html data-composition-variables='[{"id":"title","type":"string","default":"До"},{"id":"accent","type":"color","default":"#112233"}]'><body><div data-composition-id="film" data-width="1280" data-height="720" data-duration="1"></div></body></html>`);
  const app=await startStudio(openProject(dir),{port:0});
  try {
    const html=await (await fetch(app.url)).text();
    const boot=JSON.parse(/window\.OM_BOOT=(\{[^<]+\})<\/script>/.exec(html)[1]);
    assert.match(html,/Сохранить/);
    assert.equal((await fetch(app.url+'_om/save-queue.js')).status,200);
    let state=await (await fetch(app.url+'api/state')).json();
    assert.equal(state.locale,'ru-RU');
    const save=createSaveQueue(async values=>{
      const result=await fetch(app.url+'api/vars',{method:'POST',headers:{'Content-Type':'application/json','X-OM-Token':boot.csrf},body:JSON.stringify({token:state.token,values})});
      assert.equal(result.status,200);state.token=(await result.json()).token;
    });
    await Promise.all([save({title:'После'}),save({accent:'#88aabb'})]);
    state=await (await fetch(app.url+'api/state')).json();
    assert.equal(state.variables.find(v=>v.id==='title').default,'После');
    assert.equal(state.variables.find(v=>v.id==='accent').default,'#88aabb');
    const undo=await fetch(app.url+'api/undo',{method:'POST',headers:{'Content-Type':'application/json','X-OM-Token':boot.csrf},body:'{}'});
    assert.equal(undo.status,200);
    const previous=await (await fetch(app.url+'api/state')).json();
    assert.equal(previous.variables.find(v=>v.id==='title').default,'После');
    assert.equal(previous.variables.find(v=>v.id==='accent').default,'#112233');
  } finally {app.close();rmSync(dir,{recursive:true,force:true});}
});
