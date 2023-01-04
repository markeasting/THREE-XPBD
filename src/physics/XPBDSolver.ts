import { Quat } from "./Quaternion";
import { RigidBody } from "./RigidBody";
import { CollisionPair } from "./CollisionPair";
import { ContactSet } from "./ContactSet";
import { Vec3 } from "./Vec3";
import { CoordinateSystem } from "./CoordinateSystem";
import { ColliderType, MeshCollider, PlaneCollider } from "./Collider";

export class XPBDSolver {

    static numSubsteps = 20;
    static numPosIters = 1;

    public update(bodies: Array<RigidBody>, dt: number, gravity: Vec3) {

        // if (dt === 0)
        //     return;

        // const h = dt / XPBDSolver.numSubsteps;
        const h = (1 / 60) / XPBDSolver.numSubsteps;

        const collisions = this.broadPhaseCollision(bodies, h); // Should this be h instead of dt?

        for (let i = 0; i < XPBDSolver.numSubsteps; i++) {

            const contacts = this.getContacts(collisions);

            for (let j = 0; j < bodies.length; j++)
                bodies[j].integrate(h, gravity);

            // (Constraints)
            // for (let j = 0; j < joints.length; j++)
            //     joints[j].solvePos(h);

            // (Collisions)
            for (let j = 0; j < XPBDSolver.numPosIters; j++)
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

    private broadPhaseCollision(bodies: Array<RigidBody>, dt: number) {

        const contacts: Array<CollisionPair> = [];

        const combinations: Array<string> = [];

        for (const A of bodies) {
            for (const B of bodies) {

                if (!A.isDynamic && !B.isDynamic)
                    continue;

                const guid = [A.mesh.id, B.mesh.id].sort().toString();

                if (combinations.includes(guid))
                    continue;

                combinations.push(guid);

                // k*dt*vbody (3.5)
                // const float collisionMargin = 2.0f * (float) dt * glm::length(A.vel - B.vel);
                const collisionMargin = 2.0 * dt * new Vec3().subVectors(A.vel, B.vel).length();

                switch(A.collider.colliderType) {
                    case ColliderType.ConvexMesh :
                        switch(B.collider.colliderType) {
                            case ColliderType.Plane : {

                                const MC = A.collider as MeshCollider;
                                const PC = B.collider as PlaneCollider;

                                const N = PC.normal;

                                // This should be a simple AABB check instead of actual loop over all vertices
                                for(let i = 0; i < MC.uniqueIndices.length; i++) {
                                    const v = MC.vertices[MC.uniqueIndices[i]];

                                    const contactPointW = CoordinateSystem.localToWorld(v, A.pose.q, A.pose.p);
                                    const signedDistance = contactPointW.clone().sub(B.pose.p).dot(N);

                                    if(signedDistance < collisionMargin) {
                                        contacts.push({ A, B });
                                    }
                                }

                                break;
                            }
                            default: break;
                        }
                    break;
                }
            }
        }

        return contacts;
    }

    private getContacts(collisions: Array<CollisionPair>) {

        const contacts: Array<ContactSet> = [];

        const combinations: Array<string> = [];

        for (const collision of collisions) {

            const A = collision.A;
            const B = collision.B;

            // This check is already done in broadphase, skip?
            if (!A.isDynamic && !B.isDynamic)
                continue;

            const guid = [A.mesh.id, B.mesh.id].sort().toString();

            if (combinations.includes(guid))
                continue;

            combinations.push(guid);

            switch(A.collider.colliderType) {
                case ColliderType.ConvexMesh :
                    switch(B.collider.colliderType) {
                        case ColliderType.Plane : {

                            const MC = A.collider as MeshCollider;
                            const PC = B.collider as PlaneCollider;

                            const N = PC.normal; // ASSUMES NORMALIZED PLANE NORMAL!!

                            // @TODO check if vertex is actually inside plane size :)
                            // @TODO maybe check if all vertices are in front of the plane first (skip otherwise)
                            for(let i = 0; i < MC.uniqueIndices.length; i++) {
                                const v = MC.vertices[MC.uniqueIndices[i]];

                                const contactPointW = CoordinateSystem.localToWorld(v, A.pose.q, A.pose.p);
                                const signedDistance = contactPointW.clone().sub(B.pose.p).dot(N);

                                if (signedDistance < 0.0) {
                                    const contactSet = new ContactSet(A, B);
                                    contactSet.pLocal = v;
                                    contactSet.p = contactPointW;
                                    contactSet.d = signedDistance;
                                    contactSet.n = N;

                                    // Velocities
                                    const vrel = new Vec3().subVectors(
                                        A.getVelocityAt(contactSet.p),
                                        B.getVelocityAt(contactSet.p)
                                    );
                                        
                                    contactSet.vrel = vrel;
                                    contactSet.vn = vrel.dot(contactSet.n);
    
                                    // Other properties
                                    // (These used to be stored in `collision` from broadphase)
                                    contactSet.e = 0.5 * (A.bounciness + B.bounciness);
                                    contactSet.friction = 0.5 * (A.staticFriction + B.staticFriction);

                                    contacts.push(contactSet);
                                }
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

            // @TODO recalculate p and D properly
            const A = contact.A;
            const B = contact.B;
            const contactPointW = CoordinateSystem.localToWorld(contact.pLocal, A.pose.q, A.pose.p);
            const d = contactPointW.clone().sub(B.pose.p).dot(contact.n);
            contact.d = d;
            contact.p = contactPointW;

            if(contact.d >= 0.0)
                continue; // Contact has been solved

            const posCorr = contact.n
                .clone()
                .multiplyScalar(-contact.d)

            this.applyPositionSolve(
                contact,
                posCorr,
                h,
            );

            // // @TODO eq. 27, 28
            // const glm::vec3 p1prev = contact.A.prevPose.p + contact.A.prevPose.q * r1;
            // const glm::vec3 p2prev = contact.B.prevPose.p + contact.B.prevPose.q * r2;
        }
    }

    private solveVelocities(contacts: Array<ContactSet>, h: number) {

        for (const contact of contacts) {

            let dv = new Vec3();

            // (29) Relative velocity
            // My guy, dont set this contact.vrel as it doesn't update between substeps!
            const v = new Vec3().subVectors(
                contact.A.getVelocityAt(contact.p),
                contact.B.getVelocityAt(contact.p)
            );
            const vn = v.dot(contact.n);

            // glm::vec3 vt = v - (contact->n * vn);
            const vt = v.clone().add(contact.n.clone().multiplyScalar(vn));
            // const vt = v.clone().sub(contact.n.clone().multiplyScalar(vn));
            const vt_length = vt.length();

            // (30) Friction
            if(vt_length > 0.001) {
                const Fn = -contact.lambdaN / (h * h);
                // console.log(Fn, 1/contact.A.invMass);
                // dv -= glm::normalize(vt) * std::min((float) h * contact.friction * Fn, vt_length);
                const dvFriction = vt.clone()
                    .normalize()
                    .multiplyScalar(Math.min((h * contact.friction * Fn), vt_length));
                dv.sub(dvFriction)
            }

            // (31, 32) @TODO dampening

            // (34), restitution
            // @TODO use gravity from World
            const e = (Math.abs(vn) > (1.0 * 9.81 * h)) 
                ? contact.e 
                : 0.0;

            const vn_reflected = Math.max(-e * contact.vn, 0.0);
            // dv += contact.n * (-vn + std::max(-e * contact.vn, 0.0));
            // dv += contact.n * (vn_reflected - vn); // Remove velocity added by update step (only meaningful if no collisions have occured)
            dv.add(contact.n.clone().multiplyScalar(vn_reflected - vn))

            this.applyBodyPairCorrection(
                contact.A,
                contact.B,
                dv,
                0.0,
                h,
                contact.p,
                contact.p,
                true
            );
        }
    }

    private applyPositionSolve(
        contact: ContactSet,
        corr: Vec3,
        dt: number,
    ) {
        const lambda = this.applyBodyPairCorrection(
            contact.A,
            contact.B,
            corr,
            0.0,
            dt,
            contact.p,
            contact.p,
            false
        )

        contact.lambdaN += lambda; // Assuming n is in the normal direction of the collision plane
    }

    private applyBodyPairCorrection(
        body0: RigidBody,
        body1: RigidBody,
        corr: Vec3,
        compliance: number,
        dt: number,
        pos0: Vec3 | null = null,
        pos1: Vec3 | null = null,
        velocityLevel = false
    ): number
    {

        const C = corr.length();
        // if ( C == 0.0)
        //     return 0;
        if (C < 0.00001)
            return 0;

        const normal = corr.clone();
        normal.normalize();
        
        const w0 = body0 ? body0.getInverseMass(normal, pos0) : 0.0;
        const w1 = body1 ? body1.getInverseMass(normal, pos1) : 0.0;

        const w = w0 + w1;

        // @TODO use EPS here instead
        if (w == 0.0)
            return 0;

        const lambda = -C / (w + compliance / dt / dt);
        normal.multiplyScalar(-lambda);

        if (body0)
            body0.applyCorrection(normal, pos0, velocityLevel);
        if (body1) {
            body1.applyCorrection(normal.multiplyScalar(-1.0), pos1, velocityLevel);
        }

        return lambda;
    }
}
