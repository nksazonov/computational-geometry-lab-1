import React from 'react';
import { Circle, Group } from 'react-konva';
import { pointKey } from '../algorithms/monotone_subdivisions';
import config, { colorsConfig } from '../config';
import { Point } from '../types/geometry';

interface IProps {
    points: Point[],
    selectedPoint: Point | null
}

function Points({points, selectedPoint}: IProps) {
    return (
        <Group>
            {
              points.map(p => <Circle
                x={p.x}
                y={p.y}
                radius={config.pointRadius}
                fill={p === selectedPoint ? colorsConfig.selectedPoint : colorsConfig.point}
                key={`point-${pointKey(p)}`}
              />)
            }
          </Group>
    );
}

export default Points;
