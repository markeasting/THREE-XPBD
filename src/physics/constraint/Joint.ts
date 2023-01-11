import { Pose } from "../Pose";
import { Quat } from "../Quaternion";
import { RigidBody } from "../RigidBody";
import { XPBDSolver } from "../solver/XPBDSolver";
import { Vec3 } from "../Vec3";
import { Constraint } from "./Constraint";

export enum JointType {
    SPHERICAL = "spherical",
    HINGE = "hinge",
    FIXED = "fixed"
}

export class Joint extends Constraint {

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
        super(body0, body1);

        this.type = type;

        this.body0 = body0;
        this.body1 = body1;
        this.localPose0 = localPose0 ? localPose0.clone() : body0.pose.clone();
        this.localPose1 = localPose1 ? localPose1.clone() : body1.pose.clone();
        
        this.globalPose0 = this.localPose0.clone();
        this.globalPose1 = this.localPose1.clone();
    }

    private updateGlobalPoses() {
        this.globalPose0.copy(this.localPose0);
        if (this.body0)
            this.body0.pose.transformPose(this.globalPose0);
        this.globalPose1.copy(this.localPose1);
        if (this.body1)
            this.body1.pose.transformPose(this.globalPose1);
    }

    override solvePos(h: number) {

        this.updateGlobalPoses();

        // Orientation
        if (this.type == JointType.FIXED) {
            let q = this.globalPose0.q;
            q.conjugate();
            q.multiplyQuaternions(this.globalPose1.q, q);
            let omega = new Vec3();
            omega.set(2.0 * q.x, 2.0 * q.y, 2.0 * q.z);
            // if (omega.w < 0.0)
            //     omega.multiplyScalar(-1.0);
            // Should it be this one?
            // if (q.w < 0.0)
            //     omega.set(-omega.x, -omega.y, -omega.z);

            XPBDSolver.applyBodyPairCorrection(this.body0, this.body1, omega, this.compliance, h);						
        }

        if (this.type == JointType.HINGE) {

            // Align axes
            let a0 = this.getQuatAxis0(this.globalPose0.q);
            let b0 = this.getQuatAxis1(this.globalPose0.q);
            let c0 = this.getQuatAxis2(this.globalPose0.q);
            let a1 = this.getQuatAxis0(this.globalPose1.q);
            a0.cross(a1);
            XPBDSolver.applyBodyPairCorrection(this.body0, this.body1, a0, 0.0, h);

            // Limits
            if (this.hasSwingLimits) {
                this.updateGlobalPoses();
                let n = this.getQuatAxis0(this.globalPose0.q);
                let b0 = this.getQuatAxis1(this.globalPose0.q);
                let b1 = this.getQuatAxis1(this.globalPose1.q);
                this.limitAngle(this.body0, this.body1, n, b0, b1, 
                    this.minSwingAngle, this.maxSwingAngle, this.swingLimitsCompliance, h);
            }
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
                this.limitAngle(this.body0, this.body1, n, a0, a1, 
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
               
                this.limitAngle(this.body0, this.body1, n, a0, a1, 
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

    override solveVel(h: number) { 

        // Gauss-Seidel lets us make damping unconditionally stable in a 
        // very simple way. We clamp the correction for each constraint
        // to the magnitude of the currect velocity making sure that
        // we never subtract more than there actually is.

        if (this.rotDamping > 0.0) {
            let omega = new Vec3(0.0, 0.0, 0.0);
            if (this.body0)
                omega.sub(this.body0.omega);
            if (this.body1)
                omega.add(this.body1.omega); 
            omega.multiplyScalar(Math.min(1.00, this.rotDamping * h));
            XPBDSolver.applyBodyPairCorrection(this.body0, this.body1, omega, 0.0, h, 
                    null, null, true);
        }
        if (this.posDamping > 0.0) {
            this.updateGlobalPoses();
            let vel = new Vec3(0.0, 0.0, 0.0);
            if (this.body0)
                vel.sub(this.body0.getVelocityAt(this.globalPose0.p));
            if (this.body1)
                vel.add(this.body1.getVelocityAt(this.globalPose1.p));
            vel.multiplyScalar(Math.min(1.0, this.posDamping * h));
            XPBDSolver.applyBodyPairCorrection(this.body0, this.body1, vel, 0.0, h, 
                    this.globalPose0.p, this.globalPose1.p, true);
        }
    }	



    private getQuatAxis0(q: Quat) {
        let x2 = q.x * 2.0;
        let w2 = q.w * 2.0;
        return new Vec3((q.w * w2) - 1.0 + q.x * x2, (q.z * w2) + q.y * x2, (-q.y * w2) + q.z * x2);
    }
    private getQuatAxis1(q: Quat) {
        let y2 = q.y * 2.0;
        let w2 = q.w * 2.0;
        return new Vec3((-q.z * w2) + q.x * y2, (q.w * w2) - 1.0 + q.y * y2, (q.x * w2) + q.z * y2);
    }
    private getQuatAxis2(q: Quat) {
        let z2 = q.z * 2.0;
        let w2 = q.w * 2.0;
        return new Vec3((q.y * w2) + q.x * z2, (-q.x * w2) + q.y * z2, (q.w * w2) - 1.0 + q.z * z2);
    } 




    private limitAngle(
        body0: RigidBody, 
        body1: RigidBody, 
        n: Vec3, 
        a: Vec3, 
        b: Vec3, 
        minAngle: number,
        maxAngle: number,
        compliance: number,
        h: number,
        maxCorr = Math.PI
    ) {

        // The key function to handle all angular joint limits
        let c = new Vec3();
        c.crossVectors(a, b);
    
        let phi = Math.asin(c.dot(n));
        if (a.dot(b) < 0.0)
            phi = Math.PI - phi;
    
        if (phi > Math.PI)
            phi -= 2.0 * Math.PI;
        if (phi < -Math.PI)
            phi += 2.0 * Math.PI;
    
        if (phi < minAngle || phi > maxAngle) {
            phi = Math.min(Math.max(minAngle, phi), maxAngle);
    
            let q = new Quat();
            q.setFromAxisAngle(n, phi);
    
            let omega = a.clone();
            omega.applyQuaternion(q);
            omega.cross(b);
    
            phi = omega.length();
            if (phi > maxCorr) 
                omega.multiplyScalar(maxCorr / phi);
    
            XPBDSolver.applyBodyPairCorrection(body0, body1, omega, compliance, h);
        }
    }	

}
