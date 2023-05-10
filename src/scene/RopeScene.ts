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

        const bodies: RigidBody[] = [];

        const l = 0.3;
        const height = 5;

        for (let i = 0; i < 30; i++) {
            const b = Box(0.05, 0.05, l, 50)
                .setPos(0, height, i * l + l/2)
                // .setStatic()
                // .setWireframe()
                // .setCanCollide(false)
                .addTo(this);

            bodies.push(b)
        }

        /* Attach all bodies */
        for (let i = 1; i < bodies.length; i++) {
            this.world.addConstraint(
                new Constraint(bodies[i], bodies[i - 1])
                    .add(new Attachment(
                            new Vec3(0, 0, l/2 * 1.2), 
                            new Vec3(0, 0, -l/2)
                        ).setCompliance(0.0).setDamping(500)
                    )
                    // .add(new AlignOrientation().setCompliance(20))
            );
        }

        /* Attach to world */
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
