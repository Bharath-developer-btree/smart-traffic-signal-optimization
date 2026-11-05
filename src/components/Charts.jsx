const ROWS = [['avgWait', 'Average Waiting Time (s)', 1], ['avgQueue', 'Average Queue Length (veh)', 1], ['maxQueue', 'Maximum Queue (veh)', 0], ['served', 'Vehicles Served', 0], ['throughput', 'Throughput (veh/cycle)', 1]];
export function BarCompare({ fixed, opt }) {
  if (!fixed || !opt) return <p className="muted">Run the Genetic Algorithm to compare Fixed-Time vs GA (values come from the same simulation, same traffic seed).</p>;
  return ROWS.map(([k, label, dp]) => {
    const mx = Math.max(fixed[k], opt[k], 1e-9);
    return (
      <div key={k} className="bars"><b>{label}</b>
        <div className="bar-row"><span>Fixed-Time</span><i style={{ width: `${(fixed[k] / mx) * 100}%`, background: '#64748b' }} /><em>{fixed[k].toFixed(dp)}</em></div>
        <div className="bar-row"><span>Genetic Algorithm</span><i style={{ width: `${(opt[k] / mx) * 100}%`, background: '#22d3ee' }} /><em>{opt[k].toFixed(dp)}</em></div>
      </div>
    );
  });
}
export function Convergence({ hist }) {
  const W = 520, H = 220, P = 34;
  if (!hist.length) return <p className="muted">The convergence curve appears while the GA runs.</p>;
  const n = Math.max(hist.length, 2), xs = (i) => P + (i / (n - 1)) * (W - 2 * P);
  const line = (key) => {
    const v = hist.map((h) => h[key]), lo = Math.min(...v), hi = Math.max(...v), r = hi - lo || 1;
    return v.map((y, i) => `${xs(i)},${H - P - ((y - lo) / r) * (H - 2 * P)}`).join(' ');
  };
  const last = hist[hist.length - 1];
  return (
    <>
      <svg viewBox={`0 0 ${W} ${H}`} className="chart">
        <line x1={P} y1={H - P} x2={W - P} y2={H - P} stroke="#475569" /><line x1={P} y1={P} x2={P} y2={H - P} stroke="#475569" />
        <polyline points={line('fit')} fill="none" stroke="#22d3ee" strokeWidth="2.5" />
        <polyline points={line('obj')} fill="none" stroke="#f97316" strokeWidth="2" strokeDasharray="5 3" />
        <text x={W / 2} y={H - 6} fill="#94a3b8" fontSize="11" textAnchor="middle">Generation (1 → {hist.length})</text>
        <text x="4" y="14" fill="#94a3b8" fontSize="11">Best fitness / objective (each scaled to its own range)</text>
      </svg>
      <p className="muted"><span style={{ color: '#22d3ee' }}>━ Best fitness</span> {last.fit.toFixed(4)} &nbsp; <span style={{ color: '#f97316' }}>┅ Best objective</span> {last.obj.toFixed(3)}</p>
    </>
  );
}
