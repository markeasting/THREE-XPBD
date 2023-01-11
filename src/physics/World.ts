import * as THREE from 'three'
import { RigidBody } from "./RigidBody";
import { Vec3 } from "./Vec3";
import { XPBDSolver } from "./solver/XPBDSolver";
import { Constraint } from './constraint/Constraint';
import { Joint, JointType } from './constraint/Joint';

export class World {

    public gravity = new Vec3(0, -9.81, 0);

    #bodies: Array<RigidBody> = [];
    #constraints: Array<Constraint> = [];

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

    public addConstraint(body0: RigidBody, body1: RigidBody) {
        this.#constraints.push(new Joint(JointType.FIXED, body0, body1))
    }

    public update(dt: number): void {
        this.solver.update(this.#bodies, this.#constraints, dt, this.gravity);
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
