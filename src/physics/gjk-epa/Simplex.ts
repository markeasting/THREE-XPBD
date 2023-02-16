import { Vec3 } from "../Vec3";

export class Simplex {

	points: Array<Vec3> = [];
	size: number = 0;

	constructor() {
		this.points = [new Vec3(), new Vec3(), new Vec3(), new Vec3()]
		this.size = 0;
	}

	public assign(points: Vec3[]): this {
		for (const i in points) {
			const v = points[i];
			this.points[i] = v;
		}

		this.size = points.length;

		return this;
	}

	public push_front(point: Vec3): void {
		this.points = [point, this.points[0], this.points[1], this.points[2]];
		this.size = Math.min(this.size + 1, this.points.length);
	}

};