# Smart Traffic Signal Optimization Using Genetic Algorithm

> **Simulation / Prototype.** This project does not control real traffic signals. All traffic values are simulated inputs.

## Project Overview
An interactive 3D web application (React + Vite + Three.js / React Three Fiber) that shows how a Genetic Algorithm (GA) optimizes the signal timing of a four-way intersection, and then drives the 3D vehicles with the optimized timing.

## Problem Statement
Fixed-time signals give every approach the same green time regardless of demand, which causes long queues on busy approaches.

## Objectives
Find the N/E/S/W green split that minimizes delay and queue length; compare it with a 30/30/30/30 s fixed-time baseline; make the whole process visible and explainable.

## Application Domain
Intelligent transportation systems, traffic signal control, evolutionary optimization.

## Genetic Algorithm
- **Chromosome:** `[N green, E green, S green, W green]`, e.g. `[45, 36, 28, 11]`. Constraints: sum = 120 s, each between 10 s and 60 s (the genome is repaired after every operator).
- **Population initialization:** random valid chromosomes (default size 30).
- **Fitness function:** each chromosome is run through the traffic simulation (600 simulated seconds). `Objective = Average Delay + 0.05 × Remaining Queue`; `Fitness = 1 / (1 + Objective)`. Lower objective = higher fitness = better.
- **Selection:** tournament selection (size 3).
- **Crossover:** blend crossover per gene, `child = P1 + u·(P2 − P1)`, `u ∈ [−0.25, 1.25]`, then the plan is repaired to sum to 120 s.
- **Mutation:** with probability = mutation rate (default 20 %), one random green is shifted by ±1…10 s.
- **Survivor selection:** (μ + λ): parents + children are merged, duplicates removed, the best N survive (elitism – the best solution is never lost).
- **Termination:** after the chosen number of generations (default 40).

## Traffic Simulation
`src/simulation/simulationEngine.js` is a lane-following model: Poisson-like arrivals per approach (`demand / 120` vehicles per second), a safe-distance rule, braking to a stop line on red (and on yellow when the vehicle can stop), and removal after crossing. **One approach at a time** (N → E → S → W). Each approach follows GREEN → YELLOW (exactly 3 s) → RED; the next approach turns green only after the red has been held for at least 1 s *and* the junction box is empty. Conflicting greens are impossible by construction. The **same engine** drives the 3D scene and the GA fitness evaluation (headless, fixed random seed, so fixed-time and GA plans are compared under identical arrivals).

## Baseline Comparison
Fixed-time = `[30, 30, 30, 30]`. After the GA finishes, both plans are simulated on the same demand and the bar charts/result card show the real calculated metrics. No improvement percentage is hard-coded.

## Performance Metrics
Average waiting time, average queue length, maximum queue, vehicles served, vehicles waiting, throughput (vehicles served per signal cycle), current phase and countdown.

## Technology Stack
React 18, Vite, Three.js, @react-three/fiber, @react-three/drei, plain CSS/SVG charts.

## Installation
```bash
npm install
```
## Execution
```bash
npm run dev      # open the printed http://localhost:5173
npm run build    # production build
```
## Screenshots
_Add screenshots here (`public/screens/…`)._
## Results
Run any scenario → *Run Genetic Algorithm*. The result card and *Performance Comparison* show fixed-time vs GA numbers computed from the simulation. Because arrivals are random, results vary with the seed; for a balanced demand the GA may find only a marginal gain.

## Limitations
Single intersection, straight movements only (no turns), one lane per direction, simple car-following model, GA fitness uses one fixed random seed (can slightly over-fit that arrival pattern).

## Future Scope
Real-time traffic camera input · real traffic datasets · SUMO integration · multiple intersections · pedestrian signals · emergency-vehicle priority · weather conditions · accident detection · reinforcement-learning comparison · IoT traffic sensors · cloud-based traffic monitoring.

## Team Members
| Name | Role |
|------|------|
| _Your name_ | _Role_ |

## Signal Timers, Right-Turn Guide and Bus Blind Spots
- Countdown timers are drawn above every 3D signal and in the *Signal Timers* panel (green/yellow: seconds left; red: seconds until it unlocks).
- Right-turn / biker advice is rule-based from the live signal state (turning paths are not simulated).
- Bikes are simulated; a bike right behind a bus/truck is flagged as hidden from a front camera. The monitor shows the true queue vs what a camera-only system would count, and lists mitigations (overhead camera, sensor fusion, bike box, etc.).

## Turning Movements and Safety
15 % of vehicles turn left and 15 % turn right along arc paths (left-hand traffic). Because only one approach is released at a time, **no oncoming or crossing traffic exists** while a vehicle turns, so left and right turners never wait for a gap and cannot collide with other approaches. After the 3 s yellow the signal shows red and is held until the junction box is completely empty (failsafe 20 s), so the next green never meets a vehicle still crossing; this extra clearance appears in the metrics and in the cycle used for throughput.

Verified headlessly over 8 runs of 30 simulated minutes (fixed and GA plans, balanced / rush / heavy / random demand): 0 red-light crossings and 0 moments with vehicles from two approaches inside the junction. Fixes made while testing: a car halted exactly on the stop line used to ignore the red, and a waiting car was wrongly treated as already inside the junction by the exit-lane merge rule (which could stall the box).
