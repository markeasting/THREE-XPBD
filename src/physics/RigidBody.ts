import * as THREE from 'three'
import { Pose } from './Pose';
import { Vec3 } from './Vec3';
import { Collider } from './Collider';
import { BaseScene } from '../scene/BaseScene';
import { Quat } from './Quaternion';
import { XPBDSolver } from './XPBDSolver';
import { CoordinateSystem } from './CoordinateSystem';

export class RigidBody {

    public mesh: THREE.Mesh;
    public collider: Collider;

    public pose: Pose;
    public prevPose: Pose;

    public vel = new Vec3(0.0, 0.0, 0.0);
    public omega = new Vec3(0.0, 0.0, 0.0);

    // Pre velocity solve velocities
    public velPrev = new Vec3(0.0, 0.0, 0.0);
    public omegaPrev = new Vec3(0.0, 0.0, 0.0);

    // private mass = 1.0;
    private invMass = 1.0;

    // private mass = 1.0;
    private invInertia = new Vec3(1.0, 1.0, 1.0);

    public force = new Vec3();
    public torque = new Vec3();
    public gravity = 1.0;
    
    public bounciness = 0.6; // coefficient of restitution (e)
    public staticFriction = 0.5;
    public dynamicFriction = 0.3;

    public isDynamic = true;

    static maxRotationPerSubstep = 0.5;

    constructor(mesh: THREE.Mesh, collider: Collider) {
        this.mesh = mesh;
        this.collider = collider;

        this.pose = new Pose(mesh.position, mesh.quaternion);
        this.prevPose = this.pose.clone();

        // @TODO move somewhere else
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        // mesh.userData.physicsBody = this; // idk

        window.addEventListener('keydown', (e) => {
            const tetraPointL = new Vec3(0, 1, 0);
            const tetraPointW = CoordinateSystem.localToWorld(tetraPointL, this.pose.q, this.pose.p);

            if (e.code == 'KeyQ') {
                this.applyForceW(
                    new Vec3(0, 100, 0),
                    tetraPointW
                );
            }
        })
    }

    public addTo(scene: BaseScene) {
        scene.scene.add(this.mesh);
        scene.world.add(this);
    }

    public makeStatic() {
        this.isDynamic = false;
        this.gravity = 0.0;
        this.invMass = 0.0;
        this.invInertia = new Vec3(0.0);

        this.updateGeometry();
        this.updateCollider();
    }

    public applyForceW(force: Vec3, worldPos: Vec3 = new Vec3(0,0,0)) {
        const F = force.clone();

        this.force.add(F);
        this.torque.add(F.cross(this.pose.p.clone().sub(worldPos)))
    }

    public setBox(size: Vec3, density = 1.0): void {
        let mass = size.x * size.y * size.z * density;
        this.invMass = 1.0 / mass;
        mass /= 12.0;
        this.invInertia.set(
            1.0 / (size.y * size.y + size.z * size.z) / mass,
            1.0 / (size.z * size.z + size.x * size.x) / mass,
            1.0 / (size.x * size.x + size.y * size.y) / mass);
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

    public getVelocityAt(pos: Vec3, usePrevVelocity = false): Vec3 {

        if (!this.isDynamic)
            return new Vec3(0, 0, 0);

        // Original
        // let vel = new THREE.Vector3(0.0, 0.0, 0.0);					
        // vel.subVectors(pos, this.pose.p);
        // vel.cross(this.omega);
        // vel.subVectors(this.vel, vel);
        // return vel;

        const v = usePrevVelocity ? this.velPrev.clone() : this.vel.clone();
        const o = usePrevVelocity ? this.omegaPrev.clone() : this.omega.clone();

        return v.clone().add(o.clone().cross(new Vec3().subVectors(pos, this.pose.p)));
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
        if (this.pose.p.length() > 0.0001) // from CPP
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

        this.vel.addScaledVector(gravity.clone().multiplyScalar(this.gravity), dt);
        this.vel.addScaledVector(this.force.clone().multiplyScalar(this.invMass), dt);
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

        // @TODO maybe only update collider,
        // leave mesh to update only once per frame (after substeps)
        this.updateGeometry();
        this.updateCollider();
    }

    private updateGeometry() {
        this.mesh.position.copy(this.pose.p);
        this.mesh.quaternion.copy(this.pose.q);
    }

    private updateCollider() {
        this.collider.updateRotation(this.pose.q);
    }

}
