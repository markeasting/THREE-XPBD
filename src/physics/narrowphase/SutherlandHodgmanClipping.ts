import { Vec2 } from "../Vec2";

const inside = (cp1: Vec2, cp2: Vec2, p: Vec2): boolean => {
    return (cp2.x - cp1.x) * (p.y - cp1.y) > (cp2.y - cp1.y) * (p.x - cp1.x);
};

const intersection = (cp1: Vec2, cp2: Vec2, s: Vec2, e: Vec2): Vec2 => {
    const dc = {
        x: cp1.x - cp2.x,
        y: cp1.y - cp2.y
    }

    const dp = {
        x: s.x - e.x,
        y: s.y - e.y
    }

    const n1 = cp1.x * cp2.y - cp1.y * cp2.x;
    const n2 = s.x * e.y - s.y * e.x;
    const n3 = 1.0 / (dc.x * dp.y - dc.y * dp.x);

    return new Vec2(
        (n1 * dp.x - n2 * dc.x) * n3,
        (n1 * dp.y - n2 * dc.y) * n3
    );
};

function polygonArea(vertices: Vec2[]): number {
    const numVertices = vertices.length;

    if (numVertices < 3)
        return 0;

    let area = 0;

    for (let i = 0; i < numVertices; i++) {
        const currentVertex = vertices[i];
        const nextVertex = vertices[(i + 1) % numVertices]; // Wrap around to the first vertex

        area += (currentVertex.x * nextVertex.y) - (currentVertex.y * nextVertex.x);
    }

    area = Math.abs(area) / 2;

    return area;
}

/** Clips two convex polygons agains eachother */
export const SutherlandHodgmanClipping = (subjectPolygon: Array<Vec2>,
    clipPolygon: Array<Vec2>): Array<Vec2> => {

    const subjectArea = polygonArea(subjectPolygon);
    const clipArea = polygonArea(clipPolygon);

    /* Swap if clipping polygon exceeds subject size */
    if (clipArea > subjectArea) {
        const temp = subjectPolygon;
        subjectPolygon = clipPolygon;
        clipPolygon = temp;
    }

    let cp1: Vec2 = clipPolygon[clipPolygon.length - 1];
    let cp2: Vec2;
    let s: Vec2;
    let e: Vec2;

    let outputList: Array<Vec2> = subjectPolygon;

    for (const j in clipPolygon) {
        cp2 = clipPolygon[j];
        let inputList = outputList;
        outputList = [];
        s = inputList[inputList.length - 1];

        for (const i in inputList) {
            e = inputList[i];

            if (inside(cp1, cp2, e)) {
                if (!inside(cp1, cp2, s)) {
                    outputList.push(intersection(cp1, cp2, s, e));
                }
                outputList.push(e);
            }

            else if (inside(cp1, cp2, s)) {
                outputList.push(intersection(cp1, cp2, s, e));
            }

            s = e;
        }

        cp1 = cp2;
    }
    return outputList
}
