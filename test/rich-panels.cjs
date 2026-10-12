"use strict";
const {app,BrowserWindow}=require("electron"),fs=require("fs"),path=require("path"),os=require("os");
const root=path.resolve(__dirname,"..");
app.setPath("userData",fs.mkdtempSync(path.join(os.tmpdir(),"quadrymon-panels-test-")));
app.whenReady().then(async()=>{
 const win=new BrowserWindow({show:false,width:1440,height:950,webPreferences:{sandbox:true,contextIsolation:true}});

 try {
  await win.loadURL('data:text/html,<html><body><div id="cards"></div><div id="stats"></div><div id="ivCard"></div></body></html>');
  for(const file of ["src/domain/display-name.js","src/domain/iv-math.js","src/domain/pokemon-aptitude.js","src/domain/capture-filters.js","src/renderer/summary.js","src/renderer/rich-panels.js"])await win.webContents.executeJavaScript(fs.readFileSync(path.join(root,file),"utf8"));
  await win.webContents.executeJavaScript(`(()=>{
   const check=(ok,label)=>{if(!ok)throw Error(label)},node=(tag,text,cls)=>{const e=document.createElement(tag);if(text!=null)e.textContent=text;if(cls)e.className=cls;return e},append=(p,...e)=>{p.append(...e);return p},button=(label,handler)=>{const b=node('button',label);b.onclick=handler;return b},L=(pt)=>pt;
   const sources=Array.from({length:4},(_,i)=>({live:true,name:'Conta '+i,level:100+i,gold:1000+i,diamonds:5,hunt:'Hunt '+i,farm:{hunting:true},a:{xph:100+i,gph:50+i,kph:20+i,seconds:3600,captures:3,kills:20,xpg:100,lootGold:80,capturesGold:20,supplyGold:10,balance:90,ballsUsed:2,potsUsed:1},team:[{id:'p'+i,sid:130,name:'Gyarados',level:10,q:1,ivt:192,hp:16,hm:16,ld:true}],bag:[{id:7,name:'Potion',quantity:20,category:'heal'}],balls:[{id:8,name:'Ultra Ball',quantity:100}],drops:[{name:'Loot',qty:2,gold:10}]}));
   const saved={},captures=[{n:'Rare',iv:180,q:1.8,p:0,t:1},{n:'Common',iv:10,q:1,p:0,t:2}];let focused=-1;
   const c={node,append,button,L,format:String,colors:['cyan','gold','blue','white'],read:()=>({}),save:(k,v)=>saved[k]=JSON.parse(v),count:()=>4,focus:()=>0,lang:()=> 'pt',data:i=>sources[i],name:i=>sources[i].name,sprite:()=>'',summaryRow:i=>({st:'on',farm:sources[i].farm,lead:sources[i].team[0],hasBalls:true,balls:100,aBalls:2,hasInv:true,pots:20,aPots:1,secs:3600}),captures:()=>captures,open:i=>focused=i,recommend:()=>{},openCaptures:()=>{},exportCaptures:()=>{},reset:()=>{},closeAnalysis:()=>{},openPokemon:()=>{},refresh:()=>refresh()};
   const panels=QuadrymonRichPanels.mount(c),cards=document.querySelector('#cards'),stats=document.querySelector('#stats');
   function refresh(){PokeMuxSummary.patch(cards,panels.summary().outerHTML);PokeMuxSummary.patch(stats,panels.analysis().outerHTML)}
   cards.onclick=stats.onclick=e=>panels.handle(e);cards.onchange=stats.onchange=e=>panels.filter(e);refresh();
   panels.bindGestures(cards);panels.bindGestures(stats);
   check([...cards.querySelectorAll('.cd-it')].map(x=>x.dataset.s).join(',')==='kpis,table,today,catches,pinned','original dashboard section order and default visibility');
   check(stats.querySelector('.trainer-avatar .trainer-level').textContent==='100'&&stats.querySelector('.analysis-session-grid').children.length===4,'original trainer header and compact session grid');
   stats.querySelector('[data-panel-action=account][data-account="-1"]').click();check(stats.textContent.includes('4006')&&stats.querySelectorAll('.analysis-account').length===4,'aggregate includes all account balances and account actions');
   stats.querySelector('[data-panel-action=account][data-account="0"]').click();
   cards.querySelector('[data-panel-action=summary-config]').click();
   const toggle=cards.querySelector('[data-summary-section=trend]');toggle.checked=true;toggle.dispatchEvent(new Event('change',{bubbles:true}));check(!!cards.querySelector('.cd-it[data-s=trend]')&&saved.cardsCfg.hide.trend===false,'summary visibility persists and renders optional trend');
   const transfer=new DataTransfer();cards.querySelector('.cd-it[data-s=pinned] .cd-mv').dispatchEvent(new DragEvent('dragstart',{bubbles:true,dataTransfer:transfer}));cards.querySelector('.cd-it[data-s=today]').dispatchEvent(new DragEvent('drop',{bubbles:true,cancelable:true,dataTransfer:transfer}));check(saved.cardsCfg.order.indexOf('pinned')<saved.cardsCfg.order.indexOf('today'),'dashboard drag order persists');
   const first={...sources[0],ok:true,cid:'daily-fixture',a:{...sources[0].a,epoch:1}};
   panels.observe(0,first);
   const next={...first,a:{...first.a,xpg:150,balance:80,kills:21,captures:4}};
   panels.observe(0,next);panels.observe(0,next);
   const measured=Object.values(saved.histDay)[0]['0'];
   check(measured.x===50&&measured.g===-10&&measured.kl===1&&measured.c===1,'daily totals use signed deltas and do not double count polling');
   const goal=cards.querySelector('[data-panel-goal=g]');goal.value=500;goal.dispatchEvent(new Event('change',{bubbles:true}));check(saved.goals.g===500,'daily goals persist');
   check(cards.querySelector('[data-panel-goal=g]').value==='500'&&cards.querySelector('[data-summary-section=table]').checked,'goals and section checkboxes retain rendered values after refresh');
   check(cards.querySelectorAll('.summary-account').length===4,'four detailed account cards');
   check(cards.querySelectorAll('.summary-supply').length===4,'supply duration cards restored');
   const capturedRow=cards.querySelector('.summary-capture');check(capturedRow.querySelector('.capture-name').textContent==='Rare'&&capturedRow.querySelector('.capture-iv').textContent==='IV 180'&&capturedRow.querySelector('.capture-quality').textContent.includes('1,80')&&capturedRow.lastChild.classList.contains('capture-account'),'capture row separates Pokémon, IV, quality and trailing account');
   check(cards.querySelector('.restored-columns').textContent.includes('Rare')&&!cards.querySelector('.restored-columns').textContent.includes('Common'),'important catch filter');
   const mode=cards.querySelector('[data-panel-filter=mode]');mode.value='all';mode.dispatchEvent(new Event('change',{bubbles:true}));check(cards.textContent.includes('Common'),'all catches option');
   check(cards.querySelector('[data-panel-filter=mode]').value==='all','selected capture mode stays visible after DOM refresh');
   const minIv=cards.querySelector('[data-catch-filter=iv]');minIv.value=170;minIv.dispatchEvent(new Event('change',{bubbles:true}));check(cards.querySelector('.cd-catches-list').textContent.includes('Rare')&&!cards.querySelector('.cd-catches-list').textContent.includes('Common'),'summary IV filter uses real capture values');
   check(saved.cdFC.iv==='170'&&saved.cdFC.mode==='all','capture filters survive reload');
   stats.querySelector('[data-panel-action=account][data-account="1"]').click();check(stats.textContent.includes('1001'),'analysis account changes source data');
   stats.querySelector('[data-panel-action=pin]').click();check(saved.statsCfg.pinned.length===1,'pin items persists config');
   stats.querySelector('[data-panel-action=hide][data-section=bag]').click();check(!stats.querySelector('[data-panel-section=bag]'),'hide analysis section');
   stats.querySelector('[data-panel-action=restore][data-section=bag]').click();check(!!stats.querySelector('[data-panel-section=bag]'),'restore hidden section');
   const prior=saved.statsCfg.order.indexOf('bag');stats.querySelector('[data-panel-action=up][data-section=bag]').click();check(saved.statsCfg.order.indexOf('bag')===prior-1,'section order persists');
   cards.querySelector('[data-panel-action=focus][data-account="2"]').click();check(focused===2,'summary opens the correct account');
   const d={nome:'Gyarados',nivel:10,qualidade:1,ivTotal:192,percentual:100,poderJogo:100,tipos:['WATER'],pokemon:{nivel:10},bases:{hp:100,atk:100,def:100,spa:100,spd:100,vel:100},atuais:{hp:16,atk:16,def:16,spa:16,spd:16,vel:16},ivs:{hp:32,atk:32,def:32,spa:32,spd:32,vel:32},golpes:[{nome:'Waterfall',tipo:'WATER',categoria:'PHYSICAL',nivel:5,poder:80},{nome:'Future move',tipo:'WATER',categoria:'SPECIAL',nivel:50,poder:100}]};
   const iv=document.querySelector('#ivCard');iv.append(QuadrymonRichPanels.iv({data:d,node,append,button,L,format:String,account:'Conta 0',close:()=>{}}));
   check(iv.querySelectorAll('.iv-st').length===6,'six IV cards and bars');check(iv.querySelector('.iv-mv.off').textContent.includes('Future Move'),'locked moves remain unavailable');
   iv.querySelector('.iv-controls input').value=20;iv.querySelector('.iv-controls button').click();check(iv.querySelector('[data-projected=hp]').textContent.includes('33'),'level simulation uses stat formula');check(iv.querySelector('.iv-st').textContent.includes('Atual: 16'),'simulation preserves observed stats');
  })()`);
  console.log("Rich panels: four account summaries, supplies, capture filters, account analysis, pin/hide/reorder, IV bars, locked moves and level projection passed.");app.exit(0);
 }catch(e){console.error(e.stack);app.exit(1)}
});
setTimeout(()=>app.exit(1),30000);
