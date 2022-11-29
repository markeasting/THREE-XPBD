import * as THREE from 'three'
import * as CANNON from 'cannon'
import { PerspectiveCamera } from 'three';
// import { OrbitControls } from '@three-ts/orbit-controls';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'

export abstract class BaseScene {

    active: boolean = true;
    
    scene:  THREE.Scene;
    camera: THREE.Camera;
    world:  CANNON.World;

    constructor(camera: THREE.Camera) {
        this.camera = camera;
        this.scene = new THREE.Scene();
        this.world = new CANNON.World();
        // this.world.gravity.set(0, 0, -9.82);

        new OrbitControls(camera, document.getElementById('canvas') as HTMLCanvasElement);
    }

    activate() {
        this.active = true;
    }

    deactivate() {
        this.active = false;
    }

    setActive(state: boolean) {
        this.active = state;
    }

    update(time: number, dt: number) {
        const fixedTimeStep = 1.0 / 60.0; // @TODO move to const
        const maxSubSteps = 5;
        this.world.step(fixedTimeStep, dt, maxSubSteps);
    }

    onResize() {
        const cam = this.camera as PerspectiveCamera;
        
        cam.aspect = window.innerWidth / window.innerHeight
        cam.updateProjectionMatrix()
    }

}