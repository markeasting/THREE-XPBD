import * as THREE from 'three'
import { Pose } from './Pose';
import { Vec3 } from './Vec3';
import { Collider, MeshCollider } from './Collider';
import { BaseScene } from '../scene/BaseScene';
import { Quat } from './Quaternion';
import { World } from './World';

export class RigidBody {

    public id: number = 0;

    public mesh?: THREE.Mesh;
    public collider: Collider;

    public pose = new Pose();
    public prevPose = new Pose();

    public vel = new Vec3(0.0, 0.0, 0.0);
    public omega = new Vec3(0.0, 0.0, 0.0);

    public velPrev = new Vec3(0.0, 0.0, 0.0);
    public omegaPrev = new Vec3(0.0, 0.0, 0.0);

    private invMass = 1.0;
    private invInertia = new Vec3(1.0, 1.0, 1.0);
    public get mass() { return 1 / this.invMass; }

    public force = new Vec3();
    public torque = new Vec3();
    public gravity = 1.0;

    public bounciness = 0.5; // coefficient of restitution (e)
    public staticFriction = 0.5;
    public dynamicFriction = 0.3;

    public isDynamic = true;

    static maxRotationPerSubstep = 0.5;

    constructor(collider: Collider, mesh?: THREE.Mesh) {
        this.collider = collider;

        if (mesh) {
            this.setMesh(mesh);
        }

        return this;
    }

    public addTo(scene: BaseScene): this {
        scene.world.add(this);

        if (this.mesh)
            scene.scene.add(this.mesh);

        if (this.collider instanceof MeshCollider) {
            World.debugAABBs.add(this.collider.aabbHelper);
            World.debugConvexHulls.add(this.collider.convexHull);
        }

        return this;
    }

    public setMesh(mesh: THREE.Mesh, applyTransform = true): this {
        this.mesh = mesh;
        mesh.userData.physicsBody = this;

        if (applyTransform) {
            this.pose = new Pose(new Vec3().copy(mesh.position), mesh.quaternion);
            this.prevPose = this.pose.clone();
        }
        
        // @TODO move somewhere else
        mesh.castShadow = true;
        mesh.receiveShadow = true;

        return this;
    }

    public setPos(x: number, y: number, z: number) {
        this.pose.p.set(x, y, z);
        this.updateGeometry();
        this.updateCollider();

        return this;
    }

    public setStatic(): this {
        this.isDynamic = false;
        this.gravity = 0.0;
        this.invMass = 0.0;
        this.invInertia = new Vec3(0.0);

        this.updateGeometry();
        this.updateCollider();

        return this;
    }

    public setBox(size: Vec3, density = 1.0): this {
        let mass = size.x * size.y * size.z * density;
        this.invMass = 1.0 / mass;
        mass /= 12.0;
        this.invInertia.set(
            1.0 / (size.y * size.y + size.z * size.z) / mass,
            1.0 / (size.z * size.z + size.x * size.x) / mass,
            1.0 / (size.x * size.x + size.y * size.y) / mass);

        return this;
    }

    public getVelocityAt(pos: Vec3, usePrevVelocity = false): Vec3 {

        if (!this.isDynamic)
            return new Vec3(0, 0, 0);

        // Original
        // let vel = new Vec3(0.0, 0.0, 0.0);
        // vel.subVectors(pos, this.pose.p);
        // vel.cross(this.omega);
        // vel.subVectors(this.vel, vel);
        // return vel;

        const v = usePrevVelocity ? this.velPrev.clone() : this.vel.clone();
        const o = usePrevVelocity ? this.omegaPrev.clone() : this.omega.clone();
        const p = usePrevVelocity ? this.prevPose.p.clone() : this.pose.p.clone();

        // return v.clone().add(o.clone().cross(new Vec3().subVectors(pos, p)));
        return Vec3.add(v, Vec3.cross(o, Vec3.sub(pos, p)));
    }

    public getInverseMass(normal: Vec3, pos: Vec3 | null = null): number {
        if (!this.isDynamic)
            return 0;

        let n = new Vec3();

        if (pos === null)
            n.copy(normal);
        else {
            n.subVectors(pos, this.pose.p);
            n.cross(normal);
        }

        this.pose.invRotate(n);
        let w =
            n.x * n.x * this.invInertia.x +
            n.y * n.y * this.invInertia.y +
            n.z * n.z * this.invInertia.z;

        // if (pos !== null)
        //     w += this.invMass;
        if (pos !== null && pos.length() > 0.00001)
            w += this.invMass;

        return w;
    }

    public applyCorrection(corr: Vec3, pos: Vec3 | null = null, velocityLevel = false): void {
        if (!this.isDynamic)
            return;

        let dq = new Vec3();

        if (pos === null)
            dq.copy(corr);
        else {
            if (velocityLevel)
                this.vel.addScaledVector(corr, this.invMass);
            else
                this.pose.p.addScaledVector(corr, this.invMass);

            dq.subVectors(pos, this.pose.p);
            dq.cross(corr);
        }

        this.pose.invRotate(dq);
        dq.set(
            this.invInertia.x * dq.x,
            this.invInertia.y * dq.y,
            this.invInertia.z * dq.z
        );
        this.pose.rotate(dq);

        if (velocityLevel)
            this.omega.add(dq);
        else
            this.applyRotation(dq);

        // @TODO remove later
        // this.updateGeometry();
        // this.updateCollider();
    }

    public applyRotation(rot: Vec3, scale: number = 1.0): void {

        // safety clamping. This happens very rarely if the solver
        // wants to turn the body by more than 30 degrees in the
        // orders of milliseconds
        let maxPhi = 0.5;
        let phi = rot.length();
        if (phi * scale > RigidBody.maxRotationPerSubstep)
            scale = RigidBody.maxRotationPerSubstep / phi;

        let dq = new Quat(
            rot.x * scale,
            rot.y * scale,
            rot.z * scale,
            0.0
        );
        dq.multiply(this.pose.q);

        this.pose.q.set(
            this.pose.q.x + 0.5 * dq.x,
            this.pose.q.y + 0.5 * dq.y,
            this.pose.q.z + 0.5 * dq.z,
            this.pose.q.w + 0.5 * dq.w
        );
        this.pose.q.normalize();
    }

    public integrate(dt: number, gravity: Vec3): void {
        if (!this.isDynamic)
            return;

        // @TODO apply force here
        // this->vel += glm::vec3(0, this->gravity, 0) * dt;
        // this->vel += this->force * this->invMass * dt;
        // this->omega += this->torque * this->invInertia * dt;
        // this->pose.p += this->vel * dt;
        // this->applyRotation(this->omega, dt);

        this.prevPose.copy(this.pose);

        this.vel.add(Vec3.mul(gravity, this.gravity * dt));
        this.vel.add(Vec3.mul(this.force, this.invMass * dt));
        this.omega.addScaledVector(this.torque.clone().multiply(this.invInertia), dt);
        this.pose.p.addScaledVector(this.vel, dt);
        this.applyRotation(this.omega, dt);

        // this.prevPose.copy(this.pose);
        // this.vel.addScaledVector(gravity, dt);
        // this.pose.p.addScaledVector(this.vel, dt);
        // this.applyRotation(this.omega, dt);
    }

    public update(dt: number): void {
        if (!this.isDynamic)
            return;

        // Store the current velocities (this is needed for the velocity solver)
        this.velPrev.copy(this.vel);
        this.omegaPrev.copy(this.omega);

        this.vel.subVectors(this.pose.p, this.prevPose.p);
        this.vel.multiplyScalar(1.0 / dt);

        let dq = new Quat;
        dq.multiplyQuaternions(this.pose.q, this.prevPose.q.conjugate());

        this.omega.set(
            dq.x * 2.0 / dt,
            dq.y * 2.0 / dt,
            dq.z * 2.0 / dt
        );

        if (dq.w < 0.0)
            this.omega.set(-this.omega.x, -this.omega.y, -this.omega.z);

        // this.omega.multiplyScalar(1.0 - 1.0 * dt);
        // this.vel.multiplyScalar(1.0 - 1.0 * dt);

        // if (this.vel.length() < 0.005)
        //     this.vel.multiplyScalar(0);

        // if (this.omega.length() < 0.005)
        //     this.omega.multiplyScalar(0);

        // @TODO maybe only update collider,
        // leave mesh to update only once per frame (after substeps)
        // this.updateGeometry();
        this.updateCollider();
    }

    public applyForceW(force: Vec3, worldPos: Vec3 = new Vec3(0,0,0)) {
        const F = force.clone();

        this.force.add(F);
        this.torque.add(F.cross(this.pose.p.clone().sub(worldPos)))
    }

    public updateGeometry() {
        if (this.mesh) {
            this.mesh.position.copy(this.pose.p);
            this.mesh.quaternion.copy(this.pose.q);
        }

        if (this.collider instanceof MeshCollider) {
            this.collider.convexHull.position.copy(this.pose.p);
            this.collider.convexHull.quaternion.copy(this.pose.q);
        }
    }

    public updateCollider() {
        this.collider.updateGlobalPose(this.pose);
    }

    public localToWorld(v: Vec3) {
        return new Vec3()
            .copy(v)
            .applyQuaternion(this.pose.q)
            .add(this.pose.p);
    }

    public worldToLocal(v: Vec3) {
        return new Vec3()
            .copy(v)
            .sub(this.pose.p)
            .applyQuaternion(this.pose.q.clone().conjugate())
    }

}
