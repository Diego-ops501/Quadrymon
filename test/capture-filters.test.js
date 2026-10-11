'use strict';

const { parseLooseNumber, rarityKey, filterCaptures } = require('../src/domain/capture-filters');

let checks = 0;
function ok(condition, message) {
  if (!condition) throw new Error('FALHOU: ' + message);
  checks++;
  console.log('OK  ', message);
}

const hour = 3600e3;
const now = 2_000_000_000_000;
const captures = [
  { n: 'Pikachu', p: 0, sh: false, iv: '120/192', q: 'Lendária ×1,75', t: now - 30 * 60e3 },
  { n: 'Raichu', p: 1, sh: true, iv: 150, q: 1.82, t: now - 2 * hour },
  { n: 'Eevee', p: 2, sh: false, iv: 110, q: '1,76', t: now - 8 * hour },
  { n: 'Vaporeon', p: 3, sh: false, iv: '98/192', q: 'Lendária ×1.70', t: now - 30 * hour },
  { n: 'Jolteon', p: 0, sh: false, iv: 130, q: 1.99, t: now - 48 * hour },
  { n: 'Flareon', p: 1, sh: false, iv: 140, q: 1.79, t: now - 72 * hour },
  { n: 'Mew', p: 2, sh: true, iv: 191, q: 4.1, t: now - 15 * 60e3 },
  { n: 'Ditto', p: 3, sh: false, iv: 89, q: 1.4, t: now - 20 * 60e3 }
];
const all = { p: -1, n: '', sh: 0, r: '', q: 0, iv: 0, per: 0 };

ok(parseLooseNumber('104/192') === 104 && parseLooseNumber('Lendária ×1,76') === 1.76, 'números antigos de IV e qualidade são recuperados');
ok(rarityKey('Lendária ×1,70') === 'legendary' && rarityKey('Divina ×4,1') === 'divine', 'faixas de raridade aceitam dados textuais antigos');
ok(filterCaptures(captures, all, now).length === captures.length, 'Todos não impõe limite oculto');
ok(filterCaptures(captures, { ...all, r: 'legendary' }, now).length === 6, 'raridade + período Todos conserva mais de quatro resultados');
ok(filterCaptures(captures, { ...all, p: 1 }, now).every(x => x.p === 1), 'filtro por conta');
ok(filterCaptures(captures, { ...all, n: 'CHU' }, now).map(x => x.n).join(',') === 'Pikachu,Raichu', 'filtro por nome ignora maiúsculas');
ok(filterCaptures(captures, { ...all, sh: 1 }, now).every(x => x.sh), 'filtro de shiny');
ok(filterCaptures(captures, { ...all, iv: 130 }, now).every(x => parseLooseNumber(x.iv) >= 130), 'filtro de IV mínimo');
ok(filterCaptures(captures, { ...all, q: '1,8' }, now).every(x => parseLooseNumber(x.q) >= 1.8), 'filtro de qualidade mínima');
ok(filterCaptures(captures, { ...all, per: 1 }, now).length === 3, 'período de 1 hora');
ok(filterCaptures(captures, { ...all, per: 6 }, now).length === 4, 'período de 6 horas');
ok(filterCaptures(captures, { ...all, per: 24 }, now).length === 5, 'período de 24 horas');
ok(filterCaptures(captures, { ...all, p: 0, r: 'legendary', iv: 125 }, now).map(x => x.n).join(',') === 'Jolteon', 'combinação de conta, raridade e IV');
ok(filterCaptures(captures, all, now)[0].n === 'Mew' && captures[0].n === 'Pikachu', 'resultado é recente primeiro sem alterar o histórico original');

console.log(`\nFiltros de capturas: ${checks} checks passaram`);
