import { BaseScene } from './BaseScene';
import { Box } from '../physics/body/Box';
import { BaseLightingScene } from './components/BaseLightingScene';

export class StressTestScene extends BaseScene {

    override init() {

        this.insert(new BaseLightingScene);

        const d = 1; // box size

        /* Stacked boxes */
        for (let i = 0; i < 128; i++) {
            Box(d)
                .setPos(0, d + d * i * 2, 0)
                .addTo(this);
        }

        this.addGround();
    }

}
