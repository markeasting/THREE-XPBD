import * as THREE from 'three'
import { Quat } from "./Quaternion";
import { Vec3 } from "./Vec3";
import { Vec2 } from "./Vec2";
import { Pose } from './Pose';
import { Box3, Box3Helper, BufferGeometry, Mesh, MeshBasicMaterial } from 'three';
import { ConvexGeometry } from 'three/examples/jsm/geometries/ConvexGeometry.js';
import * as BufferGeometryUtils from 'three/examples/jsm/utils/BufferGeometryUtils.js';

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

    convexHull: Mesh;

    setGeometry(geometry: BufferGeometry): this {
        
        // if normal and uv attributes are not removed, mergeVertices() 
        // can't consolidate indentical vertices with different normal/uv data
        let strippedGeometry = geometry.clone()
            .deleteAttribute( 'normal' )
            .deleteAttribute( 'uv' );
        strippedGeometry = BufferGeometryUtils.mergeVertices( strippedGeometry );

        const vertices = [];
        const positionAttribute = geometry.getAttribute( 'position' );

        for ( let i = 0; i < positionAttribute.count; i ++ ) {
            const vertex = new Vec3();
            vertex.fromBufferAttribute( positionAttribute, i );
            vertices.push( vertex );
        }

        const convexHull = new ConvexGeometry( vertices );
        const hullPositionAttribute = convexHull.getAttribute( 'position' );

        this.convexHull = new Mesh(
            convexHull,
            new MeshBasicMaterial({
                color: 0x00aaaa,
                wireframe: true,
                wireframeLinewidth: 1
            })
        )

        for ( let i = 0; i < hullPositionAttribute.count; i ++ ) {
            const vertex = new Vec3();
            vertex.fromBufferAttribute( hullPositionAttribute, i );
            this.vertices.push( vertex );
            this.indices.push(i);
            this.uniqueIndices.push(i);
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
