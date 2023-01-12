import { Camera, PerspectiveCamera, Vector2, Vector3 } from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { Vec3 } from "../physics/Vec3";
import { clamp } from "../util/clamp";
import { isMobile } from "../util/isMobile";
import { smoothstep2 } from "../util/smoothstep";

export class CameraHandler {

    private orbitControls: OrbitControls;

    private prevCamFov = 70;
    private camFov = 70;

    // Current position (dynamic)
    private camPos = new Vec3(10, 2, 10);  
    private camTarget = new Vec3(0, 2, 0);
    
    // Next position / target
    private prevCamTarget = this.camTarget.clone();
    private nextCamTarget = this.camTarget.clone();
    
    // Previous position (to determine progress towards target)
    private prevCamPos = this.camPos.clone();
    private nextCamPos = this.camPos.clone();

    private lerpFactor = 0.08; // [0, 1]
    private lerpFactorQuick = 0.5; // Lerp factor when skipping to the next location

    private isMobileDevice = false;
    private frameDelta = 0; // dt (1 / FPS)

    private mouseDown = false;
    private mouse = new Vector2();
    private mousePrev = new Vector2();
    private mouseDelta = new Vector2();

    protected assets: Record<string, string> = {
        kiosk: 'models/kiosk.glb'
    }

    constructor(camera: PerspectiveCamera, domElement: HTMLCanvasElement) {
        this.isMobileDevice = isMobile();

        this.camFov = this.isMobileDevice ? 80 : 60;
        this.prevCamFov = this.camFov;

        this.orbitControls = new OrbitControls(camera, domElement);
        this.orbitControls.enableDamping = false;
        this.orbitControls.rotateSpeed = this.isMobileDevice ? -0.35 : -0.22;
        this.orbitControls.enableZoom = false;

        document.addEventListener('mousemove', this.onMouse.bind(this));
        document.addEventListener('mousedown', this.onMouse.bind(this));
        document.addEventListener('mouseup', this.onMouse.bind(this));
        document.addEventListener('touchmove', this.onMouse.bind(this));
        document.addEventListener('touchstart', this.onMouse.bind(this));
        document.addEventListener('touchend', this.onMouse.bind(this));

        document.addEventListener('wheel', this.onZoom.bind(this));
    }

    public update(camera: Camera, dt: number) {

        this.frameDelta = dt;

        if (this.mouseDown) {
            this.mouseDelta.subVectors(this.mouse, this.mousePrev);
            this.mousePrev.copy(this.mouse);
        } else {
            this.mousePrev.copy(this.mouse);
        }

        this.animateCam(camera as PerspectiveCamera, this.orbitControls);
    }

    public set(position: Vec3, target: Vec3, lerpFactor = 0.08) {

        /* Adjust lerp for refresh rate, e.g. 120Hz screens. */
        const FPSratio = this.frameDelta / (1/60); 

        this.lerpFactor = clamp(lerpFactor * FPSratio, 0, 1);
        this.prevCamPos = this.camPos.clone();
        this.prevCamTarget = this.camTarget.clone();
        this.nextCamTarget = target.clone();
        this.nextCamPos = position.clone();
    }

    private animateCam(camera: PerspectiveCamera, orbitControls: OrbitControls) {

        const distPos = this.nextCamPos.clone().sub(this.camPos).length();
        const distPrevPos = this.camPos.clone().sub(this.prevCamPos).length();
        
        const distTarget = this.nextCamTarget.clone().sub(this.camTarget).length();
        const distPrevTarget = this.camTarget.clone().sub(this.prevCamTarget).length();
            
        const t1 = distPos / (distPos + distPrevPos);
        const t2 = distTarget / (distTarget + distPrevTarget);
        let t = 1 - (t1 + t2)/2;
        const tMax = 0.999; // 1 - camLerp.value;

        if (t < tMax) {

            /* Skip to the end location if the user clicks/taps the screen */
            if (this.mouseDown && t > 0.5) {
                this.set(this.nextCamPos, this.nextCamTarget, this.lerpFactorQuick);
            } else {

                /* Take over camera: smoothly lerp to the next position */
                const tSmooth = this.lerpFactor < 0.5
                    ? (smoothstep2(t, 1.33) * this.lerpFactor) + 0.01
                    : this.lerpFactor;

                this.camPos.lerp(this.nextCamPos, tSmooth);
                this.camTarget.lerp(this.nextCamTarget, tSmooth);
                
                camera.position.copy(this.camPos);
                camera.lookAt(this.camTarget);
                orbitControls.target.copy(this.camTarget);
            }

        } else {

            /* Look/pan around the scene */
            // @TODO adjust look speed when zoomed in
            if (this.mouseDown) {
                const forward = camera.getWorldDirection(new Vec3());
                orbitControls.target.copy(camera.position).addScaledVector(forward, 0.01);
            }
        }

        if (this.camFov !== this.prevCamFov) {
            camera.fov = this.camFov;
            camera.updateProjectionMatrix();
            this.prevCamFov = this.camFov;
        }

        orbitControls.update();
    }

    private onZoom(e: WheelEvent) {
        const dy = e.deltaY;

        this.camFov = clamp(
            this.camFov + dy * 0.01, 
            30,
            80,
        )
    }

    private onMouse(e: TouchEvent | MouseEvent) {

        if (e instanceof TouchEvent) {
            this.mouseDown = e.type == 'touchmove' || e.type == 'touchstart';
            this.onDrag(e);
        }

        if (e instanceof MouseEvent) {
            if (e.type == 'mouseup')
                this.mouseDown = false;

            this.mouseDown = (e.type == 'mousemove' && e.buttons > 0) 
                || e.type == 'mousedown';

            this.onDrag(e);
        }
    }

    private onDrag(event: any) {
        event.preventDefault();

        let x, y;

        if (event.touches && event.touches.length) {
            x = event.touches[0].clientX;
            y = event.touches[0].clientY;
        } else {
            x = event.clientX;
            y = event.clientY;
        }

        this.mouse.setX((x / window.innerWidth) * 2 - 1);
        this.mouse.setY(-(y / window.innerHeight) * 2 + 1);
    }

}
