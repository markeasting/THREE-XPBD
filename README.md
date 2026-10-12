# THREE.js feat. XPBD physics 🌈
Based on Extended Position Based Dynamics by [Matthias Müller](https://github.com/matthias-research). 

Refer to the [docs directory](./docs/) to view the papers and source code used in this project. 

Demo: https://markeasting.github.io/three/ 

![](videos/ezgif-3-06fe46f4ea.gif)

![](videos/ezgif-1-0367741c60.gif)

[<img height="40" src="https://storage.ko-fi.com/cdn/brandasset/v2/support_me_on_kofi_red.png">](https://ko-fi.com/markeasting)

## Development
`npm install` - Install dependencies

`npm run dev` - Runs the local dev server

`npm run build` - Build the project

## Features

### Core
- [x] XPBD update loop 
- [x] XPBD World / body manager
- [x] Rigid bodies
- [x] Body 'sleep' feature
- [x] `applyForce()`
- [ ] `applyTorque()`

### Collision solver
- [x] Penetration
- [x] Surface properties: friction & restitution
- [x] Broad phase (AABB)
- [x] Narrow phase (GJK / EPA)
- [x] Convex hull generation
- [x] Contact manifold generation / clipping algorithm
- [ ] Broad phase (sorting algorithm)
- [ ] Broad phase (spatial subdivision / octree)
- [ ] Narrow phase (optimized primitives: spheres, capsules)
- [ ] Object pool for Vec3 instances

### Constraints
- [x] Basic constraint
- [x] Mouse picking/dragging
- [x] Calculate constraint force
- [x] Damping
- [ ] Swing / twist limits
