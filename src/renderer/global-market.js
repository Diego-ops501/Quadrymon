(function (root) {
  'use strict';
  const M = root.PokeMuxGlobalMarket;
  const GAME = 'https://poke.idleworld.online';
  const COLORS = ['#9aa6b3', '#63d873', '#7fd4ff', '#b06cff', '#f0c040', '#ff8c3c', '#b98ee9', '#b8860b', '#dbefff'];
  const PT = {
    title: 'MERCADO GLOBAL', button: '🏪 Mercado', subtitle: 'Consulte preços e Pokémon sem sair da hunt.', account: 'Conta', close: 'Fechar', refresh: 'Atualizar mercado',
    buy: 'Comprar', sell: 'Anunciar', mine: 'Meus Anúncios', requests: 'Solicitações', history: 'Histórico', blacklist: 'Ignorados',
    All: 'Todos', Items: 'Itens', Stones: 'Stones', 'Poke Balls': 'Poké Balls', Diamonds: 'Diamonds', Pokemon: 'Pokémon',
    search: 'Buscar anúncio', recent: 'Mais recentes', 'price-asc': 'Menor preço', 'price-desc': 'Maior preço', 'iv-desc': 'Maior IV', 'power-desc': 'Maior poder', 'level-desc': 'Maior nível', 'quality-desc': 'Maior qualidade',
    cards: '▦ Cards', rows: '≡ Linhas', clear: 'Limpar', shiny: '✨ Só shiny', level: 'Nível', from: 'De', to: 'Até', allTypes: 'Todos os tipos',
    back: '← Todas as espécies', allPokemon: 'Todos os Pokémon', ads: 'anúncios', starting: 'a partir de', results: 'RESULTADOS DO MERCADO',
    name: 'Nome', info: 'Info', price: 'Preço unitário', details: 'DETALHES DO ANÚNCIO', select: 'Selecione um anúncio para ver os detalhes.',
    quantity: 'Quantidade', quality: 'Raridade', power: 'Poder', types: 'Tipos', stats: 'ATRIBUTOS', hp: 'HP', atk: 'Atq', def: 'Def', spAtk: 'Atq. Esp.', spDef: 'Def. Esp.', speed: 'Veloc.',
    item: 'Item', ball: 'Poké Ball', pokemon: 'Pokémon', diamonds: 'Diamonds', sellers: 'vendedores', offerOnly: 'Somente ofertas', tm: 'TM aplicada', offers: 'Possui propostas',
    loading: 'Consultando o mercado…', empty: 'Nenhum resultado encontrado.', readOnly: 'Modo consulta · compras, anúncios e negociações são feitos no mercado do jogo.',
    window: 'Em Todos aparecem só os {n} anúncios de Pokémon mais recentes. A aba Pokémon mostra todos.', goPokemon: 'Abrir aba Pokémon',
    showing: 'Mostrando {from}–{to} de {total} resultados', updated: 'Atualizado às {time}', page: 'Página', of: 'de',
    offline: 'Selecione uma conta conectada ao jogo.', auth: 'A sessão ainda não está pronta. Aguarde o jogo carregar e clique em Atualizar.',
    denied: 'O jogo não autorizou esta consulta. Verifique as condições de acesso ao mercado na conta selecionada.',
    email: 'Confirme seu e-mail pelo próprio jogo para acessar o mercado.', limited: 'O jogo limitou as consultas. Consultas pausadas por pelo menos 1 minuto (ou pelo prazo informado pelo jogo). As páginas recebidas são reaproveitadas ao tentar novamente.',
    timeout: 'A consulta demorou demais. Clique em Atualizar para tentar novamente.', network: 'Não foi possível consultar o mercado. Verifique a conexão.',
    server: 'O mercado está indisponível ou retornou uma resposta inesperada.', changed: 'A conta ou o personagem mudou. Selecione novamente a conta.',
    itemsSection: 'ITENS, POKÉ BALLS E DIAMONDS', pokemonSection: 'POKÉMON', owned: 'Itens disponíveis na conta', searchItem: 'Buscar item', searchPokemon: 'Buscar Pokémon',
    selected: 'Selecionado', chooseItem: 'Selecione um item', choosePokemon: 'Selecione um Pokémon', currency: 'Moeda', total: 'Total', fee: 'Taxa estimada',
    announce: 'Anunciar no jogo', requestCreate: 'CRIAR SOLICITAÇÃO DE COMPRA', requestChoose: 'O que deseja comprar?', requestPrice: 'Preço por unidade',
    yourRequests: 'SUAS SOLICITAÇÕES', openRequests: 'SOLICITAÇÕES ABERTAS', bought: 'Comprou', sold: 'Vendeu', ignored: 'Jogadores ignorados',
    ignoreLabel: 'Ignorar jogador (bloqueia suas ofertas)', trainer: 'Nome do treinador', add: 'Adicionar no jogo', preview: 'Prévia de anúncio',
    TYPE_NORMAL: 'Normal', TYPE_FIRE: 'Fogo', TYPE_WATER: 'Água', TYPE_ELECTRIC: 'Elétrico', TYPE_GRASS: 'Grama', TYPE_ICE: 'Gelo', TYPE_FIGHTING: 'Lutador', TYPE_POISON: 'Veneno', TYPE_GROUND: 'Terra', TYPE_FLYING: 'Voador', TYPE_PSYCHIC: 'Psíquico', TYPE_BUG: 'Inseto', TYPE_ROCK: 'Pedra', TYPE_GHOST: 'Fantasma', TYPE_DRAGON: 'Dragão', TYPE_DARK: 'Sombrio', TYPE_STEEL: 'Aço', TYPE_FAIRY: 'Fada'
  };
  const EN = { title: 'GLOBAL MARKET', button: '🏪 Market', subtitle: 'Check prices and Pokémon while staying in your hunt.', account: 'Account', close: 'Close', refresh: 'Refresh market', buy: 'Buy', sell: 'Sell', mine: 'My Listings', requests: 'Requests', history: 'History', blacklist: 'Ignored', All: 'All', Items: 'Items', Stones: 'Stones', Pokemon: 'Pokémon', search: 'Search listings', recent: 'Most recent', 'price-asc': 'Lowest price', 'price-desc': 'Highest price', 'iv-desc': 'Highest IV', 'power-desc': 'Highest power', 'level-desc': 'Highest level', 'quality-desc': 'Highest quality', cards: '▦ Cards', rows: '≡ Rows', clear: 'Clear', shiny: '✨ Shiny only', level: 'Level', from: 'From', to: 'To', allTypes: 'All types', back: '← All species', allPokemon: 'All Pokémon', ads: 'listings', starting: 'from', results: 'MARKET RESULTS', name: 'Name', info: 'Info', price: 'Unit price', details: 'LISTING DETAILS', select: 'Select a listing to see its details.', quantity: 'Quantity', quality: 'Rarity', power: 'Power', types: 'Types', stats: 'STATS', atk: 'Atk', spAtk: 'Sp. Atk', spDef: 'Sp. Def', speed: 'Speed', item: 'Item', sellers: 'sellers', offerOnly: 'Offers only', tm: 'Applied TM', offers: 'Has offers', loading: 'Loading market…', empty: 'No results found.', readOnly: 'Read only · buy, sell and negotiate in the game market.', window: 'All shows only the {n} newest Pokémon listings. The Pokémon tab shows every listing.', goPokemon: 'Open Pokémon tab', showing: 'Showing {from}–{to} of {total} results', updated: 'Updated at {time}', page: 'Page', of: 'of', offline: 'Select an account connected to the game.', auth: 'The session is not ready. Wait for the game to load and refresh.', denied: 'The game did not authorize this query. Check market access for this account.', email: 'Confirm your email in the game to access the market.', limited: 'Too many queries. Wait a few seconds before refreshing.', timeout: 'The query timed out. Refresh to try again.', network: 'Could not load the market. Check your connection.', server: 'The market is unavailable or returned an unexpected response.', changed: 'The account or character changed. Select the account again.', itemsSection: 'ITEMS, POKÉ BALLS AND DIAMONDS', pokemonSection: 'POKÉMON', owned: 'Items available in this account', searchItem: 'Search item', searchPokemon: 'Search Pokémon', selected: 'Selected', chooseItem: 'Select an item', choosePokemon: 'Select a Pokémon', currency: 'Currency', total: 'Total', fee: 'Estimated fee', announce: 'List in the game', requestCreate: 'CREATE BUY REQUEST', requestChoose: 'What do you want to buy?', requestPrice: 'Unit price', yourRequests: 'YOUR REQUESTS', openRequests: 'OPEN REQUESTS', bought: 'Bought', sold: 'Sold', ignored: 'Ignored players', ignoreLabel: 'Ignore player (blocks their listings)', trainer: 'Trainer name', add: 'Add in game', preview: 'Listing preview' };
  const ES = { title: 'MERCADO GLOBAL', button: '🏪 Mercado', subtitle: 'Consulta precios y Pokémon sin salir de la caza.', account: 'Cuenta', close: 'Cerrar', refresh: 'Actualizar mercado', buy: 'Comprar', sell: 'Anunciar', mine: 'Mis anuncios', requests: 'Solicitudes', history: 'Historial', blacklist: 'Ignorados', All: 'Todos', Items: 'Objetos', Stones: 'Piedras', Pokemon: 'Pokémon', search: 'Buscar anuncio', recent: 'Más recientes', 'price-asc': 'Menor precio', 'price-desc': 'Mayor precio', 'iv-desc': 'Mayor IV', 'power-desc': 'Mayor poder', 'level-desc': 'Mayor nivel', 'quality-desc': 'Mayor calidad', cards: '▦ Cards', rows: '≡ Filas', clear: 'Limpiar', shiny: '✨ Solo shiny', level: 'Nivel', from: 'Desde', to: 'Hasta', allTypes: 'Todos los tipos', back: '← Todas las especies', allPokemon: 'Todos los Pokémon', ads: 'anuncios', starting: 'desde', results: 'RESULTADOS DEL MERCADO', name: 'Nombre', info: 'Info', price: 'Precio unitario', details: 'DETALLES DEL ANUNCIO', select: 'Selecciona un anuncio para ver sus detalles.', quantity: 'Cantidad', quality: 'Rareza', power: 'Poder', types: 'Tipos', stats: 'ATRIBUTOS', atk: 'Atq', spAtk: 'Atq. Esp.', spDef: 'Def. Esp.', speed: 'Velocidad', item: 'Objeto', sellers: 'vendedores', offerOnly: 'Solo ofertas', tm: 'TM aplicada', offers: 'Tiene propuestas', loading: 'Consultando el mercado…', empty: 'No hay resultados.', readOnly: 'Solo consulta · compras, anuncios y negociaciones se realizan en el juego.', window: 'Todos muestra solo los {n} anuncios de Pokémon más recientes. La pestaña Pokémon muestra todos.', goPokemon: 'Abrir pestaña Pokémon', showing: 'Mostrando {from}–{to} de {total} resultados', updated: 'Actualizado a las {time}', page: 'Página', of: 'de', offline: 'Selecciona una cuenta conectada al juego.', auth: 'La sesión aún no está lista. Espera a que cargue el juego y actualiza.', denied: 'El juego no autorizó la consulta. Verifica el acceso al mercado de esta cuenta.', email: 'Confirma tu correo en el juego para acceder al mercado.', limited: 'Demasiadas consultas. Espera unos segundos antes de actualizar.', timeout: 'La consulta tardó demasiado. Actualiza para intentarlo otra vez.', network: 'No se pudo consultar el mercado. Verifica la conexión.', server: 'El mercado no está disponible o devolvió una respuesta inesperada.', changed: 'La cuenta o el personaje cambió. Selecciona la cuenta otra vez.', itemsSection: 'OBJETOS, POKÉ BALLS Y DIAMONDS', pokemonSection: 'POKÉMON', owned: 'Objetos disponibles en la cuenta', searchItem: 'Buscar objeto', searchPokemon: 'Buscar Pokémon', selected: 'Seleccionado', chooseItem: 'Selecciona un objeto', choosePokemon: 'Selecciona un Pokémon', currency: 'Moneda', total: 'Total', fee: 'Tasa estimada', announce: 'Anunciar en el juego', requestCreate: 'CREAR SOLICITUD DE COMPRA', requestChoose: '¿Qué deseas comprar?', requestPrice: 'Precio por unidad', yourRequests: 'TUS SOLICITUDES', openRequests: 'SOLICITUDES ABIERTAS', bought: 'Compró', sold: 'Vendió', ignored: 'Jugadores ignorados', ignoreLabel: 'Ignorar jugador (bloquea sus ofertas)', trainer: 'Nombre del entrenador', add: 'Añadir en el juego', preview: 'Vista previa del anuncio' };

  Object.assign(PT, { compare: 'Comparar com o mercado', ownSearch: 'Buscar na conta', ownChoose: 'Selecione um item ou Pokémon da conta', ownEmpty: 'Nenhum bem encontrado nesta conta.', ownLoading: 'O inventário ainda está incompleto. Aguarde o jogo carregar e atualize.', similar: 'ANÚNCIOS SEMELHANTES', tolerance: 'Margem de comparação', widen: 'Ampliar para toda a espécie', narrow: 'Voltar às condições semelhantes', compareRule: 'Mesma espécie/forma, shiny e raridade. Nível, IV e qualidade dentro das margens do seu Pokémon.', broadRule: 'Comparação ampliada: mesma espécie/forma e shiny, com qualquer IV, nível ou qualidade.', sample: 'Resumo dos {n} anúncios comparáveis consultados. Valores por unidade; mediana por oferta/grupo, sem ponderar quantidade.', fetched: '{n} de {total} anúncios retornados pelos filtros foram consultados. Comum/shiny também é conferido nesta amostra.', more: 'Carregar mais anúncios', lowest: 'Menor preço anunciado', median: 'Mediana anunciada', highestBid: 'Maior solicitação de compra', noPrice: 'Sem preço disponível', bidNote: 'Solicitações são intenções de compra, não vendas concluídas. Solicitações sem moeda informada pelo jogo são em dollars.', missingConditions: 'Algumas condições deste Pokémon não foram informadas pelo jogo; a comparação usa somente os valores disponíveis.', noSpecies: 'A espécie deste Pokémon não foi informada pelo jogo.', allKinds: 'Todos', ownPokemon: 'Pokémon', ownItems: 'Itens / Poké Balls / Diamonds', compareEmpty: 'Selecione um bem da conta para consultar os anúncios.' });
  Object.assign(EN, { compare: 'Compare with market', ownSearch: 'Search account inventory', ownChoose: 'Select an owned item or Pokémon', ownEmpty: 'No assets found in this account.', ownLoading: 'Inventory is still incomplete. Wait for the game to load and refresh.', similar: 'SIMILAR LISTINGS', tolerance: 'Comparison tolerance', widen: 'Include the whole species', narrow: 'Return to similar conditions', compareRule: 'Same species/form, shiny status and rarity. Level, IV and quality must match your Pokémon tolerances.', broadRule: 'Expanded comparison: same species/form and shiny status, any IV, level or quality.', sample: 'Summary of {n} comparable listings consulted. Unit prices; median per offer/group, without quantity weighting.', fetched: '{n} of {total} listings returned by the filters were consulted. Regular/shiny is also checked within this sample.', more: 'Load more listings', lowest: 'Lowest advertised price', median: 'Advertised median', highestBid: 'Highest buy request', noPrice: 'No price available', bidNote: 'Requests are buying intentions, not completed sales. Requests without a game-provided currency use dollars.', missingConditions: 'Some Pokémon conditions are unavailable; only known values are compared.', noSpecies: 'The game did not provide this Pokémon species.', allKinds: 'All', ownPokemon: 'Pokémon', ownItems: 'Items / Poké Balls / Diamonds', compareEmpty: 'Select an owned asset to consult listings.' });
  Object.assign(ES, { compare: 'Comparar con el mercado', ownSearch: 'Buscar en la cuenta', ownChoose: 'Selecciona un objeto o Pokémon propio', ownEmpty: 'No hay bienes en esta cuenta.', ownLoading: 'El inventario está incompleto. Espera a que cargue el juego y actualiza.', similar: 'ANUNCIOS SIMILARES', tolerance: 'Margen de comparación', widen: 'Ampliar a toda la especie', narrow: 'Volver a condiciones similares', compareRule: 'Misma especie/forma y shiny. Márgenes sobre los valores de tu Pokémon.', broadRule: 'Comparación ampliada: misma especie/forma y shiny, cualquier IV, nivel o calidad.', sample: 'Resumen de {n} anuncios comparables consultados. Precios unitarios; mediana por oferta/grupo sin ponderar cantidad.', fetched: 'Se consultaron {n} de {total} anuncios devueltos por los filtros. Común/shiny también se comprueba en esta muestra.', more: 'Cargar más anuncios', lowest: 'Menor precio anunciado', median: 'Mediana anunciada', highestBid: 'Mayor solicitud de compra', noPrice: 'Sin precio disponible', bidNote: 'Las solicitudes son intenciones de compra, no ventas realizadas. Las solicitudes sin moneda indicada por el juego usan dollars.', missingConditions: 'Faltan algunas condiciones; solo se comparan los valores disponibles.', noSpecies: 'El juego no indicó la especie de este Pokémon.', allKinds: 'Todos', ownPokemon: 'Pokémon', ownItems: 'Objetos / Poké Balls / Diamonds', compareEmpty: 'Selecciona un bien de la cuenta para consultar anuncios.' });

  Object.assign(PT,{exchangeRate:'Conversão: 1 💎 = {rate} dollars · menor preço unitário ativo do diamante. Ordenação usa o valor equivalente, sem taxas.',exchangeMissing:'Sem cotação ativa do diamante: não é possível comparar preços entre moedas.'});
  Object.assign(EN,{exchangeRate:'Conversion: 1 💎 = {rate} dollars · lowest active diamond unit price. Sorting uses equivalent value, excluding fees.',exchangeMissing:'No active diamond quote: prices across currencies cannot be compared.'});
  Object.assign(ES,{exchangeRate:'Conversión: 1 💎 = {rate} dollars · menor precio unitario activo del diamante. Orden por valor equivalente, sin tasas.',exchangeMissing:'Sin cotización activa del diamante: no se pueden comparar precios entre monedas.'});

  function mount(bridge) {
    Object.assign(PT, { includeEvolutions: 'Incluir evoluções', evolutionHint: 'Inclui as evoluções e pré-evoluções do Pokémon pesquisado ou selecionado, respeitando os demais filtros.' });
    Object.assign(EN, { includeEvolutions: 'Include evolutions', evolutionHint: 'Includes evolutions and pre-evolutions of the searched or selected Pokémon while respecting the other filters.' });
    Object.assign(ES, { includeEvolutions: 'Incluir evoluciones', evolutionHint: 'Incluye las evoluciones y preevoluciones del Pokémon buscado o seleccionado, respetando los demás filtros.' });
    const A = root.PokeMuxMarketAlerts;
    let alertRules = []; try { alertRules = JSON.parse(bridge.load('marketAlerts') || '[]').map(A.normalize).filter(Boolean).slice(0, 10); } catch {}
    let monitor = null, alertKind = 'item';
    let gameSearchEntries = [];
    try { const cached = JSON.parse(bridge.load('gameSearchCatalog') || 'null'); if (cached?.version === 1 && Array.isArray(cached.entries)) gameSearchEntries = cached.entries; } catch {}
    const timeText = {
      pt: { published: 'Publicado', grouped: 'Oferta deste grupo', now: 'agora', ago: 'há', unavailable: 'Data não informada' },
      en: { published: 'Published', grouped: 'Offer in this group', now: 'just now', ago: 'ago', unavailable: 'Date unavailable' },
      es: { published: 'Publicado', grouped: 'Oferta de este grupo', now: 'ahora', ago: 'hace', unavailable: 'Fecha no informada' }
    };
    const tt = () => timeText[bridge.language()] || timeText.pt;
    const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
    const tr = (key, values = {}) => {
      const language = bridge.language(), table = language === 'en' ? EN : language === 'es' ? ES : PT;
      let value = table[key] || (language === 'en' && key.startsWith('TYPE_') ? key.slice(5).toLowerCase() : PT[key]) || key;
      for (const [name, replacement] of Object.entries(values)) value = value.replace('{' + name + '}', String(replacement));
      return value;
    };
    const nf = n => new Intl.NumberFormat(bridge.language() === 'en' ? 'en-US' : bridge.language() === 'es' ? 'es-ES' : 'pt-BR', { maximumFractionDigits: 2 }).format(Number(n) || 0);
    const locale = () => bridge.language() === 'en' ? 'en-US' : bridge.language() === 'es' ? 'es-ES' : 'pt-BR';
    const age = value => {
      const time = M.listingTime(value); if (!time) return tt().unavailable;
      if (time.minutes === 0) return tt().now;
      const days = Math.floor(time.minutes / 1440), hours = Math.floor(time.minutes % 1440 / 60), minutes = time.minutes % 60;
      const duration = days ? `${days}d ${hours}h` : hours ? `${hours}h ${minutes}min` : `${minutes}min`;
      return bridge.language() === 'en' ? duration + ' ' + tt().ago : tt().ago + ' ' + duration;
    };
    let itemQuote = null, itemQuoteJob = null;
    const marketRead = M.createMarketReader(async (account, script) => {
      const response = await bridge.read(account, script);
      if(response?.ok && script.includes('({"category":"All"') && response.data?.cid && (script.includes(','+JSON.stringify(String(response.data.cid))+',(') || script.includes(',"",(') && s.accounts[account]?.live && String(s.accounts[account]?.cid)===String(response.data.cid))) {
        const data=M.sanitizeResponse(response.data);
        itemQuote={ok:true,prices:M.itemPriceSummary(data.listings),at:Date.now()};
      }
      return response;
    }, bridge.marketReaderOptions);
    async function itemPrices() {
      if(itemQuote && Date.now()-itemQuote.at<60000)return itemQuote;
      if(itemQuoteJob)return itemQuoteJob;
      itemQuoteJob=(async()=>{
        const accounts=await bridge.accounts();
        const candidates=accounts.map((metadata,account)=>({metadata,account})).filter(x=>x.metadata.live && !x.metadata.off && x.metadata.cid);
        candidates.sort((a,b)=>Number(b.account===s.account)-Number(a.account===s.account));
        let failure='offline';
        for(const {metadata,account} of candidates) {
          const response=await marketRead(account,M.readScript({category:'All'},metadata.cid),()=>!metadata.off,10).catch(()=>({ok:false,reason:'network'}));
          if(response?.ok && String(response.data?.cid)===String(metadata.cid)) return itemQuote || {ok:false,reason:'changed'};
          failure=response?.reason || 'network';
          if(failure==='limited')break;
        }
        return {ok:false,reason:failure,prices:itemQuote?.prices,at:itemQuote?.at};
      })().finally(()=>{itemQuoteJob=null;});
      return itemQuoteJob;
    }
    let savedSnapshot = null;
    try { savedSnapshot = JSON.parse(bridge.load('marketPokemonSnapshots') || 'null'); } catch {}
    const snapshots = M.createSnapshotCache((account,script,valid)=>marketRead(account,script,valid,0), {initial:savedSnapshot,now:bridge.marketSnapshotOptions?.now,save:value=>bridge.save('marketPokemonSnapshots',JSON.stringify(value))});
    const snapshotMode = bridge.marketSnapshotOptions?.enabled !== false;
    const syncingSnapshots = new Set();
    const teamData = new Map(), teamJobs = new Map(), teamErrors = new Map();
    let teamLoading = 0;
    const sourceFailures = new Set();
    let warmTimer = null, warming = false;
    let clockTimer = null, autoBusy = false, autoRetryAt = 0, autoError = '';
    const s = { open: false, revision: 0, accounts: [], account: -1, cid: '', tab: 'buy', category: 'All', mode: bridge.load('marketView') === 'cards' ? 'cards' : 'rows',
      data: null, highlights: null, rate: null, priceBook:null, priceScanning:false, priceProgress:'', loadedCategory: '', species: null, pickedSpecies: 'all', listings: [], total: 0, pages: 1, page: 1, selected: '', q: '', sort: 'recent', shiny: false, includeEvolutions: false,
      accountFilter: -1, ownedId: '', ownQ: '', ownKind: '', ownPage: 1, compareList: [], comparePage: 0, comparePages: 1, compareTotal: 0, comparePending: false, compareError: '', compareDone: false, tolerance: { iv: 10, lv: 10, q: .1, broad: false },
      ivMin: '', ivMax: '', lvMin: '', lvMax: '', qMin: '', qMax: '', type: '', gradesOff: [], pending: false, error: '', time: 0, timer: null, previousFocus: null };
    const overlay = document.createElement('div');
    overlay.id = 'pmMarket'; overlay.setAttribute('role', 'dialog'); overlay.setAttribute('aria-modal', 'true'); overlay.setAttribute('aria-labelledby', 'mkTitle');
    overlay.innerHTML = `<div class="mk-window">
      <header class="mk-head"><img class="mk-crest" src="src/renderer/market-icon.svg" alt=""><div class="mk-titles"><h2 id="mkTitle"></h2><p class="mk-subtitle" id="mkSubtitle"></p></div><div class="mk-highlights" aria-live="polite"></div><select id="mkAccount"></select><button id="mkRefresh">⟳</button><button id="mkClose">✕</button></header>
      <nav class="mk-tabs" role="tablist"></nav><div class="mk-status" role="status" aria-live="polite"></div><div class="mk-rate" role="note"></div>
      <div class="mk-layout"><aside class="mk-categories"></aside><main class="mk-main">
        <div class="mk-toolbar"><div class="mk-search-picker"><input class="mk-search" id="mkSearch" type="search" maxlength="120" role="combobox" aria-autocomplete="list" aria-expanded="false" aria-controls="mkSearchSuggestions" autocomplete="off"><div id="mkSearchSuggestions" role="listbox" hidden></div></div><select id="mkSort"></select><button id="mkClear"></button><div class="mk-view"><button id="mkCards"></button><button id="mkRows"></button></div></div>
        <div class="mk-crumb" hidden></div><div class="mk-filters" hidden></div><div class="mk-hint" hidden></div>
        <div class="mk-results" id="mkResults" role="tabpanel"></div><nav class="mk-pages" aria-label="Paginação"></nav>
      </main></div><footer class="mk-footer"><span id="mkCount"></span><span class="mk-footer-right"></span></footer>
    </div>`;
    document.body.appendChild(overlay);
    const el = selector => overlay.querySelector(selector);
    const teamText = (pt,en,es) => ({pt,en,es}[bridge.language()] || en);
    function rememberTeam(account, data, withOwned = false) {
      if (!data.cid) return;
      const previous = teamData.get(account);
      teamData.set(account,{at:Date.now(),data:{...data,...(!withOwned && previous?.data.cid === data.cid ? {owned:previous.data.owned,ownedReady:previous.data.ownedReady} : {})}});
      teamErrors.delete(account);
      if (s.accounts[account]) Object.assign(s.accounts[account],{cid:data.cid,name:data.name || s.accounts[account].name});
    }
    function teamRows(kind, filter = s.accountFilter) {
      const rows = [];
      for (const [account,entry] of teamData) {
        const metadata = s.accounts[account];
        if (!metadata || !metadata.live || metadata.off || metadata.cid && metadata.cid !== entry.data.cid || filter >= 0 && account !== filter) continue;
        for (const row of entry.data[kind] || []) rows.push({...row,sourceId:row.id,id:s.accounts.length === 1 ? row.id : account+'|'+row.id,account,cid:entry.data.cid,accountName:metadata.name,ownedReady:entry.data.ownedReady});
      }
      return rows;
    }
    const accountLink = row => row.account == null ? '' : `<button class="mk-account-link" data-open-account="${row.account}">${esc(row.accountName || s.accounts[row.account]?.name || String(row.account+1))}</button>`;
    function teamNotice() {
      const missing = s.accounts.filter((x,i)=>(s.accountFilter < 0 || i === s.accountFilter) && (x.off || !x.live || teamErrors.has(i)));
      return missing.length ? `<p class="mk-note" role="status">${esc(teamText('Contas sem dados atualizados: ','Accounts without up-to-date data: ','Cuentas sin datos actualizados: ')+missing.map(x=>x.name).join(', '))}</p>` : '';
    }
    async function loadTeam(force = false, refreshedAccount = -1) {
      const jobs = s.accounts.map((metadata,account) => {
        if (!metadata.live || metadata.off || account === refreshedAccount) return Promise.resolve();
        const cached = teamData.get(account);
        if (!force && cached && (!metadata.cid || cached.data.cid === metadata.cid) && Date.now()-cached.at < 60000) return Promise.resolve();
        if (teamJobs.has(account)) return teamJobs.get(account);
        teamLoading++;
        const cid = metadata.cid || '';
        const task = marketRead(account,M.readScript({category:'All',includeOwned:true},cid),()=>!s.accounts[account]?.off && (!cid || s.accounts[account]?.cid === cid),0).then(response => {
          if (response?.ok) { const data = M.sanitizeResponse(response.data); if (!cid || data.cid === cid) rememberTeam(account,data,true); }
          else { teamErrors.set(account,response?.reason || 'network'); if (response?.reason === 'changed') teamData.delete(account); }
        }).catch(()=>{teamErrors.set(account,'network');
        }).finally(()=>{
          teamJobs.delete(account); teamLoading--;
          if (s.open && ['compare','mine'].includes(s.tab) && !s.pending) keepMarketView(()=>render(true));
        });
        teamJobs.set(account,task); return task;
      });
      await Promise.all(jobs);
    }
    const button = document.getElementById('marketBtn');
    const tabs = ['buy', 'compare', 'alerts', 'mine', 'requests', 'history'];
    PT.alerts = 'Alertas'; EN.alerts = 'Alerts'; ES.alerts = 'Alertas';
    const tabIcons = { buy: 'tab_buy', compare: 'itens', alerts: 'tab_requests', mine: 'tab_mine', requests: 'tab_requests', history: 'tab_history' };
    const categoryIcons = { All: 'todos', Items: 'itens', Stones: 'stones', 'Poke Balls': 'poke_balls', Diamonds: 'diamonds', Pokemon: 'pokemon' };
    const img = (url, className = 'mk-art') => url ? `<img class="${className}" src="${esc(url)}" alt="" loading="lazy">` : `<span class="${className}" aria-hidden="true">◇</span>`;
    const art = (x, className) => {
      const url = x.kind === 'pokemon' || x.speciesId ? bridge.sprite(x.speciesId, !!x.shiny) : M.safeIcon(x.icon);
      return img(url, className);
    };
    const price = x => {
      if (x.offerOnly) return esc(tr('offerOnly'));
      const equivalent = x.currency === 'GOLD' ? M.equivalentDiamonds(x,s.rate) : null;
      return `<span class="mk-price-group"><span class="mk-price${x.currency === 'DIAMONDS' ? ' diamonds' : ''}">${img(GAME + '/assets/market/' + (x.currency === 'DIAMONDS' ? 'diamonds' : 'dollar') + '.png', 'mk-currency')}${nf(x.price)}${x.currency === 'DIAMONDS' ? '' : ' dollars'}${x.kind !== 'pokemon' ? '/un' : ''}</span>`
        + (equivalent != null ? `<small class="mk-equivalent">≈ ${equivalent.toLocaleString(locale(),{maximumSignificantDigits:6})} 💎${x.kind !== 'pokemon' ? '/un' : ''}</small>` : '') + '</span>';
    };
    const quality = x => x.quality == null ? '' : `<span style="color:${COLORS[M.GRADES.indexOf(M.rarity(x.quality))]}">${esc(M.rarity(x.quality))} ×${Number(x.quality).toFixed(2)}</span>`;
    const listed = x => {
      const time = M.listingTime(x.at), label = x.sellers > 1 ? tt().grouped : tt().published;
      return time ? `<small class="mk-listed" title="${esc(label + ': ' + new Date(time.timestamp).toLocaleString(locale()))}">◷ ${esc(label)} <span data-listed-at="${esc(x.at)}">${esc(age(x.at))}</span></small>` : '';
    };
    const meta = x => (x.kind === 'pokemon' ? `${x.shiny ? '✨ ' : ''}Nv${nf(x.level)} · IV ${nf(x.ivTotal)} · ${quality(x)}`
      : `${nf(x.quantity ?? x.amount)}×${x.sellers > 1 ? ' · ' + nf(x.sellers) + ' ' + esc(tr('sellers')) : ''}`) + listed(x);
    const empty = text => `<div class="mk-empty">${esc(text || tr('empty'))}</div>`;

    function invalidate() { clearTimeout(s.timer); s.timer = null; s.revision++; autoError = ''; s.priceScanning = false; s.priceProgress = ''; }
    function resetFilters() { Object.assign(s, { q: '', sort: 'recent', shiny: false, includeEvolutions: false, ivMin: '', ivMax: '', lvMin: '', lvMax: '', qMin: '', qMax: '', type: '', gradesOff: [], page: 1, selected: '' }); el('#mkSearch').value = ''; hideSearchSuggestions(); }
    function status() {
      const statusEl = el('.mk-status');
      const syncing = snapshotMode && syncingSnapshots.has(s.account);
      const cacheNote = ({pt:'Sincronizando cache da loja…',en:'Syncing shop cache…',es:'Sincronizando caché de la tienda…'}[bridge.language()]);
      statusEl.classList.toggle('error', !!s.error || !!autoError);
      statusEl.textContent = s.error ? tr(s.error) : s.pending || s.tab === 'compare' && s.comparePending ? tr('loading') : s.priceScanning || syncing ? cacheNote : tr('readOnly') + (s.time ? ' · ' + tr('updated', { time: new Date(s.time).toLocaleString() }) : '') + (autoError ? ' · ' + tr(autoError) : '');
      el('#mkRefresh').disabled = s.priceScanning || s.pending || s.tab === 'compare' && s.comparePending;
    }

    function chrome() {
      button.title = tr('title'); button.setAttribute('aria-label', tr('title')); button.setAttribute('aria-expanded', String(s.open));
      el('#mkTitle').textContent = tr('title'); el('#mkSubtitle').textContent = tr('subtitle');
      el('#mkAccount').value = String(s.tab === 'alerts' ? s.account : s.accountFilter);
      const allAccounts = el('#mkAccount').querySelector('option[value="-1"]'); if (allAccounts) allAccounts.disabled = s.tab === 'alerts';
      el('.mk-rate').textContent = tr(s.rate ? 'exchangeRate' : 'exchangeMissing', {rate:nf(s.rate)});
      const highlightText = bridge.language() === 'en' ? { diamond: 'Diamond', min: 'Lowest unit price', none: 'No listing' } : bridge.language() === 'es' ? { diamond: 'Diamante', min: 'Menor precio unitario', none: 'Sin anuncio' } : { diamond: 'Diamante', min: 'Menor preço unitário', none: 'Sem anúncio' };
      el('.mk-highlights').innerHTML = [
        ['diamond', highlightText.diamond, '/assets/market/diamonds.png'],
        ['pheromone', 'Strange Pheromone', '/assets/items/strange_pheromone.png'],
        ['boss', 'Boss Token', '/assets/items/bronze_boss_token.png']
      ].map(([key, name, icon]) => {
        const values = !s.error && s.highlights && s.highlights[key];
        const line = currency => {
          const value = values && values[currency === 'GOLD' ? 'gold' : 'diamonds'];
          const label = currency === 'GOLD' ? 'dollars' : 'diamonds';
          return `<div class="mk-highlight-price" title="${esc(highlightText.min + ' · ' + label)}">${img(GAME + '/assets/market/' + (currency === 'GOLD' ? 'dollar' : 'diamonds') + '.png', 'mk-currency')}<b class="${currency === 'DIAMONDS' ? 'diamonds' : ''}">${value == null ? s.pending ? '…' : esc(highlightText.none) : nf(value)}</b></div>`;
        };
        return `<section class="mk-highlight" title="${esc(highlightText.min + (key === 'boss' ? ' · Bronze Boss Token' : ''))}"><div class="mk-highlight-name">${img(GAME + icon)}<b>${esc(name)}</b></div>${line('GOLD')}${key === 'diamond' ? '' : line('DIAMONDS')}</section>`;
      }).join('');
      el('#mkAccount').setAttribute('aria-label', s.tab === 'alerts' ? tr('account') : teamText('Filtrar inventário e anúncios por conta','Filter inventory and listings by account','Filtrar inventario y anuncios por cuenta')); el('#mkRefresh').title = tr('refresh'); el('#mkClose').setAttribute('aria-label', tr('close'));
      el('.mk-tabs').innerHTML = tabs.map(tab => `<button role="tab" id="mkTab-${tab}" aria-controls="mkResults" aria-selected="${s.tab === tab}" data-tab="${tab}" class="${s.tab === tab ? 'active' : ''}">${img(GAME + '/assets/market/' + tabIcons[tab] + '.png', 'mk-tab-icon')}<span>${esc(tr(tab))}${tab === 'mine' && s.data ? ' (' + nf(teamRows('mine',-1).length) + ')' : ''}</span></button>`).join('');
      el('#mkResults').setAttribute('aria-labelledby', 'mkTab-' + s.tab);
      el('.mk-categories').hidden = !['buy', 'requests'].includes(s.tab);
      el('.mk-categories').innerHTML = M.CATEGORIES.map(category => `<button data-category="${category}" class="${s.category === category ? 'active' : ''}">${img(GAME + '/assets/market/' + categoryIcons[category] + '.png')}<span>${esc(tr(category))}</span></button>`).join('');
      el('.mk-toolbar').hidden = !['buy', 'requests', 'mine'].includes(s.tab);
      const searchLabel = tr(s.tab === 'buy' && s.category === 'Pokemon' ? 'searchPokemon' : 'search');
      el('#mkSearch').placeholder = searchLabel; el('#mkSearch').setAttribute('aria-label', searchLabel);
      if (document.activeElement !== el('#mkSearch')) el('#mkSearch').value = s.q;
      const sorts = s.tab === 'buy' && s.category === 'Pokemon' || s.tab === 'mine' ? M.SORTS : M.SORTS.slice(0, 3);
      el('#mkSort').innerHTML = sorts.map(key => `<option value="${key}">${esc(tr(key))}</option>`).join(''); el('#mkSort').value = s.sort;
      el('#mkClear').textContent = tr('clear'); el('#mkCards').textContent = tr('cards'); el('#mkRows').textContent = tr('rows');
      el('#mkCards').classList.toggle('active', s.mode === 'cards'); el('#mkRows').classList.toggle('active', s.mode === 'rows');
      const browsing = s.tab === 'buy' && s.category === 'Pokemon' && s.pickedSpecies != null;
      el('.mk-crumb').hidden = !browsing; el('.mk-filters').hidden = !browsing;
      const sp = (s.species || []).find(x => String(x.speciesId) === String(s.pickedSpecies));
      el('.mk-crumb').innerHTML = `<span>${esc(s.pickedSpecies === 'all' ? tr('allPokemon') : sp && sp.name || '#' + s.pickedSpecies)} · ${nf(s.total)} ${esc(tr('ads'))}</span>`;
      // Keep inputs in place during asynchronous responses so typing keeps its focus and selection.
      if (!el('#mkIvMin')) {
        el('.mk-filters').innerHTML = `<button id="mkShiny"></button><label class="mk-evolutions" title="${esc(tr('evolutionHint'))}"><input id="mkIncludeEvolutions" type="checkbox"><span></span></label>` + [['iv', 'IV', 0, 192], ['lv', tr('level'), 1, 100000], ['q', 'Q', 0, 100]].map(([key, label, min, max]) =>
          `<label>${label}<input id="mk${key[0].toUpperCase() + key.slice(1)}Min" data-filter="${key}Min" type="number" min="${min}" max="${max}" step="${key === 'q' ? '.01' : '1'}" aria-label="${esc(label + ' ' + tr('from'))}"><span>–</span><input id="mk${key[0].toUpperCase() + key.slice(1)}Max" data-filter="${key}Max" type="number" min="${min}" max="${max}" step="${key === 'q' ? '.01' : '1'}" aria-label="${esc(label + ' ' + tr('to'))}"></label>`).join('')
          + `<select id="mkType" aria-label="${esc(tr('types'))}"><option value="">${esc(tr('allTypes'))}</option>${M.TYPES.map(type => `<option value="${type}">${esc(tr('TYPE_' + type))}</option>`).join('')}</select><div class="mk-filter-bottom"><div class="mk-grades"></div></div>`;
      }
      el('#mkShiny').textContent = tr('shiny'); el('#mkShiny').classList.toggle('active', s.shiny);
      el('#mkIncludeEvolutions').checked = s.includeEvolutions;
      el('#mkIncludeEvolutions').disabled = !browsing;
      el('.mk-evolutions').hidden = !browsing;
      el('#mkIncludeEvolutions').nextElementSibling.textContent = tr('includeEvolutions');
      for (const input of overlay.querySelectorAll('[data-filter]')) {
        if (document.activeElement !== input) input.value = s[input.dataset.filter];
        input.placeholder = tr(input.dataset.filter.endsWith('Min') ? 'from' : 'to');
      }
      el('#mkType').value = s.type;
      el('.mk-grades').innerHTML = M.GRADES.map((grade, i) => `<button data-grade="${grade}" class="${s.gradesOff.includes(grade) ? 'off' : ''}" aria-pressed="${!s.gradesOff.includes(grade)}" style="color:${COLORS[i]}">${esc(grade)}</button>`).join('');
      const sortSelect = el('#mkSort');
      const sortLabel = bridge.language() === 'en' ? 'Sort by' : bridge.language() === 'es' ? 'Ordenar por' : 'Ordenar por';
      sortSelect.setAttribute('aria-label', sortLabel); sortSelect.title = sortLabel;
      // Move the existing control so its value and change handler stay intact.
      if (browsing) { if (sortSelect.parentElement !== el('.mk-filter-bottom')) el('.mk-filter-bottom').appendChild(sortSelect); }
      else if (sortSelect.parentElement !== el('.mk-toolbar')) el('.mk-toolbar').insertBefore(sortSelect, el('#mkClear'));
      const showHint = s.tab === 'buy' && s.category === 'All' && s.data && s.data.pkWindow.more;
      el('.mk-hint').hidden = !showHint;
      el('.mk-hint').innerHTML = `<span>${esc(tr('window', { n: nf(s.data && s.data.pkWindow.cap || 600) }))}</span><button data-all-pokemon>${esc(tr('goPokemon'))}</button>`;
      status();
      if (searchSuggestionsOpen) showSearchSuggestions();
    }

    const comparisonTolerance = () => s.tolerance;
    function rows() {
      if (!s.data) return [];
      if (s.tab === 'compare') return M.sortPrices(M.comparable(s.compareList, ownedSelection(), comparisonTolerance()),'price-asc',s.rate);
      if (s.tab === 'mine') return M.filterListings(teamRows('mine'), { q: s.q, sort: s.sort, diamondRate:s.rate });
      if (s.category === 'Pokemon' && s.pickedSpecies != null) return s.listings;
      return M.filterListings(s.data.listings, { q: s.q, sort: s.sort, diamondRate:s.rate });
    }

    function renderListings(list, offset = 0) {
      if (!list.length) return empty();
      if (s.mode === 'cards') return `<div class="mk-cards">${list.map(x => `<article class="mk-card${x.id === s.selected ? ' selected' : ''}" tabindex="0" role="button" aria-label="${esc(x.name)}" data-listing="${esc(x.id)}"><div class="mk-row-name">${art(x)}<div><b>${esc(x.name)}</b><small>${esc(tr(x.kind))}</small></div></div><p class="mk-meta">${meta(x)} ${accountLink(x)}</p><div class="mk-card-foot"><span>${esc(x.offerOnly ? tr('offerOnly') : x.kind === 'pokemon' ? 'IV' : tr(x.kind))}</span>${price(x)}</div></article>`).join('')}</div>`;
      return `<div class="mk-list-head"><span>#</span><span>${esc(tr('name'))}</span><span>${esc(tr('info'))}</span><span>${esc(tr('price'))}</span></div>` + list.map((x, i) => `<div class="mk-row${x.id === s.selected ? ' selected' : ''}" tabindex="0" role="button" aria-label="${esc(x.name)}" data-listing="${esc(x.id)}"><span>${offset + i + 1}</span><div class="mk-row-name">${art(x)}<div><b>${esc(x.name)}</b><small>${esc(tr(x.kind))}</small></div></div><div class="mk-meta">${meta(x)} ${accountLink(x)}</div>${price(x)}</div>`).join('');
    }

    let ivRevision = 0, ivTarget = null, ivPoint = null, ivResult = null;
    function hideIv() {
      ivRevision++; ivTarget = null; ivPoint = null; ivResult = null;
      if (bridge.hideIv) bridge.hideIv();
    }
    async function inspectIv(target, event) {
      const pokemon = target && (target.hasAttribute('data-owned') ? teamRows('owned',-1).find(x => x.id === target.dataset.owned)
        : rows().find(x => x.id === target.dataset.listing));
      if (!s.open || s.pending || s.error || !pokemon || pokemon.kind !== 'pokemon' || !bridge.calculateIv || !bridge.isIvEnabled?.()) { hideIv(); return; }
      const bounds = target.getBoundingClientRect();
      const point = event && Number.isFinite(event.clientX) && event.type !== 'focusin' && !(event.type === 'click' && event.detail === 0)
        ? { x: event.clientX, y: event.clientY } : { x: bounds.left + Math.min(bounds.width / 2, 180), y: bounds.top + bounds.height / 2 };
      if (ivTarget === target) { ivPoint = point; if (ivResult) bridge.showIv(pokemon.account ?? s.account, ivResult, ivPoint); return; }
      hideIv(); ivTarget = target; ivPoint = point;
      const revision = ivRevision, account = pokemon.account ?? s.account, cid = pokemon.cid || s.cid;
      try {
        const result = await bridge.calculateIv(account, pokemon, cid);
        if (!s.open || ivRevision !== revision || (pokemon.account == null && (s.account !== account || s.cid !== cid)) || (s.accounts[account]?.cid && s.accounts[account].cid !== cid) || !target.isConnected || !bridge.isIvEnabled()) return;
        ivResult = result; bridge.showIv(account, result, ivPoint);
      } catch { if (ivRevision === revision) hideIv(); }
    }

    function pagination(page, pages) {
      const numbers = new Set([1, pages, page - 1, page, page + 1]);
      const buttons = [...numbers].filter(n => n >= 1 && n <= pages).sort((a, b) => a - b);
      let previous = 0, inner = `<button data-page="${page - 1}" ${page <= 1 ? 'disabled' : ''}>‹</button>`;
      for (const n of buttons) { if (previous && n - previous > 1) inner += '<span>…</span>'; inner += `<button data-page="${n}" class="${n === page ? 'active' : ''}">${n}</button>`; previous = n; }
      return inner + `<button data-page="${page + 1}" ${page >= pages ? 'disabled' : ''}>›</button><input class="mk-page-input" id="mkPage" type="number" min="1" max="${pages}" value="${page}" aria-label="${esc(tr('page'))}"><span>${esc(tr('of'))} ${nf(pages)}</span>`;
    }

    const catalog = () => s.data ? [...s.data.catalog.items, ...s.data.catalog.balls, ...(s.data.catalog.diamonds ? [s.data.catalog.diamonds] : [])] : [];
    let searchSuggestionsOpen = false, searchMatches = [];
    function hideSearchSuggestions() {
      searchSuggestionsOpen = false;
      el('#mkSearchSuggestions').hidden = true;
      el('#mkSearch').setAttribute('aria-expanded', 'false');
      el('#mkSearch').removeAttribute('aria-activedescendant');
    }
    function showSearchSuggestions() {
      const input = el('#mkSearch'), list = el('#mkSearchSuggestions'), needle = M.normalized(input.value.trim());
      if (!needle || !s.open || el('.mk-toolbar').hidden || document.activeElement !== input) { hideSearchSuggestions(); return; }
      searchSuggestionsOpen = true;
      const snapshot = snapshots.get(s.account, s.cid);
      const candidates = [...gameSearchEntries, ...catalog(), ...(s.data?.alertCatalog || []).map(x=>({...x,kind:'pokemon'})), ...(snapshot?.data?.alertCatalog || []).map(x=>({...x,kind:'pokemon'})), ...(s.species || []).map(x=>({...x,kind:'pokemon'})), ...(s.data?.listings || []), ...s.listings, ...(snapshot?.listings || []), ...teamRows('mine')];
      const variantPrefix = /^(?:(?:nightmare|ancient|orre|brave|furious|charged|freezing|roll|dark)\s+)+/i;
      const pokemonName = name => String(name).replace(variantPrefix, '').replace(/\s+(?:lv\.?|lvl\.?|level|nv\.?|n[ií]vel)\s*\d+(?:\s.*)?$/i, '').trim();
      const basePokemon = new Map();
      for (const x of candidates) {
        if (!(x.kind === 'pokemon' || x.speciesId) || !x.name || variantPrefix.test(x.name)) continue;
        const name = pokemonName(x.name), key = M.normalized(name);
        if (!basePokemon.has(key)) basePokemon.set(key, {...x,name});
      }
      const unique = new Map();
      for (const x of candidates) {
        if (!x.name) continue;
        const pokemon = x.kind === 'pokemon' || !!x.speciesId;
        const stone = M.normalized(x.category).includes('stone') || x.kind === 'stone' || /\bstone\b/i.test(x.name);
        if (s.tab === 'buy' && s.category !== 'All' && !(s.category === 'Pokemon' ? pokemon : s.category === 'Diamonds' ? x.kind === 'diamonds' : s.category === 'Poke Balls' ? x.kind === 'ball' : s.category === 'Stones' ? stone : !pokemon && !stone && x.kind !== 'ball' && x.kind !== 'diamonds')) continue;
        const name = pokemon ? pokemonName(x.name) : x.name;
        if (!M.normalized(name).includes(needle)) continue;
        const key = pokemon ? 'pokemon:'+M.normalized(name) : x.kind+':'+(x.refId || M.normalized(x.name));
        if (!unique.has(key)) unique.set(key, pokemon ? basePokemon.get(M.normalized(name)) || {...x,name} : x);
      }
      searchMatches = [...unique.values()].sort((a,b)=>Number(M.normalized(b.name).startsWith(needle))-Number(M.normalized(a.name).startsWith(needle)) || a.name.localeCompare(b.name)).slice(0, 12);
      list.innerHTML = searchMatches.map((x,i)=>`<button type="button" id="mkSearchOption${i}" role="option" aria-selected="false" tabindex="-1" data-search-option="${i}">${art(x)}<span>${esc(x.name)}</span></button>`).join('');
      list.hidden = !searchMatches.length;
      input.setAttribute('aria-expanded', String(!!searchMatches.length)); input.removeAttribute('aria-activedescendant');
    }
    function chooseSearchSuggestion(index) {
      const target = searchMatches[index]; if (!target) return;
      s.q = target.name; el('#mkSearch').value = target.name;
      hideSearchSuggestions(); el('#mkSearch').focus(); hideSearchSuggestions(); queryChanged(true);
    }
    function requestScreen() {
      const form = `<section class="mk-form"><h3 class="mk-section-title">◆ ${esc(tr('requestCreate'))}</h3><div class="mk-form-fields"><label>${esc(tr('requestChoose'))}<select id="mkRequestItem"><option value="">${esc(tr('chooseItem'))}</option>${catalog().map((x, i) => `<option value="${i}">${esc(x.name)}</option>`).join('')}</select></label><label>${esc(tr('requestPrice'))}<input id="mkRequestPrice" type="number" min="1" value="100"></label><label>${esc(tr('quantity'))}<input id="mkRequestQty" type="number" min="1" max="100" value="1"></label></div><p class="mk-meta" id="mkRequestTotal"></p><button disabled>${esc(tr('requests'))}</button><p class="mk-note">${esc(tr('readOnly'))}</p></section>`;
      const mine = s.data.myRequests, ids = new Set(mine.map(x => x.id));
      const listings = s.data.requests.filter(x => !ids.has(x.id));
      const filter = x => M.filterListings(x, { q: s.q, sort: s.sort, diamondRate:s.rate });
      const records = list => list.length ? list.map(x => `<div class="mk-record"><div class="mk-row-name">${art(x)}<div><b>${esc(x.name)}</b><small>${nf(x.amount)}×</small></div></div>${price({ ...x, kind: 'item', currency: 'GOLD' })}</div>`).join('') : empty();
      return form + `<h3 class="mk-section-title">◆ ${esc(tr('yourRequests'))}</h3>` + records(filter(mine)) + `<h3 class="mk-section-title" style="margin-top:20px">◆ ${esc(tr('openRequests'))}</h3>` + records(filter(listings));
    }

    function totals() {
      const summary = (quantity, unit, currency, tax = true) => esc(tr('total')) + ': ' + nf(quantity * unit) + (currency === 'DIAMONDS' ? ' 💎' : ' dollars') + (tax ? ' · ' + esc(tr('fee')) + ': ' + nf(currency === 'DIAMONDS' ? Math.max(1, Math.ceil(unit * .01)) : Math.min(1e6, Math.floor(quantity * unit * (s.data.isVip ? .02 : .03)))) : '');
      if (el('#mkRequestTotal')) el('#mkRequestTotal').textContent = summary(Math.min(100, Math.max(1, +el('#mkRequestQty').value || 1)), Math.max(1, +el('#mkRequestPrice').value || 1), 'GOLD').replace(/&amp;/g, '&');
    }

    const ownedSelection = () => teamRows('owned',-1).find(x => x.id === s.ownedId);
    function inventoryBag() {
      const own = teamRows('owned').filter(x => (!s.ownQ || M.normalized(x.name).includes(M.normalized(s.ownQ))) &&
        (!s.ownKind || (s.ownKind === 'item' ? !['pokemon', 'ball'].includes(x.kind) : x.kind === s.ownKind)))
        .sort((a, b) => (a.kind === 'pokemon' ? 0 : a.kind === 'ball' ? 1 : 2) - (b.kind === 'pokemon' ? 0 : b.kind === 'ball' ? 1 : 2));
      const pages = Math.max(1, Math.ceil(own.length / 60)); s.ownPage = Math.max(1, Math.min(s.ownPage, pages));
      const visible = own.slice((s.ownPage - 1) * 60, s.ownPage * 60);
      const tabs = [['', 'all', 'allKinds'], ['pokemon', 'poke', 'Pokemon'], ['ball', 'ball', 'Poke Balls'], ['item', 'item', 'Items']];
      const label = bridge.language() === 'en' ? 'INVENTORY' : bridge.language() === 'es' ? 'INVENTARIO' : 'INVENTÁRIO';
      const count = teamRows('owned').filter(x => x.kind === 'pokemon').length;
      const quantity = teamRows('owned').filter(x => x.kind !== 'pokemon').reduce((sum, x) => sum + (x.quantity || 0), 0);
      const slots = visible.map(x => {
        const info = x.kind === 'pokemon' ? `${x.shiny ? '✨ ' : ''}${x.name} · ${tr('level')} ${nf(x.level)} · IV ${x.ivTotal == null ? '—' : nf(x.ivTotal)} · Q ${x.quality == null ? '—' : nf(x.quality)}` : `${x.name} · ${nf(x.quantity)}×`;
        const detail = x.kind === 'pokemon' ? `${tr('level')} ${nf(x.level)} · IV ${x.ivTotal == null ? '—' : nf(x.ivTotal)} · Q ${x.quality == null ? '—' : nf(x.quality)}` : `${esc(tr(x.kind === 'ball' ? 'Poke Balls' : x.kind === 'diamonds' ? 'Diamonds' : 'Items'))} · ${nf(x.quantity)}×`;
        return `<button class="mk-bag-slot${x.kind === 'pokemon' ? ' pokemon' : ''}${x.id === s.ownedId ? ' selected' : ''}${x.team ? ' team' : ''}" data-owned="${esc(x.id)}" aria-pressed="${x.id === s.ownedId}" aria-label="${esc(info + (x.accountName ? ' · ' + x.accountName : ''))}" title="${esc(info)}">${art(x)}<span class="mk-inventory-description"><b>${esc(x.name)}${x.shiny ? ' ✨' : ''}${x.team ? ' ★' : ''}</b><span>${detail}</span>${x.kind === 'pokemon' ? `<small>${quality(x)} · #${esc((x.sourceId || x.id).replace(/^pokemon:/, ''))}</small>` : ''}<small>${esc(x.accountName || '')}</small></span></button>`;
      }).join('');
      return `<h4 class="mk-bag-title">${label}</h4><nav class="mk-bag-tabs" aria-label="${esc(label)}">${tabs.map(([kind, icon, key]) => `<button data-own-kind="${kind}" aria-pressed="${s.ownKind === kind}" class="${s.ownKind === kind ? 'active' : ''}"><span class="mk-bag-icon icon-${icon}" aria-hidden="true"></span>${esc(tr(key))}</button>`).join('')}</nav><div class="mk-bag-count"><span>${nf(count)} Pokémon</span><span></span><span>${nf(quantity)} ${esc(tr('Items'))}</span></div><div class="mk-bag-grid">${slots}</div>${!own.length ? `<p class="mk-bag-empty">${esc(tr('ownEmpty'))}</p>` : ''}<div class="mk-bag-paging" ${pages === 1 ? 'hidden' : ''}><button data-own-page="${s.ownPage - 1}" ${s.ownPage === 1 ? 'disabled' : ''}>‹</button><span>${s.ownPage} / ${pages}</span><button data-own-page="${s.ownPage + 1}" ${s.ownPage === pages ? 'disabled' : ''}>›</button></div>`;
    }
    const saleText = () => ({
      pt: { title: 'Preço sugerido de venda', basis: 'Mediana dos anúncios semelhantes, excluindo seus próprios anúncios. Com cotação, as moedas são convertidas antes do cálculo. Valores por unidade, antes das taxas; diamantes arredondados para cima. Referência de anúncios ativos, sem garantia de venda.', unavailable: 'Sem dados completos da bag ou anúncios comparáveis para sugerir um preço.', starter: 'Pokémon inicial não pode ser anunciado no mercado.' },
      en: { title: 'Suggested selling price', basis: 'Median of similar listings, excluding your own. With a quote, currencies are converted before calculation. Unit prices before fees; diamonds rounded up. Active listing reference, with no guaranteed sale.', unavailable: 'No complete inventory data or comparable listings to suggest a price.', starter: 'Starter Pokémon cannot be listed on the market.' },
      es: { title: 'Precio de venta sugerido', basis: 'Mediana de anuncios similares, excluyendo los propios. Con cotización, las monedas se convierten antes del cálculo. Precios unitarios antes de tasas; diamantes redondeados hacia arriba. Referencia de anuncios activos, sin garantía de venta.', unavailable: 'Faltan datos completos del inventario o anuncios comparables para sugerir un precio.', starter: 'El Pokémon inicial no puede anunciarse en el mercado.' }
    }[bridge.language()] || { title: 'Suggested selling price', basis: '', unavailable: 'No comparable prices', starter: 'Starter Pokémon' });
    function comparisonScreen() {
      const own = ownedSelection();
      let html = `<section class="mk-form"><h3 class="mk-section-title">◆ ${esc(tr('compare'))}</h3><label class="mk-own-search">${esc(tr('ownSearch'))}<input id="mkOwnSearch" type="search" maxlength="120" placeholder="${esc(tr('ownSearch'))}" value="${esc(s.ownQ)}"></label>${teamLoading ? `<p class="mk-note" role="status">${esc(teamText('Carregando inventários das contas conectadas…','Loading connected accounts’ inventories…','Cargando inventarios de las cuentas conectadas…'))}</p>` : ''}<div class="mk-inventory-picker"><div class="mk-bag" id="mkBag">${inventoryBag()}</div><div class="mk-own-info">`;
      html += teamNotice();
      if (own && !own.ownedReady) html += `<p class="mk-note">${esc(tr('ownLoading'))}</p>`;
      if (!own) return html + empty(tr('compareEmpty')) + '</div></div></section>';
      html += `<div class="mk-row-name">${art(own)}<div><b>${esc(own.name)}</b><span class="mk-meta">${meta(own)} ${accountLink(own)}</span></div></div>`;
      if (own.kind === 'pokemon') {
        html += `<div class="mk-stats">${Object.entries(own.stats).map(([key, value]) => `<div class="mk-stat"><small>${esc(tr(key))}</small><b>${value == null ? '—' : nf(value)}</b></div>`).join('')}</div>`;
        html += `<div class="mk-form-fields">${[['iv', 'IV ±', 192, 1], ['lv', tr('level') + ' ±', 100000, 1], ['q', 'Q ±', 100, .01]].map(([key, label, max, step]) => `<label>${esc(label)}<input data-tolerance="${key}" type="number" min="0" max="${max}" step="${step}" value="${s.tolerance[key]}" ${s.tolerance.broad ? 'disabled' : ''}></label>`).join('')}<button data-widen>${esc(tr(s.tolerance.broad ? 'narrow' : 'widen'))}</button></div><p class="mk-note">${esc(tr(s.tolerance.broad ? 'broadRule' : 'compareRule'))}</p>`;
        if (['level', 'ivTotal', 'quality'].some(key => own[key] == null)) html += `<p class="mk-note">${esc(tr('missingConditions'))}</p>`;
      }
      const closePicker = '</div></div></section>';
      if (s.comparePending && !s.compareDone) return html + empty(tr('loading')) + closePicker;
      if (s.compareError) return html + empty(tr(s.compareError)) + closePicker;
      if (!s.compareDone) return html + closePicker;
      const list = rows(), summary = M.priceSummary(list);
      const expanded = s.tolerance.broad;
      if (expanded) html += `<p class="mk-note" role="status">${esc(teamText('Referência de toda a espécie: níveis, IVs e raridades diferentes. Este valor não avalia o exemplar selecionado.','Whole-species reference: different levels, IVs and rarities. This does not value the selected specimen.','Referencia de toda la especie: diferentes niveles, IVs y rarezas. No valora el ejemplar seleccionado.'))}</p>`;
      else if (own.kind === 'pokemon' && !list.length) html += `<p class="mk-note" role="status">${esc(teamText('Sem anúncios semelhantes no nível, IV e raridade deste Pokémon. Não é possível sugerir um preço confiável. Use a ampliação apenas para consultar a espécie.','No similar listings at this Pokémon’s level, IV and rarity. A reliable selling estimate is unavailable. Widen only to consult the species.','Sin anuncios similares de este nivel, IV y rareza. No hay una estimación fiable. Amplía solo para consultar la especie.'))}</p>`;
      const sale = saleText(), recommendation = M.saleRecommendation(own.ownedReady ? list : [], own, comparisonTolerance(), s.rate, teamRows('mine',-1).map(x=>({...x,id:x.sourceId})));
      html += `<section class="mk-form mk-sale-recommendation"><h3 class="mk-section-title">◆ ${esc(expanded ? ({pt:'Preço de referência da espécie',en:'Species reference price',es:'Precio de referencia de la especie'}[bridge.language()]) : sale.title)}</h3>${recommendation.count ? `<div class="mk-detail-line"><span>DOLLARS</span><b>${recommendation.GOLD == null ? '—' : price({ price: recommendation.GOLD, currency: 'GOLD', kind: own.kind })}</b></div><div class="mk-detail-line"><span>DIAMONDS</span><b>${recommendation.DIAMONDS == null ? '—' : price({ price: recommendation.DIAMONDS, currency: 'DIAMONDS', kind: own.kind })}</b></div><p class="mk-meta">${nf(recommendation.count)} ${esc(tr('ads'))}</p><p class="mk-note">${esc(sale.basis)}</p>` : `<p class="mk-note">${esc(own.starter ? sale.starter : !own.ownedReady ? tr('ownLoading') : list.length ? sale.unavailable : tr('empty'))}</p>`}</section>`;
      const bids = M.comparable(s.data.requests.map(x => ({ ...x, currency: x.currency || 'GOLD' })), own, s.tolerance);
      html += `<div class="mk-compare-summary">${['GOLD', 'DIAMONDS'].map(currency => {
        const data = summary[currency], requests = bids.filter(x => x.currency === currency && x.price > 0 && !x.offerOnly);
        const value = n => n == null ? '—' : price({ price: n, currency, kind: own.kind });
        return `<section class="mk-form"><h3 class="mk-section-title">${currency === 'GOLD' ? 'DOLLARS' : 'DIAMONDS'}</h3><div class="mk-detail-line"><span>${esc(tr('lowest'))}</span><b>${value(data.min)}</b></div><div class="mk-detail-line"><span>${esc(tr('median'))}</span><b>${value(data.median)}</b></div><p class="mk-meta">${nf(data.count)} ${esc(tr('ads'))}</p><div class="mk-detail-line"><span>${esc(tr('highestBid'))}</span><b>${value(requests.length ? Math.max(...requests.map(x => x.price)) : null)}</b></div><p class="mk-meta">${nf(requests.length)} ${esc(tr('requests'))}</p></section>`;
      }).join('')}</div>` + closePicker + `<p class="mk-note">${esc(tr('sample', { n: nf(list.length) }))}</p><p class="mk-note">${esc(tr('bidNote'))}</p>`;
      if (own.kind === 'pokemon') html += `<p class="mk-note">${esc(tr('fetched', { n: nf(s.compareList.length), total: nf(s.compareTotal) }))}</p>`;
      html += `<h3 class="mk-section-title">◆ ${esc(tr('similar'))}</h3>` + renderListings(list);
      if (own.kind === 'pokemon' && s.comparePage < s.comparePages) html += `<button data-compare-more ${s.comparePending ? 'disabled' : ''}>${esc(tr(s.comparePending ? 'loading' : 'more'))}</button>`;
      if (bids.length) html += `<h3 class="mk-section-title" style="margin-top:20px">◆ ${esc(tr('openRequests'))}</h3>` + bids.map(x => `<div class="mk-record"><div><b>${esc(x.name)}</b><small>${nf(x.amount)}×</small></div>${price(x)}</div>`).join('');
      return html;
    }

    async function comparisonResponse(account,cid,own,current) {
      const ready = snapshotMode && snapshots.get(account,cid);
      if (ready) {
        const list = M.comparable(ready.listings,own,s.tolerance);
        return {ok:true,data:{...ready.data,listings:list,total:list.length,pages:1},book:{listings:list}};
      }
      return M.readComparisonBook(script=>current() ? marketRead(account,script,current) : Promise.resolve({ok:false,reason:'changed'}),own,{...s.tolerance},cid,s.rate);
    }
    async function loadComparison(more = false, retried = false) {
      invalidate(); const revision = s.revision, account = s.account, own = ownedSelection();
      if (!s.open || s.tab !== 'compare' || !own) return;
      s.selected = ''; s.compareError = '';
      if (!more) { s.compareList = []; s.comparePage = 0; s.compareDone = false; }
      if (own.kind !== 'pokemon') { s.compareList = s.data.listings; s.compareDone = true; s.comparePending = false; render(); return; }
      if (!(own.speciesId > 0)) { s.compareError = 'noSpecies'; s.comparePending = false; render(); return; }
      s.comparePending = true; render();
      try {
        const response = await comparisonResponse(account,s.cid,own,()=>s.open && revision === s.revision && s.account === account && s.tab === 'compare');
        if (!s.open || revision !== s.revision || s.account !== account || s.tab !== 'compare') return;
        if (!response || !response.ok) {
          if (response?.reason === 'changed') {
            const accounts = await bridge.accounts();
            if (s.open && revision === s.revision) {
              s.accounts = accounts;
              const fresh = accounts[account];
              if (fresh?.live && fresh.cid && fresh.cid !== s.cid) {
                teamData.delete(account); accountChanged(account); return;
              }
              if (fresh?.live && (!fresh.cid || fresh.cid === s.cid) && !retried) {
                marketRead.clearPages(account); void loadComparison(more,true); return;
              }
              s.compareError = fresh?.live ? 'changed' : 'offline';
            }
          } else s.compareError = response?.reason || 'network';
          return;
        }
        const data = M.sanitizeResponse(response.data);
        if (data.cid !== s.cid) { s.compareError = 'changed'; return; }
        s.compareList = response.book.listings;
        s.comparePage = 1; s.comparePages = 1; s.compareTotal = s.compareList.length; s.compareDone = true; s.time = Date.now();
      } catch { if (revision === s.revision) s.compareError = 'network'; }
      finally { if (s.open && revision === s.revision) { s.comparePending = false; render(); } }
    }

    const alertText = key => ({
      pt: { create: 'CRIAR ALERTA', kind: 'Tipo', search: 'Buscar item ou espécie/forma', target: 'O que monitorar?', choose: 'Selecione um bem', price: 'Preço máximo por unidade (opcional)', any: 'Qualquer', normal: 'Comum', desktop: 'Notificação no PC', voice: 'Voz', add: 'Salvar alerta', invalid: 'Selecione um bem e confira as faixas e valores. Limite: 10 alertas.', list: 'ALERTAS SALVOS', pause: 'Pausar', resume: 'Ativar', remove: 'Remover', check: 'Verificar agora', waiting: 'Aguardando primeira consulta', active: 'Monitorando', paused: 'Pausado', note: 'Verificação a cada 60 segundos com o PokeMux aberto, mesmo com esta janela fechada. A primeira consulta não avisa anúncios existentes. Pokémon: até 60 ofertas recentes por espécie/verificação; ofertas publicadas e removidas entre consultas podem não ser detectadas. Preços são unitários. Notificação e voz respeitam os controles gerais de alertas e voz do app.', last: 'Última consulta', hit: 'Última oferta detectada', empty: 'Nenhum alerta salvo. Os alertas ficam vinculados ao personagem e à conta escolhidos.' },
      en: { create: 'CREATE ALERT', kind: 'Kind', search: 'Search item or species/form', target: 'What to monitor?', choose: 'Select an asset', price: 'Maximum unit price (optional)', any: 'Any', normal: 'Regular', desktop: 'Desktop notification', voice: 'Voice', add: 'Save alert', invalid: 'Select an asset and check ranges and values. Limit: 10 alerts.', list: 'SAVED ALERTS', pause: 'Pause', resume: 'Enable', remove: 'Remove', check: 'Check now', waiting: 'Waiting for first check', active: 'Monitoring', paused: 'Paused', note: 'Checks every 60 seconds while PokeMux is running, even with this window closed. The first check does not announce existing offers. Pokémon: up to 60 recent offers per species/check; offers listed and removed between checks may be missed. Unit prices. Notifications and voice respect the app’s master alerts and voice controls.', last: 'Last check', hit: 'Last detected offer', empty: 'No saved alerts. Alerts are tied to the selected character and account.' },
      es: { create: 'CREAR ALERTA', kind: 'Tipo', search: 'Buscar objeto o especie/forma', target: '¿Qué monitorear?', choose: 'Selecciona un bien', price: 'Precio unitario máximo (opcional)', any: 'Cualquiera', normal: 'Común', desktop: 'Notificación en PC', voice: 'Voz', add: 'Guardar alerta', invalid: 'Selecciona un bien y revisa los valores. Límite: 10 alertas.', list: 'ALERTAS GUARDADAS', pause: 'Pausar', resume: 'Activar', remove: 'Eliminar', check: 'Verificar ahora', waiting: 'Esperando primera consulta', active: 'Monitoreando', paused: 'Pausado', note: 'Consultas cada 60 segundos con PokeMux abierto, incluso con esta ventana cerrada. La primera consulta no anuncia ofertas existentes. Pokémon: hasta 60 ofertas recientes por especie/consulta; ofertas publicadas y retiradas entre consultas pueden no detectarse. Precios unitarios. Notificaciones y voz respetan los controles generales de la app.', last: 'Última consulta', hit: 'Última oferta detectada', empty: 'No hay alertas. Se vinculan al personaje y cuenta seleccionados.' }
    }[bridge.language()] || {})[key] || key;
    function alertTargets() {
      if (!s.data) return [];
      const all = alertKind === 'pokemon' ? s.data.alertCatalog : catalog().filter(x => alertKind === 'item' ? x.kind !== 'pokemon' : x.kind === alertKind);
      return [...new Map(all.map(x => [x.kind + ':' + (x.kind === 'pokemon' ? x.speciesId : x.refId), x])).values()];
    }
    function hideAlertSuggestions() {
      const list = el('#mkAlertSuggestions'), input = el('#mkAlertSearch');
      if (list) list.hidden = true;
      if (input) { input.setAttribute('aria-expanded', 'false'); input.removeAttribute('aria-activedescendant'); }
    }
    function showAlertSuggestions() {
      const input = el('#mkAlertSearch'), list = el('#mkAlertSuggestions');
      if (!input || !list) return;
      const needle = M.normalized(input.value.trim());
      if (!needle) { hideAlertSuggestions(); return; }
      const matches = alertTargets().filter(x => M.normalized(x.name).includes(needle) || String(x.speciesId || x.refId) === needle).slice(0, 30);
      list.innerHTML = matches.length ? matches.map((x, i) => `<button type="button" role="option" aria-selected="false" tabindex="-1" id="mkAlertOption${i}" data-alert-target="${esc(x.kind + ':' + (x.kind === 'pokemon' ? x.speciesId : x.refId))}">${art(x)}<span>${esc(x.name)}${x.kind === 'pokemon' ? `<small>#${x.speciesId}</small>` : ''}</span></button>`).join('') : `<p role="status">${esc(tr('empty'))}</p>`;
      list.hidden = false; input.setAttribute('aria-expanded', 'true'); input.removeAttribute('aria-activedescendant');
    }
    function chooseAlertTarget(key) {
      const target = alertTargets().find(x => x.kind + ':' + (x.kind === 'pokemon' ? x.speciesId : x.refId) === key);
      if (!target) return;
      el('#mkAlertTarget').value = key;
      el('#mkAlertSearch').value = target.name + (target.kind === 'pokemon' ? ' · #' + target.speciesId : '');
      el('#mkAlertSearch').focus(); hideAlertSuggestions(); updateAlertEvolutions();
    }
    function updateAlertEvolutions() {
      const preview = el('#mkAlertEvolutionNames');
      if (!preview) return;
      const id = Number((el('#mkAlertTarget').value || '').split(':')[1]);
      const ids = el('#mkAlertEvolutions').checked ? M.evolutionIds(id, s.data.alertCatalog) : [];
      preview.textContent = ids.map(id => (s.data.alertCatalog.find(x => x.speciesId === id) || {}).name || '#' + id).join(' → ');
    }
    function alertList() {
      return alertRules.length ? alertRules.map(rule => {
        const state = monitor && monitor.state(rule.id), status = !rule.enabled ? alertText('paused') : state && state.error && state.error !== 'ok' ? tr(state.error) : state && state.ready ? alertText('active') : alertText('waiting');
        const ranges = [['iv', 'IV'], ['lv', tr('level')], ['q', 'Q']].filter(([key]) => rule[key + 'Min'] != null || rule[key + 'Max'] != null).map(([key, label]) => label + ' ' + (rule[key + 'Min'] ?? '—') + '–' + (rule[key + 'Max'] ?? '—')).join(' · ');
        return `<section class="mk-form mk-alert-rule"><div><h3 class="mk-section-title">${esc(rule.name)}</h3><p class="mk-meta">${esc(rule.accountName)} · ${esc(rule.currency === 'ANY' ? alertText('any') + ' $ / 💎' : rule.currency === 'GOLD' ? 'dollars' : 'diamonds')}${rule.priceMax != null ? ' · ≤ ' + nf(rule.priceMax) : ''}${rule.kind === 'pokemon' ? ' · ' + esc(rule.shiny === 'any' ? alertText('any') + ' shiny' : rule.shiny === 'yes' ? '✨ Shiny' : alertText('normal')) : ''}${rule.includeEvolutions ? ' · ' + esc(tr('includeEvolutions')) + ' (' + rule.speciesIds.map(id => '#' + id).join(', ') + ')' : ''}${ranges ? ' · ' + esc(ranges) : ''}</p><p class="mk-note">${esc(status)}${state && state.checkedAt ? ' · ' + esc(alertText('last')) + ': ' + esc(new Date(state.checkedAt).toLocaleTimeString(locale())) : ''}</p>${state && state.lastHit ? `<p class="mk-meta">${esc(alertText('hit'))}: ${esc(state.lastHit.name)} · ${price(state.lastHit)} · ${esc(new Date(state.lastHitAt).toLocaleTimeString(locale()))}</p>` : ''}</div><div class="mk-alert-actions"><button data-alert-toggle="${esc(rule.id)}">${esc(alertText(rule.enabled ? 'pause' : 'resume'))}</button><button data-alert-remove="${esc(rule.id)}">${esc(alertText('remove'))}</button></div></section>`;
      }).join('') : empty(alertText('empty'));
    }
    function alertsScreen() {
      return `<form id="mkAlertForm" class="mk-form"><h3 class="mk-section-title">◆ ${esc(alertText('create'))} · ${esc(s.data.name)}</h3><div class="mk-form-fields"><label>${esc(alertText('kind'))}<select id="mkAlertKind"><option value="item" ${alertKind === 'item' ? 'selected' : ''}>${esc(tr('Items'))} / ${esc(tr('Poke Balls'))} / Diamonds</option><option value="pokemon" ${alertKind === 'pokemon' ? 'selected' : ''}>Pokémon</option></select></label><div class="mk-alert-picker"><label for="mkAlertSearch">${esc(alertText('target'))}</label><input id="mkAlertSearch" type="search" maxlength="120" placeholder="${esc(alertText('search'))}" role="combobox" aria-autocomplete="list" aria-expanded="false" aria-controls="mkAlertSuggestions" autocomplete="off" required><input id="mkAlertTarget" type="hidden"><div id="mkAlertSuggestions" role="listbox" aria-label="${esc(alertText('target'))}" hidden></div></div></div><div class="mk-form-fields"><label>${esc(alertText('price'))}<input name="priceMax" type="number" min="1" step="any"></label><label>${esc(tr('currency'))}<select name="currency"><option value="ANY">${esc(alertText('any'))} ($ / 💎)</option><option value="GOLD">dollars</option><option value="DIAMONDS">diamonds</option></select></label>${alertKind === 'pokemon' ? `<label>Shiny<select name="shiny"><option value="any">${esc(alertText('any'))}</option><option value="yes">Shiny</option><option value="no">${esc(alertText('normal'))}</option></select></label><label class="mk-evolutions" title="${esc(tr('evolutionHint'))}"><span><input id="mkAlertEvolutions" type="checkbox"> ${esc(tr('includeEvolutions'))}</span><small id="mkAlertEvolutionNames"></small></label>` : ''}</div>${alertKind === 'pokemon' ? `<div class="mk-form-fields">${[['iv', 'IV', 0, 192, 1], ['lv', tr('level'), 1, 100000, 1], ['q', 'Q', 0, 100, .01]].map(([key, label, min, max, step]) => ['Min', 'Max'].map(bound => `<label>${esc(label + ' ' + tr(bound === 'Min' ? 'from' : 'to'))}<input name="${key + bound}" type="number" min="${min}" max="${max}" step="${step}"></label>`).join('')).join('')}</div>` : ''}<div class="mk-alert-channels"><label><input name="desktop" type="checkbox" checked> ${esc(alertText('desktop'))}</label><label><input name="voice" type="checkbox" checked> ${esc(alertText('voice'))}</label><button type="submit">${esc(alertText('add'))}</button></div><p id="mkAlertError" class="mk-note" role="alert"></p><p class="mk-note">${esc(alertText('note'))}</p></form><h3 class="mk-section-title">◆ ${esc(alertText('list'))}</h3><button data-alert-check>${esc(alertText('check'))}</button><div id="mkAlertList">${alertList()}</div>`;
    }
    function saveAlerts() { bridge.save('marketAlerts', JSON.stringify(alertRules)); monitor.setRules(alertRules); if (el('#mkAlertList')) el('#mkAlertList').innerHTML = alertList(); }

    function render(preservePage = false) {
      hideIv();
      chrome();
      let content, total = 0, from = 0, to = 0;
      el('.mk-pages').hidden = true;
      if (s.pending) content = empty(tr('loading'));
      else if (s.error || !s.data) content = empty(tr(s.error || 'offline'));
      else if (s.tab === 'buy' || s.tab === 'mine') {
        const data = rows(), server = s.tab === 'buy' && s.category === 'Pokemon' && s.pickedSpecies != null;
        total = server ? s.total : data.length;
        const pages = server ? s.pages : Math.max(1, Math.ceil(total / 12)); if (!preservePage) s.page = Math.max(1, Math.min(s.page, pages));
        const offset = (s.page - 1) * 12, visible = server ? data : data.slice(offset, offset + 12);
        from = visible.length ? offset + 1 : 0; to = visible.length ? Math.min(total, offset + visible.length) : 0;
        content = `<h3 class="mk-section-title">◆ ${esc(tr(s.tab === 'mine' ? 'mine' : 'results'))}</h3>` + (s.tab === 'mine' && teamLoading ? `<p class="mk-note" role="status">${esc(teamText('Atualizando anúncios das contas conectadas…','Updating connected accounts’ listings…','Actualizando anuncios de las cuentas conectadas…'))}</p>` : '') + (s.tab === 'mine' ? teamNotice() : '') + renderListings(visible, offset);
        el('.mk-pages').innerHTML = pagination(s.page, pages); el('.mk-pages').hidden = total === 0;
      } else if (s.tab === 'compare') { content = comparisonScreen(); total = rows().length; from = total ? 1 : 0; to = total; }
      else if (s.tab === 'alerts') content = alertsScreen();
      else if (s.tab === 'requests') content = requestScreen();
      else if (s.tab === 'history') content = `<h3 class="mk-section-title">◆ ${esc(tr('history'))}</h3>` + (s.data.history.length ? s.data.history.map(x => `<div class="mk-record"><div><b>${esc(tr(x.bought ? 'bought' : 'sold'))} ${nf(x.amount)}× ${esc(x.name)}</b><small>${esc(Number.isNaN(Date.parse(x.at)) ? '—' : new Date(x.at).toLocaleString())}</small></div>${price(x)}</div>`).join('') : empty());
      else content = empty();
      el('#mkResults').innerHTML = content;
      el('#mkCount').textContent = tr('showing', { from: nf(from), to: nf(to), total: nf(total) });
      const balances = [...teamData].filter(([account,entry])=>s.accounts[account]?.live && !s.accounts[account]?.off && (!s.accounts[account].cid || s.accounts[account].cid === entry.data.cid) && (s.accountFilter < 0 || account === s.accountFilter)).map(([,entry])=>entry.data);
      const gold = balances.reduce((sum,data)=>sum+data.gold,0), diamonds = balances.reduce((sum,data)=>sum+data.diamonds,0);
      el('.mk-footer-right').innerHTML = s.data && !s.error ? `<span>${nf(gold)} dollars</span><span>💎 ${nf(diamonds)}</span>` : '';
      if (s.data && !s.pending && !s.error) totals();
    }

    function keepMarketView(update) {
      const key = node => node && (node.id ? 'id:' + node.id : node.name ? 'name:' + node.name : node.dataset.tolerance ? 'tolerance:' + node.dataset.tolerance : node.dataset.listing ? 'listing:' + node.dataset.listing : node.dataset.owned ? 'owned:' + node.dataset.owned : '');
      const active = document.activeElement, focusKey = key(active);
      const selection = active && typeof active.selectionStart === 'number' ? [active.selectionStart, active.selectionEnd] : null;
      const fields = [...el('#mkResults').querySelectorAll('input,select,textarea')].map(node => ({ key: key(node), value: node.value, checked: node.checked }));
      const scrolls = ['#mkResults', '.mk-bag-grid'].map(selector => ({ selector, top: el(selector)?.scrollTop || 0, left: el(selector)?.scrollLeft || 0 }));
      update();
      const controls = [...overlay.querySelectorAll('input,select,textarea,button,[data-listing]')];
      for (const field of fields) { const node = controls.find(node => key(node) === field.key); if (node && field.key) { node.value = field.value; node.checked = field.checked; } }
      const focus = controls.find(node => focusKey && key(node) === focusKey);
      if (focus && focus !== document.activeElement) focus.focus({ preventScroll: true });
      if (focus && selection) try { focus.setSelectionRange(...selection); } catch {}
      for (const scroll of scrolls) { const node = el(scroll.selector); if (node) { node.scrollTop = scroll.top; node.scrollLeft = scroll.left; } }
      totals();
    }

    function snapshotOptions() { return {...s,speciesId:s.pickedSpecies === 'all' ? undefined : s.pickedSpecies}; }
    function applySnapshot(snapshot) {
      const response = M.snapshotPage({...snapshot,rate:s.rate || snapshot.rate},snapshotOptions(),s.data?.alertCatalog || snapshot.data.alertCatalog);
      s.listings = response.data.listings; s.total = response.data.total; s.pages = response.data.pages;
      s.page = Math.max(1,Math.min(s.page,s.pages)); s.rate = s.rate || snapshot.rate;
      s.time = snapshot.at;
      if (s.selected && !snapshot.listings.some(x=>x.id===s.selected)) s.selected = '';
    }
    async function reconcileSnapshot(account,cid,force = false) {
      syncingSnapshots.add(account); if (s.open && s.account === account) status();
      const response = await snapshots.ensure(account,cid,force);
      syncingSnapshots.delete(account);
      if (s.open && s.account === account && s.cid === cid && s.tab === 'buy' && s.category === 'Pokemon' && !s.pending) {
        if (response?.ok) keepMarketView(()=>{ applySnapshot(response.snapshot); autoError=''; render(true); });
        else { autoError = response?.reason || 'network'; status(); }
      }
      if (s.open && s.account === account) status();
      return response;
    }
    async function warmCache() {
      if (!snapshotMode || warming) return;
      warming = true; let delay = 10000;
      try {
        const accounts = await bridge.accounts();
        s.accounts = accounts;
        void loadTeam();
        const live = accounts.map((x,i)=>({...x,index:i})).filter(x=>x.live && !x.off && x.cid);
        const chosen = live.find(x=>x.index===s.account && s.open) || live.find(x=>x.focused) || live.find(x=>x.index===bridge.preferred()) || live[0];
        if (chosen) { const response = await reconcileSnapshot(chosen.index,chosen.cid); delay = response?.ok || response?.reason === 'limited' || response?.reason === 'denied' ? 300000 : 30000; }
      } catch {}
      finally { warming = false; if (bridge.marketSnapshotOptions?.background !== false) warmTimer = setTimeout(warmCache,delay); }
    }
    async function readMarketPokemon(options, revision, account, cid, quotePromise, refresh = false) {
      const current = () => s.open && s.revision === revision && s.account === account;
      let rate = s.rate;
      if (quotePromise) {
        const quote = await quotePromise;
        if (!quote || !quote.ok) return quote || {ok:false,reason:'network'};
        const data = M.sanitizeResponse(quote.data);
        if (cid && data.cid !== String(cid)) return {ok:false,reason:'changed'};
        cid ||= data.cid;
        rate = M.diamondRate(data.listings);
      }
      if (snapshotMode) {
        const ready = snapshots.get(account,cid);
        if (ready) {
          const response = refresh ? await snapshots.ensure(account,cid,true) : {ok:true,snapshot:ready};
          if (!current()) return {ok:false,reason:'changed'};
          if (!response?.ok) return response;
          return M.snapshotPage({...response.snapshot,rate:rate || response.snapshot.rate},options,s.data?.alertCatalog || response.snapshot.data.alertCatalog);
        }
        // A cold full-market cache must not block a regular page or a focused query.
        // The background scan continues independently; no partial price ranking is shown.
      }
      const read = script => current() ? marketRead(account,script,current) : Promise.resolve({ok:false,reason:'changed'});
      if (['price-asc','price-desc'].includes(options.sort) && rate > 0) {
        options.onProgress = (page,pages) => { if (current()) el('.mk-status').textContent = tr('loading') + ` (${page}/${pages})`; };
        const response = await M.readPricePage(read,options,cid,s.data && s.data.alertCatalog || [],rate,refresh ? null : s.priceBook);
        return response;
      }
      return options.includeEvolutions && (options.speciesId || String(options.q || '').trim())
        ? M.readPokemonGroup(read,options,cid,s.data && s.data.alertCatalog || []) : read(M.readScript(options,cid));
    }

    async function autoRefresh() {
      if (!s.open || !s.data || s.error || s.priceScanning || s.pending || s.comparePending || s.timer || autoBusy || Date.now() < autoRetryAt) return;
      autoBusy = true;
      const revision = s.revision, account = s.account, cid = s.cid, tab = s.tab;
      const current = () => s.open && s.revision === revision && s.account === account;
      const read = options => current() ? marketRead(account, M.readScript(options, cid)) : Promise.resolve({ ok: false, reason: 'changed' });
      const category = ['compare', 'alerts'].includes(tab) ? 'All' : s.category;
      const keys = ['data'], tasks = [read({ category, includeOwned: ['compare','mine'].includes(tab), includeAlertCatalog: tab === 'alerts' || category === 'Pokemon' || tab === 'buy' && category === 'All' })];
      const add = (key, task) => { keys.push(key); tasks.push(task); };
      try {
        if (category !== 'All') add('highlights', read({ category: 'All' }));
        if (tab === 'buy' && category === 'Pokemon') {
          const options = { ...s, browse: 'pokemon', speciesId: s.pickedSpecies === 'all' ? undefined : s.pickedSpecies };
          add('listings', readMarketPokemon(options,revision,account,cid,tasks[keys.indexOf('highlights')],!snapshotMode));
        }
        const own = tab === 'compare' && ownedSelection();
        if (own && own.kind === 'pokemon' && s.compareDone) {
          const tolerance = { ...s.tolerance };
          add('comparison', (async () => {
            const inventory = await tasks[0];
            if (!inventory || !inventory.ok) return inventory;
            const freshOwn = own.account === account ? M.sanitizeResponse(inventory.data).owned.find(x => x.id === (own.sourceId || own.id)) : own;
            if (!freshOwn) return { ok: true, data: { cid, listings: [], total: 0, pages: 1 } };
            const response = await comparisonResponse(account,cid,freshOwn,current);
            if (!response || !response.ok) return response;
            return { ok: true, data: { ...response.data, listings: response.book.listings, total: response.book.listings.length, pages: 1 } };
          })());
        }
        const responses = await Promise.all(tasks);
        if (!current()) return;
        const failed = responses.find(response => !response || !response.ok);
        if (responses.some(response => !response || !response.ok)) {
          autoError = failed && failed.reason || 'network';
          if (autoError === 'limited') autoRetryAt = Date.now() + 300000;
          status(); return;
        }
        const data = responses.map(response => M.sanitizeResponse(response.data));
        if (data.some(x => x.cid !== cid)) { autoError = 'changed'; status(); return; }
        keepMarketView(() => {
          for (let i = 0; i < keys.length; i++) {
            const value = data[i];
            if (keys[i] === 'data') { s.data = value; rememberTeam(account,value,['compare','mine'].includes(tab)); if (category === 'All') { s.highlights = M.marketHighlights(value.listings); s.rate = M.diamondRate(value.listings); } }
            else if (keys[i] === 'highlights') { s.highlights = M.marketHighlights(value.listings); s.rate = M.diamondRate(value.listings); }
            else if (keys[i] === 'species') s.species = value.species;
            else if (keys[i] === 'comparison') { s.compareList = value.listings; s.compareTotal = value.total; s.comparePages = value.pages; }
            else { s.listings = value.listings; s.total = value.total; s.pages = value.pages; if (responses[i].book) s.priceBook = responses[i].book; }
          }
          if (own && own.kind !== 'pokemon') s.compareList = s.data.listings;
          s.time = snapshotMode && tab === 'buy' && category === 'Pokemon' ? snapshots.get(account,cid)?.at || Date.now() : Date.now(); autoError = ''; render(true);
        });
      } catch { if (current()) { autoError = 'network'; status(); } }
      finally { autoBusy = false; if (s.open && ['compare','mine'].includes(s.tab)) void loadTeam(); }
    }

    async function load(refresh = false) {
      invalidate(); const revision = s.revision, account = s.account;
      if (refresh) { s.priceBook = null; marketRead.clearPages(account); }
      if (!s.open || account < 0) return;
      const cached = snapshotMode && snapshots.get(account,s.cid);
      s.pending = !cached || !s.data; s.priceScanning = !!cached && refresh; s.error = '';
      if (cached && s.tab === 'buy' && s.category === 'Pokemon') applySnapshot(cached);
      render();
      const tasks = [], keys = [];
      const read = (key, options) => { keys.push(key); tasks.push(marketRead(account, M.readScript(options, s.cid))); };
      const category = ['compare', 'alerts'].includes(s.tab) ? 'All' : s.category;
      if (!(s.data && s.tab === 'buy' && category === 'Pokemon' && !refresh) && (!s.data || s.loadedCategory !== category || refresh || ['compare', 'alerts', 'mine'].includes(s.tab))) read('data', { category, includeOwned: ['compare','mine'].includes(s.tab), includeAlertCatalog: s.tab === 'alerts' || category === 'Pokemon' || s.tab === 'buy' && category === 'All' });
      if (category !== 'All' && (!s.highlights || refresh)) read('highlights', { category: 'All' });
      if (s.tab === 'buy' && s.category === 'Pokemon') {
        const options = { ...s, browse: 'pokemon', speciesId: s.pickedSpecies === 'all' ? undefined : s.pickedSpecies };
        const quote = tasks[keys.indexOf('highlights')];
        keys.push('listings'); tasks.push(readMarketPokemon(options,revision,account,s.cid,quote,refresh));
      }
      try {
        const responses = await Promise.all(tasks);
        if (!s.open || s.account !== account || s.revision !== revision) return;
        for (let i = 0; i < responses.length; i++) {
          const response = responses[i];
          if (!response || !response.ok) {
            if (['offline','auth','denied','email'].includes(response?.reason)) {
              sourceFailures.add(account);
              const next = s.accounts.findIndex((x,i)=>x.live && !x.off && !sourceFailures.has(i));
              if (next >= 0) { accountChanged(next); return; }
            }
            if (cached && response?.reason !== 'changed') { autoError = response?.reason || 'network'; break; }
            s.error = response?.reason || 'network'; if (!s.data) { s.cid = ''; s.species = null; s.listings = []; } break;
          }
          const data = M.sanitizeResponse(response.data);
          if (s.cid && data.cid !== s.cid) { s.error = 'changed'; s.data = null; s.species = null; s.listings = []; break; }
          s.cid = data.cid;
          if (keys[i] === 'highlights' || keys[i] === 'data' && category === 'All') { s.highlights = M.marketHighlights(data.listings); s.rate = M.diamondRate(data.listings); }
          if (keys[i] === 'highlights') continue;
          if (keys[i] === 'data') {
            s.data = data; rememberTeam(account,data,['compare','mine'].includes(s.tab)); s.loadedCategory = category;
            if (data.alertCatalog.length) {
              const updated = alertRules.map(rule => rule.includeEvolutions ? A.normalize({ ...rule, speciesIds: M.evolutionIds(rule.speciesId, data.alertCatalog) }) : rule);
              if (JSON.stringify(updated) !== JSON.stringify(alertRules)) { alertRules = updated; saveAlerts(); }
            }
          }
          else if (keys[i] === 'species') s.species = data.species;
          else { s.listings = data.listings; s.total = data.total; s.pages = data.pages; if (response.book) s.priceBook = response.book; }
        }
        if (!s.error) s.time = snapshotMode && s.tab === 'buy' && s.category === 'Pokemon' ? snapshots.get(account,s.cid)?.at || Date.now() : Date.now();
      } catch { if (revision === s.revision) { s.error = 'network'; s.data = null; } }
      finally { if (revision === s.revision && s.open) { s.pending = false; s.priceScanning = false; render(); if (!s.error && ['compare','mine'].includes(s.tab)) void loadTeam(refresh,account); if (s.tab === 'compare' && !s.error && ownedSelection()) loadComparison(); } }
    }

    function queryChanged(server = false) {
      s.page = 1; s.selected = '';
      chrome();
      if (snapshotMode && s.tab === 'buy' && s.category === 'Pokemon' && snapshots.get(s.account,s.cid)) {
        invalidate(); applySnapshot(snapshots.get(s.account,s.cid)); render(); return;
      }
      if (server && s.tab === 'buy' && s.category === 'Pokemon' && s.pickedSpecies != null) {
        hideIv(); invalidate(); s.pending = true; s.error = ''; status(); el('#mkResults').innerHTML = empty(tr('loading')); el('.mk-pages').hidden = true;
        s.timer = setTimeout(() => load(), 700);
      } else render();
    }

    function accountChanged(value) {
      hideIv();
      s.highlights = null;
      s.rate = null; s.priceBook = null;
      s.includeEvolutions = false;
      invalidate(); Object.assign(s, { account: Number(value), cid: '', data: null, loadedCategory: '', species: null, listings: [], selected: '', time: 0, error: '', pending: false, page: 1, ownedId: '', ownQ: '', ownKind: '', ownPage: 1, compareList: [], comparePending: false, compareDone: false, compareError: '' });
      if (snapshotMode) {
        s.cid = String(s.accounts[s.account]?.cid || '');
        const cached = snapshots.get(s.account,s.cid);
        if (cached) { s.data = cached.data; s.loadedCategory = 'All'; s.highlights = M.marketHighlights(cached.data.listings); s.rate = cached.rate; s.time = cached.at; }
        if (s.cid && bridge.marketSnapshotOptions?.background !== false) void reconcileSnapshot(s.account,s.cid,true);
      }
      load();
    }

    async function open(tab) {
      if (typeof tab === 'string' && ['buy', 'compare', 'mine', 'requests', 'history', 'alerts'].includes(tab)) s.tab = tab;
      const focus = s.previousFocus || document.activeElement, expanded = bridge.preferred();
      s.previousFocus = focus; s.open = true; invalidate(); const revision = s.revision;
      overlay.classList.add('show'); button.classList.add('on'); chrome();
      clearInterval(clockTimer);
      clockTimer = setInterval(() => {
        if (!s.open) return;
        for (const label of overlay.querySelectorAll('[data-listed-at]')) label.textContent = age(label.dataset.listedAt);
        void autoRefresh();
      }, 60000);
      el('#mkResults').innerHTML = empty(tr('loading'));
      try {
        const accounts = await bridge.accounts();
        if (!s.open || revision !== s.revision) return;
        s.accounts = accounts;
        sourceFailures.clear();
        el('#mkAccount').innerHTML = `<option value="-1">${esc(teamText('Todas as contas','All accounts','Todas las cuentas'))}</option>` + accounts.map((x, i) => `<option value="${i}" ${x.off ? 'disabled' : ''}>${esc(x.name)}${x.live ? '' : ' · offline'}</option>`).join('');
        const active = accounts.findIndex(x => x.focused && x.live && !x.off);
        const preferred = [active, expanded, s.account, ...accounts.map((_, i) => i)].find(i => i >= 0 && accounts[i] && accounts[i].live && !accounts[i].off);
        const account = preferred == null ? accounts.findIndex(x => !x.off) : preferred;
        if (account < 0) { s.error = 'offline'; s.data = null; s.pending = false; render(); return; }
        el('#mkAccount').value = String(s.accountFilter); el('#mkClose').focus(); accountChanged(account);
      } catch { if (s.open && revision === s.revision) { s.error = 'network'; s.pending = false; s.data = null; render(); } }
    }

    function close() {
      hideSearchSuggestions();
      hideIv();
      clearInterval(clockTimer); clockTimer = null;
      s.open = false; invalidate(); overlay.classList.remove('show'); button.classList.remove('on'); button.setAttribute('aria-expanded', 'false');
      if (s.previousFocus && s.previousFocus.isConnected) s.previousFocus.focus(); else button.focus();
      s.previousFocus = null;
    }

    button.addEventListener('pointerdown', () => { if (!s.open) bridge.rememberFocus(document.activeElement); });
    button.onclick = () => s.open ? close() : open();
    el('#mkClose').onclick = close; el('#mkRefresh').onclick = () => load(true); el('#mkAccount').onchange = e => {
      if (s.tab === 'alerts') { if (Number(e.target.value) >= 0) accountChanged(e.target.value); return; }
      s.accountFilter = Number(e.target.value); s.ownPage = 1; s.page = 1;
      const own = ownedSelection();
      if (s.accountFilter >= 0 && own && own.account !== s.accountFilter) { invalidate(); s.ownedId = ''; s.compareDone = false; s.comparePending = false; }
      render();
    };
    el('#mkSearch').oninput = e => { s.q = e.target.value; queryChanged(true); showSearchSuggestions(); };
    el('#mkSearch').onfocus = showSearchSuggestions;
    el('#mkSearch').onblur = e => { if (!e.relatedTarget?.closest('#mkSearchSuggestions')) hideSearchSuggestions(); };
    el('#mkSearchSuggestions').onpointerdown = e => e.preventDefault();
    el('#mkSort').onchange = e => { s.sort = e.target.value; queryChanged(true); };
    el('#mkClear').onclick = () => { resetFilters(); queryChanged(true); };
    el('#mkCards').onclick = () => { s.mode = 'cards'; bridge.save('marketView', s.mode); render(); };
    el('#mkRows').onclick = () => { s.mode = 'rows'; bridge.save('marketView', s.mode); render(); };
    overlay.addEventListener('click', e => {
      if (!e.target.closest('.mk-search-picker')) hideSearchSuggestions();
      if (!e.target.closest('.mk-alert-picker')) hideAlertSuggestions();
      if (e.target === overlay) { close(); return; }
      const target = e.target.closest('button,[data-listing]'); if (!target || target.disabled) return;
      if (target.hasAttribute('data-open-account')) { const account = Number(target.dataset.openAccount); close(); bridge.openAccount?.(account); }
      else if (target.hasAttribute('data-search-option')) chooseSearchSuggestion(Number(target.dataset.searchOption));
      else if (target.hasAttribute('data-alert-target')) chooseAlertTarget(target.dataset.alertTarget);
      else if (target.dataset.tab) { invalidate(); s.pending = false; s.tab = target.dataset.tab; s.page = 1; s.selected = ''; s.q = ''; load(); }
      else if (target.hasAttribute('data-alert-toggle')) { alertRules = alertRules.map(x => x.id === target.dataset.alertToggle ? { ...x, enabled: !x.enabled } : x); saveAlerts(); }
      else if (target.hasAttribute('data-alert-remove')) { alertRules = alertRules.filter(x => x.id !== target.dataset.alertRemove); saveAlerts(); }
      else if (target.hasAttribute('data-alert-check')) monitor.check();
      else if (target.hasAttribute('data-owned')) {
        s.ownedId = target.dataset.owned; s.compareDone = false; s.compareList = []; s.comparePending = false; s.tolerance.broad = false;
        const id = s.ownedId, account = s.account;
        void loadComparison().then(() => {
          if (!s.open || s.tab !== 'compare' || s.account !== account || s.ownedId !== id) return;
          const selected = [...overlay.querySelectorAll('[data-owned]')].find(x => x.dataset.owned === id);
          void inspectIv(selected, e);
        });
      }
      else if (target.hasAttribute('data-own-kind')) { s.ownKind = target.dataset.ownKind; s.ownPage = 1; el('#mkBag').innerHTML = inventoryBag(); el('#mkBag').querySelector(`[data-own-kind="${s.ownKind}"]`).focus(); }
      else if (target.hasAttribute('data-own-page')) { s.ownPage = Number(target.dataset.ownPage); el('#mkBag').innerHTML = inventoryBag(); }
      else if (target.hasAttribute('data-widen')) { s.tolerance.broad = !s.tolerance.broad; loadComparison(); }
      else if (target.hasAttribute('data-compare-more')) loadComparison(true);
      else if (target.dataset.category) { s.category = target.dataset.category; s.pickedSpecies = 'all'; s.selected = ''; s.page = 1; resetFilters(); load(); }
      else if (target.hasAttribute('data-all-pokemon')) { s.category = 'Pokemon'; s.pickedSpecies = 'all'; resetFilters(); load(); }
      else if (target.hasAttribute('data-listing')) {
        s.selected = target.dataset.listing;
        for (const row of el('#mkResults').querySelectorAll('[data-listing]')) row.classList.toggle('selected', row.dataset.listing === s.selected);
        inspectIv(target, e);
      }
      else if (target.hasAttribute('data-page')) { s.page = Number(target.dataset.page); s.selected = ''; if (snapshotMode && s.tab === 'buy' && s.category === 'Pokemon' && snapshots.get(s.account,s.cid)) { applySnapshot(snapshots.get(s.account,s.cid)); render(); } else if (s.tab === 'buy' && s.category === 'Pokemon' && s.pickedSpecies != null) load(); else render(); }
      else if (target.hasAttribute('data-grade')) { const grade = target.dataset.grade; s.gradesOff = s.gradesOff.includes(grade) ? s.gradesOff.filter(x => x !== grade) : [...s.gradesOff, grade]; queryChanged(true); }
      else if (target.id === 'mkShiny') { s.shiny = !s.shiny; queryChanged(true); }
    });
    overlay.addEventListener('mouseover', event => {
      const target = event.target.closest('[data-listing],[data-owned]');
      if (target && !target.contains(event.relatedTarget)) void inspectIv(target, event);
    });
    overlay.addEventListener('mousemove', event => {
      const target = event.target.closest('[data-listing],[data-owned]');
      if (target && target !== ivTarget) void inspectIv(target, event);
      else if (ivTarget && ivTarget.contains(event.target)) {
        ivPoint = { x: event.clientX, y: event.clientY };
        if (ivResult && bridge.isIvEnabled?.()) bridge.showIv(s.account, ivResult, ivPoint);
        else if (!bridge.isIvEnabled?.()) hideIv();
      }
    });
    overlay.addEventListener('mouseout', event => {
      if (ivTarget && ivTarget.contains(event.target) && !ivTarget.contains(event.relatedTarget)) hideIv();
    });
    overlay.addEventListener('focusout', event => {
      if (ivTarget && ivTarget.contains(event.target) && !ivTarget.contains(event.relatedTarget)) hideIv();
    });
    overlay.addEventListener('scroll', hideIv, true);
    overlay.addEventListener('input', e => {
      if (e.target.id === 'mkAlertSearch') { el('#mkAlertTarget').value = ''; showAlertSuggestions(); updateAlertEvolutions(); }
      if (e.target.id === 'mkOwnSearch') { s.ownQ = e.target.value; s.ownPage = 1; el('#mkBag').innerHTML = inventoryBag(); }
      if (e.target.dataset.filter) { s[e.target.dataset.filter] = e.target.value; queryChanged(true); }
      if (/^mkRequest/.test(e.target.id)) totals();

    });
    overlay.addEventListener('change', e => {
      if (e.target.id === 'mkIncludeEvolutions') { s.includeEvolutions = e.target.checked; queryChanged(true); }
      if (e.target.id === 'mkAlertEvolutions') updateAlertEvolutions();
      if (e.target.id === 'mkAlertKind') { alertKind = e.target.value; render(); }
      if (e.target.dataset.tolerance) { const key = e.target.dataset.tolerance; s.tolerance[key] = Math.max(0, Math.min(key === 'iv' ? 192 : key === 'lv' ? 100000 : 100, Number(e.target.value) || 0)); loadComparison(); }
      if (e.target.id === 'mkType') { s.type = e.target.value; queryChanged(true); }
      if (e.target.id === 'mkPage') { s.page = Math.max(1, Math.trunc(Number(e.target.value)) || 1); s.selected = ''; if (snapshotMode && s.tab === 'buy' && s.category === 'Pokemon' && snapshots.get(s.account,s.cid)) { applySnapshot(snapshots.get(s.account,s.cid)); render(); } else if (s.tab === 'buy' && s.category === 'Pokemon' && s.pickedSpecies != null) load(); else render(); }
      if (/^mkRequest/.test(e.target.id)) totals();
    });
    overlay.addEventListener('focusin', e => {
      const pokemon = e.target.closest('[data-listing],[data-owned]');
      if (pokemon) void inspectIv(pokemon, e);
      if (e.target.id === 'mkAlertSearch') showAlertSuggestions();
      else if (!e.target.closest('.mk-alert-picker')) hideAlertSuggestions();
    });
    overlay.addEventListener('keydown', e => {
      const searchList = el('#mkSearchSuggestions');
      if (e.target.id === 'mkSearch' && !searchList.hidden) {
        const options = [...searchList.querySelectorAll('[data-search-option]')];
        const current = options.findIndex(x=>x.getAttribute('aria-selected') === 'true');
        if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
          e.preventDefault(); e.stopPropagation();
          const index = current < 0 ? (e.key === 'ArrowDown' ? 0 : options.length-1) : (current+(e.key === 'ArrowDown' ? 1 : -1)+options.length)%options.length;
          options.forEach((x,i)=>x.setAttribute('aria-selected', String(i===index)));
          e.target.setAttribute('aria-activedescendant', options[index].id); options[index].scrollIntoView({block:'nearest'}); return;
        }
        if (e.key === 'Enter') { e.preventDefault(); e.stopPropagation(); chooseSearchSuggestion(current < 0 ? 0 : current); return; }
        if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); hideSearchSuggestions(); return; }
      }
      const suggestions = el('#mkAlertSuggestions');
      if (e.target.id === 'mkAlertSearch' && suggestions && !suggestions.hidden) {
        const options = [...suggestions.querySelectorAll('[data-alert-target]')];
        const current = options.findIndex(x => x.getAttribute('aria-selected') === 'true');
        if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
          e.preventDefault(); e.stopPropagation();
          if (options.length) {
            const index = current < 0 ? (e.key === 'ArrowDown' ? 0 : options.length - 1) : (current + (e.key === 'ArrowDown' ? 1 : -1) + options.length) % options.length;
            options.forEach((x, i) => x.setAttribute('aria-selected', String(i === index)));
            e.target.setAttribute('aria-activedescendant', options[index].id); options[index].scrollIntoView({ block: 'nearest' });
          }
          return;
        }
        if (e.key === 'Enter') {
          e.preventDefault(); e.stopPropagation();
          if (options.length) chooseAlertTarget(options[current < 0 ? 0 : current].dataset.alertTarget);
          return;
        }
        if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); hideAlertSuggestions(); return; }
      }
      if (e.key === 'Escape') { e.stopPropagation(); close(); }
      if ((e.key === 'Enter' || e.key === ' ') && e.target.hasAttribute('data-listing')) { e.preventDefault(); e.target.click(); }
      if (e.key === 'Tab') {
        const focusable = [...overlay.querySelectorAll('button:not(:disabled),input:not(:disabled),select:not(:disabled),[tabindex="0"]')].filter(x => x.getClientRects().length && x.tabIndex >= 0);
        const first = focusable[0], last = focusable[focusable.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
      // Shortcuts of the underlying app must not act while a market dialog is open.
      e.stopPropagation();
    });
    overlay.addEventListener('submit', e => {
      if (e.target.id !== 'mkAlertForm') return;
      e.preventDefault();
      const target = alertTargets().find(x => x.kind + ':' + (x.kind === 'pokemon' ? x.speciesId : x.refId) === el('#mkAlertTarget').value);
      const fields = Object.fromEntries(new FormData(e.target));
      const includeEvolutions = target && target.kind === 'pokemon' && el('#mkAlertEvolutions').checked;
      const rule = target && A.normalize({ ...target, ...fields, includeEvolutions, speciesIds: includeEvolutions ? M.evolutionIds(target.speciesId, s.data.alertCatalog) : [], id: Date.now().toString(36) + Math.random().toString(36).slice(2, 8), cid: s.cid, account: s.account, accountName: s.data.name, desktop: e.target.elements.desktop.checked, voice: e.target.elements.voice.checked, enabled: true });
      if (!rule || alertRules.length >= 10 || !rule.desktop && !rule.voice) { el('#mkAlertError').textContent = alertText('invalid'); return; }
      alertRules.push(rule); saveAlerts(); el('#mkAlertError').textContent = ''; e.target.reset(); hideAlertSuggestions(); updateAlertEvolutions();
    });
    monitor = A.create({ read: marketRead, changed: () => { if (s.open && s.tab === 'alerts' && el('#mkAlertList')) el('#mkAlertList').innerHTML = alertList(); }, notify: (rule, found) => {
      const x = found[0], value = nf(x.price) + (x.currency === 'DIAMONDS' ? ' diamantes' : ' dollars');
      const conditions = x.kind === 'pokemon' ? `, IV ${nf(x.ivTotal)}, ${tr('level')} ${nf(x.level)}, Q ${nf(x.quality)}` : '';
      const text = bridge.language() === 'en' ? `Market alert: ${x.name}, ${value}${conditions}, account ${rule.accountName}. ${found.length} matching offers.` : bridge.language() === 'es' ? `Alerta de mercado: ${x.name}, ${value}${conditions}, cuenta ${rule.accountName}. ${found.length} ofertas compatibles.` : `Alerta de mercado: ${x.name}, ${value}${conditions}, conta ${rule.accountName}. ${found.length} ofertas compatíveis.`;
      bridge.notifyMarket(text, rule.desktop, rule.voice);
    } });
    monitor.setRules(alertRules);
    if (snapshotMode && bridge.marketSnapshotOptions?.background !== false) warmTimer = setTimeout(warmCache,5000);
    window.addEventListener('beforeunload', () => { monitor.stop(); clearTimeout(warmTimer); snapshots.stop(); });
    if (bridge.loadSearchCatalog) void Promise.resolve().then(()=>bridge.loadSearchCatalog()).then(data=>{
      if (data?.version !== 1 || !Array.isArray(data.entries)) return;
      gameSearchEntries = data.entries;
      bridge.save('gameSearchCatalog', JSON.stringify(data));
      if (searchSuggestionsOpen) showSearchSuggestions();
    }).catch(()=>{});
    chrome();
    return { open, close, warmCache, itemPrices, refresh: () => load(true), isOpen: () => s.open, updateLanguage: () => { if (s.open) render(); else chrome(); } };
  }
  root.PokeMuxMarketUI = { mount };
})(typeof globalThis !== 'undefined' ? globalThis : this);
