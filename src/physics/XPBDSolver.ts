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
        const h = dt / XPBDSolver.numSubsteps;

        const collisions = this.broadPhaseCollision(bodies, dt); // Should this be h instead of dt?

        for (let i = 0; i < XPBDSolver.numSubsteps; i++) {

            const contacts = this.getContacts(collisions);

            for (let j = 0; j < bodies.length; j++)
                bodies[j].integrate(h, gravity);

            // (Constraints)
            // for (let j = 0; j < joints.length; j++)
            //     joints[j].solvePos(h);

            for (let j = 0; j < XPBDSolver.numPosIters; j++)
                this.solvePositions(contacts, h);

            for (let j = 0; j < bodies.length; j++)
                bodies[j].update(h);


            // (Constraints)
            // for (let j = 0; j < joints.length; j++)
            //     joints[j].solveVel(h);
            this.solveVelocities(contacts, h);
        }
    }

    private broadPhaseCollision(bodies: Array<RigidBody>, dt: number) {

        const contacts: Array<CollisionPair> = [];

        for (const A of bodies) {
            for (const B of bodies) {

                if ((A == B) || (!A.isDynamic && !B.isDynamic))
                    continue;

                // k*dt*vbody (3.5)
                // const float collisionMargin = 2.0f * (float) dt * glm::length(A.vel - B.vel);
                const collisionMargin = 2.0 * dt * A.vel.sub(B.vel).length();

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

                                    // Assuming v is type Vertex
                                    // const contactPointW = CoordinateSystem.localToWorld(v.position, A.pose.q, A.pose.p);
                                    const contactPointW = CoordinateSystem.localToWorld(v.position, A.pose.q, A.pose.p);

                                    // const signedDistance = glm::dot(N, (contactPointW - B.pose.p));
                                    const signedDistance = N.dot(contactPointW.sub(B.pose.p));

                                    if(signedDistance < collisionMargin) {
                                        const e = 0.5; // 0.5 * (A.bounciness + B.bounciness);
                                        const friction = 0.5; // 0.5 * (A.staticFriction + B.staticFriction);
                                        contacts.push({ A, B, e, friction });
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

        for (const collision of collisions) {

            const A = collision.A;
            const B = collision.B;

            if ((A == B) || (!A.isDynamic && !B.isDynamic))
                continue;

            switch(A.collider.colliderType) {
                case ColliderType.ConvexMesh :
                    switch(B.collider.colliderType) {
                        case ColliderType.Plane : {

                            const MC = A.collider as MeshCollider;
                            const PC = B.collider as PlaneCollider;

                            const N = PC.normal;

                            const contactSet = new ContactSet(A, B);

                            let deepestPenetration = 0.0;

                            // @TODO check if vertex is actually inside plane size :)
                            for(let i = 0; i < MC.uniqueIndices.length; i++) {
                                const v = MC.vertices[MC.uniqueIndices[i]];

                                // Assuming v is type Vertex
                                // const contactPointW = CoordinateSystem.localToWorld(v.position, A.pose.q, A.pose.p);
                                const contactPointW = CoordinateSystem.localToWorld(v.position, A.pose.q, A.pose.p);

                                // const signedDistance = glm::dot(N, (contactPointW - B.pose.p));
                                const signedDistance = N.dot(contactPointW.sub(B.pose.p));

                                if(signedDistance < deepestPenetration) {
                                    deepestPenetration = signedDistance;

                                    contactSet.p = contactPointW;
                                    contactSet.d = signedDistance;
                                    contactSet.n = N;
                                }
                            }

                            if(deepestPenetration < 0.0) {
                                const vrel = new Vec3().subVectors(
                                    A.getVelocityAt(contactSet.p),
                                    B.getVelocityAt(contactSet.p)
                                );

                                // contactSet.vn = glm::dot(contactSet.n, vrel);
                                contactSet.vn = vrel.dot(contactSet.n);

                                contactSet.e = collision.e;
                                contactSet.friction = collision.friction;

                                contacts.push(contactSet);
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

            if(contact.d >= 0.0)
                continue; // Contact has been solved

            // contact.A.hasCollided = true;
            // contact.B.hasCollided = true;

            // glm::vec3 posCorr = -contact.d * contact.n;
            const posCorr = new Vec3()
                .copy(contact.n)
                .multiplyScalar(-contact.d);

            this.applyBodyPairCorrection(
                contact.A,
                contact.B,
                posCorr,
                0.0,
                h,
                contact.p,
                contact.p,
                false
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
            const v = new Vec3().subVectors(contact.A.getVelocityAt(contact.p), contact.B.getVelocityAt(contact.p));
            // const vn = glm::dot(contact.n, v);
            const vn = v.dot(contact.n);

            // glm::vec3 vt = v - (contact.n * vn);
            // float vt_length = glm::length(vt);

            // // (30) Friction
            // if(vt_length > 0.001f) {
            //     float h_squared = (float) h * (float) h;
            //     float Fn = -contact.lambdaN / h_squared;
            //     dv -= glm::normalize(vt) * std::min((float) h * contact.friction * Fn, vt_length);
            // }

            // (31, 32) @TODO dampening

            // (34), restitution
            // if(vn < 0.01f) {
                const e = (Math.abs(vn) > (1.0 * 9.81 * h)) ? contact.e : 0.0;

                const vn_reflected = Math.max(-e * contact.vn, 0.0);
                // dv += contact.n * (-vn + std::max(-e * contact.vn, 0.0));
                // dv += contact.n * (vn_reflected - vn); // Remove velocity added by update step (only meaningful if no collisions have occured)
                dv.add(new Vec3().copy(contact.n).multiplyScalar(vn_reflected - vn))
            // }

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

            // contact.A.hasCollided = false;
            // contact.B.hasCollided = false;

        }
    }

    private applyBodyPairCorrection(
        body0: RigidBody,
        body1: RigidBody,
        corr: Vec3,
        compliance: number,
        dt: number,
        pos0 = null,
        pos1 = null,
        velocityLevel = false
    ): void
    {

        let C = corr.length();
        if ( C == 0.0)
            return;

        let normal = corr.clone();
        normal.normalize();

        let w0 = body0 ? body0.getInverseMass(normal, pos0) : 0.0;
        let w1 = body1 ? body1.getInverseMass(normal, pos1) : 0.0;

        let w = w0 + w1;
        if (w == 0.0)
            return;

        let lambda = -C / (w + compliance / dt / dt);
        normal.multiplyScalar(-lambda);
        if (body0)
            body0.applyCorrection(normal, pos0, velocityLevel);
        if (body1) {
            normal.multiplyScalar(-1.0);
            body1.applyCorrection(normal, pos1, velocityLevel);
        }
    }

    private getQuatAxis0(q: Quat): Vec3 {
        let x2 = q.x * 2.0;
        let w2 = q.w * 2.0;
        return new Vec3((q.w * w2) - 1.0 + q.x * x2, (q.z * w2) + q.y * x2, (-q.y * w2) + q.z * x2);
    }
    private getQuatAxis1(q: Quat): Vec3 {
        let y2 = q.y * 2.0;
        let w2 = q.w * 2.0;
        return new Vec3((-q.z * w2) + q.x * y2, (q.w * w2) - 1.0 + q.y * y2, (q.x * w2) + q.z * y2);
    }
    private getQuatAxis2(q: Quat): Vec3 {
        let z2 = q.z * 2.0;
        let w2 = q.w * 2.0;
        return new Vec3((q.y * w2) + q.x * z2, (-q.x * w2) + q.y * z2, (q.w * w2) - 1.0 + q.z * z2);
    }

}
