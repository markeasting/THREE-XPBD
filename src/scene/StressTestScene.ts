import { BaseScene } from './BaseScene';
import { Box } from '../physics/body/Box';
import { BaseLightingScene } from './components/BaseLightingScene';
import { Tetra } from '../physics/body/Tetra';

export class StressTestScene extends BaseScene {

    override init() {

        this.insert(new BaseLightingScene);

        let d = 1;

        for (let i = 0; i < 128; i++) {
            
            // d = 1 + 0.7 * Math.random();
            // const b = Math.random() < 0.5 ? Box(d) : Tetra(d);

            const b = Box(d);
            
            b.setRandomColor()
                .setPos(0, d + i * 2, 0)
                .addTo(this);
        }

        this.addGround();
    }

}
