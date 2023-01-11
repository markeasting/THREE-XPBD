import { RigidBody } from "../RigidBody";

export class Constraint {

    public body0: RigidBody;
    public body1: RigidBody;

    public compliance = 0.0;
    
    constructor(body0: RigidBody, body1: RigidBody) 
    { 
        this.body0 = body0;
        this.body1 = body1;
    }

    public solvePos(h: number) {}
    public solveVel(h: number) {}

}
