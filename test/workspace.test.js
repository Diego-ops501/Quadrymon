'use strict';
const assert = require('node:assert/strict');
const { accountLabel, frameRate, createStateReader } = require('../src/renderer/workspace');
assert.equal(accountLabel('  Azuosjava  ', 0), 'Azuosjava');
assert.equal(accountLabel('', 1), 'Conta 2');
assert.equal(accountLabel('', 0, 'en'), 'Account 1');
assert.equal(frameRate({ eco: true, focused: 1, account: 0 }), 2);
assert.equal(frameRate({ eco: true, focused: 1, account: 1 }), 15);
assert.equal(frameRate({ eco: true, focused: -1, account: 3 }), 15);
assert.equal(frameRate({ eco: false, focused: 1, account: 0 }), 0);
assert.equal(frameRate({ summary: true, eco: false, focused: 1, account: 0 }), 1);

(async () => {
  let clock = 1000, calls = 0;
  const slots = [0, 1].map(i => ({ view: {}, email: 'fixture' + i, cid: 'character' + i, epoch: 0, off: false }));
  const cache = [], deferred = [];
  const read = createStateReader({ now: () => clock, slot: i => ({ ...slots[i] }), cache: i => cache[i],
    read: i => { calls++; return new Promise((resolve, reject) => deferred.push({ i, resolve, reject })); },
    publish: (i, d, slot) => { cache[i] = { t: clock, d, slot }; }
  });
  const tick = () => new Promise(resolve => setImmediate(resolve));
  const first = read(0), same = read(0), other = read(1);
  assert.equal(first, same, 'ferramentas compartilham a leitura em andamento');
  await tick(); assert.equal(calls, 2, 'contas diferentes mantêm leituras separadas');
  deferred[0].resolve({ ok: true, cid: 'character0', name: 'Azuosjava' });
  deferred[1].resolve({ ok: true, cid: 'character1', name: 'Outra conta' });
  await Promise.all([first, other]);
  for (let i = 0; i < 20; i++) assert.equal((await read(0)).name, 'Azuosjava');
  assert.equal(calls, 2, 'releituras do painel aproveitam o estado recente');
  const fresh = read(0, true); await tick(); assert.equal(calls, 3);
  deferred[2].resolve({ ok: true, cid: 'character0', name: 'Estado confirmado' }); await fresh;
  clock += 11000;
  const old = read(0); await tick(); slots[0].epoch++;
  const replacement = read(0); await tick();
  deferred[4].resolve({ ok: true, cid: 'character0', name: 'Após recarregar' }); await replacement;
  deferred[3].resolve({ ok: true, cid: 'character0', name: 'Resposta antiga' });
  assert.equal((await old).ok, false, 'resposta anterior ao reload é descartada');
  assert.equal(cache[0].d.name, 'Após recarregar');
  slots[0].email = 'nova-conta'; slots[0].cid = 'novo-personagem';
  const changed = read(0); await tick();
  deferred[5].resolve({ ok: true, cid: 'novo-personagem', name: 'Novo dono' }); await changed;
  assert.equal(cache[0].d.name, 'Novo dono', 'troca de conta invalida o cache privado');
  slots[0].off = true;
  assert.equal((await read(0)).ok, false, 'conta desligada não recebe dados antigos');
  slots[0].off = false; clock += 11000;
  const failed = read(0); await tick(); deferred[6].reject(Error('disconnected'));
  await assert.rejects(failed, /disconnected/);
  const retry = read(0); await tick(); deferred[7].resolve({ ok: true, cid: 'novo-personagem' }); await retry;
  console.log('Workspace: nomes, Eco por conta, leituras compartilhadas e isolamento de sessão aprovados.');
})().catch(error => { console.error(error); process.exitCode = 1; });
