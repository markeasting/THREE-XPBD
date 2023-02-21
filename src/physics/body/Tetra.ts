import * as THREE from 'three'
import { MeshCollider } from '../Collider';
import { RigidBody } from '../RigidBody';
import { Vec3 } from '../Vec3';

export function Tetra(size: number = 1.0): RigidBody {
        
    const tetraMesh = new THREE.Mesh(
        new THREE.TetrahedronGeometry(size, 0),
        new THREE.MeshPhongMaterial({
            // color: 0xffffff,
            color: new THREE.Color().setHSL(0.5, 1, 0.5),
        }),
    );

    const tetra = new RigidBody(new MeshCollider().setGeometry(tetraMesh.geometry))
        .setMesh(tetraMesh)
        // .setBox(new Vec3(size, size, size), 1); // @TODO tetra inertia

    return tetra;
}
