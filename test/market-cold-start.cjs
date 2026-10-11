const {app,BrowserWindow}=require('electron');
const fs=require('node:fs'),path=require('node:path'),os=require('node:os');
app.setPath('userData',path.join(os.tmpdir(),'pokemux-market-cold-'+process.pid));
app.whenReady().then(async()=>{
  const win=new BrowserWindow({show:false,webPreferences:{backgroundThrottling:false}});
  try {
    await win.loadURL('data:text/html,<button id="marketBtn">Market</button>');
    for(const source of ['src/domain/pokemon-state.js','src/domain/global-market.js','src/renderer/global-market.js']) await win.webContents.executeJavaScript(fs.readFileSync(path.join(__dirname,'..',source),'utf8'));
    const result=await win.webContents.executeJavaScript(`(async()=>{
      const check=(value,message)=>{if(!value)throw Error(message);};
      const pause=ms=>new Promise(resolve=>setTimeout(resolve,ms||30));
      let gate=null,reads=[];
      window.PokeMuxMarketAlerts={normalize:x=>x,create:()=>({setRules(){},stop(){},state(){}})};
      const ui=PokeMuxMarketUI.mount({marketReaderOptions:{interval:0},marketSnapshotOptions:{background:false},
        load:()=>'',save(){},language:()=> 'pt',sprite:()=>'',preferred:()=>0,
        accounts:async()=>[{cid:'c1',name:'Tester',live:true,off:false,focused:true}],rememberFocus(){},
        read:async(_account,script)=>{
          const q=JSON.parse(script.match(/\\}\\)\\((\\{[^\\n]*?\\}),/)[1]);reads.push(q);
          if(q.browse && q.page==='2' && gate)await new Promise(resolve=>gate.push(resolve));
          const start=q.page==='2'?12:0;
          let listings=q.browse?Array.from({length:12},(_,i)=>({id:'listing'+(start+i),name:'Abra '+(start+i),kind:'pokemon',speciesId:63,level:20,ivTotal:180,quality:1.5,currency:'GOLD',price:(start+i+1)*10000})):[{id:'quote',kind:'diamonds',quantity:1,currency:'GOLD',price:10000}];
          if(q.currency==='DIAMONDS')listings=[];
          if(q.q)listings=listings.filter(x=>x.name===q.q);
          return {ok:true,data:{cid:'c1',listings,total:q.q?listings.length:24,pages:q.q?1:2,alertCatalog:[],ownedReady:true,owned:[]}};
        }});
      const el=selector=>document.querySelector(selector);
      await ui.open();await pause();el('[data-category="Pokemon"]').click();await pause();
      check(el('[data-listing="listing0"]'),'cold recent page visible without full cache');
      check(reads.filter(x=>x.browse).length===1 && !reads.some(x=>x.page==='2'),'cold browse fetches one page, not the whole market');
      el('#mkSearch').value='Abra 5';el('#mkSearch').dispatchEvent(new Event('input',{bubbles:true}));await pause(800);
      el('#mkSort').value='price-asc';el('#mkSort').dispatchEvent(new Event('change'));await pause(800);
      check(el('[data-listing="listing5"]'),'focused converted price search completes without full-market snapshot');
      check(!reads.some(x=>x.page==='2'),'focused price search does not scan unrelated pages');
      el('#mkClear').click();await pause(800);
      gate=[];const warming=ui.warmCache();await pause();
      check(gate.length===1,'background full scan has not completed');
      // Repeat the same page without another metadata query.
      el('[data-category="Pokemon"]').click();await pause();
      check(el('[data-listing="listing0"]'),'cached requested page remains usable while full scan is pending');
      const callbacks=gate;gate=null;callbacks.forEach(resolve=>resolve());await warming;await pause();
      check(!el('#mkResults').textContent.includes('Resultados parciais'),'no per-page preview');
      ui.close();return 'ok market-cold-start: one-page browsing, focused price query and independent background cache';
    })()`);
    console.log(result);win.destroy();app.exit(0);
  }catch(error){console.error(error);win.destroy();app.exit(1);}
});
