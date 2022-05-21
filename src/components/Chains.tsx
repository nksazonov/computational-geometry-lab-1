import React from 'react';
import { Group } from 'react-konva';
import config, { colorsConfig } from '../config';
import { Chain, Segment } from '../types/geometry';
import Edges from './Edges';

interface IProps {
    selectedEdge: Segment | null,
    chains: Chain[]
}

function Chains({chains, selectedEdge}: IProps) {
    return (
        <Group>
            {
                chains.map((c, idx) => <Edges
                    edges={c}
                    selectedEdge={selectedEdge}
                    edgeColor={colorsConfig.chainColors[idx % colorsConfig.chainColors.length]}
                    lineWidth={config.basicLineWidth + (chains.length - idx) * config.lineWidthShift}
                    showScribes={false}
                    key={`chain_${idx}`}
                />)
            }
        </Group>
    );
}

export default Chains;
