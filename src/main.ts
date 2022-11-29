import { Game } from './core/Game';
import { MyScene } from './scenes/MyScene';

const game = new Game();

game.sceneManager.add(new MyScene, 'myScene');

game.update(0);

(<any>window).game = game;
