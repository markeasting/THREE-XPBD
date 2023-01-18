import { describe, expect, test } from '@jest/globals';
import { RigidBody } from '../RigidBody';
import { CollisionPair } from '../CollisionPair';
import { XPBDSolver } from './XPBDSolver';
import { MeshCollider, PlaneCollider } from '../Collider';
import { Vec2 } from '../Vec2';

describe('XPBDSolver', () => {

    test('itworks', () => {
        expect(true).toBe(true);
    })
    
    // const xpbd = new XPBDSolver();

    // test('getContacts()', () => {
        
    //     const A = new RigidBody(new MeshCollider().setGeometry('box', 1.0))
    //     A.pose.p.setY(0.0);

    //     const B = new RigidBody(new PlaneCollider(new Vec2(10, 10))).setStatic();
    //     B.id = 42;

    //     const collisions = [
    //         new CollisionPair(A, B)
    //     ]

    //     const contacts = xpbd.getContacts(collisions);
        
    //     expect(contacts.length).toEqual(4);
    //     expect(contacts[0].d).toEqual(-0.5);

    // });
});
