import { DIRS, NAMES } from '../simulation/trafficModel';
const COL = { G: '#22c55e', Y: '#eab308', R: '#ef4444' };
const label = { G: 'GREEN – ends in', Y: 'YELLOW (3 s) – red in', R: 'RED – unlocks (green) in' };
const RIGHT = {
  G: 'Left and right turners: only this approach is moving, so turn straight away. No oncoming or crossing traffic is released, so nobody has to wait for a gap.',
  Y: 'Turners: do not enter. Only vehicles already inside the junction clear it.',
  R: 'Turners: stop behind the line and wait for the countdown to reach 0. Every other approach is red or being cleared before you get green.',
};
const BIKE = {
  G: 'Bikers: stay 1 bus-length behind or ahead of buses/trucks, never in their side blind spot.',
  Y: 'Bikers: do not sneak past buses to beat the yellow.',
  R: 'Bikers: wait in the bike area on the left, in front of or behind the bus where the driver can see you.',
};
export default function SafetyPanel({ live, plan }) {
  const m = live.m, T = live.timers;
  const hidden = m?.hidden || 0, actual = m?.waiting || 0;
  return (
    <>
      <h3>Signal Timers, Right-Turn Guide &amp; Bus Blind-Spot Monitor</h3>
      <div className="turn-grid">
        {DIRS.map((d) => {
          const t = T?.[d];
          return (
            <div className="turn" key={d} style={{ borderColor: t ? COL[t.state] : '#22304d' }}>
              <h4>{NAMES[d]} approach</h4>
              {t ? <><div className="big" style={{ color: COL[t.state] }}>{t.sec}s</div><div>{label[t.state]}</div>
                <p><b>↰↱ Left / right turn:</b> {RIGHT[t.state]}</p><p><b>🏍 Bike:</b> {BIKE[t.state]}</p></> : '—'}
              <small>{m ? `${m.q[d]} waiting` : ''}</small>
            </div>
          );
        })}
      </div>
      <p className="note">Plan in use: N {plan[0]} s · E {plan[1]} s · S {plan[2]} s · W {plan[3]} s. Only ONE approach is green at a time (N → E → S → W), so straight, left and right movements never conflict. Each green is followed by 3 s yellow and then red; the red is held (at least 1 s) until the junction box is completely empty, then the next approach turns green. 15% of vehicles turn left and 15% turn right.</p>
      <div className="ga-grid">
        <div className="ev"><h4>Blind-spot monitor (bikes behind buses/trucks)</h4>
          <div className="kv"><span>Actual vehicles waiting</span><b>{actual}</b></div>
          <div className="kv"><span>Bikes hidden in a bus shadow</span><b style={{ color: '#22d3ee' }}>{hidden}</b></div>
          <div className="kv"><span>Counted by a front camera only</span><b>{Math.max(0, actual - hidden)}</b></div>
          <div className="kv"><span>Corrected with sensor / overhead fusion</span><b>{actual}</b></div>
          <small>Cyan rings in the 3D scene mark hidden bikes. A camera-only system would under-count the queue by this amount.</small></div>
        <div className="ev" style={{ gridColumn: 'span 2' }}><h4>What can be done about the blind spot</h4>
          <ol>
            <li>Use a high / overhead camera (try <b>Top View</b>: buses no longer hide bikes).</li>
            <li>Fuse a second camera from the opposite or side direction.</li>
            <li>Add loop or radar sensors at the stop line; add their count to the camera count (corrected queue above).</li>
            <li>Do not end green early while a bus or truck is at the front of the queue; keep the minimum green and clearance.</li>
            <li>Marked bike waiting area (bike box) and a set-back stop line for buses and trucks.</li>
            <li>Riders: never ride beside a bus; stay visible in the driver's mirrors.</li>
          </ol></div>
      </div>
    </>
  );
}
