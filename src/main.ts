import * as THREE from 'three'
import * as CANNON from 'cannon'

const fixedTimeStep = 1.0 / 60.0;
const maxSubSteps = 5;

const renderer = new THREE.WebGLRenderer({
  canvas: document.getElementById('canvas') as HTMLElement,
});
renderer.setPixelRatio( window.devicePixelRatio);
renderer.setSize( window.innerWidth, window.innerHeight);

const scene  = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth/window.innerHeight,0.1,1000);
camera.position.setZ(30);
 
const geometry = new THREE.TorusGeometry(10,3,16,100)
const material = new THREE.MeshBasicMaterial({color:0xFF6347, wireframe:true});
const torus = new THREE.Mesh(geometry, material);

scene.add(torus)

// CANNON.js
const world = new CANNON.World();
world.gravity.set(0, 0, -9.82);

const sphereBody = new CANNON.Body({
   mass: 5,
   position: new CANNON.Vec3(0, 0, 10),
   shape: new CANNON.Sphere(1.0),
   material: {
      name: 'mat1',
      id: 1,
      friction: 1,
      restitution: 1,
   }
});

const groundBody = new CANNON.Body({
    mass: 0,
    shape: new CANNON.Plane(),
    material: {
       name: 'mat2',
       id: 2,
       friction: 1,
       restitution: 0.5,
    }
});

world.addBody(sphereBody);
world.addBody(groundBody);

let lastTime = 0;
let time = 0;
function render(time: number) {
  requestAnimationFrame(render);

  const dt = (time - lastTime) / 1000;
  world.step(fixedTimeStep, dt, maxSubSteps);
  torus.position.z = sphereBody.position.z;
  
  lastTime = time;
  renderer.render(scene, camera);
};

render(time);

window.addEventListener('resize', onWindowResize, false)
function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight
    camera.updateProjectionMatrix()
    renderer.setSize(window.innerWidth, window.innerHeight)
}
