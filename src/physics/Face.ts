import { Vec3 } from "./Vec3";

export class Face {
    constructor(
        public vertices: [Vec3, Vec3, Vec3],
        public normal: Vec3
    ) {}
}
