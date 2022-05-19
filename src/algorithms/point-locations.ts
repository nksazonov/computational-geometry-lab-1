import {Point, Edge} from '../types/geometry';

export function nearestPoint(point: Point, points: Point[], epsilon: number): Point | null {
    let nearestDistance = Infinity;
    let nearestPoint = null;

    points.forEach(p => {
        const distance = distanceToPoint(point, p);
        if (distance < epsilon && distance < nearestDistance) {
            nearestDistance = distance;
            nearestPoint = p;
        }
    });

    return nearestPoint;
}

export function nearestEdge(point: Point, edges: Edge[], epsilon: number): Edge | null {
    let nearestDistance = Infinity;
    let nearestEdge = null;
    
    edges.forEach(e => {
        if (isBetweenEdgeEnds(e, point)) {
            const distance = distanceToEdge(point, e);
            if (distance < epsilon && distance < nearestDistance) {
                nearestDistance = distance;
                nearestEdge = e;
            }
        }
    });

    return nearestEdge;
}

export function distanceToEdge(p: Point, e: Edge): number {
    return Math.abs((e.to.x - e.from.x)*(e.from.y - p.y) - (e.from.x - p.x)*(e.to.y - e.from.y)) /
    Math.sqrt((e.to.x - e.from.x)**2 + (e.to.y - e.from.y)**2);
}

export function distanceToPoint(p1: Point, p2: Point): number {
    return Math.sqrt((p1.x - p2.x)**2 + (p1.y - p2.y)**2);
}

export function isAboveOrRight(point: Point, p1: Point): boolean {
    if (point.y > p1.y) {
        return false;
    }

    return point.y < p1.y ? true : point.x < p1.x;
}

export function isLeftEdge(e: Edge, p: Point): boolean {
    /*
        delimiter ... is + when p1-p2-p3 is left turn, and - when p1-p2-p3 is right turn
        | x1 y1 1 |
        | x2 y2 1 |
        | x3 y3 1 |

        p1 - edge.to
        p2 - edge.from
        p3 - point
    */
    return (e.to.x * e.from.y * 1 + e.to.y * 1 * p.x + 1 * e.from.x * p.y -
        1 * e.from.y * p.x - e.to.y * e.from.x * 1 - e.to.x * 1 * p.y) > 0;
}

export function isRightEdge(e: Edge, p: Point): boolean {
    return !isLeftEdge(e, p);
}

export function isBetweenEdgeEnds(e: Edge, p: Point): boolean {
    const [from, to] = e.from.x < e.to.x ? [e.from, e.to] : [e.to, e.from];
    return from.x <= p.x && p.x <= to.x;
}

export function isBetweenEdges(le: Edge | null, re: Edge | null, p: Point): boolean {
    if (!le && !re) {
        return true;
    } else if (!le) {
        return isRightEdge(re!, p);
    } else if (!re) {
        return isLeftEdge(le, p);
    } else {
        return isLeftEdge(le, p) && isRightEdge(re, p);
    }
}

export function leftMostPoint(points: Point[]): Point {
    return points.sort((p1, p2) => p1.x === p2.x ? p1.y - p2.y : p1.x - p2.x)[0];
}
