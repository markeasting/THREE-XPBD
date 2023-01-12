import { Vector3 } from 'three';

export class Vec3 extends Vector3 {

    mul(s: number) {
        return this.multiplyScalar(s)
    }


    static mul(v: Vec3, s: number) {
        return v.clone().multiplyScalar(s);
    }

    static div(v: Vec3, s: number) {
        return v.clone().divideScalar(s);
    }

    static add(v1: Vec3, v2: Vec3) {
        return new Vec3().addVectors(v1, v2);
    }

    static sub(v1: Vec3, v2: Vec3) {
        return new Vec3().subVectors(v1, v2);
    }


    static normalize(v: Vec3) {
        return v.clone().normalize();
    }

    static cross(v1: Vec3, v2: Vec3) {
        return new Vec3().crossVectors(v1, v2);
    }

    static dot(v1: Vec3, v2: Vec3) {
        return v1.dot(v2);
    }
}