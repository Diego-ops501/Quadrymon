"use strict";
// Render the production interface with fictional accounts, in an isolated profile.
const { app, BrowserWindow, ipcMain } = require("electron");
const fs = require("node:fs"), path = require("node:path"), os = require("node:os"), zlib = require("node:zlib");
const root = path.resolve(__dirname, ".."), output = path.join(root, "docs/images");
fs.mkdirSync(output, { recursive: true });
app.setPath("userData", fs.mkdtempSync(path.join(os.tmpdir(), "quadrymon-docs-")));
const catalog = JSON.parse(zlib.gunzipSync(fs.readFileSync(path.join(root, "test/fixtures/game-catalog.json.gz"))));
const math = require("../src/domain/iv-math"), reader = require("../src/game/iv-reader");
const bases = { hp: 95, atk: 125, def: 79, spa: 60, spd: 100, vel: 81 };
const iv = reader.calculate({ bases, pokemon: { nome:"Gyarados", nivel:138, multiplicadorQualidade:1.53, ivAtual:177, hp:325, atk:359, def:262, spa:221, spd:310, vel:296 } }, math, {pokeId:130, type1:"WATER", type2:"FLYING"});
const names = ["Aurora", "Boreal", "Citrino", "Dourado"];
const entries = [{kind:"pokemon",speciesId:246,name:"Larvitar"},{kind:"pokemon",speciesId:247,name:"Pupitar"},{kind:"pokemon",speciesId:248,name:"Tyranitar"},{kind:"pokemon",speciesId:130,name:"Gyarados"},{kind:"pokemon",speciesId:147,name:"Dratini"},{kind:"item",refId:1,name:"Potion",icon:"/assets/items/potion.png"}];
const events = names.map((name,p)=>({t:Date.now()-p*600000,p,account:name,n:["Dratini","Abra","Pupitar","Gastly"][p],iv:[178,156,172,164][p],q:[1.78,1.55,1.70,1.60][p],sh:p===0}));
const fixtures = {
  "creds:load":()=>names.map(name=>({name,email:"demo@example.invalid",senha:""})),
  "game-runtime:read":()=>"",
  "game-catalog:load":()=>({version:1,at:Date.now(),entries}),
  "autostart:get":()=>({on:false,suportado:true}),
  "update:check":()=>({supported:true}),
};
for(const channel of ["creds:load","game-runtime:read","game-catalog:load","game-auth:hydrate","game:performance","awake:set","mintray:set","autostart:get","log:write","errlog:write","notify","overlay:state","overlay:toggle","update:check"])
  ipcMain.handle(channel,()=>fixtures[channel]?.()??true);
ipcMain.on("app:version",event=>{event.returnValue="1.0.0";});
app.on("web-contents-created",(_event,contents)=>{
  contents.session.webRequest.onBeforeRequest({urls:["http://*/*","https://*/*"]},(details,callback)=>callback({cancel:details.resourceType!=="image"}));
  contents.on("will-attach-webview",(_event,_preferences,parameters)=>{parameters.src="about:blank";});
});
const pause=ms=>new Promise(resolve=>setTimeout(resolve,ms));
app.whenReady().then(async()=>{
  const win=new BrowserWindow({show:false,width:1440,height:950,useContentSize:true,webPreferences:{preload:path.join(root,"preload.js"),contextIsolation:true,sandbox:true,webviewTag:true,backgroundThrottling:false}});
  const run=code=>win.webContents.executeJavaScript(code);
  async function shot(name){await pause(600);await run(`Promise.all([...document.images].filter(img=>!img.complete).map(img=>new Promise(resolve=>{img.onload=img.onerror=resolve;setTimeout(resolve,2500)})))`);fs.writeFileSync(path.join(output,name+".png"),(await win.webContents.capturePage()).toPNG());console.log("Captured "+name);}
  try {
    await win.loadFile(path.join(root,"index.html"));
    await run(`localStorage.setItem('lifeCatch',${JSON.stringify(JSON.stringify(events))});localStorage.setItem('alerts','0');localStorage.setItem('voiceAlerts','0');`);
    await win.reload();await pause(10500);
    await run(`(async()=>{
      const pause=ms=>new Promise(resolve=>setTimeout(resolve,ms));for(let i=0;i<100&&!window.PokeMuxRuntime;i++)await pause(50);
      const definitions=${JSON.stringify(catalog)},iv=${JSON.stringify(iv)},events=${JSON.stringify(events)},entries=${JSON.stringify(entries)},names=${JSON.stringify(names)};
      const listings=entries.filter(x=>x.kind==='pokemon').map((x,i)=>({...x,id:'offer-'+i,level:[35,45,65,138,20][i],ivTotal:[166,174,178,177,170][i],quality:[1.50,1.65,1.78,1.53,1.60][i],shiny:i===0,currency:'GOLD',price:[22000,45000,85000,110000,18000][i],quantity:1,type1:i<3?'ROCK':i===3?'WATER':'DRAGON',createdAt:new Date().toISOString()}));
      listings.push({id:'diamond-offer',kind:'item',refId:9001,name:'Diamond',icon:'/assets/market/diamonds.png',quantity:1,price:30000,currency:'GOLD',category:'Diamonds'});
      const bag=[{id:'g130',kind:'pokemon',name:'Gyarados',speciesId:130,level:138,iv:177,ivTotal:177,quality:1.53,quantity:1,stats:{hp:325,atk:359,def:262,spAtk:221,spDef:310,speed:296}},...listings.filter(x=>x.kind==='pokemon').map(x=>({...x,iv:x.ivTotal})),{id:'potion',kind:'item',name:'Potion',icon:'/assets/items/potion.png',category:'heal',quantity:120,npcPrice:100},{id:'ball',kind:'ball',name:'Poké Ball',quantity:300,icon:'/assets/balls/poke_ball.png'}];
      const samples=names.map((name,i)=>({ok:true,live:true,cid:'demo'+i,name,level:569,gold:2500000,diamonds:650,hunt:['Enigmatic Girafarig','Abra','Gastly','Dratini'][i],farm:{hunting:true},team:[{id:'leader'+i,name:'Pinsir',sid:127,level:361,ivt:156,q:1.78,hp:9504,hm:9504,t1:'BUG',t2:'',ld:true,tms:[],stats:{hp:9504,atk:1013,def:927,spa:475,spd:687,speed:892}}],balls:[{id:1,name:'Poké Ball',quantity:300}],bag:[{id:2,name:'Potion',category:'potion',quantity:120}],a:{xph:[1854000,962000,1348000,745000][i],gph:[132000,78000,91000,64000][i],kph:[137,280,219,174][i],captures:[23,37,18,31][i],seconds:3600,ballsUsed:24,potsUsed:12,kills:137,xpg:1854000,balance:132000,lootGold:142000,capturesGold:22000,supplyGold:32000,hpk:2.5,shinyFound:1,shinyCap:1},captures:events.filter(x=>x.p===i),events:[],xpMultiplier:1}));
      [...document.querySelectorAll('webview')].forEach((view,i)=>{
        view.getURL=()=> 'https://poke.idleworld.online/play';
        view.executeJavaScript=async script=>{
          if(script.includes('PokeMuxSession.snapshot'))return samples[i];
          if(script.includes('map-markers'))return {...definitions,markers:definitions.hunts,combat:{slug:'',mobs:[]}};
          if(script.includes('__pgIv')||script.includes('__pokemuxIv.calc'))return iv;
          if(script.includes('async function readInGame(receive)'))return {ok:true,complete:true,cid:'demo'+i,rows:bag};
          if(script.includes('async function readInGame(params'))return {ok:true,data:{cid:'demo'+i,name:names[i],listings,mine:listings.slice(0,2),requests:[],history:[],species:entries.filter(x=>x.kind==='pokemon').map(x=>({...x,evolvesToId:x.speciesId===246?247:x.speciesId===247?248:0})),owned:bag,ownedReady:true,total:listings.length,pages:1,catalog:{items:bag.filter(x=>x.kind==='item'),balls:bag.filter(x=>x.kind==='ball')}}};
          return true;
        };
      });
      await Promise.all(names.map((_,i)=>PokeMuxRuntime.readState(i)));
      document.querySelector('[data-mode="summary"]').click();
    })()`);
    await shot("resumo");
    await run(`document.querySelector('#statsBtn').click()`);await shot("analise");await run(`document.querySelector('#stats [data-panel-action=close]').click()`);
    if (process.argv.includes("--panels-only")) { await run(`document.querySelector('[data-mode="focus"]').click()`); await shot("foco"); await run(`document.querySelector('[data-mode="grid"]').click()`); await shot("grade"); app.exit(0); return; }
    await run(`document.querySelector('#marketBtn').click()`);await pause(12000);await run(`document.querySelector('[data-category="Pokemon"]').click()`);await pause(12000);await shot("mercado");
    await run(`const field=document.querySelector('#mkSearch');field.focus();field.value='pup';field.dispatchEvent(new Event('input',{bubbles:true}));`);await shot("sugestoes");
    await run(`document.querySelector('#mkClose').click();document.querySelector('#inventoryBtn').click()`);await pause(1200);await shot("inventario");
    await run(`document.querySelector('.inventory-row[role="button"]').dispatchEvent(new Event('mouseenter'))`);await pause(500);await shot("ivs");
    await run(`document.querySelector('#inventoryDialog').close();document.querySelector('#ivCard').hidden=true;document.querySelector('#menuBtn').click();document.querySelector('#menu .settings-nav [data-section="notifications"]').click()`);await shot("alertas");
    await run(`document.querySelector('#menu .settings-nav [data-section="performance"]').click()`);await shot("configuracoes");
    await run(`document.querySelector('#menu header button').click();PokeMuxRuntime.openCaptures()`);await shot("capturas");
    await run(`document.querySelector('#captureHistory').close();PokeMuxRuntime.openRecommendations(0)`);await pause(1500);await shot("hunts");
    const overlay = new BrowserWindow({show:false,width:420,height:410,useContentSize:true,frame:false,transparent:true,webPreferences:{preload:path.join(root,"preload.js"),sandbox:true,contextIsolation:true}});
    await overlay.loadFile(path.join(root,"overlay.html"));
    overlay.webContents.send("overlay:data", {total:{xph:4909000,gph:365000,shiny:1},accounts:names.map((name,i)=>({name,online:true,hunt:["Enigmatic Girafarig","Abra","Gastly","Dratini"][i],xph:[1854000,962000,1348000,745000][i],gph:[132000,78000,91000,64000][i]}))});
    await pause(500);
    fs.writeFileSync(path.join(output,"overlay.png"),(await overlay.webContents.capturePage()).toPNG());
    console.log("Captured overlay");
    app.exit(0);
  }catch(error){console.error(error.stack);app.exit(1);}
});
setTimeout(()=>{console.error("Documentation capture timed out");app.exit(1);},150000);
