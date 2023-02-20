# THREE.js feat. XPBD physics 🌈
Based on Extended Position Based Dynamics by [Matthias Müller](https://github.com/matthias-research). 

Refer to the [docs directory](./docs/) to view the papers and source code used in this project. 

Demo: https://eastingandnorthing.github.io/three/ 

![](videos/ezgif-5-2ca49911fb.gif)

## Development
`npm install` - Install dependencies

`npm run dev` - Runs the Vite.js dev server

`npm run build` - Build the project

## Features

### Core
- [x] XPBD update loop 
- [x] XPBD World / body manager
- [x] Rigid bodies
- [x] `applyForce()`
- [ ] `applyTorque()`

### Collision solver
- [x] Penetration (single body and plane)
- [x] Restitution
- [x] Friction
- [ ] (Convex) hull generation
- [ ] Broad phase (OBB / AABB / SAP)
- [x] Narrow phase (GJK / EPA)

### Constraints
- [x] Basic constraint
- [x] Mouse picking/dragging
- [x] Calculate constraint force
- [x] Damping
- [ ] Swing / twist limits
