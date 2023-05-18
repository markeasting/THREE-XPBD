import { Vec3 } from "./Vec3";
import { Quat } from "./Quaternion";

export class Pose {

    p: Vec3;
    q: Quat;

    constructor(p: Vec3 = new Vec3(0, 0, 0), q: Quat = new Quat()) {
        this.p = p.clone();
        this.q = q.clone();
    }

    copy(other: Pose) {
        this.p.copy(other.p);
        this.q.copy(other.q);
    }

    clone() {
        return new Pose(this.p, this.q);
    }

    translate(v: Vec3): void {
        v.add(this.p);
    }

    invTranslate(v: Vec3): void {
        v.sub(this.p);
    }

    rotate(v: Vec3): void {
        v.applyQuaternion(this.q);
    }

    invRotate(v: Vec3): void {
        const inv = this.q.clone().conjugate();
        v.applyQuaternion(inv);
    }

    transform(v: Vec3): void {
        v.applyQuaternion(this.q);
        v.add(this.p);
    }

    invTransform(v: Vec3): void {
        v.sub(this.p);
        this.invRotate(v);
    }

    transformPose(pose: Pose): void {
        pose.q.multiplyQuaternions(this.q, pose.q);
        this.rotate(pose.p);
        pose.p.add(this.p);
    }
}
