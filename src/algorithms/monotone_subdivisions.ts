import IGraph from "../types/graph";
// @ts-ignore
import Graph from "graph.js";
import { Point, Edge } from "../types/geometry";
import { distanceToEdge, distanceToPoint, isBetweenEdgeEnds, isBetweenEdges, isLeftEdge, leftMostPoint } from "./point-locations";

interface Vertex {
    point: Point,
    key: string
}

export const locatePoint = (p: Point, points: Point[], edges: Edge[]): Edge[] => {
    let graph: IGraph = new Graph();
    const sortedVertices = pointsToVertices(sortPointsByY(points));
    graph = addVertices(graph, sortedVertices);
    // TODO: if edge.from is higher than edge.to - rotate
    graph = addEdges(graph, edges);
    
    if (!isRegular(graph, sortedVertices)) {
        console.log('Not regular');
        
        graph = regularize(graph, sortedVertices);
    }
    
    balanceGraph(graph, sortedVertices);

    let changedEdges = [];
    
    // @ts-ignore
    for (let [from, to, value] of graph.edges()) {
        console.log(`edge: (${from}) - (${to}), ${value}`);
        
        changedEdges.push({from: pointFromKey(from), to: pointFromKey(to)})
    }
    
    return changedEdges;

    /*
    const chains = locateChains(graph);
    return locatePointBetweenChains(p, chains);
    */
}

export const pointKey = (p: Point) => `${p.x}_${p.y}`;

const pointFromKey = (key: string): Point => {
    const [x, y] = key.split('_').map(s => Number(s));
    return {x, y};
}

const sortPointsByY = (points: Point[]): Point[] => points.sort((a, b) => a.y !== b.y ? a.y - b.y : a.x - b.x);

const pointsToVertices = (points: Point[]): Vertex[] => points.map(p => ({point: p, key: pointKey(p)}));

const addVertices = (graph: IGraph, vertices: Vertex[]): IGraph => {
    vertices.forEach(v => graph.addVertex(v.key, v.point));
    return graph;
}

const addEdges = (graph: IGraph, edges: Edge[]): IGraph => {
    edges.forEach(e => {
        const [from, to] = sortPointsByY([e.from, e.to]);
        graph.addEdge(pointKey(from), pointKey(to), 1);
    });
    return graph;
}

const isRegular = (graph: IGraph, sortedVertices: Vertex[]): boolean => {
    if (hasNoEdges(sortedVertices[0], graph) || hasNoEdges(sortedVertices.slice(-1)[0], graph)) {
        return false;
    }

    // iterate through 2nd to N-1 verticies
    for (let i = 1; i < graph.vertexCount() - 1; i++) {
        if (graph.inDegree(sortedVertices[i].key) === 0 ||
            graph.outDegree(sortedVertices[i].key) === 0) {
            return false;
        }
    }
    
    return true;
}

const hasNoEdges = (v: Vertex, graph: IGraph): boolean => {
    return graph.inDegree(v.key) === 0 && graph.outDegree(v.key) === 0;
}

const regularize = (graph: IGraph, sortedVertices: Vertex[]): IGraph => {

    // \/ Top - Bottom \/
    for (let i = sortedVertices.length - 2; i >= 0; i--) {
        console.log('checking \\/', sortedVertices[i].key);
        
        if (graph.outDegree(sortedVertices[i].key) === 0) {
            console.log(nearestUpHalfPlaneVertex(graph, sortedVertices[i]));
            
            graph.addEdge(sortedVertices[i].key, nearestUpHalfPlaneVertex(graph, sortedVertices[i]).key, 1);
        }
    }
    
    // /\ Bottom - Top /\
    for (let i = 1; i < sortedVertices.length; i++) {
        console.log('checking /\\', sortedVertices[i].key);
        if (graph.inDegree(sortedVertices[i].key) === 0) {
            console.log(nearestDownHalfPlaneVertex(graph, sortedVertices[i]));
            graph.addEdge(nearestDownHalfPlaneVertex(graph, sortedVertices[i]).key, sortedVertices[i].key, 1);
        }
    }

    return graph;
}

const nearestUpHalfPlaneVertex = (graph: IGraph, vertex: Vertex): Vertex => {
    return _nearestHalfPlaneVertex(graph, vertex, true);
}

const nearestDownHalfPlaneVertex = (graph: IGraph, vertex: Vertex): Vertex => {
    return _nearestHalfPlaneVertex(graph, vertex, false);
}

const _nearestHalfPlaneVertex = (graph: IGraph, vertex: Vertex, upHalfPlane: boolean): Vertex => {
    const {nearestLeftEdge, nearestRightEdge} = nearestEdges(graph, vertex);

    let nearestVertex = null;
    let nearestDistance = Infinity;

    // @ts-ignore
    for (let [key, p] of graph.vertices()) {
        if (p === vertex.point) {
            continue;
        }

        // wanted point is left of our
        // if (vertex.point.x > p.x) {
        //     continue;
        // }

        // @ts-ignore
        if (p.y < vertex.point.y ^ upHalfPlane && isBetweenEdges(nearestLeftEdge, nearestRightEdge, p)) {
            if (distanceToPoint(p, vertex.point) < nearestDistance) {
                nearestDistance = distanceToPoint(p, vertex.point);
                nearestVertex = {point: p, key};
            }
        }
    }

    return nearestVertex!;
}

interface INearestEdges {
    nearestLeftEdge: Edge | null,
    nearestRightEdge: Edge | null
}

const nearestEdges = (graph: IGraph, vertex: Vertex): INearestEdges => {
    let nearestLeftEdge = null;
    let nearestLeftDistance = Infinity;

    let nearestRightEdge = null;
    let nearestRightDistance = Infinity;

    // @ts-ignore
    for (let [from, to] of graph.edges()) {
        if (!isBetweenEdgeEnds({from, to}, vertex.point)) {
            continue;
        }

        if (isLeftEdge({from, to}, vertex.point)) {
            if (distanceToEdge(vertex.point, {from, to}) < nearestLeftDistance) {
                nearestLeftDistance = distanceToEdge(vertex.point, {from, to});
                nearestLeftEdge = {from, to};
            }
        } else {
            if (distanceToEdge(vertex.point, {from, to}) < nearestRightDistance) {
                nearestRightDistance = distanceToEdge(vertex.point, {from, to});
                nearestRightEdge = {from, to};
            }
        }
    }

    return {nearestLeftEdge, nearestRightEdge};
}

const balanceGraph = (graph: IGraph, sortedVertices: Vertex[]): IGraph => {
    graph = balanceDownUp(graph, sortedVertices);
    graph = balanceUpDown(graph, sortedVertices);
    return graph;
}

const balanceDownUp = (graph: IGraph, sortedVertices: Vertex[]): IGraph => {
    for (let i = 1; i < sortedVertices.length - 2; i++) {
        if (graph.inDegree(sortedVertices[i].key) > graph.outDegree(sortedVertices[i].key)) {
            const leftPoint = leftMostPoint(toPoints(graph, sortedVertices[i]));
            const newEdgeValue = 1 + graph.inDegree(sortedVertices[i].key) - graph.outDegree(sortedVertices[i].key);
            graph.setEdge(sortedVertices[i].key, pointKey(leftPoint), newEdgeValue);
        }
    }

    return graph;
}

const balanceUpDown = (graph: IGraph, sortedVertices: Vertex[]): IGraph => {
    for (let i = sortedVertices.length - 2; i > 0; i--) {
        if (graph.inDegree(sortedVertices[i].key) < graph.outDegree(sortedVertices[i].key)) {
            const leftPoint = leftMostPoint(fromPoints(graph, sortedVertices[i]));
            const newEdgeValue = 1 + graph.outDegree(sortedVertices[i].key) - graph.inDegree(sortedVertices[i].key);
            graph.setEdge(pointKey(leftPoint), sortedVertices[i].key, newEdgeValue);
        }
    }

    return graph;
}

const toPoints = (graph: IGraph, v: Vertex): Point[] => {
    let points: Point[] = [];

    // @ts-ignore
    for (let [to] of graph.verticesFrom(v.key)) {
        points.push(pointFromKey(to));
    }

    return points;
}

const fromPoints = (graph: IGraph, v: Vertex): Point[] => {
    let points: Point[] = [];

    // @ts-ignore
    for (let [to] of graph.verticesTo(v.key)) {
        points.push(pointFromKey(to));
    }

    return points;
}
