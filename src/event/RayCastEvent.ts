import { Event, Intersection, Object3D } from 'three';
import { RigidBody } from '../physics/RigidBody';

export type RayCastEventArgs = {
    type: 'click'|'hover';
    raycast: Intersection<Object3D<Event>> | undefined;
    mesh: Object3D,
    body: RigidBody
}

export class RayCastEvent extends CustomEvent<RayCastEventArgs> {

    // Interface version
    // new<T>(type: 'RayCastEvent', eventInitDict?: CustomEventInit<T>): this;

    constructor(data?: RayCastEventArgs) {
        super('RayCastEvent', { detail: data });
    }
    
}
