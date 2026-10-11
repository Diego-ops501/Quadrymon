(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.PokeMuxAptitude = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  const positive = value => value != null && value !== '' && Number.isFinite(Number(value)) && Number(value) > 0 ? Number(value) : null;
  function profile(atk, spa) {
    const a = positive(atk), s = positive(spa);
    if (!a || !s) return { role: 'unknown', advantage: null };
    // Diferenças de até 10% são apresentadas como equilíbrio, não como regra do jogo.
    const ratio = Math.max(a, s) / Math.min(a, s);
    return { role: ratio <= 1.1 ? 'balanced' : a > s ? 'physical' : 'special', advantage: Math.round((ratio - 1) * 100) };
  }
  function analyze(data) {
    const d = data || {}, b = d.bases || {}, a = d.atuais || {};
    const level = positive(d.pokemon && d.pokemon.nivel) || positive(d.nivel);
    const natural = profile(b.atk, b.spa), current = profile(a.atk, a.spa);
    const moves = (Array.isArray(d.golpes) ? d.golpes : []).map(g => {
      const category = String(g.categoria || '').toUpperCase();
      const role = category === 'PHYSICAL' ? 'physical' : category === 'SPECIAL' ? 'special' : 'unknown';
      const needed = g.nivel == null ? null : Number(g.nivel);
      const levelKnown = level != null && needed != null && Number.isFinite(needed) && needed >= 0;
      const levelLocked = levelKnown && level < needed;
      const tm = !!g.tm;
      const available = !levelLocked && levelKnown && (!tm || g.tmAprendida === true);
      const aligned = role !== 'unknown' && current.role !== 'unknown' && (current.role === 'balanced' || current.role === role);
      return { ...g, role, aligned, available, levelLocked, tmUnknown: tm && g.tmAprendida == null };
    });
    const usable = moves.filter(g => g.available && g.role !== 'unknown' && positive(g.poder));
    return { natural, current, level, lowLevel: level != null && level < 15, moves,
      usable: usable.length, aligned: usable.filter(g => g.aligned).length };
  }
  return { profile, analyze };
});
