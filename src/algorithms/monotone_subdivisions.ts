import IGraph from "../types/graph";
// @ts-ignore
import Graph from "graph.js";
import { Point, Edge, Vertex, Chain } from "../types/geometry";
import { distanceToSegment, distanceToPoint, isBetweenSegmentEnds, isBetweenSegments, isLeftSegment, leftMostPoint } from "./point-locations";

export const locatePoint = (p: Point, points: Point[], edges: Edge[]): Chain[] => {
    let graph: IGraph = new Graph();
    const sortedVertices = pointsToVertices(sortPointsByY(points));
    graph = addVertices(graph, sortedVertices);
    graph = addEdges(graph, edges);
    
    if (!isRegular(graph, sortedVertices)) {
        console.log('Not regular');
        
        graph = regularize(graph, sortedVertices);
    }
    
    balanceGraph(graph, sortedVertices);

    // let changedEdges = [];
    
    // // @ts-ignore
    // for (let [from, to, value] of graph.edges()) {
    //     changedEdges.push({from: pointFromKey(from), to: pointFromKey(to), value})
    // }
    
    // return changedEdges;

    const chains = locateChains(graph, sortedVertices);
    return chains;
    /*
    return locatePointBetweenChains(p, chains);
    */
}

export const pointKey = (p: Point) => `${p.x}_${p.y}`;

const pointFromKey = (key: string): Point => {
    const [x, y] = key.split('_').map(s => Number(s));
    return {x, y};
}
export const edgeKey = (e: Edge) => `${pointKey(e.from)}-${pointKey(e.to)}`

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
        if (p.y < vertex.point.y ^ upHalfPlane && isBetweenSegments(nearestLeftEdge, nearestRightEdge, p)) {
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
        if (!isBetweenSegmentEnds({from, to}, vertex.point)) {
            continue;
        }

        if (isLeftSegment({from, to}, vertex.point)) {
            if (distanceToSegment(vertex.point, {from, to}) < nearestLeftDistance) {
                nearestLeftDistance = distanceToSegment(vertex.point, {from, to});
                nearestLeftEdge = {from, to, value: graph.edgeValue(from, to)};
            }
        } else {
            if (distanceToSegment(vertex.point, {from, to}) < nearestRightDistance) {
                nearestRightDistance = distanceToSegment(vertex.point, {from, to});
                nearestRightEdge = {from, to, value: graph.edgeValue(from, to)};
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
    for (let i = 1; i < sortedVertices.length - 1; i++) {
            if (inWeight(graph, sortedVertices[i]) > outWeight(graph, sortedVertices[i])) {
            const leftPoint = leftMostPoint(outPoints(graph, sortedVertices[i]));
            const newEdgeValue = 1 + inWeight(graph, sortedVertices[i]) - outWeight(graph, sortedVertices[i]);
            graph.setEdge(sortedVertices[i].key, pointKey(leftPoint), newEdgeValue);
        }
    }

    return graph;
}

const balanceUpDown = (graph: IGraph, sortedVertices: Vertex[]): IGraph => {
    for (let i = sortedVertices.length - 2; i > 0; i--) {
        if (inWeight(graph, sortedVertices[i]) < outWeight(graph, sortedVertices[i])) {
            const leftPoint = leftMostPoint(inPoints(graph, sortedVertices[i]));
            const newEdgeValue = 1 + outWeight(graph, sortedVertices[i]) - inWeight(graph, sortedVertices[i]);
            graph.setEdge(pointKey(leftPoint), sortedVertices[i].key, newEdgeValue);
        }
    }

    return graph;
}

const inWeight = (graph: IGraph, to: Vertex): number => {
    let inW = 0;

    // @ts-ignore
    for (let [,, eValue] of graph.verticesTo(to.key)) {
        inW += eValue;
    }

    return inW;
}

const outWeight = (graph: IGraph, from: Vertex): number => {
    let outW = 0;

    // @ts-ignore
    for (let [,, eValue] of graph.verticesFrom(from.key)) {
        outW += eValue;
    }

    return outW;
}

const outPoints = (graph: IGraph, v: Vertex): Point[] => {
    let points: Point[] = [];

    // @ts-ignore
    for (let [to] of graph.verticesFrom(v.key)) {
        points.push(pointFromKey(to));
    }

    return points;
}

const inPoints = (graph: IGraph, v: Vertex): Point[] => {
    let points: Point[] = [];

    // @ts-ignore
    for (let [to] of graph.verticesTo(v.key)) {
        points.push(pointFromKey(to));
    }

    return points;
}

const locateChains = (graph: IGraph, sortedVertices: Vertex[]): Chain[] => {
    let chains: Chain[] = [];
    
    while (outPoints(graph, sortedVertices[0]).length !== 0) {
        let prevV: Vertex | null = null;
        let currV: Vertex = sortedVertices[0];
        const chain: Chain = [];

        while (currV.key !== sortedVertices[sortedVertices.length - 1].key) {
            prevV = currV;
            let currP = leftMostPoint(outPoints(graph, currV));
            currV = {point: currP, key: pointKey(currP)};

            chain.push({from: prevV.point, to: currV.point, value: 1})

            graph = decreaseWeight(graph, prevV, currV);
        }

        if (chains.length > 0 && chainsEqual(chain, chains[chains.length - 1])) {
            continue;
        }
        
        chains.push(chain);
    }

    // TODO: remove duplicate chains
    return chains;
}

const decreaseWeight = (graph: IGraph, from: Vertex, to: Vertex): IGraph => {
    let val = graph.edgeValue(from.key, to.key);
    if (val > 1) {
        graph.setEdge(from.key, to.key, val - 1);
    } else {
        graph.removeEdge(from.key, to.key);
    }

    return graph;
}

const chainsEqual = (c1: Chain, c2: Chain): boolean => {
    if (c1.length !== c2.length) {
        return false;
    } else {
        for (let i = 0; i < c1.length; i++) {
            if (edgeKey(c1[i]) !== edgeKey(c2[i])) {
                return false;
            }
        }

        return true;
    }
}
