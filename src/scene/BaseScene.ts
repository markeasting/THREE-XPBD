import * as THREE from 'three'
import * as CANNON from 'cannon'
// import { OrbitControls } from '@three-ts/orbit-controls';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'

export interface SceneInterface {
    onActivate(): void;
    onDeactivate(): void;
    init(): void;
    update(time: number, dt: number): void;
}

export class BaseScene implements SceneInterface {

    public active: boolean = true;
    
    public scene:  THREE.Scene;
    public camera: THREE.PerspectiveCamera;

    protected meshes: Array<THREE.Mesh> = [];
    protected bodies: Array<CANNON.Body> = [];

    protected world = new CANNON.World();
    protected world_timeSinceLastCalled = 0;

    constructor() {
        this.scene  = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(75, 1, 0.1, 5000);

        // @TODO get canvas element from somewhere
        new OrbitControls(this.camera, document.getElementById('canvas') as HTMLCanvasElement);

        // World
        this.world.broadphase = new CANNON.SAPBroadphase(this.world);
        this.world.defaultContactMaterial.friction = 0;

        // Align THREE and CANNON axes (z up)
        THREE.Object3D.DefaultUp.set( 0, 0, 1 );
        this.camera.up.set( 0, 0, 1 );
        this.world.gravity.set(0, 0, -0.1);
    }

    protected insert(otherScene: BaseScene) {
        this.scene.add(otherScene.scene);
    }
    
    public onResize(width: number, height: number) {
        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();
    }

    public onActivate() {}
    public onDeactivate() {}

    public init() {}
    public update(time: number, dt: number) {}

    public updatePhysics(time: number, dt: number) {
        // const t = (Date.now() / 1000);

        this.world.step(dt, this.world_timeSinceLastCalled);

        this.world_timeSinceLastCalled = time - this.world_timeSinceLastCalled;

    }

}