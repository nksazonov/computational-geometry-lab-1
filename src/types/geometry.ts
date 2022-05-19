export interface Point {
    x: number;
    y: number;
}

export interface Vertex extends Point {};

export interface Edge {
    from: Vertex;
    to: Vertex;
}
