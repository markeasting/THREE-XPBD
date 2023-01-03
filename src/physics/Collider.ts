import { Quat } from "./Quaternion";
import { Vec3 } from "./Vec3";
import { Vec2 } from "./Vec2";

export enum ColliderType {
    Box, Plane, Sphere, ConvexMesh
};

export class Collider {

    colliderType: ColliderType = ColliderType.Sphere;

    // polygons: Array<any> = []; // Array<Polygon>;
    vertices: Array<Vec3> = []; // Array<Vertex>;
    indices: Uint16Array = new Uint16Array();
    uniqueIndices: Uint16Array = new Uint16Array();

    relativePos: Vec3 = new Vec3(0.0, 0.0, 0.0);

    public setGeometry(geometry: THREE.BufferGeometry): void {
        console.log('Not supported');
    }

    public updateRotation(q: Quat): void {

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
    normal = new Vec3(0.0, 0.0, 1.0);
    normalRef = new Vec3(0.0, 0.0, 1.0);

    constructor(size: Vec2, normal = new Vec3(0.0, 0.0, 1.0)) {
        super();

        this.size = size;
        this.normal = normal.normalize();
        // this.normalRef = this.normalRef.copy(this.normal); // idk?
    }

    override updateRotation(q: Quat) {
        this.normalRef.applyQuaternion(q);
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

    constructor(geometry: THREE.BufferGeometry) {
        super();

        this.setGeometry(geometry);
    }

    override setGeometry(geometry: THREE.BufferGeometry): void {

        const v = new Vec3();
        const vPositions = geometry.attributes.position.array as Float32Array;
        const indices = geometry.index?.array as Uint16Array;

        for (const v of vPositions) {
            const vertex = new Vec3().fromArray(vPositions, 1 * 3);
            this.vertices.push(vertex);
        }

        if(indices.length > 0) {
            this.indices = indices; // not sure if correct
            this.uniqueIndices = this.indices.filter((v, i, a) => a.indexOf(v) === i);
        }
        // } else if (geometry.vertices.size() > 0) {

        //     for (int i = 0; i < geometry.vertices.size(); i++) {
        //         std::cout << "Generating collider indices #INEFFICIENT" << std::endl;
        //         this->indices.push_back(i);
        //         this->uniqueIndices.push_back(i);
        //     }

        // }
    }
};
