import { Vec2 } from "../Vec2";

const X = 0;
const Y = 1;
const REMOVED = -1;

/**
 * Returns the smallest convex hull of a given set of points. Runs in O(n log n).
 * 
 * https://github.com/luciopaiva/graham-scan
 */
export class GrahamScan {

    points: Array<[number, number]> = [];

    constructor() {
        this.points = [];
    }
    public setPoints(points: Array<Vec2>): this {
        this.points = points.map(v => v.toArray());

        return this;
    }

    public getHull(): Vec2[] {
        const pivot = this.preparePivotPoint();

        let indexes = Array.from(this.points, (point, i) => i);
        const angles = Array.from(this.points, (point) => this.getAngle(pivot, point));
        const distances = Array.from(this.points, (point) => this.euclideanDistanceSquared(pivot, point));

        // sort by angle and distance
        indexes.sort((i, j) => {
            const angleA = angles[i];
            const angleB = angles[j];
            if (angleA === angleB) {
                const distanceA = distances[i];
                const distanceB = distances[j];
                return distanceA - distanceB;
            }
            return angleA - angleB;
        });

        // remove points with repeated angle (but never the pivot, so start from i=1)
        for (let i = 1; i < indexes.length - 1; i++) {
            if (angles[indexes[i]] === angles[indexes[i + 1]]) {  // next one has same angle and is farther
                indexes[i] = REMOVED;  // remove it logically to avoid O(n) operation to physically remove it
            }
        }

        const hull = [];
        for (let i = 0; i < indexes.length; i++) {
            const index = indexes[i];
            const point = this.points[index];

            if (index !== REMOVED) {
                if (hull.length < 3) {
                    hull.push(point);
                } else {
                    while (this.checkOrientation(hull[hull.length - 2], hull[hull.length - 1], point) > 0) {
                        hull.pop();
                    }
                    hull.push(point);
                }
            }
        }

        return hull.length < 3 ? [] : hull.map(v => new Vec2(v[0], v[1]));
    }

    /**
     * Check the orientation of 3 points in the order given.
     *
     * It works by comparing the slope of P1->P2 vs P2->P3. If P1->P2 > P2->P3, orientation is clockwise; if
     * P1->P2 < P2->P3, counter-clockwise. If P1->P2 == P2->P3, points are co-linear.
     */
    private checkOrientation(p1: [number, number], p2: [number, number], p3: [number, number]): number {
        return (p2[Y] - p1[Y]) * (p3[X] - p2[X]) - (p3[Y] - p2[Y]) * (p2[X] - p1[X]);
    }

    private getAngle(a: [number, number], b: [number, number]) {
        return Math.atan2(b[Y] - a[Y], b[X] - a[X]);
    }

    private euclideanDistanceSquared(p1: [number, number], p2: [number, number]): number {
        const a = p2[X] - p1[X];
        const b = p2[Y] - p1[Y];
        return a * a + b * b;
    }

    private preparePivotPoint(): [number, number] {
        let pivot = this.points[0];
        let pivotIndex = 0;
        for (let i = 1; i < this.points.length; i++) {
            const point = this.points[i];
            if (point[Y] < pivot[Y] || point[Y] === pivot[Y] && point[X] < pivot[X]) {
                pivot = point;
                pivotIndex = i;
            }
        }
        return pivot;
    }
}
