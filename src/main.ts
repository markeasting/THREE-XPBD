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

    world.addBody(scene.myCube, 1, 3, 1);
    world.addGround();

    update(0);
}

let prevTime: number, dt: number;
function update(time: DOMHighResTimeStamp): void {
    dt = (time - prevTime) / 1000;
    prevTime = time;

    game.update(time);

    console.time('wasm');
    world.update(dt);
    console.timeEnd('wasm');

    requestAnimationFrame(time => {
        update(time);
    });
}

init();
