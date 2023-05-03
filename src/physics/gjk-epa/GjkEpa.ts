import { ArrowHelper, BufferAttribute, BufferGeometry, Mesh, MeshBasicMaterial, Vector4 } from "three";
import { ConvexGeometry } from 'three/examples/jsm/geometries/ConvexGeometry.js';
import { Game } from "../../core/Game";
import { Collider } from "../Collider"
import { Vec3 } from "../Vec3"
import { Simplex } from "./Simplex";
import { Support } from "./Support";

/**
 * https://blog.winter.dev/2020/gjk-algorithm/
 * 
 * https://cs.brown.edu/courses/cs195u/lectures/04_advancedCollisionsAndPhysics.pdf
 * https://stackoverflow.com/questions/31764305/im-implementing-the-expanding-polytope-algorithm-and-i-am-unsure-how-to-deduce
 * 
 * http://www.goblinphysics.com/documentation/files/src_classes_Collision_GjkEpa2.js.html
 * https://github.com/felipeek/raw-physics/blob/master/src/physics/epa.cpp
 */
export class GjkEpa {

    static MAX_GJK_ITERS = 32;
    static MAX_EPA_ITERS = 16;

    private debugMinkowski: Mesh;
    private debugSimplex: Mesh;
    private debugPolytope: Mesh;
    private debugNormal = new ArrowHelper();

    private debug = false;

    constructor() {
        Game.gui.solver.add(this, 'debug').name('Debug GJK / EPA');
    }

    public GJK(
        colliderA: Collider,
        colliderB: Collider,
    ): Simplex | undefined {

        /**
         * We need at least one vertex to start, so we’ll manually add it. 
         * The search direction for the first vertex doesn’t matter, but you 
         * may get less iterations with a smarter choice. 
         */
        const support = this.support(colliderA, colliderB, new Vec3(0, 1, 0));

        /* Simplex is an array of points, max count is 4 */
        const simplex = new Simplex();
        simplex.push_front(support);

        /* New direction is towards the origin */
        const direction = support.point.clone().negate();

        while (GjkEpa.MAX_GJK_ITERS) {

            /**
             * In a loop, we’ll add another point. 
             * 
             * The exit condition is that this new point is not in front 
             * of the search direction. This would exit if the direction 
             * finds a vertex that was already the furthest one along it.
             */

            const support = this.support(colliderA, colliderB, direction);

            if (support.point.dot(direction) <= 0)
                return; /* No collision */

            simplex.push_front(support);

            /** 
             * Now that we have a line, we’ll feed it into a function that 
             * updates the simplex and search direction. 
             * It’ll return true or false to signify a collision.
             */
            if (this.nextSimplex(simplex, direction)) {
                // return true;
                return simplex;
            }
        }
    }

    /**
     * Returns the vertex on the Minkowski difference
     */
    public support(
        colliderA: Collider,
        colliderB: Collider,
        direction: Vec3
    ): Support {

        const witnessA = colliderA.findFurthestPoint(direction);
        const witnessB = colliderB.findFurthestPoint(direction.clone().negate());

        return new Support(witnessA, witnessB);
    }

    private nextSimplex(
        simplex: Simplex,
        direction: Vec3
    ) {

        switch (simplex.size) {
            case 2: return this.Line(simplex, direction);
            case 3: return this.Triangle(simplex, direction);
            case 4: return this.Tetrahedron(simplex, direction);
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

        const ab = new Vec3().subVectors(b.point, a.point);
        const ao = a.point.clone().negate();

        if (this.sameDirection(ab, ao)) {
            direction.copy(ab.clone().cross(ao).clone().cross(ab));
        } else {
            simplex.assign([a]);
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

        const ab = new Vec3().subVectors(b.point, a.point);
        const ac = new Vec3().subVectors(c.point, a.point);
        const ao = a.point.clone().negate();

        const abc = ab.clone().cross(ac);

        if (this.sameDirection(abc.clone().cross(ac), ao)) {

            if (this.sameDirection(ac, ao)) {
                simplex.assign([a, c]);
                direction.copy(ac.clone().cross(ao).clone().cross(ac));

            } else {
                simplex.assign([a, c]);
                return this.Line(simplex, direction);
            }

        } else {
            if (this.sameDirection(ab.clone().cross(abc), ao)) {
                simplex.assign([a, b]);
                return this.Line(simplex, direction);
            }

            else {
                if (this.sameDirection(abc, ao)) {
                    direction.copy(abc);
                } else {
                    simplex.assign([a, c, b]);
                    direction.copy(abc.negate());
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

        const ab = new Vec3().subVectors(b.point, a.point);
        const ac = new Vec3().subVectors(c.point, a.point);
        const ad = new Vec3().subVectors(d.point, a.point);
        const ao = a.point.clone().negate();

        const abc = ab.clone().cross(ac);
        const acd = ac.clone().cross(ad);
        const adb = ad.clone().cross(ab);

        if (this.sameDirection(abc, ao)) {
            simplex.assign([a, b, c]);
            return this.Triangle(simplex, direction);
        }

        if (this.sameDirection(acd, ao)) {
            simplex.assign([a, c, d]);
            return this.Triangle(simplex, direction);
        }

        if (this.sameDirection(adb, ao)) {
            simplex.assign([a, d, b]);
            return this.Triangle(simplex, direction);
        }

        return true;
    }



    /**
     * EPA algorithm
     * 
     * https://github.com/IainWinter/IwEngine/blob/master/IwEngine/src/physics/impl/GJK.cpp
     */
    public EPA(
        simplex: Simplex,
        colliderA: Collider,
        colliderB: Collider
    ) {

        const polytope: Support[] = [];

        for (let i = 0; i < simplex.size; i++)
            polytope.push(simplex.points[i]);

        const faces = [
            0, 1, 2,
            0, 3, 1,
            0, 2, 3,
            1, 3, 2
        ];

        let { 
            normals, 
            minTriangle: minFace, 
            polygon: minPolygon 
        } = this.getFaceNormals(polytope, faces);

        const minNormal = new Vec3();
        let minDistance = Infinity;

        let iterations = 0;
        while (minDistance == Infinity) {

            minNormal.set(normals[minFace].x, normals[minFace].y, normals[minFace].z);
            minDistance = normals[minFace].w;

            if (iterations++ > GjkEpa.MAX_EPA_ITERS) {
                // console.error('Too many EPA iterations')
                break;
            }

            // const support = this.support(colliderA, colliderB, minNormal);
            const witnessA = colliderA.findFurthestPoint(minNormal);
            const witnessB = colliderB.findFurthestPoint(minNormal.clone().negate());

            const support = new Support(witnessA, witnessB);

            const sDistance = minNormal.dot(support.point);

            if (Math.abs(sDistance - minDistance) > 0.001) {
                minDistance = Infinity;

                const uniqueEdges: Array<[number, number]> = [];

                for (let i = 0; i < normals.length; i++) {
                    const n = new Vec3(normals[i].x, normals[i].y, normals[i].z);

                    if (this.sameDirection(n, support.point)) {
                        const f = i * 3;

                        this.addIfUniqueEdge(uniqueEdges, faces, f + 0, f + 1);
                        this.addIfUniqueEdge(uniqueEdges, faces, f + 1, f + 2);
                        this.addIfUniqueEdge(uniqueEdges, faces, f + 2, f + 0);

                        faces[f + 2] = faces[faces.length - 1]; faces.pop();
                        faces[f + 1] = faces[faces.length - 1]; faces.pop();
                        faces[f + 0] = faces[faces.length - 1]; faces.pop();

                        normals[i].copy(normals[normals.length - 1]); normals.pop();

                        i--;
                    }
                }

                if (uniqueEdges.length == 0)
                    break;

                const newFaces: Array<number> = [];

                for (const [edge1, edge2] of uniqueEdges) {
                    newFaces.push(edge1);
                    newFaces.push(edge2);
                    newFaces.push(polytope.length);
                }

                polytope.push(support);

                const {
                    normals: newNormals,
                    minTriangle: newMinFace,
                    polygon: newPolygon,
                } = this.getFaceNormals(polytope, newFaces);

                let newMinDistance = Infinity;

                for (let i = 0; i < normals.length; i++) {
                    if (normals[i].w < newMinDistance) {
                        newMinDistance = normals[i].w;
                        minFace = i;
                    }
                }

                if (newNormals[newMinFace].w < newMinDistance) {
                    minFace = newMinFace + normals.length;
                    minPolygon = newPolygon;
                }

                faces.push(...newFaces);
                normals.push(...newNormals);
            }
        }

        if (minDistance == Infinity)
            return;

        /* Debugging */
        if (this.debugMinkowski) Game.scene?.scene.remove(this.debugMinkowski);
        if (this.debugPolytope)  Game.scene?.scene.remove(this.debugPolytope);
        if (this.debugNormal)  Game.scene?.scene.remove(this.debugNormal);
            
        /* Debug normal */
        if (Game.debugOverlay && this.debug) {
            this.debugNormal = new ArrowHelper(minNormal);
            this.debugNormal.setColor(0x00ffff);

            Game.scene?.scene.add(this.debugNormal);
        }
        
        /* Minkowski difference */
        if (Game.debugOverlay && this.debug) {

            const newVertices: Vec3[] = [];

            colliderA.verticesWorldSpace.forEach((v1) => {
                colliderB.verticesWorldSpace.forEach((v2) => {
                    const newVertex = new Vec3(
                        v1.x - v2.x,
                        v1.y - v2.y,
                        v1.z - v2.z
                    );
                    newVertices.push(newVertex);
                });
            });

            // create a new convex mesh using the new vertices
            this.debugMinkowski = new Mesh(
                new ConvexGeometry(newVertices),
                new MeshBasicMaterial({ color: 0x444444, wireframe: true, wireframeLinewidth: 3, transparent: true, opacity: 0.5 })
            )
            Game.scene?.scene.add(this.debugMinkowski);
        }

        /* Debug polytope */
        if (Game.debugOverlay && this.debug) {
            const points = polytope;
            const bufferGeometry = new BufferGeometry();

            const indices = new Uint32Array(faces);
            const positions = new Float32Array(points.length * 3);
            points.forEach((support, i) => {
                positions[i * 3] = support.point.x;
                positions[i * 3 + 1] = support.point.y;
                positions[i * 3 + 2] = support.point.z;
            });

            bufferGeometry.setAttribute('position', new BufferAttribute(positions, 3));
            bufferGeometry.setIndex(new BufferAttribute(indices, 1));

            this.debugPolytope = new Mesh(bufferGeometry, new MeshBasicMaterial({ color: 0xff0000, wireframe: true, wireframeLinewidth: 3, transparent: true, opacity: 0.5 }));
            Game.scene?.scene.add(this.debugPolytope);
        }
        
        /* Contact point (v) */
        const contactPoint = Vec3.mul(minNormal, minDistance);
        
        /* Triangle on the Minkowski boundary that contains v */
        const barycentric = this.computeBarycentricCoordinates(contactPoint, minPolygon);

        /* Find contact point on the original shapes */
        let a = new Vec3().addScaledVector( minPolygon[0].witnessA, barycentric.x );
        let b = new Vec3().addScaledVector( minPolygon[1].witnessA, barycentric.y );
        let c = new Vec3().addScaledVector( minPolygon[2].witnessA, barycentric.z );
        const p1 = Vec3.add( a, b ).add( c );

        a = new Vec3().addScaledVector( minPolygon[0].witnessB, barycentric.x );
        b = new Vec3().addScaledVector( minPolygon[1].witnessB, barycentric.y );
        c = new Vec3().addScaledVector( minPolygon[2].witnessB, barycentric.z );
        const p2 = Vec3.add( a, b ).add( c );

        return {
            normal: minNormal,
            p1,
            p2,
            d: minDistance
        };
    }

    private computeBarycentricCoordinates(P: Vec3, polygon: Support[]): Vec3 {

        const A = polygon[0].point;
        const B = polygon[1].point;
        const C = polygon[2].point;

        const v0 = B.clone().sub(A);
        const v1 = C.clone().sub(A);
        const v2 = P.clone().sub(A);
        
        const dot00 = v0.dot(v0);
        const dot01 = v0.dot(v1);
        const dot02 = v0.dot(v2);
        const dot11 = v1.dot(v1);
        const dot12 = v1.dot(v2);
        
        const denom = dot00 * dot11 - dot01 * dot01;
        const v = (dot11 * dot02 - dot01 * dot12) / denom;
        const w = (dot00 * dot12 - dot01 * dot02) / denom;
        const u = 1.0 - v - w;
        
        return new Vec3(u, v, w);
    }

    private getFaceNormals(
        polytope: Support[],
        faces: number[]
    ) {

        const normals: Vector4[] = [];
        let minTriangle = 0;
        let minDistance = Infinity;
        
        let polygon: Support[] = [];

        for (let i = 0; i < faces.length; i += 3) {
            const a = polytope[faces[i + 0]];
            const b = polytope[faces[i + 1]];
            const c = polytope[faces[i + 2]];

            const normal = new Vec3()
                .subVectors(b.point, a.point)
                .cross(c.point.clone().sub(a.point))
                .normalize();

            let distance = normal.dot(a.point);

            if (distance < 0) {
                normal.negate();
                distance *= -1;
            }

            normals.push(new Vector4(
                normal.x,
                normal.y,
                normal.z,
                distance
            ));

            if (distance < minDistance) {
                minTriangle = i / 3;
                minDistance = distance;

                polygon[0] = a;
                polygon[1] = b;
                polygon[2] = c;
            }
        }

        return { 
            normals, 
            minTriangle, 
            polygon 
        };
    }

    private addIfUniqueEdge(
        edges: Array<[number, number]>,
        faces: Array<number>,
        a: number,
        b: number
    ): void {

        //      0--<--3
        //     / \ B /   A: 2-0
        //    / A \ /    B: 0-2
        //   1-->--2

        const reverse = edges.find(edge => edge[0] === faces[b] && edge[1] === faces[a]);

        if (reverse !== undefined) {
            const index = edges.indexOf(reverse);
            edges.splice(index, 1);
        } else {
            edges.push([faces[a], faces[b]]);
        }
    }

}
