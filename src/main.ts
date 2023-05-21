import { Game } from './core/Game';
import { ConstraintScene } from './scene/ConstraintScene';
import { DebugScene } from './scene/DebugScene';
import { DominosScene } from './scene/DominosScene';
import { PendulumScene } from './scene/PendulumScene';
import { RopeScene } from './scene/RopeScene';
import { StackedBoxesScene } from './scene/StackedBoxesScene';
import { JengaScene } from './scene/JengaScene';
import { PlayGroundScene } from './scene/PlayGroundScene';
import { DragonTailScene } from './scene/DragonTailScene';
import { StressTestScene } from './scene/StressTestScene';
import { FrictionScene } from './scene/FrictionScene';

import './style.css'

declare global {
    interface Window {
        game: Game,
    }
}

const game = new Game('canvas');
window.game = game;

async function init() {

    Game.setSceneSelector({
        current: 'Playground',
        options: {
            'Playground': PlayGroundScene,
            'Dominos': DominosScene,
            'StackedBoxes': StackedBoxesScene,
            'Jenga': JengaScene,
            'Friction': FrictionScene,
            'Constraints': ConstraintScene,
            'Rope': RopeScene,
            'DragonTail': DragonTailScene,
            'Pendulum': PendulumScene,
            'StressTest': StressTestScene,
            'Debug': DebugScene,
        }
    });

    const url = window.location.hash.substring(1);

    if (url in Game.sceneSelector.options)
        Game.sceneSelector.current = url;

    Game.changeScene(Game.sceneSelector.options[Game.sceneSelector.current]);

    update(0);
}

let prevTime: number, dt: number;
function update(time: DOMHighResTimeStamp): void {
    dt = (time - prevTime) / 1000;
    prevTime = time;

    game.update(time);

    requestAnimationFrame(time => {
        update(time);
    });

    // setTimeout(() => {
    //     requestAnimationFrame(time => {
    //         update(time);
    //     });
    // }, Game.mouseDown ? 1000 / 20 : 1000 / 5);
}

init();
