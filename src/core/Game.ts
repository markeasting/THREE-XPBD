import { Vec3 } from "../physics/Vec3";
import { SceneManager } from "./SceneManager";

export class Game {

    private canvas: HTMLCanvasElement;
    public sceneManager: SceneManager;

    private prevTime = 0;
    public  time = 0;
    public  dt = 0;

    constructor(canvasID: string) {
        this.canvas = document.getElementById(canvasID) as HTMLCanvasElement;

        this.sceneManager = new SceneManager(this.canvas);
        this.sceneManager.fitContent();

        window.addEventListener('resize', () => {
            this.sceneManager.fitContent();
        })

        window.addEventListener('keydown', (e) => {
            if (e.code == 'Space')
                this.update(1 / 60);
        })
    }

    update(time: DOMHighResTimeStamp) {
        this.prevTime = this.time;
        this.time = time;
        this.dt = (this.time - this.prevTime) / 1000;

        this.sceneManager.update(this.time, this.dt);

        // requestAnimationFrame(time => {
        //     this.update(time);
        // });
    }
}
