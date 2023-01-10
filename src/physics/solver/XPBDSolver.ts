import { ArrowHelper, AxesHelper, Box3, Box3Helper, Color, Object3D, Scene } from 'three';
import { RigidBody } from "../RigidBody";
import { CollisionPair } from "../CollisionPair";
import { ContactSet } from "../ContactSet";
import { Vec3 } from "../Vec3";
import { Quat } from "../Quaternion";
import { CoordinateSystem } from "../CoordinateSystem";
import { ColliderType, MeshCollider, PlaneCollider } from "../Collider";
import { BaseSolver } from './BaseSolver';

export class XPBDSolver extends BaseSolver {

    private numSubsteps = 15;

    public update(bodies: Array<RigidBody>, dt: number, gravity: Vec3): void {

        if (dt === 0)
            return;

        // const h = dt / this.numSubsteps;
        const h = (1 / 60) / this.numSubsteps;
        // const h = (1 / 120) / this.numSubsteps;

        const collisions = this.collectCollisionPairs(bodies, dt);

        for (let i = 0; i < this.numSubsteps; i++) {

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

            this.solvePositions(contacts, h);

            for (let j = 0; j < bodies.length; j++)
                bodies[j].update(h);

            // (Constraints)
            // for (let j = 0; j < joints.length; j++)
            //     joints[j].solveVel(h);

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

                if (A.id == B.id)
                    continue;

                const guid = [A.id, B.id].sort().toString();

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

    private getContacts(collisions: Array<CollisionPair>) {

        const contacts: Array<ContactSet> = [];

        for (const collision of collisions) {

            const A = collision.A;
            const B = collision.B;

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
            const e = Math.abs(vn) <= threshold ? 0.0 : contact.e;
            const vn_tilde = contact.vn;
            const restitution = -vn + Math.max(-e * vn_tilde, 0.0);
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
