import * as THREE from 'three'
import * as CANNON from 'cannon'
import { BaseScene } from "../scene/BaseScene";

export default class RigidBody {

    public mesh: THREE.Mesh;
    public body: CANNON.Body;

    constructor(body: CANNON.Body, mesh: THREE.Mesh) {
        this.mesh = mesh;
        this.body = body;

        this.mesh.castShadow = true;
    }

    public update() {
        const p = this.body.position;
        const q = this.body.quaternion;

        this.mesh.position.set(p.x, p.y, p.z);
        // this.mesh.quaternion.set(q.x, q.y, q.z, q.w);
        this.mesh.rotation.setFromQuaternion(
            new THREE.Quaternion(q.x, q.y, q.z, q.w)
        );

    }

    public addTo(scene: THREE.Scene, world: CANNON.World) {
        scene.add(this.mesh);
        world.addBody(this.body);
    }

}
