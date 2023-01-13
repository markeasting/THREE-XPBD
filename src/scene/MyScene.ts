import * as THREE from 'three'
import { PointLight } from '../light/PointLight';
import { BaseScene } from './BaseScene';
import { BaseLightingScene } from './BaseLightingScene';
import { RigidBody } from '../physics/RigidBody';
import { BoxCollider, MeshCollider, PlaneCollider } from '../physics/Collider';
import { Vec3 } from '../physics/Vec3';
import { CoordinateSystem } from '../physics/CoordinateSystem';
import { Vec2 } from '../physics/Vec2';
import { AthmosphereScene } from './AthmosphereScene';
import { Box } from '../physics/body/Box';
import { Tetra } from '../physics/body/Tetra';
import { OmgScene } from './OmgScene';
import { Pose } from '../physics/Pose';
import { Joint, JointType } from '../physics/constraint/Joint';
import { Constraint } from '../physics/constraint/Constraint';
import { Attachment } from '../physics/constraint/Attachment';
import { AlignOrientation } from '../physics/constraint/AlignOrientation';
import { AlignAxes } from '../physics/constraint/AlignAxes';
import { Euler } from 'three';

export class MyScene extends BaseScene {

    constructor() {
        super();
    }

    override init() {
        const lookAt = new Vec3(0, 1, 0);
        this.camera.lookAt(lookAt);
        this.orbitControls.target.copy(lookAt);
        this.orbitControls.update();

        this.insert(new BaseLightingScene);

        this.addGeometry();
    }

    private addGeometry() {
        
        // for (let index = 0; index < 2; index++) {
        //     const b = Box(1, 2, 1);
        //     b.pose.p.set(
        //         Math.random() * 8 - 4,
        //         Math.random() * 2 + 3,
        //         Math.random() * 8 - 4
        //     );
        //     // b.pose.p.set(-1.5, 5.5, 1);
        //     // b.pose.q.setFromEuler(new THREE.Euler(0.5, Math.PI, 0.5));
        //     b.pose.q.setFromEuler(new THREE.Euler(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI))
        //     this.addBody(b);
        // }
        let b0, b1;

        // Hinge
        b0 = Box(2, 1, 0.08).setPos(0, 1.5, 1);
        b1 = Box(2, 0.08, 1).setPos(0, 2, 0.5).setStatic();
        this.addBody(b0);
        this.addBody(b1);

        this.world.addConstraint(
            new Constraint(b0, b1)
            .add(new Attachment(new Vec3(0, 0, 0.5), new Vec3(0, 0.5, 0)))
            .add(new AlignAxes)
        );



        // Hammer
        b0 = Box(0.2, 0.2, 7).setPos(0, 2, 3)
        b1 = Box(2, 1, 1).setPos(0, 2, 0.5)
        this.addBody(b0);
        this.addBody(b1);

        this.world.addConstraint(
            new Constraint(b0, b1)
            .add(new Attachment(new Vec3(0.1, 0, 0.5), new Vec3(0, 0, -2)))
            .add(new AlignOrientation)
        );
        
        this.world.addConstraint(
            new Constraint(b0, b1)
            .add(new Attachment(new Vec3(0.1, 0, -0.5), new Vec3(0, 0, -3)))
            // .add(new AlignOrientation)
        );




        this.addGround();

    }

    public update(time: number, dt: number, keys: Record<string, boolean>): void {

        if (keys.KeyQ) {
            const body = this.world.bodies[1];
            const tetraPointL = new Vec3(0, 0, 0.5);
            const tetraPointW = CoordinateSystem.localToWorld(tetraPointL, body.pose.q, body.pose.p);

            // @TODO add applyForceLocal()
            const strength = 3;
            body.applyForceW(
                new Vec3(0, body.mass * this.world.gravity.y * -strength, 0),
                tetraPointW
            );
        }

        if (keys.KeyA) {
            const body = this.world.bodies[0];
            const tetraPointL = new Vec3(0, 0, 0);
            const tetraPointW = CoordinateSystem.localToWorld(tetraPointL, body.pose.q, body.pose.p);

            const strength = 3;
            body.applyForceW(
                new Vec3(0, 0, body.mass * this.world.gravity.y * -strength),
                tetraPointW
            );
        }
    }

    private addGround() {
        const ground = new RigidBody(
            new PlaneCollider(new Vec2(100, 100)),
            new THREE.Mesh(
                new THREE.PlaneGeometry(0.1, 0.1, 5, 5),
                new THREE.MeshPhongMaterial({
                    color: 0xffffff,
                    // wireframe: true,
                })
            )
        );
        ground.pose.q.setFromEuler(new THREE.Euler(-Math.PI / 2, 0, 0))
        ground.pose.p.copy(new Vec3(0, 0, 0));
        ground.setStatic();

        this.addBody(ground);
    }

}
