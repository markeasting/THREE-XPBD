import * as THREE from 'three'
import * as CANNON from 'cannon'
import { BaseScene, SceneInterface } from '../core/BaseScene';

export class MyScene extends BaseScene implements SceneInterface {

    torus!: THREE.Mesh;
    sphereBody!: CANNON.Body;

    override init() {
        this.camera.position.setZ(30);

        this.world = new CANNON.World();
        this.world.gravity.set(0, 0, -9.81);
         
        const geometry = new THREE.TorusGeometry(10,3,16,100)
        const material = new THREE.MeshBasicMaterial({color:0xFF6347, wireframe:true});
        this.torus = new THREE.Mesh(geometry, material);
        this.scene.add(this.torus)

        this.sphereBody = new CANNON.Body({
            mass: 5,
            position: new CANNON.Vec3(0, 0, 10),
            shape: new CANNON.Sphere(1.0),
            material: {
                name: 'mat1',
                id: 1,
                friction: 1,
                restitution: 1,
            }
        });

        const groundBody = new CANNON.Body({
            mass: 0,
            shape: new CANNON.Plane(),
            material: {
               name: 'mat2',
               id: 2,
               friction: 1,
               restitution: 0.5,
            }
        });
        
        this.world.addBody(this.sphereBody);
        this.world.addBody(groundBody);
    }

    override update(scene: number, dt: number) {
        this.torus.position.z = this.sphereBody.position.z;
    }

}
