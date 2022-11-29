import * as THREE from 'three'
import { BaseScene } from "./BaseScene";

export class SceneManager {

    scenes: Array<BaseScene> = [];
    sceneMap: Record<string, number> = {};

    constructor() {

    }

    onResize() {
        var i = 0, len = this.scenes.length;

        while (i < len) {
            this.scenes[i].onResize();
            i++
        }
    }

    update(
        renderer: THREE.WebGLRenderer, 
        time: number,
        dt: number
    ) {
        var i = 0, len = this.scenes.length;

        while (i < len) {
            this.scenes[i].update(time, dt);
            renderer.render(
                this.scenes[i].scene, 
                this.scenes[i].camera
            );
            i++
        }
    }

    add(scene: BaseScene, name: string) {
        
        const id = this.scenes.push(scene);
        
        this.sceneMap[name] = id;

        return id;
    }

    remove(name: string) {
        throw new Error('Scene.remove is not implemented')
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
