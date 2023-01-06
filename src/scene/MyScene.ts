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
        this.camera.lookAt(0, 1, 0);

        this.insert(new BaseLightingScene);

        this.addGeometry();
    }

    private addGeometry() {

        // Debug local positions
        // const boxMesh = new THREE.Mesh(
        //     new THREE.BoxGeometry(1, 2, 1),
        //     new THREE.MeshBasicMaterial({
        //         color: 0xffffff,
        //         wireframe: true,
        //     })
        // );
        // this.scene.add(boxMesh);

        for (let index = 0; index < 10; index++) {
            const b = Box();
            b.pose.p.set(
                Math.random() * 8 - 4, 
                Math.random() * 4 + 1, 
                Math.random() * 8 - 4
            );
            b.pose.q.setFromEuler(new THREE.Euler(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI))
            this.addBody(b);
        }

        const ground = new RigidBody(new THREE.Mesh(
            new THREE.PlaneGeometry(0.1, 0.1),
                new THREE.MeshPhongMaterial({
                    color: 0xffffff,
                })
            ),
            new PlaneCollider(new Vec2(100, 100))
        )
        // Ugh:
        ground.pose.q.setFromEuler(new THREE.Euler(-Math.PI / 2, 0, 0))
        // ground.pose.p.copy(CoordinateSystem.worldToLocal(new Vec3(0, 0, -5), ground.pose.q, ground.pose.p));
        ground.makeStatic();

        this.addBody(ground);

    }

}
