import { BaseScene } from './BaseScene';
import { BaseLightingScene } from './components/BaseLightingScene';
import { Box } from '../physics/body/Box';

export class DominosScene extends BaseScene {

    override init() {

        this.insert(new BaseLightingScene);

        /* Dominos */
        for (let i = 0; i < 20; i++) {
            const b = Box(1, 2, 0.2)
                .setPos(0, 1.0, -i * 1.0)
                // .setFriction(0.7, 0.7)
                .setFriction(1, 1)
                .addTo(this);

            if (i == 0)
                b.omega.x = -1.0;
        }

        /* BIG dominos */
        for (let i = 0; i < 10; i++) {
            const size = 1 + i * 0.5;
            const b = Box(1 * size, 2 * size, 0.4 * size/2)
                .setPos(-7, 1.0 * size, -i * Math.pow(size, 0.5) * 1.0)
                .setFriction(0.7, 0.7)
                .addTo(this);

            if (i == 0)
                b.omega.x = -1.0;

        }

        this.addGround();
    }

}
