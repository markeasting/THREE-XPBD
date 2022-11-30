import { Game } from './core/Game';
import { MyScene } from './scenes/MyScene';
import '../public/style.css'
// import env from './env';

window.onload = function() {

    const game = new Game('canvas');

    game.sceneManager.add(new MyScene, 'myScene');

    game.update(0);

    (<any>window).game = game;

}
