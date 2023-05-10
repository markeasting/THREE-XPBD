import { ArrowHelper, AxesHelper, Box3, Box3Helper, Color, Object3D, Scene } from 'three';
import { RigidBody } from "../RigidBody";
import { CollisionPair } from "../CollisionPair";
import { ContactSet } from "../ContactSet";
import { Vec3 } from "../Vec3";
import { ColliderType, MeshCollider, PlaneCollider } from "../Collider";
import { BaseSolver } from './BaseSolver';
import { BaseConstraint } from '../constraint/BaseConstraint';
import { GjkEpa } from '../gjk-epa/GjkEpa';
import { Game } from '../../core/Game';

export class XPBDSolver extends BaseSolver {

    private numSubsteps = 20;

    private narrowPhase = new GjkEpa();
    
    static h = 0;

    private collisionCount = 0;

    constructor() {
        super();

        Game.gui.solver.add(Game, 'stepPhysics').name('Step (space)');
        Game.gui.solver.add(this, 'numSubsteps', 1, 30);
        Game.gui.solver.add(this, 'collisionCount').listen();
    }

    public update(bodies: Array<RigidBody>, constraints: Array<BaseConstraint>, dt: number, gravity: Vec3): void {

        /* XPBD algorithm 2 */

        if (dt === 0)
            return;

        // const h = dt / this.numSubsteps;
        const h = (1 / 60) / this.numSubsteps;
        
        /* Used to calculate constraint forces */
        XPBDSolver.h = h; 

        /* (3.5)
         * To save computational cost we collect potential
         * collision pairs once per time step instead of once per
         * sub-step using a tree of axis aligned bounding boxes.
         */
        const collisions = this.collectCollisionPairs(bodies, dt);
        this.collisionCount = collisions.length;

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

            /* (3.5) k * dt * vbody */
            body.collider.expanded_aabb
                .copy(body.collider.aabb)
                .expandByScalar(2.0 * dt * body.vel.length());

            body.force.set(0, 0, 0);
            body.torque.set(0, 0, 0);
            body.updateGeometry();
        }
    }

    private collectCollisionPairs(bodies: Array<RigidBody>, dt: number) {

        const collisions: Array<CollisionPair> = [];

        for (let i = 0; i < bodies.length; i++) {
            const A = bodies[i];

            if (!A.canCollide)
                continue;

            for (let j = i + 1; j < bodies.length; j++) {
                const B = bodies[j];

                if (!B.canCollide)
                    continue;

                if (!A.isDynamic && !B.isDynamic)
                    continue;

                if (A.id == B.id)
                    continue;

                /* (3.5) k * dt * vbody */
                const aabb1 = A.collider.expanded_aabb;
                const aabb2 = B.collider.expanded_aabb;

                switch(A.collider.colliderType) {
                    case ColliderType.ConvexMesh :
                        switch(B.collider.colliderType) {
                            case ColliderType.ConvexMesh : {
                                
                                if (aabb1.intersectsBox(aabb2))
                                    collisions.push(new CollisionPair( A, B ));

                                break;
                            }

                            case ColliderType.Plane : {

                                const PC = B.collider as PlaneCollider;

                                if (aabb1.intersectsPlane(PC.plane))
                                    collisions.push(new CollisionPair( A, B ));

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
                normal.clone().negate(),
                p1,
                p2
            );

            contacts.push(contact);
            this.debugContact(contact);
        }
    }

    public _meshPlaneContact(contacts: Array<ContactSet>, A: RigidBody, B: RigidBody) {
        const MC = A.collider as MeshCollider;
        const PC = B.collider as PlaneCollider;

        const N = new Vec3().copy(PC.normal);

        // @TODO check if vertex is actually inside plane size :)
        // @TODO maybe check if all vertices are in front of the plane first (skip otherwise)
        for(let i = 0; i < MC.uniqueIndices.length; i++) {

            /* (26) - p1 */
            const r1 = MC.vertices[MC.uniqueIndices[i]];
            const p1 = MC.verticesWorldSpace[MC.uniqueIndices[i]];

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
    
        /* (3.5) Handling contacts and friction */

        for (const contact of contacts) {
            this._solvePenetration(contact, h);
            this._solveFriction(contact, h);
        }
    }

    private _solvePenetration(contact: ContactSet, h: number) {

        /* (26) - p1, p2 and penetration depth (d) are calculated here. */
        contact.update();

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

        /* (3.5) Static friction */
        contact.update();

        /* (26) Positions in current state and before the substep integration */
        const p1prev = contact.A.prevPose.p.clone().add(contact.r1.clone().applyQuaternion(contact.A.prevPose.q));
        const p2prev = contact.B.prevPose.p.clone().add(contact.r2.clone().applyQuaternion(contact.B.prevPose.q));

        /* (27) Relative motion */
        const dp = Vec3.sub(
            Vec3.sub(contact.p1, p1prev),
            Vec3.sub(contact.p2, p2prev)
        );
        
        /* (28) Tangential component of relative motion */
        const dp_t = Vec3.sub(
            dp,
            Vec3.mul(contact.n, dp.dot(contact.n))
        );
        
        /* Note: Had to negate dp_t to get correct results */
        dp_t.negate();

        /* (3.5)
         * To enforce static friction, we apply Δx = Δp_t
         * at the contact points with a = 0.
         */
        const d_lambda_t = XPBDSolver.applyBodyPairCorrection(
            contact.A,
            contact.B,
            dp_t,
            0.0,
            h,
            contact.p1,
            contact.p2,
            false,
            true
        );
        
        /**
         * "...but only if λ_t < μ_s * λ_n"
         * 
         * Note: 
         *      this inequation was flipped because 
         *      the lambda values are always negative!
         * 
         * Note: 
         *      with 1 position iteration (XPBD), lambda_t is always zero!
         */ 
        if (contact.lambda_t + d_lambda_t > contact.staticFriction * contact.lambda_n) {
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
             * Note: v and vn are recalculated since the velocities were
             * modified by RigidBody.update() in the meantime.
             */
            const v = Vec3.sub(
                contact.A.getVelocityAt(contact.p1),
                contact.B.getVelocityAt(contact.p2)
            );
            const vn = Vec3.dot(v, contact.n);
            const vt = Vec3.sub(v, Vec3.mul(contact.n, vn));
            const vt_len = vt.length();
 
            /* (30) Friction */
            if (vt_len > 0.000001) {
                const Fn = -contact.lambda_n / (h * h);
                const friction = Math.min(h * contact.dynamicFriction * Fn, vt_len);
                dv.sub(Vec3.normalize(vt).multiplyScalar(friction));
            }

            /* (34) Restitution
             *
             * To avoid jittering we set e = 0 if vn is small (`threshold`).
             * 
             * Note: min() was replaced with max() due to the flipped sign convention.
             *
             * Note: `vn_tilde` is calculated in ContactSet before the position solve (Eq. 29)
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
        velocityLevel: boolean = false,
        precalculateDeltaLambda: boolean = false
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

        /* (3.3.1) Lagrange multiplier
         *
         * Equation (4) was simplified because a single
         * constraint iteration is used (initial lambda = 0)
         */
        const dlambda = -C / (w + compliance / dt / dt);

        if (!precalculateDeltaLambda) {
            n.multiplyScalar(-dlambda);
            
            if (body0) body0.applyCorrection(n, pos0, velocityLevel);
            if (body1) body1.applyCorrection(n.negate(), pos1, velocityLevel);
        }

        return dlambda;
    }
}
