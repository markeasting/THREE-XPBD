import { Game } from './core/Game';
import { ConstraintScene } from './scene/ConstraintScene';
import { DebugScene } from './scene/DebugScene';
import { DominosScene } from './scene/DominosScene';
import { RopeScene } from './scene/RopeScene';
import { StackedBoxesScene } from './scene/StackedBoxesScene';
import { TestingScene } from './scene/TestingScene';
import './style.css'

declare global {
    interface Window {
        game: Game,
    }
}

const game = new Game('canvas');
window.game = game;

async function init() {

    Game.sceneSelector = {
        current: 'Playground',
        options: {
            'Playground': TestingScene,
            'Dominos': DominosScene,
            'StackedBoxes': StackedBoxesScene,
            'Constraints': ConstraintScene,
            'Rope': RopeScene,
            'Debug': DebugScene,
        }
    };

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
