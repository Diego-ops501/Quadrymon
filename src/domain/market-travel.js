(function(root, factory) {
  const api = factory(typeof module === 'object' && module.exports ? require('./hunt-recommendations') : root.PokeMuxHuntRecommendations);
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.PokeMuxMarketTravel = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function(Hunts) {
  'use strict';
  async function travel(expected, previous, findNavigation) {
    const P = window.__poke, character = () => P?.api?.['/api/characters/me']?.character;
    const check = () => location.origin !== 'https://poke.idleworld.online' || location.pathname !== '/play' || !P || P.sock?.readyState !== 1 ? 'offline'
      : String(character()?.id || '') !== expected.cid ? 'changed' : '';
    const pause = () => new Promise(resolve => setTimeout(resolve, 100));
    let failure = check(); if (failure) return {ok:false,reason:failure};
    let nav = findNavigation(document);
    if (!nav) {
      // The map component is mounted only while its native menu is open.
      const map = document.querySelector('[data-guide="dock-map"]');
      if (!map || map.disabled) return {ok:false,reason:'navigation'};
      map.click();
      for (let i=0; i<30 && !nav; i++) { await pause(); if ((failure=check())) return {ok:false,reason:failure}; nav=findNavigation(document); }
    }
    if (!nav) return {ok:false,reason:'navigation'};
    const city = slug => ['cerulean','pewter','viridian','cassino','arena_pvp','goldenrod','shopping'].includes(slug) || String(slug).startsWith('gym_');
    const returning = !P.hunting || city(nav.currentSlug);
    let hunt = previous;
    if (!returning && P.hunting && !city(nav.currentSlug) && /^[a-z0-9_-]{1,60}$/i.test(nav.currentSlug)) {
      hunt = {slug:nav.currentSlug,name:String(P.lastSlug === nav.currentSlug ? P.ws?.['field-init']?.name || nav.currentSlug : nav.currentSlug).slice(0,80)};
    }
    if (returning && (!hunt || !/^[a-z0-9_-]{1,60}$/i.test(hunt.slug) || city(hunt.slug))) return {ok:false,reason:'noHunt'};
    if (returning) {
      const lead = P.ws?.pokes?.list?.find(x=>x.team && x.leader);
      if (lead && lead.hp === 0) return {ok:false,reason:'fainted'};
    }
    const target = returning ? hunt.slug : 'shopping', before = P.fiT || 0;
    // Preserve the exact origin even if the map loads but arrival confirmation times out.
    const result = {returnHunt:hunt || null,atMarket:!returning};
    try {
      if (window.__pgVoltaTimer != null) clearInterval(window.__pgVoltaTimer);
      delete window.__pgVolta;
      let selected = false, selectError = false;
      Promise.resolve(nav.onSelect(target, returning ? hunt.name || hunt.slug : 'Shopping')).then(()=>{selected=true;},()=>{selectError=true;selected=true;});
      for (let i=0; i<120 && !selected; i++) { await pause(); if ((failure=check())) return {ok:false,reason:failure}; }
      if (!selected || selectError) return {ok:false,reason:selectError?'navigation':'unconfirmed',...result};
      for (let i=0; i<100; i++) {
        if ((failure=check())) return {ok:false,reason:failure};
        if (returning) {
          if (P.hunting && P.lastSlug === target && (P.fiT || 0)>before) return {ok:true,...result};
        } else if (P.currentMap === 'shopping') {
          const market = document.querySelector('.market-cta');
          if (market && !market.disabled) {
            // At Shopping the game's action teleports to the market NPC; it does not open a shop.
            market.click();
            return {ok:true,...result};
          }
        }
        await pause();
      }
      return {ok:false,reason:'unconfirmed',...result};
    } catch { return {ok:false,reason:'navigation',...result}; }
  }
  function script(cid, previous) {
    const expected = {cid:String(cid || '').slice(0,100)};
    const hunt = previous && {slug:String(previous.slug || '').slice(0,60),name:String(previous.name || '').slice(0,80)};
    return '('+travel.toString()+')('+JSON.stringify(expected)+','+JSON.stringify(hunt || null)+','+Hunts.findNavigation.toString()+')';
  }
  return {travel,script};
});
