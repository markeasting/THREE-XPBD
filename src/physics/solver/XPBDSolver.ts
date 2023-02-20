import { ArrowHelper, AxesHelper, Box3, Box3Helper, Color, Object3D, Scene } from 'three';
import { RigidBody } from "../RigidBody";
import { CollisionPair } from "../CollisionPair";
import { ContactSet } from "../ContactSet";
import { Vec3 } from "../Vec3";
import { ColliderType, MeshCollider, PlaneCollider } from "../Collider";
import { BaseSolver } from './BaseSolver';
import { BaseConstraint } from '../constraint/BaseConstraint';
import { GjkEpa } from '../gjk-epa/GjkEpa';

export class XPBDSolver extends BaseSolver {

    private numSubsteps = 20;

    private narrowPhase = new GjkEpa();
    
    static h = 0;

    public update(bodies: Array<RigidBody>, constraints: Array<BaseConstraint>, dt: number, gravity: Vec3): void {

        if (dt === 0)
            return;

        // const h = dt / this.numSubsteps;
        const h = (1 / 60) / this.numSubsteps;
        
        XPBDSolver.h = h;

        const collisions = this.collectCollisionPairs(bodies, dt);

        for (let i = 0; i < this.numSubsteps; i++) {

            /* (3.5)
             * At each substep we iterate through the pairs
             * checking for actual collisions.
             */
            const contacts = this.getContacts(collisions);

            for (let j = 0; j < bodies.length; j++)
                bodies[j].integrate(h, gravity);

            for (let j = 0; j < constraints.length; j++)
                constraints[j].solvePos(h);

            this.solvePositions(contacts, h);

            for (let j = 0; j < bodies.length; j++)
                bodies[j].update(h);

            for (let j = 0; j < constraints.length; j++)
                constraints[j].solveVel(h);

            this.solveVelocities(contacts, h);
        }

        for (const body of bodies) {
            body.force.set(0, 0, 0);
            body.torque.set(0, 0, 0);
            body.updateGeometry();
        }
    }

    private collectCollisionPairs(bodies: Array<RigidBody>, dt: number) {

        const collisions: Array<CollisionPair> = [];

        const combinations: Array<string> = [];

        for (const A of bodies) {
            for (const B of bodies) {

                if (!A.isDynamic && !B.isDynamic)
                    continue;

                if (A.id == B.id)
                    continue;

                const guid = [A.id, B.id].sort().toString();

                if (combinations.includes(guid))
                    continue;

                combinations.push(guid);

                /* (3.5) k * dt * vbody */
                const collisionMargin = 2.0 * dt * Vec3.sub(A.vel, B.vel).length();

                switch(A.collider.colliderType) {
                    case ColliderType.ConvexMesh :
                        switch(B.collider.colliderType) {
                            
                            case ColliderType.ConvexMesh : {

                                const aabb1 = A.collider.aabb.clone().expandByScalar(collisionMargin);
                                const aabb2 = B.collider.aabb.clone().expandByScalar(collisionMargin);
                                
                                if (aabb1.intersectsBox(aabb2)) {
                                    collisions.push(new CollisionPair( A, B ));
                                }

                                break;
                            }

                            case ColliderType.Plane : {

                                const MC = A.collider as MeshCollider;
                                const PC = B.collider as PlaneCollider;
                                const N = PC.normal;

                                let deepestPenetration = 0.0;

                                // This should be a simple AABB check instead of actual loop over all vertices
                                for(let i = 0; i < MC.uniqueIndices.length; i++) {
                                    const v = MC.vertices[MC.uniqueIndices[i]];

                                    const contactPointW = A.localToWorld(v);
                                    const signedDistance = contactPointW.clone().sub(B.pose.p).dot(N);
                                    // const signedDistance = PC.plane.distanceToPoint(contactPointW);

                                    deepestPenetration = Math.min(deepestPenetration, signedDistance);
                                }

                                if(deepestPenetration < collisionMargin) {
                                    collisions.push(new CollisionPair( A, B ));
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

    public getContacts(collisions: Array<CollisionPair>): Array<ContactSet> {

        const contacts: Array<ContactSet> = [];

        for (const collision of collisions) {

            const A = collision.A;
            const B = collision.B;

            switch(A.collider.colliderType) {
                case ColliderType.ConvexMesh :
                    switch(B.collider.colliderType) {
                        case ColliderType.ConvexMesh : {
                            this._meshMeshContact(contacts, A, B);
                            break;
                        }
                        case ColliderType.Plane : {
                            this._meshPlaneContact(contacts, A, B);
                            break;
                        }
                        default: break;
                    }
                break;
            }
        }

        return contacts;
    }

    public _meshMeshContact(contacts: Array<ContactSet>, A: RigidBody, B: RigidBody) {

        const simplex = this.narrowPhase.GJK(A.collider, B.collider);

        if (simplex) {
            const EPA = this.narrowPhase.EPA(simplex, A.collider, B.collider);

            if (!EPA)
                return;

            const { normal, p1, p2, d } = EPA;
            
            if (d <= 0.0)
                return;

            const contact = new ContactSet(
                A, 
                B, 
                normal.clone().multiplyScalar(-1.0),
                p1,
                p2
            );

            contacts.push(contact);
            // this.debugContact(contact);
        }
    }

    public _meshPlaneContact(contacts: Array<ContactSet>, A: RigidBody, B: RigidBody) {
        const MC = A.collider as MeshCollider;
        const PC = B.collider as PlaneCollider;

        const N = new Vec3().copy(PC.normal);

        // @TODO check if vertex is actually inside plane size :)
        // @TODO maybe check if all vertices are in front of the plane first (skip otherwise)
        for(let i = 0; i < MC.uniqueIndices.length; i++) {
            const v = MC.vertices[MC.uniqueIndices[i]];

            /* (26) - p1 */
            const r1 = v;
            const p1 = A.localToWorld(v);

            /* (26) - p2 */
            // const signedDistance = PC.plane.distanceToPoint(contactPointW);
            const signedDistance = Vec3.dot(N, Vec3.sub(p1, B.pose.p));
            const p2 = Vec3.sub(p1, Vec3.mul(N, signedDistance));
            const r2 = B.worldToLocal(p2);

            /* (3.5) Penetration depth -- Note: sign was flipped! */
            // const d = - N.dot(Vec3.sub(p1, p2));
            const d = -signedDistance; // This matches the calculation above!

            /* (3.5) if d ≤ 0 we skip the contact */
            if (d <= 0.0)
                continue;

            const contact = new ContactSet(A, B, N, p1, p2, r1, r2);
            
            contacts.push(contact);
        }
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

        const delta_lambda = XPBDSolver.applyBodyPairCorrection(
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
        const p1prev = contact.p1.clone(); // A.prevPose.p.clone().add(contact.r1.clone().applyQuaternion(A.prevPose.q));
        const p2prev = contact.p2.clone(); // B.prevPose.p.clone().add(contact.r2.clone().applyQuaternion(B.prevPose.q));
        contact.update();

        /* (27) Relative motion and tangential component */
        const dp = Vec3.sub(
            Vec3.sub(contact.p1, p1prev),
            Vec3.sub(contact.p2, p2prev)
        );
        /* (28) */
        const dp_t = Vec3.sub(
            dp,
            Vec3.mul(contact.n, dp.dot(contact.n))
        );

        /* (3.5)
         * To enforce static friction, we apply Δx = Δp_t
         * at the contact points with a = 0 but only if
         * λ_t < μ_s * λ_n.
         *
         * Note: with 1 position iteration, lambdaT is always zero!
         */
        if (contact.lambda_t < contact.staticFriction * contact.lambda_n) {
            XPBDSolver.applyBodyPairCorrection(
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
            
            contact.update();
            
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
            const friction = Math.min(h * contact.dynamicFriction * Fn, vt.length());
            dv.sub(Vec3.normalize(vt).multiplyScalar(friction));

            /* (31, 32) @TODO dampening */

            /* (34) Restitution
             *
             * To avoid jittering we set e = 0 if vn is small (`threshold`).
             *
             * Note:
             * `vn_tilde` was already calculated before the position solve (Eq. 29)
             */
            const threshold = 2.0 * 9.81 * h;
            const e = Math.abs(vn) <= threshold ? 0.0 : contact.e;
            const vn_tilde = contact.vn;
            const restitution = -vn + Math.max(-e * vn_tilde, 0.0);
            dv.add(Vec3.mul(contact.n, restitution));

            /* (33) Velocity update */
            XPBDSolver.applyBodyPairCorrection(
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

    static applyBodyPairCorrection(
        body0: RigidBody | null,
        body1: RigidBody | null,
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

        if (body0) body0.applyCorrection(n, pos0, velocityLevel);
        if (body1) body1.applyCorrection(n.multiplyScalar(-1.0), pos1, velocityLevel);

        return dlambda;
    }
}
