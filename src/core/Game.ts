import * as THREE from 'three'
import { SceneManager } from "./SceneManager";

export class Game {

    private renderer: THREE.WebGLRenderer;
    public sceneManager = new SceneManager();

    private prevTime = 0;
    public  time = 0;
    public  dt = 0;

    constructor() {
        this.handleResize();

        this.renderer = new THREE.WebGLRenderer({
            canvas: document.getElementById('canvas') as HTMLElement,
        });
        this.renderer.setPixelRatio( window.devicePixelRatio);
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    
    }

    update(time: DOMHighResTimeStamp) {
        this.prevTime = this.time;
        this.time = time;
        this.dt = (this.time - this.prevTime) / 1000;

        this.sceneManager.update(this.renderer, this.time, this.dt);

        requestAnimationFrame(time => {
            this.update(time);
        });
    }

    handleResize() {
        window.addEventListener('resize', () => {
            this.renderer.setSize(window.innerWidth, window.innerHeight)
            this.sceneManager.onResize();
        }, false)
    }

}
