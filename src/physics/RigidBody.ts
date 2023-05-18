import { Pose } from './Pose';
import { Vec3 } from './Vec3';
import { Collider, MeshCollider } from './Collider';
import { BaseScene } from '../scene/BaseScene';
import { Quat } from './Quaternion';
import { World } from './World';
import { Color, Euler, Mesh, MeshStandardMaterial } from 'three';

export class RigidBody {

    public id: number = 0;

    public pose = new Pose();

    public isDynamic = true;
    public canCollide = true;

    public isSleeping = false;
    public canSleep = true;
    public sleepTimer = 0.0;

    static sleepThreshold = 1.0; // Seconds
    static debugSleepState = false;

    public mesh?: Mesh;
    public collider: Collider;

    public vel = new Vec3(0, 0, 0);
    public omega = new Vec3(0, 0, 0);

    private invMass = 1.0;
    private invInertia = new Vec3(1.0, 1.0, 1.0);

    public get mass(): number { return 1 / this.invMass; }
    public get inertia(): Vec3 { return new Vec3().set(
        1.0  / this.invInertia.x, 
        1.0  / this.invInertia.y, 
        1.0  / this.invInertia.z
    ); }

    public force = new Vec3();
    public torque = new Vec3();
    public gravity = 1.0;

    public staticFriction = 0.5;
    public dynamicFriction = 0.4;
    public restitution = 0.4;

    static maxRotationPerSubstep = 0.5;

    // 'private':
    public prevPose = new Pose();
    public velPrev = new Vec3(0, 0, 0);
    public omegaPrev = new Vec3(0, 0, 0);

    constructor(collider: Collider, mesh?: Mesh) {
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

    public setMesh(mesh: Mesh, applyTransform = true): this {
        this.mesh = mesh;
        mesh.userData.physicsBody = this;

        if (applyTransform) {
            this.pose = new Pose(new Vec3().copy(mesh.position), mesh.quaternion);
            this.prevPose.copy(this.pose);
        }
        
        // @TODO move somewhere else
        mesh.castShadow = true;
        mesh.receiveShadow = true;

        return this;
    }

    public setWireframe(state = false): this {
        if (this.mesh)
            (this.mesh.material as MeshStandardMaterial).wireframe = true;

        return this;
}

    public setRandomColor(): this {
        if (this.mesh) {
            const mat = (this.mesh.material as MeshStandardMaterial);
            mat.color = new Color().setHSL(Math.random(), 1.0, 0.7);
        }

        return this;
    }

    public setPos(x: number, y: number, z: number): this {
        this.pose.p.set(x, y, z);
        this.prevPose.copy(this.pose);
        
        this.updateGeometry();
        this.updateCollider();

        return this;
    }

    public setRotation(x: number, y: number, z: number): this {
        this.pose.q.setFromEuler(new Euler(x, y, z));
        this.prevPose.copy(this.pose);

        this.updateGeometry();
        this.updateCollider();

        return this;
    }

    public setOmega(x: number, y: number, z: number): this {
        this.omega.set(x, y, z);

        return this;
    }

    public setVel(x: number, y: number, z: number): this {
        this.vel.set(x, y, z);

        return this;
    }

    public setRestitution(restitution: number): this {
        this.restitution = restitution;

        return this;
    }

    public setFriction(staticFriction: number, dynamicFriction: number): this {
        this.staticFriction = staticFriction;
        this.dynamicFriction = dynamicFriction;

        return this;
    }

    public setCanCollide(canCollide = true): this {
        this.canCollide = canCollide;

        return this;
    }

    public setStatic(): this {
        this.isDynamic = false;
        this.gravity = 0.0;
        this.invMass = 0.0;
        this.invInertia = new Vec3(0.0);

        this.prevPose.copy(this.pose); // Just in case pose was changed directly after setting static

        this.collider.expanded_aabb.copy(this.collider.aabb);

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

    public setCylinder(radius: number, height: number, density = 1.0): this {

        /* Note flipping radius and height here seems to give better results */
        /* E.g. in the spinning coin example */
        const r2 = Math.pow(height, 2);
        const h2 = Math.pow(radius, 2);

        const mass = Math.PI * r2 * height * density
        this.invMass = 1.0 / mass;

        const I_axial = 0.5 * mass * r2;
        const I_radial = 1/12 * mass * ((3 * r2) + h2);

        this.invInertia.set(
            1.0 / I_radial,
            1.0 / I_axial,
            1.0 / I_radial,
        )

        return this;
    }

    public getVelocityAt(pos: Vec3): Vec3 {

        if (!this.isDynamic)
            return new Vec3(0, 0, 0);

        return Vec3.add(this.vel, Vec3.cross(this.omega, Vec3.sub(pos, this.pose.p)));
    }

    public getInverseMass(normal: Vec3, pos: Vec3 | null = null): number {
        if (!this.isDynamic)
            return 0;

        const n = new Vec3();

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

        const dq = new Vec3();

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

        // @TODO check if this improves stability
        // this.updateCollider();
    }

    public applyRotation(rot: Vec3, scale: number = 1.0): void {

        // Safety clamping. This happens very rarely if the solver
        // wants to turn the body by more than 30 degrees in the
        // orders of milliseconds
        const maxPhi = 0.5;
        const phi = rot.length();
        if (phi * scale > maxPhi)
            scale = maxPhi / phi;

        const dq = new Quat(
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

        this.prevPose.copy(this.pose);

        if (this.isSleeping)
            return;

        /* Euler step */
        this.vel.add(Vec3.mul(gravity, this.gravity * dt));
        this.vel.add(Vec3.mul(this.force, this.invMass * dt));
        this.pose.p.addScaledVector(this.vel, dt);
        
        this.omega.addScaledVector(this.torque.clone().multiply(this.invInertia), dt);
        this.applyRotation(this.omega, dt);
    }

    public update(dt: number): void {

        if (!this.isDynamic)
            return;

        /* Store the current velocities (required for the velocity solver) */
        this.velPrev.copy(this.vel);
        this.omegaPrev.copy(this.omega);

        /* Calculate velocity based on position change */
        this.vel.subVectors(this.pose.p, this.prevPose.p);
        this.vel.multiplyScalar(1.0 / dt);

        const dq = new Quat;
        dq.multiplyQuaternions(this.pose.q, this.prevPose.q.conjugate());

        this.omega.set(
            dq.x * 2.0 / dt,
            dq.y * 2.0 / dt,
            dq.z * 2.0 / dt
        );

        if (dq.w < 0.0)
            this.omega.set(-this.omega.x, -this.omega.y, -this.omega.z);
        
        this.updateCollider();
    }

    public applyForceW(force: Vec3, worldPos: Vec3 = new Vec3(0,0,0)) {
        this.wake();

        const F = force.clone();

        this.force.add(F);
        this.torque.add(F.cross(this.pose.p.clone().sub(worldPos)))
    }

    public updateGeometry() {
        
        if (this.isSleeping)
            return;

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

    public checkSleepState(dt: number) {

        if (!this.canSleep)
            return;

        const velLen = this.vel.lengthSq();
        const omegaLen = this.omega.lengthSq();
        
        const thresh = 0.001;
        
        if (this.isSleeping) {
            if (velLen > thresh || omegaLen > thresh)
                this.wake();
        } else {
            if (velLen < 5 * thresh) {
                this.vel.multiplyScalar(1.0 - 10.0 * dt);
            }
            if (omegaLen < 5 * thresh) {
                this.omega.multiplyScalar(1.0 - 10.0 * dt);
            }

            if (velLen < thresh && omegaLen < thresh) {
                if (this.sleepTimer > RigidBody.sleepThreshold) {
                    this.sleep();
                } else {
                    this.sleepTimer += dt;
                }
            }
        }
    }

    public sleep(): this {
        if (this.isSleeping)
            return this;

        this.vel.set(0, 0, 0);
        this.omega.set(0, 0, 0);
        this.velPrev.set(0, 0, 0);
        this.omegaPrev.set(0, 0, 0);

        this.isSleeping = true;

        if (RigidBody.debugSleepState) {
            const mat = (this.mesh?.material as MeshStandardMaterial);
            mat.color = new Color(0x007777);
        }
        
        return this;
    }

    public wake(): this {
        if (!this.isSleeping)
            return this;

        this.isSleeping = false;
        this.sleepTimer = 0.0;

        if (RigidBody.debugSleepState) {
            const mat = (this.mesh?.material as MeshStandardMaterial);
            mat.color = new Color(0x00ffff);
        }

        return this;
    }

}
