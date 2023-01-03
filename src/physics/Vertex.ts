import { Vec3 } from "./Vec3";

export class Vertex {

    position = new Vec3();
    normal: Vec3 | undefined;

    constructor(position: Vec3, normal?: Vec3) {
        this.position = position;
        this.normal = normal;
    }
}