import * as THREE from 'three'
import * as CANNON from 'cannon'
import RigidBody from '../core/RigidBody'

export type CarConfig = {
    x: number;
    y: number;
}

export default class Car {


    // @TODO store meshes and cannon bodies rather than RigidBodies, 
    // Since we also need bodies for suspension geometry and such
    chassis: RigidBody;
    bodies: Array<RigidBody> = [];
    wheels: Array<RigidBody> = [];
    hardpoints: Array<RigidBody> = [];
    
    constraints!: CANNON.DistanceConstraint;

    wheelConfig: any = [
        {
            radius: 0.5,
            width: 0.25,
            position: new CANNON.Vec3(2, 2, 0)
        }
    ]

    constructor(config?: CarConfig) {

        this.chassis = new RigidBody(
            new CANNON.Body({
                mass: 50,
                position: new CANNON.Vec3(0, 0, 5),
                material: {
                    name: 'mat1',
                    id: 1,
                    friction: 1,
                    restitution: 0.5,
                },
                shape: new CANNON.Box(new CANNON.Vec3(4, 1.5, 0.5)),
            }),
            new THREE.Mesh(
                new THREE.BoxGeometry(4, 1.5, 0.5), 
                new THREE.MeshPhongMaterial({
                    color: 0xffffff, 
                })
            ),
        );

        for (let i = 0; i < this.wheelConfig.length; i++) {
            const w = this.wheelConfig[i];

            const q = new CANNON.Quaternion();
            q.setFromAxisAngle(new CANNON.Vec3(1,0,0), Math.PI * 0.5);

            const wheelBody = new CANNON.Body({ 
                mass: 5,
                position: this.chassis.body.position.vadd(w.position),
                material: {
                    name: 'mat3',
                    id: 3,
                    friction: 1,
                    restitution: 1,
                },
            })
            
            wheelBody.addShape(new CANNON.Cylinder(
                w.radius, 
                w.radius, 
                w.width, 
                50 // @TODO check num. segments
            ), undefined, q);

            const wheel = new RigidBody(
                wheelBody,
                new THREE.Mesh(
                    new THREE.CylinderGeometry(
                        w.radius,
                        w.radius,
                        w.width,
                        12
                    ), 
                    new THREE.MeshPhongMaterial({
                        color: 0x777777, 
                    })
                ),
            )
            this.bodies.push(wheel);
            this.wheels.push(wheel);
        }

        this.bodies.push(this.chassis);
    }

    public init(scene: THREE.Scene, world: CANNON.World) {
        for (const b of this.bodies) {
            b.addTo(scene, world);
        }

        const FRONT = 2.5;
        const REAR = 1.5;
        const A_arm_dist = 0.5; // Distance in height between a-arms
        const maxForce = 50;

        // Bottom A-arm, front
        world.addConstraint(new CANNON.PointToPointConstraint(
            this.chassis.body,
            new CANNON.Vec3(0, FRONT, -A_arm_dist/2),
            this.wheels[0].body,
            new CANNON.Vec3(0, 0.5, -A_arm_dist/2),
            maxForce
        ));

        // Bottom A-arm, rear
        world.addConstraint(new CANNON.PointToPointConstraint(
            this.chassis.body,
            new CANNON.Vec3(0, REAR, -A_arm_dist/2),
            this.wheels[0].body,
            new CANNON.Vec3(0, -0.5, -A_arm_dist/2),
            maxForce   
        ));

        // Top A-arm, front
        world.addConstraint(new CANNON.PointToPointConstraint(
            this.chassis.body,
            new CANNON.Vec3(0, FRONT, A_arm_dist/2),
            this.wheels[0].body,
            new CANNON.Vec3(0, 0.5, A_arm_dist/2),
            maxForce   
        ));

        // Top A-arm, rear
        world.addConstraint(new CANNON.PointToPointConstraint(
            this.chassis.body,
            new CANNON.Vec3(0, REAR, A_arm_dist/2),
            this.wheels[0].body,
            new CANNON.Vec3(0, -0.5, A_arm_dist/2),
            maxForce   
        ));


        // @TODO use for suspension hardpoints?
        // const c = new CANNON.DistanceConstraint(
        //     this.chassis.body,
        //     this.wheels[0].body,
        //     3.0,
        //     1.0
        // );

    }
    
    public update(dt: number) {
        for (let i = 0; i < this.bodies.length; i++) {
            this.bodies[i].update();
        }

        // this.bodies[0].body.applyForce(new CANNON.Vec3(1, 1, 0), new CANNON.Vec3(0,0,0))
    }

    private addGeometry() {
    
        // const chassisShape = new CANNON.Box(new CANNON.Vec3(2, 1, 0.5));
        // const chassisBody = new CANNON.Body({ mass: 500 });
        // chassisBody.addShape(chassisShape);
        // chassisBody.position.set(0, 0, 4);
        // chassisBody.angularVelocity.set(0, 0, 0.5);
        // // demo.addVisual(chassisBody);
    
        // const wheelBodies = [];
        // for (var i = 0; i < vehicle.wheelConfig.length; i++) {
        //     var wheel = vehicle.wheelConfig[i];
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
