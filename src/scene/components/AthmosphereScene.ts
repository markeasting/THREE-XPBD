import * as THREE from 'three'

/**
 * https://threejs.org/examples/webgl_lights_hemisphere.html
 */
export class AthmosphereScene extends THREE.Scene {

    constructor() {
        super();

        // GROUND
        const groundGeo = new THREE.PlaneGeometry( 200, 200 );
        const groundMat = new THREE.MeshLambertMaterial( { color: 0xffffff } );
        groundMat.color.setHSL( 0.095, 1, 0.75 );

        const ground = new THREE.Mesh( groundGeo, groundMat );
        ground.receiveShadow = true;
        ground.rotation.x = -Math.PI / 2;
        ground.position.z = 0;
        this.add( ground );
        
        // Fog (doesnt work here? But does in parent scene?)
        this.background = new THREE.Color().setHSL( 0.6, 0, 1 );
        this.fog = new THREE.Fog( this.background, 1, 500 );

        // Hemilight 
        const hemiLight = new THREE.HemisphereLight( 0xffffff, 0xffffff, 0.75 );
        hemiLight.color.setHSL( 0.6, 1, 0.6 );
        hemiLight.groundColor.setHSL( 0.095, 1, 0.75 );
        hemiLight.position.set( 0, 50, 0 );
        this.add( hemiLight );

        const hemiLightHelper = new THREE.HemisphereLightHelper( hemiLight, 10 );
        this.add( hemiLightHelper );

        // Dirlight
        const dirLight = new THREE.DirectionalLight( 0xffffff, 1 );
        dirLight.color.setHSL( 0.1, 1, 0.95 );
        dirLight.position.set( -1, 1.75, 1 );
        dirLight.position.multiplyScalar( 30 );
        this.add( dirLight );

        dirLight.castShadow = true;

        dirLight.shadow.mapSize.width = 2048;
        dirLight.shadow.mapSize.height = 2048;

        const d = 25;

        dirLight.shadow.camera.left = - d;
        dirLight.shadow.camera.right = d;
        dirLight.shadow.camera.top = d;
        dirLight.shadow.camera.bottom = - d;

        dirLight.shadow.camera.far = 3500;
        // dirLight.shadow.bias = - 0.0001;

        const dirLightHelper = new THREE.DirectionalLightHelper( dirLight, 10 );
        this.add( dirLightHelper );

        // Skydome shader
        const vertexShader = document.getElementById('vertexShader')?.textContent;
        const fragmentShader = document.getElementById('fragmentShader')?.textContent;
        const uniforms = {
            topColor: { value: new THREE.Color( 0x0077ff ) },
            bottomColor: { value: new THREE.Color( 0xffffff ) },
            offset: { value: 33 },
            exponent: { value: 0.6 }
        };
        uniforms.topColor.value.copy( hemiLight.color );

        this.fog.color.copy( uniforms.bottomColor.value );

        const skyGeo = new THREE.SphereGeometry( 3000, 32, 15 );
        const skyMat = new THREE.ShaderMaterial({
            uniforms: uniforms,
            vertexShader: vertexShader!,
            fragmentShader: fragmentShader!,
            side: THREE.BackSide
        });

        const sky = new THREE.Mesh( skyGeo, skyMat );
        this.add( sky );
    }

}