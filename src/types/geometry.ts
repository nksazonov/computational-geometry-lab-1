export interface Point {
    x: number;
    y: number;
}

export interface Vertex {
    point: Point,
    key: string
}

export type Chain = Edge[];

export interface Segment {
    from: Point;
    to: Point;
}

export interface Edge extends Segment {
    value: number;
}
