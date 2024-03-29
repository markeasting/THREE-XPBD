import * as THREE from 'three'
import { RigidBody } from "./RigidBody";
import { Vec3 } from "./Vec3";
import { XPBDSolver } from "./solver/XPBDSolver";
import { Constraint } from './constraint/Constraint';
import { BaseConstraint } from './constraint/BaseConstraint';
import { Game } from '../core/Game';
import { Attachment } from './constraint/Attachment';
import { RayCastEvent } from '../event/RayCastEvent';
import { BaseSolver } from './solver/BaseSolver';

export class World {

    public gravity = new Vec3(0, -9.81, 0);

    #bodies: Array<RigidBody> = [];
    
    #constraints: Array<Constraint> = [];
    #constraintsFast: Array<BaseConstraint> = []; // All constraints in a single array

    #grabConstraint: Attachment | undefined;
    #grabDistance: number = 0;

    public get bodies() {
        return this.#bodies;
    }

    /**
     * Debug scene
     */
    static debugOverlays = new THREE.Scene();
    static debugAABBs = new THREE.Scene();
    static debugConvexHulls = new THREE.Scene();
    
    static enableDebugOverlay = true;
    static enableDebugAABBs = false;
    static enableDebugConvexHulls = false;

    private solver: XPBDSolver;

    constructor() {
        this.solver = new XPBDSolver();

        Game.gui.physics.add(this.gravity, 'x', -50, 50).step(0.1).name('Gravity x');
        Game.gui.physics.add(this.gravity, 'y', -50, 50).step(0.1).name('Gravity y');
        Game.gui.physics.add(this.gravity, 'z', -50, 50).step(0.1).name('Gravity z');

        Game.gui.debug.add(World, 'enableDebugAABBs').name('AABBs');
        Game.gui.debug.add(World, 'enableDebugConvexHulls').name('Convex hulls');
        Game.gui.debug.add(World, 'enableDebugOverlay').name('Enable overlays');

        Game.events.on(RayCastEvent, e => {

            if (!this.#grabConstraint && !e.intersection)
                return;

            this.#grabDistance = this.#grabConstraint
                ? this.#grabDistance 
                : e.intersection.distance;

            const screenPos = new Vec3()
                .copy(e.ray.origin)
                .addScaledVector(Game.raycaster.ray.direction, this.#grabDistance )

            if (this.#grabConstraint) {

                this.#grabConstraint.localPose1.p = screenPos;

            } else {

                if (!e.body)
                    return;

                e.body.wake();
        
                // const screenPos = Vec3.mul(e.ray.origin as Vec3, e.intersection.distance);
                this.#grabDistance = e.intersection.distance;
                
                const localPos = e.body.worldToLocal(e.intersection.point as Vec3);

                this.#grabConstraint = new Attachment(localPos, screenPos)
                    .setBodies(e.body, null)    
                    .setStiffness(e.body.mass * 500)
                    .setDamping(e.body.mass * 100, e.body.mass * 1)

                this.#constraintsFast.push(this.#grabConstraint);
            }
            
        })

        window.addEventListener('mousemove', () => {
            if (!Game.mouseDown)
                this.#grabConstraint = undefined;
        });

        window.addEventListener('mouseup', () => {
            if (this.#grabConstraint) {
                this.#grabConstraint.destroy();
                this.#grabConstraint = undefined;
                this.#constraintsFast.pop();
                document.getElementById('constraint-force')!.innerText = '';
            }
        });
    }

    public add(body: RigidBody) {
        const len = this.bodies.push(body);
        body.id = len - 1;
    }

    public addConstraint(constraint: Constraint) {
        this.#constraintsFast.push(...constraint.constraints);
    }

    public update(dt: number): void {
        BaseSolver.ddIdx = 0;
        
        this.solver.update(this.#bodies, this.#constraintsFast, dt, this.gravity);

        if (this.#grabConstraint) {
            this.#grabConstraint.body0?.wake();
            this.#grabConstraint.body1?.wake();

            const F = this.#grabConstraint?.getForce(XPBDSolver.h).length().toFixed(2)
            document.getElementById('constraint-force')!.innerText = `Grab force: ${F} N`;
        }
    }

    public draw(renderer: THREE.WebGLRenderer, camera: THREE.Camera) {
        if (!World.enableDebugOverlay)
            return;
        
        renderer.autoClear = false;
        
        renderer.render(
            World.debugOverlays,
            camera
        );

        if (World.enableDebugAABBs)
            renderer.render(
                World.debugAABBs,
                camera
            );


        if (World.enableDebugConvexHulls)
            renderer.render(
                World.debugConvexHulls,
                camera
            );

        renderer.autoClear = true;
    }

    destroy() {
        this.#bodies = [];

        while(World.debugOverlays.children.length > 0){ 
            World.debugOverlays.remove(World.debugOverlays.children[0]); 
        }
        while(World.debugAABBs.children.length > 0){ 
            World.debugAABBs.remove(World.debugAABBs.children[0]); 
        }
        while(World.debugConvexHulls.children.length > 0){ 
            World.debugConvexHulls.remove(World.debugConvexHulls.children[0]); 
        }
    }

}
