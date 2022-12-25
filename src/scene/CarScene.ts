import * as THREE from 'three'
import * as CANNON from 'cannon'
import { BaseLightingScene } from './BaseLightingScene';
import { BaseScene } from './BaseScene';
import Car from '../entity/Car';

export class CarScene extends BaseScene {

    car: Car;

    sphereBody: CANNON.Body;

    constructor() {
        super();

        this.camera.position.set(1, 1.5, 1.5)
        this.camera.lookAt(0,0,0);

        this.insert(new BaseLightingScene);

        this.world.broadphase = new CANNON.SAPBroadphase(this.world);
        this.world.gravity.set(0, 0, -9.81);
        this.world.defaultContactMaterial.friction = 0;

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

        this.car = new Car(this.scene, {});

        this.sphereBody = new CANNON.Body({
            mass: 5,
            position: new CANNON.Vec3(0, 0, 20),
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

    public update(time: number, dt: number): void {
        this.car.update(dt);

        console.log(this.sphereBody.position);
    }

}
