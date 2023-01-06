import { Plane } from "three";
import { RigidBody } from "./RigidBody";
import { Vec3 } from "./Vec3";

export class ContactSet {
    
    A: RigidBody;
    B: RigidBody;

    plane: Plane;

    // dlambda: number = 0;    // Δλ   - delta lambda (current iteration)
    lambda: number = 0;     //  λ   - lambda
    lambda_n: number = 0;   //  λn  - lambda N (normal)
    lambda_t: number = 0;   //  λn  - lambda T (tangential)

    // /**
    //  * Contact point (world, global)
    //  */
    // p = new Vec3(0.0, 0.0, 0.0);

    /**
     * Contact point (world, on A)
     */
    p1 = new Vec3(0.0, 0.0, 0.0);

    /**
     * Contact point (world, on B)
     */
    p2 = new Vec3(0.0, 0.0, 0.0);

    /**
     * Contact point (local on A)
     */
    r1 = new Vec3(0.0, 0.0, 0.0);

    /**
     * Contact point (local on B)
     */
    r2 = new Vec3(0.0, 0.0, 0.0);

    /**
     * Contact normal
     */
    n = new Vec3(0.0, 0.0, 0.0);

    /**
     * Penetration depth
     * 
     * Set to the initial depth on instantiation. 
     * 
     * Recalculated each position solve!
     */
    d: number = 0.0;

    v: Vec3 = new Vec3(0.0, 0.0, 0.0);        // relative velocity
    // vprev: Vec3 = new Vec3(0.0, 0.0, 0.0);    // relative velocity (previous)

    // /**
    //  * Relative velocity
    //  * 
    //  * Recalculated each velocity solve!
    //  */
    // vrel = new Vec3(0.0, 0.0, 0.0);

    // /**
    //  * Normal velocity
    //  * 
    //  * Recalculated each velocity solve!
    //  */
    // vn: number = 0;

    e: number = 0; // Coefficient of restitution

    friction: number = 0;

    F: Vec3 = new Vec3(0, 0, 0); // Current constraint force
    Fn: number = 0; // Current constraint force (normal direction) == -contact.lambda_n / (h * h);

    constructor(A: RigidBody, B: RigidBody, contactPlane: Plane) {
        this.A = A;
        this.B = B;

        this.plane = contactPlane;
    }
};
