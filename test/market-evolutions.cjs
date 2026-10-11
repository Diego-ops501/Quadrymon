const { app, BrowserWindow } = require('electron');
const fs = require('node:fs'), path = require('node:path'), os = require('node:os');
app.setPath('userData', path.join(os.tmpdir(), 'pokemux-evolutions-' + process.pid));
app.whenReady().then(async () => {
  const win = new BrowserWindow({ show: false, webPreferences: { backgroundThrottling: false } });
  try {
    for (const scenario of ['cold', 'warm', 'cold-no-catalog', 'warm-no-catalog', 'catalog-only']) {
      const cached = scenario.startsWith('warm'), omitCatalog = scenario.includes('no-catalog');
      await win.loadURL('data:text/html,<button id="marketBtn">Market</button>');
      for (const file of ['src/domain/pokemon-state.js', 'src/domain/global-market.js', 'src/renderer/global-market.js']) {
        await win.webContents.executeJavaScript(fs.readFileSync(path.join(__dirname, '..', file), 'utf8'));
      }
      await win.webContents.insertCSS(fs.readFileSync(path.join(__dirname, '..', 'src/renderer/global-market.css'), 'utf8'));
      console.log(await win.webContents.executeJavaScript(`(async () => {
        const cached = ${cached}, omitCatalog = ${omitCatalog}, catalogOnly = ${scenario === 'catalog-only'}, M = PokeMuxGlobalMarket;
        const check = (value, message) => { if (!value) throw Error(message); };
        const pause = ms => new Promise(resolve => setTimeout(resolve, ms));
        const catalog = [{speciesId:246,name:'Larvitar',evolvesToId:247},{speciesId:247,name:'Pupitar',evolvesToId:248},{speciesId:248,name:'Tyranitar'},{speciesId:63,name:'Abra'},{speciesId:147,name:'Dratini'},{speciesId:50147,name:'Nightmare Dratini'}];
        catalog.push({speciesId:148,name:'Dragonair'},{speciesId:13148,name:'Ancient Dragonair'},{speciesId:14148,name:'Orre Dragonair'},{speciesId:15148,name:'Brave Dragonair'});
        const listings = catalog.map((x,i) => ({...x,id:String(x.speciesId),kind:'pokemon',shiny:true,ivTotal:170,level:30,quality:1.5,type1:'ROCK',currency:'GOLD',price:(i+1)*10000}));
        listings.push({...listings[0],id:'low-iv',ivTotal:100},{...listings[2],id:'normal',shiny:false});
        listings.push({...listings[4],id:'dratini-level-1',name:'Dratini Lv.1'}, {...listings[4],id:'dratini-level-400',name:'Dratini Lvl 400'}, {...listings[5],id:'nightmare-level',name:'Nightmare Dratini Lv.30'});
        const reads = [];
        window.PokeMuxMarketAlerts = {normalize:x=>x,create:()=>({setRules(){},stop(){},state(){}})};
        const ui = PokeMuxMarketUI.mount({marketReaderOptions:{interval:0,ttl:0},marketSnapshotOptions:{enabled:cached,background:false},
          load:key=>catalogOnly && key==='gameSearchCatalog'?JSON.stringify({version:1,entries:[{kind:'pokemon',speciesId:715,name:'Noivern'},{kind:'item',refId:1,name:'Potion',icon:'/assets/items/potion.png'}]}):'',save(){},language:()=> 'pt',sprite:id=>'https://poke.idleworld.online/assets/pokemon/'+id+'.png',preferred:()=>0,rememberFocus(){},
          accounts:async()=>[{cid:'c1',name:'Tester',live:true,off:false,focused:true}],
          read:async(_account,script)=>{
            if(catalogOnly) { reads.push('pending');return new Promise(()=>{}); }
            const q=JSON.parse(script.match(/\\}\\)\\((\\{[^\\n]*?\\}),/)[1]);reads.push(q);
            let rows = q.browse ? M.filterListings(listings,{...q,pokemonOnly:true,shiny:q.shiny==='1',gradesOff:q.gradesOff?.split(',')||[]}) : [{id:'quote',kind:'diamonds',currency:'GOLD',price:10000,quantity:1}];
            if(q.speciesId)rows=rows.filter(x=>x.speciesId===Number(q.speciesId));
            if(q.currency)rows=rows.filter(x=>x.currency===q.currency);
            return {ok:true,data:{cid:'c1',listings:rows,total:rows.length,pages:1,alertCatalog:omitCatalog?[]:catalog,catalog:{items:[{kind:'item',refId:1,name:'Potion',icon:'/assets/items/potion.png'}],balls:[{kind:'ball',refId:1,name:'Poke Ball',icon:'/assets/balls/poke_ball.png'}]}}};
          }});
        if(cached)await ui.warmCache();
        const el=selector=>document.querySelector(selector);
        await ui.open();await pause(50);el('[data-category="Pokemon"]').click();await pause(50);
        if(catalogOnly) {
          el('#mkSearch').focus();el('#mkSearch').value='noiv';el('#mkSearch').dispatchEvent(new Event('input',{bubbles:true}));
          check(!el('#mkSearchSuggestions').hidden && el('[data-search-option="0"]').textContent==='Noivern' && el('[data-search-option="0"] img'),'complete cached Pokemon catalog works while shop is blocked');
          el('[data-category="Items"]').click();el('#mkSearch').focus();el('#mkSearch').value='pot';el('#mkSearch').dispatchEvent(new Event('input',{bubbles:true}));
          check(!el('#mkSearchSuggestions').hidden && el('[data-search-option="0"]').textContent==='Potion','complete cached item catalog works while shop is blocked');
          ui.close();return 'ok independent game catalog suggestions with all shop requests blocked';
        }
        const checkbox=el('#mkIncludeEvolutions');
        check(!checkbox.disabled && checkbox.getBoundingClientRect().width>0,'evolution checkbox visible and enabled in Pokemon search');
        el('#mkSearch').focus();el('#mkSearch').value='pup';el('#mkSearch').dispatchEvent(new Event('input',{bubbles:true}));
        check(!el('#mkSearchSuggestions').hidden && el('[data-search-option="0"]').textContent==='Pupitar' && el('[data-search-option="0"] img'),'typing shows Pokemon image and name immediately');
        el('#mkSearch').dispatchEvent(new KeyboardEvent('keydown',{key:'ArrowDown',bubbles:true}));
        check(el('#mkSearch').getAttribute('aria-activedescendant')==='mkSearchOption0','keyboard highlights suggestion');
        el('#mkSearch').dispatchEvent(new KeyboardEvent('keydown',{key:'Enter',bubbles:true}));
        check(el('#mkSearch').value==='Pupitar' && el('#mkSearchSuggestions').hidden,'Enter selects name and dismisses suggestions');
        if(omitCatalog) {
          await pause(cached?30:800);
          el('#mkSearch').value='a';el('#mkSearch').dispatchEvent(new Event('input',{bubbles:true}));await pause(cached?30:800);
          check(!el('#mkSearchSuggestions').hidden && el('#mkSearchSuggestions img'),'Pokemon suggestions survive missing species catalog and query refresh');
          ui.close();return 'ok Pokemon suggestions without species catalog ('+(cached?'warm cache':'cold cache')+')';
        }
        el('#mkSearch').value='Pupitar';el('#mkSearch').dispatchEvent(new Event('input',{bubbles:true}));await pause(cached?30:800);
        check(el('[data-listing="247"]') && !el('[data-listing="246"]'),'unchecked search shows only Pupitar');
        el('#mkIvMin').value='150';el('#mkIvMin').dispatchEvent(new Event('input',{bubbles:true}));
        el('#mkShiny').click();await pause(cached?30:800);
        const before=reads.length;
        checkbox.checked=true;checkbox.dispatchEvent(new Event('change',{bubbles:true}));await pause(cached?30:800);
        check(['246','247','248'].every(id=>el('[data-listing="'+id+'"]')),'Pupitar includes Larvitar and Tyranitar');
        check(!el('[data-listing="63"]') && !el('[data-listing="low-iv"]') && !el('[data-listing="normal"]'),'family search respects name, IV and shiny filters');
        check(checkbox.checked && el('#mkSearch').value==='Pupitar' && el('#mkIvMin').value==='150','controls preserved');
        check(!el('.mk-iv-hint') && !el('.mk-crumb').textContent.includes('→'),'IV notice and family names removed');
        if(cached)check(reads.length===before,'warm family search filters locally');
        el('#mkSort').value='price-asc';el('#mkSort').dispatchEvent(new Event('change'));await pause(cached?30:800);
        check(['246','247','248'].every(id=>el('[data-listing="'+id+'"]')),'price sort preserves entire evolution family');
        checkbox.checked=false;checkbox.dispatchEvent(new Event('change',{bubbles:true}));await pause(cached?30:800);
        check(el('[data-listing="247"]') && !el('[data-listing="246"]') && !el('[data-listing="248"]'),'unchecking restores exact name search');
        el('#mkClear').click();await pause(cached?30:800);
        check(!checkbox.checked && el('#mkSearch').value==='','clear resets evolution and name filters');
        el('[data-category="Items"]').click();await pause(80);
        el('#mkSearch').focus();el('#mkSearch').value='po';el('#mkSearch').dispatchEvent(new Event('input',{bubbles:true}));
        check(!el('#mkSearchSuggestions').hidden && el('[data-search-option="0"]').textContent==='Potion' && el('[data-search-option="0"] img'),'item suggestions show icon and respect category');
        el('[data-search-option="0"]').click();check(el('#mkSearch').value==='Potion' && el('#mkSearchSuggestions').hidden,'click selects item');
        el('#mkSearch').value='po';el('#mkSearch').dispatchEvent(new Event('input',{bubbles:true}));
        el('#mkSearch').dispatchEvent(new KeyboardEvent('keydown',{key:'Escape',bubbles:true}));
        check(ui.isOpen() && el('#mkSearchSuggestions').hidden,'Escape dismisses suggestions without closing market');
        el('[data-category="Pokemon"]').click();await pause(80);
        el('#mkSearch').focus();el('#mkSearch').value='drat';el('#mkSearch').dispatchEvent(new Event('input',{bubbles:true}));
        check(el('#mkSearchSuggestions').querySelectorAll('[data-search-option]').length===1 && el('[data-search-option="0"]').textContent==='Dratini','Nightmare is grouped into base Pokemon suggestion');
        el('[data-search-option="0"]').click();await pause(cached?30:800);
        check(el('[data-listing="147"]') && el('[data-listing="50147"]'),'base suggestion searches both regular and Nightmare listings');
        el('#mkSearch').value='dragonair';el('#mkSearch').dispatchEvent(new Event('input',{bubbles:true}));
        check(el('#mkSearchSuggestions').querySelectorAll('[data-search-option]').length===1 && el('[data-search-option="0"]').textContent==='Dragonair','Ancient, Orre and Brave are grouped with the base Pokemon');
        el('[data-search-option="0"]').click();await pause(cached?30:800);
        check(['148','13148','14148','15148'].every(id=>el('[data-listing="'+id+'"]')),'one base search includes all game variants');
        ui.close();return 'ok market-evolutions UI: visible checkbox, concise status, filters, price sorting and unchecking ('+(cached?'warm cache':'cold cache')+')';
      })()`));
    }
    win.destroy(); app.exit(0);
  } catch (error) { console.error(error); win.destroy(); app.exit(1); }
});
