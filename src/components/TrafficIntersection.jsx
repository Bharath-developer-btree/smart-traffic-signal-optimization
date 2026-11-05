import { useEffect, useMemo, useRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import TrafficSignal from './TrafficSignal';
import VehicleLayer from './Vehicle';
import { DIRS, qLevel, INT_COLOR } from '../simulation/trafficModel';

const Box = ({ p, s, c, e }) => <mesh position={p}><boxGeometry args={s} /><meshStandardMaterial color={c} emissive={e || '#000'} /></mesh>;
const hash = (n) => { const x = Math.sin(n * 127.1) * 43758.5453; return x - Math.floor(x); };

function Environment() {
  const items = useMemo(() => {
    const b = [], t = [];
    [[1, 1], [1, -1], [-1, 1], [-1, -1]].forEach(([sx, sz], q) => {
      for (let i = 0; i < 7; i++) {
        const k = q * 20 + i, w = 8 + hash(k) * 10, d = 8 + hash(k + 3) * 10, h = 8 + hash(k + 7) * 24;
        b.push({ p: [sx * (20 + hash(k + 1) * 60), h / 2, sz * (20 + hash(k + 2) * 60)], s: [w, h, d], c: ['#334155', '#475569', '#3b4a63', '#52525b'][k % 4] });
      }
      for (let i = 0; i < 6; i++) t.push([sx * (14 + hash(q * 9 + i) * 80), sz * (14 + hash(q * 9 + i + 50) * 80)]);
    });
    return { b, t };
  }, []);
  const lamps = [[9, 30], [-9, -30], [9, -60], [-9, 60], [30, -9], [-30, 9], [60, 9], [-60, -9]];
  return (
    <>
      {items.b.map((o, i) => <Box key={i} p={o.p} s={o.s} c={o.c} e="#0b1220" />)}
      {items.t.map(([x, z], i) => (
        <group key={i} position={[x, 0, z]}>
          <mesh position={[0, 1, 0]}><cylinderGeometry args={[0.3, 0.4, 2]} /><meshStandardMaterial color="#7c4a21" /></mesh>
          <mesh position={[0, 4, 0]}><coneGeometry args={[2, 5, 8]} /><meshStandardMaterial color="#15803d" /></mesh>
        </group>
      ))}
      {lamps.map(([x, z], i) => (
        <group key={i} position={[x, 0, z]}>
          <mesh position={[0, 3.5, 0]}><cylinderGeometry args={[0.1, 0.12, 7]} /><meshStandardMaterial color="#6b7280" /></mesh>
          <mesh position={[0, 7, 0]}><sphereGeometry args={[0.4, 8, 8]} /><meshStandardMaterial color="#fde68a" emissive="#fde68a" emissiveIntensity={1.5} /></mesh>
        </group>
      ))}
      {[[12, -22, 0], [-12, 22, Math.PI], [22, 12, 1.57], [-22, -12, -1.57]].map(([x, z, r], i) => (
        <group key={i} position={[x, 0, z]} rotation={[0, r, 0]}>
          <mesh position={[0, 1.5, 0]}><cylinderGeometry args={[0.07, 0.07, 3]} /><meshStandardMaterial color="#9ca3af" /></mesh>
          <mesh position={[0, 3.2, 0]}><boxGeometry args={[1.4, 1.4, 0.1]} /><meshStandardMaterial color="#2563eb" /></mesh>
        </group>
      ))}
    </>
  );
}

function Roads() {
  const zebra = [], dash = [];
  for (let x = -6; x <= 6; x += 1.6) zebra.push(x);
  for (let d = 12; d < 110; d += 6) dash.push(d);
  return (
    <>
      <Box p={[0, -0.05, 0]} s={[500, 0.1, 500]} c="#14532d" />
      <Box p={[0, 0, 0]} s={[14, 0.1, 230]} c="#27272a" />
      <Box p={[0, 0, 0]} s={[230, 0.1, 14]} c="#27272a" />
      {[[1, 1], [1, -1], [-1, 1], [-1, -1]].map(([sx, sz], i) => <Box key={i} p={[sx * 62, 0.1, sz * 62]} s={[110, 0.2, 110]} c="#64748b" />)}
      {dash.map((d) => [[1, 0], [-1, 0], [0, 1], [0, -1]].map(([x, z], i) => (
        <Box key={d + '-' + i} p={[x * d, 0.07, z * d]} s={x ? [3, 0.02, 0.3] : [0.3, 0.02, 3]} c="#facc15" />
      )))}
      {zebra.map((x) => [-8.5, 8.5].map((z) => <Box key={x + '' + z} p={[x, 0.07, z]} s={[0.7, 0.02, 2.5]} c="#f1f5f9" />))}
      {zebra.map((z) => [-8.5, 8.5].map((x) => <Box key={'e' + z + x} p={[x, 0.07, z]} s={[2.5, 0.02, 0.7]} c="#f1f5f9" />))}
      <Box p={[3.5, 0.08, -10.2]} s={[7, 0.02, 0.4]} c="#fff" /><Box p={[-3.5, 0.08, 10.2]} s={[7, 0.02, 0.4]} c="#fff" />
      <Box p={[10.2, 0.08, 3.5]} s={[0.4, 0.02, 7]} c="#fff" /><Box p={[-10.2, 0.08, -3.5]} s={[0.4, 0.02, 7]} c="#fff" />
      <Box p={[7, 0.08, 0]} s={[0.15, 0.02, 230]} c="#e5e7eb" /><Box p={[-7, 0.08, 0]} s={[0.15, 0.02, 230]} c="#e5e7eb" />
      <Box p={[0, 0.08, 7]} s={[230, 0.02, 0.15]} c="#e5e7eb" /><Box p={[0, 0.08, -7]} s={[230, 0.02, 0.15]} c="#e5e7eb" />
      <Box p={[0, 0.09, 0]} s={[13.8, 0.02, 13.8]} c="#27272a" />
    </>
  );
}

const HEAT = { N: [3.5, -45, 6.5, 70], S: [-3.5, 45, 6.5, 70], E: [45, 3.5, 70, 6.5], W: [-45, -3.5, 70, 6.5] };
function Heat({ eng, show }) {
  const r = useRef({});
  useFrame(() => DIRS.forEach((d) => { const m = r.current[d]; if (m) { m.color.set(INT_COLOR[qLevel(eng.current.qNow[d])]); m.opacity = show ? 0.5 : 0; } }));
  return DIRS.map((d) => {
    const [x, z, w, l] = HEAT[d];
    return <mesh key={d} position={[x, 0.2, z]} rotation={[-Math.PI / 2, 0, 0]} renderOrder={2}><planeGeometry args={[w, l]} /><meshBasicMaterial ref={(m) => (r.current[d] = m)} transparent depthWrite={false} /></mesh>;
  });
}

function Runner({ eng, runRef, speedRef }) {
  const acc = useRef(0);
  useFrame((_, dt) => {
    if (!runRef.current) return;
    acc.current += Math.min(dt, 0.1) * speedRef.current;
    let n = 0;
    while (acc.current >= 0.05 && n++ < 40) { eng.current.step(0.05); acc.current -= 0.05; }
    if (n >= 40) acc.current = 0;
  });
  return null;
}
function Rig({ view }) {
  const { camera, controls } = useThree();
  useEffect(() => {
    const p = view.t === 'top' ? [0, 190, 0.01] : [0, 85, 105];
    camera.position.set(...p); camera.lookAt(0, 0, 0);
    if (controls) { controls.target.set(0, 0, 0); controls.update(); }
  }, [view.n, view.t, camera, controls]);
  return null;
}

export default function TrafficIntersection({ eng, runRef, speedRef, view, heat, timers, showHidden }) {
  return (
    <Canvas camera={{ position: [0, 85, 105], fov: 50, far: 2000 }} dpr={[1, 1.5]}>
      <color attach="background" args={['#0b1220']} />
      <ambientLight intensity={0.7} /><directionalLight position={[60, 120, 40]} intensity={1.3} />
      <Roads /><Environment /><Heat eng={eng} show={heat} />
      <TrafficSignal pos={[8, 0, -11]} rotY={Math.PI} group="N" eng={eng} t={timers?.N} />
      <TrafficSignal pos={[-8, 0, 11]} rotY={0} group="S" eng={eng} t={timers?.S} />
      <TrafficSignal pos={[11, 0, 8]} rotY={Math.PI / 2} group="E" eng={eng} t={timers?.E} />
      <TrafficSignal pos={[-11, 0, -8]} rotY={-Math.PI / 2} group="W" eng={eng} t={timers?.W} />
      <VehicleLayer eng={eng} showHidden={showHidden} /><Runner eng={eng} runRef={runRef} speedRef={speedRef} />
      <OrbitControls makeDefault maxPolarAngle={Math.PI / 2.05} /><Rig view={view} />
    </Canvas>
  );
}
