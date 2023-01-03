import { Quat } from "./Quaternion";
import { Vec3 } from "./Vec3";

export class Pose {

    p: Vec3 // = new Vec3(0.0, 0.0, 0.0);
    q: Quat // = new Quat(1.0, 0.0, 0.0, 0.0);

    constructor(p: Vec3, q: Quat) {
        this.p = p;
        this.q = q;
    }

    copy(other: Pose) {
        this.p.copy(other.p);
        this.q.copy(other.q);
    }

    clone(): Pose {
        return new Pose(this.p.clone(), this.q.clone());;
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
        // v = v * glm::conjugate(this->q);
        v.applyQuaternion(this.q.conjugate())
    }

    transform(v: Vec3): void {
        this.rotate(v);
        this.translate(v);
    }

    invTransform(v: Vec3): void {
        this.invTranslate(v);
        this.invRotate(v);
    }

    transformPose(pose: Pose): void {
        pose.q.multiplyQuaternions(this.q, pose.q);
        this.rotate(pose.p);
        pose.p.add(this.p);
    }
}
