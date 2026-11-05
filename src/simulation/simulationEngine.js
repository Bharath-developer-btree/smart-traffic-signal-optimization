import { DIRS, signalAt, cycleOf } from './trafficModel.js';
const ARC0 = 93, SC = 97.5, GAPT = 2.5; // turn starts at ARC0; SC = conflict point with oncoming traffic; GAPT = critical gap (s)
// exit lane (heading of the arm) for each approach/turn, and offset converting s to distance-from-centre along that arm
const EX = { N: { S: 'S', L: 'E', R: 'W' }, S: { S: 'N', L: 'W', R: 'E' }, E: { S: 'W', L: 'S', R: 'N' }, W: { S: 'E', L: 'N', R: 'S' } };
const OFFS = { S: 100, L: 91.5, R: 102.5 };
const ALPHA = { N: 0, E: Math.PI / 2, S: Math.PI, W: 1.5 * Math.PI };
/** World pose of a point u metres along the route of an approach d (straight / left / right). Left-hand traffic. */
export function pose(d, turn, u, lat = 0) {
  let x = 3.5 + lat, z = u - 100, psi = 0;
  if (turn !== 'S' && u > ARC0) {
    const k = u - ARC0;
    if (turn === 'L') { const r = 3.5, L = (Math.PI / 2) * r; if (k <= L) { psi = k / r; x = 7 - r * Math.cos(psi); z = -7 + r * Math.sin(psi); } else { psi = Math.PI / 2; x = 7 + (k - L); z = -3.5; } }
    else { const r = 10.5, L = (Math.PI / 2) * r; if (k <= L) { const f = k / r; psi = -f; x = -7 + r * Math.cos(f); z = -7 + r * Math.sin(f); } else { psi = -Math.PI / 2; x = -7 - (k - L); z = 3.5; } }
  }
  const a = ALPHA[d], c = Math.cos(a), s = Math.sin(a);
  return { x: x * c - z * s, z: x * s + z * c, rot: psi - a };
}
// Lane geometry (metres along a lane): spawn s=0 ... stop line ... centre ... exit ... removed at END
export const STOP = 90, CENTER = 100, EXIT = 110, END = 170;
const MAX_HOLD = 20; // failsafe only: red is held until the junction box is empty, so the next approach never meets a car still crossing
const VMAX = 11, ACC = 2.5, BRK = 4, GAP = 2;
const TYPES = [{ t: 'car', len: 4.2, w: 1.9 }, { t: 'bus', len: 10, w: 2.5 }, { t: 'truck', len: 7, w: 2.3 }, { t: 'bike', len: 2, w: 0.8 }];
const PAL = ['#ef4444', '#3b82f6', '#f59e0b', '#10b981', '#e5e7eb', '#a855f7', '#06b6d4', '#f97316'];
function rng(seed) { let a = seed; return () => { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }

export class Sim {
  constructor(demand, plan, seed = 1) { this.reset(demand, plan, seed); }
  reset(demand = this.demand, plan = this.plan, seed = this.seed) {
    this.demand = { ...demand }; this.plan = plan; this.seed = seed; this.rand = rng(seed);
    this.t = 0; this.sc = 0; this.inAR = false; this.hold = 0; this.arCount = 0; this.holdTot = 0; this.turned = { S: 0, L: 0, R: 0 }; this.nextId = 1; this.lanes = { N: [], S: [], E: [], W: [] };
    this.qNow = { N: 0, S: 0, E: 0, W: 0 }; this.hidNow = 0;
    this.served = 0; this.doneWait = 0; this.qSum = 0; this.qN = 0; this.maxQ = 0;
    this.sig = signalAt(0, plan);
  }
  setDemand(d) { this.demand = { ...d }; }
  /** Is any vehicle still inside the junction box (e.g. a bus finishing a right turn)? */
  occupied() { for (const d of DIRS) for (const v of this.lanes[d]) if (v.s > STOP + 0.5 && v.s - v.len < EXIT) return true; return false; }
  step(dt) {
    const sig = signalAt(this.sc, this.plan); this.sig = sig; let qTot = 0, hid = 0;
    // Signal clock: during ALL-RED it is frozen until turning vehicles have cleared the junction
    if (sig.phase === 'ALL RED') {
      if (!this.inAR) { this.inAR = true; this.arCount++; this.hold = 0; }
      if (this.hold < MAX_HOLD && this.occupied()) { this.hold += dt; this.holdTot += dt; } else this.sc += dt;
    } else { this.inAR = false; this.sc += dt; }
    for (const d of DIRS) {
      const L = this.lanes[d], st = sig[d]; // each approach has its own signal: only one is ever green
      const r = this.rand(), r2 = this.rand(), r3 = this.rand(), r4 = this.rand();
      if (r < (this.demand[d] / 120) * dt) { // arrival rate = demand/120 vehicles per second
        const last = L[L.length - 1];
        if (!last || last.s - last.len > GAP + 5) {
          const ty = r2 < 0.55 ? TYPES[0] : r2 < 0.75 ? TYPES[3] : r2 < 0.85 ? TYPES[1] : TYPES[2];
          const turn = r4 < 0.15 ? 'L' : r4 < 0.3 ? 'R' : 'S'; // 15% left, 15% right, 70% straight
          L.push({ id: this.nextId++, d, s: 0, v: 5, wait: 0, hidden: false, turn, hold: 0, lat: ty.t === 'bike' && turn === 'S' ? (this.nextId % 2 ? 1.6 : -1.6) : 0, len: ty.len, w: ty.w, type: ty.t, color: PAL[Math.floor(r3 * PAL.length)] });
        }
      }
      let q = 0;
      for (let i = 0; i < L.length; i++) {
        const c = L[i]; let lim = Infinity;
        if (i > 0) { const p = L[i - 1]; lim = p.s - p.len - GAP; }           // keep safe distance
        if (c.s <= STOP) {                                                     // stop line rule (<=: a car halted exactly on the line must keep obeying the red)
          const dist = STOP - c.s;
          if (st === 'R' || (st === 'Y' && dist >= (c.v * c.v) / (2 * BRK))) lim = Math.min(lim, STOP);
        }
        if (c.s > STOP - 20) {                                                  // merge into a shared exit lane: keep a gap to the vehicle ahead
          const el = EX[d][c.turn], ec = c.s - OFFS[c.turn];
          for (const d2 of DIRS) { if (d2 === d) continue; for (const u of this.lanes[d2]) {
            if (u.s <= STOP + 0.5 || EX[d2][u.turn] !== el) continue; // cars still waiting at their stop line are not in the junction yet
            const eu = u.s - OFFS[u.turn];
            if (eu > ec) lim = Math.min(lim, eu - u.len - GAP + OFFS[c.turn]);
          } }
        }
        // One approach at a time: no oncoming or crossing traffic is released, so left and right turners never need to wait for a gap.
        const gap = Math.max(0, lim - c.s);
        const turning = c.turn !== 'S' && c.s > ARC0 - 12 && c.s < ARC0 + (c.turn === 'L' ? 5.5 : 16.5) + 2;
        c.v = gap < 0.3 ? 0 : Math.min(turning ? (c.turn === 'L' ? 5 : 7) : VMAX, Math.sqrt(2 * BRK * gap), c.v + ACC * dt);
        c.s = Math.min(c.s + c.v * dt, Math.max(lim, c.s));
        // Blind spot: a bike right behind a bus/truck is hidden from the signal camera (bus shadow)
        c.hidden = c.type === 'bike' && i > 0 && (L[i - 1].type === 'bus' || L[i - 1].type === 'truck') && c.s < STOP + 2 && L[i - 1].s - L[i - 1].len - c.s < 8;
        if (c.hidden && c.v < 1.5) hid++;
        if (c.v < 0.5 && c.s < EXIT) c.wait += dt;
        if (c.v < 1.5 && c.s < STOP + 2) q++;
      }
      this.qNow[d] = q; qTot += q; this.maxQ = Math.max(this.maxQ, q);
      while (L.length && L[0].s > END) { this.doneWait += L[0].wait; this.served++; this.turned[L[0].turn]++; L.shift(); }
    }
    this.hidNow = hid; this.qSum += qTot / 4; this.qN++; this.t += dt;
  }
  metrics() {
    let w = this.doneWait, n = this.served;
    for (const d of DIRS) for (const c of this.lanes[d]) { w += c.wait; n++; }
    const waiting = DIRS.reduce((a, d) => a + this.qNow[d], 0), cyc = cycleOf(this.plan) + 4 * (this.arCount ? this.holdTot / this.arCount : 0);
    return { avgWait: n ? w / n : 0, avgQueue: this.qN ? this.qSum / this.qN : 0, maxQueue: this.maxQ, served: this.served, waiting, hidden: this.hidNow, clearance: this.arCount ? this.holdTot / this.arCount : 0, turns: { ...this.turned },
      q: { ...this.qNow }, throughput: this.t > 0 ? this.served / (this.t / cyc) : 0, time: this.t };
  }
}

/** Headless simulation used as the GA fitness function (same engine as the 3D scene, fixed random seed). */
export function evaluate(demand, plan, { T = 600, dt = 0.5, seed = 7 } = {}) {
  const s = new Sim(demand, plan, seed);
  for (let i = 0; i < T / dt; i++) s.step(dt);
  const m = s.metrics();
  m.objective = m.avgWait + 0.05 * m.waiting;       // Average delay + 0.05 x remaining queue
  m.fitness = 1 / (1 + m.objective);
  return m;
}
