import { Quat } from "./Quaternion";
import { Vec3 } from "./Vec3";

export class CoordinateSystem {

    static localToWorld(localVector: Vec3, rotation: Quat, translation: Vec3): Vec3 {
        // return (rotation * localVector) + translation;
        return new Vec3()
            .copy(localVector)
            .applyQuaternion(rotation)
            .add(translation);
    }

    static worldToLocal(worldVector: Vec3, rotation: Quat, translation: Vec3): Vec3 {
        // return inverseRotation * (worldVector - translation);

        return new Vec3()
            .copy(worldVector)
            .sub(translation)
            .applyQuaternion(rotation.clone().conjugate())
    }
}
