
import { XPBDSolver } from "../solver/XPBDSolver";
import { BaseConstraint } from "./BaseConstraint";

export class LimitAngle extends BaseConstraint {

    public minAngle = -2.0 * Math.PI;
    public maxAngle = 2.0 * Math.PI;

    constructor(minAngle: number, maxAngle: number) {
        super();

        this.minAngle = minAngle;
        this.maxAngle = maxAngle;
    }

    solvePos(h: number) {

        this.updateGlobalPoses();

        let n = this.getQuatAxis0(this.globalPose0.q);
        let b0 = this.getQuatAxis1(this.globalPose0.q);
        let b1 = this.getQuatAxis1(this.globalPose1.q);

        this.lambda = BaseConstraint.limitAngle(this.body0, this.body1, n, b0, b1, 
            this.minAngle, this.maxAngle, this.compliance, h);
    }

}

