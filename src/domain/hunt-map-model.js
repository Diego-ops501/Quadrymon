// Independently implemented mathematical model informed by PIW Tools.
// https://piwtools.com.br/hunt — Rakupo / bar (gcanivel); see NOTICE.md.
(function(root,factory){
  const api=factory(typeof module==='object'&&module.exports?require('./hunt-map-rates'):root.PokeMuxHuntMapRates);
  if(typeof module==='object'&&module.exports)module.exports=api;
  else root.PokeMuxHuntMapModel=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(reference){
  'use strict';
  const positive=v=>Number.isFinite(Number(v))&&Number(v)>0?Number(v):0;
  function damage(power,attack,defense,effectiveness,wild=false){
    if(!positive(power)||!positive(attack)||!positive(defense)||!positive(effectiveness))return 0;
    return power*attack*effectiveness/(30*(1+defense/100))*(wild?1.8:1);
  }
  function attack(attacker,hunt,own,catalog,effectiveness){
    let best=null;
    for(const move of catalog.moves?.[attacker.sp]?.a||[]){
      if(move[5]>attacker.level||!positive(move[1])||!positive(move[4]))continue;
      if(move[6]&&!(attacker.tms===true||attacker.tms?.includes(move[6])))continue;
      const raw=effectiveness(move[2],hunt.t1,hunt.t2);
      const eff=raw>1?1+(raw-1)*1.5:raw<1?raw/1.5:raw;
      const fis=move[3]==='P',wild=hunt.combatStats||{};
      const value=damage(move[1],fis?own.atk:own.spa,fis?wild.def:wild.spd,eff);
      if(value<=0)continue;
      const mg=value/positive(hunt.combatHp);
      if(!Number.isFinite(mg)||mg<=0)continue;
      if(!best||value>best.damage)best={nome:move[0],fis,eff,tm:move[6]||'',mg,damage:value,ritmo:Math.min(1,mg),xph:Math.min(1,mg)*positive(hunt.xp)};
    }
    return best;
  }
  function mapRates(id,tm=false){
    const row=reference?.rates?.[id];
    if(!row)return null;
    const rates=[];
    for(let hit=1;hit<=8;hit++){
      const rate=positive(row['hit'+hit]??row[(tm?'a':'s')+'hit'+hit]??row['ahit'+hit]??row['shit'+hit]);
      if(!rate)return null;
      rates.push(rate);
    }
    return rates;
  }
  function throughput(id,counts,tm=false){
    const rates=mapRates(id,tm);
    if(!rates||!counts?.length||counts.some(hit=>!Number.isFinite(hit)||hit<1))return null;
    // A weighted mean of time per kill; retain difficult targets beyond 8 hits
    // using the last supported map rate plus 1.6 seconds per additional hit.
    const time=hit=>3600/rates[Math.min(8,hit)-1]+Math.max(0,hit-8)*1.6;
    const seconds=counts.reduce((sum,hit)=>{
      const lo=Math.floor(hit),fraction=hit-lo;
      return sum+time(lo)*(1-fraction)+time(lo+1)*fraction;
    },0)/counts.length;
    return seconds>0?3600/seconds:null;
  }
  function capture(sale,items){
    if(!(sale>0))return {perKill:0,ballCost:0,probability:0,ball:''};
    const names=['Poke Ball','Great Ball','Super Ball','Ultra Ball'];
    const options=names.map((name,i)=>{
      const item=items?.find(item=>String(item.name).toLowerCase()===name.toLowerCase());
      if(!item||!positive(item.npcPrice))return null;
      const multiplier=positive(item.captureMultiplier)||i+1;
      const probability=Math.min(1,-Math.expm1(-.0098687*Math.pow(18000/sale,.9539)*multiplier/4));
      return {perKill:sale*probability,ballCost:Number(item.npcPrice),probability,ball:name};
    }).filter(Boolean).sort((a,b)=>(b.perKill-b.ballCost)-(a.perKill-a.ballCost));
    return options[0]||null;
  }
  return {damage,attack,mapRates,throughput,capture,source:reference?.source};
});
