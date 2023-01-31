import { Game } from './core/Game';
import { MyScene } from './scene/MyScene';
import './style.css'

const game = new Game('canvas');
game.add(new MyScene());
game.update(0);
(<any>window).game = game;

// import { memory, benchmarkIntegration } from './wasm/release';
// const wasmMemoryBuffer = new Float32Array(memory.buffer);

