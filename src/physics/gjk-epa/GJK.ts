import { BufferAttribute, BufferGeometry, Mesh, MeshBasicMaterial, Vector4 } from "three";
import { Game } from "../../core/Game";
import { Collider } from "../Collider"
import { Vec3 } from "../Vec3"
import { Simplex } from "./Simplex";

/**
 * Based on this amazing guide: 
 * 
 * https://blog.winter.dev/2020/gjk-algorithm/
 * 
 * https://github.com/felipeek/raw-physics/blob/master/src/physics/epa.cpp
 */
export class GJK {

    private debugMesh: Mesh;

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
                simplex.assign([a, c]);
                direction.copy(ac.clone().cross(ao).clone().cross(ac));

            } else {
                // return this.Line(points = { a, b }, direction);
                simplex.assign([a, c]);
                return this.Line(simplex, direction);
            }

        } else {
            if (this.sameDirection(ab.clone().cross(abc), ao)) {
                // return Line(points = { a, b }, direction);
                simplex.assign([a, b]);
                return this.Line(simplex, direction);
            }

            else {
                if (this.sameDirection(abc, ao)) {
                    // direction = abc;
                    direction.copy(abc);
                } else {
                    // points = { a, c, b };
                    // direction = -abc;
                    simplex.assign([a, c, b]);
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
            simplex.assign([a, b, c]);
            return this.Triangle(simplex, direction);
        }

        if (this.sameDirection(acd, ao)) {
            // return this.Triangle(points = { a, c, d }, direction);
            simplex.assign([a, c, d]);
            return this.Triangle(simplex, direction);
        }

        if (this.sameDirection(adb, ao)) {
            // return this.Triangle(points = { a, d, b }, direction);
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

        const polytope: Vec3[] = [];

        // Not sure whether to use size or points.length here
        for (let i = 0; i < simplex.size; i++)
            polytope.push(simplex.points[i].clone());

        const faces = [
            0, 1, 2,
            0, 3, 1,
            0, 2, 3,
            1, 3, 2
        ];

        // list: vector4(normal, distance), index: min distance
        let { normals, minTriangle: minFace } = this.getFaceNormals(polytope, faces);

        const minNormal = new Vec3();
        let minDistance = Infinity;

        let iterations = 0;
        while (minDistance == Infinity) {

            minNormal.set(normals[minFace].x, normals[minFace].y, normals[minFace].z);
            minDistance = normals[minFace].w;

            if (iterations++ > 100) {
                console.error('Too many EPA iterations')
                break;
            }

            const support = this.support(colliderA, colliderB, minNormal);
            let sDistance = minNormal.dot(support);

            if (Math.abs(sDistance - minDistance) > 0.001) {
                minDistance = Infinity;

                // std::vector<std::pair<size_t, size_t>> uniqueEdges;
                const uniqueEdges: Array<[number, number]> = [];

                for (let i = 0; i < normals.length; i++) {
                    const n = new Vec3(normals[i].x, normals[i].y, normals[i].z);

                    if (this.sameDirection(n, support)) {
                        const f = i * 3;

                        this.addIfUniqueEdge(uniqueEdges, faces, f + 0, f + 1);
                        this.addIfUniqueEdge(uniqueEdges, faces, f + 1, f + 2);
                        this.addIfUniqueEdge(uniqueEdges, faces, f + 2, f + 0);

                        // faces[f + 2] = faces.back(); faces.pop_back();
                        // faces[f + 1] = faces.back(); faces.pop_back();
                        // faces[f    ] = faces.back(); faces.pop_back();
                        faces[f + 2] = faces[faces.length - 1]; faces.pop();
                        faces[f + 1] = faces[faces.length - 1]; faces.pop();
                        faces[f + 0] = faces[faces.length - 1]; faces.pop();

                        // normals[i] = normals.back(); normals.pop_back();
                        // normals[i] = normals[normals.length - 1]; normals.pop();
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
                    minTriangle: newMinFace
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
                }

                // faces  .insert(faces  .end(), newFaces  .begin(), newFaces  .end());
                // normals.insert(normals.end(), newNormals.begin(), newNormals.end());
                faces.push(...newFaces);
                normals.push(...newNormals);
            }
        }

        if (minDistance == Infinity)
            return;

        /* Debugging */
        const points = polytope;
        const bufferGeometry = new BufferGeometry();

        const indices = new Uint32Array(faces);
        const positions = new Float32Array(points.length * 3);
        points.forEach((point, i) => {
          positions[i * 3] = point.x;
          positions[i * 3 + 1] = point.y;
          positions[i * 3 + 2] = point.z;
        });
        
        bufferGeometry.setAttribute('position', new BufferAttribute(positions, 3));
        bufferGeometry.setIndex(new BufferAttribute(indices, 1));

        if (this.debugMesh) 
            Game.scene?.scene.remove(this.debugMesh);
        this.debugMesh = new Mesh(bufferGeometry, new MeshBasicMaterial({ color: 0xff0000, wireframe: true }));
        Game.scene?.scene.add(this.debugMesh);

        return {
            normal: minNormal,
            d: minDistance + 0.001
        };

    }

    private getFaceNormals(
        polytope: Vec3[],
        faces: number[]
    ) {

        const normals: Vector4[] = [];
        let minTriangle = 0;
        let minDistance = Infinity;

        for (let i = 0; i < faces.length; i += 3) {
            const a = polytope[faces[i + 0]];
            const b = polytope[faces[i + 1]];
            const c = polytope[faces[i + 2]];

            // const normal = (b - a).cross(c - a).normalized();
            const normal = new Vec3()
                .subVectors(b, a)
                .cross(c.clone().sub(a))
                .normalize();

            let distance = normal.dot(a);

            if (distance < 0) {
                normal.multiplyScalar(-1.0);
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
            }
        }

        return { normals, minTriangle };
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

        // const reverse = edges.find(([a, b]) => a === faces[b] && b === faces[a]);

        // if (reverse !== undefined) {
        //     edges.splice(edges.indexOf(reverse), 1);
        // } else {
        //     edges.push([faces[a], faces[b]]);
        // }
    }

}
