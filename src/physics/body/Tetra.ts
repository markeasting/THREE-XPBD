import * as THREE from 'three'
import { MeshCollider } from '../Collider';
import { RigidBody } from '../RigidBody';
import { Vec3 } from '../Vec3';

export function Tetra(size: number = 1.0): RigidBody {
        
    const tetraMesh = new THREE.Mesh(
        new THREE.TetrahedronGeometry(size, 0),
        new THREE.MeshPhongMaterial({
            // color: 0xffffff,
            color: 0x00ffcc,
        }),
    );

    const vPositions = [...tetraMesh.geometry.attributes.position.array as Float32Array] as Array<number>;
    const indices = tetraMesh.geometry.index?.array as Uint16Array;
    console.log(vPositions, indices);

    const tetra = new RigidBody(new MeshCollider().setGeometry('tetra'))
        .setMesh(tetraMesh)
        // .setBox(new Vec3(size, size, size), 1); // @TODO tetra inertia

    return tetra;
}
