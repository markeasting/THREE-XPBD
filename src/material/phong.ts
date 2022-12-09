import * as THREE from 'three'

// Note: these are shared / references
// @TODO make an abstraction for materials
export const phongMaterial = new THREE.MeshPhongMaterial({
    color: 0xffffff, 
});
