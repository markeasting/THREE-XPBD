import * as THREE from 'three'
import { ArrowHelper, AxesHelper, Box3, Box3Helper, Color, Object3D, Scene } from 'three';
import { Quat } from "./Quaternion";
import { RigidBody } from "./RigidBody";
import { CollisionPair } from "./CollisionPair";
import { ContactSet } from "./ContactSet";
import { Vec3 } from "./Vec3";
import { CoordinateSystem } from "./CoordinateSystem";
import { ColliderType, MeshCollider, PlaneCollider } from "./Collider";

export class XPBDSolver {

    static numSubsteps = 15;

    private scene: Scene;
    // private debugVector = new ArrowHelper();

    private debug: Record<string, Object3D>  = {
        _debug: new ArrowHelper(),
        n: new ArrowHelper(),
        d: new ArrowHelper(),
        r1: new ArrowHelper(),
        r2: new ArrowHelper(),
        A: new Box3Helper(new Box3().setFromCenterAndSize(new Vec3(0, 0, 0), new Vec3(0)), new Color(0xcccccc)),
        B: new Box3Helper(new Box3().setFromCenterAndSize(new Vec3(0, 0, 0), new Vec3(0)), new Color(0xcccccc)),
        p1: new Box3Helper(new Box3().setFromCenterAndSize(new Vec3(0, 0, 0), new Vec3(0)), new Color(0xffff00)),
        p2: new Box3Helper(new Box3().setFromCenterAndSize(new Vec3(0, 0, 0), new Vec3(0)), new Color(0xff00ff)),
    }

    constructor(scene: Scene) {
        this.scene = scene;
        this.scene.add(new AxesHelper(1));
        // this.scene.add(new GridHelper(100));

        // this.scene.add(this.debugVector);

        for (const d in this.debug) {
            this.scene.add(this.debug[d]);
        }
        (this.debug._debug as ArrowHelper).setColor(0x00ff00);
        (this.debug.n as ArrowHelper).setColor(0x00ffff);
        (this.debug.d as ArrowHelper).setColor(0xff0000);
        (this.debug.r2 as ArrowHelper).setColor(0xff00ff);
    }

    private dd(vec: Vec3, pos?: Vec3) {
        this.setDebugVector('_debug', vec, pos);
    }

    private setDebugVector(key: string, vec: Vec3, pos?: Vec3) {
        const arrow = this.debug[key] as ArrowHelper;
        if (pos)
            arrow.position.copy(pos);
        arrow.setDirection(vec.clone().normalize());
        arrow.setLength(vec.length());
    }

    private setDebugPoint(key: string, pos: Vec3, size = 0.1) {
        const box = this.debug[key] as Box3Helper;
        box.box = new Box3().setFromCenterAndSize(pos, new Vec3(size, size, size))
    }

    private debugContact(contact: ContactSet) {
        for (const key in contact) {
            this.setDebugPoint('A', contact.A.pose.p, 0.02);
            this.setDebugPoint('B', contact.B.pose.p, 0.02);

            if (key == 'n')
                this.setDebugVector(key, contact.n, contact.p2)
            if (key == 'd')
                this.setDebugVector(key, contact.n.clone().multiplyScalar(contact.d), contact.p1);
            if (key == 'r1')
                // this.setDebugVector(key, CoordinateSystem.localToWorld(contact.r1, contact.A.pose.q, contact.A.pose.p));
                this.setDebugVector(key, CoordinateSystem.localToWorld(contact.r1, contact.A.pose.q, contact.A.pose.p).sub(contact.A.pose.p), contact.A.pose.p);
            if (key == 'r2')
                // this.setDebugVector(key, CoordinateSystem.localToWorld(contact.r2, contact.B.pose.q, contact.B.pose.p));
                this.setDebugVector(key, CoordinateSystem.localToWorld(contact.r2, contact.B.pose.q, contact.B.pose.p).sub(contact.B.pose.p), contact.B.pose.p);
            if (key == 'p1')
                this.setDebugPoint(key, contact.p1)
            if (key == 'p2')
                this.setDebugPoint(key, contact.p2)
        }
    }

    public update(bodies: Array<RigidBody>, dt: number, gravity: Vec3) {

        // if (dt === 0)
        //     return;

        // const h = dt / XPBDSolver.numSubsteps;
        const h = (1 / 60) / XPBDSolver.numSubsteps;
        // const h = (1 / 120) / XPBDSolver.numSubsteps;

        const collisions = this.collectCollisionPairs(bodies, h); // Should this be h instead of dt?

        for (let i = 0; i < XPBDSolver.numSubsteps; i++) {

            /* (3.5)
             * At each substep we iterate through the pairs
             * checking for actual collisions.
             */
            const contacts = this.getContacts(collisions);
            // if (contacts.length > 0)
            //     return;

            for (let j = 0; j < bodies.length; j++)
                bodies[j].integrate(h, gravity);

            // (Constraints)
            // for (let j = 0; j < joints.length; j++)
            //     joints[j].solvePos(h);

            // (Collisions)
            this.solvePositions(contacts, h);

            for (let j = 0; j < bodies.length; j++)
                bodies[j].update(h);

            // (Constraints)
            // for (let j = 0; j < joints.length; j++)
            //     joints[j].solveVel(h);

            // (Collisions)
            this.solveVelocities(contacts, h);
        }

        for (const body of bodies) {
            body.force.set(0, 0, 0);
            body.torque.set(0, 0, 0);
        }
    }

    private collectCollisionPairs(bodies: Array<RigidBody>, dt: number) {

        const collisions: Array<CollisionPair> = [];

        const combinations: Array<string> = [];

        for (const A of bodies) {
            for (const B of bodies) {

                if (!A.isDynamic && !B.isDynamic)
                    continue;

                if (A.mesh.id == B.mesh.id)
                    continue;

                const guid = [A.mesh.id, B.mesh.id].sort().toString();

                if (combinations.includes(guid))
                    continue;

                /* (3.5) k * dt * vbody */
                const collisionMargin = 2.0 * dt * Vec3.sub(A.vel, B.vel).length();

                switch(A.collider.colliderType) {
                    case ColliderType.ConvexMesh :
                        switch(B.collider.colliderType) {
                            case ColliderType.Plane : {

                                const MC = A.collider as MeshCollider;
                                const PC = B.collider as PlaneCollider;

                                let deepestPenetration = 0.0;

                                // This should be a simple AABB check instead of actual loop over all vertices
                                for(let i = 0; i < MC.uniqueIndices.length; i++) {
                                    const v = MC.vertices[MC.uniqueIndices[i]];

                                    const contactPointW = CoordinateSystem.localToWorld(v, A.pose.q, A.pose.p);
                                    // const signedDistance = contactPointW.clone().sub(B.pose.p).dot(N);
                                    const signedDistance = PC.plane.distanceToPoint(contactPointW);

                                    deepestPenetration = Math.min(deepestPenetration, signedDistance);
                                }

                                if(deepestPenetration < collisionMargin) {
                                    collisions.push({ A, B });
                                }

                                break;
                            }
                            default: break;
                        }
                    break;
                }
            }
        }

        return collisions;
    }

    private getContacts(collisions: Array<CollisionPair>) {

        const contacts: Array<ContactSet> = [];

        for (const collision of collisions) {

            const A = collision.A;
            const B = collision.B;

            // This check is already done in broadphase, skip?
            if (!A.isDynamic && !B.isDynamic)
                continue;

            if (A.mesh.id == B.mesh.id)
                continue;

            switch(A.collider.colliderType) {
                case ColliderType.ConvexMesh :
                    switch(B.collider.colliderType) {
                        case ColliderType.Plane : {

                            const MC = A.collider as MeshCollider;
                            const PC = B.collider as PlaneCollider;

                            const N = new Vec3().copy(PC.plane.normal);

                            // @TODO check if vertex is actually inside plane size :)
                            // @TODO maybe check if all vertices are in front of the plane first (skip otherwise)
                            for(let i = 0; i < MC.uniqueIndices.length; i++) {
                                const v = MC.vertices[MC.uniqueIndices[i]];
                                // const point = CoordinateSystem.localToWorld(v, A.pose.q, A.pose.p);

                                /* (26) - p1 -- note: p1 === point (localToWorld(v)) */
                                const r1 = v;
                                const p1 = CoordinateSystem.localToWorld(v, A.pose.q, A.pose.p);

                                /* (26) - p2 */
                                // const signedDistance = PC.plane.distanceToPoint(contactPointW);
                                const signedDistance = Vec3.dot(N, Vec3.sub(p1, B.pose.p));
                                const p2 = Vec3.sub(p1, Vec3.mul(N, signedDistance));
                                const r2 = CoordinateSystem.worldToLocal(p2, B.pose.q, B.pose.p);

                                /* (3.5) Penetration depth -- Note: sign was flipped! */
                                // const d = - N.dot(Vec3.sub(p1, p2));
                                const d = -signedDistance; // This matches the calculation above!

                                /* (3.5) if d ≤ 0 we skip the contact */
                                if (d <= 0.0)
                                    continue;

                                const contact = new ContactSet(A, B, PC.plane);
                                contact.n = N.clone();
                                contact.d = signedDistance;

                                contact.r1 = r1;
                                contact.r2 = r2;
                                contact.p1 = p1;
                                contact.p2 = p2;

                                // Set initial relative velocity
                                contact.vrel = Vec3.sub(
                                    contact.A.getVelocityAt(contact.p1),
                                    contact.B.getVelocityAt(contact.p2)
                                );
                                contact.vn = contact.vrel.dot(contact.n);

                                contact.e = 0.5 * (A.bounciness + B.bounciness);
                                contact.friction = 0.5 * (A.staticFriction + B.staticFriction);

                                this.debugContact(contact);
                                contacts.push(contact);
                            }

                            break;
                        }
                        default: break;
                    }
                break;
            }
        }

        return contacts;
    }

    private solvePositions(contacts: Array<ContactSet>, h: number) {
        for (const contact of contacts) {
            this._solvePenetration(contact, h);
            this._solveFriction(contact, h);
        }
    }

    private _solvePenetration(contact: ContactSet, h: number) {

        /* (26) - p1 & p2 */
        contact.update();

        /* (3.5) Penetration depth -- Note: sign was flipped! */
        contact.d = - Vec3.dot(Vec3.sub(contact.p1, contact.p2), contact.n);

        /* (3.5) if d ≤ 0 we skip the contact */
        if(contact.d <= 0.0)
            return;

        /* (3.5) Resolve penetration (Δx = dn using a = 0 and λn) */
        const dx = Vec3.mul(contact.n, contact.d);

        const delta_lambda = this.applyBodyPairCorrection(
            contact.A,
            contact.B,
            dx,
            0.0,
            h,
            contact.p1,
            contact.p2,
            false
        );

        /* (5) Update Lagrange multiplier */
        contact.lambda_n += delta_lambda;
    }

    private _solveFriction(contact: ContactSet, h: number) {

        /* (3.5)
         * To handle static friction we compute the relative
         * motion of the contact points and its tangential component
         */

        /* (26) Positions in current state and before the substep integration */
        const p1prev = contact.p1 // A.prevPose.p.clone().add(contact.r1.clone().applyQuaternion(A.prevPose.q));
        const p2prev = contact.p1 // B.prevPose.p.clone().add(contact.r2.clone().applyQuaternion(B.prevPose.q));
        contact.update();

        /* (27) (28) Relative motion and tangential component */
        const dp = Vec3.sub(
            Vec3.sub(contact.p1, p1prev),
            Vec3.sub(contact.p1, p2prev)
        );
        /* Note: the sign of dp_t was flipped! (Eq. 28) */
        const dp_t = Vec3.sub(
            Vec3.mul(contact.n, contact.n.dot(dp)),
            dp
        );

        /* (3.5)
         * To enforce static friction, we apply Δx = Δp_t
         * at the contact points with a = 0 but only if
         * λ_t < μ_s * λ_n.
         *
         * Note: with 1 position iteration, lambdaT is always zero!
         */
        if (contact.lambda_t > contact.friction * contact.lambda_n) {
            this.applyBodyPairCorrection(
                contact.A,
                contact.B,
                dp_t,
                0.0,
                h,
                contact.p1,
                contact.p2,
                false,
            );
        }

    }

    private solveVelocities(contacts: Array<ContactSet>, h: number) {

        /* (3.6) Velocity level */

        for (const contact of contacts) {
            const dv = new Vec3();

            /* (29) Relative normal and tangential velocities
             *
             * Recalculate v and vn since the velocities are
             * solved *after* the body update step.
             */
            const v = Vec3.sub(
                contact.A.getVelocityAt(contact.p1),
                contact.B.getVelocityAt(contact.p2)
            );
            const vn = Vec3.dot(v, contact.n);
            const vt = Vec3.sub(v, Vec3.mul(contact.n, vn));

            /* (30) Friction */
            const Fn = -contact.lambda_n / (h * h);
            const friction = Math.min(h * contact.friction * Fn, vt.length());
            dv.sub(Vec3.normalize(vt).mul(friction));

            /* (31, 32) @TODO dampening */

            /* (34) Restitution
             *
             * To avoid jittering we set e = 0 if vn is small (`threshold`).
             *
             * Note:
             * `vn_tilde` was already calculated before the position solve (Eq. 29)
             */
            const threshold = 2.0 * 9.81 * h;
            const e = Math.abs(vn) > threshold ? contact.e : 0.0;
            const vn_tilde = contact.vn;
            const restitution = -vn + Math.min(-e * vn_tilde, 0.0);
            dv.add(Vec3.mul(contact.n, restitution));

            /* (33) Velocity update */
            this.applyBodyPairCorrection(
                contact.A,
                contact.B,
                dv,
                0.0,
                h,
                contact.p1,
                contact.p2,
                true
            );
        }
    }

    private applyBodyPairCorrection(
        body0: RigidBody,
        body1: RigidBody,
        corr: Vec3,
        compliance: number,
        dt: number,
        pos0: Vec3 | null = null,
        pos1: Vec3 | null = null,
        velocityLevel: boolean = false
    ): number
    {

        const C = corr.length();

        if (C < 0.000001)
            return 0;

        const n = Vec3.normalize(corr);

        const w0 = body0 ? body0.getInverseMass(n, pos0) : 0.0;
        const w1 = body1 ? body1.getInverseMass(n, pos1) : 0.0;

        const w = w0 + w1;
        if (w == 0.0)
            return 0;

        const dlambda = -C / (w + compliance / dt / dt);
        n.multiplyScalar(-dlambda);

        body0.applyCorrection(n, pos0, velocityLevel);
        body1.applyCorrection(n.multiplyScalar(-1.0), pos1, velocityLevel);

        return dlambda;
    }
}
