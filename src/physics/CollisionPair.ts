import { RigidBody } from "./RigidBody";
import { Vec3 } from "./Vec3";

export class CollisionPair {
    constructor(
        public A: RigidBody,
        public B: RigidBody
    ) {
        if (A === B || A.id == B.id)
            throw new Error('Cannot create a CollisionPair with the same body');

        /* Wake sleeping bodies if a collision could occur */
        const vrel = Vec3.sub(A.vel, B.vel).lengthSq();
        if (vrel > 0.01) {
            A.wake();
            B.wake();
        }
    }
};
