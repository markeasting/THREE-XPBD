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

        // // Debug local positions
        // const boxMesh = new THREE.Mesh(
        //     new THREE.BoxGeometry(1, 2, 1),
        //     new THREE.MeshBasicMaterial({
        //         color: 0xffffff,
        //         wireframe: true,
        //     })
        // );
        // this.scene.add(boxMesh);
        

        for (let index = 0; index < 2; index++) {
            const b = Box(1, 2, 1);
            b.pose.p.set(
                Math.random() * 8 - 4,
                Math.random() * 2 + 3,
                Math.random() * 8 - 4
            );
            // b.pose.p.set(-1.5, 5.5, 1);
            // b.pose.q.setFromEuler(new THREE.Euler(0.5, Math.PI, 0.5));
            b.pose.q.setFromEuler(new THREE.Euler(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI))
            this.addBody(b);
        }

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
        ground.makeStatic();

        this.addBody(ground);

    }

    public update(time: number, dt: number, keys: Record<string, boolean>): void {

        if (keys.KeyQ) {
            const body = this.world.bodies[0];
            const tetraPointL = new Vec3(0, 0.5, 0);
            const tetraPointW = CoordinateSystem.localToWorld(tetraPointL, body.pose.q, body.pose.p);

            body.applyForceW(
                new Vec3(0, body.mass * this.world.gravity.y * -2.0, 0),
                tetraPointW
            );
        }
    }

}
