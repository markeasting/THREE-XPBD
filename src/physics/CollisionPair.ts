import { RigidBody } from "./RigidBody";

export class CollisionPair {
    constructor(
        public A: RigidBody,
        public B: RigidBody,
        // public e: number = 1.0,
        // public friction: number = 0.0
    ) {}
};
