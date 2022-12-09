import * as THREE from 'three'
// import { OrbitControls } from '@three-ts/orbit-controls';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'

export interface SceneInterface {
    init(): void;
    update(time: number, dt: number): void;
}

export class BaseScene implements SceneInterface {

    active: boolean = true;
    
    scene:  THREE.Scene;
    camera: THREE.PerspectiveCamera;

    constructor() {
        this.camera = new THREE.PerspectiveCamera(75, 1, 0.1, 1000);
        this.scene  = new THREE.Scene();

        // @TODO get canvas element from somewhere
        new OrbitControls(this.camera, document.getElementById('canvas') as HTMLCanvasElement);
    }

    init() {}

    onActivate() {
        this.active = true;
    }

    onDeactivate() {
        this.active = false;
    }
    
    onResize(width: number, height: number) {
        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();
    }

    update(time: number, dt: number) {}

}