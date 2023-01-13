import { RigidBody } from '../RigidBody';
import assert from 'assert';
import { CollisionPair } from '../CollisionPair';
import { XPBDSolver } from './XPBDSolver';
import { Pose } from '../Pose';
import { Vec3 } from '../Vec3';
import { Quat } from '../Quaternion';
import { MeshCollider, PlaneCollider } from '../Collider';
import { Vec2 } from '../Vec2';

describe('XPBDSolver', () => {

    const xpbd = new XPBDSolver();

    it('getContacts()', () => {
        
        const A = new RigidBody(new MeshCollider().setGeometry('box', 1.0))
        A.pose.p.setY(0.0);

        const B = new RigidBody(new PlaneCollider(new Vec2(10, 10))).setStatic();
        B.id = 42;

        const collisions = [
            new CollisionPair(A, B)
        ]

        // @ts-ignore
        const contacts = xpbd.getContacts(collisions as CollisionPair);
        
        assert.equal(contacts.length, 4);
        assert.equal(contacts[0].d, -0.5);

    });
});
