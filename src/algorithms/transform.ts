import {IData, IStageDimensions} from "../types/data";
import { Chain, Edge, Point } from "../types/geometry";

export function transformPoints(points: Point[]): Point[] {
    return points.map((p) => transformPoint(p));
}

export function transformEdges(edges: Edge[]): Edge[] {
    return edges.map((e) => transformEdge(e));
}

export function transformChains(chains: Chain[]): Chain[] {
    return chains.map((c) => transformEdges(c));
}

export function transformPoint(p: Point): Point {
    return {x: p.x, y: -p.y}
}

export function transformEdge(e: Edge): Edge {
    return {from: transformPoint(e.from), to: transformPoint(e.to), value: e.value}
}

export function resizeData(data: IData, stage: IStageDimensions): IData {
    const multiplier = stage.width / data.screen.width;
    return {screen: stage, points: resizePoints(data.points, multiplier), edges: resizeEdges(data.edges, multiplier)};
}

function resizePoints(points: Point[], multiplier: number): Point[] {
    for (let i = 0; i < points.length; i++) {
        points[i] = resizePoint(points[i], multiplier);
    }

    return points;
}

function resizePoint(p: Point, multiplier: number): Point {
    return {x: p.x * multiplier, y: p.y * multiplier};
}

function resizeEdges(edges: Edge[], multiplier: number): Edge[] {
    for (let i = 0; i < edges.length; i++) {
        edges[i] = resizeEdge(edges[i], multiplier);
    }

    return edges;
}

function resizeEdge(e: Edge, multiplier: number): Edge {
    return {from: resizePoint(e.from, multiplier), to: resizePoint(e.to, multiplier), value: e.value}
}
