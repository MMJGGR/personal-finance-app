export function findLinkedAsset(id, assetsList = []) {
  return assetsList.find(a => a.id === id);
}

export function calculatePV(stream, discountRate, years, assumptions, linkedAsset) {
  const startYear = Math.max(new Date().getFullYear(), stream.startYear);
  const endYear = getStreamEndYear(stream, assumptions, linkedAsset);
  let pv = 0;
  for (let y = startYear; y <= endYear; y++) {
    const t = y - startYear;
    const grown = stream.amount * stream.frequency * Math.pow(1 + stream.growth / 100, t);
    const discounted = grown / Math.pow(1 + discountRate / 100, t + 1);
    pv += discounted;
  }
  return {
    gross: pv,
    net: pv * (1 - stream.taxRate / 100)
  };
}

export function generateIncomeTimeline(sources, years, assumptions, assetsList = []) {
  const startYear = new Date().getFullYear();
  const timeline = Array.from({ length: years }, (_, i) => ({ year: startYear + i, gross: 0, net: 0 }));
  sources.forEach(s => {
    if (!s.active) return;
    const linkedAsset = findLinkedAsset(s.linkedAssetId, assetsList);
    const start = Math.max(startYear, s.startYear);
    const end = getStreamEndYear(s, assumptions, linkedAsset);
    for (let y = start; y <= end; y++) {
      const idx = y - startYear;
      if (idx >= 0 && idx < years) {
        const t = y - start;
        const grown = s.amount * s.frequency * Math.pow(1 + s.growth / 100, t);
        timeline[idx].gross += grown;
        timeline[idx].net += grown * (1 - s.taxRate / 100);
      }
    }
  });
  return timeline;
}

import { getStreamEndYear } from '../../utils/incomeProjection';
