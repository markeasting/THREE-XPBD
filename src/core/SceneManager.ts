import * as THREE from 'three'
import { BaseScene } from "../scene/BaseScene";

export class SceneManager {

    private renderer: THREE.WebGLRenderer;

    private scenes: Array<BaseScene> = [];
    private sceneMap: Record<string, number> = {};

    private activeScene: BaseScene|undefined = undefined;

    constructor(canvas: HTMLCanvasElement) {
        this.renderer = new THREE.WebGLRenderer({
            canvas: canvas
        });
        this.renderer.setPixelRatio(window.devicePixelRatio);

        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap; // default THREE.PCFShadowMap
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

    update(time: number, dt: number) {

        const scene = this.activeScene;

        if (scene) {
            scene.update(time, dt);

            this.renderer.render(
                scene.scene, 
                scene.camera
            );
        }
    }

    add(sceneConstructor: typeof BaseScene, name?: string) {

        name = name ?? sceneConstructor.name;

        const scene = new sceneConstructor();
        scene.init();

        const id = this.scenes.push(scene) - 1;
        this.sceneMap[name] = id;

        this.activate(name);
        this.fitContent();

        return id;
    }

    remove(name: string) {
        const id = this.sceneMap[name];
        const scene = this.scenes[id];

        scene.onDeactivate();

        this.scenes.splice(id, 1);
    }

    activate(name: string) {
        const id = this.sceneMap[name];
        const scene = this.scenes[id];

        scene.onActivate();

        this.activeScene = scene;
    }

    deactivate(name: string) {
        const id = this.sceneMap[name];
        const scene = this.scenes[id];

        scene.onDeactivate();

        this.activeScene = undefined;
    }

}
