import { Plane } from "three";
import { RigidBody } from "./RigidBody";
import { Vec3 } from "./Vec3";

export class ContactSet {

    A: RigidBody;
    B: RigidBody;

    // plane: Plane;

    lambda: number = 0;     //  λ   - lambda
    lambda_n: number = 0;   //  λn  - lambda N (normal)
    lambda_t: number = 0;   //  λn  - lambda T (tangential)

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
     */
    d: number = 0.0;

    /**
     * Relative velocity
     */
    vrel = new Vec3(0.0, 0.0, 0.0);

    /**
     * Normal velocity
     */
    vn: number = 0;

    e: number = 0; // Coefficient of restitution

    staticFriction: number = 0;
    dynamicFriction: number = 0;

    F: Vec3 = new Vec3(0, 0, 0); // Current constraint force
    Fn: number = 0; // Current constraint force (normal direction) == -contact.lambda_n / (h * h);

    constructor(
        A: RigidBody, 
        B: RigidBody, 
        normal: Vec3,
        p1: Vec3,
        p2: Vec3,
        // r1: Vec3,
        // r2: Vec3,
    ) {
        if (A === B || A.id == B.id)
            throw new Error('Cannot create a ContactSet with the same body');

        this.A = A;
        this.B = B;
        
        this.p1 = p1;
        this.p2 = p2;
        this.r1 = this.A.worldToLocal(p1);
        this.r2 = this.B.worldToLocal(p2);

        this.n = normal.clone();

        /* (29) Set initial relative velocity */
        this.vrel = Vec3.sub(
            this.A.getVelocityAt(this.p1),
            this.B.getVelocityAt(this.p2)
        );
        this.vn = this.vrel.dot(this.n);

        this.e = 0.5 * (A.bounciness + B.bounciness);
        this.staticFriction = 0.5 * (A.staticFriction + B.staticFriction);
        this.dynamicFriction = 0.5 * (A.dynamicFriction + B.dynamicFriction);
    }

    public update(): void {
        // @TODO maybe recalculate N as well
        const A = this.A;
        const B = this.B;

        const p1 = A.pose.p.clone().add(this.r1.clone().applyQuaternion(A.pose.q));
        const p2 = B.pose.p.clone().add(this.r2.clone().applyQuaternion(B.pose.q));

        this.p1 = p1;
        this.p2 = p2;
    }
};
