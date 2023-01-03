import { Quat } from "./Quaternion";
import { Vec3 } from "./Vec3";

export class CoordinateSystem {

    static localToWorld(localVector: Vec3, rotation: Quat, translation: Vec3): Vec3 {
        // return (rotation * localVector) + translation;
        const pos = new Vec3();
        pos.copy(localVector);

        pos.applyQuaternion(rotation);

        return pos.add(translation);
    }

    // static localToWorld(localVector: Vec3, translation: Vec3): Vec3 {
    //     return localVector + translation;
    // }

    static worldToLocal(worldVector: Vec3, inverseRotation: Quat, translation: Vec3): Vec3 {
        // return inverseRotation * (worldVector - translation);

        const pos = new Vec3();
        pos.copy(worldVector);

        pos.sub(translation)

        return pos.applyQuaternion(inverseRotation);
    }

    // static worldToLocal(worldVector: Vec3, translation: Vec3): Vec3 {
    //     return worldVector - translation;
    // }
}
