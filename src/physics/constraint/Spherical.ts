import { XPBDSolver } from "../solver/XPBDSolver";
import { BaseConstraint } from "./BaseConstraint";

/**
 * Spherical is actually:
 * - Attachment
 * - SwingLimit
 * - TwistLimit
 */
export class Spherical extends BaseConstraint {

    // solvePos(h: number) {
    //     this.updateGlobalPoses();

    //     // Swing limits
    //     if (this.hasSwingLimits) {
    //         this.updateGlobalPoses();
    //         let a0 = this.getQuatAxis0(this.globalPose0.q);
    //         let a1 = this.getQuatAxis0(this.globalPose1.q);
    //         let n = new Vec3();
    //         n.crossVectors(a0, a1);
    //         n.normalize();
    //         BaseConstraint.limitAngle(this.body0, this.body1, n, a0, a1, 
    //             this.minSwingAngle, this.maxSwingAngle, this.swingLimitsCompliance, h);
    //     }
    //     // Twist limits
    //     if (this.hasTwistLimits) {
    //         this.updateGlobalPoses();
    //         let n0 = this.getQuatAxis0(this.globalPose0.q);
    //         let n1 = this.getQuatAxis0(this.globalPose1.q);
    //         let n = new Vec3();
    //         n.addVectors(n0, n1)
    //         n.normalize();
    //         let a0 = this.getQuatAxis1(this.globalPose0.q);
    //         a0.addScaledVector(n, -n.dot(a0));
    //         a0.normalize();
    //         let a1 = this.getQuatAxis1(this.globalPose1.q);
    //         a1.addScaledVector(n, -n.dot(a1));
    //         a1.normalize();

    //         // handling gimbal lock problem
    //         let maxCorr = n0.dot(n1) > -0.5 ? 2.0 * Math.PI : 1.0 * h;		
            
    //         BaseConstraint.limitAngle(this.body0, this.body1, n, a0, a1, 
    //             this.minTwistAngle, this.maxTwistAngle, this.twistLimitCompliance, h, maxCorr);
    //     }
    // }

}
