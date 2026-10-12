"use strict";
const { app, BrowserWindow } = require("electron"), fs = require("node:fs"), path = require("node:path"), os = require("node:os");
const root = path.resolve(__dirname, "..");
app.setPath("userData",path.join(os.tmpdir(),"quadrymon-minute-market-"+process.pid));
app.whenReady().then(async()=>{
 const win=new BrowserWindow({show:false,webPreferences:{backgroundThrottling:false}});
 try {
  await win.loadURL('data:text/html,<button id="marketBtn">Market</button>');
  for(const file of ["src/domain/pokemon-state.js","src/domain/global-market.js","src/renderer/global-market.js"])await win.webContents.executeJavaScript(fs.readFileSync(path.join(root,file),"utf8"));
  const result=await win.webContents.executeJavaScript(`(async()=>{
    const check=(ok,message)=>{if(!ok)throw Error(message)},pause=ms=>new Promise(r=>setTimeout(r,ms||40));
    let now=1000000,version=1,requests=0,tick;
    Date.now=()=>now;window.setInterval=(fn,ms)=>{check(ms===60000,'market interval is one minute');tick=fn;return 1;};window.clearInterval=()=>{tick=null};
    window.PokeMuxMarketAlerts={normalize:x=>x,create:()=>({setRules(){},state(){},check(){},stop(){}})};
    const ui=PokeMuxMarketUI.mount({load:()=>'',save(){},language:()=> 'pt',sprite:()=>'',preferred:()=>0,rememberFocus(){},
      marketReaderOptions:{interval:0,now:()=>now},marketSnapshotOptions:{background:false,now:()=>now},
      accounts:async()=>[{cid:'c1',name:'Fixture',focused:true,live:true,off:false}],
      read:async(_account,script)=>{
        requests++;const q=JSON.parse(script.match(/\\}\\)\\((\\{[^\\n]*?\\}),/)[1]);
        let listings=[{id:'quote',kind:'diamonds',quantity:1,price:10000,currency:'GOLD'}],total=1,pages=1;
        if(q.browse){const start=q.page==='2'?12:0;listings=Array.from({length:12},(_,j)=>{const i=start+j;return {id:'listing'+(version===1?i:i===23?99:i+1),kind:'pokemon',name:'Abra',speciesId:63,level:20,quality:1.8,ivTotal:180,price:version*100+i,currency:'GOLD',at:new Date(now-i*1000).toISOString()};});total=24;pages=2;if(q.currency==='DIAMONDS'){listings=[];total=0;pages=1;}}
        return {ok:true,data:{cid:'c1',listings,total,pages,ownedReady:true,owned:[{id:'pokemon:owned',kind:'pokemon',name:'Abra',speciesId:63,level:20,quality:1.8,ivTotal:180,quantity:1}],alertCatalog:[]}};
      }});
    const el=s=>document.querySelector(s);
    await ui.open();await pause();await ui.warmCache();await pause();el('[data-category="Pokemon"]').click();await pause();
    check(el('[data-listing="listing0"]'),'initial full snapshot shown');
    el('#mkIvMin').value='150';el('#mkIvMin').dispatchEvent(new Event('input',{bubbles:true}));await pause(800);el('#mkIvMin').focus();
    const before=requests;version=2;now+=61000;tick();await pause(120);
    check(requests>before,'first minute performs new server reads despite the default five-minute page cache');
    check(!el('[data-listing="listing0"]')&&el('[data-listing="listing1"]'),'removed listings disappear from the refreshed full snapshot');
    check(el('[data-listing="listing1"]').textContent.includes('200'),'new prices replace the old snapshot');
    check(el('#mkIvMin').value==='150'&&document.activeElement.id==='mkIvMin','minute refresh preserves filters and input focus');
    const next=requests;version=3;now+=61000;tick();await pause(120);
    check(requests>next&&el('[data-listing="listing1"]').textContent.includes('300'),'second minute refreshes again without waiting five minutes');
    el('[data-tab="compare"]').click();await pause();el('[data-owned="pokemon:owned"]').click();await pause();
    const comparing=requests;version=4;now+=61000;tick();await pause(120);
    check(requests>comparing&&el('.mk-sale-recommendation').textContent.includes('412'),'minute refresh also renews the Pokémon comparison snapshot and sale recommendation');
    ui.close();const closed=requests;check(tick===null,'closing stops the visible-market timer');await pause();check(requests===closed,'closing does not cause another automatic read');
    return 'Market minute refresh: default page/snapshot caches, two consecutive fresh scans, removals, new prices, filters, focus and close passed.';
  })()`);
  console.log(result);app.exit(0);
 }catch(error){console.error(error.stack);app.exit(1);}
});
setTimeout(()=>app.exit(1),30000);
