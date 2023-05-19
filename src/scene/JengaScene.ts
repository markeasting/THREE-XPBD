import { BaseScene } from './BaseScene';
import { OmgScene } from './components/OmgScene';
import { BaseLightingScene } from './components/BaseLightingScene';
import { Vec3 } from '../physics/Vec3';
import { Box } from '../physics/body/Box';
import { XPBDSolver } from '../physics/solver/XPBDSolver';

export class JengaScene extends BaseScene {

    override init() {

        this.insert(new BaseLightingScene);

        // XPBDSolver.numSubsteps = 30;

        const scale = 0.5;
        const l = 7.5 * scale;
        const h = 1.5 * scale;
        const w = 2.5 * scale;
        const density = 1 * scale;

        /* Jenga */
        for (let i = 0; i < 10; i++) {

            for (let j = 0; j < 3; j++) {

                let b;

                if (i % 2 == 0) {
                    b = Box(w, h, l, density);
                    b.setPos(
                        j * (w * 1.02), 
                        (h - h/2) + h * i * 1.01, 
                        w
                    )
                } else {
                    b = Box(l, h, w, density);
                    b.setPos(
                        w, 
                        (h - h/2) + h * i * 1.01, 
                        j * (w * 1.02)
                    )
                }

                b.setFriction(0.6, 0.6);
                b.addTo(this);
            }
        }

        // Box(100, 1, 100)
        //     .setPos(0, -0.5, 0)
        //     .setStatic()
        //     .addTo(this);

        this.addGround();
    }

}
