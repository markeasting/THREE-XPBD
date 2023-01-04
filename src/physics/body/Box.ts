import * as THREE from 'three'
import { MeshCollider } from '../Collider';
import { RigidBody } from '../RigidBody';
import { Vec3 } from '../Vec3';

export function Box() {
        
    const boxMesh = new THREE.Mesh(
        new THREE.BoxGeometry(1, 2, 1),
        new THREE.MeshPhongMaterial({
            color: 0xffffff,
        })
    );
    const box = new RigidBody(
        boxMesh,
        new MeshCollider('box')
        // new BoxCollider(new Vec3(1, 2, 1))
    )
    box.setBox(new Vec3(1, 2, 1), 1);
    box.pose.p.set(0, 3, 0);
    
    // box.pose.q.setFromEuler(new THREE.Euler(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI))
    
    return box;
}