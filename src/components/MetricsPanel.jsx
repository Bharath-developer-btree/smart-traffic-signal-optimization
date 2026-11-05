import { DIRS, NAMES, INT_COLOR, qLevel } from '../simulation/trafficModel';
export default function MetricsPanel({ live, mode, plan, heat }) {
  const m = live.m || { avgWait: 0, avgQueue: 0, maxQueue: 0, served: 0, waiting: 0, throughput: 0, q: { N: 0, S: 0, E: 0, W: 0 }, time: 0 };
  const rows = [['Average Waiting Time', m.avgWait.toFixed(1) + ' s'], ['Average Queue Length', m.avgQueue.toFixed(1) + ' veh'], ['Maximum Queue', m.maxQueue + ' veh'],
    ['Vehicles Served', m.served], ['Vehicles Waiting', m.waiting], ['Throughput', m.throughput.toFixed(1) + ' veh/cycle'], ['Bikes hidden by buses', m.hidden || 0], ['Left / Right turns done', `${m.turns?.L || 0} / ${m.turns?.R || 0}`], ['Extra red for junction clearance', (m.clearance || 0).toFixed(1) + ' s'], ['Sim time', Math.round(m.time) + ' s']];
  return (
    <>
      <h3>Live Performance Metrics</h3>
      <div className="mode-tag">{mode === 'optimized' ? 'Live Optimized Traffic' : 'Fixed-Time Traffic'} · N {plan[0]} · E {plan[1]} · S {plan[2]} · W {plan[3]} s</div>
      {rows.map(([a, b]) => <div className="kv" key={a}><span>{a}</span><b>{b}</b></div>)}
      <div className="kv"><span>Current Signal Phase</span><b>{live.sig?.phase || '—'}</b></div>
      <h4>Vehicles waiting</h4>
      {DIRS.map((d) => <div className="kv" key={d}><span>{NAMES[d]}</span><b style={{ color: INT_COLOR[qLevel(m.q[d])] }}>{m.q[d]} waiting</b></div>)}
      <h4>Traffic Density {heat ? '(heatmap on)' : ''}</h4>
      <div className="legend">{Object.entries(INT_COLOR).map(([k, c]) => <span key={k}><i style={{ background: c }} />{k}</span>)}</div>
    </>
  );
}
