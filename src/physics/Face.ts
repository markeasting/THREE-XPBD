import { Vec3 } from "./Vec3";

export class Face {
    constructor(
        public vertices: [Vec3, Vec3, Vec3],
        public indices: [number, number, number],
        public center: Vec3,
        public normal: Vec3
    ) {}
}
