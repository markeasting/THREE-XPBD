import * as THREE from 'three'
import { Quat } from "./Quaternion";
import { RigidBody } from "./RigidBody";
import { CollisionPair } from "./CollisionPair";
import { ContactSet } from "./ContactSet";
import { Vec3 } from "./Vec3";
import { CoordinateSystem } from "./CoordinateSystem";
import { ColliderType, MeshCollider, PlaneCollider } from "./Collider";

export class XPBDSolver {

    static numSubsteps = 30;
    static numPosIters = 1;

    private scene: THREE.Scene;
    private debugVector = new THREE.ArrowHelper();

    constructor(scene: THREE.Scene) {
        this.scene = scene;
        this.scene.add(new THREE.AxesHelper(1));
        this.scene.add(new THREE.GridHelper(100));
        this.scene.add(this.debugVector);
    }

    private dd(vec: Vec3, pos: Vec3 = new Vec3(), length?: number) {
        length = length ? length : vec.length()

        if (pos)
            this.debugVector.position.copy(pos);

        this.debugVector.setDirection(vec.clone().normalize());
        this.debugVector.setLength(length);

        console.log(vec, pos, length);
    }

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

                                // This should be a simple AABB check instead of actual loop over all vertices
                                for(let i = 0; i < MC.uniqueIndices.length; i++) {
                                    const v = MC.vertices[MC.uniqueIndices[i]];

                                    const contactPointW = CoordinateSystem.localToWorld(v, A.pose.q, A.pose.p);
                                    // const signedDistance = contactPointW.clone().sub(B.pose.p).dot(N);
                                    const signedDistance = PC.plane.distanceToPoint(contactPointW);

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

                            const N = PC.plane.normal; // ASSUMES NORMALIZED PLANE NORMAL!!

                            // @TODO check if vertex is actually inside plane size :)
                            // @TODO maybe check if all vertices are in front of the plane first (skip otherwise)
                            for(let i = 0; i < MC.uniqueIndices.length; i++) {
                                const v = MC.vertices[MC.uniqueIndices[i]];

                                const contactPointW = CoordinateSystem.localToWorld(v, A.pose.q, A.pose.p);
                                // const signedDistance = contactPointW.clone().sub(B.pose.p).dot(N);
                                const signedDistance = PC.plane.distanceToPoint(contactPointW);

                                if (signedDistance < 0.0) {
                                    const contact = new ContactSet(A, B, PC.plane);
                                    contact.n = N.clone();
                                    contact.d = signedDistance;

                                    // Checked, these seem to be correct
                                    contact.r1 = v.clone();
                                    contact.r2 = PC.plane.projectPoint(contactPointW, contact.r2); // I HOPE THIS IS CORRECT

                                    contact.p1 = contactPointW;
                                    // Move point back 'up' the normal
                                    // @TODO check if in some cases, this should be subtraction instead!!
                                    contact.p2 = contactPointW.clone().addScalar(contact.d);
                                    
                                    // Set initial relative velocity
                                    // contact.v = new Vec3().subVectors(
                                    //     contact.A.getVelocityAt(contact.p1),
                                    //     contact.B.getVelocityAt(contact.p2)
                                    // );

                                    // (These used to be stored in `collision` from broadphase)
                                    contact.e = 0.5 * (A.bounciness + B.bounciness);
                                    contact.friction = 0.5 * (A.staticFriction + B.staticFriction);

                                    contacts.push(contact);
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

            const A = contact.A;
            const B = contact.B;
            const contactPointW = CoordinateSystem.localToWorld(contact.r1, A.pose.q, A.pose.p);
            // const contactPointW = contact.p1;
            // const signedDistance = contactPointW.clone().sub(B.pose.p).dot(contact.n);
            const signedDistance = contact.plane.distanceToPoint(contactPointW);

            contact.n = contact.plane.normal;
            contact.d = signedDistance;

            if(contact.d >= 0.0)
                continue;

            // Update actual contact positions
            contact.p1 = contactPointW;
            // Move point back 'up' the normal
            // @TODO check if in some cases, this should be subtraction instead!
            contact.p2 = contactPointW.clone().addScalar(contact.d);
            
            // Δx = dn
            const dx = contact.n
                .clone()
                .multiplyScalar(-contact.d)
            // const dx2 = contact.n.clone()
            //     .multiplyScalar(
            //         new Vec3().subVectors(contact.p1, contact.p2).dot(contact.n)
            //     );

            let delta_lambda = this.positional_constraint_get_delta_lambda(
                contact.A,
                contact.B,
                dx,
                0.0,
                h,
                contact.p1,
                contact.p2,
                contact.lambda_n
            );

            this.constraint_apply(
                contact.A,
                contact.B,
                contact.p1,
                contact.p2,
                dx,
                false,
                delta_lambda
            );
            contact.lambda_n += delta_lambda;


		    // Recalculate entity pair preprocessed data and p1/p2
            // calculate_positional_constraint_preprocessed_data
            const contactPointW2 = CoordinateSystem.localToWorld(contact.r1, A.pose.q, A.pose.p);
            const signedDistance2 = contact.plane.distanceToPoint(contactPointW2);
            contact.n = contact.plane.normal;
            contact.d = signedDistance2;
            contact.p1 = contactPointW2;
            contact.p2 = contactPointW2.clone().addScalar(contact.d);

            // eq. 27, 28 - friction
            // We should also add a constraint for static friction, but only if lambda_t < u_s * lambda_n
            delta_lambda = this.positional_constraint_get_delta_lambda(
                contact.A,
                contact.B,
                dx,
                0.0,
                h,
                contact.p1,
                contact.p2,
                contact.lambda_t
            );

            const lambda_n = contact.lambda_n;
            const lambda_t = contact.lambda_t + delta_lambda;

            if (lambda_t > contact.friction * lambda_n) {
                // const p1_til: Vec3 = gm_vec3_add(A.prevPose.p,
                //     quaternion_apply_to_vec3(A.prevPose.q, contact.r1_lc));
                // @TODO Is this just localToWorld?? 
                const p1_til: Vec3 = A.prevPose.p.clone().add(
                    contact.r1.clone().applyQuaternion(A.prevPose.q)
                );

                // const p2_til: Vec3 = gm_vec3_add(B.prevPose.p,
                //     quaternion_apply_to_vec3(B.prevPose.q, contact.r2_lc));
                // @TODO Is this just localToWorld?? 
                const p2_til: Vec3 = B.prevPose.p.clone().add(
                    contact.r2.clone().applyQuaternion(B.prevPose.q)
                );

                // const delta_p: Vec3 = gm_vec3_subtract(gm_vec3_subtract(p1, p1_til), gm_vec3_subtract(p2, p2_til));
                const delta_p: Vec3 = new Vec3().subVectors(
                    new Vec3().subVectors(contact.p1, p1_til), 
                    new Vec3().subVectors(contact.p2, p2_til)
                );
                
                // const delta_p_t: Vec3 = gm_vec3_subtract(delta_p, gm_vec3_scalar_product(
                //     gm_vec3_dot(delta_p, contact.n), contact.n));
                const delta_p_t: Vec3 = new Vec3().subVectors(delta_p, 
                    contact.n.clone().multiplyScalar(delta_p.dot(contact.n))
                );

                this.constraint_apply(
                    contact.A,
                    contact.B,
                    contact.p1,
                    contact.p2,
                    delta_p_t,
                    false,
                    delta_lambda
                );

                contact.lambda_t += delta_lambda;
            }


        }
    }

    // Parts taken from `felipeek/raw-physics`
    private solveVelocities(contacts: Array<ContactSet>, h: number) {

        for (const contact of contacts) {
            const dv = new Vec3();

            // (29) Relative velocity
            // @NOTE: equation (29) was modified here -> modified the same as I did in CPP version
            const v = new Vec3().subVectors(
                contact.A.getVelocityAt(contact.p1),
                contact.B.getVelocityAt(contact.p2)
            );
            const vPrev = new Vec3().subVectors(
                contact.A.getVelocityAt(contact.p1, true),
                contact.B.getVelocityAt(contact.p2, true)
            );
            const vn = v.dot(contact.n);
            const vt = new Vec3().subVectors(v, contact.n.clone().multiplyScalar(vn));
            
            // (30) Friction
            const fn = contact.lambda_n / h; // simplifly h^2 by ommiting h in the next calculation
            // @NOTE: equation (30) was modified here
            const friction = Math.min(contact.friction * Math.abs(fn), vt.length());
            dv.add(vt.clone().normalize().multiplyScalar(-friction));

            // (34), restitution
            const e = (Math.abs(vn) > (2.0 * 9.81 * h)) 
                ? contact.e 
                : 0.0;

            const restitution = -vn + Math.min(-e * vPrev.dot(contact.n), 0.0);
            // WHY must restitution this be negative here? 
            // I think it's because of the position update
            // This step probably *removes* some of the added restitution velocity
            dv.add(contact.n.clone().multiplyScalar(restitution)); 

            const lambda = this.positional_constraint_get_delta_lambda(
                contact.A,
                contact.B,
                dv,
                0.0,
                h,
                contact.p1,
                contact.p2,
                contact.lambda
            );

            this.constraint_apply(
                contact.A,
                contact.B,
                contact.p1,
                contact.p2,
                dv,
                true,
                lambda
            );

            contact.v.copy(v);
        }
    }

    private positional_constraint_get_delta_lambda(
        body0: RigidBody,
        body1: RigidBody,
        corr: Vec3,
        compliance: number,
        h: number,
        pos0: Vec3 | null = null,
        pos1: Vec3 | null = null,
        lambda: number,
    ): number
    {

        const C = corr.length();

        if (C < 0.000001)
            return 0;

        const n = corr.clone();
        n.normalize();
        
        const w0 = body0 ? body0.getInverseMass(n, pos0) : 0.0;
        const w1 = body1 ? body1.getInverseMass(n, pos1) : 0.0;

        const w = w0 + w1;

        // @TODO use EPS here instead
        if (w == 0.0)
            return 0;
            
        // const dlambda = -C / (w + compliance / dt / dt);
        const til_compliance = compliance / (h * h);
        const dlambda = (-C - til_compliance * lambda) / (w0 + w1 + til_compliance);

        return dlambda;
    }

    private constraint_apply(
        body0: RigidBody,
        body1: RigidBody,
        pos0: Vec3 | null = null,
        pos1: Vec3 | null = null,
        corr: Vec3,
        velocityLevel = false,
        dlambda: number,
    ): void
    {

        const C = corr.length();

        if (C < 0.000001)
            return;

        // p = Δλn
        const p = new Vec3(corr.x / C, corr.y / C, corr.z / C);
        p.multiplyScalar(dlambda); 

        body0.applyCorrection(p.multiplyScalar(-1.0), pos0, velocityLevel);
        body1.applyCorrection(p, pos1, velocityLevel);
    }
}
