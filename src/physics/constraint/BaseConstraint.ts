import { Pose } from "../Pose";
import { Quat } from "../Quaternion";
import { RigidBody } from "../RigidBody";
import { XPBDSolver } from "../solver/XPBDSolver";
import { Vec3 } from "../Vec3";

export abstract class BaseConstraint {

    public body0: RigidBody | null;
    public body1: RigidBody | null;

    public compliance = 0.0; // [meters / Newton] -- inverse of 'stiffness' (N/m)
    public lambda = 0.0; 
    public normal = new Vec3();

    public rotDamping = 0.0;
    public posDamping = 0.0;

    public localPose0 = new Pose();
    public localPose1 = new Pose();
    public globalPose0 = new Pose();
    public globalPose1 = new Pose();
    
    constructor() {}

    /**
     * @param body0 
     * @param body1 
     * @param localPose0 (World space?) attachment position on body0
     * @param localPose1 (World space?) attachment position on body1
     */
    public setBodies(body0: RigidBody | null, body1: RigidBody | null, localPose0?: Pose | Vec3, localPose1?: Pose | Vec3) {
        this.body0 = body0;
        this.body1 = body1;

        // this.localPose0 = localPose0 ? localPose0.clone() : body0.pose.clone();
        // this.localPose1 = localPose1 ? localPose1.clone() : body1.pose.clone();
        // this.localPose0 = localPose0 ? localPose0.clone() : body1.pose.clone(); // flipped body poses?
        // this.localPose1 = localPose1 ? localPose1.clone() : body0.pose.clone(); // flipped body poses?
        if (localPose0 instanceof Pose) this.localPose0 = localPose0.clone();
        if (localPose1 instanceof Pose) this.localPose1 = localPose1.clone();
        if (localPose0 instanceof Vec3) this.localPose0 = new Pose(localPose0);
        if (localPose1 instanceof Vec3) this.localPose1 = new Pose(localPose1);

        this.globalPose0 = this.localPose0.clone();
        this.globalPose1 = this.localPose1.clone();

        return this;
    }
    
    // m/N
    public setCompliance(compliance: number) {
        this.compliance = compliance;
        return this;
    }
    
    // N/m
    public setStiffness(stiffness: number) {
        this.compliance = 1/stiffness;
        return this;
    }

    public setDamping(posDamping: number, rotDamping: number) {
        this.posDamping = posDamping;
        this.rotDamping = rotDamping;
        return this;
    }

    public getForce(h: number) {
        return Vec3.div(Vec3.mul(this.normal, this.lambda), (h * h));
    }

    public abstract solvePos(h: number): void;

    public solveVel(h: number) {
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

    protected updateGlobalPoses() {
        this.globalPose0.copy(this.localPose0);
        this.globalPose1.copy(this.localPose1);
        
        if (this.body0)
            this.body0.pose.transformPose(this.globalPose0);
        if (this.body1)
            this.body1.pose.transformPose(this.globalPose1);
    }


    // Only used for hinge and spherical
    static limitAngle(
        body0: RigidBody | null, 
        body1: RigidBody | null, 
        n: Vec3, 
        a: Vec3, 
        b: Vec3, 
        minAngle: number,
        maxAngle: number,
        compliance: number,
        h: number,
        maxCorr = Math.PI
    ): number {

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
    
            return XPBDSolver.applyBodyPairCorrection(body0, body1, omega, compliance, h);
        }
        
        return 0;
    }



    protected getQuatAxis0(q: Quat) {
        let x2 = q.x * 2.0;
        let w2 = q.w * 2.0;
        return new Vec3((q.w * w2) - 1.0 + q.x * x2, (q.z * w2) + q.y * x2, (-q.y * w2) + q.z * x2);
    }
    protected getQuatAxis1(q: Quat) {
        let y2 = q.y * 2.0;
        let w2 = q.w * 2.0;
        return new Vec3((-q.z * w2) + q.x * y2, (q.w * w2) - 1.0 + q.y * y2, (q.x * w2) + q.z * y2);
    }
    protected getQuatAxis2(q: Quat) {
        let z2 = q.z * 2.0;
        let w2 = q.w * 2.0;
        return new Vec3((q.y * w2) + q.x * z2, (-q.x * w2) + q.y * z2, (q.w * w2) - 1.0 + q.z * z2);
    } 

}
