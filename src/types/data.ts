import { Point, Edge } from "./geometry";

export interface IData {
    points: Point[];
    edges: Edge[];
    screen: IStageDimensions;
}

export interface IStageDimensions {
    width: number;
    height: number;
}
