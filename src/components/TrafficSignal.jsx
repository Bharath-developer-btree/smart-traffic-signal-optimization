import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
const COL = { G: '#22c55e', Y: '#eab308', R: '#ef4444' };
export default function TrafficSignal({ pos, rotY, group, eng, t }) {
  const m = [useRef(null), useRef(null), useRef(null)];
  useFrame(() => {
    const s = eng.current.sig?.[group] || 'R', on = [s === 'R', s === 'Y', s === 'G'];
    m.forEach((r, i) => { if (r.current) r.current.emissiveIntensity = on[i] ? 3 : 0.05; });
  });
  const cols = ['#ff2222', '#ffc800', '#22ff55'];
  return (
    <group position={pos} rotation={[0, rotY, 0]} scale={1.6}>
      <mesh position={[0, 3, 0]}><cylinderGeometry args={[0.12, 0.12, 6]} /><meshStandardMaterial color="#4b5563" /></mesh>
      <mesh position={[0, 6.2, 0]}><boxGeometry args={[0.9, 2.4, 0.6]} /><meshStandardMaterial color="#111827" /></mesh>
      {t && <Html position={[0, 8.7, 0]} center distanceFactor={45} zIndexRange={[5, 0]}><div className="sigtimer" style={{ borderColor: COL[t.state], color: COL[t.state] }}>{t.sec}s</div></Html>}
      {cols.map((c, i) => (
        <mesh key={i} position={[0, 6.9 - i * 0.7, 0.35]}>
          <sphereGeometry args={[0.28, 12, 12]} />
          <meshStandardMaterial ref={m[i]} color={c} emissive={c} emissiveIntensity={0.05} />
        </mesh>
      ))}
    </group>
  );
}
