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
        this.renderer.setPixelRatio(1);

        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap; // default THREE.PCFShadowMap
    }

    public fitContent() {
        const canvas = this.renderer.domElement;
        const width  = canvas.clientWidth;
        const height = canvas.clientHeight;

        this.renderer.setSize(width, height, false);
        this.onResize(width, height);
    }

    private onResize(width: number, height: number) {
        var i = 0, len = this.scenes.length;

        while (i < len) {
            this.scenes[i].onResize(width, height);
            i++
        }
    }

    public update(time: number, dt: number) {

        const scene = this.activeScene;

        if (scene) {
            scene.updatePhysics(time, dt);
            scene.update(time, dt);

            this.renderer.render(
                scene.scene,
                scene.camera
            );
        }
    }

    public add(sceneConstructor: typeof BaseScene, name?: string) {

        name = name ?? sceneConstructor.name;

        const scene = new sceneConstructor();

        const id = this.scenes.push(scene) - 1;
        this.sceneMap[name] = id;

        scene.init();
        this.activate(name);
        this.fitContent();

        return id;
    }

    public remove(name: string) {
        const id = this.sceneMap[name];
        const scene = this.scenes[id];

        scene.onDeactivate();

        this.scenes.splice(id, 1);
    }

    public activate(name: string) {
        const id = this.sceneMap[name];
        const scene = this.scenes[id];

        scene.active = true;
        scene.onActivate();

        this.activeScene = scene;
    }

    public deactivate(name: string) {
        const id = this.sceneMap[name];
        const scene = this.scenes[id];

        scene.active = false;
        scene.onDeactivate();

        this.activeScene = undefined;
    }

}
