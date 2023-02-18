import { Game } from './core/Game';
import { MyScene } from './scene/MyScene';
import './style.css'

declare global {
    interface Window {
        game: Game,
    }
}

const game = new Game('canvas');
window.game = game;

async function init() {

    const scene = new MyScene();

    game.add(scene);

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
