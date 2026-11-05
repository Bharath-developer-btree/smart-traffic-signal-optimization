import { MIN_G, MAX_G, TOTAL_GREEN, clampG } from './trafficModel.js';
import { evaluate } from './simulationEngine.js';
// Chromosome = [N, E, S, W] green seconds, sum = 120 s, each in [10, 60]. Signals run one approach at a time in this order.
const repair = (v) => {
  const x = v.map(clampG); let diff = TOTAL_GREEN - x.reduce((a, b) => a + b, 0), i = 0;
  while (diff !== 0 && i++ < 1000) { const k = i % 4, step = diff > 0 ? 1 : -1; if (x[k] + step >= MIN_G && x[k] + step <= MAX_G) { x[k] += step; diff -= step; } }
  return x;
};
const key = (g) => g.join(',');
export const mk = (v) => { const g = repair(v); return { g, key: key(g) }; };
const rnd = () => MIN_G + Math.floor(Math.random() * (MAX_G - MIN_G + 1));
export const initPop = (n) => Array.from({ length: n }, () => mk([rnd(), rnd(), rnd(), rnd()]));
export const evalInd = (ind, D, cache) => {
  if (!cache.has(ind.key)) cache.set(ind.key, evaluate(D, ind.g)); // deterministic simulation -> safe to memoise
  const m = cache.get(ind.key);
  return { ...ind, m, objective: m.objective, fitness: m.fitness };
};
export function tournament(pop, k = 3) {
  let b = null;
  for (let i = 0; i < k; i++) { const c = pop[Math.floor(Math.random() * pop.length)]; if (!b || c.fitness > b.fitness) b = c; }
  return b;
}
export const crossover = (a, b) => mk(a.g.map((v, i) => v + (-0.25 + Math.random() * 1.5) * (b.g[i] - v))); // blend crossover per gene
export function mutate(c, rate) {
  if (Math.random() >= rate) return { child: c, mutated: false };
  const delta = (Math.random() < 0.5 ? -1 : 1) * (1 + Math.floor(Math.random() * 10)), v = [...c.g]; v[Math.floor(Math.random() * 4)] += delta;
  return { child: mk(v), mutated: true, delta };
}
export function nextGeneration(pop, { popSize, mutRate }, ev) {
  const kids = []; let first = null, mutEv = null;
  for (let i = 0; i < popSize; i++) {
    const p1 = tournament(pop), p2 = tournament(pop), x = crossover(p1, p2), m = mutate(x, mutRate);
    kids.push(ev(m.child));
    if (!first) first = { p1, p2, x };
    if (m.mutated && !mutEv) mutEv = { p1, p2, x, before: x, after: m.child, delta: m.delta };
  }
  // (mu + lambda) survivor selection: parents + children, unique, best kept -> elitism
  const seen = new Set(), next = [];
  for (const c of [...pop, ...kids].sort((a, b) => b.fitness - a.fitness)) {
    if (!seen.has(c.key)) { seen.add(c.key); next.push(c); }
    if (next.length >= popSize) break;
  }
  while (next.length < popSize) { const c = ev(mk([rnd(), rnd(), rnd(), rnd()])); if (!seen.has(c.key)) { seen.add(c.key); next.push(c); } }
  const e = mutEv || first;
  return { pop: next, event: { p1: e.p1, p2: e.p2, x: e.x, mut: mutEv, kids: kids.length } };
}
