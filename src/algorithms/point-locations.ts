import {Point, Segment} from '../types/geometry';
import { edgeKey, pointKey } from './monotone_subdivisions';

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

export function segmentsContain(seg: Segment, segments: Segment[]): boolean {
    for (const s of segments) {
        if (edgeKey(s) === edgeKey(seg)) {
            return true;
        }
    }

    return false;
}

export function nearestSegment(point: Point, Segments: Segment[], epsilon: number): Segment | null {
    let nearestDistance = Infinity;
    let nearestSegment = null;
    
    Segments.forEach(e => {
        if (isBetweenSegmentEndsX(e, point)) {
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

export function isLeftSegment(s: Segment, p: Point): boolean {
    /*
        delimiter ... is + when p1-p2-p3 is left turn, and - when p1-p2-p3 is right turn
        | x1 y1 1 |
        | x2 y2 1 |
        | x3 y3 1 |

        p1 - Segment.to
        p2 - Segment.from
        p3 - point
    */
    if (s.from.x === s.to.x && s.from.x === p.x) {
        return s.from.x <= p.x && s.to.x <= p.x;
    }

    return (s.to.x * s.from.y * 1 + s.to.y * 1 * p.x + 1 * s.from.x * p.y -
        1 * s.from.y * p.x - s.to.y * s.from.x * 1 - s.to.x * 1 * p.y) > 0;
}

export function isRightSegment(e: Segment, p: Point): boolean {
    return !isLeftSegment(e, p);
}

export function isBetweenSegmentEndsX(e: Segment, p: Point): boolean {
    const [from, to] = e.from.x < e.to.x ? [e.from, e.to] : [e.to, e.from];
    return from.x <= p.x && p.x <= to.x;
}

export function isBetweenSegmentEndsY(s: Segment, p: Point): boolean {
    const [from, to] = s.from.y < s.to.y ? [s.from, s.to] : [s.to, s.from];
    return from.y <= p.y && p.y <= to.y;
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

export function leftMostPoint(points: Point[], relP: Point): Point {
    let maxCos = 0;
    let minCos = Infinity;
    let leftPoint = points[0];
    let hasLeftPoints = false;

    for (const p of points) {
        if (p.x < relP.x) {
            hasLeftPoints = true;
            const projDist = relP.x - p.x;
            const cos = projDist / distanceToPoint(p, relP);

            if (maxCos < cos) {
                maxCos = cos;
                leftPoint = p;
            }
        } else {
            if (hasLeftPoints) {
                continue;
            }

            const projDist = p.x - relP.x;
            const cos = projDist / distanceToPoint(p, relP);

            if (cos < minCos) {
                minCos = cos;
                leftPoint = p;
            }
        }
    }

    return leftPoint;

    // return points.sort((p1, p2) => {
    //     return p1.x === p2.x ? p1.y - p2.y : p1.x - p2.x
    // })[0];
}

export function hasAdjacentSegment(p: Point, segments: Segment[]): boolean {
    for (const s of segments) {
        if (pointKey(s.from) === pointKey(p) || pointKey(s.to) === pointKey(p)) {
            return true;
        }
    }

    return false;
}
