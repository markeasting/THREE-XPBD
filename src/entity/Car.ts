import * as THREE from 'three'
import * as CANNON from 'cannon'
import RigidBody from '../core/RigidBody'
import { BaseScene } from '../scene/BaseScene';

export type CarConfig = {
    x: number;
    y: number;
}

export default class Car {

    body: RigidBody;
    bodies: Array<RigidBody> = [];

    // @TODO maybe store meshes and cannon bodies seperately 

    constructor(scene: THREE.Scene, config: CarConfig) {

        // const chassisShape = new CANNON.Box(new CANNON.Vec3(2, 1, 0.5));
        // const chassisBody = new CANNON.Body({ 
        //     position: new CANNON.Vec3(0, 10, 0),
        //     mass: 1 
        // });
        // chassisBody.addShape(chassisShape);

        const chassisBody = new CANNON.Body({
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

        this.body = new RigidBody(
            new THREE.Mesh(
                new THREE.BoxGeometry(1, 2, 1), 
                new THREE.MeshPhongMaterial({
                    color: 0xffffff, 
                })
            ),
            chassisBody
        );

        this.body.addTo(scene);

        this.bodies.push(this.body);
    }
    
    public update(dt: number) {
        for (let i = 0; i < this.bodies.length; i++) {
            this.bodies[i].update();
        }

        this.bodies[0].body.applyForce(new CANNON.Vec3(1, 1, 0), new CANNON.Vec3(0,0,0))
    }

    private addGeometry() {
    
        // const chassisShape = new CANNON.Box(new CANNON.Vec3(2, 1, 0.5));
        // const chassisBody = new CANNON.Body({ mass: 500 });
        // chassisBody.addShape(chassisShape);
        // chassisBody.position.set(0, 0, 4);
        // chassisBody.angularVelocity.set(0, 0, 0.5);
        // // demo.addVisual(chassisBody);
    
        // const wheelBodies = [];
        // for (var i = 0; i < vehicle.wheelInfos.length; i++) {
        //     var wheel = vehicle.wheelInfos[i];
        //     var cylinderShape = new CANNON.Cylinder(wheel.radius, wheel.radius, wheel.radius / 2, 20);
        //     var wheelBody = new CANNON.Body({ mass: 1 });
        //     var q = new CANNON.Quaternion();
        //     q.setFromAxisAngle(new CANNON.Vec3(1, 0, 0), Math.PI / 2);
        //     wheelBody.addShape(cylinderShape, new CANNON.Vec3(), q);
        //     wheelBodies.push(wheelBody);
        //     demo.addVisual(wheelBody);
        // }
    }

}
