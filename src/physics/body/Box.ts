import * as THREE from 'three'
import { MeshCollider } from '../Collider';
import { RigidBody } from '../RigidBody';
import { Vec3 } from '../Vec3';

export function Box(width: number = 1.0, height?: number, depth?: number): RigidBody {
    if (!height) height = width;
    if (!depth)  depth = width;

    const boxMesh = new THREE.Mesh(
        new THREE.BoxGeometry(width, height, depth),
        // new THREE.MeshPhongMaterial({
        //     // color: 0xffffff,
        //     // color: 0x00ffcc,
        //     color: new THREE.Color().setHSL(0.5, 1, 0.5),
        // }),
        new THREE.MeshBasicMaterial({
            color: 0xffffff, // 0x00ffcc,
            wireframe: true,
        })
    );
    
    const box = new RigidBody(
            new MeshCollider()
                .setGeometry('box', width, height, depth)
        )
        .setMesh(boxMesh)
        .setBox(new Vec3(width, height, depth), 1)

    return box;

}
