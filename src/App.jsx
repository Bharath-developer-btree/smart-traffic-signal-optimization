import { useEffect, useRef, useState } from 'react';
import TrafficIntersection from './components/TrafficIntersection';
import Dashboard from './components/Dashboard';
import SafetyPanel from './components/SafetyPanel';
import MetricsPanel from './components/MetricsPanel';
import GeneticAlgorithmPanel from './components/GeneticAlgorithmPanel';
import { BarCompare, Convergence } from './components/Charts';
import { Sim, evaluate } from './simulation/simulationEngine';
import { initPop, evalInd, nextGeneration } from './simulation/geneticAlgorithm';
import { FIXED, SCENARIOS, randomScenario, timersAt } from './simulation/trafficModel';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const EMPTY = { status: 'idle', gen: 0, pop: [], hist: [], event: null, stage: -1 };
const CAPTION = ['Traffic demand received', 'Initial population: random valid timing plans', 'Fitness evaluation: every plan is simulated', 'Tournament selection of parents', 'Crossover creates a child', 'Mutation adds variation', 'Survivor selection keeps the best (elitism)', 'Best solution found', 'Optimized timing applied', 'Vehicles move with the optimized timing'];

export default function App() {
  const [demand, setDemand] = useState({ N: 50, S: 40, E: 20, W: 15 });
  const [mode, setMode] = useState('baseline'), [best, setBest] = useState(null), [run, setRun] = useState(false), [speed, setSpeed] = useState(3);
  const [ga, setGa] = useState(EMPTY), [params, setParams] = useState({ popSize: 30, gens: 40, mut: 20 }), [logs, setLogs] = useState([]);
  const [result, setResult] = useState(null), [showResult, setShowResult] = useState(false), [view, setView] = useState({ t: '3d', n: 0 });
  const [heat, setHeat] = useState(true), [showHidden, setShowHidden] = useState(true), [live, setLive] = useState({ m: null, sig: null }), [demo, setDemo] = useState(false);
  const eng = useRef(new Sim(demand, FIXED, 42)), runRef = useRef(false), speedRef = useRef(3), pause = useRef(false), tok = useRef(0), demoTok = useRef(0);
  const plan = mode === 'optimized' && best ? best.g : FIXED;

  useEffect(() => { runRef.current = run; }, [run]);
  useEffect(() => { speedRef.current = speed; }, [speed]);
  useEffect(() => { eng.current.setDemand(demand); }, [demand]);
  useEffect(() => { eng.current.reset(eng.current.demand, plan); }, [plan.join(',')]); // new timing -> fresh traffic & metrics
  useEffect(() => { const id = setInterval(() => setLive({ m: eng.current.metrics(), sig: eng.current.sig, timers: timersAt(eng.current.sc, eng.current.plan) }), 300); return () => clearInterval(id); }, []);

  const log = (m) => setLogs((l) => [...l.slice(-160), `[${new Date().toLocaleTimeString([], { hour12: false })}] ${m}`]);
  const busy = ga.status === 'running' || ga.status === 'paused';

  const resetAll = () => {
    tok.current++; demoTok.current++; pause.current = false; setGa(EMPTY); setLogs([]); setResult(null); setShowResult(false); setBest(null); setMode('baseline'); setRun(false); setDemo(false);
    eng.current.reset(demand, FIXED);
  };
  const scenario = (k) => { const d = k === 'random' ? randomScenario() : SCENARIOS[k]; setDemand(d); eng.current.reset(d, plan); };
  const runFixed = () => { setMode('baseline'); eng.current.reset(demand, FIXED); setRun(true); log('Fixed-time simulation started (N/E/S/W 30 s each, one approach at a time)'); };
  const apply = () => { if (best) { setMode('optimized'); setRun(true); log(`Optimized signal timing applied: N ${best.g[0]}s / E ${best.g[1]}s / S ${best.g[2]}s / W ${best.g[3]}s`); } };

  const runGA = async ({ D = demand, delay = 120 } = {}) => {
    const my = ++tok.current, { popSize, gens, mut } = params, cache = new Map(), ev = (i) => evalInd(i, D, cache);
    pause.current = false; setResult(null); setShowResult(false); setLogs([]); setRun(true);
    log(`Traffic demand received N=${D.N} S=${D.S} E=${D.E} W=${D.W}`);
    let pop = initPop(popSize).map(ev).sort((a, b) => b.fitness - a.fitness);
    log('Initial population generated'); log('Fitness evaluated (traffic simulation per chromosome)');
    const hist = [{ fit: pop[0].fitness, obj: pop[0].objective }];
    setGa({ status: 'running', gen: 1, pop, hist: [...hist], event: null, stage: 2 });
    log(`Generation 1 completed — best [${pop[0].g.join(',')}] fitness ${pop[0].fitness.toFixed(4)}`);
    for (let g = 2; g <= gens; g++) {
      while (pause.current) { await sleep(100); if (tok.current !== my) return; }
      await sleep(delay); if (tok.current !== my) return;
      const r = nextGeneration(pop, { popSize, mutRate: mut / 100 }, ev); pop = r.pop;
      hist.push({ fit: pop[0].fitness, obj: pop[0].objective });
      for (const s of [3, 4, 5]) { setGa((p) => ({ ...p, event: r.event, stage: s })); await sleep(Math.min(delay / 2, 60)); if (tok.current !== my) return; }
      setGa((p) => ({ ...p, status: pause.current ? 'paused' : 'running', gen: g, pop, hist: [...hist], event: r.event, stage: 6 }));
      if (g === 2) ['Tournament selection completed', 'Crossover completed', 'Mutation completed'].forEach(log);
      log(`Generation ${g} completed — best [${pop[0].g.join(',')}] fitness ${pop[0].fitness.toFixed(4)}`);
    }
    const b = pop[0], fixed = evaluate(D, FIXED), opt = evaluate(D, b.g);
    log(`Best solution found: N ${b.g[0]}s / E ${b.g[1]}s / S ${b.g[2]}s / W ${b.g[3]}s`);
    setBest(b); setMode('optimized'); setResult({ fixed, opt, D, plan: b }); setShowResult(true);
    setGa((p) => ({ ...p, status: 'done', stage: 9 })); log('Optimized signal timing applied');
  };
  const pauseGA = () => { pause.current = true; setGa((p) => ({ ...p, status: 'paused' })); };
  const resumeGA = () => { pause.current = false; setGa((p) => ({ ...p, status: 'running' })); };

  const startDemo = async () => {
    resetAll(); const T = ++demoTok.current, D = SCENARIOS.nsRush;
    const w = async (ms) => { await sleep(ms); if (demoTok.current !== T) throw 0; };
    try {
      setDemo(true); setDemand(D); eng.current.reset(D, FIXED); setSpeed(4); await w(100);
      setDemoMsg('Step 1 · Traffic demand: North-South rush hour'); await w(15000);
      setDemoMsg('Step 2 · Fixed-time signal 30/30/30/30 — watch the north-south queues grow'); setRun(true); await w(45000);
      document.getElementById('ga')?.scrollIntoView({ behavior: 'smooth' });
      setDemoMsg('Step 3 · Genetic Algorithm running'); await runGA({ D, delay: 2500 });
      document.querySelector('.scene')?.scrollIntoView({ behavior: 'smooth' });
      setDemoMsg('Step 4 · Vehicles now move with the optimized timing'); await w(60000);
      document.getElementById('charts')?.scrollIntoView({ behavior: 'smooth' });
      setDemoMsg('Step 5 · Performance comparison: Fixed-Time vs Genetic Algorithm'); await w(40000);
      setShowResult(true); setDemoMsg('Final result'); await w(15000); setDemo(false);
    } catch { /* demo cancelled */ }
  };
  const [demoMsg, setDemoMsg] = useState('');
  const caption = demo && ga.status !== 'idle' && ga.status !== 'done' && ga.stage >= 0 ? `${demoMsg} — ${CAPTION[ga.stage]}` : demoMsg;
  const sig = live.sig;

  return (
    <div className="app">
      <header><h1>🚦 Smart Traffic Signal Optimization Using Genetic Algorithm</h1><span className="badge">Simulation / Prototype — not connected to real traffic signals</span></header>
      {demo && <div className="demo">🎬 {caption}<button onClick={resetAll}>Stop demo</button></div>}
      <main className="top">
        <aside className="card"><Dashboard {...{ demand, setDemand, onScenario: scenario, mode, setMode, best, run, setRun, onFixed: runFixed, onApply: apply, onReset: resetAll, onGA: () => runGA(), onDemo: startDemo, speed, setSpeed, live, busy }} /></aside>
        <section className="card scene">
          <div className="bar">
            <button onClick={() => setView({ t: 'top', n: view.n + 1 })}>Top View</button><button onClick={() => setView({ t: '3d', n: view.n + 1 })}>3D View</button>
            <button onClick={() => setView({ ...view, n: view.n + 1 })}>Reset Camera</button>
            <label><input type="checkbox" checked={heat} onChange={(e) => setHeat(e.target.checked)} /> Traffic heatmap</label>
            <label><input type="checkbox" checked={showHidden} onChange={(e) => setShowHidden(e.target.checked)} /> Bus blind-spot rings</label>
            <b className="live">{mode === 'optimized' ? 'Live Optimized Traffic' : 'Fixed-Time Traffic'}</b>
          </div>
          <div className="canvasWrap"><TrafficIntersection eng={eng} runRef={runRef} speedRef={speedRef} view={view} heat={heat} timers={live.timers} showHidden={showHidden} /></div>
          <div className="phase"><span>Current Phase: <b>{sig?.phase || '—'}</b></span>
            <span>{sig?.isGreen ? `Green remaining: ${Math.ceil(sig.remaining)} seconds` : sig?.active ? `Yellow: ${Math.ceil(sig.remaining)} s, then red` : 'All red: clearing the junction'}</span>
            <span>N {plan[0]} · E {plan[1]} · S {plan[2]} · W {plan[3]} s</span></div>
        </section>
        <aside className="card"><MetricsPanel live={live} mode={mode} plan={plan} heat={heat} /></aside>
      </main>
      <section className="card"><SafetyPanel live={live} plan={plan} /></section>
      <section id="ga" className="card"><GeneticAlgorithmPanel {...{ ga, params, setParams, onRun: () => runGA(), onPause: pauseGA, onResume: resumeGA, onReset: resetAll, logs }} /></section>
      <section id="charts" className="two">
        <div className="card"><h3>Performance Comparison</h3><BarCompare fixed={result?.fixed} opt={result?.opt} /></div>
        <div className="card"><h3>GA Convergence Graph</h3><Convergence hist={ga.hist} /></div>
      </section>
      <section className="two">
        <div className="card"><h3>Why Genetic Algorithm?</h3><p>«Traffic signal timing is an optimization problem because different traffic demands require different signal timings. A Genetic Algorithm searches multiple possible timing combinations and evolves better solutions using selection, crossover and mutation. The objective is to reduce estimated vehicle waiting time and congestion compared with a fixed-time signal.»</p></div>
        <div className="card"><h3>Academic note</h3><p>This is a <b>simulation / prototype</b>. It does not control real-world traffic signals. Traffic values are simulated inputs. Metrics come from a simple lane-following simulation; comparisons use the same random seed for fixed-time and GA plans.</p></div>
      </section>
      {showResult && result && (
        <div className="overlay" onClick={() => setShowResult(false)}><div className="result card" onClick={(e) => e.stopPropagation()}>
          <h2>GENETIC ALGORITHM OPTIMIZATION COMPLETE</h2>
          <div className="plans"><div>Fixed-Time<br /><b>N/E/S/W = 30 s each</b></div><div className="g">GA Optimized<br /><b>N {result.plan.g[0]} · E {result.plan.g[1]} · S {result.plan.g[2]} · W {result.plan.g[3]} s</b></div></div>
          <div className="kv"><span>Average Waiting Time</span><b>{result.opt.avgWait.toFixed(2)} s (fixed {result.fixed.avgWait.toFixed(2)} s)</b></div>
          <div className="kv"><span>Average Queue Length</span><b>{result.opt.avgQueue.toFixed(2)} veh (fixed {result.fixed.avgQueue.toFixed(2)})</b></div>
          <div className="kv"><span>Vehicles Served</span><b>{result.opt.served} (fixed {result.fixed.served})</b></div>
          <div className="kv"><span>Throughput</span><b>{result.opt.throughput.toFixed(1)} veh/cycle (fixed {result.fixed.throughput.toFixed(1)})</b></div>
          <BarCompare fixed={result.fixed} opt={result.opt} />
          <p className="muted">The Genetic Algorithm dynamically searches for a traffic signal timing plan that reduces the selected traffic objective under the simulated traffic conditions. (Simulation / Prototype)</p>
          <button className="pri" onClick={() => setShowResult(false)}>Continue to Live Optimized Traffic</button>
        </div></div>
      )}
    </div>
  );
}
