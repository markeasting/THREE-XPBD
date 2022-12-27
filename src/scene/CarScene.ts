import * as THREE from 'three'
import * as CANNON from 'cannon'
import { AthmosphereScene } from './AthmosphereScene';
import { BaseScene } from './BaseScene';
import Car from '../entity/Car';
import RigidBody from '../core/RigidBody';
import { BaseLightingScene } from './BaseLightingScene';

export class CarScene extends BaseScene {

    car: Car;

    constructor() {
        super();

        this.camera.position.set(10, 10, 10)
        this.camera.lookAt(0,0,0);

        // this.insert(new AthmosphereScene);
        AthmosphereScene.add(this.scene);
        this.scene.fog = new THREE.Fog( 0xffffff, 1, 300 );

        // var groundMaterial = new CANNON.Material('groundMaterial');
        // var wheelMaterial = new CANNON.Material('wheelMaterial');
        // var wheelGroundContactMaterial = new CANNON.ContactMaterial(
        //     wheelMaterial, 
        //     groundMaterial, 
        //     {
        //         friction: 0.3,
        //         restitution: 0,
        //         contactEquationStiffness: 1000
        //     }
        // );
    
        // this.world.addContactMaterial(wheelGroundContactMaterial);

        this.car = new Car();
        this.car.init(this.scene, this.world);
        
        const groundBody = new CANNON.Body({
            mass: 0,
            shape: new CANNON.Plane(),
            material: {
               name: 'mat2',
               id: 2,
               friction: 1,
               restitution: 0.9,
            }
        });
        
        this.world.addBody(groundBody);
    }

    public update(time: number, dt: number): void {
        this.car.update(dt);

        // this.sphereBody.update();
    }

}
