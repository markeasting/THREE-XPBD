import { Collider } from "../Collider"
import { Vec3 } from "../Vec3"
import { Simplex } from "./Simplex";

/**
 * Based on this amazing guide: 
 * 
 * https://blog.winter.dev/2020/gjk-algorithm/
 */
export class GJK {

    public gjk(
        colliderA: Collider,
        colliderB: Collider,
    ): boolean {
        
        /**
         * We need at least one vertex to start, so we’ll manually add it. 
         * The search direction for the first vertex doesn’t matter, but you 
         * may get less iterations with a smarter choice. 
         */
        const support = this.support(colliderA, colliderB, new Vec3(0, 1, 0));

        /* Simplex is an array of points, max count is 4 */
        const points = new Simplex();
        points.push_front(support);

        /* New direction is towards the origin */
        const direction = support.clone().multiplyScalar(-1.0);

        while (true) {

            /**
             * In a loop, we’ll add another point. 
             * 
             * The exit condition is that this new point is not in front 
             * of the search direction. This would exit if the direction 
             * finds a vertex that was already the furthest one along it.
             */

            const support = this.support(colliderA, colliderB, direction);

            if (support.dot(direction) <= 0)
                return false; /* No collision */
    
            points.push_front(support);

            /** 
             * Now that we have a line, we’ll feed it into a function that 
             * updates the simplex and search direction. 
             * It’ll return true or false to signify a collision.
             */
            if (this.nextSimplex(points, direction))
                return true;
        }
    }
    
    /**
     * Returns the vertex on the Minkowski difference
     */
    private support(
        colliderA: Collider,
        colliderB: Collider,
        direction: Vec3
    ): Vec3 {
        return new Vec3().subVectors(
            colliderA.findFurthestPoint(direction),
            colliderB.findFurthestPoint(direction.clone().multiplyScalar(-1.0))
        );
    }

    private nextSimplex(
        simplex: Simplex,
        direction: Vec3
    ) {

        switch (simplex.size) {
            case 2: return this.Line        (simplex, direction);
            case 3: return this.Triangle    (simplex, direction);
            case 4: return this.Tetrahedron (simplex, direction);
        }
     
        /* This statement should never be reached */
        return false;
    }

    private sameDirection(direction: Vec3, ao: Vec3) {
        return direction.dot(ao) > 0;
    }

    private Line(
        simplex: Simplex,
        direction: Vec3
    ) {
        const a = simplex.points[0];
        const b = simplex.points[1];
    
        // const ab = b - a;
        // const ao =   - a;
        const ab = new Vec3().subVectors(b, a);
        const ao = a.clone().multiplyScalar(-1.0);
     
        if (this.sameDirection(ab, ao)) {
            // direction = ab.cross(ao).cross(ab);
            direction.copy(ab.clone().cross(ao).clone().cross(ab));
        } else {
            // points = { a };
            // direction = ao;
            simplex.assign([ a ]);
            direction.copy(ao);
        }
    
        return false;
    }

    private Triangle(
        simplex: Simplex,
        direction: Vec3
    ) {
        const a = simplex.points[0];
        const b = simplex.points[1];
        const c = simplex.points[2];
    
        // const ab = b - a;
        // const ac = c - a;
        // const ao =   - a;
        const ab = new Vec3().subVectors(b, a);
        const ac = new Vec3().subVectors(c, a);
        const ao = a.clone().multiplyScalar(-1.0);
     
        const abc = ab.clone().cross(ac);
     
        if (this.sameDirection(abc.clone().cross(ac), ao)) {
            
            if (this.sameDirection(ac, ao)) {
                // points = { a, c };
                // direction = ac.cross(ao).cross(ac);
                simplex.assign([ a, c ]);
                direction.copy(ac.clone().cross(ao).clone().cross(ac));

            } else {
                // return this.Line(points = { a, b }, direction);
                simplex.assign([ a, c ]);
                return this.Line(simplex, direction);
            }

        } else {
            if (this.sameDirection(ab.clone().cross(abc), ao)) {
                // return Line(points = { a, b }, direction);
                simplex.assign([ a, b ]);
                return this.Line(simplex, direction);
            }
    
            else {
                if (this.sameDirection(abc, ao)) {
                    // direction = abc;
                    direction.copy(abc);
                } else {
                    // points = { a, c, b };
                    // direction = -abc;
                    simplex.assign([ a, c, b ]);
                    direction.copy(abc.multiplyScalar(-1.0));
                }
            }
        }
    
        return false;
    }

    private Tetrahedron(
        simplex: Simplex,
        direction: Vec3
    ) {
        const a = simplex.points[0];
        const b = simplex.points[1];
        const c = simplex.points[2];
        const d = simplex.points[3];
    
        // const ab = b - a;
        // const ac = c - a;
        // const ad = d - a;
        // const ao =   - a;
        const ab = new Vec3().subVectors(b, a);
        const ac = new Vec3().subVectors(c, a);
        const ad = new Vec3().subVectors(d, a);
        const ao = a.clone().multiplyScalar(-1.0);
     
        const abc = ab.clone().cross(ac);
        const acd = ac.clone().cross(ad);
        const adb = ad.clone().cross(ab);
     
        if (this.sameDirection(abc, ao)) {
            // return this.triangle(points = { a, b, c }, direction);
            simplex.assign([ a, b, c ]);
            return this.Triangle(simplex, direction);
        }
            
        if (this.sameDirection(acd, ao)) {
            // return this.Triangle(points = { a, c, d }, direction);
            simplex.assign([ a, c, d ]);
            return this.Triangle(simplex, direction);
        }
     
        if (this.sameDirection(adb, ao)) {
            // return this.Triangle(points = { a, d, b }, direction);
            simplex.assign([ a, d, b ]);
            return this.Triangle(simplex, direction);
        }
     
        return true;
    }

}