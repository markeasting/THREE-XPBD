import { BaseScene } from './BaseScene';
import { OmgScene } from './components/OmgScene';
import { Vec3 } from '../physics/Vec3';
import { Box } from '../physics/body/Box';

export class StackedBoxesScene extends BaseScene {

    override init() {

        this.insert(new OmgScene);

        const d = 1; // box size

        /* Stacked boxes */
        for (let i = 0; i < 5; i++) {
            Box(d)
                .setPos(0, (d - d/2 + 0.05) + d * i, 0)
                .addTo(this);
        }

        /* Wall */
        // for (let i = 0; i < 3; i++) {

        //     for (let j = 0; j < 3; j++) {
        //         Box(d)
        //             .setPos(-3, (d/2) + d * i * 1.05, d * j * 1.05)
        //             .addTo(this);
        //     }
        // }

        this.addGround();
    }

}
