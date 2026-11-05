export const DIRS = ['N', 'S', 'E', 'W'];
export const NAMES = { N: 'North', S: 'South', E: 'East', W: 'West' };
export const TOTAL_GREEN = 120, MIN_G = 10, MAX_G = 60, YELLOW = 3, ALL_RED = 1;
export const FIXED = [30, 30, 30, 30]; // green seconds for N, E, S, W (one approach at a time)
export const ORDER = ['N', 'E', 'S', 'W'];
export const SCENARIOS = {
  balanced: { N: 20, S: 20, E: 20, W: 20 },
  nsRush: { N: 70, S: 60, E: 15, W: 10 },
  ewRush: { N: 15, S: 10, E: 70, W: 60 },
  heavy: { N: 80, S: 75, E: 70, W: 65 },
};
export const randomScenario = () => { const r = () => 5 + Math.floor(Math.random() * 90); return { N: r(), S: r(), E: r(), W: r() }; };
export const intensity = (v) => (v < 25 ? 'Low' : v < 50 ? 'Medium' : v < 75 ? 'High' : 'Very High');
export const INT_COLOR = { Low: '#22c55e', Medium: '#eab308', High: '#f97316', 'Very High': '#ef4444' };
export const qLevel = (q) => (q < 4 ? 'Low' : q < 8 ? 'Medium' : q < 12 ? 'High' : 'Very High');
export const cycleOf = (plan) => plan.reduce((a, g) => a + g + YELLOW + ALL_RED, 0);

/** Signal state at time t. Exactly ONE approach is green at any time: GREEN -> YELLOW (3 s) -> RED (all red) -> next approach GREEN. */
export function signalAt(t, plan) {
  let x = t % cycleOf(plan);
  for (let i = 0; i < 4; i++) {
    for (const [s, d] of [['G', plan[i]], ['Y', YELLOW], ['R', ALL_RED]]) {
      if (x < d) {
        const st = { N: 'R', E: 'R', S: 'R', W: 'R' };
        if (s !== 'R') st[ORDER[i]] = s;
        return { ...st, phase: s === 'R' ? 'ALL RED' : `${NAMES[ORDER[i]].toUpperCase()} ${s === 'G' ? 'GREEN' : 'YELLOW'}`, active: s === 'R' ? null : ORDER[i], remaining: d - x, isGreen: s === 'G' };
      }
      x -= d;
    }
  }
}

/** Countdown per approach: green/yellow -> seconds left; red -> seconds until it turns green. */
export function timersAt(t, plan) {
  const cur = signalAt(t, plan), out = {};
  for (const d of DIRS) {
    const s = cur[d];
    if (s !== 'R') out[d] = { state: s, sec: Math.ceil(cur.remaining) };
    else { let k = 0; while (k < 600 && signalAt(t + k, plan)[d] !== 'G') k += 0.25; out[d] = { state: 'R', sec: Math.ceil(k) }; }
  }
  return out;
}
export const clampG = (g) => Math.max(MIN_G, Math.min(MAX_G, Math.round(g)));
