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
    const widthRatio = stage.width / data.screen.width;
    const heightRatio = stage.height / data.screen.height;

    const multiplier = widthRatio < heightRatio ? widthRatio : heightRatio;
    return {screen: stage, points: resizePoints(data.points, multiplier), edges: resizeEdges(data.edges, multiplier)};
}

function resizePoints(points: Point[], multiplier: number): Point[] {
    return points.map((p) => resizePoint(p, multiplier));
}

function resizePoint(p: Point, multiplier: number): Point {
    return {x: p.x * multiplier, y: p.y * multiplier};
}

function resizeEdges(edges: Edge[], multiplier: number): Edge[] {
    return edges.map((e) => resizeEdge(e, multiplier));
}

function resizeEdge(e: Edge, multiplier: number): Edge {
    return {from: resizePoint(e.from, multiplier), to: resizePoint(e.to, multiplier), value: e.value}
}
