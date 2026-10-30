'use strict';
const {app,BrowserWindow}=require('electron');
const fs=require('node:fs'),path=require('node:path'),os=require('node:os');
app.setPath('userData',fs.mkdtempSync(path.join(os.tmpdir(),'quadrymon-breeding-ui-')));
app.whenReady().then(async()=>{
  const win=new BrowserWindow({show:false,width:1280,height:960,webPreferences:{backgroundThrottling:false}});
  try {
    await win.loadURL('data:text/html,<html><body style="background:%230b1524;color:white;font-family:Segoe UI"><button id="breedingCostBtn">Montar Pokemon</button></body></html>');
    for(const file of ['src/domain/breeding-cost.js','src/renderer/breeding-cost.js'])await win.webContents.executeJavaScript(fs.readFileSync(path.resolve(file),'utf8'));
    await win.webContents.executeJavaScript(`(()=>{const s=document.createElement('style');s.textContent=${JSON.stringify(fs.readFileSync(path.resolve('src/renderer/breeding-cost.css'),'utf8'))};document.head.append(s);})()`);
    console.log(await win.webContents.executeJavaScript(`(async()=>{
      const check=(value,message)=>{if(!value)throw Error(message);},pause=()=>new Promise(r=>setTimeout(r,60)),q=s=>document.querySelector(s);
      const values=new Map(),a={id:'a',kind:'pokemon',name:'Pupitar',speciesId:247,level:1,ivTotal:175,quality:1.7},b={...a,id:'b',ivTotal:120,quality:1.65},c={...a,id:'c',name:'Exeggcute',speciesId:102,ivTotal:160};
      let queue=[],ack=[],view={},epoch=1;
      window.ui=QuadrymonBreedingUI.mount({load:k=>values.get(k),save:(k,v)=>{values.set(k,v);return true;},sprite:()=>'',accountName:()=> 'Aurora',
        accounts:()=>[{name:'Aurora',live:true}],slot:()=>({view,epoch,off:false,cid:'one'}),captures:()=>[{id:'b'}],readInventory:function(){},receive:function(){},
        itemPrices:async()=>({ok:true,at:Date.now(),prices:{diamonds:{GOLD:10000},'item:1':{GOLD:100},'item:44417':{GOLD:2000}}}),
        read:async(index,script)=>{
          if(script.includes('Observer?.read'))return {cid:'one',events:queue};
          if(script.includes('Observer?.ack')){ack.push(script);queue=[];return true;}
          return {ok:true,cid:'one',complete:true,rows:[a,b,c]};
        }});
      ui.open();await pause();check(q('#breedingCostDialog').open,'dialog opens');check(document.querySelectorAll('[data-pokemon]').length===3,'available Pokemon');
      q('#bcProjectName').value='Pupitar principal';q('[data-pokemon="a"]').click();q('[data-pokemon="b"]').click();q('[data-create]').click();
      check(ui.ledger.state.projects.length===1,'project registered');check(q('.bc-project').textContent.includes('Custo a apurar'),'unknown acquisition never appears as a free Pokemon');
      q('.bc-project details').open=true;const row=[...document.querySelectorAll('[data-node]')].find(n=>n.dataset.node.includes('"a"'));
      row.querySelector('[data-origin]').value='bought';row.querySelector('[data-price]').value='5';row.querySelector('[data-currency]').value='DIAMONDS';row.querySelector('[data-save-acquisition]').click();
      check(ui.ledger.total(ui.ledger.state.projects[0],10000).diamonds===5,'five-diamond acquisition is retained by Pokemon ID');
      q('[data-close]').click();
      const breed={id:'breed:egg',kind:'breed',cid:'one',at:Date.now(),egg:{id:'egg',speciesId:247,speciesName:'Pupitar'},parents:[a,b],double:true,quote:{goldFee:2000000,pheromoneCost:9,stones:{base:[{itemId:1,need:20,name:'Stone'}],double:[{itemId:1,need:40,name:'Stone'}]},ivPreview:{ivTotal:175,bump:{possible:true}}}};
      queue=[breed];await ui.tick();check(!ui.dialog.open,'confirmed action does not interrupt the game');check(q('#breedingCostNotice').hidden,'known parent IDs continue the existing project automatically');check(ack.length===1,'durable event acknowledged');
      ui.open();await pause();
      check(!q('[data-event]'),'breed associated');check(ui.ledger.total(ui.ledger.state.projects[0],10000).gold===2022000,'conventional fees and materials summed');
      queue=[{id:'hatch:egg',kind:'hatch',cid:'one',at:Date.now(),eggId:'egg',child:{id:'child',name:'Pupitar',speciesId:247,ivTotal:176,quality:1.735,delta:.035},instant:true,diamonds:2}];await ui.tick();
      check(ui.ledger.total(ui.ledger.state.projects[0],10000).hatched===1,'hatch joins assigned project');check(!q('[data-event]'),'no repeated question for same egg');
      q('.bc-project details').open=true;check(q('.bc-project').textContent.includes('Bônus IV +1 confirmado'),'IV bonus outcome');check(q('.bc-project').textContent.includes('1,735'),'final quality');
      check(ui.ledger.total(ui.ledger.state.projects[0],10000).diamonds===7,'instant hatch and acquisition counted once');
      queue=[breed];await ui.tick();check(ui.ledger.total(ui.ledger.state.projects[0],10000).breeds===1,'replayed response deduplicated');
      check(values.get('breedingCostLedger').includes('Pupitar principal'),'ledger persisted');
      q('#bcSearch').value='Exe';q('#bcSearch').dispatchEvent(new Event('input',{bubbles:true}));check(document.querySelectorAll('[data-pokemon]').length===1,'local search');
      q('#bcSearch').value='';q('#bcSearch').dispatchEvent(new Event('input',{bubbles:true}));q('.bc-body').scrollTop=450;q('.bc-project details').open=true;
      return 'Breeding UI: inventory selection, capture identity, editable acquisition, project registration, nonblocking association, costs, conversion, hatch/IV, replay and persistence passed.';
    })()`));
    await new Promise(r=>setTimeout(r,100));
    const preview=path.join(os.tmpdir(),'quadrymon-breeding-cost-preview.png');fs.writeFileSync(preview,(await win.webContents.capturePage()).toPNG());console.log('Preview: '+preview);
    await win.setSize(780,850);await win.webContents.executeJavaScript(`(()=>{const d=document.querySelector('#breedingCostDialog');if(d.scrollWidth>d.clientWidth+2)throw Error('Dialog horizontal overflow');})()`);
    app.exit(0);
  }catch(e){console.error(e);app.exit(1);}
});
