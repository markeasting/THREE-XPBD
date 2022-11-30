import * as THREE from 'three'
import * as CANNON from 'cannon'
// import { OrbitControls } from '@three-ts/orbit-controls';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'

export interface SceneInterface {
    init(): void;
    updatePhysics(time: number, dt: number): void;
    update(time: number, dt: number): void;
}

export class BaseScene implements SceneInterface {

    active: boolean = true;
    
    scene:  THREE.Scene;
    camera: THREE.PerspectiveCamera;
    world?: CANNON.World;

    constructor() {
        this.camera = new THREE.PerspectiveCamera(75, 1, 0.1, 1000);
        this.scene  = new THREE.Scene();

        // @TODO get canvas element from somewhere
        new OrbitControls(this.camera, document.getElementById('canvas') as HTMLCanvasElement);
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
    
    onResize(width: number, height: number) {
        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();
    }

    updatePhysics(time: number, dt: number) {
        const fixedTimeStep = 1.0 / 60.0; // @TODO move to const
        const maxSubSteps = 5; // @TODO move to const
        this.world?.step(fixedTimeStep, dt, maxSubSteps);
    }

    init() {}

    update(time: number, dt: number) {}

}