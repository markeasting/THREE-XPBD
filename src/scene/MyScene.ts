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

export class MyScene extends BaseScene {

    constructor() {
        super();
    }

    override init() {
        this.camera.position.set(2, 5, 1)
        this.camera.lookAt(0, 1, 0);

        this.insert(new AthmosphereScene);

        this.addGeometry();
    }

    private addGeometry() {

        const boxMesh = new THREE.Mesh(
            new THREE.BoxGeometry(1, 2, 1),
            new THREE.MeshPhongMaterial({
                color: 0xffffff,
            })
        );
        const box = new RigidBody(
            boxMesh,
            new MeshCollider(boxMesh.geometry)
            // new BoxCollider(new Vec3(1, 2, 1))
        )
        box.setBox(new Vec3(1, 2, 1), 1);
        box.pose.p.set(0, 3, 0);
        box.pose.q.setFromEuler(new THREE.Euler(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI))
        this.addBody(box);

        const ground = new RigidBody(new THREE.Mesh(
            new THREE.PlaneGeometry(1, 1),
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
