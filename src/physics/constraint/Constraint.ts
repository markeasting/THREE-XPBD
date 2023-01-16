import { Pose } from "../Pose";
import { Quat } from "../Quaternion";
import { RigidBody } from "../RigidBody";
import { XPBDSolver } from "../solver/XPBDSolver";
import { Vec3 } from "../Vec3";
import { BaseConstraint } from "./BaseConstraint";

export class Constraint {

    public body0: RigidBody | null;
    public body1: RigidBody | null;

    public constraints: Array<BaseConstraint> = [];

    constructor(body0: RigidBody, body1: RigidBody) {
        if (body0.id == body1.id)
            throw new Error('Cannot create a constraint for the same body');

        this.body0 = body0;
        this.body1 = body1;
    }

    public add(constraint: BaseConstraint) {
        this.constraints.push(constraint);

        const p1 = constraint.localPose0 ?? new Vec3(0, 0, 0);
        const p2 = constraint.localPose1 ?? new Vec3(0, 0, 0);

        constraint.setBodies(
            this.body0, 
            this.body1,
            p2,
            p1,
        );
        return this;
    }

    public solvePos(h: number) {
        for (const c of this.constraints) {
            c.solvePos(h);
        }
    }

    public solveVel(h: number) {
        for (const c of this.constraints) {
            c.solveVel(h);
        }
    }

}