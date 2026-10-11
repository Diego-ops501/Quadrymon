(function (root, factory) {
  const api = factory(typeof module === 'object' && module.exports ? require('./hunt-combat-model') : root.PokeMuxHuntCombatModel);
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.PokeMuxHuntRecommendations = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function (combatModel) {
  'use strict';
  const number = value => Number.isFinite(Number(value)) ? Number(value) : 0;
  const known = value => value != null && value !== '' && Number.isFinite(Number(value));
  const validSlug = value => /^[a-z0-9_-]{1,60}$/i.test(String(value || ''))
    && !['cerulean', 'pewter', 'viridian', 'cassino', 'arena_pvp'].includes(String(value).toLowerCase());
  const amplify = value => value > 1 ? 1 + (value - 1) * 1.5 : value < 1 ? value / 1.5 : value;

  const typeAliases = {
    NORMAL:['normal'], FIRE:['fire','fogo','fuego'], WATER:['water','agua'], ELECTRIC:['electric','eletrico','electrico'],
    GRASS:['grass','grama','planta'], ICE:['ice','gelo','hielo'], FIGHTING:['fighting','lutador','luta','lucha'],
    POISON:['poison','veneno'], GROUND:['ground','terra','tierra'], FLYING:['flying','voador','volador'],
    PSYCHIC:['psychic','psiquico'], BUG:['bug','inseto','insecto'], ROCK:['rock','pedra','roca'],
    GHOST:['ghost','fantasma'], DRAGON:['dragon','dragao'], DARK:['dark','sombrio','noturno','siniestro'],
    STEEL:['steel','aco','acero'], FAIRY:['fairy','fada','hada']
  };
  const normalized = s => String(s || '').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim();
  function dayBonus(events, now = Date.now()) {
    for (const event of Array.isArray(events) ? events : []) {
      if (!event || event.key !== 'type-of-day') continue;
      const until = typeof event.until === 'number' ? event.until : Date.parse(event.until);
      if (!Number.isFinite(until) || until <= now) continue;
      const label = String(event.name || '').split(':').pop().trim();
      const type = Object.keys(typeAliases).find(t => typeAliases[t].includes(normalized(event.pokemonType || event.typeName || label)));
      if (!type) continue;
      const desc = normalized(event.desc);
      const percent = kind => { const m = desc.match(new RegExp('\\+([0-9]+(?:[.,][0-9]+)?)%\\s*(?:de\\s*)?'+kind));return m ? Number(m[1].replace(',','.')) : 0; };
      return { type, label, until, xp:percent('xp'), loot:percent('loot') };
    }
    return null;
  }
  function bestForDay(rows, day) {
    if (!day || day.until <= Date.now()) return null;
    return (rows || []).find(r => r.levelSuitable !== false && [r.hunt.t1,r.hunt.t2].some(t => String(t || '').toUpperCase() === day.type)) || null;
  }

  function selectAccount({ requested, expanded, focused, preferred, accounts }) {
    const available = i => Number.isInteger(i) && accounts[i] && !accounts[i].off;
    // O botão da própria conta mantém a escolha explícita, inclusive quando está desconectada.
    if (available(requested)) return requested;
    const connected = i => available(i) && accounts[i].live;
    return [expanded, focused, preferred, ...accounts.map((_, i) => i)].find(connected)
      ?? accounts.findIndex(a => !a.off);
  }

  // O menu do mundo mantém o callback oficial de viagem nas propriedades React,
  // mesmo fechado. Usá-lo também troca o mapa e instala os listeners da hunt.
  function findNavigation(document) {
    const roots = new Set();
    for (const el of document.querySelectorAll('*')) {
      const key = Object.keys(el).find(k => k.startsWith('__reactFiber$'));
      if (!key) continue;
      let root = el[key];
      while (root && root.return) root = root.return;
      if (!root || roots.has(root)) continue;
      roots.add(root);
      const stack = [root], seen = new Set();
      const scan = (p, depth) => {
        if (!p || depth > 4) return null;
        if (typeof p.currentSlug === 'string' && typeof p.onSelect === 'function' && Number.isFinite(p.playerLevel)) return p;
        for (const child of Array.isArray(p.children) ? p.children : [p.children]) {
          const found = child && child.props && scan(child.props, depth + 1);
          if (found) return found;
        }
        return null;
      };
      while (stack.length && seen.size < 20000) {
        const fiber = stack.pop();
        if (!fiber || seen.has(fiber)) continue;
        seen.add(fiber);
        const found = scan(fiber.memoizedProps, 0);
        if (found) return found;
        stack.push(fiber.child, fiber.sibling);
      }
    }
    return null;
  }

  // Loot and captured Pokémon are independent revenue sources.
  function lootValue(drops, items) {
    if (!Array.isArray(drops) || !Array.isArray(items)) return null;
    let total = 0;
    for (const drop of drops) {
      if(drop && known(drop.minCount) && known(drop.maxCount) && known(drop.chance) && drop.name){
        const item=items.find(it=>it&&normalized(it.name)===normalized(drop.name));
        const chance=Number(drop.chance)/100000,min=Number(drop.minCount),max=Number(drop.maxCount);
        if(!item||!known(item.npcPrice)||chance<0||chance>1||min<0||max<min||Number(item.npcPrice)<0)return null;
        total+=chance*(min+max)/2*Number(item.npcPrice);continue;
      }
      if (!drop || typeof drop !== 'object' || !known(drop.minQty) || !known(drop.maxQty)) return null;
      const probability = known(drop.probability) ? drop.probability : drop.chanceUnit === 'fraction' ? drop.chance : null;
      if (!known(probability)) return null;
      const item = items.find(it => it && it.id === drop.itemId);
      if (!item || !known(item.npcPrice)) return null;
      const chance = Number(probability), min = Number(drop.minQty), max = Number(drop.maxQty);
      // Só aceita probabilidades explícitas; não adivinha se a unidade é percentual.
      if (chance < 0 || chance > 1 || min < 0 || max < min || Number(item.npcPrice) < 0) return null;
      total += chance * (min + max) / 2 * Number(item.npcPrice);
    }
    return total;
  }

  // Observations belong to one map/species/level and one official stat revision.
  function combatCache(previous, catalog, now = Date.now()) {
    const entries = {};
    const key = h => [h.sl,h.sp,h.level,JSON.stringify(catalog.bs?.[h.sp] || [])].join('|');
    for (const h of (catalog.h || []).slice(0,2000)) {
      const old = previous?.version === 1 && previous.entries?.[key(h)];
      if (old && now >= old.at && now-old.at < 86400000) {
        const stats = {};
        for (const k of ['hp','atk','def','spa','spd','speed']) if (number(old.stats?.[k]) > 0) stats[k] = number(old.stats[k]);
        if (stats.hp) entries[key(h)] = {at:old.at,stats};
      }
      if (h.sl !== catalog.combat?.slug) continue;
      const samples = (catalog.combat.mobs || []).filter(m => String(catalog.byId?.[m.speciesId] || '').toLowerCase() === h.sp && (!m.level || m.level === Number(h.level)));
      const stats = {};
      for (const k of ['hp','atk','def','spa','spd','speed']) {
        const values = samples.map(m=>number(k === 'hp' ? m.maxHp : m.stats?.[k])).filter(v=>v>0);
        if (values.length) stats[k] = values.reduce((a,b)=>a+b,0)/values.length;
      }
      if (stats.hp) entries[key(h)] = {at:now,stats};
    }
    return {version:1,entries};
  }
  function cachedCombat(cache, hunt, bases) {
    return cache.entries[[hunt.sl,hunt.sp,hunt.level,JSON.stringify(bases[hunt.sp] || [])].join('|')]?.stats || {};
  }
  function progressionBand(attacker) {
    const level=Math.floor(number(attacker?.level));
    if(level>=600)return {min:500,max:600,region:'orre'};
    if(level>=150)return {min:150,max:150,region:'outland'};
    return {min:1,max:Math.max(1,level),region:''};
  }
  const simulations = new Map();
  // Client stat/HP rules and documented hunt modifiers; damage remains a model.
  // Quality/growth rolls are scenarios based on the public capture distribution,
  // not a claim that the server uses that distribution for every spawned wild.
  function simulateCombat({attacker,hunt,own,observed = {},catalog,offense,effectiveness}) {
    const base = catalog?.bases?.[hunt.sp], learned = catalog?.moves?.[hunt.sp]?.a;
    if (!base || base.length !== 6 || base.some(v=>!(v>0)) || !learned) return null;
    const localModel=catalog.model==='local';
    const key = JSON.stringify([2,catalog.model,catalog.fixedMove,attacker,hunt,own,observed,base,learned,catalog.moves[attacker.sp],catalog.bases[attacker.sp]]);
    if (simulations.has(key)) return simulations.get(key);
    if(localModel&&!catalog.fixedMove){
      const options=(catalog.moves[attacker.sp]?.a||[]).filter(move=>move[1]>0&&move[4]>0&&move[5]<=attacker.level&&(!move[6]||attacker.tms===true||attacker.tms?.includes(move[6])));
      const candidates=options.map(move=>simulateCombat({attacker,hunt,own,observed,catalog:{...catalog,fixedMove:move},offense,effectiveness})).filter(Boolean);
      const best=candidates.sort((a,b)=>a.meanHits-b.meanHits||b.attack.damage-a.attack.damage)[0]||null;
      if(simulations.size>=1000)simulations.delete(simulations.keys().next().value);
      simulations.set(key,best);return best;
    }
    const scenarios = JSON.stringify([hunt.sp,hunt.level,base,learned,observed]);
    let seed = 2166136261;
    for (let i=0;i<scenarios.length;i++) seed=Math.imul(seed^scenarios.charCodeAt(i),16777619)>>>0;
    const random = () => {seed=(seed+0x6d2b79f5)>>>0;let t=Math.imul(seed^seed>>>15,1|seed);t^=t+Math.imul(t^t>>>7,61|t);return ((t^t>>>14)>>>0)/4294967296;};
    const bands = [[.8,.9,5],[.9,1,5],[1,1.1,34.03846],[1.1,1.2,20],[1.2,1.3,10],[1.3,1.4,10],[1.4,1.5,10],[1.5,1.6,5],[1.7,1.8,.67308],[1.8,1.8,.28846]];
    const hits = [], losses = [], incomingHits = [], hpSamples = [];
    let chosenAttack=null;
    for (let trial=0;trial<(localModel?256:128);trial++) {
      let roll=random()*100,quality=1;
      for (const [lo,hi,weight] of bands) {if(roll<weight){quality=lo===hi?lo:Math.floor((lo+random()*(hi-lo))*1000)/1000;break;}roll-=weight;}
      const wild = {};
      ['hp','atk','def','spa','spd','speed'].forEach((k,i)=>{const growth=localModel?Math.round(12+random()*12):1+Math.floor(random()*32);wild[k]=Math.max(1,Math.round((base[i]+2*growth)*hunt.level/100*Math.pow(localModel?1:quality,i===0||i===5?.95:.8)));});
      // combatHp(stat, wild=true) in the client, then documented hunt HP x5.
      wild.hp = Math.max(24,Math.round(wild.hp*7))*5;
      Object.assign(wild,observed);
      const attack=localModel?combatModel.attack(attacker,{...hunt,combatHp:wild.hp,combatStats:wild},own,{moves:{[attacker.sp]:{a:[catalog.fixedMove]}}},effectiveness):offense(attacker,{...hunt,combatHp:wild.hp,combatStats:wild});
      if (!attack || !(attack.ritmo>0)) return null;
      chosenAttack=attack;
      const count=Math.max(1,Math.ceil(1/(attack.mg > 0 ? attack.mg : attack.ritmo)));
      // No artificial cap on hits: hard/impossible matches must not look easy.
      if (!Number.isFinite(count)) return null;
      let incoming=0;
      for (const move of learned) {
        if(move[6]||move[5]>hunt.level||!(move[1]>0))continue;
        const physical=move[3]==='P',eff=amplify(effectiveness(move[2],attacker.t1,attacker.t2));
        const stab=[hunt.t1,hunt.t2].includes(move[2])?1.5:1;
        incoming=Math.max(incoming,localModel?combatModel.damage(move[1],number(physical?wild.atk:wild.spa),number(physical?own.def:own.spd),eff,true):.1*move[1]*eff*stab*number(physical?wild.atk:wild.spa)/Math.max(1,number(physical?own.def:own.spd))*1.8);
      }
      hits.push(count);incomingHits.push(incoming);losses.push(incoming*count/own.hp);hpSamples.push(wild.hp);
    }
    hits.sort((a,b)=>a-b);losses.sort((a,b)=>a-b);
    const mean = xs=>xs.reduce((a,b)=>a+b,0)/xs.length;
    const result={meanHits:mean(hits),lowHits:hits[Math.floor(hits.length*.05)],highHits:hits[Math.floor(hits.length*.95)],exposure:mean(losses),conservativeExposure:losses[Math.floor(losses.length*.9)],incoming:mean(incomingHits),hp:mean(hpSamples),samples:hits.length,source:'simulation',...(localModel?{attack:chosenAttack,hits,kph:combatModel.throughput({hitIntervalMs:chosenAttack.cooldownMs,spawnDelayMs:hunt.spawnDelayMs},hits)}:{})};
    if(simulations.size>=1000)simulations.delete(simulations.keys().next().value);
    simulations.set(key,result);
    return result;
  }
  function rank({ attacker, hunts, offense, project, moves, effectiveness, measurements, combatHp = {}, combatStats = {}, simulation, xpMultiplier = 1, objective = 'xp', day, potion, threshold = 50 }) {
    const dollars = objective === 'gold';
    if (!attacker || !(attacker.tlv > 0) || !(attacker.level > 0)) return [];
    const own = { ...project(attacker.sp, attacker.level, attacker.q, attacker.ivt), ...attacker.stats };
    if (simulation && !(attacker.stats?.hp > 0)) own.hp=Math.max(24,Math.round(own.hp*12));
    if (!(own.hp > 0 && own.def > 0 && own.spd > 0)) return [];
    // Account level unlocks maps; the leader's level limits suitable combat targets.
    const maxHuntLevel = Math.min(attacker.tlv, Math.floor(attacker.level));
    const band=progressionBand(attacker);
    const rows = [], seen = new Set();
    for (const hunt of hunts || []) {
      if (!validSlug(hunt.sl) || hunt.blocked === true || seen.has(hunt.sl) || !(hunt.level > 0) || hunt.level > maxHuntLevel
        || hunt.level < band.min || hunt.level > band.max || (band.region && hunt.ar && hunt.ar !== band.region)
        || (!dollars && !(hunt.xp > 0))) continue;
      seen.add(hunt.sl);
      const projected = project(hunt.sp, hunt.level, 1, 96);
      if (!projected) continue;
      const observed = combatStats[hunt.sl] || {};
      const wild = {...projected,...observed};
      const health = observed.hp > 0 ? observed.hp : combatHp[hunt.sp] > 0 ? combatHp[hunt.sp] : null;
      let attack = offense(attacker, {...hunt,combatStats:observed,...(health > 0 ? {combatHp:health} : {})});
      if (!attack || !(attack.ritmo > 0)) continue;
      const simulated = simulation ? simulateCombat({attacker,hunt,own,observed,catalog:simulation,offense,effectiveness}) : null;
      if(simulation?.model==='local'&&!simulated)continue;
      if (simulated) {
        const rhythm=1/simulated.meanHits;
        attack={...(simulated.attack||attack),ritmo:rhythm,xph:number(hunt.xp)*rhythm};
        wild.hp=simulated.hp;
      }
      if (health > 0) wild.hp = health;
      const learned = moves(hunt.sp);
      let incoming = Array.isArray(learned) && learned.length ? 0 : null;
      for (const move of learned || []) {
        if (move[6] || move[5] > hunt.level || !(move[1] > 0) || !(move[4] > 0)) continue;
        const physical = move[3] === 'P';
        const eff = amplify(effectiveness(move[2], attacker.t1, attacker.t2));
        const stab = [hunt.t1, hunt.t2].includes(move[2]) ? 1.5 : 1;
        const damage = 0.1 * move[1] * eff * stab * number(physical ? wild.atk : wild.spa)
          / Math.max(1, number(physical ? own.def : own.spd));
        incoming = Math.max(incoming == null ? 0 : incoming, damage);
      }
      // Estima uma troca de golpes por ataque, sem supor conhecimento da cadência do servidor.
      if(simulated)incoming=simulated.incoming;
      const exposure = simulated ? simulated.exposure : incoming == null ? null : incoming / own.hp / attack.ritmo;
      const safety = exposure == null ? 0.75 : 1 / (1 + 2 * exposure);
      const measured = measurements && (measurements[String(hunt.sl).replace(/[_-]+/g, ' ').toLowerCase()]
        || measurements[String(hunt.name).replace(/[_-]+/g, ' ').toLowerCase()]);
      const defense = attack.fis ? wild.def : wild.spd;
      const offenseStat = attack.fis ? own.atk : own.spa;
      const difficulty = wild.hp * defense / Math.max(1, number(offenseStat));
      const observedHits = measured && !measured.estimated && number(measured.hpk) > 0 ? number(measured.hpk) : null;
      rows.push({ hunt, attack, incoming, exposure:observedHits&&simulation?.model==='local'&&incoming!=null?incoming*observedHits/own.hp:exposure, safety, difficulty, maxHuntLevel, band, observedHits, simulation:simulated, hpSource:health > 0 ? 'observed' : simulated ? 'simulated' : 'unknown', combatKnown:['hp','atk','def','spa','spd'].every(k=>observed[k]>0), measured: measured || null });
    }
    const exact = rows.filter(r => r.measured && !r.measured.estimated);
    const calibrated = exact.length ? exact : rows.filter(r => r.measured && !r.measured.legacy);
    const anchors = calibrated.filter(r => r.measured.xph > 0 && r.attack.xph > 0)
      .map(r => r.measured.xph / r.attack.xph).sort((a, b) => a - b);
    const anchor = anchors.length ? anchors[Math.floor(anchors.length / 2)] : 0;
    // Cadência de abates é independente de XP e de dólares. Sem amostra não inventa abates/h.
    const killAnchors = calibrated.filter(r => r.measured.kph > 0 && (!simulation || r.observedHits > 0))
      .map(r => r.observedHits > 0 ? r.measured.kph*r.observedHits : r.measured.kph/r.attack.ritmo).sort((a, b) => a - b);
    const killAnchor = killAnchors.length ? killAnchors[Math.floor(killAnchors.length / 2)] : 0;
    const localModel=simulation?.model==='local';
    const mapAnchors=calibrated.filter(r=>r.observedHits>0&&r.measured.kph>0).map(r=>{
      const expected=combatModel.throughput({hitIntervalMs:r.attack.cooldownMs,spawnDelayMs:r.hunt.spawnDelayMs},[r.observedHits]);
      return expected>0?r.measured.kph/expected:null;
    }).filter(v=>v>0).sort((a,b)=>a-b);
    const mapFactor=mapAnchors.length?mapAnchors[Math.floor(mapAnchors.length/2)]:1;
    rows.forEach(r => {
      const activeDay = day && day.until > Date.now() && [r.hunt.t1, r.hunt.t2].includes(day.type);
      const xpFactor=Math.max(1,number(xpMultiplier))+(activeDay?number(day.xp)/100:0);
      const fresh=r.measured&&!r.measured.estimated;
      r.kph = r.measured && r.measured.kph > 0 && (!localModel||fresh) ? r.measured.kph : localModel&&r.simulation?.kph>0 ? r.simulation.kph*mapFactor : killAnchor > 0 ? r.attack.ritmo * killAnchor : null;
      r.kphSource=fresh?'measured':localModel&&r.simulation?.kph>0?(mapAnchors.length?'calibrated':'move-cadence-model'):killAnchor>0?'calibrated':'unknown';
      r.xph = r.measured && (localModel ? fresh&&known(r.measured.xph)&&r.measured.xph>=0 : r.measured.xph>0) ? r.measured.xph
        : localModel&&r.kph!=null ? r.kph*number(r.hunt.xp)*xpFactor
        : killAnchor > 0 ? r.kph * number(r.hunt.xp) * xpFactor
        : anchor > 0 ? r.attack.xph * anchor : null;
      r.gph = null;
      r.goldSource = 'unknown';
      const captureRate = r.measured && known(r.measured.cph) && r.measured.kph > 0
        ? Math.max(0,Math.min(1,Number(r.measured.cph)/r.measured.kph)) : null;
      r.capturePerKill = r.measured && known(r.measured.capturePerKill)
        ? Math.max(0,Number(r.measured.capturePerKill))
        : captureRate != null && known(r.hunt.sv) ? captureRate * Math.max(0,Number(r.hunt.sv))
        : !(r.hunt.sv > 0) ? 0 : null;
      const modeledCapture=localModel?combatModel.capture(number(r.hunt.sv),simulation.items):null;
      if(localModel&&!fresh&&modeledCapture)r.capturePerKill=modeledCapture.perKill;
      r.captureModel=modeledCapture;
      // Poção informada permite uma estimativa conservadora sem presumir regeneração natural.
      const modeledPotion = potion !== undefined;
      const heal = number(potion && potion.heal);
      r.potionsPerKill = modeledPotion && r.incoming != null
        ? heal > 0 ? r.incoming * (localModel&&r.observedHits>0?r.observedHits:1/r.attack.ritmo) / heal : 0 : null;
      r.potionsPerHour = r.kph != null && r.potionsPerKill != null ? r.potionsPerKill * r.kph : null;
      if (dollars) {
        if (!modeledPotion && r.measured && known(r.measured.gph) && (!localModel||fresh)) {
          // O saldo do analyzer já desconta suprimentos e inclui capturas: não descontar duas vezes.
          r.gph = Number(r.measured.gph);
          r.goldSource = r.measured.estimated ? 'estimated' : 'measured';
        } else if (modeledPotion && r.kph != null && r.potionsPerKill != null) {
          const loot = r.measured && known(r.measured.lootPerKill) ? Number(r.measured.lootPerKill)
            : known(r.hunt.lootValue) ? Number(r.hunt.lootValue) * (1 + (activeDay ? number(day.loot) : 0) / 100) : null;
          if (loot != null && r.capturePerKill != null && (!potion || known(potion.price))) {
            // Keep recorded supply costs as a floor, including balls, without adding them twice.
            const supplies = Math.max(r.potionsPerKill * number(potion && potion.price)+(localModel&&!fresh?number(modeledCapture?.ballCost):0),number(r.measured?.supplyPerKill));
            r.gph = r.kph * (loot + r.capturePerKill - supplies);
            r.goldSource = 'estimated';
          }
        }
        if(localModel&&r.gph==null&&r.kph!=null&&known(r.hunt.lootValue)&&modeledCapture){
          const loot=Number(r.hunt.lootValue)*(1+(activeDay?number(day.loot):0)/100);
          const potionCost=potion&&known(potion.price)&&heal>0?r.incoming/r.attack.ritmo/heal*number(potion.price):0;
          const supplies=Math.max(modeledCapture.ballCost+potionCost,number(r.measured?.supplyPerKill));
          r.gph=r.kph*(loot+number(r.capturePerKill)-supplies);r.goldSource='estimated';
        }
      }
      // Somente a métrica escolhida pontua. Risco é uma condição de viabilidade, não um bônus.
      r.score = dollars ? r.gph : r.xph == null ? localModel ? null : r.attack.xph * xpFactor : r.xph;
      // Compare simulated XP using its conservative scenario, not its optimistic
      // point estimate, especially against a directly measured hourly yield.
      r.rankScore = !dollars && r.simulation && (!r.measured || r.measured.estimated)
        ? r.score * Math.min(1,r.simulation.meanHits/Math.max(1,r.simulation.highHits)) : r.score;
      const riskExposure=localModel&&r.observedHits>0?r.exposure:r.simulation?.conservativeExposure ?? r.exposure;
      r.risk = (!r.combatKnown && !r.simulation) || riskExposure == null ? 'unknown' : riskExposure >= 1 ? 'high' : riskExposure >= 0.35 ? 'medium' : 'low';
      if(localModel&&r.rankScore!=null)r.rankScore*=riskExposure==null?.75:1/(1+2*riskExposure);
      // Historical XP and potions must not make a dangerous matchup look safe.
      r.viable = riskExposure != null && riskExposure < 0.35;
      if (modeledPotion && r.incoming != null) {
        const hpAtThreshold = own.hp * Math.max(1, Math.min(99, number(threshold))) / 100;
        r.viable = r.viable && (potion ? heal >= r.incoming && hpAtThreshold > r.incoming : r.exposure < 0.35);
      }
    });
    const highestSafeLevel=Math.max(0,...rows.filter(r=>r.viable).map(r=>Number(r.hunt.level)));
    const preferredMinimum=Math.min(highestSafeLevel,Math.max(1,Math.floor(attacker.level/2)));
    rows.forEach(r=>{r.levelSuitable=r.hunt.level>=preferredMinimum
      || !!(r.measured && !r.measured.estimated && r.measured.xph>0);});
    const hasEffective = rows.some(r => r.viable && r.attack.eff > 1);
    // With no effective learned move, favor easy targets over inflated XP per kill.
    return rows.sort((a, b) => Number(b.viable) - Number(a.viable)
      || Number(b.levelSuitable) - Number(a.levelSuitable)
      || Number(b.score != null) - Number(a.score != null)
      || (!localModel&&hasEffective ? Number(b.attack.eff > 1) - Number(a.attack.eff > 1) : 0)
      || (!localModel&&!hasEffective && !dollars ? b.attack.ritmo - a.attack.ritmo || a.difficulty - b.difficulty : 0)
      || (a.rankScore != null && b.rankScore != null ? b.rankScore - a.rankScore : 0)
      || a.hunt.sl.localeCompare(b.hunt.sl));
  }

  function travelScript(expected, hunt) {
    if (!expected || !expected.cid || !expected.id || !validSlug(hunt && hunt.sl) || !(hunt.level > 0)) return null;
    const input = JSON.stringify({ cid: String(expected.cid), id: String(expected.id), level: number(expected.level),
      slug: hunt.sl, name:String(hunt.name || hunt.sl), minLevel: number(hunt.level) });
    return `(async()=>{const E=${input};const P=window.__poke;const navigation=${findNavigation.toString()};
      const check=()=>{if(!P||location.origin!=='https://poke.idleworld.online'||location.pathname!=='/play')return 'offline';
        const c=P.api&&P.api['/api/characters/me']&&P.api['/api/characters/me'].character;
        const p=((P.ws&&P.ws.pokes&&P.ws.pokes.list)||[]).find(p=>p.team&&p.leader);
        if(!c||String(c.id)!==E.cid||!p||String(p.id)!==E.id||+p.level!==E.level)return 'changed';
        if(+c.level<E.minLevel)return 'locked';if(!(p.hp>0))return 'fainted';
        if(!P.sock||P.sock.readyState!==1)return 'offline';return '';};
      const failure=check();if(failure)return {ok:false,reason:failure};
      const nav=navigation(document);if(!nav)return {ok:false,reason:'navigation'};
      if(nav.currentSlug===E.slug&&P.hunting&&P.lastSlug===E.slug)return {ok:true,already:true};
      const before=P.fiT||0;let requested=false;
      try{await nav.onSelect(E.slug,E.name);requested=true;}catch(e){return {ok:false,reason:'navigation'};}
      return await new Promise(resolve=>{const start=Date.now();const timer=setInterval(()=>{
        const error=check();if(error||(Date.now()-start>10000)){clearInterval(timer);resolve({ok:false,reason:error||'unconfirmed',requested});return;}
        const current=navigation(document);
        if(current&&current.currentSlug===E.slug&&P.hunting&&P.lastSlug===E.slug&&(P.fiT||0)>before){clearInterval(timer);resolve({ok:true,requested});}
      },200);});})()`;
  }
  return { rank, progressionBand, simulateCombat, combatCache, cachedCombat, lootValue, validSlug, travelScript, selectAccount, findNavigation, dayBonus, bestForDay };
});
