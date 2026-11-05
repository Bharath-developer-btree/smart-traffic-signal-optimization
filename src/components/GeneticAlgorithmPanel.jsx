import { useEffect, useRef, useState } from 'react';
const STAGES = [
  ['Traffic Demand', 'Simulated vehicle arrivals per approach (N, S, E, W). They define the problem the GA must solve.'],
  ['Initial Population', 'Random valid timing plans [N, E, S, W] green seconds. Sum = 120 s, each green between 10 and 60 s. Approaches go one at a time, each with 3 s yellow then red.'],
  ['Fitness Evaluation', 'Each plan is run through the traffic simulation. Objective = average delay + 0.05 × remaining queue. Fitness = 1 / (1 + Objective).'],
  ['Parent Selection', 'Tournament selection: 3 random plans compete, the fittest wins. Better solutions are more likely to become parents.'],
  ['Crossover', 'Two parents are blended: each child gene = P1 + u·(P2 − P1); the plan is then repaired so the four greens sum to 120 s.'],
  ['Mutation', 'With the mutation rate, one random green is shifted by ±1…10 s. It introduces variation and helps explore new solutions.'],
  ['New Population', '(μ+λ) survivor selection: parents + children are merged, duplicates removed and the best are kept (elitism).'],
  ['Best Solution', 'The highest-fitness chromosome of the final generation is the optimized timing plan.'],
  ['Optimized Signal Timing', 'The best [N, E, S, W] is applied to the 3D signals and compared with the 30/30/30/30 fixed-time baseline.'],
  ['Traffic Flow', 'Vehicles in the 3D scene now move according to the optimized signal timing.'],
];
const ch = (i) => (i ? `[${i.g.join(',')}]` : '—');
export default function GeneticAlgorithmPanel({ ga, params, setParams, onRun, onPause, onResume, onReset, logs }) {
  const [sel, setSel] = useState(null), box = useRef(null), running = ga.status === 'running', paused = ga.status === 'paused';
  useEffect(() => { if (box.current) box.current.scrollTop = box.current.scrollHeight; }, [logs]);
  const P = (k, v, lo, hi) => setParams({ ...params, [k]: Math.max(lo, Math.min(hi, Number(v) || lo)) });
  const best = ga.pop[0], ev = ga.event;
  return (
    <>
      <h3>Genetic Algorithm Optimization</h3>
      <div className="row">
        <label>Population Size<input type="number" disabled={running || paused} value={params.popSize} onChange={(e) => P('popSize', e.target.value, 4, 60)} /></label>
        <label>Generations<input type="number" disabled={running || paused} value={params.gens} onChange={(e) => P('gens', e.target.value, 2, 200)} /></label>
        <label>Mutation Rate (%)<input type="number" disabled={running || paused} value={params.mut} onChange={(e) => P('mut', e.target.value, 0, 100)} /></label>
        <button className="pri2" disabled={running || paused} onClick={onRun}>Start Optimization</button>
        <button disabled={!running} onClick={onPause}>Pause</button><button disabled={!paused} onClick={onResume}>Resume</button><button onClick={onReset}>Reset</button>
      </div>
      <div className="gen"><b>Generation {ga.gen || 0} / {params.gens}</b><div className="prog"><i style={{ width: `${((ga.gen || 0) / params.gens) * 100}%` }} /></div></div>
      <p className="note"><b>Fitness:</b> Objective = Average Delay + 0.05 × Remaining Queue &nbsp;→&nbsp; Fitness = 1 / (1 + Objective). <b>Lower delay = better solution. Higher fitness = better solution.</b></p>
      <div className="pipeline">{STAGES.map(([n], i) => <button key={n} className={(ga.stage === i ? 'act ' : '') + (sel === i ? 'sel' : '')} onClick={() => setSel(i)}>{i + 1}. {n}</button>)}</div>
      {sel !== null && <div className="note"><b>{STAGES[sel][0]}:</b> {STAGES[sel][1]}</div>}
      <div className="ga-grid">
        <div>
          <h4>Population (Generation {ga.gen || 0})</h4>
          <div className="tbl"><table><thead><tr><th>Chromosome</th><th>N</th><th>E</th><th>S</th><th>W</th><th>Objective</th><th>Fitness</th></tr></thead><tbody>
            {ga.pop.map((c, i) => <tr key={c.key} className={(i === 0 ? 'best ' : '') + (ev && (ev.p1.key === c.key || ev.p2.key === c.key) ? 'par' : '')}><td>{ch(c)}</td><td>{c.g[0]}</td><td>{c.g[1]}</td><td>{c.g[2]}</td><td>{c.g[3]}</td><td>{c.objective.toFixed(3)}</td><td>{c.fitness.toFixed(4)}</td></tr>)}
          </tbody></table>{!ga.pop.length && <p className="muted">No population yet. Click “Start Optimization”.</p>}</div>
          {best && <p className="note best-box">★ Best: {ch(best)} · fitness {best.fitness.toFixed(4)}</p>}
        </div>
        <div className="evs">
          <div className="ev"><h4>Selecting parents…</h4>{ev ? <>Parent 1 → <b>{ch(ev.p1)}</b><br />Parent 2 → <b>{ch(ev.p2)}</b><small>Better solutions have a higher chance of becoming parents.</small></> : '—'}</div>
          <div className="ev"><h4>Crossover</h4>{ev ? <>{ch(ev.p1)} + {ch(ev.p2)}<br />↓ Crossover<br />Child <b>{ch(ev.x)}</b></> : '—'}</div>
          <div className="ev"><h4>Mutation</h4>{ev?.mut ? <>Before {ch(ev.mut.before)} · {ev.mut.delta > 0 ? '+' : ''}{ev.mut.delta} s<br />After <b>{ch(ev.mut.after)}</b></> : ev ? 'No mutation in this sample.' : '—'}<small>Mutation introduces variation and helps the algorithm explore new solutions.</small></div>
          <div className="ev"><h4>Survivor selection</h4>Old population ↓ New children ↓ Fitness evaluation ↓ Best individuals (elitism) ↓ Next generation</div>
        </div>
        <div><h4>Live Algorithm Log</h4><div className="log" ref={box}>{logs.map((l, i) => <div key={i}>{l}</div>)}</div></div>
      </div>
    </>
  );
}
