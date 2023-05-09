import { BaseScene } from './BaseScene';
import { BaseDebugScene } from './components/BaseDebugScene';
import { Vec3 } from '../physics/Vec3';
import { Box } from '../physics/body/Box';

export class DebugScene extends BaseScene {

    override init() {

        this.insert(new BaseDebugScene);

        Box(3, 1, 3)
            .setWireframe(true)
            .setPos(0, 0.5, 0)
            .addTo(this);

        Box(2, 1, 1)
            .setWireframe(true)
            .setPos(1.5, 5, 0)
            .addTo(this);

        this.addGround();

    }

}
