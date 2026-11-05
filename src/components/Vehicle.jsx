import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { DIRS } from '../simulation/trafficModel';
import { pose } from '../simulation/simulationEngine';
const N = 160; // pooled meshes: no allocation per frame
const H = { car: 0.8, bus: 2.4, truck: 1.6, bike: 0.6 };
export default function VehicleLayer({ eng, showHidden }) {
  const g = useRef([]), b = useRef([]), c = useRef([]), rg = useRef([]), ind = useRef([]), mat = useRef([]), id = useRef([]), sh = useRef(showHidden);
  sh.current = showHidden;
  useFrame(() => {
    let i = 0; const blink = Math.floor(performance.now() / 350) % 2 === 0;
    for (const d of DIRS) for (const v of eng.current.lanes[d]) {
      if (i >= N) break;
      const p = pose(d, v.turn, v.s - v.len / 2, v.lat || 0), grp = g.current[i], body = b.current[i], cab = c.current[i], hb = H[v.type];
      grp.visible = true; grp.rotation.y = p.rot; grp.position.set(p.x, 0, p.z);
      rg.current[i].visible = !!v.hidden && sh.current; // cyan ring = bike hidden in a bus shadow
      const im = ind.current[i];
      im.visible = v.turn !== 'S' && v.s < 105 && blink; // blinking turn indicator
      im.position.set(v.turn === 'L' ? v.w / 2 : -v.w / 2, 0.35 + hb + 0.1, v.len / 2 - 0.2);
      if (id.current[i] !== v.id) {
        id.current[i] = v.id; mat.current[i].color.set(v.color);
        body.scale.set(v.w, hb, v.len); body.position.y = 0.35 + hb / 2;
        cab.visible = v.type !== 'bus';
        if (v.type === 'car') { cab.scale.set(v.w * 0.88, 0.7, v.len * 0.5); cab.position.set(0, 0.35 + hb + 0.35, -v.len * 0.08); }
        if (v.type === 'truck') { cab.scale.set(v.w * 0.95, 2.1, 2); cab.position.set(0, 0.35 + 1.05, v.len / 2 - 1); }
        if (v.type === 'bike') { cab.scale.set(0.5, 0.9, 0.5); cab.position.set(0, 0.35 + hb + 0.45, 0); }
      }
      i++;
    }
    for (; i < N; i++) if (g.current[i]) { g.current[i].visible = false; id.current[i] = -1; }
  });
  return Array.from({ length: N }, (_, i) => (
    <group key={i} ref={(r) => (g.current[i] = r)} visible={false}>
      <mesh ref={(r) => (b.current[i] = r)}><boxGeometry args={[1, 1, 1]} /><meshStandardMaterial ref={(r) => (mat.current[i] = r)} /></mesh>
      <mesh ref={(r) => (c.current[i] = r)}><boxGeometry args={[1, 1, 1]} /><meshStandardMaterial color="#9fb4c7" /></mesh>
      <mesh ref={(r) => (ind.current[i] = r)} visible={false}><boxGeometry args={[0.5, 0.35, 0.5]} /><meshBasicMaterial color="#ff9d00" /></mesh>
      <mesh ref={(r) => (rg.current[i] = r)} position={[0, 0.25, 0]} rotation={[-Math.PI / 2, 0, 0]} visible={false}><ringGeometry args={[1.2, 1.6, 24]} /><meshBasicMaterial color="#22d3ee" side={2} /></mesh>
    </group>
  ));
}
