(function(root, factory) {
  const api=factory();
  if(typeof module==='object' && module.exports)module.exports=api;
  else root.PokeMuxSummary=api;
})(typeof globalThis!=='undefined'?globalThis:this,function() {
  const COPY={
    pt:{title:'Resumo das contas',pace:'Ritmo atual · por hora',session:'Sessão da hunt',accounts:'Contas em farm',open:'Abrir conta',analyze:'Analisar hunt',balls:'Pokébolas',potions:'Poções',estimate:'Duração estimada pelo consumo da sessão',unknown:'Sem consumo suficiente para estimar',infinite:'Infinita',off:'Desligada',down:'Desconectada',wait:'Aguardando dados',idle:'Fora da hunt',stalled:'Sem combate recente',hunting:'Farm ativo',emptyBalls:'Sem Pokébolas',emptyPotions:'Poções esgotadas',faint:'Pokémon ativo sem HP',important:'Capturas importantes',all:'Todas as capturas',pinned:'Itens fixados',noPinned:'Fixe itens em Ajustes → Análise para acompanhar as quantidades.',problems:'Atenção às contas',now:'Agora',today:'Hoje · acumulado',noHunt:'Nenhuma hunt ativa',supplies:'Suprimentos',captures:'Capturas',noPokemon:'Nenhum Pokémon ativo',sample:'Aguardando medição',updated:'Dados atualizados',missing:'Indisponível'},
    en:{title:'Account summary',pace:'Current pace · per hour',session:'Hunt session',accounts:'Farming accounts',open:'Open account',analyze:'Analyze hunt',balls:'Poké Balls',potions:'Potions',estimate:'Estimated duration from session consumption',unknown:'Not enough consumption to estimate',infinite:'Infinite',off:'Off',down:'Disconnected',wait:'Waiting for data',idle:'Outside hunt',stalled:'No recent combat',hunting:'Farming',emptyBalls:'No Poké Balls',emptyPotions:'Potions depleted',faint:'Active Pokémon has no HP',important:'Important catches',all:'All catches',pinned:'Pinned items',noPinned:'Pin items in Settings → Analysis to track quantities.',problems:'Accounts need attention',now:'Now',today:'Today · accumulated',noHunt:'No active hunt',supplies:'Supplies',captures:'Catches',noPokemon:'No active Pokémon',sample:'Waiting for measurements',updated:'Updated data',missing:'Unavailable'},
    es:{title:'Resumen de cuentas',pace:'Ritmo actual · por hora',session:'Sesión de hunt',accounts:'Cuentas farmeando',open:'Abrir cuenta',analyze:'Analizar hunt',balls:'Poké Balls',potions:'Pociones',estimate:'Duración estimada por consumo de la sesión',unknown:'Consumo insuficiente para estimar',infinite:'Infinita',off:'Apagada',down:'Desconectada',wait:'Esperando datos',idle:'Fuera de hunt',stalled:'Sin combate reciente',hunting:'Farmeando',emptyBalls:'Sin Poké Balls',emptyPotions:'Pociones agotadas',faint:'Pokémon activo sin HP',important:'Capturas importantes',all:'Todas las capturas',pinned:'Objetos fijados',noPinned:'Fija objetos en Ajustes → Análisis para ver las cantidades.',problems:'Cuentas requieren atención',now:'Ahora',today:'Hoy · acumulado',noHunt:'Sin hunt activa',supplies:'Suministros',captures:'Capturas',noPokemon:'Sin Pokémon activo',sample:'Esperando mediciones',updated:'Datos actualizados',missing:'No disponible'}
  };
  const finite=value=>typeof value==='number'&&Number.isFinite(value);
  function duration(stock,used,seconds,infinite=false) {
    if(infinite)return Infinity;
    if(!finite(stock)||stock<0||!finite(used)||used<=0||!finite(seconds)||seconds<600)return null;
    return stock*seconds/used;
  }
  function health(row,now=Date.now()) {
    if(row.st==='off')return {status:'off',issues:[]};
    if(row.st==='down')return {status:'down',issues:['down']};
    if(row.st!=='on')return {status:'wait',issues:[]};
    const farm=row.farm||{};
    const quiet=finite(farm.lastCombatT)&&farm.lastCombatT>0&&now-farm.lastCombatT>180000;
    const status=farm.hunting===false?'idle':quiet?'stalled':farm.hunting===true?'hunting':'wait';
    const issues=status==='idle'||status==='stalled'?[status]:[];
    if(row.lead?.hm>0&&row.lead.hp===0)issues.push('faint');
    if(row.hasBalls&&row.balls===0&&!row.infiniteBalls)issues.push('emptyBalls');
    if(row.hasInv&&row.pots===0&&row.aPots>0)issues.push('emptyPotions');
    const ballTime=duration(row.balls,row.aBalls,row.secs,row.infiniteBalls);
    const potionTime=duration(row.pots,row.aPots,row.secs);
    if(row.hasBalls&&row.balls>0&&ballTime!==null&&ballTime<7200)issues.push('lowBalls');
    if(row.hasInv&&row.pots>0&&potionTime!==null&&potionTime<7200)issues.push('lowPotions');
    return {status,issues};
  }
  function important(entry) {return !!entry && (!!entry.sh||Number(entry.iv)>=160||Number(entry.q)>=1.7);}
  function prioritize(entries) {
    return entries.filter(entry=>entry&&typeof entry==='object').sort((a,b)=>Number(important(b))-Number(important(a))||Number(!!b.sh)-Number(!!a.sh)||(Number(b.t)||0)-(Number(a.t)||0));
  }
  // Reconcile keyed sections/accounts/catches and update only changed attributes/text.
  // Existing controls, listeners, scroll containers and focused inputs retain their identity.
  function patch(container,html) {
    const template=container.ownerDocument.createElement('template');template.innerHTML=html;
    const key=node=>node.nodeType===1?(node.id?'id:'+node.id:node.getAttribute('data-summary-key')|| (node.hasAttribute('data-s')?'section:'+node.dataset.s:'')):'';
    function sync(target,source) {
      const old=[...target.childNodes], keyed=new Map(old.map(node=>[key(node),node]).filter(pair=>pair[0]));
      const used=new Set();let cursor=target.firstChild;
      for(const incoming of [...source.childNodes]) {
        const id=key(incoming);
        let node=id?keyed.get(id):old.find(candidate=>!used.has(candidate)&&!key(candidate)&&candidate.nodeType===incoming.nodeType&&candidate.nodeName===incoming.nodeName);
        if(!node||node.nodeType!==incoming.nodeType||node.nodeName!==incoming.nodeName)node=incoming.cloneNode(true);
        else if(node.nodeType===3){if(node.data!==incoming.data)node.data=incoming.data;}
        else if(node.nodeType===1) {
          for(const attr of [...node.attributes])if(!incoming.hasAttribute(attr.name))node.removeAttribute(attr.name);
          for(const attr of incoming.attributes)if(node.getAttribute(attr.name)!==attr.value)node.setAttribute(attr.name,attr.value);
          sync(node,incoming);
          if(node!==container.ownerDocument.activeElement) {
            if(node.tagName==='INPUT') {node.value=incoming.value;node.checked=incoming.checked;}
            if(node.tagName==='SELECT')node.value=incoming.value;
          }
        }
        used.add(node);
        if(node!==cursor)target.insertBefore(node,cursor);
        cursor=node.nextSibling;
      }
      for(const node of old)if(!used.has(node)&&node.parentNode===target)node.remove();
    }
    sync(container,template.content);
  }
  Object.assign(COPY.pt,{lowBalls:'Pokébolas: menos de 2h estimadas',lowPotions:'Poções: menos de 2h estimadas'});
  Object.assign(COPY.en,{lowBalls:'Poké Balls: less than 2h estimated',lowPotions:'Potions: less than 2h estimated'});
  Object.assign(COPY.es,{lowBalls:'Poké Balls: menos de 2h estimadas',lowPotions:'Pociones: menos de 2h estimadas'});
  return {COPY,duration,health,important,prioritize,patch};
});
