import { Pose } from "./Pose";
import { Vec3 } from "./Vec3";

export class CoordinateSystem {

    static localToWorld(localVector: Vec3, pose: Pose): Vec3 {
        return new Vec3()
            .copy(localVector)
            .applyQuaternion(pose.q)
            .add(pose.p);
    }

    static worldToLocal(worldVector: Vec3, pose: Pose): Vec3 {
        return new Vec3()
            .copy(worldVector)
            .sub(pose.p)
            .applyQuaternion(pose.q.clone().conjugate())
    }
}
