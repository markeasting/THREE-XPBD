import * as THREE from 'three'
import { BaseScene } from './BaseScene';
import { BaseLightingScene } from './components/BaseLightingScene';
import { RigidBody } from '../physics/RigidBody';
import { BoxCollider, MeshCollider, PlaneCollider } from '../physics/Collider';
import { Vec3 } from '../physics/Vec3';
import { Vec2 } from '../physics/Vec2';
import { AthmosphereScene } from './components/AthmosphereScene';
import { OmgScene } from './components/OmgScene';
import { Box } from '../physics/body/Box';
import { Tetra } from '../physics/body/Tetra';
import { Pose } from '../physics/Pose';
import { Joint, JointType } from '../physics/constraint/Joint';
import { Constraint } from '../physics/constraint/Constraint';
import { Attachment } from '../physics/constraint/Attachment';
import { AlignOrientation } from '../physics/constraint/AlignOrientation';
import { AlignAxes } from '../physics/constraint/AlignAxes';
import { Color, Euler, Mesh } from 'three';

import { TeapotGeometry } from 'three/examples/jsm/geometries/TeapotGeometry';

export class PlayGroundScene extends BaseScene {

    override init() {

        this.insert(new BaseLightingScene);
        // this.scene.background = new Color(0xffffff);

        Box(3, 1, 3)
            .setPos(0, 0.5, 0)
            .addTo(this);

        Box(2, 1, 1)
            .setPos(1.5, 10, 0)
            .addTo(this);

        Tetra(1)
            .setPos(-3, 4, 8)
            .setVel(0, 2.5, -10)
            .setOmega(1, 10, 1)
            .addTo(this);
        
        /* Stacked boxes */
        const h = 1;
        for (let i = 0; i < 6; i++) {
            Box(h)
                .setPos(-3, (h - h/2 + 0.05) + h * i, 0)
                .addTo(this);
        }

        /* Dominos */
        // for (let i = 0; i < 7; i++) {
        //     Box(1, 2, 0.2)
        //         .setPos(-3, 1.0, -i * 1.0)
        //         .setFriction(1, 1)
        //         .addTo(this);
        // }

        /* Custom geometry */
        const customMesh = new THREE.Mesh(
            // new THREE.SphereGeometry(0.5, 22, 22),
            new THREE.TorusKnotGeometry(0.8, 0.15, 48, 6),
            new THREE.MeshPhongMaterial({
                color: new THREE.Color().setHSL(0.5, 1, 0.5),
            })
            // new TeapotGeometry(0.5, 4, true, true, true, false),
            // new THREE.MeshStandardMaterial({
            //     color: 0xffffff,
            //     roughness: 0.1,
            // }),
        );
        
        new RigidBody(
                new MeshCollider().setGeometry(customMesh.geometry)
            )
            .setMesh(customMesh)
            .setPos(4, 2, 0)
            .setBox(new Vec3(1, 1, 1), 1)
            .addTo(this);


        /* Coin */
        const coinSize = new Vec2(1.5, 0.3);
        const coinMesh = new THREE.Mesh(
            new THREE.CylinderGeometry(coinSize.x, coinSize.x, coinSize.y, 32, 1),
            new THREE.MeshPhongMaterial({
                color: new THREE.Color().setHSL(0.5, 1, 0.5),
            }),
            // new THREE.MeshBasicMaterial({
            //     color: 0xffffff,
            //     wireframe: true,
            //     wireframeLinewidth: 2
            // })
        );
        
        new RigidBody(
                new MeshCollider().setGeometry(coinMesh.geometry)
            )
            .setMesh(coinMesh)
            .setPos(0, 1.5, 5)
            .setRotation(2.5, 0, 0)
            .setOmega(0, 15, 0)
            .setFriction(0.8, 0.5)
            .setRestitution(0.6)
            .setCylinder(coinSize.x, coinSize.y, 1)
            .addTo(this);

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

}
