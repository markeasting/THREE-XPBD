import { RigidBody } from "./RigidBody";

export class CollisionPair {
    constructor(
        public A: RigidBody,
        public B: RigidBody,
        // public e: number = 1.0,
        // public friction: number = 0.0
    ) {
        if (A === B || A.id == B.id)
            throw new Error('Cannot create a CollisionPair with the same body');
    }
};
