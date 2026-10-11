(function(root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.PokeMuxInventory = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function() {
  'use strict';
  async function readInGame(receive) {
    const P = window.__poke, character = () => P?.api?.['/api/characters/me']?.character;
    if (location.origin !== 'https://poke.idleworld.online' || location.pathname !== '/play' || !character()?.id || P.sock?.readyState !== 1) return { ok: false };
    const cid = String(character().id), socket = P.sock;
    // Refresh the bag through the game's socket; no market query or purchase.
    const complete = await new Promise(resolve => {
      const assembly = { ws: {} }, seen = new Set(); let timer, done = false;
      const finish = value => { if (done) return; done = true; clearTimeout(timer); socket.removeEventListener('message', listener); resolve(value); };
      const listener = event => {
        try {
          const message = receive(assembly, JSON.parse(event.data));
          if (!message || !['inventory', 'balls', 'pokes'].includes(message.type)) return;
          if (message.type === 'pokes' && !Array.isArray(message.list) || message.type === 'inventory' && !Array.isArray(message.items) || message.type === 'balls' && (!Array.isArray(message.catalog) || !message.counts)) return;
          if (P.sock !== socket || String(character()?.id || '') !== cid) { finish(false); return; }
          P.ws[message.type] = message; seen.add(message.type);
          if (seen.size === 3) finish(true);
        } catch {}
      };
      socket.addEventListener('message', listener); timer = setTimeout(() => finish(false), 2500);
      try { ['inv-get', 'balls-get', 'pokes-get'].forEach(type => socket.send(JSON.stringify({type}))); } catch { finish(false); }
    });
    if (P.sock !== socket || String(character()?.id || '') !== cid) return { ok: false };
    const ws = P.ws || {}, items = new Map((P.api['/game/items.json']?.items || []).map(x => [Number(x.id), x]));
    const num = v => { if (v == null || v === '') return null; const m = String(v).match(/[0-9]+([.,][0-9]+)?/); return m ? Number(m[0].replace(',', '.')) : null; };
    const rows = (ws.pokes?.list || []).map(p => ({ id: String(p.id), kind: 'pokemon', name: String(p.name || '#' + (p.speciesId || p.pokeId)), speciesId: Number(p.speciesId || p.pokeId), level: num(p.level), iv: num(p.ivTotal), ivTotal: num(p.ivTotal), quality: num(p.quality), shiny: !!p.shiny, team: !!p.team, quantity: 1, bound: !!p.bound, power: num(p.power), tms: p.tms,
      stats: { hp:p.stats?.hp ?? p.maxHp, atk:p.stats?.atk ?? p.atk, def:p.stats?.def ?? p.def, spAtk:p.stats?.spAtk ?? p.stats?.spa ?? p.spAtk ?? p.spa, spDef:p.stats?.spDef ?? p.stats?.spd ?? p.spDef ?? p.spd, speed:p.stats?.speed ?? p.speed } }));
    for (const item of ws.inventory?.items || []) if (Number(item.quantity) > 0) { const def = items.get(Number(item.itemId)) || {}; rows.push({ id: 'item:' + item.itemId, kind: 'item', name: String(def.name || '#' + item.itemId), icon:String(def.icon || def.iconUrl || ''), npcPrice:num(def.npcPrice), quantity: Number(item.quantity), category: String(def.category || 'Item'), bound: !!(item.bound || def.bound) }); }
    for (const ball of ws.balls?.catalog || []) { const quantity = Number(ws.balls.counts?.[ball.id]); if (quantity > 0) rows.push({ id: 'ball:' + ball.id, kind: 'ball', name: String(ball.name || '#' + ball.id), icon:String(ball.icon || ball.iconUrl || ''), quantity, infinite: !!ball.infinite, bound: !!ball.bound, expires: String(ws.balls.expires?.[ball.id] || '') }); }
    const diamonds = Number(P.api['/api/game/diamonds']?.diamonds ?? character().diamonds);
    if (diamonds > 0) rows.push({ id: 'diamonds', kind: 'item', name: 'Diamonds', icon:'/assets/market/diamonds.png', category: 'Moeda', quantity: diamonds });
    return { ok: true, cid, complete, rows };
  }
  function filterRows(rows, filters, rarity) {
    const normalize = value => String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLocaleLowerCase();
    const query = normalize(filters.name).trim();
    const min = filters.min == null || filters.min === '' ? null : Number(filters.min), max = filters.max == null || filters.max === '' ? null : Number(filters.max);
    return rows.filter(row => (!query || normalize(row.name).includes(query)) && (!filters.kind || row.kind === filters.kind)
      && (!filters.rarity || row.kind === 'pokemon' && row.quality != null && rarity(row.quality) === filters.rarity)
      && (min == null || row.kind === 'pokemon' && row.iv != null && row.iv >= min)
      && (max == null || row.kind === 'pokemon' && row.iv != null && row.iv <= max));
  }
  function sortRows(rows, kind, rarity, grades) {
    const ordered = [...rows];
    const descending = (a,b) => (Number.isFinite(b) ? b : -1) - (Number.isFinite(a) ? a : -1);
    const name = (a,b) => String(a.name || '').localeCompare(String(b.name || ''),'pt-BR') || String(a.id || '').localeCompare(String(b.id || ''));
    if(kind==='item') ordered.sort((a,b)=>descending(a.npcPrice,b.npcPrice) || name(a,b));
    if(kind==='pokemon') {
      const rank = row => row.quality == null ? -1 : grades.indexOf(rarity(row.quality));
      ordered.sort((a,b)=>rank(b)-rank(a) || descending(a.iv,b.iv) || name(a,b));
    }
    return ordered;
  }
  const INVENTORY_COPY={
  "Inventário das contas": {
    "en": "Account inventories",
    "es": "Inventarios de las cuentas"
  },
  "⟳ Atualizar": {
    "en": "⟳ Refresh",
    "es": "⟳ Actualizar"
  },
  "Fechar inventário": {
    "en": "Close inventory",
    "es": "Cerrar inventario"
  },
  "Nome do item/Pokémon": {
    "en": "Item/Pokémon name",
    "es": "Nombre del objeto/Pokémon"
  },
  "Buscar pelo nome": {
    "en": "Search by name",
    "es": "Buscar por nombre"
  },
  "Conta": {
    "en": "Account",
    "es": "Cuenta"
  },
  "Todas as contas": {
    "en": "All accounts",
    "es": "Todas las cuentas"
  },
  "Tipo": {
    "en": "Type",
    "es": "Tipo"
  },
  "Todos": {
    "en": "All",
    "es": "Todos"
  },
  "Itens": {
    "en": "Items",
    "es": "Objetos"
  },
  "Pokébolas": {
    "en": "Poké Balls",
    "es": "Poké Balls"
  },
  "Raridade": {
    "en": "Rarity",
    "es": "Rareza"
  },
  "Todas": {
    "en": "All",
    "es": "Todas"
  },
  "IV mínimo": {
    "en": "Minimum IV",
    "es": "IV mínimo"
  },
  "IV máximo": {
    "en": "Maximum IV",
    "es": "IV máximo"
  },
  "De": {
    "en": "From",
    "es": "Desde"
  },
  "Até": {
    "en": "To",
    "es": "Hasta"
  },
  "Limpar filtros": {
    "en": "Clear filters",
    "es": "Limpiar filtros"
  },
  "Categorias do inventário": {
    "en": "Inventory categories",
    "es": "Categorías del inventario"
  },
  "Tudo": {
    "en": "All",
    "es": "Todo"
  },
  "Mercado: ": {
    "en": "Market: ",
    "es": "Mercado: "
  },
  "Sem anúncio com preço disponível.": {
    "en": "No listing with an available price.",
    "es": "No hay anuncios con precio disponible."
  },
  "Consultando…": {
    "en": "Loading…",
    "es": "Consultando…"
  },
  "Preço indisponível.": {
    "en": "Price unavailable.",
    "es": "Precio no disponible."
  },
  "Menor preço unitário anunciado. Cotação de ": {
    "en": "Lowest advertised unit price. Quote at ",
    "es": "Menor precio unitario anunciado. Consulta a las "
  },
  "Menores preços unitários do mercado · Consulta de ": {
    "en": "Lowest market unit prices · Queried at ",
    "es": "Menores precios unitarios del mercado · Consulta a las "
  },
  " · Não foi possível atualizar; exibindo a última consulta.": {
    "en": " · Refresh failed; showing the last query.",
    "es": " · No se pudo actualizar; se muestra la última consulta."
  },
  " · Atualizando…": {
    "en": " · Refreshing…",
    "es": " · Actualizando…"
  },
  "Consultando os preços dos itens no Mercado Global…": {
    "en": "Loading item prices from the Global Market…",
    "es": "Consultando precios de objetos en el Mercado Global…"
  },
  "O jogo limitou as consultas do mercado. Aguarde antes de atualizar.": {
    "en": "The game limited market queries. Wait before refreshing.",
    "es": "El juego limitó las consultas del mercado. Espera antes de actualizar."
  },
  "Preços do mercado indisponíveis nesta consulta.": {
    "en": "Market prices unavailable for this query.",
    "es": "Precios del mercado no disponibles en esta consulta."
  },
  "IV: ON · Passe o mouse, selecione ou use Tab em um Pokémon para calcular seus IVs.": {
    "en": "IV: ON · Hover, select or Tab to a Pokémon to calculate its IVs.",
    "es": "IV: ON · Pasa el cursor, selecciona o usa Tab en un Pokémon para calcular sus IV."
  },
  "IV: OFF · Ative o cálculo de IV na barra superior para analisar os Pokémon.": {
    "en": "IV: OFF · Enable IV calculation in the top bar to analyze Pokémon.",
    "es": "IV: OFF · Activa el cálculo de IV en la barra superior para analizar Pokémon."
  },
  "Contas desconectadas: ": {
    "en": "Disconnected accounts: ",
    "es": "Cuentas desconectadas: "
  },
  "Conta ": {
    "en": "Account ",
    "es": "Cuenta "
  },
  "Conta desconectada. O inventário ficará disponível quando ela conectar.": {
    "en": "Account disconnected. Inventory will be available when it connects.",
    "es": "Cuenta desconectada. El inventario estará disponible cuando se conecte."
  },
  "Atualizando inventário…": {
    "en": "Refreshing inventory…",
    "es": "Actualizando inventario…"
  },
  "Não foi possível ler o inventário. Tente atualizar.": {
    "en": "Could not read inventory. Try refreshing.",
    "es": "No se pudo leer el inventario. Intenta actualizar."
  },
  " resultados": {
    "en": " results",
    "es": " resultados"
  },
  "Dados lidos às ": {
    "en": "Data read at ",
    "es": "Datos leídos a las "
  },
  " · A última atualização falhou.": {
    "en": " · The last refresh failed.",
    "es": " · La última actualización falló."
  },
  "Inventário parcial: alguns dados ainda não foram recebidos. Atualize para conferir.": {
    "en": "Partial inventory: some data has not arrived. Refresh to check.",
    "es": "Inventario parcial: faltan datos. Actualiza para comprobar."
  },
  "Nenhum item ou Pokémon corresponde aos filtros.": {
    "en": "No item or Pokémon matches the filters.",
    "es": "Ningún objeto o Pokémon coincide con los filtros."
  },
  "Nível ": {
    "en": "Level ",
    "es": "Nivel "
  },
  "Raridade desconhecida": {
    "en": "Unknown rarity",
    "es": "Rareza desconocida"
  },
  "Pokébola": {
    "en": "Poké Ball",
    "es": "Poké Ball"
  },
  "Item": {
    "en": "Item",
    "es": "Objeto"
  },
  " · Vinculado": {
    "en": " · Bound",
    "es": " · Vinculado"
  },
  " · Infinita": {
    "en": " · Infinite",
    "es": " · Infinita"
  },
  " · Validade: ": {
    "en": " · Expires: ",
    "es": " · Caducidad: "
  },
  " · Calcular IV": {
    "en": " · Calculate IV",
    "es": " · Calcular IV"
  },
  "Conecte uma conta ao jogo para consultar seu inventário.": {
    "en": "Connect an account to the game to view its inventory.",
    "es": "Conecta una cuenta al juego para consultar su inventario."
  }
};
  Object.assign(INVENTORY_COPY,Object.fromEntries(['Fraca','Comum','Incomum','Rara','Épica','Lendária','Mítica','Anciã','Divina'].map((pt,i)=>[pt,{en:['Weak','Common','Uncommon','Rare','Epic','Legendary','Mythic','Ancient','Divine'][i],es:['Débil','Común','Poco común','Rara','Épica','Legendaria','Mítica','Ancestral','Divina'][i]}])));
  function translate(text,lang) {return INVENTORY_COPY[text]?.[lang] ?? text;}
  function mount(bridge) {
    const locale=()=>bridge.language?.()==='en'?'en-US':bridge.language?.()==='es'?'es-ES':'pt-BR';
    const L=text=>translate(text,bridge.language?.());
    const dialog = document.createElement('dialog'); dialog.id = 'inventoryDialog'; dialog.setAttribute('aria-labelledby', 'inventoryTitle');
    dialog.innerHTML = `<header><h2 id="inventoryTitle">${L("Inventário das contas")}</h2><button data-refresh>${L("⟳ Atualizar")}</button><button data-close aria-label="${L("Fechar inventário")}">✕</button></header><div class="inventory-filters"><label>${L("Nome do item/Pokémon")}<input data-name type="search" placeholder="${L("Buscar pelo nome")}"></label><label>${L("Conta")}<select data-account><option value="">${L("Todas as contas")}</option></select></label><label>${L("Tipo")}<select data-kind><option value="">${L("Todos")}</option><option value="pokemon">Pokémon</option><option value="item">${L("Itens")}</option><option value="ball">${L("Pokébolas")}</option></select></label><label>${L("Raridade")}<select data-rarity><option value="">${L("Todas")}</option></select></label><label>${L("IV mínimo")}<input data-min type="number" min="0" max="192" placeholder="${L("De")}"></label><label>${L("IV máximo")}<input data-max type="number" min="0" max="192" placeholder="${L("Até")}"></label><button data-clear>${L("Limpar filtros")}</button></div><div class="inventory-groups"></div>`;
    const kindSelect = dialog.querySelector('[data-kind]');
    kindSelect.closest('label').hidden = true;
    const categories = document.createElement('nav'); categories.className = 'inventory-categories'; categories.setAttribute('aria-label',L("Categorias do inventário"));
    for(const [value,label,icon] of [['',L("Tudo"),'🎒'],['pokemon','Pokémon','🐾'],['ball',L("Pokébolas"),'🔴'],['item',L("Itens"),'🧪']]) {
      const button = document.createElement('button');button.type='button';button.dataset.category=value;
      const image=document.createElement('span'); image.textContent=icon; image.setAttribute('aria-hidden','true');
      if(value==='ball') {image.textContent='';image.className='inventory-ball-icon';}
      button.append(image,document.createTextNode(label));button.onclick=()=>{kindSelect.value=value;pages.clear();render();};categories.append(button);
    }
    dialog.querySelector('.inventory-filters').before(categories);
    const ivHint=document.createElement('p');ivHint.className='inventory-iv-hint';categories.after(ivHint);
    const disconnected=document.createElement('p');disconnected.className='inventory-disconnected';dialog.querySelector('.inventory-groups').before(disconnected);
    const marketNotice=document.createElement('p');marketNotice.className='inventory-market-note';marketNotice.hidden=!bridge.itemPrices;disconnected.before(marketNotice);
    const staticLabels=[];
    const walker=document.createTreeWalker(dialog,NodeFilter.SHOW_TEXT);
    while(walker.nextNode()){const node=walker.currentNode,key=Object.keys(INVENTORY_COPY).find(pt=>L(pt)===node.textContent);if(key)staticLabels.push(()=>{node.textContent=L(key);});}
    for(const node of dialog.querySelectorAll('[placeholder],[aria-label]'))for(const attr of ['placeholder','aria-label']){const value=node.getAttribute(attr),key=Object.keys(INVENTORY_COPY).find(pt=>L(pt)===value);if(key)staticLabels.push(()=>node.setAttribute(attr,L(key)));}
    document.body.append(dialog);
    const q = x => dialog.querySelector(x), cache = new Map(), pages = new Map(), PAGE = 60;
    let generation = 0, busy = false, ivRevision=0, ivTarget=null, ivResult=null, ivPoint=null;
    let marketPrices=null, marketPending=false, marketFailure='', marketJob=null;
    const tooltipParent = bridge.ivElement?.parentNode, tooltipNext = bridge.ivElement?.nextSibling;
    const same = (a,b) => a && b && a.view === b.view && a.email === b.email && a.cid === b.cid && a.epoch === b.epoch && !b.off;
    const el = (tag, text, cls) => { const node = document.createElement(tag); if(text != null) node.textContent = String(text); if(cls) node.className = cls; return node; };
    function hideIv() {ivRevision++;ivTarget=null;ivResult=null;ivPoint=null;bridge.hideIv?.();}
    function finishClose() {generation++;busy=false;hideIv();q('[data-refresh]').disabled=false;if(tooltipParent && bridge.ivElement)tooltipParent.insertBefore(bridge.ivElement,tooltipNext?.parentNode===tooltipParent ? tooltipNext : null);}
    function close() {finishClose();dialog.close();}
    function paintPrices() {
      const nf=value=>Number(value).toLocaleString(locale(),{maximumFractionDigits:4});
      dialog.querySelectorAll('[data-market-item]').forEach(line=>{
        const quote=marketPrices?.prices?.[line.dataset.marketItem], values=[];
        if(quote?.GOLD!=null)values.push('$ '+nf(quote.GOLD)+'/un.');
        if(quote?.DIAMONDS!=null)values.push('💎 '+nf(quote.DIAMONDS)+'/un.');
        line.textContent=L("Mercado: ")+(values.length ? values.join(' · ') : marketPrices?.prices ? L("Sem anúncio com preço disponível.") : marketPending ? L("Consultando…") : L("Preço indisponível."));
        line.title=marketPrices?.at ? L("Menor preço unitário anunciado. Cotação de ")+new Date(marketPrices.at).toLocaleTimeString(locale()) : '';
      });
      marketNotice.textContent=marketPrices?.at ? L("Menores preços unitários do mercado · Consulta de ")+new Date(marketPrices.at).toLocaleTimeString(locale())+(marketFailure?L(" · Não foi possível atualizar; exibindo a última consulta."):marketPending?L(" · Atualizando…"):'') : marketPending ? L("Consultando os preços dos itens no Mercado Global…") : marketFailure==='limited' ? L("O jogo limitou as consultas do mercado. Aguarde antes de atualizar.") : marketFailure ? L("Preços do mercado indisponíveis nesta consulta.") : '';
    }
    function updatePrices() {
      if(!bridge.itemPrices || marketJob)return;
      marketPending=true;paintPrices();
      marketJob=Promise.resolve().then(()=>bridge.itemPrices()).then(response=>{
        marketFailure=response?.ok ? '' : response?.reason || 'network';
        if(response?.prices)marketPrices=response;
      }).catch(()=>{marketFailure='network';}).finally(()=>{marketPending=false;marketJob=null;if(dialog.open)paintPrices();});
    }
    async function inspect(item,row,index,entry,event) {
      if(!bridge.calculateIv || !bridge.isIvEnabled?.() || !dialog.open || !same(entry.slot,bridge.slot(index))) {hideIv();return;}
      const bounds=item.getBoundingClientRect(),point=event && event.type!=='focus' && event.detail!==0 && Number.isFinite(event.clientX) ? {x:event.clientX,y:event.clientY} : {x:bounds.left+Math.min(bounds.width/2,100),y:bounds.top+bounds.height/2};
      ivPoint=point;
      if(ivTarget===item) {if(ivResult)bridge.showIv?.(index,ivResult,point);return;}
      hideIv();ivTarget=item;ivPoint=point;const revision=ivRevision;
      try {const result=await bridge.calculateIv(index,row,entry.data.cid);
        if(revision!==ivRevision || !dialog.open || !item.isConnected || !same(entry.slot,bridge.slot(index)) || !bridge.isIvEnabled?.())return;
        ivResult=result;if(result)bridge.showIv?.(index,result,ivPoint);
      }catch{if(revision===ivRevision)hideIv();}
    }
    for (const grade of bridge.grades) {const option=new Option(L(grade),grade);q('[data-rarity]').append(option);staticLabels.push(()=>{option.textContent=L(grade);});}
    function render() {
      hideIv();
      const accounts = bridge.accounts(), filters = { name:q('[data-name]').value, kind:q('[data-kind]').value, rarity:q('[data-rarity]').value, min:q('[data-min]').value, max:q('[data-max]').value }, selected = q('[data-account]').value;
      const groups = q('.inventory-groups'), scroll = groups.scrollLeft, scrolls = new Map([...groups.querySelectorAll('.inventory-list')].map(list=>[list.dataset.account,list.scrollTop])); groups.replaceChildren();
      categories.querySelectorAll('button').forEach(button=>{const active=button.dataset.category===filters.kind;button.classList.toggle('active',active);button.setAttribute('aria-pressed',String(active));});
      ivHint.textContent=bridge.isIvEnabled?.() ? L("IV: ON · Passe o mouse, selecione ou use Tab em um Pokémon para calcular seus IVs.") : L("IV: OFF · Ative o cálculo de IV na barra superior para analisar os Pokémon.");
      const offline=accounts.filter(account=>account.off || !account.live);
      disconnected.textContent=offline.length ? L("Contas desconectadas: ")+offline.map(account=>account.name).join(', ') : '';disconnected.hidden=!offline.length;
      let columns=0;
      accounts.forEach((account,i) => {
        if (selected !== '' && Number(selected) !== i) return;
        if(selected==='' && (account.off || !account.live))return;
        columns++;
        const section = el('section',null,'inventory-account'), head = el('h3'), link = el('button',account.name || L("Conta ")+(i+1));
        link.onclick = () => { close(); bridge.focus(i); }; head.append(link); section.append(head);
        const entry = cache.get(i), valid = entry && same(entry.slot,bridge.slot(i));
        if(account.off || !account.live || !valid) { section.append(el('p',account.off || !account.live ? L("Conta desconectada. O inventário ficará disponível quando ela conectar.") : busy ? L("Atualizando inventário…") : L("Não foi possível ler o inventário. Tente atualizar."),'inventory-note')); groups.append(section); return; }
        const rows = sortRows(filterRows(entry.data.rows,filters,bridge.rarity),filters.kind,bridge.rarity,bridge.grades), total = Math.max(1,Math.ceil(rows.length/PAGE)), page = Math.min(pages.get(i)||0,total-1); pages.set(i,page);
        head.append(el('span',rows.length+L(" resultados"),'inventory-note'));
        section.append(el('p',L("Dados lidos às ")+new Date(entry.at).toLocaleTimeString(locale())+(entry.failed?L(" · A última atualização falhou."):'') ,'inventory-note'));
        if(!entry.data.complete) section.append(el('p',L("Inventário parcial: alguns dados ainda não foram recebidos. Atualize para conferir."),'inventory-note'));
        if(!rows.length) section.append(el('p',L("Nenhum item ou Pokémon corresponde aos filtros."),'inventory-note'));
        const list = el('div',null,'inventory-list');list.dataset.account=String(i);
        for (const row of rows.slice(page*PAGE,(page+1)*PAGE)) {
          const item = el('div',null,'inventory-row'), name = el('strong',row.name+(row.shiny?' ✨':'')+(row.team?' ★':'')), info = el('span',row.kind === 'pokemon' ? L("Nível ")+(row.level??'—')+' · IV '+(row.iv??'—')+' · '+(row.quality == null ? L("Raridade desconhecida") : L(bridge.rarity(row.quality))+' · Q '+row.quality) : (row.kind === 'ball' ? L("Pokébola") : row.category || L("Item")));
          if(row.bound) info.append(L(" · Vinculado")); if(row.infinite) info.append(L(" · Infinita")); if(row.expires) info.append(L(" · Validade: ")+row.expires);
          if(row.kind==='item' && row.npcPrice != null) info.append(' · NPC: $ '+Number(row.npcPrice).toLocaleString(locale())+'/un.');
          const picture=el('span',null,'inventory-picture'),placeholder=el('span',row.kind==='pokemon'?'🐾':row.kind==='ball'?'🔴':row.id==='diamonds'?'💎':'📦');placeholder.setAttribute('aria-hidden','true');picture.append(placeholder);
          const url=row.kind==='pokemon' ? bridge.sprite?.(row.speciesId,row.shiny) : bridge.safeIcon?.(row.icon);
          if(url) {const image=el('img');image.alt='';image.loading='lazy';image.decoding='async';image.onload=()=>placeholder.hidden=true;image.onerror=()=>{image.remove();placeholder.hidden=false;};image.src=url;picture.append(image);}
          const detail=el('div'); detail.append(name,info);
          if(row.kind==='item' && bridge.itemPrices) {const priceLine=el('span',null,'inventory-market-price');priceLine.dataset.marketItem=row.id;detail.append(priceLine);}
          detail.append(el('small','#'+row.id)); item.append(picture,detail,el('b',row.infinite?'∞':'× '+row.quantity)); list.append(item);
          if(row.kind==='pokemon') {
            item.tabIndex=0;item.setAttribute('role','button');item.setAttribute('aria-label',row.name+' · '+accounts[i].name+L(" · Calcular IV"));
            for(const type of ['mouseenter','focus','click'])item.addEventListener(type,event=>inspect(item,row,i,entry,event));
            item.addEventListener('mousemove',event=>{if(ivTarget===item) {if(!same(entry.slot,bridge.slot(i))) {hideIv();return;}ivPoint={x:event.clientX,y:event.clientY};if(ivResult && bridge.isIvEnabled?.())bridge.showIv?.(i,ivResult,ivPoint);else if(!bridge.isIvEnabled?.())hideIv();}});
            item.addEventListener('mouseleave',hideIv);item.addEventListener('blur',hideIv);
            item.addEventListener('keydown',event=>{if(event.key==='Enter'||event.key===' ') {event.preventDefault();inspect(item,row,i,entry,event);}});
          }
        }
        section.append(list);
        list.scrollTop=scrolls.get(String(i)) || 0;
        if(total > 1) { const nav=el('div',null,'inventory-pages'); for(const [label,delta] of [['‹',-1],['›',1]]) { const button=el('button',label); button.disabled=delta<0?page===0:page===total-1; button.onclick=()=>{pages.set(i,page+delta);render();}; nav.append(button); if(delta<0)nav.append(el('span',(page+1)+' / '+total)); } section.append(nav); }
        groups.append(section);
      });
      if(!columns)groups.append(el('p',L("Conecte uma conta ao jogo para consultar seu inventário."),'inventory-note'));
      groups.style.setProperty('--inventory-columns',Math.max(1,columns));groups.scrollLeft=scroll;
      groups.querySelectorAll('.inventory-list').forEach(list=>list.scrollTop=scrolls.get(list.dataset.account)||0);
      paintPrices();
    }
    async function refresh() {
      const run=++generation; busy=true;q('[data-refresh]').disabled=true;render();
      updatePrices();
      await Promise.all(bridge.accounts().map(async(account,i)=>{
        const slot=bridge.slot(i); if(account.off || !account.live || slot.off) {cache.delete(i);return;}
        try { const data=await bridge.read(i,'('+readInGame.toString()+')('+bridge.receive.toString()+')');
          if(run===generation && same(slot,bridge.slot(i))) {
            if(data?.ok && (!slot.cid || slot.cid===data.cid)) cache.set(i,{slot:bridge.slot(i),data,at:Date.now()});
            else if(cache.has(i)) cache.get(i).failed=true;
          }
        } catch {if(run===generation && cache.has(i))cache.get(i).failed=true;}
      }));
      if(run!==generation)return;busy=false;q('[data-refresh]').disabled=false;if(dialog.open)render();
    }
    function open() {
      staticLabels.forEach(update=>update());
      const selected=q('[data-account]').value;q('[data-account]').replaceChildren(new Option(L("Todas as contas"),''));
      bridge.accounts().forEach((account,i)=>q('[data-account]').append(new Option(account.name || L("Conta ")+(i+1),String(i))));q('[data-account]').value=selected;
      if(!dialog.open) {if(bridge.ivElement)dialog.append(bridge.ivElement);dialog.showModal();} render(); refresh();
    }
    q('[data-close]').onclick=close;q('[data-refresh]').onclick=refresh;
    dialog.addEventListener('close',()=>{if(!dialog.open)finishClose();});
    dialog.addEventListener('cancel',event=>{event.preventDefault();close();});
    dialog.addEventListener('scroll',hideIv,true);
    dialog.querySelectorAll('input,select').forEach(input=>input.addEventListener('input',()=>{pages.clear();render();}));
    q('[data-clear]').onclick=()=>{dialog.querySelectorAll('input,select').forEach(input=>input.value='');pages.clear();render();};
    return {open,close};
  }
  return {mount,readInGame,filterRows,sortRows,translate};
});
