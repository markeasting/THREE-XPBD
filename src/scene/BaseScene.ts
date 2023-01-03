import * as THREE from 'three'
// import { OrbitControls } from '@three-ts/orbit-controls';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
import { RigidBody } from '../physics/RigidBody';
import { World } from '../physics/World';

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

    public world = new World();

    constructor() {
        this.scene  = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(75, 1, 0.1, 5000);

        // @TODO get canvas element from somewhere
        new OrbitControls(this.camera, document.getElementById('canvas') as HTMLCanvasElement);

        // World
        // this.world.broadphase = new CANNON.SAPBroadphase(this.world);
        // this.world.defaultContactMaterial.friction = 0;

        // y-up -> z up
        // THREE.Object3D.DefaultUp.set( 0, 0, 1 );
        // this.camera.up.set( 0, 0, 1 );
        this.world.gravity.set(0, -0.1, 0);
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
        this.world.update(dt);
    }

    public addBody(body: RigidBody) {
        this.scene.add(body.mesh);
        this.world.add(body);
    }

}