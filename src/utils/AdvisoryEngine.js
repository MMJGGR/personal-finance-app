export function computeFundingAdequacy(projected = 0, target = 0) {
  const gap = projected - target;
  const pct = target > 0 ? gap / target : 0;
  let flag = null;
  if (target > 0) {
    if (pct < -0.1) flag = 'shortfall';
    else if (pct > 0.1) flag = 'overfunded';
    else flag = 'on-track';
  }
  return { gap, pct, flag };
}

export default { computeFundingAdequacy };
