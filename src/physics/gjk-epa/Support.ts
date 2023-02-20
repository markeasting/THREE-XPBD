import { Vec3 } from "../Vec3";

export class Support {
    
    public point: Vec3;
    public witnessA: Vec3;
    public witnessB: Vec3;

    constructor(
        witnessA: Vec3,
        witnessB: Vec3,
    ) {
        this.witnessA = witnessA;
        this.witnessB = witnessB;

        this.point = new Vec3().subVectors(
            witnessA,
            witnessB
        );
    }

}
