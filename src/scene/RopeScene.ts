import { BaseScene } from './BaseScene';
import { BaseLightingScene } from './components/BaseLightingScene';
import { Vec3 } from '../physics/Vec3';
import { Box } from '../physics/body/Box';
import { Joint, JointType } from '../physics/constraint/Joint';
import { Constraint } from '../physics/constraint/Constraint';
import { Attachment } from '../physics/constraint/Attachment';
import { AlignOrientation } from '../physics/constraint/AlignOrientation';
import { AlignAxes } from '../physics/constraint/AlignAxes';
import { RigidBody } from '../physics/RigidBody';

export class RopeScene extends BaseScene {

    override init() {

        this.insert(new BaseLightingScene);

        /* Constraint examples */
        let b0, b1;

        /* Basic attachment */
        const bodies: RigidBody[] = [];

        for (let i = 0; i < 20; i++) {
            const b = Box(0.1, 0.1, 0.4) // Box(0.3 - i * 0.01)
                .setPos(0, 7, i)
                .addTo(this);

            if (i == 0) 
                b.setStatic();

            bodies.push(b)
        }

        for (let i = 1; i < bodies.length; i++) {
            this.world.addConstraint(
                new Constraint(bodies[i], bodies[i - 1])
                    .add(new Attachment(
                            new Vec3(0, 0, -0.23), 
                            new Vec3(0, 0, 0.23)
                        ).setCompliance(0.01).setDamping(300)
                    )
                    // .add(new AlignOrientation().setCompliance(0.05))
            );
        }

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
