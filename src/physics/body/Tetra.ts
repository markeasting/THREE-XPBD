import * as THREE from 'three'
import { MeshCollider } from '../Collider';
import { RigidBody } from '../RigidBody';
import { Vec3 } from '../Vec3';

export function Tetra() {
        
    const boxMesh = new THREE.Mesh(
        new THREE.TetrahedronGeometry(1, 0),
        new THREE.MeshPhongMaterial({
            color: 0xffffff,
        })
    );
    const box = new RigidBody(
        boxMesh,
        new MeshCollider('tetra')
    )
    box.setBox(new Vec3(1, 1, 1), 1);
    
    return box;
}