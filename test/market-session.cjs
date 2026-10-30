'use strict';
const {app,BrowserWindow}=require('electron');
const fs=require('node:fs'),path=require('node:path'),os=require('node:os');
app.setPath('userData',path.join(os.tmpdir(),'quadrymon-market-session-'+process.pid));
app.whenReady().then(async()=>{
  const win=new BrowserWindow({show:false,webPreferences:{backgroundThrottling:false}});
  try {
    await win.loadURL('data:text/html,<button id="marketBtn">Market</button>');
    for(const file of ['src/domain/pokemon-state.js','src/domain/global-market.js','src/domain/market-alerts.js','src/renderer/global-market.js'])
      await win.webContents.executeJavaScript(fs.readFileSync(path.join(__dirname,'..',file),'utf8'));
    console.log(await win.webContents.executeJavaScript(`(async()=>{
      const check=(ok,message)=>{if(!ok)throw Error(message);};
      const nativeTimeout=window.setTimeout.bind(window),nativeClear=window.clearTimeout.bind(window);
      const pause=ms=>new Promise(resolve=>nativeTimeout(resolve,ms||60));
      let now=100000000,version=1,requests=[],tick=null,notifications=[],timerId=0,hangNext=false,scanGate=null;
      const scheduled=new Map();
      Date.now=()=>now;
      window.setInterval=(fn,ms)=>{check(ms===60000,'visible timer uses one minute');tick=fn;return 1;};
      window.clearInterval=()=>{tick=null;};
      window.setTimeout=(fn,ms)=>{if(ms>=1000){const id=--timerId;scheduled.set(id,{fn,ms});return id;}return nativeTimeout(fn,ms);};
      window.clearTimeout=id=>{if(!scheduled.delete(id))nativeClear(id);};
      const rule={id:'r1',cid:'c1',account:0,accountName:'Fixture',name:'Abra',kind:'pokemon',speciesId:63,enabled:true,desktop:true};
      const ui=PokeMuxMarketUI.mount({
        load:key=>key==='marketAlerts'?JSON.stringify([rule]):'',save(){},language:()=> 'pt',sprite:()=>'',preferred:()=>0,rememberFocus(){},
        notifyMarket:text=>notifications.push(text),marketReaderOptions:{interval:0,timeoutMs:35,now:()=>now},marketSnapshotOptions:{now:()=>now},
        accounts:async()=>[{cid:'c1',name:'Fixture',live:true,off:false,focused:true}],
        read:async(_account,script)=>{
          const q=JSON.parse(script.match(/\\}\\)\\((\\{[^\\n]*?\\}),/)[1]);requests.push(q);
          if(hangNext){hangNext=false;return new Promise(()=>{});}
          if(q.page==='2'&&scanGate)await new Promise(resolve=>scanGate.push(resolve));
          const base=version===1?0:1,start=q.page==='2'?12:0;
          let listings=q.browse?Array.from({length:12},(_,i)=>({id:'ad'+(start+i+base),kind:'pokemon',speciesId:63,name:'Abra',price:version*100+i,currency:'GOLD',ivTotal:180,level:20,quality:1.8,at:new Date(now-i*1000).toISOString()})):[{id:'quote',kind:'diamonds',quantity:1,price:10000,currency:'GOLD'}];
          if(q.currency==='DIAMONDS')listings=[];
          return {ok:true,data:{cid:'c1',name:'Fixture',listings,total:q.browse?24:1,pages:q.browse?2:1,alertCatalog:[],ownedReady:true,owned:[]}};
        }
      });
      const el=selector=>document.querySelector(selector);
      const alertTick=async()=>{const entry=[...scheduled].find(([,job])=>[1000,60000,300000].includes(job.ms));check(entry,'alert timer remains scheduled');scheduled.delete(entry[0]);await entry[1].fn();await pause();};
      await ui.warmCache();check(requests.length===0,'mounting and warming a closed market do not scan the shop');
      check(![...scheduled.values()].some(job=>job.ms===5000),'there is no recurring full-market warmup while closed');
      await alertTick();check(requests.length===2&&notifications.length===0,'closed-market alerts establish their own fresh baseline');
      const baseline=requests.length;version=2;now+=61000;
      await alertTick();check(requests.length>baseline&&notifications.length===1,'closed-market alerts read new pages and notify within one minute, bypassing cached pages');

      version=1;now+=61000;await ui.open();await pause(120);
      el('[data-category="Pokemon"]').click();await pause();
      check(el('[data-listing="ad0"]'),'opening populates a complete visible market');
      const row=el('[data-listing="ad0"]'),beforeFilter=requests.length;
      el('#mkIvMin').focus();el('#mkIvMin').value='150';el('#mkIvMin').dispatchEvent(new Event('input',{bubbles:true}));
      check(el('[data-listing="ad0"]')===row&&document.activeElement.id==='mkIvMin','local filters keep existing listing nodes and the focused input');
      el('#mkSort').value='iv-desc';el('#mkSort').dispatchEvent(new Event('change'));
      await pause();check(requests.length===beforeFilter,'local filtering and sorting do not reload the market or query the server');
      for(let hour=1;hour<=8;hour++){
        version=hour+1;now+=3600000;const before=requests.length;tick();await pause(120);
        check(requests.length>before&&el('[data-listing="ad1"]').textContent.includes(String(version*100)),'hour '+hour+' renews prices and listings');
        check(!el('[data-listing="ad0"]')&&el('#mkIvMin').value==='150','removals and filters survive long sessions');
      }
      now+=61000;scanGate=[];const scanning=ui.warmCache();await pause(5);
      check(scanGate.length===1,'a complete scan can remain in flight independently of visible filters');
      el('#mkIvMin').value='190';el('#mkIvMin').dispatchEvent(new Event('input',{bubbles:true}));
      const callbacks=scanGate;scanGate=null;callbacks.forEach(resolve=>resolve());await scanning;
      check(!el('[data-listing]')&&el('#mkIvMin').value==='190','a completed scan applies the latest filter rather than restoring the query from its start');
      el('#mkIvMin').value='150';el('#mkIvMin').dispatchEvent(new Event('input',{bubbles:true}));
      const beforeStall=requests.length;hangNext=true;now+=61000;tick();await pause(120);
      check(requests.length>beforeStall&&el('[data-listing="ad1"]'),'a hung guest read preserves the previous results');
      version=20;now+=61000;tick();await pause(120);
      check(el('[data-listing="ad1"]').textContent.includes('2.000'),'the next minute recovers after a never-settling guest request');
      ui.close();const closed=requests.length;check(tick===null,'closing stops the visible timer');
      now+=3600000;await ui.warmCache();await pause();check(requests.length===closed,'closing stops full-market scans');
      await alertTick();check(requests.length>closed,'alerts continue after closing the market');
      version=21;await ui.open();await pause(120);
      check(el('[data-listing="ad1"]').textContent.includes('2.100'),'reopening fetches fresh prices without a manual refresh');
      hangNext=true;void ui.refresh();await pause(5);ui.close();version=22;await ui.open();await pause(160);
      check(el('[data-listing="ad1"]').textContent.includes('2.200'),'closing and reopening during a stalled refresh cannot lock the new session');
      ui.close();return 'Market session: eight simulated hours, fresh reopening, local filters, stable rows, stalled guests, closed scans and independent fresh alerts passed.';
    })()`));
    app.exit(0);
  }catch(error){console.error(error.stack);app.exit(1);}
});
setTimeout(()=>app.exit(1),30000);
