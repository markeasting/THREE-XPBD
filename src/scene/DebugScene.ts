import { BaseScene } from './BaseScene';
import { BaseDebugScene } from './components/BaseDebugScene';
import { Vec3 } from '../physics/Vec3';
import { Box } from '../physics/body/Box';
import { BufferGeometry, Line, LineLoop, Matrix4, Mesh, MeshBasicMaterial, SphereGeometry } from 'three';
import { Vec2 } from '../physics/Vec2';
import { Tetra } from '../physics/body/Tetra';

export class DebugScene extends BaseScene {

    override init() {

        this.insert(new BaseDebugScene);

        Box(4, 2, 3)
            .setWireframe(true)
            .setPos(2, 2, 0)
            // .setRotation(0, 0, 0.2)
            .setStatic()
            .addTo(this);

        Box(1, 1, 2)
            .setWireframe(true)
            .setPos(2, 4, 0)
            .addTo(this);

        // Tetra(1)
        //     .setWireframe(true)
        //     .setPos(2, 5, 0)
        //     .addTo(this);

        const d = 1; // box size

        /* Stacked boxes */
        // for (let i = 0; i < 6; i++) {
        //     Box(d, d, d, 10)
        //         .setWireframe(true)
        //         .setPos(5, (d - d/2 + 0.01) + d * i, 0)
        //         .addTo(this);
        // }

        this.addGround();

        // // Define the 3D plane and the projected points
        // const planeNormal = new Vec3(0, 1, 0).normalize(); // Normal vector of the plane (assuming it's aligned with the Z-axis)
        // const planePoint = new Vec3(0, 0, 0); // A point on the plane
        // const projectedPoints3D = [
        //     new Vec3(1, 2, 3),
        //     new Vec3(-2, 1, 4),
        //     new Vec3(3, -1, 5)
        // ];

        // // Create a matrix to transform the points
        // const transformMatrix = new Matrix4();
        // transformMatrix.lookAt(planePoint, planePoint.clone().add(planeNormal), new Vec3(0, 1, 0));

        // // Transform the 3D points to the 2D plane (z-coordinate becomes zero)
        // const projectedPoints2D: Vec2[] = [];
        // for (const point3D of projectedPoints3D) {

        //     const projectedPoint3D = point3D.clone().applyMatrix4(transformMatrix);
        //     const projectedPoint2D = new Vec2(projectedPoint3D.x, projectedPoint3D.y);
        //     projectedPoints2D.push(projectedPoint2D);

        //     const point1 = new Mesh(
        //         new SphereGeometry(0.1),
        //         new MeshBasicMaterial({ color: 0xff00ff }),
        //     );
        //     const point2 = new Mesh(
        //         new SphereGeometry(0.1),
        //         new MeshBasicMaterial({ color: 0x00ff00 }),
        //     );

        //     this.scene.add(point1);
        //     this.scene.add(point2);

        //     point1.position.copy(point3D);
        //     point2.position.set(projectedPoint2D.x, projectedPoint2D.y, 0);
        // }

        // const projectedPoints3D_2: Vec3[] = [];
        // const inverseTransformMatrix = transformMatrix.clone().invert();
        // for (const point2D of projectedPoints2D) {
        //     const point3DHomogeneous = new Vec3(point2D.x, point2D.y, 0).applyMatrix4(inverseTransformMatrix);
        //     const point3D = new Vec3(point3DHomogeneous.x, point3DHomogeneous.y, point3DHomogeneous.z);
        //     projectedPoints3D_2.push(point3D);
        // }

        // const geometry = new BufferGeometry().setFromPoints( projectedPoints2D );
        // const line = new LineLoop( geometry, new MeshBasicMaterial({ color: 0x666666 }) );
        // this.scene.add(line);

        // const geometry2 = new BufferGeometry().setFromPoints( projectedPoints3D_2 );
        // const line2 = new LineLoop( geometry2, new MeshBasicMaterial({ color: 0x666666 }) );
        // this.scene.add(line2);


    }
    
    public update(time: number, dt: number, keys: Record<string, boolean>): void {
        if (keys.KeyA)
            this.world.bodies[0].setRotation(0, time, 0);
    }

}
