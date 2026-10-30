(function (root) {
  'use strict';
  const D = root.QuadrymonBreedingCost;
  function mount(bridge) {
    let saved; try { saved = JSON.parse(bridge.load('breedingCostLedger') || 'null'); } catch {}
    const ledger = D.create(saved), dialog = document.createElement('dialog'), toast = document.createElement('aside');
    dialog.id = 'breedingCostDialog'; toast.id = 'breedingCostNotice'; toast.hidden = true;
    toast.setAttribute('role', 'status'); toast.innerHTML = '<span></span><button type="button">Vincular breed</button><button type="button" aria-label="Depois">×</button>';
    document.body.append(dialog, toast);
    let accountIndex = 0, currentCid = '', inventory = [], selected = new Set(), search = '', busy = false, revision = 0, prices = {}, rate = null, priceAt = 0, dismissed = '', ingestBusy = false, lastError = '';
    const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
    const nf = value => value == null ? '—' : Number(value).toLocaleString('pt-BR', { maximumFractionDigits: 3 });
    async function boundedRead(index, script) {
      let timer;
      try { return await Promise.race([bridge.read(index, script), new Promise(resolve => { timer = setTimeout(() => resolve(null), 4000); })]); }
      finally { clearTimeout(timer); }
    }
    const store = () => { if (!bridge.save('breedingCostLedger', JSON.stringify(ledger.state))) { lastError = 'Não foi possível salvar o acompanhamento local. Exporte um backup e libere espaço antes de continuar.'; return false; } return true; };
    const projectOptions = cid => ledger.state.projects.filter(p => p.cid === cid).map(p => `<option value="${esc(p.id)}">${esc(p.name)}</option>`).join('');
    const pending = () => ledger.state.events.filter(e => ['breed', 'hatch'].includes(e.kind) && !e.projectId);
    function updateNotice() {
      const rows = pending(); const signature = rows.map(x => x.cid + x.id).join(':');
      toast.hidden = !rows.length || signature === dismissed;
      toast.querySelector('span').textContent = `${rows.length} etapa(s) de breeding aguardando associação.`;
      const count = document.getElementById('breedingCostBtn'); if (count) count.title = rows.length ? `Projetos de Breeding · ${rows.length} etapa(s) para vincular` : 'Projetos de Breeding · custos de breeding';
    }
    function totalHtml(project) {
      const t = ledger.total(project, rate);
      const empty = t.missing > 0 && t.gold === 0 && t.diamonds === 0;
      return `<div class="bc-totals"><strong>${empty ? 'Custo a apurar' : '$ ' + nf(t.dollarTotal)}</strong><strong>${empty ? '' : '💎 ' + nf(t.diamondTotal)}</strong><span>${t.breeds} breed(s) · ${t.hatched} nascimento(s)</span></div><p class="bc-note">${t.missing ? `Custo parcial: ${t.missing} componente(s) sem valor. ` : ''}${t.estimated ? 'Inclui materiais avaliados pelo mercado. ' : ''}${empty ? 'Aquisição ainda sem preço registrado; não significa custo zero.' : `Subtotal registrado: $ ${nf(t.gold)} + 💎 ${nf(t.diamonds)}.`}${rate ? '' : ' Sem cotação do diamante: conversão indisponível.'}</p>`;
    }
    const origins = { unknown: 'Origem não comprovada', captured: 'Capturado · aquisição $0', bought: 'Comprado', manual: 'Valor informado', bred: 'Resultado de breed' };
    function pokemonName(p) { return `${p.shiny ? '✨ ' : ''}${p.name} · IV ${nf(p.ivTotal)} · Q ${nf(p.quality)}`; }
    function projectHtml(project) {
      const total = ledger.total(project, rate);
      const nodes = total.nodes.map(n => {
        const p = n.child || n.result || n.pokemon, k = D.key(n.cid, n.eggId || n.pokemon.id), first = n.costs?.find(x => x.label === 'Aquisição');
        const origin = n.origin || 'unknown';
        const bump = { success: 'Bônus IV +1 confirmado', miss: 'Bônus IV não ocorreu', unknown: 'Resultado do bônus sem referência suficiente', 'not-eligible': 'Sem bônus IV elegível registrado' }[n.bump] || '';
        const adjustments = n.eggId ? `<details data-detail="${esc('cost:' + k)}"><summary>Conferir ou completar custos desta etapa</summary>${(n.costs || []).map((cost, i) => `<div class="bc-acquisition" data-node="${esc(k)}" data-cost-index="${i}"><span>${esc(cost.label)}${cost.quantity ? ' ×' + nf(cost.quantity) : ''}</span><label>Total em dólares<input data-gold type="number" min="0" step="any" value="${cost.gold ?? ''}" placeholder="Não informado"></label><label>Total em diamantes<input data-diamonds type="number" min="0" step="any" value="${cost.diamonds ?? ''}" placeholder="Não informado"></label><button type="button" data-save-cost>Salvar custo</button></div>`).join('')}</details>` : '';
        return `<li class="bc-step"><b>${esc(pokemonName(p))}</b><small>${esc(n.eggId ? n.status === 'hatched' ? 'Nasceu' : 'Incubando' : origins[origin])}${p.breeds != null ? ` · Gerações informadas pelo jogo: ${nf(p.breeds)}` : ''}${n.delta != null ? ` · Δ de qualidade +${nf(n.delta)}` : ''}${bump ? ' · ' + bump : ''}</small><small class="bc-identity">${p.id && p.id !== n.eggId ? `ID do Pokémon: ${esc(p.id)}` : ''}${n.eggId ? ` · ID do ovo: ${esc(n.eggId)}` : ''}</small>${n.eggId ? adjustments : `<div class="bc-acquisition" data-node="${esc(k)}"><label>Origem<select data-origin>${['unknown', 'captured', 'bought', 'manual'].map(x => `<option value="${x}" ${origin === x ? 'selected' : ''}>${origins[x]}</option>`).join('')}</select></label><label>Custo de aquisição<input data-price type="number" min="0" step="any" value="${first ? first.diamonds ? first.diamonds : first.gold : ''}" placeholder="Não informado"></label><label>Moeda<select data-currency><option value="GOLD">Dólares</option><option value="DIAMONDS" ${first?.diamonds ? 'selected' : ''}>Diamantes</option></select></label><button type="button" data-save-acquisition>Salvar valor</button></div>`}</li>`;
      }).join('');
      return `<article class="bc-project"><h3>${esc(project.name)}</h3>${totalHtml(project)}<details data-detail="${esc('project:' + project.id)}"><summary>Linhagem e custos (${total.nodes.length} Pokémon/ovos)</summary><ol>${nodes}</ol><table><thead><tr><th>Componente</th><th>Dólares</th><th>Diamantes</th></tr></thead><tbody>${total.entries.map(e => `<tr><td>${esc(e.label)}${e.quantity ? ` ×${nf(e.quantity)}` : ''}${e.estimated ? ' · estimado' : ''}${e.manual ? ' · informado' : ''}</td><td>${nf(e.gold)}</td><td>${nf(e.diamonds)}</td></tr>`).join('')}</tbody></table></details></article>`;
    }
    function controlKey(input) {
      if (!input) return '';
      if (input.id) return input.id;
      const row = input.closest('[data-node]');
      if (row) return row.dataset.node + ':' + (row.dataset.costIndex ?? 'acquisition') + ':' + [...input.attributes].filter(a => a.name.startsWith('data-')).map(a => a.name).join(',');
      const pendingRow = input.closest('[data-event]');
      return pendingRow ? pendingRow.dataset.cid + ':' + pendingRow.dataset.event + ':' + input.tagName : '';
    }
    function render(resetNode) {
      const scroll = dialog.querySelector('.bc-body')?.scrollTop || 0;
      const active = document.activeElement, focusId = dialog.contains(active) ? controlKey(active) : '', selection = typeof active?.selectionStart === 'number' ? [active.selectionStart, active.selectionEnd] : null;
      const drafts = new Map([...dialog.querySelectorAll('.bc-acquisition input,.bc-acquisition select,.bc-pending select')].filter(input => !resetNode || input.closest('[data-node]')?.dataset.node !== resetNode).map(input => [controlKey(input), input.value]));
      const expanded = new Set([...dialog.querySelectorAll('details[open][data-detail]')].map(d => d.dataset.detail));
      const name = dialog.querySelector('#bcProjectName')?.value || '';
      const accounts = bridge.accounts();
      const rows = inventory.filter(p => !search || p.name.toLowerCase().includes(search.toLowerCase()));
      dialog.innerHTML = `<header class="dialog-head"><h2>Projetos de Breeding</h2><button type="button" data-export>Exportar custos</button><button type="button" data-close aria-label="Fechar">×</button></header><div class="bc-body"><p class="bc-note">Cadastre um projeto e selecione os Pokémon disponíveis. Cruze e choque normalmente no jogo; as etapas confirmadas serão registradas para vincular ao projeto.</p><section class="bc-quote"><span>${rate ? `Cotação: 1 💎 = $ ${nf(rate)} · ${new Date(priceAt).toLocaleString('pt-BR')}` : 'Cotação do diamante indisponível'}</span><button type="button" data-prices>Atualizar cotação</button></section><p class="bc-error" role="status">${esc(lastError)}</p><section><h3>Novo projeto</h3><div class="bc-controls"><label>Conta<select id="bcAccount">${accounts.map((a, i) => `<option value="${i}" ${i === accountIndex ? 'selected' : ''}>${esc(a.name)}${a.off || !a.live ? ' · desconectada' : ''}</option>`).join('')}</select></label><label>Nome do projeto<input id="bcProjectName" maxlength="100" value="${esc(name)}" placeholder="Ex.: Pupitar principal"></label><label>Buscar Pokémon<input id="bcSearch" type="search" value="${esc(search)}"></label><button type="button" data-refresh ${busy ? 'disabled' : ''}>${busy ? 'Lendo inventário…' : 'Atualizar Pokémon'}</button><button type="button" data-create ${!selected.size || busy ? 'disabled' : ''}>Cadastrar (${selected.size})</button></div><p class="bc-note">Capturas são verificadas pelo ID no histórico local. Compras antigas sem ID correspondente não são atribuídas pelo nome. O custo de farm não entra automaticamente.</p><div class="bc-pokemon-list">${rows.length ? rows.map(p => { const node = ledger.state.nodes[ledger.resolve(D.key(currentCid, p.id))]; const image = bridge.sprite(p.speciesId, p.shiny, p.name); return `<label class="bc-pokemon"><input type="checkbox" data-pokemon="${esc(p.id)}" ${selected.has(p.id) ? 'checked' : ''}>${image ? `<img src="${esc(image)}" alt="">` : ''}<span><b>${esc(p.name)}</b><small>IV ${nf(p.ivTotal)} · Q ${nf(p.quality)} · Lv.${nf(p.level)}${p.shiny ? ' · Shiny' : ''}</small><small>${esc(origins[node?.origin || 'unknown'])}</small></span></label>`; }).join('') : `<p>${busy ? 'Aguardando leitura…' : 'Nenhum Pokémon disponível nesta seleção. Atualize uma conta conectada.'}</p>`}</div></section><section id="bcPending"><h3>Etapas para vincular</h3>${pending().map(e => { const egg = e.egg || e.child || {}; return `<div class="bc-pending" data-event="${esc(e.id)}" data-cid="${esc(e.cid)}"><span><b>${e.kind === 'breed' ? e.existing ? 'Ovo em andamento (histórico anterior indisponível)' : 'Ovo criado' : 'Pokémon nasceu'} · ${esc(egg.speciesName || egg.name || '#' + (egg.speciesId || ''))}</b><small>${new Date(e.at).toLocaleString('pt-BR')} · ${esc(bridge.accountName(e.cid))}${e.child ? ` · IV ${nf(e.child.ivTotal)} · Q ${nf(e.child.quality)}` : ''}</small></span><select aria-label="Projeto do breed"><option value="">Escolha o projeto</option>${projectOptions(e.cid)}</select><button type="button" data-assign>Vincular</button></div>`; }).join('') || '<p>Nenhuma etapa pendente.</p>'}</section><section><h3>Projetos em acompanhamento</h3>${ledger.state.projects.map(projectHtml).join('') || '<p>Cadastre o primeiro projeto acima.</p>'}</section></div>`;
      for (const input of dialog.querySelectorAll('.bc-acquisition input,.bc-acquisition select,.bc-pending select')) if (drafts.has(controlKey(input))) input.value = drafts.get(controlKey(input));
      for (const details of dialog.querySelectorAll('[data-detail]')) details.open = expanded.has(details.dataset.detail);
      dialog.querySelector('.bc-body').scrollTop = scroll;
      if (focusId) { const target = [...dialog.querySelectorAll('input,select,button')].find(input => controlKey(input) === focusId); target?.focus({ preventScroll: true }); if (selection) target?.setSelectionRange(...selection); }
      updateNotice();
    }
    async function refreshPrices() {
      const quote = await bridge.itemPrices().catch(() => null);
      if (quote?.ok) { prices = quote.prices || {}; rate = prices.diamonds?.GOLD > 0 ? prices.diamonds.GOLD : null; priceAt = quote.at || Date.now(); }
      else { lastError = 'Não foi possível obter uma cotação atual. Os valores originais continuam disponíveis.'; rate = null; }
      if (dialog.open) render();
    }
    async function refresh() {
      const version = ++revision, index = accountIndex, slot = bridge.slot(index);
      busy = true; lastError = ''; if (dialog.open) render();
      try {
        if (slot.off) throw Error('Selecione uma conta conectada.');
        const result = await bridge.read(index, '(' + bridge.readInventory.toString() + ')(' + bridge.receive.toString() + ')');
        const now = bridge.slot(index);
        if (version !== revision || index !== accountIndex || now.epoch !== slot.epoch || now.view !== slot.view || now.off || slot.cid && result.cid !== slot.cid) return;
        if (!result.ok || !result.complete) throw Error('O inventário ainda não está completo. Atualize novamente em alguns segundos.');
        currentCid = result.cid; inventory = result.rows.filter(x => x.kind === 'pokemon'); selected.clear();
        const captured = new Set(bridge.captures(currentCid).map(x => String(x.id)));
        for (const p of inventory) { const k = ledger.ensure(currentCid, p), node = ledger.state.nodes[k]; if (node.origin === 'unknown' && !(p.breeds > 0) && captured.has(p.id)) ledger.acquisition(currentCid, p, 'captured', 0); }
        store();
      } catch (error) { if (version === revision) { inventory = []; currentCid = ''; selected.clear(); lastError = error.message; } }
      finally { if (version === revision) { busy = false; if (dialog.open) render(); } }
    }
    async function observe(index) {
      const start = bridge.slot(index); if (start.off) return;
      const result = await boundedRead(index, 'window.QuadrymonBreedingObserver?.read() || null').catch(() => null);
      const end = bridge.slot(index);
      if (!result?.cid || start.view !== end.view || start.epoch !== end.epoch || end.off || end.cid && result.cid !== end.cid) return;
      const events = [...(result.events || [])];
      // Existing incubations can join a project too, with their missing past costs explicit.
      for (const egg of result.center?.eggs || []) if (!events.some(e => (e.egg?.id || e.eggId) === egg.id) && !ledger.state.events.some(e => e.cid === result.cid && (e.egg?.id || e.eggId) === egg.id)) events.push({ id: 'breed:' + egg.id, cid: result.cid, at: Date.now(), kind: 'breed', existing: true, egg, parents: [], quote: null });
      if (!events.length) return;
      if (events.some(e => e.kind === 'breed' && e.quote && !ledger.state.events.some(old => old.cid === e.cid && old.id === e.id))) await refreshPrices();
      const ack = []; let changed = false;
      const captured = new Set(bridge.captures(result.cid).map(x => String(x.id)));
      for (const raw of events) {
        if (raw.cid !== result.cid) continue;
        if (raw.kind === 'purchase' && !raw.pokemon) continue;
        const event = { ...raw };
        if (event.kind === 'breed') { event.costs = D.breedCosts(event.quote, event.double, prices, rate); event.valuationAt = priceAt; event.baselineIv = event.quote?.ivPreview?.ivTotal; event.bumpPossible = event.quote?.ivPreview?.bump?.possible; for (const p of event.parents || []) if (!(p.breeds > 0) && captured.has(String(p.id))) { const k = ledger.ensure(event.cid, p); if (ledger.state.nodes[k].origin === 'unknown') ledger.acquisition(event.cid, p, 'captured', 0); } }
        changed = ledger.ingest(event) || changed;
        const sameEgg = ledger.state.events.find(old => old.cid === event.cid && old.projectId && (old.egg?.id || old.eggId) === (event.egg?.id || event.eggId));
        if (sameEgg) ledger.assign(event.id, sameEgg.projectId, event.cid);
        if (event.kind !== 'hatch' || event.child?.id) ack.push(event.id);
      }
      if (store()) await boundedRead(index, 'window.QuadrymonBreedingObserver?.ack(' + JSON.stringify(ack) + ')').catch(() => {});
      changed = ledger.reconcile() || changed;
      if (changed) { store(); updateNotice(); if (dialog.open) render(); }
    }
    async function tick() { if (ingestBusy) return; ingestBusy = true; try { await Promise.all(bridge.accounts().map((_, index) => observe(index))); } finally { ingestBusy = false; } }
    function open() { if (!dialog.open) dialog.showModal(); render(); void refresh(); void refreshPrices(); }
    toast.querySelector('button').onclick = () => { open(); setTimeout(() => dialog.querySelector('#bcPending')?.scrollIntoView(), 0); };
    toast.querySelectorAll('button')[1].onclick = () => { dismissed = pending().map(x => x.cid + x.id).join(':'); updateNotice(); };
    dialog.addEventListener('input', event => { if (event.target.id === 'bcSearch') { search = event.target.value; render(); } });
    dialog.addEventListener('change', event => {
      if (event.target.id === 'bcAccount') { accountIndex = Number(event.target.value); inventory = []; selected.clear(); currentCid = ''; void refresh(); }
      if (event.target.dataset.pokemon) { if (event.target.checked) selected.add(event.target.dataset.pokemon); else selected.delete(event.target.dataset.pokemon); const b = dialog.querySelector('[data-create]'); b.disabled = !selected.size || busy; b.textContent = `Cadastrar (${selected.size})`; }
    });
    dialog.addEventListener('click', event => {
      const button = event.target.closest('button'); if (!button) return;
      if (button.hasAttribute('data-close')) { revision++; busy = false; dialog.close(); }
      if (button.hasAttribute('data-refresh')) void refresh();
      if (button.hasAttribute('data-prices')) void refreshPrices();
      if (button.hasAttribute('data-create') && currentCid) {
        ledger.project(dialog.querySelector('#bcProjectName').value, currentCid, inventory.filter(p => selected.has(p.id))); selected.clear(); store(); render(); dialog.querySelector('#bcProjectName').value = '';
      }
      if (button.hasAttribute('data-assign')) { const row = button.closest('[data-event]'); if (ledger.assign(row.dataset.event, row.querySelector('select').value, row.dataset.cid)) { store(); render(); } }
      if (button.hasAttribute('data-save-acquisition')) {
        const row = button.closest('[data-node]'), node = ledger.state.nodes[ledger.resolve(row.dataset.node)]; if (!node) return;
        if (!row.querySelector('[data-price]').reportValidity()) return;
        ledger.acquisition(node.cid, node.pokemon, row.querySelector('[data-origin]').value, row.querySelector('[data-price]').value, row.querySelector('[data-currency]').value); store(); render(row.dataset.node);
      }
      if (button.hasAttribute('data-save-cost')) {
        const row = button.closest('[data-cost-index]'), node = ledger.state.nodes[ledger.resolve(row.dataset.node)], cost = node?.costs?.[Number(row.dataset.costIndex)]; if (!cost) return;
        const gold = row.querySelector('[data-gold]'), diamonds = row.querySelector('[data-diamonds]'); if (!gold.reportValidity() || !diamonds.reportValidity()) return;
        Object.assign(cost, { gold: D.number(gold.value), diamonds: D.number(diamonds.value), estimated: false, manual: true }); store(); render(row.dataset.node);
      }
      if (button.hasAttribute('data-export')) {
        const blob = new Blob([JSON.stringify({ exportedAt: new Date().toISOString(), rate, rateAt: priceAt, ...ledger.state }, null, 2)], { type: 'application/json' }); const link = document.createElement('a'), url = URL.createObjectURL(blob); link.href = url; link.download = 'quadrymon-custos-breeding.json'; link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
      }
    });
    dialog.addEventListener('cancel', () => { revision++; busy = false; });
    updateNotice();
    return { open, tick, ledger, dialog };
  }
  root.QuadrymonBreedingUI = { mount };
})(globalThis);
