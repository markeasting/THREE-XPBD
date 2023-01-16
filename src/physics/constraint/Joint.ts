import { Pose } from "../Pose";
import { Quat } from "../Quaternion";
import { RigidBody } from "../RigidBody";
import { XPBDSolver } from "../solver/XPBDSolver";
import { Vec3 } from "../Vec3";
import { BaseConstraint } from "./BaseConstraint";

export enum JointType {
    SPHERICAL = "spherical",
    HINGE = "hinge",
    FIXED = "fixed"
}

export class Joint extends BaseConstraint {

    public type: JointType;					

    // public body0: RigidBody;
    // public body1: RigidBody;
    public localPose0 = new Pose();
    public localPose1 = new Pose();
    public globalPose0: Pose;
    public globalPose1: Pose;

    // public compliance = 0.0;
    public rotDamping = 0.0;
    public posDamping = 0.0;

    public hasSwingLimits = false;
    public minSwingAngle = -2.0 * Math.PI;
    public maxSwingAngle = 2.0 * Math.PI;
    public swingLimitsCompliance = 0.0;
    
    public hasTwistLimits = false;
    public minTwistAngle = -2.0 * Math.PI;
    public maxTwistAngle = 2.0 * Math.PI;
    public twistLimitCompliance = 0.0;

    constructor(type: JointType, body0: RigidBody, body1: RigidBody, localPose0?: Pose, localPose1?: Pose) 
    { 
        super();

        this.type = type;

        this.body0 = body0;
        this.body1 = body1;
        this.localPose0 = localPose0 ? localPose0.clone() : body0.pose.clone();
        this.localPose1 = localPose1 ? localPose1.clone() : body1.pose.clone();
        
        this.globalPose0 = this.localPose0.clone();
        this.globalPose1 = this.localPose1.clone();
    }

    override solvePos(h: number) {

        this.updateGlobalPoses();

        // Orientation
        if (this.type == JointType.FIXED) {
            // let q = this.globalPose0.q;
            // q.conjugate();
            // q.multiplyQuaternions(this.globalPose1.q, q);
            // let omega = new Vec3();
            // omega.set(2.0 * q.x, 2.0 * q.y, 2.0 * q.z);
            // // if (omega.w < 0.0)
            // //     omega.multiplyScalar(-1.0);
            // // Should it be this one?
            // // if (q.w < 0.0)
            // //     omega.set(-omega.x, -omega.y, -omega.z);

            // XPBDSolver.applyBodyPairCorrection(this.body0, this.body1, omega, this.compliance, h);						
        }

        if (this.type == JointType.HINGE) {

            // // Align axes
            // let a0 = this.getQuatAxis0(this.globalPose0.q);
            // let b0 = this.getQuatAxis1(this.globalPose0.q);
            // let c0 = this.getQuatAxis2(this.globalPose0.q);
            // let a1 = this.getQuatAxis0(this.globalPose1.q);
            // a0.cross(a1);

            // const dlambda = XPBDSolver.applyBodyPairCorrection(this.body0, this.body1, a0, 0.0, h);

            // // Limits
            // if (this.hasSwingLimits) {
            //     this.updateGlobalPoses();
            //     let n = this.getQuatAxis0(this.globalPose0.q);
            //     let b0 = this.getQuatAxis1(this.globalPose0.q);
            //     let b1 = this.getQuatAxis1(this.globalPose1.q);
            //     Constraint.limitAngle(this.body0, this.body1, n, b0, b1, 
            //         this.minSwingAngle, this.maxSwingAngle, this.swingLimitsCompliance, h);
            // }
        }

        if (this.type == JointType.SPHERICAL) {

            // Swing limits
            if (this.hasSwingLimits) {
                this.updateGlobalPoses();
                let a0 = this.getQuatAxis0(this.globalPose0.q);
                let a1 = this.getQuatAxis0(this.globalPose1.q);
                let n = new Vec3();
                n.crossVectors(a0, a1);
                n.normalize();
                BaseConstraint.limitAngle(this.body0, this.body1, n, a0, a1, 
                    this.minSwingAngle, this.maxSwingAngle, this.swingLimitsCompliance, h);
            }
            // Twist limits
            if (this.hasTwistLimits) {
                this.updateGlobalPoses();
                let n0 = this.getQuatAxis0(this.globalPose0.q);
                let n1 = this.getQuatAxis0(this.globalPose1.q);
                let n = new Vec3();
                n.addVectors(n0, n1)
                n.normalize();
                let a0 = this.getQuatAxis1(this.globalPose0.q);
                a0.addScaledVector(n, -n.dot(a0));
                a0.normalize();
                let a1 = this.getQuatAxis1(this.globalPose1.q);
                a1.addScaledVector(n, -n.dot(a1));
                a1.normalize();

                // handling gimbal lock problem
                let maxCorr = n0.dot(n1) > -0.5 ? 2.0 * Math.PI : 1.0 * h;		
               
                BaseConstraint.limitAngle(this.body0, this.body1, n, a0, a1, 
                    this.minTwistAngle, this.maxTwistAngle, this.twistLimitCompliance, h, maxCorr);
            }
        }

        // position
        
        // simple attachment

        this.updateGlobalPoses();
        let corr = new Vec3();
        corr.subVectors(this.globalPose1.p, this.globalPose0.p);

        XPBDSolver.applyBodyPairCorrection(
            this.body0, 
            this.body1, 
            corr, 
            this.compliance, 
            h,
            this.globalPose0.p, 
            this.globalPose1.p
        );
    }


    // private limitAngle(
    //     body0: RigidBody, 
    //     body1: RigidBody, 
    //     n: Vec3, 
    //     a: Vec3, 
    //     b: Vec3, 
    //     minAngle: number,
    //     maxAngle: number,
    //     compliance: number,
    //     h: number,
    //     maxCorr = Math.PI
    // ) {

    //     // The key function to handle all angular joint limits
    //     let c = new Vec3();
    //     c.crossVectors(a, b);
    
    //     let phi = Math.asin(c.dot(n));
    //     if (a.dot(b) < 0.0)
    //         phi = Math.PI - phi;
    
    //     if (phi > Math.PI)
    //         phi -= 2.0 * Math.PI;
    //     if (phi < -Math.PI)
    //         phi += 2.0 * Math.PI;
    
    //     if (phi < minAngle || phi > maxAngle) {
    //         phi = Math.min(Math.max(minAngle, phi), maxAngle);
    
    //         let q = new Quat();
    //         q.setFromAxisAngle(n, phi);
    
    //         let omega = a.clone();
    //         omega.applyQuaternion(q);
    //         omega.cross(b);
    
    //         phi = omega.length();
    //         if (phi > maxCorr) 
    //             omega.multiplyScalar(maxCorr / phi);
    
    //         XPBDSolver.applyBodyPairCorrection(body0, body1, omega, compliance, h);
    //     }
    // }	

}
