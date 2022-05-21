import {Point, Segment} from '../types/geometry';

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

export function nearestSegment(point: Point, Segments: Segment[], epsilon: number): Segment | null {
    let nearestDistance = Infinity;
    let nearestSegment = null;
    
    Segments.forEach(e => {
        if (isBetweenSegmentEnds(e, point)) {
            const distance = distanceToSegment(point, e);
            if (distance < epsilon && distance < nearestDistance) {
                nearestDistance = distance;
                nearestSegment = e;
            }
        }
    });

    return nearestSegment;
}

export function distanceToSegment(p: Point, e: Segment): number {
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

export function isLeftSegment(e: Segment, p: Point): boolean {
    /*
        delimiter ... is + when p1-p2-p3 is left turn, and - when p1-p2-p3 is right turn
        | x1 y1 1 |
        | x2 y2 1 |
        | x3 y3 1 |

        p1 - Segment.to
        p2 - Segment.from
        p3 - point
    */
    return (e.to.x * e.from.y * 1 + e.to.y * 1 * p.x + 1 * e.from.x * p.y -
        1 * e.from.y * p.x - e.to.y * e.from.x * 1 - e.to.x * 1 * p.y) > 0;
}

export function isRightSegment(e: Segment, p: Point): boolean {
    return !isLeftSegment(e, p);
}

export function isBetweenSegmentEnds(e: Segment, p: Point): boolean {
    const [from, to] = e.from.x < e.to.x ? [e.from, e.to] : [e.to, e.from];
    return from.x <= p.x && p.x <= to.x;
}

export function isBetweenSegments(le: Segment | null, re: Segment | null, p: Point): boolean {
    if (!le && !re) {
        return true;
    } else if (!le) {
        return isRightSegment(re!, p);
    } else if (!re) {
        return isLeftSegment(le, p);
    } else {
        return isLeftSegment(le, p) && isRightSegment(re, p);
    }
}

export function leftMostPoint(points: Point[]): Point {
    return points.sort((p1, p2) => p1.x === p2.x ? p1.y - p2.y : p1.x - p2.x)[0];
}
