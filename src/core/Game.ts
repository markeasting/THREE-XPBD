import * as THREE from 'three'
import { World } from '../physics/World';
import { BaseScene } from '../scene/BaseScene';

export class Game {

    private canvas: HTMLCanvasElement;
    private renderer: THREE.WebGLRenderer;
    private scene: BaseScene|undefined = undefined;

    private debugPhysics = false;
    private stepPhysics = false;
    
    private keys: Record<string, boolean> = {}

    public dt = 0;
    public time = 0;
    public prevTime = 0;

    constructor(canvasID: string) {
        this.canvas = document.getElementById(canvasID) as HTMLCanvasElement;

        this.renderer = new THREE.WebGLRenderer({
            canvas: this.canvas,
            antialias: true,
        });
        this.renderer.setPixelRatio(1);

        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap; // default THREE.PCFShadowMap
        this.fitContent();

        window.addEventListener('resize', this.fitContent.bind(this));

        window.addEventListener('keydown', (e) => {
            this.keys[e.code] = true;
            
            if (e.code == 'Space') {
                this.stepPhysics = true;
                this.scene?.updatePhysics(this.dt);
            }
        })
        window.addEventListener('keyup', (e) => {
            this.keys[e.code] = false;
        })
    }

    public fitContent() {
        const canvas = this.renderer.domElement;
        const width  = canvas.clientWidth;
        const height = canvas.clientHeight;

        this.renderer.setSize(width, height, false);

        if (this.scene)
            this.scene.onResize(width, height)
    }

    public add(scene: BaseScene) {
        this.scene = scene;
        this.scene.init();
        this.fitContent();
    }

    public update(time: DOMHighResTimeStamp): void {
        this.prevTime = this.time;
        this.time = time;
        this.dt = (this.time - this.prevTime) / 1000;

        if (this.scene) {
            this.scene.updatePhysics(this.dt, !this.stepPhysics);
            this.scene.update(time, this.dt, this.keys);
            this.scene.draw(this.renderer);

            if (this.debugPhysics)
                this.scene.world.draw(this.renderer, this.scene.camera);

        }

        requestAnimationFrame(time => {
            this.update(time);
        });
    }
}
