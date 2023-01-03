import { RigidBody } from "./RigidBody";

export class CollisionPair {
    A: RigidBody;
    B: RigidBody;
    e: number = 1.0;
    friction: number = 0.0;
};
