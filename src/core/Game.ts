import * as THREE from 'three'
import { BaseScene } from '../scene/BaseScene';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { BloomPass } from 'three/examples/jsm/postprocessing/BloomPass';
import { SMAAPass } from 'three/examples/jsm/postprocessing/SMAAPass';

export class Game {

    private canvas: HTMLCanvasElement;
    private renderer: THREE.WebGLRenderer;
    private composer: EffectComposer;

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
            antialias: false,
        });
        this.composer = new EffectComposer( this.renderer );
        
        // Screen
        this.renderer.setPixelRatio(1);
        this.fitContent();

        // Shadows
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap; // default THREE.PCFShadowMap

        // Events
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

    private setupRenderPass() {

        const renderPass = new RenderPass( this.scene?.scene!, this.scene?.camera! );
        const smaaPass = new SMAAPass( window.innerWidth, window.innerHeight );
        
        const unrealBloomPass = new UnrealBloomPass(
            new THREE.Vector2( window.innerWidth, window.innerHeight ), 
            1, 
            0.1, 
            0.8
        );

        this.composer.addPass( renderPass );
        this.composer.addPass( unrealBloomPass );
        this.composer.addPass( smaaPass );
    }

    private fitContent() {
        const canvas = this.renderer.domElement;
        const width  = canvas.clientWidth;
        const height = canvas.clientHeight;

        this.renderer.setSize(width, height, false);
        this.composer.setSize(width, height);

        if (this.scene)
            this.scene.onResize(width, height)
    }

    public add(scene: BaseScene) {
        this.scene = scene;
        this.scene.init();
        this.fitContent();
        this.setupRenderPass();
    }

    public update(time: DOMHighResTimeStamp): void {
        this.prevTime = this.time;
        this.time = time;
        this.dt = (this.time - this.prevTime) / 1000;

        if (this.scene) {
            this.scene.updatePhysics(this.dt, !this.stepPhysics);
            this.scene.update(time, this.dt, this.keys);
            // this.scene.draw(this.composer);
            this.composer.render()

            if (this.debugPhysics)
                this.scene.world.draw(this.renderer, this.scene.camera);

        }

        requestAnimationFrame(time => {
            this.update(time);
        });
    }
}
