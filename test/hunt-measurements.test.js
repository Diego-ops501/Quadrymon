'use strict';

const H = require('../src/domain/hunt-measurements');

let checks = 0;
function ok(condition, message) {
  if (!condition) throw new Error('FALHOU: ' + message);
  checks++;
  console.log('OK  ', message);
}

const pikachu20 = { id: 'poke-1', sid: 25, name: 'Pikachu', level: 20, q: 1.2, ivt: 100 };
const pikachu21 = { ...pikachu20, level: 21 };
const charizard20 = { id: 'poke-2', sid: 6, name: 'Charizard', level: 20, q: 1.8, ivt: 150 };
const contexts = [], store = {};
const metric = (seconds, xph, gph = 1000) => ({ seconds, xph, gph, kph: 100, captures: seconds / 60, hpk: 2 });

ok(H.pokemonKey(pikachu20) !== H.pokemonKey(pikachu21), 'o nível faz parte da identidade da medição');
ok(H.pokemonKey(pikachu20) !== H.pokemonKey(charizard20), 'o Pokémon faz parte da identidade da medição');
ok(H.isolateSample(contexts, 0, 'acc-1', 'Viridian Forest', pikachu20, metric(1000, 5000), 1) === null, 'primeira leitura cria uma linha de base, sem herdar a sessão anterior');
const pika = H.isolateSample(contexts, 0, 'acc-1', 'Viridian Forest', pikachu20, metric(1300, 6000), 2);
ok(pika && pika.metrics.xph === 9333, 'mede somente o delta posterior à linha de base do Pokémon');
ok(H.recordMeasurement(store, pika), 'grava a medição válida');
ok(H.statsFor(store, 'acc-1', pikachu20)['viridian forest'].xph === 9333, 'recupera somente o histórico do Pokémon e nível atuais');
ok(Object.keys(H.statsFor(store, 'acc-1', charizard20)).length === 0, 'outro Pokémon não recebe a recomendação antiga');
ok(H.recommendationStatsFor(store, 'acc-1', pikachu21)['viridian forest'].xph === 9333, 'nível seguinte reaproveita a hunt do mesmo Pokémon');
ok(Object.keys(H.recommendationStatsFor(store, 'acc-1', charizard20)).length === 0, 'nível próximo nunca mistura outro Pokémon');
ok(H.isolateSample(contexts, 0, 'acc-1', 'Viridian Forest', charizard20, metric(1350, 9000), 3) === null, 'trocar o líder reinicia a medição');
ok(H.isolateSample(contexts, 0, 'acc-1', 'Viridian Forest', charizard20, metric(1500, 9000), 4) === null, 'não recomenda antes de cinco minutos limpos');
const charizard = H.isolateSample(contexts, 0, 'acc-1', 'Viridian Forest', charizard20, metric(1650, 9000), 5);
ok(charizard && charizard.metrics.xph === 9000, 'novo Pokémon passa a medir após cinco minutos próprios');
ok(H.isolateSample(contexts, 0, 'acc-1', 'Viridian Forest', pikachu21, metric(1700, 10000), 6) === null, 'subir de nível também reinicia a medição');
ok(Object.keys(H.statsFor(store, 'acc-1', pikachu21)).length === 0, 'nível novo não usa o histórico do nível anterior');

const normalized = {
  'acc-2': {
    'poke-1@lv20': {
      'hunt ruim': { xph: 5000, n: 3, t: 10, metricVersion:2 },
      'hunt boa': { xph: 10000, n: 3, t: 10, metricVersion:2 }
    },
    'poke-1@lv21': { 'hunt ruim': { xph: 5500, n: 1, t: 20, metricVersion:2 } }
  }
};
const rec = H.recommendationStatsFor(normalized, 'acc-2', pikachu21);
ok(rec['hunt ruim'].xph === 5500 && !rec['hunt ruim'].estimated, 'medição exata do nível atual tem prioridade');
ok(rec['hunt boa'].xph === 11000 && rec['hunt boa'].sourceLevel === 20, 'hunt de nível próximo é normalizada pela hunt medida nos dois níveis');
ok(Object.keys(H.recommendationStatsFor(normalized, 'acc-2', { ...pikachu21, level: 27 })).length === 0, 'recomendação não usa nível distante');

const financeContexts = [], financeStore = {};
H.isolateSample(financeContexts,0,'acc-finance','wooper',pikachu20,
  {...metric(1000,5000),lootGold:1000,capturesGold:300,supplyGold:200},1);
const finance = H.isolateSample(financeContexts,0,'acc-finance','wooper',pikachu20,
  {...metric(1300,6000),lootGold:1200,capturesGold:350,supplyGold:225},2);
ok(Math.abs(finance.metrics.lootPerKill-24)<.001,'loot por abate usa somente o delta da amostra');
ok(Math.abs(finance.metrics.capturePerKill-6)<.001,'valor das capturas não se mistura com loot');
ok(Math.abs(finance.metrics.supplyPerKill-3)<.001,'suprimentos ficam separados do saldo líquido');
H.recordMeasurement(financeStore,finance);
ok(H.statsFor(financeStore,'acc-finance',pikachu20).wooper.lootPerKill>0,'componentes financeiros persistem por Pokémon');
ok(pika.metrics.lootPerKill===null,'amostra antiga sem componentes não vira loot zero');


const directContexts=[],directStore={};
const direct=(seconds,xpg,kills,hits)=>({seconds,xpg,kills,hits,epoch:'session-one',gph:0,captures:0});
H.isolateSample(directContexts,0,'direct','enigmatic_girafarig',pikachu20,direct(100,100000,10,100),1000);
const directSample=H.isolateSample(directContexts,0,'direct','enigmatic_girafarig',pikachu20,direct(400,505240,30,130),301000);
ok(directSample.metrics.xph===4862880,'XP/h uses raw game XP delta including VIP, without reconstructing rounded per-hour metrics');
ok(directSample.metrics.hpk===1.5,'hits per kill use only the current measurement period');
ok(H.isolateSample(directContexts,0,'direct','enigmatic_girafarig',pikachu20,direct(401,525502,31,132),302000)===null,'next poll does not re-record the same five-minute window');
const nextSample=H.isolateSample(directContexts,0,'direct','enigmatic_girafarig',pikachu20,direct(700,1113100,60,175),601000);
ok(nextSample.metrics.xph===7294320,'next window measures the new pace independently');
H.recordMeasurement(directStore,directSample);H.recordMeasurement(directStore,nextSample);
ok(H.statsFor(directStore,'direct',pikachu20)['enigmatic girafarig'].xph===6078600,'independent equal-duration periods have equal statistical weight');
ok(!H.recommendationStatsFor(directStore,'direct',pikachu20)['enigmatic girafarig'].estimated,'corrected raw-event measurements are labeled measured');
const oldStore={direct:{'poke-1@lv20':{'enigmatic girafarig':{xph:5596835,hpk:1.5,kph:276}}}};
ok(H.recommendationStatsFor(oldStore,'direct',pikachu20)['enigmatic girafarig'].legacy,'old rates are retained as history rather than certified as current measurements');
H.recordMeasurement(oldStore,directSample);
ok(H.statsFor(oldStore,'direct',pikachu20)['enigmatic girafarig'].xph===4862880,'fresh corrected sample replaces legacy average instead of mixing both');
ok(H.isolateSample(directContexts,0,'direct','enigmatic_girafarig',pikachu20,{...direct(800,100,1,2),epoch:'new-session'},700000)===null,'server/session counter reset starts a fresh baseline');

console.log(`\nMedições de hunt por Pokémon: ${checks} checks passaram`);
