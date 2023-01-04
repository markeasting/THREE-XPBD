import { Quat } from "./Quaternion";
import { Vec3 } from "./Vec3";

export class CoordinateSystem {

    // @TODO use THREE.Mesh localToWorld?

    static localToWorld(localVector: Vec3, rotation: Quat, translation: Vec3): Vec3 {
        // return (rotation * localVector) + translation;
        return new Vec3()
            .copy(localVector)
            .applyQuaternion(rotation)
            .add(translation);
    }

    // static localToWorld(localVector: Vec3, translation: Vec3): Vec3 {
    //     return localVector + translation;
    // }

    static worldToLocal(worldVector: Vec3, inverseRotation: Quat, translation: Vec3): Vec3 {
        // return inverseRotation * (worldVector - translation);

        return new Vec3()
            .copy(worldVector)
            .sub(translation)
            .applyQuaternion(inverseRotation);
    }

    // static worldToLocal(worldVector: Vec3, translation: Vec3): Vec3 {
    //     return worldVector - translation;
    // }
}
