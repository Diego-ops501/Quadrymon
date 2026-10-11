const {app,BrowserWindow}=require('electron'),fs=require('node:fs'),path=require('node:path'),os=require('node:os');
app.setPath('userData',path.join(os.tmpdir(),'pokemux-inventory-'+process.pid));
app.whenReady().then(async()=>{
  const win=new BrowserWindow({show:false,width:1200,height:850,webPreferences:{backgroundThrottling:false}});
  try{
    await win.loadURL('data:text/html,<body style="background:%230b121b"></body>');
    await win.webContents.executeJavaScript(fs.readFileSync(path.resolve('src/domain/pokemon-state.js'),'utf8')+fs.readFileSync(path.resolve('src/domain/global-market.js'),'utf8')+fs.readFileSync(path.resolve('src/renderer/inventory.js'),'utf8'));
    await win.webContents.insertCSS('body {font-family: "Segoe UI",Arial,sans-serif;}'+fs.readFileSync(path.resolve('src/renderer/inventory.css'),'utf8'));
    console.log(await win.webContents.executeJavaScript(`(async()=>{
      const pause=()=>new Promise(r=>setTimeout(r,30)), check=(v,s)=>{if(!v)throw Error(s);};
      const slots=[0,1,2,3].map(i=>({view:{},cid:'character'+i,email:'account'+i,epoch:0}));
      const accounts=['Aurora','Boreal','Citrino','Dourado'].map(name=>({name,live:true}));let reads=0,focused=-1,enabled=true,quoteCalls=0,language='pt';const calculated=[],shown=[],pending=[];
      const tooltip=document.createElement('div');tooltip.id='ivCard';document.body.append(tooltip);
      const ui=PokeMuxInventory.mount({language:()=>language,accounts:()=>accounts,slot:i=>slots[i],receive:PokeMuxPokemonState.receive,rarity:PokeMuxGlobalMarket.rarity,grades:PokeMuxGlobalMarket.GRADES,focus:i=>focused=i,
        ivElement:tooltip,isIvEnabled:()=>enabled,sprite:()=> 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+a4V8AAAAASUVORK5CYII=',safeIcon:()=>'',
        calculateIv:(account,pokemon,cid)=>{calculated.push({account,pokemon,cid});return new Promise(resolve=>pending.push(resolve));},showIv:(account,result)=>shown.push({account,result}),hideIv(){},
        itemPrices:async()=>{quoteCalls++;return {ok:true,at:Date.now(),prices:{item:{GOLD:2500,DIAMONDS:2}}};},
        read:async i=>{reads++;return {ok:true,complete:true,cid:slots[i].cid,rows:[...Array.from({length:65},(_,n)=>({id:'duplicate-'+n,name:n===0?'<img onerror=alert(1)>':'Rhydon',kind:'pokemon',level:400,iv:n===1?175:129,quality:n===1?1.8:1.2,quantity:1})),{id:'item',kind:'item',name:'Poção',quantity:20}]};}});
      ui.open();await pause();const q=s=>document.querySelector(s), input=(s,v)=>{q(s).value=v;q(s).dispatchEvent(new Event('input'));};
      check(q('#inventoryDialog').open,'dialog opens');check(document.querySelectorAll('.inventory-account').length===4,'four separate account sections');check(reads===4,'one bag request per account');
      check(q('.inventory-row strong').textContent==='<img onerror=alert(1)>','names rendered as text');check(document.querySelectorAll('.inventory-picture img').length===240,'Pokemon have small images');check(document.querySelectorAll('.inventory-row').length===240,'large inventories paginated separately');
      const rects=[...document.querySelectorAll('.inventory-account')].map(x=>x.getBoundingClientRect());check(rects.every(x=>Math.abs(x.top-rects[0].top)<2) && rects[3].left>rects[2].left,'four accounts side by side');
      check(tooltip.parentNode===q('#inventoryDialog'),'IV tooltip is inside modal top layer');
      q('[data-category="item"]').click();check(document.querySelectorAll('.inventory-row').length===4 && q('[data-category="item"]').getAttribute('aria-pressed')==='true','category buttons filter every account');q('[data-category=""]').click();
      q('[data-category="item"]').click();check(q('.inventory-market-price').textContent.includes('2.500') && q('.inventory-market-price').textContent.includes('2/un.'),'market minima display below NPC row');check(quoteCalls===1,'four accounts share one quote request');q('[data-category=""]').click();
      q('[data-category="pokemon"]').click();check(q('.inventory-row > div > span').textContent.includes('IV 175'),'Pokemon default sort puts rarest and highest IV first');q('[data-category=""]').click();
      q('.inventory-pages button:last-child').click();check(q('.inventory-account').querySelectorAll('.inventory-row').length===6,'account pagination');
      input('[data-rarity]','Lendária');input('[data-min]','170');check(document.querySelectorAll('.inventory-row').length===4,'rarity and IV across four accounts');check(reads===4,'filters never request game');
      const pokeRows=[...document.querySelectorAll('.inventory-row')];pokeRows[0].click();pokeRows[1].click();check(calculated[1].account===1 && calculated[1].cid==='character1','IV uses Pokemon owner despite duplicate IDs');
      pending[0]({old:true});pending[1]({correct:true});await pause();check(shown.length===1 && shown[0].account===1,'delayed IV result for previous row discarded');
      pokeRows[2].dispatchEvent(new Event('focus'));input('[data-name]','poção');pending[2]({stale:true});await pause();check(shown.length===1,'filter hides and discards pending IV');
      input('[data-name]','');enabled=false;q('.inventory-row').click();check(calculated.length===3,'IV OFF prevents calculation');enabled=true;
      input('[data-account]','2');check(document.querySelectorAll('.inventory-account').length===1 && q('.inventory-account h3').textContent.includes('Citrino'),'account filter');
      q('[data-clear]').click();input('[data-name]','poção');check(document.querySelectorAll('.inventory-row').length===4,'item name filter');
      slots[0]={...slots[0],epoch:1};accounts[1].live=false;input('[data-name]','');check(q('.inventory-account').querySelectorAll('.inventory-row').length===0,'stale account generation hidden');
      accounts[2].live=false;input('[data-name]','');check(document.querySelectorAll('.inventory-account').length===2,'only connected accounts occupy columns');accounts[2].live=true;
      q('.inventory-account h3 button').click();check(focused===0 && !q('#inventoryDialog').open,'account link focuses owner and closes');
      await pause();check(tooltip.parentNode===document.body,'closing inventory restores shared tooltip to app');
      accounts[1].live=true;ui.open();await pause();input('[data-rarity]','Lendária');input('[data-min]','170');
      for(const [code,title,category,rarity] of [['en','Account inventories','Items','Legendary'],['es','Inventarios de las cuentas','Objetos','Legendaria'],['pt','Inventário das contas','Itens','Lendária']]){
        ui.close();language=code;ui.open();await pause();
        check(q('#inventoryTitle').textContent===title && q('[data-category="item"]').textContent.includes(category),'static inventory labels change to '+code);
        check(q('[data-rarity]').value==='Lendária' && q('[data-rarity] option[value="Lendária"]').textContent===rarity,'rarity translation preserves filter identity in '+code);
        check(q('.inventory-row > div > span').textContent.includes(rarity),'dynamic Pokemon rarity translated in '+code);
      }
      return 'Inventário Electron: colunas, categorias, imagens, IV por conta, respostas atrasadas, modal, filtros e paginação aprovados.';
    })()`));
    if(process.env.POKEMUX_INVENTORY_PREVIEW) {
      fs.writeFileSync(process.env.POKEMUX_INVENTORY_PREVIEW,(await win.webContents.capturePage()).toPNG());
      console.log('Preview saved: '+process.env.POKEMUX_INVENTORY_PREVIEW);
    }
  }catch(e){console.error(e);process.exitCode=1;}finally{win.destroy();app.exit(process.exitCode||0);}
});
