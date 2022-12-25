import * as THREE from 'three'
import { PointLight } from '../light/PointLight';
import { BaseScene } from './BaseScene';

export class MyScene extends BaseScene {

    override init() {
        this.camera.position.set(1, 1.5, 1.5)
        this.camera.lookAt(0,0,0);

        this.addGeometry();

        const p1 = new PointLight(this.scene, 0xf2ddc5);
        p1.light.castShadow = true;
        p1.light.position.set(7, 10, 3);

        const p2 = new PointLight(this.scene, 0xd6deed);
        p2.light.position.set(-7, 10, -3);

        // const directionalLight = new THREE.DirectionalLight( 0xffffff, 0.5 );
        // this.scene.add( directionalLight );

        const ambientLight = new THREE.AmbientLight( 0x404040 );
        this.scene.add( ambientLight );
        
    }

    private addGeometry() {
        const box = new THREE.Mesh(
            new THREE.BoxGeometry(1, 2, 1), 
            new THREE.MeshPhongMaterial({
                color: 0xffffff, 
            })
        );
        this.scene.add( box )

        const ground = new THREE.Mesh(
            new THREE.PlaneGeometry(100, 100), 
            new THREE.MeshPhongMaterial({
                color: 0x444444, 
            })
        );
        ground.rotation.x = -Math.PI / 2;
        ground.position.y = -1;
        this.scene.add( ground )

        box.castShadow = true;
        ground.receiveShadow = true;
    }

}
