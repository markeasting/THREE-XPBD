import { RigidBody } from "./RigidBody";
import { Vec3 } from "./Vec3";

export class ContactSet {
    A: RigidBody;
    B: RigidBody;

    /**
     * Contact point / position (world)
     */
    p = new Vec3(0.0, 0.0, 0.0);

    /**
     * Contact point / position (local)
     */
    pLocal = new Vec3(0.0, 0.0, 0.0);

    /**
     * Contact normal
     */
    n = new Vec3(0.0, 0.0, 0.0);

    /**
     * Penetration depth
     * 
     * Recalculated each position solve!
     */
    d: number = 0.0;

    /**
     * Relative velocity
     * 
     * Recalculated each velocity solve!
     */
    vrel = new Vec3(0.0, 0.0, 0.0);

    /**
     * Normal velocity
     * 
     * Recalculated each velocity solve!
     */
    vn: number = 0;

    /**
     *  Coefficient of restitution
     */
    e: number = 0;

    friction: number = 0;

    lambdaN: number = 0;

    constructor(A: RigidBody, B: RigidBody) {
        this.A = A;
        this.B = B;
    }
};
