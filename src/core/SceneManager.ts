import * as THREE from 'three'
import { BaseScene } from "./BaseScene";

export class SceneManager {

    private renderer: THREE.WebGLRenderer;

    private scenes: Array<BaseScene> = [];
    private sceneMap: Record<string, number> = {};

    constructor(canvas: HTMLCanvasElement) {
        this.renderer = new THREE.WebGLRenderer({
            canvas: canvas
        });
        this.renderer.setPixelRatio(window.devicePixelRatio);
    }

    fitContent() {
        const canvas = this.renderer.domElement;
        const width  = canvas.clientWidth;
        const height = canvas.clientHeight;
      
        this.renderer.setSize(width, height, false);
        this.onResize(width, height);
    }

    onResize(width: number, height: number) {
        var i = 0, len = this.scenes.length;

        while (i < len) {
            this.scenes[i].onResize(width, height);
            i++
        }
    }

    update(
        time: number,
        dt: number
    ) {
        var i = 0, len = this.scenes.length;

        while (i < len) {
            const s = this.scenes[i];
            
            if (s.active) {
                s.updatePhysics(time, dt);
                s.update(time, dt);

                this.renderer.render(
                    s.scene, 
                    s.camera
                );
            }

            i++
        }
    }

    add(sceneConstructor: typeof BaseScene, name?: string) {

        name = name ?? sceneConstructor.name;

        const scene = new sceneConstructor();
        scene.init();

        const id = this.scenes.push(scene) - 1;
        this.sceneMap[name] = id;

        this.fitContent(); // @TODO should only resize new scene, not all of them

        return id;
    }

    remove(name: string) {
        const id = this.sceneMap[name];
        this.scenes.splice(id, 1);
    }

    activate(name: string) {
        const id = this.sceneMap[name];

        this.scenes[id].activate();
    }

    deactivate(name: string) {
        const id = this.sceneMap[name];

        this.scenes[id].deactivate();
    }

}
