import * as THREE from 'three'
import { RigidBody } from "./RigidBody";
import { Vec3 } from "./Vec3";
import { XPBDSolver } from "./XPBDSolver";

export class World {

    public gravity = new Vec3(0, -9.81, 0);

    public bodies: Array<RigidBody> = [];

    /**
     * Debug scene
     */
    public scene = new THREE.Scene();

    private solver: XPBDSolver;

    constructor() {
        this.solver = new XPBDSolver(this.scene);
    }

    public add(body: RigidBody) {
        this.bodies.push(body);
    }

    public update(dt: number): void {
        this.solver.update(this.bodies, dt, this.gravity);
    }

}
