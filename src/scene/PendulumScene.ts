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

export class PendulumScene extends BaseScene {

    override init() {

        this.insert(new BaseLightingScene);

        /* Basic attachment */
        const bodies: RigidBody[] = [];

        const l = 1.0;
        const height = 3;

        for (let i = 0; i < 3; i++) {
            const b = Box(0.1, 0.1, l)
                .setPos(0, height, i * l + l/2)
                .setOmega(70, 0, 0)
                .setCanCollide(false)
                .addTo(this);

            bodies.push(b)
        }

        for (let i = 1; i < bodies.length; i += 1) {
            this.world.addConstraint(
                new Constraint(bodies[i], bodies[i - 1])
                    .add(new Attachment(
                            new Vec3(0, 0, l/2), 
                            new Vec3(0, 0, -l/2)
                        )
                    )
                    // .add(new AlignAxes())
            );
        }

        this.world.addConstraint(
            new Constraint(bodies[0])
                .add(new Attachment(
                        new Vec3(0, height, 0), 
                        new Vec3(0, 0, -l/2)
                    )
                )
        );

        this.addGround();

    }
}
