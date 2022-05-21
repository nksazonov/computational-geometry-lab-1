import React from 'react';
import { Group, Line, Text } from 'react-konva';
import { pointKey } from '../algorithms/monotone_subdivisions';
import config, { colorsConfig } from '../config';
import { Edge, Segment } from '../types/geometry';

interface IProps {
    edges: Edge[],
    selectedEdge: Segment | null,
    edgeColor?: string,
    selectedEdgeColor?: string,
    lineScribeColor?: string,
    selectedLineScribeColor?: string,
    lineWidth?: number,
}

function Edges({
    edges,
    selectedEdge,
    edgeColor,
    selectedEdgeColor,
    lineScribeColor,
    selectedLineScribeColor,
    lineWidth
}: IProps) {
    edgeColor = edgeColor ?? colorsConfig.edge;
    selectedEdgeColor = selectedEdgeColor ?? colorsConfig.selectedEdge;
    lineScribeColor = lineScribeColor ?? colorsConfig.lineScribe;
    selectedLineScribeColor = selectedLineScribeColor ?? colorsConfig.selectedLineScribe;
    lineWidth = lineWidth ?? config.lineWidth;
    
    return (
        <Group>
            {
              edges.map((e) => <Line
                points={[e.from.x, e.from.y, e.to.x, e.to.y]}
                strokeWidth={lineWidth}
                stroke={e === selectedEdge ? selectedEdgeColor : edgeColor}
                lineCap="round"
                lineJoin="round"
                key={`link-${pointKey(e.from)}-${pointKey(e.to)}`}
               />)
            }
            {
               edges.map((e) => <Text
                text={e.value.toString()}
                fontSize={15}
                stroke={e === selectedEdge ? selectedLineScribeColor : lineScribeColor}
                x={(e.from.x + e.to.x) / 2 + config.lineScribeShift}
                y={(e.from.y + e.to.y) / 2 + config.lineScribeShift}
                key={`scribe-${pointKey(e.from)}-${pointKey(e.to)}`}
                />)
            }
          </Group>
    );
}

export default Edges;
