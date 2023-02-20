import * as THREE from 'three'
import { BaseScene } from './BaseScene';
import { BaseLightingScene } from './BaseLightingScene';
import { RigidBody } from '../physics/RigidBody';
import { BoxCollider, MeshCollider, PlaneCollider } from '../physics/Collider';
import { Vec3 } from '../physics/Vec3';
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
import { Color, Euler, Mesh } from 'three';

export class MyScene extends BaseScene {

    constructor() {
        super();
    }

    override init() {
        const lookAt = new Vec3(0, 0.0, 0);
        this.camera.lookAt(lookAt);
        this.orbitControls.target.copy(lookAt);
        this.orbitControls.update();

        this.insert(new BaseLightingScene);
        // this.scene.background = new Color(0xffffff);

        this.addGeometry();
    }

    private addGeometry() {

        let b0, b1;

        // b0 = Box(3, 1, 3).setPos(0, 0.5, 0);
        // this.addBody(b0);

        // b0 = Box(1, 1, 2).setPos(0.1, 1.6, 2);
        // this.addBody(b0);
        
        /* Stacked boxes */
        for (let i = 0; i < 3; i++) {
            const b = Box();
            b.pose.p.set(0, 0 + 0.52 + i, 0);
            // b.pose.p.set(-1.5, 5.5, 1);
            // b.pose.q.setFromEuler(new THREE.Euler(0.5, Math.PI, 0.5));
            // b.pose.q.setFromEuler(new THREE.Euler(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI))
            this.addBody(b);
        }

        // // Hinge
        // b0 = Box(2, 1, 0.05).setPos(3, 1.5, 1);
        // b1 = Box(2, 0.05, 1).setPos(3, 2, 0.5)
        // this.addBody(b0);
        // this.addBody(b1);

        // this.world.addConstraint(
        //     new Constraint(b0, b1)
        //     .add(new Attachment(new Vec3(0, 0, 0.5), new Vec3(0, 0.5, 0)))
        //     .add(new AlignAxes)
        //     // .add(new AlignOrientation)
        // );



        // // Hammer
        // b0 = Box(0.2, 0.2, 7).setPos(0, 2, 3)
        // b1 = Box(2, 1, 1).setPos(0, 2, 0.5)
        // this.addBody(b0);
        // this.addBody(b1);

        // this.world.addConstraint(
        //     new Constraint(b0, b1)
        //     .add(new Attachment(new Vec3(0.1, 0, 0.5), new Vec3(0, 0, -2)))
        //     .add(new AlignOrientation)
        // );
        
        // this.world.addConstraint(
        //     new Constraint(b0, b1)
        //     .add(new Attachment(new Vec3(0.1, 0, -0.5), new Vec3(0, 0, -3)))
        //     // .add(new AlignOrientation)
        // );

        this.addGround();

    }

    public update(time: number, dt: number, keys: Record<string, boolean>): void {

        if (keys.KeyQ) {
            const body = this.world.bodies[1];
            const tetraPointL = new Vec3(0, 0, 0.5);
            const tetraPointW = body.localToWorld(tetraPointL);

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
            const tetraPointW = body.localToWorld(tetraPointL);

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
