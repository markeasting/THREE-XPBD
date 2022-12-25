import { BaseScene } from "../scene/BaseScene";


export default class RigidBody {

    public mesh: THREE.Mesh;
    public body: CANNON.Body;

    constructor(mesh: THREE.Mesh, body: CANNON.Body) {
        this.mesh = mesh;
        this.body = body;
    }

    public update() {
        const bodyPos = this.body.position;

        this.mesh.position.set(
            bodyPos.x,
            bodyPos.y,
            bodyPos.z,
        );
    }

    public addTo(scene: THREE.Scene) {
        scene.add(this.mesh);
    }

}
