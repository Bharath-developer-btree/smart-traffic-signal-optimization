import { DIRS, NAMES, intensity, INT_COLOR } from '../simulation/trafficModel';
export default function Dashboard(p) {
  const { demand, setDemand, onScenario, mode, setMode, best, run, setRun, onFixed, onApply, onReset, onGA, onDemo, speed, setSpeed, live, busy } = p;
  const set = (d, v) => setDemand({ ...demand, [d]: Math.max(0, Math.min(100, Number(v) || 0)) });
  return (
    <>
      <h3>Traffic Demand</h3>
      {DIRS.map((d) => {
        const lv = intensity(demand[d]);
        return (
          <div className="dem" key={d}>
            <div className="kv"><span>{NAMES[d]} Traffic</span><input type="number" min="0" max="100" value={demand[d]} onChange={(e) => set(d, e.target.value)} /></div>
            <input type="range" min="0" max="100" value={demand[d]} onChange={(e) => set(d, e.target.value)} />
            <div className="kv"><span className="pill" style={{ background: INT_COLOR[lv] }}>{lv}</span><small>{live.m ? live.m.q[d] : 0} waiting</small></div>
          </div>
        );
      })}
      <small className="muted">Demand = vehicles per 120 s arriving at the approach (simulated input).</small>
      <h4>Scenarios</h4>
      <div className="btns">
        {[['balanced', 'Balanced Traffic'], ['nsRush', 'North-South Rush Hour'], ['ewRush', 'East-West Rush Hour'], ['heavy', 'Heavy Traffic'], ['random', 'Random Traffic']].map(([k, l]) => <button key={k} onClick={() => onScenario(k)}>{l}</button>)}
      </div>
      <h4>Signal Mode</h4>
      <div className="toggle">
        <button className={mode === 'baseline' ? 'on' : ''} onClick={() => setMode('baseline')}>Baseline Mode</button>
        <button className={mode === 'optimized' ? 'on' : ''} disabled={!best} onClick={() => setMode('optimized')}>Optimized Mode</button>
      </div>
      <h4>Controls</h4>
      <div className="btns">
        <button className="pri" onClick={() => setRun(!run)}>{run ? '⏸ Pause' : '▶ Start Simulation'}</button>
        <button onClick={onFixed}>Run Fixed-Time Simulation</button>
        <button className="pri2" onClick={onGA} disabled={busy}>🧬 Run Genetic Algorithm</button>
        <button onClick={onApply} disabled={!best}>🚦 Apply Optimized Timing</button>
        <button onClick={onReset}>⟳ Reset</button>
        <button className="demo-btn" onClick={onDemo}>🎬 Start Project Demo</button>
      </div>
      <label className="kv"><span>Sim speed ×{speed}</span><input type="range" min="1" max="8" value={speed} onChange={(e) => setSpeed(+e.target.value)} /></label>
    </>
  );
}
