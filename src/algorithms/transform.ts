import { Edge, Point } from "../types/geometry";

export function transformPoints(points: Point[]): Point[] {
    return points.map((p) => transformPoint(p));
}

export function transformEdges(edges: Edge[]): Edge[] {
    return edges.map((e) => transformEdge(e));
}

export function transformPoint(p: Point): Point {
    return {x: p.x, y: -p.y}
}

export function transformEdge(e: Edge): Edge {
    return {from: transformPoint(e.from), to: transformPoint(e.to)}
}
