import { BaseScene } from './BaseScene';
import { BaseDebugScene } from './components/BaseDebugScene';
import { Vec3 } from '../physics/Vec3';
import { Box } from '../physics/body/Box';
import { BufferGeometry, Color, CylinderGeometry, Line, LineLoop, Matrix4, Mesh, MeshBasicMaterial, SphereGeometry } from 'three';
import { Vec2 } from '../physics/Vec2';
import { Tetra } from '../physics/body/Tetra';
import { RigidBody } from '../physics/RigidBody';
import { MeshCollider } from '../physics/Collider';
import { Game } from '../core/Game';
import { BaseLightingScene } from './components/BaseLightingScene';

export class FrictionScene extends BaseScene {

    box: RigidBody;

    override init() {

        this.insert(new BaseLightingScene);

        Box(3, 2, 15)
            .setPos(0, 2, -3)
            .setCanSleep(false)
            .setRotation(0.3, 0, 0)
            .setStatic()
            .setFriction(1, 1)
            .addTo(this);

        this.box = Box(1, 1, 1)
            .setCanSleep(false)
            .setFriction(1, 1)
            .addTo(this);

        this.addGround();

        this.initBox();

        this.gui.add(this.box, 'staticFriction', 0, 1).onChange(this.initBox.bind(this));
        this.gui.add(this.box, 'dynamicFriction', 0, 1).onChange(this.initBox.bind(this));
        this.gui.open();

    }

    initBox() {
        this.box.setPos(0, 4.5, -5); 
        this.box.setVel(0, 0, 0);
    }

}
