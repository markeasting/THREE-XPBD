import * as THREE from 'three'
import { MeshCollider } from '../Collider';
import { RigidBody } from '../RigidBody';
import { Vec3 } from '../Vec3';

export function Box() {

    const boxMesh = new THREE.Mesh(
        new THREE.BoxGeometry(1, 2, 1),
        // new THREE.MeshPhongMaterial({
        //     color: 0xffffff,
        //     wireframe: true,
        // }),
        new THREE.MeshBasicMaterial({
            color: 0xffffff,
            wireframe: true,
        })
    );
    const box = new RigidBody(
        boxMesh,
        new MeshCollider('box')
        // new BoxCollider(new Vec3(1, 2, 1))
    )
    box.setBox(new Vec3(1, 2, 1), 1);

    return box;
}