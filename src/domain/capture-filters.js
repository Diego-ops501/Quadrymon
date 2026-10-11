(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.PokeMuxCaptureFilters = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  function parseLooseNumber(value) {
    if (typeof value === 'number') return Number.isFinite(value) ? value : 0;
    const match = String(value == null ? '' : value).match(/[0-9]+(?:[.,][0-9]+)?/);
    return match ? Number(match[0].replace(',', '.')) || 0 : 0;
  }

  function rarityKey(quality) {
    const q = parseLooseNumber(quality);
    return q >= 4 ? 'divine'
      : q >= 3 ? 'ancient'
        : q >= 2 ? 'mythic'
          : q >= 1.7 ? 'legendary'
            : q >= 1.5 ? 'epic'
              : q >= 1.3 ? 'rare'
                : q >= 1.1 ? 'uncommon'
                  : q >= 1 ? 'common' : 'weak';
  }

  function filterCaptures(entries, filters, now) {
    const list = Array.isArray(entries) ? entries : [];
    const f = filters && typeof filters === 'object' ? filters : {};
    const account = Number.isInteger(Number(f.p)) ? Number(f.p) : -1;
    const name = String(f.n || '').trim().toLowerCase().slice(0, 30);
    const rarity = String(f.r || '');
    const minIv = Math.max(0, parseLooseNumber(f.iv));
    const minQuality = Math.max(0, parseLooseNumber(f.q));
    const hours = [1, 6, 24].includes(Number(f.per)) ? Number(f.per) : 0;
    const referenceTime = Number.isFinite(Number(now)) ? Number(now) : Date.now();
    const cutoff = hours ? referenceTime - hours * 3600e3 : 0;

    return list.filter((entry) => {
      const x = entry && typeof entry === 'object' ? entry : {};
      return (account < 0 || Number(x.p) === account)
        && (!name || String(x.n || '').toLowerCase().includes(name))
        && (!f.sh || !!x.sh)
        && (!rarity || rarityKey(x.q) === rarity)
        && parseLooseNumber(x.iv) >= minIv
        && parseLooseNumber(x.q) >= minQuality
        && parseLooseNumber(x.t) >= cutoff;
    }).slice().sort((a, b) => parseLooseNumber(b && b.t) - parseLooseNumber(a && a.t));
  }

  return { parseLooseNumber, rarityKey, filterCaptures };
});
