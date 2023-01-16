import { XPBDSolver } from "../solver/XPBDSolver";
import { Vec3 } from "../Vec3";
import { BaseConstraint } from "./BaseConstraint";

export class AlignOrientation extends BaseConstraint {

    solvePos(h: number) {
        this.updateGlobalPoses();
        
        const q = this.globalPose0.q;
        q.conjugate();
        q.multiplyQuaternions(this.globalPose1.q, q);

        // let omega = new Vec3();
        // omega.set(2.0 * q.x, 2.0 * q.y, 2.0 * q.z);
        const omega = new Vec3(2.0 * q.x, 2.0 * q.y, 2.0 * q.z);

        // if (omega.w < 0.0)
        //     omega.multiplyScalar(-1.0);
        // Shouldn't it be this one?
        if (q.w < 0.0)
            omega.set(-omega.x, -omega.y, -omega.z);
        
        this.lambda = XPBDSolver.applyBodyPairCorrection(this.body0, this.body1, omega, this.compliance, h);	
    }

}
