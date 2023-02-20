import * as THREE from 'three'
import { Quat } from "./Quaternion";
import { Vec3 } from "./Vec3";
import { Vec2 } from "./Vec2";
import { Pose } from './Pose';
import { Box3, Box3Helper } from 'three';

export enum ColliderType {
    Box, Plane, Sphere, ConvexMesh
};

export class Collider {

    colliderType: ColliderType = ColliderType.Sphere;
    
    vertices: Array<Vec3> = [];
    verticesWorldSpace: Array<Vec3> = [];
    indices: Array<number> = [];
    uniqueIndices: Array<number> = [];
    // relativePos: Vec3 = new Vec3(0.0, 0.0, 0.0);

    aabb = new Box3();
    aabbHelper = new Box3Helper(this.aabb);

    public updateGlobalPose(pose: Pose): void {
        // console.log('updateRotation not implemented')
    }

    /* GJK */
    public findFurthestPoint(dir: Vec3): Vec3 {
        return new Vec3();
    }

};

export class BoxCollider extends Collider {
    size = new Vec3(1.0, 1.0, 1.0);

    constructor(size: Vec3) {
        super();
        this.size = size;
    }
};

export class PlaneCollider extends Collider {
    colliderType = ColliderType.Plane;

    size = new Vec2(1.0, 1.0);
    normal = new Vec3(0.0, 1.0, 0.0);
    normalRef = new Vec3(0.0, 1.0, 0.0);

    plane = new THREE.Plane(new Vec3(0, 1, 0));

    /**
     * @TODO plane distance / constant
     */
    constructor(size: Vec2, normal?: Vec3) {
        super();

        this.size = size;
        
        if (normal) {
            this.normal = normal.normalize();
            this.plane = new THREE.Plane(normal);
        }
        // this.normalRef = this.normalRef.copy(this.normal); // idk?
    }

    override updateGlobalPose(pose: Pose) {
        // this.normalRef.applyQuaternion(pose.q);
    }
};

export class SphereCollider extends Collider {
    colliderType = ColliderType.Sphere;

    radius: number = 1.0;

    constructor(diameter: number) {
        super();

        this.radius = 0.5 * diameter
    }
};

export class MeshCollider extends Collider {
    colliderType = ColliderType.ConvexMesh;

    // override setGeometry(geometry: THREE.BufferGeometry): this {
    setGeometry(whichOne: 'box'|'tetra'|'point', width = 1.0, height = 1.0, depth = 1.0): this {

        // const v = new Vec3();
        // const vPositions = [...geometry.attributes.position.array as Float32Array] as Array<number>;
        // const indices = geometry.index?.array as Uint16Array;

        // // const epsilon = Number.EPSILON * 2;
        // // const uniqueVertices = vPositions.sort().filter((item, index, self) => {
        // //     // Check if the item is a number and if it is outside of the threshold
        // //     if (Math.abs(item - Math.round(self[index - 1])) > epsilon) {
        // //         // Check if the item is not already in the array
        // //         return self.indexOf(item) === index;
        // //     }
        // //     return false;
        // // });

        // // console.log(uniqueVertices);

        // for (let i = 0; i < vPositions.length / 3; i++) {
        //     const vertex = new Vec3().fromArray(vPositions, i * 3);
        //     this.vertices.push(vertex);
        // }

        // if(indices.length > 0) {
        //     this.indices = indices; // not sure if correct
        //     this.uniqueIndices = this.indices.filter((v, i, a) => a.indexOf(v) === i);
        // }
        // // } else if (geometry.vertices.size() > 0) {

        // //     for (int i = 0; i < geometry.vertices.size(); i++) {
        // //         std::cout << "Generating collider indices #INEFFICIENT" << std::endl;
        // //         this->indices.push_back(i);
        // //         this->uniqueIndices.push_back(i);
        // //     }

        // // }

        if (whichOne == 'point') {
            this.vertices = [new Vec3(0, 0, 0)];
            this.indices = [ 0 ];
            this.uniqueIndices = [ 0 ];
        }

        // HACKED cube
        if (whichOne == 'box') {
            this.vertices = [
                new Vec3(-width/2, -height/2, -depth/2), // bottom left back corner
                new Vec3( width/2, -height/2, -depth/2), // bottom right back corner
                new Vec3( width/2,  height/2, -depth/2), // top right back corner
                new Vec3(-width/2,  height/2, -depth/2), // top left back corner
                new Vec3(-width/2, -height/2,  depth/2), // bottom left front corner
                new Vec3( width/2, -height/2,  depth/2), // bottom right front corner
                new Vec3( width/2,  height/2,  depth/2), // top right front corner
                new Vec3(-width/2,  height/2,  depth/2), // top left front corner
            ];

            // this.indices = [ 0, 1, 2, 3, 4, 5, 6, 7 ];
            this.indices = [
                0, 1, 2, // back face
                2, 3, 0,
                1, 5, 6, // right face
                6, 2, 1,
                5, 4, 7, // front face
                7, 6, 5,
                4, 0, 3, // left face
                3, 7, 4,
                3, 2, 6, // top face
                6, 7, 3,
                0, 4, 5, // bottom face
                5, 1, 0
            ];

            this.uniqueIndices = [ 0, 1, 2, 3, 4, 5, 6, 7 ];
        }

        // HACKED tetra
        if (whichOne == 'tetra') {
            const size = width;
            const sqrt8over9 = 0.9428090415820633658 * size;
            const sqrt2over9 = 0.4714045207910316829 * size;
            const sqrt2over3 = 0.8164965809277260327 * size;
            const oneThird = 0.333333333333333333 * size;

            this.vertices = [
                new Vec3(0, -oneThird, sqrt8over9),
                new Vec3(sqrt2over3, -oneThird, -sqrt2over9), 
                new Vec3(-sqrt2over3, -oneThird, -sqrt2over9),
                new Vec3(0, size, 0),
            ];

            this.uniqueIndices = [
                2, 1, 0,
                1, 2, 3,
                0, 3, 2,
                1, 3, 0,
            ];
        }

        for (let i = 0; i < this.vertices.length; i++) {
            this.verticesWorldSpace[i] = this.vertices[i].clone();
        }

        return this;
    }

    public override updateGlobalPose(pose: Pose) {

        const min = new Vec3(Infinity, Infinity, Infinity);
        const max = new Vec3(-Infinity, -Infinity, -Infinity);

        for (let i = 0; i < this.vertices.length; i++) {
            const v = this.vertices[i];

            this.verticesWorldSpace[i]
                .copy(v)
                .applyQuaternion(pose.q)
                .add(pose.p);

            min.min(this.verticesWorldSpace[i]);
            max.max(this.verticesWorldSpace[i]);
        }

        this.aabb.set(min, max);
    }

    /* GJK */
    public override findFurthestPoint(dir: Vec3): Vec3 {
        
        const maxPoint = new Vec3();
        let maxDist = -Infinity;
    
        for (const vertex of this.verticesWorldSpace) {
            const distance = vertex.dot(dir);

            if (distance > maxDist) {
                maxDist = distance;
                maxPoint.copy(vertex);
            }
        }
    
        return maxPoint;
    }
};
