import { Game } from './core/Game';
import { XPBD } from 'xpbd-wasm';
import { MyScene } from './scene/MyScene';
import './style.css'

declare global {
    interface Window {
        game: Game,
        xpbd: XPBD
    }
}

const game = new Game('canvas');
game.add(new MyScene());
game.update(0);
window.game = game;

XPBD.init().then((xpbd) => {
    window.xpbd = xpbd
    console.log(xpbd);
})
