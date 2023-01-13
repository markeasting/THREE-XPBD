import * as THREE from 'three'
import { BaseScene } from '../scene/BaseScene';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { BloomPass } from 'three/examples/jsm/postprocessing/BloomPass';
import { SMAAPass } from 'three/examples/jsm/postprocessing/SMAAPass';
import { Raycaster } from 'three';
import { Vec2 } from '../physics/Vec2';
import { EventEmitter } from '../event/EventEmitter';
import { RayCastEvent } from '../event/RayCastEvent';

export class Game {

    static canvas: HTMLCanvasElement;
    static renderer: THREE.WebGLRenderer;
    static composer: EffectComposer;
    
    static events = new EventEmitter();

    static raycaster = new Raycaster();
    static pointer = new Vec2();
    static mouseDown = false;
    static mouseDrag = false;

    static keys: Record<string, boolean> = {}

    private scene: BaseScene|undefined = undefined;

    private debugPhysics = false;
    private stepPhysics = false;
    
    public dt = 0;
    public time = 0;
    public prevTime = 0;

    constructor(canvasID: string) {
        Game.canvas = document.getElementById(canvasID) as HTMLCanvasElement;

        Game.renderer = new THREE.WebGLRenderer({
            canvas: Game.canvas,
            antialias: false,
        });
        Game.composer = new EffectComposer( Game.renderer );
        
        // Screen
        Game.renderer.setPixelRatio(1);
        this.fitContent();

        // Shadows
        Game.renderer.shadowMap.enabled = true;
        Game.renderer.shadowMap.type = THREE.PCFSoftShadowMap; // default THREE.PCFShadowMap

        // Events
        window.addEventListener('resize', this.fitContent.bind(this));

        window.addEventListener('keydown', (e) => {
            Game.keys[e.code] = true;
            
            if (e.code == 'Space') {
                this.stepPhysics = true;
                this.scene?.updatePhysics(this.dt);
            }
        })
        window.addEventListener('keyup', (e) => {
            Game.keys[e.code] = false;
        })

        window.addEventListener( 'mousedown', this.onMouse.bind(this) );
        window.addEventListener( 'mousemove', this.onMouse.bind(this) );
        window.addEventListener( 'mouseup', this.onMouse.bind(this) );
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

        Game.composer.addPass( renderPass );
        Game.composer.addPass( unrealBloomPass );
        Game.composer.addPass( smaaPass );
    }

    private fitContent() {
        const canvas = Game.canvas;
        const width  = canvas.clientWidth;
        const height = canvas.clientHeight;

        Game.renderer.setSize(width, height, false);
        Game.composer.setSize(width, height);

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
            this.scene.update(time, this.dt, Game.keys);
            // this.scene.draw(Game.composer);
            Game.composer.render()

            if (this.debugPhysics)
                this.scene.world.draw(Game.renderer, this.scene.camera);

        }

        requestAnimationFrame(time => {
            this.update(time);
        });
    }

    private onMouse(e: MouseEvent) {
        e.preventDefault();

        // Screen space normalized to [-1, 1]
        Game.pointer.x = (e.clientX / window.innerWidth) * 2 - 1;
        Game.pointer.y = -(e.clientY / window.innerHeight) * 2 + 1;

        if (e.type == 'mousedown')
            Game.mouseDown = true;

        if (e.type == 'mouseup' || e.type == 'mouseout') {
            Game.mouseDown = false;
        }

        if (e.type == 'mousemove' && Game.mouseDown) {
            Game.mouseDrag = true;

            console.log(Game.keys);

            if (Game.keys.ControlLeft)
                this.performRaycast('drag');
        }
    }

    private performRaycast(type: 'drag'|'click') {
        const scene = this.scene;
        
        if (!scene)
            return;

        Game.raycaster.setFromCamera(Game.pointer, scene.camera);
        const hits = Game.raycaster.intersectObjects(scene.scene.children);

        Game.raycaster

        const item = hits[0];

        Game.events.emit(new RayCastEvent({
            type: type,
            ray: Game.raycaster.ray,
            intersection: item,
            mesh: item?.object,
            body: item?.object.userData.physicsBody
        }));
    }
}
