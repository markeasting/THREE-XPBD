import { Game } from './core/Game';
import { MyScene } from './scene/MyScene';
import './style.css'

window.onload = function() {

    const game = new Game('canvas');

    game.sceneManager.add(MyScene);
    // game.sceneManager.add(CarScene);
    // game.sceneManager.activate('CarScene');

    game.update(0);

    (<any>window).game = game;

}
