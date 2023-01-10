import * as THREE from 'three'
import { RigidBody } from "./RigidBody";
import { Vec3 } from "./Vec3";
import { XPBDSolver } from "./solver/XPBDSolver";

export class World {

    public gravity = new Vec3(0, -9.81, 0);

    #bodies: Array<RigidBody> = [];

    public get bodies() {
        return this.#bodies;
    }

    /**
     * Debug scene
     */
    public scene = new THREE.Scene();

    private solver: XPBDSolver;

    constructor() {
        this.solver = new XPBDSolver(this.scene);
    }

    public add(body: RigidBody) {
        const len = this.bodies.push(body);
        body.id = len;
    }

    public update(dt: number): void {
        this.solver.update(this.bodies, dt, this.gravity);
    }

    public draw(renderer: THREE.WebGLRenderer, camera: THREE.Camera) {
        renderer.autoClear = false;
        renderer.render(
            this.scene,
            camera
        );
        renderer.autoClear = true;
    }

}
