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
import { Tetra } from '../physics/body/Tetra';

export class DragonTailScene extends BaseScene {

    override init() {

        this.insert(new BaseLightingScene);

        const bodies: RigidBody[] = [];

        const l = 0.5;
        const s = 0.028;
        const height = 7;

        for (let i = 0; i < 12; i++) {
            const a = l - i * s;
            const b = Box(a)
                .setPos(0, height, i * l + l/2)
                // .setStatic()
                // .setWireframe()
                // .setCanCollide(false)
                .addTo(this);

            bodies.push(b)
        }

        for (let i = 1; i < bodies.length; i++) {
            const a = l - i * s;
            this.world.addConstraint(
                new Constraint(bodies[i], bodies[i - 1])
                    .add(new Attachment(
                            new Vec3(0, 0, l/2), 
                            new Vec3(0, 0, -l/2)
                        ).setCompliance(0.0).setDamping(1000)
                    )
                    .add(new AlignOrientation().setCompliance(0.2))
            );
        }

        const b = Tetra(0.5)
            .setPos(0, height, bodies.length * l - 0.5)
            .addTo(this);

        this.world.addConstraint(
            new Constraint(b, bodies[bodies.length - 1])
                .add(new Attachment(
                        new Vec3(0, 0, 0.5), 
                        new Vec3(0, 0, 0)
                    ).setCompliance(0.0).setDamping(500)
                )
                .add(new AlignOrientation().setCompliance(0.0))
        );

        /* Attach to world */
        this.world.addConstraint(
            new Constraint(bodies[0])
                .add(new Attachment(
                        new Vec3(0, height, 0), 
                        new Vec3(0, 0, -l/2)
                    ).setDamping(600)
                )
        );

        this.addGround();

    }
}
