import { Game } from './core/Game';
import { MyScene } from './scene/MyScene';
import './style.css'

// import { add } from './wasm/build/release';
// (window as any).__add = add;
// console.log(add(22, 1));

const game = new Game('canvas');

game.add(new MyScene());

game.update(0);

(<any>window).game = game;
