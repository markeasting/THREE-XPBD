import { Pose } from "../Pose";
import { XPBDSolver } from "../solver/XPBDSolver";
import { Vec3 } from "../Vec3";
import { BaseConstraint } from "./BaseConstraint";

export class Attachment extends BaseConstraint {

    constructor(localPosition0: Vec3, localPosition1: Vec3) {
        super();

        // @TODO shouldn't set localPose here 
        // since setBodies is called again from BaseConstraint!

        const p1 = localPosition0.clone();
        const p2 = localPosition1.clone();

        this.localPose0 = new Pose(p1);
        this.localPose1 = new Pose(p2);
    }

    solvePos(h: number) {
        this.updateGlobalPoses();
        
        // @TODO generalize creating C (constraint error) and it's normal
        const corr = Vec3.sub(this.globalPose1.p, this.globalPose0.p);

        if (corr.length() < 0.000001)
            return;

        this.normal = Vec3.normalize(corr);

        this.lambda = XPBDSolver.applyBodyPairCorrection(
            this.body0, 
            this.body1, 
            corr, 
            this.compliance, 
            h,
            this.globalPose0.p, 
            this.globalPose1.p
        );	
    }

}
