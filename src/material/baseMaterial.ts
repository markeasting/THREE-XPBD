import * as THREE from 'three'

// Note: these are shared / references
// @TODO make an abstraction for materials
export const baseMaterial = new THREE.MeshBasicMaterial({
    color: 0xff00ff, 
    wireframe: false
});
