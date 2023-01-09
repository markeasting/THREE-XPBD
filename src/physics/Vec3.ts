import { Vector3 } from 'three';

export class Vec3 extends Vector3 {

    static normalize(v: Vec3) {
        return v.clone().normalize();
    }
}