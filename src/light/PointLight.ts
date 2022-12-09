import * as THREE from 'three'

export class PointLight {

    light: THREE.PointLight;
    helper?: THREE.PointLightHelper;

    debug = true;

    constructor(scene: THREE.Scene, color = 0xffffff, intensity = 1, distance = 25) {
        this.light = new THREE.PointLight( color, intensity, distance );
        scene.add( this.light );

        this.light.shadow.mapSize.width = 1024;
        this.light.shadow.mapSize.height = 1024;
        this.light.shadow.camera.near = 0.5;
        this.light.shadow.camera.far = distance;

        if (this.debug) {
            this.helper = new THREE.PointLightHelper(this.light);
            scene.add(this.helper);
        }
    }

    setColor(color: THREE.Color, intensity?: number) {
        this.light.color = color;

        if (intensity) 
            this.light.intensity = intensity;
    }
}
