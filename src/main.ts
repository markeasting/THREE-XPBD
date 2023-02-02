import { Game } from './core/Game';
import * as XPBD from 'xpbd-wasm';
import { MyScene } from './scene/MyScene';
import './style.css'

declare global {
    interface Window {
        game: Game,
        world: XPBD.World
    }
}

const game = new Game('canvas');
window.game = game;

let world: XPBD.World;

async function init() {

    const scene = new MyScene();

    game.add(scene);

    world = await XPBD.init();
    window.world = world;

    world.addBody(scene.unitCube);

    update(0);
}

let prevTime, dt;
function update(time: DOMHighResTimeStamp): void {
    prevTime = time;
    dt = (time - prevTime) / 1000;

    game.update(time);
    // world.update(dt);

    requestAnimationFrame(time => {
        update(time);
    });
}

init();
