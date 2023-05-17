import { BaseScene } from './BaseScene';
import { OmgScene } from './components/OmgScene';
import { BaseLightingScene } from './components/BaseLightingScene';
import { Vec3 } from '../physics/Vec3';
import { Box } from '../physics/body/Box';

export class JengaScene extends BaseScene {

    override init() {

        this.insert(new BaseLightingScene);

        const scale = 0.8;
        const l = 7.5 * scale;
        const h = 1.5 * scale;
        const w = 2.5 * scale;
        const density = 10;

        /* Jenga */
        for (let i = 0; i < 10; i++) {

            for (let j = 0; j < 3; j++) {

                let b;

                if (i % 2 == 0) {
                    b = Box(w, h, l, density);
                    b.setPos(
                        j * (w * 1.02), 
                        (h - h/2 + 0) + h * i, 
                        w
                    )
                } else {
                    b = Box(l, h, w, density);
                    b.setPos(
                        w, 
                        (h - h/2 + 0) + h * i, 
                        j * (w * 1.02)
                    )
                }

                b.setFriction(0.8, 0.8);
                b.addTo(this);
            }
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
