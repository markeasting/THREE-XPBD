import { XPBDSolver } from "../solver/XPBDSolver";
import { BaseConstraint } from "./BaseConstraint";

export class AlignAxes extends BaseConstraint {

    solvePos(h: number) {
        this.updateGlobalPoses();

        let a0 = this.getQuatAxis0(this.globalPose0.q);
        let b0 = this.getQuatAxis1(this.globalPose0.q);
        let c0 = this.getQuatAxis2(this.globalPose0.q);
        let a1 = this.getQuatAxis0(this.globalPose1.q);
        a0.cross(a1);

        this.lambda = XPBDSolver.applyBodyPairCorrection(this.body0, this.body1, a0, 0.0, h);
    }

}
