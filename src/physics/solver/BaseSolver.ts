import { ArrowHelper, AxesHelper, Box3, Box3Helper, Color, Object3D, Scene } from 'three';
import { Game } from '../../core/Game';
import { ContactSet } from "../ContactSet";
import { Vec3 } from "../Vec3";
import { World } from '../World';

export class BaseSolver {

    debugContacts = false;

    // @TODO move helpers to World
    protected helpers: Record<string, Object3D>  = {
        n: new ArrowHelper(),
        d: new ArrowHelper(),
        r1: new ArrowHelper(),
        r2: new ArrowHelper(),
        A: new Box3Helper(new Box3(new Vec3(0), new Vec3(0)), new Color(0xcccccc)),
        B: new Box3Helper(new Box3(new Vec3(0), new Vec3(0)), new Color(0xcccccc)),
        p1: new Box3Helper(new Box3(new Vec3(0), new Vec3(0)), new Color(0xffff00)),
        p2: new Box3Helper(new Box3(new Vec3(0), new Vec3(0)), new Color(0xff00ff)),
    }

    static ddIdx = 0;

    constructor() {

        Game.gui.debug.add(this, 'debugContacts').name('Debug contacts');

        // World.scene.add(new AxesHelper(1));
        // this.scene.add(new GridHelper(100));

        for (const h in this.helpers) {
            World.debugOverlays.add(this.helpers[h]);
        }
        
        (this.helpers.n as ArrowHelper).setColor(0x00ffff);
        (this.helpers.d as ArrowHelper).setColor(0xff0000);
        (this.helpers.r2 as ArrowHelper).setColor(0xff00ff);
    }

    protected dd(vec: Vec3, pos?: Vec3) {
        this.setDebugVector('_debug'+BaseSolver.ddIdx, vec, pos);
        // console.log(vec);
        BaseSolver.ddIdx++;
    }

    protected setDebugVector(key: string, vec: Vec3, pos: Vec3 = new Vec3(0,0,0)) {
        if (!Game.debugOverlay)
            return;

        if (!this.helpers[key]) {
            const arrow = new ArrowHelper();
            arrow.setColor(new Color().setHex(Math.random() * 0xffffff));
            
            this.helpers[key] = arrow;
            World.debugOverlays.add(arrow);
        }

        const arrow = this.helpers[key] as ArrowHelper;
        if (pos)
            arrow.position.copy(pos);
        arrow.setDirection(vec.clone().normalize());
        arrow.setLength(vec.length());
    }

    protected setDebugPoint(key: string, pos: Vec3, size = 0.1) {
        if (!Game.debugOverlay)
            return;

        if (!this.helpers[key]) {
            const box = new Box3Helper(new Box3().setFromCenterAndSize(pos, new Vec3(size)));
            
            this.helpers[key] = box;
            World.debugOverlays.add(box);
        }

        const box = this.helpers[key] as Box3Helper;
        box.box = new Box3().setFromCenterAndSize(pos, new Vec3(size, size, size))
    }

    protected debugContact(contact: ContactSet) {
        if (!Game.debugOverlay || !this.debugContacts)
            return;
            
        for (const key in contact) {
            this.setDebugPoint('A', contact.A.pose.p, 0.02);
            this.setDebugPoint('B', contact.B.pose.p, 0.02);

            if (key == 'n')
                this.setDebugVector(key, contact.n, contact.p2)
            if (key == 'd')
                this.setDebugVector(key, contact.n.clone().multiplyScalar(contact.d), contact.p1);
            if (key == 'r1')
                // this.setDebugVector(key, CoordinateSystem.localToWorld(contact.r1, contact.A.pose.q, contact.A.pose.p));
                this.setDebugVector(key, contact.A.localToWorld(contact.r1).sub(contact.A.pose.p), contact.A.pose.p);
            if (key == 'r2')
                // this.setDebugVector(key, CoordinateSystem.localToWorld(contact.r2, contact.B.pose.q, contact.B.pose.p));
                this.setDebugVector(key, contact.B.localToWorld(contact.r2).sub(contact.B.pose.p), contact.B.pose.p);
            if (key == 'p1')
                this.setDebugPoint(key, contact.p1)
            if (key == 'p2')
                this.setDebugPoint(key, contact.p2)
        }
    }
    
    // public update(bodies: Array<RigidBody>, constraints: Array<Constraint>, dt: number, gravity: Vec3): void {}

}