import { RigidBody } from "./RigidBody";
import { Vec3 } from "./Vec3";
import { XPBDSolver } from "./XPBDSolver";

export class World {

    public gravity = new Vec3(0, 0, -9.81);

    public bodies: Array<RigidBody> = [];

    private solver = new XPBDSolver();

    constructor() {

    }

    public add(body: RigidBody) {
        this.bodies.push(body);
    }

    public update(dt: number): void {
        this.solver.update(this.bodies, dt, this.gravity);
    }

}
