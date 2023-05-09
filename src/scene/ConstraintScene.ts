import { BaseScene } from './BaseScene';
import { BaseLightingScene } from './components/BaseLightingScene';
import { Vec3 } from '../physics/Vec3';
import { Box } from '../physics/body/Box';
import { Joint, JointType } from '../physics/constraint/Joint';
import { Constraint } from '../physics/constraint/Constraint';
import { Attachment } from '../physics/constraint/Attachment';
import { AlignOrientation } from '../physics/constraint/AlignOrientation';
import { AlignAxes } from '../physics/constraint/AlignAxes';

export class ConstraintScene extends BaseScene {

    override init() {

        this.insert(new BaseLightingScene);

        /* Constraint examples */
        let b0, b1;

        /* Hinge */
        b0 = Box(2, 1, 0.1).setPos(3, 1.5, 1).addTo(this);
        b1 = Box(2, 0.1, 1).setPos(3, 2, 0.4).addTo(this).setStatic();

        this.world.addConstraint(
            new Constraint(b0, b1)
                .add(new Attachment(new Vec3(0, 0, 0.5), new Vec3(0, 0.6, 0)))
                .add(new AlignAxes)
                // .add(new AlignOrientation)
        );

        this.world.addConstraint(
            new Constraint(b0, b1)
                .add(new Attachment(new Vec3(0, 0, 0.5), new Vec3(0, 0.6, 0)))
                // .add(new AlignAxes)
                // .add(new AlignOrientation)
        );

        /* Basic attachment */
        b0 = Box(1.0).setPos(-3, 3, 0).addTo(this);
        b1 = Box(1.0).setPos(-3, 2, 2).addTo(this);

        this.world.addConstraint(
            new Constraint(b0, b1)
                .add(new Attachment(
                        new Vec3(0, 1, 0), 
                        new Vec3(0, 1, 0)
                    ).setCompliance(0.01).setDamping(5, 5)
                )
        );

        /* Hammer */
        // b0 = Box(0.2, 0.2, 7).setPos(0, 2, 3)
        // b1 = Box(2, 1, 1).setPos(0, 2, 0.5)
        // this.addBody(b0);
        // this.addBody(b1);

        // this.world.addConstraint(
        //     new Constraint(b0, b1)
        //         .add(new Attachment(new Vec3(0.1, 0, 0.5), new Vec3(0, 0, -2)))
        //         .add(new AlignOrientation)
        // );
        
        // this.world.addConstraint(
        //     new Constraint(b0, b1)
        //         .add(new Attachment(new Vec3(0.1, 0, -0.5), new Vec3(0, 0, -3)))
        //         // .add(new AlignOrientation)
        // );

        this.addGround();

    }

    public update(time: number, dt: number, keys: Record<string, boolean>): void {

        if (keys.KeyA) {
            const body = this.world.bodies[0];
            const tetraPointL = new Vec3(0, 0, 0);
            const tetraPointW = body.localToWorld(tetraPointL);

            const strength = 3;
            body.applyForceW(
                new Vec3(0, 0, body.mass * this.world.gravity.y * -strength),
                tetraPointW
            );
        }
    }

}
