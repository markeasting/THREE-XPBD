import * as THREE from 'three'
import { Pose } from './Pose';
import { Vec3 } from './Vec3';
import { Quat } from './Quaternion';
import { Collider } from './Collider';

export class RigidBody {

    public mesh: THREE.Mesh;
    public collider: Collider;

    public pose: Pose;
    public prevPose: Pose;

    public vel = new Vec3(0.0, 0.0, 0.0);
    public omega = new Vec3(0.0, 0.0, 0.0);

    // private mass = 1.0;
    private invMass = 1.0;

    // private mass = 1.0;
    private invInertia = new Vec3(1.0, 1.0, 1.0);

    public isDynamic = true;

    static maxRotationPerSubstep = 0.5;

    constructor(mesh: THREE.Mesh, collider: Collider) {
        this.mesh = mesh;
        this.collider = collider;

        this.mesh.castShadow = true;
        // this.mesh->managedByRigidBody = true;
        this.pose = new Pose(mesh.position, mesh.quaternion);
        this.prevPose = this.pose;

        // mesh.userData.physicsBody = this; // idk
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

        let dq = new THREE.Quaternion(
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
        this.prevPose.copy(this.pose);
        this.vel.addScaledVector(gravity, dt);
        this.pose.p.addScaledVector(this.vel, dt);
        this.applyRotation(this.omega, dt);
    }

    public update(dt: number): void {
        this.vel.subVectors(this.pose.p, this.prevPose.p);
        this.vel.multiplyScalar(1.0 / dt);

        let dq = new THREE.Quaternion();
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

        this.mesh.position.copy(this.pose.p);
        this.mesh.quaternion.copy(this.pose.q);
    }

    public getVelocityAt(pos: Vec3): Vec3 {
        let vel = new Vec3(0.0, 0.0, 0.0);
        vel.subVectors(pos, this.pose.p);
        vel.cross(this.omega);
        vel.subVectors(this.vel, vel);

        return vel;
    }

    public getInverseMass(normal: Vec3, pos: Vec3 | null = null): number {
        let n = new THREE.Vector3();

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

        if (pos !== null)
            w += this.invMass;

        return w;
    }

    public applyCorrection(corr: Vec3, pos: Vec3 | null = null, velocityLevel = false): void {
        let dq = new THREE.Vector3();

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

    // public addTo(scene: THREE.Scene, world: CANNON.World) {
    //     scene.add(this.mesh);
    //     world.addBody(this.body);
    // }

}